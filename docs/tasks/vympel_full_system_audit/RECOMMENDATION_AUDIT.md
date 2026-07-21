# Recommendation System Audit

## Technical summary

REC-001 was implemented and regression-verified on 2026-07-16. The product page now uses a dedicated bounded backend recommendation endpoint with the required seven-stage fallback, and the complete recommendation section is omitted silently on true catalog exhaustion, timeout, or internal failure. The original findings below remain as historical audit evidence; current visual viewport certification is still pending under `BLOCK-UI-001`.

## REC-001 — Product page exposes recommendation empty/failure states and has no fallback chain (resolved)

- **Severity:** Critical
- **Status:** Implemented and verified on 2026-07-16; manual responsive/browser QA remains pending under `BLOCK-UI-001`.
- **Evidence:** `vympel_front/src/screens/ProductPage/index.tsx` lines 127–149 make one same-category request. Lines 222–247 render `ErrorState` on failure and `EmptyState` on zero results. `GET /ru/product/45` server HTML contained `Похожие товары пока не найдены` five times. The category API returned only product 45 for ACCESSORIES, so filtering the current product leaves zero items. Products 43 and 44 also have zero category alternatives; wristwatch products generally have 11–12.
- **Root cause:** Recommendations are implemented as a frontend call to the generic catalog, with no staged fallback, cross-category/global candidates, score, deduplication, or silent terminal behavior.
- **Implemented fix:** Added `GET /api/public/product/{lang}/{id}/recommendations?limit=12`, `ProductRecommendationService`, a native projection repository, a compact response DTO, a typed frontend client, and a conditional `ProductRecommendations` page component. The ordered, deduplicated candidate set uses these schema-adapted stages:
  1. Same category with matching high-signal details when the product profile supports them.
  2. Same category and brand.
  3. Same category within a configurable price band.
  4. Popular, in-stock products in the parent category.
  5. New/popular, in-stock products in related categories.
  6. Globally popular, in-stock products.
  7. Only if needed, valid out-of-stock alternatives after every in-stock stage.
- **Mandatory rules:** Exclude current, inactive, archived, and inaccessible products; prefer stock; exclude duplicates with insertion-order stability; respect locale; return main image or no-photo fallback; return a stable bounded count; avoid N+1 queries; never expose algorithm failure to the customer.
- **Frontend rule:** Render the recommendation section only when at least one item is returned. On timeout/error/empty global catalog, omit the entire section with no heading, empty message, error text, retry control, or large blank spacing. The existing `similar.empty*` and `similar.error*` translations must not be used on the product recommendation surface.
- **Acceptance criteria:** Products 28, 43, 44, and 45 receive valid alternatives whenever any other public product exists; current/inactive/duplicate items never appear; in-stock ranks ahead of out-of-stock; locale and images are correct; an otherwise empty catalog silently removes the section; backend and frontend regression tests cover all required scenarios.
- **Query behavior:** One source-profile query, one ranked candidate query, and one batch card/rating/media hydration query are used for a non-empty response. The count is independent of the requested limit (capped at 12), so there is no per-candidate entity/name/media/rating query and no N+1 path. Each native query has a 1500 ms default timeout.
- **Verification:** Backend service/controller tests cover stages, bounded count, locale, price band, deduplication, current/inactive exclusion, in-stock ordering, true exhaustion, and timeout/error omission. Frontend Vitest coverage proves valid rendering plus complete empty/error omission with no retry/empty/error copy. Finite live calls against the local 19-product catalog returned 12 unique active alternatives for products 28 (ru), 43 (kz), 44 (en), and 45 (ru), with the current product excluded and in-stock ordering preserved.
- **Regression risks:** Popularity events can be gamed until SEC-001 is fixed; naive multi-stage queries can cause PERF-001-like query growth; cache invalidation must cover product/category/brand/stock/status/price/image changes.

## Required test dataset/scenarios

- Product with many same-category matches.
- Product with only same-category matches.
- Rare category, no same-brand match, no matching details.
- Out-of-stock current product.
- Image-less product 45.
- Accessories, interior clocks, wristwatches, and parent/child category cases.
- Only one public product in the entire catalog.
- Recommendation query timeout/exception.
- Inactive/archived candidates and repeated candidates across stages.

## Suggested scoring contract

Keep stage priority explicit and deterministic rather than hiding it in an opaque score. Within a stage, rank in-stock first, promotion/popularity next, then recency, then stable product ID. Record the winning stage internally for metrics/debugging, but do not expose fallback failure details in customer UI.

## 2026-07-17 PERF-004 closure

The worst-case non-empty request remains exactly three data queries: source projection, one bounded seven-stage ranked-ID query, and one shared public-summary projection for at most 12 IDs. Source absence uses one query, and a ranked empty result uses two. The ranked SQL keeps deterministic stage/in-stock/popularity/recency/ID ordering and stops card hydration when no IDs remain. No generic catalog/facet call or per-candidate query exists.

Recommendation card hydration now reuses `PublicProductSummaryRepository`, including ACTIVE/public visibility, locale/RU fallback, main image, collection, and approved ratings. The repository query timeout is 2,000 ms; the ranked recommendation queries retain the configurable 1,500 ms timeout, and the frontend fetch retains `AbortSignal.timeout(2500)`. Failures are logged and metricized with bounded outcome/stage/query-count labels and still return `[]`.

`ProductPage` no longer awaits recommendations in its primary reviews/CMS batch. `AsyncProductRecommendations` runs behind a React server `Suspense` boundary whose fallback is `null`; the whole section, including its heading, is emitted only for a non-empty result. Timeout, 429, error, and true exhaustion therefore cannot hold the main product content or display empty/error/retry copy.

No recommendation cache was introduced. Because status, stock, price, category, brand, image, translations, popularity, and algorithm changes all affect correctness, a short TTL would still require final visibility validation. The measured three-query p50 stayed effectively flat (common 31.3 to 31.1 ms; rare 25.8 to 27.2 ms), so fixed fresh reads are preferred over incomplete invalidation complexity.

## Step 9 Final Reconciliation - 2026-07-19

The live public recommendation endpoint returned 200 and the current English product page rendered `Related products`. Manual browser inspection confirmed 12 distinct cards, current-product exclusion, and in-stock-first ordering; timeout/error states remain silent through the existing async boundary tests. No recommendation regression was found. Runtime SQL instrumentation was not attached in this resumed phase, so the finite repository/three-query evidence above remains the query-bound proof.
