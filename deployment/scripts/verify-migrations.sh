#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/lib.sh"

[ "$#" -eq 2 ] || die "usage: $0 <compose.yml> <deployment.env>"
COMPOSE_FILE=$1
ENV_FILE=$2
require_command docker
require_command timeout
timeout_seconds=$(read_env "$ENV_FILE" MIGRATION_TIMEOUT_SECONDS 2>/dev/null || printf '300')
printf '%s' "$timeout_seconds" | grep -Eq '^[1-9][0-9]{0,3}$' || die "invalid MIGRATION_TIMEOUT_SECONDS"
timeout "$timeout_seconds" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm migrate
