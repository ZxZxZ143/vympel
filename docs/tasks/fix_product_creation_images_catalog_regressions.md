You are working as a senior fullstack engineer.



Fix the regressions shown in the attached screenshots and the CRM product creation issues.



This is a focused bugfix task. Do not rewrite the whole project from scratch. Inspect the current implementation, find the exact root causes, and fix them safely.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the attached screenshots carefully.

5\. Inspect current git diff.

6\. Inspect CRM product creation flow.

7\. Inspect CRM product list/table.

8\. Inspect product image upload/MinIO attachment logic.

9\. Inspect public product page/gallery/cards.

10\. Inspect catalog toolbar/category/filter/sort dropdowns.

11\. Inspect breadcrumbs component.

12\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Main problems to fix



Current visible / functional problems:



1\. Product description text overflows across the product detail layout.

2\. Long unbroken text breaks product page layout.

3\. Product characteristics can overlap with description text.

4\. Product created through CRM cannot be found in CRM product list.

5\. CRM product list may have missing pagination/search/status filters.

6\. Product image upload during creation does not work.

7\. Product page shows some random placeholder image when product has no photo.

8\. If product has no photo, show a styled “no photo” state instead of fake image.

9\. Product cards with no photo must also show a clean no-photo state.

10\. Category/filter/sort dropdowns in catalog have layout problems.

11\. Some dropdown labels are clipped/truncated badly.

12\. Search/dropdown overlays must not break catalog layout.

13\. Breadcrumb text must be 20px.

14\. Breadcrumbs must remain readable and not overflow.



\---



\# Part 1 — Fix product detail description overflow



Current issue:



On product detail page, long description text overflows horizontally and crosses into the characteristics column.



Required behavior:



1\. Product description must stay inside its container.

2\. Long words/unbroken strings must wrap safely.

3\. Text must not overlap characteristics.

4\. Characteristics column must remain readable.

5\. Layout must not create horizontal body overflow.

6\. Product tab content must be responsive.



Use CSS rules where appropriate:



```css

overflow-wrap: anywhere;

word-break: break-word;

min-width: 0;

max-width: 100%;

```



But apply them through project tokens/classes or component styles, not random inline hacks.



Also check:



\* parent grid/flex containers have `min-width: 0`

\* text blocks do not use fixed width that causes overflow

\* product tab content does not allow text to escape



\---



\# Part 2 — Fix product characteristics layout



Current issue:



Characteristics can visually collide with description or look unstable.



Required:



1\. Characteristics must stay in their own column/section.

2\. Characteristic label/value rows must not overlap.

3\. Long values must wrap cleanly.

4\. On desktop, keep the intended two-column layout if it works.

5\. On mobile/tablet, stack cleanly if needed.

6\. No horizontal overflow.



Expected style:



```text

Браслет: Карбоновый

Корпус: Карбоновый

Страна: Швейцария

```



Labels should remain bold, values normal.



\---



\# Part 3 — CRM product list: newly created product must be findable



Current issue:



A product was created through CRM, but it cannot be found on the CRM product list page. It either did not appear, or product list pagination/search/status filtering is incomplete.



Required investigation:



1\. Check if product creation actually saves the product.

2\. Check status assigned to newly created product:



&#x20;  \* DRAFT

&#x20;  \* ACTIVE

&#x20;  \* INACTIVE

&#x20;  \* etc.

3\. Check whether CRM product list only displays ACTIVE products.

4\. Check whether newly created draft/inactive products are hidden.

5\. Check pagination in CRM product list.

6\. Check if CRM product list has enough pages but no pagination controls.

7\. Check if search/filtering can find product by:



&#x20;  \* name

&#x20;  \* model

&#x20;  \* SKU/article

&#x20;  \* id

&#x20;  \* brand

&#x20;  \* status



Required behavior:



1\. Every product created in CRM must appear somewhere in CRM product management.

2\. CRM product list must support pagination if backend returns pages.

3\. CRM product list must show total count/current page if useful.

4\. CRM product list must allow filtering by product status.

5\. CRM product list must allow search by name/model/SKU/article/id.

6\. After successful product creation:



&#x20;  \* show success toast

