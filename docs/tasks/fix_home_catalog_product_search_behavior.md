You are working as a senior frontend engineer and UI/UX designer.



Fix the search behavior and animation on the home page, catalog page, and product page.



This task is only about search design, positioning, animation, and consistency between pages. Do not refactor unrelated catalog/product logic.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current search component used on:



&#x20;  \* home page

&#x20;  \* catalog page

&#x20;  \* product page

5\. Inspect the catalog toolbar/search positioning.

6\. Inspect the product page header/search positioning.

7\. Inspect current search animation classes/styles.

8\. Follow existing localization, `Text`, `Button`, icon, route-helper, and global design token rules.

9\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Current problems



\## Home page search



Current behavior is wrong.



When search is activated on the home page, it becomes a small centered card/dropdown. This is not the desired behavior.



Required behavior:



1\. Search must increase in size.

2\. Search must smoothly move to the center.

3\. Search must visually cover the whole row where it is located.

4\. The search component itself must not become too large.

5\. It should not stretch edge-to-edge across the full screen.

6\. It should stay visually balanced and premium.

7\. The parent row/block must not shrink or jump.

8\. Other row elements should be covered by the active search overlay, not pushed around.

9\. The active search should remain on the same visual height/row.



Expected behavior:



```text

Inactive:

\[other header/row content]                         \[small search]



Active:

\[             centered expanded search overlay             ]

```



The active search should feel like it expands and slides into the center, not like a separate popup appears randomly.



\---



\# Search size



The active search must be prominent but not huge.



Design guidance:



1\. On desktop, active search should be approximately around 60–70% of the available row width.

2\. This is not a hard fixed value for every screen, but the search should not become full-width unless the viewport is small.

3\. On tablet/mobile, adapt naturally without overflow.

4\. Search should stay readable and comfortable.



Do not use full-width search across the entire block on desktop.



\---



\# Animation requirements



Search activation must have a polished animation.



Required:



1\. Smooth open animation.

2\. Smooth close animation.

3\. Smooth movement to center.

4\. Smooth width increase.

5\. No jerky jump.

6\. No layout shift of parent block.

7\. No flicker.

8\. No sudden height collapse.

9\. No shrinking of surrounding toolbar/block.

10\. Use subtle easing and project animation tokens if available.



Recommended animation properties:



```text

transform

opacity

width / max-width

scale

box-shadow

```



Avoid fragile top/left magic values that break between pages.



\---



\# Catalog search spacing



On the catalog page, active/inactive search placement must be adjusted.



Required spacing for catalog search:



```text

top offset: 19px

right offset: 38px

```



Interpret this as the visual placement of the search within the catalog toolbar/header block.



Requirements:



1\. Search should have 19px spacing from the top of its catalog toolbar/block.

2\. Search should have 38px spacing from the right edge of its catalog toolbar/block.

3\. Search must not stick to the top edge.

4\. Search must not touch the right edge.

5\. The spacing should be implemented with stable layout styles/tokens, not fragile hacks.

6\. On smaller screens, spacing can adapt if necessary to prevent overflow, but desktop/catalog layout must follow this.



\---



\# Product page search behavior



The search on the product page must behave the same as catalog search.



Required:



1\. Product page search must use the same active animation as catalog search.

2\. Product page search must move/expand to the center the same way.

3\. Product page search must not become a random centered popup.

4\. Product page search must not stretch too wide.

5\. Product page search must keep the same visual design, spacing logic, and dropdown behavior as catalog search.

6\. Quick search and full search submit must continue working.



Preferred structure:



Use one shared component/variant system:



```text

SmartSearch variant="home"

SmartSearch variant="catalog"

SmartSearch variant="product"

```



or follow the current project architecture.



The logic should be shared. Only page-specific placement/spacing should differ.



\---



\# Search dropdown/panel



If active search opens a dropdown/panel:



1\. It must remain visually connected to the input.

2\. It must follow the active search width.

3\. It must align with the centered active search.

4\. It must not make the parent block shrink.

5\. It must not overlap header/logo in a broken way.

6\. It must not cover content in an ugly way.

7\. It should animate smoothly with the input.



The dropdown must keep:



\* quick product results

\* loading state

\* empty state

\* error state

\* full search submit

\* outside click close

\* Escape close



\---



\# Layout stability



Very important:



When search opens:



1\. The parent block must keep its size.

2\. The parent block must not shrink.

3\. The toolbar/header row must not collapse.

4\. Other elements must not jump.

5\. Search should be positioned as an overlay inside the same row/block.

6\. Search can visually cover other controls while active.

7\. Closing search should restore the row smoothly.



Do not solve this by moving search outside the current layout into an unrelated fixed top position.



\---



\# Visual design



Search must match VYMPEL style:



1\. Rounded corners.

2\. Clean light background.

3\. Subtle border.

4\. Premium minimal appearance.

5\. Search icon aligned correctly.

6\. Search button aligned correctly.

7\. Placeholder text readable.

8\. Helper text readable.

9\. Internal spacing balanced.

10\. No cramped text.



The active state should feel like a polished e-commerce search interaction.



\---



\# Page-specific requirements



\## Home page



Fix wrong current behavior.



Search must:



\* expand

\* move to center

\* cover the row

\* not become a small floating card

\* not become too large

\* keep smooth animation



\## Catalog page



Search must:



\* keep top offset 19px

\* keep right offset 38px

\* active state should be centered and polished

\* not shrink parent block

\* keep current catalog quick search behavior



\## Product page



Search must:



\* behave like catalog search

\* use same active animation

\* use same design language

\* keep full search submit behavior



\---



\# Responsive behavior



Desktop:



\* active search around 60–70% visual width

\* centered

\* parent row stable



Tablet:



\* active search can take more width if needed

\* no overflow

\* animation remains smooth



Mobile:



\* active search should remain usable

\* avoid horizontal overflow

\* avoid overlapping unusable controls

\* keep mobile search UX clean



Do not break existing mobile adaptation.



\---



\# Verification checklist



Before finishing, verify:



\## Home page



\* search no longer opens as a small random centered card

\* search expands smoothly

\* search moves to center

\* search covers its row

\* search is not too large

\* parent row does not shrink or jump



\## Catalog page



\* search has 19px top spacing

\* search has 38px right spacing

\* active search stays in the catalog toolbar area

\* active search is centered and balanced

\* search does not stretch full width

\* dropdown remains connected



\## Product page



\* search behavior matches catalog

\* animation matches catalog

\* quick search still works

\* full submit still redirects/applies catalog search



\## General



\* no layout jumps

\* no parent block shrinking

\* no header overlap

\* no flicker

\* no horizontal overflow

\* no unrelated regressions

\* all search text remains localized

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* shared search component/variant structure

\* home/catalog/product search behavior

\* catalog search spacing rule

\* active search overlay behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Home, catalog, and product search must use consistent centered expansion behavior.

\* Active search should overlay its own row/block without resizing the parent.

\* Active search should be prominent but not edge-to-edge on desktop.

\* Catalog search should keep 19px top and 38px right visual spacing in its toolbar/block.

\* Product page search should follow catalog search behavior.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Home search:

\- \[behavior/animation fix]



Catalog search:

\- \[19px top / 38px right spacing and active state]



Product search:

\- \[matched catalog behavior]



Animation:

\- \[open/close improvements]



Layout stability:

\- \[how parent shrinking/jumping was prevented]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



