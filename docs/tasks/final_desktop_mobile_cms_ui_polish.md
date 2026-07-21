You are working as a senior frontend/fullstack engineer and UI/UX designer.



Implement the following desktop and mobile polish fixes for the VYMPEL site.



This is a focused improvement task. Do not rewrite unrelated architecture. Fix only the listed issues.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect existing public UI components, product tabs, cart/favorites toasts, modal/dialog components, CMS banner logic, categories, footer links, and mobile layout.

5\. Inspect existing `Text`, `Heading`, `Button`, toast, shadcn dialog/popover components, route helpers, localization files, and global design tokens.

6\. Follow existing localization and design-token rules.

7\. Do not run long-running dev/start/watch commands as final checks.



Project rules:



\* all user-facing text must be localized

\* use `Text`, `Heading`, `Button`, and existing project components

\* use global tokens/classes instead of arbitrary raw Tailwind values

\* do not hardcode strings in JSX/TSX

\* preserve desktop and mobile layouts unless the task explicitly changes them

\* update `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md` after finishing



\---



\# DESKTOP FIXES



\## 1. Toast action buttons



For desktop toasts:



Current issue:



\* toast buttons say things like `Перейти в избранное` or `Перейти в корзину`



Required:



1\. Change these toast action labels to simply:



```text

Перейти

```



2\. Toast action button must be round/pill-shaped.

3\. Button must match the site style.

4\. Do this for:



&#x20;  \* add to cart toast

&#x20;  \* add to favorites toast

&#x20;  \* any similar navigation toast



Do not make the toast huge.



\---



\## 2. Favorites page spacing and navigation



On the Favorites page:



1\. Add top spacing:



```text

margin-top: 40px

```



2\. Add navigation/breadcrumbs like other pages.

3\. Breadcrumbs/navigation must use the same project style.

4\. Favorites content must stay aligned with the standard page container.



\---



\## 3. Product tabs: warranty, delivery, order/payment descriptions



On the product page tabs, update the content for:



\* `Гарантия`

\* `Доставка`

\* `Заказ и оплата`



Use the exact text and styles below.



\---



\### Гарантия tab



Title:



```text

Гарантийный срок изделия - 1 год

```



Title params:



```css

font-size: 20px;

font-weight: 500;

color: #000000;

```



Description:



```text

В случае выхода изделия из строя в период действия гарантийного срока, наша компания берет на себя все расходы, связанные с гарантийным обслуживанием, включая оплату доставки изделия в сервисный центр, выполнение ремонтных работ, а также последующую доставку отремонтированного изделия до получателя.

```



Description params:



```css

font-size: 20px;

font-weight: 300;

color: #000000;

```



Spacing:



```text

margin between title and description: 30px

```



At the end add button/link:



```text

Подробнее →

```



Button/link requirements:



1\. Use existing similar “Подробнее →” / link-with-arrow style from the project.

2\. Font size: `20px`.

3\. Font weight: `500`.

4\. Top margin from text: `40px`.

5\. Link goes to the warranty details page.



\---



\### Доставка tab



Paragraph 1:



```text

Доставка заказов осуществляется службами маркетплейсов, на которых представлен наш товар:

Kaspi, Wildberries, Ozon.

```



Paragraph 2:



```text

Сроки и стоимость доставки устанавливаются маркетплейсом и отображаются при оформлении заказа.

```



Paragraph 3:



```text

Также доступен бесплатный самовывоз из магазина.

Адрес и график работы указаны на сайте.

```



Params for all paragraphs:



```css

font-size: 20px;

font-weight: 300;

color: #000000;

```



Spacing:



```text

margin between paragraphs: 30px

```



Bold parts:



```text

службами маркетплейсов

Kaspi, Wildberries, Ozon.

```



At the end add button/link:



```text

Подробнее →

```



Button/link requirements:



1\. Use existing similar style from project.

2\. Font size: `20px`.

3\. Font weight: `500`.

4\. Top margin from text: `40px`.

5\. Link goes to the delivery details page.



\---



\### Заказ и оплата tab



Paragraph 1:



```text

Оплата заказов осуществляется через маркетплейсы при оформлении покупки на их платформах:

Kaspi, Wildberries, Ozon.

```



Paragraph 2:



```text

При самовывозе из магазина оплата возможна:

```



List:



```text

наличным расчётом;

банковскими картами через терминалы Kaspi Bank и Halyk Bank;

банковским переводом.

```



Params:



```css

font-size: 20px;

font-weight: 300;

color: #000000;

```



Spacing:



```text

margin between blocks: 30px

```



Bold parts:



