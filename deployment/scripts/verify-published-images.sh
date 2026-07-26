#!/bin/sh
set -eu

metadata_dir=${1:?Usage: verify-published-images.sh METADATA_DIR COMMIT_SHA}
commit_sha=${2:?Usage: verify-published-images.sh METADATA_DIR COMMIT_SHA}
registry_namespace=ghcr.io/zxzxz143
source_url=https://github.com/ZxZxZ143/vympel

if ! printf '%s\n' "$commit_sha" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "Commit SHA must be exactly 40 lowercase hexadecimal characters" >&2
  exit 1
fi

for image in vympel-backend vympel-storefront vympel-crm; do
  metadata_path=$metadata_dir/$image.json
  image_ref=$registry_namespace/$image:$commit_sha
  expected_digest=$(jq -er '.digest' "$metadata_path")

  if ! printf '%s\n' "$expected_digest" | grep -Eq '^sha256:[0-9a-f]{64}$'; then
    echo "Invalid registry digest for $image" >&2
    exit 1
  fi
  if [ "$(jq -r '.pushed' "$metadata_path")" != "true" ] ||
     [ "$(jq -r '.commit' "$metadata_path")" != "$commit_sha" ] ||
     [ "$(jq -r '.tag' "$metadata_path")" != "$commit_sha" ]; then
    echo "Published metadata does not match the expected commit for $image" >&2
    exit 1
  fi

  docker pull "$image_ref"
  actual_digest=$(docker image inspect "$image_ref" --format '{{join .RepoDigests "\n"}}' |
    awk -F@ -v repository="$registry_namespace/$image" '$1 == repository { print $2; exit }')
  if [ "$actual_digest" != "$expected_digest" ]; then
    echo "Pulled digest does not match release metadata for $image" >&2
    exit 1
  fi

  architecture=$(docker image inspect "$image_ref" --format '{{.Architecture}}')
  runtime_user=$(docker image inspect "$image_ref" --format '{{.Config.User}}')
  label_source=$(docker image inspect "$image_ref" --format '{{index .Config.Labels "org.opencontainers.image.source"}}')
  label_revision=$(docker image inspect "$image_ref" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')
  if [ "$architecture" != "amd64" ] ||
     [ -z "$runtime_user" ] ||
     [ "$runtime_user" = "0" ] ||
     [ "$runtime_user" = "root" ] ||
     [ "$label_source" != "$source_url" ] ||
     [ "$label_revision" != "$commit_sha" ]; then
    echo "Image architecture, runtime user, or OCI labels are invalid for $image" >&2
    exit 1
  fi

  if docker image inspect "$image_ref" --format '{{range .Config.Env}}{{println .}}{{end}}' |
    grep -Eiq '(^|_)(SECRET|PASSWORD|TOKEN|PRIVATE_KEY|ACCESS_KEY)(=|_)'; then
    echo "Secret-bearing environment metadata detected in $image" >&2
    exit 1
  fi

  printf '%s %s %s %s\n' "$image_ref" "$expected_digest" "$architecture" "$runtime_user"
done
