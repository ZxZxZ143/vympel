# Database Deployment Runbook

## Supported target

- PostgreSQL 16 is the verified local baseline. A managed PostgreSQL 16 target is preferred.
- Require TLS in non-local environments and verify the provider certificate policy; do not use plaintext public database endpoints.
- Supply `VYMPEL_DB_URL`, `VYMPEL_DB_USERNAME`, and `VYMPEL_DB_PASSWORD` through the deployment secret store.
- Restrict network access to deployment migration jobs and backend replicas.

## Pre-deployment gate

1. Produce a provider-native backup or consistent snapshot and record its identifier/time without credentials.
2. Confirm the latest restore rehearsal completed in an isolated database and record evidence.
3. Run `deployment/scripts/check-liquibase-history.sh <env-file>`, then compare `databasechangelog` with `vympel_back/src/main/resources/db/changelog` and resolve any checksum, missing, or unexpected row before rollout.
4. The exact artifact for historical changeset `2026-07-13-01-seed-accessory-split-categories` was not recoverable. Do not invent it or edit the database row. A target containing it requires the external accountable acceptance described in `LIQUIBASE_HISTORY_RECONCILIATION.md`; without that record the gate must stop.
5. Confirm sufficient locks, storage, connection headroom, and maintenance window.

## Migration procedure

Run `deployment/scripts/verify-migrations.sh <compose-file> <env-file>`. The one-time `migrate` service runs the backend image with Liquibase enabled, scheduled jobs disabled, and no published port, then verifies the changelog table and closes its context. It retains the normal Spring web application type because the project security configuration requires `HttpSecurity` at startup. Only after success may backend replicas start with `SPRING_LIQUIBASE_ENABLED=false`.

After migration, compare the expected/latest changeset (currently `2026-09-10-01-wildberries-product-source-links`) and review migration logs for errors without copying credentials into evidence.

### GCP staging transactional wrapper

For the established GCP staging VM, `deployment/scripts/deploy-gcp-staging.sh <release-sha>` wraps the same migration boundary with immutable-image pull, VM backup services, backend-first promotion, bounded health/edge checks, state recording, and automatic **application** rollback.

The staging wrapper deliberately runs the migration service as a uniquely named detached container and polls Docker state directly instead of depending on the `docker compose run --rm` client process to terminate after container completion.

The wrapper never rolls the database backward automatically. If migration has succeeded and a later application or smoke check fails, it restores the prior release environment and application images only, then warns that the Liquibase state remains forward. See `docs/deployment/GCP_STAGING_AUTOMATED_DEPLOY.md`.

## Failure policy

- Do not run destructive automated down-migrations.
- Stop application promotion if migration fails.
- Prefer a new idempotent forward-fix changeset.
- Restore only under an explicit incident decision, into a verified target, with acknowledged data-loss window and preserved failed-state evidence.
- Never modify a changeset already applied in production.
