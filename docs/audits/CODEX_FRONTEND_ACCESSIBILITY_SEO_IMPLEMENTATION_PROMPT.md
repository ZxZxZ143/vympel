# Codex Implementation Prompt: VYMPEL Storefront Accessibility and Technical SEO

You are implementing confirmed accessibility, semantic HTML, technical SEO, crawlability, browser-compatibility, discoverability, and human-usability fixes for the VYMPEL public storefront.

This prompt is the finalized, reconciled implementation handoff for the accompanying exact-commit audit. Reproduce current behavior and reconcile source drift before editing; then execute the confirmed ledger in the dependency order below.

## Repository and Exact Base

- Repository: `https://github.com/ZxZxZ143/vympel`
- Audited branch: `main`
- Audited base commit: `1786e855e7a0b6a4797cdfae651e0dfe206709a2`
- Implementation scope: `vympel_front` only

Before editing, read `AGENTS.md`, `docs/PROJECT_MAP.md`, `docs/PROJECT_SKILLS.md`, this prompt, and `docs/audits/FRONTEND_ACCESSIBILITY_SEO_AUDIT.md`. Inspect every referenced file and symbol directly because the implementation task may start from a later commit; reconcile drift explicitly rather than applying stale instructions mechanically.

## Hard Exclusions and Non-Goals

- Do not change `vympel_crm`, backend source, database migrations, infrastructure, deployment configuration, Docker images, cloud resources, DNS, or production data unless the user grants separate authorization.
- If a confirmed storefront issue needs backend/API/CMS data changes, keep the storefront portion safe and document the exact external dependency instead of silently expanding scope.
- Do not redesign the storefront, replace its visual identity, invent marketing claims, fabricate reviews/ratings/prices/availability/business details, keyword-stuff content or alt text, or add schema fields that are not supported by visible content and trustworthy data.
- Preserve public functionality, responsive behavior, localized content unless demonstrably wrong, the exact six-brand/five-country catalog domain, and established CMS-first/static-fallback behavior.
- Avoid unrelated refactors and new dependencies. A dependency is allowed only when necessary, narrowly justified, documented, and verified through the repository's clean-install/security/runtime gates.
- Do not claim WCAG compliance or ranking outcomes. The target is implementation toward WCAG 2.2 Level AA with evidence-based verification.
- Do not publish images, create a release, deploy, or modify DNS.

## Current Architecture to Preserve and Improve

