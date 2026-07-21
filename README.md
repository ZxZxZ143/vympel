# Vympel Monorepo

Vympel is a three-application commerce system maintained in one root Git repository:

- `vympel_front` — RU/KZ/EN public storefront (Next.js, port 3000).
- `vympel_crm` — internal CRM (Next.js, port 3001).
- `vympel_back` — public and CRM APIs (Spring Boot, port 8080).

The applications remain independently buildable and deployable as `vympel-storefront`, `vympel-crm`, and `vympel-backend`. There is no combined application image.

## Local development

1. Copy `.env.example` to the ignored `.env` and replace local placeholders.
2. Run `docker compose up --build`.
3. Check storefront at `http://localhost:3200/ru`, CRM at `http://localhost:3201/login`, and backend readiness at `http://localhost:8080/actuator/health/readiness`.

Local Compose owns PostgreSQL, Redis, and MinIO. Staging and production Compose files intentionally expect externally managed equivalents and publish only the reverse proxy.

## Finite checks

```text
vympel_back\gradlew.bat test
vympel_back\gradlew.bat bootJar
cd vympel_front && npm ci && npm run lint && npm run typecheck && npm test && npm run build
cd vympel_crm && npm ci && npm run lint && npm run typecheck && npm test && npm run build
docker compose -f compose.yml config --quiet
```

The CI workflows repeat these checks and build three images tagged with the full commit SHA. Registry push is manual and remains doubly disabled until a registry, credentials, and the repository variable `VYMPEL_REGISTRY_PUSH_ENABLED=true` are configured.

## Deployment model

- Local: `compose.yml`, buildable source images, local data services.
- Staging: `infrastructure/compose/compose.staging.yml`, immutable prebuilt images, external secrets and data services.
- Production: `infrastructure/compose/compose.production.yml`, immutable prebuilt images, explicit backup/restore and approval gates.

Start with [the deployment runbook](docs/deployment/DEPLOYMENT_RUNBOOK.md), populate a non-committed environment file from `infrastructure/env/*.env.example`, and record the exact image digests and full Git SHA in a copy of `deployment/release-manifest.example.yml`.

## ADMIN bootstrap

The backend can create one initial ADMIN from `VYMPEL_BOOTSTRAP_ADMIN_*` variables. It is disabled by default. It never promotes an existing non-admin and never resets an existing ADMIN password. In production, enable it for one controlled deployment only, verify login, disable it, remove or rotate the temporary secret, and redeploy.

Do not commit working environment files, credentials, TLS private keys, database dumps, release secret material, or Docker credentials. Do not edit already-applied Liquibase changesets; use a new forward-fix changeset.

## Release status

The repository is prepared for provider-neutral staging. Production remains **NOT READY** until the provider, final domains, container registry, managed PostgreSQL, object storage, secrets manager, TLS, restore rehearsal, CMS revalidation, and monitoring/alerting are selected and proven in the target environment.
