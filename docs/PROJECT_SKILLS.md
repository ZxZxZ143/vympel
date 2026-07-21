# Project Skills & Lessons Learned

## Frontend Patterns That Work

### Localized App Router screens

* **When to use:** When adding or changing user-facing pages in the frontend.
* **How:** Put route entry points under `src/app/[locale]`, keep page-level composition in `src/screens`, and pass `LocaleEnum` into API calls and localized UI.
* **Why:** The app uses `next-intl` with mandatory locale prefixes, so keeping routes thin and screens explicit avoids duplicating layout and localization logic.

### Public informational pages

* **When to use:** When adding static public pages such as warranty, delivery, payment, help, or policy content.
* **How:** Keep thin localized routes under `src/app/[locale]`, compose the page in `src/screens/InfoPages`, render the standard `Navigation` search strip inside the page, use `Text`/`Heading` plus `next-intl` rich text for highlights, and keep all long copy in `src/messages/*.json`.
* **Why:** Static public content still needs the standard storefront layout, locale prefixes, searchable navigation, and typography/token consistency.

### Localized About page composition

* **When to use:** When implementing About-style public pages from provided static assets and a Figma/static-page design.
* **How:** Keep the route thin under `src/app/[locale]/about`, compose sections in `src/screens/AboutPage`, localize every heading/body/aria string under `aboutPage`, use `/about-us-banner.png` as a full-width responsive image, render company cards with project `Heading`/`Text`, use the existing Embla `Carousel` plus `CarouselDots` for `/insta-*.png`, and reuse `ContactBanner`, `MarketPlaces`, `Navigation`, and the layout footer.
* **Why:** The About page shares the storefront shell and design system, but its Figma-specific spacing and asset sizing belong in global `.about-*` tokens/classes rather than one-off TSX values.

### Shared store location block

* **When to use:** When Delivery, Payment, or future info pages need the physical store image/address/hours/phone block.
* **How:** Reuse `StoreLocationBlock` from `src/components/InfoPages`; it owns `/shop.png`, the existing map/clock/phone icons, 659/470 image ratio, 50px desktop image/contact gap, and mobile stacked behavior.
* **Why:** The Delivery and Payment designs intentionally share the same store block, so duplicating markup risks drift in spacing, responsive behavior, and contact copy.

### Public API controller pattern

* **When to use:** When the frontend needs backend public data.
* **How:** Add endpoint path builders in `src/api/endpoints/PublicEndpoint.ts`, add typed methods in `src/api/controllers/PublicController.ts`, and mirror backend DTOs in `src/api/types`.
* **Why:** This keeps fetch behavior, base URL resolution, error parsing, and response types in one place.

### Public API response normalization

* **When to use:** When rendering public product/review lists, quick search results, categories, or any endpoint whose backend response shape may differ between Spring pages and legacy arrays.
* **How:** Use `normalizePageResponse` for paginated product/review responses, return `createEmptyPage` when the public API base URL is unavailable, and guard array endpoints with `Array.isArray` before rendering. Do not run paginated normalizers on product detail or mutation DTOs.
* **Why:** Public pages should not crash or freeze because an API returns an unexpected shape, but detail/mutation contracts still need their exact DTOs.

### Silent optional server-rendered sections

* **When to use:** When a customer-facing page section is explicitly optional and failures must not become UI, especially product recommendations.
* **How:** Start the typed request in the page's existing server-side `Promise.all`, use a finite fetch timeout, catch and log at the server boundary, and pass `[]` into a component that returns `null` before rendering any wrapper/title/spacing. Keep error/empty/retry components out of that surface entirely.
* **Why:** Returning `null` at the section boundary guarantees there is no forbidden copy or blank layout shell while preserving observability in server logs.

### Public CMS content with static fallbacks

* **When to use:** When public home/about/catalog/product/brand/banner/CTA text or imagery needs to be editable from CRM.
* **How:** Fetch `PublicApiController.getCmsPage(pageKey, locale)` with Next tagged caching (`revalidate: 30`, tags `cms` and `cms:{pageKey}`), and use `cmsContent.ts` helpers plus `CmsResponsiveImage`. Image blocks should support default/RU desktop, desktop KZ/EN, default/RU mobile, and mobile KZ/EN media fields on every CMS-managed page, not only home. The backend should call the protected public `/api/revalidate` route after committed CRM CMS mutations when `VYMPEL_CMS_PUBLIC_REVALIDATE_URL` and the shared revalidation secret are configured. Valid CMS values always win; existing localized messages/static assets are fallbacks only for missing/failed/incomplete CMS data or failed image URLs. The public image fallback order is current-locale mobile, current-locale desktop, default/RU mobile, default/RU desktop, then local fallback. Catalog category banners should resolve category-specific CMS keys before static assets; accessories fall back to `/accessories_hero_banner.png`, and interior clocks fall back to `/interior_hero_banner.png`.
* **Why:** Public pages stay fast, while published edits become visible after the revalidation call or at worst the short cache window instead of requiring a rebuild.

### Cached public product rails

* **When to use:** When a server-rendered public rail needs a small category/product list outside the interactive catalog page, such as home new goods. This pattern does not apply to product-detail recommendations.
* **How:** Use `PublicApiController.getProductsList` with a bounded limit and `next.revalidate: 30`. Product-detail recommendations must instead use the dedicated no-store recommendation endpoint and silent conditional component. Keep interactive catalog/search/filter requests uncached or no-store because their URL controls must reflect the latest selected filters and sorting.
* **Why:** Rails can stay fast and static-generation friendly without causing `DYNAMIC_SERVER_USAGE` build diagnostics, while the live catalog remains responsive to current query state.

### URL-driven catalog controls

* **When to use:** When catalog UI needs shareable pagination, sort, filter, or search state.
* **How:** Use `usePagination` for one-based UI page values mapped to zero-based backend page requests, `useSort` for the `sort` query param, and URL search params for backend-driven filter keys/values. Applying filters must set `page=1`; catalog search must clear existing filters and redirect through `routes.searchCatalog(query)`. When pagination controls change the page in a product list, pass a `scrollTargetId` so the hook returns the user to the product list/top after the URL updates.
* **Why:** Catalog state survives navigation and refresh without needing Redux.

### React Hook Form for frontend forms

* **When to use:** For public and CRM forms, including search, catalog filters, login, list search, user create/edit, product create/edit, inline collection creation, quick product edits, and bulk product creation.
* **How:** Use `useForm` for form state, `useWatch` when complex form objects must drive conditional UI, and `Controller` for custom inputs such as catalog checkboxes/radio groups. Keep existing localized validation helpers and payload helpers unless the API contract intentionally changes.
* **Why:** RHF keeps form state consistent across both Next.js apps while preserving current localization, loading/error states, and backend payload shapes.

### Public customer request dialog

* **When to use:** When a public CTA such as "Оставить заявку" or "Задать вопрос по модели" needs a contact form.
* **How:** Use `CustomerRequestButton` inside the root `CustomerRequestDialogProvider`, pass a safe `source`, keep RHF validation localized under `requestDialog`, require email or phone, trim values before submit, include the hidden `website` honeypot, disable the submit button while submitting, show localized Sonner success/error toasts, reset and close only after a successful `PublicApiController.createCustomerRequest` call, and render backend text later as escaped React text. Style ordinary public form dialogs through `src/components/ui/dialog.tsx` so outside click, Escape, and the close icon all close the dialog. Keep `html { scrollbar-gutter: stable; }` so opening a dialog does not shift the page horizontally. Long request forms should keep the outer dialog `overflow: hidden` and scroll only an inner body so native scrollbars do not escape rounded modal corners. Kazakhstan phone fields should mask to `+7 XXX XXX XX XX`, normalize pasted/typed `8...`, `7...`, and `+7...` inputs, cap local digits at 10, reject incomplete phones, and submit normalized `+7XXXXXXXXXX`.
* **Why:** Requests are now CRM work items, not direct WhatsApp redirects, and the dialog behavior must feel normal without page jumps.

### Public review form and safe display

* **When to use:** When adding or changing product review submission/list UI.
* **How:** Keep rating and optional text in one RHF form, use a `Controller` for the 1-5 star selector, localize validation/loading/success/error copy under `product.reviews`, disable the submit action while pending, reset only after a successful submission, and leave the new pending review out of the approved list. Public review lists must be backend-driven, approved-only, paginated 15 per page, sorted/filtered through allow-listed params, and rendered from `Page<PublicProductReviewResponse>`. Changing review sort/rating/text filters resets `reviewPage` to 1; review URL params are one-based in the UI while backend Spring pages are zero-based. Render backend text as an ordinary React text node with `whitespace-pre-wrap`; never inject review HTML. Reviews without text use the localized `ratingOnly` message.
* **Why:** Guest submission must stay frictionless while validation, moderation expectations, safe text rendering, and feedback remain explicit in every locale.

### Product-card rating propagation

* **When to use:** When mapping products into `GoodCard`, `GoodsCarouselWithImage`, favorites snapshots, catalog grids, brand pages, new products, or similar-product sections.
* **How:** Carry `ratingAverage` and `ratingCount` through `IProduct`, `IProductDetails`, carousel item types, `GoodCard` props, and `localProductStorage` snapshots. Render a compact localized star line; use the localized no-rating state when count is zero.
* **Why:** The shared card can only keep rating behavior consistent across every storefront surface when intermediate mappings and persisted favorite snapshots do not drop the aggregate fields.

### Shared smart product search overlay

* **When to use:** When changing public search in the header, catalog hero toolbar, or product hero toolbar.
* **How:** Use `src/components/ui/shared/SmartSearch` with `variant="home"`/`"header"`, `variant="catalog"`, or `variant="product"`. Keep the query in React Hook Form, localize quick states under `nav.search`, use `product.search` for inline toolbar labels, debounce quick requests after 2+ characters, cancel stale requests with `AbortController`, close on outside click/Escape or host-overlay backdrop click, and submit full searches with `routes.searchCatalog(query)` so filters/category/price params are cleared and `page=1` is set. Home uses `.home-search-root`/`.home-search-frame` and centers at no more than 66%/760px on desktop. Catalog and product use `.toolbar-search-root`/`.toolbar-search-frame` and share the same right-to-center animation and 70%/760px active cap; product remains toolbar-owned, while desktop catalog search is card-owned by `.catalog-toolbar-shell` with exact 19px top/38px inactive right placement and a 67px inner control-row reservation. For mobile catalog and product hero toolbars, pass `mobileIconOnly` so the inactive state is just the search icon and the active state expands as an absolute toolbar-local overlay with small side inset, not a fixed page-top/header overlay.
* **Why:** Header, catalog, and product page search must share quick-result logic and avoid render/refetch loops, stale filters, and inconsistent product-row behavior.

### Merged smart search overlay layout

* **When to use:** When touching the active state, dropdown, z-index, width, or placement of `SmartSearch`.
* **How:** The inactive search should be smaller than the active search. Use the VYMPEL slow duration/easing on width, horizontal position, and transform so focus glides smoothly without layout jumps; retain the global reduced-motion override. The active input and dropdown must be one connected component: no margin gap, no double border, rounded top corners on the input, rounded bottom corners on the dropdown, and `top-full -mt-px` alignment. Keep home/product roots owned by their current hosts and let `.catalog-toolbar-shell` own desktop catalog search; reserve the inner control-row height before activation and animate only the frame. Home centers at 66%/760px, while catalog/product center at 70%/760px and catalog keeps the 19px top/38px right card geometry. The mobile catalog active state remains inside the toolbar container with `--spacing-search-overlay-mobile-toolbar-inset` safe margins and never uses fixed top positioning that can collide with the logo/header.
* **Why:** The smart search is a modal-like row overlay, not a loose dropdown; visual separation or sibling overlap makes the header/catalog/product toolbars feel broken.

### VYMPEL motion tokens

* **When to use:** When adding or changing dropdown, search, filter, category, checkbox, hover, or panel motion in the public storefront.
* **How:** Reuse `--duration-vympel-fast`, `--duration-vympel-base`, `--duration-vympel-slow`, `--ease-vympel`, and `transition-vympel*` utilities from `globals.css`. Keep motion subtle and scoped to interactive state changes; rely on the global `prefers-reduced-motion` override instead of hand-writing separate reduced-motion code everywhere. Catalog/filter/category hover should use `.catalog-hover-trigger` + `.catalog-hover-label` underline motion, not translate-on-hover or hover-only font-weight changes that shift layout.
* **Why:** Motion should feel consistent with VYMPEL and must not become a patchwork of arbitrary durations/easings.

### Centralized public route helpers

* **When to use:** When adding or changing public header, footer, breadcrumb, product-card, brand, search, cart, favorites, category, contact, marketplace, or CTA links.
* **How:** Use `vympel_front/src/config/routes.ts` (`routes`, `catalogLinks`, `PUBLIC_CATEGORY_CODES`, `CONTACT_LINKS`, `MARKETPLACE_LINKS`) instead of hand-building href strings. Category links must use `categoryCode` and `page=1`; semantic filter links must use backend filter keys/values such as `gender=1`; `WATCH_KIDS` uses `catalogLinks.kidsWatches`; brand pages use `routes.brand(slug)`; the footer `Бренды` destination must use `routes.brands()` for the all-brands page; catalog brand filters should use a backend-resolved brand option value.
* **Why:** The app has mandatory locale prefixes and backend-owned catalog filters. Centralizing href construction prevents `#`, `/`, stale path-style catalog URLs, and filter values that do not match the current backend contract.

### Backend-driven catalog filter UI

* **When to use:** When adding or changing public catalog filters.
* **How:** Fetch `/api/public/product/filters/{lang}` through `PublicApiController.getCatalogFilters`, render labels/options/counts/source from the response, keep selected values in URL params, remove keys that are not present in the current category metadata, drop removed aliases such as `brandCountry`, and use global catalog filter tokens from `globals.css`. Draft filter state belongs in React Hook Form; use `Controller` for the reusable animated `Checkbox` and price inputs, then write the URL only on Apply/Reset. Filter category and option hover should use the shared underline hover utility so hover does not move text, change element height, or flicker.
* **Why:** Filter dictionaries, localized labels, counts, and category-specific visibility belong to the backend; hardcoded frontend filters drift from product data.

### Catalog hero banners under header

* **When to use:** When catalog/category hero banners need to match the product-page visual pattern.
* **How:** Let `Header` use its absolute overlay mode for `/catalog` as well as `/product`, so the hero image starts behind the header instead of being pushed below it. Keep the banner image and toolbar/card owned by `BannerWithPageContent`; apply `.catalog-page-banner-image` with a fluid `clamp(460px, 42vw, 605px)` from 1024-1439px and a hard `--spacing-catalog-hero-min-height: 605px` minimum from 1440px. Keep `object-fit: cover` and centered composition. CMS category images still resolve before local fallbacks such as `/accessories_hero_banner.png` and `/interior_hero_banner.png`.
* **Why:** Large desktops preserve the intended premium 605px composition, while smaller desktops can reduce height without clipping the toolbar or forcing a poorly cropped banner.

### Catalog toolbar card owns desktop overlays

* **When to use:** When changing the catalog category, filter, sort, or search panels around the hero toolbar.
* **How:** Pass `.catalog-toolbar-shell` through `BannerWithPageContent.contentClassName`. Below 1440px keep the collision-safe icon row; from 768px keep the search trigger at the shell's 19px top/38px right coordinates, and from 1024-1439px attach category/filter/sort panels to the same card edge. At 1440px+ restore the full inactive search and labeled controls without changing the 19/38 anchor. Do not restore the full inline row at 1280px: rendered accessories controls still overlap there.
* **Why:** One containing block guarantees zero-gap panel attachment, matching left/right edges, stable search geometry, and no trigger-sized or detached desktop dropdowns.

### Coordinated mobile catalog overlays

* **When to use:** When category, filter, sort, or catalog search can open from the mobile catalog toolbar or bottom navigation.
* **How:** Route all four surfaces through `CatalogOverlayProvider`; store the exact trigger element and keep only one `activeOverlay`. Below 1024px render modal surfaces through `CatalogMobileSheet`/Radix Dialog, let Radix own focus trapping, Escape, portal layering, and body scroll lock, and hide `MobileBottomNavigation` until the 220ms exit transition completes. Mobile filter content has one internal vertical scroller with safe-area Apply/Reset actions; mobile categories use the single `100dvh` tree shared by toolbar and bottom-nav triggers. From 1024-1439px reuse the compact triggers but open the existing toolbar-attached category/filter/sort panels instead of phone-sized sheets.
* **Why:** One controller prevents stacked overlays, duplicate body locks, focus loss, and the fixed bottom navigation covering sheet actions.

### Accessories catalog split controls

* **When to use:** When changing the public accessories catalog category or its toolbar/banner behavior.
* **How:** Keep accessories on the `ACCESSORIES` category and do not render the full `CatalogFilters` trigger/panel or send stale price/brand/watch filter params. Through 1439px place a responsive second-row `Все` / `Женские` / `Мужские` segmented control below the category/sort/search row; its selected item uses only the filled rounded pill and must suppress the shared hover/active underline. At 1440px+ retain the lightweight inline text/underline language. The selected gender writes one `gender` value, every change resets `page=1`, and `Все` or clicking the active gender clears `gender`.
* **Why:** A three-state segmented control communicates the all-accessories state explicitly and avoids compressing gender labels into the primary icon row, while preserving the existing backend query contract.

### Backend-driven category selector

* **When to use:** When catalog category selection must survive reloads and drive category-specific filters/products.
* **How:** Fetch `PublicApiController.getCategoryList(locale)`, build the id/parentId tree client-side through `src/utils/categoryTree.ts`, show root categories first and child categories beside the hovered/focused root on desktop, use a short hover-intent delay plus subtle opacity/translate submenu motion to avoid flicker, then route with `routes.categorySelectionCatalog(category.code, searchParams)`. Clear previous filter, price, size, and page params on category change while preserving intentionally global params such as search/sort. Category item hover should be an underline/color transition only; active selection may be semibold, but hover must not translate or resize rows. On mobile, expose the same category flow from both the catalog toolbar and `MobileBottomNavigation`; both triggers must open the one provider-owned full-height sheet, drill into parent categories with children, and include an `All products` action for the current parent listing.
* **Why:** Category hierarchy and localized names belong to the backend, while the URL stays the reloadable frontend source of truth.

### Public brand page config

* **When to use:** When adding or changing public brand pages, brand dropdown links, brand banner mappings, or brand copy.
* **How:** Keep public brand slugs/display names/database codes in `src/config/brandRoutes.ts` and long page copy/assets in `src/config/brandPages.ts`. Preserve the existing `pierre-ricaude` database compatibility alias while displaying `PIERRE RICAUD`. The all-brands `/brands` page should prefer backend brand filter options/counts when available, fall back to `PUBLIC_BRANDS` only if backend filter data is unavailable, and remain the footer `Бренды` target.
* **Why:** The project does not currently expose public brand content endpoints, so a centralized frontend config avoids duplicated copy, broken navigation slugs, and inconsistent asset fallbacks.

### Brand products through catalog filters

* **When to use:** When a public brand page or brand-related UI needs product cards for a specific brand.
* **How:** Resolve the backend brand id from `/api/public/product/filters/{lang}` brand options, then call `/api/public/product/catalog/{lang}` through `PublicApiController.getCatalogProducts` with `filters: { brand: [id] }`, `size: 15`, and `sort: newest`. If there are fewer than 15 results, show the returned products or a localized empty state; never substitute products from other brands.
* **Why:** The catalog filter endpoint already owns active-product filtering and brand ids, while the public route slug is a display/navigation concern.

### Shared UI and token usage

* **When to use:** When building frontend UI that fits the existing design system.
* **How:** Prefer components under `src/components/ui/shared` and design tokens from `src/app/globals.css`; use existing font variables and semantic color classes before adding new tokens.
* **Why:** The UI already relies on CSS variables and Tailwind semantic aliases for consistency.

### VYMPEL public dropdown selects

* **When to use:** When public storefront UI needs a compact select/dropdown for filters, sorting, or similar small option sets.
* **How:** Use `src/components/ui/shared/DropdownSelect` instead of raw native-looking `<select>` controls when the opened menu must be styled. Match the language selector direction: light translucent surface, subtle border, rounded trigger/menu, custom rotating chevron indicator, clear selected option, hover/focus/open states, and keyboard support. Keep styling backed by global tokens such as `--color-dropdown-surface`, `--color-dropdown-surface-hover`, `--shadow-dropdown-trigger`, and `--shadow-dropdown-panel`.
* **Why:** Native select popups look OS-default and cannot reliably style the opened menu; the public storefront needs a premium VYMPEL dropdown surface that remains accessible and responsive.

### Public responsive storefront adaptation

* **When to use:** When changing public storefront layout, navigation, catalog/product surfaces, brand/about/info pages, cart, favorites, banners, footer, or toasts.
* **How:** Preserve desktop behavior, then adapt with global `globals.css` tokens/classes such as `.responsive-page-x`, `.responsive-section-gap`, `.responsive-product-grid`, `.responsive-home-banner-*`, `.responsive-page-banner-image`, `.goods-carousel-*`, `.mobile-bottom-nav-item`, `.brand-page-title`, `.product-card-*`, and `.vympel-toast-*`. Treat 0-639px as mobile, 640-1023px as tablet, 1024-1279px as small desktop, and 1280px+ as desktop. Keep touch targets around 44px, avoid fixed desktop widths on mobile, verify 1440/1024/768/480/430/414/390/375/360/320px behavior by source/render checks, and keep large mobile hero banners visually strong without cropping important baked-in text/product composition. Use proven mobile ecommerce patterns adapted to VYMPEL: compact header, drawer navigation, fixed bottom nav for primary phone actions, dedicated mobile categories flow, compact icon-first catalog toolbars, toolbar-local active catalog search, modal sheets with internal scrolling/safe-area actions, one-line horizontally scrollable breadcrumbs/tabs where labels would otherwise wrap badly, one-row pagination, readable product grids, fixed-size badges/icon circles, viewport-safe brand headings, tall mobile brand banners, and a purpose-built mobile footer. Mobile benefit blocks should align icon/text content from the start unless a page-specific design says otherwise; mobile `Смотреть все` heading actions should stay smaller than the heading and not dominate the section.
* **Why:** The storefront must feel like a premium ecommerce site on tablets and phones without horizontal overflow, tiny cards, cramped controls, or broken desktop carryover.

### Evidence-first UI polish audit handoff

* **When to use:** When a task asks for reproduction and an implementation plan but explicitly forbids applying the fixes.
* **How:** Use a finite production build, reproduce every issue at its relevant interaction state, cover the required desktop/tablet/mobile edge widths, save descriptive screenshots under one task folder, and pair them with both a screenshot index and an issue-by-issue implementation specification. Record measured computed values, exact source owners, responsive rules, acceptance criteria, and regression risks. Restore temporary viewport/local browser state and stop only task-owned servers. The 2026-07-15 reference handoff is `docs/tasks/vympel_ui_polish_audit/`.
* **Why:** A later implementation agent can make scoped fixes without repeating the audit or guessing from subjective descriptions.

### Responsive CSS custom properties must be consumed dynamically

* **When to use:** When a spacing or typography value is declared as a CSS custom property and changes inside media queries.
* **How:** Verify the runtime computed value. A generated named spacing utility can compile to a default value and ignore later custom-property overrides. Use an arbitrary custom-property utility such as `mt-[var(--spacing-product-details-links-offset)]` only when the element truly owns that spacing, or a small CSS class that reads the variable directly. For shared section rhythm use `SectionWithTitle.spacing`; for final page-to-footer spacing, remember that `Footer` already owns `mt-[var(--spacing-responsive-section-y)]`.
* **Why:** The UI polish audit found 130 px Description offsets and 170 px mobile InfoPage padding even though the responsive variables declared smaller values, plus several pages that doubled the shared Footer rhythm.

### Mobile bottom navigation and categories flow

* **When to use:** When changing primary mobile navigation, category discovery, cart/favorites/profile access, or catalog toolbar behavior.
* **How:** Keep `MobileBottomNavigation` mounted from the localized root layout and visible only below the desktop breakpoint. It owns Home, Categories, Cart, Favorites, and Profile; category browsing is backed by `PublicApiController.getCategoryList(locale)` and `buildCategoryTree`, not hardcoded data. On catalog pages, route the Categories item and toolbar category trigger to the same `CatalogOverlayProvider` surface. Hide the entire bottom navigation while any category/filter/sort/catalog-search overlay is open and until its exit animation completes; do not reserve a panel offset for it. Parent categories with children drill down; each level includes `All products`. Use category codes/names only to choose meaningful icon metaphors. Profile has no route until implemented; use `ProfileUnavailableButton` so desktop and mobile show the localized tooltip/popup instead of a disabled dead link.
* **Why:** Phone users keep reachable primary navigation in normal browsing, while temporary catalog modal flows get the whole safe viewport and cannot have actions covered by the nav.

### Product rail banner and arrows

* **When to use:** When changing `GoodsCarouselWithImage`, home `Новинки`, similar products, or any carousel with a background/banner image.
* **How:** Use `.goods-carousel-banner` as the controlled visual banner layer and `.goods-carousel-track` for the product rail. Hide the banner below the desktop breakpoint when it becomes a tiny strip or background noise; on desktop, any card overlap must be intentional with the track above the banner layer. Carousel arrows should be hidden on phones or placed in reserved side lanes so they never cover product cards or controls.
* **Why:** The previous pattern let arrows and background imagery intrude into product cards, which made both desktop and mobile rails look broken.

### Public empty and error states

* **When to use:** When catalog, favorites, cart, product detail, related products, or unknown public routes need a friendly no-data or failed-load state.
* **How:** Use shared `EmptyState` and `ErrorState` from `src/components/ui/shared`, localize copy under `states.*`, and wire actions through `routes.*` or explicit retry handlers. Keep these states inside the existing page/screen layout and tokenized with `--color-state-*`, `--spacing-state-*`, and `--shadow-state`.
* **Why:** Public pages should never show raw fetch errors, blank content, or the default framework fallback when the project has enough context to guide users onward.