- Next.js App Router `16.2.12`, React `19.2.4`, TypeScript, Tailwind CSS 4.
- `next-intl` `4.13.2` with public route prefixes `ru`, `kz`, `en`; HTML language mapping must remain `ru`, `kk`, `en` through `src/i18n/htmlLanguage.ts`.
- Localized routes are under `src/app/[locale]`; route screens are generally composed under `src/screens`.
- Public API reads use `src/api/controllers/PublicController.ts`; Java/TypeScript contracts are manually mirrored but backend changes are excluded here.
- Canonical URL, alternate-language, sitemap, and robots behavior already exists in `src/lib/seo.ts`, `src/lib/sitemapCatalog.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, and route metadata. Improve that system rather than creating a parallel SEO layer.
- `NEXT_PUBLIC_SITE_URL` is a required origin-only public build value used for canonical metadata/discovery. The temporary staging host is not the permanent production domain.
- Radix/shadcn primitives own ordinary dialogs/sheets/tooltips/alert dialogs; Embla owns carousels; the root layout owns NProgress, toast/tooltip/request-dialog providers, header/footer, and mobile navigation.
- Frequently changed Home/About/Catalog/Product/Brand content is CMS-first with localized/device media fallbacks.
- Public cart/favorites remain SSR-safe localStorage state through `src/services/localProductStorage.ts`.

## Priority and Delivery Rules

1. Investigate the referenced current code and reproduce the issue before editing.
2. Implement every confirmed P0 and P1 item.
3. Implement P2 items unless a documented product decision or external dependency blocks them.
4. Treat P3 items conservatively; do not risk a visual redesign for speculative polish.
5. Prefer native HTML semantics. Do not add redundant/conflicting ARIA, indiscriminate `tabIndex=0`, focusable decoration, or screen-reader hiding just to silence a scanner.
6. Add sustainable automated regression tests and complete the manual matrix for behavior that automation cannot prove.
7. Review the complete diff, update `docs/PROJECT_MAP.md` and `docs/PROJECT_SKILLS.md`, commit relevant changes with the suggested message `fix(storefront): improve accessibility and SEO`, and push only through the normal repository workflow authorized for the implementation task.

## Initial Quality Gates

Run these from `vympel_front` using the current repository's required public build environment values:

```text
npm ci
npm run lint
npm run typecheck
npm run test
npm run test:security
npm run build
npm run test:production-status
npm run test:budgets:ci
npm run test:sharp-security
```

Also run targeted new tests, inspect generated production HTML and real HTTP responses, and perform the manual browser/accessibility/SEO matrix defined below. Do not use an unbounded dev/watch process as final evidence. Use a task-owned bounded production server when browser verification is required and stop only that process afterward.

## Confirmed Issue Ledger

### SEO-001 Localize and make public route metadata specific

Severity: P1
Affected routes: every indexable storefront route, especially Home, About, Catalog/category, Brands, Delivery, Payment, and Guarantee
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all; browser tabs, assistive technology, crawlers, and link previews

Current implementation:
- `src/app/[locale]/layout.tsx`, exported `metadata`: one Russian description is inherited by every locale and route;
- `src/lib/seo.ts`, `publicSeoMetadata`: sets title/canonical/languages/robots but no description;
- localized public route `generateMetadata` functions: Home is only `Vympel`; most static/category routes use the same English generic noun in all locales.

Problem:
- localized search/browser destinations are ambiguous and several titles use the wrong language;
- screen-reader document-title announcements do not reliably identify the destination;
- Next.js metadata inheritance retains the Russian layout description on KZ/EN, while Google recommends descriptive titles and accurate unique page descriptions and may rewrite mismatched titles;
- applicable guidance: official Next.js `generateMetadata` merge/inheritance behavior and Google Search Central title-link/snippet guidance.

Required implementation:
1. Design one typed metadata-content layer that supplies accurate localized title and description by route class while reusing the current canonical/alternate/robots utilities.
2. Provide reviewed RU/KZ/EN strings for Home and static/index routes through the existing locale/content architecture; derive category/brand labels from trusted localized route data instead of hard-coded English nouns.
3. Remove the cross-locale Russian-description inheritance: each indexable page must set its own localized description, with an intentional localized layout fallback only for unexpected descendants.
4. Preserve `kz` URL prefixes with `kk` HTML/hreflang language tags and RU `x-default`.
5. Do not invent claims, location, inventory, pricing, service promises, or keywords.

Constraints:
- preserve current routes, visual content, canonical origin contract, and reciprocal alternates;
- do not redesign pages or change visible localized content unless demonstrably incorrect;
- add no dependency for metadata;
- keep all new keys structurally complete in RU/KZ/EN and obtain product/content review for new copy where required.

Automated verification:
- extend `src/lib/seo.test.ts` and add focused route metadata tests beside the relevant route/lib tests;
- assert localized non-empty unique title/description for RU/KZ/EN across Home, static route, catalog/category, and brand cases; assert no Russian copy leaks into EN/KZ outputs;
- run `npm run test -- src/lib/seo.test.ts` plus the new targeted files, then the full quality gates.

Manual verification:
1. Inspect initial production HTML `<title>` and description on representative Home/static/catalog/brand routes in RU/KZ/EN.
2. Compare metadata language and subject with the visible H1/content.
3. Navigate by keyboard/screen reader and confirm the announced document title identifies the destination.

Acceptance criteria:
- every indexable route emits a truthful, route-specific localized title and description;
- no public KZ/EN route inherits Russian metadata;
- all existing canonical/hreflang and `x-default` assertions still pass.

Dependencies/blockers:
- approved localized marketing wording may require content-owner review; use concise truthful existing visible content, not placeholder/fake copy.

### SEO-002 Generate product metadata from the shared localized product result

Severity: P1
Affected routes: `/[locale]/product/[id]`
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all; browser tabs, assistive technology, crawlers, and link previews

Current implementation:
- `src/app/[locale]/product/[id]/page.tsx`, `generateMetadata`: returns `Vympel — Product` using only `locale` and `id`;
- the same file's `Page` calls `PublicApiController.getProduct` separately and supplies the real product only to the visible screen;
- observed behavior: the metadata cannot contain the product name/description and has a separate status/data path from the page.

Problem:
- users and assistive technology cannot identify which product opened from its document title;
- all product URLs expose the same generic search/link-preview metadata;
- independently fetching for metadata and page content risks request duplication and inconsistent missing/transient failure handling;
- applicable guidance: Next.js dynamic metadata and Google Search Central descriptive-title/programmatic product-description guidance.

Required implementation:
1. Introduce a request-memoized server product loader (React `cache` or the proven Next.js request-sharing pattern appropriate to this codebase) and use the same result in `generateMetadata` and `Page`.
2. Generate a localized title that includes the actual product name and a concise truthful description from existing reliable localized fields. Omit optional facts that are absent; never synthesize price, availability, rating, or description.
3. Preserve true 404 behavior for a confirmed missing product. Preserve a non-404 recoverable page for transient upstream/API failure and do not publish false product facts.
4. Keep canonical and reciprocal alternate URLs generated by the current SEO utility.

Constraints:
- no backend/API contract change and no duplicate product request per render;
- no fake structured-data or social fields (those are governed by their later issue sections);
- preserve ProductPage UI, cart/favorites/review behavior, and current error recovery;
- all copy/field formatting must work in RU/KZ/EN.

Automated verification:
- add focused tests for the product metadata/loader module and route behavior: successful localized product, confirmed 404, and transient API failure;
- assert the valid metadata contains the actual localized product name, no absent/fake fields, current canonical/alternates, and shared request behavior where sustainable;
- run the new targeted Vitest files and `npm run test`, `npm run typecheck`, and `npm run build`.

Manual verification:
1. Inspect initial production HTML for one valid representative product in RU/KZ/EN.
2. Verify an invalid product returns real HTTP 404 and a transient upstream failure does not become a false 404.
3. Compare title/description with the visible localized product and verify browser/back-forward navigation.

Acceptance criteria:
- valid product pages expose accurate localized product-specific metadata;
- missing products remain true 404s; transient failures remain recoverable and do not expose invented facts;
- metadata and page reuse one request result; current canonical/hreflang behavior remains correct.

Dependencies/blockers:
- representative localized product records from the existing public API.

### A11Y-001 Make closed language and brand disclosures unfocusable and align roles with keyboard behavior

Severity: P1
Affected routes: every route using the shared Header/Navigation
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: keyboard/screen reader; language at all sizes and brand disclosure at `xl`

Current implementation:
- `src/components/ui/layout/Header/index.tsx`, `Header` language popup: always-mounted buttons are hidden only by opacity/transform/`pointer-events-none`; `role="menu"` is not paired with menu keys or Escape handling;
- `src/components/ui/layout/Navigation/index.tsx`, desktop `brandsMenuId`: always-mounted brand anchors remain tabbable while visually closed and declared `menuitem` without managed menu focus;
- observed behavior: ordinary Tab can enter invisible controls, while announced roles promise unsupported keys.

Problem:
- keyboard and magnifier users lose visible focus and encounter an illogical sequence;
- screen readers receive a misleading menu interaction contract;
- browsers keep opacity-hidden/pointer-disabled native controls in sequential focus order;
- applicable standards: WCAG 2.2 2.4.3 and WAI APG Menu Button/Menu patterns.

Required implementation:
1. Prefer a native disclosure/navigation model for both popups: a button with accurate `aria-expanded`/`aria-controls`, plus a labelled list/group of ordinary buttons or crawlable anchors. Remove `menu`/`menuitem` roles unless the full APG keyboard model is intentionally implemented.
2. Ensure closed popup content is removed from the accessibility tree and sequential focus order (`hidden`/conditional rendering or an equivalent animation-safe method). `pointer-events-none`/opacity alone is insufficient.
3. Add Escape dismissal and logical focus return to the trigger; retain pointer outside-click dismissal without making it the only mechanism.
4. Preserve locale replacement on the same logical route, navigation progress behavior, and real brand anchors.

Constraints:
- keep the current visual appearance/transitions as closely as possible and honor reduced motion;
- retain exactly RU/KZ/EN and six public brands;
- do not replace links with click-only buttons or introduce a dependency;
- accessible names and control text must remain localized.

Automated verification:
- add focused tests for `Header` and `Navigation` using the existing Vitest/Testing Library setup or nearest shared-component test location;
- assert closed descendants cannot be tabbed/queried as exposed controls, state attributes toggle, Escape closes/restores focus, and selection/navigation still produces correct locale/brand destinations;
- run targeted tests followed by `npm run test`, `npm run typecheck`, and `npm run build`.

Manual verification:
1. Keyboard-tab both popups while closed and open in all three locales.
2. Operate with Enter/Space/Escape; if menu roles remain, also prove Arrow Up/Down, Home/End, and managed item focus.
3. Confirm visible focus never enters closed content and each route/locale action still works.

Acceptance criteria:
- no invisible tab stops exist;
- role/state and documented keyboard behavior match;
- Escape/outside/selection closure returns focus logically;
- locale switching and crawlable brand navigation remain correct.

Dependencies/blockers:
- none.

### A11Y-002 Replace the custom mobile navigation modal with the proven focus-managed dialog pattern

Severity: P1
Affected routes: every route exposing `Navigation` below `xl`
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: 320-1023 CSS px; keyboard, screen reader, switch input, magnifier

Current implementation:
- `src/components/ui/layout/Navigation/index.tsx`, `Navigation` mobile branch: conditionally renders `role="dialog" aria-modal="true"` and locks scroll;
- no trigger/dialog focus ref, initial focus, Tab containment, background inertness, or focus restoration exists;
- Escape closes state but does not implement a complete modal focus lifecycle.

Problem:
- focus stays behind the visual overlay or can escape to obscured page controls;
- `aria-modal` tells assistive technology the outside is inert when the code does not enforce it;
- browser focus order becomes disconnected from the visible UI;
- applicable standards: WAI APG Modal Dialog and WCAG 2.2 2.4.3/2.4.7.

Required implementation:
1. Use the installed Radix Dialog primitive or refactor to a shared proven modal wrapper, following the same foundation as `src/components/CatalogPage/CatalogMobileSheet/index.tsx`; do not hand-roll a focus trap.
2. Keep a visible title connected by `Dialog.Title`/`aria-labelledby`, place initial focus appropriately, contain Tab/Shift+Tab, make background inert, close on Escape/overlay/close button, and restore focus to the opener when it remains.
3. Preserve close-on-link navigation and choose a logical focus outcome if the route transition removes the opener.
4. Retain body-scroll lock (or Radix-equivalent), responsive geometry, reduced-motion handling, and all existing links/sections.

Constraints:
- preserve visual identity, breakpoints, contact/catalog/info/six-brand contents, localized labels, and SmartSearch interaction;
- use existing dependencies only;
- avoid nested-dialog regressions with Search/Catalog overlays.

Automated verification:
- add a `Navigation` interaction test that opens the mobile dialog, confirms accessible name and internal focus, cycles Tab/Shift+Tab, rejects background focus, and closes/restores on Escape and the close button;
- test close-on-route-link behavior and reduced-motion classes/state without brittle pixel assertions;
- run targeted tests and all quality gates.

Manual verification:
1. At 320, 375, 768, and 1023 CSS px, open by keyboard and verify initial/contained/visible focus.
2. Verify screen-reader dialog name and that background controls are not navigable.
3. Close by Escape, overlay, close button, and route link; verify focus restoration/logical route focus and body scroll recovery.

Acceptance criteria:
- focus enters and stays within the labelled modal while open;
- background is inert; Escape and all close paths work; focus returns logically;
- no shared navigation content, link crawlability, responsive behavior, or reduced-motion support regresses.

Dependencies/blockers:
- none; Radix already exists in the repository.

### A11Y-003 Give users persistent control of Home and About carousel rotation

Severity: P1
Affected routes: `/[locale]` Home hero/Brands and `/[locale]/about` Instagram sections
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all; keyboard, screen reader, cognitive/attention-sensitive users, reduced motion

Current implementation:
- `src/components/HomePage/bannerCarousel/index.tsx`, `BannerCarousel`: Embla Autoplay loops every 5 seconds, stops only on pointer hover/interaction, and has no Stop/Start control;
- `src/components/HomePage/BrandsCarousel/index.tsx`, `BrandsCarousel`: same pattern at 10 seconds;
- `src/components/AboutPage/InstagramSlider/index.tsx`, `AboutInstagramSlider`: loops every 3.5 seconds with `stopOnInteraction:false`;
- none checks keyboard focus or `prefers-reduced-motion`.

Problem:
- content changes while users read/navigate and cannot be persistently paused;
- AT focus/virtual-cursor context can change unexpectedly;
- auto movement continues despite reduced-motion preference;
- applicable standards: WCAG 2.2 2.2.2 and WAI APG Carousel.

Required implementation:
1. Add a localized rotation-control button as the first carousel tab stop in every auto-rotator; its name must express the available action (Stop rotation / Start rotation).
2. Stop autoplay when focus enters, on any user carousel interaction, and on hover. Do not restart after focus/interaction until the user explicitly activates Start.
3. Initialize rotation off when `prefers-reduced-motion: reduce` matches; allow intentional manual Start if product policy permits.
4. Preserve manual previous/next/picker/swipe operation and active timing/design when rotation is enabled.

Constraints:
- keep Embla and existing content/design; no dependency addition;
- add complete RU/KZ/EN labels;
- prevent hydration/plugin recreation from silently restarting paused rotation.

Automated verification:
- add fake-timer/component tests for auto advance, Stop/Start, focus/interaction stop, no automatic restart, and reduced-motion initial state;
- assert localized action names in every locale;
- run targeted tests plus all quality gates.

Manual verification:
1. Observe each carousel for more than one interval and operate Stop/Start.
2. Tab into it and confirm rotation remains stopped after focus moves elsewhere until explicit Start.
3. Reload with reduced motion and verify no auto advance.

Acceptance criteria:
- all three carousels satisfy persistent pause/restart, focus-stop, hover-stop, and reduced-motion behavior with visible localized keyboard controls.

Dependencies/blockers:
- none.

### A11Y-004 Correct shared carousel focus visibility, slide exposure, picker roles, and localized names

Severity: P1
Affected routes: Home hero/Brands/product sections and every shared `Carousel`/`CarouselDots` consumer
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all keyboard/screen-reader modes; narrow viewports especially

Current implementation:
- `src/components/ui/Carousel.tsx`, `CarouselItem`: every clipped/off-screen slide and its descendants remain exposed/focusable;
- `src/components/HomePage/bannerCarousel/index.tsx` and `BrandsCarousel/index.tsx`: arrow buttons are opacity-hidden/pointer-disabled until mouse hover, but remain tabbable and do not reveal on focus;
- `src/components/ui/shared/CarouselDots/index.tsx`: uses `tablist`/`tab` without tabpanels, controls, roving tabindex, or tabs keys and defaults to English labels;
- shared default arrows are English and Brands has no region label.

Problem:
- keyboard focus enters invisible arrows/off-screen slide controls;
- screen readers receive incomplete carousel/tab relationships and wrong-language names;
- focus order/visibility and name-role-value do not match presentation;
- applicable standards: WCAG 2.2 2.4.3, 2.4.7, 4.1.2 and WAI APG Carousel.

Required implementation:
1. Extend the shared carousel to expose visible slide state and remove fully off-screen interactive descendants from sequential focus and AT navigation while retaining their crawlable anchor markup. Correctly support multiple simultaneously visible/partially visible product slides.
2. Make Previous/Next visible when keyboard focus is within the carousel (or always visible at that breakpoint); never allow focus on an opacity-hidden control.
3. Replace dot `tab` roles with a localized labelled group of native buttons unless full tabs+tabpanel semantics, relationships, and roving arrow-key navigation are implemented.
4. Label every carousel region, slide (`n of total` plus useful visible label where available), picker group, and control through next-intl.
5. Handle Embla select/reInit/resize without stranding focus; preserve swipe/arrows/pickers.

Constraints:
- preserve Embla, layout, responsive slide counts, crawlable links, and Home design;
- do not hide partially visible usable product cards;
- no dependency addition; add RU/KZ/EN key parity.

Automated verification:
- create shared `Carousel`/`CarouselDots` tests for visible vs off-screen tab order/AT state, multiple visible slides, arrow focus visibility, picker role/keys, labels, selection, and reInit/resize;
- add Home consumer assertions for localized regions/control labels;
- run targeted tests and full gates.

Manual verification:
1. Tab/Shift+Tab each Home carousel at 320, 768, and desktop widths.
2. Inspect screen-reader region/slide/control announcements in RU/KZ/EN.
3. Use touch/swipe, arrows, picker buttons, resize, and zoom; verify no invisible/off-screen focus and anchors remain discoverable.

Acceptance criteria:
- only visible usable slide content is sequentially focusable; every focused control is visible;
- picker semantics and keyboard behavior match; all names are localized; regions/slides are understandable;
- crawlable destinations and responsive interaction remain intact.

Dependencies/blockers:
- none.

### SEO-003 Unify category internal links, canonicals, hreflang, and sitemap on path URLs

Severity: P1
Affected routes: every catalog category and legacy `?categoryCode=` equivalent
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all users and crawlers

Current implementation:
- `src/config/routes.ts`, `routes.category`/`catalogLinks`/`categorySelectionCatalog`, and `src/utils/CreateCategoryLink.ts`: generate `/catalog?categoryCode=CODE&page=1`;
- desktop/mobile/Home/breadcrumb consumers use those builders;
- `src/lib/sitemapCatalog.ts` and `src/app/[locale]/catalog/[...slug]/page.tsx`: publish/self-canonical `/catalog/CODE`;
- the query category route canonicals to plain `/catalog`.

Problem:
- internal-link, canonical, and sitemap signals disagree and duplicate every category;
- users share/bookmark two route shapes for one state;
- canonical category paths are effectively sitemap-orphaned;
- applicable guidance: Google canonical/internal-link consistency.

Required implementation:
1. Make `/catalog/{encodeURIComponent(categoryCode)}` the only category URL, with allowed search/filter/sort/page query parameters appended to that path.
2. Update every route builder and category consumer; preserve next-intl locale handling and real anchors where navigation is a link.
3. Add one permanent server/proxy redirect from legacy `?categoryCode=CODE` to the path, preserving allowed non-category parameters, removing default `page=1`, and preventing loops.
4. Keep canonical, reciprocal hreflang, sitemap, breadcrumbs, and internal links byte-consistent; return true 404 for invalid category codes.

Constraints:
- preserve backend category-code values and catalog request behavior;
- no hierarchy aliases/multiple slugs and no backend change;
- preserve bookmarks via redirect and all six-brand/five-country catalog filters.

Automated verification:
- extend `src/config/routes.test.ts`, SEO/sitemap tests, proxy/status tests, and navigation consumer tests;
- cover encoding, RU/KZ/EN, legacy redirect with allowed query, no loop, canonical/hreflang/sitemap match, and invalid 404;
- run targeted tests and all gates.

Manual verification:
1. Navigate every category entry surface and inspect/copy/reload/back/forward URLs.
2. Request legacy query forms and verify one permanent redirect.
3. Compare source anchors, canonical, hreflang, sitemap, H1/breadcrumb, and HTTP status.

Acceptance criteria:
- one indexable URL exists per locale/category and all discovery signals use it;
- legacy forms redirect once; valid functionality and invalid 404 behavior remain correct.

Dependencies/blockers:
- none.

### SEO-004 Server-render catalog products and replace button-only pagination with crawlable links

Severity: P1
Affected routes: clean Catalog/category page 1 and page n
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: crawlers, failed/no-JS, slow devices, all users

Current implementation:
- `src/components/CatalogPage/Catalog/index.tsx`, client `Catalog`: starts `goods=null`, server-renders skeletons, then fetches in `useFetch`;
- `src/components/ui/shared/Pagination/index.tsx` and `src/hooks/usePagination.tsx`: page destinations are buttons with router pushes, no anchor `href`;
- metadata canonicalizes page n to the base URL.

Problem:
- initial HTML has no product links/content and later pages are not crawlable through pagination;
- no/failed JS users never receive a resolved catalog;
- clean page n canonical signals are wrong;
- applicable guidance: Google crawlable links and ecommerce pagination.

Required implementation:
1. Parse normalized route/search state on the server, fetch the initial `Page<IProduct>`, and render real product cards/anchors or an honest server-resolved state. Hydrate client controls from that exact page without an immediate duplicate request.
2. Render pagination destinations as next-intl `<Link href>` anchors with `aria-current="page"`; optionally intercept ordinary clicks for progress/smooth scroll but preserve modified click/new-tab/copy-link/browser behavior.
3. Give clean page n a unique URL and self-canonical; include sequential next-page anchors from every page and first-page links as appropriate.
4. Define transient upstream failure, true empty catalog, invalid/out-of-range page behavior without false 404 or endless skeletons.

Constraints:
- preserve nine-item size, grid/card UI, filter/sort/search state, focus styles, reduced-motion scrolling, and no backend change;
- share/seed the initial request result; do not introduce two first-load requests.

Automated verification:
- add server-render/production-status tests for initial product anchors, page n links/self-canonical, modified link semantics where testable, one initial fetch, failure, empty, and out-of-range cases;
- update pagination component tests and run full gates.

Manual verification:
1. View source with JS disabled on catalog/category pages 1 and 2 in each locale.
2. Follow/copy/open-in-new-tab pagination links; test back/forward/focus/scroll/reduced motion.
3. Simulate slow/failed API and inspect HTTP/head/body.

Acceptance criteria:
- initial HTML is meaningful and product-link rich; every clean page is crawlably linked and self-canonical; enhancement retains current UX without duplicate fetch.

Dependencies/blockers:
- existing public API pagination data.

### SEO-005 Implement a deterministic catalog parameter indexability and crawl policy

Severity: P1
Affected routes: catalog/category URLs with page, search, sort, price, gender, dynamic filter, invalid/default/legacy parameters
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: crawlers; all user viewports

Current implementation:
- both catalog `generateMetadata` functions ignore `searchParams` and return `index,follow` plus base/path canonical;
- route builders and client controls generate combinable query URLs; clean page n is not distinguished from filters/sort/search;
- `robots.ts` has no catalog parameter policy.

Problem:
- combinatorial facets/search/sort can consume crawl resources and expose duplicate/low-value index candidates;
- clean pagination is incorrectly canonicalized to page 1;
- index/canonical hints are not a documented route-class decision;
- applicable guidance: Google faceted navigation, pagination, and URL structure.

Required implementation:
1. Create a typed pure catalog-URL classifier/normalizer used by metadata, route builders, redirects, and tests.
2. Policy: canonical clean catalog/category page 1 and clean page n are `index,follow` and self-canonical; search, nondefault sort, price, gender, and other facets are `noindex,follow` and canonical to the clean equivalent; default/reordered/duplicate params normalize; invalid combinations return/redirect per explicit safe rules.
3. Keep noindex URLs crawlable unless a separately justified robots rule is proven not to hide the directive. Exclude all noindex/filter/search variants from sitemap.
4. Return true 404 (or another explicitly justified status) for impossible/out-of-range states; never soft-404 them into generic content.
5. Add an extension point/documentation for future curated facet landing pages, but do not invent any now.

Constraints:
- preserve shareable filter UX, query state, API allowlists, locale paths, and canonical category model from SEO-003;
- do not block clean page n and do not use robots.txt as canonicalization;
- no fake landing-page copy.

Automated verification:
- table-driven tests for every route/parameter class and RU/KZ/EN, asserting normalized URL, status/redirect, robots, canonical, hreflang, internal link, and sitemap presence;
- include arbitrary/deprecated/duplicate/default/empty values and clean page n;
- run full SEO/route/status/build gates.

Manual verification:
1. Inspect rendered head/HTTP for the full route-class matrix.
2. Run a bounded crawl and verify canonical/noindex discovery behavior.
3. Confirm all filtered/search URLs remain usable/shareable.

Acceptance criteria:
- every parameter class has deterministic tested behavior; only clean catalog/category pagination is indexable; noindex is crawl-visible; sitemap contains only canonical indexable URLs.

Dependencies/blockers:
- product decision only if named curated facet landing pages are later requested.

### A11Y-005 Announce catalog, quick-search, cart, and favorites async outcomes and correct popup semantics

Severity: P2
Affected routes: Catalog, Cart, Favorites, plus SmartSearch on Home/Catalog/Product
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: screen reader, keyboard, magnifier; all viewports

Current implementation:
- `src/components/CatalogPage/Catalog/index.tsx` and Pagination: no busy/result-count status or deliberate post-update focus convention;
- `src/components/ui/shared/SmartSearch/index.tsx`, `SmartSearchPanelContent`: only loading is live; success/empty/error/rate-limit changes are silent and input popup state is incomplete;
- `src/screens/CartPage/index.tsx`, `src/screens/FavoritesPage/index.tsx`, and shared `ErrorState`: client refresh loading/error/empty/results are visually inserted without a result-owner busy state or concise settled announcement;
- Category/Filters/Sort desktop triggers claim `listbox` while panels contain buttons/forms/radiogroups.

Problem:
- meaningful async changes are visible but not announced;
- popup roles promise interaction structures that do not exist;
- keyboard/magnifier context after page/filter changes is unclear;
- applicable standards: WCAG 2.2 4.1.3, 4.1.2, and focus-order principles.

Required implementation:
1. Add a concise localized polite atomic result-status channel for catalog loading completion/count/empty/error and accurate `aria-busy` on the results container.
2. Announce SmartSearch result count/no-result/error/rate-limit once per meaningful settled transition; do not announce every debounce/skeleton/keystroke.
3. Expose accurate input `aria-expanded`/`aria-controls` and disclosure/result-group semantics, or implement a full combobox pattern only if its keyboard model is genuinely needed.
4. Remove false `aria-haspopup="listbox"` from Category/Filter/Sort; use disclosure/group semantics on desktop and dialog semantics only for Radix mobile sheets.
5. Preserve focus on the invoking control while announcing updates; after pagination, keep focus visible/logical and offer a deliberate results-heading/list focus path without surprise focus moves.
6. Give Cart/Favorites/similar-results owners accurate `aria-busy` and localized settled count/empty/error status. Allow shared `ErrorState` to opt into a live/alert mode only for errors inserted after user-visible async work; do not make every server-rendered error globally assertive.

Constraints:
- avoid noisy live regions and automatic focus on every filter input;
- preserve URL/history, Radix modal focus, existing layouts, and localized strings;
- no dependency addition.

Automated verification:
- tests for busy->success/empty/error/rate-limit announcements in Catalog, SmartSearch, Cart, Favorites, and similar results; result counts; no duplicate chatter; popup roles/state; trigger focus restoration; and pagination focus/status;
- run targeted tests/full gates.

Manual verification:
1. Use NVDA/available screen reader while typing, retrying, filtering, sorting, paginating, hydrating a stored cart, and refreshing favorites/similar products.
2. Verify keyboard and 400% magnifier focus/context.
3. Inspect accessibility tree roles/states in each responsive variant.

Acceptance criteria:
- each settled async outcome is announced once in the correct locale; busy/focus are accurate; popup roles match implemented controls.

Dependencies/blockers:
- none.

### A11Y-006 Move product lightbox onto the proven focus-managed dialog foundation

Severity: P1
Affected routes: product pages with usable images
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all; keyboard, screen reader, switch, magnifier

Current implementation:
- `src/components/ProductPage/ProductGallery/index.tsx`, `isLightboxOpen` branch/effect: custom `role="dialog" aria-modal="true"`, scroll lock, Escape/arrows, but no initial/trapped/restored focus or inert background;
- shared carousel inside also inherits A11Y-004 visibility behavior.

Problem:
- focus remains behind or escapes the visual modal and closing loses image context;
- accessibility-tree modal promise is false;
- applicable standards: WAI APG Modal Dialog and WCAG 2.4.3/2.4.7.

Required implementation:
1. Rebuild the lightbox using installed Radix Dialog/shared wrapper; connect a localized title/name, safe initial focus, containment/inertness, Escape/overlay/button close, and exact opener restoration.
2. Preserve gallery arrow/swipe keys without conflicts; apply A11Y-004 visible-slide focus rules inside.
3. Guarantee body scroll and focus recovery for every unmount/route/resize close path.

Constraints:
- retain image order, zoom visual design, thumbnails, swipe/arrows, localized names, and current dependency set.

Automated verification:
- tests opening from main image and thumbnails, internal/cycled focus, inert background, all close paths/restoration, arrow navigation, and failed images.

Manual verification:
1. Keyboard/screen-reader at mobile, desktop, and 400% zoom.
2. Change slides and cycle Tab/Shift+Tab.
3. Close by every path and verify exact logical opener/scroll.

Acceptance criteria:
- labelled modal owns focus/background and restores context with all gallery behavior intact.

Dependencies/blockers:
- none.

### A11Y-007 Complete the product tabs keyboard model

Severity: P2
Affected routes: all valid product pages
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: keyboard/screen reader; all viewports

Current implementation:
- `src/components/ProductPage/ProductInfoTabs/index.tsx`, `ProductInfoTabs`: five role=tab buttons all tabbable; click-only selection; no roving tabindex or Left/Right/Home/End;
- one correctly labelled shared tabpanel updates.

Problem:
- widget role promises standard tabs keys that are absent and adds unnecessary Tab stops;
- applicable standards: WAI APG Tabs, WCAG 2.1.1 and 4.1.2.

Required implementation:
1. Add roving tabindex, Left/Right with wrap, Home/End, and an intentional automatic or manual activation model documented in tests.
2. Keep `aria-selected`, stable IDs/controls/panel label, and visible focus synchronized.
3. Scroll the focused tab into view on narrow screens without unexpected page movement and respect reduced motion.

Constraints:
- keep five tabs/content/layout/localized labels and no new dependency.

Automated verification:
- role-based tests for one ordinary tab stop, all keys/wrap, selection/panel linkage, click/touch, focus visibility, and overflow visibility.

Manual verification:
1. Keyboard at 320/400%/desktop.
2. Screen-reader tab/tabpanel announcements.
3. Mouse/touch regression in all locales.

Acceptance criteria:
- APG keyboard/state/relationship behavior is complete and focused tabs stay visible.

Dependencies/blockers:
- none.

### HTML-001 Remove the false stock-notification form until a real contract exists

Severity: P1
Affected routes: unavailable/out-of-stock product pages
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all

Current implementation:
- `src/components/ProductPage/ProductSummary/index.tsx`, `submitStockNotify`: empty function with comment that no endpoint exists;
- visible form collects email/phone and submits without request, validation outcome, error, success, or announcement.

Problem:
- users can reasonably believe they registered when data was discarded;
- AT receives no status because no workflow exists;
- applicable standards for any real workflow: WCAG 3.3.1 and 4.1.3; basic honest form behavior.

Required implementation:
1. In this frontend-only task, remove the email/phone/submit notification affordance.
2. Replace it with reviewed localized truthful unavailable copy and an existing working contact/request action; do not imply notification registration.
3. Document the external contract needed before reinstating: authorized API, validation, consent/privacy/retention, rate limiting/abuse protection, success/error semantics, and live status.
4. If the user separately authorizes that full external work later, implement against the real contract only; never localStorage or fake success.

Constraints:
- no backend change, fake endpoint, silent local storage, or repurposed request type without product/API approval;
- preserve out-of-stock presentation and working marketplace/contact options.

Automated verification:
- assert unavailable UI has no dead notification form and approved replacement action is localized and functional;
- if a future endpoint exists, add contract/validation/rate-limit/status tests then.

Manual verification:
1. Activate every unavailable-product CTA with keyboard/screen reader.
2. Verify the outcome/copy is truthful and inspect network.
3. Confirm no contact field silently discards data.

Acceptance criteria:
- no notification claim exists without a real acknowledged workflow; replacement is truthful and works.

Dependencies/blockers:
- full stock notification requires separately authorized backend/privacy/product work.

### I18N-001 Map the KZ route locale to `kk-KZ` for review dates

Severity: P2
Affected routes: product Reviews
Affected locales: KZ/KK
Affected viewports/input modes: all

Current implementation:
- `src/components/ProductPage/ProductReviews/index.tsx`, `dateFormatter`: passes next-intl route token `kz` directly to `Intl.DateTimeFormat`;
- Node 24 resolves `kz` to `ru-KZ`, while price formatting already maps it to `kk-KZ`.

Problem:
- Kazakh pages can show/pronounce Russian-format review dates and runtime fallbacks differ;
- applicable standard: WCAG 3.1.2 and correct BCP 47/Intl usage.

Required implementation:
1. Create/reuse one typed app-locale-to-formatting-locale map: RU `ru-RU`, KZ route `kk-KZ`, EN `en-US`.
2. Use it for review dates and consolidate the existing price mapping without changing route prefixes or HTML/hreflang mapping.
3. Audit other direct Intl consumers and prevent raw `kz` from reaching Intl.

Constraints:
- keep public URL `kz`, HTML/hreflang `kk`, and current date information; no translation invention.

Automated verification:
- formatter tests for all locales and review KZ output/resolved locale, avoiding brittle ICU punctuation when possible.

Manual verification:
1. Compare same review date in RU/KZ/EN.
2. Verify Chromium/Firefox/WebKit-compatible results.
3. Confirm prices remain unchanged/correct.

Acceptance criteria:
- KZ dates use Kazakh `kk-KZ`; RU/EN correct; no route change.

Dependencies/blockers:
- none.

### HTML-002 Remove the generic Instagram placeholder or configure truthful official destinations

Severity: P2
Affected routes: Footer globally and About Instagram section
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all

Current implementation:
- `src/config/routes.ts`, `CONTACT_LINKS.instagram`: `https://www.instagram.com/` root placeholder;
- `src/components/ui/layout/Footer/index.tsx`: labelled Instagram anchors use it;
- `src/components/AboutPage/InstagramSlider/index.tsx`: four cards labelled as individual posts all use the same generic root;
- project map explicitly says the real URL is unknown.

