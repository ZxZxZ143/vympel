# Project Map

## Overview

Vympel is a fullstack catalog application for watches, accessories, and related products with a separate protected CRM/admin frontend for managing catalog data. The public storefront and CRM are separate Next.js apps, and both use the Spring Boot REST API backed by PostgreSQL, Liquibase migrations, JWT security, audit logging, and S3-compatible object storage.

## Tech Stack

### Frontend

* Language/Runtime: TypeScript on Node.js.
* Framework: Next.js 16.2.10 App Router with React 19 for the public storefront and the separate CRM app.
* UI libraries: shadcn-compatible structure, Radix UI (`radix-ui` package), lucide-react, sonner, Embla Carousel, NProgress.
* State management: Redux Toolkit configured in `src/store/store.ts`, currently with no reducers; local React state, URL search params, and the SSR-safe `localProductStorage` localStorage service are used for catalog, favorites, and cart interactions.
* Styling: Public storefront uses Tailwind CSS 4 through `src/app/globals.css`, CSS variables, and custom shared components; CRM uses plain global CSS tokens in `vympel_crm/src/app/globals.css`.
* Build tool: Next.js build pipeline.
* Key libraries: Public storefront uses `next-intl` 4.13.2, `react-hook-form`, `zod`, `class-variance-authority`, `clsx`, `tailwind-merge`; CRM uses `react-hook-form` plus local API/i18n/UI helpers.

### Backend

* Language/Runtime: Java 17.
* Framework: Spring Boot 4.0.2.
* Database: PostgreSQL; Redis is the distributed abuse-control state store outside explicit local/test profiles.
* ORM/Query layer: Spring Data JPA, Hibernate, repository interfaces, MapStruct mappers.
* Auth: Stateless Spring Security access JWTs plus server-tracked rotating CRM refresh-token families.
* API style: REST controllers under `/api/public`, `/api/auth`, `/api/admin`, and protected `/api/crm`.
* Key libraries: Liquibase, JJWT 0.12.6, Spring Data Redis, MapStruct 1.5.5.Final, Lombok, springdoc OpenAPI, AWS SDK S3, Logback rolling-file appenders, Testcontainers.

### Shared / Tooling

* Package manager: Public frontend and CRM frontend each use npm with their own `package-lock.json`; backend uses Gradle wrapper.
* Monorepo/workspace tool: One root Git repository with three independently built sibling applications; no package workspace orchestrator.
* Testing: Public and CRM apps use finite Vitest suites; backend uses JUnit/Spring Boot, Mockito, real HTTP integration tests, and Testcontainers for PostgreSQL/Redis integration checks.
* Linting/formatting: Frontend uses ESLint through `npm run lint`; backend has no explicit lint/format task discovered.
* Docker/DevOps: Three multi-stage non-root images, preserved local Compose, immutable-image staging/production Compose, Nginx templates, deployment/rehearsal scripts, Prometheus examples, and component/full-release GitHub Actions workflows. Release candidate `v1.0.0-rc.1` identifies exact remotely verified commit `954e8a3a659371ba0203369aec9d2fef968fab5b`; registry digests remain pending.

## Directory Structure

```text
/
|-- AGENTS.md                         # required project operating instructions
|-- compose.yml                       # authoritative full local Docker stack
|-- .env.example                      # placeholder-only full-Docker variable inventory
|-- .env.docker.example               # optional non-secret Compose host-port overrides
|-- .github/workflows/                # component CI, image release, and full release gates
|-- deployment/
|   |-- release-manifest.example.yml  # immutable release/digest evidence template
|   |-- rehearsals/                    # isolated backup, CMS freshness, Liquibase, and proxy proofs
|   `-- scripts/                       # validation, migration, deploy, smoke, rollback helpers
|-- infrastructure/
|   |-- compose/                       # prebuilt-image staging and production stacks
|   |-- env/                           # placeholder-only deployment environment templates
|   |-- observability/                 # provider-neutral Prometheus/rule/signal examples
|   `-- reverse-proxy/                 # configurable TLS Nginx templates
|-- docs/
|   |-- PROJECT_MAP.md                # project architecture memory
|   |-- PROJECT_SKILLS.md             # project lessons and working patterns
|   |-- deployment/                   # provider-neutral runbooks and release checklists
|   `-- tasks/
|       |-- prepare_vympel_ui_polish_audit.md
|       |-- vympel_ui_polish_audit/   # audit spec, screenshot index, and responsive evidence
|       |-- vympel_final_release_verification/ # authoritative Step 9 reports, logs, and screenshots
|       `-- vympel_repository_cleanup_audit/   # safe cleanup inventory and retained-resource decisions
|-- vympel_front/                     # Next.js frontend application
|   |-- public/                       # static catalog and marketing images
|   |-- src/
|   |   |-- api/                      # public API endpoint builders, controller, types
|   |   |-- app/                      # App Router routes and global CSS
|   |   |-- assets/icons/             # custom React SVG icon components
|   |   |-- components/               # reusable UI and feature components
|   |   |-- config/                   # centralized frontend config such as public brand pages/navigation
|   |   |-- enums/                    # frontend enums such as product sort values
|   |   |-- hooks/                    # client hooks for fetch, sort, pagination, carousel
|   |   |-- i18n/                     # next-intl routing, request, navigation helpers
|   |   |-- messages/                 # locale message JSON files
|   |   |-- screens/                  # page-level screen compositions
|   |   |-- store/                    # Redux store setup
|   |   `-- utils/                    # small shared frontend helpers
|   |-- components.json               # shadcn configuration
|   |-- Dockerfile                    # deterministic non-root production image
|   |-- next.config.mjs
|   |-- package.json
|   |-- tailwind.config.js
|   `-- tsconfig.json
|-- vympel_crm/                       # separate protected CRM/admin Next.js frontend
|   |-- src/
|   |   |-- app/                      # CRM routes and global CRM design tokens
|   |   |-- features/                 # auth, dashboard, products, requests, CMS, analytics, users, activity, settings views
|   |   `-- shared/                   # CRM API client, feedback, i18n, UI primitives, utilities
|   |-- Dockerfile                    # deterministic non-root production image
|   |-- next.config.mjs
|   |-- package.json
|   |-- package-lock.json
|   `-- tsconfig.json
`-- vympel_back/                      # Spring Boot backend application
    |-- build.gradle
    |-- docker-compose.yml            # compatibility entrypoint including ../compose.yml
    |-- Dockerfile                    # Java 17 multi-stage non-root image
    |-- gradle/wrapper/
    |-- gradlew
    |-- gradlew.bat
    |-- settings.gradle
    `-- src/
        |-- main/
        |   |-- java/com/shop/vympel/
        |   |   |-- controllers/      # REST controllers
        |   |   |-- converter/        # JPA/domain converters
        |   |   |-- db/               # entities and repositories
        |   |   |-- dtos/             # request/response DTOs
        |   |   |-- enums/            # domain enums
        |   |   |-- mappers/          # MapStruct and reference mappers
        |   |   |-- logging/          # request correlation, safe MDC, masking, file audit loggers
        |   |   |-- s3/               # S3 client configuration
        |   |   |-- security/         # Spring Security, JWT, global errors
        |   |   `-- services/         # business logic
        |   `-- resources/
        |       |-- application.yml
        |       |-- logback-spring.xml # rolling application/error/security/CRM file logs
        |       `-- db/changelog/     # Liquibase schema and seed migrations
        `-- test/java/com/shop/vympel/
```

## Core Modules

### Frontend

