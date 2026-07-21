# Vympel UI Polish — Implementation Specification

Audit date: 2026-07-15  
Audit target: production build served at `http://localhost:3001` against the existing local backend  
Implementation status: audit only; no UI fix from this document has been applied

## Audit result

| Issue | Result | Primary surface |
| --- | --- | --- |
| UI-01 | Reproduced | Product gallery |
| UI-02 | Reproduced | Product cards |
| UI-03 | Reproduced | Cart page |
| UI-04 | Reproduced below 1440 px | Catalog toolbar/search |
| UI-05 | Reproduced | Catalog toolbar typography |
| UI-06 | Reproduced | Sort trigger translations |
| UI-07 | Not reproduced; already 16 px | Sort option list |
| UI-08 | Reproduced on pages with page-local bottom spacing | Public layouts/footer |
| UI-09 | Reproduced | Product Description links, desktop |
| UI-10 | Separator mismatch reproduced; 20 px/300 already passes | Product breadcrumb |
| UI-11 | Reproduced | Localized brand copy |
| UI-12 | Reproduced | Information pages, mobile |
| UI-13 | Reproduced | All-brands page |
| UI-14 | Reproduced | Product Description links, mobile |
| UI-15 | Reproduced | Product related/contact transition |
| UI-16 | Reproduced at 390–430 px | Mobile sort trigger |
| UI-17 | Reproduced for generic/duplicate mappings | Mobile category menu |
| UI-18 | Reproduced | Mobile brands menu |

No additional issue was promoted to UI-19. The controlled audit found no repeatable horizontal body overflow, viewport-sized sheet overflow, hidden controls, or new breakpoint collision outside the listed issues.

## Audited viewport matrix

| Band | Viewports exercised | Representative evidence |
| --- | --- | --- |
| Desktop | 1920×1080, 1440×900, 1280×800 | Catalog toolbar/panels, product, cart, brands, spacing pages |
| Tablet/intermediate | 1100×800, 1024×768, 1000×800, 900×800, 768×1024 | Closed toolbar, active search, category/filter/sort panels and sheets |
| Mobile | 430×932, 414×896, 390×844, 375×812, 360×800, 320×568 | Product, cart, sort trigger/sheet, category tree, info pages, brand menu |

## Shared spacing baseline

The landing page is the source of truth. `Footer` already supplies the final visual gap through `mt-[var(--spacing-responsive-section-y)]` in `src/components/ui/layout/Footer/index.tsx:25,82`.

| Viewport band | Existing `--spacing-responsive-section-y` | Required final content → footer gap | Rule |
| --- | ---: | ---: | --- |
| Desktop, ≥1280 px | 120 px | 120 px | Exactly one shared footer gap |
| Tablet, 641–1279 px | 96 px | 96 px | Exactly one shared footer gap |
| Mobile, ≤640 px | 64 px | 64 px | Exactly one shared footer gap, plus the existing 100 px document-tail clearance for the fixed bottom nav |

The 100 px mobile document tail is navigation clearance, not page content spacing. Do not remove it while fixing UI-08/UI-12.

| Page | Current page-local bottom contribution before `Footer` | Current effective content → footer gap | Implementation target |
| --- | --- | --- | --- |
| Home | None after final Marketplace block | 120 / 96 / 64 | Keep; reference behavior |
| Catalog | `my-[var(--spacing-responsive-section-y)]` on final block | 240 / 192 / 128 | Remove final bottom margin; retain internal/top section rhythm |
| Product | `pb-18` (72 px) after final contact section | 192 / 168 / 136 | Remove final page padding; let `Footer` own the gap |
| Cart | `py-14 sm:py-18` (56/72 px) | 192 desktop, 168 tablet, 120 mobile | Split top from bottom; no page-local final gap |
| Favorites | `pb-14 sm:pb-18` (56/72 px) | 192 desktop, 168 tablet, 120 mobile | Remove final bottom padding |
| Brands | `pb-[var(--spacing-responsive-section-y)]` | 240 / 192 / 128 | Remove final bottom padding |
| About | None after final Marketplace block | 120 / 96 / 64 | Keep |
| Warranty / Delivery / Payment | `pb-info-footer-gap` resolves to 170 px at every width | 290 / 266 / 234 | Remove page-local final padding; use footer gap only |
| Brand detail | `pb-[var(--spacing-responsive-section-y)]` | 240 / 192 / 128 | Remove final bottom padding |

The responsive custom-property values exist in `src/app/globals.css:146,225,323,1621,1630,1650,1694,1707,1714`. Avoid theme utilities such as `pb-info-footer-gap` or `mt-product-details-links-offset` when the value must change at runtime: Tailwind resolves those theme-backed utilities to the default static value. Use an arbitrary custom-property utility (`pb-[var(...)]`) only when page-local padding is truly required.

---

## UI-01 — Product active thumbnail border

**Scope**

Product gallery thumbnails on desktop and mobile.

**Current**

The active thumbnail has an approximately 1 px border plus two rings: the component applies a 2 px custom shadow and `.product-gallery__thumbnail--active` applies another 1 px shadow. Runtime computed style on product 28 was a 0.8 px border and `0 0 0 2px` shadow.

**Expected**

