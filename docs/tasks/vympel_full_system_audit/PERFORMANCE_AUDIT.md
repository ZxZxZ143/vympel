# Performance Audit

## Technical summary

The original 19-product audit found three structural bottlenecks: repeated catalog facet scans, one cart/favorite detail request per item, and 40.48 MB of public assets. Step 6 resolves the first two plus PERF-004 with a varied disposable 600-product benchmark and bounded query paths. Step 8 resolves PERF-003 repository assets/budgets below; target-environment concurrency and final visual certification remain release-verification work, and local measurements are not production certification.

## Measurements and bounds

| Probe | Runs | Median | P95 | Context |
| --- | ---: | ---: | ---: | --- |
| Public catalog API | 12 | 34 ms | 40 ms | One cold outlier at 215 ms; local backend. |
| Product 45 API | 12 | 41 ms | 41 ms | Local backend. |
| Public product CMS API | 12 | 21 ms | 29 ms | Local backend. |
| Public catalog page | 8 | 416 ms | 515 ms | Local Next development server. |
| Product 45 page | 8 | 497 ms | 535 ms | Local Next development server. |

These are warm local observations with 19 products and are not production load-test or Core Web Vitals evidence.

## PERF-001 — Catalog filters repeatedly materialize and count the same product scope

- **Severity:** High
- **Status:** RESOLVED by Step 6; original finding retained below.
- **Original evidence:** `ProductCatalogService.priceFilter`, `watchDetails`, and `interiorClockDetails` called `productRepository.findAll(baseSpecification)`. Reference options performed one count query per option. The 19-row plans concealed cardinality growth.
- **Root cause:** Filter facets are assembled in Java from entity lists and independent count queries instead of grouped/projection queries.
- **Required fix:** Replace full entity materialization with aggregate/projection queries for min/max and facet counts; batch related detail lookups; cache stable reference metadata separately from category-dependent counts; measure query count and latency on a realistic seeded dataset.
- **Acceptance criteria:** Filter results remain identical; no full product entity list is loaded to calculate facets; query count is bounded independently of option count; benchmark targets are documented and met at realistic scale.
- **Regression risks:** Faceted counts must preserve the current selected-filter semantics, category inheritance, locale labels, stock ordering, and accessories/interior profiles.

## PERF-002 — Favorites and cart refresh make one product-detail request per stored item

- **Severity:** Medium
- **Status:** RESOLVED by Step 6; original finding retained below.
- **Original evidence:** `FavoritesPage` and `CartPage` used `Promise.allSettled` over stored IDs and called `getProduct` for each.
- **Root cause:** No public batch-summary endpoint exists for a set of product IDs.
- **Required fix:** Add a bounded batch endpoint returning public product summaries in requested order, excluding inaccessible products and exposing stock/current price. Use it in favorites/cart and keep partial-failure behavior explicit.
- **Acceptance criteria:** One bounded request refreshes the collection; deleted/inactive IDs are removed or marked deterministically; stock limits and locale are preserved; request count does not grow linearly with item count.
- **Regression risks:** Endpoint abuse via large ID lists; cap and deduplicate IDs, preserve authorization/public visibility rules.

## PERF-003 — Public static assets are oversized

- **Severity:** Medium
- **Status:** Confirmed by filesystem inventory
- **Evidence:** 46 public files total 40.48 MB. Largest assets include a 3.36 MB Pierre Ricaud banner, 2.80 MB Romanson banner, 2.58 MB shop image, and several 1–2 MB hero images. Built public chunks total 1.50 MB across 33 files; CRM chunks total 1.27 MB across 31 files.
- **Root cause:** Large PNG/JPEG source assets are shipped without a repository-level size budget or systematic responsive conversion.
- **Required fix:** Convert photographic assets to modern formats at appropriate dimensions/quality, use responsive image sizes, avoid eager loading outside the above-the-fold image, and add a CI size budget.
- **Acceptance criteria:** Visual parity is approved; asset and per-route transfer budgets are documented; no key image regresses sharpness; Lighthouse/Web Vitals are measured on a production build.
- **Regression risks:** Overcompression damages brand imagery; animated/transparency assets require format-specific review.

## PERF-004 — Recommendation lookup is sequential and duplicates catalog work

