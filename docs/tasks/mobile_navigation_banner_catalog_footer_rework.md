You are working as a senior frontend engineer and senior mobile e-commerce UX designer.



Implement the next iteration of the mobile adaptation. Use the attached screenshots as visual QA references and UX inspiration.



This task is specifically about improving the mobile experience and fixing the current weak/broken patterns.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current mobile responsive implementation.

5\. Inspect the home page sections, hero/banner slider, “Новинки”, philosophy/brand/story section, catalog toolbar, mobile navigation, footer, product page, and category navigation.

6\. Inspect current route helpers, search/category/filter/sort logic, and footer/header components.

7\. Inspect current icons/components for bottom navigation, tooltip, drawer/sheet, and mobile menu.

8\. Follow existing localization, `Text`, `Heading`, `Button`, route-helper, and design token rules.



Important project rules:



\* all user-facing text must be localized

\* use existing `Text`, `Heading`, `Button`, icons, and global design tokens

\* do not hardcode raw UI strings in JSX/TSX

\* do not use arbitrary Tailwind values/raw hex if reusable tokens should exist

\* preserve desktop functionality while improving mobile UX

\* update `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md` after finishing



\---



\# Main Goal



Improve the mobile adaptation properly.



The current mobile version still has weak UX and layout problems. Rework it using strong e-commerce mobile patterns similar to large stores like Technodom/Kaspi/Ozon/WB, but adapted to the VYMPEL design.



This task includes:



1\. Better mobile hero/banner behavior

2\. Better “Новинки” / product slider composition

3\. Better philosophy/story section on mobile

4\. New bottom mobile navigation

5\. Mobile-only categories page/menu flow

6\. Cleaner catalog mobile toolbar

7\. Cleaner product characteristics layout

8\. Better mobile footer

9\. Profile placeholder/tooltip behavior

10\. Fixing the overlapping background-banner issue both on mobile and desktop



\---



\# Part 1 — Main mobile hero/banner



Current issue:



The banner is too short on mobile and does not feel like a hero banner.



Required:



1\. On mobile, the main hero/banner must be much taller.

2\. It should occupy a large portion of the screen — close to full viewport height.

3\. It must still feel like a real hero block, not a thin strip.

4\. It must remain responsive and visually balanced.

5\. Text/content inside the banner should remain readable.

6\. The image must not be cropped in a way that destroys the composition.



Guidance:



\* aim for a strong mobile hero presence

\* approximately near full-screen feel

\* use a responsive min-height/max-height strategy

\* do not force the same height as desktop



Choose the best responsive solution, but the result should visually match the intention from the screenshot: the banner must feel large and important.



\---



\# Part 2 — Slider arrows and “Новинки” section composition



Current problems:



\* slider arrows overlap product cards

\* the background banner behind cards behaves incorrectly

\* on desktop, a bug also appeared where the banner goes under/into the cards incorrectly

\* on mobile, the layout feels visually broken



Required:



1\. Remove the slider arrows from the area where they overlap cards.



2\. Either:



&#x20;  \* move arrows lower, outside the card area

&#x20;  \* or reposition them so they do not interfere with the cards

&#x20;  \* or hide them on mobile if dots/swipe are enough



3\. Fix the background banner behavior behind the “Новинки”/product-slider block.



4\. On desktop, remove the bug where the background banner incorrectly overlaps/goes into cards.



5\. The section must look like a premium e-commerce content block.



Important design choice:



For mobile, decide which looks better:



\### Option A



Keep the background/banner behind the cards, but do it cleanly and intentionally.



\### Option B



Remove the background banner behind the cards completely on mobile if that gives a much cleaner result.



Choose the better option visually and implement it cleanly.



The result must not look broken.



\---



\# Part 3 — Philosophy / brand-story / lifestyle section on mobile



Current issue:



The section with photos + text (the “philosophy” style block) looks weak/uncomfortable on mobile.



You should redesign its mobile structure.



You may define a clean mobile structure for this section yourself, based on senior UX judgment.



Recommended structure:



1\. Section title / small intro

2\. Main image or main lifestyle visual

3\. Supporting text block

4\. Additional supporting image(s) below or in a horizontally scrollable row

5\. Optional CTA if the section already has one



Possible mobile layout patterns:



\### Pattern 1



\* main image on top

\* text below

\* supporting small images in a horizontal row/carousel



\### Pattern 2



\* text first

\* one strong image below

\* one supporting image/full-width card below



\### Pattern 3



\* image card

\* text card

\* second image card

&#x20; stacked vertically with comfortable spacing



Requirements:



\* no cramped side-by-side desktop layout forced into mobile

