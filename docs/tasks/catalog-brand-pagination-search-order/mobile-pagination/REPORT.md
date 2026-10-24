# Mobile pagination refinement — 2026-10-24

Branch: `codex/catalog-brand-pagination-search-order`. This continuation changes only shared pagination presentation, its tests/browser verifiers and documentation. Previous feature work is preserved. No commit, push, merge, image publication or deployment was performed.

## Result

Below the existing **1024px** breakpoint, the product-range group and previous/next arrows are completely hidden using CSS `display:none`. They remain in the shared SSR markup but cannot receive keyboard focus or appear in the accessibility tree. The visible control is a single centered numeric row, with dark active circles, outlined inactive circles, lightweight ellipses and visible focus outlines.

The row uses `flex-nowrap`, 2px gaps, 8px ellipsis slots and no clipping. A CSS container-width calculation sizes the existing Ark number tokens to fit, capped at 44px. The smallest measured circle is **35.859375px** in the widest seven-number case at 320px; ordinary middle-page and brand rows retain 44px targets. All first/last/current/neighbor links remain available at every tested width. There is no separate mobile model, custom page-window algorithm, viewport subscription or new pagination state.

The existing **one Ark Root/Context, siblingCount=1, boundaryCount=1, `pagination.pages`, response-owned page/count/size and shared `pageHref`** are unchanged. Hidden ranges continue to map that same model. Catalog remains **9/page**; brands remain **15/page**. URL/query preservation, selected state, SSR, history, search relevance, filters, sorting and canonicalization are unchanged.

At **1024px and above**, ranges remain left, numeric circles remain right, and arrows remain available. The page 1/7/12 pagination captures at 1440px are **pixel-for-pixel identical** to the previous range-boundaries captures, including dimensions. See [desktop pixel comparison](desktop-comparison.json).

## Files changed in this continuation

- `vympel_front/src/components/ui/shared/Pagination/index.tsx`: mobile CSS visibility, nonwrapping row and container-based circle sizing; desktop styles retained.
- `vympel_front/src/components/ui/shared/Pagination/index.test.tsx`: retained all window/URL/range coverage and added SSR/mobile-visibility assertions (62 pagination cases).
- `vympel_front/scripts/test-pagination-browser.mjs`: eight viewport widths, visible-only targets/active states, hidden ranges/arrows, row alignment, and numeric mobile navigation.
- `scripts/pagination-stand/verify.mjs`: real-data first/middle/last matrix for catalog, brand and the widest seven-page case; keyboard exclusion/traversal, geometry, URLs, navigation and captures.
- `docs/PROJECT_MAP.md`, `docs/PROJECT_SKILLS.md`: current mobile/desktop rules, verification patterns and Last Updated entries.
- `docs/tasks/catalog-brand-pagination-search-order/REPORT.md`: current-report link; this `mobile-pagination/` report and evidence.

No backend, API contract, database, dependencies, hooks, routing helpers, page sizes or unrelated UI changed in this continuation. Existing dirty feature files and unrelated frontend AGENTS.md/CLAUDE.md were preserved.

## Verification

| Check | Result |
| --- | --- |
| Frontend tests | **261 passed**, 44 files; focused pagination **62 passed** |
| Lint | Passed, including updated browser script |
| Typecheck | Passed |
| Production build | Passed |
| Production-status matrix | Passed |
| Optional fixture browser gate | Passed at all eight widths; navigation/history/sorting/reset |
| Performance budgets | Passed; storefront JS 1.29 / 1.65 MiB |
| Real database/API | 100 unique products, 12 catalog pages, six brands, 26 search matches; relevance and explicit sorts passed |
| Real browser matrix | **72 cases**: 8 widths × 3 datasets × first/middle/last |
| Widths | **320, 360, 375, 390, 430, 768, 1024, 1440px** |
| Mobile layout/accessibility | Single centered row; ranges/arrows hidden and not focusable; visible active/end/neighbor links; no document/row overflow; sequential Tab and Enter passed |
| Navigation | Real numeric/range links, exact product IDs, shared hrefs, reload/Back/Forward, query preservation, search/filter/sort reset passed |
| Browser runtime errors | None |
| SSR and hydration | 32 additional catalog/brand checks across eight widths, with JavaScript disabled and enabled; no hydration console errors |
| Desktop comparison | Page 1/7/12 at 1440px: identical dimensions and pixels |
| Preservation | 558 protected file hashes unchanged; all product records unchanged; backend process unchanged |

The real browser verifier uses the live local API with **no response interception** and `--skip-seed`. A separate optional fixture gate checks deterministic edge scenarios. The screenshots dismiss consent only in the fresh test browser; user browser preferences were not changed. Backend tests were not rerun for this presentation-only continuation; the real API/database regression was rerun.

Evidence: [frontend commands](check-results.json), [real browser measurements](browser-results.json), [real browser log](logs/real-browser.log), [fixture browser log](logs/fixture-browser.log), [SSR/hydration checks](ssr-hydration-results.json), [API/database results](api-database-results.json), [source/data/process preservation](preservation.json), [final stand health](logs/stand-status.log).

## Screenshots

| Viewport | Catalog page 1 | Catalog page 7 | Catalog page 12 |
| --- | --- | --- | --- |
| 320px | [First](screenshots/catalog-page-1-320.png) | [Middle](screenshots/catalog-page-7-320.png) | [Last](screenshots/catalog-page-12-320.png) |
| 390px | [First](screenshots/catalog-page-1-390.png) | [Middle](screenshots/catalog-page-7-390.png) | [Last](screenshots/catalog-page-12-390.png) |
| 1440px | [First](screenshots/catalog-page-1-1440.png) | [Middle](screenshots/catalog-page-7-1440.png) | [Last](screenshots/catalog-page-12-1440.png) |

Brand first/middle/last and seven-page captures at the same widths are in `screenshots/`. Full-page context: [320px](screenshots/catalog-page-7-320-full.png), [1440px](screenshots/catalog-page-7-1440-full.png). These were checked against the existing Vympel presentation and the user's mobile requirements; no new Figma source was supplied.

## Local test stand

Still available at **http://127.0.0.1:3300/en/catalog?page=7** and **http://127.0.0.1:3300/en/brands/romanson?page=2**. Storefront HTTP **200**, backend readiness **UP**, PostgreSQL accepts connections, and there are **100** unique synthetic products.

Only the frontend was refreshed with `stand.ps1 RefreshFrontend`; backend PID **27736** and the existing PostgreSQL cluster were preserved. Frontend PID is **2256**. No reseed or database recreation occurred. PostgreSQL remains native **18.1** on loopback **55440**, backend on **18080**, storefront on **3300**. The local stand's existing image fallbacks and local-only configuration remain unchanged.

Run lifecycle/status commands from `scripts/pagination-stand/README.md`. Do not use Stop/Start or Seed for ordinary frontend changes; use RefreshFrontend.
