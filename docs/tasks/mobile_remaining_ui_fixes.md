You are working as a senior frontend engineer and senior mobile UX designer.



Fix the remaining responsive/mobile UI issues shown in the attached screenshots.



This is a focused QA/fix task after the previous mobile adaptation. Do not rewrite the whole site from scratch. Inspect the current implementation, identify the exact components causing the problems, and fix them cleanly.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the attached screenshots carefully.

5\. Inspect current mobile layout for:



&#x20;  \* product sliders / “Новинки”

&#x20;  \* brand breadcrumbs

&#x20;  \* catalog toolbar/search

&#x20;  \* pagination

&#x20;  \* cart checkout block

&#x20;  \* About page cards

&#x20;  \* Warranty page icon badges

6\. Inspect existing responsive tokens, product slider components, breadcrumb component, pagination component, cart summary component, and info-card components.

7\. Use existing localization, `Text`, `Heading`, `Button`, route helpers, and global design tokens.

8\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Main Goal



Fix the specific remaining UI bugs:



1\. Remove/hide the background banner from product sliders when it becomes too small or visually inappropriate.

2\. Fix brand breadcrumbs so they stay in one line.

3\. Move catalog search to the opposite side from filters/sorting.

4\. Make active catalog search wider and closer to the top edge.

5\. Force pagination to stay in one row.

6\. Round the checkout/order summary block in cart.

7\. Fix About page card sizes and overflow.

8\. Make Warranty page icon circles the same size.

9\. Scroll to top when changing pagination page.



\---



\# Part 1 — Product slider background banner



Current issue:



In product slider sections such as “Новинки”, the background banner behind products becomes too small and visually inappropriate on mobile. It looks like a random strip and makes the section feel broken.



Required behavior:



1\. If the background banner becomes visually inappropriate on mobile/tablet, hide it.

2\. Keep it only where it looks good and intentional.

3\. On mobile, prefer a clean product slider/grid without the background banner if that looks better.

4\. On desktop, the banner may remain only if it does not overlap or break the cards.

5\. Banner must never overlap product cards incorrectly.

6\. Slider arrows must not overlap cards.

7\. Product cards must remain readable and aligned.



Recommended:



```text

desktop / large tablet:

&#x20; keep banner only if composition is correct



small tablet / mobile:

&#x20; hide banner or replace with clean section spacing

```



Choose the cleaner result.



\---



\# Part 2 — Brand breadcrumbs in one line



Current issue:



On brand pages, breadcrumbs break into multiple lines:



```text

Главная — Бренды —

Royal London

```



Required:



1\. Breadcrumbs on brand pages must stay in one line.

2\. Use horizontal scroll if needed, like catalog breadcrumbs.

3\. Do not allow ugly multi-line breaking.

4\. Do not create horizontal body overflow.

5\. Use `white-space: nowrap` and internal overflow scroll where appropriate.

6\. Keep typography consistent with the project.

7\. The brand name must remain readable.



Expected behavior:



```text

Главная — Бренды — Royal London

```



If it does not fit, the breadcrumb row itself scrolls horizontally.



\---



\# Part 3 — Catalog toolbar search position



Current issue:



Catalog toolbar currently groups icons/search awkwardly.



Required:



1\. On mobile catalog page, search must be on the opposite side from filters/sorting.

2\. Filters and sorting should stay grouped together.

3\. Search icon/button should be visually separated on the opposite side of the row.

4\. Toolbar must remain one line.

5\. No wrapping to two rows.

6\. No horizontal overflow.

7\. Buttons must remain touch-friendly.



Expected mobile structure:



```text

\[Filters] \[Sort]                         \[Search]

```



or visually equivalent within the available width.



Search behavior must remain the same.



\---



\# Part 4 — Active catalog search position and width



Current issue:



When catalog search opens, it is too low / not wide enough / visually cramped.



Required:



1\. Active search on catalog page must appear closer to the top edge.

2\. Active search must be wider.

3\. It should occupy almost all available horizontal space.

4\. It must not overlap badly with content.

5\. Search input and dropdown must remain visually connected.

6\. Border radius must stay correct.

7\. Quick search results must still work.

8\. Full search submit must still redirect to catalog search.



On mobile, active catalog search can behave like a full-width overlay/search sheet if that is cleaner.



\---



\# Part 5 — Pagination must be one row



Current issue:



Pagination currently wraps into two rows:



```text

0-8     9-15



1       2

```



Required:



1\. Pagination must remain in one horizontal row.

2\. Page ranges/pages must not split into separate rows unless there are too many items.

3\. If space is limited, use horizontal scroll inside the pagination container.

4\. Do not create body horizontal overflow.

5\. Keep buttons touch-friendly.

6\. When there are few pages, center or align neatly in one line.



Expected behavior:



```text

\[0-8] \[9-15] \[1] \[2]

```



