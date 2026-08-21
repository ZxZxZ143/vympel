#!/bin/sh
set -eu

metadata_dir=${1:?Usage: verify-published-images.sh METADATA_DIR COMMIT_SHA}
commit_sha=${2:?Usage: verify-published-images.sh METADATA_DIR COMMIT_SHA}
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
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

    case "$image" in
      vympel-storefront|vympel-crm)
        scan_container="vympel-bundle-scan-${image#vympel-}-$architecture-$$"
        scan_dir=$(mktemp -d)
        cleanup_bundle_scan() {
          docker rm -f "$scan_container" >/dev/null 2>&1 || true
          rm -rf "$scan_dir"
        }
        trap cleanup_bundle_scan EXIT HUP INT TERM

        docker create \
          --platform "linux/$architecture" \
          --name "$scan_container" \
          "$child_ref" >/dev/null
        docker export "$scan_container" |
          tar -x -C "$scan_dir" app/.next app/server.js

        if ! sh "$script_dir/verify-frontend-bundle-urls.sh" \
          "$scan_dir/app/.next" "$scan_dir/app/server.js"; then
          echo "Frontend bundle URL verification failed for $image on linux/$architecture" >&2
          cleanup_bundle_scan
          trap - EXIT HUP INT TERM
          exit 1
        fi

        if [ "$image" = "vympel-crm" ]; then
          expected_crm_api_base=$(jq -er '.publicBuildConfiguration.crmApiBase' "$metadata_path")
          legacy_crm_api_base=https://api.34.18.200.58.sslip.io/api/crm
          if ! grep -R -a -F -q "$expected_crm_api_base" \
            "$scan_dir/app/.next" "$scan_dir/app/server.js"; then
            echo "CRM bundle does not contain the published NEXT_PUBLIC_CRM_API_BASE on linux/$architecture" >&2
            cleanup_bundle_scan
            trap - EXIT HUP INT TERM
            exit 1
          fi
          if [ "$expected_crm_api_base" != "$legacy_crm_api_base" ] && \
             grep -R -a -F -q "$legacy_crm_api_base" \
               "$scan_dir/app/.next" "$scan_dir/app/server.js"; then
            echo "CRM bundle still contains the superseded sslip.io API origin on linux/$architecture" >&2
            cleanup_bundle_scan
            trap - EXIT HUP INT TERM
            exit 1
          fi
        fi

        cleanup_bundle_scan
        trap - EXIT HUP INT TERM
        ;;
    esac

    printf '%s %s %s %s\n' "$child_ref" "$child_digest" "$actual_architecture" "$runtime_user"
  done
  printf '%s index %s\n' "$image_ref" "$expected_digest"
done
