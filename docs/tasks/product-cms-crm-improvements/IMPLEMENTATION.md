# Product / CMS / CRM improvements

> Final release readiness and updated test/security results: [FINALIZATION.md](FINALIZATION.md).

Date: 2026-10-17
Branch: `codex/product-cms-crm-improvements`
Status: implemented locally; no deployment, release-image publication, merge, or external order/message.

> This is the initial implementation record. The later [UX refinement](REFINEMENT.md) supersedes its product-list cleanup panel and visual presentation, with its own exact file inventory and final verification. Backend/business contracts below remain unchanged.

## Existing limitations and fixes

* Price contracts exposed only the normal whole-KZT price. Discounts needed the same fields in entity mappings **and** compact SQL catalog/recommendation/batch projections, as well as browser snapshots.
* CRM could archive products but had no distinct permanent cleanup action. Collection foreign keys could null links, and some reference join tables could cascade; these database behaviors alone were unsafe for the requested cleanup.
* CRM-created reference options already have a deterministic `CRM_[0-9A-F]{16}` code, allowing canonical seed protection without schema flags or display-name heuristics.
* Category CMS keys existed, but frontend fallbacks did not resolve arbitrary real ancestry and CRM lacked a category-aware editor.
* Reading an initialized CMS page before removing a block exposed a managed-collection bug: cascade persistence could retain a deleted block and cause an ordering collision. Deletion now removes it from `CmsPage.blocks` before flushing and reordering.
* Browser review found long category block keys overflowing the 320px CMS layout. They now wrap inside constrained grid columns.

## Database changes

Appended `2026-10-17-01-product-discounts.xml` to the master changelog. It adds nullable integer `product.discount_percent` and CHECK 1..99. Existing rows have no discount. Rollback refuses to drop the column if any discounts remain. No historical changeset was edited, no production data was cleaned, and no dictionary schema change was needed. Migration-boundary expectations and the published-manifest fixture point to the new latest change.

## Backend routes and services

| Route | Behavior |
| --- | --- |
| `PATCH /api/crm/products/{id}/discount?lang=ru` | `{discountPercent: 1..99 or null}`; returns authoritative product detail; audit `PRODUCT_DISCOUNT_CHANGED` |
| `DELETE /api/crm/products/{id}/permanent` | Archived-only hard delete, media outbox and audit `PRODUCT_DELETED`; 204 |
| `DELETE /api/crm/collections/{id}` | Unused-only deletion and audit `COLLECTION_DELETED`; 204 |
| `DELETE /api/crm/references/{type}/{id}` | Allow-listed, unused custom-option deletion and audit `REFERENCE_VALUE_DELETED`; 204 |
| Existing public/CRM CMS page reads | Add `categoryBanners` resolution metadata; existing CMS mutation/media/revalidation endpoints retained |

Existing product mutation RBAC remains ADMIN/MANAGER. CMS remains ADMIN-only. Existing JWT/session, rate limits, product profile validation, imports and model-variant grouping are retained. Audits share the mutation transaction. Protected, used and non-archived resources return localized client feedback from stable 409 codes; missing resources return 404.

## CRM UX

* Product rows show base price, a compact percentage input, save/clear actions, authoritative final price, validation and localized notifications. Blank/clear sends explicit null. Duplicate quick mutation submissions are guarded.
* Archived rows expose a distinct irreversible delete action and existing accessible confirmation dialog. Other rows retain archive behavior.
* A collapsed catalog cleanup panel selects a collection or reference family, filters reference options to server-declared custom values, confirms deletion and displays localized dependency/protection conflicts.
* CMS has an indented real-category selector, own/inherited/default status, source category, current effective preview, draft indication and descendant-impact note. Set/edit own banner reuses the existing six locale/device image slots and publication editor. Removing an override confirms deletion of that category's block only.
* Exact storefront static hero assets are shipped in CRM `public/` for accurate default previews and existing PUBLIC_PATH hero previews. The CRM Docker runtime copies this directory. Keep these three preview files synchronized if storefront fallback artwork changes.

## Storefront UX and exact discount semantics

`price` remains the normal base price. `discountPercent` is null or an integer from 1 through 99. The customer price is `roundHalfUp(price × (100 − percent) / 100)` in the existing **whole-tenge** API contract; for example 1001 KZT at 50% becomes 501 KZT. No discount means final price equals base price. Applying a discount never writes the final price into the base field. Every model variant is independent. Existing price filtering/sorting remains **base-price** filtering/sorting.

All public detail, compact list, quick search, recommendation and batch-summary contracts expose the same pricing fields. Cards, details, search results, brand/category grids, recommendation carousels, favorites, cart and structured offers use effective prices. `ProductPrice` provides restrained original-price strike-through, a neutral outlined badge and primary final price; ordinary products have no discount decoration.

