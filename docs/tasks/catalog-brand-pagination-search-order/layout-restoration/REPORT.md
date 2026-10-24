# Pagination layout restoration — 2026-10-24

Restored the original Vympel two-sided desktop composition while preserving the completed pagination/search implementation. Branch: `codex/catalog-brand-pagination-search-order`; HEAD unchanged at `3977907cc5e22ba30eea0cb41a160c4a67bb93ec`. No commit, push, merge, image publication or deployment.

## Layout and one shared state

One `ArkPagination.Root` and one Context still receive the API response's page, size and total. At >=1024px the root uses a horizontal flex line with space-between: compact text ranges on the left, the existing circular numeric links/arrows/ellipses on the right. Inactive ranges have transparent borders; the active range uses the existing dark pill and white text. Both link types have 44px targets and keyboard outlines. Below 1024px the bounded, horizontally scrollable range group sits above centered numbers. The active range is kept visible by adjusting only that group's scrollLeft.

Numeric controls render Ark `pages`. Range links use the contiguous segment containing the current page from that exact same model, bounded by Ark's ellipses. They do not calculate a separate window or maintain another page state. Wide screens (>=1280px) use sibling=2, showing five central range links; Ark may expand the segment near boundaries. 768–1279px uses sibling=1; smaller sizes retain the previous compact library settings. Both groups use the same `pageHref`, native localized links and Ark item click/selected semantics. There is one navigation landmark with two labeled groups. Range item IDs receive a suffix because rendering the same Ark page twice would otherwise duplicate its DOM ID.

Ranges use `(page - 1) * pageSize + 1` through `min(page * pageSize, totalElements)`. Catalog stays **9/page**; brands stay **15/page**. The 100th catalog item displays `100`; the 57-product brand unit case ends at `46–57`; actual Romanson's final page ends at `31–35`. No backend, DTO, database schema, matching/ranking, canonicalization, filters, sorting/reset, SSR loading or page metadata changed.

## Files changed in this continuation

- `vympel_front/src/components/ui/shared/Pagination/index.tsx`: two visual groups sharing the existing Ark model, corrected labels, responsive layout, horizontal reveal and unique IDs.
- `vympel_front/src/components/ui/shared/Pagination/index.test.tsx`: 40 focused tests for both groups, first/middle/last cases, moving windows, one-based/final ranges, 9/15 sizes, unique IDs and identical query-preserving hrefs.
- `vympel_front/src/messages/{en,ru,kz}.json`: localized range group, number group and item-range accessible labels.
- `vympel_front/scripts/test-pagination-browser.mjs`: update the existing optional fixture-browser selectors for two active groups and unique numeric items.
- `scripts/pagination-stand/stand.ps1`: `RefreshFrontend` builds a versioned isolated copy while the current site serves, then replaces only its Node process; records the successful build directory for later lifecycle commands.
- `scripts/pagination-stand/verify.mjs`: `--skip-seed`, separate evidence directory, range/number link equivalence, one navigation/history entry, unique IDs, keyboard focus, inclusive labels and responsive alignment checks.
- `scripts/pagination-stand/README.md`: frontend-only refresh and read-only verification instructions.
- `docs/PROJECT_MAP.md`, `docs/PROJECT_SKILLS.md`: current layout, Ark composition, lifecycle and test lessons; both Last Updated sections refreshed.
- This report and its JSON/log/screenshot evidence; the original implementation report links here as the latest layout update.

## Verification

| Check | Result |
| --- | --- |
| All frontend tests | **239 passed**, 44 files |
| Focused pagination tests | **40 passed** |
| Lint / typecheck / production build | Passed |
| Production-status matrix | Passed |
| Security header tests | 3 passed |
| Performance budgets | Passed: storefront **1.29 / 1.65 MiB**, assets 8.90 / 24 MiB, existing CRM build 1.51 / 1.53 MiB |
| Real API regression | 100 products / 12 catalog pages; six brand counts preserved; 26 Orion Atlas matches and unchanged relevance/explicit sort membership |
| Real browser | Passed RU/KZ/EN and **320/390/768/1024/1440px** |
| Dataset / unrelated files / backend source | Identical to pre-task snapshots |
| Backend tests | Not rerun: no backend files changed; real API regression passed. Prior full suite remains 329 passed / 22 skipped, including six ranking tests. |

Browser checks cover every catalog and brand page, shared active states and hrefs, correct rendered products, first/middle/last/direct navigation, reload and Back/Forward, numeric and range activation, one history entry per activation, keyboard Enter and visible focus, search/filter/sort preservation, sort reset, localized labels, single-page brand hiding, 44px targets, unique DOM IDs, unclipped active ranges, desktop same-line alignment and stacked mobile/tablet alignment. No horizontal document overflow or browser runtime error occurred. API requests use the actual loopback backend; no mocks/interception were used.

The initial browser harness exposed two timing/accounting issues: it could trigger Back before post-reload hydration settled, and its long traversal reached Chromium's 50-entry history.length cap. A focused probe confirmed both groups' actual history behavior; the final verifier awaits post-reload network completion and uses a fresh page for exact history-length assertions. These were test corrections, not changes to application routing. The final real-browser run passed. The earlier diagnostic is retained separately, not counted as a current application failure.

Evidence: [frontend gates](frontend-gates.json), [browser checks](browser-results.json), [real browser log](logs/real-browser.log), [DB/API results](api-database-results.json), [preservation and health](preservation-and-health.json), [git status](git-status.txt).

## Visual review

Compared the result with the user's text layout and the original repository component styling: left minimal text/dark pill, right outlined/dark circles, horizontal desktop alignment and responsive stacking. Representative desktop/mobile screenshots were inspected. No new Figma/image frame was supplied; no pixel-perfect claim is made.

- [Desktop catalog row, 1440px](screenshots/catalog-product-list-1440.png)
- [Desktop brand row, 1440px](screenshots/brand-product-list-1440.png)
- [Desktop catalog row, 1024px](screenshots/catalog-product-list-1024.png)
- [Mobile catalog row, 320px](screenshots/catalog-product-list-320.png)
- [Mobile brand row, 320px](screenshots/brand-product-list-320.png)
- [Full desktop catalog](screenshots/catalog-product-list-1440-full.png)
- [Full mobile catalog](screenshots/catalog-product-list-320-full.png)

The screenshots directory also contains both groups at 390/768px, full brand layouts, and relevance/price sorting cases.

## Running stand and preservation

[Catalog page 2](http://127.0.0.1:3300/en/catalog?page=2), [brand page 2](http://127.0.0.1:3300/en/brands/romanson?page=2), [backend readiness](http://127.0.0.1:18080/actuator/health/readiness).

Storefront HTTP 200; backend readiness UP; PostgreSQL accepts connections on 127.0.0.1:55440. Database process start time remains **2026-10-24 16:10:31.710019+05**, before this task. Backend PID **27736** is unchanged. Only the frontend process was replaced after a successful isolated build. The 100-product snapshot is byte-for-byte equivalent at the recorded fields to the preceding task's evidence; no seed was rerun, products removed or database recreated. All backend source hashes and unrelated frontend AGENTS.md / CLAUDE.md are unchanged. No staging/production access occurred.

For later storefront changes:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "E:\vympel_full\scripts\pagination-stand\stand.ps1" RefreshFrontend
```

Existing safe Stop/Restart commands remain documented in the stand README. Stand services remain available after verification. Git remains intentionally dirty with the original feature work plus this continuation: 24 modified tracked paths and 11 untracked entries (directories summarized). Existing Next critical / Zod high audit findings are unchanged; dependencies were not modified or upgraded and no security-clean claim is made.
