You are working as a senior frontend engineer and senior mobile UX designer.



Fix the remaining mobile layout issues shown in the attached screenshots.



The current mobile UI still has several weak areas:



1\. Catalog toolbar is split into two rows and takes too much vertical space.

2\. Category selection page uses the same icon for every category and looks unfinished.

3\. Bottom mobile navigation is missing on the mobile category/catalog page.

4\. Brand page title overflows outside the viewport.

5\. Brand page banner is too small and does not feel like a mobile hero/banner.

6\. Mobile footer lists look raw and not designed for mobile.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current mobile catalog toolbar.

5\. Inspect the mobile categories page/panel.

6\. Inspect bottom mobile navigation implementation.

7\. Inspect brand page mobile layout.

8\. Inspect footer mobile layout.

9\. Inspect existing icons and icon system.

10\. Follow existing localization, `Text`, `Heading`, `Button`, route helpers, and global design tokens.



\---



\# Part 1 — Mobile catalog toolbar must be one row



Current issue:



The catalog toolbar currently shows controls across multiple rows:



\* filter button

\* sorting button

\* search input



This takes too much space and looks bad on mobile.



Required behavior:



On mobile, this block must be one clean horizontal row.



Leave only icons:



1\. Filter icon

2\. Sort icon

3\. Search icon



Do not show long text labels in this mobile toolbar.



Expected mobile toolbar:



```text id="om90up"

\[filter icon] \[sort icon] \[search icon]

```



Requirements:



1\. Toolbar must stay in one row.

2\. Buttons must be touch-friendly.

3\. Icons must be centered.

4\. Buttons must have consistent size.

5\. Do not let the toolbar wrap to two lines.

6\. Do not let buttons overflow.

7\. Use existing filter/sort/search icons if available.

8\. If current icons are too large/small, normalize them through tokens/classes.

9\. On desktop, keep the current richer toolbar behavior unless a design requirement says otherwise.



Search behavior:



\* when clicking search icon, keep the current smart search behavior

\* search overlay/input opening behavior must remain as it is now

\* search should still redirect to catalog search on submit

\* quick search results must still work



Sorting behavior:



\* clicking sort icon opens sorting options

\* selected sorting still works

\* if selected sort label is shown elsewhere, keep it compact

\* do not force long sort text into the toolbar on mobile



Filter behavior:



\* clicking filter icon opens mobile filter drawer/bottom sheet/panel

\* filters still work

\* selected filters still apply correctly



\---



\# Part 2 — Better icons for mobile categories page



Current issue:



The mobile categories page uses the same icon for all categories, so it looks unfinished.



Improve category icons.



Use different icons depending on category meaning.



Suggested mapping:



```text id="dywivf"

Все товары -> grid/list/catalog icon

Наручные часы -> watch/clock icon

Интерьерные часы -> home/clock/interior icon

Аксессуары -> bag/box/accessory icon

Бренды -> tag/award/brand icon

Классические часы -> classic watch / clock icon

Спортивные часы -> activity/sport/watch icon

Дайверские часы -> waves/water/drop icon

Хронографы -> stopwatch/timer icon

Мужские часы -> user/male/person icon

Женские часы -> user/female/person icon

```



Use the existing icon library/components already used in the project.



Do not add a heavy icon library if the project already has enough icons.



If exact icons do not exist, choose the closest available icons.



Requirements:



1\. Each root category should have a visually meaningful icon.

2\. Child categories should also have meaningful icons where possible.

3\. Icon containers should look consistent.

4\. Active/current category should have a clear state.

5\. Rows/cards should remain clean and touch-friendly.

6\. The page must still use backend category data where possible.

7\. Do not hardcode category labels directly in JSX/TSX; use backend labels or localization.



\---



\# Part 3 — Add bottom mobile navigation to catalog/categories page



Current issue:



The mobile category/catalog page does not show the bottom mobile navigation.



Required:



1\. Add the bottom mobile navigation to this page too.



2\. Bottom nav must be consistent across mobile pages.



3\. It should include:



&#x20;  \* Главная

&#x20;  \* Категории

&#x20;  \* Корзина

&#x20;  \* Избранное

&#x20;  \* Профиль



4\. On the categories page, `Категории` must be active.



5\. On catalog page, choose active state according to the current route:



&#x20;  \* if browsing categories/catalog, `Категории` can be active

&#x20;  \* if route design has separate catalog state, follow project route logic



6\. Page content must have enough bottom padding so nav does not cover content.



7\. Bottom nav must not appear on desktop.



\---



\# Part 4 — Brand page mobile title must not overflow



Current issue:



On brand pages, large brand names such as `ROMANSON` overflow outside the phone screen.



Required:



1\. Brand title must never overflow viewport.



2\. Brand title must remain readable.



3\. Use responsive typography:



