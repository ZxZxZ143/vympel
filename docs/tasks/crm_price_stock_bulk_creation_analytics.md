You are working as a senior fullstack engineer on this project.



Implement and fix several CRM/product-management features:



1\. Fix CRM product table price/stock display.

2\. Add bulk product creation for products of one selected category.

3\. Add product popularity tracking.

4\. Add CRM analytics for views, likes, cart additions.

5\. Add automatic product promotion support for maintaining demand.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the CRM frontend product list/table.

5\. Inspect CRM product quick edit price/stock logic.

6\. Inspect backend product DTOs/endpoints for CRM product list.

7\. Inspect product entity/model, stock/price fields, and mapper.

8\. Inspect existing activity/audit/analytics tables if any.

9\. Inspect public product page, product card, like/favorite logic, cart logic.

10\. Inspect CRM dashboard/analytics pages if they already exist.

11\. Make a short implementation plan before coding.



Follow project rules:



\* all user-facing text must be localized

\* use existing `Text`, `Heading`, `Button`, form components, toast/loading/error patterns

\* use global design tokens/classes

\* do not hardcode raw UI text in components

\* do not use arbitrary Tailwind values/raw hex if reusable tokens should exist

\* update `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md` after finishing



\---



\# Part 1 — Fix CRM price/stock display bug



Current problem:



In CRM product list/table, the `Цена` and `Остаток` inputs always display:



```text

price: 200000

stock: 0

```



for all products.



Even after editing and page reload, backend data is actually changed correctly, but the frontend still displays the wrong/default values.



This must be fixed.



Likely causes to check:



1\. CRM frontend table uses hardcoded default values.

2\. Inputs initialize local state with fallback values instead of real product data.

3\. Controlled inputs are not synced with fetched product data.

4\. Product DTO from backend does not return actual `price` / `stockQuantity`.

5\. Frontend API mapper ignores real `price` / `stockQuantity`.

6\. React Query/cache/state is not invalidated after update.

7\. Quick edit updates backend but does not refetch product list.

8\. Component state does not update after mutation success.

9\. Product list response uses wrong field names.

10\. Backend mapper returns default price/stock instead of entity values.



Required behavior:



1\. CRM product list must display actual price from backend.



2\. CRM product list must display actual stock/remaining quantity from backend.



3\. After price update:



&#x20;  \* backend updates price

&#x20;  \* frontend shows updated price immediately or after refetch

&#x20;  \* page reload still shows updated backend value



4\. After stock update:



&#x20;  \* backend updates stock

&#x20;  \* frontend shows updated stock immediately or after refetch

&#x20;  \* page reload still shows updated backend value



5\. Inputs must not use hardcoded fallback values like `200000` or `0` unless the actual product value is really missing and the UI explicitly handles that case.



6\. If value is missing/null, show empty state or safe placeholder, not fake product data.



7\. Mutations must show loading/success/error states.



8\. Buttons must be disabled while update is pending.



9\. Product list query/cache must be invalidated or updated after successful mutation.



Verification:



\* different products show different actual prices if backend has different prices

\* different products show actual stock values

\* editing price changes visible value

\* editing stock changes visible value

\* reload keeps correct values

\* no hardcoded `200000` remains in CRM product table logic

\* no hardcoded stock `0` remains except as valid fallback only when product stock is actually 0

\* backend CRM product DTO includes price and stock fields correctly



\---



\# Part 2 — Bulk product creation by category



Add functionality similar to marketplace bulk product creation in Ozon/Wildberries.



Goal:



Admin can create many products of one category faster by selecting the category first, then filling shared/common characteristics once, and then adding product-specific rows.



Required flow:



1\. Admin opens CRM.

2\. Admin selects “Mass product creation” / “Массовое добавление товаров”.

3\. Admin first selects product category.

4\. After category selection, CRM loads category-specific fields.

5\. Admin fills common characteristics that apply to all products in this batch.

6\. Admin then fills product-specific fields for each product row.

7\. Admin can add/remove rows.

8\. Admin can validate all rows before submit.

9\. Admin submits the batch.

10\. Backend creates all valid products in one operation, or returns clear row-level errors.



Category must be selected before the form is built.



Use existing category-specific field logic:



\* wristwatch categories use watch fields / `watch\_detail`

\* classic/sport/diver/chronograph inherit wristwatch fields

\* interior clocks use interior-clock fields

\* accessories use base fields or accessory-specific fields if implemented



Do not show all possible fields for all categories at once.



\---



\## Bulk creation form structure



Recommended UI:



\### Step 1 — Select category



Required:



\* category select

\* explanation text

\* continue button

\* loading/error states if category metadata fails



