# Regression coverage and limits

These checks use the final local runtime image `sha256:8692a97036572ba27d2cf8444dad7cec9d9dce483c8e023b0834054bc556a337`. The `candidate-regression-complete` and `candidate-contracts` receipts bind the browser checks to that image. Matched performance and network admission is separate in `network-gate.json` and `validation.json`.

| Requirement | Check and retained evidence |
| --- | --- |
| A: first visible images | Production 390/1440 visible decoding; SSR component test preserves four initial images. |
| B: distant URLs absent from network | Production CDP assertions and all 48 matched tuples in the durable evidence validator; an injected far request must be rejected. |
| C: small adjacent range | Four-image SSR bootstrap plus visible range and one neighbour; pure edge tests and actual DOM/network comparison. |
| D–E: forward/backward/ends | Production keyboard traversal through both ends, disabled end controls, desktop buttons and actual mobile touch swipe. |
| F: independent rails | Actual-component harness moves one rail while checking that the other rail's activated resources stay unchanged. |
| G–H: width/resize/reInit | 390 and 1440 production runs, 768/1440/390 resizing, short/empty/restored/reordered harness data. |
| I: keyboard/focus | Tab, arrow controls, visible focus styling and no focus inside inert/aria-hidden slides; lightbox focus return. |
| J: actions/links | Actual GoodCard favorite/cart state and storage, product-link navigation; thin-card harness is not used to claim these actions work. |
| K: responsive families | Actual srcset/sizes/alt equality, component SSR assertions and ordinary catalog default-on contract. |
| L: fallback | Deliberately failed derivative falls back to original; failed original reaches the existing placeholder. |
| M: accessibility/no-JS | Region/group semantics remain in the shared Carousel; production focus/inert checks, real no-JS homepage last-card access, baseline/candidate product-stream comparison and absent-observer/API harness. |
| N: geometry/CLS | Matched card dimensions and actual CLS entries; injected width regression rejected; matched screenshot review in VISUAL.md. |

Shared call sites were enumerated directly: homepage ProductCarouselSection, CaseRecommendationCarousel and BraceletCarousel; product ProductRecommendations; two recommendations in FavoritesPage. The current public home and two product pages are measured end to end. The generic shared-component harness covers multiple rails and lifecycle/fallback behavior; this is not a claim of separately measuring every data combination on each call site.

Accessibility admission is DOM, keyboard, focus and progressive-enhancement testing. No human screen-reader listening session was performed. Existing translated region/group/control labels and offscreen-slide semantics are retained. The published product-page Suspense stream remains hidden without Next scripts in both versions; the carousel does not fix that page-level limitation. No-JS homepage images and links remain available through native horizontal scrolling.

The image bound is a discovery bound. Already visited identities remain mounted for stable backward navigation; it is not a sliding memory cap. Four SSR resources deliberately over-cover the mobile first view to avoid delaying the wider initial view until hydration. Missing observers intentionally fall back to unrestricted native lazy images. The normal enhanced path bounds discovery using existing Embla events and geometry.

No backend, API, database, infrastructure or media codec was changed. Backend/release-platform/deployment admission belongs to a separately authorized release task. No external write or next-batch encoding is part of this validation.
