#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/lib.sh"

[ "$#" -eq 3 ] || die "usage: $0 <compose.yml> <deployment.env> <previous-commit-sha>"
COMPOSE_FILE=$1
ENV_FILE=$2
PREVIOUS_TAG=$3
printf '%s' "$PREVIOUS_TAG" | grep -Eq '^[0-9a-f]{40}$' \
  || die "previous tag must be a lowercase 40-character Git commit SHA"
require_command docker

export RELEASE_TAG=$PREVIOUS_TAG
compose "$COMPOSE_FILE" "$ENV_FILE" pull backend storefront crm
compose "$COMPOSE_FILE" "$ENV_FILE" up -d --no-build --no-deps backend storefront crm
"$SCRIPT_DIR/health-check.sh" "$ENV_FILE"
printf '%s\n' "Application images rolled back to $PREVIOUS_TAG; database history was not changed."