Exactly one 1 px black active border; no ring, glow, or active `box-shadow`. Inactive, hover, focus-visible, failed-image, and lightbox states remain distinct.

**Screenshot evidence**

- `screenshots/desktop/desktop_product_active_thumbnail_ring_1440.png` — 1440×900, `/ru/product/28`, first thumbnail active.
- `screenshots/mobile/mobile_product_active_thumbnail_ring_390.png` — 390×844, same route/state.

**Likely cause**

- `src/components/ProductPage/ProductGallery/index.tsx:33` adds `shadow-[0_0_0_2px_...]`.
- `src/app/globals.css:592-595` adds `box-shadow: 0 0 0 1px` to the active class.

**Recommended implementation**

Remove both active shadows. Keep the existing thumbnail base border, set the active state to `border-color: #000`/the canonical black token, and ensure the computed border width is exactly `1px`. Keep focus-visible styling on the focused button; it must not be permanently rendered as part of the active state.

**Responsive rules**

Use the same active treatment at every width and in horizontal/vertical thumbnail layouts.

**Acceptance criteria**

- Active thumbnail computed `border-width` is `1px` and black.
- Active thumbnail computed `box-shadow` is `none` when it is not keyboard-focused.
- Only one thumbnail is active after navigation.
- Keyboard focus remains visible.

**Regression risks**

Removing all focus styling together with the active ring; changing lightbox controls; losing contrast against a dark image.

---

## UI-02 — Same cart glyph for active and inactive product cards

**Scope**

Cart action in `GoodCard` wherever product cards are used.

**Current**

Inactive cards render `Basket` (32×32 basket glyph). Active cards render `BasketFill` (52×52 shopping-cart glyph), so both geometry and visual scale change.

**Expected**

Use the same basket glyph in both states. State may be communicated through button background, icon color/fill where supported, `aria-pressed`, and toast behavior—not by swapping the icon drawing.

**Screenshot evidence**

- `screenshots/mobile/mobile_product_cards_cart_icons_active_inactive_390.png` — 390×844, `/ru`, product 28 active beside inactive product cards.
- `screenshots/mobile/mobile_product_cart_icon_inactive_390.png` and `mobile_product_cart_icon_active_390.png` are secondary state captures; the product-card comparison above is authoritative.

**Likely cause**

- `src/components/GoodCard/index.tsx:12-13,267-270` conditionally swaps `Basket` and `BasketFill`.
- `src/assets/icons/Basket.tsx:6-11` and `BasketFill.tsx:6-11` have different view boxes and paths.

**Recommended implementation**

Render `Basket` for both states, remove the `BasketFill` import from `GoodCard`, and keep `aria-pressed={isInCart}` plus the existing active button background. If an active icon color is needed, style the same `Basket` paths from the active button state.

**Responsive rules**

The icon box and glyph size must not change between states on mobile, carousel cards, catalog grids, or desktop cards.

**Acceptance criteria**

- Before/after click, the SVG view box and path geometry are identical.
- Button dimensions do not move.
- `aria-pressed`, localized accessible name, unavailable state, and cart mutation still work.

**Regression risks**

Over-broad path selectors affecting other icons inside `Button`; removing active-state contrast.

---

## UI-03 — Cart page top spacing

**Scope**

Cart page heading and main wrapper.

**Current**

`src/screens/CartPage/index.tsx:221` uses `py-14 sm:py-18`, producing a 56 px header-to-heading gap on mobile and 72 px on desktop. Standard inner page wrappers use `pt-10 sm:pt-12` (40/48 px).

**Expected**

Cart top spacing matches the standard inner-page top token: 40 px mobile, 48 px from `sm` upward. Bottom spacing is handled separately by UI-08.

**Screenshot evidence**

- `screenshots/desktop/desktop_cart_top_gap_1440.png` — 1440×900, `/ru/cart`, one item.
- `screenshots/mobile/mobile_cart_top_gap_390.png` — 390×844.
- `screenshots/mobile/mobile_cart_top_gap_414.png` — 414×896 edge check.

**Likely cause**

Symmetric `py-*` was used for a page that needs independent top and final-footer spacing.

**Recommended implementation**

Replace the symmetric vertical padding with `pt-10 sm:pt-12`; do not add replacement bottom padding, because `Footer` supplies the shared final gap.

**Responsive rules**

40 px at mobile, 48 px at ≥640 px. Keep existing horizontal responsive padding.

**Acceptance criteria**

- Header bottom → cart `h1` top is 40 px at 390/414 and 48 px at 1440.
- Clear-cart control still aligns and wraps without collision.
- Footer spacing matches UI-08.

**Regression risks**

Reintroducing excess bottom space with a new `pb-*`; sticky cart summary overlapping the mobile bottom nav.

---

## UI-04 — Catalog search positioning

**Scope**

Catalog toolbar search at tablet and desktop widths, closed/open and with category/filter/sort panels.

**Current**

At 1440 and 1920 the frame is correctly 19 px from the toolbar top and 38 px from its right edge. At 1280, 1100, 1024, 1000, 900, and 768 it is 30 px from the top and 38 px from the right. Opening any panel preserves the wrong 30 px top offset. Active search at 1024 remains 30 px from the top and expands to 818 px with 42 px side insets.

