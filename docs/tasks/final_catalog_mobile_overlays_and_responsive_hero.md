````text

You are working as a senior frontend engineer and senior mobile e-commerce UX designer.



Perform a final redesign and stabilization pass for the catalog hero, mobile catalog toolbar, filter/sort overlays, accessories controls, and bottom navigation.



The current mobile implementation shown in the attached screenshots is not acceptable:



\- toolbar controls are cramped and visually unbalanced;

\- the accessories gender controls do not fit naturally;

\- sorting/filter panels conflict with the bottom navigation;

\- the bottom navigation covers part of the opened panel;

\- the layout does not adapt reliably to different phone widths;

\- desktop catalog banners still need correct responsive height behavior.



Do not apply isolated CSS patches. Inspect the shared catalog architecture and implement one consistent responsive solution that works across catalog categories and viewport sizes.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the attached screenshots carefully.

5\. Inspect:

&#x20;  - catalog hero/banner component;

&#x20;  - catalog toolbar;

&#x20;  - filter trigger and filter panel;

&#x20;  - sorting trigger and sorting panel;

&#x20;  - category trigger and category panel;

&#x20;  - search trigger and active search;

&#x20;  - accessories-specific controls;

&#x20;  - mobile bottom navigation;

&#x20;  - shared dialog/drawer/popover components;

&#x20;  - current breakpoints and global responsive tokens.

6\. Inspect current category/filter state and URL query logic.

7\. Follow existing localization, `Text`, `Heading`, `Button`, icons, route helpers, RHF, shadcn, and global design-token rules.

8\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Main goal



Create a polished, stable catalog UX that works correctly on:



```text

320px

360px

375px

390px

414px

430px

480px

768px

1024px

1280px

1440px+

````



The solution must be usable, readable, touch-friendly, and visually consistent with the VYMPEL design.



\---



\# Part 1 — Redesign the mobile catalog toolbar



The current mobile toolbar is overcrowded.



Do not try to force desktop labels into a narrow mobile row.



Create a proper mobile-specific toolbar.



The toolbar must provide access to:



1\. categories, where applicable;

2\. filters, where applicable;

3\. sorting;

4\. search;

5\. optional accessories gender selection only if it can be presented cleanly.



The toolbar must:



\* fit within the viewport;

\* never create horizontal body overflow;

\* not clip labels;

\* not show half-visible controls;

\* not overlap the banner incorrectly;

\* remain touch-friendly;

\* use consistent button sizes;

\* keep the search icon visually separated and accessible.



Preferred mobile direction:



```text

\[category/filter icon] \[sort icon/current short sort] \[search icon]

```



or another clean e-commerce toolbar pattern chosen after inspecting the current UI.



For icon-only controls:



\* add accessible `aria-label`;

\* maintain at least a touch-friendly target;

\* use existing project icons;

\* show active state clearly.



Do not leave desktop-sized text buttons squeezed into the mobile row.



\---



\# Part 2 — Accessories: “Женские” and “Мужские”



The current accessories toolbar attempts to show:



```text

\[filter] \[Женские] \[Мужские] \[search]

```



This does not fit naturally on all phones.



Also, women’s and men’s accessories are already available through category/navigation logic.



Choose the best UX after inspecting the implementation.



\## Preferred decision order



\### Option A — preferred when gender categories already fully cover the use case



Remove `Женские` and `Мужские` from the compact mobile toolbar.



Users should select them through the category panel/page.



This is preferred if keeping them duplicates existing navigation and makes the toolbar cramped.



\### Option B — keep them only if the result remains clean



If direct gender switching is useful, retain it as a compact segmented control or horizontal chip group outside the icon row.



For example:



```text

\[toolbar icons]



\[Все] \[Женские] \[Мужские]

