You are working as a senior fullstack engineer on this project.



Fix several remaining CRM/backend issues:



1\. CRM analytics endpoint fails with PostgreSQL parameter type error.

2\. CRM product table still displays wrong price and stock values.

3\. There may be more than one source of truth for price/stock.

4\. Bulk product creation must allow editing every characteristic separately for each product row.

5\. The current multilingual logic used for names / some characteristics must be applied consistently to all relevant fields.

6\. Any product creation flow must include description fields in 3 languages.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect backend analytics repository/service/controller.

5\. Inspect CRM product list backend endpoint, DTOs, mappers, and frontend table.

6\. Inspect product entity/table and any related tables that may store price/stock.

7\. Inspect quick price/stock update endpoints.

8\. Inspect bulk product creation flow.

9\. Inspect regular product creation/edit flow.

10\. Inspect multilingual product fields and current i18n implementation.



\---



\# Part 1 — Fix CRM Analytics PostgreSQL Error



Current error:



```text

ERROR: could not determine data type of parameter $2

```



The failing query is conceptually:



```sql

left join product\_analytics\_event pae

&#x20; on pae.product\_id = p.id

&#x20;and (? is null or pae.created\_at >= ?)

```



This is a PostgreSQL parameter typing problem caused by nullable parameter usage.



Required fix:



1\. Find `aggregatePopularity` or equivalent analytics query.

2\. Do not use ambiguous `? is null or created\_at >= ?` with an untyped nullable parameter.

3\. Fix the query safely.



Acceptable solutions:



\* split repository methods:



&#x20; \* one query without date filter

&#x20; \* one query with `createdAt >= :from`

\* or build query dynamically in service/specification/criteria

\* or explicitly cast parameter to the correct timestamp type if using native SQL

\* or avoid nullable parameter in SQL entirely



Preferred clean behavior:



```text

if fromDate is null:

&#x20;   call aggregatePopularityWithoutDateFilter(lang)

else:

&#x20;   call aggregatePopularityFromDate(lang, fromDate)

```



Do not leave ambiguous nullable SQL parameters.



Verification:



\* analytics loads with no date filter

\* analytics loads with today filter

\* analytics loads with 7 days filter

\* analytics loads with 30 days filter

\* no PostgreSQL parameter type error remains



\---



\# Part 2 — Fix CRM Price / Stock Display Globally



Current problem:



CRM product table still displays wrong values for price and stock.



The UI keeps showing incorrect/default values such as:



```text

price: 200000

stock: 0

```



even when backend data was actually changed.



This means the problem may be deeper than frontend local state.



Required investigation:



1\. Check if `price` and `stockQuantity` exist in more than one table/source.

2\. Check if create/update endpoints write price/stock to one source, but CRM list reads from another source.

3\. Check if CRM list DTO uses stale/calculated/default values.

4\. Check if mapper sets default `200000` or `0`.

5\. Check if frontend input state uses hardcoded fallback values.

6\. Check if cache/refetch is missing after mutation.

7\. Check if backend quick update changes the correct product fields.

8\. Check if product list endpoint returns actual DB values after update.



Important rule:



There must be one clear source of truth for product price and stock.



Define and document the source of truth.



Most likely:



```text

Product.price

Product.stockQuantity

```



or the actual existing canonical fields in the project.



Required behavior:



1\. CRM product list reads price/stock from the same source that update endpoints write to.

2\. Quick price update writes to the canonical price field.

3\. Quick stock update writes to the canonical stock field.

4\. CRM list DTO returns actual values from canonical fields.

5\. Frontend displays the returned values without replacing them with fake defaults.

6\. After update, frontend refetches or updates cached row data.

7\. After page reload, the correct updated values are shown.



Do not solve this by only changing frontend placeholders.



Fix backend/DTO/source-of-truth if needed.



Verification:



\* inspect DB values before and after quick update

\* confirm CRM list response contains correct price/stock

\* confirm frontend displays the same values as backend response

\* remove hardcoded `200000` fallback

\* remove fake stock fallback unless actual stock is truly 0

\* update docs with the price/stock source of truth



\---



\# Part 3 — Bulk Product Creation: Per-Product Characteristics



Current bulk creation is not flexible enough.



Bulk creation must work like marketplace bulk adding:



1\. Admin selects category first.

2\. Admin can fill common fields that apply to all products.

3\. Admin can also override/change every characteristic separately for each individual product row.



Required behavior:



For each product row in bulk creation, admin must be able to edit:



\* model

\* SKU

\* price

\* stock

\* product name translations

\* product description translations

\* photos if supported

\* marketplace links if supported

\* every category-specific characteristic

\* every `watch\_detail` characteristic for watch products

\* any other relevant detail field



Common fields are defaults, not locked values.



If a common field is filled, it should prefill rows.



But every row must be able to override it.



Example:



```text

Common:

&#x20; brand = Romanson

&#x20; mechanism = Quartz

&#x20; glass = Mineral



Row 1:

&#x20; model = APA4

&#x20; price = 200000

&#x20; mechanism = Quartz



Row 2:

&#x20; model = APA5

&#x20; price = 210000

&#x20; mechanism = Mechanical



Row 3:

&#x20; model = APA6

&#x20; price = 220000

&#x20; glass = Sapphire

```