Problem:
- labels and imagery promise Vympel/profile/post destinations that the links do not provide;
- all users, including AT users, reach an unrelated generic platform page;
- applicable standard: WCAG 2.4.4 link purpose and honest UI behavior.

Required implementation:
1. Introduce an optional validated public configuration/content value for the approved official Instagram profile URL; do not hardcode a guessed handle.
2. When absent or still the platform root, render no focusable Instagram link. Preserve layout with noninteractive imagery/text only if it still has a clear purpose.
3. If only a profile URL exists, label/link one profile CTA accurately; keep individual post link names only when CMS/config supplies each real approved post URL.
4. Validate absolute HTTPS host and safe new-tab rel behavior; document the operational value without including secrets.

Constraints:
- no guessed/scraped handle, fake post URL, private token, or backend change;
- preserve About/Footer visual balance and A11Y-003/004 behavior if a useful carousel remains;
- accessible name must match profile vs post destination.

Automated verification:
- config/consumer tests reject generic Instagram root, unsafe hosts/URLs, and mismatched post labels; assert absent config yields no misleading anchor and valid config yields correct target/rel/name.

Manual verification:
1. Activate every Footer/About Instagram affordance at mobile/desktop.
2. Verify destination, link name, new-tab behavior, and focus count.
3. Test absent configuration and all locales.

