You are working as a senior fullstack engineer on this project.



Implement catalog category selection, full internal site navigation, temporary working favorites/cart functionality through `localStorage`, and a full Favorites page matching the attached screenshot.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect current header/navigation implementation.

5\. Inspect current catalog toolbar where filters/sorting/search are located.

6\. Inspect existing category model/API/backend data.

7\. Inspect current catalog route/query params.

8\. Inspect current product card, product page, like/favorite button, and cart button.

9\. Inspect existing favorites page if it already exists.

10\. Inspect existing product sections/blocks that can be reused for Favorites and Similar Products.

11\. Inspect existing localization files.

12\. Inspect `Text`, `Heading`, `Button`, icons, form components, and global design tokens.



Follow project rules:



\* all user-facing text must be localized

\* use existing `Text`, `Heading`, `Button`, and UI components

\* use global design tokens/classes

\* do not hardcode raw UI strings in JSX/TSX

\* do not use arbitrary Tailwind values/raw hex colors if reusable tokens should exist

\* reuse existing blocks/components where possible

\* update `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md` after finishing



\---



\# Part 1 — Category selector in catalog toolbar



Add a category selector button in the catalog toolbar.



Placement:



\* The category selector must be placed to the left of the `Фильтры` button.

\* It must visually match the style of the `Фильтры` button.

\* It should feel like part of the same toolbar group.



Button text:



```text

Категории

```



or the currently selected category label if a category is selected.



Example:



```text

Категории

Наручные часы

Интерьерные часы

```



Use localization.



Styling:



\* Same typography/style approach as the filters button.

\* If filters button uses icon + text, category button may use a suitable existing icon if one exists.

\* Do not create a duplicate styling system.

\* Reuse the same dropdown positioning/behavior pattern as filters/sorting where possible.



Behavior:



1\. On click, open category dropdown/panel.

2\. On outside click, close the dropdown.

3\. On category selection:



&#x20;  \* update catalog route/query params

&#x20;  \* reset page to 1

&#x20;  \* clear invalid filters for previous category

&#x20;  \* load products for selected category

&#x20;  \* load category-specific filters for selected category

4\. The selected category must persist through URL params after page reload.

5\. If category is cleared, catalog returns to general product listing.



\---



\# Part 2 — Category dropdown with parent/child categories



Implement dropdown behavior like in most online stores.



Required structure:



1\. First show base/root categories.

2\. If a root category has child categories, show child category list on hover.

3\. Child categories must appear next to the hovered parent category, like a submenu.

4\. User can click either root category or child category.

5\. Active/selected category should be visually highlighted.

6\. If a parent has no children, no child submenu should appear.

7\. Keyboard/accessibility behavior should be reasonable if project has patterns for it.



Example root categories:



```text

Наручные часы

Интерьерные часы

Аксессуары

```



Child categories for wristwatches:



```text

Классические часы

Спортивные часы

Дайверские часы

Хронографы

```



Use the actual category data from backend if available.



Do not hardcode category structure on the frontend if backend already provides hierarchy.



Preferred backend response shape:



```json

\[

&#x20; {

&#x20;   "id": 1,

&#x20;   "slug": "wristwatches",

&#x20;   "label": "Наручные часы",

&#x20;   "children": \[

&#x20;     {

&#x20;       "id": 2,

&#x20;       "slug": "classic-watches",

&#x20;       "label": "Классические часы"

&#x20;     }

&#x20;   ]

&#x20; }

]

```



Adapt to existing DTO style.



\---



\# Part 3 — Backend category support if needed



If backend already has category tree endpoint, reuse it.



If not, add a public endpoint for category navigation.



Possible endpoint:



```text

GET /api/catalog/categories/tree

```



or follow existing route conventions.



Required:



1\. Return root categories.

2\. Return child categories.

3\. Return localized labels.

4\. Return slugs/ids used by catalog routing.

