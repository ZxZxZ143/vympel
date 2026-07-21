# UI/UX and Responsive Audit

## Technical summary

Source-level inspection shows deliberate responsive work: a 320 px minimum, overflow guards, mobile/desktop breakpoints, responsive gallery sizing, reduced-motion handling, accessible dialogs, localized page content, and explicit mobile navigation. Current runtime visual certification is blocked because the required in-app browser controller could not bootstrap. REC-001 forbidden recommendation messaging was removed and covered by frontend regression tests on 2026-07-16; soft-404 status behavior remains, and several accessibility labels are still hard-coded in English.

## Coverage

- HTTP route matrix: home, catalog, brands, delivery, guarantee, payment, favorites, cart, about, product, category, and brand routes in ru/kz/en all returned 200.
- Locale roots emit correct `html[lang]` and viewport metadata.
- Source inspected for breakpoints, `overflow-x`, fixed overlays, dialogs, gallery controls, navigation, icon-button accessible names, table wrappers, and CMS layout breakpoints.
- Historical audit evidence: product 45 rendered the forbidden recommendation empty text in HTML. Current source and regression tests omit the complete recommendation section for empty/error results, and the live public API now returns valid alternatives for product 45; browser/viewport confirmation remains pending.
- Required current screenshots and interaction checks at desktop/tablet/mobile are blocked; see `SCREENSHOT_INDEX.md`.

## WEB-001 — Public missing routes render 404 content with HTTP 200

- **Severity:** High
- **Status:** Reproduced
- **Evidence:** Unknown path, missing product, unknown catalog category, and unknown brand returned HTTP 200 while rendering not-found markup.
- **Root cause:** Dynamic/catch-all pages invoke `notFound()` after server rendering/async data work has begun, allowing the response status to be committed as 200.
- **Required fix:** Restructure validation so missing entities/routes resolve to a real 404 before streaming commits, or use a routing/proxy strategy supported by the deployed Next version. Preserve localized 404 UI.
- **Acceptance criteria:** All four missing-route cases return HTTP 404 and correct localized UI; existing valid routes remain 200; metadata/canonical/sitemap exclude missing resources; tests assert both status and content.
- **Regression risks:** Disabling streaming or moving fetches can affect latency/caching; validate production behavior, not development server only.

## UI-001 — Some accessible labels are hard-coded in English

- **Severity:** Low
- **Status:** Confirmed by source inspection
- **Evidence:** Examples include `Main navigation`, `Language selector`, `Go to homepage`, `Pagination`, `Go to page`, and `Search` in otherwise localized public components.
- **Root cause:** Accessible strings were added directly in shared components instead of translation namespaces.
- **Required fix:** Move user-facing accessibility labels into the existing ru/kz/en message structure and pass labels into generic components.
- **Acceptance criteria:** Automated/source tests find no customer-facing hard-coded English labels in localized public navigation, pagination, search, dialogs, or carousels; screen-reader smoke tests pass in each locale.
- **Regression risks:** Generic components need safe required/default label APIs to avoid missing names.

## Responsive source observations

- Public CSS has explicit breakpoints at 360/374/640/768/1024/1280/1440 ranges, responsive `clamp()` sizing, horizontally scrollable breadcrumb/filter rails, mobile gallery heights, and overlay width caps.
- CRM uses horizontally scrollable table containers around 920/1180/1260 px minimum tables and layout breakpoints at 1400/1100/820/560 px.
- These patterns reduce obvious overflow risk but do not prove tap targets, focus trapping, sticky headers, virtual keyboards, zoom, or real text wrapping at the required viewports.

## Runtime visual verification still required

Repeat at minimum public 1440×900, 1024×768, 390×844, and 320×568; CRM 1440×900, 1024×768, and 768×1024. Exercise catalog filters/sort, navigation drawers, product gallery/lightbox/tabs/reviews/request dialog, cart/favorites, CMS editor, product forms, tables, confirmation dialogs, focus order, Escape/backdrop close, and long ru/kz/en text. Capture only meaningful failures and add every image to `SCREENSHOT_INDEX.md`.

## Screenshot blocker

`BLOCK-UI-001` is an audit-tool limitation, not an application defect: the in-app browser bootstrap failed with `Cannot redefine property: process` even after a clean kernel reset. No current screenshot is claimed.

## Step 8 closure - UI-001 - 2026-07-19

**Status:** RESOLVED in source/localization architecture; the separately scoped Step 9 pass still owns physical screen-reader and cross-viewport release evidence.

| Component/control | Previous accessible name source | User-facing | Translation namespace | Locales |
| --- | --- | --- | --- | --- |
| Desktop/header navigation landmarks | Hard-coded/default English | Yes | `nav.mainNavigation`, `nav.primaryNavigation` | RU/KZ/EN |
| Language selector | Hard-coded/default English | Yes | `nav.languageSelector` | RU/KZ/EN |
| Home icon/link | Hard-coded/default English | Yes | `nav.homeLink` | RU/KZ/EN |
| Pagination previous/next/page | Hard-coded/default English | Yes | `pagination.*` | RU/KZ/EN |
| Banner carousel region/previous/next/slide | Hard-coded/default English | Yes | `bannerCarousel.*` | RU/KZ/EN |
| Catalog breadcrumb landmark/ellipsis | Shared English fallback | Yes | `catalog.breadcrumbsAria` plus caller-provided localized ellipsis text | RU/KZ/EN |
| Philosophy watch images | Generic English alt | Yes | `philosophy.redWatchAlt`, `philosophy.blackWatchAlt` | RU/KZ/EN |
| Search/text inputs | Shared English fallback | Yes | Explicit localized label/placeholder prop | RU/KZ/EN at caller |
| Error retry/support UI | New Step 8 UI | Yes | `telemetry.*` / CRM `telemetry.*` | RU/KZ/EN |

- **Architecture/files:** Public RU/KZ/EN JSON, CRM RU/KZ/EN message maps, Header/Navigation/Pagination/BannerCarousel/Philosophy/CategoryBreadcrumb/TextInput, and both error-boundary UIs changed. Generic controls no longer depend on a fixed English accessible name; meaningful images have localized alt and decorative behavior remains empty-alt where applicable.
- **Configuration/migrations:** Translation resources only; no API or database change.
- **Tests/results:** All locale JSON parses structurally; CRM message tests pass; public/CRM tests and builds pass; a fixed-string search found none of the remediated English labels. Dynamic pagination parameters remain translated through the localization system.
- **Remaining risk:** Step 9 must perform language-switch accessibility-tree, keyboard, real screen-reader, mobile navigation, carousel, and dialog smoke checks. This pass does not claim screenshots or broad E2E coverage.

## Step 9 Final Reconciliation - 2026-07-19

Current production-build browser checks now cover public desktop/tablet/mobile routes down to 320 px and CRM at 1440/1280/1024/768 px. The Kazakh document emits `lang=kk`; final sampled states have one main landmark, no duplicate IDs/missing alt/document overflow; sheets/dialog close and restore focus. The 320 px banner collision was fixed. Final axe scans are zero on four representative pages. Formal assistive-technology user testing remains recommended. See `../vympel_final_release_verification/FINAL_UI_UX_VERIFICATION.md` and `FINAL_ACCESSIBILITY_VERIFICATION.md`.
