You are working as a senior frontend/fullstack engineer on this project.



Implement polished empty states, error states, 404 page, and toast notifications across the public website, especially for catalog, cart, favorites, and product actions.



Use the existing project visual style. The UI must look like part of the VYMPEL design system, not like a generic template.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect existing public layout, header, footer, typography, product cards, catalog page, cart page, favorites page, product page, and global styles.

5\. Inspect existing `Text`, `Heading`, `Button`, icon components, and `globals.css`.

6\. Inspect existing localization files.

7\. Inspect current cart/favorites localStorage hooks/services.

8\. Inspect current add-to-cart and favorite/like button logic.

9\. Inspect whether shadcn/ui is already installed in the project.



Follow project rules:



\* all user-facing text must be localized

\* use existing `Text`, `Heading`, `Button`, product card, and design tokens

\* do not hardcode raw UI strings in JSX/TSX

\* do not use arbitrary Tailwind values or raw hex colors if reusable tokens should exist

\* update `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md` after finishing



\---



\# Main Goal



Add complete user-friendly handling for:



1\. catalog empty states

2\. catalog loading/error states

3\. empty favorites

4\. empty cart

5\. product not found

6\. 404 page

7\. API/network errors

8\. failed localStorage operations

9\. toast notifications after adding/removing favorites

10\. toast notifications after adding to cart

11\. product card button state when product is already in cart



All of this must be styled according to the project design.



\---



\# Part 1 — Toast notifications with shadcn/ui



Use shadcn/ui for toast notifications.



If shadcn toast/sonner is already installed, reuse existing setup.



If it is not installed, add it cleanly according to the project structure.



Preferred:



\* use shadcn `sonner` if the project already supports it

\* otherwise use shadcn toast pattern that fits the project



Important:



The default shadcn style must be adapted to the project design.



Toast style must match VYMPEL:



\* clean minimal style

\* project typography

\* project colors

\* subtle border/shadow

\* not overly colorful

\* not generic default look

\* must feel like the rest of the website



Do not leave raw default shadcn visual style if it conflicts with the project.



\---



\# Part 2 — Toast behavior for Favorites



When user adds a product to favorites:



Show success toast.



Example content:



```text

Товар добавлен в избранное

```



Toast must include action button/link:



```text

Перейти в избранное

```



Button/link behavior:



```text

/favorites

```



When user removes product from favorites:



Show toast.



Example:



```text

Товар удалён из избранного

```



Optional action:



```text

Открыть избранное

```



Requirements:



1\. Toast appears after successful localStorage update.

2\. Toast must not appear if operation failed silently.

3\. If localStorage fails, show error toast.

4\. Favorite active state must update immediately on the product card.

5\. Toast action button must navigate to Favorites page.

6\. All text must be localized.

7\. Do not duplicate toast logic in every component. Create reusable helpers if needed.



\---



\# Part 3 — Toast behavior for Cart



When user adds product to cart:



Show success toast.



Example:



```text

Товар добавлен в корзину

```



Toast must include action button/link:



```text

Перейти в корзину

```



Button/link behavior:



```text

/cart

```



If the product is already in cart:



\* button should show that product is already added

\* do not add duplicate item incorrectly

\* either increase quantity according to current cart logic or show already-added state

\* toast should clearly reflect the result



Examples:



```text

Товар уже в корзине

```



or:



```text

Количество товара обновлено

```



depending on the chosen cart behavior.



Requirements:



1\. Toast appears after successful cart operation.

2\. Toast action button navigates to Cart page.

3\. If product is out of stock, show error/warning toast and do not add it.

4\. If localStorage/cart write fails, show error toast.

5\. Cart icon/count must update immediately.

6\. All text must be localized.



\---



\# Part 4 — Product card cart button state



Update product cards so the add-to-cart button changes state when product is already in cart.



Required behavior:



1\. If product is not in cart:



&#x20;  \* show normal add-to-cart button/icon.



2\. If product is already in cart:



&#x20;  \* button must visually change.

&#x20;  \* text/icon/state must show that the product is already added.

&#x20;  \* clicking may navigate to cart, increase quantity, or show toast depending on current UX decision.

&#x20;  \* choose the cleanest behavior and keep it consistent across the site.



3\. If product is out of stock:



&#x20;  \* button is disabled or visually unavailable.

&#x20;  \* clicking must not add to cart.

&#x20;  \* show localized message/toast if user tries.



This state must work everywhere product cards are displayed:



\* catalog

\* brand pages

\* favorites

\* similar products

\* new products

\* home sections

\* product detail page if it has add-to-cart button



Use centralized cart hook/service.



Do not duplicate cart state per card.



\---



\# Part 5 — Empty states



Create beautiful reusable empty state components in project style.



Use or create reusable component:



```text

EmptyState

```



It should support:



\* title

\* description

\* optional icon/illustration

\* optional action button

\* optional secondary action



Do not create separate one-off empty markup for every page.



\## Catalog empty state



When catalog has no products after filters/search:



Show a beautiful empty state.



Example:



```text

Ничего не найдено

Попробуйте изменить фильтры или поисковый запрос.

```



Actions:



\* `Сбросить фильтры`

\* optionally `Перейти в каталог`



Required:



\* reset filters button must actually clear filters/search/category if appropriate

\* page resets to 1

\* style matches project design



\## Favorites empty state



When favorites are empty:



```text

В избранном пока пусто

Добавляйте товары в избранное, чтобы быстро вернуться к ним позже.

```



Action:



```text

Перейти в каталог

```



\## Cart empty state



When cart is empty:



```text

Корзина пока пуста

Добавьте товары в корзину, чтобы оформить заказ.

```



Action:



```text

Перейти в каталог

```



\## Similar products empty state



If similar products cannot be loaded or there are none, show a small clean fallback or hide the section depending on existing UX.



Do not leave blank broken areas.



\---



\# Part 6 — Error states



Create beautiful reusable error state component.



Use or create:



```text

ErrorState

```



It should support:



\* title

\* description

\* retry button

\* optional navigation button



Examples:



\## Catalog loading error



```text

Не удалось загрузить каталог

Проверьте подключение и попробуйте ещё раз.

```



Action:



```text

Повторить

```



\## Product loading error



```text

Не удалось загрузить товар

Попробуйте обновить страницу или вернуться в каталог.

```



Actions:



\* `Повторить`

\* `Перейти в каталог`



\## Favorites/cart loading error



If product ids exist in localStorage but product data cannot be fetched:



```text

Не удалось загрузить товары

Попробуйте обновить страницу.

```



Action:



```text

Повторить

```



Requirements:



1\. Errors must not look like raw browser/backend errors.

2\. Do not show stack traces to users.

3\. Show friendly localized messages.

4\. Provide useful recovery actions.

5\. Log technical error safely if project has logging/debug pattern.



\---



\# Part 7 — 404 page



Create/update the 404 page.



It must match the project style.



Required content:



Title example:



```text

Страница не найдена

```



Description example:



```text

Возможно, страница была удалена или адрес указан неверно.

```



Actions:



\* `На главную`

\* `Перейти в каталог`



Requirements:



1\. Use project header/footer/layout if appropriate for the framework.

2\. Use project typography and spacing.

3\. Use `Text`, `Heading`, `Button`.

4\. Add clean minimal visual element/icon if suitable.

5\. Do not leave default framework 404 page.

6\. All text must be localized.



If framework supports route-level `not-found`, implement according to project convention.



\---



\# Part 8 — Product not found state



If product detail route receives unknown/invalid product slug/id:



Show product not found state instead of crashing.



Content:



```text

Товар не найден

Возможно, он был удалён или временно недоступен.

```



Actions:



\* `Перейти в каталог`

\* optionally `На главную`



This can reuse `ErrorState` or `EmptyState`.



\---



\# Part 9 — Loading states



