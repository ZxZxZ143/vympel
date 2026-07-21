# Deployment Preparation Verification

## Scope

This report records repository-local verification for the provider-neutral deployment implementation. It does not claim an external deployment, registry push, cloud-resource creation, target TLS proof, or production approval.

## Implementation inventory

| Area | Artifact | Status |
| --- | --- | --- |
| Images | `vympel_back/Dockerfile`, `vympel_front/Dockerfile`, `vympel_crm/Dockerfile` | Implemented; three independent non-root multi-stage images |
| Context controls | Three `.dockerignore` files | Implemented |
| Local | `compose.yml` | Preserved |
| Staging/production | `infrastructure/compose/*.yml`, `infrastructure/env/*.env.example` | Implemented; immutable application refs and external data services |
| Proxy | `infrastructure/reverse-proxy/*` | Implemented; configurable domains and TLS |
| Operations | `deployment/scripts/*.sh`, release manifest | Implemented; bounded, provider-neutral, no destructive DB rollback |
| CI | Five required workflows | Implemented; path filters, non-publishing automatic full-SHA image evidence, guarded manual push |
| Runbooks | `docs/deployment/*` | Implemented |

## Verification record

No credential, token, password hash, or resolved Compose output is recorded.

### Backend and ADMIN

| Check | Exit | Result |
| --- | ---: | --- |
| `gradlew --no-daemon --console=plain test` | 0 | Full suite passed, including ADMIN, migration runner, and strict security coverage. |
| `gradlew --no-daemon --console=plain bootJar` | 0 | Deterministic `build/libs/vympel.jar` built. |
| Empty PostgreSQL 16 first start | 0 | All 77 Liquibase changes ran; exactly one enabled ADMIN with one ADMIN role was created and the password was encoded. |
| CRM `/api/crm/auth/login` then `/me` | 0 | Disposable configured account authenticated and returned enabled ADMIN identity. |
| Enabled restart | 0 | ADMIN/user-role cardinality stayed `1:1`; password hash and user update timestamp were unchanged. |
| Disabled restart | 0 | Account, role, hash, and update timestamp remained unchanged; bootstrap performed no write. |
| Disposable cleanup | 0 | Verification container and database were removed; the intended local stack remained running. |
| Migration-only image job | 0 | Verified 77 applied changes; latest ID `2026-07-19-02-update-public-image-paths-to-webp`; context closed cleanly. |

The first migration-only preflight showed that `spring.main.web-application-type=none` is incompatible with the existing `SecurityConfig` because `HttpSecurity` is required. Deployment Compose was corrected to keep the normal application type, publish no migration port, disable scheduling, and rely on the finite runner to close the context. The corrected job passed.

### Storefront and CRM

| Application | Clean install | Lint | Typecheck | Tests | Audit | Build | Budget |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Storefront | 662 packages | pass | pass | 12 files / 34 tests | 0 vulnerabilities | Next 16.2.10, 34 routes including robots/sitemap | 1.34 MiB JS / 1.65 MiB |
| CRM | 387 packages | pass | pass | 8 files / 25 tests | 0 vulnerabilities | Next 16.2.10, 17 routes | 1.09 MiB JS / 1.40 MiB |

React and React DOM are pinned at the patched 19.2.4 floor. Node 22/Linux regenerated both portable lockfiles after Windows npm 11 removed Linux/WASI optional peer entries; subsequent local clean installs and Docker `npm ci` both passed.

### Images

| Image | Local verification image ID | Approx. size | Runtime | Result |
| --- | --- | ---: | --- | --- |
| `vympel-backend` | `sha256:65228d906ddfac523565ba0a781c5a5c587adf53da8d7bb994498c1f6c4adac9` | 183 MB | `vympel` non-root, Java 17 JRE | build, restored-DB readiness, and CMS integration passed |
| `vympel-storefront` | `sha256:a93a2be21103b67817bced4d1e4158d805cdd4c55d34620b7ed85c7037190ab6` | 86 MB | `node` non-root, standalone Node 22 | build, health, signed freshness/retry, SEO passed |
| `vympel-crm` | `sha256:4d6595f2f368c779377cae747103e92063e54421b1c1e9a2d8cdbce98bcbb86a` | 77 MB | `node` non-root, standalone Node 22 | build, login health, noindex passed |

These are local verification tags only. No registry push occurred. Release workflows use the full Git commit SHA rather than these local tags.

### Infrastructure and CI

| Check | Exit | Result |
| --- | ---: | --- |
| Local/staging/production `docker compose config --quiet` | 0 / 0 / 0 | All three configurations resolve. Deployment app refs are immutable and only proxy ports are published. |
| `sh -n deployment/scripts/*.sh` | 0 | All ten POSIX deployment scripts parse. |
| Example environment validation | expected nonzero | Both placeholder templates fail closed before deployment. |
| YAML parse | 0 | All workflow, Compose, and release-manifest YAML parses. |
| `actionlint` 1.7.7 | 0 | All GitHub Actions workflows pass semantic and embedded shell checks. |
| `promtool` 3.5.0 | 0 | Prometheus configuration and all seven alert rules parse. |
| `nginx -t` using generated one-day test certificate and local upstream aliases | 0 | Proxy syntax succeeds; temporary certificate was removed. |
| Standalone image smoke resources | 0 | Temporary storefront/CRM containers were removed. |

The local Compose source was preserved. Its already-running services were observed healthy; no local data volume was reset. Deployment environment examples intentionally contain only invalid placeholders and all-zero example SHAs.

### Secret and generated-file gate

The final staged-index scan and disposition are recorded in `docs/cleanup/PRE_COMMIT_SECRET_REPORT.md`. Real `.env` files remained ignored, no browser-exposed secret-bearing `NEXT_PUBLIC_*` key was found, and no private key, provider token, Docker credential, dump, dependency tree, build output, or temporary verification resource is intended for the implementation commit.

## Production blockers

Repository preparation now resolves the provider-independent SEO, local restore, CMS freshness/retry, reverse-proxy flow, and observability-configuration gates. Production is still **NOT READY** until final hosting/domains, registry credentials and digests, managed PostgreSQL restore proof, Redis TLS/ACL/private networking, object-storage versioning/backup, secret manager, public TLS/trusted proxies, monitoring/alert delivery, and real staging are selected and demonstrated.

The exact artifact for historical Liquibase condition `2026-07-13-01-seed-accessory-split-categories` was not recoverable. Any target database containing that row is formally blocked until the fail-closed compatibility script matches a separate accountable acceptance record; no applied history was edited or invented.