&#x20;  \* either redirect to created product edit page

&#x20;  \* or show created product in list

&#x20;  \* or provide “open created product” action

7\. Do not hide drafts/inactive products from CRM by default unless there is a clear filter and visible status tabs.



Public catalog may hide draft/inactive products, but CRM must be able to see and manage them.



\---



\# Part 4 — Fix product image upload during CRM product creation



Current issue:



When creating a product through CRM, images could not be added.



Required investigation:



1\. Inspect existing MinIO/image upload functionality.

2\. Inspect CRM product create form image fields.

3\. Inspect backend product create endpoint.

4\. Inspect whether product images are uploaded before product creation, after creation, or as multipart data.

5\. Inspect DTO/service mapper for product image attachment.

6\. Inspect whether product images are saved to product\_media/product\_images table or equivalent.

7\. Inspect whether uploaded files are orphaned if product creation fails.



Required behavior:



1\. Admin can upload one or multiple product photos during product creation.

2\. Uploaded photos must be stored using existing MinIO/storage logic.

3\. Uploaded photos must be attached to the created product.

4\. Product edit must allow adding/removing/reordering photos if supported.

5\. Product response must return photo URLs/metadata correctly.

6\. Public product page must show actual uploaded photos.

7\. Product cards must show the main photo.

8\. Loading/success/error states must work.

9\. If image upload fails, show localized error.

10\. Do not create a separate storage system.



Implementation options:



\* If product must exist before images can be attached:



&#x20; 1. create product first

&#x20; 2. upload/attach images to created product

&#x20; 3. rollback/delete created product or show partial warning if image attach fails



\* If current backend supports multipart product creation:

&#x20; use existing pattern safely.



Choose the cleanest approach based on current architecture.



\---



\# Part 5 — Remove fake placeholder image



Current issue:



Product page shows some random/fake placeholder image when product has no real photo.



Required:



1\. Remove misleading placeholder product image.

2\. If product has no photos, show a styled “no photo” state.

3\. The no-photo state must match VYMPEL design.

4\. It must work on:



&#x20;  \* product detail gallery

&#x20;  \* product cards

&#x20;  \* search results if product image is shown

&#x20;  \* CRM product list if image preview is shown



Suggested text:



```text

Фотографии нет

```



or:



```text

Фото товара пока не добавлено

```



Use localization.



Design:



\* light neutral surface

\* subtle border

\* centered icon/text

\* premium minimal style

\* no broken image icon

\* no fake watch image



Product page no-photo area should keep the expected image/gallery dimensions so layout remains stable.



\---



\# Part 6 — Product card no-photo state



Current issue:



Cards can show a huge blank/placeholder area.



Required:



1\. Product cards with no image must show the same reusable no-photo component.

2\. Card height must stay consistent.

3\. Text and buttons must not shift badly.

4\. No broken image icon.

5\. No random placeholder.

6\. Mobile and desktop must both look clean.



Create/reuse a component:



```text

ProductImageFallback

NoProductImage

```



or follow existing project naming.



\---



\# Part 7 — Fix catalog category/filter/sort dropdown layout



Current screenshots show dropdown/layout issues in catalog:



\* category dropdown layout is too large/empty in places

\* filter dropdown is too narrow and cuts labels like “Механиз”

\* sort dropdown text wraps awkwardly

\* dropdowns can overlap content in an ugly way

\* dropdown positioning needs cleanup



Required:



1\. Category dropdown must have proper width and spacing.

2\. Filter dropdown must be wide enough for labels.

3\. Sort dropdown must be wide enough for options.

4\. Labels must not be clipped.

5\. If label is long, wrap cleanly or use a concise localized label.

6\. Dropdowns must have consistent VYMPEL styling:



&#x20;  \* subtle border

&#x20;  \* rounded corners

&#x20;  \* light surface

&#x20;  \* clean shadow if appropriate

7\. Dropdowns must align under their trigger.

8\. Dropdowns must not cover unrelated content awkwardly.

9\. Dropdowns must have correct z-index.

10\. Mobile and desktop must both work.



For filter category labels:



\* do not cut words randomly

\* use full labels where possible

