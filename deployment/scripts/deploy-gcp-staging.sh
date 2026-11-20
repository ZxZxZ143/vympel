#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

usage() {
  cat <<'EOF'
Usage:
  sudo deployment/scripts/deploy-gcp-staging.sh <40-char-release-sha>

Deploys one immutable Vympel release to the GCP staging VM.

Safety model:
  - requires all three application services to start from one healthy old SHA
  - takes PostgreSQL and MinIO backups through the VM systemd backup services
  - pulls only the requested immutable application SHA
  - runs the migration job before changing the live release environment
  - switches backend first, then storefront + CRM
  - runs local, edge, nginx, and systemd smoke checks
  - automatically rolls application images + /etc/vympel/staging.env back on failure
  - NEVER rolls Liquibase/database state backward automatically
EOF
}

log() {
  printf '[%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

die() {
  log "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command is unavailable: $1"
}

read_env() {
  local file=$1 key=$2
  awk -v key="$key" '
    index($0, key "=") == 1 {
      value = substr($0, length(key) + 2)
      sub(/\r$/, "", value)
      print value
      found = 1
      exit
    }
    END { if (!found) exit 1 }
  ' "$file"
}

require_env() {
  local value
  value=$(read_env "$1" "$2" 2>/dev/null || true)
  [[ -n "$value" ]] || die "$2 is missing or blank in $1"
  printf '%s' "$value"
}

compose() {
  local env_file=$1
  shift
  docker compose \
    --env-file "$env_file" \
    -f "$COMPOSE_BASE" \
    -f "$COMPOSE_OVERRIDE" \
    "$@"
}

compose_base() {
  local env_file=$1
  shift
  docker compose \
    --env-file "$env_file" \
    -f "$COMPOSE_BASE" \
    "$@"
}

render_release_env() {
  local source=$1 destination=$2 release=$3
  awk -v release="$release" '
    BEGIN { release_seen = 0; public_seen = 0 }
    index($0, "RELEASE_TAG=") == 1 {
      print "RELEASE_TAG=" release
      release_seen++
      next
    }
    index($0, "NEXT_PUBLIC_APP_RELEASE=") == 1 {
      print "NEXT_PUBLIC_APP_RELEASE=" release
      public_seen++
      next
    }
    { print }
    END {
      if (release_seen != 1 || public_seen != 1) exit 42
    }
  ' "$source" > "$destination" || die "failed to render release environment"
  chmod --reference="$source" "$destination" 2>/dev/null || chmod 0600 "$destination"
  chown --reference="$source" "$destination" 2>/dev/null || true
}

service_container_id() {
  local env_file=$1 service=$2 cid
  cid=$(compose "$env_file" ps -q "$service")
  [[ -n "$cid" ]] || return 1
  printf '%s' "$cid"
}

service_release_sha() {
  local env_file=$1 service=$2 cid image tag
  cid=$(service_container_id "$env_file" "$service") || return 1
  image=$(docker inspect "$cid" --format '{{.Config.Image}}')
  tag=${image##*:}
  [[ "$tag" =~ ^[0-9a-f]{40}$ ]] || return 1
  printf '%s' "$tag"
}

service_state() {
  local cid=$1
  docker inspect "$cid" --format '{{.State.Status}}{{if .State.Health}}|{{.State.Health.Status}}{{end}}'
}

wait_service() {
  local env_file=$1 service=$2 expected_sha=$3 timeout_seconds=${4:-240}
  local deadline=$((SECONDS + timeout_seconds))
  local cid image state

  while (( SECONDS < deadline )); do
    cid=$(service_container_id "$env_file" "$service" 2>/dev/null || true)
    if [[ -n "$cid" ]]; then
      image=$(docker inspect "$cid" --format '{{.Config.Image}}' 2>/dev/null || true)
      state=$(service_state "$cid" 2>/dev/null || true)
      if [[ "$image" == "${REGISTRY}/vympel-${service}:${expected_sha}" && "$state" == "running|healthy" ]]; then
        log "$service is healthy on $expected_sha"
        return 0
      fi
    fi
    sleep 5
  done

  [[ -n "${cid:-}" ]] && docker inspect "$cid" --format '{{.Name}} {{.Config.Image}} {{json .State}}' >&2 || true
  return 1
}

expect_http_status() {
  local label=$1 expected=$2 url=$3
  local actual
  actual=$(curl -sS --max-time 15 -o /dev/null -w '%{http_code}' "$url") || {
    log "ERROR: $label request failed: $url" >&2
    return 1
  }
  if [[ "$actual" != "$expected" ]]; then
    log "ERROR: $label expected HTTP $expected but got $actual ($url)" >&2
    return 1
  fi
  log "$label -> HTTP $actual"
}

expect_http_2xx() {
  local label=$1 url=$2
  local actual
  actual=$(curl -sS --max-time 15 -o /dev/null -w '%{http_code}' "$url") || {
    log "ERROR: $label request failed: $url" >&2
    return 1
  }
  [[ "$actual" =~ ^2[0-9][0-9]$ ]] || {
    log "ERROR: $label expected HTTP 2xx but got $actual ($url)" >&2
    return 1
  }
  log "$label -> HTTP $actual"
}

expect_http_2xx_or_3xx() {
  local label=$1 url=$2
  local actual
  actual=$(curl -sS --max-time 15 -o /dev/null -w '%{http_code}' "$url") || {
    log "ERROR: $label request failed: $url" >&2
    return 1
  }
  [[ "$actual" =~ ^[23][0-9][0-9]$ ]] || {
    log "ERROR: $label expected HTTP 2xx/3xx but got $actual ($url)" >&2
    return 1
  }
  log "$label -> HTTP $actual"
}

failed_unit_count() {
  systemctl --failed --no-legend --no-pager 2>/dev/null | awk '
    NF == 0 { next }
    $1 ~ /^[0-9]+$/ { next }
    { count++ }
    END { print count + 0 }
  '
}

repo_git() {
  if [[ "$REPO_OWNER" == "root" ]]; then
    git -C "$REPO_DIR" "$@"
  else
    sudo -u "$REPO_OWNER" -- git -C "$REPO_DIR" "$@"
  fi
}

database_query() {
  local sql=$1
  compose "$ENV_FILE" exec -T postgres sh -lc '
    PGPASSWORD="$POSTGRES_PASSWORD" \
      psql \
        --username="$POSTGRES_USER" \
        --dbname="$POSTGRES_DB" \
        --no-psqlrc \
        --set=ON_ERROR_STOP=1 \
        --tuples-only \
        --no-align \
        --command="$1"
  ' sh "$sql"
}

run_backup_service() {
  local unit=$1
  systemctl cat "$unit" >/dev/null 2>&1 || die "required backup service is missing: $unit"
  log "starting backup service: $unit"
  systemctl reset-failed "$unit" >/dev/null 2>&1 || true
  systemctl start "$unit"
  local result status
  result=$(systemctl show "$unit" -p Result --value)
  status=$(systemctl show "$unit" -p ExecMainStatus --value)
  [[ "$result" == "success" && "$status" == "0" ]] \
    || die "backup service failed: $unit (Result=$result ExecMainStatus=$status)"
  journalctl -u "$unit" --since "$RUN_STARTED_AT" --no-pager > "$STATE_DIR/${unit}.log" 2>&1 || true
  log "$unit completed successfully"
}

verify_image() {
  local service=$1 image="${REGISTRY}/vympel-${service}:${NEW_RELEASE_SHA}"
  log "pulling $image"
  docker pull "$image" >/dev/null

  local platform revision
  platform=$(docker image inspect "$image" --format '{{.Os}}/{{.Architecture}}')
  [[ "$platform" == "linux/amd64" ]] || die "$image has unexpected local platform: $platform"

  revision=$(docker image inspect "$image" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' 2>/dev/null || true)
  if [[ -n "$revision" && "$revision" != "<no value>" && "$revision" != "$NEW_RELEASE_SHA" ]]; then
    die "$image OCI revision label does not match requested release SHA"
  fi
  log "$service image verified ($platform)"
}

cleanup_migration_container() {
  if [[ -n "${MIGRATION_NAME:-}" ]] && docker ps -a --format '{{.Names}}' | grep -Fxq "$MIGRATION_NAME"; then
    docker rm -f "$MIGRATION_NAME" >/dev/null 2>&1 || true
  fi
}

run_migration() {
  MIGRATION_NAME="vympel-migrate-${RUN_ID}"
  cleanup_migration_container

  log "starting isolated migration container $MIGRATION_NAME"
  compose_base "$MIGRATION_ENV" run -d --no-deps --name "$MIGRATION_NAME" migrate >/dev/null

  local deadline=$((SECONDS + MIGRATION_TIMEOUT_SECONDS))
  local status exit_code
  while (( SECONDS < deadline )); do
    status=$(docker inspect "$MIGRATION_NAME" --format '{{.State.Status}}' 2>/dev/null || true)
    case "$status" in
      exited)
        exit_code=$(docker inspect "$MIGRATION_NAME" --format '{{.State.ExitCode}}')
        docker logs "$MIGRATION_NAME" > "$STATE_DIR/migration.log" 2>&1 || true
        if [[ "$exit_code" != "0" ]]; then
          log "ERROR: migration container exited with code $exit_code" >&2
          tail -n 80 "$STATE_DIR/migration.log" >&2 || true
          cleanup_migration_container
          return 1
        fi
        cleanup_migration_container
        log "migration container completed successfully"
        return 0
        ;;
      running|created|restarting)
        ;;
      *)
        log "ERROR: migration container entered unexpected state: ${status:-missing}" >&2
        docker logs "$MIGRATION_NAME" > "$STATE_DIR/migration.log" 2>&1 || true
        cleanup_migration_container
        return 1
        ;;
    esac
    sleep 3
  done

  log "ERROR: migration exceeded ${MIGRATION_TIMEOUT_SECONDS}s" >&2
  docker logs "$MIGRATION_NAME" > "$STATE_DIR/migration.log" 2>&1 || true
  cleanup_migration_container
  return 1
}