- **Severity:** Medium
- **Status:** RESOLVED by Step 6 locally; production concurrency measurement remains a release check.
- **Current evidence:** The endpoint uses one source query, one ranked candidate query, and one shared batch summary query for non-empty responses, capped at 12 with a 1500 ms ranked-query timeout. The async recommendation component now runs behind null-fallback server `Suspense`, outside the primary reviews/CMS wait.
- **Root cause:** The historical implementation composed recommendations over the generic catalog API after the initial product request.
- **Implemented REC-001 portion:** Added the bounded dedicated recommendation contract, started it in the product page's initial parallel server data batch, and kept failures silent. No production load benchmark or broader performance issue was undertaken in the REC-only run.
- **Acceptance criteria:** Recommendation latency and query count are measured; the product page does not perform repeated generic filter/facet work; failures remain silent to customers.
- **Regression risks:** Coupling product detail to slow recommendation work can worsen main content latency; use timeouts and graceful omission.

## Optimization validation plan

Seed realistic catalog volumes, capture SQL/query counts, compare p50/p95/p99 before and after, verify identical facet/recommendation outputs, and test concurrent cache invalidation. Do not infer scale readiness from the current tiny sequential-scan plans.

## 2026-07-17 Step 6 implementation and benchmark

**Status:** PERF-001 RESOLVED, PERF-002 RESOLVED, PERF-004 RESOLVED for the implemented local contract. Production-scale concurrency remains a release measurement, not a code blocker.

The disposable PostgreSQL 16 benchmark contained 600 products: 570 active and 30 archived, 360 wristwatches across a parent and six children, 150 interior clocks, 90 accessories, three product translations per product, 360 watch-detail rows, 150 interior-detail rows, and 400 images. Price, stock, promotion, brand, detail, and image state varied. SQL logging was enabled, so timings are comparative local evidence rather than production certification.

| Operation | Rows | Before queries | After queries | Before p50/p95 ms | After p50/p95 ms | Bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Catalog base, 30 | 600 | 79 | 3 | 176.9 / 207.8 | 29.6 / 33.9 | 8,623 |
| Wrist catalog, brand + two sizes, 24 results | 600 | 78 | 5 | 148.2 / 152.0 | 32.9 / 36.4 | 6,117 |
| Generic facet metadata | 600 | 39 | 1 | 100.5 / 120.3 | 13.7 / 16.6 | 1,635 |
| Wristwatch facets | 600 | 108 | 4 | 240.1 / 264.1 | 36.4 / 42.0 | 4,340 |
| Interior-clock facets | 600 | 97 | 4 | 183.9 / 205.4 | 26.1 / 27.8 | 3,609 |
| Accessories facets | 600 | 41 | 3 | 78.6 / 84.8 | 20.3 / 24.2 | 1,629 |
| Quick search, 8 | 600 | 27 | 2 | 52.6 / 55.4 | 20.0 / 22.3 | 2,028 |
| Cart/favorites 1 | 600 | 1 HTTP / per-ID detail | 1 HTTP / 1 SQL | 49.4 / 62.6 | 9.0 / 11.3 | 440 |
| Cart/favorites 10 | 600 | 10 HTTP / per-ID detail | 1 HTTP / 1 SQL | 100.5 / 174.9 | 13.7 / 16.4 | 4,053 |
| Cart/favorites 30 | 600 | 30 HTTP / per-ID detail | 1 HTTP / 1 SQL | 153.2 / 186.6 | 13.2 / 14.6 | 11,687 |
| Cart/favorites 60 | 600 | 60 HTTP / per-ID detail | 1 HTTP / 1 SQL | 383.2 / 438.5 | 22.0 / 29.3 | 23,009 |
| Common recommendation, 12 | 600 | 3 | 3 | 31.3 / 33.3 | 31.1 / 40.4 | 3,193 |
| Rare recommendation, 12 | 600 | 3 | 3 | 25.8 / 28.8 | 27.2 / 31.4 | 3,527 |

Query counts are logical data queries. Category-scoped catalog/facet requests include the existing two-query category-context resolution; the optimized page itself is ID page + count + one shared summary query. Facets use one base aggregation and, only for wrist/interior profiles, one profile aggregation. Adding option values no longer adds SQL. Live response sizes for all facet modes and the two catalog fixtures were unchanged from baseline.