\* if absolutely needed, use ellipsis only with tooltip/title



\---



\# Part 8 — Fix catalog search overlay regression



Current screenshot shows search overlay can be too large/misaligned or cover content awkwardly.



Required:



1\. Catalog search must remain inside/related to catalog toolbar.

2\. Search overlay must not jump into header.

3\. Search input and dropdown must remain connected.

4\. Search width must be appropriate:



&#x20;  \* desktop: match catalog design

&#x20;  \* mobile: almost full toolbar width

5\. Search must not cover breadcrumbs/product list in a broken way.

6\. Quick search must still work.

7\. Submit must still redirect/apply catalog search.



\---



\# Part 9 — Breadcrumb typography and behavior



Required:



1\. Breadcrumb text must be 20px.

2\. Apply this consistently to:



&#x20;  \* product page breadcrumbs

&#x20;  \* catalog breadcrumbs

&#x20;  \* brand breadcrumbs

&#x20;  \* other public breadcrumbs if shared

3\. Breadcrumbs must remain in one line where intended.

4\. If they do not fit, use internal horizontal scroll, not body overflow.

5\. Breadcrumb links must remain real internal links.



Use project typography tokens/classes.



Do not hardcode random inline styles.



\---



\# Part 10 — Backend/data consistency checks



Also verify:



1\. Product create response includes created product id/slug.

2\. CRM product list endpoint includes all required fields:



&#x20;  \* id

&#x20;  \* name

&#x20;  \* model

&#x20;  \* SKU/article

&#x20;  \* price

&#x20;  \* stock

&#x20;  \* status

&#x20;  \* images

&#x20;  \* category

&#x20;  \* brand

3\. Public product endpoint includes images only when real images exist.

4\. Product card DTO does not inject fake image URL.

5\. Product image selection uses real main image or no-photo state.

6\. If product is draft/inactive, public page behavior is correct.



\---



\# Part 11 — Verification checklist



Before finishing, verify:



\## Product page



\* long description does not overflow

\* long unbroken text wraps

\* characteristics do not overlap description

\* product without photo shows styled “Фотографии нет” state

\* no fake placeholder image appears

\* breadcrumbs are 20px



\## Product cards



\* no-photo product card looks clean

\* no fake placeholder appears

\* card layout remains stable



\## CRM product creation



\* minimal product can be created

\* product can be created with images

\* images are attached and visible after creation

\* product can be found in CRM product list

\* created product status is visible

\* product list pagination works

\* product search by name/model/SKU/id works



\## Catalog dropdowns/search



\* category dropdown labels are not clipped

\* filter dropdown labels are not clipped

\* sort dropdown options look clean

\* dropdowns align correctly

\* search overlay works and is positioned correctly

\* no horizontal overflow



\## Backend



\* product image data is saved and returned correctly

\* no fake image URL is injected

\* public and CRM DTOs are consistent

\* validation errors are clean



\## Technical



\* no long-running dev/start/watch commands as final checks

\* no infinite loops

\* no hardcoded UI strings

\* all new text localized

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* product image upload/create flow

\* CRM product list pagination/search/status behavior

\* product no-photo fallback component

\* product DTO image behavior

\* breadcrumb typography rule

\* catalog dropdown layout fixes



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* CRM must show all products, including draft/inactive ones, with pagination/search/status filters.

\* Product creation must return or expose the created product so admin can find it immediately.

\* Product images must use existing storage and be attached to products consistently.

\* Public UI must not show fake placeholder product images.

\* Products without images must show a styled no-photo state.

\* Long product text must wrap safely and never overflow into neighboring columns.

\* Breadcrumb text size must be consistent and use project typography tokens.

\* Catalog dropdowns must not clip labels or break layout.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Product page:

\- \[description/characteristics/no-photo/breadcrumb fixes]



CRM product creation:

\- \[product visibility/search/pagination/status fixes]



Image upload:

\- \[how product image creation/attachment was fixed]



Catalog UI:

\- \[dropdown/search fixes]



Backend:

\- \[DTO/service/validation/image changes]



Tests:

\- \[what was run or why not run]



Notes:

\- \[remaining assumptions or follow-up]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



