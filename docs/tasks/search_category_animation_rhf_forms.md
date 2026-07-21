You are working as a senior frontend engineer on this project.



Fix and polish search animations, category hover animations, filter checkbox animations, and migrate all project forms to RHF / React Hook Form.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current smart search implementation.

5\. Inspect search usage in:



&#x20;  \* global header

&#x20;  \* catalog page

&#x20;  \* product detail page

6\. Inspect category dropdown/hover menu implementation.

7\. Inspect filter checkbox implementation.

8\. Inspect all forms in the project.

9\. Inspect existing animation utilities, CSS transitions, Framer Motion usage, shadcn components, and global design tokens.

10\. Make a short implementation plan before changing code.



Follow project rules:



\* all user-facing text must be localized

\* use existing `Text`, `Heading`, `Button`, form components, and design tokens

\* do not use arbitrary Tailwind values/raw hex if reusable tokens should exist

\* keep animations elegant, subtle, and consistent with the VYMPEL design

\* do not over-animate the site

\* respect `prefers-reduced-motion`

\* update `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md` after finishing



\---



\# Part 1 — Fix search click/open animations



Current problem:



Search animations when clicking/focusing the search input look strange, jumpy, and unpolished.



Fix the search open/close animation.



Required behavior:



1\. Inactive search should be slightly smaller than it is now.

2\. On click/focus, search should smoothly expand.

3\. Expansion must be smooth, not abrupt.

4\. Search input must not cause layout jumps.

5\. Search overlay/dropdown must open smoothly.

6\. Search input and dropdown must remain visually connected without gaps.

7\. Closing search must also animate smoothly.

8\. Header icons/nav elements must not jump or appear above the search overlay.

9\. Search must still overlay the full row when active, so nothing sticks out behind it.



Recommended animation approach:



\* use CSS transitions for width, opacity, transform, border-radius

\* or use Framer Motion only if it already exists in the project

\* do not add a heavy animation dependency unless the project already uses it

\* use stable class/state transitions, not layout hacks



\---



\# Part 2 — Fix search border-radius bug in catalog/product pages



Current bug:



When opening search on the catalog page and product detail page, border-radius disappears and animation becomes very jerky.



Fix this.



Required:



1\. Search must keep correct rounded corners during animation.

2\. When search dropdown is open:



&#x20;  \* input top corners may remain rounded

&#x20;  \* bottom corners should visually connect to dropdown if needed

&#x20;  \* no broken/flat random corners

3\. Catalog search variant must match catalog UI.

4\. Product page search variant must match product page UI.

5\. Header search, catalog search, and product page search should share logic where possible.

6\. Avoid duplicated search implementations.



Preferred structure:



```text id="a18b97"

SmartSearch variant="header"

SmartSearch variant="catalog"

SmartSearch variant="product"

```



or follow the current project architecture.



All variants must:



\* use the same quick search logic

\* use the same keyboard/outside-click behavior

\* use the same backend quick search endpoint

\* redirect full search submit to catalog

\* preserve smooth animation



\---



\# Part 3 — Make category hover animations smoother



Current problem:



Category hover dropdown/submenu animations are too jumpy/jerky.



Fix category menu animations.



Required:



1\. Hovering over parent category should show child categories smoothly.

2\. Submenu should not flicker when moving mouse between parent and child block.

3\. Animation should feel like a premium e-commerce menu.

4\. Use subtle opacity/translate transitions.

5\. Add a small hover delay only if needed to prevent flicker.

6\. Active/hover state should be clear but not aggressive.

7\. Avoid changing layout dimensions in a way that causes jumps.

8\. Use stable positioning and `z-index`.



Important:



\* category menu must still be accessible and clickable

\* child categories must remain selectable

\* selected category routing/filtering must not break



\---



\# Part 4 — Add smooth checkbox animations for filters



Improve filter checkbox interaction.



Required:



1\. Checkbox state change should animate smoothly.

2\. Checked state should not appear abruptly.

3\. Hover/focus states should be clear and subtle.

4\. Disabled checkbox state should remain visually muted.

5\. Animation must match project design.

6\. Do not break checkbox accessibility.

7\. Do not break form behavior or selected filter state.

8\. Filter selection must still update URL/apply state correctly.



If a reusable checkbox component already exists, update it there.



If not, create/finish a reusable checkbox form input component and use it in filters.



\---



\# Part 5 — Improve general site animation smoothness



Review the main interactive areas and add subtle animations where appropriate.



Possible places:



\* dropdown open/close

\* filter panel open/close

\* category panel open/close

\* search overlay open/close

\* product card hover

\* product card favorite/cart buttons

\* toast appearance

\* empty/error state actions

\* accordion/tabs if used

\* image hover where appropriate



Requirements:



1\. Animations must be subtle and consistent.

2\. Do not animate everything.