**Expected**

Inactive tablet/desktop search is exactly `top: 19px; right: 38px` relative to `.catalog-toolbar-shell`, remains stable while panels open, and preserves the centered active-search animation.

**Screenshot evidence**

- Large desktop: `desktop/desktop_catalog_toolbar_search_1920.png`, `desktop_catalog_toolbar_search_sort_1440.png`.
- Intermediate: `desktop/desktop_catalog_compact_toolbar_1280.png`, `tablet/tablet_catalog_closed_1100.png`, `tablet_catalog_closed_1024.png`, `tablet_catalog_toolbar_no_overlap_1000.png`, `tablet_catalog_closed_900.png`, `tablet_catalog_closed_768.png`.
- Panels: `tablet_catalog_categories_open_1024.png`, `tablet_catalog_filters_open_1024.png`, `tablet_catalog_sort_open_1024.png`, plus the 1000 px sheets.
- Active search: `tablet_catalog_search_active_1024.png`.

**Likely cause**

`src/app/globals.css:1014-1019` applies the 19/38 rule only inside `@media (min-width: 1440px)`. Below 1440 the base frame uses `top: 0` within a vertically centered 108 px toolbar, yielding 30 px. `src/screens/CatalogPage/index.tsx:52` also changes `.search-toolbar` from `relative` to `static` only at 1440, so the positioning reference changes by breakpoint.

**Recommended implementation**

Make `.catalog-toolbar-shell` the invariant containing block (it is already `relative` in `BannerWithPageContent`, lines 37-41). From the tablet breakpoint (`min-width: 768px`), make `.search-toolbar` static and apply the 19/38 frame offsets under `.catalog-toolbar-shell`. Keep the active rule centered within the same shell and keep the mobile (<768) host-overlay behavior unchanged.

**Responsive rules**

- ≥768 px inactive: 19 px top, 38 px right.
- ≥768 px active: centered in shell with existing active width/insets.
- <768 px: preserve mobile icon overlay behavior.
- Category/filter/sort panels remain shell-wide and below the toolbar.

**Acceptance criteria**

- Measured 19/38 at 768, 900, 1000, 1024, 1100, 1280, 1440, 1920.
- Measurements do not change after opening each panel.
- No toolbar overlap or body overflow.
- Active search opens, accepts input, closes, and animates from the correct origin.

**Regression risks**

Changing the containing block can shift active search or panel width; applying desktop offsets to mobile can break the icon overlay.

---

## UI-05 — Catalog typography consistency

**Scope**

Full catalog toolbar, accessory gender controls, selected sort text, and opened options.

**Current**

At ≥1440 category/filter/accessory triggers use `text-md` (22 px), while the sort trigger uses `Text size="bodyMd"` (18 px). Compact accessory labels use a 12/13/18 px breakpoint chain. At 390 px the sort label is additionally visible at a raw 13 px until UI-16 removes it.

**Expected**

One shared Text variant per toolbar mode, with matching family, 400 weight, color, and baseline. Opened options remain 16 px.

**Screenshot evidence**

- `desktop/desktop_catalog_toolbar_search_sort_1440.png` and `desktop_catalog_sort_open_arrow_font_1440.png`.
- `tablet/tablet_catalog_closed_1024.png` and `tablet_catalog_toolbar_no_overlap_1000.png`.
- `mobile/mobile_catalog_sort_trigger_text_390.png`.

**Likely cause**

- Category/filter use raw `text-md` in `CategorySelector:186` and `Filters:381`.
- Sort uses `bodyMd` in `Sort:107`.
- `AccessorySplitControls:70` contains scattered raw responsive font sizes.

**Recommended implementation**

Use `Text size="bodyXl"` for every full (≥1440) text toolbar trigger; `bodyXl` is the shared variant mapping to `text-md`. Use `bodySm` (16 px runtime) for compact accessory segmented labels, with `bodyXl` at ≥1440. UI-16 removes compact sort text rather than restyling it. Do not introduce new raw font-size literals.

**Responsive rules**

Full toolbar text: 22 px. Compact segmented labels: 16 px. Icon-only category/filter/sort buttons have no visual label but retain accessible names.

**Acceptance criteria**

- Full category, filters, sort, and accessory/gender labels compute to the same size/weight/color/line box.
- Compact accessory labels compute to 16 px without clipping at 768–1280.
- Opened options remain 16 px.

**Regression risks**

22 px labels can collide at 1440 with long locales; verify RU/KZ/EN and accessories.

---

## UI-06 — Remove sorting direction arrow

**Scope**

Selected short sort label in all locales.

**Current**

The toolbar displays `По цене ↑`/`По цене ↓` because the arrow is part of `catalog.sort.short.priceAsc/priceDesc` in all three message files.

**Expected**

The label is text only (`По цене`, `Баға`, `Price`). The toolbar sort icon remains. The selected radio indicator in the opened list remains.

**Screenshot evidence**

- `desktop/desktop_catalog_sort_open_arrow_font_1440.png`.
- `mobile/mobile_catalog_sort_trigger_text_390.png` and `mobile_catalog_sort_sheet_390.png`.

**Likely cause**

