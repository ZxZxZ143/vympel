#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/lib.sh"

[ "$#" -eq 1 ] || die "usage: $0 <production.env>"
ENV_FILE=$1
evidence=$(require_env_value "$ENV_FILE" BACKUP_EVIDENCE_PATH)
rehearsal=$(require_env_value "$ENV_FILE" RESTORE_REHEARSAL_ID)
printf '%s' "$evidence$rehearsal" | grep -Eiq 'REPLACE_ME|example\.invalid' \
  && die "backup or restore rehearsal evidence is still a placeholder"
[ -e "$evidence" ] || die "backup evidence path does not exist: $evidence"
printf '%s\n' 'Backup evidence and restore rehearsal identifiers are present.'
