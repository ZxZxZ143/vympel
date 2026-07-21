You are working as a senior frontend/fullstack engineer on this project.



Configure full internal navigation for all available pages and all internal links across the public website.



The goal is that every clickable internal link must lead to the correct existing page or to the catalog with the correct category/filter/query params applied.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect all existing public routes/pages.

5\. Inspect header navigation, footer navigation, breadcrumbs, product cards, brand pages, catalog links, informational pages, favorite/cart links, and all CTA links.

6\. Inspect catalog route/query params, category filters, product filters, and backend filter keys.

7\. Inspect localization files.

8\. Follow existing `Text`, `Heading`, `Button`, link components, and global design token rules.



\---



\# Main task



Set up complete internal navigation for all available pages.



No internal link should be dead, empty, or point to `#` if the target page/functionality exists.



All navigation must use real routes and real catalog query params.



\---



\# Required navigation behavior



\## 1. Direct page links



If a page exists, links must open that page directly.



Examples:



```text id="0ksdg9"

Home -> /

Catalog -> /catalog

Brands -> /brands or brand dropdown/page route

Favorites -> /favorites

Cart -> /cart

Warranty -> /guarantee or actual warranty route

Delivery -> /delivery or actual delivery route

Payment -> /payment or actual payment route

```



Use the actual project route conventions.



Do not invent duplicate routes if pages already exist.



\---



\## 2. Catalog category links



If a link refers to a product category, it must open the catalog with that category selected.



Examples:



```text id="gmybmp"

Наручные часы -> /catalog?category=wristwatches\&page=1

Интерьерные часы -> /catalog?category=interior-clocks\&page=1

Аксессуары -> /catalog?category=accessories\&page=1

Классические часы -> /catalog?category=classic-watches\&page=1

Спортивные часы -> /catalog?category=sport-watches\&page=1

Дайверские часы -> /catalog?category=diver-watches\&page=1

Хронографы -> /catalog?category=chronographs\&page=1

```



Use the real category slugs/ids from the backend/project.



When navigating to a category:



\* reset page to `1`

\* clear invalid filters from previous category

\* load category-specific filters

\* keep sorting only if current project UX supports it safely

\* do not keep incompatible filter params



\---



\## 3. Catalog filter links



If a link semantically means a filtered catalog, it must open the catalog with the correct category and filter params.



Example:



If a link says:



```text id="l0psor"

Мужские часы

```



then it must open the catalog with wristwatch category and gender filter applied:



```text id="xw9shn"

/catalog?category=wristwatches\&gender=MEN\&page=1

```



or the actual filter key/value used by the backend.



If the backend expects filters in a different format, use that exact format.



Other examples:



```text id="4b7gdl"

Женские часы -> catalog wristwatches + gender WOMEN

Кварцевые часы -> catalog wristwatches + mechanism QUARTZ

Механические часы -> catalog wristwatches + mechanism MECHANICAL

Часы Romanson -> catalog + brand Romanson

Часы Adriatica -> catalog + brand Adriatica

Стальные часы -> catalog + relevant material filter

```



Important:



\* Do not guess filter keys.

\* Inspect current backend/frontend filter parameter format.

\* Use the same format already used by catalog filters.

\* Filter links must produce the same result as manually selecting that filter in the catalog UI.



\---



\# 4. Brand links



Brand links must open existing brand pages if brand pages exist.



Examples:



```text id="2wqmdf"

/brands/romanson

/brands/adriatica

/brands/appella

/brands/pierre-ricaud

/brands/rhythm

/brands/royal-london

```



If a brand page does not exist but catalog brand filtering exists, link to catalog filtered by brand:



```text id="7jkcec"

/catalog?brand=romanson\&page=1

```



Preferred behavior:



\* brand navigation dropdown -> brand page

\* “Перейти к каталогу” on brand page -> catalog filtered by that brand



Use real brand slugs.



\---



\# 5. Product links



All product cards must link to the correct product detail page.



Required:



\* product card image/title click opens product detail

\* arrow/open button opens product detail

\* product links use stable product slug/id according to current project routing

\* do not use placeholder hrefs

\* favorite/cart buttons must not trigger product navigation accidentally unless intended



\---



\# 6. Breadcrumbs



All breadcrumbs must use real internal links.



Examples:



