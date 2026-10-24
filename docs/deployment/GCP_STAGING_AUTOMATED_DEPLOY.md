# GCP staging automated deployment

This runbook covers the staging-only transactional deployment wrapper:

```text
deployment/scripts/deploy-gcp-staging.sh
```

It is intentionally specific to the current GCP staging VM contract. It is not a production deployment script.

## What it automates

Run it with one immutable 40-character Git SHA:

```bash
cd /opt/vympel/repository
sudo ./deployment/scripts/deploy-gcp-staging.sh <release-sha>
```

The script:

1. Acquires `/var/lock/vympel-deploy.lock` so two deployments cannot run at once.
2. Verifies the current backend, storefront, and CRM are healthy and all use the release declared by `/etc/vympel/staging.env`.
3. Verifies PostgreSQL, Redis, MinIO, media-gateway, host Nginx, and systemd are healthy before changing anything.
4. Fetches `origin/main` as the repository owner and verifies the requested release is reachable from `main` and descends from the current release.
5. Refuses automatic promotion if the release changes the GCP staging Compose, GCP staging environment contract, or reverse-proxy contract. Those releases must use the manual runbook.
6. Pulls exactly these immutable images:
   - `ghcr.io/zxzxz143/vympel-backend:<sha>`
   - `ghcr.io/zxzxz143/vympel-storefront:<sha>`
   - `ghcr.io/zxzxz143/vympel-crm:<sha>`
7. Verifies the local image platform is `linux/amd64` and rejects a conflicting OCI revision label.
8. Runs both VM backup units:
   - `vympel-postgres-backup.service`
   - `vympel-minio-backup.service`
9. Refuses to continue if the unreconciled historical Liquibase row `2026-07-13-01-seed-accessory-split-categories` exists.
10. Creates a migration-only environment copy containing the new release SHA. The live `/etc/vympel/staging.env` is still unchanged at this point.
11. Runs the `migrate` service as a uniquely named detached container and polls the container state directly. This avoids depending on `docker compose run --rm` returning correctly after a completed migration.
12. Only after migration success, atomically switches `RELEASE_TAG` and `NEXT_PUBLIC_APP_RELEASE` in `/etc/vympel/staging.env`.
13. Promotes backend first and waits for the exact new image to become healthy.
14. Promotes storefront and CRM, then waits for both exact images to become healthy.
15. Runs local smoke checks.
16. Runs external edge/security checks:
    - storefront without Basic Auth -> `401`
    - CRM without Basic Auth -> `401`
    - CRM API on the public API host -> `404`
    - actuator on the public API host -> `404`
    - Swagger on the public API host -> `404`
    - public category API -> `200`
17. Runs `nginx -t` and requires zero failed systemd units.
18. Writes a non-secret deployment state directory under `/var/lib/vympel/deployments/<run-id>/`.

The script never uses `latest`, never mixes release SHAs, never runs `docker compose down`, and never recreates PostgreSQL/Redis/MinIO volumes.

## Automatic rollback boundary

The script performs an **application rollback**, not a database rollback.

If a failure happens after live application promotion starts, it:

1. Restores the exact pre-deploy `/etc/vympel/staging.env`.
2. Recreates only `backend`, `storefront`, and `crm` on the previous SHA with `--no-deps`.
3. Waits for all three old application services to become healthy.
4. Records rollback success/failure in the deployment state.

It does **not** automatically:

- run `liquibase rollback`;
- delete an applied Liquibase row;
- restore PostgreSQL from backup;
- restore MinIO from backup;
- run destructive down migrations.

If the migration phase completed before the later failure, the script prints an explicit warning that the database was not rolled back. The old application may be incompatible with a newly applied schema; if rollback health does not recover, stop and use the incident/manual database runbook.

This follows the database policy that failed releases are forward-fixed by default and restores are explicit incident decisions with an acknowledged data-loss window.

## State and evidence

Each run creates:

```text
/var/lib/vympel/deployments/<UTC-run-id>/
├── state.env
├── staging.env.before
├── staging.env.migration
├── staging.env.target
├── migration.log
├── vympel-postgres-backup.service.log
└── vympel-minio-backup.service.log
```

The directory is created under root-only permissions by the script's `umask 077`. Do not copy these files into Git.

`state.env` records the old/new SHA, phase, migration state, backup result, database changelog marker, final status, and rollback result when applicable. It does not intentionally record credentials.

## Failure behavior by phase

| Failure point | Live app changed? | DB may have changed? | Automatic action |
|---|---:|---:|---|
| Preflight / image pull | No | No | Stop; no rollback needed |
| Backup | No | No | Stop; no rollback needed |
| Liquibase history gate | No | No | Stop; manual review |
| Migration container exits non-zero | No | Possibly partially attempted; Liquibase transaction rules apply | Stop; do not promote application; no destructive rollback |
| Migration succeeds, env switch has not happened | No | Yes / possibly | Stop and warn; DB remains forward |
| Backend promotion fails | Yes | Yes / possibly | Restore env + old backend/storefront/CRM; verify health |
| Storefront/CRM promotion fails | Yes | Yes / possibly | Restore env + old backend/storefront/CRM; verify health |
| Edge/nginx/systemd smoke fails | Yes | Yes / possibly | Restore env + old backend/storefront/CRM; verify health |

## Required VM contract

Defaults can be overridden only through the script's documented `VYMPEL_*` environment variables, but the normal staging paths are:

```text
repository:       /opt/vympel/repository
live env:         /etc/vympel/staging.env
base compose:     /opt/vympel/repository/infrastructure/compose/compose.single-vm-staging.yml
host-port override:
/etc/vympel/compose.host-ports.yml
state root:       /var/lib/vympel/deployments
```

Required host tools include Bash, Docker Compose, Git, curl, flock, systemctl, journalctl, Nginx, awk, grep, sed, sha256sum, stat, and sudo.

The repository worktree must have no tracked modifications. The script fetches `origin/main` as the repository owner rather than as root so Git credentials and safe-directory rules stay consistent with the VM checkout.

## First-time rollout of this helper

This helper itself changes deployment automation. Do not use it to deploy the commit that first introduces it unless the operator has already reviewed and installed that exact script on the VM.

Recommended first activation:

1. Merge the helper PR after review/CI.
2. On the VM, update `/opt/vympel/repository` to that merged commit manually.
3. Run:

```bash
bash -n deployment/scripts/deploy-gcp-staging.sh
```

4. Confirm the two backup systemd units exist.
5. Do one controlled staging deployment with an already-known-good release or the next application-only release.
6. Keep the previous manual deployment runbook available until that rehearsal passes.

After the helper has been established on the VM, normal application-only releases can use the one-command flow.

## Known storefront ISR warning

The existing storefront can log `EROFS` while trying to write ISR/prerender output under `/app/.next/server/app` because the runtime root filesystem is read-only. This behavior was reproduced on both Next.js 16.2.12 and 16.3.4 and predates the Wildberries release.

The automated deployment script does not treat that pre-existing log line as a release failure; it relies on container health and HTTP smoke checks. Fix the ISR/read-only storage contract separately rather than disabling the container's read-only root filesystem during deployment.