Backend must create each product with its own final merged data:



```text

final row data = common defaults + row overrides

```



Row-specific values must win over common values.



\---



\# Part 4 — Apply Existing Multilingual Logic to All Relevant Fields



There is already logic for multilingual names / some characteristic labels.



Extend this logic consistently.



Required:



1\. Product name must support 3 languages.

2\. Product description must support 3 languages.

3\. Any existing multilingual characteristic names/labels must use the same i18n approach.

4\. Do not implement multilingual fields differently in each form.

5\. Do not hardcode Russian-only labels where the project expects RU/KZ/EN.



Every product creation flow must include 3 description fields:



\* Russian description

\* Kazakh description

\* English description



This applies to:



\* regular product creation

\* regular product editing

\* CRM category-specific creation

\* bulk product creation

\* bulk product row editing if descriptions can differ per product



Use the exact language codes already used in the project.



If the project uses `ru`, `kz`, `en`, follow that.



Suggested shape, adapted to existing DTOs:



```json

{

&#x20; "translations": {

&#x20;   "ru": {

&#x20;     "name": "...",

&#x20;     "description": "..."

&#x20;   },

&#x20;   "kz": {

&#x20;     "name": "...",

&#x20;     "description": "..."

&#x20;   },

&#x20;   "en": {

&#x20;     "name": "...",

&#x20;     "description": "..."

&#x20;   }

&#x20; }

}

```



Do not duplicate a separate non-i18n description source unless the existing model requires it.



\---



\# Part 5 — Backend Bulk Creation Requirements



Backend bulk creation endpoint must support:



1\. categoryId/categorySlug

2\. common fields

3\. product rows

4\. per-row overrides

5\. per-row translations

6\. per-row descriptions in 3 languages

7\. per-row category-specific details

8\. per-row `watch\_detail` values for watch products

9\. validation per row

10\. clear row-level error responses



Required validation:



\* category exists

\* brand exists

\* price valid

\* stock valid

\* SKU/model uniqueness if required

\* required translations present

\* required descriptions present according to project rules

\* category-specific fields valid

\* `watch\_detail` values valid for watch categories



Do not duplicate product creation logic.



Reuse existing product creation/update service where possible.



\---



\# Part 6 — CRM Frontend Requirements



Fix CRM frontend forms:



1\. Product create form must include name and description fields in 3 languages.

2\. Product edit form must include name and description fields in 3 languages.

3\. Bulk creation form must include common multilingual fields and row-level multilingual overrides.

4\. Bulk creation rows must allow editing every characteristic.

5\. Category-specific fields must render based on selected category.

6\. Watch categories must use `watch\_detail`-based fields.

7\. Interior/accessory categories must not show watch-only fields.

8\. Loading/success/error states must work.

9\. All labels/placeholders/errors must be localized.

10\. No hardcoded Russian UI text in components.



\---



\# Part 7 — Tests / Verification



Before finishing, verify:



\## Analytics



\* analytics endpoint works without date filter

\* analytics endpoint works with date filter

\* no parameter type error remains



\## Price / stock



\* CRM product list response contains actual backend price/stock

\* CRM table displays actual backend price/stock

\* quick price update changes canonical backend source

\* quick stock update changes canonical backend source

\* after update, UI refreshes correctly

\* after page reload, values remain correct

\* no fake defaults like `200000` are displayed



\## Bulk creation



\* category is selected first

\* common fields prefill rows

\* each row can override every characteristic

\* each row can have its own price/stock/model/SKU

\* each row can have name in 3 languages

\* each row can have description in 3 languages

\* watch rows save `watch\_detail` correctly

\* backend returns row-level validation errors



\## Multilingual descriptions



\* regular create has 3 description fields

\* edit has 3 description fields

\* bulk create has 3 description fields

\* backend saves all language descriptions

\* product responses return multilingual descriptions correctly



\---



\# Documentation Updates



Update `docs/PROJECT\_MAP.md` with:



\* analytics query fix

\* analytics endpoint behavior

\* canonical price/stock source of truth

\* CRM product list data flow

\* quick update data flow

\* bulk product creation merge logic

\* multilingual product description structure

\* category-specific row override behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Avoid nullable untyped SQL parameters like `? is null or field >= ?` in PostgreSQL queries.

\* Use separate queries or typed parameters for optional date filters.

\* Price and stock must have one canonical source of truth.

\* CRM product list must display values from backend DTO, never fake defaults.

\* After CRM mutations, refetch or update cached row data.

\* Bulk creation common fields are defaults only; each row must be able to override every characteristic.

\* Product descriptions must be multilingual in every creation/edit flow.

\* Product name and description i18n must use the same translation structure.



\---



\# Final Response Required



```markdown

Summary:

\- \[what changed]



Analytics:

\- \[root cause and fix]



Price/stock:

\- \[source of truth]

\- \[backend/frontend fix]



Bulk creation:

\- \[common fields + row overrides]

\- \[per-row characteristic editing]



Multilingual fields:

\- \[name/description i18n changes]



Backend:

\- \[DTO/service/repository/controller changes]



Frontend:

\- \[CRM form/table changes]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, limitations, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



