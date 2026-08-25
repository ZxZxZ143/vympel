#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/lib.sh"

[ "$#" -eq 1 ] || die "usage: $0 <production.env>"
ENV_FILE=$1
evidence=$(require_env_value "$ENV_FILE" BACKUP_EVIDENCE_PATH)
rehearsal=$(require_env_value "$ENV_FILE" RESTORE_REHEARSAL_ID)
expected_hash=$(require_env_value "$ENV_FILE" BACKUP_EVIDENCE_SHA256)
release_tag=$(require_env_value "$ENV_FILE" RELEASE_TAG)
deployment_environment=$(require_env_value "$ENV_FILE" NEXT_PUBLIC_APP_ENV)
printf '%s' "$evidence$rehearsal$expected_hash" | grep -Eiq 'REPLACE_ME|example\.invalid' \
  && die "backup or restore rehearsal evidence is still a placeholder"
[ -f "$evidence" ] || die "backup evidence path must be a regular file: $evidence"
[ -r "$evidence" ] || die "backup evidence file is unreadable: $evidence"
[ -s "$evidence" ] || die "backup evidence file is empty: $evidence"

require_command sha256sum
printf '%s' "$expected_hash" | grep -Eq '^[0-9a-f]{64}$' \
  || die "BACKUP_EVIDENCE_SHA256 must be a lowercase SHA-256 digest"
actual_hash=$(sha256sum "$evidence" | awk '{print $1}')
[ "$actual_hash" = "$expected_hash" ] || die "backup evidence checksum does not match the approved digest"

[ "$(require_env_value "$evidence" EVIDENCE_VERSION)" = "1" ] \
  || die "unsupported backup evidence version"
[ "$(require_env_value "$evidence" DEPLOYMENT_ENVIRONMENT)" = "$deployment_environment" ] \
  || die "backup evidence belongs to a different deployment environment"
[ "$(require_env_value "$evidence" RELEASE_TAG)" = "$release_tag" ] \
  || die "backup evidence belongs to a different release"
[ "$(require_env_value "$evidence" RESTORE_REHEARSAL_ID)" = "$rehearsal" ] \
  || die "restore rehearsal identifier is not linked to the approved evidence"

backup_id=$(require_env_value "$evidence" DATABASE_BACKUP_ID)
printf '%s' "$backup_id" | grep -Eq '^[A-Za-z0-9._:/-]{8,200}$' \
  || die "DATABASE_BACKUP_ID has an invalid evidence format"
[ "$(require_env_value "$evidence" DATABASE_RESTORE_RESULT)" = "PASS" ] \
  || die "database restore rehearsal did not pass"
[ "$(require_env_value "$evidence" APPLICATION_CHECKS)" = "PASS" ] \
  || die "restored application checks did not pass"
[ "$(require_env_value "$evidence" OBJECT_STORAGE_RECOVERY_CHECKS)" = "PASS" ] \
  || die "object-storage recovery checks did not pass"

require_command date
now_epoch=$(date -u +%s)
backup_epoch=$(date -u -d "$(require_env_value "$evidence" DATABASE_BACKUP_CREATED_AT)" +%s 2>/dev/null) \
  || die "DATABASE_BACKUP_CREATED_AT must be a valid timestamp"
restore_epoch=$(date -u -d "$(require_env_value "$evidence" RESTORE_REHEARSAL_COMPLETED_AT)" +%s 2>/dev/null) \
  || die "RESTORE_REHEARSAL_COMPLETED_AT must be a valid timestamp"
backup_max_age_hours=$(read_env "$ENV_FILE" BACKUP_MAX_AGE_HOURS 2>/dev/null || printf '24')
restore_max_age_days=$(read_env "$ENV_FILE" RESTORE_MAX_AGE_DAYS 2>/dev/null || printf '30')
printf '%s' "$backup_max_age_hours" | grep -Eq '^[1-9][0-9]{0,3}$' \
  || die "BACKUP_MAX_AGE_HOURS must be a positive integer"
printf '%s' "$restore_max_age_days" | grep -Eq '^[1-9][0-9]{0,3}$' \
  || die "RESTORE_MAX_AGE_DAYS must be a positive integer"
[ "$backup_epoch" -le $((now_epoch + 300)) ] || die "database backup evidence is dated in the future"
[ "$restore_epoch" -le $((now_epoch + 300)) ] || die "restore rehearsal evidence is dated in the future"
[ "$restore_epoch" -ge "$backup_epoch" ] \
  || die "restore rehearsal cannot complete before the linked database backup was created"
[ $((now_epoch - backup_epoch)) -le $((backup_max_age_hours * 3600)) ] \
  || die "database backup evidence is stale"
[ $((now_epoch - restore_epoch)) -le $((restore_max_age_days * 86400)) ] \
  || die "restore rehearsal evidence is stale"

printf '%s\n' 'Backup and restore evidence passed checksum, scope, linkage, result, and freshness validation.'
