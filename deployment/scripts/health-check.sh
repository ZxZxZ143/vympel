#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/lib.sh"

[ "$#" -eq 1 ] || die "usage: $0 <deployment.env>"
ENV_FILE=$1
require_command curl
timeout_seconds=$(read_env "$ENV_FILE" HEALTH_TIMEOUT_SECONDS 2>/dev/null || printf '180')
printf '%s' "$timeout_seconds" | grep -Eq '^[1-9][0-9]{0,3}$' || die "invalid HEALTH_TIMEOUT_SECONDS"

check_url() {
  label=$1
  url=$2
  elapsed=0
  while [ "$elapsed" -lt "$timeout_seconds" ]; do
    if curl --fail --silent --show-error --location --max-time 10 --output /dev/null "$url"; then
      printf '%s\n' "$label health passed"
      return 0
    fi
    sleep 5
    elapsed=$((elapsed + 5))
  done
  die "$label did not become healthy within ${timeout_seconds}s"
}

check_url storefront "$(require_env_value "$ENV_FILE" STOREFRONT_HEALTH_URL)"
check_url crm "$(require_env_value "$ENV_FILE" CRM_HEALTH_URL)"
check_url api "$(require_env_value "$ENV_FILE" API_HEALTH_URL)"
