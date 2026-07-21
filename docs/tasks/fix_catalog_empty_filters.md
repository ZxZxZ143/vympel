Fix catalog product loading after the filter changes.



Current problem:



After the latest filter implementation, products stopped coming to the frontend. This is probably because backend filtering now checks all possible filters, including filters that were not selected by the user.



This is wrong.



Required behavior:



1\. The backend must apply only filters that are actually selected/sent by the frontend.

2\. If no filters are selected, the product listing endpoint must return the normal catalog product list.

3\. Empty filter arrays must be ignored.

4\. Null filter values must be ignored.

5\. Empty strings must be ignored.

6\. Missing filter keys must be ignored.

7\. Price filter must be applied only if `minPrice` or `maxPrice` is actually provided.

8\. Search filter must be applied only if search query is not blank.

9\. `watch\_detail` joins must be added only for selected detailed-characteristic filters.

10\. Do not require every product to have every possible `watch\_detail` characteristic.

11\. Do not inner join all characteristic tables by default, because this removes products when no filter is selected.

12\. If related-table filters are selected, join/filter only for those selected filter keys.

13\. Base product filters and `watch\_detail` filters must work together only when they are selected.

14\. Pagination and sorting must still work.

15\. The frontend must not send empty filters as active filters. Clean the query params/request payload before sending.



Expected logic:



```text

No filters selected:

&#x20; return all visible/catalog products with pagination and sorting



Only price selected:

&#x20; filter only by price



Only brand selected:

&#x20; filter only by brand



Only watch\_detail mechanism selected:

&#x20; join watch\_detail only for mechanism and filter by selected mechanism value



Several filters selected:

&#x20; apply only those selected filters together

```



Important:



Do not filter by every possible characteristic from metadata. Metadata is only for showing available filters. Actual product filtering must use only selected filters.



Fix both:



1\. Backend filter parsing/query building.

2\. Frontend request/query param generation if it sends empty filters.



Verification checklist:



\* catalog loads products when no filters are selected

\* catalog loads products after page refresh with no filters

\* catalog loads products with only sorting

\* catalog loads products with only pagination

\* catalog loads products with only search

\* catalog loads products with only price filter

\* catalog loads products with only base product filter

\* catalog loads products with only `watch\_detail` filter

\* combinations of selected filters work

\* empty arrays/null/blank filters do not remove products

\* backend does not join `watch\_detail` unless a related characteristic filter is selected

\* no duplicate products appear after joins

\* docs are updated



Update `docs/PROJECT\_SKILLS.md` with this permanent rule:



\* Product filtering must apply only explicitly selected filters. Empty, missing, null, or blank filter values must be ignored. Filter metadata must never be treated as active filters.



Final response:



```markdown

Summary:

\- \[what was fixed]



Root cause:

\- \[why products disappeared]



Backend:

\- \[how empty/unselected filters are now ignored]



Frontend:

\- \[how request params/payload were cleaned if needed]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed if relevant]

\- PROJECT\_SKILLS.md: \[what permanent rule was added]

```



