# Persistent zero-count filter options — 2026-10-24

The user's follow-up requires gender and other generated filters to retain zero-count values as disabled options. The backend now starts with active reference dictionaries instead of only values assigned to category products. Positive matches do not hide zero-count alternatives.

## Changes

- `CatalogFacetRepository.java`: dictionary-backed mechanism, gender, case/strap, glass, stone and interior options; conditional contextual counts preserved. Materials respect CASE/STRAP roles, interior options their feature type. Referenced legacy values remain available. No schema, DTO or dependency changes.
- `Catalog/Filters/index.tsx`: genuinely empty option lists display the existing localized unavailable message. Stone retains its display-only placeholder only when no real options are returned. Existing checkbox styling and selected-zero removal behavior remain unchanged.
- `CatalogFacetIntegrationTest.java`: nine integration cases cover contextual counts, zero results, gender with/without assigned products, zero options beside positive options, empty categories and typed dictionaries.
- `verify-zero-filters.mjs`: real API and desktop/mobile checks; does not mock responses or change fixture data.
- Both project memory documents and the stand README now describe persistent dictionary options.

## Verification

- Frontend: **265 tests / 45 files passed**; ESLint and TypeScript passed; production Next.js build passed through `RefreshFrontend`.
- Backend: `gradlew test bootJar` **BUILD SUCCESSFUL**; **360 tests: 359 passed, 1 skipped**, no failures/errors. All nine facet integration tests passed against isolated PostgreSQL 18 on port 55441. The existing external restored-database rehearsal is the skipped test; its dedicated environment was not requested. The isolated test database was stopped after the run.
- Real Edge browser at **1440px and 390px**: all three gender values show `(0)` and disabled checkboxes; strap/glass/stone also remain visible. Empty WATCH_CLASSIC retains every reference group; empty numeric sizes show the unavailable message. Empty interior API groups retain their typed options. No horizontal overflow or page errors.
- Existing browser regression checks passed: quartz/mechanical **41/2 → 8/1** with ceramic selected, Apply/Reset, URL/history/reload, valid broad price input and current tab preservation. Explicitly intercepted resilience checks also passed: empty-dictionary placeholder replacement, stale-response rejection and recovery after failed requests.
- `git diff --check` passed.

## Visual evidence

- [Desktop gender options](gender-1440.png)
- [Mobile gender options](gender-390.png)
- [Real API/browser results](browser-results.json)
- [Test and stand summary](verification.json)

Compared with the user's blank-panel screenshot: options now occupy the existing panel using the existing disabled checkbox style. Spacing, typography, Apply/Reset and responsive structure were preserved.

## Local stand and Git

Storefront `http://127.0.0.1:3300` returns HTTP 200; backend port 18080 readiness is UP. PostgreSQL on 55440 was not restarted (start time `2026-10-24 16:10:31.710019+05`); all **100 products and 43 detail records** are preserved. Only the owned frontend/backend processes were refreshed. No reseeding, deployment, push or merge occurred. At the user's request, the complete filter changes are included in a local commit on `codex/catalog-brand-pagination-search-order`; previous work is preserved in `b2d2cbb`.
