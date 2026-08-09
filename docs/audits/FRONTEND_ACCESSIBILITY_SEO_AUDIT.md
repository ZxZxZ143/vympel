# VYMPEL Storefront Accessibility, SEO, Crawlability, Compatibility, and Usability Audit

## Audit Baseline

- Repository: `https://github.com/ZxZxZ143/vympel`
- Audited scope: `vympel_front` only
- Branch: `main`
- Audited commit: `1786e855e7a0b6a4797cdfae651e0dfe206709a2`
- Local working tree at audit start: clean (`git status --short` returned no entries)
- Remote state at audit start: local `HEAD`, local `origin/main`, and the live `refs/heads/main` returned by `git ls-remote` all equal `1786e855e7a0b6a4797cdfae651e0dfe206709a2`; ahead/behind count is `0/0`.
- Audit date: 2026-08-07
- Target: WCAG 2.2 Level AA implementation planning; no claim of full WCAG conformance is made.

## Scope and Hard Exclusions

This audit covers the public multilingual storefront in `vympel_front`: source, generated production behavior in an isolated task-owned environment, rendered HTML, accessibility semantics and interactions, technical SEO, crawlability, discoverability, browser/reflow behavior, and performance risks that materially affect users or search rendering.

Excluded from implementation and direct audit scope: `vympel_crm`, backend source, database migrations, infrastructure, deployment configuration, Docker images, cloud resources, DNS, and production data. A storefront defect that requires another system will be recorded as an external dependency. This task creates audit documentation only and does not fix storefront code.

## Verified Starting Architecture

- Next.js App Router `16.2.12`; React/React DOM `19.2.4`; TypeScript 5; Tailwind CSS 4.
- `next-intl` `4.13.2`; route locales `ru`, `kz`, and `en`; routes live under `src/app/[locale]`.
- HTML language mapping is owned by `src/i18n/htmlLanguage.ts`: `ru -> ru`, `en -> en`, `kz -> kk`.
- Public data is fetched through `src/api/controllers/PublicController.ts`.
- Canonical/discovery behavior is centralized in `src/lib/seo.ts`, `src/lib/sitemapCatalog.ts`, `src/app/sitemap.ts`, and `src/app/robots.ts` plus route metadata.
- `NEXT_PUBLIC_SITE_URL` is a required build-time canonical-site origin contract. The final production domain is not yet connected; the documented staging host is temporary and must not be treated as the permanent canonical origin.
- Existing UI includes Radix/shadcn dialogs and sheets, Embla carousels, NProgress, localStorage-backed cart/favorites, CMS-first banners/content with static fallbacks, responsive navigation, catalog facets, product pages, reviews, brand pages, and localized public information pages.

## Audit Method and Evidence Standard

A confirmed finding requires repository-specific source evidence plus applicable rendered, HTTP, test, or browser evidence. Scanner output alone is not sufficient for focus order, focus restoration, keyboard traps, heading logic, contextual names, motion, announcements, error recovery, or content clarity. Unconfirmed risks remain under **Needs verification**.

Authoritative criteria are limited to WCAG 2.2/WAI guidance, the HTML Living Standard where necessary, official Next.js/React/next-intl documentation, Google Search Central, Schema.org, official browser documentation, and official Lighthouse documentation.

## Required Checkpoint Progress

| Checkpoint | Subsystems | Status | Evidence written |
| --- | --- | --- | --- |
| 1 | Instructions, Git, scripts, Next config, localization | Complete | Yes |
| 2 | Routes, layouts, metadata, robots, sitemap, canonical utilities | Complete | Yes |
| 3 | Header, navigation, locale switcher, footer, mobile nav, breadcrumbs | Complete | Yes |
| 4 | Home, hero/carousels, promotions, CMS | Complete | Yes |
| 5 | Catalog, filters, sorting, pagination, search, faceted URLs | Complete | Yes |
| 6 | Product, media, reviews, offers, related products | Complete | Yes |
| 7 | Brand/category/information pages | Complete | Yes |
| 8 | Cart, favorites, dialogs, overlays, forms, notifications, states | Complete | Yes |
| 9 | Rendered HTML, keyboard/screen reader, reflow, motion, contrast | Complete | Yes |
| 10 | Crawling/indexing, structured data, domain readiness, CWV risks | Complete | Yes |

## Route Matrix

All localized page patterns support `ru`, `kz` (HTML `kk`), and `en`; all are relevant on desktop and mobile. Authentication is not required anywhere in the public storefront.

| Route pattern | Purpose / dynamic parameters | Expected indexability | Current metadata source | Structured-data expectation | State dependency |
| --- | --- | --- | --- | --- | --- |
| `/[locale]` | Home | Index | `[locale]/page.tsx` -> `publicSeoMetadata` | `WebSite`/`Organization` only when backed by approved site/business data | CMS/API with static fallbacks |
| `/[locale]/about` | Company/about | Index | `about/page.tsx` -> `publicSeoMetadata` | `AboutPage`; organization facts only when trustworthy | CMS with static fallback |
| `/[locale]/brands` | Six-brand directory | Index | `brands/page.tsx` -> `publicSeoMetadata` | Breadcrumb/list semantics if visible and accurate | Static brand config + localized assets |
| `/[locale]/brands/[brandSlug]` | One approved public brand | Index when slug is valid; true 404 otherwise | `brands/[brandSlug]/page.tsx` -> brand-aware title/canonical | Breadcrumb/brand information only when supported by visible page content | Static brand config; no auth |
| `/[locale]/catalog` | Catalog, search, sort, filters, pagination; query parameters | Clean catalog indexable; search/facet/indexability policy required | `catalog/page.tsx` ignores `searchParams` for metadata and always canonicals to clean catalog | Collection/breadcrumb data only for an indexable visible category | API + URL/client state |
| `/[locale]/catalog/[...slug]` | Path category; catch-all `slug[]` | Valid category indexable; invalid category true 404 | catch-all page -> generic catalog metadata | Breadcrumb/collection data for valid category | API category lookup |
| `/[locale]/product/[id]` | Product detail; numeric/string `id` | Existing active product indexable; missing product true 404 | `product/[id]/page.tsx` -> generic product metadata that does not load the product | `Product` plus visible review/offer fields only when trustworthy and present | API product, client reviews/favorites/cart |
| `/[locale]/delivery` | Delivery information | Index | route -> `publicSeoMetadata` | Usually none beyond visible breadcrumb | CMS with static fallback |
| `/[locale]/payment` | Payment information | Index | route -> `publicSeoMetadata` | Usually none beyond visible breadcrumb | CMS with static fallback |
| `/[locale]/guarantee` | Guarantee information | Index | route -> `publicSeoMetadata` | Usually none beyond visible breadcrumb | CMS with static fallback |
| `/[locale]/cart` | Local cart | Noindex, nofollow | static `privatePageMetadata` | None | localStorage/client state |
| `/[locale]/favorites` | Local favorites | Noindex, nofollow | static `privatePageMetadata` | None | localStorage/client state |
| `/[locale]/[...notFound]` | Unsupported localized route | Noindex by status; true 404 | localized not-found boundary; no route metadata | None | None |
| `/robots.txt` | Crawler policy and sitemap discovery | N/A | `src/app/robots.ts` | N/A | `NEXT_PUBLIC_SITE_URL` |
| `/sitemap.xml` | Localized static/category/brand/active-product discovery | N/A; only canonical indexable URLs belong | `src/app/sitemap.ts` + `src/lib/sitemapCatalog.ts` | N/A | canonical origin + live public API |
| `/api/revalidate` | Signed internal CMS revalidation | Disallow/not indexable | route handler; not page metadata | None | secret/signature + CMS payload |
| `/api/telemetry` | First-party client error telemetry | Disallow/not indexable | route handler; not page metadata | None | request payload/rate limits |

## Confirmed Issue Ledger

### SEO-001 - Public locale and route metadata is generic, duplicated, or in the wrong language