`src/messages/ru.json:329-333`, `kz.json:329-333`, and `en.json:329-333` embed arrows in the short labels.

**Recommended implementation**

Remove only the arrow characters from `short.priceAsc` and `short.priceDesc` in RU/KZ/EN. Do not change the full option labels, `SortIcon`, form values, URL sort state, or `RadioGroup`.

**Responsive rules**

Same translation values wherever the selected short label is shown; mobile visual label is hidden by UI-16.

**Acceptance criteria**

- No `↑` or `↓` is visible in the toolbar or accessible label.
- Sort icon and selected radio remain.
- Price ascending/descending still produce different sort values/results.

**Regression risks**

Removing arrow characters from full option labels or changing sort keys instead of display strings.

---

## UI-07 — Sorting menu font size

**Scope**

Desktop dropdown and mobile sorting sheet.

**Current**

Not reproduced as a defect. Runtime option text is already 16 px, 22 px line-height, with 56 px mobile row height. Selected radio state remains visible.

**Expected**

Preserve 16 px option text and accessible target sizes.

**Screenshot evidence**

- `desktop/desktop_catalog_sort_open_arrow_font_1440.png`.
- `mobile/mobile_catalog_sort_sheet_390.png`.
- `tablet/tablet_catalog_sort_open_1024.png` and `tablet_catalog_sort_sheet_1000.png`.

**Likely cause**

No current break. `RadioGroup` uses `Text size="bodySm"` (`src/components/form/RadioGroup/index.tsx:81`), which computes to 16 px in the built CSS.

**Recommended implementation**

No typography change. Add/retain a regression assertion while touching Sort for UI-05/UI-06/UI-16.

**Responsive rules**

16 px at every viewport; mobile rows remain at least 56 px, desktop labels retain sufficient click targets.

**Acceptance criteria**

- All four options compute to 16 px in desktop and mobile panels.
- Selected state, keyboard navigation, and click/touch selection work.

**Regression risks**

Changing `bodySm` globally to solve unrelated text; inheriting the compact trigger's 13 px style into the panel.

---

## UI-08 — Standard section and footer spacing

**Scope**

Home, catalog, product, cart, favorites, brands, about, warranty, delivery, payment, and brand detail.

**Current**

The landing page uses one shared `Footer` margin. Several inner pages add their own final padding/margin before the same Footer margin, producing the doubled totals in the Shared spacing baseline table. No audited viewport had horizontal body overflow.

**Expected**

Top-level section rhythm uses 120/96/64. Final content → footer uses that token exactly once. Page-specific bottom spacing must not be stacked on the Footer.

**Screenshot evidence**

- Reference: `desktop/desktop_home_spacing_1440.png`, `mobile/mobile_home_spacing_390.png`.
- Catalog/product/cart/favorites/brands: their issue-specific screenshots plus `desktop_favorites_spacing_1440.png`, `mobile_favorites_spacing_390.png`.
- About/info/brand: `desktop_about_spacing_1440.png`, `desktop_guarantee_spacing_1440.png`, `desktop_brand_spacing_1440.png`, and the mobile info-page bottom captures.

**Likely cause**

Page wrappers independently add `pb-*`/`my-*` while `Footer` always adds the shared margin.

**Recommended implementation**

Keep `Footer` as the single owner of final spacing. Apply the exact removals listed in the Shared spacing baseline table. On Catalog, split `my-[var(...)]` into top/internal spacing without final bottom margin. Do not globally change `--spacing-responsive-section-y`; Home and About already use it correctly.

**Responsive rules**

120 px desktop, 96 px tablet, 64 px mobile. Preserve the separate mobile bottom-navigation clearance.

**Acceptance criteria**

- Visual last-content bottom → first Footer content top equals 120/96/64 on every listed page.
- Landing page does not change.
- No content is pressed against Footer or hidden behind the fixed bottom nav.
- No horizontal overflow at all audited widths.

**Regression risks**

Removing internal spacing instead of only final spacing; collapsing margins changing differently when a parent later becomes flex/grid.

---

## UI-09 — Product Description link offset, desktop

**Scope**

Links below the Description copy.

**Current**

The link group has a 130 px top margin. `mt-product-details-links-offset` is compiled to the default 130 px and ignores the intended responsive custom-property overrides.

**Expected**

Compact, deliberate separation: 72 px desktop, 56 px tablet, 32 px mobile. Horizontal link gap can stay at the existing 50 px on desktop.

**Screenshot evidence**

- `desktop/desktop_product_description_link_gap_1440.png` — `/ru/product/28`, Description active.

**Likely cause**

`ProductInfoTabs/index.tsx:122` uses the theme utility `mt-product-details-links-offset`; `globals.css:146,1650,1707` changes the custom property, but the generated utility keeps the default static value.

**Recommended implementation**

Use `mt-[var(--spacing-product-details-links-offset)]` and set the token to 72 px default, 56 px at ≤1279, and 32 px at ≤640. Keep the two links as real links and retain min-height 44 px.

**Responsive rules**

72/56/32. Desktop/tablet may wrap to another row; mobile stays stacked with 16 px row gap.

**Acceptance criteria**

- Computed margin is 72 px at 1440, 56 px at 1024, 32 px at 390/320.
- Long brand names wrap without overflow.
- Both links remain keyboard and touch accessible.