### Real localized public 404 responses

* **When to use:** For unknown storefront URLs and dynamic product, catalog-category, or brand routes whose requested resource does not exist.
* **How:** Resolve entity existence in the route owner before rendering descendants, call Next `notFound()` only for a confirmed API 404, and keep the localized `not-found.tsx` UI. Do not put a route-wide `loading.tsx` streaming boundary above that decision; unexpected/temporary API failures must retain the safe error path instead of becoming false 404s. Verify with a production server and assert both status and localized body content.
* **Why:** A page that merely displays 404 copy with HTTP 200 is a soft 404 that misleads crawlers, caches, monitoring, and clients.

### Public unavailable product cards

* **When to use:** When rendering public product lists or changing `GoodCard`.
* **How:** Pass `stockQuantity` and `status` into `GoodCard`. If `status` is not `ACTIVE` or `stockQuantity <= 0`, keep the product link clickable, visually soften the image, show the localized `good.outOfStock` badge, and use a disabled add-to-cart button. On mobile, the badge must not collide with the favorite button; place and size it with `.product-card-badge` or equivalent safe positioning. Use `localProductStorage` for favorite state and `useCartProduct` for in-cart state so the active heart and basket state are visible everywhere product actions appear. Already-in-cart card/detail actions should show feedback and link to Cart rather than duplicating or incrementing the item.
* **Why:** Public users need a clear unavailable state, and unavailable products must not be addable to cart.

### SSR-safe local favorites/cart

* **When to use:** When implementing temporary public favorites/cart before account-backed persistence exists.
* **How:** Use `vympel_front/src/services/localProductStorage.ts` instead of direct `localStorage` calls. It owns `vympel:favorites` and `vympel:cart`, keys records by product id, stores product snapshots including `sku` when available, guards browser APIs for SSR, exposes `useFavorites`, `useFavoriteProduct`, `useCart`, `useCartProduct`, and `useCartActions` through `useSyncExternalStore`, makes background snapshot refreshes idempotent, resets corrupted stored JSON, keeps debug logging development-only, and returns explicit mutation statuses such as `added`, `removed`, `alreadyInCart`, `unavailable`, `stockLimit`, and `failed`. Use `getAvailableStock`, `canIncreaseCartItem`, and `isStockLimitReached` for cart quantity UI and never increment above `stockQuantity`; if refreshed stock is lower than the current positive quantity, reduce the stored quantity to that stock ceiling.
* **Why:** Cards, header counts, favorites page, cart page, and product summary stay in sync after toggles, reloads, and cross-tab storage events without hydration crashes.

### Public product action toasts

* **When to use:** When favorite or cart actions succeed, fail, are blocked by stock, or hit an already-in-cart state.
* **How:** Use `src/hooks/useProductActionToasts.ts` rather than calling `toast` directly from product components. The hook localizes copy, styles through the global Sonner provider, and attaches concise navigation actions labeled like `Перейти` to `routes.favorites()` or `routes.cart()`. Favorite removal must offer `Отменить` and restore the removed `ProductSnapshot` instead of navigating to Favorites. Toast text may wrap on mobile, but it must wrap cleanly inside the card; action buttons should use `.vympel-toast-*` as smaller rounded pills, not oversized debug-looking badges. Only show success toasts and analytics after a successful `localProductStorage` mutation result; use the stock-limit and checkout-data toasts for blocked quantity increases, empty checkout, unavailable cart items, and missing refreshed SKU/product data.
* **Why:** Favorite/cart feedback should be consistent across `GoodCard`, product summary, favorites, and cart pages, and storage failures should not be reported as successful user actions.

* **Mobile note:** Keep Sonner toast title/description text wrapping naturally inside the card. Do not reintroduce `!whitespace-nowrap`, hard text widths, or debug-badge-like toast surfaces for normal success/info actions.

### WhatsApp cart checkout message builder

* **When to use:** When changing cart checkout or WhatsApp order handoff behavior.
* **How:** Keep the WhatsApp destination in `CONTACT_LINKS.whatsapp`, but build order text through `src/utils/cartCheckout.ts`. Validate first with `getCartCheckoutIssue`; do not redirect for empty carts, missing product/SKU data, unavailable products, or quantities above stock. `buildWhatsAppOrderMessage` must include localized greeting, all positions, product name, quantity, unit price, line total, article/SKU as the final line for each item, and total order sum, then `buildWhatsAppOrderUrl` URL-encodes the message.
* **Why:** Checkout text is customer-facing but SKU/article is technical data; centralizing the format prevents missing totals, stale static WhatsApp links, and article fields appearing in the wrong place.

### Stock-limit tooltip pattern

* **When to use:** When a cart quantity increase is disabled because the item already reached available stock.
* **How:** Use `src/components/ui/tooltip.tsx` shadcn Tooltip components, style Tooltip content with VYMPEL surface/border/shadow tokens, wrap the disabled button in a non-disabled `<span>` via `TooltipTrigger asChild`, and pair it with subtle inline localized text such as `cart.stockLimitInline`.
* **Why:** Native disabled buttons do not emit hover/focus events reliably, and the user should know the reason without layout shifts or a harsh warning block.

### Stable favorites/cart effect keys

* **When to use:** When refreshing local favorite/cart snapshots or loading related products from browser-backed product ids.
* **How:** Derive a sorted primitive id key such as `"1,2,3"` for effect dependencies, rebuild arrays or `Set`s inside the effect, and avoid depending on sorted store item arrays whose order can change after writes.
* **Why:** Snapshot refreshes and card favorite-state sync can otherwise reshuffle `updatedAt`, recreate arrays, retrigger effects, and cause repeated product fetches or apparent page freezes.

### Honest product image empty states

* **When to use:** Whenever a product image URL is null or the product media list is empty on detail, card, search, favorites, or cart surfaces.
* **How:** Render `ProductImageFallback` with localized `productImageFallback.label`; keep the existing image frame dimensions and omit thumbnail/zoom controls when there is no real gallery media. Never substitute decorative catalog artwork such as `/clocks.png`.
* **Why:** Fake product photos misrepresent catalog data, while one shared styled state keeps every surface honest and visually stable.

### Overflow-safe product details

* **When to use:** For product descriptions, translated feature values, brand links, or other administrator-entered copy beside a specs column.
* **How:** Give the grid and both children `min-width: 0`; apply `.product-long-copy` to user content so normal text and unbroken strings wrap with `overflow-wrap: anywhere`. Do not hide or truncate the full description.
* **Why:** CSS grid/flex children otherwise retain an intrinsic minimum width and can paint over the characteristics column.

### Trigger-independent catalog popovers

* **When to use:** For desktop category, filter, sort, or search dropdowns in the catalog hero toolbar.
* **How:** Make `.catalog-toolbar-shell`, the visible white card supplied through `BannerWithPageContent.contentClassName`, the invariant containing block. From 768px, make `.search-toolbar` static and keep the catalog search frame at exactly `top: 19px; right: 38px`; active search stays centered in the same shell. Category/filter/sort panels resolve against the card and must not change those measurements. Keep the mobile under-768 host-overlay behavior and the full text/search mode at 1440.
* **Why:** `width: 100%` on a positioned trigger or inner row means the wrong width/edge. The visible card must own full-width, zero-gap desktop surfaces.

### Public breadcrumb typography

* **When to use:** On catalog, product, and brand breadcrumbs.
* **How:** Use `.public-breadcrumb` plus the shared `text-breadcrumb` token: `20px`, `font-weight: 300`, and plain black `text-primary` for links, separators, and the current item. Render separators through `PUBLIC_BREADCRUMB_SEPARATOR` from `src/config/publicBreadcrumb.ts`; do not read separate locale keys for this glyph. Keep long trails on one internally scrollable line at narrow widths.
* **Why:** Breadcrumb hierarchy must remain consistent and readable without causing body overflow.

### Footer-owned final page rhythm

* **When to use:** On standard public pages whose final content is followed by the shared Footer.
* **How:** Footer owns the only final gap through `--spacing-responsive-section-y`: 120px desktop, 96px tablet, and 64px mobile. Page wrappers use top spacing only and must not add final `pb-*`, `mb-*`, or a second responsive section gap. Home/About keep their intentionally composed section rhythm.
* **Why:** Splitting the same visual gap across page padding and Footer margin doubles whitespace and makes routes disagree.

### Explicit shared section spacing

* **When to use:** When `SectionWithTitle` needs standard section rhythm, a smaller subsection transition, or spacing supplied by a parent layout.
* **How:** Use `spacing="section"` (default), `spacing="subsection"`, or `spacing="none"`. Product related-to-contact uses the subsection token at 72/56/40; catalog sections inside a tokenized flex `gap` use `none`. Do not try to override `.responsive-section-gap` with an arbitrary `mt-[...]` class because authored CSS can win the cascade.
* **Why:** One explicit spacing owner avoids margin collapse, specificity surprises, and doubled parent/child gaps.

### Code-first mobile category icons

* **When to use:** In the mobile category tree or any category navigation fed by backend category DTOs.
* **How:** Resolve the normalized category code through `CATEGORY_ICON_BY_CODE` first and render one 20px Lucide outline icon inside the existing 40px box. Use code-family fallback next and localized-name heuristics only when an unknown record has no useful code. Keep `WATCH_KIDS` distinct from `WATCH_WRIST`.
* **Why:** Labels change with locale, while backend codes are stable; name-first heuristics duplicate or misclassify icons.

### Separate CRM frontend app

* **When to use:** When adding CRM/admin-only UI, protected routes, dashboards, tables, or management forms.
* **How:** Keep CRM code under `vympel_crm`, with its own `package.json`, `src/app` routes, `src/shared/api` client, `src/shared/i18n` messages, `src/shared/ui` primitives, and `src/app/globals.css` `--crm-*` tokens. Do not mix CRM screens into `vympel_front`.
* **Why:** The public storefront and admin workflows have different auth, density, routing, and deployment needs; keeping CRM separate prevents storefront coupling.

### CRM API client and session handling

* **When to use:** When the CRM frontend needs protected backend data.
* **How:** Use `vympel_crm/src/shared/api/client.ts` instead of ad hoc fetch calls. It reads `NEXT_PUBLIC_CRM_API_BASE`, includes credentials, attaches only the access token from `sessionStorage`, preserves multipart boundaries, and keeps 401 and 403 distinct. A 401 joins one module-level refresh promise, rotates the HttpOnly cookie, saves the new access token, and retries once; a second 401 clears once without looping. A 403 preserves the session and emits localized forbidden feedback. Login/refresh/logout never recursively refresh.
* **Why:** Protected screens need consistent auth behavior under expiry and concurrency without turning authorization denial into logout or creating refresh storms.

### Rotating CRM refresh sessions

* **When to use:** For CRM login, session restoration, access-token renewal, logout, role changes, or user disable operations.
* **How:** Return the short-lived access JWT in JSON, but set the refresh JWT only as a host-only HttpOnly cookie scoped to `/api/crm/auth`, with `SameSite=Lax` and `Secure=true` in production. Persist only SHA-256 hashes of refresh `jti` values. Rotate under a pessimistic lock, mark replacements, revoke the active family on replay, revoke all active sessions after role removal/user disable, and validate exact `Origin`/`Referer` on cookie-authenticated refresh/logout requests. Keep production CRM/API same-site unless this threat model is redesigned.
* **Why:** JavaScript cannot exfiltrate the refresh credential, stolen rotated tokens cannot be replayed silently, and role/status changes take effect without waiting 14 days.

### CRM global mutation feedback

* **When to use:** When a CRM action calls a backend mutation, including login/logout, create/update/archive, quick edits, user status changes, collection creation, or product photo upload.
* **How:** Wrap the app with `NotificationProvider`, call `useNotifications().success(...)` or `.error(...)` with localized messages, and use `getCrmErrorMessage(error, fallback)` so raw Java/SQL/stack messages do not leak into the UI.
* **Why:** Admin actions need visible loading/success/error feedback, but technical backend exceptions should not be shown directly to users.

### CRM destructive confirmations

* **When to use:** Before destructive CRM mutations such as review soft-delete, request cancel, CMS block delete, or product image delete.
* **How:** Use `vympel_crm/src/shared/ui/ConfirmDialog.tsx` and CRM `--crm-*` dialog tokens instead of `window.confirm()`. Keep the underlying mutation in the feature component, pass localized labels, close on outside click/Escape/cancel, and keep the clicked destructive action disabled or loading while the mutation is pending.
* **Why:** Browser confirms are unstyled, unlocalized, and inconsistent with CRM loading/error feedback; a shared dialog keeps destructive actions accessible and auditable without changing backend contracts.

### CRM request processing UI

* **When to use:** When adding or changing customer/application request handling in CRM.
* **How:** Keep the route under `vympel_crm/src/app/requests`, render with `ProtectedShell`, fetch through `crmApi.requests/newRequestCount/request`, mirror DTOs in `shared/api/types.ts`, keep strings in `shared/i18n/messages.ts`, and use CRM `Text`/`Heading`/`Button` plus `--crm-*` globals. Show a new-count metric, RHF search/status filters reset to page zero, a pageable table, a detail panel for status/comment processing, and localized success/error notifications. Disable every action while a mutation is pending and show the shared button spinner on the actual clicked action.
* **Why:** Request handling is operational CRM work; staff need clear status, safe comments, and reliable feedback without public-storefront coupling.

### CRM product photo upload UI

* **When to use:** When adding or changing product images from the CRM product create/edit form.
* **How:** Let admins select up to 10 files, validate supported image MIME types plus matching `.jpg/.jpeg/.png/.webp/.gif` extensions and the 10 MB per-file limit before upload, preview selected files with local object URLs, create the product before uploading photos for new products, then refresh from structured `ProductResponse.images`. Existing images expose localized Make main/Delete/Up/Down actions, a visible main badge, compact loading states, and a styled no-photo/broken-photo fallback. After a successful new-product save/upload, navigate to `/products/{id}`; on upload failure, keep that created-product route available for retry.
* **Why:** The backend media contract is product-id based, so new products need an id before images can be attached; refreshed server data keeps the UI aligned with stored MinIO links and never silently drops selected files or management failures.

### Discoverable CRM product lists

* **When to use:** When changing CRM product creation, list retrieval, search, status, or paging.
* **How:** The unfiltered API must include `DRAFT`, `ACTIVE`, and `ARCHIVED`, default to `createdAt DESC`, and expose zero-based paging. Search ID/model/SKU/status/brand/category code/category name/localized product name with a separate non-null text query; combine it with a validated status filter when selected. Reset the page to zero on search/status changes and expose previous/next controls plus counts. CRM list requests and responses are no-store, and create/update/image/delete mutations must broadcast `notifyProductListChanged` so cached list routes refetch; focus also refreshes the current query.
* **Why:** A successful create is not usable if the product lands on an unreachable page or disappears because the list silently filters drafts.

### CRM inline collection creation

* **When to use:** When a product create/edit workflow needs a missing collection.
* **How:** Keep the UI inside `ProductForm`, keep the embedded collection fields in React Hook Form, require a brand plus RU/EN/KZ names and descriptions through the existing localized helper, call `crmApi.createCollection`, append the returned option into `references.collections`, and select the new `collectionId` without a full page reload.
* **Why:** Collection creation is part of catalog entry and should not force admins to leave the product form.

### CRM category-first product forms

* **When to use:** When creating or editing CRM product forms and category-specific fields.
* **How:** `/products/new` must load references and render only category selection first. After category selection, RHF owns values and `useWatch` drives conditional sections. Require only category, RU/default name, model, non-negative integer price/stock, and brand; default new items to `DRAFT`. EN/KZ names, all descriptions, collection, photos, links, and category characteristics are optional. Render only the selected profile's optional spec fields and lock category on edit unless a safe cross-profile migration exists.
* **Why:** Admins should not see every possible product detail field at once, and hidden mismatched fields must not be submitted.

### Draft-friendly product validation

* **When to use:** When changing single or bulk product create DTOs, CRM validation, category details, or publication defaults.
* **How:** Keep frontend and backend requirements identical. Missing optional fields must be omitted/null-safe, partial wristwatch/interior detail rows must persist through nullable detail columns, and only mismatched category-profile payloads should be rejected. Use localized CRM validation fallbacks for backend `VALIDATION_ERROR` responses.
* **Why:** CRM must be able to save incomplete draft catalog items without surprising backend-only failures.

### CRM product table real values

* **When to use:** When displaying or quick-editing CRM product price or stock.
* **How:** Treat `product.price` and `product.stock_quantity` as the only source of truth. Backend quick updates must write those entity fields, `ProductResponse` must explicitly expose those same fields, and CRM inputs must initialize/resync from `ProductResponse.price` and `ProductResponse.stockQuantity`. Render missing/null values as empty state, reject blank/invalid quick saves instead of converting them to `0`, replace the row from the mutation response, and refetch the list after mutation.
* **Why:** The CRM table must reflect persisted backend values after update and reload; fake defaults such as `200000` or fallback stock `0` hide real data problems.

### CRM bulk product creation

* **When to use:** When admins need to create several products for one category.
* **How:** Start with category selection, derive profile/default type through `productCategoryProfile.ts`, keep `common` and rows in RHF, and require only common/category essentials plus each row's RU name/model/price/stock. Descriptions and profile specs remain optional common defaults/row overrides; send a detail object only when at least one detail exists, preserving missing members as null/omitted. Backend merges values and delegates to `ProductService.create`.
* **Why:** Bulk creation must stay aligned with the single-product category rules and must not show all possible specs for all categories.

### Product name and description translations

* **When to use:** When changing product create, edit, detail, CRM bulk, or product response contracts.
* **How:** Use `productName.name_ru/name_en/name_kz` and optional `description.desc_ru/desc_en/desc_kz` everywhere. Require RU name only; normalize missing EN/KZ values to RU for public fallback. Store long descriptions exclusively in `product_description_i18n.content_md`; `ProductDescriptionI18n.title` remains a short legacy field and must not receive description copy. Return full translations for edit hydration.
* **Why:** Product text must stay multilingual and draft-friendly without sending long content into 255-character columns.

### Public product analytics tracking

* **When to use:** When public product view, favorite, or add-to-cart interactions need analytics.
* **How:** Send analytics events asynchronously through the public API client, include a session id when available, guard product views against duplicate sends in the same session, and swallow tracking failures. Favorite/cart UI should emit `FAVORITE`, `UNFAVORITE`, `ADD_TO_CART`, and `REMOVE_FROM_CART` from interaction handlers, not render effects.
* **Why:** Analytics is useful only if it never breaks product browsing, favorite toggles, or add-to-cart controls.

### Localization-first UI text

* **When to use:** For all new or touched user-facing labels, placeholders, headings, breadcrumbs, aria labels, helper text, empty states, validation messages, and button text.
* **How:** Add the string to every locale file in `src/messages/*.json` first, then render it with `getTranslations` in server components or `useTranslations` in client components. Keep dynamic text as localized templates with variables.
* **Why:** Prevents raw Russian/English/Kazakh text from drifting across JSX and keeps locale-prefixed routes consistent.

### Text and Heading typography primitives

* **When to use:** For normal user-facing typography and headings.
* **How:** Use the project `Text` component for normal text and the project `Heading` component for headings. Use `Text as="span"` for inline text inside controls or labels where a paragraph would be invalid. Use raw typography tags only when required for semantics or accessibility, and still apply project typography tokens.
* **Why:** Keeps font sizes, weights, colors, and semantics consistent without duplicating typography classes.

### Globals token first

* **When to use:** When a component needs a reusable font size, placeholder size, line height, color, or visual design value.
* **How:** Add or reuse a named token in `src/app/globals.css` / `TextVariants` first, then use named classes such as `text-2xs`, `text-product-title`, `text-text-product-muted`, or `bg-button-bg-product` in components. Do not use arbitrary Tailwind values like `text-[15px]`, `placeholder:text-[15px]`, or raw hex colors when the value should be reusable.
* **Why:** Prevents one-off UI values from spreading and makes Figma-aligned values reusable.

## Backend Patterns That Work

### Controller-service-repository layering

* **When to use:** For backend feature work and API changes.
* **How:** Keep HTTP concerns in `controllers`, business rules in `services`, persistence in `db/repositories`, entities in `db/entity`, and DTO conversion in `mappers`.
* **Why:** This is the established Spring Boot structure in the backend.

### Liquibase-first schema changes

* **When to use:** Any time a table, column, constraint, seed, or relationship changes.
* **How:** Add a new changelog file under `src/main/resources/db/changelog`, include it in `db.changelog-master.xml`, and keep JPA `ddl-auto: validate`.
* **Why:** Hibernate validates the schema instead of creating it, so database changes must be migration-backed.

### Constraint migrations with production-copy rehearsal

* **When to use:** When adding checks/uniqueness or normalizing live business data.
* **How:** Ship read-only diagnostics, HALT on unknown dirty rows, correct only exact audited rows, define explicit schema rollback and honest data forward recovery, dump/restore the current DB to a disposable copy, run finite Spring/Liquibase proof plus direct invalid SQL there, and migrate live only after it passes.
* **Why:** Constraints are only safe when the current data and the full applied migration chain are proven, not assumed.

### MapStruct DTO mapping

* **When to use:** When converting entities to request/response DTOs.
* **How:** Add or update mappers under `mappers/**` with `@Mapper(componentModel = "spring")`; use existing reference mapper patterns for relationships.
* **Why:** The backend already uses MapStruct and Spring-managed mappers.

### Transactional service writes

* **When to use:** For multi-step writes such as product creation, category linking, watch details, descriptions, names, and media persistence.
* **How:** Put `@Transactional` on the service method that coordinates the write.
* **Why:** Product creation spans multiple tables and should complete atomically.

### Environment-driven backend configuration

* **When to use:** For datasource, JWT, S3/MinIO, CORS, server port, or other deploy-time settings.
* **How:** Read values through base `application.yml` placeholders with no usable secret/service fallback, keep developer/test fixtures only in explicit profile files, validate typed properties, and run the pre-bean non-local security validator. Production must inject DB, independent JWT/limiter keys, Redis, S3, exact HTTPS CORS, secure cookie, and required CMS values.
* **Why:** Checked-in production secrets and single-origin CORS are security and deployment risks; validated config fails early instead of failing during a request.

### Distributed layered abuse controls

* **When to use:** Authentication, registration, public writes, analytics, quick search, catalog reads, or other endpoints exposed to unauthenticated volume.
* **How:** Route every limiter operation, including login-backoff retry/reset/block calls, through `RateLimitService`; use atomic Redis state outside explicit local/test profiles, strictly cardinality-bounded memory only for local/test, HMAC-digested identities, and a small bounded sequence of global/source/account-or-content checks before service or repository work. Keep high-risk store failure closed and deliberately chosen read availability paths open.
* **Why:** Produces multi-instance-correct limits without exposing personal identifiers or allowing rejected traffic to consume database work.

### Trusted proxy client identity

* **When to use:** Any protection or audit rule needs the originating client address behind an ingress.
* **How:** Trust `X-Forwarded-For` only when the direct peer is inside an explicitly configured numeric CIDR. Walk the bounded chain from the trusted edge, reject malformed/oversized input, and otherwise use the direct peer. Keep Spring's generic forwarded-header rewriting disabled unless the whole deployment trust model is redesigned.
* **Why:** Prevents direct clients from selecting arbitrary limiter buckets with spoofed headers.

### Secure non-local startup validation

* **When to use:** Configuration includes credentials, signing/HMAC keys, browser origins, cookies, Redis, object storage, or service-to-service secrets.
* **How:** Put usable developer fixtures in explicit `application-local.yml`/`application-test.yml`; keep the base values blank/secure; run `NonLocalSecurityConfigurationValidator` before bean creation; reject a disabled limiter, weak/placeholders, local services, insecure transport, memory limiting, wildcard origins, and mixed production/local profiles without printing values.
* **Why:** Turns deployment misconfiguration into an immediate safe failure instead of a silently insecure runtime.

### Bounded pageable endpoints

* **When to use:** For public catalog/search/list endpoints or CRM list/moderation/activity/user pages.
* **How:** Normalize `Pageable` through `PageableUtils.cap(...)` in controllers before calling services. Public catalog/category product reads currently cap to 60 items; CRM product/review/user/activity reads cap to 100. Keep sort aliases allow-listed before constructing the final `PageRequest`.
* **Why:** Trusting arbitrary client `size` values enables expensive queries and memory pressure; central caps keep API behavior predictable without changing every service.

### Bounded staged recommendation projections

* **When to use:** When recommendation selection needs multiple fallback stages but response cost must not grow with the number of cards.
* **How:** Load the source profile once, rank all valid candidates in one native/projection query with an explicit stage `CASE`, deduplicate IDs in a `LinkedHashSet`, then hydrate every selected card through `PublicProductSummaryRepository`. Aggregate approved ratings and pick main/first media in that shared query; convert storage keys to public URLs in memory. Cap the public limit at 12, keep finite query timeouts, and stream `AsyncProductRecommendations` behind null-fallback server `Suspense` so the main page never awaits optional work.
* **Why:** This preserves deterministic stage order and locale/media/rating completeness while holding a non-empty response to exactly three repository queries and avoiding N+1 entity/name/media/rating lookups.

### Fixed-query catalog facets

* **When to use:** Whenever catalog filter metadata, localized option labels/counts, category inheritance, or price bounds change.
* **How:** Keep category-profile resolution separate. Use `CatalogFacetRepository` for one grouped base query (`price`, `brand`, `country`) and at most one grouped wrist/interior profile query. Return compact facet rows; never load `Product`, watch-detail, or interior-detail entities just to aggregate, and never issue one `count` per option. Preserve the established response key/order/source/labels and verify response bytes/fixtures for generic, parent/child wrist, interior, and accessories modes.
* **Why:** Option cardinality can grow without growing SQL count. On the 600-product Step 6 fixture, generic/wrist/interior/accessory metadata changed from 39/108/97/41 logical queries to 1/4/4/3 including category-context reads.