Cart/favorite snapshots retain base, discount and final separately. Batch refresh updates discounts without changing quantity rules. WhatsApp checkout refreshes an uncached batch immediately before composing the order, validates current availability/stock and uses those refreshed final unit/line/total amounts. On refresh failure it sends no order. Successful asynchronous checkout navigates the current tab to WhatsApp. Browser testing intercepted that navigation; no message was sent.

## Exact cookie and storage behavior

The public storefront **can use the functional `NEXT_LOCALE` cookie** through next-intl. A fresh matching-locale request may set none; a language mismatch/change sets it. Browser verification observed `NEXT_LOCALE=en`. CRM's HttpOnly refresh cookie is unrelated and unchanged.

Cart and favorites are localStorage, not cookies. Optional first-party product analytics uses sessionStorage for a session identifier and repeated-view suppression. No advertising/third-party analytics cookies or embed scripts were found. Optional web vitals are also permission-gated; minimal operational error reporting remains independent.

The compact RU/KZ/EN storage notice truthfully describes these mechanisms. Equal-weight necessary-only / allow-analytics actions persist `vympel:privacy:v1` in localStorage. Product analytics identifiers, dedup writes and events are disabled before permission. Withdrawal disables analytics and clears its sessionStorage keys. Missing, invalid or cross-tab-removed choices fail closed. Blocked storage uses a current-tab choice only. Preferences remain available below the footer; acknowledgment restores focus without scrolling and stays dismissed after reload. The notice clears the bottom navigation/safe area; mobile cart checkout accounts for its measured height and remains accessible by scrolling.

## Exact deletion rules and unsupported types

* **Products:** only ARCHIVED, locked before mutation; ACTIVE and DRAFT reject with `PRODUCT_NOT_ARCHIVED`. Existing owned rows cascade through established foreign keys. All owned media kinds queue through the existing object-storage deletion outbox. Shared keys used by another product or CMS, and legacy CMS media links, reject with `PRODUCT_MEDIA_IN_USE`. No raw S3 deletion is used by permanent product cleanup.
* **Collections:** lock then count **all** referring products, regardless of status. Any use rejects with `COLLECTION_IN_USE`; product links are never intentionally nulled. Unused collections and owned translations are deleted.
* **References:** only existing creatable paths: watch-mechanisms, genders, case-materials, strap-materials, glass-types, stone-inlays, colors, interior-styles, interior-mechanisms, interior-power-types, watch-dial-types, watch-dial-markings, watch-power-sources, watch-water-resistances, watch-features. The material family is shared by case/strap/accessory usage; CRM presents it once. Every matching product-detail column and feature join is checked under the locked parent row. Any use rejects with `REFERENCE_IN_USE`. Every non-CRM code is protected with `REFERENCE_PROTECTED`. No cascade into product data is permitted by the service.
* **Intentionally unsupported:** brands, categories, countries, product profiles and non-creatable dictionaries. They underpin canonical catalog behavior and are outside the safe custom-option allow-list. Canonical seeded rows remain protected even if currently unused. Category reparenting/deletion remains out of scope.

## Exact banner algorithm

For a selected active category with a rooted active ancestor path:

1. Use its published image-bearing `catalog.category.{CODE}.heroBanner` BANNER.
2. Otherwise use the nearest ancestor with such a published banner, following real `category.parent_id` relationships with cycle protection.
3. Otherwise use published generic `catalog.heroBanner`.
4. Otherwise use the existing accessory/interior static fallback for the recognized category codes.
5. Otherwise use the generic static catalog hero.

Generic CMS now has the requested precedence over static category artwork. The static assets themselves and the legacy frontend fallback for servers without metadata remain unchanged. Draft explicit overrides are editable in CRM but do not replace the effective published ancestor. Metadata identifies explicit/effective keys, localized names, parent, source, own/inherited/default mode and whether children exist. No inheritance rows or media copies are created in the database. Parent edits affect only inheriting descendants; child edits and override removal never mutate parents. Existing six-slot locale/device image selection, publication, shared-media lifecycle and catalog revalidation outbox are retained.

## Added and updated verification

* Backend pricing/serialization/validation unit tests; actual database discount persistence/clearing/check constraints; archived deletion/owned-row cascade/shared media/outbox/audit; unused and used collections; all 15 custom reference paths and 20 detail-column dependency cases plus feature joins; protected/unknown references; real HTTP validation and RBAC.
* Banner resolver tests cover nearest ancestor, grandchild, sibling, override, draft, generic/static fallback, cycles and inactive paths. Integration tests edit parents, preserve child overrides, remove overrides and assert real revalidation queue insertion.
* CRM quick discount/set/clear/invalid values, archived-only deletion confirmation, collection/custom-reference cleanup conflicts and protected-option filtering; category source/preview/own editor/reset flows and three static default previews.
* Storefront actual card/detail rendering, no-discount regression, half-up pricing, batch snapshot preservation/clearing, WhatsApp totals, consent persistence/gating/withdrawal/blocked storage and category metadata resolution.