Acceptance criteria:
- no generic placeholder is focusable/published; every Instagram link reaches the approved destination its name describes; missing data is honest.

Dependencies/blockers:
- official Vympel profile URL and optional real post URLs must be supplied by the owner.

### A11Y-008 Associate every request/review validation error with its invalid field

Severity: P2
Affected routes: global customer-request dialog and `/[locale]/product/[id]` review form
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: screen reader, speech input, keyboard; all viewports

Current implementation:
- `src/components/CustomerRequestDialog/CustomerRequestDialogProvider.tsx`, `RequestField`: visual errors follow controls but have no stable ID, `aria-invalid`, `aria-describedby`, `aria-errormessage`, or live/alert behavior; invalid submit adds only a generic toast;
- `src/components/ProductPage/ProductReviews/index.tsx`: review errors have `role="alert"` but are not explicitly owned by the textarea/rating group and controls do not expose invalid state;
- both forms use React Hook Form with `noValidate`, so this contract must be implemented by the application.

Problem:
- assistive technology cannot reliably determine which field/group failed and which correction belongs to it;
- incidental wrapping-label text is not a robust error association;
- applicable standards: WCAG 2.2 3.3.1, 3.3.3, and 4.1.2 plus WAI form-error guidance.

Required implementation:
1. Give every help/error node a stable field-derived ID and each input/textarea/fieldset/rating control an explicit accessible label relationship.
2. Set `aria-invalid=true` only while invalid and reference current help/error text with `aria-describedby` and/or `aria-errormessage`; remove stale references when resolved.
3. Announce newly introduced errors concisely (`role=alert` or a single form summary), focus the first invalid actionable control after submit, and prevent duplicate toast+field chatter.
4. Model rating as one labelled group with its error/invalid state; preserve its visual stars and keyboard-operable native buttons or adopt native radio semantics consistently.
5. Keep the email-or-phone cross-field rule understandable: both fields may identify the shared requirement, but correction of either must clear the relevant error state.

