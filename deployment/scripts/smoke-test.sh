#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/lib.sh"

[ "$#" -eq 1 ] || die "usage: $0 <deployment.env>"
ENV_FILE=$1
"$SCRIPT_DIR/health-check.sh" "$ENV_FILE"

for key in STOREFRONT_HEALTH_URL CRM_HEALTH_URL API_HEALTH_URL; do
  url=$(require_env_value "$ENV_FILE" "$key")
  headers=$(curl --fail --silent --show-error --location --max-time 10 --dump-header - --output /dev/null "$url")
  printf '%s' "$headers" | grep -Eiq '^x-content-type-options:[[:space:]]*nosniff' \
    || die "$key response is missing X-Content-Type-Options"
done

printf '%s\n' 'Bounded smoke checks passed.'