**Regression risks**

Using a static Tailwind theme utility again; changing the link-to-link gap rather than the preceding offset.

---

## UI-10 — Product breadcrumb separator and typography

**Scope**

Product breadcrumb compared with catalog/brands breadcrumbs.

**Current**

Typography already computes to 20 px and weight 300 through `.public-breadcrumb`. Product and brand message namespaces render an em dash (`—`), while catalog `CategoryBreadCrumbs` renders an en dash (`–`).

**Expected**

One separator component/value across public breadcrumbs, matching Catalog (`–`), while preserving 20 px/300.

**Screenshot evidence**

- `desktop/desktop_product_gallery_breadcrumb_spacing_1440.png`.
- `mobile/mobile_product_breadcrumb_390.png`.
- Compare with catalog screenshots in desktop/tablet folders.

**Likely cause**

Product maps `productT("breadcrumbSeparator")` in `ProductPage/index.tsx:176-195`; brand pages use their own message key; Catalog hardcodes `–` in `CategoryBreadCrumbs`.

**Recommended implementation**

Create/reuse one shared public breadcrumb separator (or one shared message value) and replace per-page dash literals/keys. Use en dash `–`. Retain `.public-breadcrumb` as the typography owner; remove redundant per-child size classes only if doing so does not change output.

**Responsive rules**

20 px/300 and same separator at every viewport; horizontal scrolling/wrapping behavior stays page-specific.

**Acceptance criteria**

- Product, catalog, brands, and brand detail show the identical separator glyph.
- Computed font size/weight remain 20 px/300.
- Long product breadcrumb scrolls on mobile without body overflow.

**Regression risks**

Changing route labels/links; replacing the separator with a locale-dependent stale value; losing mobile nowrap scrolling.

---

## UI-11 — Brand copy must change with locale

**Scope**

Description and history content on every public brand detail page.

**Current**

RU is correct, but KZ and EN retain Russian description/history while headings and navigation switch locale. This is not stale React state, backend locale, public API, or CMS image caching.

**Expected**

Every translatable brand field changes to current locale on navigation. A missing translation follows an explicit fallback (current locale → RU) and never leaves previous-locale content in view.

**Screenshot evidence**

- `mobile/mobile_brand_romanson_ru_locale_390.png`.
- `mobile/mobile_brand_romanson_kz_locale_390.png`.
- `mobile/mobile_brand_romanson_en_locale_390.png`.

**Likely cause**

`src/config/brandPages.ts:22-26` defines `localized(text)` by copying the same Russian string into RU/KZ/EN. `getBrandPageData` correctly selects `content[locale]` at lines 99-117; the source data is wrong. `BrandPage` uses CMS only for media, not description/history.

**Recommended implementation**

Replace the copy-to-all-locales helper with explicit RU/KZ/EN values for both `description` and `history` for all six `BrandSlug` entries. Preserve current locale selection and documented RU fallback. Keep brand page layout and CMS media lookup unchanged.

**Responsive rules**

Translations must wrap at 320–430 without body overflow. Do not truncate descriptions/history.

**Acceptance criteria**

- Switching RU → KZ → EN changes description and every history paragraph without restart.
- Returning to RU restores RU immediately.
- All six brands have explicit KZ/EN content or an intentionally documented RU fallback.
- Brand products and banner remain unchanged.

**Regression risks**

Incomplete content translation; mojibake from editing Cyrillic on Windows—validate all JSON/TS strings through a UTF-8 parser/build, not raw console rendering.

---

## UI-12 — Warranty, Payment, and Delivery bottom spacing

**Scope**

Mobile information pages built with `InfoPageLayout`.

**Current**

The content section has 170 px bottom padding at 390 and 320, then Footer adds 64 px, for 234 px before Footer content. Runtime confirmed `padding-bottom: 170px` on all three pages.

**Expected**

Exactly the shared 64 px mobile Footer gap, with no page-local final padding. Keep the separate 100 px trailing document clearance for the fixed bottom nav.

**Screenshot evidence**

- `mobile/mobile_info_guarantee_bottom_gap_390.png` and `mobile_info_guarantee_bottom_gap_320.png`.
- `mobile/mobile_info_payment_bottom_gap_390.png`.
- `mobile/mobile_info_delivery_bottom_gap_390.png`.

**Likely cause**

`InfoPages/index.tsx:23` uses `pb-info-footer-gap`; Tailwind resolves it to the default 170 px despite mobile custom-property value 64 px. It also duplicates the Footer's gap.

**Recommended implementation**

Remove `pb-info-footer-gap` from `InfoPageLayout`. Do not replace it with another page bottom padding. If `--spacing-info-footer-gap` becomes unused, remove the token definitions and document that Footer owns final spacing.

**Responsive rules**

All info pages rely on 120/96/64 from Footer; mobile nav clearance remains intact.

**Acceptance criteria**

- Final content → Footer is 64 px at 390 and 320 on all three pages.
- No content is hidden by mobile bottom navigation.
- Desktop/tablet also match UI-08.

**Regression risks**

Mistaking the navigation clearance for excess content gap; removing it can hide Footer controls.

---

## UI-13 — All brands, including zero-product brands, with product counts