### Shared public product summary projection

* **When to use:** Public catalog cards, quick search rows, cart/favorite refresh, or recommendation cards need current compact product data.
* **How:** Select bounded IDs first, then call `PublicProductSummaryRepository` once. The projection owns locale/RU name fallback, current price/stock/status, main image key, visible active category, brand/collection, and approved rating aggregate. Keep object-key-to-public-URL conversion in `ObjectStorageService`. Do not replace N+1 with a multi-to-many fetch-join Cartesian product.
* **Why:** One purpose-specific projection prevents separate name/media/category/rating queries while keeping public visibility consistent across consumers.

### Bounded cart and favorites refresh

* **When to use:** Refreshing any locally stored public product collection.
* **How:** Send one `POST /api/public/product/batch-summary/{lang}` for a non-empty maximum-60 positive ID list. The backend deduplicates first occurrence and uses one shared summary query. Merge valid summaries without changing quantity/favorite ownership; retain explicit missing snapshots but mark them unavailable. On total failure show the existing retry state and preserve local data. Never issue per-ID fallback requests. Share only simultaneous identical in-flight frontend promises and remove them after settlement so price/stock cannot remain stale.
* **Why:** HTTP and SQL request counts stay constant from 1 through 60 items, while temporary outages do not erase customer state or fabricate a successful refresh.

### Evidence-first performance changes

* **When to use:** Considering a cache, composite index, pagination redesign, or query rewrite.
* **How:** Capture realistic before/after query counts, response bytes, p50/p95/p99, and `EXPLAIN (ANALYZE, BUFFERS)` on a disposable varied dataset. Add indexes only when the plan proves a missing access path. Prefer a small fixed number of fresh queries over high-cardinality caches when invalidation spans status, stock, price, category, brand, details, translations, media, or popularity. Document dataset and SQL-logging limitations and remove all temporary rows/processes/containers.
* **Why:** Tiny databases can make sequential scans correct and can hide cardinality/N+1 failures. Step 6 needed query-shape corrections, but its 600-row plans did not justify a migration or cache.

### Safe API error responses

* **When to use:** For validation, malformed JSON, bad query params, multipart errors, authentication/authorization failure, missing resources, and unexpected exceptions.
* **How:** Route exceptions through `GlobalErrorHandler`, return structured `ApiErrorResponse` with the current `requestId`, and keep 400 malformed/validation, 401 unauthenticated, 403 forbidden, 404 valid lookup absent, and 500 unexpected/persistence failure semantically distinct. Use `ResourceNotFoundException` only for expected absence and log it at INFO without a stack trace; log unexpected failures with full server-side context at ERROR. Never use `printStackTrace()` or expose raw stack traces, SQL, or technical exception messages in API responses.
* **Why:** Clients need stable error shapes and a support correlation key, while stack traces and low-level exception text are noisy and can leak implementation details.

### Rotating server file logs

* **When to use:** For every deployed backend environment and any new backend log category.
* **How:** Keep Logback configuration in `src/main/resources/logback-spring.xml`. Write `application.log`, `error.log`, `security.log`, and `crm-actions.log` under `${APP_LOG_DIR:logs}`; rotate daily and at `${APP_LOG_MAX_FILE_SIZE:50MB}`, retain `${APP_LOG_RETENTION_DAYS:30}` days, and enforce `${APP_LOG_TOTAL_SIZE_CAP:256MB}` per log family. Use `/var/log/vympel` for a managed server or `/app/logs` plus a persistent volume for a backend container.
* **Why:** Runtime logs must survive process restarts, stay bounded, and remain searchable by operational category without becoming Git artifacts.

### Request correlation and safe MDC

* **When to use:** For every backend request, error, storage failure, security event, or CRM/admin action.
* **How:** Let `RequestCorrelationFilter` reuse a bounded safe `X-Request-Id` or generate a UUID, return it in the response, and populate `requestId`, `httpMethod`, and `requestPath` in MDC. `JwtAuthFilter` adds safe `userId` and `roles` context after successful authentication. Do not put tokens, headers, query strings, request bodies, or email addresses in MDC.
* **Why:** One request ID connects the API response with application, error, security, and CRM action logs without leaking payload data.

### Sensitive data masking in logs

* **When to use:** For every new log statement or field that can cross a trust boundary.
* **How:** Log identifiers/counts/statuses instead of bodies. Use `SensitiveDataMasker` for dynamic text/metadata; the `SensitiveDataMaskingLayout` is the final defense for passwords, authorization/Bearer values, JWTs, refresh/access tokens, cookies, database credentials, and MinIO/S3 keys. Never rely on masking as permission to log secrets.
* **Why:** Exception messages and accidental structured values can contain credentials even when normal application code avoids request-body logging.

### CRM product mutations with audit logging

* **When to use:** For any CRM/admin product create, update, archive, quick price, quick stock, status, marketplace link, or image upload mutation.
* **How:** Put validation and persistence in `ProductService`, expose the action through `/api/crm/products/**`, and call `CrmActivityService.log(...)` from the controller with an event type and useful metadata.
* **Why:** Product changes need protected backend validation and a durable audit trail.

### Moderated product reviews

* **When to use:** For public review creation, public review reads, rating summaries, or CRM review actions.
* **How:** Persist reviews in `product_review` as `PENDING` by default. Public review queries and aggregates must always filter `APPROVED`; `REJECTED` and `DELETED` stay hidden. CRM approve/reject/delete actions set `moderatedAt` and `moderatedBy`, use `DELETED` as a soft-delete status, and write CRM activity events.
* **Why:** Moderation, public visibility, rating integrity, and audit history are one lifecycle and must not be implemented as unrelated flags or frontend-only filtering.

### Customer request persistence and processing

* **When to use:** For "Оставить заявку", product question, or other public lead/contact submission flows.
* **How:** Persist requests in `customer_request` with status `NEW`, require at least one contact method in the service and DB check, reject markup characters, cap field lengths in DTOs and columns, keep `source` safe and descriptive, return only `{ id, status }` publicly, and process through protected `/api/crm/requests/**`. `DONE` and `CANCELLED` should set `processedAt`/`processedBy`; `NEW` should clear processing metadata; status/comment/cancel mutations should write CRM activity events.
* **Why:** Public request intake, spam/validation safety, CRM work tracking, and audit history are one contract.

### Batch approved-rating enrichment

* **When to use:** When adding rating summaries to product detail or list DTOs.
* **How:** Query grouped `AVG(rating)`/`COUNT(id)` for the page's product ids with `status=APPROVED`, map projections by product id, and enrich `ProductResponse`/`ProductShortResponse` after normal product mapping. Use `ratingAverage=null` and `ratingCount=0` when no approved row exists.
* **Why:** One grouped query keeps catalog/card responses consistent without creating an N+1 review query per product.

### Product analytics persistence

* **When to use:** When tracking public demand signals such as product views, favorites, or add-to-cart actions.
* **How:** Store behavior events in `product_analytics_event`, not `crm_activity`; validate event type and product id, cap/sanitize metadata, and aggregate through `ProductAnalyticsService` for CRM. Keep public tracking under `/api/public/**` and CRM analytics under protected `/api/crm/**`.
* **Why:** Public popularity signals and CRM staff audit actions have different security, volume, and privacy requirements.

### Promotion recommendations

* **When to use:** When adding product promotion controls or recommendation logic.
* **How:** Use product `promotion_mode`, `promotion_score`, `promoted_until`, and `promotion_updated_at`; recommend only active in-stock products by default; block manual/auto promotion for out-of-stock products unless a future explicit business rule changes that.
* **Why:** Demand support should not surface products customers cannot buy, and promotion must not override public out-of-stock-last ordering.

### CRM multilingual collection persistence

* **When to use:** When creating or reading brand-linked collections for CRM or product DTOs.
* **How:** Store the stable internal code on `collection.code`, keep RU in legacy `collection.name` for compatibility, and store localized name/description in `collection_i18n` with DB language values `ru`, `en`, and `kk`.
* **Why:** Collections are brand-scoped product data but their public/CRM display text needs the same multilingual persistence pattern as other dictionaries.

### CRM user management through protected admin endpoints

* **When to use:** When an admin needs to create users, edit profile fields, change roles, or block/unblock access.
* **How:** Keep endpoints under `/api/crm/users/**`, require `ADMIN` in `SecurityConfig` and `@PreAuthorize`, validate DTOs, hash passwords with `PasswordEncoder`, never return password hashes, use `users.enabled` for blocking, and preserve at least one active admin.
* **Why:** User-management is security-sensitive; frontend route hiding is helpful but backend role enforcement and audit logging are the actual protection.

### Idempotent ADMIN bootstrap

* **When to use:** A fresh environment needs one CRM-capable ADMIN without putting a plaintext or fixed user password in Liquibase.
* **How:** Bind `VYMPEL_BOOTSTRAP_ADMIN_*` through typed `vympel.bootstrap.admin` properties and default disabled in every profile. Validate email/password before repository work; load the active Liquibase-seeded ADMIN role; normalize email; create an enabled user with the existing `PasswordEncoder`; save `user_role` transactionally. Treat an existing ADMIN as a no-write success and an existing non-admin as a hard failure. Force the insert with `saveAndFlush`; catch a case-insensitive unique-email race outside the rolled-back transaction and verify the winner as ADMIN in a fresh read transaction. In staging/production, enable for one controlled deployment only, verify login, disable it, rotate/remove the temporary secret, and redeploy.
* **Why:** Repeated or concurrent starts converge on one admin without password resets, silent privilege escalation, Liquibase credentials, or weakened non-local validation.

### CRM audit service

* **When to use:** When tracking admin/manager actions or future user activity.
* **How:** Use `CrmActivityService` and `crm_activity`; store actor user, role, event type, entity type/id, bounded safe metadata, IP, user-agent, and created time. Keep insert logic centralized in the service. After the audit transaction commits, emit the sanitized actor/action/entity/result line through `CrmActionFileLogger`; failed CRM/admin mutations are recorded by the request filter without logging the body.
* **Why:** The database remains the durable queryable audit trail, while `crm-actions.log` gives operators a rotated server-side stream without falsely reporting rolled-back activity as successful.

### Object storage keys

* **When to use:** When uploading or returning product media.
* **How:** Store S3 object keys in `media.url`; persist stable order in `media.position` and one main image in `media.is_main`; build external links through `ObjectStorageService` using `storage.s3.endpoint` and `storage.s3.bucket`. Validate the full batch before S3 writes. For reorder/main/delete, lock product/images, clear mains and flush, assign distinct temporary positive positions and flush, then assign contiguous `0..n-1` with only index 0 main. ACTIVE cannot lose its final image; DRAFT/ARCHIVED may be image-less. Return safe `ProductImageResponse` fields only.
* **Why:** The database stores storage keys/order/main state, while API responses expose usable links without leaking MinIO credentials or making card selection depend on random row order.

### CMS persistence and media

* **When to use:** When adding editable public content blocks, banner/slider images, or page text managed by CRM.
* **How:** Persist page regions in `cms_page`, `cms_block`, `cms_block_translation`, and `cms_media`; store DB translations as `ru/en/kk`, accepting frontend `kz`. `cms_block.media_id` is default/RU, with optional `media_kz_id`, `media_en_id`, and `mobile_media_id` pointing to the same media table. Use `PUBLIC_PATH` rows for seeded assets and `ObjectStorageService.uploadCmsImage` for every new default/variant upload. Preview blob URLs must be revoked.
* **Why:** CMS content needs durable ordering/status/translation/media metadata while reusing existing storage and keeping the current site populated after migration.

### CMS translation upsert by language

* **When to use:** When creating or updating CMS block translations from CRM.
* **How:** Normalize frontend `kz` to DB `kk`, reject duplicate normalized languages, then merge into the managed `CmsBlock.translations` collection by `(blockId, lang)`. Update existing `CmsBlockTranslation` rows in place, create only missing languages, preserve omitted languages, and clear only fields unsupported by the selected `CmsBlockSchema`.
* **Why:** `cms_block_translation` has unique constraint `uk_cms_block_translation_block_lang`; clearing the collection and adding fresh rows can make Hibernate insert duplicate `(block_id, lang)` rows before deletes flush.

### CMS block-type capabilities

* **When to use:** When adding or changing a CMS block type, editor field, validation rule, or preview.
* **How:** Update CRM `cmsBlockSchemas` and backend `CmsBlockSchema` together. Gate text, image, link, button, alt, JSON, settings, localized-image, and mobile-image fields by capability. CRM must not render or submit unsupported fields; backend must clear unsupported values defensively. Only RU/default text may be required, while optional locales/variants never block saving.
* **Why:** One universal CMS form creates irrelevant inputs, mismatched validation, and stale fields that public components cannot interpret.

### Transactional CMS page ordering

* **When to use:** Creating, editing, deleting, or reordering a CMS block.
* **How:** Lock the owning `cms_page` first, then all page blocks; prohibit implicit cross-page moves. Resolve the requested insertion deterministically, move all rows to unique temporary positive positions, flush, then persist ten-step final positions. Keep `(page_id,sort_order)` unique in PostgreSQL.
* **Why:** Assigning final values directly can collide mid-flush and concurrent editors otherwise create ties or stale overwrites.

### Published-only public CMS reads

* **When to use:** When exposing CMS content to the public storefront.
* **How:** Return only `ACTIVE` pages and `PUBLISHED` blocks from `/api/public/cms/**`; apply fallback per text field rather than treating an empty locale row as complete. Public Next.js callers should use tagged cache entries (`cms`, `cms:{pageKey}`) with a short `revalidate` value, and CRM mutations should refresh those tags through the protected public revalidation route. Resolve image sources by locale and viewport, then fall back to default media/static assets without rendering a broken image.
* **Why:** Draft admin edits should not leak publicly, and incomplete translations should degrade gracefully instead of breaking pages.

### CMS cache refresh and media versioning

* **When to use:** When changing public CMS rendering, cache behavior, image media, or CRM CMS mutation responses.
* **How:** Keep the backend public endpoint short-cacheable, not permanently static. Include page/block `updatedAt` and media `createdAt` in CMS DTOs; append those timestamps as image URL versions in public helpers. Store a page-key-deduplicated `cms_revalidation_job` in the same transaction as every create/update/delete/reorder/publish/unpublish, but deliver it only after commit. Sign `version + timestamp + requestId + pageKey` with HMAC-SHA256, accept only the five known page keys, bound body/time/replay state, and expire only `cms:{pageKey}` plus mapped routes. Return `contentSaved` independently from explicit refresh status so retry-scheduled/not-configured/permanent failure is a warning, never a false content failure.
* **Why:** CMS content needs both speed and freshness. The outbox closes the commit-to-delivery crash window, targeted invalidation prevents arbitrary purge abuse, versioned image URLs prevent stale browser/CDN media, and partial-success feedback keeps admins accurately informed.

### CMS reusable-media reference safety

* **When to use:** Whenever CMS media is attached, replaced, detached, diagnosed, or considered for deletion.
* **How:** Treat `cms_media` as reusable. Count and enumerate all six slots: `media_id`, `media_kz_id`, `media_en_id`, `mobile_media_id`, `mobile_media_kz_id`, and `mobile_media_en_id`. A reference in any draft or published block protects the row. Lock before attach/claim/complete, reject `DELETE_PENDING` attachment, and let attaching a failed/candidate row restore it to `ACTIVE`. Never expose internal object keys in media/reference DTOs.
* **Why:** Missing one locale/device slot or checking only public blocks can delete an asset that an editor still owns.

### CMS orphan cleanup state machine

* **When to use:** For upload-without-save leaks, media replacement, block deletion, storage reconciliation, or scheduled garbage collection.
* **How:** Uploads start `ACTIVE`; after a block transaction commits, mark newly zero-reference rows with `orphanedAt`. Dry-run and cleanup consider only unprotected `OBJECT_STORAGE` rows past the configured grace period. Each bounded worker claim uses a row lock and rechecks references/grace/retry/stale-claim state before `DELETE_PENDING`. Delete the storage object first; only then delete the DB row. On storage failure keep `DELETE_FAILED`, error code, attempt timestamps/count, and exponential backoff. Recover stale pending claims after a crash. `PUBLIC_PATH` and `cleanupProtected` rows are never candidates.
* **Why:** Database and object storage cannot commit atomically. The explicit lifecycle makes failures observable/retryable and avoids both live-asset deletion and a DB row that falsely points to an already-retired object.

### CMS cleanup and revalidation multi-instance workers

* **When to use:** When deploying more than one backend instance or changing either scheduled worker.
* **How:** Keep schedule-local overlap guards as an optimization, but rely on database row locks, lifecycle/job statuses, unique page keys, claim timestamps, and stale-claim recovery for correctness. Bound polling, batch sizes, HTTP/S3 timeouts, attempts, and backoff. Log request/page/media identifiers, attempts, outcome, and latency without secrets or object keys.
* **Why:** In-memory locks do not coordinate replicas and disappear on process failure; durable claims provide deterministic recovery.

### Catalog category profiles

* **When to use:** When adding catalog filters, search behavior, product detail blocks, or CRM product forms for category-dependent products.
* **How:** Use `CatalogCategoryProfileService` as the backend source of category behavior. `WATCH_CLASSIC`, `WATCH_SPORT`, `WATCH_DIVER`, `WATCH_CHRONOGRAPH`, and `WATCH_KIDS` inherit wristwatch filters/details from `WATCH_WRIST`; interior clocks use `interior_clock_details`; accessories must not expose wristwatch-only filters or require `watchDetails`.
* **Why:** Product categories share UI and data rules through inheritance, but accessories and interior clocks have different characteristic sets.

### Catalog filter source mapping

* **When to use:** When adding, fixing, or debugging public catalog filter metadata or filtered product results.
* **How:** Map each filter key to the table that owns it before writing a `Specification`: base product fields such as price/brand come from `Product` with source `product`, wristwatch characteristic filter options must be generated from distinct values actually present in `watch_details` with source `watch_details`, wristwatch filtering/counts must join through `watch_details.product_id`, interior-clock characteristic options/counts must come from actual `interior_clock_details` rows with source `interior_clock_details`, and the single public `country` filter joins through `Product -> Brand -> brand_country -> Country` with source `brand_country`. Counts must use the same source mapping as product filtering.
* **Why:** Related characteristics are not columns on `Product`; counting or filtering them as direct product fields returns zero counts or incorrect results.

### Catalog selected filter normalization

* **When to use:** When changing public catalog product listing, filter URL parsing, or backend catalog specifications.
* **How:** Product filtering must apply only explicitly selected filters. Empty arrays, missing keys, `null`, `undefined`, `[]`, blank strings, filter metadata, and removed country aliases (`brandCountry`, `manufacturerCountry`, `countryOfBrand`) must be ignored. `priceMin`/`priceMax` are canonical, while `minPrice`/`maxPrice` may be normalized as aliases. Build related-table specifications only after values parse successfully; `watch_details` and `interior_clock_details` subqueries must be added only for selected detail filter keys.
* **Why:** Metadata describes available filters, not active filters. Treating every possible key as selected removes products that do not have every detail row/characteristic and can make the catalog look empty.

### Public product availability ordering

* **When to use:** When changing any public product list endpoint, selected sort mapping, catalog/category/brand/search listing, or pagination behavior.
* **How:** Keep in-stock-first ordering in the backend through `PublicProductQueryService`: order by a computed availability bucket first (`status == ACTIVE` and `stockQuantity > 0`), then by the selected sort field/direction, then by a stable id fallback. Apply this before pagination. Do not sort by raw `stockQuantity` and do not patch this as frontend-only sorting.
* **Why:** Out-of-stock products must be visible but always after available products, and pagination must not show unavailable products before available products that exist later in the full result set.

### Public quick product search

* **When to use:** When the public header needs quick product rows while the user types.
* **How:** Keep the endpoint under `/api/public/product/search/quick/{lang}`. Normalize `q` with the same selected-value rules as catalog filtering, return `[]` for blank/placeholders/one-character queries, cap `limit` to 8, reuse the catalog search specification and public active-product query service, then map only compact display fields into `ProductQuickSearchResponse`.
* **Why:** Quick search should stay consistent with full catalog search, avoid full-catalog payloads on short input, and remain product-only.

## Fullstack Integration Patterns

### API contract first

* **When to use:** When frontend depends on backend DTOs, routes, schemas, or response shapes.
* **How:** Update the backend contract first, then update frontend API client/types/hooks/components.
* **Why:** Prevents mismatch between request/response shapes.

### Safe 429 cooldown contract

* **When to use:** A public or CRM interaction can be rejected by an abuse policy.
* **How:** Backend returns a correlated safe 429 with both `Retry-After` and `retryAfterSeconds`. Clients prefer the bounded body value, fall back to header seconds/HTTP-date, preserve user input, disable the relevant action for the countdown, localize the state, and never retry writes or credentials automatically.
* **Why:** Makes throttling understandable without amplifying traffic, losing form work, or exposing internal bucket details.

### Product recommendation contract

* **When to use:** Whenever product-detail alternatives, ranking inputs, candidate accessibility, or recommendation card fields change.
* **How:** Update `ProductRecommendationResponse`, `ProductRecommendationRepository`, `ProductRecommendationService`, the public controller route, frontend endpoint/controller/type, `ProductRecommendations`, backend/frontend regression tests, and REC-001 audit docs together. Preserve stages 1-7, active-category plus localized/RU-name accessibility, current/duplicate exclusion, global in-stock fallback before stage-7 out-of-stock, limit 12, server-side logging, and complete-section omission on empty/failure.
* **Why:** Recommendation behavior spans SQL ranking, public access rules, localization/media/rating hydration, API typing, server rendering, and an absolute customer-visible silence rule.

### CMS contract first

* **When to use:** When making a public page region editable from CRM.
* **How:** Update Liquibase, Java entity/service/schema/DTO/controller, CRM types/editor schema/preview, public TypeScript types/source selection, cache tags/revalidation, image versioning, and page rendering together. Protect `/api/crm/cms/**` as ADMIN-only and keep `/api/public/cms/**` read-only.
* **Why:** CMS spans persistence, storage, security, public rendering, CRM editing, localization, and seeded defaults; changing only one side creates blank pages or uneditable content.

### Public review and CRM moderation contract

* **When to use:** Whenever review fields, statuses, rating summaries, or moderation actions change.
* **How:** Update the Liquibase table/constraints, JPA entity/repository/service, public create/approved-list DTOs, product detail/card DTO aggregates, protected CRM DTO/controller routes, public TypeScript API/types/components, CRM client/types/page, all three locale sets, tests, and project docs together. Guest POST remains public; every `/api/crm/reviews/**` route remains ADMIN/MANAGER protected.
* **Why:** A review crosses persistence, public visibility, product-card aggregates, security, moderation UI, and localization; changing only one surface silently corrupts the lifecycle.

### Public request and CRM processing contract

* **When to use:** Whenever request fields, statuses, submission triggers, or CRM processing actions change.
* **How:** Update the Liquibase table/constraints, `CustomerRequest` entity/repository/service, public create DTO/controller, CRM DTO/controller routes, public endpoint builders/API types/dialog UI, CRM client/types/page, RU/KZ/EN public and CRM locale sets, validation/security rules, tests, and docs together. Public POST remains unauthenticated and minimal; every `/api/crm/requests/**` route remains ADMIN/MANAGER protected.
* **Why:** A request crosses public UX, persistence, validation, source attribution, security, CRM operations, audit logging, and localization.

### Product-only quick search contract

* **When to use:** When implementing or changing the shared smart search overlay.
* **How:** Backend returns `ProductQuickSearchResponse` from `/api/public/product/search/quick/{lang}`; frontend mirrors it as `IQuickSearchProduct`, fetches through `PublicApiController.getQuickSearchProducts`, renders only compact product rows/states in `SmartSearch`, and submits full searches through `routes.searchCatalog(query)`.
* **Why:** The approved VYMPEL quick search is a product lookup surface. Query suggestions, category recommendations, and filter carry-over belong outside this overlay.

### Manual DTO mirror

* **When to use:** Whenever changing Java DTOs returned by public endpoints.
* **How:** Update Java DTO classes under `vympel_back/src/main/java/com/shop/vympel/dtos`, then update TypeScript interfaces under `vympel_front/src/api/types`.
* **Why:** There is no generated shared API client, so mismatches are easy to introduce silently.

### Product marketplace links contract

* **When to use:** Whenever product DTOs, forms, or product data displays change.
* **How:** Treat `kaspiUrl` and `wildberriesUrl` as first-class optional product fields. Persist them in `product.kaspi_url` and `product.wildberries_url`, return them in public and CRM product DTOs, mirror them in frontend TypeScript types, and validate optional values as http/https URLs on both frontend and backend.
* **Why:** Marketplace links are now part of the product contract and must not disappear between backend, CRM, and public storefront data.

### CRM bulk creation contract

* **When to use:** When adding or changing marketplace-style product batch creation.
* **How:** Keep the backend endpoint as `POST /api/crm/products/bulk`, with `categoryId`, shared `common` fields, and `rows`. Compose each row into `ProductCreateRequest` and delegate to the existing product creation service so SKU generation, names/descriptions, category links, and detail validation stay centralized. Return `createdCount`, `failedCount`, created ids/SKUs, and row-level errors.
* **Why:** Batch creation must not fork product persistence rules or silently fail an entire batch for one bad row.

### Product popularity analytics contract

