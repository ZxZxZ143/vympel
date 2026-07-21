You are working as a senior fullstack engineer on this project.



Implement two improvements:



1\. Out-of-stock products must always be shown at the end of product lists, regardless of selected sorting.

2\. Finalize CRM product creation/editing so different product categories have their own fields, and the category is selected before creating the product card.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect catalog/product listing backend sorting and filtering.

5\. Inspect public product card component.

6\. Inspect CRM product create/edit flow.

7\. Inspect product category model and category-specific characteristics logic.

8\. Inspect existing localization and global design tokens.



Follow all project rules:



\* all user-facing text must be localized

\* use existing `Text`, `Heading`, `Button`, form components, and design tokens

\* do not hardcode raw UI text in components

\* do not use raw hex colors/arbitrary Tailwind values where reusable tokens should exist

\* update `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md` after finishing



\---



\# Part 1 — Out-of-stock products must always be last



Current required behavior:



Products that are not in stock must always appear at the end of product lists.



This rule has higher priority than any user-selected sorting.



Examples:



\* If sorting is by price ascending, first show all in-stock products sorted by price ascending, then all out-of-stock products sorted by price ascending.

\* If sorting is by price descending, first show all in-stock products sorted by price descending, then all out-of-stock products sorted by price descending.

\* If sorting is by newest, first show all in-stock products sorted by newest, then all out-of-stock products sorted by newest.

\* If sorting is default, first show in-stock products, then out-of-stock products.



Backend must be the main source of truth for this ordering.



Do not solve this only on the frontend.



Backend sorting must conceptually work like:



```text id="1f8z8m"

ORDER BY

&#x20; in\_stock DESC,

&#x20; selected\_sort\_field selected\_direction

```



Use the actual project field names.



A product should be considered out of stock if the current project logic says it is unavailable, for example:



\* `stockQuantity <= 0`

\* status is unavailable

\* availability flag is false



Inspect the real project model and use the correct availability logic.



Requirements:



1\. Apply in-stock-first ordering to all public product list endpoints:



&#x20;  \* catalog

&#x20;  \* brand page product lists

&#x20;  \* category pages

&#x20;  \* search results

&#x20;  \* filtered results

&#x20;  \* new products sections if they use product lists



2\. Preserve existing filters, search, pagination, and sorting.



3\. Pagination must work correctly with this ordering:



&#x20;  \* page 1 should not show out-of-stock products before available products if available products exist later in the full result set

&#x20;  \* this means ordering should happen in the backend query before pagination



4\. Do not duplicate products.



5\. Do not break CRM product list unless CRM intentionally needs a different ordering.



\---



\# Part 2 — Show unavailable state on product cards



On the public frontend, out-of-stock products must be visibly marked.



Required:



1\. Product card must clearly show that the item is out of stock.



2\. Add a localized label, for example:



&#x20;  \* `Нет в наличии`



3\. Make the unavailable product visually different.



Possible design options:



\* image is more pale / lower opacity

\* overlay label on image

\* disabled or muted add-to-cart button

\* muted product card actions

\* cart button disabled for unavailable products



Choose the cleanest option that matches the existing design.



Requirements:



\* out-of-stock image should look visually softer/paler

\* product must remain clickable if the current UX allows opening unavailable product pages

\* add-to-cart must be disabled or blocked for unavailable products

\* user must not be able to add unavailable products to cart

\* favorite/like behavior can remain available unless project rules say otherwise

\* all text must be localized

\* use global tokens/classes, not raw inline styles



\---



\# Part 3 — CRM category-first product creation



Finalize CRM product creation flow.



Category must be selected before the product card/form is created.



Required UX:



1\. Admin clicks “Create product” / “Добавить товар”.

2\. First screen/modal/page asks admin to select the product category.

3\. Only after category selection, CRM opens the correct product creation form for that category.

4\. The selected category determines which fields/characteristics are shown.

5\. Admin should not see all possible fields from all categories at once.

6\. Admin should not be able to create a product without selecting a category first.



Category selection must happen before the full create form is rendered.



\---



\# Part 4 — Category-specific CRM fields



Different categories must have their own fields.



Base product fields are common for all products.



Common/base fields should include existing generic product fields, such as:



\* product name / translations

\* category

\* price

\* description / translations

\* brand / manufacturer

\* stock quantity / availability

\* status

\* photos/images

\* marketplace links if already implemented

\* model / SKU if they are generic in the current schema



Do not duplicate base product fields in category-specific detail tables.



Category-specific fields must be rendered only for relevant categories.



\## Wristwatch categories



The following categories must use wristwatch fields/characteristics:



\* main wristwatch category

\* `Классические часы`

\* `Спортивные часы`

\* `Дайверские часы`

\* `Хронографы`



These child categories inherit wristwatch characteristics.



