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

The CI workflows repeat these checks and build three images tagged with the full commit SHA. GHCR publication is manual: `release-images.yml` logs in only for `workflow_dispatch` with `publish_images=true`, only after the same-commit Full Release Gate passes, and uses the repository-provided `GITHUB_TOKEN`.

Canonical packages:

- `ghcr.io/zxzxz143/vympel-backend`
- `ghcr.io/zxzxz143/vympel-storefront`
- `ghcr.io/zxzxz143/vympel-crm`

Every published set includes the full SHA tag. An optional existing release tag must point to the same commit; `latest` is never published as a deployment tag. The workflow adds OCI traceability labels, provenance/SBOM attestations, captures registry digests, pulls and inspects the SHA references, runs an isolated published-image Compose health check, and emits a consolidated release-manifest artifact. See [GHCR publication](docs/deployment/GHCR_PUBLICATION.md) for the guarded first-publication, visibility, authentication, rollback, and retention procedures.

## Deployment model

- Local: `compose.yml`, buildable source images, local data services.
- Staging: `infrastructure/compose/compose.staging.yml`, immutable prebuilt images, external secrets and data services.
- Production: `infrastructure/compose/compose.production.yml`, immutable prebuilt images, explicit backup/restore and approval gates.

Start with [the deployment runbook](docs/deployment/DEPLOYMENT_RUNBOOK.md), populate a non-committed environment file from `infrastructure/env/*.env.example`, set `REGISTRY=ghcr.io/zxzxz143`, and use the full commit SHA as `RELEASE_TAG`. `deployment/release-manifest.example.yml` is the pre-publication template; a successful publishing run emits a separate manifest whose three registry digests must contain no pending values.

`NEXT_PUBLIC_SITE_URL` is the browser-safe canonical storefront origin. It is required at storefront build time because Next.js compiles canonical and language-alternate metadata into output; the same value is retained at runtime for dynamic sitemap and robots responses. Do not substitute a final domain until it is approved.

## ADMIN bootstrap

The backend can create one initial ADMIN from `VYMPEL_BOOTSTRAP_ADMIN_*` variables. It is disabled by default. It never promotes an existing non-admin and never resets an existing ADMIN password. In production, enable it for one controlled deployment only, verify login, disable it, remove or rotate the temporary secret, and redeploy.

Do not commit working environment files, credentials, TLS private keys, database dumps, release secret material, or Docker credentials. Do not edit already-applied Liquibase changesets; use a new forward-fix changeset.

## Release status

Release candidate `v1.0.0-rc.1` points to exact commit `954e8a3a659371ba0203369aec9d2fef968fab5b`. That commit passed the required real GitHub backend, storefront, CRM, full-release, performance, and non-publishing three-image workflows; see [remote CI verification](docs/deployment/REMOTE_CI_VERIFICATION.md). No image was published and no external deployment ran.

The later sharp remediation must not be represented by moving `v1.0.0-rc.1`. Its first GHCR release requires a new remotely verified RC tag such as `v1.0.0-rc.2`.

The provider-independent baseline includes SEO, local PostgreSQL backup/restore proof, real signed CMS revalidation/retry proof, validated Prometheus examples, and an isolated reverse-proxy rehearsal. Production remains **NOT READY** until the historical Liquibase condition is accountably accepted for any target database that contains it and the provider, final domains, registry and image digests, managed data services, secret manager, public TLS/trusted proxies, monitoring/alerts, and real staging deployment are selected and proven.