* **When to use:** When CRM needs demand analytics or promotion recommendations.
* **How:** Public frontend sends `VIEW`, `FAVORITE`/`UNFAVORITE`, `ADD_TO_CART`, and `REMOVE_FROM_CART` events to `POST /api/public/analytics/products/events`; CRM reads `GET /api/crm/analytics/products/popularity?period=&lang=` and toggles promotion through `PATCH /api/crm/analytics/products/{id}/promotion`.
* **Why:** Public interaction events, protected aggregation, and promotion controls cross backend, public frontend, CRM types, CRM routes, and docs.

### CRM auth contract

* **When to use:** When adding CRM routes or backend endpoints.
* **How:** Keep `/api/crm/auth/login`, `/refresh`, and `/logout` public at the security-filter level, but require trusted Origin/Referer for cookie-authenticated refresh/logout. Login requires an enabled `ADMIN` or `MANAGER`; access JWT parsing requires issuer/audience/type/jti/iat/exp; `JwtAuthFilter` reloads current database roles. Protect other `/api/crm/**` endpoints with backend roles and render CRM pages through `ProtectedShell`.
* **Why:** CRM security must exist on both frontend routes and backend endpoints; frontend redirects alone are not protection.

### CRM optional text search branching

* **When to use:** When adding optional CRM text search over products, users, or other tables.
* **How:** Trim search in the service layer, route null/blank search to a non-search repository method, and call a separate type-safe search query only for nonblank text. Avoid `:search is null or lower(...) like ...` for PostgreSQL text search.
* **Why:** Nullable parameters inside JPQL text expressions can be bound ambiguously and PostgreSQL may infer `bytea`, causing errors like `function lower(bytea) does not exist`.

### CRM optional date filter branching

* **When to use:** When adding optional date filters to PostgreSQL-backed JPQL/native queries, especially analytics aggregates.
* **How:** Branch before the query: call a no-date repository method when the filter is absent, and call a separate `createdAt >= :since` method when the filter is present. Do not leave `:since is null or field >= :since` in SQL/JPQL joins.
* **Why:** PostgreSQL can fail with `could not determine data type of parameter $N` for nullable untyped timestamp parameters.

### CRM user-management contract

* **When to use:** Whenever CRM user-management backend fields or UI changes.
* **How:** Mirror Java DTOs in `vympel_crm/src/shared/api/types.ts`, update `crmApi` methods, keep UI strings in `messages.ts`, expose users pages only through `ProtectedShell adminOnly`, and keep backend `/api/crm/users/**` ADMIN-only.
* **Why:** User-management changes span DTOs, security, audit events, and frontend route visibility.

### CRM product photo upload contract

* **When to use:** Whenever product photo upload, previews, or media response handling changes in the CRM.
* **How:** Upload files with multipart `files` to `POST /api/crm/products/{id}/images?lang=`, return `ProductResponse` with refreshed `images`, validate the same supported MIME types/10 MB limit on both sides, and keep the frontend API client using `FormData` without setting a JSON `Content-Type`.
* **Why:** Product media already lives in MinIO/S3 through `ObjectStorageService`; duplicating upload/storage logic or inventing a second media DTO would create contract drift.

### CRM reference option labels

* **When to use:** When rendering CRM product selects for backend dictionaries such as mechanism, gender, material, glass type, stone inlay, brand, or collection.
* **How:** Treat `id` as the submitted value, keep `code` as a stable internal identifier, and render a localized/readable `name`. For product characteristics, CRM currently displays Russian names even when the UI locale differs; backend references and frontend `messages.ru.products.characteristicLabels` both protect against raw enum display.
* **Why:** Admins should see readable labels like `Механический` or `Минеральное`, while backend IDs/codes remain stable for persistence and SKU generation.

### Public API base URL includes prefix

* **When to use:** When adding frontend public API endpoints.
* **How:** Keep `BASE_API_PUBLIC` and `NEXT_PUBLIC_BASE_API_PUBLIC` pointed at the backend `/api/public` base, then endpoint builders should append only the rest of the public path.
* **Why:** Existing frontend methods construct URLs as `base + endpointPath`.

### Category-specific product details

* **When to use:** When changing product create/edit/read flows across backend, CRM, and public product pages.
* **How:** Backend `ProductServiceImpl` validates and persists only the detail block allowed by the category profile, rejects mismatched detail payloads, and blocks cross-profile category edits unless a migration path is implemented. CRM `ProductForm` should start creation with category selection, show and submit `watchDetails` only for wristwatch profiles, `interiorClockDetails` only for interior clocks, and no wristwatch-only fields for accessories. Public product DTO/type mirrors must include nullable detail blocks.
* **Why:** A single generic product form can serve multiple product families only if category-specific detail contracts stay aligned on both sides.

### Public catalog filter/search contract

* **When to use:** When changing public catalog listing, search, sort, or filters.
* **How:** Keep `/api/public/product/catalog/{lang}`, `/api/public/product/filters/{lang}`, and `/api/public/category/all/{lang}` in sync with `IProductListParams`, `ICatalogFiltersResponse`, and `ICategory`. Metadata includes backend-owned `source` values and counts; frontend must not fake counts. Search is global when no category is supplied, resets filters on submit, and can use backend fuzzy matching through `pg_trgm`. Category selector state should use `categoryCode` in the catalog URL and clear stale filter params. Frontend catalog requests should pass query params through `catalogFilterParams.ts` so blank/null/undefined values and removed aliases are not sent as active filters.
* **Why:** The public UI must preserve reloadable filter state while backend remains responsible for product matching, counts, and category-specific options.

### Brand page catalog/search behavior

* **When to use:** When changing brand pages, brand dropdown links, catalog links from brand pages, or header search.
* **How:** Brand page catalog links should use `/catalog?brand={backendBrandId}&page=1` when the id can be resolved from catalog filter metadata. Header search from a brand page must keep using the global catalog search route with only `search` and `page=1`, clearing brand state unless a future scoped-search feature is explicitly designed.
* **Why:** Brand navigation is a route/copy concern, while product filtering belongs to the existing catalog query contract.

### Canonical public brand inventory and locale copy

* **When to use:** When changing `/brands`, brand filter counts, or static brand description/history copy.
* **How:** Build the all-brands route from `PUBLIC_BRANDS` in registry order and join matching backend filter metadata only for counts. A disabled option means zero matching catalog products, not a disabled public brand route. When metadata is unavailable, keep every brand and omit counts. Keep brand description/history as explicit RU/KZ/EN translations of the approved source copy, select current locale first, then deliberately fall back to RU; never copy the RU value into every locale field.
* **Why:** Catalog filter availability and public brand discoverability are different contracts, and fake locale entries make navigation appear translated while leaving stale Russian content.

### Locale contract verification

* **When to use:** Before changing locale-sensitive API calls, backend language enum values, or frontend locale values.
* **How:** Verify `vympel_back` `Language` enum, Liquibase language checks, and `vympel_front/src/i18n/routing.ts` together.
* **Why:** Frontend uses `kz`; backend `Language.KZ` stores `kk` and accepts both `kk` and `kz`, while database checks use `kk`.

## Figma / UI Implementation Patterns

### Pixel-perfect Figma implementation

* **When to use:** When a Figma design, screenshot, exported frame, or visual reference is provided.
* **How:** Study the design first, extract spacing/colors/typography/radius/shadows/assets, implement carefully, then compare the result against the reference.
* **Why:** Prevents "similar but different" layouts and keeps frontend implementation aligned with the approved design.

### About page Figma layout

* **When to use:** When changing `/about`, `AboutPage`, or the About Instagram slider.
* **How:** Preserve the Figma structure from node `263:3266`: standard navigation, full-width `about-us-banner.png`, 68px desktop content gutters, 120px section rhythm, two-column intro, four numbered company cards, Instagram carousel using existing `Carousel`/`CarouselDots`, shared cooperation `ContactBanner`, existing `MarketPlaces`, and footer. Keep About spacing/sizing in `.about-*` globals rather than arbitrary Tailwind values in TSX.
* **Why:** The page is asset- and rhythm-driven; reusing global tokens and existing shared sections keeps it close to the design while staying maintainable.

### Existing visual system first

* **When to use:** When implementing UI without a new external design reference.
* **How:** Reuse `globals.css` tokens, existing shared components, public assets, and custom icon components before inventing new visual language.
* **Why:** The current catalog UI is already built around a restrained neutral palette, large product imagery, and reusable section/card primitives.

### Public brand page layout

* **When to use:** When changing `/brands/[brandSlug]`, `BrandPage`, brand navigation, or brand banner/product sections.
* **How:** Use `Navigation`, `Text`, `Heading`, existing `GoodCard` through the client `BrandProductsGrid`, and `--spacing-brand-*`/`--leading-brand-copy` globals. Keep breadcrumbs at 20/300, title uppercase 64px centered, description 18px/33px centered, brand banner at responsive 573px, history title 24px, catalog link 20/500 with `ArrowRight`, `Новинки` as Judson 34px, product cards at 270px with 67px/44px gaps, and catalog banner at responsive 487px.
* **Why:** Brand pages are reference-driven and should align with the task screenshots without duplicating product card or navigation behavior.
* **Mobile rule:** Brand titles must use `.brand-page-title` or an equivalent viewport-safe rule so long uppercase names never overflow or create horizontal scroll. Mobile brand banners must stay full-width/almost full-width and visually tall; do not return to contained thumbnail-strip banners.

### Brand banner asset mapping

* **When to use:** When adding brand images or debugging missing brand banners.
* **How:** Map public assets in `brandPages.ts` rather than inline JSX. Current mappings follow `{Brand}_brand_banner` and `{Brand}_catalog_banner` where assets exist; `Rhythm` and `Royal_london` currently fall back to their brand banners because matching catalog banner files are missing.
* **Why:** Centralized mapping keeps missing assets from breaking builds and makes the fallback explicit.

### CRM admin visual system

* **When to use:** When adding or changing CRM screens.
* **How:** Use `vympel_crm/src/app/globals.css` `--crm-*` tokens, local `Text`, `Heading`, `Button`, and `Field` primitives, white/near-black neutral surfaces, compact table/form typography, and dashboard density inspired by the storefront. Add reusable CRM values to tokens before using them in components.
* **Why:** CRM should feel like Vympel but remain a practical admin tool, not a random external admin template.

### CRM CMS editor with preview

* **When to use:** When adding or changing editable CMS block types or fields.
* **How:** Keep `/cms` admin-only and RHF-backed. Read field visibility from `cmsBlockSchemas`: blocks without text show no title/subtitle/description inputs; non-image/non-link types hide those groups. Show only the default image initially, then reveal optional KZ/EN/mobile uploads from a localized toggle. Each slot uses the existing multipart upload, preview, and remove flow. Preview must follow the current block type/CRM locale and offer desktop/mobile mode when a mobile variant exists.
* **Why:** Admins need to see what each block will look like before publishing, and CMS editing should stay inside the existing CRM visual system.

### Product detail Figma layout

* **When to use:** When changing `src/screens/ProductPage` or `src/components/ProductPage`.
* **How:** Preserve the Figma/task structure: hero with rounded controls, localized search-only toolbar, localized breadcrumbs, 181x181 desktop thumbnails, a 475x502 desktop clickable main image with localized zoom dialog, right summary block, five localized info tabs including reviews, description/specs two-column layout, related products, and localized dark contact CTA.
* **Why:** The approved product page design depends on exact image proportions, vertical rhythm, and the gallery-summary relationship.

### Product details tabs task tokens

* **When to use:** When changing `ProductInfoTabs`, `ProductDescription`, `ProductSpecs`, or `ProductReviews`.
* **How:** Keep tab labels as `Text as="span"` with `bodyXl`/regular/primary/`leading-none`, use `gap-product-tabs-gap` as the responsive minimum gap for the five-tab row, use desktop `justify-between` to distribute extra width, use `gap-product-tab-underline-gap` for the 50px text-to-underline distance, and keep the active underline as a 4px `border-product-tab-underline` element whose width comes from the shrink-wrapped tab text on the shared bottom divider. Description text and spec values use `bodyLg`/light/primary/`leading-none`; spec labels use `bodyLg`/medium/primary/`leading-none`; spec rows use `gap-product-spec-row`; bottom links use `bodyLg`/medium/`productSecondary` with `mt-product-details-links-offset`, and the two description bottom links use `--spacing-product-description-link-gap: 50px` on desktop. Warranty, delivery, and order/payment tabs must render localized info blocks with 20px body text, 30px paragraph gaps, 40px top margin before the arrow link, and `routes.guarantee()` / `routes.delivery()` / `routes.payment()` via the project `Подробнее` + arrow style.
* **Why:** The product details tabs design is token-driven, and using full-width active underlines, arbitrary text sizes, raw hex colors, raw labels, or the old four-tab-only 225px spacing breaks the current five-tab task contract.

### Product reviews inside product tabs

* **When to use:** When changing public product reviews, rating summary, or product detail tab behavior.
* **How:** Keep `ProductReviews` rendered only from `ProductInfoTabs` as the fifth Reviews tab. Pass the first approved review page from `ProductPage` into the tabs; do not render a second reviews section below the tabs. Keep the existing RHF rating/text form, localized validation/state copy, toasts, approved-only list, and moderation hint. Put compact localized rating/text/sort controls above the review list, fetch subsequent pages client-side with abort handling, reset page to 1 when controls change, and scroll only to the review list top on review page changes. On desktop, make only the left summary/form block sticky with `lg:sticky lg:top-product-review-sticky-top lg:self-start`; the grid must remain `overflow-visible` with `lg:items-start`, otherwise sticky can fail because stretched grid items leave no sticky travel distance. Below `lg`, keep the reviews tab stacked and static so it does not overlap cards or create horizontal overflow.
* **Why:** Reviews are part of the product-detail tab interaction now; duplicating the block outside tabs confuses the layout, and desktop sticky behavior should help long review lists without hurting mobile usability.

### Connect banner task tokens

* **When to use:** When changing `ContactBanner` or the product-page contact CTA.
* **How:** Use `/contact_banner.png` through `next/image` with `object-cover`, localized title/button/side text, `Heading` for the title, `Text` for CTA and side copy, and `Button variant="connectBanner" size="connectBanner"` for the CTA. Keep task spacing in `globals.css` as `--spacing-connect-banner-*`, colors as `--color-connect-*`, and preserve localized newlines in banner titles so desktop wraps according to the design.
* **Why:** The banner has unusually specific paddings and button dimensions; keeping them as named tokens prevents one-off Tailwind values and keeps future product-page QA measurable.

### Product page search-only toolbar

* **When to use:** When editing the product detail hero toolbar.
* **How:** Keep filters and sorting out of the product page toolbar. Use `ProductSearchForm variant="product"`, which delegates to shared `SmartSearch`, keeps the 500px inline form, 24x24 search icon, 90x34 dark submit button, localized labels, `text-2xs` input/button text, merged active dropdown, quick product results, and catalog redirect behavior.
* **Why:** The product detail UI correction task explicitly prioritizes search as the only toolbar control.

### Zoomable product gallery

* **When to use:** When product images should be inspected in detail.
* **How:** Sort structured product images with `isMain` first and `sortOrder`/id as the stable fallback. Use the local shadcn/Embla `Carousel` for the main product slider with `loop` enabled when multiple images exist, and keep one selected index as the source of truth for the main carousel, active thumbnail, desktop thumbnail window, mobile thumbnail rail, and lightbox. Render only carousel slides in the constrained main frame; never map every product image into full-size page-flow media. Desktop thumbnails should be moderately large, vertical, height-bounded to the main image, dark/project-accent active instead of red, and scroll/window by two items near the rail edges. Render up/down thumbnail controls only when the thumbnail count exceeds the visible rail. Mobile thumbnails should become a small horizontal scroll rail below the single large carousel image. The main carousel and fullscreen dialog both support previous/next browsing, looping, Escape/backdrop/close button dismissal, and Embla swipe where practical. A missing or broken URL must render `ProductImageFallback` at the same dimensions instead of fake artwork, and the no-photo state must not open the lightbox.
* **Why:** The gallery follows saved order, cards and detail start from the explicit main image, thumbnails never overflow the hero area, slider/lightbox state stays synchronized, and broken media does not collapse layout or leak a browser broken-image icon.

## Common Mistakes - DO NOT REPEAT

### Letting Java negotiate h2c with the local Next.js revalidation webhook

* **What happened:** A signed CRM CMS mutation saved successfully but returned `FAILED_RETRY_SCHEDULED`; Java reported `HTTP/1.1 header parser received no bytes` even though signed host requests and container DNS/HTTP reachability succeeded.
* **Root cause:** Java `HttpClient` attempted its default clear-text HTTP/2 upgrade against the internal Next.js HTTP endpoint, which closed the connection before response headers.
* **Fix:** Force `HttpClient.Version.HTTP_1_1` in `PublicCmsCacheInvalidationService` and log only the safe exception type/message before scheduling a retry.
* **How to avoid:** For internal plain-HTTP Next.js webhooks, test the real container-to-container signed request and pin HTTP/1.1; a host-only request does not prove the Java client path.

### Starting a named log volume as a non-root backend user

* **What happened:** The non-root backend image could not create rolling log files on a newly created named volume.
* **Root cause:** Docker initialized the mounted volume as root while the application runs as UID 10001.
* **Fix:** Run the finite `backend-logs-init` service as root to chown only `/app/logs`, then require its successful completion before backend startup.
* **How to avoid:** Any writable named volume mounted into a non-root image needs an explicit bounded ownership initializer or pre-provisioned permissions.

### Treating container and browser URLs as interchangeable

* **What happened:** Internal service URLs and browser-visible media links could point at the wrong host or port.
* **Root cause:** `localhost` means the current container inside Docker, while Compose service names are not resolvable by the host browser.
* **Fix:** Use service DNS/internal ports for backend dependencies (`postgres`, `redis`, `minio`, `public`) and published localhost ports for browser API/media URLs. `storage.s3.endpoint` and `storage.s3.public-endpoint` are separate contracts.
* **How to avoid:** Classify every URL as container-to-container, host-to-container, or browser-to-container before writing Compose or frontend build arguments.

### Assuming a checked-in npm lockfile is clean-installable on Linux

* **What happened:** Docker `npm ci` failed even though developer `node_modules` existed locally.
* **Root cause:** The committed lockfiles were inconsistent with their manifests/platform-resolved dependency graph.
* **Fix:** Regenerate the lockfile from the current manifest, verify `npm ci --dry-run`, then prove a clean Linux Docker build. Never copy host `node_modules` into an image.
* **How to avoid:** Treat `npm ci` in an empty environment as the lockfile contract; local incremental installs are not equivalent evidence.

### Using the generic category catalog as product recommendations

* **What happened:** The product page fetched newest products only from the source category, then showed visible empty/error/retry UI when rare categories had no alternative.
* **Root cause:** Recommendation fallback and accessibility rules were composed in the frontend instead of owned by a bounded backend contract.
* **Fix:** Use `GET /api/public/product/{lang}/{id}/recommendations`, the seven-stage backend ranking, and `ProductRecommendations`, which returns `null` for empty/failure results.
* **How to avoid:** Never call `getProductsList` to implement the product-detail recommendation rail, and never use `states.similar.empty*` / `states.similar.error*` or retry controls on that surface. Keep tests proving full wrapper omission.

### Blocking normal dialog outside-click close or causing page shift

* **What happened:** Ordinary popup forms could feel stuck, and opening a dialog could shift the page horizontally when scroll lock changed the scrollbar width.
* **Root cause:** Custom overlay/scroll-lock behavior was used where the Radix/shadcn Dialog primitive already provides outside-click, Escape, content-click containment, focus handling, and close-button behavior.
* **Fix:** Use `src/components/ui/dialog.tsx` for ordinary public form dialogs and keep global `html { scrollbar-gutter: stable; }`. Do not add negative margins or prevent `onInteractOutside` unless the dialog is intentionally destructive.
* **How to avoid:** Normal popups/forms should close on outside click and Escape; destructive confirmations can use `AlertDialog` and explicit cancel/confirm actions.

### Request CTAs bypassing DB and CRM

* **What happened:** A public "Оставить заявку" or question CTA could redirect out to WhatsApp or stay as a visual-only button, leaving no durable request for staff to process.
* **Root cause:** The CTA was treated as navigation instead of a fullstack request lifecycle.
* **Fix:** Submit through `POST /api/public/requests`, persist `customer_request` with status `NEW`, pass a descriptive source value, and process in CRM `/requests` through protected status/comment/cancel endpoints with localized loading/success/error states.
* **How to avoid:** Any future request/lead form must update public API/types/UI, backend DTO/entity/service/controller/migration, CRM API/types/page, localization, security, and docs together.

### Trusting client-provided page size

* **What happened:** Public and CRM pageable endpoints accepted arbitrary `size` values.
* **Root cause:** Controllers passed Spring `Pageable` directly into services without a project cap.
* **Fix:** Use `PageableUtils.cap(...)` at the controller boundary; public product list/catalog reads cap to 60, and CRM product/review/user/activity reads cap to 100.
* **How to avoid:** Every new pageable endpoint must choose an explicit max size before it reaches repository queries.

### MIME-only upload validation

* **What happened:** Product/CMS uploads trusted MIME type and original filenames too much.
* **Root cause:** Upload validation did not require matching extensions, did not cap product batch count, and used original filenames in object keys.
* **Fix:** Validate MIME plus extension, enforce 10 MB per file and 10 files per product upload, generate UUID object keys, and keep original names only as sanitized metadata.
* **How to avoid:** Treat frontend validation as UX only. Server-side `ObjectStorageService` is the authoritative upload gate for all admin/CRM/CMS media.

### Frontend upload limit larger than Spring multipart limit

* **What happened:** CRM and `ObjectStorageService` accepted 10 MB images, but Spring multipart configuration still used its smaller framework default, so ordinary photos could be rejected before the controller/storage service ran.
* **Root cause:** File limits were aligned only in frontend validation and service code, not at the HTTP multipart parser.
* **Fix:** Set `spring.servlet.multipart.max-file-size` to `VYMPEL_MULTIPART_MAX_FILE_SIZE` (10 MB default) and `max-request-size` to `VYMPEL_MULTIPART_MAX_REQUEST_SIZE` (101 MB default), while keeping controller `consumes = multipart/form-data`.
* **How to avoid:** Any upload-limit change must be updated in CRM validation, `ObjectStorageService`, Spring multipart configuration, and environment documentation together.

### Printing backend stack traces

* **What happened:** Unexpected API errors could call `printStackTrace()`.
* **Root cause:** Error handling mixed local debugging with API response behavior.
* **Fix:** Use `GlobalErrorHandler` with structured `ApiErrorResponse`, log unexpected failures through SLF4J, and return generic internal-error text to clients.
* **How to avoid:** Never add `printStackTrace()` in controllers/services. Use `log.warn` or `log.error` with useful context and keep response messages stable.

### Logging secrets or raw HTTP payloads

* **What happened:** Request bodies, authorization headers, JWTs, passwords, refresh tokens, and storage/database credentials can enter logs through convenient debugging statements or exception text.
* **Root cause:** Dynamic values were treated as harmless diagnostic context, and masking was assumed to replace field selection.
* **Fix:** Log only safe identifiers, counts, statuses, action/entity context, and request IDs; route formatted output through `SensitiveDataMaskingLayout`.
* **How to avoid:** Never log raw request/response bodies, query strings, headers, tokens, secrets, or password-bearing DTOs. Run the masking tests and a generated-log secret grep after logging changes.

### Bypassing controlled logging with console output

* **What happened:** `EntityReferenceMapper` contained raw `System.out.println` calls, which bypassed levels, request context, file routing, rotation, and masking.
* **Root cause:** Local debugging output was left in a production mapping path.
* **Fix:** Remove raw console calls; use SLF4J only when the event is operationally useful and safe.
* **How to avoid:** Search backend source for `System.out`, `System.err`, and `printStackTrace` before finishing observability work.

### Returning errors without a correlation key

* **What happened:** Security/JWT and controller-advice errors used different JSON shapes and could not always be matched to one server request.
* **Root cause:** JWT rejection wrote an ad hoc response outside `GlobalErrorHandler`, and no outer filter owned a request ID.
* **Fix:** `RequestCorrelationFilter` owns `X-Request-Id`; `GlobalErrorHandler.writeSecurityError` and every `ApiErrorResponse` reuse it.
* **How to avoid:** New filters/entry points must use the shared safe error writer and must never invent a second error JSON format.

### Rendering suggestions or categories in header quick search

* **What happened:** The reference screenshot includes query suggestions and category lists, but this project task explicitly asked not to show them.
* **Root cause:** Copying the whole marketplace reference pattern would conflict with the VYMPEL requirement.
* **Fix:** Keep `SmartSearch` product-only: empty/loading/no-results/error states, compact product rows, and a show-all catalog action.
* **How to avoid:** Before editing smart search, verify whether the task allows suggestions/categories. For the current VYMPEL overlay, do not add suggested queries, recommended categories, or category panels.

### Separating smart search input from its dropdown

* **What happened:** A margin between the active input and dropdown made the search feel like two unrelated pieces, and the header row could still show sibling items around the active search.
* **Root cause:** The dropdown was offset below the input, and active search positioning only widened the search box instead of covering the containing row.
* **Fix:** Use shared `SmartSearch` variants with a stable host-owned overlay root, a centered visible frame capped at 66%/760px for home and 70%/760px for catalog/product, a `bg-primary-bg` mask, zero dropdown offset, bottom border removed from the active input, and top border removed from the dropdown.
* **How to avoid:** Never add `mt-*` spacing between active search input and panel. Let the root cover and mask its own row, but keep the visible desktop search surface centered, bounded, and directly connected to its panel.

### Reintroducing manual form state after RHF migration

