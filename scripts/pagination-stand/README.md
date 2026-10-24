# Disposable pagination stand (Windows)

This tooling exercises the existing feature against real PostgreSQL, Spring Boot and a production Next.js storefront. It does not intercept API responses or alter application contracts. The application implementation remains on `codex/catalog-brand-pagination-search-order`.

## Start / restart / stop

Prerequisites: installed storefront dependencies, a current `vympel_back/build/libs/vympel.jar` (`gradlew.bat bootJar`, Java 17), Node, and native PostgreSQL 16 or 18. Docker was unavailable for the verified run; only PostgreSQL 18.1 was installed. A fresh installation prefers 16; an existing owned cluster uses its recorded major version. `VYMPEL_DEMO_PG_BIN` can select the native binary directory. `JAVA_HOME` is used if set; otherwise the launcher finds a local `.jdks/*17*` installation or `java` on PATH.

Run from any directory:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "E:\vympel_full\scripts\pagination-stand\stand.ps1" Start
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "E:\vympel_full\scripts\pagination-stand\stand.ps1" Restart
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "E:\vympel_full\scripts\pagination-stand\stand.ps1" Status
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "E:\vympel_full\scripts\pagination-stand\stand.ps1" Stop
```

For storefront-only changes, use `stand.ps1 RefreshFrontend`: it builds a versioned copy beside the running storefront and switches only Node after success. It preserves the database/backend PIDs and does not seed. The successful directory is remembered in `frontend-path.txt`. Use `Restart -Rebuild` when a full rebuild/restart is needed. Restart reuses the built isolated storefront, copies the current backend jar, runs existing Liquibase migrations in the disposable database, and reapplies the idempotent seed. It leaves services running. Stop terminates only recorded Node/Java processes after checking PID, creation time and command-line path, then stops only the owned PostgreSQL data directory. It retains all data and build files; it never deletes volumes or other workspaces. A bare Start refuses recorded processes or occupied ports; use Restart for recovery after a partial startup.

For backend changes, run backend tests and `bootJar`, then use `stand.ps1 RefreshBackend`. It switches only the verified owned Java process; PostgreSQL, fixtures and the frontend remain in place. No reseed occurs.

## Boundaries and addresses

| Service | Address / storage |
| --- | --- |
| PostgreSQL | `127.0.0.1:55440/vympel_pagination_demo`, local-only role `pagination_demo` |
| Backend | `http://127.0.0.1:18080`, local Spring profile |
| Readiness | `http://127.0.0.1:18080/actuator/health/readiness` |
| Storefront | `http://127.0.0.1:3300/en/catalog` |
| Runtime/build/logs | `.cache/pagination-stand/` (gitignored) |
| Database directory | `.cache/pagination-stand/postgres/` |
| Process ownership | `.cache/pagination-stand/processes.json` plus disposable-directory marker |

The launcher never sources `.env`, staging files or deployment credentials. It clears inherited app configuration in its child shell and supplies synthetic local settings. PostgreSQL listens only on loopback with trust authentication for this disposable fixture. Redis/S3 services are unnecessary for these read-only flows; rate limiting uses memory, product images use the existing fallback, and revalidation, storage deletion, admin bootstrap and CMS/analytics/activity cleanup jobs are disabled. General health may include absent optional services; readiness explicitly verifies the database.

Storefront sources are copied without `.env`, `.next`, AGENTS.md or CLAUDE.md. The copy uses a junction to existing installed dependencies; no package versions are changed. Only the copied Next config gets a Turbopack filesystem root encompassing the copy and dependency junction. The generated standalone `server.js` runs with copied `public` and `.next/static` assets. Root builds do not replace the running stand's `.next`. The backend also runs a copied jar. Persistent operation is explicitly requested for this task; ordinary finite-test guidance remains unchanged.

## Fixture and safe cleanup

`seed.sql` runs in one transaction, refuses any other database/address/port and refuses unexpected products. It resolves real migrated brand/category codes, never imaginary IDs. SKU upserts keep product IDs and deterministic dates stable on repeat runs. All 100 products are ACTIVE, nonnegative-priced, valid-stock wrist watches with RU/EN/KK translations, descriptions and category relationships. Missing photos intentionally use the built-in fallback.

| Brand | Products | Page sizes (15) |
| --- | ---: | --- |
| Romanson | 35 | 15 / 15 / 5 |
| Adriatica | 25 | 15 / 10 |
| Appella | 20 | 15 / 5 |
| Pierre Ricaud | 10 | 10 |
| Rhythm | 5 | 5 |
| Royal London | 5 | 5 |

The catalog has 12 pages at size 9: eleven full pages and one final product. `Orion Atlas` has 26 matches: exact full name (SKU 001, price 999999, zero stock), exact model (002), prefix (003–013), and contains (014–026). The phrase deliberately avoids the common VYMPEL SKU prefix because unchanged matching accepts tokens from SKU. SKU search is checked separately with `VYMPEL-PAG-DEMO-050`. Explicit price/date sorting retains the application's availability-first policy; relevance ranks the exact name first even when unavailable.

To reapply only fixtures, use `stand.ps1 Seed`. Optional `stand.ps1 CleanSeed` invokes `cleanup.sql`, which requires the same dedicated database/address/port and deletes only SKUs 001–100 with their FK-cascaded children. It retains migrated reference data. CleanSeed is not part of successful verification or shutdown; the delivered stand remains populated.

For contextual filter demonstrations, apply `seed-filter-details.sql` to the same isolated database using psql. This optional additive, idempotent extension fills only absent `watch_details` for demo SKUs 001–043: quartz 41, mechanical 2; ceramic quartz 8, ceramic mechanical 1. Products, IDs, prices, names and counts stay unchanged. Gender/strap/glass/stone details remain absent to demonstrate visible disabled dictionary options with zero counts. Existing detail rows are never overwritten.

Run `node scripts/pagination-stand/verify-filters.mjs` for contextual counts and `node scripts/pagination-stand/verify-zero-filters.mjs` for zero-option visibility, empty categories and typed interior dictionaries on desktop/mobile. Both use `PLAYWRIGHT_MODULE` below and preserve stand data. `verify-filter-resilience.mjs` separately labels intercepted-response checks for failures, obsolete responses and the empty-dictionary UI placeholder.

## Real verification

```powershell
cd E:\vympel_full
$env:PLAYWRIGHT_MODULE='C:\Users\kyrlu\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs'
node scripts/pagination-stand/verify.mjs
```

Alternatively use an installed `playwright` package, or point `PLAYWRIGHT_MODULE` to its absolute `index.mjs`; no production dependency is added. Defaults to headless Edge, configurable with `PLAYWRIGHT_CHANNEL`. `--api-only` omits browser checks. `--skip-seed` preserves the current dataset without rerunning SQL writes, and `PAGINATION_EVIDENCE_DIR` selects a separate output directory. The UI verifier covers both range and number links sharing Ark state, inclusive labels, unique IDs, keyboard/history and desktop/mobile alignment. The verifier checks seed idempotence, DB relationships and exact counts, full catalog and brand API coverage, search membership and ordering, and all browser acceptance cases. It creates fresh browser contexts, never intercepts responses, and closes only the browser it started. It leaves the stand running.

Evidence: `docs/tasks/catalog-brand-pagination-search-order/local-stand/` contains API/DB and browser JSON, screenshots, final gate results, audit and backend counts. `REPORT.md` in that directory records the completed run and limitations.
