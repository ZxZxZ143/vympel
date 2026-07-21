You are working as a senior frontend/fullstack engineer on this project.



Implement a smart search overlay/dropdown like the attached screenshot, but adapted to the VYMPEL project design.



The search must show quick product results while typing, shift/focus visually to the center when active, and support typo-tolerant smart search.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current header search input.

5\. Inspect current catalog search logic.

6\. Inspect product card/list item components.

7\. Inspect existing filter/category dropdown panels, because the search overlay must match their visual style.

8\. Inspect backend search endpoints/repositories/services.

9\. Inspect localization files.

10\. Inspect `Text`, `Heading`, `Button`, icons, global tokens, and `globals.css`.



Follow project rules:



\* all user-facing text must be localized

\* use existing `Text`, `Heading`, `Button`, image/product components, and route helpers

\* use global design tokens/classes

\* do not hardcode raw UI strings in JSX/TSX

\* do not use arbitrary Tailwind values/raw hex if reusable tokens should exist

\* update `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md` after finishing



\---



\# Main Goal



Create a smart product search dropdown/overlay.



When the user focuses/clicks the search input:



1\. Search input becomes active.

2\. Search input visually shifts/expands toward the center of the header/content area.

3\. A search results panel opens below it.

4\. While typing, products appear in quick access.

5\. User can click a product and go to its product page.

6\. User can submit search and go to full catalog search results.

7\. Search must work even with typos where feasible.



Important:



Do not implement query suggestions or category recommendations.



The search panel must show only product quick results and useful search actions.



Do not show blocks like:



\* “Возможно вы ищете”

\* “Категории”

\* recommended queries

\* recommended categories



The UI should be inspired by the attached screenshot only in the product result layout and overlay behavior, but adapted to VYMPEL style.



\---



\# Part 1 — Search active state and positioning



When the user clicks/focuses the header search input:



1\. The search input should become visually active.

2\. The input should shift/expand toward the center.

3\. The active search state should look smooth and intentional.

4\. Existing header icons/navigation must not break.

5\. On blur/outside click, close the overlay if appropriate.

6\. Escape key should close the overlay.

7\. The input should keep typed text while focused.



Requirements:



\* preserve current header layout when search is not active

\* active search must not cause layout jumps/broken header

\* use CSS transitions if appropriate

\* use existing layout tokens

\* do not hardcode random widths if project has tokens/layout helpers



\---



\# Part 2 — Search overlay/panel design



The search dropdown/panel must match the visual language of existing filter/category dropdowns.



Use:



\* same panel surface style

\* same border/shadow/radius logic if used by filters/categories

\* same container alignment behavior

\* same typography system

\* same spacing rhythm

\* same scrollbar style if content overflows



The panel should feel like part of the same UI system as:



\* filter dropdown

\* category dropdown

\* sorting dropdown



Do not use a generic marketplace style copied directly from the screenshot.



Adapt it to VYMPEL.



\---



\# Part 3 — Quick product results



While typing, show product results in the panel.



The product result item layout should be similar to the product list in the screenshot:



Each product result should include:



\* product image thumbnail

\* product name

\* model/SKU if useful

\* collection/brand if available

\* current price

\* old price if backend/product DTO supports it

\* unavailable/out-of-stock indication if product is unavailable



Product item behavior:



1\. Clicking product result opens product detail page.

2\. Product image/title area should be clickable.

3\. Result item must use real product route helper.

4\. Do not create dead links.

5\. If product is out of stock, show it visually but mark it clearly.

6\. Product quick results should be limited, for example 5–8 products.



Use existing product/image formatting helpers where possible.



Do not duplicate full product card design; this is a compact search result row.



\---



\# Part 4 — Search panel states



Implement clean states:



\## Empty input



When input is focused but empty:



\* either show a calm empty prompt or show nothing inside the panel

\* do not show categories/query recommendations



Example localized text if needed:



```text id="g2o1ci"

Введите название, бренд или модель товара

```



\## Loading



When searching:



```text id="hcml9c"

Ищем товары...

```



Use project-style loading indicator/skeleton if available.



\## No results



When no products found:



```text id="k5zqya"

Ничего не найдено

Попробуйте изменить запрос.

```



Add action:



```text id="u1tg9b"

Перейти в каталог

```



or hide action if not needed.



\## Error



If search request fails:



```text id="vdbghv"

Не удалось выполнить поиск

Попробуйте ещё раз.

```



Add retry behavior if feasible.



All text must be localized.



\---



\# Part 5 — Full search submit behavior



When user presses Enter or clicks search action:



1\. Close search overlay.

2\. Redirect to catalog search page.

3\. Apply search query.

4\. Reset page to 1.

5\. Clear filters unless the project intentionally supports scoped search.



Example:



```text id="98gtsc"

/catalog?search=romanson\&page=1

```



Use the actual route/query format already used by the project.



Search from any page must redirect to catalog.



This includes:



\* home

\* catalog

\* product detail

\* brand page

\* favorites

\* cart

\* info pages



\---



\# Part 6 — Smart typo-tolerant backend search



Implement smart search on the backend if it is not already correct.



Search must work with typos as much as reasonably possible.



Search should search across:



\* product localized name

\* model

\* SKU

\* brand

\* collection

\* category if useful

\* watch details if useful and feasible



Preferred PostgreSQL approach:



1\. Use `pg\_trgm` trigram similarity if PostgreSQL is used.