| Module | File(s) | Responsibility | Key exports |
| ------ | ------- | -------------- | ----------- |
| App routes | `vympel_front/src/app/[locale]/page.tsx`, `about/page.tsx`, `catalog/page.tsx`, `catalog/[...slug]/page.tsx`, `catalog/loadCatalogCategory.ts`, `product/[id]/page.tsx`, `brands/page.tsx`, `brands/[brandSlug]/page.tsx`, `favorites/page.tsx`, `cart/page.tsx`, `guarantee/page.tsx`, `delivery/page.tsx`, `payment/page.tsx`, `not-found.tsx`, `[...notFound]/page.tsx` | Localized route entry points for home, About Us, global/category catalog, product detail, brands, local favorites/cart, static information, and unknown-route fallback UI. Dynamic product/category/brand owners resolve confirmed existence before rendering and call `notFound()` only on a real absence; the locale segment intentionally has no route-wide `loading.tsx` streaming boundary so those responses retain HTTP 404. | Next.js page components, `loadCatalogCategory` |
| Root layout | `vympel_front/src/app/[locale]/layout.tsx` | Loads fonts, locale messages, header/footer, the Suspense-wrapped mobile bottom navigation, the project-restyled shadcn/Sonner toaster, shadcn Tooltip provider, the global customer-request dialog provider, and NProgress provider. | `RootLayout`, `generateStaticParams`, `metadata` |
| SEO and discovery | `vympel_front/src/lib/seo.ts`, `src/lib/sitemapCatalog.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, localized route metadata | Builds canonical URLs and RU/KK/EN language alternates from required `NEXT_PUBLIC_SITE_URL`, generates only public localized/static/category/brand/active-product sitemap entries, fails the sitemap when backend data is unavailable rather than returning misleading success, and excludes cart/favorites/internal/CRM routes. | `siteUrl`, `localizedMetadata`, `buildSitemapEntries`, `sitemap`, `robots` |
| i18n routing | `vympel_front/src/i18n/*`, `vympel_front/src/proxy.ts` | Supports `ru`, `kz`, `en`; redirects unsupported locale-like prefixes; wraps localized navigation. | `LocaleEnum`, `routing`, localized `Link`/router helpers |
| Public API client | `vympel_front/src/api/controllers/PublicController.ts`, `endpoints/PublicEndpoint.ts` | Fetches public backend products, recommendations, quick search results, catalog search/filter metadata, categories, CMS page content, and public customer-request submissions from `BASE_API_PUBLIC` or `NEXT_PUBLIC_BASE_API_PUBLIC`. Product recommendations use the dedicated no-store endpoint with a 2500 ms server-fetch timeout; page-level loading catches/logs failures and returns an empty list for silent omission. Product list/review responses are normalized with `normalizePageResponse`, quick search/category array payloads are guarded before rendering, and quick search accepts an abort signal so stale debounced requests can be cancelled. CMS page reads use Next tagged caching with `revalidate: 30` and tags `cms` / `cms:{pageKey}` so pages stay fast while the backend can request cache refresh after CRM mutations. Category/product rail reads through `getProductsList` use `next.revalidate: 30`; interactive catalog/search requests remain uncached where URL controls must reflect current filters. | `PublicApiController`, `PublicEndpoints` |
| API types | `vympel_front/src/api/types/*.ts` | TypeScript mirrors for backend product, recommendation, quick search, CMS page/block/media, catalog filter metadata, category, page, public customer-request create/response DTOs, and error responses, including brand country, interior-clock detail data used by product specs, and CMS page/block/media version metadata (`updatedAt`, `createdAt`) used by public image cache busting. CMS block types expose six image slots: default/RU desktop `media`, desktop `mediaKz`/`mediaEn`, default/RU mobile `mobileMedia`, and mobile `mobileMediaKz`/`mobileMediaEn`. `PageType.ts` also normalizes paginated API data before rendering, including Spring `content`, legacy raw arrays, and `{items, page, totalItems}` response shapes. | `IProduct`, `IProductRecommendation`, `IQuickSearchProduct`, `IPublicCmsPage`, `IPublicCmsBlock`, `IProductDetails`, `ICatalogFiltersResponse`, `ICustomerRequestPayload`, `ICustomerRequestSubmission`, `IProductBrand`, `ICategory`, `Page<T>`, `normalizePageResponse` |
| Public CMS helpers | `vympel_front/src/utils/cmsContent.ts`, `src/components/ui/shared/CmsResponsiveImage/index.tsx` | Safely selects CMS blocks by key/type, resolves localized desktop/mobile media with static fallback, appends stable media/block version query params so updated CMS images do not reuse stale browser/CDN entries, replaces failed dynamic image URLs with the known static fallback, extracts text fields, and resolves CMS links to safe external URLs, internal paths, or semantic route helpers for category, brand, product, and catalog-filter targets. Mobile image fallback order is current-locale mobile, current-locale desktop, default/RU mobile, default/RU desktop, then static fallback. | `findCmsBlock`, `findCmsBlocksByType`, `cmsImageSources`, `cmsText`, `cmsTextList`, `cmsLink`, `CmsResponsiveImage` |
| Home screen | `vympel_front/src/screens/HomePage/index.tsx`, `src/components/HomePage/bannerCarousel/*`, `src/components/HomePage/NewGoods/index.tsx` | Composes navigation, tall responsive hero/banner carousel, benefits, new goods/product rail, brands, categories, mobile-redesigned philosophy/story block, and marketplaces. The home hero slider renders all published CMS `HERO_SLIDER` blocks for the `home` page, the new-goods banner reads its CMS block first, and both fall back to the existing static Romanson/news banner content only when CMS is unavailable or incomplete. Home product rails use `GoodsCarouselWithImage` with a controlled desktop banner layer, banner hidden on tablet/mobile when it becomes visual noise, and non-overlapping arrows. | default async `HomePage` |
| Brand screen | `vympel_front/src/screens/BrandPage/index.tsx`, `components/BrandPage/BrandProductsGrid/index.tsx` | Renders public brand pages with localized breadcrumbs, title, explicit RU/KZ/EN description and history copy, CMS-first brand banner with static fallback, catalog link, up to 15 newest same-brand products, empty/error states, and the existing navigation. Locale selection is current locale then RU fallback; no prior-locale copy is retained. Mobile brand titles use `.brand-page-title` overflow protection and mobile brand banners use a taller full-width cover frame so they feel like real phone hero banners instead of thumbnails. Product cards are isolated in a client grid because `GoodCard` uses client hooks. | default async `BrandPage`, `BrandProductsGrid` |
| All brands screen | `vympel_front/src/app/[locale]/brands/page.tsx`, `vympel_front/src/screens/BrandsPage/index.tsx` | Lists all canonical `PUBLIC_BRANDS` at `/brands` in registry order, including brands whose catalog count is zero/disabled. Backend catalog metadata supplies counts when available; if the metadata request fails, every card remains and counts are omitted rather than fabricated. RU/KZ/EN messages describe product counts, each card links to its brand page, and zero-product routes remain available. | default async `BrandsPage` |
| Info pages | `vympel_front/src/screens/InfoPages/index.tsx`, `components/InfoPages/index.tsx`, `app/[locale]/guarantee/page.tsx`, `delivery/page.tsx`, `payment/page.tsx` | Renders localized Warranty/Delivery/Payment public pages with standard header/footer/navigation/search, rich text highlights, fixed-size warranty icon circles, and the shared responsive store location block using `/shop.png`. | default async `InfoPage`, `InfoPageLayout`, `InfoTextBlock`, `StoreLocationBlock`, `WarrantyBadges` |
| About page | `vympel_front/src/app/[locale]/about/page.tsx`, `src/screens/AboutPage/index.tsx`, `src/components/AboutPage/InstagramSlider/index.tsx` | Renders the localized About Us page from the Figma About frame with standard navigation/footer, CMS-first full-width banner, CMS-first intro/cooperation content, four numbered company cards with overflow-safe mobile badge/text sizing, an autoplaying Embla Instagram slider using `/insta-*.png`, the shared cooperation `ContactBanner`, and the existing marketplace block. Static localized messages and `/about-us-banner.png` / `/contact_banner.png` remain fallbacks. | default async `AboutPage`, `AboutInstagramSlider` |
| Brand page config | `vympel_front/src/config/brandRoutes.ts`, `vympel_front/src/config/brandPages.ts` | Central source for public brand slugs, display names, database codes, `pierre-ricaude` compatibility alias, explicit RU/KZ/EN brand copy with current-locale-to-RU fallback, and banner asset mapping/fallbacks. | `PUBLIC_BRANDS`, `findPublicBrandBySlug`, `getBrandPageData` |
| Public route helpers | `vympel_front/src/config/routes.ts` | Central source for public internal hrefs, semantic catalog/category/filter presets, contact links, marketplace links, and product/brand/cart/favorites/about/info-page route builders. Category links use `categoryCode` query params, clear incompatible filters by construction, and reset `page=1`; men/women watch links use the backend `gender` filter values; accessories keep the `ACCESSORIES` category and use component-owned `gender` query toggles instead of child category routes, including a clean all-accessories state; kids watches use `WATCH_KIDS`; `routes.brands()` owns the all-brands page. `CONTACT_LINKS.instagram` is currently a centralized placeholder until the real Vympel Instagram URL is known. | `routes`, `catalogLinks`, `PUBLIC_CATEGORY_CODES`, `SEEDED_FILTER_VALUES`, `CONTACT_LINKS`, `MARKETPLACE_LINKS` |
| Smart search | `vympel_front/src/components/ui/shared/SmartSearch/index.tsx`, `components/ui/layout/Navigation/QuickSearch/index.tsx`, `components/ProductPage/ProductSearchForm/index.tsx`, `components/CatalogPage/CatalogOverlayProvider/state.ts` | Shared RHF-backed product search. It debounces `GET /api/public/product/search/quick/{lang}` after 2+ characters, cancels stale requests, and submits through `routes.searchCatalog(query)`. A safe 429 keeps the overlay geometry stable, disables manual retry for the server-provided cooldown, and shows localized RU/KZ/EN countdown copy without automatic retry. Home and product variants keep stable host-owned absolute roots; the catalog variant is positioned by the shared `.catalog-toolbar-shell` card, derives visibility only from the catalog overlay provider, and uses explicit open/close transitions so focus restoration cannot toggle it back open. | `SmartSearch`, `SmartSearchVariant`, `QuickSearch`, `ProductSearchForm`, `reduceCatalogOverlay` |
| Catalog screen | `vympel_front/src/screens/CatalogPage/index.tsx`, `components/CatalogPage/*` | Displays CMS-first catalog/category hero and contact banners, category selector, filters, sort, shared en-dash 20px/300 single-line scrollable breadcrumbs, and the paginated product grid. The toolbar has three explicit modes: compact icon triggers below 1440, sheet/panel behavior split at 1024, and full 22px/400 inline category/filter/sort labels from 1440. Search, category, filter, and sort triggers share the same 48px height without changing their responsive positioning. Accessory segmented labels are 16px below 1440 and 22px from 1440. Sort option rows remain 16px with 56px mobile targets, and short price labels contain no arrows. `CatalogOverlayProvider` keeps category, filter, sort, and search mutually exclusive; mobile bottom navigation stays hidden through modal close transitions. `MobileBottomNavigation` maps stable category codes to deterministic 20px Lucide icons, using names only as a last fallback. At 1024px and above `.responsive-product-grid` owns exactly three equal columns. | `CatalogPage`, `Catalog`, `CatalogOverlayProvider`, `CatalogMobileSheet`, `AccessorySplitControls`, `CategorySelector`, `CatalogFilters`, `Sort` |
| Catalog query cleanup | `vympel_front/src/utils/catalogFilterParams.ts` | Normalizes catalog query/search/filter values, removes blank/null/undefined/empty-array placeholders, keeps control params such as `categoryCode` out of active filter payloads, and blocks removed country-alias keys such as `brandCountry`. | `CATALOG_CONTROL_PARAM_SET`, `REMOVED_CATALOG_FILTER_PARAM_SET`, `normalizeCatalogQueryValue`, `normalizeCatalogQueryValues` |
| Catalog category behavior | `vympel_front/src/utils/catalogCategories.ts` | Normalizes catalog category codes, detects accessory and interior-clock categories, maps category-specific hero fallback assets, and resolves category CMS banner keys before local fallbacks. Accessories use `/accessories_hero_banner.png`; interior clocks use `/interior_hero_banner.png`; valid category CMS banners override those assets. Ordinary watch categories still keep generic catalog CMS/fallback banner behavior and wristwatch filter inheritance. | `normalizeCatalogCategoryCode`, `isAccessoryCategoryCode`, `isInteriorClockCategoryCode`, `catalogHeroFallback`, `findCatalogHeroBlock` |
| Category tree helpers | `vympel_front/src/utils/categoryTree.ts` | Builds sorted root/child category trees from the backend category list and normalizes category codes for active-state checks. Shared by desktop catalog category selector and mobile categories flow. | `buildCategoryTree`, `normalizeCategoryCode`, `CategoryNode` |
| Product screen | `vympel_front/src/screens/ProductPage/index.tsx`, `components/ProductPage/*`, `components/ProductRating/RatingStars.tsx` | Resolves primary product/reviews/CMS content first and streams dedicated recommendations independently through `AsyncProductRecommendations` inside null-fallback server `Suspense`. `ProductRecommendations` renders the title/carousel only for non-empty items; timeout/429/error/true exhaustion produces no heading, message, retry control, blank wrapper, spacing, or main-content delay. `ProductSummary` shows localized, non-interactive Kaspi/Halyk payment tiles from the canonical public assets while retaining the existing 56px mobile and 74px `sm` wrapper geometry. The remaining CMS/banner/gallery/tabs/contact layout and overflow protections are unchanged. | default async `ProductPage`, `AsyncProductRecommendations`, `ProductRecommendations`, `loadProductRecommendations`, `ProductInfoTabs`, `ProductReviews`, `RatingStars` |
| Favorites/cart screens | `vympel_front/src/screens/FavoritesPage/index.tsx`, `CartPage/index.tsx` | Client-side localStorage-backed favorites and cart pages. Each page refreshes every stored ID with one bounded batch-summary POST, merges current price/stock/status/locale/image/category/brand/rating, preserves local data on total failure, and marks explicit missing IDs unavailable without per-ID fallback requests or unstable-effect loops. Existing grids, error/retry states, quantity/stock controls, confirmations, undo behavior, similar rail, totals, and WhatsApp checkout remain unchanged. | `FavoritesPage`, `CartPage` |
| Shared UI | `vympel_front/src/components/ui/shared/*`, `src/components/ui/layout/*`, `src/components/InfoPages/index.tsx`, `src/config/publicBreadcrumb.ts`, `src/components/ui/tooltip.tsx`, `src/components/ui/alert-dialog.tsx` | Reusable public primitives and states. `SectionWithTitle` has explicit `section`, `subsection`, and `none` spacing ownership; Footer alone owns the final 120/96/64px gap on standard public pages. `PUBLIC_BREADCRUMB_SEPARATOR` supplies one en-dash across catalog/product/brand trails. `GoodCard` uses the same Basket geometry before and after cart selection. `CatalogOverlayProvider`/`CatalogMobileSheet` coordinate overlays, and `MobileBottomNavigation` owns code-first category icons. | `SectionWithTitle`, `PUBLIC_BREADCRUMB_SEPARATOR`, `ProductImageFallback`, `CatalogOverlayProvider`, `CatalogMobileSheet`, `MobileBottomNavigation`, `EmptyState`, `ErrorState`, `Tooltip`, `AlertDialog` |
| URL interaction hooks | `vympel_front/src/hooks/usePagination.tsx`, `useSort.ts` | Keeps catalog page and sort state in query params; pagination can optionally scroll to a target element such as the catalog product grid after URL page changes. | `usePagination`, `useSort` |
| Public toast helpers | `vympel_front/src/hooks/useProductActionToasts.ts`, `src/components/ui/sonner.tsx` | Centralized localized shadcn/Sonner notifications for favorite/cart actions, stock-limit blocks, empty checkout attempts, and WhatsApp checkout data problems, with project-styled toast surfaces. Navigation actions use concise localized `Перейти` labels, favorite removal uses an `Отменить` action that restores the removed snapshot, and action buttons are smaller rounded pills. Toast layout is tokenized with `.vympel-toast-*`: title/description may wrap cleanly on mobile, and the surface avoids debug-like red badges except for real error semantics. | `useProductActionToasts`, `Toaster` |
| Local product storage | `vympel_front/src/services/localProductStorage.ts` | Central SSR-safe localStorage source of truth for temporary favorites and cart state with product snapshots, SKU/article and rating-summary preservation, idempotent refresh writes, batch-summary mapping, unavailable-without-erasure mapping, `useSyncExternalStore` subscriptions, cross-tab updates, availability/stock limits, and corrupted-storage reset. Cart increments return `stockLimit` instead of exceeding refreshed stock. | `useFavorites`, `useCart`, `createProductSnapshot`, `createProductSnapshotFromBatchSummary`, `markProductSnapshotUnavailable`, `getAvailableStock`, `canIncreaseCartItem` |
| Cart checkout helpers | `vympel_front/src/utils/cartCheckout.ts` | Validates cart checkout readiness and builds the WhatsApp order URL/message from stored cart snapshots. The message includes greeting, every cart item, quantity, unit price, line total, article/SKU as the final item line, and the total order sum, then URL-encodes the text onto `CONTACT_LINKS.whatsapp`. | `getCartCheckoutIssue`, `buildWhatsAppOrderMessage`, `buildWhatsAppOrderUrl` |
| Store | `vympel_front/src/store/store.ts`, `src/hooks/store.ts` | Redux store and typed hooks; no slices are registered yet. | `store`, `RootState`, `AppDispatch`, `useAppDispatch`, `useAppSelector` |
| Product info tabs | `vympel_front/src/components/ProductPage/ProductInfoTabs/index.tsx` | Client-side product detail tabs for description, warranty, delivery, order/payment, and reviews. The tab list uses a single bottom divider, a shrink-wrapped active underline on the shared baseline, 50px label-to-underline spacing, horizontal snap scrolling on smaller screens, description/specs content, and the reviews pane with a desktop sticky form block plus stacked static mobile layout. | default `ProductInfoTabs` |
| Product/catalog smart search adapter | `vympel_front/src/components/ProductPage/ProductSearchForm/index.tsx` | Thin adapter over shared `SmartSearch` for catalog and product hero toolbars. It keeps the compact inline submit button shape while using the same quick product results, merged input/panel overlay, and catalog-search redirect as the header. | default `ProductSearchForm` |
| Product price formatting | `vympel_front/src/utils/formatProductPrice.ts` | Formats product prices with app-locale-aware number formatting and localized currency symbols. | `formatProductPrice` |
| Typography primitives | `vympel_front/src/components/ui/shared/text/index.tsx`, `text/type.ts`, `text/Heading/index.tsx` | Centralized `Text` and `Heading` components backed by global variants; `Text` supports an `as` prop for semantic inline text. | `Text`, `TextVariants`, `Heading`, `H2`-`H6` |
| Customer request dialog | `vympel_front/src/components/CustomerRequestDialog/*`, `src/components/ui/dialog.tsx` | Global shadcn/Radix-style public request dialog opened by CTA triggers, with RHF validation, localized loading/success/error and 429 cooldown feedback, honeypot field, source tracking, and a Kazakhstan phone mask. Rate limiting preserves entered form values, disables resubmission until the bounded server delay expires, and never auto-retries. | `CustomerRequestDialogProvider`, `CustomerRequestButton`, `useCustomerRequestDialog`, `Dialog` |
| Contact banner | `vympel_front/src/components/ui/shared/ContactBanner/index.tsx` | Localized product/About cooperation contact CTA using `/contact_banner.png` or CMS-provided image/link/text props, global contact-banner spacing/color tokens, `Heading`, `Text`, the shared `Button` connect-banner variant, request-source aware customer-request dialog triggers, and responsive column-to-row wrapping. A CMS block with no valid link can pass `null` to suppress the default WhatsApp fallback button instead of showing a stale CTA. | default `ContactBanner` |
| CRM routes | `vympel_crm/src/app/**/page.tsx` | Separate protected CRM app routes for login, dashboard, products, customer requests, CMS, bulk product creation, product reviews moderation, product analytics, admin-only users, activity, and settings. | Next.js page components |
| CRM crawler policy | `vympel_crm/src/shared/seo/metadata.ts`, `src/app/layout.tsx` | Applies global `noindex, nofollow` and matching Googlebot policy to every CRM route so no protected or login route is advertised for indexing. | `crmMetadata` |
| CRM protected shell | `vympel_crm/src/shared/components/ProtectedShell.tsx`, `src/shared/auth/permissions.ts` | Client-side route protection, cookie-backed session bootstrap, admin-only route hiding and direct-route forbidden state, localized session/forbidden feedback, recoverable non-auth errors, server-confirmed logout, sidebar/topbar layout, locale selector, and current user check via `/api/crm/auth/me`. | `ProtectedShell`, `hasAdminRole`, `canAccessProtectedRoute`, `canViewNavigationItem` |
| CRM API client | `vympel_crm/src/shared/api/client.ts`, `session.ts`, `types.ts`, `errors.ts` | Dedicated credentialed no-store CRM fetch client with base URL config, sessionStorage access-token handling, HttpOnly refresh-cookie bootstrap, single-flight 401 refresh plus one bounded retry, 403 session preservation, and parsed 429 body/header cooldowns. Login preserves email, disables resubmission during the localized RU/KZ/EN cooldown, and never retries credentials automatically. | `crmApi`, `CrmApiError`, `getCrmErrorMessage`, CRM types |
| CRM feedback | `vympel_crm/src/shared/feedback/NotificationProvider.tsx`, `vympel_crm/src/app/layout.tsx` | Global CRM loading/success/warning/error toast surface used by backend mutations across auth, products, users, CMS, and collection/photo workflows. CMS mutations use warning toasts for draft/non-public saves and failed public cache refresh attempts. | `NotificationProvider`, `useNotifications` |
| CRM localization | `vympel_crm/src/shared/i18n/messages.ts`, `useI18n.ts` | Localized RU/KZ/EN CRM strings and locale state for all CRM UI labels, validation messages, mutation feedback, CMS editor labels/states, product photo upload/order/main/delete states, nav, tables, and states. | `messages`, `useI18n` |
| CRM UI primitives | `vympel_crm/src/shared/ui/*`, `src/app/globals.css` | Local `Text`, `Heading`, `Button`, `Field`, and `ConfirmDialog` primitives plus CRM-specific global design tokens inspired by the public storefront, including notification, confirmation dialog, and product photo preview tokens. | `Text`, `Heading`, `Button`, `Field`, `ConfirmDialog` |
| CRM product management | `vympel_crm/src/features/products/*` | Pageable newest-first no-store product list with ID/name/model/SKU/brand/category/status search, all-status filtering, counts, previous/next paging, focus/mutation invalidation, and quick edits; category-first create/edit; inline collections; MinIO multi-image upload; ordered photo controls, main-photo selection, deletion; and bulk creation. New products default to `DRAFT`, upload selected photos after the ID exists, and open `/products/{id}` after creation. | `ProductListView`, `ProductForm`, `BulkProductCreateView`, `notifyProductListChanged`, `getCategoryProfile`, `productTypeForCategory` |
| CRM user management | `vympel_crm/src/features/users/*` | RHF-backed admin-only users list search and create/edit forms for email, profile fields, role, and enabled/block access. | `UserListView`, `UserForm` |
| CRM analytics | `vympel_crm/src/features/analytics/ProductAnalyticsView.tsx`, `src/app/analytics/page.tsx` | Protected product popularity analytics with period filter, views/favorites/add-to-cart metrics, low-demand/high-interest tables, promotion recommendations, and manual promotion toggles. | `ProductAnalyticsView` |
| CRM review moderation | `vympel_crm/src/features/reviews/ReviewModerationView.tsx`, `src/app/reviews/page.tsx` | Protected localized review queue with pending count, product/rating/status/date filters, pageable table, highlighted pending rows, approve, reject/hide, soft-delete confirmation, mutation loading spinners, and success/error notifications. Wide tables scroll inside `min-width: 0` panels instead of widening the mobile page. | `ReviewModerationView` |
| CRM request processing | `vympel_crm/src/features/requests/RequestProcessingView.tsx`, `src/app/requests/page.tsx` | Protected localized request queue with new-count metric, status/search filters, pageable table, highlighted new rows, detail panel, status changes, mark-done, cancel, admin comment save, mutation loading spinners, and success/error notifications. Wide tables scroll inside `min-width: 0` panels while the detail panel stacks responsively. | `RequestProcessingView` |
| CRM CMS editor | `vympel_crm/src/app/cms/page.tsx`, `src/features/cms/CmsView.tsx`, `src/features/cms/cmsBlockSchemas.ts`, `src/features/cms/cmsRefreshFeedback.ts` | Admin-only content-management surface for selecting pages, creating/editing/reordering/publishing blocks, and previewing every editable block. A centralized per-type schema controls whether text, image, link, button, alt, settings, or JSON fields render and are submitted. Image-capable blocks upload through existing storage and expose a collapsed optional variants section for desktop KZ/EN plus mobile RU/KZ/EN media, each with its own preview; preview adapts to block type, CRM locale, and desktop/mobile mode. Save/delete/reorder/publish/unpublish always reports the committed content result separately from public-cache state; retry-scheduled, not-configured, and permanent failures are localized warnings and never disguise a successful CMS write. | `CmsView`, `cmsBlockSchemas`, `getCmsRefreshFeedback` |
| CRM dashboard/activity/settings | `vympel_crm/src/features/dashboard/*`, `activity/*`, `settings/*` | Dashboard widgets, recent activity table with filter, and current session/API settings. | `DashboardView`, `ActivityView`, `SettingsView` |

### Backend

| Module | File(s) | Responsibility | Key exports |
| ------ | ------- | -------------- | ----------- |
| Application | `vympel_back/src/main/java/com/shop/vympel/VympelApplication.java` | Spring Boot entry point; enables S3 storage properties. | `VympelApplication` |
| Public controllers | `controllers/PublicController.java`, `CategoryController.java`, `ProductPublicController.java`, `ProductAnalyticsController.java`, `PublicCmsController.java`, `PublicCustomerRequestController.java` | Public health, category, product detail, bounded recommendations, bounded batch summaries, reviews/requests/analytics, catalog/search/facet reads with allow-listed limits, and CMS reads. Batch summary validates a non-empty maximum-60 positive ID list, a 4 KiB declared body, and uses the existing public-catalog rate-limit policy. | REST endpoints under `/api/public` |
| Auth controller | `controllers/AuthController.java` | Email registration and login. | `/api/auth/register/email`, `/api/auth/login/email` |
| Admin controllers | `ProductAdminController.java`, `CollectionAdminController.java`, `FileController.java` | Product creation, collection creation, and product image uploads. | REST endpoints under `/api/admin` |
| CRM controllers | `CrmAuthController.java`, `CrmProductController.java`, `CrmCustomerRequestController.java`, `CrmProductReviewController.java`, `CrmUserController.java`, `CrmDashboardController.java`, `CrmActivityController.java`, `CrmReferenceController.java`, `CrmCollectionController.java`, `CrmBrandCollectionController.java`, `CrmCmsController.java`, `ProductAnalyticsController.java` | Protected CRM APIs. Auth login issues access JSON plus a scoped refresh cookie; refresh rotates that cookie; logout revokes it and clears the cookie. Product listing is explicitly no-store, defaults newest-first, includes every status when unfiltered, validates optional status, and searches ID/model/SKU/status/brand/category/localized names. Customer request processing exposes protected list/detail/status/comment/cancel endpoints and writes CRM audit events. Product-image endpoints upload, reorder, select main, and delete. CMS block mutations return committed content plus explicit durable revalidation state; CMS media maintenance exposes ADMIN-only reference, dry-run, and bounded cleanup operations. Pageable CRM endpoints cap requested size to 100. | REST endpoints under `/api/crm` |
| Security and error boundary | `security/SecurityConfig.java`, `security/jwt/*`, `security/session/*`, `security/ratelimit/*`, `security/config/NonLocalSecurityConfigurationValidator.java`, `security/GlobalErrorHandler.java` | JWT/refresh security plus layered HMAC-keyed abuse controls. Deployed limits use atomic Redis fixed windows; bounded memory mode is local/test only and enforces its configured identity cap even under concurrent new keys. Trusted proxy CIDRs own forwarded-IP interpretation, high-risk routes fail closed on any limiter-store operation failure, low-risk reads fail open, login backoff is bounded, and safe correlated errors include 429/`Retry-After` and 503 without policy/key/identity disclosure. Non-local startup rejects a disabled limiter plus insecure or missing DB/JWT/limiter/S3/CORS/Redis/cookie/CMS configuration before beans start. | `SecurityFilterChain`, `RateLimitFilter`, `RateLimitService`, `RedisRateLimitStore`, `LoginBackoffService`, `ClientAddressResolver`, `NonLocalSecurityConfigurationValidator`, `GlobalErrorHandler` |
| Runtime observability | `application.yml`, `services/cms/CmsRevalidationQueueMetrics.java`, `PublicCmsCacheInvalidationService.java`, `services/auth/CrmSessionService.java`, `security/ratelimit/*` | Exposes internal-only Prometheus health/JVM/HTTP/Hikari signals plus CMS outcome/latency/queue, rate-limit, and auth refresh/replay/logout metrics. Structured request-correlated logs remain sanitized; staging/production do not publish the backend management port and Nginx blocks `/actuator`. | `/actuator/health/*`, `/actuator/prometheus`, Micrometer meters |
| Local ADMIN bootstrap | `bootstrap/admin/*` | Local-profile-only typed configuration, startup runner, and transactional service that creates one enabled ADMIN from ignored environment values after Liquibase. Existing admins are a no-write success; an existing non-admin email or missing ADMIN role fails safely. Case-insensitive database uniqueness is the multi-instance guard, with conflict verification in a fresh transaction. | `BootstrapAdminProperties`, `LocalAdminBootstrapRunner`, `LocalAdminBootstrapService` |
| Abuse validation and deduplication | `security/ratelimit/AbuseProtectionService.java`, `services/product/ProductAnalyticsService.java`, `services/request/CustomerRequestService.java`, `controllers/AuthController.java`, `controllers/CrmAuthController.java`, `controllers/ProductPublicController.java` | Adds normalized registration/contact identities, rapid duplicate review protection, source/event/product/session analytics deduplication, and account login backoff. Analytics metadata is validated before product lookup and duplicate acknowledgement. Valid non-CRM credentials follow the same safe 401/backoff path as other failed CRM logins, and rejected writes never call repositories. | `AbuseProtectionService`, `LoginBackoffService`, `ProductAnalyticsService` |
| CRM refresh sessions | `services/auth/CrmSessionService.java`, `RefreshSessionCleanupJob.java`, `db/entity/auth/RefreshTokenSession.java`, `db/repositories/user/RefreshTokenSessionRepository.java` | Persists only SHA-256 refresh jti hashes; creates token families, pessimistically locks rotation, revokes replaced tokens, detects replay and revokes the active family, revokes on logout/role removal/user disable, and deletes retired rows after the configured retention window. | `CrmSessionService`, `RefreshSessionCleanupJob`, `RefreshTokenSessionRepository` |
| Server file logging | `logging/RequestCorrelationFilter.java`, `logging/SensitiveDataMasker.java`, `logging/SensitiveDataMaskingLayout.java`, `logging/SecurityAuditLogger.java`, `logging/CrmActionFileLogger.java`, `resources/logback-spring.xml` | Generates or validates `X-Request-Id`, adds request/user/role context to MDC, emits bounded request completion lines, masks credentials/tokens/secrets before console or file output, and routes rolling application, error, security, and CRM action logs to the configurable server directory. | `RequestCorrelationFilter`, `SensitiveDataMasker`, dedicated `SECURITY_AUDIT` and `CRM_ACTIONS` loggers |
| Product services | `services/product/*`, `productName/*`, `productDescription/*`, `watchDetail/*`, `categoryProduct/*`, `mappers/product/ProductDescriptionMapper.java` | Product creation/read models, bulk orchestration, SKU generation, localized names/descriptions, category links, and category-profile validation. RU name is the required/default translation; EN/KZ names and descriptions fall back to RU, absent descriptions persist as empty long-text rows, and category details may be absent or partial for drafts. `ProductDescriptionMapper` writes long copy only to `content_md`; it never copies descriptions into the 255-character `title` column. | `ProductService`, `ProductBulkCreationService`, `SKUService`, `ProductDescriptionMapper`, `WatchDetailServiceImpl`, `InteriorClockDetailServiceImpl` |
| Product recommendations | `services/product/ProductRecommendationService.java`, `db/repositories/product/ProductRecommendationRepository.java`, `db/repositories/product/PublicProductSummaryRepository.java`, `dtos/product/ProductRecommendationResponse.java` | Applies the seven-stage public fallback, caps at 12, excludes inaccessible/current/duplicates, and uses source + ranked IDs + one shared summary hydration query. Failures are silent to customers and recorded through bounded duration/query/outcome/stage metrics plus normalized slow logs. | `ProductRecommendationService`, `ProductRecommendationRepository`, `ProductRecommendationResponse` |
| Public product batch summaries | `services/product/ProductBatchSummaryService.java`, `db/repositories/product/PublicProductSummaryRepository.java`, `dtos/product/ProductBatchSummary*.java` | Deduplicates at most 60 requested IDs in first-occurrence order, resolves ACTIVE/public summaries in one read-only query, and reports all unresolved/hidden/inactive IDs together as `missingIds`. | `ProductBatchSummaryService`, `ProductBatchSummaryRequest`, `ProductBatchSummaryResponse` |
| Review service | `services/review/ProductReviewService.java` | Creates guest or authenticated-user reviews as `PENDING`, trims optional plain text, exposes approved-only public reviews, batch-enriches detail/card DTOs with approved-only aggregates, filters CRM review pages, and records approve/reject/soft-delete moderation actors/timestamps. | `ProductReviewService` |
| Customer request service | `services/request/CustomerRequestService.java` | Validates and persists public customer requests, requires email or phone, rejects markup characters, honors a honeypot field, stores source/status/comment/processing metadata, filters CRM pages by status/search, and records processed actor/timestamp for done/cancelled requests. | `CustomerRequestService` |
| Catalog services | `services/catalog/*`, `db/repositories/product/CatalogFacetRepository.java`, `db/repositories/product/PublicProductSummaryRepository.java` | Resolves category profiles/inheritance and specifications; selects only paginated/quick-search IDs with deterministic in-stock-first sorting; hydrates all cards in one compact projection; returns localized price/brand/country and typed detail facets through one base plus at most one profile aggregation. Metrics record bounded duration/query counts, and 2-second query timeouts bound the new native reads. | `ProductCatalogService`, `CatalogCategoryProfileService`, `PublicProductQueryService`, `CatalogFacetRepository`, `PublicProductSummaryRepository` |
| CRM services | `services/crm/*` | Audit logging, dashboard aggregation, CRM reference option aggregation, brand-linked multilingual collection creation, and admin user-management business rules. | `CrmActivityService`, `CrmDashboardService`, `CrmReferenceService`, `CrmCollectionService`, `CrmUserManagementService` |
| CMS services | `services/cms/*` | CMS page/block/media business rules, centralized `CmsBlockSchema` capability enforcement, RU/EN/KK translation persistence with field-level RU fallback, published-only reads, ordering/link validation, and all six desktop/mobile locale references. `CmsMediaReferenceService` queries every slot; lifecycle events mark detached media only after commit; cleanup claims rows with locks, rechecks references/grace, deletes object storage first, and removes the DB row only after storage succeeds. `CmsRevalidationOutboxService` writes a page-key-deduplicated job in the CMS transaction; after commit and the scheduled worker deliver signed, allow-listed targeted revalidation with bounded retry. The internal plain-HTTP Next.js webhook forces HTTP/1.1 because the Java client's h2c upgrade can be closed before response headers. Block updates merge/upsert translations by normalized DB language (`ru/en/kk`) instead of clearing/reinserting rows. | `CmsService`, `CmsServiceImpl`, `CmsBlockSchema`, `CmsMediaReferenceService`, `CmsMediaCleanupService`, `CmsRevalidationOutboxService`, `PublicCmsCacheInvalidationService` |
| Category and collection services | `services/category/*`, `services/collection/*` | Localized category reads and admin collection creation. | `CategoryService`, `CollectionService` |
| Object storage | `s3/*`, `services/objectStorage/ObjectStorageService.java` | S3-compatible upload/download/link generation with separate internal client and browser-facing public endpoints, validated storage properties, product/CMS image MIME+extension/count/size validation, UUID object-key generation, partial-upload cleanup, locked ordered product-media persistence, one-main-image selection, reorder/delete handling with next-main promotion, CMS object upload under the `cms/` storage path, and shared admin/CRM image storage. Product responses expose safe image DTOs; card/search links resolve main image, first ordered image, then `null`. | `StorageProps`, `S3Config`, `ObjectStorageService` |
| Persistence | `db/entity/**`, `db/repositories/**` | JPA entities and Spring Data repositories for auth, products, customer requests, product reviews/approved rating projections, categories, media, features, CMS pages/blocks/translations/media, product analytics events, and promotion fields. | repository interfaces and entity classes |
| Audit persistence | `db/entity/audit/CrmActivity.java`, `db/repositories/audit/CrmActivityRepository.java` | CRM audit/activity event storage with actor, event, entity, metadata JSON, IP, user-agent, and timestamp. | `CrmActivity`, `CrmActivityRepository` |
| Mapping | `mappers/**` | MapStruct DTO mapping and entity reference resolution. | `ProductMapper`, `CategoryMapper`, `WatchDetailMapper`, etc. |
| DTOs | `dtos/**` | Request and response contracts for auth, category, collection, products, customer requests, CMS, catalog filters/search, descriptions, features, errors, analytics, roles, and status updates with Bean Validation where requests cross trust boundaries. | DTO classes |
| Migrations | `src/main/resources/db/changelog/*.xml` | Liquibase schema, seed data, and incremental fixes. | `db.changelog-master.xml` |

### Shared

| Module | File(s) | Responsibility | Key exports |
| ------ | ------- | -------------- | ----------- |
| API contract mirror | Backend DTOs in `vympel_back/src/main/java/com/shop/vympel/dtos/**` and frontend types in `vympel_front/src/api/types/**` | There is no generated shared package; contracts are manually mirrored. | Java DTOs and TypeScript interfaces |
| Locale values | Backend `Language` enum and frontend `LocaleEnum` | Frontend uses `kz`; backend `Language.KZ` stores `kk` and `Language.from()` accepts both `kk` and `kz`. Database language checks use `kk`, so locale changes need both API and persistence review. | `Language`, `LocaleEnum` |

## Data Flow

```text
User action or route load
  -> Next.js localized route under /[locale]
  -> screen component in src/screens
  -> PublicApiController
  -> Spring controller under /api/public
  -> service layer
  -> repositories / S3 object storage / Liquibase-managed PostgreSQL tables
  -> DTO response
  -> frontend typed API response
  -> component state or server-rendered UI
```

Backend request/error logging flow:

```text
Incoming HTTP request
  -> RequestCorrelationFilter reuses a safe X-Request-Id or generates a UUID
  -> requestId/httpMethod/requestPath enter MDC and X-Request-Id is added to the response
  -> JwtAuthFilter validates the Bearer access token without logging it
  -> authenticated userId/roles enter MDC for downstream logs
  -> controller/service/CRM audit work
  -> expected missing entity throws ResourceNotFoundException
  -> GlobalErrorHandler returns a safe ApiErrorResponse with requestId and no stack trace
       -> 400 malformed/validation, 401 unauthenticated, 403 forbidden
       -> 404 valid identifier absent (INFO; never a persistence-outage log)
       -> 500 unexpected/persistence failure (ERROR with server-side context)
  -> SensitiveDataMaskingLayout redacts passwords/tokens/secrets from formatted output
  -> Logback writes logs/application.log, error.log, security.log, and crm-actions.log
  -> daily/50 MB rolling archives are retained for 30 days within a 256 MB cap per log family by default
```

Catalog filter/search flow:

```text
Catalog route or search submit
  -> Header/navigation/search/category/breadcrumb/product/cart/favorites links are built through src/config/routes.ts helpers
  -> URL query params are the source of truth
  -> Catalog/CatalogFilters read page/sort/search/price/filter keys, accept priceMin/priceMax plus minPrice/maxPrice aliases, and drop blank/null/undefined/unselected filter values
  -> accessory categories bypass the full filter payload and preserve only search/sort plus one optional `gender` value for the `Все` / `Женские` / `Мужские` segmented control, while resetting page to 1 on toggle changes
  -> GET /api/public/product/catalog/{lang}
  -> ProductPublicController/ProductCatalogService normalize selected filter values and ignore removed keys such as brandCountry/manufacturerCountry/countryOfBrand
  -> ProductCatalogService builds category profile + JPA Specification only for actual selected filters
  -> PublicProductQueryService selects only the requested IDs, orders ACTIVE products by computed availability bucket first, then selected sort + ID tie-breaker, and runs one lean pagination count
  -> PublicProductSummaryRepository hydrates every page card in one localized/RU-fallback projection with main image, category, brand/collection, stock/status/price, and approved rating aggregate
  -> PostgreSQL product/category/watch/interior/detail/media/review tables; no per-card name/media/rating query
  -> Page<ProductShortResponse>
  -> Catalog grid and Pagination render GoodCard unavailable badges for stockQuantity <= 0

Filter panel open/apply/reset
  -> GET /api/public/product/filters/{lang}?categoryCode=
  -> backend returns category context, filter labels, option labels/counts/disabled states, source, and price range
  -> CatalogFacetRepository executes one grouped base query for price/brand/country and at most one grouped profile query for wristwatch or interior detail values
  -> facet query count is generic 1, wrist/interior 2 plus the existing two category-context reads, and accessories 1 plus context; option count never adds SQL and no Product entity is materialized
  -> accessory catalog pages do not show the full filter trigger/drawer, even if the metadata endpoint can return generic product filters
  -> CatalogFilters stores draft checkbox/range values in React Hook Form and uses Controller for custom checkboxes and price inputs
  -> apply/reset rewrites URL and sets page=1

Category selector open/select
  -> CategorySelector fetches GET /api/public/category/all/{lang}
  -> frontend builds root/child hierarchy from id/parentId
  -> hover-intent changes the active root after a short delay and animates child submenu opacity/translate without collapsing the panel
  -> on mobile, both the toolbar trigger and bottom-navigation trigger open the same full-height category sheet
  -> selected root/child writes /{locale}/catalog?categoryCode={code}&page=1 through routes.categorySelectionCatalog
  -> previous price/filter/page params are cleared while search/sort can remain
  -> Catalog and CatalogFilters receive categoryCode from the route query after reload

Mobile catalog overlay coordination
  -> category/filter/sort triggers and the persistent compact search trigger pass their HTMLElement to CatalogOverlayProvider; the desktop auto-open input is never a restore target
  -> provider switches the single active overlay and hides MobileBottomNavigation
  -> below 1024px CatalogMobileSheet/Radix Dialog owns modal focus trapping, Escape handling, portal layering, one body scroll lock, internal scrolling, and safe-area actions
  -> from 1024-1439px compact icon triggers use toolbar-attached category/filter/sort panels while catalog search expands inside the toolbar card
  -> explicit close clears the active overlay, waits for the 220ms exit transition, restores bottom navigation, and returns focus only to a connected safe trigger
```

Smart search flow:

```text
User focuses SmartSearch in Navigation, CatalogPage, or ProductPage
  -> React Hook Form owns the search query field; local state owns status/results and non-catalog visibility, while catalog visibility comes only from CatalogOverlayProvider
  -> home Navigation keeps a 48px row-owned overlay root while its visible frame animates from the right to a centered 66%/760px maximum
  -> product keeps a stable toolbar-owned overlay root, while desktop catalog search is positioned by the white .catalog-toolbar-shell card
  -> catalog/product use a 19px top placement, 38px inactive right inset, and a centered 70%/760px active maximum; the inner toolbar reserves 67px for controls
  -> mobile catalog icon search remains absolute within the toolbar safe inset
  -> width, horizontal position, transform, and mask color animate with VYMPEL motion tokens without changing parent geometry
  -> input and dropdown visually merge into one connected component with no gap and no double border
  -> catalog/product variants keep the hero-toolbar inline-submit shape and their result panels open below the toolbar rather than over breadcrumbs
  -> typing 2+ characters sets a debounced quick-search request and aborts stale requests
  -> GET /api/public/product/search/quick/{lang}?q={query}&limit=6
  -> ProductPublicController rejects blank/one-character queries with []
  -> ProductCatalogService reuses the catalog active-product + trigram/LIKE search specification, selects at most 8 IDs without a page count, then hydrates all compact rows through one PublicProductSummaryRepository query
  -> SmartSearch renders compact clickable rows via routes.product(id), unavailable badges from stock/status, and a show-all action
  -> Enter/search/show-all routes to /{locale}/catalog?search={query}&page=1 through routes.searchCatalog, clearing category/filter/price state by construction
```

Internal navigation flow:

```text
Visible public link or CTA
  -> src/config/routes.ts route/catalog/contact/marketplace helper
  -> next-intl Link/useRouter for locale-aware internal routes, or ordinary anchor for tel/WhatsApp/marketplace URLs
  -> /{locale}/catalog?categoryCode=...&page=1 for category links
  -> /{locale}/catalog?categoryCode=WATCH_WRIST&gender=1&page=1 for semantic male wristwatch links
  -> /{locale}/brands/{brandSlug} for public brand pages, or /{locale}/catalog?brand={backendFilterValue}&page=1 after resolving backend brand filter metadata
```

Local favorites/cart flow:

```text
GoodCard or ProductSummary favorite/cart action
  -> createProductSnapshot stores id/name/price/image/collection/sku/status/stock/category/brand where available
  -> localProductStorage writes vympel:favorites or vympel:cart by product id using localStorage guarded by browser checks and returns added/removed/updated/alreadyInCart/unavailable/stockLimit/failed statuses
  -> addCartProduct blocks unavailable products and blocks increments when quantity would exceed stockQuantity
  -> useSyncExternalStore notifies cards, header counts, FavoritesPage, and CartPage
  -> useProductActionToasts shows localized Sonner feedback with Favorites/Cart action buttons only after successful writes, or friendly error/warning toasts for failed writes, out-of-stock attempts, stock limits, and checkout validation
  -> analytics helper sends FAVORITE/UNFAVORITE/ADD_TO_CART/REMOVE_FROM_CART asynchronously when actions occur
  -> FavoritesPage and CartPage send one POST /api/public/product/batch-summary/{lang} with a stable sorted ID key; the endpoint caps at 60, deduplicates, preserves first occurrence, and resolves every valid summary in one query
  -> valid summaries refresh price/stock/status/locale/image/category/brand/rating while explicit missingIds preserve the saved identity but mark it unavailable; a total failure shows the existing retry state and never erases or per-ID refetches local data
  -> simultaneous identical locale+ordered-ID frontend calls share only their in-flight promise; the settled result is not cached
  -> FavoritesPage similar products use GET /api/public/product/catalog/{lang}, preferring the first favorite category and excluding favorites where possible
```

Cart checkout flow:

```text
CartPage checkout button
  -> getCartCheckoutIssue blocks empty carts, missing refreshed product/SKU data, unavailable products, or quantities above stock
  -> buildWhatsAppOrderMessage formats a localized greeting, every cart position, quantity, unit price, line total, article/SKU as the final item line, and order total
  -> buildWhatsAppOrderUrl URL-encodes the message onto CONTACT_LINKS.whatsapp and opens WhatsApp only after validation passes
  -> disabled stock-limit plus button is wrapped in shadcn Tooltip and paired with a subtle inline "available only N" message
```

Brand page flow:

```text
/{locale}/brands/{brandSlug}
  -> BrandPage resolves slug/copy/assets from src/config/brandPages.ts and src/config/brandRoutes.ts
  -> GET /api/public/product/filters/{lang} resolves the backend brand filter option id by label/name, including the existing pierre-ricaude data compatibility case
  -> GET /api/public/product/catalog/{lang}?brand={id}&page=0&size=15&sort=newest
  -> ProductCatalogService applies active-product and selected brand filters, then PublicProductQueryService keeps in-stock products before out-of-stock products even with newest sorting
  -> BrandProductsGrid renders existing GoodCard cards only for returned same-brand products
  -> if the backend has fewer than 15 matching products, the page shows the available products or a localized empty state without substituting other brands
  -> the brand catalog link uses /{locale}/catalog?brand={id}&page=1 when the filter id is available; header search still redirects to the global catalog search and clears brand state
```

Admin flow:

```text
Admin HTTP client
  -> /api/auth login or register
  -> JWT token
  -> /api/admin/* endpoint with ADMIN role
  -> service layer
  -> database and/or S3-compatible storage
```

CRM flow:

```text
CRM login
  -> vympel_crm /login
  -> React Hook Form owns form values while existing localized validation and loading/error state stay in component state
  -> POST /api/crm/auth/login
  -> backend validates ADMIN or MANAGER role in JWT
  -> CRM stores tokens in sessionStorage
  -> ProtectedShell calls /api/crm/auth/me before rendering protected pages
  -> CRM product/dashboard/activity UI or admin-only users UI
  -> protected /api/crm/** endpoints
  -> service layer and Liquibase-managed tables
  -> CrmActivityService audit events for important mutations
```

RHF form architecture:

```text
Public SmartSearch / CatalogFilters / ProductSummary notify form
  -> useForm / useWatch / Controller where custom inputs are involved
  -> existing localized UI and URL/API helpers

CRM LoginView / ProductListView / UserListView / UserForm / ProductForm / BulkProductCreateView
  -> useForm stores submitted values, useWatch mirrors complex form objects, and existing validation helpers remain localized
  -> payload helpers such as toPayload/toBulkPayload still shape API requests
  -> loading/error/success state stays explicit in the component so API behavior is unchanged
```

CRM product search flow:

```text
GET /api/crm/products search query
  -> CrmProductController applies newest-first paging and accepts optional status
  -> ProductServiceImpl normalizes search/status and treats blank values as no filter
  -> blank search/status uses ProductRepository.findAll(pageable), preserving DRAFT/ACTIVE/ARCHIVED
  -> status-only uses findAllByStatusIgnoreCase
  -> text search matches product ID, model, SKU, status, brand, and localized name
  -> combined text/status uses a dedicated non-null JPQL query
  -> JPQL search has no nullable text parameter branch, avoiding PostgreSQL lower(bytea) inference
```

CRM product quick edit flow:

```text
CRM products table
  -> ProductRow initializes price/stock inputs from ProductResponse.price and ProductResponse.stockQuantity
  -> blank/missing values render as empty input, not fake defaults
  -> PATCH /api/crm/products/{id}/price or /stock validates non-negative numeric input
  -> ProductServiceImpl writes the canonical product.price or product.stockQuantity value
  -> ProductResponse explicitly reads those same Product entity fields
  -> returned ProductResponse replaces the row, then CRM refetches the list and input state resyncs from backend values
  -> reload calls GET /api/crm/products and displays persisted values
```

CRM admin user-management flow:

```text
ADMIN user
  -> vympel_crm /users routes through ProtectedShell adminOnly
  -> /api/crm/users/** protected by ADMIN role in SecurityConfig and @PreAuthorize
  -> CrmUserManagementService validates fields, hashes passwords, assigns roles, preserves last active admin
  -> users / role / user_role tables
  -> CrmActivityService logs user-management mutations
```

CRM collection creation flow:

```text
CRM product create/edit form
  -> inline collection form validates brand plus RU/EN/KZ names and descriptions
  -> POST /api/crm/collections
  -> CrmCollectionService creates collection linked to brand
  -> collection_i18n stores name/description for ru/en/kk
  -> CrmActivityService logs COLLECTION_CREATED
  -> CRM inserts returned option into references.collections and selects it without a full reload
```

CRM product category-first create/edit flow:

```text
CRM /products/new
  -> ProductForm loads /api/crm/references and renders only the category selection step
  -> admin selects category; ProductForm derives category profile and productType default
  -> full create form renders common fields plus only wristwatch, interior-clock, or base/accessory specs
  -> submit sends ProductCreateRequest with RU/EN/KZ product names, RU/EN/KZ descriptions, and exactly the detail block allowed by the category profile
  -> ProductServiceImpl validates profile-specific details before persistence

CRM /products/{id}
  -> ProductForm loads product + references
  -> ProductResponse includes localized display name/description plus full productName and descriptionTranslations for edit hydration
  -> existing category is locked in the UI
  -> form renders fields from the loaded category profile
  -> backend rejects detail payloads that do not belong to the target category profile and blocks cross-profile category edits
```

CRM bulk product creation flow:

```text
CRM /products/bulk
  -> BulkProductCreateView loads /api/crm/references and renders only category selection first
  -> selected category determines shared productType and wristwatch/interior/accessory field profile
  -> admin fills shared brand/status/RU-EN-KZ descriptions/specs/marketplace values once as defaults
  -> admin adds, duplicates, removes, and validates product-specific rows with per-row multilingual descriptions and per-row category-specific overrides
  -> POST /api/crm/products/bulk sends categoryId, common defaults, and row overrides/final row values
  -> ProductBulkCreationService merges common defaults + row overrides, builds ProductCreateRequest per row, and reuses ProductService.create
  -> response returns createdCount, failedCount, created product ids/SKUs, and row-level errors
  -> CrmActivityService logs PRODUCT_BULK_CREATED
```

CRM product photo upload flow:

```text
CRM product create/edit form
  -> admin/manager selects one or more image files
  -> frontend validates supported image MIME types and previews selected files
  -> existing products call POST /api/crm/products/{id}/images immediately
  -> new products are created first, then selected files upload to the new product id
  -> ObjectStorageService writes images to S3/MinIO and stores media object keys
  -> Spring multipart limits allow the same 10 MB/file contract enforced by CRM and ObjectStorageService
  -> first photo becomes main when no main photo exists; each row persists position and is_main
  -> ProductResponse returns safe image DTOs: id, url, alt, sortOrder, isMain
  -> CRM updates the photo grid and shows localized upload/order/main/delete feedback
  -> order/main/delete mutations lock the product media set, validate ownership, and persist atomically
  -> deleting the main image promotes the next ordered image
  -> product cards/search resolve main image then first ordered image; product gallery puts main first and follows saved order for the rest
  -> successful creation opens /products/{id}; upload failure keeps that route available for retry
```

Product popularity analytics flow:

```text
Public product page / product cards
  -> ProductAnalyticsTracker sends VIEW once per product/session
  -> favorite toggle sends FAVORITE/UNFAVORITE and add-to-cart buttons send ADD_TO_CART asynchronously
  -> POST /api/public/analytics/products/events validates productId and safe eventType
  -> ProductAnalyticsService stores ProductAnalyticsEvent with sessionId, sanitized metadata, IP, user-agent, createdAt
  -> CRM /analytics calls GET /api/crm/analytics/products/popularity?period=&lang=
  -> ProductAnalyticsService calls the all-time aggregate query when no date filter is needed, or the since-date aggregate query for today/7d/30d to avoid ambiguous nullable PostgreSQL parameters
  -> ProductAnalyticsService aggregates views/favorites/cart additions by product and period
  -> CRM analytics tables show most viewed/liked/cart-added, high-interest, low-demand, and promotion recommendations
  -> PATCH /api/crm/analytics/products/{id}/promotion toggles product promotion mode while blocking out-of-stock promotion
```

Product review and rating flow:

```text
Guest or authenticated user opens a public product page
  -> ProductPage fetches ProductResponse and the first approved review page in parallel
  -> ProductReviews updates `reviewPage`, `reviewSort`, `reviewRating`, and `reviewText` URL params without a full server navigation
  -> ProductReviews fetches GET /api/public/product/{lang}/{id}/reviews?page=&size=15&sort=&rating=&hasText=
  -> ProductReviews submits RHF `{ rating, text? }` to POST /api/public/product/{id}/reviews
  -> ProductReviewService stores author type plus trimmed plain text with status PENDING
  -> pending/rejected/deleted rows are excluded from public reads and rating aggregates
  -> CRM /reviews loads the protected queue and pending count
  -> ADMIN/MANAGER approves, rejects/hides, or soft-deletes a review
  -> moderation stores status, moderatedAt, and moderatedBy and writes a CRM activity event
  -> approved-only batch aggregates populate ProductResponse/ProductShortResponse
  -> product detail, catalog, brand, new/similar, and refreshed favorites cards render the rating summary
```

Product recommendation flow:

```text
ProductPage resolves primary product/reviews/CMS without awaiting recommendations
  -> AsyncProductRecommendations starts behind a server Suspense boundary with fallback null
  -> GET /api/public/product/{lang}/{id}/recommendations?limit=12 (no-store, frontend timeout 2500 ms)
  -> ProductRecommendationService caps limit to 12 and opens a read-only repeatable-read transaction
  -> query 1 loads source brand/price/category/parent profile
  -> query 2 ranks valid public candidate IDs through stages 1-7; all out-of-stock candidates are stage 7
  -> LinkedHashSet excludes current/duplicates while preserving ranked order
  -> query 3 uses PublicProductSummaryRepository to batch-hydrate localized/RU-fallback name, collection, main/fallback media key, and approved rating aggregate
  -> ProductRecommendations renders title + carousel only when at least one card exists
  -> true catalog exhaustion, query timeout, 429, or internal/fetch failure logs/metrics server-side and returns no section without delaying core page streaming
```

CMS content flow:

```text
ADMIN opens CRM /cms
  -> CmsView loads GET /api/crm/cms/pages and GET /api/crm/cms/pages/{pageKey}
  -> cmsBlockSchemas shows only fields supported by the selected block type
  -> image blocks show the default image first; KZ, EN, and mobile variants live in an optional collapsed section
  -> every upload posts multipart file to POST /api/crm/cms/media/upload and reuses ObjectStorageService/MinIO under cms/
  -> CmsBlockRequest persists mediaId/mediaKzId/mediaEnId/mobileMediaId/mobileMediaKzId/mobileMediaEnId plus supported translations/link/settings fields
  -> CmsBlockSchema clears unsupported fields and CmsService stores DB translations as ru/en/kk, upserting existing translation rows by blockId + lang
  -> create/update/delete/reorder/publish/unpublish returns the committed block and requests public Next.js revalidation when VYMPEL_CMS_PUBLIC_REVALIDATE_URL and VYMPEL_CMS_REVALIDATE_SECRET are configured
  -> PublicCmsController returns only ACTIVE pages/PUBLISHED blocks, applies field-level RU fallback, emits version metadata, and sends Cache-Control: public, max-age=30, stale-while-revalidate=30
  -> public Home/About routes fetch GET /api/public/cms/pages/{pageKey}?lang= through the Next data cache with revalidate: 30 and tags ["cms", "cms:{pageKey}"]
  -> /api/revalidate validates CMS_REVALIDATE_SECRET, revalidates cms tags and localized Home/About paths, and lets the next or second reload see the committed CMS data
  -> cmsImageSources chooses desktop/mobile locale media in current-locale mobile, current-locale desktop, default mobile, default desktop, static fallback order; it appends version query params and CmsResponsiveImage falls back to the known static asset on missing/failed media
  -> hardcoded localized copy/assets render only when a CMS block/value is absent or the CMS request fails
```

Customer request flow:

```text
Public CTA ("Оставить заявку" / "Задать вопрос по модели")
  -> CustomerRequestButton opens the root CustomerRequestDialogProvider
  -> React Hook Form validates optional name/message plus required email-or-phone contact and honeypot website
  -> PublicApiController.createCustomerRequest posts to POST /api/public/requests with source such as about_cooperation_banner, catalog_contact_banner:{categoryCode}, product_contact_banner, or product_model_question:{id}
  -> PublicCustomerRequestController / CustomerRequestService trim values, reject markup, validate email/phone/source, and persist customer_request with status NEW
  -> CRM /requests calls protected /api/crm/requests endpoints through crmApi
  -> RequestProcessingView filters/searches requests, opens details, changes status, saves adminComment, or cancels
  -> CustomerRequestService updates status/comment/processedBy/processedAt and CrmActivityService records the CRM action
```

```text
CRM authentication
  -> POST /api/crm/auth/login validates ADMIN/MANAGER credentials
  -> backend returns short-lived access JWT in JSON and rotating refresh JWT in host-only HttpOnly cookie
  -> CRM keeps only the access token in sessionStorage and sends every request with credentials included
  -> protected request 401 joins one shared POST /api/crm/auth/refresh promise
  -> backend validates Origin/Referer, locks hashed refresh-session identity, rotates family member, and returns new access/cookie
  -> CRM retries the original request exactly once
  -> protected request 403 preserves the session and emits localized forbidden feedback
  -> POST /api/crm/auth/logout revokes the refresh session; CRM clears access state only after 204
```

```text
CMS media upload / attachment / retirement
  -> ADMIN upload validates extension, declared MIME, decoded image signature/dimensions, size, and UUID object key
  -> cms_media starts ACTIVE; one reusable row may be attached in any of six cms_block slots
  -> block update/delete commits first, then an after-commit event marks newly unreferenced media orphaned
  -> dry-run lists only OBJECT_STORAGE rows past the grace period with zero references
  -> cleanup locks the media row, rechecks every reference and grace/retry state, then marks DELETE_PENDING
  -> object storage delete succeeds -> DB row is deleted; storage failure -> DELETE_FAILED with bounded backoff
```

```text
CMS mutation / public freshness
  -> CMS mutation and a page-key-deduplicated cms_revalidation_job commit in one transaction
  -> after-commit delivery or scheduled retry claims the durable job
  -> backend sends timestamp + request UUID + allow-listed page key with HMAC-SHA256 signature
  -> public /api/revalidate rejects invalid, expired, replayed, oversized, or unknown-page requests
  -> public app expires cms:{pageKey} and its mapped paths; normal 30-second ISR remains a safety net
  -> CRM reports contentSaved independently from SUCCESS / FAILED_RETRY_SCHEDULED / FAILED_NOT_CONFIGURED / FAILED_PERMANENT
```

## API Contracts

| Area | Endpoint/Method | Request | Response | Frontend usage |
| ---- | --------------- | ------- | -------- | -------------- |
| Request correlation and API errors | All backend HTTP endpoints | Optional safe `X-Request-Id` header (`A-Z`, `a-z`, digits, `.`, `_`, `:`, `-`, max 128); unsafe/missing values are replaced with a UUID | Every response exposes `X-Request-Id`. Structured errors include `timestamp`, `status`, `code`, safe `message`, `requestId`, `path`, optional validation `details`, and optional `retryAfterSeconds`; stack traces, policy names, limiter keys, identities, and secrets are never returned. | Public and CRM API error objects retain request correlation and parse 429 delay from the body first, then `Retry-After` |
| Abuse rejection | Protected auth/public-write/search/catalog endpoints | Request identity is derived server-side from a trusted direct peer/proxy chain and, where applicable, normalized account/contact/content fields | `429 RATE_LIMIT_EXCEEDED` with matching `Retry-After`, `retryAfterSeconds`, and request ID. Fail-closed limiter-store outages return safe correlated 503; fail-open read policies continue normally. | Login, request, review, and smart-search surfaces show localized bounded cooldowns, preserve input, and do not auto-retry |
| Error status semantics | All backend HTTP endpoints | Malformed/invalid input, missing/invalid authentication, forbidden authorization, syntactically valid missing resource, or unexpected failure | Respectively 400, 401, 403, 404 (`RESOURCE_NOT_FOUND`), or 500. Only confirmed missing resources use `ResourceNotFoundException`; `IllegalArgumentException` remains a validation/bad-request path. | Dynamic public routes convert only API 404 to Next `notFound()`; retryable/unexpected 500 responses retain an error state |
| Health | `GET /api/public/ping` | None | Plain string `pong` | Not used by frontend currently |
| Categories | `GET /api/public/category/all/{lang}` | Path `lang` | `List<CategoryResponse>` with `id`, `name`, `code`, `parentId` | `PublicApiController.getCategoryList` for home/category links, product page, and catalog `CategorySelector` hierarchy |
| Category by code | `GET /api/public/category/{lang}/{code}` | Path `lang`, `code` | `CategoryWithParentResponse` with recursive `parent` | `PublicApiController.getCategoryByCode`, used by breadcrumbs |
| Product detail | `GET /api/public/product/{lang}/{id}` | Path `lang`, `id` | `ProductResponse` with SKU, localized name, full `productName` translations, model, canonical price/stock, status, type, category, brand including `country`, collection, safe `images[]` entries (`id`, public `url`, nullable `alt`, `sortOrder`, `isMain`), localized description, full `descriptionTranslations`, optional `watchDetails`, optional `interiorClockDetails`, marketplace links, promotion fields, and approved-only `ratingAverage`/`ratingCount` | `PublicApiController.getProduct`, main-first ordered product gallery, and favorites/cart snapshot refresh |
| Product batch summary | `POST /api/public/product/batch-summary/{lang}` | Path `lang`; JSON `{ ids }`, non-empty, positive, declared body <= 4 KiB, maximum 60 IDs; service deduplicates first occurrence | Ordered ACTIVE/public summary items with current localized name, model/SKU, price, stock/status, main image, marketplace links, collection, brand, visible category, and approved rating plus `missingIds` for hidden/deleted/inactive/unresolvable IDs. One read-only shared projection query. | Cart and favorites collection refresh; total failure preserves local snapshots, explicit missing IDs become unavailable |
| Product recommendations | `GET /api/public/product/{lang}/{id}/recommendations?limit=` | Path `lang`, product `id`; optional `limit` defaults/caps to 12 | Ordered `List<ProductRecommendationResponse>` with id, localized/RU-fallback name, model, price, stock/status, main-or-first image URL or null, marketplace links, optional localized collection, and approved-only rating summary. Candidates must be active, belong to an active category, have an accessible localized/RU name, exclude current/duplicates, prefer all in-stock stages 1-6, and use out-of-stock only at stage 7. Internal/query failure returns `[]` and is logged server-side. | `PublicApiController.getProductRecommendations`; async product page renders `ProductRecommendations` only when non-empty |
| Approved product reviews | `GET /api/public/product/{lang}/{id}/reviews?page=&size=&sort=&rating=&hasText=` | Path `lang`, product `id`; zero-based Spring `page`, `size` capped to 15, allow-listed `sort` (`newest`, `oldest`, `highestRating`, `lowestRating`, `positiveFirst`, `negativeFirst`), optional 1-5 `rating`, optional boolean `hasText` | `Page<PublicProductReviewResponse>` with approved reviews only: id, rating, optional plain text, author type/name, created timestamp; moderation/private fields are omitted. Backend always filters `APPROVED` and product id before optional filters. | Product detail `ProductReviews` tab; UI URL params are one-based `reviewPage`, `reviewSort`, `reviewRating`, `reviewText` and client-fetch the matching page without reloading the whole product page |
| Submit product review | `POST /api/public/product/{id}/reviews` | Public `@Valid` JSON `{ rating: 1..5, text?: plain text up to 2000 chars }`; optional JWT attaches a user, otherwise author type is `GUEST` | `201` with review id/status `PENDING`; the review is not publicly visible until approval | RHF product review form |
| Submit customer request | `POST /api/public/requests` | Public `@Valid` JSON `{ name?, email?, phone?, message?, source?, website? }`; email or phone is required after trim; email/phone/message/name lengths are capped; markup characters are rejected; `website` is a honeypot that must stay blank; `source` allows safe letters/numbers/dot/underscore/colon/hyphen | `201` with safe `{ id, status: "NEW" }` and no CRM/private fields | Root `CustomerRequestDialogProvider`; About/catalog/product contact banners and product "Задать вопрос по модели" trigger |
| Product analytics tracking | `POST /api/public/analytics/products/events` | `{ productId, eventType, sessionId?, metadata? }`; product/event must be valid, session is capped to 100, metadata is capped to 10 entries with nonblank keys up to 50 and primitive/null values up to 200 characters | `{ tracked: true }` for a persisted event or `{ tracked: false }` for a recent source/event/product/session duplicate; invalid/oversized input and throttled requests do not persist | Product page view tracking, favorite toggle tracking, add-to-cart/remove-from-cart tracking |
| Product list by category id | `GET /api/public/product/by-id/{lang}/{categoryId}` | Path `lang`, `categoryId`; Spring pageable query params | `Page<ProductShortResponse>` with approved-only rating summary and active products ordered by computed in-stock bucket before selected sort and pagination | No current frontend call discovered |
| Product list by category code | `GET /api/public/product/by-code/{lang}/{categoryCode}` | Path `lang`, `categoryCode`; query `page`, `size`, `sort`; backend caps public page size to 60 and defaults unknown sort properties to `createdAt` | `Page<ProductShortResponse>` with approved-only rating summary and active products ordered by computed in-stock bucket before selected sort and pagination | `PublicApiController.getProductsList`, catalog and related items |
| Catalog products | `GET /api/public/product/catalog/{lang}` | Query `categoryCode?`, nonblank `search?`, actual `priceMin?`/`priceMax?` or aliases `minPrice?`/`maxPrice?`, pageable `page/size/sort`, and repeated selected filter keys such as `brand`, `country`, `mechanism`, `gender`, `caseMaterial`, `strapMaterial`, `glassType`, `stoneInlay`, `caseSize`, `interiorColor`. Accessories intentionally send only the simple `gender` filter from their toolbar toggles; stale full-filter and price params are omitted by the frontend. Empty arrays, null/undefined placeholders, blank strings, missing keys, metadata-only filter keys, and removed country aliases (`brandCountry`, `manufacturerCountry`, `countryOfBrand`) are ignored. Backend caps public page size to 60 and allow-lists product sort fields. | `Page<ProductShortResponse>` with approved-only rating summary, filtered by backend category profile and ordered by computed in-stock bucket before selected sort and pagination; text search matches globally and uses PostgreSQL trigram similarity plus `LIKE`; catalog cards may have `imageUrl: null` when product media is missing | Public catalog grid, global search, brand pages loading up to 15 newest same-brand products with `brand={id}`, and favorites similar-product fallback |
| Smart quick search | `GET /api/public/product/search/quick/{lang}` | Path `lang`; query `q` and optional `limit` capped to 8. Blank, null/undefined placeholders, and one-character queries return `[]` instead of the full catalog. | `List<ProductQuickSearchResponse>` with id, localized name, model, sku, brand id/name, localized/fallback collection, price, stockQuantity, status, and first image URL. Uses the same active-product and trigram/LIKE search behavior as catalog search. | `PublicApiController.getQuickSearchProducts` in shared `SmartSearch`; header, catalog, and product variants debounce after 2+ characters, abort stale requests, and render compact product rows only |
| Catalog filter metadata | `GET /api/public/product/filters/{lang}?categoryCode=` | Optional `categoryCode` | `CatalogFiltersResponse` with category context, `inheritsFiltersFrom`, localized filter labels, `source`, option labels, counts, disabled states, and price min/max. The country filter is returned once as key `country` with source `brand_country`; `brandCountry` is not returned or accepted as an active public metadata key. | `CatalogFilters` panel; brand pages use the `brand` filter options to resolve backend brand ids from configured public brand names/slugs |
| Public CMS page | `GET /api/public/cms/pages/{pageKey}?lang=` | Path `pageKey` such as `home` or `about`; query `lang` accepts frontend `ru/en/kz` and backend `kk` aliases | `PublicCmsPageResponse` with active page metadata, page `updatedAt`, and published blocks ordered by `sortOrder`; each block includes block `updatedAt`, default/RU desktop `media`, optional desktop `mediaKz`/`mediaEn`, default/RU mobile `mobileMedia`, optional mobile `mobileMediaKz`/`mobileMediaEn`, media `createdAt`, safe link/settings fields, and a field-level localized/RU-fallback translation. Response headers allow a short public cache with stale-while-revalidate. | `PublicApiController.getCmsPage` uses Next `revalidate: 30` with tags `cms` and `cms:{pageKey}`; Home/About render CMS-first hero/new-goods/intro/cooperation content and static fallbacks only when CMS data is absent |
| Public CMS blocks | `GET /api/public/cms/blocks/{pageKey}?lang=` | Same as public CMS page | `List<PublicCmsBlockResponse>` with published blocks for the active page | Available for block-only public consumers; current storefront uses the page endpoint |
| Auth register | `POST /api/auth/register/email` | `RegisterByEmailRequest`: email, password, firstName, lastName | `AuthResponse`: accessToken | No current frontend auth UI discovered |
| Auth login | `POST /api/auth/login/email` | `LoginByEmailRequest`: email, password | `AuthResponse`: accessToken | No current frontend auth UI discovered |
| Admin product create | `POST /api/admin/product/create` | `ProductCreateRequest` | Created product id (`Long`) | No current frontend admin UI discovered |
| Admin collection create | `POST /api/admin/collection/create` | `CollectionCreateRequest` | `CollectionResponse` | No current frontend admin UI discovered |
| Admin product image upload | `POST /api/admin/file/product/{productId}/upload/image` | Multipart request part `files`; image/jpeg, image/png, image/webp, or image/gif with matching `.jpg/.jpeg/.png/.webp/.gif` extension; max 10 files and 10 MB per file | `List<String>` UUID object keys | No current frontend admin UI discovered |
| CRM login | `POST /api/crm/auth/login` | `LoginByEmailRequest`; credentials included | `AuthResponse` containing only `accessToken`; only enabled `ADMIN`/`MANAGER` users are accepted. Sets host-only HttpOnly refresh cookie scoped to `/api/crm/auth`, `SameSite=Lax`, production-configured `Secure`, and refresh TTL max-age. | `vympel_crm` login form saves only the access token |
| CRM refresh | `POST /api/crm/auth/refresh` | Refresh cookie only; credentialed request with exact trusted `Origin` or `Referer` | `AuthResponse` containing new `accessToken` plus a rotated refresh cookie. Missing, invalid, expired, revoked, reused, disabled-user, or no-CRM-role sessions return safe `401 INVALID_SESSION`; reuse revokes the active family. | `crmApi.restoreSession` and shared single-flight 401 recovery; endpoint is never recursively refreshed |
| CRM logout | `POST /api/crm/auth/logout` | Optional refresh cookie plus exact trusted `Origin` or `Referer` | `204`; current refresh session is revoked when valid and the same cookie scope is cleared. Missing/invalid cookies remain idempotent. | CRM clears sessionStorage only after the 204; network/server failure preserves local access state |
| CRM current user | `GET /api/crm/auth/me` | Bearer access token | `CrmUserResponse` with id, email, names, phone, enabled, roles, created/updated timestamps | `ProtectedShell`, settings page |
| CRM customer requests | `GET /api/crm/requests?status=&search=&page=&size=` | Bearer ADMIN/MANAGER token; optional status `ALL`/`NEW`/`IN_PROGRESS`/`DONE`/`CANCELLED`, optional search over name/email/phone/message/source, pageable params capped to size 100 and default sorted newest-first | `Page<CrmCustomerRequestResponse>` with id, contact fields, message, source, status, created/updated timestamps, processedBy/processedAt, and adminComment | CRM `/requests` metric, filters, table, and detail selection |
| CRM request new count | `GET /api/crm/requests/new-count` | Bearer ADMIN/MANAGER token | `{ count }` for `NEW` requests | CRM `/requests` metric |
| CRM request detail | `GET /api/crm/requests/{id}` | Bearer ADMIN/MANAGER token | `CrmCustomerRequestResponse` | CRM request detail panel |
| CRM request status | `PATCH /api/crm/requests/{id}/status` | Bearer ADMIN/MANAGER token; `{ status }` with `NEW`, `IN_PROGRESS`, `DONE`, or `CANCELLED` | Updated `CrmCustomerRequestResponse`; done/cancelled set processed actor/timestamp, new clears them; audit event `CUSTOMER_REQUEST_STATUS_CHANGED` | CRM status select/save and mark-done action |
| CRM request comment | `PATCH /api/crm/requests/{id}/comment` | Bearer ADMIN/MANAGER token; `{ adminComment }` up to 2000 plain-text chars | Updated `CrmCustomerRequestResponse`; audit event `CUSTOMER_REQUEST_COMMENT_CHANGED` | CRM admin comment editor |
| CRM request cancel | `DELETE /api/crm/requests/{id}` | Bearer ADMIN/MANAGER token | Updated `CrmCustomerRequestResponse` with `CANCELLED`; audit event `CUSTOMER_REQUEST_CANCELLED` | CRM confirmed cancel/archive action |
| CRM CMS pages | `GET /api/crm/cms/pages`, `GET /api/crm/cms/pages/{pageKey}` | Bearer ADMIN token | Page summaries or a full `CrmCmsPageResponse` with blocks, default/RU desktop, KZ/EN desktop, RU/KZ/EN mobile media, all RU/EN/KZ translations, settings JSON, and publication state | CRM `/cms` page selector, schema-driven editor, and adaptive preview |
| CRM CMS block mutations | `POST /api/crm/cms/blocks`, `PATCH /api/crm/cms/blocks/{blockId}`, `DELETE /api/crm/cms/blocks/{blockId}`, `PATCH /api/crm/cms/blocks/{blockId}/reorder`, `PATCH /api/crm/cms/blocks/{blockId}/publish`, `PATCH /api/crm/cms/blocks/{blockId}/unpublish` | Bearer ADMIN token; `CmsBlockRequest` includes page/key/type/status/sort, optional `mediaId`/`mediaKzId`/`mediaEnId`/`mobileMediaId`/`mobileMediaKzId`/`mobileMediaEnId`, and only schema-supported link/settings/translation values. Translations are keyed by language and normalized to DB `ru/en/kk`; duplicate aliases such as `kz` plus `kk` are rejected with 400. Only the RU title/description is required for text-required types; optional locales/variants never block save. | The committed `CrmCmsBlockResponse` plus `publicCacheRefresh` with `contentSaved`, `attempted`, `refreshed`, explicit status, safe message code, and request ID. Every mutation enqueues durable page-key revalidation in the same transaction and writes a CRM audit event; revalidation failure never rolls the content back. | CRM CMS editor save/delete/reorder/publish controls and localized partial-success warnings; editor payloads normalize to one translation object per language |
| CRM CMS media upload | `POST /api/crm/cms/media/upload` | Bearer ADMIN token; multipart part `file` with matching image/jpeg, image/png, image/webp, or image/gif extension; max 10 MB; server verifies decoded signature and bounded dimensions/pixels before upload | Safe `CmsMediaResponse` with id, original filename, content type, storage type, public URL, width/height when known, alt text fields, and `createdAt`; internal object keys are not exposed | CRM CMS editor image picker/upload and live preview |
| CRM CMS orphan dry run | `GET /api/crm/cms/media/orphans?page=&size=` | Bearer ADMIN token; zero-based page, size clamped to configured maximum | Pageable OBJECT_STORAGE candidates that are unprotected, past grace, retry-eligible, and currently have zero references; no mutation | Admin/operations diagnosis; safe default before cleanup |
| CRM CMS media references | `GET /api/crm/cms/media/{mediaId}/references` | Bearer ADMIN token; media id | Bounded slot-level references with block id/key, page key, block status, and one of `media`, `mediaKz`, `mediaEn`, `mobileMedia`, `mobileMediaKz`, `mobileMediaEn` | Proves whether a media row is reusable/in use without exposing object keys |
| CRM CMS orphan cleanup | `POST /api/crm/cms/media/orphans/cleanup?batchSize=` | Bearer ADMIN token; bounded batch size | Request-correlated processed/succeeded/failed/skipped summary. Each item is locked and rechecked; referenced/fresh/protected/non-object rows are skipped. | Explicit operational action; scheduled cleanup uses the same service |
| Public CMS revalidation | `POST /api/revalidate` on `vympel_front` | Backend-only bounded JSON `{version,timestamp,requestId,pageKey}` plus `X-CMS-Signature`; HMAC-SHA256 covers every field; five page keys are allow-listed and timestamps/replays are bounded | `200 REVALIDATED` with page key/tag/request ID; invalid signature 401, replay 409, bad/unknown payload 400, oversized 413, missing server secret 503 | Expires only `cms:{pageKey}` and the page's mapped route/path patterns; never accepts arbitrary paths or broad purge input |
| CRM product list | `GET /api/crm/products?lang=&page=&size=&search=&status=` | Bearer access token; zero-based page; size capped to 100; optional status `ACTIVE`/`DRAFT`/`ARCHIVED`; newest-first default sort | No-store `Page<ProductResponse>` with every status when unfiltered. Text search matches ID, model, SKU, status, brand, category code/name, or localized product name and can combine with status. | CRM search/status controls, total/page count, previous/next pagination, focus/mutation refetch |
| CRM product detail | `GET /api/crm/products/{id}?lang=` | Bearer access token | `ProductResponse` including category, brand, collection, images, localized description, `descriptionTranslations.desc_ru/desc_en/desc_kz`, `productName.name_ru/name_en/name_kz`, optional watch details, optional interior-clock details, stock, Kaspi URL, Wildberries URL | CRM edit form |
| CRM product create | `POST /api/crm/products?lang=` | Essential fields: category, nonblank RU/default `productName.name_ru` (max 255), model (max 255), non-negative integer price/stock, brand, status/type (CRM defaults new items to `DRAFT`). Optional: EN/KZ names, every description (max 10,000), collection, photos, marketplace URLs, and partial category-matching `watchDetails`/`interiorClockDetails`. Missing EN/KZ names/descriptions fall back to RU. | `ProductResponse`; clean `VALIDATION_ERROR`/`BAD_REQUEST` responses for expected validation; audit event `PRODUCT_CREATED` | CRM add product form after the category-first step |
| CRM product bulk create | `POST /api/crm/products/bulk?lang=` | `ProductBulkCreateRequest` with `categoryId`, `common` defaults for brand/status/type/RU-EN-KZ descriptions/specs/links, and rows with names/model/price/stock plus optional per-row brand/collection/status/type/RU-EN-KZ descriptions/watch/interior overrides/links. Row values win over common defaults. | `ProductBulkCreateResponse` with created/failed counts, created ids/SKUs, and row-level errors; audit event `PRODUCT_BULK_CREATED` | CRM `/products/bulk` marketplace-style bulk create form |
| CRM product update | `PUT /api/crm/products/{id}?lang=` | `ProductUpdateRequest` with editable core fields, locked/same-profile category, description `desc_ru/desc_en/desc_kz`, optional watch/interior details according to selected category profile, stock, optional marketplace URLs. Backend rejects detail blocks that do not belong to the target profile and blocks cross-profile category edits. | `ProductResponse`; audit event `PRODUCT_EDITED` | CRM edit product form |
| CRM product image upload | `POST /api/crm/products/{id}/images?lang=` | Bearer ADMIN/MANAGER token; explicit multipart request part `files` with one or more image/jpeg, image/png, image/webp, or image/gif files with matching image extensions; max 10 files and 10 MB per file, max 101 MB request | `ProductResponse` with refreshed structured `images`; first upload becomes main when needed; audit event `PRODUCT_IMAGES_UPLOADED` | CRM product create/edit photo section |
| CRM product image reorder | `PATCH /api/crm/products/{id}/images/order?lang=` | Bearer ADMIN/MANAGER token; `{ imageIds: number[] }` must contain every image belonging to that product exactly once | `ProductResponse` with persisted contiguous `sortOrder`; audit event `PRODUCT_IMAGES_REORDERED` | CRM photo Up/Down actions |
| CRM product main image | `PATCH /api/crm/products/{id}/images/{imageId}/main?lang=` | Bearer ADMIN/MANAGER token; image must belong to product | `ProductResponse` with exactly one `isMain`; audit event `PRODUCT_MAIN_IMAGE_CHANGED` | CRM Make main action; public cards/search use this image |
| CRM product image delete | `DELETE /api/crm/products/{id}/images/{imageId}?lang=` | Bearer ADMIN/MANAGER token; image must belong to product | `ProductResponse` after DB/object deletion and order compaction; deleting main promotes the next ordered image; audit event `PRODUCT_IMAGE_DELETED` | CRM Delete photo action |
| CRM product archive | `DELETE /api/crm/products/{id}?lang=` | Bearer access token | `ProductResponse` with status `ARCHIVED`; audit event `PRODUCT_ARCHIVED` | CRM products table |
| CRM quick price | `PATCH /api/crm/products/{id}/price?lang=` | `{ price }`, non-negative | `ProductResponse`; audit event `PRODUCT_PRICE_CHANGED` | CRM products table quick edit |
| CRM quick stock | `PATCH /api/crm/products/{id}/stock?lang=` | `{ stockQuantity }`, non-negative | `ProductResponse`; audit event `PRODUCT_STOCK_CHANGED` | CRM products table quick edit |
| CRM status | `PATCH /api/crm/products/{id}/status?lang=` | `{ status }` | `ProductResponse`; audit event `PRODUCT_STATUS_CHANGED` | CRM edit/status workflows |
| CRM marketplace links | `PATCH /api/crm/products/{id}/marketplace-links?lang=` | `{ kaspiUrl, wildberriesUrl }`, optional valid http/https URLs | `ProductResponse`; audit event `PRODUCT_MARKETPLACE_LINKS_CHANGED` | CRM edit workflows |
| CRM product popularity analytics | `GET /api/crm/analytics/products/popularity?period=&lang=` | Bearer access token; period `today`, `7d`, `30d`, or `all`; backend uses a no-date aggregate query for `all` and a separate `createdAt >= :since` aggregate query for dated periods | `ProductPopularityAnalyticsResponse` with totals, top viewed/favorited/cart-added products, low demand, high interest, and promotion recommendations | CRM `/analytics` page |
| CRM product promotion | `PATCH /api/crm/analytics/products/{id}/promotion?lang=` | `{ promotionMode }`, currently `MANUAL` or `NOT_PROMOTED` from CRM UI; backend also accepts `AUTO` and rejects promoting out-of-stock products | `ProductPopularityRowResponse`; audit event `PRODUCT_PROMOTION_CHANGED` | CRM analytics promotion recommendation actions |
| CRM reviews | `GET /api/crm/reviews?status=&product=&rating=&hasText=&dateFrom=&dateTo=&lang=&page=&size=` | Bearer ADMIN/MANAGER token; optional status, product name/model/SKU text, 1-5 rating, with/without-text boolean, inclusive date range, and pageable params capped to size 100 | `Page<CrmProductReviewResponse>` with product, author, status, creation/moderation details | CRM `/reviews` queue and filters |
| CRM pending review count | `GET /api/crm/reviews/pending-count` | Bearer ADMIN/MANAGER token | `{ count }` for `PENDING` reviews | CRM reviews metric |
| CRM approve review | `PATCH /api/crm/reviews/{id}/approve?lang=` | Bearer ADMIN/MANAGER token | Review with `APPROVED`, moderation timestamp/actor; `PRODUCT_REVIEW_APPROVED` audit event | CRM approve action |
| CRM reject/hide review | `PATCH /api/crm/reviews/{id}/reject?lang=` | Bearer ADMIN/MANAGER token | Review with `REJECTED`, moderation timestamp/actor; `PRODUCT_REVIEW_REJECTED` audit event | CRM reject/hide action |
| CRM delete review | `DELETE /api/crm/reviews/{id}?lang=` | Bearer ADMIN/MANAGER token | Soft-deleted review with `DELETED`, moderation timestamp/actor; `PRODUCT_REVIEW_DELETED` audit event | CRM confirmed delete action |
| CRM dashboard | `GET /api/crm/dashboard?lang=` | Bearer access token | Counts for total/active/in-stock/out-of-stock/missing links/pending reviews plus recent products and activities | CRM dashboard widgets |
| CRM activity | `GET /api/crm/activity?page=&size=` | Bearer access token | `Page<CrmActivityResponse>` | CRM activity page |
| CRM references | `GET /api/crm/references?lang=` | Bearer access token | Categories, brands, collections, mechanisms, genders, materials, glass types, stone inlays, countries, interior colors/styles/mechanisms/power types. Collection options include `brandId`; options submit stable IDs while rendering readable names. | CRM product form selects |
| CRM collection list | `GET /api/crm/collections?lang=&brandId=` | Bearer ADMIN/MANAGER token; optional `brandId` query | `List<CrmCollectionResponse>` with id, brandId, brandName, code, localized name/description, active, createdAt, updatedAt | CRM collection refresh/management calls |
| CRM brand collections | `GET /api/crm/brands/{brandId}/collections?lang=` | Bearer ADMIN/MANAGER token | `List<CrmCollectionResponse>` filtered by brand | Available CRM API endpoint for brand-scoped collection selects |
| CRM collection create | `POST /api/crm/collections?lang=` | `CrmCollectionCreateRequest`: `brandId` and `translations.ru/en/kz` each with required `name` and `description` | `CrmCollectionResponse`; audit event `COLLECTION_CREATED`; stores RU/EN/KZ values in `collection_i18n` using DB lang `ru/en/kk` | CRM product form inline collection creation |
| CRM user list | `GET /api/crm/users?page=&size=&search=` | Bearer ADMIN token, pageable query params | `Page<CrmManagedUserResponse>` with profile fields, enabled flag, roles, created/updated timestamps | CRM users table |
| CRM user roles | `GET /api/crm/users/roles` | Bearer ADMIN token | `List<CrmRoleResponse>` active role codes | CRM user form role select |
| CRM user detail | `GET /api/crm/users/{id}` | Bearer ADMIN token | `CrmManagedUserResponse` | CRM edit user form |
| CRM user create | `POST /api/crm/users` | `CrmUserCreateRequest`: email, password, firstName, lastName, phone, roles, enabled | `CrmManagedUserResponse`; audit event `ADMIN_CREATED_USER` | CRM create user form |
| CRM user update | `PUT /api/crm/users/{id}` | `CrmUserUpdateRequest`: email, firstName, lastName, phone, roles, enabled | `CrmManagedUserResponse`; audit events `ADMIN_UPDATED_USER`, plus role/status events when changed | CRM edit user form |
| CRM user roles update | `PATCH /api/crm/users/{id}/roles` | `{ roles }` non-empty role codes | `CrmManagedUserResponse`; audit event `ADMIN_CHANGED_USER_ROLES` | Available CRM API method |
| CRM user status update | `PATCH /api/crm/users/{id}/status` | `{ enabled }` | `CrmManagedUserResponse`; audit event `ADMIN_CHANGED_USER_STATUS` | CRM users table block/unblock |

Sort values accepted by the public product list controller are `newest`, `oldest`, `priceAsc`, `priceDesc`, `nameAsc`, and `nameDesc`. Unknown sort keys fall back to product creation date descending. Public frontend currently renders `priceAsc`, `priceDesc`, `newest`, and `oldest`.

## Entry Points

### Frontend

* App: `vympel_front/src/app/[locale]/layout.tsx`.
* Main page: `vympel_front/src/app/[locale]/page.tsx`.
* Routes: `/{locale}`, `/{locale}/about`, `/{locale}/catalog`, `/{locale}/catalog/[...slug]`, `/{locale}/product/{id}`, `/{locale}/brands/{brandSlug}`, `/{locale}/favorites`, `/{locale}/cart`, `/{locale}/guarantee`, `/{locale}/delivery`, `/{locale}/payment`, `/{locale}/[...notFound]`.
* API client: `vympel_front/src/api/controllers/PublicController.ts`.
* Route/link helpers: `vympel_front/src/config/routes.ts`.
* State/store: `vympel_front/src/store/store.ts` and `vympel_front/src/hooks/store.ts`; catalog interaction state also lives in URL search params, and temporary favorites/cart state lives in `localStorage` through `vympel_front/src/services/localProductStorage.ts`.
* CRM app: `vympel_crm/src/app/layout.tsx`.
* CRM main route: `/dashboard`; `/` redirects to `/dashboard`, and unauthenticated protected routes redirect to `/login`.
* CRM routes: `/login`, `/dashboard`, `/cms`, `/products`, `/products/new`, `/products/bulk`, `/products/{id}`, `/requests`, `/reviews`, `/analytics`, `/users`, `/users/new`, `/users/{id}`, `/activity`, `/settings`.
* CRM API client: `vympel_crm/src/shared/api/client.ts`.
* CRM feedback provider: `vympel_crm/src/shared/feedback/NotificationProvider.tsx`, mounted in `vympel_crm/src/app/layout.tsx`.
* CRM auth/session state: `vympel_crm/src/shared/api/session.ts` stores only the access token in `sessionStorage`, removes the legacy refresh key, and emits bounded session-expired/forbidden browser events; the refresh token is inaccessible to JavaScript in a backend-owned HttpOnly cookie.

### Backend

* Main: `vympel_back/src/main/java/com/shop/vympel/VympelApplication.java`.
* API: controllers in `vympel_back/src/main/java/com/shop/vympel/controllers`.
* Auth: `SecurityConfig`, `JwtAuthFilter`, `JwtService`, `AuthController`, `CrmAuthController`, `AuthServiceImpl`, `CrmSessionService`, `CrmRefreshCookieService`, and `TrustedOriginValidator`.
* Migrations: `vympel_back/src/main/resources/db/changelog/db.changelog-master.xml`.
* Seeds: Liquibase seed files `002_seed_dictionaries.xml`, `003_seed_watch_features.xml`, `2026-02-08-03-seed-countries.xml`, `2026-02-08-04-seed-brands-with-countries.xml`, `2026-02-13-01-seed-categories.xml`, and `2026-06-30-01-cms-content-system.xml` for initial CMS pages/blocks/media.
* CRM API: `CrmAuthController`, `CrmProductController`, `CrmCustomerRequestController`, `CrmProductReviewController`, `CrmUserController`, `CrmDashboardController`, `CrmActivityController`, `CrmReferenceController`, `CrmCollectionController`, `CrmBrandCollectionController`, `CrmCmsController`.
* Public CMS API: `PublicCmsController`.
* Public request API: `PublicCustomerRequestController`.
* Request correlation: `vympel_back/src/main/java/com/shop/vympel/logging/RequestCorrelationFilter.java`.
* Abuse controls: `RateLimitFilter`, `RateLimitService`, `LoginBackoffService`, `AbuseProtectionService`, and Redis/memory `RateLimitStore` implementations under `security/ratelimit`.
* Secure startup guard: `NonLocalSecurityConfigurationValidator`, registered before bean creation through `META-INF/spring.factories`.
* ADMIN bootstrap: historically named `LocalAdminBootstrapRunner`, it executes after application initialization/Liquibase in any profile only when `VYMPEL_BOOTSTRAP_ADMIN_ENABLED=true`; all database work is delegated to `LocalAdminBootstrapService`.
* Error response boundary: `vympel_back/src/main/java/com/shop/vympel/security/GlobalErrorHandler.java`.
* File logging config: `vympel_back/src/main/resources/logback-spring.xml`.

### Other

* CLI: None discovered beyond npm and Gradle commands.
* Workers: `LocalAdminBootstrapRunner` is an opt-in one-shot startup runner; `MigrationVerificationRunner` closes a finite migration container after confirming `databasechangelog`; scheduled background jobs are listed below.
* Cron jobs: `RefreshSessionCleanupJob` removes expired/revoked CRM refresh sessions daily using `VYMPEL_CRM_REFRESH_CLEANUP_CRON` and the configured retention window.
* Scripts: Frontend npm scripts in `package.json`; backend Gradle wrapper tasks.

## Common Commands

### Frontend

* Install: `cd vympel_front && npm install`.
* Dev: `cd vympel_front && npm run dev`.
* Build: `cd vympel_front && npm run build`.
* Test: `cd vympel_front && npm run test` (finite Vitest run).
* Production HTTP status test: after `npm run build`, run `cd vympel_front && npm run test:production-status`; it starts isolated mock-API and Next production processes on ephemeral ports, asserts status plus localized content, and verifies process/port cleanup.
* Security-header unit matrix: `cd vympel_front && npm run test:security`.
* Asset/build budget gate: after both Next builds, `cd vympel_front && npm run test:budgets:ci`; the detector self-tests an oversized fixture and requires current `.next` output.
* Lint: `cd vympel_front && npm run lint`.
* Typecheck: `cd vympel_front && npm run typecheck`.
* Format: Unknown; no format script is defined.

### CRM Frontend

* Install: `cd vympel_crm && npm install`.
* Dev: `cd vympel_crm && npm run dev` (runs on port `3001`).
* Build: `cd vympel_crm && npm run build`.
* Test: `cd vympel_crm && npm test` (finite Vitest run).
* Security-header unit matrix: `cd vympel_crm && npm run test:security`.
* Production response-header test: after `npm run build`, `cd vympel_crm && npm run test:production-headers`; it uses an ephemeral local port and verifies cleanup.
* Lint: `cd vympel_crm && npm run lint`.
* Typecheck: `cd vympel_crm && npm run typecheck`.
* Format: Unknown; no format script is defined.

### Backend

* Install: Gradle wrapper resolves dependencies: `cd vympel_back && .\gradlew.bat build` on Windows or `cd vympel_back && ./gradlew build` on Linux; `gradlew` must retain Git mode `100755` for GitHub Actions.
* Dev: `cd vympel_back && .\gradlew.bat bootRun --args='--spring.profiles.active=local'` so local HTTP uses the explicit `application-local.yml` refresh-cookie exception.
* Build: `cd vympel_back && .\gradlew.bat build`.
* Test: `cd vympel_back && .\gradlew.bat test`.
* Executable image: `cd vympel_back && docker build -t vympel-backend .`; the multi-stage image runs as a non-root Java 17 user and contains no configured secrets.
* Logging verification: backend tests load `logback-spring.xml`; focused tests cover request IDs, safe error responses, masking, and dedicated security/CRM logger routing. Generated files appear under `${APP_LOG_DIR:logs}` and are ignored by Git.
* Lint: Unknown; no lint task was discovered.
* Format: Unknown; no format task was discovered.
* Migrations: local startup may run Liquibase directly; deployment uses `deployment/scripts/verify-migrations.sh <compose-file> <env-file>` and the finite `migrate` service before normal replicas start with Liquibase disabled.
* Seeds: Liquibase seed changelogs run through `db.changelog-master.xml`.

### Full Project

* Install: Run public frontend `npm ci`, CRM `npm ci`, and backend Gradle dependency resolution separately. Clean Docker builds use the committed npm lockfiles.
* Docker dev: From the repository root copy/fill `.env.example` as ignored `.env`, then run `docker compose up -d --build --wait`. Compose automatically loads the `.env` beside canonical `compose.yml`; public is `http://localhost:3200/ru`, CRM is `http://localhost:3201/login`, backend is `http://localhost:8080`, MinIO API/console are `9100`/`9101`, PostgreSQL is `5433`, and Redis is `6379`.
* Docker stop: `docker compose down` removes containers/network but preserves named data volumes. The destructive reset is explicit only: `docker compose down -v`.
* Hybrid IDE dev: Start dependencies with `docker compose up -d postgres redis minio minio-init`; in IntelliJ set Run/Debug Configuration -> Environment variables to `SPRING_PROFILES_ACTIVE=local`, then run the backend. `application-local.yml` supplies host-facing fallbacks for PostgreSQL `localhost:5433`, Redis `localhost:6379`, MinIO `localhost:9100`, CMS revalidation `localhost:3000`, and exact public/CRM origins `3000`/`3001`. Next automatically loads ignored `vympel_front/.env` and `vympel_crm/.env` for the local apps.
* Build: Run public frontend `npm run build`, CRM `npm run build`, and backend `.\gradlew.bat build`.
* Test: Backend `.\gradlew.bat test`; public frontend `npm run test`; CRM `npm test`.
* Docker compatibility entrypoint: `cd vympel_back && docker compose up -d --build --wait` includes the authoritative root stack; service definitions are not duplicated.
* Docker status/logs: `docker compose ps` and bounded `docker compose logs --no-color --tail 200 <service>`.
* Deployment validation: use the environment, pull, migration, deploy, smoke, and rollback scripts under `deployment/scripts`; staging/production Compose consumes prebuilt full-SHA tags.
* CI: `backend-ci.yml`, `storefront-ci.yml`, and `crm-ci.yml` own component checks/image builds; `release-images.yml` builds immutable SHA-tagged images on relevant `main` changes and permits a doubly guarded registry push only from an explicit manual run; `full-release-gate.yml` runs all component and shared infrastructure gates. The older `performance-budgets.yml` remains the dedicated combined budget gate.

## External Dependencies & Integrations

* PostgreSQL: Main application database configured in `vympel_back/src/main/resources/application.yml`; the root Compose stack owns PostgreSQL 16 and a persistent `postgres-data` local volume.
* Redis: Atomic fixed-window abuse-control state configured through `spring.data.redis.url`; the root Compose stack uses persistent Redis/AOF and deliberately selects Redis even under the explicit local profile.
* MinIO / S3-compatible storage: Product and CMS image storage configured by `storage.s3.*`; the root Compose stack has persistent MinIO plus a finite idempotent initializer for the public-download `dev-backet` bucket.
* Reverse proxy / WAF: Deployment-owned outer request/connection ceiling. Only explicitly configured numeric ingress CIDRs may supply forwarding chains to the application limiter.
* Server filesystem logging: Logback writes rotating files under `APP_LOG_DIR`; production may use `/var/log/vympel`, and a backend container should use `/app/logs` with a host or named-volume mount.
* Google Fonts through `next/font/google`: Inter, Judson, Montaga, and Montserrat are loaded in the frontend root layout.
* OpenAPI/Swagger: `springdoc-openapi-starter-webmvc-ui` is included, but endpoint availability was not verified.
* next-intl: Frontend localization and locale-prefixed routes.
* React Hook Form: Public storefront and CRM form state. Public custom controls use existing `Controller` wrappers or local Controllers; CRM uses RHF without a schema resolver and preserves localized validation helpers in the components.

## Environment Variables

The working full-Docker values live only in ignored workspace-root `.env`; canonical root `compose.yml` loads that file automatically for interpolation and passes the required values to the appropriate server container. `.env.example` lists the full key contract with blank credential/URL placeholders, while `.env.docker.example` is only a non-secret port-override snippet. A root `.env` is not loaded by IntelliJ or by the sibling Next processes.

### Frontend

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `BASE_API_PUBLIC` | yes for server-side public API calls | Backend public API base URL. Current `.env` value: `http://localhost:8080/api/public`. |
| `NEXT_PUBLIC_BASE_API_PUBLIC` | yes for browser-side public API calls | Public backend API base URL exposed to the browser. Current `.env` value: `http://localhost:8080/api/public`. |
| `NEXT_PUBLIC_SITE_URL` | yes at storefront build and runtime | Browser-safe origin-only canonical site URL used by route metadata, language alternates, sitemap, and robots. It is compiled into static metadata at build time and must match the deployed public origin at runtime. |
| `CMS_REVALIDATE_SECRET` | yes when backend CMS cache refresh is enabled | Server-only secret required by `vympel_front/src/app/api/revalidate/route.ts`; must match backend `VYMPEL_CMS_REVALIDATE_SECRET`. |
| `NEXT_PUBLIC_MEDIA_ORIGINS` | no | Comma-separated exact HTTP(S) image origins added to public `next/image` and CSP allow-lists; no wildcard values. |
| `SECURITY_HEADERS_CSP_MODE` | no | `enforce`/unset by default; use `report-only` only during measured staging rollout. |
| `NEXT_PUBLIC_TELEMETRY_ENABLED` / `TELEMETRY_ENABLED` | no | Browser and server flags must both be `true` for first-party same-origin telemetry; default is no-op. |
| `NEXT_PUBLIC_TELEMETRY_ENVIRONMENT` / `TELEMETRY_ENVIRONMENT` | no | Low-cardinality deployment environment attached to scrubbed telemetry. |
| `NEXT_PUBLIC_TELEMETRY_RELEASE` / `TELEMETRY_RELEASE` | no | Deployment release identifier attached to scrubbed telemetry. |
| `NEXT_PUBLIC_TELEMETRY_WEB_VITALS_SAMPLE_RATE` | no | Web Vitals sampling from 0 through 1; default `0.1`. Errors are not sampled. |

### CRM Frontend

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NEXT_PUBLIC_CRM_API_BASE` | yes for CRM API calls | Protected backend CRM API base URL exposed to the CRM browser app. Default/example: `http://localhost:8080/api/crm`. |
| `NEXT_PUBLIC_MEDIA_ORIGINS` | no | Comma-separated exact HTTP(S) image origins admitted by CRM CSP; no wildcard values. |
| `SECURITY_HEADERS_CSP_MODE` | no | `enforce`/unset by default; `report-only` is staging-only. |
| `NEXT_PUBLIC_TELEMETRY_ENABLED` / `TELEMETRY_ENABLED` | no | Both flags enable the disabled-by-default first-party CRM telemetry path. |
| `NEXT_PUBLIC_TELEMETRY_ENVIRONMENT` / `TELEMETRY_ENVIRONMENT` | no | Deployment environment for bounded telemetry. |
| `NEXT_PUBLIC_TELEMETRY_RELEASE` / `TELEMETRY_RELEASE` | no | Deployment release for bounded telemetry. |
| `NEXT_PUBLIC_TELEMETRY_WEB_VITALS_SAMPLE_RATE` | no | Bounded Web Vitals sampling; default `0.1`. |

### Backend

`vympel_back/src/main/resources/application.yml` has no usable DB/JWT/S3/CORS/Redis secret defaults. The explicit `local` profile supplies synthetic local-only host fallbacks for IDE hybrid mode; `application-test.yml` owns deterministic fixtures, and `NonLocalSecurityConfigurationValidator` rejects unsafe non-local or mixed-profile startup before beans are created. Runtime environment variables have highest precedence, then `application-local.yml` fallbacks apply only when `local` is active, and no equivalent fallback exists outside local/test. Use `.env.example` files only as placeholder key inventories.

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `VYMPEL_DB_URL` | yes outside local/test | PostgreSQL JDBC URL; non-local values may not be blank, placeholders, or localhost. |
| `VYMPEL_DB_USERNAME` | yes outside local/test | PostgreSQL username; non-local values may not be blank/placeholders. |
| `VYMPEL_DB_PASSWORD` | yes outside local/test | PostgreSQL password; non-local values may not be blank/placeholders. |
| `VYMPEL_BOOTSTRAP_ADMIN_ENABLED` | no | Enables the idempotent ADMIN startup bootstrap. Default is `false` in every profile; staging/production may enable it only for one controlled initial setup, then must disable and remove/rotate the temporary secret. |
| `VYMPEL_BOOTSTRAP_ADMIN_EMAIL` | when bootstrap is enabled | Email is trimmed/lowercased and checked through the existing case-insensitive unique-email repository/index contract. |
| `VYMPEL_BOOTSTRAP_ADMIN_PASSWORD` | when bootstrap is enabled | Temporary plaintext input used only for initial BCrypt creation; it must be 16-255 characters with upper/lower/digit/symbol/variety and is never logged or stored raw. Existing admins never have their password reset. |
| `VYMPEL_BOOTSTRAP_ADMIN_NAME` | no | Optional display name stored in `users.first_name` when the account is first created; maximum 100 characters. |
| `VYMPEL_JWT_SECRET` | yes outside local/test | High-entropy JWT signing secret of at least 48 characters; must differ from the limiter HMAC secret. |
| `VYMPEL_RATE_LIMIT_HMAC_SECRET` | yes outside local/test | Independent high-entropy secret of at least 48 characters used to digest limiter identities. Rotation resets all buckets. |
| `VYMPEL_RATE_LIMIT_STORAGE` | yes outside local/test | Must be `redis` in non-local environments. Bounded `memory` is accepted only for explicit local/test operation. |
| `VYMPEL_REDIS_URL` | yes outside local/test | Distributed limiter Redis URL. Non-local defaults require `rediss://`; `redis://` needs a narrowly scoped explicit insecure-transport override. |
| `VYMPEL_TRUSTED_PROXY_CIDRS` | yes behind an ingress | Comma-separated numeric CIDRs allowed to supply `X-Forwarded-For`; all other peers' forwarding headers are ignored. |
| `VYMPEL_RATE_LIMIT_MAX_LOCAL_ENTRIES` | no | Hard cap for local/test in-memory limiter entries; default 20,000. |
| `VYMPEL_RL_*` policy values | no | Endpoint-specific capacity/window overrides for login, registration, refresh/logout, reviews, requests, analytics, quick/catalog reads, and the global write burst. Defaults are recorded in `STEP_4_SECURITY_ROLLOUT.md`. |
| `VYMPEL_JWT_ACCESS_TTL_MIN` | no | Access token lifetime in minutes; must be at least 1. |
| `VYMPEL_JWT_REFRESH_TTL_DAYS` | no | Refresh token lifetime in days; must be at least 1. |
| `VYMPEL_JWT_ISSUER` | no | Required JWT issuer claim and parser contract; local default `vympel-api`. |
| `VYMPEL_JWT_AUDIENCE` | no | Required JWT audience claim and parser contract; local default `vympel-crm`. |
| `VYMPEL_JWT_CLOCK_SKEW_SECONDS` | no | Allowed JWT time skew, validated from 0 through 120 seconds; default 30. |
| `VYMPEL_CRM_REFRESH_COOKIE_NAME` | no | CRM refresh cookie name; default `vympel_crm_refresh`. |
| `VYMPEL_CRM_REFRESH_COOKIE_PATH` | no | Refresh cookie path; keep at `/api/crm/auth` so it is not sent to unrelated APIs. |
| `VYMPEL_CRM_REFRESH_COOKIE_SECURE` | no | Base/default is `true`. The explicit Spring `local` profile in `application-local.yml` defaults it to `false` for localhost HTTP only; production must use HTTPS and must not activate `local`. |
| `VYMPEL_CRM_REFRESH_COOKIE_SAME_SITE` | no | `Lax` or `Strict`; default `Lax`. Production CRM and API must remain same-site unless the CSRF/storage model is redesigned. |
| `VYMPEL_CRM_REFRESH_CLEANUP_RETENTION_DAYS` | no | Days to retain expired/revoked refresh-session rows before cleanup; default 30. |
| `VYMPEL_CRM_REFRESH_CLEANUP_CRON` | no | Daily cleanup cron; default `0 15 3 * * *`. |
| `VYMPEL_ANALYTICS_RETENTION_DAYS` | no | Product-event retention window; default 180 days and CRM maximum period matches it. |
| `VYMPEL_ANALYTICS_CLEANUP_ENABLED` | no | Enables the scheduled, advisory-lock-protected retention job. |
| `VYMPEL_ANALYTICS_CLEANUP_DRY_RUN` | no | Counts/logs expired candidates without deleting; use for first deployment. |
| `VYMPEL_ANALYTICS_CLEANUP_CRON` | no | Schedule for retention cleanup. |
| `VYMPEL_ANALYTICS_CLEANUP_BATCH_SIZE` / `VYMPEL_ANALYTICS_CLEANUP_MAX_BATCHES` | no | Bound deletion work per transaction/job invocation. |
| `VYMPEL_S3_BUCKET` | yes outside local/test | Non-placeholder MinIO/S3 bucket name. |
| `VYMPEL_S3_REGION` | yes outside local/test | S3 region. |
| `VYMPEL_S3_ENDPOINT` | yes outside local/test | S3-compatible service endpoint; non-local localhost is rejected. |
| `VYMPEL_S3_PUBLIC_ENDPOINT` | yes | Browser-facing base URL used to generate public object links. It may differ from the internal S3 client endpoint; non-local values must be HTTPS and may not be localhost. |
| `VYMPEL_S3_ACCESS_KEY` | yes outside local/test | Non-placeholder S3 access key. |
| `VYMPEL_S3_SECRET_KEY` | yes outside local/test | Non-placeholder S3 secret key. |
| `VYMPEL_S3_PATH_STYLE` | no | Path-style S3 access flag for MinIO-compatible storage. |
| `VYMPEL_S3_API_CALL_TIMEOUT` / `VYMPEL_S3_API_ATTEMPT_TIMEOUT` | no | Bounded whole-call and per-attempt storage timeouts. Defaults: `10s` / `5s`; cleanup failures remain retryable DB state rather than hanging a worker. |
| `VYMPEL_MULTIPART_MAX_FILE_SIZE` | no | Spring multipart per-file ceiling; defaults to `10MB` to match CRM/ObjectStorageService validation. |
| `VYMPEL_MULTIPART_MAX_REQUEST_SIZE` | no | Spring multipart request ceiling; defaults to `101MB` for a batch of ten 10 MB product images plus multipart overhead. |
| `VYMPEL_CORS_ALLOWED_ORIGINS` | yes outside local/test | Comma-separated exact HTTPS browser origins. Wildcards, paths, user-info, and localhost are rejected non-locally. |
| `VYMPEL_ALLOW_LOCALHOST_SERVICES` | no | Emergency non-local exception for localhost services; defaults false and should remain false in deployment. |
| `VYMPEL_ALLOW_INSECURE_SERVICE_TRANSPORT` | no | Emergency non-local exception for non-TLS Redis/service transport; defaults false and requires protected-network justification. |
| `VYMPEL_CMS_PUBLIC_REVALIDATE_ENABLED` | yes outside local/test | Enables durable CMS page-key outbox delivery. Base/non-local default is true; the local profile enables it against the hybrid public app on localhost, while the test profile disables delivery unless a test opts in. |
| `VYMPEL_CMS_REVALIDATE_REQUIRED` | no | When true, non-local startup requires enabled revalidation plus a strong HTTPS URL/secret pair. Non-local validation rejects disabling this contract. |
| `VYMPEL_CMS_PUBLIC_REVALIDATE_URL` | yes outside local/test | Public storefront revalidation endpoint, for example `https://shop.example.com/api/revalidate`. A normal CMS mutation stores a durable job and attempts delivery after commit; 30-second tagged ISR is only the fallback. |
| `VYMPEL_CMS_REVALIDATE_SECRET` | yes when `VYMPEL_CMS_PUBLIC_REVALIDATE_URL` is set | Shared secret sent to the public storefront revalidation route; must match `CMS_REVALIDATE_SECRET`. |
| `VYMPEL_CMS_PUBLIC_REVALIDATE_TIMEOUT_MS` | no | Backend timeout in milliseconds for the public CMS cache refresh request. Local/default value: `3000`. |
| `VYMPEL_CMS_PUBLIC_REVALIDATE_MAX_ATTEMPTS` / `RETRY_BASE_DELAY` / `RETRY_MAX_DELAY` | no | Bounded revalidation retry policy. Defaults: 8 attempts, `5s` base, `5m` maximum. |
| `VYMPEL_CMS_PUBLIC_REVALIDATE_RETRY_POLL_MS` / `RETRY_BATCH_SIZE` / `STALE_CLAIM_TIMEOUT` | no | Durable worker polling, bounded claim batch, and crashed-claim recovery. Defaults: 5000 ms, 20, and `2m`. |
| `VYMPEL_PROMETHEUS_ENABLED` | no | Enables the internal Micrometer Prometheus exporter; default true. The endpoint must remain reachable only from the application/monitoring network. |
| `VYMPEL_CMS_MEDIA_CLEANUP_GRACE_PERIOD` | no | Minimum unattached/detached age before an OBJECT_STORAGE row may be claimed. Default: `24h`. |
| `VYMPEL_CMS_MEDIA_CLEANUP_ENABLED` / `VYMPEL_CMS_MEDIA_CLEANUP_CRON` | no | Enables the shared safe cleanup service on a schedule; local/test disable scheduling. Base cron is daily at 03:30. |
| `VYMPEL_CMS_MEDIA_CLEANUP_BATCH_SIZE` / `MAX_BATCH_SIZE` | no | Scheduled and absolute per-run bounds. Defaults: 25 / 100. |
| `VYMPEL_CMS_MEDIA_CLEANUP_RETRY_BASE_DELAY` / `RETRY_MAX_DELAY` / `STALE_CLAIM_TIMEOUT` | no | Storage-failure backoff and crashed pending-claim recovery. Defaults: `5m`, `6h`, `15m`. |
| `VYMPEL_RECOMMENDATION_PRICE_BAND_PERCENT` | no | Percentage used by recommendation stage 3 for same-category price-band matches. Default: `25`. Values are defensively clamped to 0-100. |
| `VYMPEL_RECOMMENDATION_QUERY_TIMEOUT_MS` | no | Per-query timeout for each recommendation native query. Default: `1500` ms; failures are logged and return an empty recommendation list. |
| `VYMPEL_SLOW_OPERATION_THRESHOLD_MS` | no | Bounded catalog/facet and recommendation slow-log threshold. Default: `500` ms. Metrics are recorded for every call; logs use normalized low-cardinality context only. |
| `SERVER_PORT` | no | Backend HTTP port. Local fallback: `8080`. |
| `APP_LOG_DIR` | no | Writable server directory for `application.log`, `error.log`, `security.log`, `crm-actions.log`, and compressed archives. Default: `logs`; recommended server path: `/var/log/vympel`; recommended container path: `/app/logs`. |
| `APP_LOG_LEVEL` | no | Root Logback level. Default: `INFO`; use `DEBUG` only for bounded development diagnostics and avoid `TRACE` in production. |
| `APP_LOG_MAX_FILE_SIZE` | no | Maximum archive segment size before size-based rollover. Default: `50MB`. |
| `APP_LOG_RETENTION_DAYS` | no | Maximum rolling-history age for each log family. Default: `30`. |
| `APP_LOG_TOTAL_SIZE_CAP` | no | Archive cap per log family. Default: `256MB`, keeping the four default families near a 1 GB aggregate archive ceiling. |
| `VYMPEL_JPA_SHOW_SQL` | no | Enables Hibernate SQL output only for explicit local diagnostics. Default: `false`. |
| `VYMPEL_JPA_FORMAT_SQL` | no | Formats Hibernate SQL only when SQL diagnostics are explicitly enabled. Default: `false`. |

### Shared / Deployment

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `REGISTRY` | staging/production | Registry namespace only; Compose appends the exact `vympel-backend`, `vympel-storefront`, and `vympel-crm` image names. |
| `RELEASE_TAG` | staging/production | Full lowercase 40-character Git commit SHA; all three application images use the same immutable tag. |
| `STOREFRONT_DOMAIN` / `CRM_DOMAIN` / `API_DOMAIN` | staging/production | Final ingress domains supplied externally; examples use `.example.invalid`. |
| `TLS_CERT_DIR` | staging/production | Absolute host directory containing readable `fullchain.pem` and `privkey.pem`; key material is ignored and never committed. |
| `*_HEALTH_URL` | staging/production | External HTTPS URLs used by bounded health and smoke scripts after internal container health passes. |
| Backend log persistence | deployment-owned | Deployment Compose sets `APP_LOG_DIR=/app/logs` on a bounded writable tmpfs and relies on stdout/stderr aggregation. A provider may replace that with a protected persistent log volume, but source mounts and committed log credentials are forbidden. |

## Database & Migrations

* Database: PostgreSQL.
* Migration tool: Liquibase.
* Schema location: `vympel_back/src/main/resources/db/changelog`.
* Migration command: Run the Spring Boot app with Liquibase enabled, or use Gradle/Spring tooling if later configured.
* Seed command: Seeds are included in the Liquibase master changelog and run with migrations.
* Review migration: `2026-06-28-01-product-reviews.xml` creates `product_review`, rating/status/author constraints, product/user/moderator foreign keys, and product/status/created/product-status indexes.
* CMS content migration: `2026-06-30-01-cms-content-system.xml` creates `cms_page`, `cms_media`, `cms_block`, and `cms_block_translation`, then seeds `home` and `about` pages with published blocks for the home hero slider, home new-goods banner, About hero banner, About intro, and About cooperation banner.
* Product draft/CMS variant migrations: `2026-07-01-01-product-drafts-cms-media-variants.xml` makes wristwatch/interior characteristic columns nullable so optional partial detail groups can be stored, and adds `cms_block.media_kz_id`, `media_en_id`, and `mobile_media_id` foreign keys to existing `cms_media`. `2026-07-08-01-cms-mobile-locale-media.xml` adds `mobile_media_kz_id` and `mobile_media_en_id` so CMS image blocks have RU/KZ/EN mobile variants.
* CMS lifecycle/revalidation migration: `2026-07-17-01-cms-media-lifecycle-revalidation.xml` defines the reusable-media ownership model, normalizes all six `cms_block` media foreign keys to `ON DELETE SET NULL`, adds lifecycle/grace/retry/protection metadata and reference/cleanup indexes, and creates the page-key-deduplicated `cms_revalidation_job` outbox with due-job indexes. Rollback blocks remove the new table/columns/indexes and restore the legacy default-media FK behavior.
* Step 7 integrity migration: `2026-07-17-02-database-hardening.xml` first restores About orders 10/20/30 and demotes only the exact audited image-less ACTIVE product, then adds nonnegative price/stock/media/CMS-order checks, unique product media positions, main-image-at-position-zero enforcement, and unique per-page CMS sort order. Dirty-data and six-slot FK-action preconditions HALT on unknown state; schema rollback is explicit and data recovery is audit-driven forward recovery.
* Customer request migration: `2026-07-10-01-customer-requests.xml` creates `customer_request` with nullable contact/message/source/admin comment fields, required status, created/updated timestamps, optional processed timestamp/user FK, status/contact check constraints, and indexes for status, created time, source, and processed time.
* CRM refresh migrations: `2026-07-16-01-crm-refresh-sessions.xml` creates `refresh_token_session` with user/family/expiry/revocation/replacement state, a unique SHA-256 jti hash, cascading user cleanup, and lookup/cleanup indexes. `2026-07-16-02-crm-refresh-token-hash-type.xml` safely aligns `token_hash` with the Hibernate/PostgreSQL `VARCHAR(64)` mapping and has a `CHAR(64)` rollback.
* CRM refresh migration rollback/recovery: Roll back `2026-07-16-02` before `2026-07-16-01`; the latter drops the session table and therefore intentionally signs every CRM user out. PostgreSQL Liquibase DDL is transactional for these changes. If deployment fails after migration but before application readiness, prefer fixing/rolling forward; if rollback is required, stop refresh traffic, revoke/expire the refresh cookie at the edge/application, roll back in reverse order, and require reauthentication. Hibernate `ddl-auto=validate` prevents the new application from serving against an incomplete schema.
* Product image main migration: `2026-07-03-01-product-image-main.xml` adds non-null `media.is_main`, backfills the first ordered image per product as main, and creates a PostgreSQL partial unique index enforcing at most one main image per product.
* Audit hardening/performance migration: `2026-06-30-02-audit-security-performance.xml` adds indexes for active/in-stock product listing, product media ordering, product review moderation/public reads, and product analytics aggregation.
* Important tables/entities: `users`, `role`, `user_role`, `refresh_token_session`, `country`, `brand`, `brand_country`, `collection`, `collection_i18n`, `material`, `watch_mechanism`, `gender`, `glass_type`, `stone_inlay`, `category`, `product`, `customer_request`, `product_review`, `product_i18n`, `product_category`, `media`, `media_i18n`, `watch_details`, `interior_feature`, `interior_feature_i18n`, `interior_clock_details`, `watch_feature`, `watch_details_feature`, `product_description`, `product_description_i18n`, legacy `cms_banner`, `cms_banner_i18n`, `cms_banner_media`, `cms_config`, new `cms_page`, `cms_media`, `cms_block`, `cms_block_translation`, `cms_revalidation_job`, `crm_activity`, `product_analytics_event`.
* Review lifecycle: `PENDING -> APPROVED` publishes and contributes to rating; `PENDING/APPROVED -> REJECTED` hides; delete is a terminal soft-delete to `DELETED`. Only `APPROVED` rows appear publicly or contribute to aggregates.
* Customer request lifecycle: public submissions always persist to `customer_request` as `NEW`; CRM can move them through `IN_PROGRESS`, `DONE`, or `CANCELLED`. `DONE`/`CANCELLED` set `processed_at` and `processed_by`; returning to `NEW` clears processing metadata. Public responses expose only id/status.
* CRM migration: `2026-06-18-01-crm-system.xml` adds product `stock_quantity`, nullable `kaspi_url`, nullable `wildberries_url`, `MANAGER` role seed, `crm_activity` table, and indexes for stock, marketplace links, event type, entity, actor, and created time.
* CRM collection migration: `2026-06-18-02-collection-i18n.xml` adds `collection_i18n` with `collection_id`, DB `lang` values `ru/en/kk`, required localized `name`, required localized `description`, FK cascade to `collection`, and backfills old collections into all three languages from legacy `collection.name`/`code`.
* CRM user-management schema: no new migration was needed; it reuses existing `users.enabled`, `role`, and `user_role` tables.
* Catalog filters/search migration: `2026-06-19-01-catalog-filters-and-search.xml` upserts wristwatch child categories (`WATCH_CLASSIC`, `WATCH_SPORT`, `WATCH_DIVER`, `WATCH_CHRONOGRAPH`), `ACCESSORIES`, normalized category translations, interior-clock feature/detail tables, seed values, indexes, `pg_trgm`, and trigram expression indexes for product/name/brand/collection search.
* Catalog watch-detail normalization migration: `2026-06-19-02-normalize-watch-detail-categories.xml` moves legacy products that have `watch_details` but no `interior_clock_details` out of interior-clock category links and into `WATCH_WRIST`.
* Product analytics/promotion migration: `2026-06-20-01-product-analytics-promotion.xml` adds product `promotion_mode`, `promotion_score`, `promoted_until`, `promotion_updated_at`, check/index support for promotion mode/score, and `product_analytics_event` with product FK, safe event type check, optional session/user/metadata/IP/user-agent fields, created time, and event/product/created indexes.
* Product price/stock source of truth: `product.price` and `product.stock_quantity` are the canonical persisted fields. CRM list/detail DTOs and quick update endpoints must read/write those fields directly; do not introduce a separate price/stock table or frontend fallback value.
* Product image source of truth: `media.url` stores the object key, `media.position` is unique per product/type and contiguous zero-based for application-managed IMAGE rows, and `media.is_main` identifies the one position-zero card/search image. ACTIVE requires that canonical main image; DRAFT/ARCHIVED may be image-less. `ProductImageResponse` exposes only safe id/public-url/alt/order/main fields.
* Product multilingual descriptions: `product_description` owns the parent row and `product_description_i18n.content_md` is the source of truth for long localized copy with DB languages `ru`, `en`, and `kk`. `ProductDescriptionMapper` leaves the legacy 255-character `title` and `short_text` fields null. Descriptions are optional; missing EN/KZ values fall back to RU and a fully absent description creates safe empty content rows.
* Catalog filter source mapping: product base filters come from `product` with source `product`; wristwatch characteristic filter metadata is generated from distinct values actually present in `watch_details` with source `watch_details`; wristwatch filtering/counting uses `watch_details.product_id` only when a selected wristwatch detail filter has parsed values; interior-clock characteristic metadata/filtering comes from actual `interior_clock_details` rows with source `interior_clock_details`; the single public `country` filter has source `brand_country` and comes through `product.brand_id -> brand_country.country_id`. There is no direct product country field for brand country, and removed country aliases are ignored.
* CMS content tables: `cms_page.page_key` identifies editable public pages; `cms_block.block_key` identifies editable regions; `cms_block.media_id` is default/RU desktop, `media_kz_id` and `media_en_id` are desktop KZ/EN, `mobile_media_id` is default/RU mobile, and `mobile_media_kz_id` / `mobile_media_en_id` are mobile KZ/EN. All six are reusable nullable foreign keys to `cms_media` with `ON DELETE SET NULL`, but application cleanup still refuses deletion while any slot references the row. `cms_block_translation.lang` stores `ru`, `en`, or DB `kk` with unique constraint `uk_cms_block_translation_block_lang`. `cms_media.storage_type` distinguishes seeded `PUBLIC_PATH` assets from uploaded `OBJECT_STORAGE`; lifecycle status is `ACTIVE`, `DELETE_PENDING`, or `DELETE_FAILED`, with explicit protection/orphan/delete-attempt timestamps and retry metadata. `cms_revalidation_job` is a durable one-row-per-page-key outbox with `PENDING`, `PROCESSING`, `RETRY`, `SUCCEEDED`, or `FAILED_PERMANENT` state. Public reads return only `ACTIVE` pages and `PUBLISHED` blocks and preserve the existing locale/device/static fallback chain.

## Authentication & Authorization

* Auth method: Email/password auth returns a short-lived JWT access token. CRM additionally receives a rotating JWT refresh token only through a backend-set HttpOnly cookie and maintains server-side refresh-session state.
* Token/session storage: CRM access token is stored in `sessionStorage`; the refresh token is host-only, HttpOnly, path-scoped to `/api/crm/auth`, `SameSite=Lax`, and `Secure=true` in production. The database stores only SHA-256 hashes of refresh jti values, never raw access or refresh tokens.
* Frontend auth flow: Public storefront has no auth UI. CRM login saves access JSON and accepts the refresh cookie; login bootstraps from the cookie without flashing the form; one shared refresh request handles simultaneous 401s and retries each original request once. A 403 preserves the session and shows localized feedback. Logout clears local state only after server revocation succeeds.
* Public customer requests: `POST /api/public/requests` is intentionally unauthenticated, validates contact fields server-side, and stores only a safe id/status response for the browser.
* Guest reviews: Public review POST does not require a login. Missing authentication stores `author_type=GUEST`; the public UI renders the localized guest label (`Гость` in RU) without exposing technical/private guest data. A valid JWT attaches the review to the user and snapshots a safe display name when available.
* Backend auth middleware: `JwtAuthFilter` is inserted before `UsernamePasswordAuthenticationFilter`; it accepts access-type tokens only, requires issuer/audience/jti/iat/exp, rejects missing/disabled users, and reloads current roles from the database so access-token role claims cannot keep stale privileges.
* Roles/permissions: `/api/public/**`, `/api/auth/**`, and `/api/crm/auth/login|refresh|logout` are public at the filter-chain level; refresh/logout still require trusted browser origin validation. `/api/customer/**` requires `CUSTOMER` or `ADMIN`; `/api/admin/**` requires `ADMIN`; `/api/crm/users`, `/api/crm/users/**`, `/api/crm/cms`, and `/api/crm/cms/**` require `ADMIN`; `/api/crm/requests/**` and other non-admin CRM routes require `ADMIN` or `MANAGER`; all other requests require authentication.
* User access status: `users.enabled=false` blocks login and existing access JWTs. Role changes and user disable operations revoke every active refresh session; refresh also checks current enabled/role state. Admin user-management prevents removing or disabling the last active admin.
* ADMIN bootstrap: `users` has no separate `UserStatus` enum; a newly bootstrapped account is ACTIVE by setting `users.enabled=true`. The runner is disabled by default in every profile. Local may opt in; staging/production may enable it only for controlled first setup before disabling/removing the temporary secret. It loads the Liquibase-seeded active ADMIN role, never seeds a password through Liquibase, never promotes a non-admin collision, and never resets an existing admin password.
* Password-change policy: No password-change mutation exists in the current application. Any future password-change/reset implementation must call `CrmSessionService.revokeAllForUser` after the password hash is committed so existing refresh sessions cannot survive a credential reset.
* CORS/CSRF model: Reads exact comma-separated origins from `VYMPEL_CORS_ALLOWED_ORIGINS`; empty/wildcard credentialed allowlists fail startup. Local fallback allows same-site `http://localhost:3000` and `http://localhost:3001`. Because refresh/logout are cookie-authenticated while Spring CSRF is disabled, `TrustedOriginValidator` additionally requires an exact allowed `Origin` or `Referer`. Production CRM and API must stay same-site, use HTTPS/Secure cookies, and never activate the `local` profile.
* Request/user log context: The correlation filter runs before request handling, exposes `X-Request-Id` through CORS, and stores `requestId`, `httpMethod`, and `requestPath` in MDC. A valid access JWT adds `userId` and comma-separated `roles`; tokens, authorization headers, passwords, and raw bodies are not logged.

## Design System & Figma Implementation

* Figma/source design: Product page reference from Figma file `NYEDvcrVfAG8WgPxP6df2O`, node `175:9781`; request dialog styling follows node `263:4193`; catalog/filter/card reference uses node `175:12791`; favorites page task reference uses node `175:15668`; final desktop/mobile CMS polish referenced nodes `287:4140`, `289:4301`, and `289:4498` (only `287:4140` could be inspected before Figma MCP rate limiting, so remaining polish followed the task brief text); About Us page reference uses node `263:3266`; public info-page task references nodes `289:4727`, `291:4917`, and `291:5078` (Figma MCP access was rate-limited during implementation, so the task brief measurements were the source of truth for info pages; the About Us implementation used available Figma metadata plus local assets).
* Design tokens: CSS variables and Tailwind theme aliases live in `vympel_front/src/app/globals.css`; reusable typography/color/spacing/motion values must be added there before component use. Public info pages use `--spacing-info-*` tokens/classes for title-to-body gap, paragraph spacing, warranty badge padding/gap, and store image/contact spacing; the shared Footer owns their final 120/96/64px gap. About page static sections use `.about-*` classes and `--spacing-about-*` / `--text-about-number` / `--color-about-*` tokens for the 120px section rhythm, 20px two-column/card gaps, numbered company cards, Instagram card sizing, Instagram icon badge, and responsive stacked layouts. Catalog layout uses `.public-breadcrumb`, `.catalog-page-banner-image`, `.catalog-toolbar-shell`, `.catalog-toolbar-panel-wide`, `--spacing-catalog-hero-min-height` (605px), mobile sort-row styling, and the 1024px three-column `.responsive-product-grid` rule. The hero uses a 460px-to-605px clamp at 1024-1439px and a 605px minimum from 1440px. Smart search uses `--spacing-search-overlay-*` tokens for active desktop width, smaller inactive widths, submit size, attached-panel content height, mobile safe inset, and compact product thumbnails. `--spacing-search-overlay-home-active-width` caps desktop home search at 66%/760px; catalog/product share `--spacing-search-overlay-catalog-active-width`, `--spacing-search-overlay-catalog-inactive-width`, `--spacing-search-overlay-catalog-top-offset` (19px), `--spacing-search-overlay-catalog-right-offset` (38px), and `--spacing-catalog-toolbar-min-height` (67px). `.home-search-root`/`.home-search-frame` and `.toolbar-search-root`/`.toolbar-search-frame` separate stable host ownership from animated visible geometry; the catalog toolbar shell owns search positioning from 768px and dropdown positioning. `DropdownSelect` uses `--color-dropdown-surface`, `--color-dropdown-surface-hover`, `--shadow-dropdown-trigger`, and `--shadow-dropdown-panel` for language-selector-inspired translucent public select surfaces. Mobile bottom nav uses `--spacing-mobile-bottom-nav-height` plus safe-area padding and is translated out while the catalog overlay provider reports a modal surface. Motion tokens are `--duration-vympel-fast`, `--duration-vympel-base`, `--duration-vympel-slow`, `--ease-vympel`, and utility classes `transition-vympel`, `transition-vympel-fast`, and `transition-vympel-slow`; catalog hover labels use `.catalog-hover-label` / `.catalog-hover-trigger` for underline-only hover motion.
* CRM design tokens: Separate CRM tokens live in `vympel_crm/src/app/globals.css` as `--crm-*` variables for background/surface/sidebar/text/border/action/status colors, font sizes, spacing, radius, shadow, sidebar width, header height, notification placement, product photo thumbnail sizing, and CMS editor/preview layout classes (`.cms-*`). CRM form success/error states and inline form sections should use these tokens.
* Fonts: Inter for sans, Judson for mono-like variable, Montaga for headings, Montserrat for footer.
* Colors: Neutral black/white/gray palette plus red, green, and product-specific action tokens; semantic Tailwind aliases include `primary-bg`, `text-primary`, `text-heading-primary`, `text-product-muted`, `text-product-secondary`, `button-bg-product`, `product-certificate`, `product-warranty`, `border-default`, `surface-card`.
* Spacing scale: Mostly Tailwind utility classes and named globals tokens. Catalog filters use `--spacing-catalog-filter-*`; favorites uses `--spacing-favorites-section-gap: 120px`; product details tabs use `--spacing-product-tabs-gap` as the minimum five-tab gap with desktop distribution, `--spacing-product-tab-underline-gap`, `--spacing-product-spec-row`, `--spacing-product-details-links-offset`, `--spacing-product-description-link-gap: 50px`, and `--spacing-product-review-sticky-top`; brand pages use `--spacing-brand-*`, `--leading-brand-copy`, and `--container-brand-description`; older layout utilities still include values such as `px-[5.3vw]`, `xl:px-17`, `max-w-360`.
* Components: Public shared text/heading/button/card/banner/carousel/pagination/state components under `src/components/ui/shared`; `DropdownSelect` lives in `src/components/ui/shared/DropdownSelect` for polished public listbox-style selects; layout header/footer/navigation under `src/components/ui/layout`; public static info-page blocks under `src/components/InfoPages`; About-specific Instagram carousel under `src/components/AboutPage/InstagramSlider`; VYMPEL-styled shadcn Tooltip lives at `src/components/ui/tooltip.tsx` and is provided from the localized root layout; VYMPEL-styled shadcn Dialog lives at `src/components/ui/dialog.tsx` and should be used for ordinary public form dialogs so outside click, Escape, and close icon behavior stay consistent; VYMPEL-styled shadcn AlertDialog lives at `src/components/ui/alert-dialog.tsx` and includes a localized close-icon affordance for destructive confirmations. `GoodCard` renders localized unavailable badges, stock/cart/favorite state, and a compact rating/no-rating line; `RatingStars` provides the shared restrained five-star display. CRM has local `Text`, `Heading`, `Button`, `Field`, and `ConfirmDialog` primitives in `vympel_crm/src/shared/ui`; `Button` provides a tokenized loading spinner. User-facing text should render through localized keys and typography primitives unless semantic HTML requires a raw tag.
* Responsive breakpoints: Tailwind breakpoints are used directly (`sm`, `lg`, `xl`) with global responsive tokens in `globals.css`: mobile is 0-639px, tablet behavior is 640-1023px, small desktop is 1024-1279px, and desktop is 1280px+. The catalog toolbar deliberately keeps its compact layout through 1439px because the measured full accessories row still collides at 1280px; its full inline controls/search start at 1440px. Catalog sort switches from icon-only to its short label at 390px, while catalog hero composition has an explicit 1024-1439px fluid range and 1440px large-desktop minimum. The public storefront uses `.responsive-page-x`, `.responsive-section-gap`, `.responsive-product-grid`, `.responsive-home-banner-*`, `.responsive-page-banner-image`, `.goods-carousel-*`, `.mobile-bottom-nav-item`, `.product-card-*`, and `.vympel-toast-*` to keep gutters, section rhythm, tall mobile hero banners, product rails, bottom nav safe area, product grids, large banners, card text/badges, and toast actions stable down to 320px. Responsive QA must include the collision band around 900/1000/1024/1100/1280px as well as 1440, 768, 480, 430, 414, 390, 375, 360, and 320px.
* Asset locations: Static images are in `vympel_front/public`; icons are React components in `vympel_front/src/assets/icons`. The CMS seed stores existing public assets as `PUBLIC_PATH` media rows for `/Romanson_banner.png`, `/newsBanner.png`, `/about-us-banner.png`, `/contact_banner.png`, `/catalog-hero-banner.png`, `/contact-banner-catalog.png`, `/product-hero-banner.png`, `/product-banner.jpg`, and the public brand banner assets; newly uploaded CMS images use MinIO/S3 object keys and public links, and public rendering appends timestamp-based query params so replaced CMS media does not reuse stale browser/CDN entries. The About page uses `about-us-banner.png` as a full-width 2560x884 responsive banner and `insta-1.png` through `insta-4.png` for the Instagram slider; marketplace logos remain the existing `kaspi.png`, `wb.png`, and `ozon.png`. The product/About contact banner uses `vympel_front/public/contact_banner.png`; catalog contact fallback uses `contact-banner-catalog.png`. Delivery/Payment public info pages reuse `vympel_front/public/shop.png` through `StoreLocationBlock`, rendered at a 659/470 responsive aspect ratio. Brand pages map banner assets in `src/config/brandPages.ts`: `Romanson_brand_banner.png`/`Romanson_catalog_banner.jpg`, `Adriatica_brand_banner.jpg`/`Adriatica_catalog_banner.jpg`, `Appella_brand_banner.jpg`/`Appella_catalog_banner.jpg`, `PIERRE_RICAUD_brand_banner.jpg`/`Pierre_ricaud_catalog_banner.jpg`, `Rhythm_brand_banner.jpg` with brand-banner fallback for the missing catalog banner, and `Royal_london_brand_banner.png` with brand-banner fallback for the missing catalog banner.
* Product payment assets: `vympel_front/public/kaspiIcon.png` and `halykIcon.png` are complete 148x148 branded tiles, including their intended backgrounds and rounded artwork. `ProductSummary` renders them with `next/image` and `object-contain` inside the unchanged responsive wrappers; do not add duplicate red/green tile backgrounds.
* Known design constraints: Product page should keep the Figma/task proportions: CMS-first hero/state/contact banners with local fallback images, rounded white control panel with localized search only, thumbnail column with 181x181 desktop preview cards, 475x502 desktop main image, large clickable product image with localized zoom dialog, right-hand product summary, horizontal info tabs, specs in a right column, related products, and a localized contact banner using `/contact_banner.png` fallback. Product characteristic labels and values should stay in one line/row when possible (`Label: value`) and wrap as one visual row only when text is long. The home hero uses a tall mobile frame with a contained foreground banner over a soft background layer so baked-in banner text/product composition is not destroyed by cover-cropping; desktop preserves the wide banner frame. Home product rails use a controlled `.goods-carousel-banner` layer only at desktop widths where it remains intentional; tablet/mobile hide the banner so it never becomes a random strip behind cards, desktop overlap is handled through `.goods-carousel-track`, and arrows belong outside the card lane or are hidden on phones. Mobile primary navigation uses `MobileBottomNavigation` for Home/Categories/Cart/Favorites/Profile; the Categories item and the catalog toolbar category trigger open the same mobile-only backend category tree flow with an `All products` action at root and parent levels, meaningful category-type icons, and active category states. The fixed bottom navigation must be fully hidden while category/filter/sort/catalog-search overlays are open and during their close animation. The About page should keep the Figma/page structure: navigation, full-width 2560x884 `/about-us-banner.png` image, 68px desktop content gutters, two 562px intro columns, four 562x331-ish company cards in a 2x2 grid with 01-04 fixed-size number badges that cannot push text outside the card on mobile, an Embla/CarouselDots Instagram slider with four 271px-wide cards from `/insta-*.png`, shared cooperation `ContactBanner`, existing `MarketPlaces`, and footer. The CRM product form must show watch characteristic select labels in Russian display text while submitting the unchanged backend IDs/codes; collection creation is inline in the product form and must show localized loading/success/error states. The current five-tab product details layout requires Inter tab labels at 22/400/100%, active underline `--color-product-tab-underline` at 4px width matching the active text, 50px text-to-underline distance, responsive minimum tab gaps via `--spacing-product-tabs-gap` plus desktop distribution, specs at 20px with label weight 500/value weight 300, 22px spec row gaps, 130px desktop bottom-link offset, 50px desktop gap between description bottom links, and smaller mobile description link offset. Warranty/delivery/payment tab info blocks use 20px/300 body text, 20px/500 headings or rich highlights, 30px paragraph/block gaps, and a project arrow link to the detailed page. The connect banner task requires `--spacing-connect-banner-*` tokens for 122/50/38/44/63/30/10/15/52px spacing, desktop heading 60/500/100% in white, button text 20/400/100% in `#3D3D3D`, button background white, side text 18/500/100% in `#E4E4E4`, and responsive mobile wrapping without clipping. Brand pages use Inter breadcrumbs at 20/300, uppercase centered 64px brand titles on desktop, 18px/33px centered descriptions, CMS-first responsive brand banners, 24px history headings, 18px/33px history text, 20/500 catalog links with arrow, Judson 34px `Новинки`, and `brand-product-grid`; brand breadcrumbs must remain one line with internal horizontal scroll, and on mobile brand titles must use `.brand-page-title` to fit inside the viewport while brand banners remain full-width/tall instead of contained thumbnail strips. Public info pages use Judson 40px page titles, 40px title-to-body gap, Inter 20/300 body text with 30px paragraph spacing and 500 highlights, 60px/72px warranty badge spacing, fixed-size warranty icon circles, and a shared Delivery/Payment store block with 659x470 desktop image, 50px image/contact gap, 12px icon/text gap, stacked mobile layout, and reduced mobile footer gap.
* Product reviews tab constraints: Product detail tabs now have five localized tabs including reviews. Treat `--spacing-product-tabs-gap` as the minimum responsive gap for the five-tab row and use desktop `justify-between` to distribute available width; do not restore the older four-tab-only 225px spacing. The active underline must remain a 4px shrink-wrapped line on the shared bottom divider with `--spacing-product-tab-underline-gap` preserving the 50px label-to-underline distance. `ProductReviews` belongs only inside the Reviews tab. The public list is backend-driven, approved-only, paginated at 15 per page, and controlled by localized sort/rating/text filters through `DropdownSelect`; filters reset the review page to 1. Keep the summary/form block sticky on desktop via `--spacing-product-review-sticky-top`; sticky only works when the review grid stays `overflow-visible`, uses `lg:items-start`, and the aside has `lg:self-start`. Keep mobile/tablet stacked and static to avoid overlap and horizontal overflow.
* Public request dialog constraints: The `CustomerRequestDialog` follows the Figma node `263:4193` direction: centered white content, 20px radius, desktop max width near 475px, 50px horizontal and 40px vertical padding, 24px/500 black title with 43px bottom gap, 16px/400 labels with 12px label gap, fully rounded 50px-ish inputs with `#D2D2D2` border and black focus border, and a full-width `#525252` submit button. Mobile reduces padding and fits within the viewport. Ordinary public dialogs should use the Radix/shadcn Dialog wrapper so outside click and Escape close them; global `html { scrollbar-gutter: stable; }` prevents left/right page shift when scroll lock toggles.
* Product review rating distribution follow-up: The current public rating summary contract exposes approved-only average/count, but not per-star buckets. Add a backend summary DTO/repository projection before rendering 5/4/3/2/1 distribution bars; do not fake bucket counts from the current page of reviews.
* Catalog filter design constraints: Desktop category, filter, and sort surfaces are absolutely anchored to the bottom of `.catalog-toolbar-shell`, align with the white card's left/right edges, and span its full width through `.catalog-toolbar-panel-wide`; they must not anchor to individual triggers or the inner controls row. Filter labels have a readable fixed sidebar separated from the value area; left groups/right options scroll independently. Mobile category/filter/sort/search use one coordinated primary toolbar row and at most one active overlay. The filter sheet keeps category tabs visible, scrolls only its option body, and keeps Apply/Reset above the safe-area inset; sort uses native radio semantics. Pagination stays one row, and hover uses `.catalog-hover-label` without layout shifts.
* Catalog category selector design constraints: The desktop trigger sits to the left of Filters, uses the same 22px trigger text/color/gap pattern, fetches backend category hierarchy, shows root categories first, reveals child categories next to the hovered/focused root, highlights the active category, uses a short hover-intent delay plus subtle submenu opacity/translate animation to avoid flicker, closes on outside click, and rewrites `/catalog?categoryCode=&page=1` while clearing previous filter/price/page params. Mobile category browsing is one dedicated full-screen flow that can be opened from either the catalog toolbar or bottom navigation; parent categories with children drill deeper, and each level includes `All products` for the current parent listing.
* Smart search design constraints: The input/panel remain one connected surface with tokenized transitions and reduced-motion support. Home and product search use stable host-owned absolute roots; desktop catalog search uses the white `.catalog-toolbar-shell` card as its containing block. Only `.home-search-frame` or `.toolbar-search-frame` changes horizontal position and width, so opening cannot shrink or resize Navigation or hero toolbars. Desktop home search moves from the right to a centered 66%/760px maximum. Catalog and product use the same right-to-center animation and a 70%/760px active maximum; catalog uses exact 19px top and 38px inactive right offsets while its inner toolbar reserves 67px. Active roots mask sibling controls while the result panel stays directly attached to the centered frame. Tablet/mobile catalog and product search use the same icon-only inactive trigger, remain absolute inside the toolbar safe inset, and may use the safe available width after activation. Mobile catalog search must participate in `CatalogOverlayProvider`, hide bottom navigation, close competing catalog overlays, and return focus to its trigger. Results are product-only and missing media uses `ProductImageFallback`.
* Public animation constraints: Use `transition-vympel*` utilities for dropdown/search/filter/category motion before adding one-off Tailwind duration/easing classes. Site motion should be subtle, limited to interactive state changes, and covered by the global `prefers-reduced-motion` override.
* Favorites/cart/empty/error design constraints: `/favorites` shows `Избранное`, existing `GoodCard` cards for stored favorite snapshots in `.brand-product-grid.favorites-product-grid` so products start at the content area's left edge, exactly 120px vertical spacing before `Похожие товары`, and similar products through the existing `SectionWithTitle` + `GoodsCarouselWithImage`/`GoodCard` section pattern. Catalog/favorites/cart/product/404 friendly states use shared `EmptyState`/`ErrorState`, `--color-state-*`, `--spacing-state-*`, `--shadow-state`, and localized `states.*` messages. Public toast styling uses `--color-toast-*`, `--text-toast-action`, `--spacing-toast-*`, `--shadow-toast`, and `.vympel-toast-*`; mobile toast text may wrap naturally, action buttons should be smaller rounded pills, and the surface must not look like a red debug/issues badge unless it is a real error toast. Cart plus controls disable at the stock ceiling, wrap the disabled button in shadcn Tooltip for the stock-limit explanation, show a subtle localized inline stock message under the item, and keep the checkout summary as a rounded project-card surface instead of a square desktop carryover.
* CRM category-specific product specs: New products must select a category before the full form renders. Wristwatch categories show optional `watchDetails`; `WATCH_CLASSIC`, `WATCH_SPORT`, `WATCH_DIVER`, and `WATCH_CHRONOGRAPH` inherit wristwatch behavior. Interior-clock categories show optional `interiorClockDetails`. Partial detail rows are allowed for drafts, while detail objects remain forbidden on mismatched category profiles. Accessories/base categories show no watch-only fields. Existing edit locks category to avoid cross-profile changes.
* CRM CMS block schema: `cmsBlockSchemas` in CRM and `CmsBlockSchema` in backend must stay capability-aligned. Image-only block types never render or persist title/subtitle/description/button fields; text-only types never render or persist media; link/settings/JSON fields are similarly type-gated. Every editable type still has an adaptive preview.
* CMS image variants: Default/RU desktop media is the only required image when an image-required type is saved. Desktop KZ/EN and mobile RU/KZ/EN media are optional `cms_block` foreign keys that reuse the existing CMS upload endpoint/storage; they are not extra translation rows and must not create duplicate `cms_block_translation` entries. Public image URLs are versioned with media `createdAt` or block `updatedAt`. On mobile the effective fallback order is current-locale mobile, current-locale desktop, default/RU mobile, default/RU desktop, then static fallback.

## Testing Strategy

* Frontend tests: Public Vitest covers recommendation behavior, one-request/in-flight-deduplicated batch summary, batch snapshot/unavailable merging, 429 parsing, and CMS revalidation signature/payload/target mapping; CRM Vitest covers auth/session behavior plus explicit CMS partial-success feedback. Both apps require lint and production builds; public additionally runs typecheck and the isolated production status/content matrix.
* Backend tests: The Java 17 suite covers the Step 4/5/6 baseline plus Step 7 product activation/final-image rules, collision-free media/CMS reordering, stable constraint error codes, fresh-chain constraints, direct invalid SQL, concurrent stock/media/CMS writes, and ADMIN bootstrap validation/creation/idempotency/collision/log-safety behavior.
* Integration tests: `CmsMediaDryRunIntegrationTest` is a read-only configured-PostgreSQL reconciliation check; on 2026-07-17 it observed 24 media rows and 5 eligible zero-reference candidates without changing the row count. `RefreshSessionMigrationTest` rehearses the fresh PostgreSQL 16 chain, all six CMS reference slots, Step 7 constraints, invalid writes, and concurrency. Environment-gated `Step7ExternalDatabaseRehearsalTest` finite-migrates a restored/current external database and verifies constraints/data plus direct rejection without becoming a normal live dependency.
* E2E tests: No browser E2E suite; the CRM auth lifecycle is covered across a real Spring HTTP boundary plus CRM client unit tests.
* Test data/mocking: Liquibase seed data exists for database bootstrap. Recommendation service tests use Mockito projections; frontend recommendation render tests mock only shared title/carousel shells and exercise the real omission/loader logic.
* Full-system audit evidence: `docs/tasks/vympel_full_system_audit/` contains the 2026-07-16 backend/database/public/CRM/CMS/security/performance/logging/recommendation audit, finite-check matrix, specialized reports, runtime probe summaries, screenshot blocker record, and the ordered Codex Code implementation prompt. No production source behavior was changed by that audit.

## Known Architectural Decisions

* Canonical Git boundary is a root-monorepo target with explicit recovery gates: storefront, CRM, and backend remain sibling applications. On 2026-07-21 the empty root metadata and two nested repository metadata directories were moved intact to `E:\vympel_git_backup_20260721_183725` after explicit approval and verified by hashes plus `fsck`. Old application remotes are not inherited automatically. Root initialization, baseline commit, remote configuration, and push remain separate approval gates; see `docs/cleanup/GIT_REPOSITORY_INVENTORY.md` and `GIT_CONSOLIDATION_ROLLBACK.md`.
* Separate frontend and backend directories: The repo is a multi-app fullstack project without a workspace-level package manager.
* One authoritative local Compose topology: Root `compose.yml` owns PostgreSQL, Redis, MinIO/init, backend/log-volume init, public, and CRM. Containers use service DNS/internal ports; browsers use published localhost ports. Named volumes survive ordinary `docker compose down`.
* One ignored Docker environment contract: Workspace-root `.env` sits beside `compose.yml` and is loaded automatically by Compose. It contains Docker service-DNS URLs and local synthetic credentials; committed `.env.example` contains names/placeholders only. IntelliJ does not load root `.env` and instead activates `application-local.yml` with `SPRING_PROFILES_ACTIVE=local`.
* Bootstrap users are runtime-owned, not migration-owned: Liquibase seeds role dictionaries only. Optional local ADMIN creation uses the existing BCrypt encoder and transactional repositories after migration, is constrained to `local`, and relies on the case-insensitive unique email index plus post-conflict verification for concurrent starts.
* Explicit local profile without weakening production: Compose sets `SPRING_PROFILES_ACTIVE=local`; `NonLocalSecurityConfigurationValidator` remains strict for every non-local or mixed profile set and validates the browser-facing S3 endpoint too.
* Conflict-free Docker browser ports: Docker public/CRM default to `3200`/`3201` because existing workstation Node processes own conventional `3000`/`3001` and retained QA processes own `3100`/`3101`. Hybrid npm development retains `3000`/`3001`.
* Separate CRM frontend: `vympel_crm` is intentionally a separate Next.js app, not mixed into `vympel_front`.
* Manual API contract mirroring: Backend DTOs and frontend TypeScript interfaces are manually kept in sync; contract changes must update both sides.
* Token-based CRM session: CRM uses `sessionStorage` because the existing backend auth system returns stateless JWT tokens rather than HTTP-only cookies.
* Admin-only user management: User-management endpoints live under `/api/crm/users/**`, require `ADMIN` in both route security and method security, hash passwords on create, never return hashes, and audit mutations.
* Brand-linked multilingual collections: CRM collection creation stores stable internal `collection.code`, legacy RU `collection.name` for compatibility, and localized collection name/description in `collection_i18n` for `ru/en/kk`.
* CRM mutation feedback: CRM backend mutations should use `useNotifications` for localized success/error toast feedback and `getCrmErrorMessage` to avoid showing raw technical backend exceptions.
* CRM product photo lifecycle reuse: CRM product photos reuse the existing MinIO/S3-backed `ObjectStorageService`; upload, reorder, main selection, and deletion return a refreshed structured `ProductResponse`. Product-card/search resolution is main image, then first ordered image, then the styled no-photo state.
* CRM product list freshness is mutation-driven and no-store: CRM fetches and the backend list response disable HTTP caching, product mutations broadcast a local invalidation event, cached list routes refetch on that event/focus, and backend reads query PostgreSQL directly without a product-list cache.
* CRM product quick edits use backend DTO values: The products table must initialize and resync price/stock inputs from `ProductResponse.price` and `ProductResponse.stockQuantity`; missing values render empty instead of fake defaults, and successful mutations replace the row from the backend response and refetch the list.
* Product names and descriptions are both multilingual but draft-friendly: CRM create/edit/bulk flows use `productName.name_ru/name_en/name_kz` and optional `description.desc_ru/desc_en/desc_kz`; only RU name is required. Backend normalizes blank EN/KZ values to RU for public fallback. Long descriptions belong only to `product_description_i18n.content_md`, never the 255-character description `title`.
* CRM bulk product creation reuses single-product creation: `/api/crm/products/bulk` composes row-specific values with shared common/category-specific defaults, lets row overrides win for descriptions and details, then delegates each row to `ProductService.create` through `ProductBulkCreationService` so SKU generation, detail validation, names/descriptions, and category links stay consistent.
* Product analytics is separate from CRM audit: Public product behavior events live in `product_analytics_event`; CRM staff actions remain in `crm_activity`. Public tracking failures are swallowed on the frontend, while protected CRM analytics aggregates behavior by product and period. Optional analytics date filters must branch to separate all-time and since-date repository queries instead of passing nullable date parameters into JPQL.
* Abuse control is layered and privacy-safe: Redis is the shared production limiter state; local/test memory state is bounded. Use HMAC identities, source plus normalized identity/content layers where appropriate, one global public-write burst guard, trusted-proxy-only forwarding, safe correlated 429/503 errors, and bounded-cardinality metrics/logs. Never expose or log raw limiter inputs/keys.
* Limiter availability follows endpoint risk: authentication/public writes/analytics fail closed on store failure, while quick/catalog/recommendation reads and logout fail open. A change to this matrix requires a documented availability/security decision and regression tests.
* Promotion support does not override availability rules: Product promotion fields exist on `product`, CRM analytics can recommend or manually toggle promotion, and backend rejects promotion for out-of-stock products. Public in-stock-first ordering still has priority over any future promotion ordering.
* Backend-driven catalog filters/search: Public catalog listing, filter metadata, option labels, option counts, filter `source`, category inheritance, and fuzzy search live in backend catalog services. Wristwatch detail filter options/counts must come from `watch_details`, interior-clock filter options/counts must come from `interior_clock_details`, and neither should be faked from frontend dictionaries. The frontend persists selected values in query params and must not hardcode filter dictionaries.
* Catalog performance is fixed-query projection work: page results select IDs + count, then hydrate one shared summary projection; quick search selects bounded IDs without a count, then uses that projection. Facets use one grouped base query and at most one grouped profile query. Never restore full Product entity materialization, per-option counts, or per-card translation/media/rating loaders.
* Smart search is product-only and shared: Header, catalog, and product page search use the shared `SmartSearch` quick access surface, not a recommendation panel. It must show compact product rows from `GET /api/public/product/search/quick/{lang}` and localized states only; full search submit must go through `routes.searchCatalog(query)` so filters/category/price params are cleared and `page=1` is set.
* React Hook Form is the frontend form standard: Public forms and CRM forms should use RHF for input state. Keep validation messages localized, use `Controller` for custom controls such as catalog checkboxes/radio groups, and preserve existing payload helper functions instead of reshaping API contracts during UI-only migrations.
* Public motion tokens are centralized: Search, filter, category, and related dropdown animations should use `--duration-vympel-*`, `--ease-vympel`, and `transition-vympel*` utilities, with the global reduced-motion override respected.
* Public favorites/cart are temporary local browser state: Until customer accounts/orders exist, favorites and cart use `localStorage` keys `vympel:favorites` and `vympel:cart` through `localProductStorage.ts`, keyed by product id and storing product snapshots for reloads. Product snapshots preserve SKU/article when known, cart increments must never exceed `stockQuantity`, and refreshed snapshots reduce positive over-limit quantities to the available stock ceiling while unavailable products block checkout. Refresh must use the bounded batch-summary endpoint once per page, never per-ID fallback calls; total failure preserves state, while explicit `missingIds` retain the snapshot and become unavailable.
* WhatsApp checkout is generated from cart data: Cart checkout keeps `CONTACT_LINKS.whatsapp` as the destination but builds a localized URL-encoded message through `cartCheckout.ts`. The message must include greeting, every cart position, quantity, unit price, line total, SKU/article as the final line for that item, and the total order sum; empty carts, missing refreshed product/SKU data, unavailable products, or over-stock quantities must show localized toasts and not redirect.
* Centralized public navigation: Public internal links and CTA destinations should be built through `vympel_front/src/config/routes.ts`. Semantic category links use `/catalog?categoryCode=...&page=1`, semantic filter links use backend filter keys/values such as `gender=1`, search links use `/catalog?search=...&page=1`, and brand catalog links should use a backend-resolved brand filter value when filtering by brand.
* Public in-stock-first ordering: Public product lists use `PublicProductQueryService` to order by a computed availability bucket (`ACTIVE` with `stockQuantity > 0` first) before the selected sort and before pagination. Do not move this rule to frontend-only sorting and do not sort by raw stock quantity.
* CRM category-first product creation: `vympel_crm` keeps `/products/new`; `ProductForm` renders category selection before the full form and defaults new products to `DRAFT`. Essential create fields are category, RU name, model, price, stock, and brand. Category choice determines which optional detail section is visible; edit locks the existing category, and backend rejects only detail payloads that belong to a different category profile.
* Brand/manufacturer country belongs to Brand: Product country filters for brand/manufacturer/country-of-brand semantics must join through `Product -> Brand -> brand_country -> Country`; do not duplicate that country on `product`, do not return duplicate public filters like `country` plus `brandCountry`, and do not apply removed country-alias query keys.
* Public brand pages use centralized frontend content: Brand page copy, public slugs, navigation labels, banner mapping, and the `pierre-ricaude` compatibility alias live in `vympel_front/src/config/brandRoutes.ts` and `brandPages.ts`; same-brand products still come from the backend catalog endpoint and are filtered by the backend brand id resolved from catalog filter metadata.
* Frequently changed public content belongs in CMS: New editable banners/text/buttons should use `cms_page`/`cms_block`/`cms_block_translation` plus CRM `/cms` management instead of hardcoded page JSX, unless the content is truly structural or Figma-only.
* CMS storage reuses existing object storage: Seeded static assets may be represented as `PUBLIC_PATH` CMS media so the current site is not empty after migration; newly uploaded CMS images use `ObjectStorageService.uploadCmsImage` and the existing MinIO/S3 configuration under the `cms/` path.
* CMS public reads must be fast, fresh, and fallback-safe: Public services return only active/published data with short public cache headers. Home/About/Catalog/Product/Brands fetch CMS pages through the Next data cache with `revalidate: 30` and tags `cms` / `cms:{pageKey}`. Each mutation commits a durable page-key job and delivery calls the protected public `/api/revalidate` route after commit with required non-local URL/matching secrets. Valid CMS values win; static localized text/assets are used only when CMS data is missing, incomplete, failed, or an image URL cannot load. Mobile image fallback order is current-locale mobile, current-locale desktop, default/RU mobile, default/RU desktop, then static fallback.
* CMS migration is page-scoped: The seeded CMS owns editable banner regions for `home`, `about`, `catalog`, `product`, and `brands`. Current cross-page banner block keys include `catalog.heroBanner`, `catalog.contactBanner`, `product.heroBanner`, `product.stateBanner`, `product.contactBanner`, and `brands.{slug}.heroBanner`; category-specific catalog banners use `catalog.category.{CATEGORY_CODE}.heroBanner`. Accessories and interior clocks must resolve category CMS banners first, then fall back to `/accessories_hero_banner.png` or `/interior_hero_banner.png`; public pages must ask the backend first and use local public assets only as fallbacks.
* CMS CRM management is admin-only: `/api/crm/cms/**` requires `ADMIN`, even though most other CRM endpoints allow `MANAGER`; every CMS mutation should write `crm_activity`.
* CMS media is reusable and deletion is a state machine: every one of the six block slots counts as a live reference. Only unprotected OBJECT_STORAGE media past grace can be claimed; claim and completion recheck under row locks. Storage is deleted before the DB record, failures remain visible/retryable, and `PUBLIC_PATH` media is never garbage-collected.
* Product media ordering is serialized and canonical: every upload/reorder/main/delete first locks the product and image rows. Reorder/main/delete clear mains, move rows to nonconflicting temporary positive positions, flush, then assign final `0..n-1` positions with exactly the first row main. ACTIVE cannot delete its final image.
* CMS block order is page-owned: mutations lock the `cms_page` row and page blocks, prohibit cross-page moves, use collision-free temporary positions, then persist unique ten-step order. The database unique `(page_id,sort_order)` constraint is the final guard.
* CMS revalidation is a durable partial-success contract: content and a deduplicated page-key job commit together. Delivery runs only after commit, uses timestamped HMAC over a fixed allow-list, retries transient failures with backoff, and never turns a successful content write into an error. Public Next invalidation is tag/path-targeted; 30-second ISR remains the fallback.
* CMS freshness target: With healthy configured services, targeted invalidation completes in the post-commit controller step before the CRM mutation response returns, bounded by the 3-second backend HTTP timeout. Transient failure is visible immediately, first retry is due after 5 seconds and polled every 5 seconds by default, and the independent `revalidate: 30` fetch policy bounds normal cache staleness when proactive delivery is unavailable.
* Customer requests are DB-backed CRM work items: Public "Оставить заявку" and product question CTAs must save to `customer_request` through `/api/public/requests` rather than redirecting to WhatsApp. CRM staff process them through `/requests` and protected `/api/crm/requests/**` endpoints with status/comment mutations and audit events.
* Service-layer optional search branching: Optional CRM text search should branch in the service layer for blank/null search instead of putting nullable parameters in JPQL text expressions.
* Locale-prefixed routing: Frontend routes always include a locale prefix and `localeDetection` is disabled.
* Public API base URL includes `/api/public`: Frontend endpoint builders append paths like `/product/...` to an environment base that already includes `/api/public`.
* Liquibase owns schema: JPA is configured with `ddl-auto: validate`, so schema changes should go through Liquibase migrations.
* Moderated reviews and approved-only ratings: New public reviews are always pending, public reads/aggregates include only approved rows, and CRM deletion uses the `DELETED` soft-delete status so moderation history remains auditable.
* Object storage records keys, not full URLs: `Media.url` stores an S3 object key; `ObjectStorageService` builds public links from endpoint, bucket, and key.
* Backend base configuration is deployment-safe: usable DB/JWT/S3/CORS/Redis values exist only in explicit local/test profiles. Non-local startup requires strong independent JWT/limiter secrets, distributed TLS Redis, exact HTTPS origins, secure cookies, non-placeholder database/storage values, and required CMS revalidation configuration; mixed production/local profiles are not exempt.
* Pageable list endpoints are bounded: Public catalog/category product reads cap page size to 60, CRM list/moderation/activity/user reads cap to 100, and new pageable endpoints should use `PageableUtils` instead of trusting client-provided size.
* Upload safety is server-owned: Frontend/CRM should prevalidate images for UX, but Spring multipart limits and `ObjectStorageService` must agree on MIME+extension, 10 MB per-file size, 10-file batch count, UUID object keys, and cleanup of objects written before a later failure.
* Server logs are operational files, not source artifacts: `logback-spring.xml` writes separate application/error/security/CRM streams with daily and size rotation, retention, and per-family size caps. Runtime `logs/`, `*.log`, and `*.log.*` files are ignored and must never be committed.
* Request IDs are the support key: Every backend response carries `X-Request-Id`; every structured API error also contains `requestId`; backend exception, security, storage, and CRM action logs use the same MDC value. Incoming IDs are reused only when they pass the bounded safe-character rule.
* Sensitive logging is deny-by-default: Do not log request/response bodies, authorization headers, JWTs, passwords, refresh tokens, storage/database credentials, or raw private payloads. The masking layout is defense in depth, not permission to add unsafe log statements.
* CRM action files complement database audit: `CrmActivityService` remains the durable queryable audit source and emits the sanitized `crm-actions.log` success line only after its transaction commits. Failed CRM/admin mutations are logged with method/path/status but without request bodies.
* Raw server logs are not exposed through HTTP or CRM: The existing protected `crm_activity` API remains the safe operational activity view. Any future log viewer must use an allow-listed structured source rather than arbitrary file-path reads.
* Product recommendations are backend-owned, nonblocking, and fail silently in customer UI: `ProductRecommendationService` uses one source query, one seven-stage ranked-ID query, and the shared summary projection, caps at 12, and logs/metrics/returns `[]` on failure. The page streams `AsyncProductRecommendations` behind null-fallback server `Suspense`; `ProductRecommendations` returns `null` unless at least one item exists. Never reintroduce generic same-category composition, primary-page awaiting, or recommendation empty/error/retry copy.
* Missing-resource semantics are domain-owned: A valid lookup that finds no requested entity throws `ResourceNotFoundException`; invalid field values and malformed identifiers remain 400, security remains 401/403, and actual persistence/unexpected failures remain 500. Never remap every `IllegalArgumentException` to 404 or use JPA absence exceptions as public control flow.
* Public 404 status is decided before locale streaming: Unknown URLs call the localized catch-all `notFound()` path, while product/category/brand route owners resolve existence before rendering. Only a confirmed API 404 becomes `notFound()`; a temporary backend failure must remain a non-404 safe error response. Do not restore a locale-wide `loading.tsx` boundary without re-running the production status/content matrix.
* CRM 401 and 403 are different contracts: only 401 may enter the one-shot, single-flight refresh path; 403 must preserve the access token and show localized authorization feedback. Refresh and logout endpoints never recursively refresh themselves.
* CRM refresh tokens are backend-owned: never return them in JSON, store them in Web Storage, log them, or persist them raw. Persist SHA-256 jti hashes, rotate on every use, revoke the family on reuse, and revoke all active sessions after role removal or user disable.

## Step 8 Security, Privacy, Performance, and Observability Map

### CSP and response-header source

`vympel_front/security-headers.mjs` and `vympel_crm/security-headers.mjs` build the full browser policy consumed by each `next.config.mjs`. It applies to HTML, Next static chunks, first-party Next API responses, and public static files. CSP permits self plus exact configured backend/media origins; production has no wildcard and no `unsafe-eval`. Staging can set `SECURITY_HEADERS_CSP_MODE=report-only`; local development adds only localhost/HMR allowances. HSTS is never emitted by local Next HTTP and belongs at production TLS ingress.

### Analytics minimized schema and retention

`product_analytics_event` now stores only `id`, `product_id`, `event_type`, and `created_at`. `sessionId` can enter the public tracking request only as an ephemeral duplicate-protection key and is never persisted. `user_id`, `session_id`, `metadata_json`, `ip_address`, and `user_agent` were removed by `2026-07-19-01-analytics-privacy-retention.xml`. `ProductAnalyticsRetentionJob` -> `ProductAnalyticsRetentionService` -> repository advisory lock/count/bounded delete enforces the 180-day policy and exposes `analytics_retention_deleted_total`.

### Optimized static assets and budgets

`vympel_front/scripts/optimize-public-images.py` owns the exact 25-file WebP pipeline; it validates dimensions/decoding and does not touch runtime object-storage media. `2026-07-19-02-public-image-webp.xml` updates matching CMS `PUBLIC_PATH` records. `scripts/check-performance-budgets.mjs` plus `performance-budget-allowlist.json` enforces the repository public total, per-raster limit, and both built Next JS totals. `npm run test:budgets:ci` is the finite local/CI command.

### Liveness, readiness, and Actuator exposure

Anonymous probes are exactly `/actuator/health/liveness` and `/actuator/health/readiness`. Liveness contains application state; readiness contains readiness plus PostgreSQL; component details are never shown. `/actuator/health` and all other Actuator paths stay protected. PostgreSQL is the readiness dependency; Redis and S3/MinIO are monitored separately because they are not required for every public read.

### Frontend/CRM telemetry and request IDs

Each Next app mounts a `TelemetryProvider`, error boundary, global error boundary, library, and same-origin `/api/telemetry` collector. Browser and server flags make it disabled by default. The pipeline reports unexpected client/network/5xx errors and sampled LCP/INP/CLS/FCP/TTFB using normalized low-cardinality routes; it scrubs tokens, cookies, auth fields, secrets, emails, phones, IPv4/IPv6, URL queries, passwords, and form/review/request text. Public `ErrorParser` and CRM API client preserve backend `X-Request-Id`/structured `requestId` in typed errors so boundaries and telemetry can show/use real support references only.

### Catalog sort contract

`GET /api/public/product/{lang}` accepts only `newest`, `oldest`, `priceAsc`, `priceDesc`, `nameAsc`, and `nameDesc`. Omitted/blank uses the default; unsupported nonempty/case-variant values return 400 `INVALID_SORT`. The query service keeps its deterministic `id DESC` tie-breaker, and public controls emit only their supported subset.

### Accessibility localization namespaces

Public RU/KZ/EN message files include `nav`, `pagination`, `bannerCarousel`, `philosophy`, `catalog.breadcrumbsAria`, and `telemetry` names used by navigation, language/home controls, pagination, carousel, meaningful images, breadcrumbs, and errors. CRM RU/KZ/EN includes `telemetry`. Shared breadcrumb/text-input controls require localized caller input instead of a hard-coded English default.

## Step 9 Final Release Verification Map

### CMS media lifecycle transaction boundary

`CmsMediaLifecycleService` performs post-commit media detach/orphan state work through an explicit `TransactionTemplate` with `PROPAGATION_REQUIRES_NEW`. Transaction-synchronization callbacks must not call a repository under the already-completed transaction. `CmsMediaLifecycleServiceTest` is the focused regression owner; the real disposable CMS lifecycle is also recorded in `docs/tasks/vympel_final_release_verification/logs/backend/postfix_cms_lifecycle_corrected.json`.

### Public HTML language mapping and accessibility semantics

`vympel_front/src/i18n/htmlLanguage.ts` owns route-locale to HTML-language mapping: `ru -> ru`, `en -> en`, and legacy route prefix `kz -> kk`. The localized layout must use this mapper rather than writing the route segment directly. Catalog product cards use H2 while carousels/other embedded groups use H3; labeled rating stars expose `role="img"`; decorative images use empty alt; error shells keep a screen-reader H1; carousel landmarks need unique localized names.

### Verified frontend dependency baseline

Both Next applications use Next.js 16.2.10 and `eslint-config-next` 16.2.10. Public uses `next-intl` 4.13.2. Package overrides hold patched `postcss` 8.5.20 under Next, and public also pins the affected watcher `picomatch` transitive. Both apps narrowly override Next's optional `sharp` dependency to the stable `^0.35.0` line, currently locked at `0.35.3`: Next 16.2.10 declares `^0.34.5`, the latest stable Next 16.2.11 still declares that range, and the former lockfiles resolved vulnerable `sharp@0.34.5`. `scripts/check-sharp-security.mjs` prints the installed `next`/`sharp` graph and fails unless every installed `sharp` is a stable version at least `0.35.0`; Storefront CI, CRM CI, and the aggregate gate include that regression boundary without weakening `npm audit --audit-level=high`.

### Final release evidence

`docs/tasks/vympel_final_release_verification/` contains the authoritative Step 9 release report, test/API/database/security/performance/UI/accessibility reports, issue register, screenshot index, release checklist, recovery record, logs, and 40 screenshots. The 2026-07-19 decision is **READY FOR STAGING**, not unconditional production approval. Production conditions include migration-history reconciliation, target TLS/HSTS/Redis/backup/revalidation proof, and an SEO baseline decision.

`docs/tasks/vympel_repository_cleanup_audit/REPOSITORY_CLEANUP_AUDIT.md` records the 2026-07-21 non-destructive workspace cleanup: Git boundaries, retained dirty/staged changes, removed Step 9 copies/processes/container/volumes, retained generated/runtime state, environment/IDE inventory, and deferred repository/deployment decisions.

## Deployment Architecture

The workspace is one root Git monorepo with three independent image boundaries: `vympel-backend`, `vympel-storefront`, and `vympel-crm`. `compose.yml` remains the local source-build stack with PostgreSQL 16, Redis 7.4, and MinIO. `infrastructure/compose/compose.staging.yml` and `compose.production.yml` consume immutable `${REGISTRY}/<image>:${RELEASE_TAG}` references and expect PostgreSQL, Redis, S3-compatible storage, TLS, and secrets to be supplied externally.

Both Next apps use `output: "standalone"` and run as the image's non-root `node` user. The Spring Boot image runs as UID/GID 10001. Deployment starts the finite `migrate` service before backend replicas; normal replicas have Liquibase disabled. Nginx is the sole published service and routes configurable storefront, CRM, and API domains while keeping readiness and protected Actuator endpoints internal.

`deployment/scripts` provides environment validation, fail-closed historical Liquibase compatibility, image pull, migration verification, bounded health polling, smoke checks, deploy, backup evidence checks, validated immutable-manifest generation, and immutable image rollback. Cross-platform PowerShell under `deployment/rehearsals` owns disposable PostgreSQL backup/restore, signed CMS retry/freshness, and Nginx routing proofs; the Liquibase compatibility fixture is POSIX shell. Native Docker/curl commands are resolved as applications on both Windows and Ubuntu. The migration container publishes no port, disables scheduling, and closes as soon as the verification runner confirms Liquibase state; it retains the normal web application type because the current security configuration requires `HttpSecurity` during context creation. Database rollback is deliberately absent. The five required CI workflows split backend/storefront/CRM checks, non-publishing automatic image evidence with a separately guarded manual push path, and the full release gate; the existing performance-budget workflow remains separate. Component concurrency keys include the workflow name so standalone push evidence and reusable full-gate jobs do not cancel one another. Full commit SHA is the application image tag and the release gate emits a commit-specific manifest artifact with registry digests pending until publication.

ADMIN bootstrap is configured by the exact `VYMPEL_BOOTSTRAP_ADMIN_*` variables. It is disabled by default in every environment; local and a controlled one-time staging/production setup may enable it. The canonical active state is `User.enabled=true` because this model has no separate `UserStatus` field. Existing ADMIN accounts are unchanged, non-admin accounts are never promoted, and uniqueness conflict handling makes repeated/concurrent startup safe.

Provider-neutral deployment templates and runbooks live under `infrastructure`, `deployment`, and `docs/deployment`. Local proof now covers SEO behavior, PostgreSQL backup/restore, signed CMS freshness and retry, Prometheus syntax, and reverse-proxy routing. Production remains blocked for any target containing the unrecoverable historical Liquibase row until accountable external acceptance, and on provider/domain/registry/data-service/secrets/public-TLS/trusted-proxy/monitoring/real-staging evidence.

## Last Updated

2026-07-22 - Recorded the Next-scoped `sharp@0.35.3` security baseline, shared dependency assertion, unchanged high-severity audit gate, and successful exact-SHA remote release verification.
