#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/lib.sh"

[ "$#" -eq 1 ] || die "usage: $0 <deployment.env>"
ENV_FILE=$1
require_command psql

db_url=$(require_env_value "$ENV_FILE" VYMPEL_DB_URL)
db_user=$(require_env_value "$ENV_FILE" VYMPEL_DB_USERNAME)
db_password=$(require_env_value "$ENV_FILE" VYMPEL_DB_PASSWORD)
psql_url=${db_url#jdbc:}
historical_id=2026-07-13-01-seed-accessory-split-categories

row=$(PGPASSWORD="$db_password" psql "$psql_url" --username="$db_user" \
  --no-psqlrc --set=ON_ERROR_STOP=1 --tuples-only --no-align --field-separator='|' \
  --command="SELECT id, author, filename, md5sum, exectype FROM databasechangelog WHERE id = '$historical_id' ORDER BY orderexecuted")
row=$(printf '%s' "$row" | sed '/^[[:space:]]*$/d')

[ "$(printf '%s\n' "$row" | grep -c . || true)" -le 1 ] \
  || die "multiple Liquibase history rows exist for $historical_id"

if [ -z "$row" ]; then
  printf '%s\n' "No unreconciled $historical_id row exists in the target database."
  exit 0
fi

approval_file=$(read_env "$ENV_FILE" VYMPEL_LIQUIBASE_HISTORY_APPROVAL_FILE 2>/dev/null || true)
[ -n "$approval_file" ] \
  || die "$historical_id exists; VYMPEL_LIQUIBASE_HISTORY_APPROVAL_FILE is required"
[ -r "$approval_file" ] || die "Liquibase history approval file is unreadable"

status=$(require_env_value "$approval_file" APPROVAL_STATUS)
approved_id=$(require_env_value "$approval_file" CHANGESET_ID)
approved_author=$(require_env_value "$approval_file" CHANGESET_AUTHOR)
approved_filename=$(require_env_value "$approval_file" CHANGESET_FILENAME)
approved_md5sum=$(require_env_value "$approval_file" CHANGESET_MD5SUM)
approved_type=$(require_env_value "$approval_file" CHANGESET_EXEC_TYPE)
approved_by=$(require_env_value "$approval_file" APPROVED_BY)
approved_at=$(require_env_value "$approval_file" APPROVED_AT)
approved_commit=$(require_env_value "$approval_file" RELEASE_COMMIT)
evidence=$(require_env_value "$approval_file" EVIDENCE_REFERENCE)

[ "$status" = "APPROVED" ] || die "Liquibase history acceptance is not APPROVED"
printf '%s' "$approved_commit" | grep -Eq '^[0-9a-f]{40}$' \
  || die "approval RELEASE_COMMIT must be a 40-character lowercase commit SHA"
release_commit=$(require_env_value "$ENV_FILE" RELEASE_TAG)
[ "$approved_commit" = "$release_commit" ] \
  || die "Liquibase history acceptance is for a different release commit"
printf '%s\n' "$approved_by$approved_at$evidence" | grep -Eiq 'REPLACE_ME|PENDING|UNKNOWN' \
  && die "Liquibase history acceptance still contains placeholders"

approved_row="$approved_id|$approved_author|$approved_filename|$approved_md5sum|$approved_type"
[ "$row" = "$approved_row" ] \
  || die "target Liquibase row does not exactly match the accountable acceptance record"

printf '%s\n' "Accountable acceptance matches the target $historical_id identity and checksum."