3\. Do not make the site feel slow.

4\. Do not add animations that interfere with usability.

5\. Respect `prefers-reduced-motion`.

6\. Use global animation tokens/classes where possible.

7\. Avoid duplicated transition definitions everywhere.



Recommended global tokens/classes:



```text id="u93znn"

duration-fast

duration-base

duration-slow

ease-vympel

transition-vympel

```



or follow existing naming conventions.



\---



\# Part 6 — Migrate all forms to RHF / React Hook Form



Migrate all project forms to RHF / React Hook Form.



The user referred to `rhk`; interpret this as RHF / React Hook Form unless the project has another form library or abbreviation.



Before migration:



1\. Inspect all existing forms.

2\. List forms that need migration.

3\. Check if React Hook Form is already installed.

4\. Check if validation schema library exists, for example Zod/Yup.

5\. Follow existing form architecture if present.



Forms likely include:



\* search form if treated as form

\* catalog filters form

\* login/register forms

\* CRM product create/edit forms

\* CRM bulk product creation forms

\* CRM user create/edit forms

\* collection creation/edit forms

\* contact/question forms if any

\* cart/customer forms if any



Migration requirements:



1\. Use RHF consistently.

2\. Use `Controller` for custom inputs/selects where needed.

3\. Preserve existing validation behavior.

4\. Preserve existing localized errors.

5\. Preserve loading/success/error states.

6\. Preserve disabled submit while pending.

7\. Do not break existing API payloads.

8\. Do not rewrite unrelated business logic.

9\. Keep forms typed.

10\. Reuse existing input/select/checkbox components.

11\. All errors must remain localized.

12\. Do not hardcode validation messages in components.



If the project already uses Zod, use RHF + Zod resolver.



If no schema library exists, use RHF validation rules cleanly and document it.



\---



\# Part 7 — Technical stability requirements



While improving animations and forms, make sure not to introduce:



\* infinite renders

\* hydration mismatches

\* layout shifts

\* duplicate API calls

\* broken localStorage hooks

\* broken search query state

\* broken category/filter URL params

\* broken CRM forms

\* broken validation

\* broken SSR/client behavior



Special checks:



1\. Search should not rerender infinitely when opening/closing.

2\. Category hover state should not trigger repeated layout recalculations.

3\. RHF migration should not reset form fields unexpectedly.

4\. Filter form should preserve selected state correctly.

5\. CRM forms should not lose entered data when category-specific fields render.

6\. Animation classes should not override important layout styles.



\---



\# Part 8 — Verification checklist



Before finishing, verify:



\## Search



\* inactive search is slightly smaller

\* search expands smoothly on click/focus

\* search closes smoothly

\* no weird jumping animation

\* no gap between search input and dropdown

\* border-radius stays correct in header

\* border-radius stays correct in catalog

\* border-radius stays correct on product page

\* search overlay covers the full row when active

\* no header elements stick out behind search

\* quick search results still work

\* full submit redirects to catalog search



\## Category menu



\* parent category hover animation is smooth

\* child submenu appears smoothly

\* no flicker between parent and child submenu

\* category click still works

\* category routing/filtering still works



\## Filter checkboxes



\* checkbox checked/unchecked animation is smooth

\* disabled checkbox state still works

\* filter selection still works

\* URL/filter state still works



\## Forms / RHF



\* all main project forms use RHF

\* custom inputs work with RHF

\* validation still works

\* localized errors still work

\* submit loading states still work

\* API payloads are unchanged or intentionally updated

\* CRM product forms still work

\* bulk creation forms still work

\* search/filter forms still work



\## General



\* animations respect `prefers-reduced-motion`

\* no excessive animations

\* no hydration errors

\* no infinite render loops

\* no broken layout on mobile

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* shared search animation/overlay structure

\* search variants and where they are used

\* category menu animation structure

\* reusable checkbox/form components

\* RHF form architecture

\* list of migrated forms

\* global animation tokens/classes if added



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Search animations must be smooth and must not cause layout jumps.

\* Active search must preserve border-radius and visually connect to dropdown.

\* Header/catalog/product search should share logic with layout variants.

\* Category hover submenus must not flicker.

\* Filter checkboxes must use reusable animated checkbox component.

\* Animations must be subtle, consistent, and respect `prefers-reduced-motion`.

\* All project forms should use RHF / React Hook Form.

\* Custom form inputs must integrate with RHF through `Controller` where needed.

\* Validation and error messages must remain localized.



\---



\# Final response required



```markdown id="y0p63d"

Summary:

\- \[what changed]



Search animations:

\- \[inactive/active behavior, border-radius fixes, variants]



Category animations:

\- \[hover/submenu improvements]



Filter animations:

\- \[checkbox animation changes]



Forms:

\- \[RHF migration summary]



Design system:

\- \[animation tokens/classes added or reused]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, limitations, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



