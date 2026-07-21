

````text

You are working as a senior frontend engineer and senior responsive e-commerce UI/UX designer.



Perform a focused responsive-design stabilization pass for the catalog and then inspect the rest of the public website for obvious adaptive/layout problems, with special attention to mobile devices.



The attached screenshots show a clear breakpoint regression around 1000px:



\- catalog toolbar items no longer fit;

\- search overlaps or hides category/filter controls;

\- some controls are partially cut off;

\- desktop layout remains active too long instead of switching to a compact tablet layout.



There is also a mobile styling issue:



\- the selected gender/category pill is already highlighted by its filled rounded background;

\- an additional underline is still rendered and must be removed on mobile.



Do not rewrite unrelated business logic, backend, CRM, CMS, filters, search algorithms, product data, or routing. Work primarily on responsive layout, visual states, spacing, overflow, and interaction presentation.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the attached screenshots.

5\. Inspect:

&#x20;  - catalog hero and toolbar;

&#x20;  - accessories toolbar;

&#x20;  - `Все / Женские / Мужские` control;

&#x20;  - search trigger and active search;

&#x20;  - filters, sorting, and category triggers;

&#x20;  - mobile filter/sort/category overlays;

&#x20;  - mobile bottom navigation;

&#x20;  - shared responsive breakpoints;

&#x20;  - global container widths;

&#x20;  - shared buttons, chips, segmented controls, dropdowns, sheets, and dialogs.

6\. Inspect the existing behavior at widths around:

&#x20;  - 768px;

&#x20;  - 900px;

&#x20;  - 1000px;

&#x20;  - 1024px;

&#x20;  - 1100px;

&#x20;  - 1280px.

7\. Follow existing localization, `Text`, `Heading`, `Button`, icons, route helpers, shadcn, and global design-token rules.

8\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Main objectives



1\. Fix the catalog toolbar regression around 1000px.

2\. Remove the redundant underline from selected mobile segmented controls.

3\. Make catalog toolbar behavior stable across all breakpoints.

4\. Audit obvious responsive/design conflicts across the public site.

5\. Pay special attention to mobile layouts.

6\. Fix found visual/adaptive issues immediately without changing unrelated functionality.



\---



\# Part 1 — Fix the catalog toolbar around 1000px



Current problem:



At approximately 1000px viewport width, the toolbar still uses a desktop-like single-row layout, but there is not enough available space.



As a result:



\- search overlaps `Все / Женские / Мужские`;

\- some labels become hidden behind the search;

\- toolbar elements are cut off;

\- spacing becomes inconsistent;

\- the entire toolbar looks broken.



This must never happen.



\## Required behavior



Create a proper intermediate/tablet breakpoint mode.



Do not keep the full large-desktop toolbar layout active until the mobile breakpoint.



The layout must adapt before elements start colliding.



Use one of these clean solutions, based on the current component structure:



\### Preferred solution A — compact tablet toolbar



At intermediate widths:



```text

\[category/title] \[sort] \[gender filter or filters] \[search icon]

````



\* replace the full search input with the compact search icon;

\* clicking the icon opens the existing expanded search;

\* use shorter labels or icons where necessary;

\* preserve all functionality.



\### Preferred solution B — two-row tablet layout



If compact single-row layout is still too crowded:



```text

Row 1:

\[category/title] \[sort] \[filters/gender]



Row 2:

\[search]

```



But use this only if it looks cleaner than the compact icon approach.



\### Preferred solution C — move segmented control below the toolbar



For accessories:



```text

Row 1:

\[Accessories] \[sort] \[search]



Row 2:

\[Все] \[Женские] \[Мужские]

```



This is a good option when keeping all three direct filters is useful.



\## Strong rule



Choose the cleanest responsive solution after inspecting the current implementation, but ensure:



\* no overlap;

\* no clipped controls;

\* no partially hidden text;

\* no horizontal body overflow;

\* no search covering toolbar labels;

\* no unstable absolute positioning.



Do not merely reduce font sizes until everything barely fits.



\---



\# Part 2 — Responsive breakpoint strategy



Use a clear breakpoint strategy rather than scattered one-off fixes.



Expected layout modes:



\## Large desktop



Approximate direction:



```text

>= 1280px or suitable project breakpoint

```



\* full category/title;

\* sorting;

\* filter/gender controls;

\* full search field;

\* comfortable spacing.



\## Small desktop / tablet landscape



Approximate direction:



```text

\~900px–1279px

```



\* compact toolbar;

\* search may become icon-triggered;

\* gender segmented control may move to a separate row;

\* labels must remain readable;

\* nothing overlaps.



\## Tablet portrait / mobile



Approximate direction:



```text

< 900px or suitable project breakpoint

```



\* icon-oriented compact toolbar;

\* bottom-sheet/drawer overlays;

\* search opens through an icon;

\* segmented controls fit or scroll internally;

\* bottom navigation behavior remains correct.



Use existing project breakpoints if they are already well-defined. Do not blindly introduce conflicting breakpoint values.



\---



\# Part 3 — Accessories gender filter



Accessories currently have:



```text