5\. Do not include inactive/deleted categories unless the public catalog should show them.

6\. Category hierarchy must match product/category logic.

7\. Category selection must integrate with existing catalog filtering endpoint.



\---



\# Part 4 — Internal site navigation



Configure internal site navigation across the public site.



Check all existing important pages and connect navigation correctly.



Required navigation links:



\* Home page

\* Catalog

\* Wristwatches / Наручные часы

\* Interior clocks / Интерьерные часы

\* Brands / Бренды

\* Accessories / Аксессуары

\* Brand pages if already implemented

\* Product detail pages

\* Cart page

\* Favorites page

\* Profile/account/login pages if they exist



Requirements:



1\. Header links must navigate to correct pages.

2\. Dropdown category links must navigate to catalog with selected category.

3\. Brand links must navigate to brand pages if implemented.

4\. Product cards must navigate to product detail pages.

5\. Breadcrumbs must use correct internal routes where pages exist.

6\. Search from any page must redirect to catalog search.

7\. Header cart icon must navigate to cart page.

8\. Header heart/favorite icon must navigate to favorites page.

9\. If a target page does not exist yet, create a minimal clean page or document it clearly.



Do not leave dead links like `#` unless there is no page and it is documented.



\---



\# Part 5 — Working favorites through localStorage



Implement working favorite/like functionality temporarily through `localStorage`.



This is temporary until backend user favorites are implemented.



Required behavior:



1\. Clicking like/heart on a product toggles favorite state.



2\. Favorite state persists after page reload.



3\. Favorite state is shared across:



&#x20;  \* product cards

&#x20;  \* product detail page

&#x20;  \* favorites page

&#x20;  \* header favorite icon/count if implemented

&#x20;  \* catalog page

&#x20;  \* brand pages

&#x20;  \* new products sections

&#x20;  \* similar products sections

&#x20;  \* all other product sections where product cards are used



4\. Use product id as the stable key.



5\. Store minimal data in localStorage:



&#x20;  \* product id

&#x20;  \* optionally product snapshot if needed for favorites page



6\. Do not store large unnecessary data.



7\. Do not break future backend integration.



Recommended localStorage key:



```text

vympel:favorites

```



or follow existing project naming conventions.



Favorites page:



\* If favorites page exists, update it according to this task.

\* If favorites page does not exist, create it.

\* Favorites page must read selected products from localStorage.

\* If product snapshots are not enough, fetch product details by ids.

\* If there are no favorites, show localized empty state.



Requirements:



\* favorite action should visually update immediately

\* favorite button active state must be correct after reload

\* all labels/errors/empty states localized

\* do not show backend errors for localStorage-only functionality



\---



\# Part 6 — Favorites page design



Create/update the Favorites page to match the attached screenshot.



Page title:



```text

Избранное

```



The page should use standard project page paddings, layout width, typography, header, and spacing.



Do not invent a separate layout system.



Use the same standard page layout as other public pages.



Required structure:



```text

Header

Navigation

Search



Page title: Избранное



Favorite products grid/list



120px vertical spacing



Section title: Похожие товары



Similar products carousel/grid

```



Important spacing:



```text

distance between main Favorites block and Similar Products block: 120px

```



Use global spacing tokens/classes if they exist. If not, add reusable token/class according to project style.



The screenshot shows:



\* header at the top

\* navigation under the logo/header area

\* title `Избранное`

\* favorite product cards

\* then `Похожие товары`

\* then a horizontal row/carousel of product cards with arrows



Use existing product card component.



Do not create another product card from scratch.



If there is already a carousel/slider component in the project, reuse it.



\---



\# Part 7 — Favorite product cards and active favorite indication



Add clear visual indication that a product is already in Favorites.



This indication must appear everywhere product cards are displayed:



\* Favorites page

\* Catalog page

\* Brand pages

\* Home page sections

\* New products sections

\* Similar products sections

