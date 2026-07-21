#!/bin/sh
set -eu

template_path=${1:?Usage: generate-release-manifest.sh TEMPLATE OUTPUT COMMIT_SHA CI_RUN_URL}
output_path=${2:?Usage: generate-release-manifest.sh TEMPLATE OUTPUT COMMIT_SHA CI_RUN_URL}
commit_sha=${3:?Usage: generate-release-manifest.sh TEMPLATE OUTPUT COMMIT_SHA CI_RUN_URL}
ci_run_url=${4:?Usage: generate-release-manifest.sh TEMPLATE OUTPUT COMMIT_SHA CI_RUN_URL}

if ! printf '%s\n' "$commit_sha" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "Commit SHA must be exactly 40 lowercase hexadecimal characters" >&2
  exit 1
fi
case "$ci_run_url" in
  https://*) ;;
  *) echo "CI run URL must use HTTPS" >&2; exit 1 ;;
esac
case "$ci_run_url" in
  *'|'*|*'&'*) echo "CI run URL contains an unsupported manifest-substitution character" >&2; exit 1 ;;
esac
if [ ! -f "$template_path" ]; then
  echo "Release manifest template does not exist: $template_path" >&2
  exit 1
fi

mkdir -p "$(dirname "$output_path")"
generated_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
sed \
  -e "s/0000000000000000000000000000000000000000/${commit_sha}/g" \
  -e "s/GENERATED_AT_UTC/${generated_at}/g" \
  -e "s|REMOTE_CI_RUN_PENDING|${ci_run_url}|g" \
  -e 's/backendCi: PENDING/backendCi: VERIFIED_BY_FULL_RELEASE_GATE/g' \
  -e 's/storefrontCi: PENDING/storefrontCi: VERIFIED_BY_FULL_RELEASE_GATE/g' \
  -e 's/crmCi: PENDING/crmCi: VERIFIED_BY_FULL_RELEASE_GATE/g' \
  -e 's/fullReleaseGate: PENDING/fullReleaseGate: PASSED/g' \
  "$template_path" > "$output_path"

if grep -Eq '0000000000000000000000000000000000000000|GENERATED_AT_UTC|REMOTE_CI_RUN_PENDING' "$output_path"; then
  echo "Generated release manifest still contains an unresolved immutable-release placeholder" >&2
  exit 1
fi