**Scope**

`/brands` cards and RU/KZ/EN count messages.

**Current**

API metadata includes Adriatica 1, Apella 1, Pierre Ricaude 16, Rhythm 1, Romanson 0 disabled, and Royal London 0 disabled. The page filters out disabled/zero options, so the two zero-product public brands disappear. RU count copy says `1 бренд`/`16 брендов` instead of products; KZ says `{count} бренд`. EN is already product-based.

**Expected**

All `PUBLIC_BRANDS` are always present. When metadata exists, every card shows its product count including zero, with correct locale pluralization.

**Screenshot evidence**

- `desktop/desktop_all_brands_missing_zero_counts_1440.png`.
- `mobile/mobile_all_brands_missing_zero_counts_390.png`.

**Likely cause**

- `BrandsPage/index.tsx:119-140` builds from API options and filters `!option.disabled && option.count > 0`.
- `src/messages/ru.json:638` and `kz.json:638` use brand nouns.

**Recommended implementation**

Build the list from `PUBLIC_BRANDS` in canonical order, find the matching API option for each brand, and assign `count: option?.count ?? 0` when metadata is available. Do not use filter-option `disabled` to hide a public brand route. Change messages to:

- RU: `{count, plural, one {# товар} few {# товара} many {# товаров} other {# товара}}`
- KZ: `{count} тауар`
- EN: keep the existing product/products ICU message.

If metadata fetch fails, keep all public brands and omit the count rather than falsely presenting zero.

**Responsive rules**

Cards remain a 1/2/3-column responsive grid; long names and count text wrap without clipping.

**Acceptance criteria**

- Six public brands render with current data.
- Romanson and Royal London show zero-product localized counts.
- 1, 2, 5, 16, and 0 produce correct RU forms; KZ/EN match their grammar.
- Brand card links remain valid for zero-product brands.

**Regression risks**

Mismatching API label `Pierre Ricaude` with route display `PIERRE RICAUD`; treating filter disabled state as route disabled; showing zero on metadata failure.

---

## UI-14 — Product Description spacing on mobile

**Scope**

Mobile Description links at 320–430.

**Current**

Despite the mobile token declaring 36 px, the link group stays 130 px from the Description copy because the compiled utility is static. The first long link wraps correctly and both links retain 44 px minimum height.

**Expected**

32 px preceding gap, 16 px between stacked links, minimum 44 px touch targets, no overflow.

**Screenshot evidence**

- `mobile/mobile_product_description_links_390.png`.

**Likely cause**

Same static utility/token mismatch as UI-09.

**Recommended implementation**

Implement UI-09's custom-property utility and token values. Do not add a mobile-only one-off margin.

**Responsive rules**

32 px at ≤640, stacked links with 16 px row gap; allow link text to wrap and keep arrow aligned without shrinking text.

**Acceptance criteria**

- Computed margin is 32 px at 390 and 320.
- Links remain at least 44 px high and fully clickable.
- No horizontal overflow with the longest RU/KZ/EN brand name.

**Regression risks**

Forcing `white-space: nowrap`; shrinking the arrow/text to fit instead of wrapping.

---

## UI-15 — Product contact banner external spacing

**Scope**

Gap between Related products and the product Contact section; banner internals are out of scope.

**Current**

The measured transition is 120 px at 1440 and 64 px at 390. It is authored redundantly by `my-[var(--spacing-responsive-section-y)]` on Related (`ProductPage:221`) and the default `responsive-section-gap` on Contact (`ProductPage:248`, `SectionWithTitle:14`). Margin collapse currently prevents 240/128 px, but the product-specific transition still reads too large and is fragile if the parent becomes flex/grid.

**Expected**

A compact nested-section rhythm: 72 px desktop, 56 px tablet, 40 px mobile. Banner internal padding and title-to-banner spacing stay unchanged.

**Screenshot evidence**

- `desktop/desktop_product_contact_banner_external_gap_1440.png`.
- `mobile/mobile_product_contact_banner_gap_390.png`.

**Likely cause**

Both adjacent sections own the same large top-level section margin; the code relies on margin collapsing.

**Recommended implementation**

Introduce one shared semantic token such as `--spacing-responsive-subsection-y` with 72/56/40 values. Remove `my-*` from Related, give exactly one of the two sibling boundaries the compact margin, and leave `ContactBanner` internals untouched. Do not shrink global `--spacing-responsive-section-y`, because Home uses it correctly.

**Responsive rules**

72 px ≥1280, 56 px 641–1279, 40 px ≤640.

**Acceptance criteria**

- Related content bottom → Contact heading top equals 72/56/40.
- Contact heading → banner and banner internal padding are unchanged.
- Gap does not double if the parent layout becomes flex/grid.

**Regression risks**

Changing every `SectionWithTitle`; accidentally changing catalog/about contact banners; relying on margin collapse again.

---

## UI-16 — Mobile sort trigger is icon-only

**Scope**

Compact sort trigger below 1440, with mobile requirement focused on ≤640.

**Current**

The compact trigger reveals selected text at `min-width: 390px` through `min-[390px]:inline`; therefore 390 and 430 show text, while 375/360/320 show only the icon. The accessible label is already present.

**Expected**