&#x20;  \* reduce font size on mobile

&#x20;  \* use `clamp()` or responsive tokens if appropriate

&#x20;  \* allow safe wrapping if needed

&#x20;  \* use `overflow-wrap` where needed



4\. Do not cut the brand name.



5\. Do not create horizontal scroll.



6\. Keep uppercase brand styling.



7\. Preserve desktop design.



Expected:



```text id="pd5uxn"

ROMANSON

```



must fit inside the mobile screen with normal page padding.



\---



\# Part 5 — Brand page mobile banner must be much larger



Current issue:



Brand page banner is too small on mobile.



Required:



1\. Brand banner must be full phone width or almost full phone width.

2\. Banner should occupy a large part of the mobile screen.

3\. It should feel like a real mobile hero/banner, not a small thumbnail.

4\. Use responsive image sizing.

5\. Preserve image composition.

6\. Do not distort the image.

7\. If the image contains important text or product composition, choose object-fit carefully.



Guidance:



\* mobile banner width: full available width

\* height: responsive, visually large

\* use aspect ratio or min-height strategy

\* avoid tiny banner strips



\---



\# Part 6 — Mobile footer list styling



Current issue:



Footer lists are currently raw vertical lists and look unfinished.



Improve mobile footer.



Minimum required:



1\. Footer lists should be centered on mobile.



Better preferred solution:



Create a more polished mobile footer structure.



Recommended:



```text id="s4rwmv"

\[VYMPEL logo]

\[social icons]



\[Contact cards]

\- Наш магазин

\- Написать нам



\[Разделы]

Наручные часы

Интерьерные часы

Аксессуары

Бренды



\[Информация]

О нас

Оплата

Гарантия

Доставка

```



Possible design choices:



1\. Centered link groups.

2\. Accordion sections.

3\. Card-like contact actions.

4\. Clear section headings.

5\. Consistent spacing and typography.

6\. Touch-friendly link height.



Choose the cleanest design that fits the current VYMPEL style.



Requirements:



\* no raw unstylized list look

\* no awkward left alignment unless it is intentionally designed

\* no oversized empty gaps

\* links must remain real internal links

\* footer must not overlap bottom mobile nav

\* footer must have enough bottom padding on mobile

\* all text must be localized



\---



\# Part 7 — Technical constraints



Do not break:



\* desktop layout

\* desktop catalog toolbar

\* search behavior

\* filter behavior

\* sorting behavior

\* category routing

\* bottom nav routing

\* brand page desktop design

\* footer desktop design



Avoid:



\* horizontal overflow

\* clipped text

\* overlapping elements

\* one-off hardcoded styles

\* duplicate components with inconsistent logic



Use global tokens/classes for reusable sizes, colors, spacing, radius, and responsive behavior.



\---



\# Part 8 — Verification checklist



Before finishing, verify:



\## Mobile catalog toolbar



\* filter/sort/search are in one row

\* only icons are shown

\* no wrapping to second row

\* buttons are touch-friendly

\* search still opens correctly

\* filters still open correctly

\* sorting still opens correctly



\## Mobile categories page



\* different icons are used for different category types

\* “Все товары” has a catalog/grid icon

\* watch categories have watch/clock-related icons

\* accessories have accessory/bag/box icon

\* interior clocks have interior/home/clock icon

\* nested categories still work

\* bottom nav appears

\* category bottom nav item is active



\## Brand mobile page



\* brand title does not overflow

\* no horizontal scroll

\* banner is full-width or almost full-width

\* banner is visually large

\* desktop brand page is not broken



\## Footer



\* mobile footer lists are styled

\* links are centered or otherwise mobile-designed

\* footer links are clickable

\* footer does not overlap bottom nav

\* desktop footer is not broken



\## Global



\* no horizontal overflow at 320px

\* all text readable

\* all controls tappable

\* all user-facing text localized

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* mobile catalog toolbar structure

\* mobile category icon mapping

\* bottom nav usage on category/catalog pages

\* brand page mobile title/banner behavior

\* mobile footer structure



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Mobile catalog toolbar must stay compact and one-line.

\* On mobile, catalog toolbar may use icon-only filter/sort/search controls.

\* Mobile category pages should use meaningful category-specific icons.

\* Bottom mobile navigation must be present on all main mobile public pages, including categories/catalog.

\* Brand titles must never overflow the viewport.

\* Mobile brand banners must remain visually large.

\* Mobile footer must be purpose-built and not a raw/shrunken desktop list.



\---



\# Final response required



```markdown id="3vm5t5"

Summary:

\- \[what changed]



Mobile catalog toolbar:

\- \[icon-only one-row behavior]



Mobile categories:

\- \[icon mapping and bottom nav]



Brand mobile page:

\- \[title and banner fixes]



Footer:

\- \[mobile footer styling]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions or remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