## Final test and build results

| Check | Result |
| --- | --- |
| Java 17 `gradlew.bat test bootJar` | PASS; 344 discovered, **323 passed, 21 skipped**, 0 failures/errors; backend JAR built |
| Storefront finite `npm test` | PASS; 41 files / **172 tests** |
| Storefront lint / typecheck / build | PASS; local build uses the existing safe fallback when its configured API is unavailable |
| CRM finite `npm test` | PASS; 19 files / **107 tests** |
| CRM lint / typecheck / build | PASS |
| Published-manifest contract rehearsal | PASS; local fixtures only, no publication |
| Liquibase history compatibility rehearsal | PASS; absent/blocked/approved/mismatch cases |
| Frontend and CRM CSP/security scripts | PASS; 3 tests each |
| Performance budgets | PASS; storefront about 1.263 MiB, CRM about 1.515 MiB |
| Patch whitespace | `git diff --check` passes |

The backend used a fresh loopback PostgreSQL **18** database, not user catalog data. The 21 skipped tests are existing environment gates: RefreshSessionMigration (14), SupportedCatalogMigration (3), ProductModelVariantIntegration (2), RedisRateLimitStoreIntegration (1), and explicit Step7ExternalDatabaseRehearsal (1). Docker/Testcontainers were unavailable, and the external rehearsal was not enabled. Skips are not counted as passes. Container image builds and hosted CI/deployment were not performed.

The documented CRM raw total JS budget moved narrowly from 1.51 to **1.53 MiB** for this requested feature set (measured about 1.515 MiB; prior documented baseline 1.494857 MiB). No dependency was added. Existing raster/public asset limits and oversized-fixture detector remain active.

A fresh headless Edge profile tested local production builds at **320 × 900** and **1440 × 900**, with synthetic API fixtures for CRM and cart, no real account/data mutations. Storefront/CRM pages fit their viewport; table overflow remains contained. Screenshots checked pricing hierarchy, notice/nav separation, checkout accessibility, inherited preview and long-key wrapping. Privacy dismissal/reload/reopen/focus and refreshed checkout totals were exercised. No Figma or screenshot design reference was supplied; no pixel-perfect claim is made.

## Rollout considerations

No rollout has been performed. When separately authorized, back up and apply the additive Liquibase migration with the backend, then release storefront and CRM together. Update immutable deployment migration-boundary evidence to the new latest changeset. Do not drop populated discount data on rollback, and do not roll the customer UI back to quoting base prices while active discounts remain without an explicit business decision. Existing media cleanup and CMS revalidation workers/configuration continue to be required. Generic CMS hero precedence and the analytics default of essential-only are intentional behavior changes. CRM default preview assets must remain in its packaged `public/` directory.

## Files changed