```



Requirements if retained:



1\. The controls are filters, not separate hardcoded pages.

2\. They must fit or scroll internally without body overflow.

3\. Selected state must be visually clear.

4\. Use the existing animated underline or a clean outlined active chip.

5\. Selecting a value updates products and resets pagination to page 1.

6\. Deselecting/showing `Все` returns all accessories.

7\. The controls must not compete with search/filter/sort icons.



Do not keep the current cramped layout merely to preserve all controls.



Choose the cleaner of Option A or Option B and explain the decision in the final report.



\---



\# Part 3 — Mobile filter and sorting panels



The opened filter/sorting UI currently conflicts with the bottom navigation.



Redesign these panels as proper mobile overlays.



Preferred pattern:



\* shadcn Sheet/Drawer/Dialog or the existing equivalent;

\* bottom sheet or full-height mobile drawer;

\* content scrolls inside the panel;

\* page body does not scroll behind it;

\* focus is trapped correctly;

\* Escape/backdrop close works where appropriate;

\* rounded top corners if using a bottom sheet;

\* safe-area padding is respected.



The filter and sorting panels must not be small desktop dropdowns forced onto mobile.



\## Panel behavior



When filter, sort, or category panel opens:



1\. Hide the mobile bottom navigation.

2\. This is the preferred behavior.

3\. Restore the bottom navigation only after the panel fully closes.

4\. Do not merely place the panel behind or underneath the bottom navigation.

5\. Prevent flicker during open/close animation.

6\. Panel z-index must be above:



&#x20;  \* catalog toolbar;

&#x20;  \* product cards;

&#x20;  \* footer;

&#x20;  \* bottom navigation.

7\. Do not let the bottom navigation remain clickable behind the panel.

8\. The overlay must cover the viewport correctly.

9\. Panel content must remain reachable on short screens.

10\. Actions at the bottom must not be hidden behind the safe area.



Suggested state rule:



```text

isCatalogOverlayOpen === true

→ hide/suspend MobileBottomNavigation

```



Implement this cleanly through shared state/context or the existing overlay architecture. Do not scatter unrelated CSS selectors across the project.



\---



\# Part 4 — Sorting panel UX



The mobile sorting panel must be clean and compact.



Required:



1\. Display sorting options as a radio group or equivalent accessible single-choice control.

2\. Selected option is clearly marked.

3\. Option rows are touch-friendly.

4\. Labels do not wrap awkwardly unless genuinely necessary.

5\. The panel does not extend behind the bottom nav.

6\. Selecting an option:



&#x20;  \* updates sorting;

&#x20;  \* resets pagination to page 1;

&#x20;  \* closes the sorting panel if that matches the intended UX.

7\. The toolbar may show a short selected-sort label when space allows.

8\. On very narrow screens, use only the sorting icon or a very short label.



Use concise localized options such as:



```text

По возрастанию

По убыванию

Сначала новые

По популярности

```



Do not show excessively long wording in the toolbar.



\---



\# Part 5 — Filter panel UX



The mobile filter panel must:



1\. Display only filters applicable to the current category.

2\. Not show watch filters for accessories.

3\. Not show irrelevant fields for interior clocks.

4\. Keep selected filter state while opening/closing.

5\. Apply filters only after the intended action if the project uses an Apply button.

6\. Reset pagination to page 1 after applying.

7\. Provide a clear reset action.

8\. Keep Apply/Reset actions accessible on short screens.

9\. Use internal scrolling.

10\. Avoid nested scroll traps.



For accessories:



\* do not show the full general filter panel unless there are genuinely relevant accessory filters;

\* gender selection should follow the decision in Part 2.



\---



\# Part 6 — Category panel/page



Mobile category navigation must remain separate from the filtering logic.



Required:



1\. Categories are navigational.

2\. Gender filter is not silently converted into a category unless it already exists as actual backend category data.

3\. Nested categories remain usable.

4\. “Все товары” remains available for parent categories.

5\. Category panel must also hide the bottom navigation while open if it occupies the viewport.

6\. Category rows must use meaningful icons and touch-friendly spacing.

7\. No clipped category names.



\---



\# Part 7 — Search compatibility



Do not break the existing search behavior.



On mobile:



1\. In inactive state, show the compact search icon according to the catalog pattern.

2\. On activation, open the existing smart search cleanly.

3\. Search must remain above other catalog elements.

4\. Search must not conflict with the filter/sort/category overlays.

5\. Only one major catalog overlay may be open at a time.

6\. Opening search should close filter/sort/category panels first, and vice versa.

7\. Bottom navigation may also be hidden while the active search overlay occupies the screen.



Preserve:



\* quick results;

\* fuzzy search;

\* loading/error/empty states;

\* submit;

\* clear;

\* outside click;

\* Escape where supported.



\---



\# Part 8 — Overlay state coordination



Create one consistent overlay policy.



At most one of these should be active:



```text