Constraints:
- preserve React Hook Form, honeypot, API payload, phone formatting/caret, optional fields, rate-limit countdown, modal focus behavior, and all localized copy;
- no backend/dependency/design change.

Automated verification:
- submit empty contact, malformed email/phone, overlong fields, missing rating, and invalid review text; assert first-error focus, invalid state, referenced error text, alert count, clearing, and RU/KZ/EN values;
- retain successful submit/rate-limit/API-error tests.

Manual verification:
1. Submit/fix each path with NVDA/available screen reader and keyboard.
2. Confirm the field name, invalid state, correction, and first focus target are announced once.
3. Verify dialog focus trap/close restoration and phone caret are unchanged.

Acceptance criteria:
- every visible validation error is programmatically associated, introduced once, cleared correctly, and reachable through first-error focus.

Dependencies/blockers:
- none.

### A11Y-009 Preserve logical keyboard focus after cart/favorite removal

Severity: P2
Affected routes: `/[locale]/cart`, `/[locale]/favorites`
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: keyboard, screen reader, switch input; all viewports

Current implementation:
- `src/screens/CartPage/index.tsx`, `removeCandidate`/`clearProducts`: confirming removes the controlled AlertDialog invoker or all item controls without selecting a surviving focus target;
- `src/screens/FavoritesPage/index.tsx` + `src/components/GoodCard/index.tsx`, `toggleFavoriteHandler`: removing a favorite unmounts the focused card immediately;
- `src/components/ui/alert-dialog.tsx`: Radix restoration works only while the original element remains connected.

Problem:
- focus may fall to `body`/page start after a destructive mutation, losing list position and confirmation context;
- applicable guidance: WCAG 2.2 2.4.3 and WAI predictable/persistent keyboard-focus practice.

Required implementation:
1. Before removal, identify next surviving item action; otherwise previous; otherwise the post-mutation empty-state primary action or page H1. Store stable product IDs, not brittle array-only indexes.
2. After the DOM commit, verify the target is connected/visible and focus it without an unexpected scroll. For clear-all, focus the empty-state action/heading.
3. Preserve cancel/Escape restoration to the original invoker and do not retain invisible deleted nodes.
4. Coordinate favorite undo: do not steal focus when an item reappears through a toast action; keep the user's current logical context.
5. Apply explicit focus movement for keyboard/AT activation; confirm pointer activation is not made disruptive.

Constraints:
- preserve Radix AlertDialog, product order, toasts/undo, local-product storage/API snapshots, touch behavior, and visuals;
- no timing-only arbitrary delays; use refs/state/layout lifecycle deterministically.

Automated verification:
- cart first/middle/last/only removal, clear, cancel, favorite first/middle/last/only removal, and undo; assert one connected visible logical focus owner and no body fallback.

Manual verification:
1. Repeat with Tab/Shift+Tab/Enter/Escape and NVDA.
2. Confirm next/previous/empty-state announcements and no viewport jump.
3. Repeat while snapshot refresh is pending/erroring.

Acceptance criteria:
- every keyboard destructive mutation leaves focus on exactly one intentional visible target; cancel restores; pointer users are not interrupted.

Dependencies/blockers:
- none.

### I18N-002 Make global-error copy and document language match RU, KZ/KK, and EN

Severity: P1
Affected routes: unrecoverable root/layout error state for every locale
Affected locales: KZ/KK and EN (RU is current fallback)
Affected viewports/input modes: all, especially screen readers/pronunciation tools

Current implementation:
- `src/app/global-error.tsx`, `GlobalError`: server state always initializes RU because `document` is absent;
- the client accepts `ru|kz|en`, while normal `src/app/[locale]/layout.tsx` uses `toHtmlLanguage` and emits `kk` for `/kz`, so Kazakh falls to RU;
- `<html lang={locale}>` would emit project route token `kz`, not the standards tag `kk`.

Problem:
- critical recovery UI can switch language and document pronunciation; server/client derivation can disagree;
- applicable standard: WCAG 2.2 3.1.1 and HTML `lang` requirements.

Required implementation:
1. Extract a dependency-light tested resolver accepting route prefixes (`ru|kz|en`) and HTML tags (`ru|kk|en`) and returning both copy key and standards HTML tag.
2. Establish an architecture-safe initial locale contract for `global-error`: pathname/document fallback on the client plus a neutral or correctly injected server fallback that cannot hydrate to different content. Follow current Next.js global-error constraints.
3. Emit only `ru`, `kk`, or `en` on `<html lang>`; keep `/kz` public URLs unchanged.
4. Preserve minimal inline recovery styling, telemetry, and reset. Do not require next-intl/layout context that may be the failing layer.

Constraints:
- `global-error` must render its own `<html>/<body>` and remain resilient to app-graph failures;
- no cross-locale silent fallback on a supported route and no hydration suppression as a substitute for correctness.

Automated verification:
- server-render/hydrate `/ru`, `/kz`, `/en`, unknown/no prefix, and an existing `document.lang=kk`; assert copy/tag parity, no hydration error, telemetry, and reset.

Manual verification:
1. Force the root error harness for each locale and inspect response HTML plus hydrated DOM.
2. Verify Kazakh pronunciation/heading in available screen reader.
3. Confirm unknown/no-prefix fallback is documented and safe.

Acceptance criteria:
- each supported locale gets matching recovery copy; Kazakh emits `lang=kk`; no hydration mismatch or dependency on a failed provider.

Dependencies/blockers:
- none.

### I18N-003 Remove English fallback leakage from RU/KZ benefits and request-field content

Severity: P2
Affected routes: Home, Catalog, and every customer-request entry point
Affected locales: RU and KZ/KK
Affected viewports/input modes: all; Benefits H2 is exposed primarily through AT heading navigation

Current implementation:
- `src/components/Benefits/index.tsx`: visually hidden H2 is the literal English `Benefits` on every locale;
- `src/messages/ru.json` and `src/messages/kz.json`: `requestDialog.placeholders.name` equals English `Dear User`;
- A11Y-004 separately owns English shared-carousel default names.

Problem:
- key parity masks incorrect localized values and an unmarked language switch;
- applicable standard: WCAG 2.2 3.1.2 and localization consistency.

Required implementation:
1. Add a localized Benefits section-heading key under the existing relevant namespace and use it from `Benefits`; add the same key to RU/KZ/EN.
2. Replace RU/KZ `Dear User` with natural approved placeholder text or remove this nonessential example while preserving the visible field label and autocomplete.
3. Add a focused regression rule/test for known user-facing English defaults in shared storefront source; keep allowlists narrow for brand names, technical tokens, and genuine EN content.
4. Coordinate with A11Y-004 so shared component defaults cannot leak English when a caller omits a label.

Constraints:
- preserve section/H2 semantics, visually hidden treatment, message-key parity, input layout, and proper nouns;
- do not machine-translate product/CMS content.

Automated verification:
- assert Benefits heading and request placeholder for RU/KZ/EN; message parity; focused source default scan; full locale tests.

Manual verification:
1. Inspect RU/KZ/EN request dialogs and the accessibility-tree/heading list on Home/Catalog.
2. Confirm long translations do not affect layout.

Acceptance criteria:
- no English fallback remains in these RU/KZ surfaces and all new/changed messages maintain three-locale parity.

Dependencies/blockers:
- owner linguistic review is desirable for final RU/KZ wording but not a technical blocker.

### SEO-006 Remove the conflicting automatic HTTP hreflang alternate set

Severity: P1
Affected routes: every localized route handled by next-intl middleware
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: crawlers and all user agents receiving response headers

Current implementation:
- `src/i18n/routing.ts` lets next-intl emit its default HTTP `Link` alternate header;
- `src/lib/seo.ts` and route metadata independently emit the intended HTML alternates;
- the live `/ru` response uses `kz` and `x-default -> /` in the HTTP header while the HTML correctly uses `kk` and `x-default -> /ru`.

Problem:
- one document presents two contradictory locale graphs; `kz` is a route token, not the Kazakh language code;
- Google treats HTML, HTTP headers, and sitemap annotations as equivalent alternatives and gains no benefit from independently duplicated sets;
- applicable guidance: next-intl `alternateLinks` configuration and Google localized-version guidance.