\* Product detail page if there is a favorite button

\* Any other product card usage



Required behavior:



1\. If product is in favorites, heart icon/button must look active.

2\. If product is not in favorites, heart icon/button must look inactive.

3\. Active state must persist after reload.

4\. Toggling favorite on one page must update the UI consistently elsewhere.

5\. Favorite state must be based on the centralized localStorage favorites service/hook.

6\. Do not duplicate favorite state logic per component.

7\. Do not hardcode active state in card markup.



Visual style:



\* Use existing heart/favorite icon if available.

\* Active heart should be visually different from inactive heart.

\* In Favorites page screenshot, active favorite appears as a filled/darker heart on the product image area.

\* Follow current project icon style.

\* Use global tokens/classes.



Important:



If a product is removed from favorites while on the Favorites page, it should disappear from the favorites list or update after state change, according to clean UX.



\---



\# Part 8 — Similar products section on Favorites page



Add a `Похожие товары` section under favorite products.



Spacing:



```text

top spacing from Favorites block: 120px

```



Section title:



```text

Похожие товары

```



Use existing typography styles for section titles if available.



Similar products behavior:



1\. Show products that are similar to favorite products.

2\. If there are favorite products, similar products can be selected by:



&#x20;  \* same brand

&#x20;  \* same category

&#x20;  \* same collection

&#x20;  \* same product type

&#x20;  \* same characteristics if available

3\. Exclude products already in favorites where possible.

4\. If there are no favorite products, show popular/new products as fallback.

5\. If backend has a recommendation/similar-products endpoint, use it.

6\. If backend does not have such endpoint, implement a clean frontend fallback using existing catalog/product APIs.



The section should use existing product cards.



If a carousel already exists, use it.



If not, implement a simple horizontal product row with existing arrow controls if the project has arrow icons.



Do not overbuild recommendation logic if backend support is not present.



\---



\# Part 9 — Working cart through localStorage



Implement working cart functionality temporarily through `localStorage`.



This is temporary until backend cart/order functionality is implemented.



Required behavior:



1\. Clicking add-to-cart on a product adds it to cart.

2\. If product is already in cart, increase quantity or show existing state according to current UX.

3\. Cart persists after page reload.

4\. Header cart icon/count updates.

5\. Cart page displays products from cart.

6\. User can:



&#x20;  \* increase quantity

&#x20;  \* decrease quantity

&#x20;  \* remove item

&#x20;  \* clear cart if useful

7\. Out-of-stock products must not be addable to cart.

8\. Product price must come from actual product data.

9\. Cart total must calculate from actual price × quantity.

10\. Cart must update if product data is fetched and price changed.



Recommended localStorage key:



```text

vympel:cart

```



or follow existing project naming conventions.



Cart item structure should be minimal:



```json

{

&#x20; "productId": 123,

&#x20; "quantity": 1

}

```



If needed, store product snapshot, but prefer fetching by ids if API supports it.



Requirements:



\* add-to-cart button state updates immediately

\* cart count updates immediately

\* cart persists after reload

\* no unavailable product can be added

\* all UI text localized

\* loading/error/empty states handled



\---



\# Part 10 — Shared localStorage hooks/services



Do not scatter localStorage logic randomly.



Create reusable utilities/hooks/services, for example:



```text

useFavorites()

useCart()

favoritesStorage

cartStorage

```



or follow current project structure.



Required:



1\. Centralize localStorage read/write logic.

2\. Handle SSR/client-only access safely if this is Next.js.

3\. Guard against invalid JSON in localStorage.

4\. Keep logic typed.

5\. Make future backend replacement easy.

6\. Update UI after storage changes.

7\. Product cards must consume favorite/cart state from these shared hooks/services.



If the app has global state/store pattern, use or integrate with it.



\---



\# Part 11 — Public analytics integration



If product analytics tracking already exists, connect localStorage favorite/cart actions to it.



