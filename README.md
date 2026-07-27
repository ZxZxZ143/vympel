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
- Single-VM staging: `infrastructure/compose/compose.single-vm-staging.yml`, provider-neutral bounded PostgreSQL/Redis/MinIO plus all three apps behind host Nginx; the GCP operator path is documented separately.
- Oracle ARM64 staging: `infrastructure/compose/compose.oracle-staging.yml`, a bounded single-VM stack with private PostgreSQL/Redis/MinIO, a finite migration job, and loopback-only application ports behind host Nginx.

Start with [the deployment runbook](docs/deployment/DEPLOYMENT_RUNBOOK.md). Use the [GCP single-VM staging runbook](docs/deployment/GCP_STAGING_RUNBOOK.md) for Compute Engine or the separate [Oracle staging runbook](docs/deployment/ORACLE_STAGING_RUNBOOK.md) for Ampere A1. Populate a non-committed environment file from `infrastructure/env/*.env.example`, set `REGISTRY=ghcr.io/zxzxz143`, and use a verified immutable RC or full SHA as `RELEASE_TAG`. `deployment/release-manifest.example.yml` is the pre-publication template; the complete amd64/ARM64 evidence record is [deployment/releases/v1.0.0-rc.7.yml](deployment/releases/v1.0.0-rc.7.yml), while [deployment/releases/v1.0.0-rc.2.yml](deployment/releases/v1.0.0-rc.2.yml) preserves the earlier amd64-only baseline.

`NEXT_PUBLIC_SITE_URL` is the browser-safe canonical storefront origin. It is required at storefront build time because Next.js compiles canonical and language-alternate metadata into output; the same value is retained at runtime for dynamic sitemap and robots responses. The storefront/CRM API and media values are also compiled public configuration. The publication manifest records the exact contract, and an operator must match it at deployment; changing runtime `NEXT_PUBLIC_*` values does not rewrite an existing browser bundle.

## ADMIN bootstrap

The backend can create one initial ADMIN from `VYMPEL_BOOTSTRAP_ADMIN_*` variables. It is disabled by default. It never promotes an existing non-admin and never resets an existing ADMIN password. In production, enable it for one controlled deployment only, verify login, disable it, remove or rotate the temporary secret, and redeploy.

Do not commit working environment files, credentials, TLS private keys, database dumps, release secret material, or Docker credentials. Do not edit already-applied Liquibase changesets; use a new forward-fix changeset.

## Release status

Release candidate `v1.0.0-rc.7` points to exact commit `477d32b36e817bb92b7000e94851e5756a186d9c`. Performance, Full Release Gate, build-only image, and tag-triggered gate runs passed. Manual Release Images run [30231792115](https://github.com/ZxZxZ143/vympel/actions/runs/30231792115) published one amd64/ARM64 OCI index for each application, attached signed provenance, recorded all index/child digests, and passed exact-image amd64 and ARM64 runtime rehearsals. The registry record is preserved in [the published manifest](deployment/releases/v1.0.0-rc.7.yml); no external deployment ran.

The browser-visible storefront and CRM values compiled into RC.7 use explicitly acknowledged reserved `.invalid` origins, and its storefront server bundle still contains the former local-development media pattern. This safely proves publication/runtime behavior but makes RC.7 evidence-only and prohibited from external staging or production. The source now limits that localhost pattern to explicit local builds; approve the real domains and publish a later immutable candidate rather than changing runtime `NEXT_PUBLIC_*` values or moving this tag. The verified amd64-only `v1.0.0-rc.2` and all intervening failure-evidence tags remain unchanged.

The provider-independent baseline includes SEO, local PostgreSQL backup/restore proof, real signed CMS revalidation/retry proof, validated Prometheus examples, an isolated reverse-proxy rehearsal, and verified GHCR publication/runtime evidence. Production remains **NOT READY** until the historical Liquibase condition is accountably accepted for any target database that contains it and the provider, final domains, final-origin image rebuild, managed data services, secret manager, public TLS/trusted proxies, monitoring/alerts, and real staging deployment are selected and proven.
