You are working in a new Codex chat on this project.



Your task is to fully diagnose and correctly implement/fix the catalog filtering system.



Important: do not rely on previous chat assumptions. The source of truth is the current codebase, database schema, migrations, and project documentation.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current backend product/catalog/filter implementation.

5\. Inspect the current frontend catalog/filter implementation.

6\. Inspect the database schema and migrations.

7\. Inspect product-related entities/tables:



&#x20;  \* `product`

&#x20;  \* `brand`

&#x20;  \* category tables

&#x20;  \* `watch\_detail`

&#x20;  \* tables that connect `watch\_detail` with characteristic names/keys/indexes

&#x20;  \* product i18n tables

&#x20;  \* product image tables if relevant

8\. Build a short diagnosis plan before changing code.



\---



\# Main Problem



The catalog filters are currently broken.



The main problem is most likely on the backend, but frontend request generation and URL state must also be checked.



Current symptoms:



1\. Products may stop loading when no filters are selected.

2\. Filters work only for fields that exist directly in the base `Product` table.

3\. Filters do not work for detailed characteristics stored in related tables.

4\. Detailed characteristic counts come to the frontend as `0`.

5\. Filtering by detailed characteristics does not correctly filter products.

6\. Some filters may be incorrectly applied even when the user did not select them.

7\. Country filter was partially fixed, but the filter list must contain only `Страна`, not `Страна бренда`.



\---



\# Core Rules



\## 1. Apply only selected filters



Backend must apply only filters that are actually selected by the user.



Do not apply every possible filter from metadata.



Required behavior:



\* if no filters are selected, return the normal catalog product list

\* empty arrays must be ignored

\* null values must be ignored

\* blank strings must be ignored

\* missing filter keys must be ignored

\* price filter must be applied only when minPrice or maxPrice is provided

\* search must be applied only when search query is not blank

\* `watch\_detail` joins must be added only for selected detailed-characteristic filters

\* do not inner join all detail tables by default



Expected behavior:



```text

No filters selected:

&#x20; return all visible catalog products with pagination and sorting



Only brand selected:

&#x20; filter only by brand



Only price selected:

&#x20; filter only by price



Only watch detail mechanism selected:

&#x20; join watch\_detail only for that selected detail filter



Multiple selected filters:

&#x20; apply only selected filters together

```



\---



\# 2. Detailed characteristics source: watch\_detail



Detailed watch characteristics are stored in the `watch\_detail` table.



They are not direct fields of the base `Product` table.



The backend must not treat detailed characteristics as:



```text

Product.mechanism

Product.glass

Product.braceletMaterial

Product.caseMaterial

```



unless those fields really exist directly in the base product entity.



Instead, detailed filters must use the real database relationship:



```text

Product

&#x20;-> watch\_detail

&#x20;   -> characteristic name/key/index

&#x20;   -> characteristic value

```



The exact table/field names must be discovered from the current codebase and database schema.



Required:



1\. Inspect the real `watch\_detail` schema.

2\. Inspect how `watch\_detail` connects to `Product`.

3\. Inspect how `watch\_detail` connects to the characteristic name/key/index.

4\. Generate filter metadata from `watch\_detail`.

5\. Calculate counts from real products that have matching `watch\_detail` values.

6\. Apply selected filters through joins to `watch\_detail`.

7\. Support multiple selected values for one characteristic.

8\. Support several different selected detailed characteristics at once.

9\. Avoid duplicate products caused by joins.

10\. Keep pagination total count correct.



\---



\# 3. Base product filters



These filters may come directly from the base product table or direct relations:



\* price

\* category

\* brand

\* status / active visibility

\* stock / availability if used

\* model / SKU if used

\* other actual direct `Product` fields



These must keep working.



Do not break base product filters while fixing `watch\_detail` filters.



\---



\# 4. Country filter



There must be only one country filter in the public filter UI:



```text

Страна

```



Remove/avoid duplicate filters like:



```text

Страна бренда

```



Important:



Country belongs to Brand, not directly to Product.



Backend country filter must work through:



```text

Product -> Brand -> Country

```



