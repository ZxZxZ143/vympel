# Catalog / brand pagination and search ordering

Verified 2026-10-24. Branch: `codex/catalog-brand-pagination-search-order`.
Base: `3977907cc5e22ba30eea0cb41a160c4a67bb93ec` (latest `origin/main` fetched before branch creation). Feature changes are **uncommitted**; no feature commit SHA has been created. The pre-existing untracked frontend AGENTS.md and CLAUDE.md are unchanged.

Latest refinement: [mobile pagination report](mobile-pagination/REPORT.md) documents the current below-1024px numeric-only row. Earlier presentation descriptions below are historical.

## Result and root causes

The shared component rendered two independent sets of links, including zero-based item ranges, and both sets marked the same page active. Its hook hardcoded a nine-item page size. Brand screens always fetched API page zero with size 15 and discarded all pagination metadata. Catalog SSR, client retry and the sort trigger assumed priceAsc, and canonicalization erased that sort even during search. Applying filters also erased the active search, indirectly erasing an explicit default-price sort.

There is now one shared pagination control for catalog and every configured brand page. Catalog remains 9 items/page; brands use 15. Brand pages fetch only the requested API page and retain newest ordering, actual backend brand IDs, public domain/category restrictions, hero, description, history, catalog link and cards. RU/KZ/EN now label the section as brand models.

## Library and presentation