Required implementation:
1. Set `alternateLinks: false` in the shared next-intl routing configuration so route metadata remains the single tested hreflang owner.
2. Keep `localizedAlternates` authoritative for `ru`, `kk`, `en`, and `x-default -> /ru`; preserve public `/kz` paths and `html lang=kk`.
3. If sitemap alternates are later retained or added, generate them from the same typed route mapping rather than another independent locale map.
4. Do not publish alternates on private/noindex/error routes unless the route policy explicitly supports equivalent localized documents.

Constraints:
- preserve required locale prefixes, locale detection policy, unsupported-prefix handling, and origin validation;
- do not rename public `/kz` URLs or emit `hreflang=kz`;
- introduce no dependency.

Automated verification:
- add middleware/production response assertions that the automatic HTTP alternate `Link` header is absent;
- assert HTML head reciprocity and exact language/destination values for representative static, category, product, and missing/private routes;
- verify sitemap output cannot disagree if alternate entries are introduced.

Manual verification:
1. Inspect actual response headers and initial HTML for RU/KZ/EN Home, Catalog/category, Product, and private/404 cases.
2. Confirm exactly one consistent alternate set is exposed and every indexable page self-references.

Acceptance criteria:
- no response exposes contradictory HTTP and HTML alternates;
- Kazakh is always `kk`, x-default follows `/ru`, and all indexable equivalents are reciprocal.

Dependencies/blockers:
- none.

### A11Y-010 Correct low-contrast request guidance and carousel/search controls

Severity: P2
Affected routes: customer-request entry points, Home Brands carousel, Catalog SmartSearch
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all; especially low vision, color-vision impairment, and bright/low-quality displays

Current implementation:
- `.customer-request-input::placeholder` and the actionable SmartSearch close icon use `#aaa` on white, 2.32:1;
- Brands dots use `#d2d2d2` at 1.51:1 and selected `#a1a1a1` at 2.58:1 on white;
- all are below their applicable WCAG 2.2 text/non-text thresholds. Disabled controls using these colors are exempt and are not part of this fix.

Problem:
- normal-size placeholder guidance requires 4.5:1 and necessary control/state graphics require 3:1 against adjacent colors;
- the close affordance and selected/unselected carousel state can be difficult to perceive.

Required implementation:
1. Introduce narrowly scoped semantic colors/classes for the request placeholder, SmartSearch close action, and Brands dot default/selected states.
2. Meet at least 4.5:1 for normal placeholder text and 3:1 for the required graphic/state boundaries on the actual solid background.
3. Preserve the existing dot size/shape distinction so state is not conveyed by color alone; verify hover, focus, selected, and disabled states independently.
4. Do not globally darken shared disabled tokens or assume image-backed hero controls pass from these solid-background results.

Constraints:
- preserve dimensions, layout, brand tone, visible focus styles, and valid disabled treatment;
- prefer existing darker tokens where they satisfy the measured threshold; avoid an unrelated token-system refactor.

Automated verification:
- add deterministic luminance/contrast assertions for the exact applied color pairs and focused component token/class tests;
- run an approved browser contrast scanner if one becomes available, followed by manual review of dynamic/image contexts.

Manual verification:
1. Inspect all specified controls on desktop/mobile and in forced/high-contrast mode where supported.
2. Confirm the close icon, both dot states, placeholder, hover/focus states, and disabled exceptions remain distinguishable.

Acceptance criteria:
- specified text is at least 4.5:1 and required control/state graphics are at least 3:1 in every relevant state without a visual/layout regression.

Dependencies/blockers:
- none.

### HTML-003 Decouple product-card heading levels from action layout and remove the logo heading

Severity: P2
Affected routes: every Header route; Home, Product, Brand, Favorites, Catalog, and other product-card compositions
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all; screen-reader heading navigation and document-outline consumers

Current implementation:
- `src/components/ui/layout/Header/index.tsx` renders the linked VYMPEL logo as H3 before the route H1;
- `src/components/GoodCard/index.tsx` chooses H2/H3 from `isCatalog`;
- `src/components/ui/shared/GoodsCarouselWithImage/index.tsx` passes `isCatalog={showProductActions}`, conflating action visibility with semantic nesting and making Home rail cards H2 peers of their H2 section.

Problem:
- the heading list starts at H3 branding before H1, while products inside a named rail appear as peer sections;
- one boolean controls unrelated visual/action and document-outline behavior;
- applicable guidance: WCAG 2.2 1.3.1 and WAI heading structure guidance.

Required implementation:
1. Render the linked Header logo as non-heading text while preserving the same typography and accessible link name.
2. Give `GoodCard` an explicit semantic heading-level/context prop independent of action visibility. Use H3 under H2 rails and H2 for top-level catalog/favorites grid articles where structurally appropriate.
3. Inventory every `GoodCard` and carousel call site; choose the level from the containing section and retain exactly one route H1.
4. Keep legitimate footer/section headings; do not flatten the entire document to satisfy a scanner.

Constraints:
- no visible typography/layout change and no loss of product article/link semantics;
- establish a safe explicit/default contract so future callers cannot accidentally couple actions and headings again.

Automated verification:
- add heading-outline tests for Header plus representative Home, Catalog, Product recommendations, Brand, and Favorites compositions;
- assert one H1, no branding heading before it, H3 cards under H2 rails, and appropriate H2 top-level grid cards.

Manual verification:
1. Inspect heading lists in RU/KZ/EN at desktop/mobile.
2. Confirm visual typography is unchanged and headings describe their containing sections.

Acceptance criteria:
- branding is not a heading; every route has a logical outline; card heading levels follow structural context rather than action visibility.

Dependencies/blockers:
- none.

### SEO-007 Make staging/preview indexability fail closed

Severity: P0
Affected routes: every public route plus robots/sitemap/metadata on preview, staging, and production deployments
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: crawlers and link-sharing clients

Current implementation:
- a valid `NEXT_PUBLIC_SITE_URL` is sufficient to publish `index,follow`, an allowing robots file, sitemap, and self-canonicals;
- the publicly reachable sslip.io host does exactly that for 75 sitemap URLs;
- no explicit release/indexability gate distinguishes a temporary deployment from the approved final domain.

Problem:
- users and search clients can discover and retain disposable staging URLs;
- there is no direct assistive-technology failure, but people can be sent to a non-final deployment with an unstable availability/content contract;
- crawlers are explicitly invited to index the temporary host and treat it as canonical;
- applicable guidance: Google Search Central content-control/noindex guidance and the rule that crawlers must be able to retrieve a noindex response.

Required implementation:
1. Introduce a server-only, explicit, fail-closed indexability contract such as `SITE_INDEXING_ENABLED`, default false. `NODE_ENV=production` and a syntactically valid origin are not approval.
2. Only the explicitly approved configuration may emit public `index,follow`, sitemap/Host advertisement, and indexable canonicals/alternates. Reject contradictory or missing production settings early.
3. Prefer access control for non-public staging. If a staging host must be public, emit readable global `X-Robots-Tag: noindex, nofollow`/metadata, omit or disable its sitemap inventory, and avoid advertising it as a canonical search origin.
4. Keep the final domain value environment-driven; do not hardcode the temporary or unknown permanent hostname.

Constraints:
- do not rely solely on `robots.txt Disallow: /`, because that prevents crawlers from reading noindex;
- preserve real status codes, browser QA access, strict origin validation, and all route/localization behavior;
- deployment/ingress access control is an external action: implement only storefront configuration and document the required operation.

Automated verification:
- extend `src/lib/seo.test.ts`, add `src/lib/siteIndexing.test.ts`, and update `scripts/test-production-status.mjs`;
- table-test default/staging/approved-production/contradictory configurations across metadata robots, headers, robots, sitemap, canonical, and alternates;
- run `npm run test -- src/lib/seo.test.ts src/lib/siteIndexing.test.ts`, then `npm run build` and `npm run test:production-status`; prove an unapproved host is nonindexable and an approved synthetic final host has exactly one coherent public policy.

Manual verification:
1. On each deployed hostname inspect response headers, initial head, robots, sitemap, canonical, alternates, and representative statuses.
2. Before launch, verify only the approved final host is indexable; after launch use Search Console if authorized.

Acceptance criteria:
- every non-approved deployment is nonindexable by default and publishes no crawl inventory;
- only explicit final-origin approval can expose coherent production discovery signals; no temporary hostname is hardcoded.

Dependencies/blockers:
- deployment owner must approve the final origin and set the production flag; ingress access control is outside storefront scope.

### SEO-008 Let crawlers read Cart/Favorites noindex while retaining their private route policy

Severity: P1
Affected routes: `/[locale]/cart`, `/[locale]/favorites`, `robots.txt`
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: crawlers

Current implementation:
- the pages correctly emit `noindex,nofollow`, have no canonical, and are absent from sitemap;
- `src/app/robots.ts` also disallows `/*/cart` and `/*/favorites`, so crawlers cannot retrieve the directive;
- Header/mobile navigation exposes real links to both route families.

Problem:
- users can encounter URL-only search results for state pages that have no useful portable content;
- there is no direct AT defect, but the accessible user routes must remain intact while the crawler policy changes;
- robots blocking prevents the intended noindex from being processed and contradicts the page-level policy;
- applicable guidance: Google Search Central's explicit requirement that noindex URLs remain crawlable.

Required implementation:
1. Remove only Cart/Favorites from production robots disallow patterns.
2. Retain page-level `noindex,nofollow`, sitemap exclusion, no canonical/alternates, and the fully usable localized route.
3. Retain appropriate API/internal/admin exclusions and coordinate with SEO-007's environment-wide policy.

Constraints:
- robots is not access control; do not expose local state server-side, add private routes to sitemap, or remove user navigation;
- avoid a broad allow/disallow rewrite.

Automated verification:
- extend `src/lib/seo.test.ts` and `scripts/test-production-status.mjs`;
- assert all six localized private routes are fetchable/noindex and absent from sitemap/canonical/alternate graphs, plus the exact robots policy for private user routes, internal/API routes, staging, and approved production;
- run `npm run test -- src/lib/seo.test.ts`, `npm run build`, and `npm run test:production-status`.

Manual verification:
- fetch actual robots and initial HTML/headers for Cart/Favorites in RU/KZ/EN and validate through final-domain URL Inspection when authorized.