```text

через маркетплейсы

Kaspi, Wildberries, Ozon

Kaspi Bank и Halyk Bank

```



At the end add button/link:



```text

Подробнее →

```



Button/link requirements:



1\. Use existing similar style from project.

2\. Font size: `20px`.

3\. Font weight: `500`.

4\. Top margin from text: `40px`.

5\. Link goes to the payment/order details page.



\---



\## 4. Product description links spacing



In the product `Описание` tab:



There are links like:



```text

Все наручные часы ...

О бренде

```



Required:



1\. Distance between `Все наручные часы ...` and `О бренде` must be:



```text

50px

```



2\. Keep existing link style.



\---



\## 5. Cart item delete confirmation



When deleting a single product from cart:



1\. Show confirmation popup/modal.

2\. Use shadcn Dialog/AlertDialog if available.

3\. Style popup according to VYMPEL design.

4\. Buttons must be round/pill-shaped.

5\. Buttons must match the site style.

6\. Do not use default ugly browser confirm.

7\. Text must be localized.

8\. Confirm button deletes product.

9\. Cancel button closes popup.



Suggested text:



```text

Удалить товар из корзины?

Товар будет удалён из вашей корзины.

Отмена

Удалить

```



\---



\## 6. Cart clear confirmation



When clearing the entire cart:



1\. Show confirmation popup/modal.

2\. Use shadcn Dialog/AlertDialog if available.

3\. Style popup according to VYMPEL design.

4\. Buttons must be round/pill-shaped.

5\. Buttons must match the site style.

6\. Text must be localized.

7\. Confirm button clears cart.

8\. Cancel button closes popup.



Suggested text:



```text

Очистить корзину?

Все товары будут удалены из корзины.

Отмена

Очистить

```



\---



\## 7. Add “Детские часы” category



Add category:



```text

Детские часы

```



Required:



1\. Add it to landing page category blocks.

2\. Add it to the general category structure.

3\. Add route/navigation/filter support according to existing category logic.

4\. If backend categories are used, add/seed it properly.

5\. If it should inherit from `Наручные часы`, implement it as a child category if that matches the current category structure.

6\. Make sure links work.

7\. Add localization.



\---



\# MOBILE FIXES



\## 8. Advantages/benefits blocks alignment



On mobile, inside advantage/benefit blocks:



Current issue:



\* content is centered



Required:



1\. Align inner content from the start/left.

2\. Text and icons should not be centered unless a specific design requires it.

3\. Keep spacing clean and mobile-friendly.



\---



\## 9. “Смотреть все” button near headings



On mobile:



1\. Make `Смотреть все →` button near section headings smaller.

2\. It should not dominate the heading.

3\. Keep it readable and tappable.

4\. Use existing project style.



\---



\## 10. Spacing after “Философия”



On mobile:



1\. Spacing after `Философия` heading must be standard.

2\. It should match spacing after other section headings.

3\. Remove any excessive or inconsistent gap.



\---



\## 11. Info pages bottom spacing before footer



On mobile pages:



\* `Гарантия`

\* `Оплата`

\* `Доставка`



Current issue:



\* spacing after content before footer is too large



Required:



1\. Reduce bottom spacing before footer.

2\. Keep it visually balanced.

3\. Do not make it too tight.



\---



\## 12. CMS mobile banners for all pages



CMS currently allows mobile banners only for some places, but this must work everywhere.



Required:



1\. CMS must allow setting mobile banner images not only for the home page.



2\. This must work for all CMS-managed banners:



&#x20;  \* home banners/sliders

&#x20;  \* catalog/category banners

&#x20;  \* brand banners

&#x20;  \* about page banner

&#x20;  \* cooperation/contact banners

&#x20;  \* other migrated CMS image blocks



3\. Images must be fetched from backend everywhere.



4\. Static/preloaded images must be fallback only if backend returns nothing.



5\. If backend returns CMS image, use backend image.



6\. If backend returns no image, use the existing local fallback that is already in the project for that place.



7\. Mobile-specific CMS image must be used on mobile if available.



8\. If mobile image is missing, fallback to desktop CMS image.



9\. If CMS image missing completely, fallback to existing local placeholder/static image.



10\. Do not create broken images.



Fallback order:



```text

1\. CMS mobile image for current locale

2\. CMS desktop image for current locale

3\. CMS mobile image for default locale

4\. CMS desktop image for default locale

5\. existing local fallback image

```



Also make sure CMS cache/revalidation still works:



\* CMS changes must appear publicly immediately or after at most the second reload.



\---



\## 13. All brands page



Create a page for all brands.



