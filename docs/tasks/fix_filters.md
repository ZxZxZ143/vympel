Fix backend-driven catalog filters so they work not only for fields stored directly in the base `Product` table, but also for characteristics stored in related tables.



Current problem:



The filters work correctly only for product fields that exist directly in the base product entity/table, for example price, brand, category, or other direct `Product` fields.



But filters do not work for characteristics stored in related tables, such as wristwatch-specific or category-specific characteristic tables. For those related-table characteristics:



\* backend sends counts as `0`

\* frontend displays options with zero counts

\* filtering by those characteristics returns incorrect results or does not filter at all

\* only base product fields are actually searchable/filterable



This must be fixed properly.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current product model.

5\. Inspect all related characteristic tables/entities, especially wristwatch-specific and category-specific characteristic entities.

6\. Inspect the backend filter metadata endpoint.

7\. Inspect the backend product filtering endpoint.

8\. Inspect how product category-specific characteristics are connected to `Product`.

9\. Inspect current repository/specification/query logic that calculates filter option counts.

10\. Inspect current repository/specification/query logic that applies filters to product listing.



\---



\# Main Goal



Make catalog filters work for all valid product characteristics, including characteristics stored in related tables.



Filtering and filter metadata must support:



\* fields from the base `Product` table

\* fields from related characteristic entities/tables

\* category-specific characteristic tables

\* inherited category characteristics, for example wristwatch child categories inheriting wristwatch filters



Do not solve this only on the frontend.



The backend must return correct filter metadata and apply filtering correctly.



\---



\# Required Backend Fix



\## 1. Fix filter metadata counts



The backend filter metadata endpoint must calculate real counts for filter options from the correct source.



For each filter option:



\* if the filter is based on a direct product field, count using the product field

\* if the filter is based on a related table field, join the correct related entity/table

\* if the filter belongs to wristwatch characteristics, join wristwatch characteristics correctly

\* if the filter belongs to interior clock characteristics, join interior clock characteristics correctly

\* if the category inherits filters from a parent category, count using the parent characteristic model but within the selected child category scope



Do not return `0` for related-table characteristics unless there are actually no matching products.



\## 2. Fix product filtering by related characteristics



When frontend sends selected filters for related-table characteristics, the backend product listing endpoint must apply them correctly.



Required:



\* join related characteristic tables when needed

\* filter by selected values from those related tables

\* support multiple values per filter

\* support combinations of base product filters and related-table filters

\* support category-specific filters

\* support inherited filters for wristwatch child categories

\* keep pagination working

\* keep sorting working

\* avoid duplicate products from joins

\* keep search compatible with filters unless search intentionally resets filters



Example:



If product has wristwatch characteristics in a related table:



```text

Product

&#x20; -> WristwatchCharacteristics

&#x20;      -> mechanism

&#x20;      -> glass

&#x20;      -> braceletMaterial

&#x20;      -> caseMaterial

&#x20;      -> gender

&#x20;      -> caseSize

```



Then filters like:



```text

mechanism=QUARTZ

glass=MINERAL

braceletMaterial=STEEL

```



must be applied through joins to `WristwatchCharacteristics`, not by looking for these fields on the base `Product`.



\---



\# Architecture Requirement



Do not hardcode one-off SQL for each filter in a fragile way.



Create or improve a clean mapping between filter keys and their backend data source.



Recommended approach:



```text

filter key -> source type -> entity/table path -> field name -> allowed values

```



Example concept:



```text

price -> PRODUCT\_FIELD -> Product.price

brand -> PRODUCT\_FIELD -> Product.brand

mechanism -> WRISTWATCH\_CHARACTERISTIC -> Product.wristwatchCharacteristics.mechanism

glass -> WRISTWATCH\_CHARACTERISTIC -> Product.wristwatchCharacteristics.glass

interiorStyle -> INTERIOR\_CLOCK\_CHARACTERISTIC -> Product.interiorClockCharacteristics.interiorStyle

powerType -> INTERIOR\_CLOCK\_CHARACTERISTIC -> Product.interiorClockCharacteristics.powerType

```



Use the actual entity names and field names from this project.



The implementation should make it easy to add more category-specific filters later.



\---



\# Category-Specific Behavior



Filters must still respect category scope.



Required:



1\. For wristwatch parent category, show and apply wristwatch filters.



2\. For wristwatch child categories:



&#x20;  \* `Классические часы`

&#x20;  \* `Спортивные часы`

&#x20;  \* `Дайверские часы`

&#x20;  \* `Хронографы`



&#x20;  show and apply the inherited wristwatch filters.



3\. For interior clocks, show and apply only interior-clock filters.



4\. For accessories, do not show wristwatch-only filters unless accessories actually have those characteristics.



5\. Counts must be calculated within the selected category scope.



6\. If no category is selected, backend must either return a safe general filter set or clearly documented global filters, but it must not incorrectly count related characteristics as zero.



\---



\# Query Requirements



Use the current project’s preferred backend style.



If the project uses JPA Specifications, Criteria API, QueryDSL, or repository custom queries, follow that pattern.



Requirements:



\* avoid SQL injection

\* validate filter keys

\* validate filter values

\* ignore or reject invalid filters safely

\* use correct joins for related characteristic tables

\* use `distinct` when joins can duplicate products

\* keep pagination total count correct

\* do not break existing public catalog response DTOs



\---



\# Frontend Requirements



The frontend should not fake counts or hardcode related characteristic options.



Frontend must:



1\. Consume backend filter metadata.

2\. Render counts returned by backend.

3\. Allow selecting related-table filters.

4\. Send selected filter keys/values to backend using the expected API format.

5\. Preserve selected filters in URL state.

6\. Remove invalid filters when category changes.

7\. Show loading/error states if filter metadata fails to load.



Do not patch the UI to hide the backend bug. Fix the backend.



\---



\# Tests / Verification



Add or update tests if the project has backend tests.



At minimum, manually verify with real or seeded data:



1\. Filter metadata returns non-zero counts for related-table characteristics when matching products exist.

2\. Filtering by wristwatch mechanism works.

3\. Filtering by wristwatch glass works.

4\. Filtering by bracelet/case material works if those fields are in related tables.

5\. Filtering by multiple related characteristics works.

6\. Filtering by a mix of base product fields and related characteristics works.

7\. Counts are scoped to selected category.

8\. Wristwatch child categories inherit wristwatch filters and counts work.

9\. Interior clock filters use interior-clock characteristic tables.

10\. Accessories do not show wristwatch-only filters.

11\. Pagination and sorting still work.

12\. Product list does not contain duplicates after joins.



\---



\# Documentation Updates



Update `docs/PROJECT\_MAP.md` with:



\* how filter metadata is generated

\* how related characteristic tables are joined

\* category-specific filter architecture

\* inherited filter behavior for wristwatch child categories

\* filter endpoints affected

\* any repository/specification/query changes



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* filters must support both base `Product` fields and related characteristic tables

\* never calculate filter counts only from the base product table if the filter belongs to a related characteristic entity

\* category-specific filters must use the correct characteristic source

\* inherited category filters must still count/filter within the selected child category scope

\* backend is the source of truth for filter labels, values, counts, and disabled state

\* frontend must not fake filter counts to hide backend query issues



\---



\# Final Response Required



```markdown

Summary:

\- \[what changed]



Root cause:

\- \[why related-table filters returned zero counts / did not filter]



Backend filters:

\- \[how metadata counts were fixed]

\- \[how filtering by related characteristics was fixed]



Frontend filters:

\- \[what integration changes were needed, if any]



Category behavior:

\- \[how wristwatch/inherited/interior/accessory filters now work]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, limitations, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



