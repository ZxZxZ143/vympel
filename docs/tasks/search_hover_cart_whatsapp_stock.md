You are working as a senior frontend/fullstack engineer on this project.



Implement the following UX fixes and cart checkout improvements:



1\. Make catalog and product page search animation identical to the home page search animation.

2\. Replace jerky hover animations in catalog/filter UI with elegant subtle hover effects.

3\. Improve WhatsApp checkout message from cart.

4\. Add cart stock validation so the user cannot add more items than available.

5\. Use shadcn Tooltip for stock-limit explanation.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the search component on the home page.

5\. Inspect search usage in catalog and product detail page.

6\. Inspect catalog category/filter hover animations.

7\. Inspect cart localStorage logic and product stock handling.

8\. Inspect current WhatsApp checkout redirect logic.

9\. Inspect product DTO fields, especially stock quantity, SKU/article/model/name.

10\. Inspect shadcn setup and Tooltip component availability.

11\. Follow existing localization, `Text`, `Heading`, `Button`, design token, and animation rules.



\---



\# Part 1 — Search animation consistency



Current problem:



The home page search animation looks correct, but the catalog page and product detail page search behavior is different and less polished.



Required behavior:



1\. Search on catalog page must use the same animation behavior as home page.

2\. Search on product detail page must use the same animation behavior as home page.

3\. On click/focus, search must smoothly move/expand toward the center.

4\. Inactive search may remain smaller, but active search must become centered and visually dominant.

5\. Search input and search dropdown must stay visually connected.

6\. No jerky animation.

7\. No disappearing border-radius.

8\. No layout jumping.

9\. No header/catalog/product page elements must visually stick out above the active search.

10\. Search must still submit to catalog search and show quick product results.



Preferred solution:



Refactor search into one shared component with variants:



```text

SmartSearch variant="home"

SmartSearch variant="catalog"

SmartSearch variant="product"

```



or follow the current project architecture.



All variants must share:



\* same animation logic

\* same open/close logic

\* same quick search logic

\* same submit behavior

\* same keyboard/outside-click handling



Only layout adaptation should differ by page.



\---



\# Part 2 — Catalog/filter hover animations



Current problem:



Hover animations in catalog/categories/filters are too jerky and visually unpleasant.



Use the attached screenshot as visual context for the area where hover effects are currently problematic.



Required behavior:



1\. Remove the current jerky hover animation in catalog and filter/category elements.

2\. Replace it with a subtle, premium, smooth hover effect.

3\. Preferred option: animated underline similar to the main navigation.

4\. Alternative: a subtle opacity/text-color/underline transition if it fits better.

5\. Hover must not shift layout.

6\. Hover must not change element height.

7\. Hover must not cause flicker.

8\. Category submenu hover must remain stable and usable.

9\. Filter/category selection must still work.



Recommended:



\* use `::after` underline animation

\* animate transform/scaleX or width

\* use consistent duration/easing from project tokens

\* respect `prefers-reduced-motion`



Apply this to:



\* catalog category selector items

\* catalog filter category items

\* filter option hover if appropriate

\* any other catalog hover elements that currently look jerky



Do not over-animate.



\---



\# Part 3 — WhatsApp checkout message



Current behavior:



Clicking the checkout button redirects to WhatsApp. Keep this behavior.



Required improvement:



The WhatsApp message must be generated automatically from the cart contents.



The message must include:



1\. Greeting.



2\. All cart positions.



3\. For each cart item:



&#x20;  \* product name

&#x20;  \* quantity

&#x20;  \* unit price

&#x20;  \* total price for that position

&#x20;  \* article/SKU at the very end of the product description



4\. Overall order total.



5\. Clean formatting, readable in WhatsApp.



6\. URL-encoded text.



Important:



The article is a technical field and must be shown at the very end of the product item description.



Use the project’s actual field for article/SKU. It may be:



```text

sku

article

model

vendorCode

```



Inspect the real product DTO and use the correct field.



Example WhatsApp message format:



```text

Здравствуйте! Хочу оформить заказ:



1\. Romanson TM9A21HMW

Количество: 2 шт.

Цена за единицу: 98 950 ₸

Сумма позиции: 197 900 ₸

Артикул: SKU-ROMANSON-TM9A21HMW



2\. Adriatica A1234

Количество: 1 шт.

Цена за единицу: 109 950 ₸

Сумма позиции: 109 950 ₸

Артикул: SKU-ADRIATICA-A1234



Итого: 307 850 ₸

```



Requirements:



\* use actual product name from cart/product data

\* use actual quantity

\* use actual price

\* calculate line total correctly

\* calculate order total correctly

\* handle empty cart safely

\* do not redirect if cart is empty; show localized toast/error

\* keep current WhatsApp phone/link configuration

\* all static text must be localized or centralized



\---



\# Part 4 — Cart stock validation



The cart must not allow adding more items than are available in stock.



Required behavior:



1\. Product card add-to-cart must respect available stock.



2\. Product detail add-to-cart must respect available stock.



3\. Cart quantity increment must respect available stock.



4\. If current quantity equals stock quantity, the increase button must be disabled.



5\. If product stock is 0 or unavailable:



