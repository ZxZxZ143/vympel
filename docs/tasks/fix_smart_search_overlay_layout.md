Fix and extend the smart search UI behavior.



Current problem:



The active search input and search dropdown/panel are visually separated. There is an unwanted gap between the search input and the dropdown panel. The search should visually merge with the search panel like one connected component.



Also, when search is active, it must overlay/cover the whole header/search row area so that no other header elements visually stick out or overlap incorrectly.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current header search component.

5\. Inspect the current smart search overlay/dropdown implementation.

6\. Inspect search usage in header, catalog page, and product page.

7\. Inspect existing filter/category dropdown panel styles.

8\. Follow existing localization, `Text`, `Button`, global token, and design system rules.



\---



\# Main task



Fix the active search UI so it behaves like one clean search overlay.



Required behavior:



1\. There must be no visual gap between the active search input and the search dropdown/panel.

2\. The search input and dropdown must visually merge into one connected component.

3\. When search is active, the search component must cover/overlay the full search/header row area so that no icons, menu items, text, borders, or other UI elements stick out behind it.

4\. Search overlay must have correct `z-index` and positioning.

5\. Search overlay must not break header layout when inactive.

6\. Search overlay must close on outside click and Escape.

7\. Search overlay must remain responsive.



\---



\# Visual requirements



Use the attached screenshot as the current bug reference.



Fix this:



```text id="p84evs"

\[search input]

\-- unwanted gap --

\[search dropdown]

```



Expected:



```text id="4t3t21"

\[search input connected directly to dropdown]

```



The active search input should look like the top part of the search panel.



The dropdown should start directly under the input without white/empty spacing.



The border/radius must be adjusted so the merged component looks intentional:



\* top input can keep top rounded corners

\* dropdown can connect under it

\* avoid double borders between input and dropdown

\* panel style must match existing filter/category dropdown visual language



Do not leave default/generic styling.



\---



\# Overlay behavior



When search is active:



1\. The active search area must cover the whole row where the search is placed.

2\. Other header elements must not visually overlap or appear above the active search.

3\. Use a wrapper/overlay layer if needed.

4\. Set proper `position`, `z-index`, width, and background according to project layout.

5\. The overlay must stay inside the page/header design and not break the viewport.

6\. On mobile/small screens, the active search should use available width and remain usable.



\---



\# Search on different pages



The same smart search behavior must work in:



1\. Global header.

2\. Catalog page.

3\. Product detail page.



But it must be adapted to each page UI.



Requirements:



\* reuse the same search logic/hook where possible

\* do not duplicate unrelated search implementations

\* catalog search must visually fit the catalog toolbar/page design

\* product page search must visually fit the product page/header design

\* all versions must use the same backend quick search and full search submit behavior

\* all versions must redirect full search submit to catalog search

\* all versions must show quick product results in the same style



If there are different search components already, refactor toward a shared component with layout variants:



```text id="r0k1n8"

SmartSearch variant="header"

SmartSearch variant="catalog"

SmartSearch variant="product"

```



or follow the project’s component architecture.



\---



\# Search functionality must remain working



Do not break the existing smart search behavior.



Keep:



1\. Quick product results while typing.

2\. Product rows with image, name, metadata, price.

3\. Product result click opens product page.

4\. Enter/search submit redirects to catalog.

5\. Search from product page redirects to catalog.

6\. Filters are cleared on full search submit.

7\. Page resets to 1.

8\. Typo-tolerant search if already implemented.

9\. Loading/empty/error states.

10\. Escape/outside-click closing.

11\. No query/category suggestions.



\---



\# Frontend technical checks



Check and fix:



1\. Incorrect margin/padding between input and dropdown.

2\. Dropdown being positioned relative to the wrong parent.

3\. Header row height causing visible gap.

4\. Wrong `top` value on dropdown.

5\. Wrong `z-index`.

6\. Search overlay not covering sibling elements.

7\. Parent container `overflow` clipping the dropdown.

8\. Double borders between input and panel.

9\. Search input not using full overlay width when active.

10\. Catalog/product page search using old component instead of smart search.



\---



\# Styling rules



Use existing global tokens/classes.



Do not add arbitrary Tailwind values or raw hex colors if reusable values should exist.



If new reusable styling is needed, add it to `globals.css` or the existing design token system.



The final search UI must look consistent with:



\* filter dropdown

\* category dropdown

\* catalog toolbar

\* product page header/search

\* overall VYMPEL design



\---



\# Verification checklist



Before finishing, verify:



\* no gap exists between active search input and dropdown

\* search input and dropdown visually merge

\* active search overlays the full row area

\* no header icons/text stick out above/behind active search

\* z-index is correct

\* header search works

\* catalog search works

\* product page search works

\* full search submit redirects to catalog

\* product click from quick search works

\* Escape closes search

\* outside click closes search

\* mobile/responsive layout is not broken

\* no infinite render/refetch loop

\* all text is localized

\* docs are updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* shared smart search component location

\* search variants/usage in header/catalog/product page

\* overlay positioning behavior

\* quick search API usage if changed



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Smart search input and dropdown must visually merge without gaps.

\* Active search must overlay the full row area so no sibling UI sticks out.

\* Header, catalog, and product page search must reuse shared smart search logic with layout variants where needed.

\* Search submit from any page must redirect to catalog search.

\* Smart search overlay must reuse filter/category dropdown visual language.



\---



\# Final response required



```markdown id="85gk1e"

Summary:

\- \[what changed]



Search UI:

\- \[how gap was removed and input/panel merged]



Overlay behavior:

\- \[how full-row overlay/z-index was fixed]



Search variants:

\- \[header/catalog/product page behavior]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