Все

Женские

Мужские

```



These are filters, not separate routes unless the backend/category model explicitly says otherwise.



Preserve this functionality only if it remains clean and useful.



\## Desktop / tablet



The control may remain as:



\* text filters with active underline; or

\* segmented pills.



Use the current visual language, but prevent overlap with search.



\## Mobile



The control currently has both:



\* filled rounded active pill;

\* active underline.



This is redundant and visually incorrect.



Required mobile behavior:



1\. Remove the underline from the selected item.

2\. Selected state must be indicated only by the filled rounded pill/background.

3\. Unselected items remain transparent.

4\. Keep one clean active-state mechanism.

5\. Do not leave a small underline inside the dark pill.

6\. Hover styles should not appear as stuck states on touch devices.

7\. The segmented control must fit all supported screen widths.

8\. If needed, reduce internal padding responsibly or allow internal horizontal scrolling.

9\. Never create body horizontal overflow.



Expected mobile state:



```text

\[ Все — filled active pill ] \[ Женские ] \[ Мужские ]

```



No underline beneath `Все`.



\---



\# Part 4 — Search behavior at intermediate widths



The search component must not conflict with toolbar elements.



Required:



1\. Full search input can remain on large desktop.

2\. Before the layout becomes cramped, switch to compact search icon mode or move search to a dedicated row.

3\. Search must never cover:



&#x20;  \* `Все`;

&#x20;  \* `Женские`;

&#x20;  \* `Мужские`;

&#x20;  \* sorting;

&#x20;  \* category title;

&#x20;  \* filter/category trigger.

4\. Active search may overlay the toolbar according to the existing design, but only after the user explicitly opens it.

5\. Inactive search must not obscure other controls.

6\. Active search must close or hide conflicting toolbar controls consistently.

7\. Parent toolbar dimensions must remain stable.

8\. Search dropdown must remain connected to the input.

9\. Existing smart search logic must remain working.



\---



\# Part 5 — Toolbar spacing



Review spacing at all breakpoints.



Large desktop may keep the intended generous spacing.



Intermediate widths must use fluid spacing.



Do not force fixed `40px` gaps when the total content cannot fit.



Use responsive spacing such as:



\* large gap on wide screens;

\* medium gap on tablet;

\* compact gap on mobile.



However:



\* items must not visually stick together;

\* icon and label alignment must remain clean;

\* touch targets must remain large enough.



Use global spacing tokens if possible.



\---



\# Part 6 — Mobile filter/sort/category overlays



Re-check previous mobile overlay requirements.



When filter, sorting, or categories panel opens:



1\. Mobile bottom navigation must hide.

2\. It must not cover the panel.

3\. It must not remain clickable behind the panel.

4\. Panel must use correct viewport height.

5\. Use `100dvh` or the existing safe solution.

6\. Add safe-area bottom padding.

7\. Panel content must scroll internally.

8\. Apply/reset buttons must remain reachable.

9\. Opening one catalog overlay closes the others.

10\. Closing restores bottom navigation and body scrolling cleanly.

11\. No left/right screen shift.

12\. No stale overlay after navigation.



Do not regress this behavior while changing breakpoints.



\---



\# Part 7 — Catalog hero/banner responsiveness



Preserve the responsive catalog hero rules.



Required:



1\. Large desktop catalog banners should be at least `605px` high.

2\. This minimum applies only where the screen is wide enough to preserve good composition.

3\. Around 1000px and smaller desktop/tablet widths, height may reduce fluidly.

4\. Do not force 605px when it makes the banner composition awkward.

5\. Header-over-banner behavior must remain.

6\. CMS image remains the primary source.

7\. Local image remains fallback only.

8\. Prevent banner stretching/distortion.

9\. Use appropriate `object-fit` and category-specific `object-position` where needed.



\---



\# Part 8 — Full responsive design audit



After fixing the visible catalog issue, inspect the public site for other obvious responsive design problems.



Focus especially on:



\## Global



\* horizontal body overflow;

\* clipped text;

\* broken wrapping;

\* overlapping controls;

\* fixed widths larger than viewport;

\* absolute-positioned elements escaping containers;

\* buttons that become too narrow;

\* inconsistent container padding;

\* content hidden behind bottom navigation;

\* dialogs exceeding viewport;

\* scrollbars escaping rounded blocks;

\* desktop controls squeezed into mobile widths.



\## Header



\* logo remains centered;

\* icons do not overlap;

\* mobile header remains compact;

\* counters do not cover icons;

\* header-over-banner layouts remain readable.



\## Home page



\* banners;

\* product sliders;

\* philosophy section;

\* benefits blocks;

\* headings and `Смотреть все`;

\* Instagram/social slider;

\* contact banner;

\* footer.



\## Catalog



\* hero;

\* toolbar;

\* categories;

\* filters;

\* sorting;

\* search;

\* breadcrumbs;

\* cards;

\* pagination;

\* empty/loading states.



\## Product page



\* gallery;

\* product information;

\* price/cart/favorite controls;

\* tabs;

\* characteristics;

\* reviews;

\* sticky form;

\* related products.



\## Cart and favorites



\* grids;

\* item controls;

\* totals;

\* dialogs;

\* toasts;

\* bottom-nav clearance.



\## Info pages



\* About;

\* Warranty;

\* Delivery;

\* Payment;

\* Brands.



\## Dialogs



\* fit small-height screens;

\* internal scrolling;

\* close controls;

\* phone mask layout;

\* no page shift.



Fix only clear issues. Do not arbitrarily redesign elements that already work correctly.



\---



\# Part 9 — Required viewport checks



Check layout logic at least for:



```text

