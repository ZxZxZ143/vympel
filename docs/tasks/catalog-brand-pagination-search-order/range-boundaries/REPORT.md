# Complete shared range window — 2026-10-24

The left range links now map the **complete `pagination.pages` sequence from the existing Ark Context**, including boundary pages and non-interactive ellipses. The previous contiguous-segment slicing was removed. There is still one controlled Ark Root, one page/count/size source, one URL builder, and one transition/selected-state model. No custom sliding-window algorithm or second pagination state was added.

The user explicitly chose **“Guarantee required links in both groups”** when the old responsive numeric window conflicted with always-present boundaries/neighbors. Accordingly, the shared settings are now `siblingCount=1`, `boundaryCount=1` at every width. Both groups render identical page and ellipsis tokens. Ark retains its edge expansion (it can show extra adjacent pages near the beginning/end) and its rule for displaying a single missing page instead of an ellipsis. At catalog page 7, the left sequence is exactly `1–9 … 46–54 [55–63] 64–72 … 100`.

The left preserves text links, dark active pill/white text, subtle hover, real hrefs, aria-current and keyboard outlines, with **no arrow buttons**. Numeric circles, arrow actions and URL semantics remain unchanged. Left item and ellipsis IDs have unique suffixes because rendering an Ark token twice otherwise duplicates IDs. Desktop keeps the left/right flex composition. Mobile/tablet wraps within each group so boundaries remain visible without page overflow; all controls keep 44px targets. Bounded desktop overflow and ResizeObserver keep active links accessible on resize without moving document scroll or keyboard focus.

Labels remain one-based/inclusive: `(page-1)*size+1` to `min(page*size,count)`, with one number when equal. Catalog is still **9/page**, brands **15/page**; final cases include `100`, `31–35` and `46–57`.

## Files changed in this continuation

- `vympel_front/src/components/ui/shared/Pagination/index.tsx`: complete shared Ark model, left ellipses, permanent boundaries/neighbors and responsive visibility.
- `vympel_front/src/components/ui/shared/Pagination/index.test.tsx`: 61 focused cases covering first, second, middle, penultimate and last pages for 2/3/5/7/12/100 pages at sizes 9/15; identical windows/hrefs, required neighbors/boundaries, no duplicates, correct gap handling, non-interactive ellipses, unique IDs and partial last ranges.
- `scripts/pagination-stand/verify.mjs`: real-browser window equivalence, boundary/neighbor presence, mobile visibility and screenshots for pages 1/7/12; no fixture writes with `--skip-seed`.
- `docs/PROJECT_MAP.md`, `docs/PROJECT_SKILLS.md`: current shared-window and responsive rules; both Last Updated entries refreshed.
- This report and its evidence; original task report links to this latest behavior.

No backend, API client, search/ranking, sorting/reset, filters, sizes, canonicalization, shared URL helper, translations, dependencies or unrelated UI source changed. Existing feature work and unrelated frontend AGENTS.md / CLAUDE.md were preserved.

## Verification

| Check | Result |
| --- | --- |
| Frontend tests | **260 passed**, 44 files |
| Focused pagination cases | **61 passed** |
| Lint / typecheck / production build | Passed |
| Production-status regression | Passed |
| Performance budgets | Passed: storefront 1.29 / 1.65 MiB; public assets 8.90 / 24 MiB; existing CRM build 1.51 / 1.53 MiB |
| Real DB/API regression | Passed: 100 products, 12 catalog pages, existing six-brand counts, 26 search matches and unchanged relevance/explicit sorting |
| Real browser | Passed RU/KZ/EN at 320/390/768/1024/1440 |
| Runtime browser errors | None |
| Source/data preservation | Backend hashes, unrelated agent files and all 100 product records unchanged |

Browser verification traverses all catalog/brand pages, clicks range and numeric links, checks equal URLs/results, active states, one navigation/history entry, reload/Back/Forward, keyboard focus, search/filter/sort preservation, reset, 44px targets, correct range formulas, identical left/right tokens and ellipses, no arrows on the left, unique IDs, desktop alignment, mobile visibility and no horizontal document overflow. It uses the real API with no response interception. The final screenshot check additionally checks that each required link is actually unobscured at its center point. Only the fresh test browser's cookie notice was dismissed via Necessary only; no user browser preferences were changed.

[Frontend gates](frontend-gates.json), [browser measurements](browser-results.json), [browser log](logs/real-browser.log), [screenshot visibility checks](logs/screenshot-checks.log), [DB/API assertions](api-database-results.json), [preservation/health](preservation-and-health.json).

## Screenshots

| Page | Desktop | Mobile |
| --- | --- | --- |
| 1 | [1440px](screenshots/catalog-page-1-1440.png) | [320px](screenshots/catalog-page-1-320.png) |
| 7 | [1440px](screenshots/catalog-page-7-1440.png) | [320px](screenshots/catalog-page-7-320.png) |
| 12 | [1440px](screenshots/catalog-page-12-1440.png) | [320px](screenshots/catalog-page-12-320.png) |

Full-page desktop captures and the catalog/brand width matrix are in the same screenshots directory. The layout was checked against the existing Vympel styling and the requested behavior; no new Figma frame was provided and no pixel-perfect claim is made.

## Retained local stand

- [Catalog page 7](http://127.0.0.1:3300/en/catalog?page=7)
- [Catalog last page](http://127.0.0.1:3300/en/catalog?page=12)
- [Brand page 2](http://127.0.0.1:3300/en/brands/romanson?page=2)
- [Backend readiness](http://127.0.0.1:18080/actuator/health/readiness): UP

HTTP checks returned 200. The existing PostgreSQL database (127.0.0.1:55440) and backend PID 27736 stayed running. `stand.ps1 RefreshFrontend` built a separate copy and switched only the frontend. No database recreation, reseeding or product deletion occurred. Backend tests were not rerun for this frontend-only change; the real API regression was rerun.

Branch remains `codex/catalog-brand-pagination-search-order`, HEAD `3977907cc5e22ba30eea0cb41a160c4a67bb93ec`; original dirty work is preserved. [Git status](git-status.txt). No commit, merge, push, Docker image publication, staging/production access or deployment. Existing dependency audit findings from the preceding task were not changed by this UI work.
