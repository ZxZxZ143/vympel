# Carousel image discovery fix — local review

**CAROUSEL IMAGE DISCOVERY FIX READY FOR REVIEW**

Parent/accepted staging release: `292d086d59f4198fb4efb40d48c08630e52e29f5`. Branch: `codex/image-loading-optimization`. The focused local commit receipt is in `LOCAL-COMMIT.json` (created after committing); no push/publication/deployment is authorized. The ten accepted staging references remain active.

## Mechanism and exact scope

The exact published storefront reproduced requests for horizontally distant legacy PNGs that were already present in DOM. Native loading=lazy schedules requests but does not constrain the horizontal discovery range. ECT changes the browser discovery policy; a warm prime only covers its frozen requested URL set. This is separate from the observed live document TTFB variation.

Changed application files: `GoodsCarouselWithImage/index.tsx`, new `imageDiscovery.ts` and `useImageDiscovery.ts`, `GoodCard/index.tsx`, and `ResponsiveProductImage/index.tsx`. Three adjacent unit/component test files and `vympel_front/scripts/check-carousel-discovery-evidence.mjs` provide direct regression coverage. No backend/API/schema/dependency/configuration/asset/encoder changes.

Four initial images remain in SSR, covering the widest first view, including its partial fourth card. Embla select/scroll/slidesInView/reInit events and current slide geometry discover visible cards and one neighbour per side. Requests are coalesced per animation frame, and already discovered product-ID/URL identities remain mounted. Mobile initially retains up to two extra bootstrap images. The bound concerns new discovery, not a maximum number of resources retained after the user has visited the whole rail.

Deferred images use noscript while all cards, text, links, order and controls remain mounted. Ordinary catalog grids keep loadImage=true by default. Responsive srcset/sizes, original/placeholder recovery, banners, priorities and original-on-demand lightbox are preserved. Missing browser observers use native scrolling and unrestricted native lazy images for functionality; a missing carousel API uses native scrolling with geometric discovery. Native controls rebind when empty/loading/data changes remount the viewport.

## Passed functional gates

- 283 tests in 50 frontend files; ESLint, TypeScript and final Linux production Docker build passed.
- Production browser checks: initial/adjacent/network bounds; next/previous and both ends; mobile/desktop; real touch swipe; keyboard/focus; favorite/cart/product links; resize/reInit; responsive family and original/placeholder fallback; pointer/keyboard lightbox and focus return.
- Real no-JS homepage reaches the last card with all 20 images and links available. Isolated actual-component tests cover independent rails, empty/short/reordered data and missing IntersectionObserver, ResizeObserver, MutationObserver or API.
- The existing product recommendation Suspense stream remains inside a hidden S:0 container without Next scripts on both published baseline and candidate. This pre-existing page-level limitation is not presented as solved. Candidate carousel slides themselves are no longer inert in the native fallback.
- Durable evidence gate passed all 48 matched tuples, unchanged content/families/geometry and zero far-image requests; deliberately injected request and geometry regressions were rejected.
- 206 checksummed static WebPs from 39 unchanged originals; three security-header tests; sharp >=0.35.5 and glob/depth guards passed. Production npm audit: zero vulnerabilities. Full dependency audit: zero high/critical, eight moderate and three low development findings under the unchanged high threshold.
- Public assets: 16.90 MiB / 24 MiB. Raw static JS: 1,551,448 → 1,556,078 bytes (+4,630, 0.298%), below the unchanged 1.65 MiB limit. No budget increase.

## Measured local comparison

These are **isolated local fixture results, not deployed staging improvements**. The same exact data and image bodies were used on both sides. 96 observations cover three pages, two widths/DPRs, normal/slow transport, verified ECT 3G/4G and cold/warm states. Each tuple has one observation per side; no statistical significance or production traffic forecast is claimed. [Protocol](PROTOCOL.md) · [All profile results](PERFORMANCE.md) · [Navigation](NAVIGATION.md)

| Metric, summed across matched observations | Published baseline | Local candidate |
| --- | ---: | ---: |
| All image requests | 550 | 495 |
| Far carousel requests | 56 | 0 |
| Completed network image wire bytes | 126,307,885 | 101,856,134 |
| Partial/pending wire bytes | 46,908,628 | 44,924,852 |
| Total observed image wire bytes (including 304/pending) | 173,219,889 | 146,784,362 |
| Direct cache hits / wire 304 | 270 / 4 | 246 / 4 |
| Pending request instances at cutoff | 63 | 47 |

Exact URLs, cache outcomes, visibility samples and transfer records are retained in request-ledger.json; per-case actual LCP elements/load/render fields and CLS are in comparison.json. Newly discovered requests after vertical scrolling and after Next are separated in navigation-comparison.json. Completed and pending traffic are never interchangeable.

Ordinary next navigation: 12 normal-network pairs; candidate ready-delay range 0.0–0.0ms, with zero new pending targets. Slow navigation: 6 → 6 pending targets at the bounded cutoff; no newly pending target relative to baseline. Rapid arbitrary cold jumps beyond the adjacent range can still wait for a multi-megabyte legacy original. This fix does not make those bodies small.

Max observed CLS: 0.000257 → 0.000196. LCP remains a per-profile observation, with its actual element retained; local timings do not resolve live server TTFB. Matching mobile/desktop screenshots and card geometry are reviewed in VISUAL.md.

The carousel request set splits into 80 horizontally visible-card requests and 32 allowed adjacent/bootstrap requests on each side, plus 56 far requests on baseline and zero on candidate. These rails start below the vertical viewport in the timed windows; this fix bounds horizontal discovery and leaves native vertical lazy scheduling in place. Approximate request-time DOM visibility is retained separately from the fixed styled initial-range classification; see analysis-correction.json.

LCP was lower in 22 pairs, higher in 24, and equal in 2. No consistent LCP improvement is demonstrated. In particular, some normal-loopback profiles increased despite reduced image traffic. With one observation per tuple and sequential processes, these timings cannot establish a causal page-speed improvement; the direct evidence is the request-set bound and unchanged tested next-image readiness.

All shared call sites and the A–N coverage/limits are enumerated in [GATES.md](GATES.md). Screenshots were directly inspected, and no human screen-reader listening session is claimed.

## TTFB, media and release boundaries

Nine read-only live browser samples observed response wait of 210–3016.8ms on reused connections. Three separate fresh-connection samples also measured DNS/TCP/TLS. The cause is unresolved and requires separate correlated edge/application timing; no backend, Nginx, cache or infrastructure change was made. [Live timing evidence](TTFB.md)

The same next ten candidates remain review-only: seven product main images and three product-46 gallery images. Their priority is reconsidered using current post-fix observed traffic; original protection, old-codec estimate limitations and future private ownership/lifecycle gates remain explicit. [Updated priorities](NEXT-BATCH.md)

Expected impact: lower unnecessary image-body traffic and decoding work, the same card DOM/layout, approximately 4.6 KB additional raw JS and a small geometry/identity check during carousel events. No server-side encoding, storage increase, DB mutation or resource-limit change is introduced.

Remaining approval: operator approval is required before pushing/PR/merging, publishing immutable images through Release Images, or deploying staging. The future release must use its actual full commit SHA and existing preview/API/protected-CRM origins, pass the normal release/platform gates, and preserve 292d086 as the application rollback target. No migration is needed for this frontend change. Live media backfill requires a separate authorization and fresh private admission.

All prior sealed investigation/accepted-ten evidence, benchmark pins, unrelated tracked edits and pre-existing untracked files are preserved. Large raw browser records and screenshots remain local evidence; only focused code/tests and review documents belong in the local commit. No external write was performed.
