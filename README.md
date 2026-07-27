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

The CI workflows repeat these checks and build three images tagged with the full commit SHA. GHCR publication is manual: `release-images.yml` logs in only for `workflow_dispatch` with `publish_images=true`, only after the same-commit Full Release Gate passes, and uses the repository-provided `GITHUB_TOKEN`. A guarded publication creates one OCI index per tag with both `linux/amd64` and `linux/arm64`; separate runtime jobs prove both platforms before the published manifest is emitted.

Canonical packages:

- `ghcr.io/zxzxz143/vympel-backend`
- `ghcr.io/zxzxz143/vympel-storefront`
- `ghcr.io/zxzxz143/vympel-crm`

Every published set includes the full SHA tag. An optional existing release tag must point to the same commit; `latest` is never published as a deployment tag. The workflow builds amd64 and ARM64 image children on native GitHub-hosted runners, assembles one OCI index, adds traceability labels and signed provenance/SBOM attestations, captures both child digests, pulls and inspects the SHA references, runs isolated amd64 and emulated ARM64 Compose health checks, and emits a consolidated release-manifest artifact. See [GHCR publication](docs/deployment/GHCR_PUBLICATION.md) and [multi-architecture verification](docs/deployment/MULTI_ARCH_IMAGE_VERIFICATION.md).

## Deployment model

- Local: `compose.yml`, buildable source images, local data services.
- Staging: `infrastructure/compose/compose.staging.yml`, immutable prebuilt images, external secrets and data services.
- Production: `infrastructure/compose/compose.production.yml`, immutable prebuilt images, explicit backup/restore and approval gates.
- Oracle ARM64 staging: `infrastructure/compose/compose.oracle-staging.yml`, a bounded single-VM stack with private PostgreSQL/Redis/MinIO, a finite migration job, and loopback-only application ports behind host Nginx.

Start with [the deployment runbook](docs/deployment/DEPLOYMENT_RUNBOOK.md). For the Ampere A1 target, use the separate [Oracle staging runbook](docs/deployment/ORACLE_STAGING_RUNBOOK.md). Populate a non-committed environment file from `infrastructure/env/*.env.example`, set `REGISTRY=ghcr.io/zxzxz143`, and use a verified immutable RC or full SHA as `RELEASE_TAG`. `deployment/release-manifest.example.yml` is the pre-publication template; the verified `v1.0.0-rc.2` publication record is [deployment/releases/v1.0.0-rc.2.yml](deployment/releases/v1.0.0-rc.2.yml).

`NEXT_PUBLIC_SITE_URL` is the browser-safe canonical storefront origin. It is required at storefront build time because Next.js compiles canonical and language-alternate metadata into output; the same value is retained at runtime for dynamic sitemap and robots responses. The storefront/CRM API and media values are also compiled public configuration. The publication manifest records the exact contract, and an operator must match it at deployment; changing runtime `NEXT_PUBLIC_*` values does not rewrite an existing browser bundle.

## ADMIN bootstrap

The backend can create one initial ADMIN from `VYMPEL_BOOTSTRAP_ADMIN_*` variables. It is disabled by default. It never promotes an existing non-admin and never resets an existing ADMIN password. In production, enable it for one controlled deployment only, verify login, disable it, remove or rotate the temporary secret, and redeploy.

Do not commit working environment files, credentials, TLS private keys, database dumps, release secret material, or Docker credentials. Do not edit already-applied Liquibase changesets; use a new forward-fix changeset.

## Release status

Release candidate `v1.0.0-rc.2` points to exact commit `633db42643d42ee6448919b5f6b6b16a7da1ca17`. The exact commit passed backend, storefront, CRM, performance, Full Release Gate, and build-only image workflows; the tag-triggered Full Release Gate also passed. Manual Release Images run [30208034635](https://github.com/ZxZxZ143/vympel/actions/runs/30208034635) then published, attested, pulled, inspected, and health-checked the three public GHCR images. Their registry digests are preserved in [the published manifest](deployment/releases/v1.0.0-rc.2.yml); no external deployment ran.

The browser-visible storefront and CRM URLs compiled into this RC use loopback rehearsal values. The images prove registry and runtime behavior but are not approved for external staging or production; use a new immutable tag and rebuild after final public origins are approved. The older `v1.0.0-rc.1` remains unchanged at `954e8a3a659371ba0203369aec9d2fef968fab5b`.

The provider-independent baseline includes SEO, local PostgreSQL backup/restore proof, real signed CMS revalidation/retry proof, validated Prometheus examples, an isolated reverse-proxy rehearsal, and verified GHCR publication/runtime evidence. Production remains **NOT READY** until the historical Liquibase condition is accountably accepted for any target database that contains it and the provider, final domains, final-origin image rebuild, managed data services, secret manager, public TLS/trusted proxies, monitoring/alerts, and real staging deployment are selected and proven.
