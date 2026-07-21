# Deployment Runbook

## Scope and safety

This runbook deploys three independently versioned containers with one full 40-character Git SHA. It does not provision infrastructure, push images, or roll back database schema. Run from the monorepo root on a trusted Linux deployment host with Docker Engine, Compose v2, `curl`, `awk`, `grep`, and `timeout`.

## Prerequisites

1. Select a registry and build all images for the exact browser-visible API/media origins.
2. Record image references and digests in a private copy of `deployment/release-manifest.example.yml`.
3. Copy the relevant `infrastructure/env/*.env.example` to an ignored `.env` file and replace every placeholder.
4. Store TLS certificates outside Git; set `TLS_CERT_DIR` to an absolute directory containing `fullchain.pem` and `privkey.pem`.
5. Provision private PostgreSQL, Redis, and S3-compatible storage. Complete the backup and restore prerequisites.
6. Confirm explicit storefront and CRM CORS origins, trusted proxy CIDRs, secure refresh-cookie policy, and server-only CMS revalidation secret.

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

1. Put a temporary strong password and ADMIN identity in the secret manager.
2. Set `VYMPEL_BOOTSTRAP_ADMIN_ENABLED=true` for one deployment.
3. Verify exactly one ADMIN exists and CRM login works.
4. Set bootstrap to `false`, remove or rotate the temporary secret, and redeploy.
5. Verify the user remains and its password hash is unchanged.

Never store the password in Git, image layers, workflow inputs, Compose source, logs, or the release manifest.

## Rollback

Application rollback requires the previous known-good full commit SHA:

```sh
deployment/scripts/rollback.sh infrastructure/compose/compose.production.yml /secure/vympel/production.env PREVIOUS_40_CHARACTER_SHA
```

This changes only the three application images and runs health/smoke checks. It does not reverse Liquibase changes. If a new schema is incompatible, stop rollout and ship a forward-fix changeset or restore into a separately approved recovery database according to the database and backup runbooks.

## Stop conditions

Stop before production if any image digest is missing, an environment placeholder remains, restore evidence is stale, migration drift exists, the known historical changeset is unexplained, a health/smoke check fails, CMS revalidation is unproven, or alert ownership is absent.
