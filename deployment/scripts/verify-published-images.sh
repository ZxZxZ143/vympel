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
  expected_amd64_digest=$(jq -er '.platforms["linux/amd64"]' "$metadata_path")
  expected_arm64_digest=$(jq -er '.platforms["linux/arm64"]' "$metadata_path")

  if ! printf '%s\n' "$expected_digest" | grep -Eq '^sha256:[0-9a-f]{64}$'; then
    echo "Invalid registry digest for $image" >&2
    exit 1
  fi
  for platform_digest in "$expected_amd64_digest" "$expected_arm64_digest"; do
    if ! printf '%s\n' "$platform_digest" | grep -Eq '^sha256:[0-9a-f]{64}$'; then
      echo "Invalid child manifest digest for $image" >&2
      exit 1
    fi
  done
  if [ "$(jq -r '.pushed' "$metadata_path")" != "true" ] ||
     [ "$(jq -r '.commit' "$metadata_path")" != "$commit_sha" ] ||
     [ "$(jq -r '.tag' "$metadata_path")" != "$commit_sha" ]; then
    echo "Published metadata does not match the expected commit for $image" >&2
    exit 1
  fi

  actual_index_digest=$(docker buildx imagetools inspect "$image_ref" |
    awk '$1 == "Digest:" { print $2; exit }')
  if [ "$actual_index_digest" != "$expected_digest" ]; then
    echo "Published OCI index digest does not match release metadata for $image" >&2
    exit 1
  fi
  manifest_json=$(docker buildx imagetools inspect "$image_ref" --raw)
  actual_amd64_digest=$(printf '%s\n' "$manifest_json" | jq -er '
    [.manifests[] | select(.platform.os == "linux" and .platform.architecture == "amd64") | .digest]
    | select(length == 1) | .[0]')
  actual_arm64_digest=$(printf '%s\n' "$manifest_json" | jq -er '
    [.manifests[] | select(.platform.os == "linux" and .platform.architecture == "arm64") | .digest]
    | select(length == 1) | .[0]')
  if [ "$actual_amd64_digest" != "$expected_amd64_digest" ] ||
     [ "$actual_arm64_digest" != "$expected_arm64_digest" ]; then
    echo "Published OCI index children do not match release metadata for $image" >&2
    exit 1
  fi

  for architecture in amd64 arm64; do
    child_digest=$(jq -er --arg platform "linux/$architecture" '.platforms[$platform]' "$metadata_path")
    child_ref=$registry_namespace/$image@$child_digest
    docker pull --platform "linux/$architecture" "$child_ref"

    actual_architecture=$(docker image inspect "$child_ref" --format '{{.Architecture}}')
    runtime_user=$(docker image inspect "$child_ref" --format '{{.Config.User}}')
    label_source=$(docker image inspect "$child_ref" --format '{{index .Config.Labels "org.opencontainers.image.source"}}')
    label_revision=$(docker image inspect "$child_ref" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')
    if [ "$actual_architecture" != "$architecture" ] ||
       [ -z "$runtime_user" ] ||
       [ "$runtime_user" = "0" ] ||
       [ "$runtime_user" = "root" ] ||
       [ "$label_source" != "$source_url" ] ||
       [ "$label_revision" != "$commit_sha" ]; then
      echo "Image architecture, runtime user, or OCI labels are invalid for $image on linux/$architecture" >&2
      exit 1
    fi

    if docker image inspect "$child_ref" --format '{{range .Config.Env}}{{println .}}{{end}}' |
      grep -Eiq '(^|_)(SECRET|PASSWORD|TOKEN|PRIVATE_KEY|ACCESS_KEY)(=|_)'; then
      echo "Secret-bearing environment metadata detected in $image on linux/$architecture" >&2
      exit 1
    fi

    printf '%s %s %s %s\n' "$child_ref" "$child_digest" "$actual_architecture" "$runtime_user"
  done
  printf '%s index %s\n' "$image_ref" "$expected_digest"
done
