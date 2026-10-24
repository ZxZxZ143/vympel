# Contextual catalog filters — 2026-10-24

## Commit boundary and scope

Before starting this task, the previous pagination, search ordering, responsive presentation and cookie-copy work was committed as **`b2d2cbb`** (`feat(catalog): add shared pagination and search relevance ordering`). Work continues on **`codex/catalog-brand-pagination-search-order`**. At the user's request, the complete filter changes and follow-up zero-option refinement are included in a separate local commit. No push, merge, image publication or deployment occurred. Pre-existing untracked frontend AGENTS.md/CLAUDE.md remain untouched.

## Behavior

* Reference filters no longer leave empty panes when products lack characteristics. Following the user's refinement, all active localized dictionary values remain visible, including gender, mechanism, case/strap, glass, stone and interior groups. Unused options show zero and are disabled, even beside positive options. If a dictionary/list itself is empty, the UI displays a localized unavailable message; stone additionally gets a disabled Swarovski placeholder without a fake ID/count. See [zero-option verification](zero-options/REPORT.md) for the latest checks and gender screenshots.
* Counts update from the complete current draft before Apply, after a 200ms debounce. Selecting ceramic cases changes the mechanism counts to the ceramic subset. Each dimension honors all other dimensions and ignores its own selection, so additional values in the same group remain selectable. Selections within one dimension use OR; different dimensions intersect with AND.
* Available category options remain stable, including truthful disabled zero-count alternatives. Already-selected zero-count values can still be unchecked. Metadata updates preserve the active filter tab and RHF draft. Only URL navigation resets the draft. AbortController and a late-response guard prevent old counts from overwriting newer choices; pending/failed counts are hidden.
* The metadata endpoint accepts category, search, price range/aliases and repeated filter values through the same controller parser as product listing. Profile restrictions and supported brand/country normalization match the existing product filters. Search matching uses the existing fields/trigram threshold. Paging and sorting do not affect facet counts.
* SQL remains batched: one base aggregation plus one profile aggregation, with parameter-bound selection values. No per-option count queries or full product loading were introduced. DTO shape, product listing/search ordering, page sizes, URL application semantics and category visibility remain unchanged.
* Contextual price bounds no longer become moving HTML input restrictions: nonnegative entered budgets remain applicable when another selected characteristic narrows available prices.

## Changed files

Backend:

- `vympel_back/src/main/java/com/shop/vympel/controllers/ProductPublicController.java`
- `vympel_back/src/main/java/com/shop/vympel/services/catalog/ProductCatalogService.java`
- `vympel_back/src/main/java/com/shop/vympel/db/repositories/product/CatalogFacetRepository.java`
- `vympel_back/src/test/java/com/shop/vympel/services/catalog/ProductCatalogServiceTest.java`
- `vympel_back/src/test/java/com/shop/vympel/services/catalog/CatalogFacetIntegrationTest.java`

Frontend:

- `vympel_front/src/components/CatalogPage/Catalog/Filters/index.tsx`
- `vympel_front/src/api/controllers/PublicController.ts` and its test
- `vympel_front/src/utils/catalogFacetDraft.ts` and its test
- `vympel_front/src/messages/{ru,kz,en}.json` (empty-dictionary message)

Local verification and documentation:

- `scripts/pagination-stand/stand.ps1` (`RefreshBackend` preserves PostgreSQL/frontend/data)
- `scripts/pagination-stand/seed-filter-details.sql` (guarded, additive synthetic details)
- `scripts/pagination-stand/verify-filters.mjs`, `verify-filter-resilience.mjs`, `README.md`
- `docs/PROJECT_MAP.md`, `docs/PROJECT_SKILLS.md`, this report and evidence

No database migration, authentication change or dependency change is required.

## Verification

| Check | Result |
| --- | --- |
| Frontend tests | **265 passed**, 45 files |
| Frontend lint / typecheck | Passed |
| Frontend production build | Passed; refreshed local standalone build |
| Backend tests | **357 passed**, 1 existing external-database rehearsal skipped |
| New database facet integration tests | **7 passed** on a separate disposable PostgreSQL database |
| Backend bootJar | Passed |
| Real API and browser | Passed at 1440px and 390px, without response interception |
| Resilience browser cases | Passed with explicitly intercepted empty/late/failed responses |
| Runtime errors / horizontal overflow | None in the checked scenarios |

The real-data scenario has **41 quartz and 2 mechanical** watches with known details. Selecting ceramic cases produces **8 quartz and 1 mechanical**. Adding quartz returns exactly eight products after Apply. Tests cover own-facet alternatives, multi-select intersections, known zero counts, fallback replacement, category/locale scope, search and price parsing, Apply, Reset, reload/history, preserved tabs/drafts and a broad price range that remains valid after mechanism selection. Resilience tests separately verify the empty-dictionary UI, replacement by populated options, an intentionally delayed old response, failure hiding stale counts and successful recovery.

The skipped backend test is `Step7ExternalDatabaseRehearsalTest.restoredLiveDataMigratesAndRejectsInvalidWrites`; it requires a separately enabled restored external database. The isolated facet test cluster was stopped after verification.

Evidence: [backend totals](backend-results.json), [backend log](logs/backend-tests.log), [frontend tests](logs/frontend-tests.log), [lint](logs/lint.log), [typecheck](logs/typecheck.log), [production build](logs/frontend-build.log), [real-browser results](browser-results.json), [resilience results](resilience-results.json), [database counts](logs/database-status.log).

## Visual review

The existing filter layout, typography, spacing and checkbox styling were retained. The supplied screenshot identified the empty stone pane; it now contains the disabled dictionary option. Desktop and mobile captures were inspected:

- [Ceramic mechanism counts — desktop](screenshots/ceramic-mechanisms-1440.png)
- [Ceramic mechanism counts — mobile](screenshots/ceramic-mechanisms-390.png)
- [Stone fallback — desktop](screenshots/stone-fallback-1440.png)
- [Stone fallback — mobile](screenshots/stone-fallback-390.png)

## Local stand

Available at **http://127.0.0.1:3300/ru/catalog/WATCH_WRIST**. The existing database still contains **100 products**. The optional fixture extension added `watch_details` only for demo SKUs 001–043, without overwriting existing detail rows or changing product IDs, prices, names, brand counts or ordering. Stone assignments remain absent to demonstrate fallback. The PostgreSQL cluster was not recreated or restarted; its start timestamp remains `2026-10-24 16:10:31.710019+05`.

The tested backend jar was installed locally through `RefreshBackend`, and the standalone frontend through `RefreshFrontend`. Backend readiness is UP and the storefront returns HTTP 200. No staging or production environment was touched.

To repeat browser checks, set `PLAYWRIGHT_MODULE` to an installed Playwright runtime and run the two `verify-filter*.mjs` scripts from the repository root. The real-data script requires the guarded additive filter fixture; the resilience script explicitly uses response interception and records that distinction.
