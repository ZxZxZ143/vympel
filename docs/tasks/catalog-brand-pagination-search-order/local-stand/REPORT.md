# Real local pagination/search stand — 2026-10-24

The completed feature was preserved on `codex/catalog-brand-pagination-search-order` at HEAD `3977907cc5e22ba30eea0cb41a160c4a67bb93ec`. This continuation added development-only stand/fixture/verification tooling and documentation. No pagination, ranking, matching, API contract, schema migration, CRM or deployment source was rewritten. Existing uncommitted changes and unrelated frontend AGENTS.md / CLAUDE.md were preserved. Nothing was committed, pushed, merged, published or deployed.

## Running services and direct URLs

| Purpose | URL |
| --- | --- |
| Storefront | http://127.0.0.1:3300/en |
| Backend catalog API | http://127.0.0.1:18080/api/public/product/catalog/en?size=9 |
| Readiness (database included) | http://127.0.0.1:18080/actuator/health/readiness |
| Catalog page 2 | http://127.0.0.1:3300/en/catalog?page=2 |
| Romanson page 2 | http://127.0.0.1:3300/en/brands/romanson?page=2 |
| Relevance search | http://127.0.0.1:3300/en/catalog?search=Orion%20Atlas |
| Explicit ascending price | http://127.0.0.1:3300/en/catalog?search=Orion%20Atlas&sort=priceAsc |

All three services are retained, listening only on 127.0.0.1. PostgreSQL is on 55440, database `vympel_pagination_demo`, in the new marked `.cache/pagination-stand/postgres` directory. It is independent of existing user databases and the preceding disposable regression cluster on 55439; the latter was stopped after tests. The bounded Docker daemon probe timed out, and PostgreSQL 16 was not installed. This run uses native PostgreSQL **18.1**. No existing volumes, deployed machines, staging/production data, credentials, domains or cloud resources were changed.

`live-status.json` contains the final UTC check timestamp, actual process identities and HTTP statuses; `logs/live-health.log` contains DB acceptance, 100/100 total/unique SKUs, backend UP and storefront 200. The stand has a separate copied jar and standalone Next build, so root test/build commands did not replace its running artifacts. Its dependencies are a junction to the already installed storefront node_modules.

## Data and real API results

Exactly **100 ACTIVE products**, unique deterministic SKUs `VYMPEL-PAG-DEMO-001` through `100`, 300 localized names (ru/en/kk), 300 descriptions, and 100 valid WATCH_WRIST assignments. All 100 are visible to the unfiltered public API. Brand IDs are resolved from real migrated reference data/facets. Images intentionally use the site's existing fallback.

| Brand | Products | Pages at size 15 |
| --- | ---: | --- |
| Romanson | 35 | 15 / 15 / 5 |
| Adriatica | 25 | 15 / 10 |
| Appella | 20 | 15 / 5 |
| Pierre Ricaud | 10 | 10 |
| Rhythm | 5 | 5 |
| Royal London | 5 | 5 |

Catalog size 9 produces **12 pages**, counts `[9,9,9,9,9,9,9,9,9,9,9,1]`. Complete API traversal equals the database ID set, with no duplicates or missing items; repeated first-page requests are stable. All six brand page sets are complete and disjoint within each brand.

`Orion Atlas` matches **26 products**, with an exact full name priced 999999 and zero stock, an exact model, 11 prefix matches and 13 contains matches. Exact name ranks first without explicit sorting, across RU/KZ/EN and before pagination. Price ascending/descending and newest/oldest change order, preserve the identical membership set and retain the existing availability-first policy. The verifier checks price/date monotonicity within available/unavailable groups. Reset restores relevance. Exact SKU lookup is also checked. The original matching algorithm is unchanged; a phrase containing Vympel would also match the common SKU prefix, so the fixture avoids that token.

The seed was rerun repeatedly, with before/after snapshots proving stable IDs, dates and content. It is transactional and guarded by exact database name, loopback address, port and unexpected-product checks. Seed and cleanup commands both refused the separate regression database before writing. Cleanup is optional and targets only the 100 named SKUs and their FK-cascaded children; it was not applied to the delivered stand.

Evidence: [API and database assertions](api-database-results.json), [seed guard](logs/seed-wrong-database-guard.log), [cleanup guard](logs/cleanup-wrong-database-guard.log).

## Browser results

Real headless Edge through Playwright, fresh context, real local API and PostgreSQL. **No request interception or mocked responses.** Passed:

