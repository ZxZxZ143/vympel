#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
TEMP_ROOT=$(mktemp -d)
trap 'rm -rf "$TEMP_ROOT"' EXIT HUP INT TERM

RELEASE_TAG=1111111111111111111111111111111111111111
RESTORE_ID=restore-rehearsal-contract-001
EVIDENCE="$TEMP_ROOT/evidence.env"
DEPLOY_ENV="$TEMP_ROOT/deployment.env"

write_evidence() {
  backup_created_at=$1
  restore_completed_at=$2
  cat > "$EVIDENCE" <<EOF
EVIDENCE_VERSION=1
DEPLOYMENT_ENVIRONMENT=production
RELEASE_TAG=$RELEASE_TAG
DATABASE_BACKUP_ID=provider-backup-contract-001
DATABASE_BACKUP_CREATED_AT=$backup_created_at
RESTORE_REHEARSAL_ID=$RESTORE_ID
RESTORE_REHEARSAL_COMPLETED_AT=$restore_completed_at
DATABASE_RESTORE_RESULT=PASS
APPLICATION_CHECKS=PASS
OBJECT_STORAGE_RECOVERY_CHECKS=PASS
EOF
  evidence_sha=$(sha256sum "$EVIDENCE" | awk '{print $1}')
  cat > "$DEPLOY_ENV" <<EOF
BACKUP_EVIDENCE_PATH=$EVIDENCE
BACKUP_EVIDENCE_SHA256=$evidence_sha
RESTORE_REHEARSAL_ID=$RESTORE_ID
RELEASE_TAG=$RELEASE_TAG
NEXT_PUBLIC_APP_ENV=production
BACKUP_MAX_AGE_HOURS=24
RESTORE_MAX_AGE_DAYS=30
EOF
}

backup_at=$(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ')
restore_at=$(date -u -d '30 minutes ago' '+%Y-%m-%dT%H:%M:%SZ')
write_evidence "$backup_at" "$restore_at"
sh "$ROOT/deployment/scripts/backup-check.sh" "$DEPLOY_ENV" >/dev/null

restore_before_backup=$(date -u -d '2 hours ago' '+%Y-%m-%dT%H:%M:%SZ')
write_evidence "$backup_at" "$restore_before_backup"
if sh "$ROOT/deployment/scripts/backup-check.sh" "$DEPLOY_ENV" >"$TEMP_ROOT/rejected.log" 2>&1; then
  printf '%s\n' 'restore-before-backup evidence was accepted' >&2
  exit 1
fi
grep -Fq 'cannot complete before' "$TEMP_ROOT/rejected.log" \
  || { printf '%s\n' 'chronology rejection did not fail for the expected reason' >&2; exit 1; }

printf '%s\n' 'PASS backup evidence gate contract'
