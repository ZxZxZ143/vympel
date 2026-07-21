#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
CHECK_SCRIPT="$ROOT_DIR/deployment/scripts/check-liquibase-history.sh"
HISTORICAL_ID=2026-07-13-01-seed-accessory-split-categories
RELEASE_COMMIT=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT HUP INT TERM

mkdir -p "$TEMP_DIR/bin"
cat > "$TEMP_DIR/bin/psql" <<'EOF'
#!/bin/sh
printf '%s\n' "${MOCK_LIQUIBASE_ROW:-}"
EOF
chmod +x "$TEMP_DIR/bin/psql"

cat > "$TEMP_DIR/deployment.env" <<EOF
VYMPEL_DB_URL=jdbc:postgresql://postgres.invalid:5432/vympel
VYMPEL_DB_USERNAME=vympel_test
VYMPEL_DB_PASSWORD=disposable-test-value
RELEASE_TAG=$RELEASE_COMMIT
EOF

PATH="$TEMP_DIR/bin:$PATH" MOCK_LIQUIBASE_ROW='' \
  sh "$CHECK_SCRIPT" "$TEMP_DIR/deployment.env" >/dev/null

ROW="$HISTORICAL_ID|codex|db/changelog/historical.xml|9:abc123|EXECUTED"
if PATH="$TEMP_DIR/bin:$PATH" MOCK_LIQUIBASE_ROW="$ROW" \
  sh "$CHECK_SCRIPT" "$TEMP_DIR/deployment.env" >/dev/null 2>&1; then
  printf '%s\n' 'history compatibility gate accepted an unexplained row' >&2
  exit 1
fi

cat > "$TEMP_DIR/approval.env" <<EOF
APPROVAL_STATUS=APPROVED
CHANGESET_ID=$HISTORICAL_ID
CHANGESET_AUTHOR=codex
CHANGESET_FILENAME=db/changelog/historical.xml
CHANGESET_MD5SUM=9:abc123
CHANGESET_EXEC_TYPE=EXECUTED
APPROVED_BY=accountable-release-owner
APPROVED_AT=2026-07-22T00:00:00Z
RELEASE_COMMIT=$RELEASE_COMMIT
EVIDENCE_REFERENCE=controlled-upgrade-record-001
EOF
printf '%s\n' "VYMPEL_LIQUIBASE_HISTORY_APPROVAL_FILE=$TEMP_DIR/approval.env" >> "$TEMP_DIR/deployment.env"

PATH="$TEMP_DIR/bin:$PATH" MOCK_LIQUIBASE_ROW="$ROW" \
  sh "$CHECK_SCRIPT" "$TEMP_DIR/deployment.env" >/dev/null

if PATH="$TEMP_DIR/bin:$PATH" \
  MOCK_LIQUIBASE_ROW="$HISTORICAL_ID|codex|db/changelog/different.xml|9:abc123|EXECUTED" \
  sh "$CHECK_SCRIPT" "$TEMP_DIR/deployment.env" >/dev/null 2>&1; then
  printf '%s\n' 'history compatibility gate accepted a mismatched identity' >&2
  exit 1
fi

printf '%s\n' 'PASS Liquibase history compatibility gate (absent, blocked, approved, mismatch)'