At every mobile width, show only `SortIcon`; keep `aria-label="Sorting: selected option"`, active state, and opened panel.

**Screenshot evidence**

- Failing: `mobile/mobile_catalog_sort_trigger_text_390.png`.
- Passing comparison: `mobile/mobile_catalog_sort_icon_only_375.png`.
- Open state: `mobile/mobile_catalog_sort_sheet_390.png`.

**Likely cause**

`Sort/index.tsx:77,87-89` adds horizontal padding and unhides the label at 390 px.

**Recommended implementation**

Remove the visual `<Text>` from the compact trigger (or keep it permanently `sr-only`) and remove the 390 px padding expansion. Keep `aria-label`, `aria-expanded`, `aria-haspopup`, icon, and event logic. Desktop ≥1440 continues to use the full text trigger.

**Responsive rules**

≤1439 compact trigger remains 48×48 and icon-only; ≥1440 uses the full icon+text trigger.

**Acceptance criteria**

- 320, 360, 375, 390, 414, and 430 show no selected sort text.
- Accessible name includes current selection.
- Sheet opens/closes and sort state persists.

**Regression risks**

Removing the accessible name with the visual text; changing tablet behavior unintentionally if product requirements still expect compact icon-only through 1439 (the current component shares this trigger).

---

## UI-17 — Logical category icon mapping

**Scope**

`MobileBottomNavigation` catalog sheet category rows.

**Current**

Icon selection mixes code and localized-name heuristics. `WATCH_KIDS` falls through to the generic `Watch`, duplicating the wrist root. Interior uses `House`; accessories uses `Gem`; unknown categories use `ListTree`. Exact current API codes are available and stable.

**Expected**

Deterministic code-first mapping using the existing `lucide-react` dependency, one consistent 20 px outline style, with localized names used only as a last-resort fallback.

**Screenshot evidence**

- `mobile/mobile_category_icons_root_390.png` and `mobile_category_icons_root_360.png`.
- `mobile/mobile_category_icons_wrist_subcategories_390.png`.

**Likely cause**

`MobileBottomNavigation/index.tsx:337-387` has no exact mapping object and no KIDS branch; broad `WATCH` matching wins for multiple categories.

**Recommended implementation**

Create `CATEGORY_ICON_BY_CODE: Record<string, LucideIcon>` next to `getCategoryIcon`, select exact code first, then a small family fallback. Keep icons `aria-hidden="true"`; the containing button's visible localized category name is the accessible label.

| Category / API code | Current icon | Recommended icon/component | Reason |
| --- | --- | --- | --- |
| All products / no category | `Boxes` | `LayoutGrid` | Standard visual for a complete product grid |
| Wristwatches / `WATCH_WRIST` | `Watch` | `Watch` | Direct and already correct |
| Interior clocks / `WATCH_INTERIOR` | `House` | `Clock3` | Communicates clocks rather than generic housing |
| Wall clocks / `WATCH_WALL` | `Watch` fallback | `Clock3` | Clock face is more accurate than wristwatch |
| Floor clocks / `WATCH_FLOOR` | `Watch` fallback | `Clock` | General clock silhouette; distinct component key from wristwatch |
| Accessories / `ACCESSORIES` | `Gem` | `PackageOpen` | General accessories, not only jewelry |
| Classic / `WATCH_CLASSIC` | `Clock3` | `Crown` | Classic/premium style without duplicating interior clock |
| Sports / `WATCH_SPORT` | `Activity` | `Activity` | Direct and already correct |
| Diving / `WATCH_DIVER` | `Waves` | `Waves` | Direct and already correct |
| Chronographs / `WATCH_CHRONOGRAPH` | `Timer` | `Timer` | Direct and already correct |
| Children / `WATCH_KIDS` | `Watch` fallback | `Baby` | Removes duplicate wrist icon and signals children at small size |
| Women / `ACCESSORIES_WOMEN` or WOMEN/FEMALE family | `Venus` | `Venus` | Direct and already correct |
| Men / `ACCESSORIES_MEN` or MEN/MALE family | `Mars` | `Mars` | Direct and already correct |
| Unknown future category | `ListTree` | `Shapes` or `ListTree` fallback | Neutral fallback; never infer from a translated word if code is known |

Before implementation, confirm each recommended named export exists in the installed `lucide-react` version; use the nearest existing Lucide outline alternative if one does not. Do not add another icon library.

**Responsive rules**

20×20 icon inside the existing 40×40 icon box at all mobile widths.

**Acceptance criteria**

- Every current API code maps deterministically.
- Kids does not reuse wrist; accessories/interior are no longer misleading.
- Icons remain legible at 320 and do not affect row height.
- RU/KZ/EN changes labels but not icon choice.

**Regression risks**

Name-based mapping changing with locale; importing a missing Lucide export; mixing filled and outline icons.

---

## UI-18 — Center every brand name within its mobile menu item

**Scope**

Brand pills in Navigation's side/mobile menu.

**Current**

Each link is full width within its grid cell but uses `justify-content: normal` and `text-align: start`. At 320, the PIERRE RICAUD item was 115 px wide and its truncated text occupied 89 px starting 13 px from the left. `truncate` forces a single clipped line.

**Expected**