Required:



1\. Page should list all available brands.

2\. Each brand should link to its brand page.

3\. User must be able to open this page from the footer.

4\. Footer `Бренды` link should lead to this all-brands page.

5\. Page must follow the standard public page layout.

6\. Add navigation/breadcrumbs.

7\. Add empty state if no brands are available.

8\. Use backend brands if available.

9\. Do not hardcode brands if backend provides them.

10\. Make it responsive.



Preferred route:



```text

/brands

```



or use existing route conventions.



\---



\## 14. Product card/page description spacing on mobile



On mobile, in product `Описание`:



Current issue:



\* spacing between description and link to `Все наручные часы ...` is too large



Required:



1\. Make this spacing smaller.

2\. Keep it visually consistent with mobile layout.

3\. Desktop spacing from earlier requirement should remain correct.



\---



\## 15. Favorites removal toast behavior



When removing product from favorites:



Current issue:



\* toast shows button like `Открыть избранное`



Required:



1\. Remove `Открыть избранное` button from removal toast.

2\. Toast text should say that product was removed.

3\. Toast should include action button:



```text

Отменить

```



4\. Clicking `Отменить` must restore the product to favorites.

5\. Button should match toast button style.

6\. Text must be localized.

7\. This applies to product cards, favorites page, product page, and anywhere favorites can be removed.



Suggested toast:



```text

Товар удалён из избранного

Отменить

```



\---



\## 16. Filter underline removal



On mobile/filters:



Current issue:



\* filter active state has underline



Required:



1\. Remove underline in filters.

2\. Keep only border/outline as active visual state.

3\. Active filter should remain clear.

4\. Style must match project design.

5\. Do not remove active state completely.



\---



\# Additional styling rules



\## “Подробнее →” link style



Use existing project style if possible.



If no reusable component exists, create/reuse a link component:



```text

Подробнее →

```



Requirements:



1\. Font size: 20px.

2\. Font weight: 500.

3\. Arrow like attached screenshot.

4\. Clean inline alignment.

5\. Hover state subtle.

6\. Links use route helpers.



\---



\# Verification checklist



Before finishing, verify:



\## Desktop



\* toast action buttons say `Перейти`

\* toast action buttons are round/pill-shaped

\* Favorites page has 40px top spacing and navigation

\* product tabs content updated for warranty/delivery/order-payment

\* `Подробнее →` links work and lead to correct pages

\* spacing between `Все наручные часы` and `О бренде` is 50px

\* cart item delete confirmation works

\* cart clear confirmation works

\* confirmation modals are styled

\* all modal buttons are round

\* `Детские часы` appears in categories and works



\## Mobile



\* advantage blocks align from start

\* `Смотреть все` near headings is smaller

\* spacing after `Философия` is standard

\* Warranty/Payment/Delivery pages have smaller bottom gap before footer

\* CMS mobile banners work beyond home page

\* CMS images are fetched from backend where available

\* local fallback appears only if backend returns nothing

\* all brands page exists and is linked from footer

\* product description link spacing is smaller

\* favorite removal toast shows `Отменить`, not `Открыть избранное`

\* undo returns product to favorites

\* filter underline removed, border remains



\## CMS



\* mobile image can be selected for all CMS banner blocks

\* public pages use backend CMS images

\* fallback images work

\* cache/revalidation still works



\## Technical



\* no hardcoded UI strings

\* all text localized

\* no unrelated regressions

\* no long-running dev/start/watch checks

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* updated product tab content and links

\* cart confirmation modal behavior

\* favorites toast undo behavior

\* all brands page route

\* children watches category

\* CMS mobile banner support across pages

\* CMS image fallback order

\* mobile filter active style



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Toast navigation actions should use concise labels like `Перейти`.

\* Favorite removal toast should offer undo instead of navigation.

\* Destructive cart actions require styled confirmation dialogs.

\* Product tab info blocks must link to detailed pages with the project `Подробнее →` style.

\* CMS-managed banners must use backend images first and local images only as fallback.

\* CMS mobile banner variants must work across all CMS-managed pages, not only home.

\* Footer brand link must lead to the all-brands page.

\* Mobile filter active state should use outline/border, not underline.

\* Mobile benefit blocks should align content from the start unless page design says otherwise.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Desktop:

\- \[toast/favorites/product tabs/cart modals/category changes]



Mobile:

\- \[benefits/buttons/spacing/CMS/favorites/filter changes]



CMS:

\- \[mobile banners/backend image fallback changes]



Brands:

\- \[all brands page and footer link]



Cart:

\- \[delete/clear confirmation]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