atomic_restore_env() {
  local source=$1
  local tmp="${ENV_FILE}.deploy-restore.$$"
  cp --preserve=mode,ownership "$source" "$tmp"
  mv -f "$tmp" "$ENV_FILE"
}

atomic_install_env() {
  local source=$1
  local tmp="${ENV_FILE}.deploy-new.$$"
  cp --preserve=mode,ownership "$source" "$tmp"
  mv -f "$tmp" "$ENV_FILE"
}

record_state() {
  local key=$1 value=$2
  printf '%s=%s\n' "$key" "$value" >> "$STATE_FILE"
}

rollback_application() {
  local rollback_failed=0
  log "automatic application rollback started"

  cleanup_migration_container

  if [[ "$ENV_SWITCHED" == "1" ]]; then
    atomic_restore_env "$ORIGINAL_ENV"
    log "restored $ENV_FILE"
  fi

  if [[ "$APP_PROMOTION_STARTED" == "1" ]]; then
    compose "$ENV_FILE" up -d --no-build --no-deps backend storefront crm || rollback_failed=1
    if [[ "$rollback_failed" == "0" ]]; then
      wait_service "$ENV_FILE" backend "$OLD_RELEASE_SHA" "$HEALTH_TIMEOUT_SECONDS" || rollback_failed=1
      wait_service "$ENV_FILE" storefront "$OLD_RELEASE_SHA" "$HEALTH_TIMEOUT_SECONDS" || rollback_failed=1
      wait_service "$ENV_FILE" crm "$OLD_RELEASE_SHA" "$HEALTH_TIMEOUT_SECONDS" || rollback_failed=1
    fi
  fi

  if [[ "$MIGRATION_SUCCEEDED" == "1" ]]; then
    log "WARNING: migration phase had already succeeded. Database/Liquibase history was NOT rolled back."
    log "WARNING: old application images were restored only; review schema compatibility before further action."
  fi

  if [[ "$rollback_failed" == "0" ]]; then
    record_state "ROLLBACK_RESULT" "SUCCESS"
    log "automatic application rollback completed"
    return 0
  fi

  record_state "ROLLBACK_RESULT" "FAILED"
  log "CRITICAL: automatic application rollback did not become healthy; manual intervention is required" >&2
  return 1
}

