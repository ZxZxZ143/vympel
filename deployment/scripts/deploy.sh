#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/lib.sh"

[ "$#" -eq 2 ] || die "usage: $0 <compose.yml> <deployment.env>"
COMPOSE_FILE=$1
ENV_FILE=$2
require_command docker
"$SCRIPT_DIR/validate-environment.sh" "$ENV_FILE"
"$SCRIPT_DIR/pull-images.sh" "$COMPOSE_FILE" "$ENV_FILE"
"$SCRIPT_DIR/check-liquibase-history.sh" "$ENV_FILE"
"$SCRIPT_DIR/verify-migrations.sh" "$COMPOSE_FILE" "$ENV_FILE"
compose "$COMPOSE_FILE" "$ENV_FILE" up -d --no-build --no-deps --wait backend
compose "$COMPOSE_FILE" "$ENV_FILE" up -d --no-build --no-deps --wait storefront crm
compose "$COMPOSE_FILE" "$ENV_FILE" up -d --no-build --no-deps --wait reverse-proxy
"$SCRIPT_DIR/smoke-test.sh" "$ENV_FILE"