Each case used three warmups and eight measured requests. With eight samples, the nearest-rank p99 equals the observed p95/max: after values were 33.9, 36.4, 16.6, 42.0, 27.8, 24.2, 22.3, 11.3, 16.4, 14.6, 29.3, 40.4, and 31.4 ms in table order. No heap/RSS profiler was attached, so memory improvement is inferred only from removing full entity/N+1 materialization and is not claimed as a measured number. No server result cache exists, so the three warmups reflect connection/JIT/plan readiness rather than cache hits. Remaining scale risks are large-offset pagination, production concurrency, and query-plan changes at several-thousand/product-production cardinality.

`CatalogFacetRepository` returns compact `(facet key, value, localized label, count, min, max)` rows and never materializes products. `PublicProductSummaryRepository` is shared by catalog cards, quick search, batch summaries, and recommendation cards. Its one query resolves localized/RU-fallback name, main image key, visible category, brand/collection, stock/status/price, and approved rating aggregate. Both new native repositories have a 2,000 ms query timeout. Public page size and batch size remain capped at 60; recommendations remain capped at 12 and their ranked query remains capped and timed at 1,500 ms.

No result cache was introduced. Dynamic price, stock, visibility, locale, media, and facet counts would require broad invalidation and high-cardinality keys; the measured fixed queries are safer and fast enough. The frontend only deduplicates simultaneous identical locale+ordered-ID batch promises and deletes the entry immediately after settlement, so there is no stale cache to invalidate.

Bounded Micrometer timers/distribution summaries cover catalog/facet/quick query duration and query count, batch duration/size/query count, and recommendation duration/query count/outcome/stage. Slow catalog and recommendation operations log normalized operation/profile or product ID/locale after 500 ms; no search strings, filter payloads, or user IDs become metric labels.

## Step 8 closure - PERF-003 - 2026-07-19

- **Status:** RESOLVED in repository/build behavior; Step 9 remains responsible for the full route screenshot and high-DPI release pass.
- **Architecture/files:** `vympel_front/scripts/optimize-public-images.py` owns an explicit 25-file photographic/banner target list, WebP quality 84/method 6, decode/dimension validation, and exact-source deletion only after successful output. Public source references use the new `.webp` paths. `scripts/check-performance-budgets.mjs`, the empty documented allow-list, package commands, and `.github/workflows/performance-budgets.yml` gate public assets and both Next JS outputs.
- **Configuration/migration:** Static budgets are 24 MiB total public content, 1.5 MiB per raster, 1.65 MiB public JS, and 1.40 MiB CRM JS. Liquibase `2026-07-19-02-public-image-webp` updates matching `cms_media` `PUBLIC_PATH` URL, filename, and type fields with schema preconditions; old seed migrations remain immutable.
- **Tests/results:** All 46 repository images decode; 25 targets preserve original dimensions. Public content changed 40.48 -> 7.33 MiB (-81.9%), selected targets 36.32 -> 3.18 MiB (-91.2%), and largest image 3.36 -> 0.70 MiB. Budget output was public assets 7.33/24.00 MiB, public JS 1.26/1.65 MiB, CRM JS 1.06/1.40 MiB. Its self-test rejects an oversize fixture and honors an explicit exception. The public production probe measured 1,763,786 B home, 1,446,622 B catalog, and 1,496,590 B product initial self-hosted transfer.
- **Visual evidence:** Pixel dimensions/crops are unchanged. Representative original-versus-WebP inspection for Pierre Ricaud, Romanson, and store imagery found no visible crop, product geometry, or material artifact regression. No before route-transfer capture exists and no Core Web Vitals improvement is claimed.
- **Remaining risk:** Step 9 must validate home, catalog, accessories, interior, brands, product banner, mobile crops, and high-DPI rendering. Runtime MinIO/CMS uploads were deliberately not modified by the repository asset pipeline.

The complete 25-row ownership and before/after table is `STEP_8_ASSET_INVENTORY.md`.

## Step 9 Final Reconciliation - 2026-07-19

Final budgets remain green after dependency and accessibility changes: public assets 7.33/24.00 MiB, public JS 1.33/1.65 MiB, CRM JS 1.09/1.40 MiB. Production self-hosted transfer is 1.83 MiB home, 1.51 MiB catalog, and 1.56 MiB product. A bounded 240-request, concurrency-20 backend run returned 240 HTTP 200 at about 132 rps with p95 507.8 ms and max 944.8 ms. These are staging regression signals, not production capacity claims. See `../vympel_final_release_verification/FINAL_PERFORMANCE_VERIFICATION.md`.
