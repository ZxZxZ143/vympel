You are working as a senior frontend engineer and senior mobile UX designer.



The current mobile adaptation is unacceptable and must be fixed properly. Use the attached screenshots as examples of current broken mobile UI.



This is not a small CSS patch. Perform a full mobile QA pass and rebuild the responsive behavior where needed.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect current responsive/mobile changes.

5\. Inspect all screenshots attached to this task.

6\. Inspect header, navigation, catalog, product cards, banners, product page, filters, footer, toasts, and all responsive layouts.

7\. Inspect current global responsive tokens/breakpoints.

8\. Do not run watch/dev-server commands as final checks.

9\. Do not continue any script that runs forever.



\---



\# Main problem



The mobile version currently looks broken.



Examples of problems visible in screenshots:



\* logo is oversized/cropped and overlaps

\* header elements are too large and crowded

\* brand menu/list is too stretched and not designed for mobile

\* banners are cropped badly and text/images are cut off

\* service/feature blocks are oversized

\* product cards overflow and are partially visible

\* out-of-stock badges overlap product cards badly

\* category banners cut text into unreadable pieces

\* product images are huge and crop incorrectly

\* footer layout is too large and poorly spaced

\* product tabs overflow horizontally and cut text

\* catalog toolbar buttons are too narrow and truncate text badly

\* breadcrumbs break into awkward lines

\* price inputs are huge and unusable on mobile

\* toast overlaps content and currently looks like a debug/error badge

\* some elements cause horizontal overflow

\* some text becomes unreadable or is available only as one visible letter/word



Fix this to a real e-commerce mobile quality level.



Use proven mobile patterns from large e-commerce websites such as Technodom, Kaspi, Ozon, Wildberries, etc. as UX inspiration, but do not copy their branding/assets/styles directly. Adapt common successful patterns to the VYMPEL visual identity.



\---



\# Required mobile quality standard



The mobile site must be:



\* readable

\* intuitive

\* touch-friendly

\* stable

\* visually premium

\* not cramped

\* not oversized

\* not horizontally scrollable

\* not overlapping

\* not clipped

\* usable at 320px width



Every text must be readable.



Every important control must be tappable.



No section should require weird infinite horizontal scrolling just to read one word.



No elements should overlap each other.



No desktop layout should be forced onto mobile.



\---



\# Viewports to verify



Manually verify at least:



```text

1440px

1024px

768px

480px

390px

360px

320px

```



The site must not break at 320px.



\---



\# Part 1 — Header mobile fix



Fix mobile header completely.



Required:



1\. Logo must not be cropped.

2\. Logo must not overlap icons.

3\. Logo must scale down properly.

4\. Header icons must remain tappable.

5\. Language selector must fit.

6\. Favorite/cart badges must not overlap icons awkwardly.

7\. Search must not break header.

8\. Navigation must not be displayed as a compressed desktop row if it does not fit.

9\. Use mobile menu/drawer if needed.

10\. Header height must be balanced and premium.



Do not solve this by hiding important functionality without replacement.



\---



\# Part 2 — Mobile navigation / brands menu



Brand/category navigation must be redesigned for mobile.



Current long brand list looks raw and too large.



Required:



1\. Brand/category lists must use mobile-friendly spacing.

2\. Text must be readable but not oversized.

3\. Lists must not create awkward huge empty gaps.

4\. Active/hover states should be subtle.

5\. Use accordion/drawer/bottom-sheet pattern if needed.

6\. Root categories and child categories must be easy to navigate.

7\. Brand names must link correctly.



\---



\# Part 3 — Banners and large images



Fix all banners and large images.



Required:



1\. Banners must not crop important content badly.

2\. Text inside images should remain readable where possible.

3\. If image composition does not work on mobile, use `object-fit: contain` or a different aspect strategy.

4\. Do not force desktop crop onto mobile.

5\. Large banners should remain visually important, but not destroy layout.

6\. Use responsive aspect ratios and min/max heights.

7\. No banner should show only a tiny random slice of image or cut text halfway.