* `deployment/rehearsals/published-manifest-contract.sh`
* `docs/PROJECT_MAP.md`
* `docs/PROJECT_SKILLS.md`
* `docs/tasks/product-cms-crm-improvements/IMPLEMENTATION.md`
* `scripts/check-performance-budgets.mjs`
* `vympel_back/src/main/java/com/shop/vympel/controllers/CrmCollectionController.java`
* `vympel_back/src/main/java/com/shop/vympel/controllers/CrmProductController.java`
* `vympel_back/src/main/java/com/shop/vympel/controllers/CrmReferenceController.java`
* `vympel_back/src/main/java/com/shop/vympel/db/entity/product/Product.java`
* `vympel_back/src/main/java/com/shop/vympel/db/repositories/media/MediaRepository.java`
* `vympel_back/src/main/java/com/shop/vympel/db/repositories/product/PublicProductSummaryRepository.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/cms/CmsCategoryBannerResponse.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/cms/CrmCmsPageResponse.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/cms/PublicCmsPageResponse.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/crm/CrmReferenceOptionResponse.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/crm/QuickDiscountUpdateRequest.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/product/CrmProductListItemResponse.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/product/ProductBatchSummaryItemResponse.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/product/ProductQuickSearchResponse.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/product/ProductRecommendationResponse.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/product/ProductResponse.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/product/ProductShortResponse.java`
* `vympel_back/src/main/java/com/shop/vympel/dtos/product/PublicProductResponse.java`
* `vympel_back/src/main/java/com/shop/vympel/services/catalog/ProductCatalogService.java`
* `vympel_back/src/main/java/com/shop/vympel/services/cms/CatalogBannerService.java`
* `vympel_back/src/main/java/com/shop/vympel/services/cms/CmsServiceImpl.java`
* `vympel_back/src/main/java/com/shop/vympel/services/crm/CrmCollectionService.java`
* `vympel_back/src/main/java/com/shop/vympel/services/crm/CrmReferenceMutationService.java`
* `vympel_back/src/main/java/com/shop/vympel/services/objectStorage/ObjectStorageService.java`
* `vympel_back/src/main/java/com/shop/vympel/services/product/ProductBatchSummaryService.java`
* `vympel_back/src/main/java/com/shop/vympel/services/product/ProductPricing.java`
* `vympel_back/src/main/java/com/shop/vympel/services/product/ProductRecommendationService.java`
* `vympel_back/src/main/java/com/shop/vympel/services/product/ProductService.java`
* `vympel_back/src/main/java/com/shop/vympel/services/product/ProductServiceImpl.java`
* `vympel_back/src/main/resources/db/changelog/2026-10-17-01-product-discounts.xml`
* `vympel_back/src/main/resources/db/changelog/db.changelog-master.xml`
* `vympel_back/src/test/java/com/shop/vympel/controllers/CrmAuthLifecycleIntegrationTest.java`
* `vympel_back/src/test/java/com/shop/vympel/deployment/LiquibaseChangeBoundaryTest.java`
* `vympel_back/src/test/java/com/shop/vympel/deployment/MigrationVerificationRunnerTest.java`
* `vympel_back/src/test/java/com/shop/vympel/services/CatalogImprovementsIntegrationTest.java`
* `vympel_back/src/test/java/com/shop/vympel/services/ResourceNotFoundServiceTest.java`
* `vympel_back/src/test/java/com/shop/vympel/services/cms/CatalogBannerServiceTest.java`
* `vympel_back/src/test/java/com/shop/vympel/services/cms/CmsServiceImplTest.java`
* `vympel_back/src/test/java/com/shop/vympel/services/objectStorage/ObjectStorageServiceTest.java`
* `vympel_back/src/test/java/com/shop/vympel/services/product/ProductPricingTest.java`
* `vympel_back/src/test/java/com/shop/vympel/services/product/ProductServiceImplTest.java`
* `vympel_crm/Dockerfile`
* `vympel_crm/public/accessories_hero_banner.webp`
* `vympel_crm/public/catalog-hero-banner.webp`
* `vympel_crm/public/interior_hero_banner.webp`
* `vympel_crm/src/app/globals.css`
* `vympel_crm/src/features/cms/CmsView.test.tsx`
* `vympel_crm/src/features/cms/CmsView.tsx`
* `vympel_crm/src/features/products/CatalogCleanupPanel.test.tsx`
* `vympel_crm/src/features/products/CatalogCleanupPanel.tsx`
* `vympel_crm/src/features/products/ProductListView.test.tsx`
* `vympel_crm/src/features/products/ProductListView.tsx`
* `vympel_crm/src/shared/api/client.ts`
* `vympel_crm/src/shared/api/types.ts`
* `vympel_crm/src/shared/i18n/messages.test.ts`
* `vympel_crm/src/shared/i18n/messages.ts`
* `vympel_front/src/api/types/CmsTypes.ts`
* `vympel_front/src/api/types/ProductTypes.ts`
* `vympel_front/src/app/[locale]/layout.tsx`
* `vympel_front/src/app/globals.css`
* `vympel_front/src/components/BrandPage/BrandProductsGrid/index.tsx`
* `vympel_front/src/components/CatalogPage/Catalog/index.tsx`
* `vympel_front/src/components/GoodCard/index.tsx`
* `vympel_front/src/components/PrivacyNotice/index.tsx`
* `vympel_front/src/components/ProductAnalyticsTracker/index.tsx`
* `vympel_front/src/components/ProductPage/ProductSummary/index.tsx`
* `vympel_front/src/components/ProductPrice/index.test.tsx`
* `vympel_front/src/components/ProductPrice/index.tsx`
* `vympel_front/src/components/Providers/TelemetryProvider.tsx`
* `vympel_front/src/components/ui/shared/GoodsCarouselWithImage/index.tsx`
* `vympel_front/src/components/ui/shared/SmartSearch/index.tsx`
* `vympel_front/src/lib/structuredData.ts`
* `vympel_front/src/messages/en.json`
* `vympel_front/src/messages/kz.json`
* `vympel_front/src/messages/ru.json`
* `vympel_front/src/screens/CartPage/index.tsx`
* `vympel_front/src/screens/CatalogPage/index.tsx`
* `vympel_front/src/screens/FavoritesPage/index.tsx`
* `vympel_front/src/services/localProductStorage.ts`
* `vympel_front/src/services/privacyPreferences.test.ts`
* `vympel_front/src/services/privacyPreferences.ts`
* `vympel_front/src/utils/cartCheckout.ts`
* `vympel_front/src/utils/catalogCategories.inheritance.test.ts`
* `vympel_front/src/utils/catalogCategories.ts`
* `vympel_front/src/utils/productPricing.ts`
