You are working as a senior frontend/fullstack engineer.



Fix catalog behavior for accessories and interior clocks.



This is a focused task. Do not rewrite the whole catalog.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect current catalog category logic.

5\. Inspect filters/sorting/category toolbar.

6\. Inspect category hero/banner rendering.

7\. Inspect existing assets:



&#x20;  \* `accessories\_hero\_banner.png`

&#x20;  \* `interior\_hero\_banner.png`

8\. Follow existing localization, route helpers, `Text`, `Heading`, `Button`, and design-token rules.

9\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Main task



Fix category-specific catalog UI:



1\. Accessories should not have normal product filters.



2\. Accessories should show simple gender/category split:



&#x20;  \* Женские

&#x20;  \* Мужские



3\. Accessories must have its own hero banner:



&#x20;  \* `accessories\_hero\_banner.png`



4\. Interior clocks must have their own hero banner:



&#x20;  \* `interior\_hero\_banner.png`



\---



\# Part 1 — Accessories catalog toolbar



Current issue:



On accessories page, the toolbar still shows generic filters like:



```text

Сортировка

Женские

Мужские

```



or filter UI that is not appropriate for accessories.



Required behavior:



1\. Remove normal filters for accessories.



2\. Do not show the filter button/panel for accessories.



3\. Accessories page should show only simple split controls:



&#x20;  \* `Женские`

&#x20;  \* `Мужские`



4\. These controls should work as category/gender selection for accessories.



5\. They should be styled in the same catalog navigation style.



6\. Sorting can remain if it makes sense for accessories.



7\. Search can remain if it is part of the catalog toolbar.



8\. Do not show irrelevant watch filters for accessories.



Expected accessories toolbar behavior:



```text

\[Сортировка] \[Женские] \[Мужские] \[Поиск]

```



or the closest layout based on existing toolbar design, but without the full filters panel.



\---



\# Part 2 — Accessories filtering logic



Accessories split must work.



Required:



1\. Clicking `Женские` shows women’s accessories.

2\. Clicking `Мужские` shows men’s accessories.

3\. Active state should be visually clear.

4\. URL/query params should update if current catalog architecture uses URL state.

5\. Product list should reset to page 1 when switching.

6\. If no products exist, show existing empty state.

7\. Do not break global search.



If accessories do not currently have a proper gender field, inspect the backend/product model and use the existing field if available. If the field is missing, add the minimal backend/frontend support needed.



\---



\# Part 3 — Accessories hero banner



For accessories catalog/category page:



1\. Use `accessories\_hero\_banner.png`.

2\. Banner must render as category hero/banner.

3\. It should match existing catalog banner sizing and responsive behavior.

4\. If CMS backend provides a banner for accessories, use CMS banner first.

5\. If CMS returns nothing, fallback to `accessories\_hero\_banner.png`.

6\. Do not use wristwatch/interior banner for accessories.



Fallback priority:



```text

1\. CMS accessories banner

2\. accessories\_hero\_banner.png

```



\---



\# Part 4 — Interior clocks hero banner



For interior clocks category page:



1\. Use `interior\_hero\_banner.png`.

2\. Banner must render as category hero/banner.

3\. It should match existing catalog banner sizing and responsive behavior.

4\. If CMS backend provides an interior clocks banner, use CMS banner first.

5\. If CMS returns nothing, fallback to `interior\_hero\_banner.png`.

6\. Do not use wristwatch/accessories banner for interior clocks.



Fallback priority:



```text

1\. CMS interior clocks banner

2\. interior\_hero\_banner.png

```



\---



\# Part 5 — Category-specific filter rules



Ensure catalog has correct category behavior:



\## Wristwatch categories



Keep normal watch filters for:



```text

Наручные часы

Классические часы

Спортивные часы

Дайверские часы

Хронографы

Детские часы

```



These can keep inherited wristwatch filters.



\## Interior clocks



Interior clocks must use their own characteristics/filters if implemented.



Do not show wristwatch filters there.



\## Accessories



Accessories must not show the full filter panel.



Only show simple split:



```text

Женские

Мужские

```



\---



\# Part 6 — Mobile behavior



On mobile:



1\. Accessories page must also not show the full filters drawer.



2\. Show clean gender split controls or category chips:



&#x20;  \* Женские

&#x20;  \* Мужские



3\. Banner must use accessories banner.



4\. Interior clocks page must use interior banner.



5\. No horizontal overflow.



6\. Controls must be touch-friendly.



\---



\# Verification checklist



Before finishing, verify:



\## Accessories



\* no full filter panel/button appears

\* `Женские` works

\* `Мужские` works

\* sorting/search still work if expected

\* accessories banner is `accessories\_hero\_banner.png` when CMS has no banner

\* CMS banner overrides fallback if available

\* mobile accessories layout works



\## Interior clocks



\* banner is `interior\_hero\_banner.png` when CMS has no banner

\* CMS banner overrides fallback if available

\* interior clocks do not use accessories/watch banner

\* mobile interior layout works



\## Other categories



\* wristwatch filters still work

\* child watch categories still inherit correct filters

\* catalog search still works globally

\* no unrelated catalog regressions



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* accessories catalog behavior

\* accessories gender split

\* accessories banner fallback

\* interior clocks banner fallback

\* category-specific filter rules



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Accessories must not use the full watch filter panel.

\* Accessories catalog should use simple gender split controls: `Женские` and `Мужские`.

\* Accessories banner fallback is `accessories\_hero\_banner.png`.

\* Interior clocks banner fallback is `interior\_hero\_banner.png`.

\* CMS category banners override local fallback assets when available.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Accessories:

\- \[filters removed / gender split behavior]



Banners:

\- \[accessories/interior banner behavior]



Catalog:

\- \[category-specific filter rules]



Mobile:

\- \[mobile behavior]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