For mobile, prefer:



\* full-width cards

\* controlled aspect ratios

\* `object-fit` chosen per banner

\* rounded corners only where project design uses them

\* no horizontal overflow



\---



\# Part 4 — Product cards mobile redesign



Product cards currently break/overflow.



Fix product cards across:



\* home

\* catalog

\* favorites

\* brand pages

\* similar products

\* new products



Required:



1\. Cards must fit viewport.

2\. On mobile, use a clean 2-column grid only if readable.

3\. On very small screens, use 1-column or compact 2-column only if it still looks good.

4\. Product image must not be oversized/cropped awkwardly.

5\. Product name, collection, price, favorite/cart buttons must fit.

6\. Out-of-stock label must not overlap badly.

7\. Buttons must remain tappable.

8\. Product cards must not cause horizontal scroll.

9\. Product card grid must align from the start, not center awkwardly.



\---



\# Part 5 — Catalog mobile redesign



Catalog toolbar and filters are currently broken.



Fix:



\* category button

\* filters button

\* sort button

\* breadcrumbs

\* price inputs

\* filter drawer/panel

\* product grid



Required:



1\. Catalog toolbar buttons must not cut text awkwardly.

2\. Use icons + shorter labels on mobile if needed.

3\. Do not show full desktop filter dropdown on very small mobile.

4\. Use bottom sheet/drawer for filters.

5\. Price inputs must be usable and not huge.

6\. Breadcrumbs must be compact:



&#x20;  \* either wrap cleanly

&#x20;  \* or use horizontal scroll with proper spacing

&#x20;  \* or shorten with ellipsis

7\. Filters must remain accessible and readable.

8\. Category changes and filter application must still work.



\---



\# Part 6 — Product page mobile fix



Fix product page responsive layout.



Current issues include:



\* product image/gallery cropping badly

\* huge image sections

\* tabs cut off

\* tab underline looks broken

\* content overflows



Required:



1\. Product gallery must adapt to mobile.

2\. Main product image must fit screen width.

3\. Thumbnails should become horizontal carousel if needed.

4\. Product info must stack below image.

5\. Price/actions must be easy to tap.

6\. Tabs should become:



&#x20;  \* horizontal scroll tabs with readable labels

&#x20;  \* or accordion sections

7\. Do not cut tab labels like “Гара”.

8\. Characteristics/details must be readable.



\---



\# Part 7 — Footer mobile fix



Footer currently looks oversized and poorly spaced.



Required:



1\. Footer must be mobile-friendly.

2\. Logo and social icons must scale properly.

3\. Footer links should stack cleanly or become accordions.

4\. Contact links must be readable.

5\. No huge awkward empty gaps.

6\. No horizontal overflow.



\---



\# Part 8 — Toast redesign



Current toast looks like a debug/error badge and is too intrusive.



Fix toast behavior and design.



Updated requirement:



1\. Toast text is allowed to wrap if needed.

2\. Toast text must wrap cleanly, not awkwardly.

3\. Toast button must be smaller than before.

4\. Toast button must be round/pill-shaped.

5\. Toast button text should remain readable but not huge.

6\. Toast must not cover important UI aggressively.

7\. Toast must not overflow on mobile.

8\. Toast must match VYMPEL style, not default/debug styling.

9\. Remove or restyle any red “Issues” looking badge if it is not actual user-facing UI.

10\. Use shadcn toast/sonner only if styled to project design.



Recommended mobile toast behavior:



\* compact card

\* max-width within viewport

\* message wraps naturally

\* action button below or beside text depending on width

\* subtle border/shadow

\* no bright debug red unless it is a real error state



\---



\# Part 9 — Text and typography



Fix mobile typography globally.



Required:



1\. Text must not be too small.

2\. Text must not be absurdly large.

3\. Headings must scale down on mobile.

4\. Long labels must wrap or be shortened safely.

5\. No one-letter/one-word columns.

6\. Use responsive text tokens.

7\. Use readable line heights.

8\. Avoid fixed widths that force bad wrapping.



\---