Wristwatch fields should follow the existing implemented logic, especially if they are stored through `watch\_detail`.



Examples:



\* mechanism

\* glass

\* bracelet material

\* case material

\* gender

\* case size

\* water resistance

\* stone insert

\* other existing watch details



Use the real `watch\_detail` structure and existing characteristics.



\## Interior clocks



Interior clocks must have their own fields and must not show wristwatch-only fields.



Interior clock fields may include:



\* brand / manufacturer

\* country through brand if applicable

\* case material

\* color

\* interior style

\* mechanism type

\* power type

\* dimensions

\* weight

\* warranty

\* stock availability

\* photos



Only add missing fields if the current backend does not already support them.



Follow the same architectural pattern as existing category-specific details.



\## Accessories



Accessories must have their own create/edit flow.



If accessory-specific fields are not yet defined, show only base product fields and keep the architecture ready for accessory-specific fields later.



Do not show wristwatch-only fields for accessories.



\---



\# Part 5 — CRM backend requirements



Backend must support category-specific product creation/editing.



Required:



1\. Product create DTO must support base fields plus category-specific details.

2\. Product update DTO must support base fields plus category-specific details.

3\. Backend must validate fields based on selected category.

4\. Backend must reject invalid category-specific fields if they do not belong to selected category, or safely ignore them according to project API conventions.

5\. Backend must save wristwatch details into the correct existing structure, especially `watch\_detail` if that is the source of watch characteristics.

6\. Backend must save interior clock details into the correct category-specific structure.

7\. Backend must preserve existing data when editing a product.

8\. Backend must not require wristwatch details for non-watch products.

9\. Backend must not require interior-clock details for watches.

10\. Add migrations only if missing fields/tables are required.



\---



\# Part 6 — CRM frontend requirements



CRM create/edit UI must become category-aware.



Required:



1\. Category selection screen before product creation.

2\. Category-specific form sections after category selection.

3\. Product edit page must load existing category and render correct fields automatically.

4\. If editing an existing product, category should not be casually changed unless the backend/UI safely supports migration of details.

5\. If category changing is allowed, show a warning because category-specific data may change.

6\. Loading states during category metadata loading.

7\. Success/error notifications for create/edit/update.

8\. All labels, placeholders, validation errors, and button texts must be localized.

9\. Use existing CRM feedback/toast/loading patterns.

10\. Use reusable form components.



\---



\# Part 7 — Verification checklist



Before finishing, verify:



\## Product ordering



\* catalog shows in-stock products first

\* out-of-stock products are at the end with default sorting

\* out-of-stock products are at the end with price ascending

\* out-of-stock products are at the end with price descending

\* out-of-stock products are at the end with newest sorting

\* out-of-stock products are at the end with filters applied

\* out-of-stock products are at the end with search results

\* pagination respects in-stock-first order

\* brand pages show out-of-stock products after available products

\* category pages show out-of-stock products after available products



\## Product cards



\* out-of-stock products have visible unavailable state

\* image is visually muted/pale or has a clear overlay

\* label `Нет в наличии` is visible

\* add-to-cart is disabled/blocked for unavailable products

\* unavailable product card still looks consistent with design



\## CRM



\* admin must choose category before product creation form opens

\* wristwatch categories show wristwatch fields

\* classic/sport/diver/chronograph categories inherit wristwatch fields

\* interior clocks show interior-clock fields

\* accessories do not show wristwatch-only fields

\* edit product page renders fields based on product category

\* backend validates category-specific details correctly

\* create/update works for at least one wristwatch product

\* create/update works for at least one interior clock product if supported

\* create/update works for accessory base fields

\* loading/success/error states work



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* in-stock-first product ordering rule

\* where backend sorting was changed

\* unavailable product card UI behavior

\* CRM category-first creation flow

\* category-specific create/edit architecture

\* category-specific backend DTO/service behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Out-of-stock products must always be ordered after in-stock products, regardless of selected sort.

\* In-stock-first ordering must happen in backend before pagination.

\* Public product cards must clearly mark unavailable products.

\* Unavailable products must not be addable to cart.

\* CRM product creation must start with category selection.

\* CRM product forms must render category-specific fields only.

\* Base product fields must not be duplicated in category-specific detail models.

\* Wristwatch child categories inherit wristwatch fields.

\* Interior clocks and accessories must not show wristwatch-only fields.



\---



\# Final response required



```markdown id="1yiv1a"

Summary:

\- \[what changed]



Product ordering:

\- \[how unavailable products are moved to the end]



Unavailable UI:

\- \[how out-of-stock products are displayed]



CRM:

\- \[how category-first creation works]

\- \[how category-specific fields work]



Backend:

\- \[DTO/service/query changes]



Frontend:

\- \[product card and CRM UI changes]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, limitations, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



