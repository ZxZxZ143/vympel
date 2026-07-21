# Database Deployment Runbook

## Supported target

- PostgreSQL 16 is the verified local baseline. A managed PostgreSQL 16 target is preferred.
- Require TLS in non-local environments and verify the provider certificate policy; do not use plaintext public database endpoints.
- Supply `VYMPEL_DB_URL`, `VYMPEL_DB_USERNAME`, and `VYMPEL_DB_PASSWORD` through the deployment secret store.
- Restrict network access to deployment migration jobs and backend replicas.

## Pre-deployment gate

1. Produce a provider-native backup or consistent snapshot and record its identifier/time without credentials.
2. Confirm the latest restore rehearsal completed in an isolated database and record evidence.
3. Compare `databasechangelog` with `vympel_back/src/main/resources/db/changelog` and resolve any checksum, missing, or unexpected row before rollout.
4. Pay special attention to historical changeset `2026-07-13-01-seed-accessory-split-categories`. Do not edit its applied file or checksum in place; reconcile drift and add a new forward-fix changeset if required.
5. Confirm sufficient locks, storage, connection headroom, and maintenance window.

## Migration procedure

Run `deployment/scripts/verify-migrations.sh <compose-file> <env-file>`. The one-time `migrate` service runs the backend image with Liquibase enabled, scheduled jobs disabled, and no published port, then verifies the changelog table and closes its context. It retains the normal Spring web application type because the project security configuration requires `HttpSecurity` at startup. Only after success may backend replicas start with `SPRING_LIQUIBASE_ENABLED=false`.

After migration, compare the expected/latest changeset (currently `2026-07-19-02-public-image-webp`) and review migration logs for errors without copying credentials into evidence.

## Failure policy

- Do not run destructive automated down-migrations.
- Stop application promotion if migration fails.
- Prefer a new idempotent forward-fix changeset.
- Restore only under an explicit incident decision, into a verified target, with acknowledged data-loss window and preserved failed-state evidence.
- Never modify a changeset already applied in production.