\# Part 10 — General layout rules



Fix all mobile layout issues.



Required:



1\. No horizontal overflow.

2\. No overlapping elements.

3\. No clipped important content.

4\. No fixed desktop widths on mobile.

5\. No absolute positioning that breaks at small widths.

6\. No elements that are wider than viewport.

7\. No uncontrolled carousels showing broken partial content unless intentionally designed.

8\. No forms/inputs larger than screen.

9\. No buttons hidden outside screen.

10\. Body width must remain stable.



Use senior-level CSS patterns:



\* `minmax(0, 1fr)` in grids where needed

\* `max-width: 100%`

\* `overflow-wrap`

\* responsive aspect ratios

\* container queries if project supports them

\* mobile-first overrides where cleaner

\* reusable responsive components/tokens



\---



\# Part 11 — Specific QA fixes from screenshots



Fix these visible issues:



1\. Header logo cropping.

2\. Header icon/badge alignment.

3\. Brand list spacing and scale.

4\. Banner clipping and unreadable image text.

5\. Feature/service blocks too huge.

6\. Product card overflow and half-visible cards.

7\. Out-of-stock badge placement.

8\. Category banner word splitting.

9\. Product image huge crop.

10\. Footer vertical rhythm.

11\. Product tabs cutting labels.

12\. Catalog toolbar labels truncated too aggressively.

13\. Breadcrumbs awkward wrapping.

14\. Price input broken sizing.

15\. Toast/debug badge overlap.



Do not ignore these as “minor”.



\---



\# Part 12 — Technical stability



Do not introduce:



\* infinite render loops

\* hydration errors

\* layout shift loops

\* repeated measurement loops

\* endless scripts

\* watch commands as checks

\* duplicate mobile components with inconsistent logic



If using JS measurements for responsiveness, be careful. Prefer CSS solutions where possible.



\---



\# Part 13 — Verification checklist



Before finishing, verify:



\## Global



\* no horizontal scroll at 320px

\* no element overlaps

\* no important text is clipped

\* all major pages are usable

\* text is readable

\* buttons are tappable



\## Header



\* logo fits

\* icons fit

\* menu/search works

\* badges align



\## Home



\* banners look good

\* feature blocks fit

\* product sections fit



\## Catalog



\* toolbar works

\* filters usable

\* categories usable

\* product grid fits

\* breadcrumbs readable

\* price inputs usable



\## Product page



\* gallery fits

\* product info readable

\* tabs/accordion readable

\* actions tappable



\## Cart/favorites



\* cards/items fit

\* quantities/buttons fit

\* toast works



\## Footer



\* footer links readable

\* contact/social elements fit



\## Toasts



\* toast text wraps cleanly

\* button is smaller and round

\* no debug-looking red badge unless intended

\* toast does not overflow



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* mobile QA fixes

\* responsive layout strategy

\* components changed

\* remaining image/content limitations if any



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Mobile UI must be QA-checked at 320px, 360px, 390px, 480px, 768px.

\* Do not ship responsive layouts with horizontal overflow, clipped text, or overlapping elements.

\* Mobile product cards must use readable grid/card patterns.

\* Catalog filters must use mobile-friendly drawer/bottom-sheet patterns when desktop dropdowns do not fit.

\* Toasts on mobile may wrap text cleanly and must not look like debug badges.

\* Header logo/icons must scale and never overlap.

\* Large banners must preserve composition and not crop important content badly.

\* Prefer proven e-commerce mobile UX patterns adapted to VYMPEL style.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Root cause:

\- \[why the mobile adaptation was broken]



Mobile QA fixes:

\- \[header/catalog/product/footer/cards/banners fixes]



Toast:

\- \[new toast behavior]



Responsive strategy:

\- \[breakpoints/layout patterns used]



Screens checked:

\- \[viewports checked]



Tests:

\- \[commands run]

\- \[commands intentionally not run]



Notes:

\- \[remaining limitations]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



Do not finish until the public site is usable at 320px without horizontal overflow, clipped critical text, or overlapping major elements.