```text id="r0a3a0"

Главная -> /

Бренды -> /brands or brand nav route

Romanson -> /brands/romanson

Каталог -> /catalog

Наручные часы -> /catalog?category=wristwatches\&page=1

Мужские часы -> /catalog?category=wristwatches\&gender=MEN\&page=1

```



Breadcrumbs must preserve meaningful navigation and not contain dead links.



\---



\# 7. Header and footer navigation



Check and fix:



\* logo link

\* top category links

\* brand dropdown links

\* catalog/search links

\* favorites icon

\* cart icon

\* profile/login icon

\* phone/email links if clickable

\* footer links if footer exists

\* warranty/delivery/payment links if footer or product page references them



Phone/email behavior:



```text id="9wse9a"

phone -> tel:

email -> mailto:

```



Only use these if currently clickable/contact links are expected.



\---



\# 8. Search navigation



Search must work from any page.



Required behavior:



1\. User enters search query in header/search input.

2\. On submit:



&#x20;  \* redirect to catalog

&#x20;  \* set `search` query param

&#x20;  \* reset page to `1`

&#x20;  \* clear category/filter params unless project intentionally supports scoped search



Example:



```text id="453coz"

/catalog?search=romanson\&page=1

```



If search is submitted from product page, brand page, favorites page, warranty/delivery/payment page, etc., it must still redirect to catalog.



\---



\# 9. Centralized link builder



Do not scatter hardcoded catalog URLs everywhere.



Create or improve centralized route/link helpers.



Recommended helpers:



```text id="gog6db"

routes.home()

routes.catalog(params)

routes.category(categorySlug)

routes.filteredCatalog(filters)

routes.brand(brandSlug)

routes.product(productSlugOrId)

routes.favorites()

routes.cart()

routes.infoPage(type)

```



or follow existing project architecture.



Required:



\* use one source of truth for route building

\* avoid inconsistent query param names

\* make future route changes easy

\* document route helpers in `PROJECT\_MAP.md`



\---



\# 10. Frontend/backend consistency



Catalog links must use query params that the backend and frontend actually understand.



Required:



1\. Inspect current filter request format.

2\. Inspect URL param parsing.

3\. Make internal links compatible with catalog filter state.

4\. If URL params differ from backend request params, make sure the catalog page correctly converts them.

5\. Do not create links that look correct but do not apply filters.



\---



\# 11. Localization



All visible navigation text must be localized.



This includes:



\* category labels

\* footer links

\* breadcrumbs

\* “Мужские часы”

\* “Женские часы”

\* brand labels if frontend-owned

\* empty/error states if links target pages that load data



If labels come localized from backend, use backend labels.



Do not hardcode Russian strings directly in components unless the current project uses a centralized static config that is itself the localization source.



\---



\# 12. Verification checklist



Before finishing, verify:



\* no internal links point to `#` when a real page/route exists

\* header category links work

\* footer links work

\* brand links work

\* product card links work

\* breadcrumbs links work

\* favorites icon opens favorites page

\* cart icon opens cart page

\* search from any page redirects to catalog

\* “Мужские часы” opens catalog with wristwatch category and male gender filter

\* “Женские часы” opens catalog with wristwatch category and female gender filter

\* brand catalog links open catalog with brand filter

\* category links reset page to 1

\* filtered catalog links apply the same filters as the filter UI

\* invalid previous filters are cleared when category changes

\* all links use real route helpers or centralized route config

\* all new text is localized



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* public route map

\* route/link helper location

\* catalog query param format

\* category link behavior

\* filtered catalog link examples

\* brand/product/favorites/cart/info page routes

\* search redirect behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Internal navigation must use real routes, not placeholder links.

\* Catalog semantic links must open catalog with correct category/filter params.

\* Example: “Мужские часы” must open wristwatch catalog with gender=MEN.

\* Category navigation must reset page to 1 and clear invalid filters.

\* Search from any page must redirect to global catalog search.

\* Use centralized route/link helpers instead of scattered hardcoded URLs.

\* Breadcrumbs must use real internal links.



\---



\# Final response required



```markdown id="ezg6ry"

Summary:

\- \[what changed]



Navigation:

\- \[header/footer/breadcrumb/product links fixed]



Catalog links:

\- \[category/filter query behavior]



Route helpers:

\- \[centralized route helpers/config added or updated]



Search:

\- \[search redirect behavior]



Localization:

\- \[keys/files added]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, remaining dead links if any]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



