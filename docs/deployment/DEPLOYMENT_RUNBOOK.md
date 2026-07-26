# Deployment Runbook

For the self-contained Oracle Cloud Ampere A1 ARM64 staging target, use
`docs/deployment/ORACLE_STAGING_RUNBOOK.md` together with
`infrastructure/compose/compose.oracle-staging.yml`. This general runbook's
staging/production files assume externally managed data services and a
containerized TLS proxy; the Oracle variant intentionally owns bounded local
PostgreSQL, Redis, and MinIO while host Nginx terminates public traffic.

## Scope and safety

This runbook deploys three independently versioned containers with one full 40-character Git SHA. It does not provision infrastructure, publish images, or roll back database schema. Image publication is a separate manually guarded GitHub Actions operation documented in `GHCR_PUBLICATION.md`. Run deployment commands from the monorepo root on a trusted Linux deployment host with Docker Engine, Compose v2, `curl`, `awk`, `grep`, and `timeout`.

## Prerequisites

1. Use the canonical `ghcr.io/zxzxz143` registry and publish all images for the exact browser-visible API/media origins through the guarded release workflow.
2. Download the successful `published-release-manifest-<sha>` artifact and verify all three registry digests are real `sha256:` values. The committed example manifest is only a pre-publication template.
3. Copy the relevant `infrastructure/env/*.env.example` to an ignored `.env` file and replace every placeholder.
4. Store TLS certificates outside Git; set `TLS_CERT_DIR` to an absolute directory containing `fullchain.pem` and `privkey.pem`.
5. Provision private PostgreSQL, Redis, and S3-compatible storage. Complete the backup and restore prerequisites.
6. Confirm explicit storefront and CRM CORS origins, trusted proxy CIDRs, secure refresh-cookie policy, and server-only CMS revalidation secret.

## Release-candidate evidence

`v1.0.0-rc.1` points to remotely verified commit `954e8a3a659371ba0203369aec9d2fef968fab5b`, but it predates the sharp remediation and must never be moved. The authoritative historical CI runs are recorded in `REMOTE_CI_VERIFICATION.md`. Publish a new RC only after its exact commit passes the required component and full release gates. Do not deploy a build-only manifest: deployment requires all three full-SHA GHCR images, real registry digests, and the target-environment conditions below.

## GHCR pull access

Set `REGISTRY=ghcr.io/zxzxz143` and `RELEASE_TAG` to the exact full commit SHA. Public packages require no registry login. Private packages require a deployment-only credential with `read:packages`:

```sh
printf '%s' "$GHCR_READ_TOKEN" | docker login ghcr.io --username DEPLOY_ACCOUNT --password-stdin
```

Do not use an account password, a write token, or a credential stored in Compose/Git. Package visibility is a manual decision; see `GHCR_PUBLICATION.md`.

## Validate and deploy

```sh
deployment/scripts/validate-environment.sh /secure/vympel/staging.env
deployment/scripts/backup-check.sh /secure/vympel/staging.env
deployment/scripts/pull-images.sh infrastructure/compose/compose.staging.yml /secure/vympel/staging.env
deployment/scripts/verify-migrations.sh infrastructure/compose/compose.staging.yml /secure/vympel/staging.env
deployment/scripts/deploy.sh infrastructure/compose/compose.staging.yml /secure/vympel/staging.env
deployment/scripts/smoke-test.sh /secure/vympel/staging.env
```

The migration job runs first and exits only after Liquibase can read the changelog table. Normal backend replicas run with Liquibase disabled. Deploy waits on bounded health checks. The reverse proxy is the only published service.

## ADMIN initial setup

Production bootstrap is disabled by default. For a first controlled setup only:

1. Provision temporary `VYMPEL_BOOTSTRAP_ADMIN_EMAIL`, `VYMPEL_BOOTSTRAP_ADMIN_PASSWORD`, and `VYMPEL_BOOTSTRAP_ADMIN_NAME` values through the secret manager.
2. Set `VYMPEL_BOOTSTRAP_ADMIN_ENABLED=true` for one controlled deployment.
3. Verify CRM login and ADMIN authorization; confirm exactly one ADMIN exists.
4. Set `VYMPEL_BOOTSTRAP_ADMIN_ENABLED=false`.
5. Remove or rotate the temporary password secret.
6. Redeploy with bootstrap disabled, then verify the user remains and its password hash is unchanged.

Never store the password in Git, image layers, workflow inputs, Compose source, logs, or the release manifest.

## Rollback

Application rollback requires the previous known-good full commit SHA:

```sh
deployment/scripts/rollback.sh infrastructure/compose/compose.production.yml /secure/vympel/production.env PREVIOUS_40_CHARACTER_SHA
```

This changes only the three application images and runs health/smoke checks. It does not reverse Liquibase changes. If a new schema is incompatible, stop rollout and ship a forward-fix changeset or restore into a separately approved recovery database according to the database and backup runbooks.

Retain the current SHA/digests, the known-good rollback SHA/digests, and every approved manifest. Delete only unreferenced GHCR versions after checking all manifests and environments; never move an RC tag or use `latest` as a cleanup/deployment shortcut.

## Stop conditions

Stop before production if any image digest is missing, an environment placeholder remains, restore evidence is stale, migration drift exists, the known historical changeset is unexplained, a health/smoke check fails, CMS revalidation is unproven, or alert ownership is absent.