Required:



1\. Product filtering by country must join through Brand.

2\. Country filter metadata counts must count products by their brand country.

3\. CRM product form must not duplicate country on Product if country already belongs to Brand.

4\. Do not add product.country just for filters.



\---



\# 5. Category-specific filters



The catalog must support category-specific filters.



Each category must receive only relevant filters.



Required category behavior:



1\. Wristwatch parent category uses wristwatch filters.

2\. These child categories inherit wristwatch filters:



&#x20;  \* `Классические часы`

&#x20;  \* `Спортивные часы`

&#x20;  \* `Дайверские часы`

&#x20;  \* `Хронографы`

3\. Interior clocks must have their own filters and must not show wristwatch-only filters.

4\. Accessories must not show wristwatch-only filters unless they really have those characteristics.

5\. If category changes, invalid filters from previous category must be removed or ignored safely.

6\. Counts must be calculated only within the current category scope.

7\. Product list must be filtered only inside the selected category scope unless search resets category scope.



\---



\# 6. Filter metadata endpoint



The backend filter metadata endpoint must be the source of truth for frontend filters.



It must return:



\* filter key

\* localized filter label

\* filter type

\* option value

\* localized option label

\* real product count

\* disabled state if count is 0

\* category context if needed



Important:



\* metadata is for displaying available filters

\* metadata must never be treated as active selected filters

\* active filters come only from user selection / URL query params / request payload



Example response shape, adapted to current DTO conventions:



```json

{

&#x20; "category": {

&#x20;   "slug": "classic-watches",

&#x20;   "label": "Классические часы",

&#x20;   "inheritsFiltersFrom": "wristwatches"

&#x20; },

&#x20; "filters": \[

&#x20;   {

&#x20;     "key": "mechanism",

&#x20;     "label": "Механизм",

&#x20;     "type": "checkbox",

&#x20;     "source": "watch\_detail",

&#x20;     "options": \[

&#x20;       {

&#x20;         "value": "QUARTZ",

&#x20;         "label": "Кварцевые",

&#x20;         "count": 12,

&#x20;         "disabled": false

&#x20;       }

&#x20;     ]

&#x20;   }

&#x20; ]

}

```



Use the actual current project DTO style.



\---



\# 7. Product listing endpoint



The product listing endpoint must correctly combine:



\* pagination

\* sorting

\* category

\* base product filters

\* country filter through brand

\* selected `watch\_detail` filters

\* search if search is part of the same endpoint



Required:



1\. No filters selected → return normal catalog products.

2\. Empty filter params must not remove products.

3\. `watch\_detail` joins only when selected detail filters exist.

4\. Base product filters and `watch\_detail` filters must work together.

5\. Multiple values inside the same filter should work as OR.

6\. Different filter groups should work as AND.

7\. Avoid duplicate products.

8\. Keep total count correct for pagination.

9\. Sorting must still work.

10\. SQL injection must be impossible.

11\. Invalid filter keys must be ignored or rejected safely according to existing API conventions.



\---



\# 8. Frontend check



The main bug is likely backend, but frontend must also be inspected.



Frontend must:



1\. Request filter metadata from backend.

2\. Render backend-provided filters/options/counts.

3\. Store selected filters in URL query params where possible.

4\. Send only selected filters to backend.

5\. Not send empty arrays, nulls, blank strings, or metadata as active filters.

6\. Clear invalid filters when category changes.

7\. Reset page to 1 when filters are applied.

8\. Keep sorting and pagination working.

9\. Show empty/error/loading states correctly.

10\. Never fake counts on the frontend.



\---



\# 9. Smart search behavior



Search must work globally across all products.



Required:



1\. Search must not be limited to the current category unless explicitly designed otherwise.

2\. When search is submitted:



&#x20;  \* clear all filters

&#x20;  \* reset page to 1

&#x20;  \* redirect to catalog if submitted from product detail page

3\. Search from product detail page must redirect to catalog, for example:



```text

/products/some-product + search "romanson"

\-> /catalog?search=romanson\&page=1

```



Use the actual project routes.



\---



\# 10. Visual/UI rules