category panel

filter panel

sorting panel

active search

```



Required:



1\. Opening one closes the others.

2\. Bottom navigation visibility derives from this state.

3\. Body scroll lock is applied once, not multiple conflicting times.

4\. Closing an overlay restores scroll position and bottom navigation.

5\. No page jump or horizontal shift.

6\. No stale overlay state after navigation.

7\. Navigating to a different category closes the current overlay.



Prefer a shared hook/context/state controller if the project currently has duplicated open states.



Example conceptual API:



```text

useCatalogOverlay()

openOverlay('filters')

openOverlay('sorting')

openOverlay('categories')

openOverlay('search')

closeOverlay()

isOverlayOpen

```



Follow the existing architecture rather than introducing unnecessary complexity.



\---



\# Part 9 — Mobile layout and safe areas



Verify the whole experience on small devices.



Required:



1\. Account for `env(safe-area-inset-bottom)`.

2\. Bottom sheet actions must remain above the system gesture area.

3\. Bottom navigation must also respect the safe area when visible.

4\. Do not hardcode viewport heights using only `100vh` if `100dvh` is more appropriate.

5\. Do not let browser address-bar resizing break the sheet height.

6\. No content is hidden beneath fixed controls.

7\. No body horizontal overflow at 320px.



\---



\# Part 10 — Desktop catalog banner height



Desktop catalog banners must remain large and visually premium.



Required behavior:



1\. On large desktop screens, banner height must be at least `605px`.

2\. Apply this requirement at a suitable large-screen breakpoint, not blindly to all widths.

3\. Banner height may decrease on smaller desktop/tablet screens when keeping 605px would damage composition or consume too much viewport space.

4\. Use a fluid responsive rule instead of one rigid height for every screen.

5\. Preserve image aspect ratio and important composition.

6\. Use `object-fit` and `object-position` based on the actual banner.

7\. Header-over-banner behavior must remain intact.

8\. CMS banner must remain the primary source; local image is fallback only.



Recommended concept:



```css

/\* example direction, adapt to project breakpoints \*/

@media (min-width: 1440px) {

&#x20; min-height: 605px;

}



@media (min-width: 1024px) and (max-width: 1439px) {

&#x20; min-height: clamp(460px, 42vw, 605px);

}

```



Do not copy these values blindly if the project container/aspect ratio requires a better result. The key rule is:



```text

large screens → minimum 605px

smaller screens → fluid reduction when necessary for design