- **Severity:** P1
- **Confidence:** Certain (deterministic source/framework behavior confirmed in live production HTML)
- **Category:** Technical SEO / internationalization / search presentation
- **Affected route or component:** Every indexable route; most obvious on Home, About, Catalog/category, Brands, Delivery, Payment, and Guarantee
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** All; search crawlers and link-preview consumers
- **Exact files:** `src/app/[locale]/layout.tsx`; `src/lib/seo.ts`; localized public route `page.tsx` metadata functions
- **Exact symbols:** layout `metadata`; `publicSeoMetadata`; each `generateMetadata`
- **Current behavior:** the layout supplies one Russian description (`Каталог часов и аксессуаров Vympel`) for all locales. `publicSeoMetadata` never sets `description`, so Next.js metadata inheritance keeps that description on all public routes. Home uses only `Vympel`; most non-home routes hard-code English generic nouns (`About`, `Catalog`, `Brands`, `Delivery`, `Payment`, `Guarantee`) for RU, KZ, and EN. Category paths also reuse the same Catalog title.
- **Evidence:** direct source inspection and Next.js's documented shallow metadata merge/inheritance behavior. Google recommends descriptive page titles, warns about titles whose language/writing system does not match primary content, and recommends accurate unique page-level descriptions.
- **Relevant guidance:** [Next.js `generateMetadata` merging and inheritance](https://nextjs.org/docs/app/api-reference/functions/generate-metadata); [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link); [Google snippet/meta-description guidance](https://developers.google.com/search/docs/appearance/snippet).
- **Impact on users:** localized search results and browser tabs do not accurately identify the destination; English labels appear for RU/KZ pages and English/Kazakh pages can advertise Russian copy.
- **Impact on assistive technologies:** screen readers announce the document title during navigation, so the live-confirmed generic/wrong-language titles weaken orientation.
- **Impact on browsers/crawlers:** crawlers receive duplicated, weak, or language-mismatched title/description signals and may rewrite title links/snippets.
- **Recommended fix:** centralize localized, route-specific title and description creation; derive category/brand labels from trusted localized route data; ensure all three locale variants describe the actual visible page without invented marketing claims.
- **Implementation constraints:** keep canonical/hreflang behavior and existing route prefixes; do not fabricate copy; use existing message/content data or add reviewed locale strings with full RU/KZ/EN parity.
- **Regression risk:** metadata fetches can add waterfalls/failures; share already-required server data or use bounded trusted configuration and keep error behavior explicit.
- **Automated test:** extend `src/lib/seo.test.ts` and add route metadata tests asserting unique/localized title+description for RU/KZ/EN and category/static route families.
- **Manual verification:** inspect initial production HTML and browser titles for representative routes in all locales; verify no Russian description leaks to KZ/EN.
- **Acceptance criteria:** every indexable route emits an accurate localized title and non-empty page-specific description; product-specific work is governed separately by SEO-002; no cross-locale metadata leakage remains.
- **External dependencies:** approved localized metadata copy may require product/content-owner review, but implementation must use truthful existing content meanwhile.

### SEO-002 - Product pages publish generic metadata unrelated to the product

- **Severity:** P1
- **Confidence:** High (direct source evidence)
- **Category:** Technical SEO / ecommerce discoverability
- **Affected route or component:** `/[locale]/product/[id]`
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** All; search crawlers and link-preview consumers
- **Exact file:** `src/app/[locale]/product/[id]/page.tsx`
- **Exact symbols:** `generateMetadata`, `Page`
- **Current behavior:** `generateMetadata` uses only `locale` and `id` and returns `Vympel — Product`; it does not load the product, emit its localized name, or create an accurate description. The page independently loads the product later, duplicating the opportunity for inconsistent status/data behavior.
- **Evidence:** direct source inspection: `generateMetadata` has no call to `PublicApiController.getProduct`, while `Page` makes the product call. Google explicitly recommends descriptive titles and accurate programmatically generated product descriptions for large database-driven sites.
- **Relevant guidance:** [Next.js dynamic metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata); [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link); [Google snippet guidance for product pages](https://developers.google.com/search/docs/appearance/snippet).
- **Impact on users:** every product can appear with the same ambiguous browser/search title and generic snippet.
- **Impact on assistive technologies:** the announced page title does not identify the product after navigation.
- **Impact on browsers/crawlers:** product URLs lack product-specific head signals and link previews cannot represent the destination accurately.
- **Recommended fix:** use a memoized/shared server product fetch to create localized, truthful product title/description and reuse the same result in the page; retain real 404 handling and safe temporary API-failure behavior; add social/product structured metadata only when later issue requirements are satisfied by real fields.
- **Implementation constraints:** no backend change; no fake price, availability, rating, description, or image; do not turn temporary API failures into false 404s; avoid two independent backend calls.
- **Regression risk:** dynamic metadata can delay rendering or turn API failures into document failures unless request sharing and error classification are deliberate.
- **Automated test:** add product route metadata tests for localized successful data, true 404, and transient API failure; assert one shared fetch per request where testable.
- **Manual verification:** inspect production HTML for at least one valid product in each locale and an invalid product ID; compare title/description to visible content/status.
- **Acceptance criteria:** valid product metadata names the actual localized product and contains only truthful data; missing products return 404; transient failures do not emit false product facts or false 404; the server request is shared rather than duplicated.
- **External dependencies:** representative localized product data from the existing public API.

### A11Y-001 - Closed language and brand popups retain invisible tabbable items and incomplete menu semantics

- **Severity:** P1
- **Confidence:** Certain (source evidence confirmed by live closed-state keyboard focus tracing)
- **Category:** Keyboard / focus order / name-role-value
- **Affected route or component:** Header language selector and desktop primary-navigation brand popup on every route
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Keyboard and screen reader; language selector at all sizes, brands popup at `xl` desktop
- **Exact files:** `src/components/ui/layout/Header/index.tsx`; `src/components/ui/layout/Navigation/index.tsx`
- **Exact symbols:** `Header` language popup; `Navigation` `brandsMenuId` popup
- **Current behavior:** both closed popups remain mounted and are hidden only with opacity/transform/`pointer-events-none`. Their buttons/links remain in sequential focus order even though sighted users cannot see them. Both declare `role="menu"`/`menuitem`, but neither implements menu focus entry, roving focus, arrow/Home/End/typeahead navigation, or complete Escape/focus-return behavior; the language popup has no Escape handler at all.
- **Evidence:** direct source inspection: no `hidden`, conditional render, `inert`, or closed-state `tabIndex=-1`; no menu keyboard handler; WAI APG menu items are removed from the ordinary tab sequence and receive managed focus, while WCAG 2.4.3 requires operable, meaningful focus order.
- **Relevant guidance:** [WCAG 2.2 SC 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html); [WAI APG Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/); [WAI APG navigation menu-button example](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-links/).
- **Impact on users:** keyboard focus disappears into closed overlays; users cannot predict which key operates the claimed menu and can become disoriented.
- **Impact on assistive technologies:** announced menu/menuitem roles promise an interaction model the controls do not provide.
- **Impact on browsers/crawlers:** browser sequential navigation reaches visually suppressed elements; no material crawler impact.
- **Recommended fix:** use simple disclosure semantics for these small navigation/language popups (preferred) or fully implement the APG menu-button pattern. In either case, closed content must not be focusable/visible to AT, opening must place focus intentionally if using menu roles, Escape must close and return focus, and selection/navigation must close predictably.
- **Implementation constraints:** preserve the visual treatment, three locales, six brands, next-intl route replacement, NProgress behavior, and crawlable brand anchors; do not replace anchors with click-only elements.
- **Regression risk:** conditional unmounting can affect transition animation; if animation is retained, coordinate visibility/focusability without leaving a hidden tab stop.
- **Automated test:** add shared navigation component tests covering closed tab order, `aria-expanded`, open/close, Escape, focus return, and locale/brand activation; use semantics appropriate to the chosen disclosure or menu pattern.
- **Manual verification:** tab through both popups closed/open; operate with Enter/Space/Escape and, only if menu roles remain, arrow/Home/End; confirm visible focus never enters closed content.
- **Acceptance criteria:** closed popup descendants are absent from the sequential focus order and accessibility tree; announced roles match implemented keys; Escape and outside dismissal restore logical focus; language switching and crawlable brand links still work.
- **External dependencies:** none.

### A11Y-002 - Custom mobile navigation modal does not manage or contain focus

- **Severity:** P1
- **Confidence:** Certain (source evidence confirmed by live mobile-modal focus tracing)
- **Category:** Keyboard / modal dialog / focus management
- **Affected route or component:** Home-page `Navigation` mobile menu on every locale
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Below `xl`; keyboard, screen reader, switch input, screen magnifier
- **Exact file:** `src/components/ui/layout/Navigation/index.tsx`
- **Exact symbol:** `Navigation`, `isMobileMenuOpen` dialog branch
- **Current behavior:** opening renders a `role="dialog" aria-modal="true"` container and locks body scroll, but focus remains on the opener behind the overlay. No code moves focus inside, contains Tab/Shift+Tab, makes the background inert, or restores focus on close/navigation. Escape changes state but does not explicitly restore focus.
- **Evidence:** direct source inspection of all effects/refs/handlers in `Navigation`; WAI APG requires initial focus inside a modal, a contained tab sequence, inert background, Escape closure, and return to the invoker.
- **Relevant guidance:** [WAI APG Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/); [WCAG 2.2 SC 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html); [WCAG 2.2 SC 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible).
- **Impact on users:** keyboard/screen-reader users can remain behind or tab out of the visually modal menu and may be unable to understand where they are.
- **Impact on assistive technologies:** `aria-modal=true` asserts an inert outside world that the implementation does not provide, creating a mismatch between accessibility-tree promise and focus behavior.
- **Impact on browsers/crawlers:** browser focus can move into visually obscured page controls; no material crawler impact.
- **Recommended fix:** rebuild this branch on the already-installed Radix Dialog primitive/shared proven modal pattern, with visible labelled title, initial focus, trap/inert behavior, Escape and overlay close, and reliable focus restoration. Avoid hand-rolling a second focus trap.
- **Implementation constraints:** preserve layout, links, contacts, six-brand list, mobile breakpoints, body scroll lock behavior, reduced-motion styling, and close-on-navigation behavior.
- **Regression risk:** nested SmartSearch/other overlays and route navigation can compete for focus; test open/close and navigation paths, including unmount during route change.
- **Automated test:** add a `Navigation` interaction test that opens the menu, asserts focus is inside, cycles Tab/Shift+Tab, closes with Escape/close/link, and verifies focus returns when the opener remains.
- **Manual verification:** keyboard-only at 320/375/768/1023 CSS px; screen-reader dialog announcement; attempt to reach header/page behind; close by Escape, overlay, button, and route link.
- **Acceptance criteria:** focus enters the dialog, cannot leave while open, background is inert, the dialog is labelled, Escape works, and focus returns logically after dismissal; no menu link/function is lost.
- **External dependencies:** none; Radix is already installed and used by `CatalogMobileSheet`.

### A11Y-003 - Home and About carousels auto-rotate without a persistent pause control or keyboard-focus stop

- **Severity:** P1
- **Confidence:** High (direct plugin/configuration evidence)
- **Category:** Motion / timing / carousel operability
- **Affected route or component:** Home hero, Home Brands carousel, and About Instagram carousel
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** All; especially keyboard, screen reader, cognitive/attention-sensitive users, reduced-motion preference
- **Exact files:** `src/components/HomePage/bannerCarousel/index.tsx`; `src/components/HomePage/BrandsCarousel/index.tsx`; `src/components/AboutPage/InstagramSlider/index.tsx`
- **Exact symbols:** `BannerCarousel`; `BrandsCarousel`; `AboutInstagramSlider`; their `Autoplay` plugins
- **Current behavior:** carousels start automatically at 5s/10s/3.5s intervals and loop. Home versions stop on mouse hover/interaction but not focus; About sets `stopOnInteraction:false`, so it resumes even after user interaction. None has a persistent Stop/Start control or reduced-motion autoplay policy.
- **Evidence:** direct source/configuration inspection; WCAG 2.2 SC 2.2.2 requires a user-controlled pause/stop/hide mechanism for nonessential automatically moving/updating content, and APG requires rotation to stop on focus and not resume without explicit user action.
- **Relevant guidance:** [WCAG 2.2 SC 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html); [WAI APG Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/).
- **Impact on users:** rotating content can interrupt reading, attention, magnification, and navigation; keyboard/AT users cannot persistently stop it.
- **Impact on assistive technologies:** focus/virtual-cursor context can change as slides advance without announcement or control.
- **Impact on browsers/crawlers:** no direct crawling impact; client timers add work and movement.
- **Recommended fix:** add a first-in-carousel localized Stop/Start rotation button; stop permanently when focus enters or a user interacts until explicitly restarted; stop on hover; initialize autoplay off for reduced-motion users; preserve manual Previous/Next/dots.
- **Implementation constraints:** keep the current design/slides/timing when active; no autoplay dependency replacement is necessary; all control names require RU/KZ/EN translations.
- **Regression risk:** plugin recreation and hydration can unexpectedly restart rotation; test state across focus, hover, resize, and locale navigation.
- **Automated test:** fake timers and mocked media query/Embla plugin tests for initial autoplay, focus stop, explicit restart, reduced-motion default-off, and localized labels.
- **Manual verification:** observe >10s; enter by Tab; use Stop/Start; switch reduced motion before load; verify focus does not move and content stays paused after focus leaves.
- **Acceptance criteria:** users can persistently stop/restart; focus and any user interaction stop rotation; reduced-motion starts stationary; controls are visible, localized, keyboard operable, and precede rotating content.
- **External dependencies:** none.

### A11Y-004 - Shared carousel exposes off-screen content and visually hidden controls in focus order with incomplete tab semantics

- **Severity:** P1
- **Confidence:** High (direct shared-component DOM/CSS evidence)
- **Category:** Keyboard / focus order / ARIA semantics / localization
- **Affected route or component:** Home hero, Brands, Home product carousels, and every consumer of shared `Carousel`/`CarouselDots`
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** All keyboard/screen-reader modes; strongest on narrow viewports
- **Exact files:** `src/components/ui/Carousel.tsx`; `src/components/ui/shared/CarouselDots/index.tsx`; `src/components/HomePage/bannerCarousel/index.tsx`; `src/components/HomePage/BrandsCarousel/index.tsx`
- **Exact symbols:** `CarouselItem`; `CarouselPrevious`; `CarouselNext`; `CarouselDots`; consumer arrow classes
- **Current behavior:** Embla visually clips slides but `CarouselItem` never marks non-visible slides hidden/inert, so links/buttons in off-screen slides remain tabbable. Hero/Brands Previous/Next buttons are hidden with opacity and `pointer-events-none` until mouse hover, not focus, so keyboard can land on invisible arrows. Dots claim `tablist`/`tab` but have no associated `tabpanel`, `aria-controls`, roving tab stop, or arrow-key tabs behavior. Default dot/arrow names are English, and Brands' carousel region has no accessible label.
- **Evidence:** direct inspection of the complete shared carousel source and consumers; WAI APG distinguishes a correct tabbed carousel from grouped button pickers and warns that incorrectly exposed off-screen slides disorient screen-reader users; WCAG 2.4.3/2.4.7 require logical, visible focus.
- **Relevant guidance:** [WAI APG Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/); [WCAG 2.2 SC 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html); [WCAG 2.2 SC 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible); [WCAG 2.2 SC 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value).
- **Impact on users:** Tab can disappear into off-screen slides or invisible arrow controls; dot behavior differs from the announced tabs model; RU/KZ users hear English controls.
- **Impact on assistive technologies:** hidden visual state is not communicated, region/slide names are incomplete, and tabs expose unsupported relationships/keys.
- **Impact on browsers/crawlers:** focus may scroll clipped content unexpectedly; crawlable links must remain in HTML even if removed from the active tab sequence.
- **Recommended fix:** track slide visibility and remove fully off-screen interactive descendants from sequential focus/AT exposure without removing their anchors from source; make arrow controls visible on `focus-within` or permanently at applicable viewports; implement either full tabs+tabpanel semantics or, preferably, localized grouped native buttons; label every region and slide (`n of total`).
- **Implementation constraints:** preserve Embla, crawlable link HTML, swipe/manual controls, responsive slide counts, and visual appearance; do not make partially visible product cards unavailable; use existing translations with new parity keys as needed.
- **Regression risk:** visibility changes during Embla reInit/resize can strand focus; if a focused slide becomes hidden, move focus only through an intentional user navigation action.
- **Automated test:** shared carousel tests for in-view/off-screen tab stops, focus-visible arrow exposure, localized labelled region/slides/controls, correct dot roles/keys, resize/reInit, and multiple-visible-slide cases.
- **Manual verification:** Tab/Shift+Tab through hero/brands/product carousels at 320/768/desktop; screen-reader rotor/tree inspection; operate swipe, arrows, and dots; confirm no off-screen/invisible focus and no English control names on RU/KZ.
- **Acceptance criteria:** only visible/operable slide content participates in sequential focus; focused controls are visible; picker semantics match keys/relationships; every carousel/slide/control is accurately localized and named; crawlable destinations remain anchors in server HTML.
- **External dependencies:** none.

### SEO-003 - Internal category URLs conflict with sitemap and canonical category URLs

- **Severity:** P1
- **Confidence:** High (direct route-builder, metadata, breadcrumb, and sitemap evidence)
- **Category:** Canonicalization / internal linking / crawl architecture
- **Affected route or component:** all category navigation (`WATCH_WRIST`, `WATCH_INTERIOR`, `ACCESSORIES`, descendants)
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** All users and crawlers
- **Exact files:** `src/config/routes.ts`; `src/utils/CreateCategoryLink.ts`; `src/components/CatalogPage/Catalog/CategorySelector/index.tsx`; `src/components/ui/layout/MobileBottomNavigation/index.tsx`; `src/lib/sitemapCatalog.ts`; `src/app/[locale]/catalog/page.tsx`; `src/app/[locale]/catalog/[...slug]/page.tsx`
- **Exact symbols:** `routes.category`, `categorySelectionCatalog`, `catalogLinks`, `buildCategoryLink`, `buildSitemap`, both catalog `generateMetadata` functions
- **Current behavior:** all primary/breadcrumb/category controls link to `/catalog?categoryCode=CODE&page=1`; that query route canonicals to `/[locale]/catalog`. The sitemap instead lists `/[locale]/catalog/CODE`, whose catch-all route self-canonicals. Thus internal links point at a duplicate/noncanonical URL while the canonical category URL is largely sitemap-only.
- **Evidence:** deterministic source tracing across route constructors, consumers, metadata, and sitemap; Google recommends linking internally to the canonical URL and avoiding conflicting canonical signals.
- **Relevant guidance:** [Google canonicalization methods and internal-link consistency](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls); [Google URL canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization).
- **Impact on users:** share/bookmark URLs and route behavior differ for the same category; locale/category paths are less predictable.
- **Impact on assistive technologies:** no unique AT-only impact beyond inconsistent navigation destinations.
- **Impact on browsers/crawlers:** internal-link signals, sitemap signal, and canonical annotations disagree; crawlers spend resources on duplicates and canonical category pages lack normal internal link equity.
- **Recommended fix:** choose the existing path route as the single category canonical. Make every category link `/catalog/{encodedCode}`; keep search/sort/filter/page query parameters on that path; permanently redirect legacy `?categoryCode=` URLs to the equivalent path while preserving allowed non-category parameters; keep sitemap/canonical/hreflang aligned.
- **Implementation constraints:** preserve category selection, query state rules, locale prefixes, catalog API arguments, case-sensitive backend codes, and existing public bookmarks via redirects; do not create multiple hierarchy aliases for the same code.
- **Regression risk:** query-to-path migration touches desktop/mobile/Home/footer/breadcrumb links and back/forward history; redirects must avoid loops and invalid-code soft 404s.
- **Automated test:** expand `src/config/routes.test.ts`, sitemap/SEO tests, proxy/route status tests, and catalog link tests for path output, legacy redirect, preserved allowed query, canonical/hreflang/sitemap equality, and invalid category 404.
- **Manual verification:** traverse every category entry surface in RU/KZ/EN; copy/reload/back/forward; request legacy query URL and inspect status/location; compare source links, canonical, hreflang, and sitemap.
- **Acceptance criteria:** exactly one indexable URL per locale/category; all internal links, self-canonical, hreflang, sitemap, and server route agree; legacy category query URLs redirect once to it; invalid categories are true 404.
- **External dependencies:** none if current category code contract remains stable.

### SEO-004 - Indexable catalog pages have no server-rendered products or crawlable pagination links

- **Severity:** P1
- **Confidence:** High (direct server/client boundary and markup evidence)
- **Category:** Rendering / product discoverability / pagination
- **Affected route or component:** clean Catalog and canonical category routes, including `?page=n`
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Crawlers, no/failed-JS users, slow devices; all viewports
- **Exact files:** `src/screens/CatalogPage/index.tsx`; `src/components/CatalogPage/Catalog/index.tsx`; `src/components/ui/shared/Pagination/index.tsx`; `src/hooks/usePagination.tsx`
- **Exact symbols:** `CatalogPage`; client `Catalog`; `Pagination`; `usePagination`
- **Current behavior:** the server renders `Catalog` with `goods=null`; its first output is nine skeletons. Products arrive only in `useFetch` after hydration. Pagination destinations are `<button onClick>` elements that push query state; there are no `<a href>` links to later pages. Page metadata also canonicals every page number to page 1/base.
- **Evidence:** direct component boundary/render-branch inspection; Google generally discovers links from anchors with `href`, does not click pagination buttons, recommends sequential crawlable pagination links, unique page URLs, and self-canonical paginated pages.
- **Relevant guidance:** [Google pagination and incremental-loading guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading); [Google crawlable-link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).
- **Impact on users:** catalog meaning/content is delayed until JS/API completion; failed JS leaves skeletons instead of products or a resolved error.
- **Impact on assistive technologies:** initial landmark contains placeholder cards and later replacement is not announced (also A11Y-005).
- **Impact on browsers/crawlers:** initial HTML lacks product anchors/content and later catalog pages are not linked; sitemap helps product discovery but is only a suggestion and does not replace coherent internal navigation.
- **Recommended fix:** server-fetch and render the initial requested clean catalog/category/page result; hydrate client controls from that data; render pagination as localized real anchors with `href` while optionally enhancing clicks; self-canonical clean paginated URLs and link sequential pages; preserve API failure vs true empty/invalid-page status.
- **Implementation constraints:** no backend change; reuse existing normalized `Page` contract; avoid duplicate server+client initial requests; keep current grid/card UX, scrolling, filters, sort, and nine-item page size unless a separate product decision changes it.
- **Regression risk:** server fetching makes upstream failures affect HTML response and caching; explicitly classify transient errors and avoid false 404/empty pages.
- **Automated test:** production-render tests for product anchors in initial HTML, page 2 `href`, self-canonical page n, no duplicate initial fetch, API failure state, empty valid catalog, and out-of-range policy.
- **Manual verification:** view-source with JS disabled for page 1/page 2/category in each locale; follow anchors/new tab/back; test slow/failed API and compare HTTP status/head/body.
- **Acceptance criteria:** initial HTML contains real visible product cards/anchors or an honest resolved state; later pages are reachable by crawlable links and have unique URLs/self-canonicals; enhancement preserves focus/history/scroll without duplicate initial network load.
- **External dependencies:** existing public catalog API availability and truthful pagination totals.

### SEO-005 - Search, sort, filter, and pagination URL classes have no explicit indexability/crawl policy

- **Severity:** P1
- **Confidence:** High (direct metadata/parameter generation evidence)
- **Category:** Faceted navigation / indexability / crawl efficiency
- **Affected route or component:** `/[locale]/catalog` and canonical category paths with `search`, `sort`, price, arbitrary API filter, gender, `page`, and legacy parameters
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Crawlers; all user viewports
- **Exact files:** both catalog route `page.tsx` files; `src/lib/seo.ts`; `src/config/routes.ts`; `src/utils/catalogFilterParams.ts`; Catalog filters/sort/search/pagination consumers; `src/app/robots.ts`
- **Exact symbols:** catalog `generateMetadata`; `publicSeoMetadata`; `catalog`, `filteredCatalog`, `searchCatalog`; filter parsers and router updates
- **Current behavior:** catalog metadata ignores `searchParams`, always emits `index,follow`, and canonicals all query combinations to a base/path URL. UI controls generate combinable URL parameters; unknown keys can initially enter the client filter parser and metadata makes no distinction. Clean page 2 is also canonicalized to page 1 instead of self-canonical.
- **Evidence:** source parameter/data flow; Google documents additive filters as a potentially near-infinite URL space, recommends avoiding indexing filter/alternate-sort variants, and separately recommends unique self-canonical pagination pages.
- **Relevant guidance:** [Google faceted-navigation crawl management](https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation); [Google pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading); [Google URL-structure guidance](https://developers.google.com/search/docs/crawling-indexing/url-structure).
- **Impact on users:** inconsistent copied URLs/default parameters can produce duplicate states; invalid/out-of-range combinations lack a deliberate status policy.
- **Impact on assistive technologies:** no separate AT impact; dynamic updates are A11Y-005.
- **Impact on browsers/crawlers:** crawl space can expand combinatorially; contradictory `index` plus canonical hints leave index selection to crawlers; clean pagination signals are wrong.
- **Recommended fix:** codify/test a parameter policy: canonical category path and clean page 1/page n are indexable self-canonical; search, filter, price, and alternate-sort variants are `noindex,follow` with a clean equivalent canonical and excluded from sitemap; normalize/default-strip parameter order/values; reject or redirect invalid/out-of-range combinations without soft 404s. Choose robots crawl rules only after ensuring required `noindex` remains crawlable.
- **Implementation constraints:** do not block URLs in robots if crawlers must see `noindex`; do not noindex canonical clean pagination; retain shareable filter UX; use server-known allowlisted filter keys when available and do not invent SEO landing pages.
- **Regression risk:** an overly broad policy can noindex canonical categories or trap crawlers; test every route class and robots interaction.
- **Automated test:** table-driven metadata/status tests across clean category/catalog pages, page n, default sort, alternate sort, search, single/multiple filters, invalid key/value, empty results, and legacy category query; assert sitemap exclusion and robots visibility.
- **Manual verification:** inspect HTTP/head for the route-class matrix; crawl a bounded link graph; verify filtered URLs remain usable/shareable and canonical pages stay indexable.
- **Acceptance criteria:** every parameter class has one documented deterministic robots/canonical/status behavior; clean pagination self-canonicals; no filtered/search/sort URL enters the sitemap or indexable set; no robots rule hides required noindex.
- **External dependencies:** product decision is needed only if specific curated facet landing pages should become indexable; none are to be invented.

### A11Y-005 - Catalog, search, cart, and favorites result changes are not completely announced

- **Severity:** P2
- **Confidence:** High (direct live-region/state evidence)
- **Category:** Dynamic content / status messages / focus context
- **Affected route or component:** Catalog results/pagination; `SmartSearch` across Home/Catalog/Product; Cart refresh; Favorites and similar-products refresh
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Screen reader, keyboard, magnifier; all viewports
- **Exact files:** `src/components/CatalogPage/Catalog/index.tsx`; `src/components/ui/shared/Pagination/index.tsx`; `src/components/ui/shared/SmartSearch/index.tsx`; Category/Filters/Sort desktop trigger files; `src/screens/CartPage/index.tsx`; `src/screens/FavoritesPage/index.tsx`; `src/components/ui/shared/ErrorState/index.tsx`
- **Exact symbols:** `Catalog`; `Pagination`; `SmartSearchPanelContent`; desktop overlay triggers; `CartPage`; `FavoritesPage`; `ErrorState`
- **Current behavior:** catalog load/filter/sort/page replacement has no `aria-busy`, status summary, live result count, or post-update focus convention. SmartSearch marks only its loading skeleton wrapper `aria-live`; success count, no-result, rate-limit, and error changes are not status regions. Cart and Favorites insert visual loading/error/empty/result states after local-storage-backed client fetches, but neither result container is busy-labelled and the shared `ErrorState` is an ordinary section rather than an alert/status. Search input controls a panel but does not expose popup-expanded/state semantics. Category/Filter/Sort desktop triggers claim `aria-haspopup="listbox"` although their panels are button hierarchies/forms/radiogroups rather than listboxes.
- **Evidence:** full source inspection of async state branches and ARIA; no status role/live container around resolved states and popup roles do not match descendants.
- **Relevant guidance:** [WCAG 2.2 SC 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html); [WCAG 2.2 SC 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value); WCAG 2.4.3 focus-order principles.
- **Impact on users:** sighted users see replacement results, while nonvisual users may receive no confirmation of completion/count/error; pagination can leave magnifier/keyboard context far from changed content.
- **Impact on assistive technologies:** important asynchronous status is not programmatically exposed and popup roles misstate interaction expectations.
- **Impact on browsers/crawlers:** no material crawl impact beyond SEO-004; browser focus remains on controls while remote content changes silently.
- **Recommended fix:** add concise localized polite atomic status channels and accurate `aria-busy` to each async result owner; announce quick-search/catalog/cart/favorites completion, count/empty/error/rate-limit once without repeated keystroke chatter; make `ErrorState` opt into an appropriate live/alert mode only when inserted dynamically; expose accurate disclosure/dialog/group semantics and `aria-expanded/controls`, not fake listboxes.
- **Implementation constraints:** do not move focus on every filter keystroke; avoid announcing skeleton rows or every debounce tick; keep Radix mobile modal behavior and current URL/history.
- **Regression risk:** broad live regions can become noisy and duplicate toast announcements; isolate concise status text.
- **Automated test:** test loading->success/empty/error/rate-limit announcements across Catalog, SmartSearch, Cart, and Favorites; `aria-busy`; page change status; preserved trigger focus; and accurate popup roles/states.
- **Manual verification:** NVDA/available screen reader during typing, retry, filter, sort, pagination, cart hydration, and favorites/similar refresh; keyboard and 400% magnifier context after updates.
- **Acceptance criteria:** each meaningful async completion/error is announced once in the correct locale; busy state is accurate; focus stays logical/visible; popup semantics match actual controls.
- **External dependencies:** none.

### A11Y-006 - Product image lightbox declares a modal without modal focus behavior

- **Severity:** P1
- **Confidence:** High (complete source/effect inspection)
- **Category:** Modal dialog / keyboard focus / gallery
- **Affected route or component:** every product with a working image; gallery zoom lightbox
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** All; keyboard, screen reader, switch input, magnifier
- **Exact file:** `src/components/ProductPage/ProductGallery/index.tsx`
- **Exact symbol:** `ProductGallery`, `isLightboxOpen` branch/effect
- **Current behavior:** zoom renders a custom `role="dialog" aria-modal="true"`, locks body scroll, supports Escape/arrow keys, and has a close button, but never moves focus inside, traps Tab, makes the background inert, or restores focus to the invoking image. Shared carousel off-screen exposure also remains inside the lightbox.
- **Evidence:** no focus refs/calls, focus guards, inert primitive, or return-focus logic in the full component; APG modal requirements are explicit.
- **Relevant guidance:** [WAI APG Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/); WCAG 2.2 2.4.3 and 2.4.7.
- **Impact on users:** focus stays behind the enlarged image or escapes to obscured page controls; closing can lose the user's product-image position.
- **Impact on assistive technologies:** `aria-modal` promises an isolated dialog context that does not exist.
- **Impact on browsers/crawlers:** browser focus and visible layer disagree; no crawler impact.
- **Recommended fix:** use Radix Dialog/shared proven modal wrapper; label it, choose safe initial focus (close button or static title), contain focus/background, close on Escape/overlay, and restore to the exact thumbnail/main-image opener; reuse A11Y-004 slide visibility fixes inside.
- **Implementation constraints:** preserve zoom, image order, swipe/arrow navigation, body scroll recovery, localized labels, and visual treatment; do not add another modal library.
- **Regression risk:** Embla keyboard arrows and Dialog Escape/overlay handling can conflict; ensure close does not also advance a slide and nested events stop correctly.
- **Automated test:** open from multiple images, assert internal/trapped focus, background inertness, Escape/overlay/button close, opener restoration, and carousel arrow operation.
- **Manual verification:** keyboard/screen reader at mobile/desktop/400% zoom; open from main image/thumbnail, cycle Tab/Shift+Tab, change slides, close each way.
- **Acceptance criteria:** labelled dialog owns focus and background while open, restores exact logical opener, and retains every gallery function without off-screen focus.
- **External dependencies:** none.

### A11Y-007 - Product tabs do not implement the keyboard interaction promised by tab roles

- **Severity:** P2
- **Confidence:** High (direct markup/handler evidence)
- **Category:** Tabs / keyboard / name-role-value
- **Affected route or component:** product Description, Warranty, Delivery, Payment, Reviews tabs
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Keyboard and screen reader; all viewports
- **Exact file:** `src/components/ProductPage/ProductInfoTabs/index.tsx`
- **Exact symbol:** `ProductInfoTabs`
- **Current behavior:** all five `role="tab"` buttons remain in the page Tab sequence; no `tabIndex` management or Left/Right/Home/End keyboard handler exists. Click changes one shared labelled tabpanel.
- **Evidence:** complete tablist source; WAI APG Tabs expects one active tab in sequential order and arrow-key movement among tabs.
- **Relevant guidance:** [WAI APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/); [WCAG 2.2 SC 2.1.1 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html); WCAG 4.1.2.
- **Impact on users:** keyboard users must Tab through every tab and cannot use conventional tab keys; screen-reader instructions/expectations mismatch behavior.
- **Impact on assistive technologies:** roles/states are present but widget interaction is incomplete.
- **Impact on browsers/crawlers:** no crawl impact; click content remains client-only but core product detail is server-rendered.
- **Recommended fix:** implement roving tabindex, Left/Right (orientation-aware), Home/End, focus/selection behavior, stable panel association, and visible focus; preserve horizontal scrolling and touch.
- **Implementation constraints:** keep five tabs, content, URL behavior, layout, and localized labels; avoid a dependency.
- **Regression risk:** focus can move to clipped tabs on narrow viewports; scroll focused tab into view without unwanted page motion and respect reduced motion.
- **Automated test:** role-based tests for one tab stop, arrow wrap, Home/End, selected/panel linkage, mouse/touch selection, and focus visibility.
- **Manual verification:** keyboard at 320/400%/desktop and screen-reader roles/states in RU/KZ/EN.
- **Acceptance criteria:** tab keys match APG, only active tab is in ordinary Tab order, selected panel linkage is correct, and focused tabs remain visible.
- **External dependencies:** none.

### HTML-001 - Out-of-stock notification form accepts data but performs no action

- **Severity:** P1
- **Confidence:** Certain (the submit function body is intentionally empty)
- **Category:** Human usability / form feedback / error prevention
- **Affected route or component:** unavailable/out-of-stock product pages
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** All users and input modes
- **Exact file:** `src/components/ProductPage/ProductSummary/index.tsx`
- **Exact symbols:** `submitStockNotify`; out-of-stock `<form>`
- **Current behavior:** the UI asks for email/phone and presents a localized submit button, but `submitStockNotify` contains only a comment that no endpoint exists. Submission produces no request, validation requirement, error, success, or explanation.
- **Evidence:** direct source inspection; no API call/state/toast is reachable from the handler.
- **Relevant guidance:** honest human-interface behavior; [WCAG 2.2 SC 3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) and [SC 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) would govern a real submission workflow.
- **Impact on users:** users may believe notification details were registered when nothing was saved, causing missed availability and loss of trust.
- **Impact on assistive technologies:** no completion/error state is announced because none exists.
- **Impact on browsers/crawlers:** browser prevents navigation but otherwise nothing happens; no crawler impact.
- **Recommended fix:** until a real authorized endpoint/consent/storage policy exists, remove the input/submit affordance and show an honest localized unavailable message plus an existing valid contact/request action. Only implement notification fields when the backend contract, validation, consent, retention, rate limiting, errors, success, and AT status are available.
- **Implementation constraints:** backend is excluded; never fake success, store contact data locally, repurpose an endpoint without contract approval, or expose a disabled-looking but focusable form.
- **Regression risk:** conversion/product expectations may depend on this CTA; obtain product sign-off on replacement copy/action.
- **Automated test:** assert unavailable state contains no nonfunctional notification form and exposes the approved working CTA/message; if endpoint is later authorized, contract-test success/error/rate-limit/validation and live status.
- **Manual verification:** submit/activate every out-of-stock action with keyboard/screen reader and confirm truthful outcome; inspect network.
- **Acceptance criteria:** no form claims to register notifications unless data is actually validated, sent, and acknowledged; current frontend-only implementation exposes only a truthful working alternative.
- **External dependencies:** a real stock-notification backend/privacy/product contract is required for notification functionality and is outside this task.

### I18N-001 - Kazakh review dates are formatted using the `kz` route token instead of `kk-KZ`

- **Severity:** P2
- **Confidence:** High (source plus Node Intl runtime proof)
- **Category:** Internationalization / locale formatting
- **Affected route or component:** product Reviews dates in KZ locale
- **Affected locales:** KZ/KK only
- **Affected viewport or input mode:** All
- **Exact files:** `src/components/ProductPage/ProductReviews/index.tsx`; locale mapping should be shared with `src/utils/formatProductPrice.ts`/`src/i18n/htmlLanguage.ts`
- **Exact symbol:** `dateFormatter = new Intl.DateTimeFormat(locale, ...)`
- **Current behavior:** next-intl returns route token `kz`; Node 24 accepts it but resolves `Intl.DateTimeFormat("kz")` to `ru-KZ`, while `kk` resolves to Kazakh. Review month/date text therefore follows Russian formatting on a Kazakh page. Price formatting already correctly maps `kz -> kk-KZ`.
- **Evidence:** local runtime: `new Intl.DateTimeFormat("kz").resolvedOptions().locale === "ru-KZ"`; `"kk" === "kk"`; direct source passes `kz` unconverted.
- **Relevant guidance:** [WCAG 2.2 SC 3.1.2 Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html); BCP 47/Intl locale correctness.
- **Impact on users:** Kazakh review dates can show Russian month/language conventions.
- **Impact on assistive technologies:** dates may be pronounced/formatted under mismatched language conventions.
- **Impact on browsers/crawlers:** Intl fallback varies by runtime, so cross-browser rendering is inconsistent.
- **Recommended fix:** centralize app-locale to formatting-locale mapping (`ru-RU`, `kk-KZ`, `en-US`) and use it for dates and numbers; do not pass route token `kz` to Intl.
- **Implementation constraints:** keep URL prefix `kz`; do not change `html lang="kk"`; test supported runtimes.
- **Regression risk:** formatting snapshots vary by ICU version; assert semantic locale/date parts rather than brittle punctuation where possible.
- **Automated test:** add formatter unit tests for all three route locales and a review-date assertion that KZ uses `kk-KZ`/Kazakh month output.
- **Manual verification:** compare same review date on RU/KZ/EN in Chromium/Firefox/WebKit-compatible browser.
- **Acceptance criteria:** KZ date formatting resolves to `kk-KZ`/Kazakh, while RU/EN remain correct; no route prefix changes.
- **External dependencies:** none.

### HTML-002 - Public Instagram links target the generic platform homepage placeholder

- **Severity:** P2
- **Confidence:** Certain (central config and project memory explicitly identify the placeholder)
- **Category:** Link purpose / human usability / external discoverability
- **Affected route or component:** Footer on every route; four About Instagram carousel cards
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** All
- **Exact files:** `src/config/routes.ts`; `src/components/ui/layout/Footer/index.tsx`; `src/components/AboutPage/InstagramSlider/index.tsx`
- **Exact symbols:** `CONTACT_LINKS.instagram`; Footer Instagram anchors; `AboutInstagramSlider`
- **Current behavior:** all links labelled as Vympel/Instagram posts resolve to `https://www.instagram.com/`, the generic platform homepage. `docs/PROJECT_MAP.md` confirms it is a placeholder until the real Vympel URL is known. Four visually distinct post cards all have the same generic destination.
- **Evidence:** repository-wide URL search finds no official account/post URL, only the centralized placeholder and its three consumer sites.
- **Relevant guidance:** [WCAG 2.2 SC 2.4.4 Link Purpose (In Context)](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context); honest destination labeling.
- **Impact on users:** “open Instagram/post” does not reach Vympel or the depicted post; users may think the link is broken or misleading.
- **Impact on assistive technologies:** accessible names promise numbered posts but every destination is the generic home page.
- **Impact on browsers/crawlers:** external link signals point to the platform rather than an official profile; no ranking outcome is claimed.
- **Recommended fix:** make the official URL an explicit validated configuration value. Until supplied, omit Instagram anchors/slider action (or present noninteractive images with honest text) rather than shipping a generic placeholder. If only a profile URL is supplied, do not label four cards as individual posts; use one profile CTA unless real post URLs exist.
- **Implementation constraints:** do not guess a handle, scrape Instagram, hardcode private data, or invent post URLs; preserve layout without a misleading focus target.
- **Regression risk:** removing anchors changes About carousel/card interaction and Footer spacing; preserve visual balance and A11Y-003/004 controls only if the carousel still has a user purpose.
- **Automated test:** configuration/consumer tests reject `instagram.com/` root and require either an allowed absolute official URL or absent/disabled Instagram UI; link names must match profile vs post granularity.
- **Manual verification:** activate every Instagram affordance and verify actual destination/accessible name/new-tab behavior in all responsive variants.
- **Acceptance criteria:** no generic platform placeholder is exposed; each visible link's name accurately describes its configured destination; unknown URL produces no misleading link.
- **External dependencies:** official Vympel Instagram profile and, if individual cards remain links, approved individual post URLs.

### A11Y-008 - Request and review validation errors are not reliably associated with their fields

- **Severity:** P2
- **Confidence:** High (direct form markup and React Hook Form state evidence)
- **Category:** Forms / error identification / name-role-value
- **Affected route or component:** global customer-request dialog; product review form
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Screen reader, speech input, keyboard; all viewports
- **Exact files:** `src/components/CustomerRequestDialog/CustomerRequestDialogProvider.tsx`; `src/components/ProductPage/ProductReviews/index.tsx`
- **Exact symbols:** `RequestField`; `CustomerRequestDialogProvider`; review `textarea`/rating validation branches
- **Current behavior:** visual error text is rendered after invalid controls, but controls do not receive `aria-invalid` or stable `aria-describedby`/`aria-errormessage` references. Customer-request errors have no alert/live semantics; the invalid-submit toast only says to check fields. Review errors use `role="alert"` but are still not programmatically associated with their control, and the custom rating buttons expose no group invalid/error relationship.
- **Evidence:** direct inspection of both `noValidate` forms, registered controls, error branches, and submit handlers; the validation library has focusable refs but the accessibility tree lacks explicit invalid state/error ownership.
- **Relevant guidance:** [WCAG 2.2 SC 3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html); [WCAG 2.2 SC 3.3.3 Error Suggestion](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html); [WAI form validation guidance](https://www.w3.org/WAI/tutorials/forms/notifications/).
- **Impact on users:** nonvisual users may hear only a generic failure, not which input is invalid or the correction associated with it.
- **Impact on assistive technologies:** field state and error ownership are missing or rely on incidental DOM/label text concatenation.
- **Impact on browsers/crawlers:** browser native validation is intentionally disabled; no crawl impact.
- **Recommended fix:** generate stable field/error IDs; set `aria-invalid` only when invalid and reference help/error text from each control; keep concise alert behavior for newly added errors; focus the first invalid control; expose the rating fieldset/group error relationship; retain a summary/toast only as a supplement.
- **Implementation constraints:** preserve React Hook Form, honeypot behavior, modal focus trap/restoration, optional name/message fields, either-email-or-phone rule, phone formatting/caret behavior, and localized copy.
- **Regression risk:** wrapping-label accessible names can change when IDs are introduced; test name/contact cross-field validation and repeated submissions.
- **Automated test:** submit every invalid path and assert first-error focus, `aria-invalid`, error references/text, resolved-state cleanup, either-contact validation, and three-locale messages.
- **Manual verification:** NVDA/available screen reader submit from each control, correct errors one by one, and confirm a single understandable announcement with no duplicate chatter.
- **Acceptance criteria:** every visible validation error is programmatically owned by its invalid control/group, announced when introduced, cleared when resolved, and focus reaches the first actionable error.
- **External dependencies:** none.

### A11Y-009 - Removing the focused cart or favorite item can strand focus in the document body

- **Severity:** P2
- **Confidence:** High (the focused invoker is deterministically unmounted; the exact browser/body fallback can vary)
- **Category:** Keyboard / focus management / dynamic content
- **Affected route or component:** Cart item removal/clear; Favorites card removal
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Keyboard, screen reader, switch input; all viewports
- **Exact files:** `src/screens/CartPage/index.tsx`; `src/screens/FavoritesPage/index.tsx`; `src/components/GoodCard/index.tsx`; `src/components/ui/alert-dialog.tsx`
- **Exact symbols:** cart `removeCandidate`/`clearProducts`; `GoodCard.toggleFavoriteHandler`; controlled `AlertDialog`
- **Current behavior:** confirming cart removal deletes the element that opened the controlled dialog; clearing deletes every item; toggling favorite from Favorites immediately unmounts the focused card. No consumer selects a surviving next/previous item, heading, or empty-state action as the post-mutation focus destination. Primitive focus restoration cannot restore to an opener that no longer exists.
- **Evidence:** direct state/mutation/render tracing; the relevant components contain no post-delete refs/focus effect and each list is keyed by the removed product ID.
- **Relevant guidance:** [WCAG 2.2 SC 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html); [WAI APG focus persistence guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#discernibleandpredictablekeyboardfocus).
- **Impact on users:** focus can disappear to the page body/top after a destructive action, forcing users to rediscover list position and whether the action succeeded.
- **Impact on assistive technologies:** the focused accessibility node is removed without a deterministic replacement; toast text does not restore navigation context.
- **Impact on browsers/crawlers:** browser fallback focus varies; no crawl impact.
- **Recommended fix:** before mutation determine a logical surviving target: next item action, otherwise previous item action, otherwise the empty-state primary action or page heading. After DOM commit, focus it without scrolling unexpectedly; after clear, focus the empty-state action/heading. Keep confirmation-dialog cancellation restoration unchanged.
- **Implementation constraints:** do not retain removed invisible nodes; preserve Radix AlertDialog, undo toast, product list order, touch behavior, and visible design.
- **Regression risk:** async snapshot refresh and undo can race focus targets; guard disconnected refs and avoid focusing on pointer-only removal unless it improves rather than disrupts context.
- **Automated test:** keyboard-open cart confirm then remove first/middle/last/only item and clear; remove favorite first/middle/last/only; assert connected, visible logical focus and cancellation return.
- **Manual verification:** repeat all removal paths with Tab/Enter and NVDA; confirm spoken focus context and no jump to browser chrome/body.
- **Acceptance criteria:** after every keyboard destructive mutation, exactly one logical visible element owns focus; cancel restores to the invoker; pointer behavior is not disrupted.
- **External dependencies:** none.

### I18N-002 - Global errors can render Russian content and the wrong language tag for Kazakh or English routes

- **Severity:** P1
- **Confidence:** High (direct server/client initializer and locale-mapping evidence)
- **Category:** Document language / error localization / hydration
- **Affected route or component:** root `global-error` fallback after unrecoverable layout/root errors
- **Affected locales:** KZ/KK and EN (RU is the hard-coded fallback)
- **Affected viewport or input mode:** All; especially screen readers and translation/pronunciation tools
- **Exact files:** `src/app/global-error.tsx`; `src/i18n/htmlLanguage.ts`; `src/app/[locale]/layout.tsx`
- **Exact symbols:** `copy`; `GlobalError` locale state initializer; `<html lang={locale}>`; `toHtmlLanguage`
- **Current behavior:** server rendering always initializes locale to RU because `document` is unavailable. On the client the detector accepts `ru`, `kz`, or `en`, but normal Kazakh pages correctly use `<html lang="kk">`, so `kk` falls back to RU; if KZ were accepted, the boundary would output invalid project token `lang="kz"` rather than `kk`. The root error has no route locale parameter, so EN also lacks a reliable server-language contract.
- **Evidence:** deterministic source execution paths plus the existing `kz -> kk` mapping used by the normal locale layout.
- **Relevant guidance:** [WCAG 2.2 SC 3.1.1 Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html); [HTML `lang` guidance](https://html.spec.whatwg.org/multipage/dom.html#the-lang-and-xml:lang-attributes).
- **Impact on users:** a critical error may suddenly switch to Russian and be pronounced with the wrong language rules exactly when recovery instructions matter most.
- **Impact on assistive technologies:** the document-language token and visible copy can disagree with the requested locale or normal page contract.
- **Impact on browsers/crawlers:** language detection/hydration may be inconsistent; error pages are not intended landing pages.
- **Recommended fix:** create one tested locale resolver that derives the supported route locale from a safe pathname/document fallback on the client, maps app `kz` and HTML `kk` to Kazakh copy, and always emits `kk`; make server fallback neutral or correctly injected through an architecture Next supports, without hydration mismatch. Preserve the minimal dependency-free boundary.
- **Implementation constraints:** `global-error` must include its own `<html>/<body>`, cannot assume next-intl provider/layout survived, and must not import a failure-prone application graph; never change public `/kz` URLs.
- **Regression risk:** pathname parsing around unsupported prefixes/root/static failures can misclassify language; test all three supported prefixes and no-prefix fallback in server and hydrated states.
- **Automated test:** render/hydrate global error for `/ru`, `/kz`, `/en`, unknown/no prefix, and prior document `lang=kk`; assert visible copy, stable hydration, reset action, and standards tags `ru`/`kk`/`en`.
- **Manual verification:** force root-level failure in an isolated test harness for each locale; inspect first HTML and hydrated DOM; screen-reader pronunciation check where available.
- **Acceptance criteria:** no supported locale displays another locale's recovery copy; Kazakh always emits `lang="kk"`; server/client output does not produce a hydration mismatch.
- **External dependencies:** none.

### I18N-003 - English fallback text leaks into Russian and Kazakh UI/accessibility content

- **Severity:** P2
- **Confidence:** Certain (literal source and locale-message evidence)
- **Category:** Localization consistency / accessible names
- **Affected route or component:** Home and Catalog benefits section; customer-request name field; shared carousel defaults are already covered by A11Y-004
- **Affected locales:** RU and KZ/KK
- **Affected viewport or input mode:** All; the Benefits leak is visually hidden but exposed to screen readers
- **Exact files:** `src/components/Benefits/index.tsx`; `src/messages/ru.json`; `src/messages/kz.json`; `src/components/CustomerRequestDialog/CustomerRequestDialogProvider.tsx`
- **Exact symbols:** hard-coded `Benefits` H2; `requestDialog.placeholders.name`
- **Current behavior:** a screen-reader-visible section heading is always `Benefits`; RU and KZ name placeholders both contain the English salutation `Dear User`. These are not missing-key fallbacks: all three files have structural parity but the localized values/source literal are wrong.
- **Evidence:** direct source inspection and deterministic JSON comparison (all locale files have 502 keys, and both RU/KZ values equal the EN value).
- **Relevant guidance:** [WCAG 2.2 SC 3.1.2 Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html); localized, understandable instructions/names.
- **Impact on users:** Russian/Kazakh experiences contain unexplained English, and a screen reader announces an English heading under a RU/KK document language.
- **Impact on assistive technologies:** the unmarked language change can be pronounced incorrectly and makes heading navigation inconsistent.
- **Impact on browsers/crawlers:** heading language/content quality is inconsistent; no ranking outcome is claimed.
- **Recommended fix:** add/use a localized Benefits section-heading key and translate RU/KZ name placeholder naturally (or remove a nonessential salutation placeholder); audit all shared component defaults from A11Y-004 so callers cannot leak English.
- **Implementation constraints:** preserve the visually hidden benefits heading/section semantics, key parity, field label, autocomplete, and layout; do not auto-translate brand/product proper nouns.
- **Regression risk:** changing placeholder snapshots and message-key counts requires all three locales/tests in one change.
- **Automated test:** assert localized heading/placeholder values differ appropriately across RU/KZ/EN and run a source check for prohibited user-facing English defaults in shared UI.
- **Manual verification:** inspect visible placeholder and heading-navigation output in RU/KZ/EN with a screen reader/accessibility tree.
- **Acceptance criteria:** no unmarked English fallback remains in these RU/KZ surfaces; all new keys have three-locale parity and correct document/part language.
- **External dependencies:** approved Kazakh/Russian wording review is desirable but not blocking for obvious labels.

### SEO-006 - Middleware HTTP hreflang alternates contradict the correct HTML metadata alternates

- **Severity:** P1
- **Confidence:** Certain (actual staging response headers and rendered `<head>` compared)
- **Category:** International SEO / hreflang / conflicting signals
- **Affected route or component:** every localized page handled by next-intl middleware
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Crawlers; all user agents receiving the response header
- **Exact files:** `src/i18n/routing.ts`; `src/proxy.ts`; `src/lib/seo.ts`; localized route metadata generators
- **Exact symbols:** `routing`; `createMiddleware(routing)`; `localizedAlternates`; `publicSeoMetadata`
- **Current behavior:** the HTML head correctly emits `ru`, `kk`, `en`, and `x-default -> /ru`. The same live response also emits next-intl's automatic HTTP `Link` header with `hreflang="kz"` and `x-default -> /`. Thus one response gives crawlers two incompatible alternate sets; `kz` is the public route token, not Kazakh's language code (`kk`), and `/` is a redirect rather than the chosen RU default document.
- **Evidence:** live `HEAD https://shop.34.18.200.58.sslip.io/ru` returned the conflicting `Link` header; rendered DOM inspection returned the correct HTML set. next-intl documents that its middleware adds this header by default and permits `alternateLinks:false` when the application provides alternates itself. Google states HTML, HTTP, and sitemap are equivalent methods with no benefit to duplicating them and requires self/reciprocal valid language variants.
- **Relevant guidance:** [next-intl routing `alternateLinks`](https://next-intl.dev/docs/routing/configuration#alternate-links); [Google localized versions/hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions).
- **Impact on users:** search engines may choose or label the wrong localized result; direct navigation still works.
- **Impact on assistive technologies:** no direct AT impact; the same `kz`/`kk` contract is material to language consistency.
- **Impact on browsers/crawlers:** crawlers receive an invalid/conflicting Kazakh token and different x-default destination in one response, so alternate signals may be ignored or misinterpreted.
- **Recommended fix:** set `alternateLinks:false` in the shared next-intl routing config and keep the tested route-specific HTML metadata as the single hreflang source (plus consistent sitemap alternates if retained). Alternatively customize the middleware header only if an HTTP header is operationally required; it must exactly match HTML. Do not expose route token `kz` as hreflang.
- **Implementation constraints:** preserve `/kz` public prefixes, `html lang="kk"`, required prefix routing, locale detection policy, and existing canonical origin validation; do not emit duplicate independently maintained sets.
- **Regression risk:** disabling middleware alternates touches every response; all public route classes need metadata tests and an actual response-header assertion.
- **Automated test:** run proxy/production response tests asserting no automatic `Link` alternate header when HTML owns alternates, and assert head/sitemap RU/KK/EN/x-default reciprocity for representative static/dynamic/category/product routes.
- **Manual verification:** inspect actual `HEAD` plus HTML source for RU/KZ/EN Home, Catalog, Product, and 404/private routes; validate language codes and exact destinations.
- **Acceptance criteria:** a crawler sees one consistent alternate graph; Kazakh is always `kk`, x-default follows the documented `/ru` decision, every indexable localized page self/reciprocally references peers, and private/nonindex pages do not publish misleading alternates.
- **External dependencies:** none.

### A11Y-010 - Request placeholder and carousel/search indicators do not meet minimum contrast

- **Severity:** P2
- **Confidence:** Certain for the specified solid-color pairs (rendered computed styles plus deterministic WCAG luminance calculation)
- **Category:** Visual accessibility / text contrast / non-text contrast
- **Affected route or component:** customer-request dialog; Brands carousel dots; open catalog SmartSearch close icon
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Low vision, color-vision impairment, bright/low-quality displays; all viewports where controls appear
- **Exact files:** `src/app/globals.css`; `src/components/ui/shared/CarouselDots/index.tsx`; `src/components/HomePage/BrandsCarousel/index.tsx`; `src/components/ui/shared/SmartSearch/index.tsx`; `src/components/CustomerRequestDialog/CustomerRequestDialogProvider.tsx`
- **Exact symbols:** `.customer-request-input::placeholder`; `--gray-50`; `--white-200`; `--gray-100`; Brands `CarouselDots`; SmartSearch close `X`
- **Current behavior:** the 15px request placeholder is `#aaa` on white (2.32:1, below 4.5:1). Brands' only dot indicators are `#d2d2d2` (1.51:1) and selected `#a1a1a1` (2.58:1) on white, below the 3:1 component/state threshold. The actionable SmartSearch close X reuses `#aaa` on white (2.32:1). Disabled uses of the same gray are exempt and are not included.
- **Evidence:** live request dialog computed `rgb(170,170,170)` over `rgb(255,255,255)`; live Brands dots computed `rgb(210,210,210)`/`rgb(161,161,161)` in 12px controls over the white section; formula results independently calculated from source tokens.
- **Relevant guidance:** [WCAG 2.2 SC 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [WCAG 2.2 SC 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html); [W3C icon contrast technique G207](https://www.w3.org/WAI/WCAG22/Techniques/general/G207).
- **Impact on users:** placeholder guidance and small control/state indicators can be indistinguishable, particularly on mobile/bright displays.
- **Impact on assistive technologies:** accessible names remain present, but low-vision users who rely on the visual control cannot reliably identify it/state.
- **Impact on browsers/crawlers:** antialiasing/browser display differences can worsen perception; no crawl impact.
- **Recommended fix:** use existing darker tokens or introduce purpose-specific tokens that produce at least 4.5:1 for normal placeholder text and 3:1 for required icons/dot states against their actual solid adjacent background; differentiate selected dots by shape/size as already done, not color alone. Re-evaluate hover/focus/disabled states and image-backed hero dots separately against worst-case backgrounds.
- **Implementation constraints:** preserve component dimensions/layout/brand tone; do not darken legitimately disabled controls solely to meet an inapplicable threshold; avoid a global gray change that degrades unrelated design.
- **Regression risk:** shared token changes can affect many surfaces; scope tokens/classes and test light/image backgrounds.
- **Automated test:** unit-test color pairs with the WCAG luminance formula and component class/token assignments; add a browser contrast scan when an approved tool exists, then manually verify dynamic/image contexts.
- **Manual verification:** inspect request placeholder, Brands dot states, and SmartSearch close at desktop/mobile, forced/high contrast where supported, and on typical brightness; confirm focus indicators remain distinct.
- **Acceptance criteria:** specified normal text is >=4.5:1 and required control/state graphics are >=3:1 in every default/hover/focus/selected state; disabled exceptions remain clearly disabled.
- **External dependencies:** none.

### HTML-003 - Global logo and carousel product heading levels break the visible page hierarchy

- **Severity:** P2
- **Confidence:** High (rendered accessibility-tree/heading-list evidence across Home and route source)
- **Category:** Semantic HTML / headings / information relationships
- **Affected route or component:** Header on every page; product rails on Home, brand/product recommendations, and similar-product sections
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Screen-reader heading navigation, reader modes, document-outline consumers; all viewports
- **Exact files:** `src/components/ui/layout/Header/index.tsx`; `src/components/GoodCard/index.tsx`; `src/components/ui/shared/GoodsCarouselWithImage/index.tsx`; route section consumers
- **Exact symbols:** Header logo `Heading as="h3"`; `GoodCard` `isCatalog ? "h2" : "h3"`; `GoodsCarouselWithImage` `isCatalog={showProductActions}`
- **Current behavior:** every page announces a decorative/navigation logo as H3 before the page H1. On Home, an H2 such as “New arrivals” is followed by each product card as another H2 because showing actions is incorrectly used as the heading-level switch; cards are not descendants of their visible section heading in the heading hierarchy. The same boolean conflates action layout with semantics in other rails.
- **Evidence:** live RU/KZ accessibility snapshots begin `H3 VYMPEL`, then `H1 Vympel`; Home snapshot shows `H2 New arrivals`, `H2 product`, `H2 Brands`. Source traces this to the two noted boolean decisions.
- **Relevant guidance:** [WCAG 2.2 SC 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html); [WAI page-structure headings tutorial](https://www.w3.org/WAI/tutorials/page-structure/headings/).
- **Impact on users:** heading lists begin at level 3 before the page title and product cards appear to start peer sections rather than belong to a named rail, making nonvisual skimming less predictable.
- **Impact on assistive technologies:** visual size is conveyed as structural heading level even when the element is branding/navigation; one prop controls unrelated action and outline semantics.
- **Impact on browsers/crawlers:** document structure is noisier; no ranking change is promised.
- **Recommended fix:** render the linked header logo as non-heading text with the same visual typography. Give GoodCard an explicit semantic heading-level/context prop independent of action visibility: H2 for top-level catalog/favorites grid items where appropriate, H3 under an H2 rail/section. Verify footer/group headings remain meaningful rather than removing legitimate structure.
- **Implementation constraints:** no visual typography/layout change; retain linked logo accessible name, exactly one route H1, product article semantics, and reusable card API.
- **Regression risk:** shared GoodCard consumers have different section contexts; enumerate every call site and require an explicit/default-safe level.
- **Automated test:** heading-outline tests for Header + representative Home/Catalog/Brand/Product/Favorites compositions; assert one H1, no branding heading before it, and rail card H3 under its H2 while Catalog cards remain H2.
- **Manual verification:** inspect browser accessibility heading lists in RU/KZ/EN at desktop/mobile and ensure visible typography is unchanged.
- **Acceptance criteria:** headings form a logical route-specific hierarchy; branding is not a heading; reusable product-card heading level reflects its containing section rather than action visibility.
- **External dependencies:** none.

### SEO-007 - The public temporary staging host is fully indexable and self-canonical

- **Severity:** P0
- **Confidence:** Certain (actual public responses plus deterministic source/configuration evidence)
- **Category:** Staging indexation / canonical origin / release safety
- **Affected route or component:** every public route, `robots.txt`, `sitemap.xml`, and all generated canonical/alternate URLs on the reachable temporary deployment
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Crawlers and link-sharing clients; all viewports
- **Exact files:** `src/lib/seo.ts`; `src/app/robots.ts`; `src/app/sitemap.ts`; `src/app/[locale]/layout.tsx`; all public route metadata; deployment environment supplying `NEXT_PUBLIC_SITE_URL`
- **Exact symbols:** `requireCanonicalSiteUrl`; `publicSeoMetadata`; `robots`; `sitemap`; `NEXT_PUBLIC_SITE_URL`
- **Current behavior:** `https://shop.34.18.200.58.sslip.io` is publicly reachable, responds `index,follow`, allows `/`, publishes a 75-URL sitemap, and self-canonicalizes every tested page to the temporary sslip.io host. There is no source-level environment/indexing gate: any syntactically valid origin becomes the advertised canonical/host/sitemap origin.
- **Evidence:** live 200/404/head/robots/sitemap checks and rendered head inspection on 2026-08-07; source inspection found no staging/production distinction or fail-closed indexability flag.
- **Relevant guidance:** [Google: control what you share with Search](https://developers.google.com/search/docs/crawling-indexing/control-what-you-share); [Google: block indexing with `noindex`](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
- **Impact on users:** temporary-host URLs can surface in search or link histories/previews and later compete with or require migration to the final domain.
- **Impact on assistive technologies:** no direct AT defect, but users can land on a non-final deployment whose availability/content contract may change.
- **Impact on browsers/crawlers:** crawlers are explicitly invited to crawl/index a disposable host and receive it as canonical; later switching the origin does not retroactively prevent discovery.
- **Recommended fix:** make indexability fail closed through an explicit server-only release contract (for example `SITE_INDEXING_ENABLED=false` by default and explicitly `true` only for the approved permanent production origin). Prefer access control for non-public staging. When public staging access is required, emit `X-Robots-Tag: noindex, nofollow` or equivalent readable page metadata on every response, omit/disable the sitemap, and do not advertise the temporary host. Keep `NEXT_PUBLIC_SITE_URL` for URL construction but do not treat a valid string alone as production authorization.
- **Implementation constraints:** never hardcode the unknown final domain; never infer production merely from `NODE_ENV=production`; do not rely only on `robots.txt Disallow: /` because blocked crawlers cannot read `noindex`; preserve truthful status codes and local QA access.
- **Regression risk:** an inverted/defaulted flag could deindex production or expose preview deployments; build/runtime environment boundaries and Next metadata/header execution need representative production-mode tests.
- **Automated test:** table-test staging/default/production-approved configurations for metadata robots, `X-Robots-Tag`, robots, sitemap availability/content, canonical origin, and explicit startup/build rejection of contradictory values; add a production-status assertion that an approved host is indexable and an unapproved host is not.
- **Manual verification:** before every launch, inspect actual response headers, initial head, robots, sitemap, canonical, and alternates on the deployed hostname; verify staging with URL Inspection only if operationally appropriate and production after approval.
- **Acceptance criteria:** no preview/staging deployment is indexable or publishes a discoverable URL inventory by default; only an explicitly approved final origin can emit `index,follow`, sitemap/Host, and self-canonicals; changing the flag cannot create mixed signals.
- **External dependencies:** deployment owner must choose the final origin and set the explicit production indexability value; access control/ingress configuration is outside this storefront-only audit.

### SEO-008 - robots.txt blocks crawlers from seeing Cart and Favorites noindex directives

- **Severity:** P1
- **Confidence:** Certain (live robots/head evidence and official crawler behavior)
- **Category:** Crawl control / private-state indexability
- **Affected route or component:** `/[locale]/cart`, `/[locale]/favorites`, `robots.txt`
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Crawlers; all viewports
- **Exact files:** `src/app/robots.ts`; `src/lib/seo.ts`; `src/app/[locale]/cart/page.tsx`; `src/app/[locale]/favorites/page.tsx`; `src/lib/seo.test.ts`
- **Exact symbols:** robots disallow patterns `/*/cart` and `/*/favorites`; `privatePageMetadata`
- **Current behavior:** Cart/Favorites correctly emit `noindex,nofollow` and are excluded from the sitemap, but robots.txt disallows their paths. Google explicitly requires a URL to remain crawlable to observe `noindex`; because the Header/Mobile navigation links to these pages, a blocked URL can still be discovered and may appear as a URL-only result.
- **Evidence:** live `/en/cart` and `/kz/favorites` heads plus live robots body; deterministic source/test inspection.
- **Relevant guidance:** [Google: noindex must not be blocked by robots.txt](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
- **Impact on users:** private-state route URLs can be surfaced without a useful snippet, while their local client content remains empty/nonportable to crawlers.
- **Impact on assistive technologies:** none directly; noindex changes must preserve the useful, accessible user route.
- **Impact on browsers/crawlers:** robots prevents the intended page-level directive from being processed and creates contradictory control signals.
- **Recommended fix:** remove only Cart/Favorites from robots disallow rules and retain their page-level `noindex,nofollow`, absence from sitemap, and lack of canonical/alternates. Keep truly nonpublic API/internal/admin paths disallowed as appropriate. Coordinate with SEO-007 so public staging remains globally nonindexable without blocking page-level noindex visibility.
- **Implementation constraints:** do not remove or authenticate the user-facing Cart/Favorites routes, add them to sitemap, or expose local contents server-side; do not use robots as an access-control mechanism.
- **Regression risk:** broad robots changes could expose internal paths or production indexing; assert exact patterns rather than snapshotting loosely.
- **Automated test:** extend `seo.test.ts` to assert Cart/Favorites are crawlable in production robots but emit noindex/nofollow and are absent from sitemap; assert API/internal/admin exclusions remain and staging policy overrides are coherent.
- **Manual verification:** fetch actual robots and initial HTML/headers for all six localized private URLs after deployment; use Search Console URL Inspection after final-domain launch if authorized.
- **Acceptance criteria:** crawlers can retrieve Cart/Favorites and observe noindex; those routes remain outside sitemap/canonical/alternate graphs; sensitive/internal paths remain protected by real controls and appropriate crawl rules.
- **External dependencies:** none for storefront source; Search Console validation waits for final-domain ownership.

### SEO-009 - Product and visible breadcrumb facts are not exposed as validated JSON-LD

- **Severity:** P2
- **Confidence:** High (absence is certain; rich-result eligibility depends on final data quality and Google validation)
- **Category:** Structured-data opportunity / product discoverability
- **Affected route or component:** valid `/[locale]/product/[id]` and routes with visible breadcrumb trails such as Catalog/category/Product
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Search engines and other structured-data consumers; all viewports
- **Exact files:** `src/app/[locale]/product/[id]/page.tsx`; `src/screens/ProductPage/index.tsx`; product/category breadcrumb builders; new narrowly scoped schema utility/tests
- **Exact symbols:** shared product loader required by SEO-002; `buildProductBreadcrumbs`; `IProductDetails`; `requireCanonicalSiteUrl`
- **Current behavior:** the rendered product exposes trustworthy name, SKU/model, brand, images, price in KZT, stock state, rating count/average, description/specs, canonical URL, and a visible breadcrumb, but initial HTML contains no `application/ld+json`. Visible Catalog/Product breadcrumbs likewise have no `BreadcrumbList` representation.
- **Evidence:** live KZ product head/DOM inspection and complete `src` search for JSON-LD/schema tokens.
- **Relevant guidance:** [Google Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product-snippet); [Google Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb); [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld).
- **Impact on users:** search/link consumers have less machine-readable context for the product and its navigation path; rich-result display is never guaranteed.
- **Impact on assistive technologies:** none directly; JSON-LD must mirror, not replace, visible semantic content.
- **Impact on browsers/crawlers:** crawlers must infer product/breadcrumb facts from HTML and cannot validate a deliberate schema contract.
- **Recommended fix:** generate sanitized server-rendered JSON-LD from the same memoized product and breadcrumb data used for visible content/metadata. Include only present, validated facts: canonical URL, name, image(s), SKU/model, brand, description, KZT price, and availability mapped from the tested status/stock contract. Include `AggregateRating` only when count > 0 and average is valid; omit absent fields and never fabricate reviews, price-valid-until, identifiers, or seller/legal data. Generate `BreadcrumbList` from the exact visible logical trail and canonical URLs.
- **Implementation constraints:** escape `<` at minimum before embedding serialized untrusted/CMS/API strings; one data fetch/result must feed Page, SEO-002 metadata/social, and Product JSON-LD; do not add Organization/WebSite/SearchAction until authoritative business/logo/search-target facts and Google eligibility are confirmed; no dependency is necessary.
- **Regression risk:** stock/status mapping, zero ratings, malformed external images, localized descriptions, and transient/404 paths can publish false/stale schema; schema must be absent on error/not-found/private states.
- **Automated test:** unit-test schema builders for valid/zero-rating/out-of-stock/missing-optional/malicious-`<`/404/transient cases and RU/KZ/EN canonical paths; assert visible and JSON-LD values agree; validate fixtures against current Google required-property expectations.
- **Manual verification:** inspect initial HTML, parse JSON, compare every fact to visible content, and run Google Rich Results Test/Schema Markup Validator on representative final-domain RU/KZ/EN products and breadcrumbs after deployment.
- **Acceptance criteria:** valid product/breadcrumb pages emit parseable, safe, visible-content-backed JSON-LD; optional/unknown facts are omitted; error/private pages emit none; validation reports no critical errors. No ranking or rich-result appearance is promised.
- **External dependencies:** trustworthy product status/stock semantics and final-domain Rich Results Test access; business-level Organization/WebSite data remains a separate owner decision.

### SEO-010 - Public pages provide no Open Graph or Twitter Card metadata

- **Severity:** P2
- **Confidence:** Certain (source and rendered-head evidence)
- **Category:** Social sharing / metadata / human discoverability
- **Affected route or component:** every indexable public route, particularly Product, Home, Brand, Catalog/category, and information pages
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** Messaging/social/link-preview clients and users sharing links; all viewports
- **Exact files:** `src/lib/seo.ts`; localized route metadata; Product shared loader from SEO-002; new approved `opengraph-image`/metadata asset route if selected
- **Exact symbols:** `publicSeoMetadata`; route `generateMetadata`; Next `openGraph` and `twitter` metadata fields/file conventions
- **Current behavior:** initial HTML contains no `og:*` or `twitter:*` metadata. Shared links therefore depend on each platform's fallback scraping and currently inherit the same generic/wrong-language metadata defects as SEO-001/002.
- **Evidence:** complete source search and live RU/KZ/EN head inspection, including a representative Product.
- **Relevant guidance:** [Next.js metadata and OG images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images); [Next.js Open Graph/Twitter image conventions](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image).
- **Impact on users:** shared storefront links can have generic, wrong-language, missing, or inconsistent previews, reducing clarity and trust in messaging/social contexts.
- **Impact on assistive technologies:** image alternative text in preview metadata can improve context in supporting clients; no direct page WCAG effect.
- **Impact on browsers/crawlers:** preview crawlers receive no explicit title/description/image/URL/locale contract.
- **Recommended fix:** extend the SEO-001/002 metadata source to emit localized Open Graph and Twitter summary-large-image fields with canonical URL, site name, title, description, standards locale mapping, and safe absolute images. Use a reviewed static brand share image as fallback and the trustworthy primary product image when available; include dimensions/type/alt when known. Generate or add an asset only from approved brand imagery, not fabricated claims.
- **Implementation constraints:** Next metadata objects merge shallowly, so route-specific fields must spread/rebuild shared fields without dropping description/image/locale; do not make build/runtime depend on an unreliable remote image; respect platform file-size limits and final origin contract.
- **Regression risk:** relative/untrusted image URLs, CMS failures, stale product images, and nested-metadata overwrite can yield broken cards; preview caches require deliberate bust/retest procedures.
- **Automated test:** assert complete localized OG/Twitter output, canonical absolute URLs, safe fallback/product-image selection, locale tags, route-specific overrides, and no fields on private/error routes; verify referenced local files exist and meet size/dimension contracts.
- **Manual verification:** inspect initial HTML and use platform preview validators/debuggers for representative RU/KZ/EN routes on the approved final domain; confirm alt/title/description match visible content.
- **Acceptance criteria:** every indexable public page emits coherent localized OG/Twitter metadata and a reachable truthful image; product previews are product-specific; private/error pages do not expose misleading cards.
- **External dependencies:** approval of the fallback share artwork and platform validator access; preview rendering/refresh is controlled by external platforms.

### PERF-001 - Every Home hero slide is eager and high priority instead of prioritizing only the initial LCP candidate

- **Severity:** P2
- **Confidence:** Certain for priority behavior; field LCP/CLS impact needs production RUM
- **Category:** Performance / LCP resource prioritization / responsive media
- **Affected route or component:** localized Home hero carousel; shared `CmsResponsiveImage` priority contract
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** All, with greatest bandwidth/memory impact on mobile and constrained networks
- **Exact files:** `src/components/HomePage/bannerCarousel/index.tsx`; `src/components/HomePage/bannerCarousel/Item/index.tsx`; `src/components/ui/shared/CmsResponsiveImage/index.tsx`; `src/app/globals.css`
- **Exact symbols:** `BannerCarousel`; `BannerItem`; both `CmsResponsiveImage` calls with `priority`; `priority -> loading="eager"/fetchPriority="high"`
- **Current behavior:** all four fallback/CMS slides render two image elements (decorative mobile backdrop plus foreground), and every one receives `loading=eager` and `fetchpriority=high`, including off-screen slides. Live Home contained eight high-priority/eager hero image elements; the current fallback URL was 83,142 bytes and browser caching prevented eight network transfers, but distinct CMS slides can still compete for initial bandwidth. Elements omit intrinsic attributes, while current Home CSS does reserve the frame through desktop aspect ratio/mobile fixed height.
- **Evidence:** source trace; live rendered attribute inventory (8/8 eager+high, off-screen x positions); live image HEAD; established production-status transfer totals of 2,305,720 bytes for `/ru`. No Lighthouse or field Core Web Vitals were available, so no numeric LCP/CLS failure is claimed.
- **Relevant guidance:** [web.dev: optimize LCP resource priority](https://web.dev/articles/optimize-lcp) (high priority on more than one or two images becomes unhelpful and hidden carousel images can be lowered); [web.dev: reserve image space/CLS](https://web.dev/articles/optimize-cls).
- **Impact on users:** nonvisible carousel media can contend with the initial hero and other critical resources, increasing load time/data work on slower devices; duplicate DOM images add decode/paint work on mobile.
- **Impact on assistive technologies:** no direct AT impact; loading changes must retain the meaningful foreground alternative and decorative backdrop behavior.
- **Impact on browsers/crawlers:** browser priority signals no longer identify the likely LCP resource; raw picture sources lack responsive-width candidates unless CMS already provides device variants.
- **Recommended fix:** pass slide index/initial selection so only the initial visible foreground LCP candidate is eager/high. Make later slides lazy with auto/low priority; the decorative backdrop must never independently be high priority. Preserve early HTML discovery for the first image. Keep CSS aspect-ratio/fixed-height reservation and add accurate intrinsic/source dimensions when available without lying about CMS art direction. Use existing desktop/mobile CMS sources; add responsive-width `srcset/sizes` only when trustworthy derivatives exist. Measure before/after rather than rewriting the working media pipeline speculatively.
- **Implementation constraints:** preserve two-art-direction-source fallback/error behavior, alt/decorative semantics, carousel visuals, and CMS-first content; do not lazy-load the initial LCP image; do not add an image dependency or force remote optimization without testing allowed origins and failure fallback.
- **Regression risk:** selecting the wrong priority slide, hydration/order changes, CMS mobile/desktop aspect mismatch, or lazy loading too aggressively can blank the hero or worsen LCP.
- **Automated test:** component-render tests assert exactly one initial foreground `eager/high`, all later slides non-high/lazy, decorative copies non-high, sources/fallback/alt preserved, and frame size reservation remains; performance-budget and production build/status gates must stay green.
- **Manual verification:** record Chromium DevTools/Lighthouse mobile+desktop waterfalls and LCP/CLS before/after on representative CMS and fallback content; verify throttled loading, carousel transitions, disabled JS initial content, reduced motion, and Firefox/WebKit behavior when available.
- **Acceptance criteria:** exactly the probable initial LCP image is prioritized; hidden/decorative slides do not compete at high priority; no blank transition, layout shift regression, or asset/JS budget regression; measured LCP is no worse and preferably improves.
- **External dependencies:** production-like CMS content and field/RUM or approved Lighthouse access for impact quantification.

### A11Y-011 - Failed Home product rails render permanent loading skeletons with no recovery or status

- **Severity:** P2
- **Confidence:** Certain (deterministic awaited server-state flow and component rendering)
- **Category:** Async state / status semantics / human usability
- **Affected route or component:** Home New Arrivals and Accessories product rails
- **Affected locales:** RU, KZ/KK, EN
- **Affected viewport or input mode:** All; screen reader, keyboard, low-vision, cognitive, and sighted users
- **Exact files:** `src/components/HomePage/ProductCarouselSection/index.tsx`; `src/components/ui/shared/GoodsCarouselWithImage/index.tsx`; `src/components/HomePage/ProductCarouselSection/index.test.tsx`
- **Exact symbols:** `loadCategoryProducts`; `ProductCarouselSection`; `GoodsCarouselWithImage.renderProducts`
- **Current behavior:** the server awaits the product request. On rejection, `loadCategoryProducts` catches/logs and returns `undefined`; `ProductCarouselSection` still renders the section and passes `items={undefined}`; `GoodsCarouselWithImage` interprets that as loading and renders 15 skeleton cards. No client request or Suspense transition can ever replace them, and no busy/error/status semantics explain the state.
- **Evidence:** complete source control-flow inspection. The production build also exercised unavailable local API fallbacks without failing, confirming these branches are reachable; no runtime failure is needed to prove the terminal `undefined -> skeleton` mapping.
- **Relevant guidance:** [WCAG 2.2 SC 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html); [WCAG 2.2 SC 3.2.4 Consistent Identification](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html) as a usability consistency consideration for loading/error states.
- **Impact on users:** the page presents an indefinite loading promise after work has already ended, with no products, error, retry, or explanation; repeated skeleton cards add visual noise and uncertainty.
- **Impact on assistive technologies:** no loading/error status is announced, and skeleton-only content does not communicate whether useful products will ever appear.
- **Impact on browsers/crawlers:** initial server HTML can contain an empty titled section with placeholders instead of indexable product links; crawlers cannot infer that the upstream failed.
- **Recommended fix:** model server outcomes explicitly. Because these Home rails are optional, follow the established silent-optional-section pattern: log the server failure and return `null` for failure as well as genuine empty data, unless product design explicitly chooses a localized `ErrorState` with a real retry/navigation action. Reserve skeletons for a real Suspense/client pending state that can settle. Change `GoodsCarouselWithImage` to accept an explicit loading state rather than treating `items === undefined` as loading.
- **Implementation constraints:** preserve successful server-rendered product links, backend ordering, CMS banner behavior, and genuine-empty omission; do not hide failures from server logs or add a client refetch/dependency solely to animate skeletons.
- **Regression risk:** conflating empty/failure again can hide a real data outage or show error chrome for intentionally optional content; test the three outcomes separately.
- **Automated test:** add rejected-request coverage asserting no section/permanent skeleton, keep successful mapped product and genuine-empty omission tests, and test `GoodsCarouselWithImage` skeletons only under an explicit settle-capable loading prop.
- **Manual verification:** force each rail's API failure and slow response in RU/KZ/EN; verify pending content, if used, resolves; final failure has the chosen honest/omitted state and no orphan title/spacing; successful links remain keyboard/crawlable.
- **Acceptance criteria:** an awaited failure never renders a permanent loading UI; loading is programmatically meaningful and always settles; success remains SSR/crawlable and genuine empty remains intentionally omitted.
- **External dependencies:** none unless product chooses a visible localized error treatment instead of the existing optional-section convention.

## Checkpoint 1 - Repository, Configuration, and Localization Evidence

### Repository and instructions

- Read completely: root `AGENTS.md`, `docs/PROJECT_MAP.md`, `docs/PROJECT_SKILLS.md`, root/frontend README files, release/checklist material, prior full-system/UI/accessibility verification, and the prior issue register.
- Prior July evidence is treated as historical, not proof of the current commit. Notably, the old `FINAL-SEO-001` statement that SEO files were absent is superseded by the current `src/lib/seo.ts`, `src/lib/sitemapCatalog.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`, and their tests.
- The audited source was clean at task start. Only `docs/audits/` became untracked when the two required deliverables were created.

### Git and runtime

- Branch: `main`.
- Exact commit and live remote `main`: `1786e855e7a0b6a4797cdfae651e0dfe206709a2`.
- Last five commits at start: `1786e85`, `d6cc31e`, `d9b85d5`, `9a012b4`, `73fe9df`.
- Node: `v24.13.0`; npm: `11.6.2`; npm lockfile version: `3`.

### Scripts and dependency baseline

`vympel_front/package.json` defines finite `lint`, `typecheck`, `test`, `test:security`, `build`, `test:production-status`, `test:budgets:ci`, and `test:sharp-security` gates. The current direct runtime versions are Next.js `16.2.12`, React/React DOM `19.2.4`, and next-intl `4.13.2`. Nineteen current storefront test files were inventoried; the project-memory file's older dependency/test counts will be corrected during final documentation reconciliation.

### Next.js and locale architecture

- `next.config.mjs` uses standalone output, global security headers, configured image origins, and the next-intl plugin.
- `src/i18n/routing.ts` requires locale prefixes and supports exactly `ru`, `kz`, and `en`, with RU as default.
- `src/proxy.ts` disables locale detection, removes unsupported two-letter locale-like prefixes through a redirect, and excludes API/static/file paths from locale middleware.
- `src/i18n/request.ts` loads the locale's message JSON and falls back to RU only when a request locale is outside the supported set.
- `src/i18n/htmlLanguage.ts` correctly maps route prefix `kz` to standards language tag `kk`; its Vitest covers all three values and `src/app/[locale]/layout.tsx` uses the mapper on `<html lang>`.
- RU/KZ/EN JSON each contain exactly 502 leaf keys with zero structural key differences. This proves key parity only; translation accuracy and cross-locale leakage remain subject to route/content inspection.
- `src/i18n/navigation.ts` preserves real localized anchors through next-intl and starts navigation progress only after cancellable click handling.

### Checkpoint conclusion

No accessibility/SEO defect is confirmed solely by Checkpoint 1. The generic root-layout title/description, unsupported-locale redirects, locale parity, and environment-driven origin behavior require route/rendered evidence in later checkpoints before disposition.

## Checkpoint 2 - Routes, Metadata, Robots, Sitemap, and Canonical Evidence

- Inspected all 17 route/endpoint patterns in the source-derived route matrix, plus the localized/root error and not-found boundaries.
- `publicSeoMetadata` correctly creates an absolute self-canonical, reciprocal RU/KK/EN alternates, and RU `x-default` from `NEXT_PUBLIC_SITE_URL`. `kz` paths correctly use `hreflang="kk"`.
- `requireCanonicalSiteUrl` rejects missing, non-HTTP(S), credential-bearing, path-bearing, query-bearing, and fragment-bearing values; existing tests cover the main origin contract and hreflang mapping.
- `privatePageMetadata` applies `noindex,nofollow` to Cart and Favorites; these routes are excluded from the sitemap and disallowed in robots.
- `robots.ts` allows public crawling, disallows API/internal/admin/cart/favorites, advertises the configured host and `/sitemap.xml`. Checkpoint 10 records the missing environment-aware staging policy as SEO-007 and the Cart/Favorites crawl conflict as SEO-008.
- `sitemap.ts` is dynamic and deliberately fails rather than publishing partial data. It includes localized Home/About/Brands/Catalog/Delivery/Guarantee/Payment, every configured public brand, API categories, and active API products; Cart, Favorites, CRM, error, and internal routes are excluded.
- The sitemap emits URL-only records. Alternate-language sitemap entries and modification dates are optional and are not recorded as defects without a concrete operational need.
- No `openGraph`, `twitter`, or JSON-LD output exists in `src`; the final evidence and scoped enhancements are SEO-009/010.
- Catalog metadata ignores query parameters and category data. Faceted URL/indexability analysis is deferred to Checkpoint 5, where URL generation and rendered controls can be assessed together.

### Checkpoint conclusion

Confirmed SEO-001 and SEO-002. Canonical/hreflang construction and the clean/private sitemap split are sound at source level. Rendered head/status verification remains mandatory before final reconciliation.

## Checkpoint 3 - Shared Navigation and Breadcrumb Evidence

- `Header` is a semantic `<header>` with a labelled navigation landmark. Phone, WhatsApp, Home, Favorites, and Cart are real links with localized names. Localized navigation uses next-intl anchors/router and keeps the same path when switching language.
- Header and navigation icon-only buttons/links generally have accessible names; decorative Lucide icons are commonly hidden. Badge announcement quality is deferred until rendered accessibility-tree inspection.
- The language and desktop-brand popups are visually hidden rather than removed from focus/AT and claim an unimplemented menu interaction model: A11Y-001.
- The custom mobile primary menu supplies localized visible sections, real links, an explicit close control, Escape state handling, reduced-motion CSS, and scroll lock, but lacks the modal focus lifecycle: A11Y-002.
- `MobileBottomNavigation` uses a labelled nav, real links, `aria-current`, localized text labels, and at least 44px-high navigation cells. Its full-screen category picker uses Radix Dialog via `CatalogMobileSheet`, which owns modal focus behavior; cross-overlay `aria-hidden` behavior will be verified in Checkpoints 5/8/9.
- Catalog breadcrumbs use a labelled `<nav>` containing an ordered list with presentational hidden separators and crawlable localized ancestors. The final `All goods` crumb is non-interactive; APG makes `aria-current` optional for a non-link current item, so its absence is not recorded as a defect.
- Footer links are genuine localized anchors with focus-visible styling and labelled social icons. No source-confirmed footer defect is recorded at this checkpoint.
- Every normal route screen owns a `<main>` landmark. No skip link exists, but landmarks are a WCAG 2.4.1 sufficient technique; usability at the start of each routed document remains a manual verification item, not a confirmed failure.

### Checkpoint conclusion

Confirmed A11Y-001 and A11Y-002. Shared link/landmark foundations are otherwise materially sound in source; exact focus order, accessible badge names, and cross-overlay inertness remain for runtime verification.

## Checkpoint 4 - Home, CMS, Promotional Content, and Carousel Evidence

- Home has one screen-reader H1 (`Vympel`), a `<main>`, localized section H2s, real category/brand/product/marketplace links, server-fetched CMS and catalog data, and static fallbacks. Key indexable destinations are anchors in rendered React markup rather than click-only cards.
- CMS hero content is localized by the existing `getCmsPage("home", locale)` and `cmsImageSources` helpers. Foreground images receive CMS/localized alt text; duplicated backdrop images are correctly decorative. CMS link target/rel behavior is explicit.
- Home product sections are server components. Empty successful product pages remove the section; API failure produces 15 terminal skeletons in the server/client tree. This is recorded as A11Y-011.
- Categories use empty alt text because the adjacent heading inside the same link supplies the destination; marketplace logos use their names and links add localized purpose. Philosophy images have localized alternatives.
- `Benefits` uses an English-only visually hidden section heading (`Benefits`) on RU/KZ pages. Default shared carousel labels are also English. These are recorded as I18N-003 and A11Y-004 respectively.
- Both Home auto-rotators fail persistent user control/focus/reduced-motion requirements: A11Y-003.
- Shared carousel visibility, hidden arrow focus, dot roles, and region/slide naming fail as A11Y-004.
- Hero `CmsResponsiveImage` duplicates each source as decorative backdrop plus foreground and marks every slide eager/high priority. Checkpoint 10 confirmed the priority defect as PERF-001 while correctly withholding any unmeasured field LCP/CLS claim.

### Checkpoint conclusion

Confirmed A11Y-003, A11Y-004, and A11Y-011. Server-rendered successful content/link and meaningful/decorative-image foundations are mostly sound; localized hidden copy and hero performance risks are resolved into I18N-003/PERF-001 by later checkpoints.

## Checkpoint 5 - Catalog, Search, Filters, Sorting, Pagination, and Faceted URL Evidence

- Catalog has a localized H1 sourced from the initial category, a real breadcrumb, responsive controls, localized empty/error recovery, and API-backed filter metadata. Mobile Category/Filter/Sort surfaces use the proven Radix `CatalogMobileSheet` and the overlay provider restores trigger focus after exit.
- Category links use a query URL that conflicts with path-based sitemap/canonical category URLs: SEO-003.
- The indexable catalog grid begins as client-only skeletons, and pagination is buttons rather than anchors: SEO-004.
- Clean pagination, search, sort, filters, price, and arbitrary facet combinations all receive the same `index,follow`/base-canonical treatment; no explicit route-class policy exists: SEO-005.
- Filter values are normalized, deprecated country parameters are removed, category changes deliberately preserve only search/sort, page resets to 1 after control changes, and reduced motion is honored for pagination scrolling. These are sound foundations to preserve.
- Catalog/SmartSearch async resolved states and desktop popup semantics are incomplete for AT: A11Y-005.
- Pagination uses 44px controls, localized accessible names, and visible current state. Replacing buttons with anchors for SEO-004 must preserve `aria-current`, focus styling, client-enhanced scroll, and new-tab/copy-link behavior.

### Checkpoint conclusion

Confirmed SEO-003 through SEO-005 and A11Y-005. The implementation must establish the canonical category route first, then server/crawlable pagination, then the parameter policy; doing these out of order would bake contradictory URL behavior into tests.

## Checkpoint 6 - Product, Media, Offers, Reviews, and Recommendations Evidence

- Valid product data is server-rendered with a localized H1, price, availability, ratings, marketplace anchors, cart/favorite pressed state, description/specs, initial reviews, recommendations, and real status distinction: confirmed API 404 calls `notFound`, while transient failure keeps a recoverable 200 error state.
- Product metadata does not use this server data (SEO-002); Product structured data/social metadata is resolved into SEO-009/010.
- Main images and thumbnails have localized/product-derived names, explicit dimensions, fallbacks, pressed selection, keyboard buttons, and visible arrows on focus-within. Shared off-screen carousel defects remain governed by A11Y-004.
- The custom zoom lightbox lacks a modal focus lifecycle: A11Y-006.
- Product information tabs expose correct roles/selection/panel labels but lack APG keyboard behavior: A11Y-007.
- Cart/favorite actions expose `aria-pressed` and use localized Sonner feedback. Marketplace actions are real external anchors. Source/runtime inspection did not justify a separate toast defect.
- The out-of-stock notify form is a nonfunctional false affordance: HTML-001.
- Reviews are server-seeded, localized, filter/sort/pagination state is URL-backed and normalized, submission validates rating/text and handles rate limits/errors/toasts. KZ date formatting passes the wrong locale token: I18N-001.
- Review updating has a polite status and respects reduced motion for scroll. Resolved result-count/error announcement quality will be checked with A11Y-005 principles at runtime.
- Related products reuse the shared product carousel and therefore A11Y-004; their server fetch returns no section on unavailable/empty data, avoiding permanent skeletons.

### Checkpoint conclusion

Confirmed A11Y-006, A11Y-007, HTML-001, and I18N-001. Core product status/data/action foundations are otherwise strong and must not be destabilized by metadata, structured-data, or accessibility work.

## Checkpoint 7 - Brand, Category, About, and Information-Page Evidence

- All six approved brands (`romanson`, `adriatica`, `appella`, `pierre-ricaud`, `rhythm`, `royal-london`) have explicit static localized description/history data, canonical route config, localized H1/history/product sections, CMS-first responsive banners, real product/category anchors, and true 404 handling for an invalid slug.
- Brands index remains useful if the filter API fails by falling back to the six configured brands; brand pages surface a localized products error rather than misrepresenting an empty catalog. Product grids are server-rendered.
- Brand catalog CTAs intentionally lead to filtered catalog states; their future noindex/canonical handling is owned by SEO-003/005, not duplicated here.
- About has a localized H1, section heading associations, CMS-first hero/intro/cooperation content, meaningful image alternatives, and real marketplace/contact behavior. Its Instagram auto-rotator expands A11Y-003/004 scope.
- All Instagram destinations are a documented generic placeholder: HTML-002.
- Guarantee, Delivery, and Payment are fully server-rendered from `infoPages` locale messages with one H1, semantic paragraphs/lists, decorative hidden icons, visible store information, and a meaningful store image. No source-confirmed accessibility defect is recorded. Making the displayed phone an optional `tel:` enhancement is a P3 product choice, not a confirmed compliance failure.
- Category page structure/status/links remain governed by SEO-003 through SEO-005 and A11Y-005; no duplicate issue is added here.

### Checkpoint conclusion

Confirmed HTML-002 and expanded A11Y-003/004 to About. Brand/About/info content and fallback structure are otherwise sound; localized metadata remains SEO-001 and schema/social decisions are SEO-009/010.

## Checkpoint 8 - Cart, Favorites, Dialog, Form, Notification, and Error-State Evidence

- Cart and Favorites are correctly private `noindex,nofollow` routes and use localized H1s, real product anchors, explicit 44px quantity/removal controls, pressed favorite/cart state, honest unavailable/stock-limit handling, recoverable fetch errors, and useful localized empty states.
- Cart destructive actions use the shared Radix AlertDialog with labelled title/description, focus containment, Escape/cancel behavior, and visible cancel/confirm controls. The customer-request dialog also uses the shared Radix Dialog and adds an explicit opener reference for focus restoration. Those primitive foundations are sound.
- After a confirmed removal, however, the invoker itself is deleted; favorite removal immediately unmounts its focused card. No surviving focus target is chosen: A11Y-009.
- Catalog, SmartSearch, Cart, and Favorites async branches use visual loading/error/result changes inconsistently. Cart/Favorites have no result-owner `aria-busy` or settled status and shared `ErrorState` is not live by default. A11Y-005 now owns the cross-route announcement foundation.
- Sonner is installed once at the locale layout and product/cart/request/review actions use localized success/error/warning text. Runtime/source checks did not justify a separate toast defect; implementation must still retain action focusability and avoid mobile obstruction.
- Customer-request contact logic, phone normalization, rate-limit preservation/countdown, honeypot, API error handling, submitting state, and close/focus-return behavior are substantive and localized. Product review validation also supplies visible/alert error text. Both forms omit stable invalid/error associations: A11Y-008.
- Localized route error, 404, shared EmptyState, and shared ErrorState have semantic headings and real retry/navigation controls. `global-error` cannot reliably preserve EN/KZ and fails the established `kz -> kk` HTML-language contract: I18N-002.
- Locale key parity does not prove translation correctness. The RU/KZ customer name placeholder is `Dear User`, while Benefits exposes a hard-coded English H2 to the accessibility tree: I18N-003. Shared carousel English defaults remain A11Y-004.
- Button loading keeps its changing text in the accessibility tree while visually overlaying a decorative spinner; no separate Loader issue is warranted. The modal body is viewport-bounded and scrollable.

### Checkpoint conclusion

Confirmed A11Y-008, A11Y-009, I18N-002, and I18N-003; expanded A11Y-005 to Cart/Favorites. The existing Radix dialog primitives, state components, localized toasts, product snapshots, and honest WhatsApp checkout behavior are foundations to preserve.

## Checkpoint 9 - Rendered Browser, Responsive, Keyboard, Contrast, and Live-HTTP Evidence

- Chromium on the reachable staging deployment was exercised at desktop and 320 CSS px. RU Home and KZ Home rendered nonblank with no console errors or Next.js error overlay; KZ emitted `html lang="kk"` and showed no body-level horizontal overflow (`scrollWidth 305` within a `320` viewport). The responsive bottom navigation and mobile content were present.
- The rendered head confirmed SEO-001/002: KZ/EN retain the Russian description, static titles are generic, and a KZ product is `Vympel — Product` with no product name. The product exposed no Open Graph, Twitter Card, or JSON-LD output, recorded as SEO-009/010.
- Rendered Header keyboard tracing confirmed A11Y-001: with `aria-expanded=false`, Tab entered opacity-zero/pointer-disabled language items. A DOM inventory found 97 focusable elements on Home, including hidden language/brand controls, opacity-hidden carousel arrows, and links in off-screen slides; shared slides had no `aria-hidden` state.
- At 320 CSS px, opening the navigation left focus on the opener; successive Tabs reached Search and hero links behind the visual modal. Background scrolling was locked, but focus was neither moved nor contained, confirming A11Y-002.
- Home hero and Brands selections changed after 5.5 seconds (hero `3 -> 0`, brands `1 -> 2`) without a persistent pause control, and all slide content remained exposed in the accessibility tree, confirming A11Y-003/004. The accessibility tree also exposed the English `Benefits` heading and English default carousel names on KZ.
- A KZ product exposed five selected/unselected `tab` elements, all with no managed `tabindex`; the custom interaction therefore adds every tab to sequential order without APG arrow-key behavior, confirming A11Y-007. Product metadata remained generic and JSON-LD/social metadata absent.
- The RU customer-request Radix dialog correctly moved focus inside. Empty submission moved focus to Email, but neither invalid field exposed `aria-invalid`, `aria-describedby`, or `aria-errormessage`; visible errors had no stable ID/alert/live relationship, confirming A11Y-008. The RU/KZ name placeholder visibly contained `Dear User`.
- Computed solid colors measured `#aaa` on white for the 15px request placeholder and SmartSearch close icon (2.32:1), and Brands dots `#d2d2d2`/`#a1a1a1` on white (1.51:1/2.58:1), confirming A11Y-010. These calculations use the WCAG relative-luminance formula and intentionally exclude disabled controls.
- The rendered heading list began with linked `H3 VYMPEL` before the route H1; Home product cards appeared as H2 peers of their H2 rail heading, confirming HTML-003.
- EN Catalog with `?search=test&page=2&sort=PRICE_ASC` returned `index,follow`, canonicalized to clean `/en/catalog`, retained the Russian description, and initially exposed no products because the grid is client-rendered. Internal category links were query-form URLs. These observations confirm SEO-001 and SEO-003 through SEO-005.
- EN Cart and KZ Favorites correctly rendered localized H1s and `noindex,nofollow` with no canonical. The live robots conflict with those directives is SEO-008.
- Live staging status checks returned 200 for representative RU/KZ/EN Home/Catalog/category/query/Product/Cart/Favorites routes and real 404 for an unknown localized route and product `999`. The sitemap contained 75 URL records, the representative category/product paths, no query URLs, and no Cart/Favorites. The response header/HTML comparison confirmed SEO-006: next-intl's HTTP alternates use `kz` and root x-default while HTML uses `kk` and `/ru`.
- Actual screen-reader software, Firefox, and WebKit/Safari-compatible engines were not available in the isolated environment. Chromium accessibility-tree, keyboard, responsive, computed-style, status, header, and source evidence was used without claiming cross-engine or screen-reader conformance. Automated axe and Lighthouse tools were not installed and were not added to the repository for this read-only audit.

### Checkpoint conclusion

Confirmed SEO-006, A11Y-010, and HTML-003, and strengthened the runtime evidence for the existing findings. Responsive layout at 320 CSS px and several Radix foundations are sound; no additional browser-only defect is claimed without reproducible evidence. Unsupported engine/AT coverage remains an explicit implementation verification requirement.

## Checkpoint 10 - Crawl Control, Structured Data, Social Metadata, Performance, and Domain Readiness

- The reachable sslip.io deployment is a public, self-canonical, indexable staging host with an allowing robots file and 75-URL sitemap. Source uses no explicit release/indexability authorization beyond a valid canonical origin: SEO-007 (P0).
- Cart/Favorites correctly emit noindex and remain outside the sitemap, but robots blocks the same paths. Google cannot process a noindex on a blocked URL: SEO-008.
- Product and visible breadcrumb data are sufficiently substantive for safe Product/BreadcrumbList JSON-LD when generated from the exact visible server result. No JSON-LD exists now: SEO-009 is recorded as a P2 opportunity, with strict omission/sanitization rules and no rich-result promise. Organization/WebSite/SearchAction are not mandated without authoritative business/search-action facts.
- No Open Graph or Twitter Card fields exist on any tested public route. SEO-010 treats this as a localized human link-preview/discoverability enhancement coordinated with SEO-001/002, not a WCAG defect or ranking guarantee.
- Live Home rendered eight hero image elements with eager/high priority (foreground/backdrop for four slides), including off-screen slides; only the initial LCP candidate should be prioritized. Current CSS already reserves the Home frame, and no field/lab CLS failure was measured: PERF-001 is scoped to the proven priority defect and measured follow-up.
- The clean production build succeeded with a synthetic canonical origin after external Google font access was allowed. It produced 33 Next build output entries (pages/endpoints/framework entries), while the source audit matrix intentionally counts 17 public route/endpoint patterns. Missing `NEXT_PUBLIC_SITE_URL` correctly fails the build; sandbox-only font/API network failures were not misclassified as application defects.
- Existing static asset and storefront JavaScript budgets passed. Production route-status checks passed for representative valid/missing/transient RU/KZ/EN routes. Representative transfer totals were 2,305,720 bytes (RU Home), 1,865,446 bytes (Catalog), and 1,576,155 bytes (Product); these are comparison baselines, not Core Web Vitals.
- No axe/Lighthouse package or executable was present, and the audit did not permanently install one. Browser source/DOM/HTTP evidence plus repository checks was used; an approved Lighthouse and RUM/CrUX pass remains required for PERF-001 impact and final-domain launch.

### Checkpoint conclusion

Confirmed SEO-007, SEO-008, SEO-009, SEO-010, PERF-001, and reconciled A11Y-011. Checkpoints 1-10 are complete. The implementation order must begin with the P0 staging guard and coherent indexability/canonical ownership, then URL/SSR metadata foundations, accessibility primitives, route-state fixes, truthful schema/social metadata, and measured performance verification.

## Needs Verification

- Final production domain, canonical host variant, launch timing, DNS/TLS/redirect ownership, and Search Console property access.
- Exact deployment mechanism for server-only indexability/header configuration and whether preview/staging can be protected at ingress.
- Representative distinct CMS hero images and product records across all locales/status/stock/rating combinations for schema/performance verification.
- Actual screen-reader results (NVDA/JAWS/VoiceOver as applicable), Firefox, and WebKit/Safari-compatible rendering; only Chromium accessibility-tree/keyboard/runtime coverage was available.
- Lighthouse lab results and production RUM/CrUX Core Web Vitals; transfer totals and static budgets do not prove LCP/CLS/INP.
- Content-owner approval for new localized metadata, request placeholder wording, share artwork, and final official Instagram destination(s).
- Rich Results Test and platform link-preview debugger results on an approved crawlable final-domain deployment.

## Production-Domain Launch Checklist

No DNS, deployment, Search Console, or production mutation was authorized or performed by this audit.

### Immediate staging containment

- [ ] Protect preview/staging at ingress when feasible; otherwise expose a readable global noindex header/metadata and disable its sitemap inventory.
- [ ] Add the fail-closed server-only indexability flag from SEO-007; verify omitted/false values cannot publish indexable output.
- [ ] Remove temporary-host URLs from shared release documentation/content where operationally appropriate; do not hardcode the unknown final host in source.
- [ ] If the current temporary host may already be indexed, check Search Console/search visibility with the owner and use the appropriate removal/recrawl process only after correct controls are live.

### Final origin and routing

- [ ] Owner approves the permanent scheme+host and www/non-www choice; set `NEXT_PUBLIC_SITE_URL` to that origin only.
- [ ] Configure DNS/TLS and permanent redirects from every alternate host/scheme to one canonical host while preserving localized path/query semantics.
- [ ] Verify root locale redirect, unsupported-prefix behavior, 404s, and RU/KZ/EN route parity on the final origin.
- [ ] Verify canonical, HTML hreflang, x-default, sitemap, and robots all use the same final origin; confirm the conflicting middleware HTTP alternate header is gone.
- [ ] Enable `SITE_INDEXING_ENABLED=true` only after the preceding final-host checks pass; verify no preview inherits the value.

### Crawl and content release

- [ ] Remove Cart/Favorites robots blocks while keeping their noindex/nofollow and sitemap exclusion.
- [ ] Verify canonical category paths, SSR catalog pages, crawlable pagination, and the query/facet noindex policy from SEO-003/004/005.
- [ ] Crawl the final site for 2xx/3xx/4xx correctness, redirect chains, orphaned canonical URLs, internal query-category links, duplicate canonicals, and sitemap-only canonical indexable URLs.
- [ ] Inspect representative RU/KZ/EN initial HTML for localized title/description, one H1, visible indexable content, canonical, reciprocal `ru`/`kk`/`en`/x-default, robots, OG/Twitter, and valid JSON-LD.
- [ ] Validate Product/Breadcrumb JSON-LD with Rich Results Test and compare all fields with visible content; omit unsupported facts.

### Performance, accessibility, and compatibility release

- [ ] Run Lighthouse mobile/desktop on representative Home/Catalog/Product routes with production-like CMS/API data and record LCP/CLS/INP diagnostic evidence.
- [ ] Confirm only the initial Home hero is high priority, asset/JS budgets still pass, and no image/route waterfall regression was introduced.
- [ ] Complete keyboard, reduced-motion, 320 CSS px/400% zoom, contrast, modal focus, carousel, error association, async announcement, and removal-focus checks in RU/KZ/EN.
- [ ] Complete NVDA plus Firefox coverage on Windows and VoiceOver/Safari or an approved WebKit-equivalent matrix; record unsupported combinations honestly.

### Search and monitoring

- [ ] Verify the final domain property in Search Console; submit the final sitemap and inspect representative Home/category/product plus private/404 URLs.
- [ ] Use platform preview validators for localized public links and confirm share-image reachability/caching.
- [ ] Monitor Page Indexing, sitemap, structured-data enhancement, Core Web Vitals, crawl errors, and canonical/hreflang reports after launch.
- [ ] Keep old/temporary-origin redirect or removal decisions documented; do not remove controls until search migration evidence is stable.

## Checks Executed

| Check | Environment | Result | Evidence/notes |
| --- | --- | --- | --- |
| Git baseline and checkpoint evidence | Windows / PowerShell | Pass | Clean task start; branch `main`; SHA `1786e855e7a0b6a4797cdfae651e0dfe206709a2`; repeated status/SHA/branch/five-log evidence after every checkpoint |
| Live remote branch | Read-only Git network check | Pass | `origin/main` live SHA equals audited local SHA; ahead/behind `0/0` |
| Runtime/lock inventory | Windows | Pass | Node `v24.13.0`; npm `11.6.2`; lockfile version `3` |
| Clean dependency install | `npm ci` | Pass | 660 packages; postinstall verified the repository minimatch patch. Initial sandbox EPERM required the same clean install with approved external execution |
| Lint | `npm run lint` | Pass | No reported errors |
| Type check | `npm run typecheck` | Pass | No reported errors |
| Unit/component tests | `npm run test` | Pass | 19 files, 62 tests |
| Security headers | `npm run test:security` | Pass | 3 tests |
| Dependency audit | `npm audit --omit=dev --audit-level=moderate`; full `npm audit --audit-level=moderate` | Pass | Both reported 0 vulnerabilities; the install summary's advisory count was not treated as a confirmed unresolved vulnerability |
| Sharp/Next security compatibility | `npm run test:sharp-security` | Pass | Next `16.2.12` resolved to sharp `0.35.3`, satisfying repository minimum `>=0.35` |
| Production build | `NEXT_PUBLIC_SITE_URL=https://shop.example.test npm run build` | Pass | 33 build output entries. Missing origin correctly failed; sandbox Google-font network failed, then approved external execution succeeded; unavailable local API logged fallback errors without failing build |
| Production status matrix | `npm run test:production-status` with task-owned mock API/server | Pass | Valid 200, missing 404, RU/KZ/EN, and transient-not-404 contracts passed; representative transfer totals recorded above |
| Asset/JS budgets | `npm run test:budgets:ci` | Pass | Public static assets 8.90 MiB / 24 MiB; storefront JS 1.34 MiB / 1.65 MiB |
| Locale structural parity | Deterministic JSON inspection | Pass | RU/KZ/EN each have 502 leaf keys and zero key differences; copy-quality defects are separately reported |
| Live HTTP/status/discovery | Public staging, read-only | Mixed / findings recorded | Representative public/private routes 200; unknown route and product `999` 404; sitemap 75 URL records with no query/private URLs; robots/header/canonical conflicts recorded as SEO-006/007/008 |
| Chromium rendered/manual matrix | In-app Chromium | Mixed / findings recorded | Desktop and 320 CSS px, RU/KZ/EN representative Home/Catalog/Product/Cart/Favorites/About/dialog states; accessibility tree, keyboard focus, motion, contrast, headings, head, and overflow evidence |
| axe/Lighthouse, actual AT, Firefox, WebKit | Audit environment | Not available | No permanent tool install; limitations and implementation manual matrix recorded explicitly |

## Audit Limitations

- This is an implementation-planning audit, not a WCAG conformance certification, penetration test, legal opinion, or ranking forecast.
- Chromium was the only available browser engine. Accessibility-tree/keyboard inspection is not a substitute for NVDA/JAWS/VoiceOver testing.
- No approved axe or Lighthouse executable was available; automated repository gates, manual DOM/keyboard/contrast evidence, transfer totals, and source analysis do not replace a lab/field Core Web Vitals study.
- The temporary deployment and public API/CMS provided only current observable data. Not every CMS/media/error/product/stock/rating combination could be forced, and no production data was mutated.
- The final domain, DNS, ingress, Search Console, platform preview caches, and deployment environment were not accessible/authorized; the launch checklist separates these owner actions.
- Locale JSON key parity was verified, but fluent linguistic quality requires qualified RU/KZ/EN content review.
- Findings describe reproducible current behavior on the exact audited commit. Implementation must re-check drift before applying the handoff prompt.

## References

- Accessibility: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/), and the success-criterion/pattern pages linked beside each finding.
- HTML semantics: [HTML Living Standard](https://html.spec.whatwg.org/) and WAI page-structure guidance linked beside relevant findings.
- Next.js: [`generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata), [metadata and OG images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images), and [JSON-LD](https://nextjs.org/docs/app/guides/json-ld).
- Localization: [next-intl alternate links](https://next-intl.dev/docs/routing/configuration#alternate-links).
- Search: [Google Search Central localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [Product](https://developers.google.com/search/docs/appearance/structured-data/product-snippet), and [Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).
- Performance: [web.dev LCP optimization](https://web.dev/articles/optimize-lcp) and [web.dev CLS optimization](https://web.dev/articles/optimize-cls).

## Last Updated

2026-08-07 - Completed and reconciled Checkpoints 1-10 into 28 findings (1 P0, 14 P1, 13 P2); added staging/indexability, robots/noindex, terminal Home loading, truthful schema/social metadata, hero-priority, full verification, limitations, and final-domain launch evidence.