* **What happened:** Earlier public/CRM forms mixed local `useState` input values with submit handlers.
* **Root cause:** Forms were added before RHF became the project-wide standard.
* **Fix:** Use `react-hook-form` for form values, `useWatch` for complex conditional UIs, and `Controller` for custom inputs. Keep localized validation helpers and payload helper functions unless the API contract is intentionally changing.
* **How to avoid:** Before adding a form field, check whether it belongs in an existing RHF form object. Do not add parallel local input state for the same value.

### Hardcoding frequently changed public content after CMS

* **What happened:** Home hero slides, banner images, About intro/cooperation content, and similar marketing regions used to be hardcoded in page components or locale JSON only.
* **Root cause:** The project did not have a protected CMS contract yet.
* **Fix:** Put frequently changed public regions in CMS blocks and render them through `PublicApiController.getCmsPage` plus fallback content.
* **How to avoid:** Before hardcoding a new banner, slider, button link, or page text, decide whether admins should edit it from CRM. If yes, add a CMS block/key and seed current content.

### Mapping long product descriptions into short title columns

* **What happened:** `ProductDescriptionMapper` copied `description.desc` into `ProductDescriptionI18n.title`, so descriptions longer than 255 characters failed during JPA flush with a generic transaction error.
* **Root cause:** One source field was mapped into `title`, `shortText`, and `contentMd` without respecting their semantics or lengths.
* **Fix:** Map description copy only to `contentMd`; leave legacy short fields null, validate request lengths before persistence, and unwrap transaction-level Bean Validation into a clean `VALIDATION_ERROR`.
* **How to avoid:** Product name/title belongs in `product_i18n.name`; long copy belongs in `product_description_i18n.content_md`. Never solve this by enlarging the short title column.

### Fake product artwork for missing media

* **What happened:** Empty product galleries displayed `/clocks.png`, while cards/search/cart showed unrelated text in blank image boxes.
* **Root cause:** Each surface invented its own fallback instead of treating an empty media list as real product state.
* **Fix:** Remove the fake URL and reuse localized `ProductImageFallback` on every product-image surface.
* **How to avoid:** A product image must come from `ProductResponse.images`/`imageUrl`; missing media must remain visibly missing.

### Catalog popovers inheriting the wrong width/anchor

* **What happened:** Category menus spanned an unrelated ancestor, filter labels clipped inside a trigger-width panel, sort options wrapped into one-word columns, and active search covered breadcrumbs.
* **Root cause:** Absolutely positioned surfaces used `w-full` without a correctly positioned root or explicit desktop width.
* **Fix:** Let `.catalog-toolbar-shell` own desktop geometry: category/filter/sort panels use the full white card width and active catalog search animates inside the same card coordinate system.
* **How to avoid:** Verify compact toolbar geometry at 900, 1000, 1024, 1100, and 1280px, including icon-search clearance and the accessory second row; then verify the full 1440px row has real space between the last control and search. Check open attached panels at 1024-1439px and the white card/panel X/width at 1440px. Never assume `w-full` refers to the desired container or hide a collision by clipping text.

### Showing every CMS field for every block type

* **What happened:** Image-only banners displayed text/settings inputs and backend validation required translations/alt text for every locale regardless of block capability.
* **Root cause:** The editor and service used scattered type checks instead of one capability schema.
* **Fix:** Keep CRM `cmsBlockSchemas` and backend `CmsBlockSchema` aligned; conditionally render/submit fields and clear unsupported values server-side.
* **How to avoid:** Any new CMS type must define all capabilities before its form or validation is implemented.

### Letting static banners outrank CMS blocks

* **What happened:** Saved CMS blocks existed, but public pages could keep rendering static/preloaded banner data because filtering or fallback logic was stricter than the real CMS contract.
* **Root cause:** Public components treated a narrow hardcoded block-key prefix or default CTA link as more authoritative than the published CMS block.
* **Fix:** Render CMS data first. Home hero accepts published `HERO_SLIDER` blocks for the `home` page, `ContactBanner` can suppress its default WhatsApp CTA when an existing CMS block has no valid link, and static assets/copy are fallback only.
* **How to avoid:** When a public region is CMS-backed, check the saved page/type/status contract before adding static config filters or default props that can mask valid CMS content.

### Recreating CMS translations during update

* **What happened:** PATCH `/api/crm/cms/blocks/{id}` could fail with duplicate key `uk_cms_block_translation_block_lang` for an existing `(block_id, lang)` such as `(3, ru)`.
* **Root cause:** The service cleared `block.getTranslations()` and added new `CmsBlockTranslation` objects for every language instead of updating the managed rows already attached to the block.
* **Fix:** Normalize request languages, reject duplicate aliases, and upsert translations by `(blockId, lang)` in place. Optional KZ/EN/mobile image variants update `cms_block` media foreign keys and never create additional translation rows.
* **How to avoid:** Re-saving the same CMS block must be idempotent. Do not clear and re-add translation entities unless the task explicitly defines deletion semantics and tests the Hibernate flush order against the unique constraint.

### Caching CMS-backed public pages

* **What happened:** Saved/published CMS content could remain invisible because a public route or server fetch reused static/cached output.
* **Root cause:** CMS had no explicit tag/invalidation contract, so stale frontend output, public backend cache, and image URL cache behavior were easy to confuse.
* **Fix:** Use short tagged Next cache entries (`cms`, `cms:{pageKey}`), persist a durable page-key outbox job with each CMS mutation, deliver it after commit to the protected public `/api/revalidate` route, return explicit partial-success `publicCacheRefresh` state, and version CMS image URLs from media/block timestamps.
* **How to avoid:** Do not add `force-static`, permanent fetch cache, or new static banner fallbacks to CMS-backed regions. Keep the cache contract explicit and verify both the write response and the public fetch path when CMS edits do not appear.

### Creating a separate CMS media storage path

* **What happened:** CMS image upload could easily fork a second storage service or store full URLs directly.
* **Root cause:** Product media already had object-storage behavior, but CMS media has different metadata and seeded public assets.
* **Fix:** Reuse `ObjectStorageService`, store uploaded CMS objects under the `cms/` path, and use `cms_media.storage_type` to distinguish `PUBLIC_PATH` seed assets from `OBJECT_STORAGE` uploads.
* **How to avoid:** Do not add a new S3 client, bucket config, or full-URL storage column for CMS media. Extend the existing storage service and document the media storage type.

### Rendering CMS text as trusted HTML

* **What happened:** Rich editable content can tempt a direct HTML render path.
* **Root cause:** CMS fields are admin-managed text, but the public storefront currently has no sanitizer/rich-text policy.
* **Fix:** Render CMS title/subtitle/description/button text as escaped React text and preserve formatting only through normal text wrapping/newlines where the component supports it.
* **How to avoid:** Do not use `dangerouslySetInnerHTML` for CMS fields unless a sanitizer, allowed-markup contract, and tests are introduced first.

### Calling array methods on unnormalized API data

* **What happened:** `ProductReviews` could crash at runtime with `Cannot read properties of undefined (reading 'length')` when the reviews response was missing or arrived as a legacy array/new paginated shape instead of the assumed Spring `Page.content` shape.
* **Root cause:** Render code read `reviewsPage.content` and then called `.length`/`.map` without first normalizing the response to a safe array.
* **Fix:** Normalize API data with `normalizePageResponse` or another explicit mapper before rendering; use safe derived arrays such as `reviewItems` for `.length`, `.map`, `.filter`, and `.reduce`.
* **How to avoid:** Components must never call `.length`, `.map`, `.filter`, or `.reduce` on API data before normalizing it to a safe default value. Paginated API responses must be normalized before rendering, especially when supporting both legacy array and current page shapes.

### Over-animating public storefront controls

* **What happened:** Search/category/filter interactions can become jumpy or inconsistent when each component invents its own timing and transforms.
* **Root cause:** One-off transition classes and immediate hover state switches do not match the VYMPEL dropdown/search surface.
* **Fix:** Use `transition-vympel*` tokens, preserve stable panel dimensions, animate opacity/translate/radius subtly, and add small hover intent only where it prevents submenu flicker.
* **How to avoid:** Do not animate every element. Limit motion to interactive state changes and rely on the global `prefers-reduced-motion` override.

### Sorting unavailable products by raw stock quantity

* **What happened:** It is tempting to add `stockQuantity DESC` before selected sort to push stock-zero products down.
* **Root cause:** Raw stock quantity is not the same as an availability bucket; it reorders available products by quantity before price/newest/name sorting.
* **Fix:** Use a computed backend availability bucket (`ACTIVE` and `stockQuantity > 0`) before the selected sort, as implemented in `PublicProductQueryService`.
* **How to avoid:** For any public product list, keep ordering conceptually as `available_bucket ASC, selected_sort, id DESC`; never solve out-of-stock placement only in frontend.

### Importing GoodCard directly into server pages

* **What happened:** A server-rendered brand page imported `GoodCard` directly, and `next build` failed during page data collection with a React `createContext` runtime error.
* **Root cause:** `GoodCard` uses `use-intl` hooks and is normally consumed by client components such as catalog/carousel UI.
* **Fix:** Keep server-side data fetching in the page/screen, then pass products into a small client component such as `components/BrandPage/BrandProductsGrid` that renders `GoodCard`.
* **How to avoid:** When a shared component imports client hooks but lacks its own `"use client"` directive, do not import it directly into an async server screen; wrap it at the nearest interactive/client boundary.

### Dead public internal links or guessed catalog params

* **What happened:** Header/footer/home/banner/product/cart/favorites surfaces can drift into placeholder `"/"` links, old `/catalog/...` path links, or guessed filter values.
* **Root cause:** Link destinations were spread across components instead of using one route/query helper, and semantic links like men's watches need backend filter values, not display text.
* **Fix:** Use `src/config/routes.ts` helpers for internal public routes, contact links, marketplace links, product links, category links, and semantic catalog presets. Remove unavailable navigation items instead of pointing them at unrelated pages.
* **How to avoid:** Before adding a visible link or CTA, verify the real route/filter exists; category links must reset `page=1`, search links must clear category/filter params, and brand catalog filters must use the backend brand option value resolved from filter metadata.

### Silent or misleading local cart/favorite feedback

* **What happened:** Public product actions can appear successful even when localStorage writes fail, a product is unavailable, or an item is already in cart.
* **Root cause:** UI handlers treated storage helpers as fire-and-forget actions and duplicated toast copy directly inside components.
* **Fix:** Return explicit mutation statuses from `localProductStorage.ts`, branch on those statuses in product/cart/favorite handlers, and show localized feedback through `useProductActionToasts`.
* **How to avoid:** Never show success toasts or send analytics until a storage mutation reports success; unavailable and already-in-cart states need their own user-visible outcomes.

### Default Next fallback for localized public 404s

* **What happened:** Unknown localized storefront URLs could fall through to the framework's generic not-found presentation instead of the project-styled page.
* **Root cause:** A localized `not-found.tsx` alone may not cover every App Router unmatched route shape in this project.
* **Fix:** Keep a localized unknown-route fallback under `src/app/[locale]` that renders the shared `EmptyState` with localized 404 copy and route-helper actions.
* **How to avoid:** Verify unknown localized URLs directly after changing route structure, and keep not-found copy under `states.notFound`.

### CRM FormData requests sent as JSON

* **What happened:** The CRM fetch helper originally set `Content-Type: application/json` whenever a request had a body, which would break multipart image uploads by removing the browser-generated boundary.
* **Root cause:** JSON and multipart bodies were not distinguished in the shared CRM API client.
* **Fix:** Detect `body instanceof FormData` and let the browser set the multipart `Content-Type`; only stringify and label non-FormData bodies as JSON.
* **How to avoid:** For every CRM upload endpoint, use `FormData` through `crmApi` and never set a manual multipart `Content-Type`.

### CRM mutations failing silently

* **What happened:** Some CRM mutations updated inline state or showed inline errors only, so successful and failed backend writes did not have one consistent global feedback pattern.
* **Root cause:** There was no shared CRM notification surface or safe backend error helper.
* **Fix:** Add `NotificationProvider`, call `useNotifications` from mutation flows, and route errors through `getCrmErrorMessage`.
* **How to avoid:** Every new backend mutation in CRM must have a localized loading/disabled state plus success and error feedback.

### Rating aggregates including unmoderated reviews

* **What happened:** A naive product-rating query can count pending, rejected, or deleted submissions before moderation.
* **Root cause:** Visibility status was treated as a UI concern instead of part of the aggregate query.
* **Fix:** `ProductReviewRepository.findRatingSummaries` filters `ProductReviewStatus.APPROVED`, and public review reads use the same approved-only rule.
* **How to avoid:** Never calculate or display a product rating from an unfiltered review collection; keep the approved predicate in the repository/service contract and cover it with tests.

### Wide CRM tables widening the mobile page

* **What happened:** The review table had an intentional desktop `min-width`, but the surrounding CSS grid item kept its default intrinsic minimum and widened the entire 390px page.
* **Root cause:** `overflow-x: auto` on the table wrapper was not enough while `.crm-page` and `.crm-panel` still used `min-width: auto`.
* **Fix:** Keep `.crm-page` and `.crm-panel` at `min-width: 0`, cap `.crm-table-wrap` at `max-width: 100%`, and let only the table wrapper scroll.
* **How to avoid:** For every dense CRM table, verify `document.documentElement.scrollWidth === clientWidth` at a mobile viewport; internal table scrolling must never become body scrolling.

### CRM optional search nullable parameter inferred as bytea

* **What happened:** CRM product search generated PostgreSQL `ERROR: function lower(bytea) does not exist` from a JPQL query that mixed `:search is null` with `lower(... like concat('%', :search, '%'))`.
* **Root cause:** The searchable columns were text (`product.model`, `product.sku`, `product_i18n.name`), but the nullable query parameter let PostgreSQL infer an ambiguous parameter type.
* **Fix:** Normalize search in `ProductServiceImpl.getAllForCrm`; call `findAll(pageable)` for null/blank search and call `searchForCrm(search, pageable)` only for nonblank text. Remove the nullable parameter branch from the JPQL search query.
* **How to avoid:** Do not call `lower()` on ambiguous nullable parameters or non-text columns; split blank and nonblank search paths or cast/bind text safely.

### CRM characteristic selects showing raw enum codes

* **What happened:** CRM product create/edit selects displayed raw values such as `MECHANICAL`, `MEN`, `MINERAL`, and `SWAROVSKI`.
* **Root cause:** `CrmReferenceService` was returning each dictionary `code` as the option `name`, so the frontend rendered the raw backend identifier.
* **Fix:** Resolve feature names through the existing `*_i18n` repositories with Russian `Language.RU`; keep `code` in the response separately, and keep frontend fallback labels in `messages.ru.products.characteristicLabels`.
* **How to avoid:** Never set CRM reference option `name` to `code` unless the code is already the intended display text. Selects should submit IDs and display localized/readable names.

### User-management without backend admin enforcement

* **What happened:** CRM can hide user-management navigation from non-admins, but hidden links alone would not secure endpoints.
* **Root cause:** Client routing is not authorization.
* **Fix:** Protect `/api/crm/users` and `/api/crm/users/**` with `ADMIN` in `SecurityConfig` and `@PreAuthorize("hasRole('ADMIN')")`.
* **How to avoid:** Every user-management create/edit/role/status endpoint must be admin-only on the backend, validated, and audit logged.

### Disabled users still authenticating with existing tokens

* **What happened:** The existing JWT flow trusted token claims and did not check `users.enabled`, so a blocked user could keep using a still-valid access token.
* **Root cause:** Stateless JWT validation did not consult current user access status.
* **Fix:** `AuthServiceImpl.login` rejects disabled users and `JwtAuthFilter` rejects tokens for missing or disabled users.
* **How to avoid:** When adding account blocking, check both login and token authentication paths.

### Locale value drift

* **What happened:** The frontend locale enum uses `kz`, while backend `Language.KZ` stores `kk` and database language checks use `kk`.
* **Root cause:** Locale values are manually duplicated across frontend, backend, and migrations.
* **Fix:** Before locale-related changes, decide whether the API should continue accepting both `kz` and `kk`, and keep persisted language values aligned with database checks.
* **How to avoid:** Treat locale values as an API contract and update both sides together.

### Hardcoded local secrets and service config

* **What happened:** The base `application.yml` historically contained usable local database, JWT, MinIO, and origin fallbacks, so a non-local process could start insecurely.
* **Root cause:** Developer convenience and deployment configuration shared one default profile, with no early environment audit.
* **Fix:** Move usable values to explicit local/test profiles, keep placeholder-only `.env.example` files, and fail non-local startup before bean creation when configuration is blank/weak/placeholder/local/insecure.
* **How to avoid:** Never restore a usable secret/service fallback in base config or exempt production by combining it with `local`; document and test every new sensitive property in the startup validator.

### Trusting forwarding headers from every peer

* **What happened:** A client-controlled forwarding address can create arbitrary source buckets when applications read `X-Forwarded-For` without checking the direct peer.
* **Root cause:** Forwarded headers were treated as identity rather than untrusted input supplied through a specific ingress boundary.
* **Fix:** `ClientAddressResolver` accepts a bounded chain only from configured numeric proxy CIDRs and otherwise uses the direct peer.
* **How to avoid:** Never read `X-Real-IP`, `Forwarded`, or `X-Forwarded-For` ad hoc in controllers/services; update and test the one resolver and deployment CIDR allow-list.

### Per-instance production rate limits

* **What happened:** A memory-only counter would multiply effective capacity by instance count and reset independently during deploys.
* **Root cause:** Local implementation simplicity does not provide shared atomic production semantics.
* **Fix:** Non-local startup requires Redis and `RedisRateLimitStore` uses one atomic Lua increment/expiry operation; memory state is capped and profile-restricted.
* **How to avoid:** Do not describe local counters as global, add unbounded identity maps, or add non-atomic Redis get-then-set logic.

### Limiting after persistence or automatically retrying 429 writes

* **What happened:** A limiter placed after controller/service work still consumes database resources, while automatic client retries amplify abuse and can duplicate mutations.
* **Root cause:** Throttling was treated as display-only error handling instead of an admission-control boundary.
* **Fix:** Source/global checks run in the early filter; account/contact/content checks run after semantic validation but before repositories; clients preserve input and wait for the server cooldown without auto retry.
* **How to avoid:** Tests must verify no filter chain/repository call after rejection and must assert a single user-initiated request per write attempt.

### Acknowledging malformed analytics as a duplicate

* **What happened:** Deduplication could return `tracked=false` before analytics metadata validation, so a malformed repeated event could be acknowledged as if it were valid.
* **Root cause:** Validation and normalization ran after the duplicate admission check.
* **Fix:** Parse the event type and validate/sanitize metadata before product lookup, deduplication, or persistence; reuse the sanitized map for the saved entity.
* **How to avoid:** Assert malformed duplicate-shaped requests fail validation and make zero product, limiter-dedup, and repository calls.

### Clearing CRM access state when refresh is throttled

* **What happened:** A refresh response such as 429 cleared a still-valid access token and emitted a session-expired event.
* **Root cause:** The refresh catch path treated every transport/API failure as authentication invalidation.
* **Fix:** Clear the client session only when refresh returns 401; preserve access state for 429, network failures, and 5xx so the caller receives the actionable failure.
* **How to avoid:** Test refresh 401 and refresh 429 separately, including stored token and session-expired event counts.

### Raw or high-cardinality limiter telemetry

* **What happened:** Logging raw IP/email/contact/key material or attaching it to metric tags would create a privacy leak and unbounded telemetry cardinality.
* **Root cause:** Diagnostic detail was confused with safe operational visibility.
* **Fix:** HMAC identities stay inside the store key, logs expose only configured policy/outcome/correlation with sampled aggregate counts, and metric tags are bounded policy/event enums.
* **How to avoid:** Never log limiter identities/keys or add request/account/source values as metric labels.

### Assuming frontend tests exist

* **What happened:** Earlier sessions assumed either that no frontend tests existed or that a conventional test command existed without checking each app.
* **Root cause:** The public and CRM apps have independent scripts and test inventories.
* **Fix:** Both apps now have finite Vitest commands; public also has typecheck and production-status scripts. Read each `package.json` and report exact file/test counts.
* **How to avoid:** Never infer test availability from framework conventions or from the sibling app.

### Assuming new app dependencies are installed

* **What happened:** The new `vympel_crm` app initially could not run `npm run lint` because it had its own `package.json` but no `node_modules`.
* **Root cause:** The repository has sibling apps, not a workspace with shared dependencies.
* **Fix:** Run `cd vympel_crm && npm install` for CRM before CRM lint/build.
* **How to avoid:** Treat every sibling frontend app as independently installed unless a workspace tool is added.

### Assuming Spring Boot 4 has a com.fasterxml ObjectMapper bean

* **What happened:** Injecting `com.fasterxml.jackson.databind.ObjectMapper` into `CrmActivityService` failed the Spring context test.
* **Root cause:** This Spring Boot 4 setup did not expose that bean type.
* **Fix:** Keep CRM activity metadata serialization local/simple unless a project-approved JSON mapper bean is introduced.
* **How to avoid:** Run backend context tests after adding service constructor dependencies and prefer existing project beans.

### Raw UI text and raw token drift

* **What happened:** Product page components previously contained hardcoded Russian strings, raw aria labels, `text-[...]` sizes, placeholder arbitrary sizes, and raw hex colors.
* **Root cause:** Figma values were implemented directly inside TSX instead of being promoted into locale files and global tokens.
* **Fix:** Move user-facing text to `src/messages/*.json`, render it with `next-intl`, add reusable values to `globals.css` / `TextVariants`, and use `Text`/`Heading`.
* **How to avoid:** For every touched component, run a focused `rg` check for Cyrillic UI strings, raw hex values, `text-[...]`, and `placeholder:text-[...]`.

### Product spec country from wrong field

* **What happened:** Product spec rows can be tempted to display `product.brand.name` as the country because both are available in the product page data flow.
* **Root cause:** The frontend brand type mirror was missing the backend `country` list even though `BrandResponse` exposes it.
* **Fix:** Mirror the backend brand contract with `IProductBrand.country?: string[] | null` and render the localized country row from `product.brand?.country`, joined safely after filtering empty values.
* **How to avoid:** When a product spec value looks like reference data, verify the backend DTO before reusing a visually similar field.

### Filtering brand country as a product field

* **What happened:** Country-like filter names can look like product characteristics, but brand/manufacturer country is stored on the brand relation, not on `product`.
* **Root cause:** Product, brand, and detail characteristics are all exposed as catalog filters, so it is easy to route every filter key through `Product`.
* **Fix:** Brand/manufacturer country belongs to Brand, not Product. Product country filters must join through `Product -> Brand -> brand_country -> Country`; expose it in public catalog metadata as one `country` filter labeled `Страна`, and do not add duplicate public filters such as `Страна` plus `Страна бренда`. Removed country aliases such as `brandCountry` must be cleaned from frontend URLs and ignored by backend request parsing.
* **How to avoid:** Before adding a country filter or CRM country field, inspect whether the country is a brand/manufacturer attribute or an existing product-detail attribute such as `interior_clock_details.production_country_id`.

### Treating wristwatch details as product fields

* **What happened:** Wristwatch detail filters can show zero counts or fail to filter when metadata is built from dictionary tables or assumed `Product` fields instead of the actual detail rows in the selected category scope.
* **Root cause:** Wristwatch characteristics such as mechanism, gender, case material, strap material, glass type, stone inlay, and case size are owned by `watch_details`, connected to products by `watch_details.product_id`.
* **Fix:** Generate public wristwatch filter options from distinct values in `watch_details`, calculate counts through `Product -> watch_details`, and apply selected detail filters through `EXISTS`/joins against `watch_details`.
* **How to avoid:** Never add wristwatch characteristic filters as direct `Product` paths like `root.get("mechanism")`; always start from the real `WatchDetail` entity/table.

### Treating filter metadata as active filters

* **What happened:** Catalog product loading can collapse when backend/frontend logic treats every available metadata key as an active product filter.
* **Root cause:** Metadata is for rendering options, but product-listing queries should only use values explicitly selected by the user.
* **Fix:** Normalize query params in `ProductPublicController`, `ProductCatalogService`, and frontend `catalogFilterParams.ts`; ignore empty arrays, blank strings, null/undefined placeholders, and missing keys before building specifications or request URLs.
* **How to avoid:** Never loop metadata into product filtering. Only selected, parsed values should create base product, country, `watch_details`, or `interior_clock_details` predicates.

### Windows shell codepage corrupting locale JSON

* **What happened:** Adding Cyrillic/Kazakh strings through a PowerShell heredoc into `node` can write `????` into `src/messages/*.json` because the shell codepage mangles non-ASCII source text before Node sees it.
* **Root cause:** The JSON files are UTF-8, but literal non-ASCII text embedded in a shell command can be transcoded by the Windows console layer.
* **Fix:** Prefer `apply_patch` for locale JSON edits. If a structured script is unavoidable, use Unicode escape sequences in the script source and validate with `node -e` by reading the JSON values.
* **How to avoid:** After editing RU/KZ messages, run a quick JSON/value check instead of trusting PowerShell `Get-Content` output, which can also show existing mojibake.

### Connect banner heading clipping on mobile

* **What happened:** The exact 60px desktop heading can clip or overflow on 390px screens because the longest Russian word is wider than the tokenized content area.
* **Root cause:** Grid/flex children need `min-w-0` and responsive typography to let text fit inside the banner while preserving the desktop Figma size.
* **Fix:** Keep desktop heading at `text-5xl`/60px, use existing `text-4xl` on the narrow mobile layout, and keep `min-w-0`, `break-words`, and `whitespace-pre-line` on the heading.
* **How to avoid:** Browser-check both desktop and mobile after contact-banner changes; verify no horizontal overflow and that heading/side copy right edges stay within the section.

### Assuming root-level workspace commands

* **What happened:** Frontend and backend are separate sibling apps with no root package manager or workspace tool.
* **Root cause:** The repository is not configured as a monorepo workspace.
* **Fix:** Run commands from `vympel_front` or `vympel_back` explicitly.
* **How to avoid:** Do not run npm or Gradle commands from the repo root unless a root-level script is added later.