```



This applies to all catalog hero banners, including:



\* wristwatch categories;

\* interior clocks;

\* accessories;

\* other category banners using the shared catalog hero.



\---



\# Part 11 — Desktop toolbar and opened panels



Do not regress desktop behavior.



On desktop:



1\. Category/filter/sorting panels remain attached to the toolbar.

2\. Panels span the intended toolbar width.

3\. Search keeps its specified positioning and does not overlap controls.

4\. Accessories gender filtering remains visually clean according to the chosen responsive implementation.

5\. Panels must not inherit mobile bottom-sheet styles.



Use clear breakpoint-specific variants instead of fragile shared positioning.



\---



\# Part 12 — Animation



All open/close interactions must be smooth.



Required:



1\. No abrupt appearance.

2\. No layout shift.

3\. No toolbar resizing.

4\. Bottom navigation hides and returns smoothly.

5\. Overlay opacity/transform animations should be restrained and fast.

6\. Respect `prefers-reduced-motion`.

7\. Do not animate height from `0` to `auto` with unstable hacks if a proper shadcn/Radix transition exists.



\---



\# Part 13 — Accessibility



Required:



1\. Icon-only buttons have localized accessible labels.

2\. Filter/sort/category triggers expose expanded state.

3\. Radio controls are keyboard accessible.

4\. Focus moves into the opened panel.

5\. Focus returns to the trigger after close.

6\. Backdrop/close behavior is predictable.

7\. Text contrast remains readable.

8\. Touch targets are sufficiently large.



\---



\# Strong restrictions



Do not:



\* keep the current cramped mobile toolbar;

\* allow bottom navigation to cover an opened panel;

\* leave bottom navigation interactive behind an overlay;

\* render desktop dropdowns unchanged on mobile;

\* create body horizontal scrolling;

\* show irrelevant filters;

\* convert filters into fake categories without checking the data model;

\* break CMS banner loading;

\* hardcode local banners before backend CMS content;

\* break desktop layout while fixing mobile;

\* apply one rigid 605px banner height to narrow tablets/phones;

\* rewrite unrelated product, CRM, review, cart, or CMS logic.



\---



\# Verification checklist



\## Mobile toolbar



\* works at 320/360/390/430/480px;

\* no clipping;

\* no horizontal overflow;

\* controls are readable/touch-friendly;

\* search works;

\* category/filter/sort triggers work.



\## Accessories



\* gender controls are either removed from the cramped toolbar or redesigned cleanly;

\* chosen approach is consistent across phone sizes;

\* gender behavior does not duplicate/conflict with category routing;

\* products update correctly;

\* pagination resets correctly.



\## Filter/sort/category overlays



\* open above all page content;

\* bottom navigation hides while open;

\* bottom navigation returns after close;

\* panel content is fully reachable;

\* safe-area padding works;

\* body behind panel does not scroll;

\* no page shift;

\* no overlapping controls.



\## Overlay coordination



\* only one overlay opens at a time;

\* opening another closes the current one;

\* navigation closes overlays;

\* no stale state.



\## Desktop banners



\* at large breakpoints banner min-height is at least 605px;

\* smaller desktop/tablet sizes reduce fluidly where needed;

\* no broken cropping;

\* header remains over banner;

\* CMS backend image remains primary.



\## Desktop panels



\* filter/sort/category panels remain attached to toolbar;

\* search does not conflict;

\* desktop layout is not replaced with mobile bottom sheets.



\## Technical



\* no infinite render loops;

\* no unstable resize listeners;

\* no repeated event listener leaks;

\* no body scroll-lock conflicts;

\* all user-facing text localized;

\* docs updated.



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* catalog responsive toolbar architecture;

\* overlay coordination logic;

\* mobile bottom-navigation visibility behavior;

\* accessories gender-filter decision;

\* filter/sort/category mobile panel structure;

\* responsive catalog hero height rules.



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Mobile filter/sort/category panels must never be covered by bottom navigation.

\* Bottom navigation should be hidden while a full mobile catalog overlay is open.

\* Only one catalog overlay may be open at a time.

\* Desktop dropdown panels and mobile drawers/sheets must use breakpoint-appropriate layouts.

\* Mobile catalog toolbars must not force desktop labels into insufficient space.

\* Accessories gender controls may be removed from the toolbar when category navigation already provides the same functionality; if retained, they must use a compact responsive segmented control.

\* Catalog hero banners must be at least 605px on large desktop screens and reduce fluidly on smaller screens when required for visual balance.

\* CMS banners remain the primary source; local assets are fallback only.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Mobile toolbar:

\- \[chosen layout and why]



Accessories:

\- \[whether gender controls were removed or redesigned]

\- \[how filtering/navigation works]



Filter/sort/category panels:

\- \[mobile overlay implementation]



Bottom navigation:

\- \[how it is hidden/restored]



Overlay coordination:

\- \[how simultaneous overlays are prevented]



Desktop banners:

\- \[responsive 605px rule]



Responsive QA:

\- \[tested viewport sizes]



Accessibility:

\- \[focus/keyboard/labels]



Tests:

\- \[finite commands run and results]



Notes:

\- \[remaining manual visual checks]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



Do not finish until the opened mobile sorting/filter/category panels are no longer covered by the bottom navigation and the toolbar works correctly at 320px width.

