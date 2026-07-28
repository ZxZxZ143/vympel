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

read_metadata() {
  image=$1
  path=$metadata_dir/$image.json
  [ -f "$path" ] || {
    echo "Missing published metadata for $image" >&2
    exit 1
  }
  jq -er \
    --arg commit "$commit_sha" \
    --arg repository "ghcr.io/zxzxz143/$image" \
    'select(
      .pushed == true and
      .commit == $commit and
      .tag == $commit and
      .repository == $repository and
      (.digest | test("^sha256:[0-9a-f]{64}$")) and
      (.platforms["linux/amd64"] | test("^sha256:[0-9a-f]{64}$")) and
      (.platforms["linux/arm64"] | test("^sha256:[0-9a-f]{64}$"))
    )' "$path"
}

read_digest() {
  image=$1
  path=$metadata_dir/$image.json
  digest=$(read_metadata "$image" | jq -er '.digest')
  if ! printf '%s\n' "$digest" | grep -Eq '^sha256:[0-9a-f]{64}$'; then
    echo "Invalid published digest for $image" >&2
    exit 1
  fi
  printf '%s\n' "$digest"
}

backend_digest=$(read_digest vympel-backend)
storefront_digest=$(read_digest vympel-storefront)
crm_digest=$(read_digest vympel-crm)
backend_amd64_digest=$(read_metadata vympel-backend | jq -er '.platforms["linux/amd64"]')
backend_arm64_digest=$(read_metadata vympel-backend | jq -er '.platforms["linux/arm64"]')
storefront_amd64_digest=$(read_metadata vympel-storefront | jq -er '.platforms["linux/amd64"]')
storefront_arm64_digest=$(read_metadata vympel-storefront | jq -er '.platforms["linux/arm64"]')
crm_amd64_digest=$(read_metadata vympel-crm | jq -er '.platforms["linux/amd64"]')
crm_arm64_digest=$(read_metadata vympel-crm | jq -er '.platforms["linux/arm64"]')
public_config=$(read_metadata vympel-storefront | jq -ec '.publicBuildConfiguration')
crm_public_config=$(read_metadata vympel-crm | jq -ec '.publicBuildConfiguration')
if [ "$public_config" != "$crm_public_config" ]; then
  echo "Frontend images do not carry the same public build configuration contract" >&2
  exit 1
fi
storefront_api_base=$(printf '%s\n' "$public_config" | jq -er '.storefrontApiBase')
crm_api_base=$(printf '%s\n' "$public_config" | jq -er '.crmApiBase')
media_origins=$(printf '%s\n' "$public_config" | jq -er '.mediaOrigins')
storefront_site_url=$(printf '%s\n' "$public_config" | jq -er '.storefrontSiteUrl')
deployment_environment=$(printf '%s\n' "$public_config" | jq -er '.deploymentEnvironment')
telemetry_enabled=$(printf '%s\n' "$public_config" | jq -r '
  if (.telemetryEnabled | type) == "boolean"
  then (.telemetryEnabled | tostring)
  else error("telemetryEnabled must be boolean")
  end')
placeholder_acknowledged=$(printf '%s\n' "$public_config" | jq -r '
  if (.placeholderAcknowledged | type) == "boolean"
  then (.placeholderAcknowledged | tostring)
  else error("placeholderAcknowledged must be boolean")
  end')
case "$telemetry_enabled" in
  true|false) ;;
  *) echo "Published metadata contains an invalid telemetry flag" >&2; exit 1 ;;
esac
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
    platforms:
      linux/amd64: "$backend_amd64_digest"
      linux/arm64: "$backend_arm64_digest"
  storefront:
    repository: ghcr.io/zxzxz143/vympel-storefront
    tag: "$commit_sha"
    digest: "$storefront_digest"
    platforms:
      linux/amd64: "$storefront_amd64_digest"
      linux/arm64: "$storefront_arm64_digest"
  crm:
    repository: ghcr.io/zxzxz143/vympel-crm
    tag: "$commit_sha"
    digest: "$crm_digest"
    platforms:
      linux/amd64: "$crm_amd64_digest"
      linux/arm64: "$crm_arm64_digest"
public_build_configuration:
  strategy: build-time-release-contract
  variables:
    NEXT_PUBLIC_BASE_API_PUBLIC: "$storefront_api_base"
    NEXT_PUBLIC_CRM_API_BASE: "$crm_api_base"
    NEXT_PUBLIC_MEDIA_ORIGINS: "$media_origins"
    NEXT_PUBLIC_SITE_URL: "$storefront_site_url"
    NEXT_PUBLIC_APP_ENV: "$deployment_environment"
    NEXT_PUBLIC_APP_RELEASE: "$commit_sha"
    NEXT_PUBLIC_TELEMETRY_ENABLED: $telemetry_enabled
  storefront_api_base: "$storefront_api_base"
  crm_api_base: "$crm_api_base"
  media_origins: "$media_origins"
  storefront_site_url: "$storefront_site_url"
  deployment_environment: "$deployment_environment"
  release: "$commit_sha"
  telemetry_enabled: $telemetry_enabled
  placeholder_acknowledged: $placeholder_acknowledged
database:
  changelog: classpath:db/changelog/db.changelog-master.xml
  expected_latest_change: 2026-07-19-02-update-public-image-paths-to-webp
  migration_mode: one-time-job
verification:
  workflow_run: "$run_url"
  registry_manifest: passed
  linux_amd64_runtime: passed
  linux_arm64_runtime: passed
  deployment_performed: false
remaining_oracle_decisions:
  - Oracle tenancy, compartment, region, VCN, and subnet
  - final DNS names and public build configuration
  - Ampere A1 VM shape allocation and boot volume size
  - SSH ingress source CIDRs
  - backup destination and retention policy
  - alert routing
EOF

if grep -Eq 'PENDING|0000000000000000000000000000000000000000' "$output_path"; then
  echo "Published release manifest contains an unresolved value" >&2
  exit 1
fi