### Using dev servers or watch commands as final checks

* **What happened:** An interrupted responsive QA pass left a local `next start -p 3100` Node process listening on port 3100, making the run appear stuck or extremely long.
* **Root cause:** Long-lived server commands and readiness probes were treated like ordinary verification commands.
* **Fix:** Stop the specific leftover process/port when it belongs to the interrupted check, then use bounded checks such as `npm run lint` and `npm run build`. If a PowerShell `Start-Process` attempt fails because the environment contains duplicate `Path`/`PATH` keys, do not keep retrying launch variants during a finite-check task.
* **How to avoid:** Do not use `npm run dev`, `next dev`, `next start`, `Start-Process` server probes, Vite watch, Jest watch, or other long-lived servers/watchers as final verification checks unless the user explicitly requested a bounded managed render check.

### Restarting interrupted Codex work from scratch

* **What happened:** Broad UI tasks can span many files, and restarting after interruption risks overwriting already completed responsive work or user changes.
* **Root cause:** Continuing from memory without inspecting the current diff and changed files.
* **Fix:** First inspect `git status`/`git diff` in the actual app worktree, identify completed/incomplete/risky pieces, and continue only unfinished work. If Git metadata is unavailable in the workspace, inspect the task-relevant changed files and generated finite-build output directly instead of pretending a diff was available.
* **How to avoid:** For interrupted runs, write a short recovery plan before coding and never revert unrelated changes.

### Fake CRM price or stock defaults

* **What happened:** CRM price/stock inputs can appear correct while actually showing fallback values if local input state or DTO mapping does not use the fetched backend product fields.
* **Root cause:** Numeric inputs make it tempting to default missing values to `0`, and stale controlled state can survive after product data changes.
* **Fix:** Use backend `ProductResponse.price` / `stockQuantity` directly from canonical `product.price` / `product.stock_quantity`, explicitly map entity price from `BigDecimal`, render missing values empty, and replace/resync the row from mutation responses before refetching the list.
* **How to avoid:** Never show hardcoded prices or fallback stock in CRM product tables; after a quick mutation, update the row from the returned product and refetch the product list.

### Nullable date filter in analytics query

* **What happened:** CRM analytics failed in PostgreSQL with `could not determine data type of parameter $2` when the optional period date was absent.
* **Root cause:** The aggregate query used a nullable timestamp parameter inside a join predicate: `:since is null or e.createdAt >= :since`.
* **Fix:** Split the repository into an all-time aggregate query without `:since` and a dated aggregate query with `e.createdAt >= :since`; branch in `ProductAnalyticsService` before calling the repository.
* **How to avoid:** Optional date filters should be applied by service branching, criteria/specification building, or explicit typed casts, not ambiguous nullable SQL parameters.

### Product recommendations exposing empty or failure UI

* **What happened:** The product page requested only the current category, removed the current product, and rendered visible empty/error states. Rare categories and accessories therefore showed forbidden "no similar products" copy.
* **Root cause:** Recommendations were composed from the generic catalog in the frontend instead of a backend-owned staged algorithm.
* **Fix:** Implement a bounded, deduplicated, locale-aware multi-stage recommendation endpoint. Render the section only when at least one item exists; silently omit it for catalog-wide exhaustion, timeout, or failure.
* **How to avoid:** Treat recommendation fallback and silent terminal behavior as an API/UI contract with backend, frontend, and E2E tests for rare categories and a one-product catalog.

### Clearing a valid CRM session on HTTP 403

* **What happened:** A correctly forbidden ADMIN-only request made by a MANAGER clears the entire CRM session.
* **Root cause:** The shared client handles 401 authentication failure and 403 authorization denial identically.
* **Fix:** Implemented in Step 3: clear or refresh only on 401/verified token failure. Preserve the session and dispatch localized forbidden feedback on 403; admin-only navigation and direct routes share tested permission helpers.
* **How to avoid:** Test 401 and 403 separately for every shared auth client; never infer token invalidity from a role denial.

### Issuing refresh tokens without a refresh lifecycle

* **What happened:** The backend returned a 14-day refresh token in JSON, the CRM stored it in `sessionStorage`, but no refresh, rotation, revocation, reuse-detection, or server logout path existed.
* **Root cause:** Token issuance was treated as complete authentication rather than a stateful credential lifecycle with storage and replay threats.
* **Fix:** CRM refresh is now cookie-only and inaccessible to JavaScript; server-side hashed sessions rotate on use, revoke families on replay, revoke on role/status changes, and expire through retention cleanup. The client has one single-flight refresh and one retry.
* **How to avoid:** A refresh credential is not complete until issuance, storage, CSRF protection, consumption, concurrency, rotation, replay, logout, role/status invalidation, cleanup, and finite tests are designed together.

### Retrying refresh recursively or once per failing request

* **What happened:** A naive interceptor design could send one refresh per simultaneous 401 or re-enter itself when `/refresh` also returns 401.
* **Root cause:** Refresh was modeled as an ordinary authenticated API request with no shared in-flight state or retry bound.
* **Fix:** `refreshPromise` is module-scoped; all concurrent 401 callers await it, refresh/login/logout bypass retry, and each original request retries exactly once.
* **How to avoid:** Test concurrent 401s, refresh 401, retried-request 401, and network failure with exact request counts.

### Using validation/persistence exceptions for expected not-found flow

* **What happened:** Missing products returned 400 and unknown categories could return 500.
* **Root cause:** Services throw `IllegalArgumentException` or JPA `EntityNotFoundException`, while the global handler maps them to validation or database-failure statuses.
* **Fix:** Missing product/category/brand/review/request/user/CMS and reference lookups now use `ResourceNotFoundException`, mapped to a safe 404 envelope with request ID and INFO logging. Persistence and unexpected failures remain 500/ERROR.
* **How to avoid:** Keep 400 validation, 401 authentication, 403 authorization, 404 absence, and 500 unexpected-failure semantics distinct in handler/service tests; never globally remap `IllegalArgumentException` to 404.

### Rendering localized 404 content after streaming starts

* **What happened:** Unknown paths and missing product/category/brand pages rendered localized not-found content but returned HTTP 200.
* **Root cause:** The locale-wide `loading.tsx` created a streaming boundary and dynamic screens decided absence only after descendant async work, after the response could be committed.
* **Fix:** Remove the locale-wide loading boundary, resolve existence in each route owner, and call `notFound()` only for a confirmed absence before rendering descendants.
* **How to avoid:** Production-server tests must assert both HTTP status and localized body content for ru/kz/en, valid pages, and a simulated temporary backend 500 that must not become 404.

### Uploading CMS media without an ownership or cleanup lifecycle

* **What happened:** CMS block replacement/deletion left unreferenced media rows and objects; 7 orphan rows were found in the audited database.
* **Root cause:** Upload exists, but reference-aware deletion and garbage collection do not.
* **Fix:** The reusable-media model now queries every desktop/mobile locale slot, normalizes all FKs to `SET NULL`, marks detachments after commit, provides ADMIN reference/dry-run/cleanup endpoints, and uses locked grace/retry lifecycle state with storage-first deletion. The Step 5 dry run found 5 currently eligible candidates among 24 rows; it intentionally deleted none because object/public/CRM proof was unavailable.
* **How to avoid:** Design create/replace/delete/rollback/GC together for every storage-backed feature. Never delete a row referenced in any slot, bypass grace, garbage-collect `PUBLIC_PATH`, or remove the DB row before object deletion succeeds.

### Assigning final ordered positions in one flush

* **What happened:** Directly swapping final product-media or CMS sort values can violate a unique constraint before every row reaches its final value.
* **Root cause:** SQL updates are checked row by row even when the final set would be unique.
* **Fix:** Serialize on the owning product/page, clear dependent main flags when needed, flush collision-free temporary values, then flush canonical final positions.
* **How to avoid:** Treat ordered collections as one owner-scoped transaction and test simultaneous reorder requests against PostgreSQL.

### Calling public CMS revalidation directly inside the content transaction

* **What happened:** A cache HTTP failure could be confused with save failure, and a process crash between commit and an after-the-fact call could lose immediate freshness.
* **Root cause:** Content persistence and a remote HTTP side effect do not share an atomic transaction.
* **Fix:** Persist a deduplicated page-key outbox job with the CMS mutation, deliver after commit, retry transient failures durably, and return separate `contentSaved` and cache-refresh status fields. Authenticate fixed allow-listed payloads with timestamped HMAC; never accept arbitrary paths/tags.
* **How to avoid:** Treat revalidation as an idempotent durable side effect. Keep 30-second ISR as a safety net, require deployment secrets/URL, and show pending/not-configured/permanent outcomes as localized partial-success warnings.

## Testing Patterns

* **How to run all tests:** No single full-project test command is configured; run backend tests with `cd vympel_back && .\gradlew.bat test`, public frontend tests with `cd vympel_front && npm run test`, and CRM tests with `cd vympel_crm && npm test`.
* **How to run frontend tests:** `cd vympel_front && npm run test` and `cd vympel_crm && npm test` run finite Vitest suites.
* **How to verify real public 404 responses:** Run `cd vympel_front && npm run build`, then `npm run test:production-status`. The finite script owns ephemeral mock/Next processes, asserts status and rendered content for valid and missing routes in ru/kz/en, checks a temporary backend 500 is not converted to 404, and verifies both ports close during cleanup.
* **How to verify CMS changes:** Run backend tests with `cd vympel_back && .\gradlew.bat test`, public test/lint/typecheck/build, and CRM test/lint/build. `CmsMediaCleanupTransactionServiceTest` covers references, grace, retry, object-then-row success, and stale claims; `RefreshSessionMigrationTest` covers all six slots; `CmsMediaDryRunIntegrationTest` proves a configured-DB dry run does not change row count. Public signature/allow-list/targets and CRM partial-success mapping have Vitest coverage. A bounded production Next probe should assert 200/401/409 and close its exact port. Browser-check authenticated `/cms` only when a managed stack exists; never delete dry-run candidates merely to make a test pass.
* **How to verify Step 7 DB integrity:** Run `STEP_7_DATABASE_PREFLIGHT.sql`, the full Java suite, and the PostgreSQL 16 `RefreshSessionMigrationTest`. Before live migration, restore a current dump to a disposable database and opt in `Step7ExternalDatabaseRehearsalTest` with its three `STEP7_REHEARSAL_*` environment variables; force execution because the target URL is external state. Verify live changelog/lock/constraints/invariant counts afterward.
* **How to verify audit/security/optimization passes:** Use finite checks only: backend `.\gradlew.bat test` with Java 17, public `npm run lint` and `npm run build`, and CRM `npm run lint` and `npm run build`. Do not use `dev`, `start`, or watch commands as final verification.
* **How to verify server logging:** Run `cd vympel_back && .\gradlew.bat test`; the context test validates `logback-spring.xml`, and focused tests validate request ID reuse/generation, response headers, MDC cleanup, safe error payloads, masking, and dedicated security/CRM logger calls. Confirm all four current files exist under `APP_LOG_DIR`, grep generated logs for injected test secrets, and inspect the XML for daily+size rolling, retention, and total-size caps. Do not start a long-running server as the final logging check.
* **How to verify public responsive work safely:** Use bounded commands such as `cd vympel_front && npm run lint` and `cd vympel_front && npm run build`; do not use dev servers, `next start`, or watch commands as final checks. Responsive source/render review must include very small widths such as 320px.
* **How to verify shared search changes safely:** Run `cd vympel_front && npm run lint`, `npm run typecheck`, and `npm run build`. Use only a bounded managed production preview when explicit responsive browser measurements are required, stop the process afterward, and never treat `dev`, `start`, or watch commands as final verification.
* **How to run backend tests:** `cd vympel_back && .\gradlew.bat test`.
* **Where frontend tests live:** Public frontend tests live beside source under `vympel_front/src/**/*.test.ts(x)`; CRM auth tests live at `vympel_crm/src/shared/api/client.test.ts`, `shared/auth/permissions.test.ts`, and `shared/i18n/messages.test.ts`.
* **Where backend tests live:** `vympel_back/src/test/java`; abuse coverage is under `security/ratelimit`, `security/config/NonLocalSecurityConfigurationValidatorTest`, `security/GlobalErrorHandlerTest`, `services/PublicWriteAbuseProtectionTest`, `controllers/CrmAuthLifecycleIntegrationTest`, and container-backed `security/ratelimit/RedisRateLimitStoreIntegrationTest`.
* **Mocking approach:** Backend uses Mockito for service contracts and real JWT parsing; the finite CRM auth integration test uses a random-port Spring server, configured PostgreSQL, unique test users, and deterministic cleanup. CRM Vitest uses an in-memory sessionStorage/EventTarget plus deterministic fetch responses to assert concurrency and request counts.
* **How to verify SEC-001/SEC-002:** Run the full Java 17 backend suite; public test/lint/typecheck/build/production-status; CRM test/lint/build. Rate-limit coverage must include exact concurrent capacity, strict concurrent local-store cardinality, TTL/reset, two independent Redis clients, trusted/untrusted/malformed forwarding chains, direct backoff-store failures, login backoff, endpoint mapping, safe correlated 429/503, and zero downstream persistence after rejection. Startup coverage must include local/test exemptions, mixed-profile failure, rejection of a disabled non-local limiter, every required non-local configuration family, no-value-leak assertions, and one valid production-like pass.
* **How to verify CRM-001/AUTH-001:** Run backend full tests, CRM `npm test`, `npm run lint`, `npm run build`, and `npm audit --json`. The backend integration sequence must prove login -> me -> refresh -> old-token replay/family invalidation -> MANAGER 403 -> same-session me -> role/status revocation -> logout -> rejected refresh, plus trusted-origin enforcement and fixture cleanup.
* **How to verify REC-001:** Run backend full tests, public `npm run test`, touched-file ESLint, `npm run typecheck`, and `npm run build`. For finite live verification, start the built backend jar on a temporary port, call the public recommendation endpoint for products 28/43/44/45, assert non-empty/unique/current-excluded/ACTIVE/in-stock-first results, then stop the exact process and confirm the port is closed.
* **How to verify API-001:** Run the Java 17 backend suite. `GlobalErrorHandlerTest` asserts 400/401/403/404/500 plus request ID and response safety; `ResourceNotFoundServiceTest` and `ProductServiceImplTest` cover representative entity absence. A bounded jar check may assert valid=200, malformed=400, unauthenticated=401, missing=404, zero expected-404 matches in `error.log`, exact-process termination, closed port, and removal of task-owned logs.
* **How to run the evidence-backed full-system audit checks:** See `docs/tasks/vympel_full_system_audit/TEST_MATRIX.md`, `STEP_4_SECURITY_ROLLOUT.md`, and the audit probe summaries. The Step 5 delta is backend 31 suites / 123 tests plus focused read-only dry run, public 9 tests plus lint/typecheck/build and signed production-route probe, and CRM 17 tests plus lint/typecheck/build. Runtime visual viewport certification and destructive live orphan reconciliation remain explicitly blocked and must not be reported as passed.

## Debugging Tips

* If frontend product/category requests return empty or null, check that `BASE_API_PUBLIC` or `NEXT_PUBLIC_BASE_API_PUBLIC` is set and includes `/api/public`.
* If backend startup fails schema validation, inspect the Liquibase changelog order and the PostgreSQL database state because Hibernate uses `ddl-auto: validate`.
* If backend startup fails before the Spring banner with a Logback configuration error, inspect `logback-spring.xml` class names and properties first; `VympelApplicationTests.contextLoads` is the finite reproduction.
* If an API error cannot be found in server logs, compare the response `X-Request-Id`/body `requestId` with the `requestId=` MDC field across `application.log` and `error.log`; security failures belong in `security.log`, while committed CRM/admin actions belong in `crm-actions.log`.
* If server logs disappear after restart/deploy, verify `APP_LOG_DIR` is writable and persistent. The local-only backend Compose profile does not persist production logs; a deployed container must mount `/app/logs`, while a managed service should use a protected persistent path such as `/var/log/vympel`.
* If sensitive text appears in logs, remove the unsafe log argument first, then extend `SensitiveDataMasker` and its tests as defense in depth. Never solve it by hiding the whole log category.
* If product cards fail to render because images are missing, check that MinIO is running, the bucket exists, media rows exist, and `ObjectStorageService.getFirstLinkByProductId` can find media for each product.
* If browser requests are blocked, check `VYMPEL_CORS_ALLOWED_ORIGINS` / `app.cors.allowed-origins`; localhost origins exist only in the explicit local/test profiles, while non-local startup requires exact HTTPS non-wildcard origins.
* If deployed startup fails before beans are created, inspect the property name reported by `NonLocalSecurityConfigurationValidator`; values are intentionally omitted. Do not bypass it by combining `local` with another profile because mixed profiles remain non-local.
* If rate-limit behavior differs behind an ingress, verify the application's direct peer belongs to `VYMPEL_TRUSTED_PROXY_CIDRS`, the configured CIDRs are numeric network ranges, and the proxy sends a bounded `X-Forwarded-For` chain. Do not add controller-specific header parsing.
* If login backoff produces an unexpected 500 during Redis trouble, verify retry/block/reset operations still pass through the `RateLimitService` store-failure wrapper; direct store calls must use the same bounded metric/logging and fail-closed exception as admission checks.
* If CRM browser requests are blocked, check backend CORS config and remember CRM dev uses `http://localhost:3001`.
* If CRM protected pages loop back to `/login`, inspect the access-token `sessionStorage` key, `/api/crm/auth/me`, then the credentialed `/api/crm/auth/refresh` response and refresh cookie scope. The refresh token must never be visible in Web Storage or JavaScript.
* If a MANAGER is logged out after opening an ADMIN-only area, inspect `crmFetch`: HTTP 403 must preserve the valid session; only 401/verified token failure should clear or refresh it.
* If several expired requests trigger several refresh calls, inspect the module-scoped `refreshPromise`; every 401 caller must await the same promise, and `/auth/refresh` must bypass normal retry logic.
* If local refresh works but production does not, verify HTTPS, `VYMPEL_CRM_REFRESH_COOKIE_SECURE=true`, cookie path `/api/crm/auth`, exact `VYMPEL_CORS_ALLOWED_ORIGINS`, and that CRM/API remain same-site for `SameSite=Lax`.
* If a public product page shows a recommendation empty/error state, inspect `ProductPage` for generic same-category catalog composition. The permanent contract is a backend multi-stage fallback and silent omission only when no valid alternative exists or recommendation work fails.
* If recommendations unexpectedly return `[]`, correlate the server error log by product/locale, check `VYMPEL_RECOMMENDATION_QUERY_TIMEOUT_MS`, then run the three repository steps independently: source profile, ranked IDs, and batch cards. Do not add per-card fallback queries; fix the bounded projection/accessibility condition.
* If a missing public resource becomes 400/500, inspect the thrown exception before changing the global handler. Expected absence must use the domain 404 path, not `IllegalArgumentException` or JPA persistence failure handling.
* If CMS storage grows after block replacement/deletion, query all main/localized/mobile media references before deleting anything; unreferenced rows require reference-aware DB and object-store cleanup with a grace period.
* If a blocked CRM/admin user still appears authenticated, check both `AuthServiceImpl.login` and `JwtAuthFilter`; both must reject `users.enabled=false`.
* If `next build` reports `useSearchParams() should be wrapped in a suspense boundary` for static pages, check client components mounted from `src/app/[locale]/layout.tsx`; wrap the search-param-using subtree in `<Suspense fallback={null}>`.
* If CRM product search fails with `lower(bytea)`, inspect whether optional search is being passed as nullable into JPQL. Blank/null search should branch to `findAll`, and nonblank search should use a separate text query.
* If CRM product selects show enum codes, inspect `/api/crm/references` first. Characteristic options should have readable Russian `name` values, collections should have localized `name`, and `code` should remain separate.
* If a newly created CRM collection does not appear in the product form, verify the POST `/api/crm/collections` response, `collection_i18n` rows for `ru/en/kk`, and whether the returned option was merged into `references.collections` with the correct `brandId`.
* If CRM product photo upload fails before `CrmProductController`, compare `VYMPEL_MULTIPART_MAX_FILE_SIZE`/`VYMPEL_MULTIPART_MAX_REQUEST_SIZE` with the CRM and `ObjectStorageService` 10 MB/10-file contract. Then check MIME plus extension, browser multipart payload name `files`, `/api/crm/products/{id}/images`, MinIO availability, bucket config, and whether `media.url` stores object keys rather than full URLs.
* If product image upload succeeds but the card/gallery does not update, inspect structured `ProductResponse.images`, `media.position`, `media.is_main`, `ObjectStorageService.getFirstLinkByProductId`, the CRM product-list invalidation event, and broken-URL fallback before adding a placeholder image.
* If a newly created product is missing from the CRM table, confirm the unfiltered request has no implicit status, the response is no-store and sorted `createdAt DESC`, reset the UI to page zero, verify the product mutation dispatched `notifyProductListChanged`, and search by its numeric ID/name/model/SKU/brand/category. DRAFT products must remain visible; there is no backend product-list cache to restart.
* If minimal CRM product creation fails, compare `ProductForm.validateForm` with `ProductCreateRequest` and `ProductServiceImpl`: only category, RU name, model, price, stock, and brand are essential. Check that empty optional details are omitted/null rather than converted to id `0`.
* If product creation reports `ProductDescriptionI18n.title` max 255, inspect `ProductDescriptionMapper`; descriptions must map only to `contentMd`, never `title`.
* If product description text overlaps characteristics, inspect `min-width: 0` on the details grid/children and `.product-long-copy`; changing database lengths does not fix layout overflow.
* If catalog dropdown labels clip or search covers breadcrumbs, inspect `.catalog-toolbar-shell`, `.catalog-toolbar-panel-wide`, and the active catalog `SmartSearch` root before changing label text. Every desktop category/filter/sort panel must match the white card X/width and start at its bottom edge; inactive search must keep the 19px top/38px right card offsets and open its connected result panel below.
* If CRM CMS image upload fails, check the selected file MIME type plus extension, size, browser multipart payload name `file`, `/api/crm/cms/media/upload`, MinIO availability, bucket config, and whether `ObjectStoragePath.CMS` stores new uploads under `cms/`.
* If a CMS block update fails with duplicate key `uk_cms_block_translation_block_lang`, inspect whether the backend is upserting existing `CmsBlockTranslation` rows by normalized `(blockId, lang)` and whether the CRM payload contains only one translation object per language. `kz` and `kk` are the same DB language and must not both be submitted.
* If a CMS block does not appear publicly, check page `ACTIVE`, block `PUBLISHED`, expected `pageKey`/`blockKey`/`type`, `sortOrder`, and locale mapping (`kz` -> DB `kk`); then verify `PublicApiController.getCmsPage` uses tags `cms`/`cms:{pageKey}`, the CRM mutation response includes `publicCacheRefresh`, and `/api/revalidate` has a matching `CMS_REVALIDATE_SECRET`.
* If CMS image variants do not appear or an old image survives replacement, inspect `mediaId`/`mediaKzId`/`mediaEnId`/`mobileMediaId`/`mobileMediaKzId`/`mobileMediaEnId` in the CRM payload and response, the corresponding `cms_block` foreign keys, media `createdAt`, block `updatedAt`, and `cmsImageSources` versioned fallback order. All variants must reuse `cms_media` and the existing upload endpoint.
* If a public CMS link does not render, inspect both backend validation and `cmsContent.ts`: external links must be valid `http` or `https` URLs, internal links must start with `/` and not `//`, and semantic link types such as `BRAND_PAGE`, `CATALOG_CATEGORY`, `PRODUCT_PAGE`, and `CATALOG_FILTER` must resolve through `routes`.
* If Home or About becomes visually empty after CMS edits, restore the seeded block/media rows or rely on the static fallback path; public CMS integrations should never remove the existing localized message/static asset fallback.
* If CRM mutation feedback shows a technical Java/SQL message, route the caught error through `getCrmErrorMessage(error, localizedFallback)` before displaying it.
* If a pending/rejected/deleted review appears publicly or changes the product rating, inspect both `findAllByProductIdAndStatusOrderByCreatedAtDesc` and `findRatingSummaries`; both must use `APPROVED`.
* If CRM review filters match model/SKU but not localized product names, inspect the `ProductI18n` subquery in `ProductReviewService.getForCrm`.
* If a CRM review table causes mobile body overflow, inspect `.crm-page`, `.crm-panel`, and `.crm-table-wrap` containment before shrinking columns or removing data.
* If catalog sort looks wrong, remember that backend maps sort aliases to entity fields in `ProductPublicController.mapToProductSort`.
* If out-of-stock products appear before available products in any public list, inspect whether that endpoint uses `PublicProductQueryService`. Public ordering must happen before pagination as availability bucket first, then selected sort.
* If CRM product quick-edit values look stuck after a successful backend mutation, inspect `ProductRow` local state synchronization and whether `ProductResponse.price`/`stockQuantity` are present in the list response. Blank inputs must not be converted to `0`.
* If CRM analytics fails with `could not determine data type of parameter`, inspect optional date filters in JPQL/native SQL and split null/non-null query paths before adding casts.
* If product edit shows the same text in all language fields, verify `ProductResponse.productName` and `ProductResponse.descriptionTranslations`; CRM should hydrate edit fields from full translations, not from the localized display `name`/`description`.
* If a bulk product row ignores a characteristic override, compare the row payload with `ProductBulkCreationService` merge logic. Row override values should win over common defaults before calling `ProductService.create`.
* If public analytics tracking causes visible product UI failures, move the failure handling back into the tracking helper/API client. Product view/favorite/cart analytics should fail closed and never show public errors.
* If promotion recommendations include out-of-stock products, inspect `ProductAnalyticsService.isPromotionRecommended` and `ProductServiceImpl.updatePromotion`; public out-of-stock-last behavior and the backend promotion guard should stay aligned.
* If public catalog fuzzy search errors on `similarity` or `pg_trgm`, verify that Liquibase changelog `2026-06-19-01-catalog-filters-and-search.xml` ran and the PostgreSQL extension/indexes exist.
* If smart search hammers the backend, shows stale rows, or updates after closing, inspect `SmartSearch` debounce and `AbortController` cleanup first. Queries shorter than 2 characters should never call the backend, and retry should use the current normalized query.
* If smart search visually separates from the dropdown or home/catalog/product siblings stick out while active, inspect host root and visible frame separately: home/product roots stay absolute and host-sized, desktop catalog uses `.catalog-toolbar-shell`, home centers at no more than 66%/760px, catalog/product center at no more than 70%/760px, catalog search keeps 19px top and 38px inactive right card placement, and the panel connects directly under the input without margin or a double border. Verify host geometry is identical before and after opening.
* If an interrupted UI QA run seems stuck, check for a leftover bounded-test server port/process before continuing, stop only the known task-owned process, and resume from the current source/docs state. Do not rerun a failed `Start-Process` command or replace finite verification with another long-running launch attempt.
* If catalog/category/filter hover looks jumpy, search for `hover:translate-*` or hover-only `font-semibold` in catalog controls and replace it with `.catalog-hover-trigger` / `.catalog-hover-label` underline motion.
* If catalog filter option counts are zero for populated related characteristics, verify the filter key source mapping in `ProductCatalogService`: wristwatch keys should generate options and counts from `watch_details`, interior keys should use actual `interior_clock_details` rows, and the public `country` key should use `brand_country`.
* If catalog products disappear when no filters are selected, inspect whether URL/query cleanup is passing empty keys as active filters. Empty arrays, blank strings, `null`, `undefined`, and `[]` must be removed before request generation and ignored again in backend filter parsing.
* If wristwatch filters are empty even though products have `watch_details`, inspect `product_category` links. Legacy products with `watch_details` and no `interior_clock_details` should be in wristwatch category scopes; migration `2026-06-19-02-normalize-watch-detail-categories.xml` fixes the known interior/floor mismatch.
* If `/api/public/product/catalog/{lang}` returns `400` with `Product not found with id ...` after a filter is applied, compare with a simple `brand=...` query before blaming the filter. `ObjectStorageService.getFirstLinkByProductId` currently throws the same bad-request error when a listed product has no media row.
* If accessories show wristwatch filters, full filter drawers, child-category routing, or cramped gender chips in the primary mobile row, inspect `CatalogPage`, `AccessorySplitControls`, `Catalog`, and `catalogCategories.ts` first. Accessories should hide `CatalogFilters`, keep `categoryCode=ACCESSORIES`, ignore stale full-filter params, and use the second-row `Все` / `Женские` / `Мужские` segmented control backed by one optional `gender` query value.
* If favorite/cart state does not update across product cards, header, and pages, inspect `localProductStorage.ts` subscriptions and storage keys `vympel:favorites` / `vympel:cart` before adding component-local state.
* If the Favorites or Cart page freezes or refetches endlessly after localStorage hydration, inspect whether snapshot refresh writes unchanged data, whether metadata refresh bumps `updatedAt`, and whether effects depend on unstable arrays/objects instead of primitive id keys.
* If favorite/cart toasts show the wrong outcome, inspect the mutation status returned from `localProductStorage.ts` before the toast call. Components should not assume writes succeeded or that add-to-cart can always increment an existing item.
* If cart quantity can exceed stock, inspect `getAvailableStock`, `canIncreaseCartItem`, and the `stockLimit` mutation result in `localProductStorage.ts` before changing CartPage controls.
* If WhatsApp checkout cannot be created, inspect whether CartPage has refreshed product snapshots with `sku`; catalog-added items may need the product-detail refresh before `cartCheckout.ts` can include the article/SKU line.
* If a public empty/error page looks unlike the storefront, check whether it uses `EmptyState`/`ErrorState`, `states.*` localization, and the state/toast tokens in `globals.css` instead of local markup.
* If a localized unknown route renders custom 404 content but returns HTTP 200, inspect streaming boundaries first. Keep `[locale]/[...notFound]/page.tsx` calling `notFound()`, resolve dynamic product/category/brand existence in the route owner, and do not add a locale-wide `loading.tsx` above that decision. Re-run `npm run build && npm run test:production-status`; visible copy alone is not proof.
* If category selection keeps old filters, inspect `CategorySelector` URL cleanup and `CatalogFilters` metadata cleanup; category changes should remove previous price/filter/page params and reload through `categoryCode`.
* If a public link opens the homepage, an old path-style catalog route, or an unfiltered catalog, inspect `src/config/routes.ts` first and replace local href construction with `routes.*` or `catalogLinks.*`.
* If interior clock products fail create/edit validation, confirm the selected category is treated as an interior profile and that CRM submits `interiorClockDetails` instead of `watchDetails`.
* If CRM create/edit rejects a detail block, compare the selected category profile from `CatalogCategoryProfileService` with the payload: wristwatches accept only `watchDetails`, interiors accept only `interiorClockDetails`, and accessories/generic categories accept neither.
* If `next dev` shows stale `next-intl` messages after editing `src/messages/*.json`, verify with `npm run build` and, for browser QA, use the existing dev server after restart or a temporary `next start` from the fresh build on another port. A running `next dev` can hold `.next/dev/lock`.