320 × 568

360 × 640

375 × 667

390 × 844

414 × 896

430 × 932

480px width

768px width

900px width

1000px width

1024px width

1100px width

1280px width

1440px+

```



The critical width is around `1000px`, where the current regression is visible.



At every width verify:



\* no overlap;

\* no clipping;

\* no body horizontal overflow;

\* controls remain usable;

\* content remains visually balanced.



\---



\# Part 10 — CSS and implementation quality



Do not solve responsive issues using fragile hacks.



Avoid:



\* arbitrary negative margins;

\* random fixed `left` offsets;

\* hiding text with overflow just to avoid overlap;

\* reducing controls below usable touch size;

\* `width: 100vw` inside padded containers;

\* unnecessary duplicated breakpoint CSS;

\* layout logic based on JavaScript viewport checks when CSS can solve it.



Prefer:



\* CSS Grid/Flex;

\* `minmax(0, 1fr)`;

\* `min-width: 0`;

\* fluid `clamp()`;

\* shared responsive classes/tokens;

\* clear breakpoint variants;

\* reusable segmented-control styles;

\* proper shadcn sheets/drawers/dialogs.



\---



\# Part 11 — Scope restrictions



Do not change:



\* backend filter logic;

\* product category business logic;

\* search algorithm;

\* CMS persistence;

\* CRM;

\* reviews backend;

\* cart/favorites storage logic;

\* routes;

\* localization structure.



Only change these if a direct compile/runtime issue is discovered while fixing responsive UI.



Do not introduce unrelated visual redesigns.



\---



\# Verification checklist



\## 1000px regression



\* search no longer covers `Все / Женские / Мужские`;

\* all toolbar controls remain visible;

\* no clipped text;

\* no horizontal overflow;

\* layout switches to a suitable tablet mode before collision.



\## Mobile segmented control



\* selected item uses only filled pill/background;

\* active underline is removed;

\* unselected items remain clear;

\* all three items fit or scroll internally;

\* no body overflow.



\## Catalog overlays



\* bottom navigation hides;

\* panel is fully usable;

\* no panel content is covered;

\* bottom navigation returns after close.



\## Search



\* large desktop full input works;

\* intermediate layout adapts;

\* mobile icon trigger works;

\* active search still works;

\* no inactive overlap.



\## Site audit



\* obvious responsive bugs found are fixed;

\* special attention was given to mobile;

\* no unrelated visual regressions.



\## Technical



\* no long-running dev/start/watch checks;

\* no infinite resize/render loops;

\* no duplicated event listeners;

\* no hardcoded user-facing text;

\* docs updated.



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* large desktop / intermediate / mobile catalog toolbar modes;

\* accessories segmented-filter responsive behavior;

\* search breakpoint behavior;

\* mobile overlay and bottom-navigation coordination;

\* responsive audit fixes that changed shared structure.



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Catalog toolbar must switch to a compact/tablet layout before controls overlap.

\* Full desktop search must collapse to an icon or dedicated row at intermediate widths when necessary.

\* Mobile segmented controls must use one active-state mechanism; do not combine a filled pill and underline.

\* Responsive fixes must be verified around 1000px, not only standard mobile and desktop breakpoints.

\* Mobile overlays must hide bottom navigation.

\* Public pages must not create horizontal body overflow at any supported width.

\* Do not solve layout conflicts by clipping content or shrinking touch targets below usable sizes.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



1000px toolbar fix:

\- \[root cause]

\- \[chosen intermediate layout]



Accessories filter:

\- \[mobile active state]

\- \[tablet/desktop behavior]



Search:

\- \[responsive search behavior]



Mobile overlays:

\- \[bottom navigation coordination]



Responsive audit:

\- \[other issues found and fixed]



Viewport QA:

\- \[widths checked]



Tests:

\- \[finite checks run]

\- \[manual visual QA still needed]



Notes:

\- \[anything intentionally left unchanged]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



Do not finish until the catalog toolbar is visually correct at approximately 1000px and the selected mobile segmented-control item no longer has an underline.

