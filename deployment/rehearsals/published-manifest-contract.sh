#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repository_root=$(CDPATH= cd -- "$script_dir/../.." && pwd)
temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT HUP INT TERM

bundle_url_verifier=$repository_root/deployment/scripts/verify-frontend-bundle-urls.sh
good_bundle=$temp_dir/good-bundle.js
bad_bundle=$temp_dir/bad-bundle.js

printf '%s\n' \
  'https://api.vympel.kz/api/public' \
  'https://x7m2q9k4n6p8.vympel.kz/api/crm' \
  'https://preview.vympel.kz' \
  'http://localhost:${process.env.PORT||3000}' > "$good_bundle"
sh "$bundle_url_verifier" "$good_bundle"

for forbidden_url in \
  https://telemetry.invalid/path \
  http://localhost:8080/api/crm \
  http://127.0.0.1:3000 \
  'http://[::1]:3000'
do
  printf '%s\n' "$forbidden_url" > "$bad_bundle"
  if sh "$bundle_url_verifier" "$bad_bundle" >/dev/null 2>&1; then
    echo "Frontend bundle URL verifier accepted forbidden value: $forbidden_url" >&2
    exit 1
  fi
done

commit_sha=1111111111111111111111111111111111111111
release_tag=v1.0.0-rc.3
index_digest=sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
amd64_digest=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
arm64_digest=sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc

for image in vympel-backend vympel-storefront vympel-crm; do
  jq -n \
    --arg image "$image" \
    --arg repository "ghcr.io/zxzxz143/$image" \
    --arg commit "$commit_sha" \
    --arg releaseTag "$release_tag" \
    --arg digest "$index_digest" \
    --arg amd64Digest "$amd64_digest" \
    --arg arm64Digest "$arm64_digest" \
    '{
      image: $image,
      repository: $repository,
      tag: $commit,
      releaseTag: $releaseTag,
      digest: $digest,
      commit: $commit,
      pushed: true,
      platforms: {
        "linux/amd64": $amd64Digest,
        "linux/arm64": $arm64Digest
      },
      publicBuildConfiguration: {
        strategy: "build-time-release-contract",
        storefrontApiBase: "https://api.vympel.kz/api/public",
        crmApiBase: "https://x7m2q9k4n6p8.vympel.kz/api/crm",
        mediaOrigins: "https://api.vympel.kz",
        storefrontSiteUrl: "https://preview.vympel.kz",
        deploymentEnvironment: "staging",
        release: $commit,
        telemetryEnabled: false,
        siteIndexingEnabled: false,
        placeholderAcknowledged: false
      }
    }' > "$temp_dir/$image.json"
done

output_path=$temp_dir/published-release.yml
sh "$repository_root/deployment/scripts/generate-published-release-manifest.sh" \
  "$temp_dir" \
  "$output_path" \
  "$commit_sha" \
  "$release_tag" \
  https://github.com/ZxZxZ143/vympel/actions/runs/123456

grep -q 'linux/amd64:' "$output_path"
grep -q 'linux/arm64:' "$output_path"
grep -q 'NEXT_PUBLIC_TELEMETRY_ENABLED: false' "$output_path"
grep -q 'SITE_INDEXING_ENABLED: false' "$output_path"
grep -q 'NEXT_PUBLIC_APP_RELEASE: "1111111111111111111111111111111111111111"' "$output_path"
grep -q 'NEXT_PUBLIC_BASE_API_PUBLIC: "https://api.vympel.kz/api/public"' "$output_path"
grep -q 'NEXT_PUBLIC_CRM_API_BASE: "https://x7m2q9k4n6p8.vympel.kz/api/crm"' "$output_path"
grep -q 'placeholder_acknowledged: false' "$output_path"
grep -q 'expected_latest_change: 2026-09-04-01-product-model-variants' "$output_path"
grep -q 'linux_arm64_runtime: passed' "$output_path"
if grep -Eq 'PENDING|0000000000000000000000000000000000000000' "$output_path"; then
  echo "Synthetic published manifest retained an unresolved value" >&2
  exit 1
fi

echo "Published multi-architecture manifest contract passed."