## Code Style & Conventions

### Frontend

* Path aliases: Use `@/*` for imports from `src/*`.
* Pages: Keep route files under `src/app/[locale]` thin; compose page UI in `src/screens`.
* Components: Use PascalCase directories/files with `index.tsx` for feature components.
* Styling: Use Tailwind utility classes and semantic tokens from `globals.css`.
* Localization: All new user-facing text must be added to localization first and rendered through localization keys.
* Public links: Use `vympel_front/src/config/routes.ts` for public internal routes, catalog/category/filter hrefs, contact links, marketplace links, and product/brand helpers instead of hardcoded `"/"`, `"#"`, `/catalog/...`, `/product/...`, or `/brands/...` strings in components.
* Typography: Use `Text` for normal text and `Heading` for headings; use `Text as="span"` for inline control text.
* Tokens: Reusable font sizes, colors, placeholder sizes, and typography values must live in `globals.css` / global tokens before component use.
* shadcn UI: Use project-local shadcn source components from `src/components/ui`; style their surfaces with VYMPEL semantic tokens instead of leaving raw default foreground/background styling when the component is user-visible.
* Fetching: Use `PublicApiController` for public API calls, not ad hoc `fetch` calls in many components.
* Public CMS: Use `PublicApiController.getCmsPage` with Next tags `cms` and `cms:{pageKey}`, short `revalidate`, backend-triggered `/api/revalidate`, `cmsImageSources`, and `CmsResponsiveImage`; valid CMS content wins and static localized messages/assets remain subordinate fallbacks.
* Catalog query params: Use `src/utils/catalogFilterParams.ts` to normalize catalog search/filter values and keep `categoryCode`, paging, sorting, search, and price controls out of active filter objects.
* Favorites/cart storage: Use `src/services/localProductStorage.ts`; do not call `localStorage` directly from cards, header, product page, favorites page, or cart page.
* Product action feedback: Use `src/hooks/useProductActionToasts.ts` for favorite/cart toasts and branch on `localProductStorage` mutation statuses before showing success, warning, or error copy.
* Product reviews: Use `PublicApiController`, RHF, localized `product.reviews.*` validation/state copy, `RatingStars`, `DropdownSelect` for public review sort/filter controls, and ordinary escaped React text rendering. Public review lists are normalized through `normalizePageResponse`, 15 per page, backend-filtered to approved reviews, and controlled by localized sort/rating/text filters. Keep URL params as `reviewPage`, `reviewSort`, `reviewRating`, and `reviewText`; changing filters/sort resets `reviewPage` to 1 and should not trigger repeated endless fetching. Do not add an unauthenticated review to the visible list before CRM approval. If adding per-star rating distribution, extend the backend approved-summary contract first; never calculate distribution from only the current paginated review page.
* Public request forms: Use `CustomerRequestButton`/`CustomerRequestDialogProvider`, localized `requestDialog.*` copy, RHF validation, and `PublicApiController.createCustomerRequest`. Require email or phone, trim values, pass `source`, disable while submitting, close/reset only on success, and keep messages escaped text.
* Public state UI: Use shared `EmptyState` and `ErrorState` for no-data, not-found, and retryable public-page errors instead of one-off empty text or raw exception messages.
* Client interactions: Add `"use client"` only for components/hooks that need browser APIs, local state, or navigation hooks.
* CRM app: Keep user-facing CRM text in `vympel_crm/src/shared/i18n/messages.ts`; use `useI18n`, `Text`, `Heading`, `Button`, `useNotifications`, and global `--crm-*` tokens instead of raw strings or component-local design values.
* CRM request UI: Keep request processing under `vympel_crm/src/features/requests`, call only `crmApi` methods, and pair every status/comment/cancel mutation with a loading spinner, disabled peer actions, success toast, and `getCrmErrorMessage` error toast.
* CRM admin-only UI: Use `ProtectedShell adminOnly` for `/users` routes and hide admin-only navigation based on `/api/crm/auth/me` roles.
* CRM CMS UI: Keep CMS editing under `vympel_crm/src/features/cms`, mirror DTOs in shared API types, call endpoints through `crmApi`, drive field visibility from `cmsBlockSchemas`, keep optional media variants collapsed by default, preview every type without unsupported empty placeholders, and surface `publicCacheRefresh` warnings without treating the saved CMS write as failed.
* CRM product selects: Render reference option `name` and submit the option `id`; keep any fallback enum labels in localization dictionaries, not inline JSX.
* CRM product profile helpers: Reuse `vympel_crm/src/features/products/productCategoryProfile.ts` for category profile and product type derivation in single and bulk product forms.

### Backend

* Controllers: Use Spring REST controllers with route prefixes such as `/api/public/...`, `/api/auth/...`, `/api/admin/...`.
* Services: Define service interfaces where existing patterns do, then implement with `*ServiceImpl`.
* Persistence: Use Spring Data repositories under `db/repositories`.
* DTO mapping: Prefer MapStruct mappers over manual response assembly when the mapping fits; service methods currently fill some localized and storage-derived fields after mapping.
* Validation: Request DTOs can use Jakarta validation and controller methods can use `@Valid`.
* CRM endpoints: Keep protected CRM routes under `/api/crm/**`, validate request bodies with `@Valid`, and return consistent `ApiErrorResponse` errors through `GlobalErrorHandler`.
* Logging: Use SLF4J with `DEBUG` for local-only detail, `INFO` for important system/business events, `WARN` for rejected/suspicious non-fatal events, and `ERROR` with the exception for unexpected failures. Never use `System.out`, `System.err`, `printStackTrace`, raw request bodies, authorization headers, or token/password DTOs.
* Error correlation: Every error response and security entry point must preserve the `RequestCorrelationFilter` request ID; frontend error objects may retain it for support but public UI must not display stack traces or raw technical messages.
* CRM/admin action logs: Important product/CMS/review/user/collection/image mutations must call `CrmActivityService` with actor/entity context. Keep arbitrary sensitive payloads out of metadata; the sanitized file action is emitted only after the audit transaction commits.
* Review persistence: Keep the review status/author enums aligned with Liquibase checks, trim optional text in the service, reject markup characters at validation, and soft-delete through `DELETED`.
* Customer request persistence: Keep `CustomerRequestStatus` aligned with Liquibase checks, validate contact fields in both DTO/service and DB contact constraint, reject markup characters, and keep public responses limited to id/status.
* CRM user management: Keep `/api/crm/users/**` ADMIN-only, hash admin-created passwords with `PasswordEncoder`, never return password hashes, use `users.enabled` for block/unblock, and audit create/update/role/status changes.
* CRM collection management: Keep collection create/list endpoints under `/api/crm`, require brandId and three translation objects, store DB language `kk` for the frontend `kz` translation, and audit `COLLECTION_CREATED`.
* CMS management: Keep public reads under `/api/public/cms/**` and admin mutations under `/api/crm/cms/**`; require `ADMIN` for CRM CMS endpoints, validate link/media/text requirements in the service, upsert translations by normalized `(blockId, lang)`, and audit create/update/delete/reorder/publish/unpublish/media-upload actions.

### Shared

* API changes: Update Java DTOs, frontend TypeScript types, endpoint builders, API controller methods, and documentation in the same task.
* CRM API changes: Update Java CRM DTOs/controllers and `vympel_crm/src/shared/api/types.ts` / `client.ts` together.
* CMS API changes: Update Java entity/schema/`dtos/cms`, public `CmsTypes.ts`, CRM CMS types/editor schema, public media selection/rendering, Liquibase, tests, and docs together. Translation payloads must be one object per normalized language, while desktop/mobile image variants remain separate media-id fields for each project locale.
* CRM uploads: Use `FormData`, append files under the backend request part name `files`, and let the browser set multipart headers.
* CRM mutations: After quick edits, bulk creation, status/promotion changes, or other product mutations, update local product data from the response or refetch the affected list/analytics view.
* Review contract changes: Update public and CRM DTOs/types/clients together; product list/detail rating fields must continue to represent approved reviews only. Public review query params (`page`, `size`, `sort`, `rating`, `hasText`) must be backend-validated and must always include product id plus `APPROVED` status in the query/specification. CRM review filters can include `hasText` but CRM moderation actions must remain protected and unchanged.
* Request contract changes: Update public and CRM DTOs/types/clients together; public POST accepts only safe contact/request fields and protected CRM request endpoints must remain ADMIN/MANAGER-only.
* Sorting: Keep frontend `ProductSortEnum` values aligned with backend sort alias handling.
* Pagination: Frontend UI pages are one-based; backend Spring pages are zero-based.

## Design System & UI Conventions

* Fonts: Root layout defines CSS variables for Inter, Judson, Montaga, and Montserrat.
* Colors: Prefer semantic classes such as `bg-primary-bg`, `text-text-primary`, `text-text-heading-primary`, and `border-border-default`.
* Radius: Global radius tokens derive from `--radius: 0.750rem`; avoid introducing unrelated radius systems.
* Layout width: Main content commonly uses `max-w-360 mx-auto` with horizontal padding `px-[5.3vw]` and larger breakpoint overrides.
* Responsive public layout: Use `.responsive-page-x`, `.responsive-section-gap`, `.responsive-product-grid`, `.responsive-home-banner-*`, `.responsive-page-banner-image`, `.goods-carousel-*`, `.mobile-bottom-nav-item`, `.product-card-*`, and `.vympel-toast-*` before adding one-off mobile widths. Public mobile support must remain stable at 480px, 390px, 360px, and 320px with no horizontal overflow, clipped critical text, overlapping controls, one-letter columns, or forced desktop layouts.
* Assets: Use existing files in `public/` for banners and catalog imagery; custom icons live in `src/assets/icons`.
* Large mobile banners: Do not force desktop `object-cover` crops when the asset contains important product/text composition. Use contained or controlled aspect mobile strategies for promotional banners, keep main mobile hero banners visually tall/near full-screen, and use a soft background/foreground strategy when a wide baked-text banner must remain readable on narrow phones.
* Loading UI: Catalog cards use `GoodCardSkeleton` and the global `.skeleton` shimmer.
* Product page images: Main product gallery must use the local shadcn/Embla carousel pattern, show one large selected image at a time, and loop when there are multiple images. Never render a vertical stack of full-size images. Keep a stable large desktop image area, moderately larger side thumbnails, clean dark/project-style active thumbnail border, and up/down thumbnail controls that render only when thumbnails overflow and stay within the main image height. Thumbnail lists should scroll/window by two items near edges when many photos exist, the main image must act as a synchronized previous/next slider, and enlarged photos must be browsable in a synchronized lightbox. Mobile uses a large main carousel image first and a small horizontal scroll thumbnail rail. Avoid stretching product photos with `object-cover`. When `images` is empty, render `ProductImageFallback` at the same frame size and omit thumbnails/slider/lightbox - never inject fake product art.
* Product page summary sizing: Title `text-product-title`/`leading-product-title`, gender/category `text-product-meta text-text-product-muted`, price `Text size="h5"`, cart button `311x50 bg-button-bg-product` with `Text size="bodyMd"`, favorite button `50x50`, action buttons `74x74`.
* Product page localization: Search, gallery aria labels, summary states/actions, tab labels/content, specs labels/units/details labels, related heading, and contact banner copy live under `product.*`; related carousel/card aria labels live under `goodsCarousel` and `good`.
* Public product cards: Pass `status`, `stockQuantity`, `ratingAverage`, and `ratingCount` into `GoodCard`; unavailable cards use `good.outOfStock`, and absent `img` uses shared `ProductImageFallback` rather than a name or fake photo. Cards fill their grid/carousel cell, but the catalog grid owns card width: at 1024px and above it uses exactly three equal columns so a card never stretches beyond one third of the grid and a short row stays left-aligned. Keep favorite/cart/rating/availability behavior readable down to 320px.
* Public empty/error states: Use `EmptyState`/`ErrorState`, localized `states.*` copy, and `--color-state-*`, `--spacing-state-*`, `--shadow-state` tokens for catalog, favorites, cart, product, related-products, and 404 states.
* Public toasts: Sonner styling lives in `src/components/ui/sonner.tsx` and `globals.css` tokens `--color-toast-*`, `--text-toast-action`, `--spacing-toast-*`, and `--shadow-toast`; favorite/cart navigation actions should use concise localized labels like `Перейти`, while favorite removal should show `Отменить` and restore the removed snapshot. Toast text may wrap on mobile but must wrap naturally inside the card, action buttons must be smaller rounded pills, and the surface must not look like a red debug/issues badge unless the toast is a real error.
* Public dialogs: Ordinary form dialogs should use the VYMPEL shadcn/Radix `Dialog` wrapper, close on outside click/Escape/close icon, keep clicks inside content from closing, and rely on `scrollbar-gutter: stable` for no horizontal page shift. Destructive confirmations should use `AlertDialog` with explicit localized cancel/confirm actions. For long modal forms, keep the outer content clipped and put scroll on an inner body; hide or subtly style native scrollbars inside that body so the rounded modal layout stays clean and usable on small-height screens.
* Public destructive dialogs: `AlertDialogContent` supports `closeLabel` and `showCloseButton`; pass a localized close label when the close icon is visible, and keep explicit cancel/confirm buttons for destructive cart actions.
* Public request dialog: Match the request-dialog Figma direction with centered 20px-radius content, desktop 50px x / 40px y padding, 24px/500 title, 16px/400 labels, pill inputs with `#D2D2D2` borders and black focus, full-width `#525252` submit button, responsive mobile padding, and localized success/error/loading states. The phone field uses the Kazakhstan `+7 XXX XXX XX XX` mask and submits normalized `+7XXXXXXXXXX`; email-or-phone validation must still require at least one valid contact method.
* Product details tabs/specs/reviews: Use global product details tokens rather than arbitrary values. The description/spec grid and both children must be `min-width: 0`; administrator-entered description/feature text uses `.product-long-copy` so even unbroken strings wrap inside the column. Characteristic labels/values stay one visual row where possible. Warranty/delivery/payment tabs should use the localized 20px info-block copy and `Подробнее` arrow links to their detail pages. Reviews remain localized, approved-only, and inside the fifth tab.
* VYMPEL motion: Use `--duration-vympel-fast/base/slow`, `--ease-vympel`, and `transition-vympel*` for search/dropdown/filter/category motion; global `prefers-reduced-motion` must keep motion near-instant for reduced-motion users. Catalog hover must use underline/color motion rather than translate or height-changing effects.
* Product contact banner: Use `/contact_banner.png`, `--color-connect-*`, `--spacing-connect-banner-*`, `Button` `connectBanner` variant/size, desktop `Heading size="h1xl"`/60px, mobile `text-4xl` fallback for fit, and `Text` colors `connectButton`/`connectSide`.
* About page: Use `/about-us-banner.png` full-width, `/insta-1.png` through `/insta-4.png` in the existing Embla carousel/dots, localized `aboutPage.*` strings, `Heading`/`Text`, and `.about-*` globals for section rhythm, company cards, and Instagram sizing. Company cards must be `min-width: 0`, one-column on mobile, and use fixed-size number badges so long headings/body copy wrap inside the card instead of clipping or creating body overflow.
* Public info pages: Use `src/screens/InfoPages` and `src/components/InfoPages` for Warranty/Delivery/Payment-style pages. Body text is Inter 20px/300 with `Text size="bodyLg" weight="light"`, highlights are 500 weight through localized rich text, paragraph spacing is `--spacing-info-paragraph-gap` (30px), and title-to-body gap is `--spacing-info-title-text-gap` (40px). The page wrapper adds no final padding; Footer supplies the 120/96/64px final gap.
* Info page warranty badges: Reuse `WarrantyBadges`; badges have `border-border-default`, 60px vertical padding, 72px desktop gap, 20px icon/text gap, same-size fixed icon circles, centered icons, 22px main text in `headingSecondary`, and 15px muted subtext.
* Info page store block: Reuse `StoreLocationBlock`; `/shop.png` is 1318x940 and should render at the 659/470 ratio without distortion, next to localized contact rows on desktop and stacked on mobile.
* CRM layout: Use a dark tokenized sidebar, white surfaces, compact metric panels, table-first product management, and responsive collapse to a single-column shell below tablet width.
* CRM forms: Use React Hook Form, `/api/crm/references`, localized validation, and existing payload helpers. Product create requires only category/RU name/model/price/stock/brand; keep optional translations/descriptions/details truly optional and never serialize blank numeric ids as `0`.
* CRM product lists: Keep unfiltered DRAFT/ACTIVE/ARCHIVED products visible, default newest-first, reset to page zero on search/status changes, and expose page counts plus previous/next controls. Search covers ID/model/SKU/status/brand/category/localized name through backend queries. Use no-store requests/responses plus mutation/focus refetch; never require a server restart to see committed rows.
* CRM collection forms: Inline collection creation in `ProductForm` uses `.crm-form-section`, localized loading/success/error messages, and updates local references so the new collection is immediately selectable.
* CRM product photo forms: Use `.crm-photo-grid`, `.crm-photo-preview`, `.crm-photo-preview__badge`, compact actions, and `--crm-photo-thumb-size`; preview dynamic MinIO/blob URLs with ordinary `<img>` plus an on-error no-photo surface. New products must be created first, uploaded through multipart `files`, then opened at `/products/{id}` so success and retry paths never lose the created record. Reorder, main selection, and deletion always round-trip through backend ownership validation.
* CRM ACTIVE photo policy: If ACTIVE is requested without a persisted main image but selected files exist, persist DRAFT, upload, then activate. Without files, show localized guidance. Disable final-image deletion using persisted server status, map stable backend codes to RU/KZ/EN copy, and do not offer ACTIVE in bulk creation until that flow gains an image phase.
* CRM feedback UI: Global notification toasts live in `NotificationProvider` and should use `--crm-color-success`, `--crm-color-warning`, `--crm-color-danger`, `--crm-space-*`, `--crm-radius-*`, and `--crm-shadow-panel` tokens.
* CRM destructive confirmations: Use shared `ConfirmDialog` for delete/cancel actions in review moderation, request processing, CMS editing, and product-image management. Do not use browser `confirm()` in CRM screens.
* CRM CMS editor UI: Use `.cms-layout`, `.cms-page-button`, `.cms-block-card`, `.cms-editor-section`, `.cms-locale-grid`, `.cms-image-variant`, and `.cms-preview-*`; show only schema-supported groups, keep KZ/EN/mobile uploads behind the variants toggle, and keep desktop/mobile previews in the same workflow.
* CRM review moderation UI: Keep pending count prominent, pending rows visually highlighted, filters RHF-backed and localized, approve/reject/delete buttons disabled with the shared loading spinner during mutations, and delete behind localized confirmation. Dense review tables scroll only inside `.crm-table-wrap`; `.crm-page` and `.crm-panel` must stay `min-width: 0`.
* CRM request processing UI: Keep new count prominent, new rows visually highlighted, filters RHF-backed and localized, the detail panel responsive, admin comments plain text, and status/comment/cancel buttons disabled with the shared loading spinner during mutations. Dense request tables scroll only inside `.crm-table-wrap`; `.crm-page` and `.crm-panel` must stay `min-width: 0`.
* CRM user-management UI: Use `Text`, `Heading`, `Button`, `Field`, `.crm-table`, `.crm-chip`, and `--crm-*` tokens; keep all labels/errors/statuses/roles localized in `messages.ts`.
* Catalog filters: Use `--color-catalog-filter-*` and `--spacing-catalog-filter-*` tokens. Category/filter/sort panels use `.catalog-toolbar-panel-wide` from 1024px and anchor to the compact toolbar/card edge; the full labeled toolbar/search row starts only at 1440px. Phone layouts below 1024px use the shared overlay controller and Radix sheet shell with category tabs, one scrolling options body, safe-area Apply/Reset actions, and native radios for sort. Filter labels use `.catalog-hover-trigger`/`.catalog-hover-label`, but active filter-group state should keep only the border/background outline and suppress the underline through `.catalog-filter-menu-label`. Accessories omit the filter drawer and keep the segmented gender row through 1439px.
* Catalog category selector: Place the desktop category selector left of Filters, use the same trigger text/gap style, fetch backend categories, and show children next to the hovered/focused root rather than flattening all categories. Use hover intent and subtle submenu opacity/translate motion to avoid flicker. On mobile, both the catalog toolbar and bottom navigation open the same provider-owned full-height category flow. Parent categories with children must include an `All products` action for the parent listing. Category row hover must not translate, resize, or change row height.
* Smart search: Use `--spacing-search-overlay-*` tokens and a connected input/panel surface. Home and product keep stable host-owned absolute roots; catalog search is owned by `.catalog-toolbar-shell`. From 768px the catalog frame always uses the 19px top/38px right shell anchor; the inactive state remains icon-only through 1439px and the 430px full field starts at 1440px. Active search stays centered in the same shell. Opening or closing must not change row height, shift breadcrumbs, overlap adjacent controls, or separate the result panel from the input. The catalog variant must participate in `CatalogOverlayProvider`, hide bottom navigation on phone overlays, close competing controls, and restore focus to the trigger. Results are product-only and use `ProductImageFallback` when media is absent.
* Catalog hover: Catalog category selector rows, filter category rows, and filter option labels should use `.catalog-hover-trigger` with `.catalog-hover-label` for underline-only hover/active states. Hover must not translate controls, change row height, or make font weight jump.
* Mobile footer: The phone footer should be purpose-built: centered brand/social/contact block first, then polished centered vertical link groups for Sections and Information using card/pill-like touch rows. Do not force the desktop multi-column footer or raw `FooterList` styling into a compressed phone layout, and keep enough bottom spacing for the fixed mobile nav.
* Cart stock limit UI: Cart quantity plus buttons disable at `stockQuantity`, use shadcn Tooltip around a non-disabled wrapper for the disabled control, and show the subtle localized `cart.stockLimitInline` message under the item.
* Cart destructive actions: Single-item delete and full-cart clear must use VYMPEL-styled shadcn/Radix confirmation dialogs with localized copy and rounded project buttons. Do not use browser `confirm()`.
* WhatsApp checkout: Keep order handoff in `src/utils/cartCheckout.ts`; the article/SKU line belongs at the end of each product item block, after line total, before the next item or order total.
* Favorites page: Use standard `Navigation`/breadcrumbs, 40px top page spacing, `Heading`, existing `GoodCard`, `SectionWithTitle`, and `GoodsCarouselWithImage`; keep the gap before `Похожие товары` on `--spacing-favorites-section-gap` (120px), not an inline magic number. Favorite cards should use `.brand-product-grid.favorites-product-grid` so the reusable 270px card sizing/gaps are preserved while the grid starts from the left edge of the content area instead of centering a short row.
* CRM category-specific specs: Product creation starts with category selection. Wristwatch children inherit optional watch fields; interior-clock categories render optional interior fields; partial detail groups are valid for drafts; accessories render the no-specs hint and never submit wristwatch controls.
* CRM bulk creation UI: Keep the first screen as category selection, then shared common fields, then a dense row table with add/duplicate/remove controls and row-level errors.
* CRM analytics UI: Use compact metric cards and tables for product popularity; period controls should be select/segmented-control style, and promotion actions should be ordinary mutation buttons with loading/disabled states.