Acceptance criteria:
- crawlers can observe noindex on Cart/Favorites; discovery surfaces omit them; internal paths retain deliberate controls.

Dependencies/blockers:
- none for source; Search Console waits for final-domain ownership.

### SEO-009 Add safe Product and BreadcrumbList JSON-LD from the visible data source

Severity: P2
Affected routes: valid Product pages and routes with visible Catalog/category/Product breadcrumbs
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: structured-data consumers

Current implementation:
- visible Product content has name, SKU/model, brand, image, KZT price, stock state, rating aggregate, descriptions/specs, canonical URL, and breadcrumbs;
- initial HTML emits no JSON-LD anywhere.

Problem:
- users of search/structured-data surfaces receive less explicit product and navigation context, without any guarantee that adding schema will produce a rich result;
- JSON-LD has no direct AT effect and must never replace visible semantic content;
- crawlers must infer Product/Breadcrumb facts instead of validating one deliberate visible-data-backed contract;
- applicable guidance: Google Product/Breadcrumb structured-data requirements and Next.js's safe server-rendered JSON-LD guidance.

Required implementation:
1. Build typed, dependency-free Product and BreadcrumbList schema utilities and render sanitized server JSON-LD in initial HTML.
2. Reuse SEO-002's memoized product result for visible content, metadata/social, and schema. Include only present, tested facts: canonical URL, name, images, SKU/model, brand, description, KZT price, and availability mapped from the established status/stock contract.
3. Include AggregateRating only when count > 0 and the average is valid. Omit absent optional fields; never invent reviews, identifiers, price validity, seller/legal details, or availability.
4. Build BreadcrumbList from the exact visible logical trail and absolute canonical item URLs.
5. Escape `<` at minimum in serialized API/CMS strings before embedding. Emit no product schema on missing/transient/private/error states.

Constraints:
- JSON-LD supplements rather than replaces visible semantics;
- do not add Organization/WebSite/SearchAction until authoritative facts and current eligibility are separately confirmed;
- no new serialization dependency is necessary unless repository security review proves the small safe serializer insufficient.

Automated verification:
- create `src/lib/structuredData.ts` and `src/lib/structuredData.test.ts`, and extend the Product route test created for SEO-002;
- test valid, zero-rating, out-of-stock, optional-field absence, malicious `<`, localized canonical, missing product, and transient failure cases; parse every fixture and assert exact agreement with visible data;
- run `npm run test -- src/lib/structuredData.test.ts` plus the SEO-002 Product route test, then `npm run build`.

Manual verification:
1. Compare initial JSON-LD field-by-field with visible content in RU/KZ/EN.
2. Run Google Rich Results Test and a schema validator on representative approved-domain routes; fix critical errors.

Acceptance criteria:
- JSON-LD is safe, parseable, truthful, localized, canonical, and absent where facts are unavailable; no rich-result or ranking promise is made.

Dependencies/blockers:
- trustworthy stock/status semantics plus final-domain validation access.

### SEO-010 Add coherent localized Open Graph and Twitter Card metadata

Severity: P2
Affected routes: every indexable public route, especially Product, Home, Brand, Catalog/category, and information pages
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: messaging/social/link-preview clients

Current implementation:
- no `og:*` or `twitter:*` output exists;
- fallback scraping inherits SEO-001/002's generic and wrong-language metadata.

Problem:
- shared links can show generic, wrong-language, missing, or inconsistent previews, reducing clarity and trust;
- supporting clients cannot use explicit share-image alternative text, though this is not a page-level WCAG failure;
- preview crawlers receive no explicit localized title/description/image/URL/locale contract;
- applicable guidance: Next.js Metadata API and Open Graph/Twitter image conventions.

Required implementation:
1. Extend the same typed metadata source from SEO-001/002 with localized Open Graph and Twitter summary-large-image fields: canonical URL, site name, route title/description, standards locale mapping, and safe absolute image data.
2. Use a reviewed, appropriately sized local brand share image as the reliable fallback. Use a trustworthy primary product image for Product when present; otherwise use the fallback.
3. Include known image dimensions/type/alt. Use Next metadata/file conventions and ensure nested route metadata rebuilds/spreads shared Open Graph fields because objects merge shallowly.
4. Keep private/error routes free of misleading share metadata.

Constraints:
- do not invent artwork, claims, product facts, or depend on an unreliable remote image during build;
- validate remote/API URLs against the same origin/security policy and respect Next/platform file-size limits.

Automated verification:
- extend `src/lib/seo.test.ts` and the route metadata tests created for SEO-001/002;
- assert localized complete OG/Twitter output, absolute canonical/image URLs, locale tags, safe fallback selection, product override, nested merge behavior, asset existence/size, and private/error exclusion;
- run `npm run test -- src/lib/seo.test.ts` plus the route metadata tests, then `npm run build`.

Manual verification:
- inspect initial HTML and test representative final-domain RU/KZ/EN routes with relevant platform preview debuggers; compare preview text/image/alt with visible content.

Acceptance criteria:
- every indexable public route has coherent localized share metadata and a reachable truthful image; product cards are product-specific; private/error output is not misleading.

Dependencies/blockers:
- approved fallback share artwork and external platform preview/refresh access.

### PERF-001 Prioritize only the initial Home hero LCP candidate

Severity: P2
Affected routes: localized Home hero carousel
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all, especially constrained mobile networks/devices

Current implementation:
- every Home hero slide renders decorative backdrop plus foreground through `CmsResponsiveImage`;
- `BannerItem` marks both copies of all four slides `priority`, yielding eight `loading=eager`/`fetchpriority=high` elements in the live DOM, including off-screen slides;
- current CSS reserves the hero frame; do not claim or introduce a CLS fix that removes that reservation.

Problem:
- constrained-network/device users can spend initial bandwidth and decode/paint work on hidden slides before useful content;
- AT is not directly harmed, but alt/decorative behavior must remain correct during optimization;
- browser priority signals no longer distinguish the probable LCP resource and distinct CMS slides can compete with it;
- applicable guidance: web.dev LCP priority guidance, including lowering hidden carousel-slide priority, and CLS space-reservation guidance.

Required implementation:
1. Pass initial slide/index context so exactly the initially visible foreground image is eager/high and remains discoverable in server HTML.
2. Make later slides lazy and auto/low priority; decorative backdrop copies must never independently be high priority.
3. Preserve CMS desktop/mobile sources, on-error fallback, meaningful foreground alt, decorative backdrop, and desktop aspect-ratio/mobile fixed-height reservation.
4. Add accurate intrinsic/source dimensions when available without lying about varying CMS art direction. Add width-candidate `srcset/sizes` only if trustworthy derivatives exist.
5. Measure before/after in production-like conditions; do not replace the media pipeline or add a dependency speculatively.

Constraints:
- never lazy-load the initial LCP candidate; preserve carousel visuals/transitions and CMS fallback;
- test allowed external origins and failures before choosing Next image optimization for CMS URLs.

Automated verification:
- create `src/components/HomePage/bannerCarousel/index.test.tsx` and extend any focused `CmsResponsiveImage` test colocated as `src/components/ui/shared/CmsResponsiveImage/index.test.tsx`;
- assert exactly one initial foreground eager/high, later slides non-high/lazy, decorative copies non-high, source/fallback/alt correctness, and frame reservation;
- run those targeted Vitest files, then `npm run build`, `npm run test:production-status`, and `npm run test:budgets:ci`.

Manual verification:
1. Capture Chromium mobile/desktop Lighthouse and network waterfalls before/after with representative distinct CMS slides and fallback data.
2. Verify LCP/CLS, throttled loading, transitions, disabled-JS initial content, reduced motion, and Firefox/WebKit when available.

Acceptance criteria:
- priority identifies only the probable LCP resource; hidden/decorative slides do not compete at high priority; no blank/CLS/budget regression and measured LCP is no worse.

Dependencies/blockers:
- production-like CMS content and approved lab/field performance tooling.

### A11Y-011 Replace terminal Home rail skeletons with an explicit settled server outcome

Severity: P2
Affected routes: Home New Arrivals and Accessories rails
Affected locales: RU, KZ/KK, EN
Affected viewports/input modes: all users and crawlers; especially screen-reader/cognitive users

Current implementation:
- `loadCategoryProducts` awaits the API and returns `undefined` after a logged failure;
- `ProductCarouselSection` still renders and passes undefined items;
- `GoodsCarouselWithImage` equates undefined with loading and emits 15 skeletons even though no request can settle them.

Problem:
- users see a permanent loading promise with no product, recovery, or explanation after work has ended;
- screen readers receive no busy/error/settled status and skeletons communicate no outcome;
- initial HTML can expose an empty titled placeholder section rather than product links or an honest terminal state;
- applicable guidance: WCAG 2.2 4.1.3 for meaningful status updates and consistent, truthful loading-state identification.

Required implementation:
1. Represent success, genuine empty, failure, and actual pending states explicitly.
2. Follow the established silent optional-section convention for these rails: log failure and omit the section, unless an approved product decision requires a localized visible `ErrorState` with a real action.
3. Keep genuine empty omitted and successful products server-rendered with real links.
4. Make any shared carousel skeleton rendering require an explicit loading prop tied to a real Suspense/client request that can settle; never infer loading from undefined data after an awaited server call.

Constraints:
- preserve successful product ordering/mapping, banner content, destination links, server logging, and optional-section layout;
- do not introduce a client refetch/dependency solely to keep skeleton animation.

Automated verification:
- extend `src/components/HomePage/ProductCarouselSection/index.test.tsx` and create `src/components/ui/shared/GoodsCarouselWithImage/index.test.tsx`;
- retain success/genuine-empty tests, add rejected-request coverage asserting no permanent skeleton/orphan section, and test explicit settle-capable loading with appropriate busy/status semantics;
- run `npm run test -- src/components/HomePage/ProductCarouselSection/index.test.tsx src/components/ui/shared/GoodsCarouselWithImage/index.test.tsx`, then the full `npm run test`.

