You are working as a senior frontend engineer.



Fix the mobile catalog search placement and pagination layout according to the attached screenshots.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the mobile catalog toolbar implementation.

5\. Inspect the smart search component used in catalog.

6\. Inspect the pagination component.

7\. Follow existing localization, route-helper, `Text`, `Button`, and global design token rules.



\---



\# Part 1 — Mobile catalog search must stay inside the toolbar block



Current problem:



When the search opens in the catalog, it appears too high and overlaps the header/logo area. This is wrong.



Required behavior:



1\. The mobile search must be inside the same block where filter and sort icons are located.



2\. The search must not jump to the very top of the page/header.



3\. The search must not overlap the logo/header/language area.



4\. When inactive, the toolbar contains:



&#x20;  \* filter icon

&#x20;  \* sort icon

&#x20;  \* search icon



5\. When the user opens search:



&#x20;  \* the search expands inside this same toolbar block

&#x20;  \* it occupies almost all available width of the toolbar block

&#x20;  \* it keeps small inner margins from the left/right edges

&#x20;  \* filter/sort icons may hide or collapse while search is active if needed

&#x20;  \* search input and dropdown must remain visually connected

&#x20;  \* search dropdown must appear below the input, still attached to the toolbar/search block



Expected mobile behavior:



```text

Toolbar block:

\[filter] \[sort]                         \[search]



After search click:

\[ search input almost full width inside toolbar block ]

\[ connected search dropdown under it ]

```



Important:



\* Do not position active catalog search relative to the page header.

\* Do not use fixed top values that push the search into the logo/header.

\* Position it relative to the catalog toolbar container.

\* Keep current smart search functionality:



&#x20; \* quick product results

&#x20; \* submit redirects to catalog search

&#x20; \* clear button

&#x20; \* loading/empty/error states

&#x20; \* outside click / Escape close



\---



\# Part 2 — Active search width and spacing



When active in the catalog toolbar:



1\. Search must be wide.

2\. Search must take almost all available space inside the toolbar container.

3\. It must have only small horizontal padding/margins from the toolbar edges.

4\. It must not overflow the viewport.

5\. It must not create horizontal scroll.

6\. It must keep correct border-radius.

7\. It must keep VYMPEL styling.



Use responsive CSS/tokens, not random hardcoded one-off styles.



\---



\# Part 3 — Pagination layout with justify-between



Current problem:



Pagination buttons are standing next to each other in the middle/left area.



Required behavior:



Pagination must be split into two groups:



1\. Range buttons on the left.

2\. Page number buttons on the right.



These groups must be placed at opposite edges of the available page width using `justify-between` or equivalent layout.



Expected structure:



```text

\[0-8] \[9-15]                         \[1] \[2]

```



Requirements:



1\. Pagination container must be one row.

2\. Left group aligns to the left edge of the content/container.

3\. Right group aligns to the right edge of the content/container.

4\. Use `justify-between`.

5\. Buttons inside each group should keep proper spacing.

6\. It must work on mobile and desktop.

7\. If there are too many buttons on very small screens, use internal horizontal scrolling inside groups, not body overflow.

8\. Do not allow pagination to wrap into multiple awkward rows.

9\. Changing pagination page must still scroll to the top/product list as previously required.



\---



\# Verification checklist



Before finishing, verify:



\## Catalog search



\* inactive toolbar shows filter/sort/search icons in one row

\* clicking search expands it inside the toolbar block

\* search does not move to the top/header/logo area

\* search occupies almost all toolbar width with small side margins

\* search dropdown connects to input

\* search does not overflow at 320px

\* quick search still works

\* full search submit still works



\## Pagination



\* range buttons are on the left

\* page number buttons are on the right

\* pagination uses justify-between/equivalent

\* pagination remains one row

\* no body horizontal overflow

\* page change still scrolls to top/product list



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` if catalog toolbar/search or pagination structure changed.



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Mobile catalog search must expand inside the catalog toolbar block, not into the page header.

\* Active catalog search should occupy almost all toolbar width with safe inner margins.

\* Pagination should use two groups: range controls on the left and page controls on the right, separated with `justify-between`.

\* Pagination must remain one row and must not create body horizontal overflow.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Catalog search:

\- \[how placement/active width was fixed]



Pagination:

\- \[how justify-between grouping was implemented]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



