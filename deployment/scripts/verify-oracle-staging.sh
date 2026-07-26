#!/bin/sh
set -eu

[ "$#" -eq 2 ] || {
  echo "usage: $0 COMPOSE_FILE ENV_FILE" >&2
  exit 1
}

compose_file=$1
env_file=$2
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
for command_name in docker jq; do
  command -v "$command_name" >/dev/null 2>&1 || {
    echo "Required command is unavailable: $command_name" >&2
    exit 1
  }
done
[ -f "$compose_file" ] || {
  echo "Compose file not found: $compose_file" >&2
  exit 1
}
[ -f "$env_file" ] || {
  echo "Environment file not found: $env_file" >&2
  exit 1
}

config_file=$(mktemp)
trap 'rm -f "$config_file"' EXIT HUP INT TERM
docker compose --env-file "$env_file" -f "$compose_file" config --format json > "$config_file"
contract_filter=$script_dir/../rehearsals/oracle-staging-contract.jq
[ -f "$contract_filter" ] || {
  echo "Oracle staging contract filter not found: $contract_filter" >&2
  exit 1
}
jq -e -f "$contract_filter" "$config_file" >/dev/null

storefront_api_base=$(jq -er '.services.storefront.environment.NEXT_PUBLIC_BASE_API_PUBLIC' "$config_file")
crm_api_base=$(jq -er '.services.crm.environment.NEXT_PUBLIC_CRM_API_BASE' "$config_file")
media_origins=$(jq -er '.services.storefront.environment.NEXT_PUBLIC_MEDIA_ORIGINS' "$config_file")
storefront_site_url=$(jq -er '.services.storefront.environment.NEXT_PUBLIC_SITE_URL' "$config_file")
placeholder_acknowledged=$(sed -n 's/^PUBLIC_BUILD_PLACEHOLDERS_ACKNOWLEDGED=//p' "$env_file" | tail -n 1)
[ -n "$placeholder_acknowledged" ] || placeholder_acknowledged=false

"$script_dir/validate-public-build-config.sh" \
  "$storefront_api_base" \
  "$crm_api_base" \
  "$media_origins" \
  "$storefront_site_url" \
  staging \
  "$placeholder_acknowledged" \
  0000000000000000000000000000000000000000

echo "Oracle staging Compose topology validated."