handle_exit() {
  local rc=$1
  trap - EXIT INT TERM
  cleanup_migration_container

  if [[ "$rc" == "0" || "$DEPLOY_SUCCEEDED" == "1" ]]; then
    return 0
  fi

  record_state "FAILED_PHASE" "$PHASE"
  record_state "FAILED_EXIT_CODE" "$rc"
  log "deployment failed during phase: $PHASE"

  if [[ "$ENV_SWITCHED" == "1" || "$APP_PROMOTION_STARTED" == "1" ]]; then
    rollback_application || true
  elif [[ "$MIGRATION_SUCCEEDED" == "1" ]]; then
    log "WARNING: migration completed but application promotion never started."
    log "WARNING: database state was not changed back automatically."
  else
    log "live application and release environment were not changed; no application rollback is required"
  fi

  exit "$rc"
}

[[ $# -eq 1 ]] || {
  usage >&2
  exit 2
}

NEW_RELEASE_SHA=$1
[[ "$NEW_RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]] || die "release must be a lowercase 40-character Git commit SHA"

[[ "${EUID:-$(id -u)}" -eq 0 ]] || die "run this script with sudo/root"

REPO_DIR=${VYMPEL_REPO_DIR:-/opt/vympel/repository}
ENV_FILE=${VYMPEL_ENV_FILE:-/etc/vympel/staging.env}
COMPOSE_BASE=${VYMPEL_COMPOSE_BASE:-$REPO_DIR/infrastructure/compose/compose.single-vm-staging.yml}
COMPOSE_OVERRIDE=${VYMPEL_COMPOSE_OVERRIDE:-/etc/vympel/compose.host-ports.yml}
STATE_ROOT=${VYMPEL_DEPLOY_STATE_ROOT:-/var/lib/vympel/deployments}
LOCK_FILE=${VYMPEL_DEPLOY_LOCK_FILE:-/var/lock/vympel-deploy.lock}
POSTGRES_BACKUP_SERVICE=${VYMPEL_POSTGRES_BACKUP_SERVICE:-vympel-postgres-backup.service}
MINIO_BACKUP_SERVICE=${VYMPEL_MINIO_BACKUP_SERVICE:-vympel-minio-backup.service}
MIGRATION_TIMEOUT_SECONDS=${VYMPEL_MIGRATION_TIMEOUT_SECONDS:-600}
HEALTH_TIMEOUT_SECONDS=${VYMPEL_HEALTH_TIMEOUT_SECONDS:-240}

[[ "$MIGRATION_TIMEOUT_SECONDS" =~ ^[1-9][0-9]{0,3}$ ]] || die "invalid VYMPEL_MIGRATION_TIMEOUT_SECONDS"
[[ "$HEALTH_TIMEOUT_SECONDS" =~ ^[1-9][0-9]{0,3}$ ]] || die "invalid VYMPEL_HEALTH_TIMEOUT_SECONDS"

for command in awk curl docker flock git grep journalctl nginx sed sha256sum stat sudo systemctl; do
  require_command "$command"
done

[[ -d "$REPO_DIR/.git" ]] || die "repository is not available at $REPO_DIR"
REPO_OWNER=$(stat -c '%U' "$REPO_DIR")
[[ -n "$REPO_OWNER" ]] || die "could not determine repository owner"
[[ -f "$ENV_FILE" ]] || die "environment file is missing: $ENV_FILE"
[[ -f "$COMPOSE_BASE" ]] || die "base compose file is missing: $COMPOSE_BASE"
[[ -f "$COMPOSE_OVERRIDE" ]] || die "compose override file is missing: $COMPOSE_OVERRIDE"

mkdir -p "$STATE_ROOT"
mkdir -p "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
flock -n 9 || die "another Vympel deployment is already running"

RUN_ID=$(date -u '+%Y%m%dT%H%M%SZ')-$$
RUN_STARTED_AT=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
STATE_DIR="$STATE_ROOT/$RUN_ID"
STATE_FILE="$STATE_DIR/state.env"
ORIGINAL_ENV="$STATE_DIR/staging.env.before"
MIGRATION_ENV="$STATE_DIR/staging.env.migration"
TARGET_ENV="$STATE_DIR/staging.env.target"
mkdir -p "$STATE_DIR"

cp --preserve=mode,ownership "$ENV_FILE" "$ORIGINAL_ENV"
ORIGINAL_ENV_DIGEST=$(sha256sum "$ORIGINAL_ENV" | awk '{print $1}')

PHASE=preflight
ENV_SWITCHED=0
APP_PROMOTION_STARTED=0
MIGRATION_SUCCEEDED=0
DEPLOY_SUCCEEDED=0
MIGRATION_NAME=""

trap 'handle_exit $?' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

record_state "RUN_ID" "$RUN_ID"
record_state "STARTED_AT_UTC" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
record_state "NEW_RELEASE_SHA" "$NEW_RELEASE_SHA"
record_state "STATUS" "RUNNING"

REGISTRY=$(require_env "$ENV_FILE" REGISTRY)
OLD_RELEASE_SHA=$(require_env "$ENV_FILE" RELEASE_TAG)
OLD_PUBLIC_RELEASE=$(require_env "$ENV_FILE" NEXT_PUBLIC_APP_RELEASE)
STOREFRONT_DOMAIN=$(require_env "$ENV_FILE" STOREFRONT_DOMAIN)
CRM_DOMAIN=$(require_env "$ENV_FILE" CRM_DOMAIN)
API_DOMAIN=$(require_env "$ENV_FILE" API_DOMAIN)

[[ "$REGISTRY" == "ghcr.io/zxzxz143" ]] || die "unexpected staging registry: $REGISTRY"
[[ "$OLD_RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]] || die "current RELEASE_TAG is not an immutable SHA"
[[ "$OLD_PUBLIC_RELEASE" == "$OLD_RELEASE_SHA" ]] || die "NEXT_PUBLIC_APP_RELEASE does not match RELEASE_TAG"
[[ "$NEW_RELEASE_SHA" != "$OLD_RELEASE_SHA" ]] || die "requested release is already active"

record_state "OLD_RELEASE_SHA" "$OLD_RELEASE_SHA"

for service in backend storefront crm; do
  running_sha=$(service_release_sha "$ENV_FILE" "$service" || true)
  [[ "$running_sha" == "$OLD_RELEASE_SHA" ]] \
    || die "$service is not running the release declared by $ENV_FILE"
  cid=$(service_container_id "$ENV_FILE" "$service")
  [[ "$(service_state "$cid")" == "running|healthy" ]] \
    || die "$service is not healthy before deployment"
done

for service in postgres redis minio media-gateway; do
  cid=$(service_container_id "$ENV_FILE" "$service" || true)
  [[ -n "$cid" ]] || die "$service container is missing before deployment"
  state=$(service_state "$cid")
  case "$service" in
    postgres|redis|minio)
      [[ "$state" == "running|healthy" ]] || die "$service is not healthy before deployment"
      ;;
    media-gateway)
      [[ "$state" == "running|healthy" ]] || die "$service is not healthy before deployment"
      ;;
  esac
done

[[ "$(failed_unit_count)" == "0" ]] \
  || die "systemd already has failed units before deployment"

nginx -t

[[ -z "$(repo_git status --porcelain --untracked-files=no)" ]] \
  || die "repository has tracked working-tree changes; automated deployment refuses to continue"

log "fetching release metadata from origin"
repo_git fetch --quiet origin main
repo_git cat-file -e "${NEW_RELEASE_SHA}^{commit}" \
  || die "requested release commit is not available after fetching origin/main"
repo_git merge-base --is-ancestor "$OLD_RELEASE_SHA" "$NEW_RELEASE_SHA" \
  || die "requested release is not a descendant of the currently deployed release"
repo_git merge-base --is-ancestor "$NEW_RELEASE_SHA" origin/main \
  || die "requested release is not reachable from origin/main"

if ! repo_git diff --quiet "$OLD_RELEASE_SHA" "$NEW_RELEASE_SHA" -- \
  infrastructure/compose/compose.single-vm-staging.yml \
  infrastructure/env/gcp-staging.env.example \
  infrastructure/reverse-proxy; then
  die "staging compose/env/proxy contract changed in this release; use the manual runbook for this rollout"
fi

PHASE=pull-images
for service in backend storefront crm; do
  verify_image "$service"
done

PHASE=backup
run_backup_service "$POSTGRES_BACKUP_SERVICE"
run_backup_service "$MINIO_BACKUP_SERVICE"
record_state "BACKUPS" "SUCCESS"

PHASE=database-history
legacy_count=$(database_query "SELECT count(*) FROM databasechangelog WHERE id = '2026-07-13-01-seed-accessory-split-categories';" | tr -d '[:space:]')
[[ "$legacy_count" == "0" ]] \
  || die "unreconciled historical Liquibase row exists; automated deployment refuses to continue"

DB_MARKER_BEFORE=$(database_query "SELECT count(*)::text || '|' || COALESCE(max(orderexecuted),0)::text FROM databasechangelog;" | tr -d '[:space:]')
record_state "DB_MARKER_BEFORE" "$DB_MARKER_BEFORE"

render_release_env "$ORIGINAL_ENV" "$MIGRATION_ENV" "$NEW_RELEASE_SHA"
render_release_env "$ORIGINAL_ENV" "$TARGET_ENV" "$NEW_RELEASE_SHA"

PHASE=migration
run_migration
MIGRATION_SUCCEEDED=1
record_state "MIGRATION_PHASE" "SUCCESS"

DB_MARKER_AFTER=$(database_query "SELECT count(*)::text || '|' || COALESCE(max(orderexecuted),0)::text FROM databasechangelog;" | tr -d '[:space:]')
record_state "DB_MARKER_AFTER" "$DB_MARKER_AFTER"
if [[ "$DB_MARKER_BEFORE" == "$DB_MARKER_AFTER" ]]; then
  record_state "DATABASECHANGELOG_CHANGED" "false"
else
  record_state "DATABASECHANGELOG_CHANGED" "true"
fi

current_digest=$(sha256sum "$ENV_FILE" | awk '{print $1}')
[[ "$current_digest" == "$ORIGINAL_ENV_DIGEST" ]] \
  || die "$ENV_FILE changed concurrently during deployment"

PHASE=switch-environment
atomic_install_env "$TARGET_ENV"
ENV_SWITCHED=1
record_state "ENV_SWITCHED" "true"

PHASE=backend
APP_PROMOTION_STARTED=1
compose "$ENV_FILE" up -d --no-build --no-deps backend
wait_service "$ENV_FILE" backend "$NEW_RELEASE_SHA" "$HEALTH_TIMEOUT_SECONDS"
expect_http_2xx "backend local readiness" "http://127.0.0.1:8080/actuator/health/readiness"

PHASE=storefront-crm
compose "$ENV_FILE" up -d --no-build --no-deps storefront crm
wait_service "$ENV_FILE" storefront "$NEW_RELEASE_SHA" "$HEALTH_TIMEOUT_SECONDS"
wait_service "$ENV_FILE" crm "$NEW_RELEASE_SHA" "$HEALTH_TIMEOUT_SECONDS"
expect_http_status "storefront local /ru" "200" "http://127.0.0.1:3000/ru"
expect_http_2xx_or_3xx "crm local root" "http://127.0.0.1:3001/"

PHASE=edge-smoke
expect_http_status "preview without Basic" "401" "https://${STOREFRONT_DOMAIN}/ru"
expect_http_status "CRM without Basic" "401" "https://${CRM_DOMAIN}/"
expect_http_status "CRM API on public API host" "404" "https://${API_DOMAIN}/api/crm/"
expect_http_status "actuator on public API host" "404" "https://${API_DOMAIN}/actuator/health"
expect_http_status "swagger on public API host" "404" "https://${API_DOMAIN}/swagger-ui/index.html"
expect_http_status "public category API" "200" "https://${API_DOMAIN}/api/public/category/all/ru"

PHASE=host-smoke
nginx -t
[[ "$(failed_unit_count)" == "0" ]] \
  || die "systemd has failed units after deployment"

for service in backend storefront crm; do
  running_sha=$(service_release_sha "$ENV_FILE" "$service")
  [[ "$running_sha" == "$NEW_RELEASE_SHA" ]] || die "$service final image SHA does not match requested release"
done

DEPLOY_SUCCEEDED=1
PHASE=complete
record_state "STATUS" "SUCCESS"
record_state "COMPLETED_AT_UTC" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

log "DEPLOY SUCCESSFUL"
log "previous release: $OLD_RELEASE_SHA"
log "current release:  $NEW_RELEASE_SHA"
log "state directory:  $STATE_DIR"
log "database rollback was not and will never be performed automatically by this script"