Improve loading states where needed:



\* catalog loading

\* product loading

\* favorites loading

\* cart loading

\* similar products loading

\* search loading



Use existing skeletons/loaders if project has them.



If not, create minimal project-style loading states.



Do not show broken empty layout while data is loading.



\---



\# Part 10 — localStorage error handling



Cart/favorites currently work through localStorage.



Add safe handling:



1\. Invalid JSON must not crash app.

2\. Missing localStorage in SSR must not crash app.

3\. localStorage quota/security error must show friendly toast or fallback.

4\. Storage utilities must return safe defaults.

5\. Do not read/write localStorage during render.

6\. All localStorage actions must go through centralized service/hooks.



If corrupted localStorage is detected, safely reset that key.



\---



\# Part 11 — Localization



Add localization keys for all new UI text:



Toast messages:



\* product added to favorites

\* product removed from favorites

\* product added to cart

\* product already in cart

\* product quantity updated

\* product out of stock

\* cart operation failed

\* favorites operation failed

\* go to cart

\* go to favorites



Empty states:



\* catalog empty

\* favorites empty

\* cart empty

\* similar products empty



Error states:



\* catalog load failed

\* product load failed

\* favorites load failed

\* cart load failed

\* retry

\* go home

\* go catalog



404:



\* page not found title

\* page not found description



Do not hardcode Russian strings directly in components.



\---



\# Part 12 — Design system / globals.css



Add or reuse design tokens/classes for:



\* toast surface

\* toast border

\* toast title

\* toast description

\* toast action button

\* empty state title

\* empty state description

\* error state title

\* error state description

\* 404 page layout

\* muted text

\* subtle border

\* card-like surface



Use existing colors and typography from the project.



Do not use random colors.



The final UI should feel consistent with:



\* product cards

\* catalog

\* informational pages

\* header/navigation

\* brand pages



\---



\# Part 13 — Verification checklist



Before finishing, verify:



\## Toasts



\* adding favorite shows toast

\* removing favorite shows toast

\* favorite toast has button to Favorites page

\* adding to cart shows toast

\* cart toast has button to Cart page

\* out-of-stock add attempt shows clear message

\* toast style matches project, not raw default shadcn

\* all toast text localized



\## Cart state



\* cart button changes when product is already added

\* cart button state persists after reload

\* cart count updates

\* product cannot be added if out of stock



\## Empty states



\* catalog empty state works

\* favorites empty state works

\* cart empty state works

\* reset filters button works

\* empty states use project styling



\## Error states



\* catalog API error shows friendly error

\* product API error shows friendly error

\* favorites product fetch error shows friendly error

\* retry buttons work where implemented

\* no raw stack traces shown



\## 404



\* unknown route shows custom 404

\* unknown product shows product not found state

\* 404 actions navigate correctly



\## Technical



\* no infinite render loops

\* localStorage access is SSR-safe

\* shadcn toast is installed/configured correctly if needed

\* no duplicate toast providers

\* all text localized

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* toast provider/location

\* toast helper/hooks

\* empty/error state components

\* 404 route/page

\* cart/favorites localStorage error handling

\* product card cart/favorite state behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Public UX must show friendly empty/error states instead of blank or broken screens.

\* Toast notifications must be used for cart/favorite operations.

\* Toasts must include navigation actions where useful.

\* shadcn components must be restyled to match the project design.

\* Add-to-cart button must reflect already-added state.

\* Out-of-stock products must not be addable to cart.

\* localStorage errors must not crash the app.

\* 404 and product-not-found states must use project layout and localization.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Toasts:

\- \[shadcn setup and cart/favorite notifications]



Cart/favorites:

\- \[button state, localStorage safety]



Empty states:

\- \[catalog/favorites/cart states]



Error states:

\- \[API/product/list errors]



404:

\- \[custom page and product-not-found handling]



Localization:

\- \[keys/files added]



Design system:

\- \[tokens/classes added or reused]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