Manual verification:
1. Force slow, failed, empty, and successful responses for each rail in RU/KZ/EN.
2. Confirm pending UI always settles, final failure follows the chosen honest/omitted state, and success remains keyboard/crawlable.

Acceptance criteria:
- an awaited failure never produces indefinite loading; successful SSR links and intentional empty omission remain intact.

Dependencies/blockers:
- none unless product selects a visible error treatment requiring approved localized copy.

## Safe Implementation Grouping

Implement in this dependency-aware order and keep commits reviewable. Do not postpone the P0 behind UI work.

1. **Baseline and release containment:** re-read project memory/audit, verify the implementation base and clean-install gates, reproduce current headers/head, then implement SEO-007. Coordinate SEO-008 and SEO-006 in the same crawl-signal layer so staging, private pages, and locale alternates cannot conflict.
2. **Locale and metadata foundations:** implement I18N-002's dependency-light language resolver and I18N-001/I18N-003 copy mapping; then SEO-001's typed localized metadata source and SEO-002's memoized product result. Do not add social/schema until this source is trustworthy.
3. **URL and catalog crawl architecture:** implement SEO-003 canonical category paths first; implement SEO-004 SSR initial products/crawlable pagination against that route; then enforce SEO-005's parameter-class indexability/canonical/internal-link policy. Test sitemap and live status after each layer.
4. **Shared focus/interaction foundations:** implement A11Y-001 disclosures and Radix-based A11Y-002/A11Y-006 modal behavior. Fix A11Y-004's carousel slide/focus/name/picker foundation before A11Y-003's autoplay controls. Complete A11Y-007 tabs.
5. **State, forms, semantics, and visual access:** implement A11Y-005 async status ownership, A11Y-011 terminal Home rail outcomes, A11Y-008 field-error relationships, A11Y-009 mutation focus, A11Y-010 scoped colors, and HTML-003 heading context. Remove/replace the false stock form (HTML-001) and placeholder Instagram links (HTML-002) only through their documented product-owner-safe outcomes.
6. **Truthful discovery and performance:** add SEO-009 JSON-LD and SEO-010 social metadata from the already-shared data contracts. Implement PERF-001's one-LCP-candidate priority. Do not fabricate data to unblock a test.
7. **Reconciliation and release evidence:** run all targeted/full gates, production HTTP/head/status/crawl checks, the complete manual matrix, lab performance comparison, and external validators available for the approved hostname. Update both project-memory files and report blocked external actions separately.

If a later commit already changed a referenced area, preserve equivalent proven behavior, update tests to the actual architecture, and document why the audited instruction was adapted.

## Required Automated Tests

In addition to every issue-specific test, provide these durable suites:

- **Configuration/crawl policy:** fail-closed default, staging/public-preview behavior, approved production, contradictory environment values, canonical origin validation, robots, sitemap, metadata robots, X-Robots-Tag, and absence of conflicting HTTP hreflang.
- **Locale/metadata:** `ru/kz/en -> ru/kk/en`, global-error server/hydration cases, 502-key-equivalent locale structure after additions, localized route title/description, reciprocal alternates/x-default, and no cross-locale literal leaks.
- **Route/status:** representative Home/static/brand/category/catalog-query/product/private/404/transient paths with exact indexability, canonical, sitemap, initial-content, and status behavior.
- **Catalog URLs/rendering:** path category generation, legacy query normalization/redirect decision, server initial product HTML, page links with `aria-current`, search/sort/filter/page policy, clean internal links, and no query URLs in sitemap.
- **Navigation/modal/carousel/tabs:** closed disclosure tab order; Escape/focus return; mobile menu/lightbox focus entry/trap/inertness/restoration; visible-slide exposure; hidden controls; localized names; pause/reduced-motion/focus stop; tab roving/arrow/Home/End behavior.
- **Forms/dynamic state:** invalid/error associations and focus; async busy/settled/error/result announcements without duplication; Cart/Favorites first/middle/last/only/clear/undo focus; rate-limit/submission/retry preservation.
- **Semantics/visual tokens:** route heading outlines across shared card contexts; false-form removal; truthful social target; deterministic 4.5:1/3:1 color-pair assertions with disabled exceptions.
- **Schema/social:** safe JSON serialization, field omission, status/stock/rating boundaries, visible-data agreement, absolute localized canonical/image URLs, nested Next metadata merging, fallback assets, and no private/error schema/cards.
- **Performance:** exactly one initial hero foreground `eager/high`, other/decorative media non-high, frame reservation/source/fallback semantics, and unchanged/improved project asset and storefront JS budgets.

Run the targeted suites while iterating, then all Initial Quality Gates from a clean install. Tests must assert user/crawler outcomes and roles/states, not brittle class snapshots or implementation trivia.

## Manual Browser Matrix

At minimum verify representative Home, Catalog, watch category, Accessories, Interior Clocks, search results, paginated/faceted catalog, valid/missing/transient Product, Brands index, every brand route pattern, About, Guarantee, Delivery, Payment, Cart, Favorites, localized/global 404/error, empty/loading/API-failure/rate-limit states, and robots/sitemap in RU/KZ/EN.

Use 320, 375, 768, 1023, 1280, and a large desktop width plus 400% zoom/reflow where applicable. Cover keyboard-only Tab/Shift+Tab/Enter/Space/Escape/arrows/Home/End, touch/pointer alternatives, visible/unobscured focus, modal entry/trap/return, deletion focus, reduced motion, autoplay pause, long translations, orientation, headings/landmarks, names/roles/states, field errors, async/live announcements, contrast, decorative/meaningful image behavior, internal-link destinations, initial server HTML, status codes, canonical/alternates/robots/sitemap/schema/social metadata, and throttled hero loading.

Run current Chromium, Firefox, and WebKit/Safari-compatible coverage where available, plus NVDA on Windows and VoiceOver/Safari or an approved equivalent. Record browser/AT versions, results, and unavailable combinations; do not convert an unsupported matrix cell into a pass. Use axe/Lighthouse only as supplements to manual/contextual checks.

## Acceptance Criteria

### WCAG 2.2 AA

- Every implemented confirmed issue meets its cited WCAG 2.2 success criterion and objective item-level acceptance criteria.
- Keyboard order, visible/unobscured focus, modal focus entry/trap/restoration, control names/states, error association, dynamic announcements, 320px reflow, zoom, target size/gesture alternatives, reduced motion, contrast, and meaningful/decorative media behavior are manually verified where applicable.
- Native semantics remain primary and ARIA does not conflict with the accessibility tree.

### SEO and Crawlability

- Each indexable localized page emits a unique trustworthy title/description, self-consistent canonical URL, reciprocal valid locale alternates, appropriate robots directive, meaningful server-rendered content, crawlable internal links, and only accurate visible-content-backed structured data required by its issue.
- Non-indexable search/facet/cart/favorites/client-state/error routes follow their explicit route-class decision. No noindex/noncanonical URL enters the sitemap; no robots rule prevents a crawler from seeing a required `noindex`.
- Missing resources return real status codes and never become soft 404s or temporary-failure 404s.
- No recommendation promises rankings.

### Localization

- RU, KZ route-prefix/KK HTML-language, and EN behavior remain complete. User-facing text, metadata, accessible names, error messages, alt text, and announcements use existing locale architecture with no cross-locale fallback leakage except the project's documented content fallbacks.

### Responsive and Browser Behavior

- No horizontal body overflow, clipped controls/content, focus hidden by sticky/fixed UI, hover-only action, or swipe/drag-only function at 320px, required zoom, long RU/KZ strings, orientation changes, or supported desktop/mobile breakpoints.
- Chromium, Firefox, and WebKit/Safari-compatible results are recorded; any untested engine is an explicit limitation.

### Performance

- Fixes do not regress established JS/static asset budgets, LCP image behavior, CLS, or interaction responsiveness. Images retain explicit dimensions/sizes and appropriate eager/lazy behavior; no avoidable client-only rendering or request waterfall is introduced for indexable content.

## Production-Domain Transition

Immediately implement configuration-driven, domain-agnostic behavior: strict origin parsing, fail-closed staging/production indexability, canonical/alternate/Open Graph/sitemap/robots generation from the approved origin contract, and tests that use explicit synthetic origins. Do not hardcode the temporary sslip.io host or an unknown final domain. Prefer ingress authentication for staging; if public access is required, return a readable global noindex and no sitemap inventory rather than relying on a crawl block.

Items that must wait for the final domain/operations approval include the real canonical host value, www/non-www choice, DNS, HTTP-to-HTTPS and host redirects at ingress, TLS/HSTS validation, Search Console verification, sitemap submission, live URL Inspection, production structured-data/link-preview validation, crawl/CWV monitoring, and temporary-host removal/migration actions. Use the complete launch checklist in the audit; do not silently perform any infrastructure, deployment, DNS, or Search Console mutation.

## Git and Final Report Requirements

- Preserve unrelated/user changes and do not use destructive Git operations.
- Review `git diff` for scope, secrets, locale completeness, fake SEO data, and unintended design changes.
- Commit only relevant implementation/docs/test changes using `fix(storefront): improve accessibility and SEO` unless repository workflow requires an adjusted conventional message.
- Push through the normal repository workflow only if authorized by the implementation task. Do not publish images, create a release, deploy, or change DNS.
- Final report: issue IDs completed/deferred, exact files, tests and browser matrix with results, remaining external dependencies, production-domain tasks, risks/limitations, commit SHA, and documentation updates.

## Progressive Audit Status

Checkpoints 1-10 and final reconciliation are complete. Implement all 28 confirmed items: 1 P0, 14 P1, and 13 P2. Begin with staging containment, then preserve the typed locale/metadata/URL and proven Radix/state foundations while applying the dependency order above. Chromium runtime, live HTTP, and deterministic settled-server-state evidence confirmed the interaction, contrast, semantics, metadata, crawl-policy, Home loading, and hero-priority findings; unsupported AT/engine/performance tools remain explicit implementation verification requirements.

## Last Updated

2026-08-07 - Finalized the implementation-ready 28-item ledger, including the terminal Home rail skeleton state, dependency order, automated/manual matrices, staging containment, final-domain transition, schema/social, and measured performance requirements.