or the current pagination pattern, but one row.



\---



\# Part 6 — Scroll to top on pagination change



When user changes page in catalog/product listing pagination:



1\. Scroll the page to the top of the product list or catalog content.

2\. Do this smoothly if project animation rules allow it.

3\. Do not scroll to a wrong position hidden behind sticky header.

4\. Do not break browser back/forward navigation.

5\. Works for desktop and mobile.



Recommended behavior:



```text

pagination click -> update page -> scroll to catalog list top

```



If using router query params, scroll after route/query update safely.



\---



\# Part 7 — Cart checkout block rounded corners



Current issue:



The checkout/order summary block has sharp corners and looks inconsistent.



Required:



1\. Round the checkout/order summary block corners.

2\. Use the same radius language as the project card system.

3\. Keep the button style consistent.

4\. Do not break desktop layout.

5\. On mobile, block must fit screen width and not overflow.



Apply to the cart summary block that contains:



```text

Итого

100 000 ₸

Оформить заказ

```



\---



\# Part 8 — About page card sizes



Current issue:



On the About page, “О компании” cards have broken sizing/overflow on mobile. Text and number badge can overflow or look cramped.



Required:



1\. Fix responsive card sizing.



2\. Card content must not overflow horizontally.



3\. Card number badge must not push content outside the card.



4\. Text must wrap cleanly.



5\. Cards should be one column on mobile.



6\. Title and number badge layout should adapt:



&#x20;  \* desktop: title + number badge in one row

&#x20;  \* mobile: either same row if it fits, or cleaner stacked layout



7\. Preserve desktop design.



8\. Use readable typography on mobile.



No text should be clipped.



\---



\# Part 9 — Warranty icon circles same size



Current issue:



On the Warranty page, the circular icon badges have inconsistent sizes.



Required:



1\. All warranty icon circles must have the same width and height.

2\. Icons must be centered inside the circles.

3\. Text beside icons must align cleanly.

4\. Mobile layout should stack or align without breaking.

5\. Use global size tokens/classes if possible.



Apply to blocks such as:



```text

1 год

гарантийный срок



Поддержка клиентов

всегда на связи с вами

```



\---



\# Part 10 — Technical constraints



Do not break:



\* desktop layout

\* mobile bottom navigation

\* catalog filters

\* sorting

\* search quick results

\* product cards

\* cart checkout logic

\* brand page routes

\* footer



Avoid:



\* horizontal body overflow

\* clipped text

\* overlapping elements

\* random hardcoded one-off CSS

\* arbitrary Tailwind values where global tokens should exist

\* infinite render loops

\* endless scripts



Use reusable classes/tokens for responsive fixes where possible.



\---



\# Part 11 — Verification checklist



Before finishing, verify:



\## Product slider



\* background banner is hidden or properly shown depending on breakpoint

\* banner never looks like a tiny broken strip

\* banner does not overlap cards

\* arrows do not overlap cards



\## Brand breadcrumbs



\* breadcrumbs remain in one line

\* horizontal scroll works if needed

\* no body overflow



\## Catalog toolbar/search



\* filters/sorting are on one side

\* search is on the opposite side

\* toolbar remains one row

\* active search is wider and closer to top

\* search behavior still works



\## Pagination



\* pagination is one row

\* no wrapping into two rows

\* pagination does not overflow body

\* page change scrolls to top/catalog list



\## Cart



\* checkout summary block has rounded corners

\* mobile cart summary fits screen



\## About page



\* company cards do not overflow

\* text is readable

\* number badge fits



\## Warranty page



\* icon circles are same size

\* icons are centered

\* layout is clean on mobile and desktop



\## Global



\* no horizontal overflow at 320px

\* all text readable

\* all controls tappable

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* product slider responsive banner behavior

\* breadcrumb horizontal-scroll behavior

\* catalog mobile toolbar/search layout

\* pagination scroll-to-top behavior

\* cart summary styling

\* About/Warranty responsive fixes



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Product slider background banners must be hidden on breakpoints where they become visually inappropriate.

\* Breadcrumbs should stay in one line with internal horizontal scroll when needed.

\* Mobile catalog toolbar should keep filters/sort and search separated cleanly in one row.

\* Pagination must not wrap into awkward multiple rows on mobile.

\* Pagination changes should scroll the user back to the product list/top.

\* Card badges and icon circles must use fixed consistent sizes and must not cause overflow.

\* Mobile cards must never clip text or push content outside their containers.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Product sliders:

\- \[banner/arrow fixes]



Brand breadcrumbs:

\- \[one-line behavior]



Catalog toolbar/search:

\- \[search placement and active search behavior]



Pagination:

\- \[one-row layout and scroll-to-top]



Cart:

\- \[checkout block radius]



About page:

\- \[card size fixes]



Warranty:

\- \[icon circle fixes]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