\### Step 2 — Common fields for all products



Common/shared fields may include:



\* category

\* brand

\* collection if applicable

\* product type/category details

\* gender if category uses it

\* mechanism type

\* glass

\* bracelet material

\* case material

\* water resistance

\* stone insert

\* shared description if applicable

\* status

\* shared marketplace fields only if relevant



Use actual category fields from backend metadata.



\### Step 3 — Product rows



Each row should include product-specific fields such as:



\* model

\* SKU

\* name/translations if needed

\* price

\* stock quantity

\* individual photos if supported

\* individual Kaspi link

\* individual Wildberries link

\* any field that differs between product variants



Admin must be able to:



\* add row

\* duplicate row

\* remove row

\* validate row

\* see row errors

\* submit all rows



\### Step 4 — Result



After submit, show:



\* success notification

\* number of created products

\* row-level errors if some failed

\* links to created products or CRM product list if feasible



\---



\# Part 3 — Bulk creation backend



Add backend support for batch product creation.



Possible endpoint:



```text

POST /api/crm/products/bulk

```



or follow existing route conventions.



Required:



1\. Endpoint must be protected.



2\. Only authorized CRM users/admins can use it.



3\. Request must include selected category.



4\. Request must include common fields.



5\. Request must include product rows.



6\. Backend must validate:



&#x20;  \* category exists

&#x20;  \* category-specific fields are valid

&#x20;  \* required base fields exist

&#x20;  \* price is valid

&#x20;  \* stock is valid

&#x20;  \* SKU/model uniqueness if required

&#x20;  \* watch\_detail values are valid for watch categories

&#x20;  \* interior-clock fields are valid for interior clocks



7\. Backend must create products consistently using existing product creation service logic.



8\. Do not duplicate product creation logic randomly.



9\. Reuse existing product service methods where possible.



10\. Save category-specific details correctly.



11\. Save `watch\_detail` correctly for watch products.



12\. Return created products or result summary.



13\. Return clear row-level validation errors.



Recommended response shape:



```json

{

&#x20; "createdCount": 12,

&#x20; "failedCount": 2,

&#x20; "createdProducts": \[

&#x20;   {

&#x20;     "id": 101,

&#x20;     "sku": "SKU-001"

&#x20;   }

&#x20; ],

&#x20; "errors": \[

&#x20;   {

&#x20;     "rowIndex": 3,

&#x20;     "field": "sku",

&#x20;     "message": "SKU already exists"

&#x20;   }

&#x20; ]

}

```



Adapt to existing API style.



\---



\# Part 4 — Product popularity tracking



Add system for tracking product popularity.



Required events:



1\. Product detail page view.

2\. Product like/favorite.

3\. Product unlike/unfavorite if useful.

4\. Add to cart.

5\. Remove from cart if useful.

6\. External marketplace click if already implemented:



&#x20;  \* Kaspi

&#x20;  \* Wildberries



At minimum, track:



\* product views

\* likes/favorites

\* add-to-cart actions



Important:



\* tracking must not break user experience if analytics request fails

\* product page must still load if tracking fails

\* events should be sent asynchronously where possible

\* avoid duplicate excessive events from React re-renders

\* product view should be tracked once per real page visit or controlled session behavior

\* anonymous users can be tracked without user identity if current project supports that

\* authenticated users can include userId if available



Suggested event fields:



```text

id

productId

eventType

userId nullable

sessionId nullable

metadata json/jsonb nullable

ipAddress nullable

userAgent nullable

createdAt

```



Use existing activity/audit/event table if one already exists and fits.



If not, add a new migration/table for product analytics events.



\---



\# Part 5 — CRM analytics page



Add or extend CRM analytics section.



Required analytics:



1\. Most viewed products.



2\. Most liked products.



3\. Most added-to-cart products.



4\. Product conversion indicators:



&#x20;  \* views

&#x20;  \* likes

&#x20;  \* cart additions

&#x20;  \* add-to-cart rate if feasible



5\. Products with low demand:



&#x20;  \* low views

&#x20;  \* low likes

&#x20;  \* low cart additions



6\. Products with high interest:



&#x20;  \* high views

&#x20;  \* high likes

&#x20;  \* high cart additions



7\. Analytics should be filterable by time period if feasible:



&#x20;  \* today

&#x20;  \* 7 days

&#x20;  \* 30 days

&#x20;  \* all time



Use protected CRM endpoints.



Possible endpoints:



```text

GET /api/crm/analytics/products/popularity

GET /api/crm/analytics/products/{productId}

```



Use existing route conventions.



CRM analytics UI must show loading/error/empty states.



All text must be localized.



\---



\# Part 6 — Automatic product promotion support