\* text must remain readable

\* images must remain visually strong

\* layout must look intentional and editorial/premium



Implement the best mobile version for this block.



\---



\# Part 4 — Bottom mobile navigation



Add bottom mobile navigation similar to the attached example.



Required items:



1\. Главная

2\. Категории

3\. Корзина

4\. Избранное

5\. Профиль



Behavior:



\* bottom nav is visible only on mobile/tablet small breakpoints where it makes sense

\* desktop should not use this bottom nav

\* active item must be visually highlighted

\* icons + labels must be readable

\* spacing must be clean and touch-friendly

\* bottom nav must not overlap important content without compensation

\* page content should have bottom padding so bottom nav does not cover controls



Routes:



\* Главная → home

\* Категории → mobile categories page/panel

\* Корзина → cart

\* Избранное → favorites

\* Профиль → not available yet



\---



\# Part 5 — Profile item behavior



Profile is not implemented yet.



Required:



1\. On desktop, if user tries to open profile, show a tooltip:



&#x20;  \* profile is under development

2\. On mobile, do the same

3\. Use a clean tooltip/popup solution consistent with project design

4\. Do not create a broken/dead route if profile page does not exist yet

5\. The label and tooltip text must be localized



Example text:



```text id="9ti1sz"

Профиль скоро появится

Раздел находится в разработке

```



Use short clean wording.



\---



\# Part 6 — Mobile header simplification



For mobile top area:



Keep only:



1\. store name / logo

2\. side menu / mobile menu trigger

3\. language switching

4\. other top controls that already exist there if they still fit cleanly



Important:



\* do not keep the full desktop top navigation in the mobile top bar

\* mobile top bar should be clean and minimal

\* bottom nav will carry the main navigation role

\* top area should remain elegant and uncluttered



\---



\# Part 7 — Mobile categories page / panel



The user attached a reference of what should open when pressing “Категории”.



Implement a mobile-only categories page/panel/navigation flow.



Important:



\* this mobile categories view should be available only on phone/mobile breakpoints

\* desktop should keep its own catalog/category navigation pattern



Required behavior:



1\. Opening “Категории” from bottom nav opens the mobile categories page/panel.



2\. Show category list as clean tappable rows/cards similar to the attached example.



3\. Add a button/item:



&#x20;  \* “Все товары”



4\. If a category has nested child categories:



&#x20;  \* tapping the parent goes deeper into the child-category level

&#x20;  \* also show “Все товары” for the current parent category

&#x20;  \* “Все товары” opens the product listing of the parent category itself



5\. Nested navigation should support:



&#x20;  \* parent category

&#x20;  \* child categories

&#x20;  \* optionally breadcrumbs/back button in mobile style



6\. The UI must be touch-friendly and clear.



Pattern:



```text id="1pp5hm"

\[Все товары]

\[Категория 1] >

\[Категория 2] >

\[Категория 3] >

```



If user opens a category with children:



```text id="fgr8d7"

< Назад

\[Все товары]

\[Подкатегория 1] >

\[Подкатегория 2] >

...

```



Use the actual category tree from backend if available.



Do not hardcode category data if it already exists in the project/backend.



\---



\# Part 8 — Catalog toolbar changes



On the catalog page, in the top mobile toolbar:



1\. Remove the Categories button from the top toolbar



2\. Leave only two controls:



&#x20;  \* Filters

&#x20;  \* Sorting



3\. Filters may be icon-only on mobile



4\. Sorting should show the selected sorting label



5\. The selected sorting label should remain visible both on mobile and on desktop



6\. The sorting label should be short — one or two words max



Examples:



```text id="qqdv7i"

Сначала новые

По цене ↑

По цене ↓

Популярные

```



Do not let sorting text become too long.



Desktop requirement too:



\* the selected sorting label should also remain visible on desktop

\* concise wording only



\---



\# Part 9 — Product characteristics layout



Current issue:



Characteristic name and value are displayed one under another and look bad on mobile.



Required:



1\. Characteristic name and characteristic value must be on one line.

2\. They should read like:



```text id="v7qv7z"

Браслет: Керамический

Корпус: Титановый

Страна: Швейцария

```



3\. Do not split them into two separate stacked lines unless absolutely necessary for very long content.

4\. Use proper wrapping behavior if text is too long:



&#x20;  \* label and value still belong visually to one row

&#x20;  \* avoid awkward broken two-line blocks per field

5\. Typography must remain readable.



Apply this where product characteristics/details are shown.



\---



\# Part 10 — Mobile footer redesign



Current footer is basically a shrunken desktop footer.



Required:



1\. Redesign the footer for mobile.