Every brand is centered inside its own full-width pill. Long names may wrap to two centered lines; touch area and hover/focus behavior remain full width.

**Screenshot evidence**

- `mobile/mobile_brand_menu_item_alignment_390.png`.
- `mobile/mobile_brand_menu_item_alignment_320.png` (short and long brands).

**Likely cause**

`Navigation/index.tsx:255-266` lacks `justify-center`/`text-center` and applies `truncate` to the text.

**Recommended implementation**

Add `w-full justify-center text-center` to the Link. Replace `truncate` with centered wrapping (`whitespace-normal break-words text-center`) and allow a stable two-line minimum height if needed. Keep the Link—not the Text—as the full click target.

**Responsive rules**

Two columns remain at current mobile menu widths; text centers per pill at 320–1439. Long labels wrap without increasing only one row's clickable width.

**Acceptance criteria**

- Short and long names are geometrically centered in their own items.
- PIERRE RICAUD and ROYAL LONDON are not truncated at 320.
- Entire pill remains clickable; hover/focus/active styles remain.

**Regression risks**

Centering the whole grid rather than each item; moving the click target to the text; uneven heights after wrapping.

---

# Controlled responsive audit result

- No horizontal body overflow was detected at any audited viewport.
- Catalog category/filter/sort sheets fit the viewport at 1000 and below; full overlays hid the mobile bottom navigation as designed.
- At 1024, desktop-style panels remained shell-wide and did not move the search; only the listed 30 px top-offset defect remained.
- Active catalog search stayed within the toolbar at 1024 and preserved symmetric 42 px side insets.
- The 768, 430, 390, 360, and 320 checks did not reveal a clear additional UI-19-quality issue.

# Implementation order

## Priority 1 — functional or responsive breakage

1. UI-04: stabilize the search containing block and 19/38 offsets at 768–1920.
2. UI-11: supply real locale-specific brand description/history data.
3. UI-13: keep zero-product brands and correct count pluralization.
4. UI-16: make compact/mobile sort trigger icon-only while preserving accessibility.
5. Re-run overlay, body-overflow, and locale-switch checks before proceeding.

## Priority 2 — inconsistent shared UI

1. UI-02: one cart glyph for both card states.
2. UI-10: one public breadcrumb separator.
3. UI-05/UI-06/UI-07: unify toolbar text, remove arrows, preserve 16 px options.
4. UI-17: replace heuristic icon selection with exact code mapping.

## Priority 3 — spacing and polish

1. UI-08/UI-12: establish Footer as the single final-gap owner.
2. UI-03: reduce Cart top padding and separate it from bottom spacing.
3. UI-09/UI-14: fix Description link token consumption and values.
4. UI-15: apply compact nested-section spacing to Related → Contact.
5. UI-01: remove thumbnail rings.
6. UI-18: center and wrap mobile brand pills.

# Shared components/tokens that should be changed

| Shared area | Primary files | Intended change |
| --- | --- | --- |
| Product thumbnail state | `ProductGallery/index.tsx`, `globals.css` | One 1 px black active border, no active shadow |
| Product card cart action | `GoodCard/index.tsx`, `Basket.tsx` | Reuse one glyph across states |
| Catalog toolbar/search | `CatalogPage/index.tsx`, `SmartSearch/index.tsx`, `globals.css` | Stable `.catalog-toolbar-shell` containing block and 19/38 tablet/desktop offsets |
| Catalog trigger typography | `CategorySelector`, `Filters`, `Sort`, `AccessorySplitControls`, shared `Text` variants | `bodyXl` full toolbar, `bodySm` compact segmented controls |
| Sorting labels | `Sort`, RU/KZ/EN messages | No direction arrow; icon-only compact trigger; preserve 16 px options |
| Public breadcrumbs | Product, Catalog, Brands, Brand plus a small shared separator | One en-dash separator, 20 px/300 |
| Final page spacing | `Footer` plus page wrappers | Footer owns 120/96/64 exactly once |
| Nested product spacing | `globals.css`, `ProductPage`, `ProductInfoTabs` | Add/use compact subsection token; responsive Description offset |
| Brand content/list | `brandPages.ts`, `BrandsPage`, RU/KZ/EN messages | Real translations, all public brands, product counts |
| Mobile category item/icon map | `MobileBottomNavigation` | Exact API-code-to-Lucide mapping |
| Mobile brand item | `Navigation` | Full-width per-item centering and wrapping |

# Required verification after implementation

1. Run `npm run lint` and `npm run build` in `vympel_front`.
2. Repeat the screenshot interactions in `SCREENSHOT_INDEX.md` at their named viewports.
3. Compare every current screenshot with the fixed result; do not reuse this audit's screenshot as proof of implementation.
4. Verify RU/KZ/EN for sort labels, breadcrumbs, brand copy, and product-count grammar.
5. Confirm no body overflow at 1920, 1440, 1280, 1100, 1024, 1000, 900, 768, 430, 414, 390, 375, 360, and 320.
6. Confirm category/filter/sort overlays remain mutually exclusive, hide mobile bottom navigation while open, and restore focus after close.
7. Update `docs/PROJECT_MAP.md` and `docs/PROJECT_SKILLS.md` for any durable shared behavior actually implemented.
