You are working as a senior frontend engineer.



Fix the catalog breadcrumbs, product/card width, filter/category/sort dropdown sizes, and active search overlay behavior according to the attached screenshots.



This is a focused UI regression fix. Do not rewrite the whole catalog. Inspect the current implementation, find the exact layout causes, and fix them safely.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the attached screenshots carefully.

5\. Inspect catalog breadcrumbs component.

6\. Inspect product card/grid component.

7\. Inspect catalog toolbar.

8\. Inspect category dropdown.

9\. Inspect filter dropdown.

10\. Inspect sorting dropdown.

11\. Inspect smart search component in catalog.

12\. Follow existing localization, `Text`, `Heading`, `Button`, route helpers, and global design token rules.

13\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Current problems



The screenshots show these issues:



1\. Breadcrumb text has wrong color/effects and does not match required style.

2\. Breadcrumb text must be black, weight 300, font size 20px.

3\. Product/card block is too wide and stretches almost across the whole page.

4\. Product card must not be full-width.

5\. Product card should take maximum one third of the parent block on desktop.

6\. Filter dropdown is too narrow and does not match the intended full-width panel design.

7\. Category and sorting dropdowns have the same layout problem.

8\. Filter/category/sort dropdown blocks should use the full width of the toolbar/content block where appropriate.

9\. Search active state is mispositioned.

10\. When search is activated, it must slide/expand to the center and cover the whole catalog toolbar/header row, while staying on the same vertical height.



\---



\# Part 1 — Breadcrumb styling



Fix catalog/product/brand breadcrumbs styling.



Required style:



```css

font-size: 20px;

font-weight: 300;

color: #000000;

```



Behavior:



1\. Breadcrumb text must be plain black.

2\. Remove blue/gray highlight effects unless they are a very subtle hover state.

3\. No active breadcrumb color emphasis.

4\. No bold active item.

5\. Separators must stay visually clean.

6\. Breadcrumbs must remain readable and not overflow.

7\. If breadcrumbs do not fit, use internal horizontal scrolling, not body horizontal overflow.



Use global typography tokens/classes if they exist. If not, add reusable token/class.



Do not hardcode random inline styles.



\---



\# Part 2 — Product card width / product grid



Current problem:



The product card/product block becomes too wide and takes almost the full page width.



Required behavior on desktop:



1\. Product card must not stretch full-width.

2\. Product card width must be controlled by product grid.

3\. Product card should take maximum one third of the parent block.

4\. In a normal desktop catalog/product grid, there should be up to 3 cards per row unless the existing project grid uses a different intended count.

5\. Product image area must remain proportional.

6\. No huge empty blank card area.

7\. Cards must align from the start of the content area.

8\. Responsive behavior must remain correct on tablet/mobile.



Recommended desktop layout:



```css

grid-template-columns: repeat(3, minmax(0, 1fr));

```



or the project’s existing responsive grid pattern.



If the product card component itself has `width: 100%`, that is fine only inside a grid column. The parent grid must control the column width.



Check and fix:



\* accidental `width: 100vw`

\* accidental `grid-column: 1 / -1`

\* accidental `flex: 1 1 100%`

\* wrong parent container width

\* missing grid template

\* card being rendered outside grid

\* image fallback area forcing huge height/width



\---



\# Part 3 — Filter dropdown full-width panel



Current problem:



The filter dropdown became a narrow vertical panel, while the intended desktop design is a wide dropdown panel like in the reference screenshot.



Required desktop behavior:



1\. Filter dropdown must open as a wide panel across the catalog content/toolbar block.

2\. It should match the provided reference:



&#x20;  \* full available width inside catalog content area

&#x20;  \* left column with filter names

&#x20;  \* right area with filter values

&#x20;  \* clean spacing

&#x20;  \* subtle border

&#x20;  \* rounded corners

&#x20;  \* light surface

3\. Filter labels must not be clipped.

4\. Values must not be cramped.

5\. The panel must align under the catalog toolbar/header block.

6\. The panel must not be only as wide as the trigger button.

7\. The panel must not randomly cover product cards in a broken way.

8\. Z-index must be correct.



Expected:



```text

\[toolbar: categories / filters / sort / search]

\[wide filter panel across content width]

```



Not:



```text

\[filters]

\[narrow 150px vertical dropdown]

```



\---



\# Part 4 — Category dropdown full-width behavior



Apply the same principle to the category dropdown.



Required:



1\. Category dropdown must use the intended wide panel layout on desktop.

2\. Root categories and child categories must be displayed with proper spacing.

3\. It should not be a narrow vertical dropdown if the design expects a full panel.

4\. Active category underline/selection must look clean.

5\. Labels must not be clipped.

6\. Nested category navigation must still work.

7\. Selecting category must still update catalog and reset page to 1.



\---



\# Part 5 — Sorting dropdown layout



Sorting dropdown also needs cleanup.



Required:



1\. Sorting dropdown must not be clipped or too narrow.

2\. It should look visually consistent with filters/categories.

3\. Sort options must be readable.

4\. If sort dropdown is small by design, it still must have enough width for labels.

5\. Options should not wrap awkwardly unless unavoidable.

6\. Selected sort state must still work.

7\. Sort option text should stay concise.



\---



\# Part 6 — Shared dropdown layout rules



Do not fix each dropdown with unrelated hacks.



Create or reuse a shared catalog dropdown/panel pattern.



Recommended:



```text

CatalogToolbarDropdown

CatalogWidePanel

CatalogPopoverPanel

```



or follow existing project architecture.



Required shared rules:



1\. Desktop filter/category panels can be wide/full-content width.

2\. Sorting can be compact but still readable.

3\. Mobile can use drawer/bottom sheet/icon-only toolbar if already implemented.

4\. Dropdowns must align consistently with catalog toolbar.

5\. Dropdowns must not clip text.

6\. Dropdowns must not create horizontal overflow.

7\. All panels must use VYMPEL design tokens.



\---



\# Part 7 — Active search overlay behavior



Current problem:



The active catalog search is placed incorrectly and does not cover the toolbar/header row as intended.



Required behavior:



1\. When search is activated, it must smoothly slide/expand to the center.

2\. It must cover the whole catalog toolbar/header row.

3\. It must remain on the same vertical height as the toolbar.

4\. It must not jump upward or downward.

5\. It must not overlap breadcrumbs in a broken way.

6\. It must visually replace/cover category/filter/sort controls while active.

7\. It must occupy most of the available toolbar width.

8\. It must keep small safe side margins.

9\. Search input and dropdown must remain visually connected.

10\. Search dropdown must open below the active search input.

11\. Quick search behavior must continue working.

12\. Submit must still apply catalog search / redirect to catalog search.

13\. Escape and outside click must close search.



Expected behavior:



```text

Normal:

\[Category] \[Filters] \[Sort]                         \[Search]



Search active:

\[            centered wide active search overlay             ]

\[            connected search dropdown below                 ]

```



Important:



\* Do not position search relative to the page top/header logo.

\* Position it relative to the catalog toolbar row.

\* It should stay at the same toolbar height.

\* Use proper `position`, `z-index`, and transform/width transition.

\* Do not use fragile magic top values.



\---



\# Part 8 — Responsive rules



Desktop:



\* breadcrumbs: 20px, black, weight 300

\* cards: max one third of parent block

\* filters/categories: wide panels

\* search active: centered overlay covering toolbar row



Mobile:



\* preserve existing mobile toolbar behavior unless affected

\* no horizontal overflow

\* dropdowns can remain mobile drawer/bottom sheet if already implemented

\* breadcrumbs can use horizontal scroll if needed

\* cards must remain responsive



Do not break mobile while fixing desktop.



\---



\# Part 9 — Verification checklist



Before finishing, verify:



\## Breadcrumbs



\* text is black

\* font size is 20px

\* font weight is 300

\* no active breadcrumb highlight

\* breadcrumbs remain readable

\* no body horizontal overflow



\## Product cards



\* card is not full-width on desktop

\* card takes maximum one third of parent block

\* product grid has proper columns

\* image fallback does not force huge width/height

\* mobile card layout still works



\## Filters



\* filter panel is wide/full-content width like the reference

\* filter labels are not clipped

\* filter values are readable

\* panel aligns correctly under toolbar

\* filter logic still works



\## Categories



\* category panel is wide/full-content width where intended

\* nested categories still work

\* selected category still applies correctly



\## Sorting



\* sort dropdown is readable

\* labels do not wrap badly

\* selected sorting still works



\## Search



\* active search slides/expands to center

\* active search covers whole toolbar row

\* active search stays at same vertical height

\* active search does not jump into page header

\* dropdown is connected to input

\* quick search still works

\* submit still works



\## Technical



\* no layout hacks that break other pages

\* no hardcoded user-facing text

\* no long-running dev/start/watch commands as checks

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* breadcrumb typography rule

\* catalog product grid/card width behavior

\* catalog dropdown/panel layout structure

\* active search overlay behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Breadcrumbs must use plain black 20px text with font-weight 300 unless a specific page design says otherwise.

\* Product cards must be constrained by the grid and must not stretch full-width on desktop.

\* Desktop catalog filter/category panels should use the intended wide panel layout, not narrow trigger-width dropdowns.

\* Active catalog search must expand inside the catalog toolbar row, cover the toolbar controls, and remain at the same vertical height.

\* Catalog dropdowns must not clip labels or create horizontal overflow.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Breadcrumbs:

\- \[styling fixes]



Product grid/cards:

\- \[width/grid fixes]



Catalog dropdowns:

\- \[filter/category/sort panel fixes]



Search:

\- \[active overlay behavior fixes]



Responsive:

\- \[desktop/mobile behavior]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



