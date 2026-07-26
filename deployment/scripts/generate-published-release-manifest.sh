#!/bin/sh
set -eu

metadata_dir=${1:?Usage: generate-published-release-manifest.sh METADATA_DIR OUTPUT COMMIT_SHA RELEASE_TAG RUN_URL}
output_path=${2:?Usage: generate-published-release-manifest.sh METADATA_DIR OUTPUT COMMIT_SHA RELEASE_TAG RUN_URL}
commit_sha=${3:?Usage: generate-published-release-manifest.sh METADATA_DIR OUTPUT COMMIT_SHA RELEASE_TAG RUN_URL}
release_tag=${4-}
run_url=${5:?Usage: generate-published-release-manifest.sh METADATA_DIR OUTPUT COMMIT_SHA RELEASE_TAG RUN_URL}

if ! printf '%s\n' "$commit_sha" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "Commit SHA must be exactly 40 lowercase hexadecimal characters" >&2
  exit 1
fi
if [ -n "$release_tag" ] && ! printf '%s\n' "$release_tag" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+(-rc\.[0-9]+)?$'; then
  echo "Release tag is invalid" >&2
  exit 1
fi
case "$run_url" in
  https://github.com/ZxZxZ143/vympel/actions/runs/*) ;;
  *) echo "Release run URL is invalid" >&2; exit 1 ;;
esac

read_digest() {
  image=$1
  path=$metadata_dir/$image.json
  [ -f "$path" ] || {
    echo "Missing published metadata for $image" >&2
    exit 1
  }
  digest=$(jq -er \
    --arg commit "$commit_sha" \
    --arg repository "ghcr.io/zxzxz143/$image" \
    'select(
      .pushed == true and
      .commit == $commit and
      .tag == $commit and
      .repository == $repository
    ) | .digest' "$path")
  if ! printf '%s\n' "$digest" | grep -Eq '^sha256:[0-9a-f]{64}$'; then
    echo "Invalid published digest for $image" >&2
    exit 1
  fi
  printf '%s\n' "$digest"
}

backend_digest=$(read_digest vympel-backend)
storefront_digest=$(read_digest vympel-storefront)
crm_digest=$(read_digest vympel-crm)
generated_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
git_tag_value=null
if [ -n "$release_tag" ]; then
  git_tag_value="\"$release_tag\""
fi

mkdir -p "$(dirname "$output_path")"
cat > "$output_path" <<EOF
apiVersion: deployment.vympel.dev/v1
kind: PublishedReleaseManifest
commit_sha: "$commit_sha"
git_tag: $git_tag_value
generated_at: "$generated_at"
images:
  backend:
    repository: ghcr.io/zxzxz143/vympel-backend
    tag: "$commit_sha"
    digest: "$backend_digest"
  storefront:
    repository: ghcr.io/zxzxz143/vympel-storefront
    tag: "$commit_sha"
    digest: "$storefront_digest"
  crm:
    repository: ghcr.io/zxzxz143/vympel-crm
    tag: "$commit_sha"
    digest: "$crm_digest"
verification:
  workflow_run: "$run_url"
  registry_pull: passed
  isolated_runtime: passed
  deployment_performed: false
EOF

if grep -Eq 'PENDING|0000000000000000000000000000000000000000' "$output_path"; then
  echo "Published release manifest contains an unresolved value" >&2
  exit 1
fi
