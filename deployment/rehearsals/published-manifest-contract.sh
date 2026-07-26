#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repository_root=$(CDPATH= cd -- "$script_dir/../.." && pwd)
temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT HUP INT TERM

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
        storefrontApiBase: "https://api.oracle-staging.example.invalid/api/public",
        crmApiBase: "https://api.oracle-staging.example.invalid/api/crm",
        mediaOrigins: "https://api.oracle-staging.example.invalid",
        storefrontSiteUrl: "https://shop.oracle-staging.example.invalid",
        deploymentEnvironment: "staging",
        release: $commit,
        placeholderAcknowledged: true
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
grep -q 'placeholder_acknowledged: true' "$output_path"
grep -q 'expected_latest_change: 2026-07-19-02-update-public-image-paths-to-webp' "$output_path"
grep -q 'linux_arm64_runtime: passed' "$output_path"
if grep -Eq 'PENDING|0000000000000000000000000000000000000000' "$output_path"; then
  echo "Synthetic published manifest retained an unresolved value" >&2
  exit 1
fi

echo "Published multi-architecture manifest contract passed."