2\. Add migration if needed:



```sql id="b77tfp"

CREATE EXTENSION IF NOT EXISTS pg\_trgm;

```



3\. Add suitable indexes if useful and safe.

4\. Use similarity/ILIKE combination for typo tolerance.

5\. Tune threshold reasonably.



Alternative fallback:



\* normalized ILIKE search

\* token-based search

\* ё/е normalization

\* lower/trim/multiple-space normalization



Important:



If robust fuzzy search is too risky in this pass, implement a clean simple search fallback and document what remains.



Do not break existing catalog search.



\---



\# Part 7 — Quick search endpoint



Add or reuse a backend endpoint for quick search.



Possible endpoint:



```text id="9cd6q9"

GET /api/catalog/search/quick?q=...

```



or follow existing backend route conventions.



Requirements:



1\. Accept search query.

2\. Return limited product results.

3\. Do not return huge payloads.

4\. Return fields needed for compact result:



&#x20;  \* id

&#x20;  \* slug

&#x20;  \* name

&#x20;  \* model

&#x20;  \* SKU if useful

&#x20;  \* brand

&#x20;  \* collection if useful

&#x20;  \* price

&#x20;  \* old price if exists

&#x20;  \* image

&#x20;  \* stock/availability

5\. Search must be public-safe.

6\. Empty/blank query should return empty list, not entire catalog.

7\. Validate and normalize query.

8\. Avoid SQL injection.

9\. Keep performance reasonable.



\---



\# Part 8 — Frontend search implementation



Frontend requirements:



1\. Debounce search requests while typing.

2\. Do not send request for blank/too short queries unless project wants it.

3\. Cancel/ignore stale responses.

4\. Avoid infinite render/refetch loops.

5\. Use stable query keys if React Query is used.

6\. Keep input controlled correctly.

7\. Clear button should clear query and results.

8\. Escape closes overlay.

9\. Outside click closes overlay.

10\. Product click closes overlay and navigates.



Recommended minimum query length:



```text id="cno69s"

2 characters

```



or follow project UX.



\---



\# Part 9 — Do not show suggestions/categories



Important strict requirement:



Do not implement suggestion/category blocks like the screenshot’s left column.



Do not show:



\* “Возможно вы ищете”

\* recommended queries

\* category recommendations

\* category list



Only show quick product results and search states.



If a “show all results” button is useful, it can be added at the bottom:



```text id="zy6hwa"

Все результаты поиска

```



or:



```text id="0opf4f"

Показать все товары

```



It must navigate to catalog search with the query.



\---



\# Part 10 — Styling requirements



The search overlay must use VYMPEL design.



Use existing:



\* Inter typography

\* project text colors

\* product image styling

\* subtle borders

\* dropdown panel styles from filters/categories

\* global tokens



Do not leave generic marketplace or default shadcn-like styling.



Compact product row should be clean:



\* image on the left

\* text/price on the right

\* clear vertical spacing

\* subtle divider between rows if consistent with project

\* hover state

\* clickable affordance



The panel must be responsive.



On mobile/small screens:



\* active search should not overflow viewport

\* panel should fit screen width

\* results should remain readable



\---



\# Part 11 — Localization



Add localization keys for:



\* search placeholder if needed

\* loading search

\* no results

\* search error

\* show all results

\* clear search label if needed

\* unavailable/out-of-stock label if shown

\* any accessibility labels



Do not hardcode Russian strings directly in components.



\---



\# Part 12 — Analytics integration



If product analytics tracking exists:



1\. Track quick search submit if analytics supports it.

2\. Track product click from search if useful.

3\. Tracking failure must not break search.



Do not add analytics if it makes the task too risky, but document if skipped.



\---



\# Part 13 — Verification checklist



Before finishing, verify:



\* clicking search input activates it

\* search input shifts/expands toward center

\* overlay opens below search input

\* overlay style matches filter/category dropdown style

\* typing query shows product quick results

\* no query/category suggestions are shown

\* product result row includes image, name, price, and useful metadata

\* product result click opens product detail page

\* Enter/search submit opens catalog search

\* search from product page redirects to catalog

\* filters are cleared on full search submit

\* page resets to 1

\* typo-tolerant search works if implemented

\* fallback search is documented if fuzzy was not feasible

\* empty state works

\* loading state works

\* error state works

\* clear button works

\* Escape closes overlay

\* outside click closes overlay

\* no infinite request/render loop

\* all text localized

\* no raw hardcoded UI strings

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* search overlay component location

\* quick search API endpoint

\* full search route/query behavior

\* backend smart search implementation

\* route helper behavior for search

\* debounce/query behavior

\* product result item component if added



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Header search opens a VYMPEL-styled quick product search overlay.

\* Quick search must show product results, not query/category suggestions.

\* Search submit from any page redirects to catalog search.

\* Quick search requests must be debounced and must not cause render/refetch loops.

\* Smart search should support typo tolerance where feasible.

\* Search overlay styling must reuse filter/category dropdown visual patterns.

\* Product result rows must use real product routes and real product data.



\---



\# Final response required



```markdown id="yhl9oe"

Summary:

\- \[what changed]



Search UI:

\- \[active input, overlay, quick results]



Backend search:

\- \[quick search endpoint and fuzzy/search logic]



Navigation:

\- \[full search submit behavior]



Styling:

\- \[how overlay matches project/filter dropdown style]



Localization:

\- \[keys/files added]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, limitations, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