Add a basic system to promote needed products for maintaining demand.



This does not have to be a full advertising engine, but it must create the foundation.



Goal:



CRM can mark products as promoted automatically or recommend products for promotion based on analytics.



Required behavior:



1\. Product can have promotion status/priority, for example:



&#x20;  \* not promoted

&#x20;  \* manually promoted

&#x20;  \* auto promoted

&#x20;  \* promotion priority score



2\. Analytics service should identify products that need promotion.



Possible logic:



\* products with low views but active stock

\* products with high stock and low demand

\* products with low cart additions

\* products that are new and need visibility

\* products with good likes/views ratio but low exposure



3\. CRM analytics should show recommended products for promotion.

4\. Admin should be able to enable/disable promotion for a product if feasible.

5\. Public product list/home/new sections may use promotion priority if the project already has such blocks.

6\. Do not disrupt normal catalog sorting unless explicitly designed.

7\. Promotion must not override out-of-stock-last rule.

8\. Out-of-stock products should not be auto-promoted unless there is a clear reason.



Recommended fields if DB changes are needed:



```text

isPromoted boolean

promotionMode enum/manual/auto

promotionScore numeric

promotedUntil nullable

promotionUpdatedAt

```



Use existing product model conventions.



If adding fields, create migration.



If a simpler implementation is better for current architecture, implement recommendations only first and document remaining work.



\---



\# Part 7 — Public frontend event tracking



Update public frontend:



1\. Product detail page sends product view event.

2\. Like/favorite action sends analytics event.

3\. Add-to-cart action sends analytics event.

4\. Tracking failures should be swallowed or logged safely.

5\. Do not show analytics errors to public users unless action itself fails.

6\. Avoid duplicate tracking from component re-renders.



Use existing API client pattern.



\---



\# Part 8 — Security and privacy



Requirements:



1\. CRM analytics endpoints must be protected.

2\. Public tracking endpoint must accept only safe event types.

3\. Validate productId.

4\. Validate eventType.

5\. Do not allow arbitrary metadata abuse.

6\. Do not expose private user data in analytics.

7\. Avoid storing sensitive data unnecessarily.

8\. Do not break auth/security.



\---



\# Part 9 — Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* CRM price/stock display fix

\* CRM product table data flow

\* quick update cache/refetch behavior

\* bulk product creation flow

\* bulk product creation endpoint

\* category-specific bulk creation structure

\* product analytics/event tracking architecture

\* CRM analytics endpoints/pages

\* promotion/recommendation logic

\* migrations added



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* CRM product list must display actual backend values, never fake defaults.

\* After CRM mutations, invalidate/refetch or update cached product data.

\* Bulk product creation must start with category selection.

\* Bulk creation common fields apply to all rows, row fields override only product-specific values.

\* Product analytics events must not break public UX if tracking fails.

\* Product popularity must track views, likes, and add-to-cart actions.

\* Promotion recommendations must not promote out-of-stock products by default.

\* Out-of-stock-last ordering has priority over promotion ordering.



\---



\# Verification checklist



Before finishing, verify:



\## CRM price/stock



\* price column shows actual backend price

\* stock column shows actual backend stock

\* values differ between products if backend data differs

\* after price update, UI updates correctly

\* after stock update, UI updates correctly

\* after reload, values remain correct

\* no hardcoded `200000` remains as displayed price

\* no fake stock value is shown



\## Bulk product creation



\* admin selects category first

\* common fields render after category selection

\* category-specific fields are correct

\* product rows can be added/removed

\* backend creates multiple products

\* row-level validation errors are displayed

\* success/error/loading states work

\* wristwatch bulk creation saves `watch\_detail`

\* interior/accessory flows do not show watch-only fields



\## Analytics



\* product detail view is tracked

\* like/favorite is tracked

\* add-to-cart is tracked

\* CRM analytics shows views

\* CRM analytics shows likes

\* CRM analytics shows cart additions

\* analytics endpoints are protected

\* tracking failure does not break public UI



\## Promotion



\* CRM shows promotion recommendations or promoted status

\* products can be marked/recommended for promotion

\* out-of-stock products are not promoted by default

\* promotion does not break sorting/filtering rules



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



CRM price/stock fix:

\- \[root cause]

\- \[how display/update/refetch was fixed]



Bulk creation:

\- \[category-first flow]

\- \[common fields + row fields]

\- \[backend endpoint/service changes]



Analytics:

\- \[events tracked]

\- \[CRM analytics added]



Promotion:

\- \[auto promotion/recommendation logic]



Backend:

\- \[DTO/entity/service/controller/migration changes]



Frontend:

\- \[CRM/public changes]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, limitations, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