2\. It must not be just a reduced desktop footer.

3\. Use a more mobile-friendly structure.



Recommended mobile footer structure:



\### Block 1



\* logo / brand name

\* social icons

\* contact/store links



\### Block 2



\* important navigation links in vertical list or accordion



Possible layout:



```text id="imxcq4"

VYMPEL

\[Instagram] \[WhatsApp]

\[Наш магазин]

\[Написать нам]



Разделы

\- Наручные часы

\- Интерьерные часы

\- Аксессуары

\- Бренды



Информация

\- О нас

\- Оплата

\- Гарантия

\- Доставка

```



Optional:



\* accordion groups for cleaner mobile UX



Requirements:



\* readable spacing

\* easy touch targets

\* no oversized empty gaps

\* no cramped multi-column desktop layout forced into mobile



\---



\# Part 11 — Desktop cross-check



Some changes must also improve desktop, not only mobile.



Required desktop fixes:



1\. Fix the bug where the background banner in the product-slider/content block overlaps or behaves incorrectly behind the cards.

2\. Sorting selected label should remain visible on desktop too.

3\. Profile tooltip should work on desktop too.

4\. Do not break existing desktop layout while adapting mobile.



\---



\# Part 12 — Design / UX expectations



Use good mobile e-commerce patterns.



Guidelines:



1\. Keep layouts clear and touch-friendly.

2\. Prefer vertical stacking over cramped horizontal compression.

3\. Use compact but readable toolbar labels.

4\. Important controls should be reachable.

5\. Avoid text truncation that hides meaning.

6\. Avoid overlapping elements.

7\. Avoid over-complex layouts on small screens.

8\. Preserve premium visual feel.



You may borrow good structural ideas from major mobile e-commerce interfaces, but adapt them to the current project style.



\---



\# Part 13 — Verification checklist



Before finishing, verify:



\## Hero/banner



\* mobile banner is much taller

\* banner feels like a hero section

\* banner image composition is acceptable

\* no broken cropping



\## Product slider / Новинки



\* arrows do not overlap cards

\* background banner issue is fixed on desktop

\* mobile version of this block looks intentional

\* either banner-behind-cards works cleanly or is removed on mobile



\## Philosophy block



\* mobile structure is redesigned

\* text and images are readable

\* layout does not feel cramped



\## Bottom nav



\* bottom mobile nav appears on mobile

\* items: Home, Categories, Cart, Favorites, Profile

\* active state works

\* content is not covered



\## Profile



\* desktop tooltip works

\* mobile tooltip works

\* no dead broken route



\## Mobile categories



\* opens from bottom nav

\* category tree works

\* “Все товары” exists

\* nested categories work correctly

\* parent “Все товары” opens parent category product listing

\* available only on mobile



\## Catalog toolbar



\* top mobile toolbar no longer shows categories

\* only filters and sorting remain

\* filters can be icon-only

\* sorting shows active selected value

\* desktop sorting also shows active selected value



\## Product details



\* characteristic name and value appear on one line

\* text remains readable



\## Footer



\* mobile footer is redesigned

\* no desktop-style cramped columns

\* links remain usable



\## Technical



\* no horizontal overflow

\* no overlapping blocks

\* all text localized

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* bottom mobile navigation

\* mobile-only categories page/panel flow

\* responsive hero/banner behavior

\* catalog toolbar changes

\* mobile footer structure

\* profile tooltip behavior

\* product details row layout

\* slider/banner overlap fix



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Mobile hero banners must remain visually large.

\* Mobile bottom navigation is used for primary navigation on phones.

\* Mobile category browsing uses a dedicated mobile-only categories flow.

\* Parent categories with children must include a “Все товары” action for the parent listing.

\* Mobile catalog toolbar should stay compact; category control should not duplicate bottom-nav category access.

\* Sorting labels should stay visible and use short wording.

\* Product characteristic labels and values should remain on one line where possible.

\* Mobile footer must be purpose-built, not just a shrunken desktop footer.

\* Desktop fixes must be preserved while improving mobile.



\---



\# Final response required



```markdown id="z5t2px"

Summary:

\- \[what changed]



Mobile hero/banner:

\- \[what was changed]



Slider/content blocks:

\- \[arrow positioning and background-banner fixes]



Mobile navigation:

\- \[bottom nav and mobile categories flow]



Catalog:

\- \[toolbar and sorting changes]



Product details:

\- \[characteristics layout changes]



Footer:

\- \[mobile footer changes]



Desktop cross-fixes:

\- \[desktop bugs fixed too]



Tests:

\- \[what was run or why not run]



Notes:

\- \[remaining assumptions or follow-up items]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



