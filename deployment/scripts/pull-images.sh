#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/lib.sh"

[ "$#" -eq 2 ] || die "usage: $0 <compose.yml> <deployment.env>"
COMPOSE_FILE=$1
ENV_FILE=$2
require_command docker
"$SCRIPT_DIR/validate-environment.sh" "$ENV_FILE"
compose "$COMPOSE_FILE" "$ENV_FILE" pull migrate backend storefront crm reverse-proxy