Do not redesign the filter UI unless necessary.



Preserve existing requested filter design:



\* `FilterIcon` 24x24

\* text `Фильтры` 22px, color `#33363F`

\* icon/text gap 20px

\* filter category text 18px, color `#131313`

\* active category font-weight 600

\* option text 16px, color `#000000`

\* unavailable option text `#AAAAAA`

\* checkbox-label gap 18px

\* vertical option gap 34px

\* horizontal option gap 58px

\* sidebar/options gap 102px

\* panel max height 500px

\* scrollbar width 4px, color `#525252`

\* price inputs keep existing requested styles



Use existing design tokens and global classes.



Do not introduce arbitrary Tailwind values or raw hex colors in components if tokens exist or should be created.



All user-facing text must be localized.



\---



\# 11. Debugging requirement



Do not guess.



Before implementing the final fix, identify and explain the actual root cause.



Check specifically:



1\. Is backend applying unselected filters?

2\. Is backend joining `watch\_detail` incorrectly?

3\. Is backend joining all detail filters by default?

4\. Is backend using inner joins that remove products?

5\. Is backend calculating counts from the wrong table?

6\. Is frontend sending empty filters as active filters?

7\. Is frontend sending wrong keys that do not match backend `watch\_detail` characteristic keys?

8\. Are category-specific filters mapped to the wrong source?

9\. Are products missing because of category scope mismatch?

10\. Are duplicates/counts wrong because of joins?



\---



\# 12. Verification checklist



Before finishing, verify:



\* catalog returns products when no filters are selected

\* catalog returns products with only pagination

\* catalog returns products with only sorting

\* catalog returns products with only category

\* catalog returns products with only price

\* catalog returns products with only brand

\* catalog returns products with only country

\* country works through Product -> Brand -> Country

\* only one country filter appears: `Страна`

\* `Страна бренда` does not appear

\* filter metadata for `watch\_detail` characteristics returns real non-zero counts where products exist

\* filtering by one `watch\_detail` characteristic works

\* filtering by several `watch\_detail` characteristics works

\* base filters + `watch\_detail` filters work together

\* wristwatch child categories inherit wristwatch filters

\* interior clocks do not show wristwatch-only filters

\* accessories do not show wristwatch-only filters

\* empty/null/blank filters are ignored

\* no duplicate products appear

\* pagination total is correct

\* sorting still works

\* frontend sends only selected filters

\* URL state works

\* search clears filters

\* search from product page redirects to catalog

\* all new UI text is localized

\* docs are updated



\---



\# 13. Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* final catalog filtering architecture

\* product listing endpoint behavior

\* filter metadata endpoint behavior

\* `watch\_detail` as source for detailed watch filters

\* how `watch\_detail` is joined

\* country filter through Brand

\* category-specific filter behavior

\* frontend URL/query state behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Product filtering must apply only explicitly selected filters.

\* Empty arrays, nulls, missing keys, and blank values must be ignored.

\* Filter metadata must never be treated as active filters.

\* Detailed watch filters must be generated from `watch\_detail`.

\* Detailed watch filtering must join through `watch\_detail`.

\* Do not treat detailed characteristics as direct `Product` fields.

\* Country belongs to Brand and appears in UI as one filter: `Страна`.

\* Frontend must not fake filter counts.

\* Backend is the source of truth for filter labels, values, counts, and disabled states.

\* Category-specific filters must use the correct characteristic source.



\---



\# Final response required



After implementation, respond with:



```markdown

Summary:

\- \[what changed]



Root cause:

\- \[actual reason filters/products were broken]



Backend:

\- \[how filter metadata was fixed]

\- \[how product filtering was fixed]

\- \[how watch\_detail is used]

\- \[how unselected filters are ignored]



Frontend:

\- \[what was checked/fixed]

\- \[how selected filters are sent]



Country:

\- \[how Страна works through Brand]



Category behavior:

\- \[how category-specific filters work]



Search:

\- \[how global search works]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, limitations, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



Do not finish until the catalog returns products with no filters selected and `watch\_detail` filters return real counts and correctly filter products.