Required if analytics endpoint exists:



1\. On favorite/like, send `FAVORITE` event.

2\. On add to cart, send `ADD\_TO\_CART` event.

3\. Tracking failure must not break the UI.

4\. Do not block localStorage action because analytics failed.



\---



\# Part 12 — Localization



All new UI text must be localized:



\* `Категории`

\* `Избранное`

\* `Похожие товары`

\* category dropdown labels if not backend-localized

\* empty favorites

\* empty cart

\* add to cart

\* remove from cart

\* quantity labels

\* cart total

\* selected category labels if frontend-owned

\* loading/error states



If category labels come from backend already localized, use them.



Do not hardcode Russian strings directly in components.



\---



\# Part 13 — Verification checklist



Before finishing, verify:



\## Category selector



\* category button appears left of filters

\* category button has same style as filters button

\* clicking category opens dropdown

\* root categories are shown first

\* child categories appear on hover

\* clicking root category navigates/filters catalog

\* clicking child category navigates/filters catalog

\* selected category persists after reload

\* category change resets page to 1

\* category change clears invalid filters

\* category-specific filters update correctly



\## Internal navigation



\* header links work

\* category links work

\* brand links work if brand pages exist

\* product cards open product pages

\* search redirects to catalog

\* cart icon opens cart page

\* favorite icon opens favorites page

\* no important nav link is dead



\## Favorites



\* product can be liked

\* product can be unliked

\* favorite state persists after reload

\* favorite state is correct in cards and product page

\* favorite state is correct in catalog

\* favorite state is correct on brand pages

\* favorite state is correct in new products blocks

\* favorite state is correct in similar products blocks

\* active/favorited product has visible marked heart/icon

\* favorites page shows selected products

\* removing a product from favorites updates Favorites page

\* empty favorites state works



\## Favorites page layout



\* page title `Избранное` is displayed

\* favorite products are shown under title

\* similar products section appears below

\* distance between Favorites block and Similar Products block is `120px`

\* section title `Похожие товары` is displayed

\* similar products use existing product card component

\* page uses standard project paddings and styles

\* existing blocks/components are reused where possible



\## Cart



\* product can be added to cart

\* cart persists after reload

\* cart count updates

\* cart page shows products

\* quantity can be changed

\* item can be removed

\* unavailable products cannot be added

\* totals are calculated correctly



\## Technical



\* localStorage access is SSR-safe

\* invalid localStorage data does not crash app

\* all text localized

\* no raw hardcoded UI strings

\* no duplicate product card implementation was created

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* category selector component/location

\* category tree API/data source

\* catalog category query param behavior

\* internal navigation routes

\* localStorage favorites flow

\* localStorage cart flow

\* favorites page route/layout

\* similar products logic on Favorites page

\* cart/favorites pages if added

\* analytics event connections if added



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Catalog category selector lives left of filters and uses the same toolbar styling.

\* Category dropdown must use backend category hierarchy where available.

\* Category changes reset pagination and clear invalid filters.

\* Internal navigation must use real routes, not placeholder links.

\* Temporary favorites use centralized localStorage logic.

\* Temporary cart uses centralized localStorage logic.

\* localStorage access must be SSR-safe.

\* Unavailable products must not be addable to cart.

\* Favorites page must reuse existing product cards/sections.

\* Favorite active state must be displayed consistently on all product cards across the site.

\* Similar products on Favorites page should be based on favorite products when possible.

\* Future backend favorites/cart should replace storage services without rewriting UI components.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Category selector:

\- \[button/dropdown/category hierarchy behavior]



Navigation:

\- \[routes/links fixed]



Favorites:

\- \[localStorage behavior]

\- \[active favorite state on cards]



Favorites page:

\- \[layout, favorite products, similar products]



Cart:

\- \[localStorage behavior]



Analytics:

\- \[events connected if applicable]



Localization:

\- \[keys/files added]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, limitations, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