[Ark UI Pagination](https://ark-ui.com/docs/components/pagination), exact **@ark-ui/react 5.39.3**, was the current stable npm version checked during implementation. Its peer range supports React/React DOM >=18; this repository installs React/React DOM 19.2.4, Next 16.3.8 and next-intl 4.13.2. The package is headless, not a new visual theme; only the `/pagination` module is imported. No existing locked dependency version changed. The package graph added 84 lock entries; production bundling includes only the used component graph.

Ark owns the page range, first/last boundaries, ellipses and previous/next state. There is no second custom sliding-window algorithm. Links compose Ark `asChild` with the existing localized Link and use `type="link"` / `getPageUrl`. The response owns page number, size, count and total pages. Pagination is hidden for zero/one page; unavailable directional actions are omitted. Numeric links are unique and exactly one is active.

The row retains dark active circles, outlined inactive circles, understated arrows, project color/font tokens and 44px targets. At <390px the library shows a minimal range without outer boundary pages; 390–767px uses boundary=1/sibling=0; >=768px uses boundary=1/sibling=1. SSR and first hydration use the same compact snapshot, then viewport subscriptions adapt the single row.

## URLs, sorting and database behavior

* Page URLs are one-based; requests subtract one. Page one omits `page`; links preserve repeated facets, search, explicit sort, category path and locale, remove stale `size`, and append `#catalog-product-list` or `#brand-product-list`.
* Brand routes use the existing catalog policy: malformed/nonpositive pages normalize to page one, leading-zero numbers normalize to a positive number, and confirmed pages beyond the last page return 404. Upstream failures remain non-404 error states. Brand page 2+ has a matching canonical/hreflang query when indexing is enabled. No indexing flags or sitemap policy changed.
* `catalogSort.ts` is shared by the SSR/client request builder and sort hook. Ordinary storefront browsing still sends priceAsc. Search without an explicit sort omits the API sort parameter; explicit priceAsc remains in a search URL. The API's legacy omitted-sort behavior outside search and other list endpoints remains unchanged.
* Search with no chosen sort displays RU **Не выбрано**, EN **Not selected**, KZ **Таңдалмаған**, with no selected radio. There are still only four visible price/date choices. Selecting one resets the page; Reset removes `sort` and `page` but retains the search/facets. Filter application now retains search and chosen sort too. Submitting a new global search retains its established behavior of clearing the old category/facets/sort and resetting to page one.
* The controller preserves an unsorted Pageable for implicit search. The catalog service supplies the unchanged matching specification plus a separate ordering-only search argument. Before OFFSET/LIMIT, a Criteria CASE ranks (1) exact normalized name in any stored locale, (2) exact model/SKU, (3) name starting with the full phrase, (4) name containing it, (5) other accepted matches. Prefix intentionally precedes contains, since every prefix is also a containment match.
* Rank normalization trims/collapses whitespace and lowercases only ORDER BY expressions; rank-only LIKE patterns escape literal %, _ and the escape character. The original matching method, token/LIKE behavior, trigram threshold and normalization are unchanged. Correlated EXISTS avoids name-translation joins multiplying rows. Original eligibility/count/filter logic and batched summaries are retained.
* Relevance precedes availability, so an exact expensive unavailable model appears first with its availability information intact. Availability, creation time descending and ID descending break ties inside each rank. Explicit price/date sorting retains the established availability-first policy. Quick search uses its original bounded overload and ordering unchanged. No database schema, migrations, environment variables, CRM source or deployment files changed.

## Verification

| Check | Result |
| --- | --- |
| Storefront finite Vitest | **227 passed**, 44 files |
| Storefront lint / typecheck | Passed, no lint warnings |
| Production build | Passed |
| Production HTTP matrix | Passed: 200/308/404, all six brands × RU/KZ/EN page 2, final brand page, invalid/out-of-range normalization, transient failures, preview SEO/security headers |
| Browser matrix | Passed at **320, 390, 768, 1024, 1440** for both lists: no overflow, 44px targets, one active item, correct content, direct links, reload, Back/Forward, keyboard Enter, anchors, explicit sort/reset, filters, price bounds, quick suggestions, new-search reset and accessories |
| Hydration/runtime errors | None in the browser matrix |
| Backend full finite suite | **351 discovered: 329 passed, 22 skipped, zero failures/errors** |
| Focused real PostgreSQL ranking tests | **6 passed**, including strengthened date ordering and cross-brand/category exclusion assertions |
| Backend bootJar | Passed |
| Query-count check | Ranked ID page selection uses **two statements** (IDs + count) for both tested page sizes; summary projection remains unchanged |
| Security headers | 3 passed |
| sharp / glob security guards | Passed |
| Existing performance budgets | Passed for assets, storefront and existing CRM build; ceilings unchanged |
| npm audit | **Not clean**: same existing Next critical / Zod high package findings as untouched main, no additional findings introduced by Ark |
| Git diff whitespace check | Passed |

Pagination component tests cover 0/1/2/5/7/100 pages, first/middle/last pages, both ellipses, directional boundaries, active/unique numeric links and all three responsive range settings for sizes 9 and 15. Brand tests cover 0/1/15/16/30/31/57 models, all configured brands/locales, every item across pages, requested size/filter/sort and out-of-range/transient results. Shared request/API tests distinguish omitted versus explicit search price sorting, clearing, repeated filters and zero-/one-based indices.

The PostgreSQL tests create isolated transactional product graphs. They prove an expensive out-of-stock exact name ranks first across RU/EN/KZ, translated rows do not inflate counts, pages are stable and disjoint, results membership equals explicit sorting, model/SKU ranks are preserved, literal wildcard/case/whitespace behavior is ordering-only, price/date overrides work, other brands/categories and drafts remain excluded, and autocomplete stays unchanged. Search membership is not inferred from a frontend mock.

The full suite used a new disposable loopback PostgreSQL **18** cluster and Java 17, not the user's existing databases. Docker's engine did not become available: **21 existing Testcontainers cases** (PostgreSQL 16/Redis integration and migration cases) skipped through their existing `disabledWithoutDocker` policy. The external-database rehearsal is the remaining intentional skip. These are limitations, not passes. No production-scale query latency benchmark or live-data validation was performed.

## Bundle and security evidence

Same environment, same production build command:

* Main baseline static JS: **1,324,705 bytes**.
* Final static JS: **1,371,116 bytes** (about 1.31 MiB).
* Difference: **46,411 bytes** (about 45.3 KiB, 3.50%).
* Existing storefront ceiling: **1.65 MiB**, unchanged; public assets 8.90 / 24 MiB.

`npm audit --package-lock-only` on a copy of main's original package files produced exactly the same vulnerability objects as the feature's final audit. Current advisories identify Next 16.3.8 and Zod as existing release concerns; no broad framework upgrade was included in this focused task. The audit gate therefore remains failing even though the feature's security-header and pinned-transitive guards pass. Backend security/RBAC cases ran as part of the finite suite; no release-image builds/scans were run.

## Reproduction and evidence

From `vympel_front`: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:security`, `npm run test:sharp-security`, `npm run test:glob-security`, `npm run test:budgets:ci`, `npm run test:production-status`, `npm audit --audit-level=high`.

For the optional browser extension, set `PAGINATION_BROWSER=true`, point `PLAYWRIGHT_MODULE` to an installed Playwright `index.mjs` (or install it in the test environment), and run `npm run test:production-status`. It defaults to headless Edge (`PLAYWRIGHT_CHANNEL=msedge`), creates a fresh browser context, intercepts client API calls to the same isolated HTTP fixture as SSR, and closes browser/server processes in finally blocks. `PAGINATION_EVIDENCE_DIR` controls screenshot/result output. Playwright is not added to production dependencies.

From `vympel_back`, with Java 17 and VYMPEL_DB_URL/USERNAME/PASSWORD targeting a disposable database: `gradlew.bat test bootJar --console=plain`. Focused command: `gradlew.bat test --tests '*CatalogSearchOrderingIntegrationTest' --tests '*ProductCatalogServiceTest' --tests '*ProductPublicControllerTest' --console=plain`.

[Backend counts and skips](backend-results.json), [production/browser log](production-browser.log), [Browser measurements](browser-results.json), [320px catalog](screenshots/catalog-product-list-320.png), [390px catalog](screenshots/catalog-product-list-390.png), [1440px catalog](screenshots/catalog-product-list-1440.png), [320px brand](screenshots/brand-product-list-320.png), [1440px brand](screenshots/brand-product-list-1440.png). The screenshots directory contains all ten width/list combinations. All were visually inspected. The supplied attachment contained text only; no Figma frame or screenshot asset was available, so no pixel-perfect comparison is claimed.

## Changed implementation and test files

- `vympel_back/src/main/java/com/shop/vympel/controllers/ProductPublicController.java`
- `vympel_back/src/main/java/com/shop/vympel/services/catalog/ProductCatalogService.java`
- `vympel_back/src/main/java/com/shop/vympel/services/catalog/PublicProductQueryService.java`
- `vympel_back/src/test/java/com/shop/vympel/services/catalog/CatalogSearchOrderingIntegrationTest.java`
- `vympel_front/package-lock.json`
- `vympel_front/package.json`
- `vympel_front/scripts/test-pagination-browser.mjs`
- `vympel_front/scripts/test-production-status.mjs`
- `vympel_front/src/api/controllers/PublicController.test.ts`
- `vympel_front/src/api/controllers/PublicController.ts`
- `vympel_front/src/app/[locale]/brands/[brandSlug]/page.tsx`
- `vympel_front/src/components/CatalogPage/Catalog/Filters/index.tsx`
- `vympel_front/src/components/CatalogPage/Catalog/Sort/index.tsx`
- `vympel_front/src/components/CatalogPage/Catalog/index.tsx`
- `vympel_front/src/components/ui/shared/Pagination/index.test.tsx`
- `vympel_front/src/components/ui/shared/Pagination/index.tsx`
- `vympel_front/src/hooks/usePagination.tsx`
- `vympel_front/src/hooks/useSort.ts`
- `vympel_front/src/lib/brandPageData.test.ts`
- `vympel_front/src/lib/brandPageData.ts`
- `vympel_front/src/lib/catalogQuery.test.ts`
- `vympel_front/src/lib/catalogQuery.ts`
- `vympel_front/src/lib/catalogSort.ts`
- `vympel_front/src/lib/catalogUrl.ts`
- `vympel_front/src/lib/paginationUrl.ts`
- `vympel_front/src/messages/en.json`
- `vympel_front/src/messages/kz.json`
- `vympel_front/src/messages/ru.json`
- `vympel_front/src/screens/BrandPage/index.tsx`

Both `docs/PROJECT_MAP.md` and `docs/PROJECT_SKILLS.md` document the new architecture, URL/sort contracts, library, page sizes, filter preservation, test evidence and limitations, and have 2026-10-24 Last Updated entries.

Nothing was merged, pushed, published or deployed. No Docker release images were built, and no live records or live migrations were touched.

## Follow-up: running real-data stand

2026-10-24 — The isolated 100-product PostgreSQL → Spring Boot → Next.js stand and real-browser verification are documented in [local-stand/REPORT.md](local-stand/REPORT.md). It remains running on loopback ports 55440 / 18080 / 3300. The original implementation above is preserved.

## Latest layout restoration

2026-10-24 — Restored left-hand inclusive range pills and right-hand circular links from one Ark model. This supersedes the single-row visual description above; pagination/ranking behavior remains unchanged. See [layout-restoration/REPORT.md](layout-restoration/REPORT.md) for 239 passing frontend tests, real-browser screenshots and preservation evidence.

## Latest range boundaries

2026-10-24 — Both groups now render the complete shared Ark page/ellipsis model with first/last boundaries and neighbors at every width, following the user-approved shared-window adjustment. See [range-boundaries/REPORT.md](range-boundaries/REPORT.md) for 260 passing frontend tests, page 1/7/12 screenshots and preserved local-stand evidence.