- All twelve catalog pages and all pages of all six brands; expected IDs checked against the real API, single pagination row, 9/15 item sizes and final partial pages; one-page brands hide pagination.
- First/middle/last/direct pages, reload, Back/Forward, previous/next links, two ellipses on desktop middle page, one active number, unique links and preserved anchors.
- Relevance, explicit price and date selection, page reset, sort reset, search pagination, query/facet/price preservation and real quick-search suggestions/new-search reset.
- RU/KZ/EN catalog, brand and search routes; localized empty sort labels.
- 320/390/768/1024/1440 widths for catalog and brand, no horizontal overflow, 44px targets, expected content and consistent shared styling.
- Zero browser pageerror events. Real client public-API requests were observed exclusively at 127.0.0.1:18080.

[Browser measurements and routes](browser-results.json). Sixteen screenshots cover navigation rows at all ten width/list combinations, full catalog/brand at 320/1440, relevance and explicit price sorting. Representative screenshots were visually inspected; no external Figma frame was supplied, so no pixel-perfect design claim is made.

[Catalog 320](screenshots/catalog-product-list-320-full.png), [catalog 1440](screenshots/catalog-product-list-1440-full.png), [brand 1440](screenshots/brand-product-list-1440-full.png), [relevance](screenshots/search-relevance.png), [price ascending](screenshots/search-price-ascending.png).

## Final project checks

| Check | Result |
| --- | --- |
| Frontend tests | 227 passed, 44 files |
| Lint / typecheck | Passed |
| Production build | Passed (root and isolated copy) |
| Production HTTP/status fixture regression | Passed; separate from the real stand/browser proof above |
| Security headers | 3 passed |
| sharp / glob security guards | Passed |
| Performance budgets | Passed: storefront 1.31 / 1.65 MiB; public assets 8.90 / 24 MiB; existing CRM build 1.51 / 1.53 MiB |
| Backend finite suite, forced rerun | 351 discovered: 329 passed, 22 skipped, 0 failures/errors |
| Real PostgreSQL ranking suite | All 6 passed, included in full suite |
| bootJar | Passed |
| Seed idempotence / isolation guards | Passed |
| Managed restart and post-restart real checks | Passed; 100 products retained |
| git diff whitespace check | Passed (repository line-ending notices only) |
| npm audit | Failing: Next critical, Zod high; unchanged vulnerability objects versus saved untouched-main baseline |

[Frontend result codes](frontend-checks.json), [final gates](final-gates.json), [backend counts/skips](backend-results.json), [audit](audit.json), [baseline comparison](audit-baseline-comparison.json), [verification log](logs/verification.log). Logs live in `logs/`; current runtime logs remain under the ignored stand directory.

The 22 skips are **21 Docker/Testcontainers cases** and **one intentionally disabled external-database rehearsal**. They are not passes. PostgreSQL 16 parity remains unverified. No broad dependency upgrades were made; this work does not establish a security-clean release.

During rapid browser traversal, Next logged `The destination stream closed early` for cancelled speculative product RSC prefetch requests. Direct product pages 1 and 10 returned 200 and the browser had no runtime exceptions. This is recorded in `runtime-observations.json`, not represented as a clean server log. No feature defect requiring application changes was reproduced.

## Lifecycle and reproduction

Full setup and constraints: [stand README](../../../../scripts/pagination-stand/README.md).

Restart (verified, data retained):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "E:\vympel_full\scripts\pagination-stand\stand.ps1" Restart
```

Safe shutdown (only owned demo processes, data retained):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "E:\vympel_full\scripts\pagination-stand\stand.ps1" Stop
```

Use `Restart -Rebuild` to copy/rebuild changed storefront sources, `Status` for health and counts, `Seed` to reapply fixture data. `Start` creates a fresh stand or starts a stopped stand; it refuses occupied ports/recorded processes. Stop verifies process creation timestamps and owned command-line paths, then uses the specific marked database directory. PostgreSQL startup has separate redirected handles so Windows caller pipelines can finish while the service stays alive. No service is automatically torn down after successful verification.

Run `node scripts/pagination-stand/verify.mjs` with `PLAYWRIGHT_MODULE` pointing at an installed Playwright index.mjs, or `--api-only` for database/API checks. The README gives the tested runtime path. Verification closes its own browser and leaves the three services running.

## Git and documentation

Branch remains `codex/catalog-brand-pagination-search-order`; HEAD is unchanged. Working tree remains intentionally dirty: **24 modified tracked paths and 11 untracked entries** (directories summarized), encompassing the original implementation plus new tooling/evidence. [Exact git status](git-status.txt). No unrelated AGENTS.md or CLAUDE.md was overwritten.

Both mandatory project memory files were updated: PROJECT_MAP documents the tooling, boundaries, ports and evidence; PROJECT_SKILLS records fixture/search rules, Windows process/Next build pitfalls, validation and limitations. Both Last Updated sections include 2026-10-24.
