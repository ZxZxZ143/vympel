# Release Candidate Verification

Date: 2026-07-22
Candidate: `v1.0.0-rc.1`
Status: provider-independent local and remote CI gates passed; tag published; provider-specific production conditions remain open.

## Preserved starting state

- Baseline commit: `0fd2f14f75021aab8eafcd4c6f34739d3d1a3418`.
- Deployment implementation commit: `af6d1926c7630773d1d7d948016f713d356b3e5f`.
- Historical Git backup: `E:\vympel_git_backup_20260721_183725`, verified intact and never added to the repository.
- ADMIN bootstrap implementation and exact four-variable contract are preserved. Full backend tests passed; production remains disabled by default.

## Post-candidate sharp security remediation

The current branch contains a verified local remediation for the high-severity libvips advisories inherited through `next@16.2.10 -> sharp@0.34.5` in both storefront and CRM. A Next-scoped npm override selects stable `sharp@^0.35.0`, currently locked at 0.35.3; no framework/runtime package was downgraded, the high-severity audit gate remains enabled, and a shared CI assertion rejects installed `sharp` versions below 0.35.0. Clean audits, application gates, Linux/amd64 image builds, healthy containers, libvips 8.18.3 WebP/AVIF transforms, and local/remote Next image optimization passed. Remote gates are pending the normal fix push.

This change is intentionally not represented by `v1.0.0-rc.1`, whose immutable target remains `954e8a3a659371ba0203369aec9d2fef968fab5b`. Do not move that tag. If release-candidate packaging is requested after the new commit passes remote CI, create a new candidate such as `v1.0.0-rc.2` and record its exact verified SHA.

## Provider-independent release gates

| Area | Result | Evidence |
| --- | --- | --- |
| Backend full tests | PASS | 161 tests / 1 skipped on a fresh disposable PostgreSQL 16 database, 2026-07-22 |
| Backend executable JAR | PASS | Gradle `bootJar` |
| ADMIN regression | PASS | Included in full suite; controlled procedure added to staging/production checklists |
| Canonical Liquibase clean path | PASS | 77 changes, latest `2026-07-19-02-update-public-image-paths-to-webp` |
| Historical Liquibase condition | BLOCKED WHEN ROW EXISTS | Exact artifact unrecoverable; fail-closed external acceptance gate and four-path compatibility test pass |
| Storefront clean install | PASS | 662 packages |
| Storefront lint/typecheck/tests/audit/build | PASS | 12 files / 34 tests; 0 vulnerabilities; 34 production routes |
| Storefront SEO | PASS | Canonical/alternates, active-only sitemap, unavailable-backend failure, robots tests |
| CRM clean install | PASS | 387 packages |
| CRM lint/typecheck/tests/audit/build | PASS | 8 files / 25 tests; 0 vulnerabilities; 17 production routes |
| CRM crawler policy | PASS | Global `noindex, nofollow` unit verification |
| Frontend budgets | PASS | Storefront 1.34/1.65 MiB; CRM 1.09/1.40 MiB; assets 7.33/24 MiB |
| Backend image | PASS | `sha256:65228d906ddfac523565ba0a781c5a5c587adf53da8d7bb994498c1f6c4adac9` |
| Storefront image | PASS | `sha256:a93a2be21103b67817bced4d1e4158d805cdd4c55d34620b7ed85c7037190ab6` |
| CRM image | PASS | `sha256:4d6595f2f368c779377cae747103e92063e54421b1c1e9a2d8cdbce98bcbb86a`; `/login` HTTP 200 |
| Local/staging/production Compose | PASS | All three `config --quiet` checks |
| Backup/restore | PASS | final-postmaster rerun `aaeaae0e31b6`; `BACKUP_RESTORE_REHEARSAL_REPORT.md` |
| CMS signed freshness/retry | PASS | final-postmaster rerun `02d552977bfa`; `CMS_REVALIDATION_INTEGRATION_REPORT.md` |
| Reverse proxy | PASS | Rehearsal `2434c49c8067`; second consecutive pass after command-resolution and bounded upstream-readiness corrections |
| Prometheus/rules | PASS | `promtool` 3.5.0; one config and seven rules |
| Workflow semantics | PASS | pinned actionlint 1.7.7 |
| Release image policy | PASS | relevant `main` changes build full-SHA images without publication; registry push remains manually and externally guarded |
| YAML and script syntax | PASS | Psych syntax parsing, eleven POSIX scripts, three PowerShell rehearsals, Node gateway |
| Secret/generated artifact scan | PASS | gitleaks 8.28.0 scanned the exact staged index with redacted output; no leaks found; generated/dependency/dump/key inventory passed |
| Remote GitHub CI | PASS | Exact SHA passed backend, storefront, CRM, full release, performance, and non-publishing release-image workflows; `REMOTE_CI_VERIFICATION.md` |
| Immutable RC manifest | PASS WITH PENDING REGISTRY DATA | Full-gate artifact `full-release-gate-954e8a3a659371ba0203369aec9d2fef968fab5b`, ID `8510711242`, identifies three full-SHA images; registry repositories and image digests intentionally remain pending |
| Release-candidate tag | PASS | Annotated `v1.0.0-rc.1` points to `954e8a3a659371ba0203369aec9d2fef968fab5b`, was pushed normally, and its Full Release Gate run `29870201605` passed all five jobs |

The image IDs above are local verification images, not registry digests. No image was pushed.

## Production-like rehearsal conclusions

- PostgreSQL 16.13 custom-format backup restored with matching 77-change/51-table summaries and zero unvalidated constraints; the current backend reached readiness on the restored database.
- A production storefront validated signed CMS delivery. Storefront unavailability and a 500 ms timeout both produced persistent retries that completed on attempt two and refreshed public HTML. Invalid HMAC returned 401 and no secret reached browser assets, HTML, or application logs.
- Nginx routing, forwarded headers, client IP chain, upload limit, API timeout, upstream security headers, Actuator blocking, invalid host rejection, redirect, and TLS syntax passed with an ephemeral self-signed certificate. Public certificate trust remains unclaimed.
- Provider-neutral Prometheus scrape and alert examples validate but no monitoring provider, alert route, or on-call owner has been configured.

## Remaining provider-specific conditions

Hosting, final domains, registry and image digests, managed PostgreSQL/provider restore, Redis, object storage, secret manager, monitoring/alert delivery, public TLS and trusted proxy CIDRs, and a real staging deployment remain pending. Production is not approved. Any upgrade database containing the unrecoverable historical changeset row also requires accountable external acceptance before migration.
