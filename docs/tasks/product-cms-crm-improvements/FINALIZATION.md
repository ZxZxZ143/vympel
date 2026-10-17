# Catalog / CMS / CRM finalization

Date: 2026-10-17. Task branch: `codex/product-cms-crm-improvements`.

This record captures local readiness before GitHub merge/publication. It supersedes the older local test counts in IMPLEMENTATION, REFINEMENT and CHARACTERISTIC_PICKERS. Exact task/main commits, workflow conclusions and registry digests must be read from the final task report and same-SHA GitHub workflow artifacts; this document does not claim a future publication succeeded.

## Integrated review

- Discounts retain the base `price`, store nullable `discount_percent` from 1 through 99, and derive whole-KZT half-up `finalPrice` consistently in public detail/list/search/recommendation/batch and CRM DTOs. Per-product mutation does not rewrite other model variants. CRM quick save/clear validates and guards duplicate requests. Cards, favorites, cart, JSON-LD and refreshed WhatsApp checkout use customer prices. Existing base-price filter/sort semantics remain unchanged.
- Product deletion locks and accepts ARCHIVED only, preserves the existing owned-row lifecycle and queues object deletion through the outbox. Shared product/CMS media blocks cleanup. Collections and all 15 allowed custom reference types lock and reject any saved-product dependency. Canonical data, RBAC, transactional CRM audit and safe error codes are preserved.
- All 21 creatable characteristic fields plus collections use one searchable single/multiple picker in create/edit/bulk. Trash is independent of selection; exact localized confirmation, cancel, synchronous busy guard and errors are reused. Only successful deletion filters the shared cache and matching unsaved IDs; no automatic product save/reset/refetch occurs. Original storefront price typography remains intact.
- CMS banners resolve selected category, nearest published ancestor, generic published banner, then existing static fallback. Parent changes affect inheriting descendants; explicit child overrides stay independent. Removing a child override restores inheritance through existing CMS publication/media/revalidation flows.
- Storage notice text distinguishes NEXT_LOCALE, cart/favorites/preferences localStorage and optional analytics sessionStorage. Optional product analytics and performance metrics require consent; withdrawal disables them. Existing minimal operational error reporting remains independent. The notice retains responsive mobile navigation/checkout clearance.

## Liquibase

File: `vympel_back/src/main/resources/db/changelog/2026-10-17-01-product-discounts.xml`.

Identity: `2026-10-17-01-product-discounts`, author `codex`. Last include in the existing master. Adds one nullable integer column and CHECK 1..99; it does not clean products, references or collections. Rollback refuses to discard non-null discounts. All historical changeset files are unchanged.

The new `ProductDiscountMigrationTest` uses a fresh PostgreSQL 16 Testcontainer. It first runs the prior full changelog, inserts DRAFT/ACTIVE/ARCHIVED products, then applies the new full chain. It compares old history identities and MD5 checksums, complete product rows (excluding the new column), reference counts, default null values, direct invalid-write rejection, valid bounds, null clearing and repeat-run idempotence. No real database was used.

## Release security blockers resolved

The mandatory npm audit surfaced new advisories against the prior dependency baseline. Both apps now use Next/eslint-config-next 16.3.8, Vitest 4.1.12, sharp 0.35.5, brace-expansion 5.0.12 and resolved source-map-js 1.2.2. The existing minimatch compatibility patch and shared sharp security floor were updated accordingly. Audit severity and workflow checks were not reduced.

[Upstream braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) has no patched upstream release. The pinned alias `braces -> @dieub/braces-depth-guard@3.0.3-pn.0` was reviewed against the published upstream 3.0.3 source before installation. Its runtime changes add bounded parse/AST recursion, matching the [upstream proposed depth-guard patch](https://github.com/micromatch/braces/pull/72); no install hook or unrelated runtime code was introduced. SHA-512 integrity: `sha512-2d7F2tzyJQMbFhXcA274fgBz5T3uByP5AWlkjnEqXGDpBHCcw7GjuW2mFgXF04yQ3QeCpLXJ9XstRSHHjS4/5w==`.

This bootstrap derivative does not claim OIDC provenance. Acceptance is based on its pinned artifact, reviewed source diff and app-local postinstall tests of normal glob/range output and deep string/AST rejection. It is not represented as an upstream release, general glob resource bound or audit exemption. Replace it when a reviewed upstream fix exists. Both current npm audits report zero vulnerabilities.

CRM tests now await asynchronous confirmation completion before Escape and identify labelled field buttons separately from same-labelled dialogs. This fixes test timing/selector assumptions without weakening assertions or increasing global timeouts.

## Local verification results

| Check | Result |
| --- | --- |
| Java 17 full finite test suite and bootJar | 76 suites; 345 discovered, 344 passed, 1 skipped; zero failures/errors; JAR built |
| Backend security/migration/discount/deletion/CMS/reference coverage | Included and passed in the full suite, including real PostgreSQL and Redis Testcontainers |
| Storefront Vitest | 42 files / 177 passed |
| CRM Vitest | 20 files / 153 passed |
| Both apps lint / typecheck / production build | Passed |
| Both apps CSP/security-header and sharp checks | Passed |
| Both apps glob postinstall guard checks | Passed |
| Both apps npm audit --audit-level=high | Passed, zero reported vulnerabilities |
| Storefront production HTTP/status/indexing matrix | Passed: 200/404/temporary-failure semantics, RU/KZ/EN, security headers, preview noindex |
| CRM production response-header test | Passed |
| Bundle / asset gate | Passed: storefront 1.26/1.65 MiB; CRM 1.51/1.53 MiB; public assets 8.90/24 MiB |
| Published manifest fixture / Liquibase history gate | Passed |
| git diff --check | Passed |

Only `Step7ExternalDatabaseRehearsalTest` was skipped: it requires explicit external-database settings and access, which this publication-only task does not authorize. Earlier 21-container-skip limitations no longer apply. Final logs/results remain in ignored `.cache/final-release/`; they are not committed with secrets or runtime artifacts.

## Git and immutable release boundary

The work began at `bf670ad` with accumulated uncommitted task changes. Fetch found `origin/main` advanced to `45366a4fc846eb529194279fef36ffedfebf1547` with project-navigation documentation only. Preserve that main update; do not merge any unrelated task/automation branch.

Stage only the reviewed feature files, three intended CRM preview assets, tests, docs, migration and necessary dependency-security fixes. Exclude env files, credentials, caches, logs, screenshots and database backups. Create/update the task PR, wait for required CI, merge the reviewed task into main and fetch/synchronize local main.

Use the final merged lowercase 40-character main SHA for all three GHCR packages. Automatic Release Images push runs are build-only. Publication requires the existing manual `publish_images=true` workflow, which runs its own same-SHA Full Release Gate, collision preflight, native multi-platform builds, index attestations, digest checks and isolated amd64/ARM64 verification. Wait for SUCCESS and verify the consolidated published manifest; triggering a run is not completion.

Build inputs: storefront `https://preview.vympel.kz`, public API `https://api.vympel.kz/api/public`, media `https://api.vympel.kz`, CRM API `https://x7m2q9k4n6p8.vympel.kz/api/crm`, environment staging, telemetry false, indexing false. No mutable release tag or `latest`; no overwrite of existing SHA tags. Keep registry-generated evidence in the workflow artifacts/final report without creating a later main commit that would invalidate the requested main-HEAD/release-SHA equality.

No VM/server deployment, SSH, staging/production migration, DNS/Nginx/configuration/secret edit or server-container restart is part of this task. Disposable local/CI databases are verification fixtures only.