## Dependencies - Gotchas

| Package | Version | Area | Gotcha |
| ------- | ------- | ---- | ------ |
| `next` | 16.1.3 | frontend | App Router params are promises in existing route files; follow local route typing style. |
| `next-intl` | 4.13.2 | frontend | Locale prefixes are mandatory and locale detection is disabled in `proxy.ts`; route prefix `kz` must emit HTML language `kk`. |
| `tailwindcss` | ^4 | frontend | Tokens are mostly declared in `src/app/globals.css`; `tailwind.config.js` is minimal. |
| `@reduxjs/toolkit` | ^2.11.2 | frontend | Store exists but has no reducers yet; do not assume app state is Redux-backed. |
| `vitest` | ^3.2.7 | frontend | Tests run in the Node environment through `npm run test`; path alias `@` is configured in `vitest.config.ts`. On this Windows sandbox, esbuild process spawn may require the existing scoped permission. |
| `react-hook-form` | ^7.71.1 public / ^7.80.0 CRM | frontend/CRM | Use RHF for form values. The public app has Zod available; the CRM app currently has no schema resolver, so keep localized validation helpers in the component unless a resolver is intentionally added. |
| `radix-ui` | ^1.6.0 | frontend | shadcn Tooltip imports primitives from the monolithic `radix-ui` package; keep Tooltip styling in `src/components/ui/tooltip.tsx` aligned with VYMPEL tokens. |
| `org.springframework.boot` | 4.0.2 | backend | Build uses Java 17 toolchain; run with the Gradle wrapper. |
| `spring-boot-starter-data-redis` | Spring Boot managed | backend | Production abuse state uses atomic Lua counter/expiry operations. Redis must be shared, TLS-protected, authenticated/ACL-scoped, monitored, and configured with deliberate persistence/memory/eviction behavior. |
| `logback-classic` | Spring Boot managed | backend | File appenders are configured in `logback-spring.xml`; use project `SensitiveDataMaskingLayout`, valid Logback classes for the managed version, and finite context tests after config changes. |
| `liquibase-core` | managed plus starter | backend | Schema is migration-owned; do not rely on Hibernate auto-DDL. |
| `io.jsonwebtoken` | 0.12.6 | backend | Access and refresh types are parser-separated; every token requires issuer, audience, subject, jti, iat, and exp. Non-local `VYMPEL_JWT_SECRET` is at least 48 high-entropy characters, has no usable base fallback, and must differ from the limiter HMAC secret. |
| `software.amazon.awssdk:s3` | 2.25.0 | backend | Config is S3-compatible MinIO style with path-style access. |
| `next` | 16.1.3 | CRM frontend | The separate `vympel_crm` app has its own install/build/lint lifecycle and runs dev on port `3001`. |
| `vitest` | ^3.2.7 | CRM frontend | Finite Node-environment auth/client tests use an explicit `@` alias in `vitest.config.ts`; esbuild process startup may require running outside the restricted desktop sandbox. |

## Environment & Setup Gotchas

* Frontend commands must run in `vympel_front`.
* CRM commands must run in `vympel_crm`.
* Backend commands must run in `vympel_back`.
* Root `compose.yml` is the authoritative local topology. `vympel_back/docker-compose.yml` only includes it for compatibility; do not duplicate service definitions there.
* Root `.env` must live beside root `compose.yml`; Compose loads it automatically, but IntelliJ/Spring Boot and sibling Next processes do not. Keep working values in ignored `.env`, keep root `.env.example` blank/placeholder-only, and use `docker compose config` with assertion-only output to verify resolution without leaking credentials.
* Full Docker and IntelliJ hybrid mode intentionally use different endpoints. Docker backend values are `postgres:5432`, `redis:6379`, `minio:9000`, and `public:3000`; explicit Spring `local` fallbacks are `localhost:5433`, `localhost:6379`, `localhost:9100`, and `localhost:3000`. Runtime environment variables override `application-local.yml`; outside local/test, base configuration remains empty and the validator fails closed.
* IntelliJ Run/Debug Configuration must explicitly set `SPRING_PROFILES_ACTIVE=local`. That is the only required IDE environment entry while the checked local-profile fallbacks are suitable; developers may override any `VYMPEL_*` value in the run configuration without editing committed configuration.
* When rotating the local PostgreSQL credential in root `.env` while reusing `postgres-data`, also alter the existing `vympel_local` role credential before recreating the container; changing `POSTGRES_PASSWORD` does not rewrite an initialized PostgreSQL volume. Never solve this by silently deleting named volumes.
* Local CMS revalidation is a two-process contract: Docker root `.env` passes one server-only value to backend and public containers, while hybrid mode pairs the backend local-profile fallback with ignored `vympel_front/.env`. Never rename it to or mirror it through a `NEXT_PUBLIC_*` variable.
* Local ADMIN bootstrap is opt-in through `VYMPEL_BOOTSTRAP_ADMIN_ENABLED=true` in ignored root `.env`; Compose forwards the four server-only variables only to backend. IntelliJ must receive the same variables explicitly because it does not load root `.env`. Changing the configured password after creation does not rotate or reset the existing account; use the protected CRM user-management flow or an intentional local database action instead.
* Full Docker startup is `docker compose up -d --build --wait`; ordinary cleanup is `docker compose down`. `docker compose down -v` destroys PostgreSQL/Redis/MinIO/log volumes and must remain an explicit manual reset.
* Docker defaults are public `3200`, CRM `3201`, backend `8080`, PostgreSQL host `5433`, Redis `6379`, and MinIO API/console `9100`/`9101`. Conventional hybrid npm ports remain `3000`/`3001`; isolated QA may use `3100`/`3101`, but those listeners and their task-owned working copies must be closed during final cleanup.
* The backend container receives the explicit `local` Spring profile plus `postgres:5432`, `redis:6379`, `minio:9000`, and `public:3000`. Never use host-published ports for service-to-service calls.
* Browser-facing API/media values use published localhost ports and public `NEXT_PUBLIC_*` values are compiled during the Next build. CMS/S3/database/JWT/limiter secrets are server-only and must never use `NEXT_PUBLIC_*`.
* Local MinIO client traffic uses `http://minio:9000`; generated browser links use `http://localhost:9100`. The finite initializer creates `dev-backet` idempotently and sets anonymous download only for this local bucket.
* Docker CORS defaults to exact origins `http://localhost:3200` and `http://localhost:3201`; hybrid IDE mode uses `3000` and `3001`. Non-local startup still requires injected exact HTTPS origins.
* Backend needs PostgreSQL at host `localhost:5433/vympel_db` in hybrid IDE mode. Base/non-local startup requires injected non-placeholder `VYMPEL_DB_URL`, username, and password.
* If a clean frontend image fails at `npm ci`, validate or regenerate the owning `package-lock.json`; do not copy host `node_modules` or switch the Dockerfile to an incremental install.
* If backend rolling logs fail with permission denied on a fresh volume, verify `backend-logs-init` completed and `/app/logs` is owned by UID 10001.
* If CMS revalidation returns `REQUEST_FAILED` with `HTTP/1.1 header parser received no bytes`, keep the service URL on Compose DNS and verify `PublicCmsCacheInvalidationService` forces HTTP/1.1; do not bypass the network with `host.docker.internal`.
* Backend logs default to `vympel_back/logs` when the process working directory is `vympel_back`. Set `APP_LOG_DIR=/var/log/vympel` on a managed server or `/app/logs` in a backend container and ensure the service user can write there.
* The local backend Compose profile does not mount production logs; a deployed service must mount its configured `APP_LOG_DIR` independently.
* Log archive defaults are 50 MB per segment, 30 days, and 256 MB per log family. Adjust with `APP_LOG_MAX_FILE_SIZE`, `APP_LOG_RETENTION_DAYS`, and `APP_LOG_TOTAL_SIZE_CAP`, not by editing absolute paths into Logback config.
* `VYMPEL_JPA_SHOW_SQL` and `VYMPEL_JPA_FORMAT_SQL` default to `false`; enable them only for bounded local diagnosis because SQL output is noisy and can reveal business data.
* Recommendation stage-3 price matching defaults to 25% through `VYMPEL_RECOMMENDATION_PRICE_BAND_PERCENT`; each native recommendation query defaults to a 1500 ms timeout through `VYMPEL_RECOMMENDATION_QUERY_TIMEOUT_MS`.
* Catalog/facet and recommendation slow-operation logs default to 500 ms through `VYMPEL_SLOW_OPERATION_THRESHOLD_MS`; tune the deployment value instead of adding request-specific or high-cardinality log/metric labels.
* The frontend public API base URL currently points to `http://localhost:8080/api/public`.
* Immediate public CMS refresh requires both sides: backend `VYMPEL_CMS_PUBLIC_REVALIDATE_ENABLED=true`, `VYMPEL_CMS_PUBLIC_REVALIDATE_URL`, and `VYMPEL_CMS_REVALIDATE_SECRET`, plus public frontend server-only `CMS_REVALIDATE_SECRET` with the same value. Non-local startup fails closed when this contract is disabled/missing/weak; local hybrid mode targets the public app on localhost, while tests disable delivery unless they opt in. Do not use a `NEXT_PUBLIC_*` secret. The durable job handles transient failures and the short tagged cache window remains a safety net.
* CMS media cleanup defaults to a 24-hour grace period, a bounded daily batch, and bounded storage timeouts/backoff. Local/test disable the schedule; use the ADMIN dry-run before any explicit cleanup. A dry-run candidate is evidence of zero DB references at that instant, not permission to delete without environment-specific object/public/CRM confirmation.
* The CRM API base URL defaults to `http://localhost:8080/api/crm` through `NEXT_PUBLIC_CRM_API_BASE`.
* CRM dev server runs on `http://localhost:3001`; backend CORS must include that origin.
* CRM refresh cookies default to `SameSite=Lax`, path `/api/crm/auth`, and `Secure=true` in base configuration. Local HTTP must explicitly activate Spring profile `local`, whose host-development fallbacks include `Secure=false`. Production must never activate `local`, must use HTTPS, preserve a same-site CRM/API deployment, and use exact non-wildcard CORS origins.
* Non-local abuse control requires `VYMPEL_RATE_LIMIT_STORAGE=redis`, a protected `rediss://` `VYMPEL_REDIS_URL`, an independent strong `VYMPEL_RATE_LIMIT_HMAC_SECRET`, and the exact ingress ranges in `VYMPEL_TRUSTED_PROXY_CIDRS`. Memory mode is local/test only.
* Root `.env.example`, `vympel_back/.env.example`, and `vympel_front/.env.example` contain placeholders/key examples only. Never add deployed secrets to those files, a Dockerfile, Compose environment values, or `NEXT_PUBLIC_*` variables.
* Product uploads default to 10 MB per file and 101 MB per multipart request through `VYMPEL_MULTIPART_MAX_FILE_SIZE` and `VYMPEL_MULTIPART_MAX_REQUEST_SIZE`; keep these aligned with CRM/ObjectStorageService limits.

## Step 8 Durable Security, Privacy, Performance, and Observability Rules

### Test browser response headers as real responses

* **When to use:** Any public/CRM Next configuration, dependency, external origin, static-delivery, or ingress change.
* **How:** Keep the policy in the owning `security-headers.mjs`; run both the unit policy matrix and bounded production server probe against HTML, static chunks, first-party API, and public assets.
* **Why:** Header presence on one HTML route does not prove static/API coverage, production policy, or cleanup.

### Build CSP from measured exact origins

* **When to use:** Adding an API, media host, analytics destination, font, frame, or other browser resource.
* **How:** Add the exact HTTP(S) origin through configuration, stage with `SECURITY_HEADERS_CSP_MODE=report-only`, observe violations, then enforce. Never add `*` or production `unsafe-eval` as a shortcut.
* **Why:** A narrow measured allow-list limits injection/exfiltration without silently breaking required resources.

### HSTS belongs at production HTTPS ingress

* **When to use:** Production TLS deployment.
* **How:** Emit HSTS only at the TLS terminator after every covered subdomain is HTTPS; local HTTP and Next application tests must see no HSTS. Treat preload as a separate approval.
* **Why:** Application code cannot know whether the external request and subdomain estate satisfy HSTS safety.

### Minimize analytics before pseudonymizing it

* **When to use:** Adding or changing product/customer behavior analytics.
* **How:** Persist only necessary business dimensions and time. Do not retain raw IP, full User-Agent, account link, session identifier, or arbitrary metadata when aggregate product/event/time answers the question. An ephemeral limiter/dedup key is not an analytics column.
* **Why:** Hashing unnecessary identifiers preserves linkability and does not satisfy data minimization.

### Enforce retention in bounded code

* **When to use:** Any analytics/audit/event table with a retention promise.
* **How:** Use a configurable cutoff, dry-run count, transaction/advisory lock, bounded delete batches, deletion metric, integration test, and first-deployment rehearsal. Documentation without scheduled enforcement is not a retention control.
* **Why:** Prevents indefinite drift and avoids multiple instances launching unbounded cleanup together.

### Gate static assets and route payloads

* **When to use:** Adding/replacing public images, fonts, or meaningful frontend dependencies.
* **How:** Preserve crops/dimensions, optimize only an explicit repository-owned allow-list, keep runtime uploads separate, run `npm run test:budgets:ci` after both builds, and require a documented exception. Measure representative production route transfer as well as repository bytes.
* **Why:** A small source diff can create a large user download; a tested failure fixture proves the gate can actually reject regression.

### Expose minimal anonymous health only

* **When to use:** Kubernetes/ingress/load-balancer probes.
* **How:** Permit only named liveness/readiness groups, hide details, protect all other Actuator paths, include only dependencies required by the documented availability policy, and restrict probes at the network edge.
* **Why:** Operators get a useful signal without publishing environment/component inventory.

### Scrub first-party client telemetry

* **When to use:** Reporting browser errors, API failures, or Web Vitals.
* **How:** Default to disabled/no-op; use same-origin collection unless a reviewed provider is configured. Remove tokens, cookies, auth headers, emails, phones, IPs, URL queries, passwords, secrets, and form/review/request text; bound payload/message sizes and retention. Do not elevate routine 400/404/429 responses.
* **Why:** Error tools otherwise become a second uncontrolled copy of private input and credentials.

### Preserve real backend request IDs

* **When to use:** Mapping backend failures into public/CRM typed errors, support UI, or telemetry.
* **How:** Prefer structured error `requestId`, fall back to `X-Request-Id`, propagate it through typed clients, and display/report it only for suitable unexpected failures. Never fabricate a support reference.
* **Why:** One identifier joins customer diagnostics to backend logs without exposing bodies or personal identity.

### Sample Web Vitals with normalized routes

* **When to use:** Browser performance telemetry.
* **How:** Capture LCP/INP/CLS/FCP/TTFB with bounded configurable sampling, replace dynamic IDs/queries with low-cardinality route shapes, and measure bundle budgets after telemetry changes. Errors follow separate deduplication and must not be accidentally sampled away.
* **Why:** Prevents metric-cardinality and bundle regressions while retaining actionable field signals.

### Reject unsupported catalog sort tokens

* **When to use:** Public catalog query changes.
* **How:** Map an exact server-owned token allow-list; omitted/blank may use the default, but every unsupported nonempty/case-variant token returns stable 400 `INVALID_SORT`. Keep a deterministic tie-breaker and never bind arbitrary property names.
* **Why:** Silent fallback hides contract bugs and generic sorting exposes internal fields/performance behavior.

### Localize accessible names like visible copy

* **When to use:** Landmarks, icon-only controls, pagination, carousels, search, breadcrumbs, meaningful image alt, dialog/error controls, and shared inputs.
* **How:** Add RU/KZ/EN values to the existing message architecture or require localized props. Do not keep a generic English fallback that can leak after locale switching; decorative images keep empty alt.
* **Why:** Assistive-technology users must receive the active locale without adding unnecessary visible text.

## Step 9 Durable Verification and Release Rules

### Clean audit artifacts by proven ownership, not by filename

* **When to use:** Removing verification copies, test databases, containers, logs, or generated folders from a dirty multi-repository workspace.
* **How:** Read the recovery/final reports first; inventory hidden files, Git boundaries, ignore rules, processes, ports, Docker mounts/volumes, and evidence locations. Hash-compare temporary source copies to working trees while excluding generated caches. Resolve and validate exact filesystem paths before recursive deletion. Remove only containers/volumes/processes whose task ownership is established, then re-audit the active stack and evidence counts. Never run broad Git or Docker cleanup when unrelated state is present.
* **Why:** This workspace has unusable root/CRM Git metadata, heavily dirty backend/public repositories, shared Docker resources, and release evidence beside ordinary runtime logs. Name-only cleanup can destroy application work, data, or proof.

### Preserve evidence through nested Git ignore boundaries

* **When to use:** Runtime logs are generally ignored, but audit logs under `docs/tasks` are repository-owned evidence.
* **How:** Keep generic `*.log` rules inside each application repository to suppress local launch transcripts, and add explicit root exceptions for `docs/tasks/**/logs/**`. Verify the effective rule with `git check-ignore` whenever a usable repository boundary exists.
* **Why:** Parent `.gitignore` files do not govern an independent nested repository, while a broad root log rule can accidentally hide the final evidence packet if root Git is repaired.

### Consolidate nested Git through reversible metadata moves

* **When to use:** Replacing the unusable root plus dirty nested repositories with one clean root baseline while current source and index state must remain recoverable.
* **How:** Inventory every `.git` file/directory outside generated trees with optional Git locks disabled; record branches, remotes, reachable commits, staged/unstaged/untracked counts, and `fsck` results. Choose a unique same-drive backup root outside the workspace, preserve each literal `.git` directory under an app-specific path, prepare reverse mappings and hash/count checks, then request approval immediately before the move. Move metadata only, verify the external copies, and use separate approval gates for root initialization, baseline commit, remote configuration, and push. Build the root `.gitignore` before initialization and keep final-release evidence exceptions after generic log/temp rules.
* **Why:** The working files contain substantially newer uncommitted work than the old histories, the storefront commit is locally unique, and both usable indexes contain staged snapshots plus further unstaged edits. A reversible metadata move preserves every recovery path without forcing old histories or remotes into the requested clean monorepo baseline.

### Start a fresh transaction from after-commit callbacks

* **When to use:** A Spring `TransactionSynchronization.afterCommit` or completion callback needs to read/write repositories.
* **How:** Run the database work through a dedicated `TransactionTemplate` using `PROPAGATION_REQUIRES_NEW`; add a focused regression and a real lifecycle check when the operation also owns object storage.
* **Why:** The original transaction has committed but may still be bound to the thread, so ordinary transactional interception can produce `No active transaction` after a successful HTTP response.

### Build verification copies with the exact runtime environment names

* **When to use:** Isolated Next production builds/runs against a task-owned backend.
* **How:** Public requires both `BASE_API_PUBLIC` and `NEXT_PUBLIC_BASE_API_PUBLIC`; media CSP/rendering requires `NEXT_PUBLIC_MEDIA_ORIGINS`. CRM requires `NEXT_PUBLIC_CRM_API_BASE`. Set them before `next build` because public client values are compiled into the bundle; then verify a real data page, not only the home shell.
* **Why:** A successful build with generic or wrong variable names can silently target the wrong API and make browser/a11y evidence test an error state.

### Audit the complete dependency graph after a security update

* **When to use:** Any frontend framework/security dependency upgrade.
* **How:** Run clean `npm ci`, finite tests/build/security gates, `npm audit --omit=dev`, and full `npm audit`. Document narrow transitive overrides with the owning package. Keep Next and `eslint-config-next` aligned.
* **Why:** Production-only auditing missed advisory-bearing dev/transitive packages that still affect the build and release supply chain.

### Run accessibility scans against configured real data

* **When to use:** Release accessibility verification for catalog/product/admin views.
* **How:** Build with the real isolated API origins, open representative localized data routes, then run axe and manual keyboard/focus/heading/landmark/overflow/alt checks. Retain earlier failing scans as defect evidence and rerun after every semantic fix.
* **Why:** Error/empty pages can pass while real product-card heading order or labeled rating markup still fails.

### Map route locale separately from HTML language

* **When to use:** Setting `<html lang>` for the legacy `/kz` route.
* **How:** Use `toHtmlLanguage`: `kz` maps to ISO language `kk`; `ru` and `en` map directly. Keep route URLs unchanged and test all supported values.
* **Why:** Route compatibility and standards-correct document language are separate concerns.

### Keep screenshot extensions consistent with capture bytes

* **When to use:** Browser automation returns raw screenshot bytes.
* **How:** Inspect the magic bytes and store JPEG as `.jpg` or PNG as `.png`; update the screenshot index after any normalization.
* **Why:** Some browser capture APIs return JPEG even when a `.png` path is supplied, which can confuse renderers and evidence tooling.

### Treat staging readiness and production approval separately

* **When to use:** Closing a full-system verification task.
* **How:** Allow **READY FOR STAGING** only when no Must-fix application issue remains. Keep migration-history drift, TLS/HSTS/Redis/backups/alerts, real CMS revalidation, and SEO decisions as explicit production conditions with owners/checklist items.
* **Why:** Local correctness evidence cannot prove deployment infrastructure or authorize an unattended production rollout.

### Keep frontend image configuration split by visibility

* **When to use:** Building standalone storefront or CRM images for a target environment.
* **How:** Compile only browser-visible API/media/environment/release values through `NEXT_PUBLIC_*`; keep internal SSR URLs and CMS revalidation HMAC server-only. Rebuild the frontend image whenever a compiled public origin changes.
* **Why:** Next.js embeds public values at build time, while secrets in a public variable become browser-readable.

### Run migrations as a finite release job

* **When to use:** Deploying backend replicas from an immutable image.
* **How:** Start the same backend image once with Liquibase enabled, scheduling disabled, no published port, and `VYMPEL_MIGRATION_ONLY=true`; verify `databasechangelog`, then close the context and start regular replicas with Liquibase disabled. Keep the normal web application type because this project's `SecurityConfig` requires `HttpSecurity` during context creation. Use new forward-fix changesets rather than editing applied history.
* **Why:** A single bounded migration owner avoids concurrent replica migration races and separates schema failure from application promotion.

### Use one full commit SHA across independent images

* **When to use:** Releasing backend, storefront, and CRM together.
* **How:** Tag all three image boundaries with the same full 40-character Git SHA, record registry digests in the release manifest, and roll applications back only to an explicitly supplied compatible prior SHA.
* **Why:** The deployment is reproducible and auditable without coupling the applications into one image or relying on mutable `latest` tags.

### Bootstrap ADMIN once, then disable it

* **When to use:** A controlled environment has no initial ADMIN.
* **How:** Supply temporary `VYMPEL_BOOTSTRAP_ADMIN_*` secrets externally, enable for one deployment, verify login, disable bootstrap, rotate/remove the secret, and redeploy. Existing ADMIN users must cause no write or password reset; an existing non-admin email is a hard failure.
* **Why:** Idempotence supports restart/concurrency while avoiding a permanent privileged credential rotation mechanism.

## Last Updated

2026-07-21 - Added reusable deployment patterns for standalone Next images, server-only configuration, finite Liquibase jobs, full-SHA image releases, application-only rollback, and one-time idempotent ADMIN bootstrap.