&#x20;  \* add-to-cart button is disabled

&#x20;  \* item cannot be added to cart



6\. Cart must use actual stock value from product data.



7\. Do not rely on stale hardcoded values.



8\. If cart product data is refetched and stock is lower than current quantity, handle it gracefully:



&#x20;  \* reduce quantity to max available, or

&#x20;  \* show warning and block checkout until corrected



Choose the cleanest UX for the current cart architecture.



Recommended:



\* block increasing above stock

\* show tooltip on disabled plus button

\* show a small stock warning under the item



\---



\# Part 5 — Tooltip and stock message



Use shadcn Tooltip for the disabled quantity increase button.



When user hovers over disabled/inactive increase button because stock limit is reached, show tooltip:



```text

Больше этого количества товара нет на складе

```



Also show a subtle text under the cart item when quantity has reached the stock limit:



```text

Доступно только {stockQuantity} шт.

```



Use both:



1\. shadcn Tooltip on hover

2\. subtle inline message under item



Requirements:



\* tooltip must be styled to match the project design

\* do not leave raw default shadcn styling if it conflicts with VYMPEL design

\* message text must be localized

\* tooltip must work on disabled button; if native disabled blocks events, wrap the button in a span/div as needed

\* do not break accessibility

\* do not show tooltip if more stock is available



\---



\# Part 6 — Cart button state



Add-to-cart behavior must remain consistent:



1\. If item is not in cart:



&#x20;  \* button shows normal add state



2\. If item is already in cart:



&#x20;  \* button shows already-added state

&#x20;  \* clicking may navigate to cart or show toast depending on existing UX

&#x20;  \* do not silently add above available stock



3\. If stock limit reached:



&#x20;  \* show toast or tooltip/message

&#x20;  \* do not increase quantity above available stock



4\. If out of stock:



&#x20;  \* button disabled

&#x20;  \* show clear unavailable state



All text must be localized.



\---



\# Part 7 — Toast integration



If toast notifications already exist, reuse them.



If not, use existing shadcn toast/sonner setup according to project.



Required toasts:



\* product added to cart

\* product already in cart

\* quantity updated

\* stock limit reached

\* cart is empty on checkout attempt

\* WhatsApp checkout cannot be created because product data is missing



Toast style must match the VYMPEL design.



\---



\# Part 8 — Technical requirements



Do not introduce:



\* infinite renders

\* hydration errors

\* unstable animation loops

\* layout shifts

\* duplicate search implementations

\* duplicate cart state sources

\* direct localStorage access inside random components

\* hardcoded text in JSX/TSX



Use centralized hooks/services for:



\* cart state

\* product stock checks

\* WhatsApp message generation

\* search behavior



Recommended helpers:



```text

buildWhatsAppOrderMessage(cartItems, products)

canIncreaseCartItem(product, quantity)

getAvailableStock(product)

formatCurrency(value)

```



or follow existing project architecture.



\---



\# Part 9 — Verification checklist



Before finishing, verify:



\## Search



\* home search still works

\* catalog search uses the same animation as home search

\* product page search uses the same animation as home search

\* search moves/expands smoothly to the center

\* inactive search is smaller

\* active search is centered

\* border-radius does not disappear

\* no jerky animation

\* quick search results still work

\* full search redirects to catalog



\## Catalog/filter hover



\* old jerky hover animation is removed

\* new hover animation is smooth

\* underline/selected effect does not shift layout

\* category hover submenu is stable

\* filters still work



\## Cart stock



\* cannot add more than available stock

\* plus button disables at stock limit

\* shadcn Tooltip appears on disabled plus button

\* inline stock message appears under item

\* out-of-stock products cannot be added

\* stock validation works from product cards and product page



\## WhatsApp checkout



\* checkout still redirects to WhatsApp

\* message includes greeting

\* message includes every cart position

\* each item includes name, quantity, unit price, line total, and article/SKU at the end

\* total order sum is correct

\* message is URL encoded correctly

\* empty cart does not redirect and shows user-friendly message



\## Technical



\* no raw hardcoded UI strings

\* all new text localized

\* shadcn Tooltip styled to project

\* no hydration errors

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* shared search animation component/variants

\* catalog/product search usage

\* hover animation pattern

\* cart stock validation logic

\* WhatsApp checkout message builder

\* Tooltip usage for stock limit



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Home, catalog, and product page search must share the same smooth center-expanding animation.

\* Catalog/filter hover animations must not shift layout or flicker.

\* Cart quantity must never exceed available stock.

\* Disabled stock-limit controls must explain the reason using tooltip and inline message.

\* WhatsApp checkout message must include greeting, all cart positions, quantity, article/SKU, line totals, and order total.

\* Article/SKU is a technical field and must be shown at the end of each product item in checkout text.

\* shadcn components must be styled to match the project design.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Search:

\- \[how catalog/product search now matches home animation]



Catalog/filter hover:

\- \[what animation was replaced with]



Cart stock validation:

\- \[how stock limit is enforced]



WhatsApp checkout:

\- \[message format and redirect behavior]



Tooltip/toasts:

\- \[shadcn tooltip/toast usage]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



