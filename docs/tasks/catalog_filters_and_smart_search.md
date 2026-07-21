You are working as a senior fullstack engineer on this project.



Implement a full product filtering system and smart search for the public catalog/product listing page.



Use the attached screenshots as visual references for the filter dropdown layout, filter sidebar, checkbox options, price inputs, scrollbar, and top toolbar. The exact dimensions, colors, typography, spacing, and behavior from this task have priority over the screenshots.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md`.

3\. Inspect the current public frontend catalog/product listing page.

4\. Inspect the current search input implementation.

5\. Inspect the existing sorting dropdown/block implementation, because the filter block must reuse the same dropdown/open-block approach and width behavior.

6\. Inspect existing `FilterIcon` component.

7\. Inspect existing localization files.

8\. Inspect existing `Text`, `Heading`, `Button`, form/input components, and `globals.css` design tokens.

9\. Inspect backend product entities, product characteristics, enums/reference data, product\_i18n, repositories, services, controllers, and existing product filtering/search logic.

10\. Make a short implementation plan before coding.



Follow all project rules:



\* all user-facing text must be localized

\* use `Text` for normal text and `Heading` for headings where appropriate

\* use existing UI components and global design tokens

\* do not hardcode raw Russian/English strings in JSX/TSX

\* do not use raw hex colors or arbitrary Tailwind values in components if a reusable token should exist

\* update `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md` after finishing



\---



\# Main Goal



Create a complete filtering system for the product catalog.



The filter UI must:



\* open as a large dropdown/panel under the top toolbar, similar to the existing sorting block logic

\* show filter categories on the left

\* show available characteristics/options on the right

\* support checkbox filters

\* support price range inputs

\* get filter categories/options/counts from the backend

\* keep selected filter state before and after applying

\* preserve selected filters after page reload

\* reset page to the first page when filters are applied

\* integrate with product listing backend filtering

\* work together with sorting and pagination

\* use localized labels and global design tokens



Also implement smart search:



\* use the existing search input visually

\* implement frontend and backend logic

\* search must work even with typos where feasible

\* when search is submitted, all filters must reset

\* if robust fuzzy search is not feasible, implement the best clean fallback simple search and document the limitation



\---



\# Part 1 — Filter Trigger in Top Toolbar



The filter trigger text is:



`Фильтры`



Required typography:



```css

font-size: 22px;

color: #33363F;

```



Use the existing project typography/token system.



Do not hardcode the raw color directly in the component.



The filter icon already exists in the project and is named:



```text

FilterIcon

```



Required icon size:



```text

24px × 24px

```



Spacing:



```text

distance between icon and text: 20px

```



Requirements:



\* use the existing `FilterIcon`

\* do not import or create a duplicate icon

\* filter trigger must open/close the filter panel

\* implementation should be consistent with the existing sorting block behavior

\* filter text must be localized

\* use `Text` component if appropriate



\---



\# Part 2 — Filter Dropdown / Panel Layout



The filter panel must be implemented like the screenshot.



Important:



\* There is already similar logic in the project for the sorting block.

\* Reuse the same dropdown/panel positioning, open/close behavior, outside-click behavior, width behavior, and general architecture where possible.

\* Do not create a completely different interaction model unless necessary.



Panel requirements:



\* panel height must be adaptive to content

\* maximum height: `500px`

\* panel should not exceed this height

\* if content overflows, internal scroll must work

\* full panel should align visually with the toolbar/content container according to current layout

\* panel width behavior must match the existing sorting block/panel implementation



The filter panel structure:



```text

Filter panel

├── left category list

│   ├── Цена

│   ├── Бренд

│   ├── Браслет

│   ├── Корпус

│   ├── Механизм

│   ├── Пол

│   ├── Размер корпуса

│   └── Стекло

└── right filter values area

&#x20;   ├── checkbox options for selected category

&#x20;   └── price inputs for price category

```



Use the full filter list from the provided task/assets/project if available. If an exact filter list is already defined in the backend or product model, use it as the source of truth.



\---



\# Part 3 — Left Filter Category List



Filter category text examples:



\* `Цена`

\* `Бренд`

\* `Браслет`

\* `Корпус`

\* `Механизм`

\* `Пол`

\* `Размер корпуса`

\* `Стекло`



Required typography:



```css

font-size: 18px;

color: #131313;

```



Spacing:



```text

distance between filter category items: 42px

```



Active filter category:



```css

font-weight: 600;

```



Inactive filter categories:



```css

font-weight: normal / standard project weight;

```



Requirements:



\* category labels must be localized

\* use `Text` component where appropriate

\* no hardcoded Russian labels in components

\* active category state must be clearly visible through font weight

\* selecting a category updates the right-side options area

\* preserve current selected options when switching categories



\---



\# Part 4 — Distance Between Category Sidebar and Options Area



The distance between the left filter category panel and the right characteristics/options area must be:



```text

102px

```



Implement this using the project’s layout/styling conventions.



Do not use random layout hacks.



\---



\# Part 5 — Filter Options / Characteristics



Each characteristic option label example:



\* `Механические`

\* `Кварцевые`

\* `С ручным заводом`

\* `Солнечная батарея`

\* `С автоподзаводом`

\* `Автокварц`

\* `Кинетик`

\* `Процессор`



Required option text typography:



```css

font-size: 16px;

color: #000000;

```



If there are no products for this characteristic option, its label color must be:



```css

\#AAAAAA

```



Checkbox color:



\* checkbox visual color must correspond to the option text state

\* if option is active/available, checkbox should match normal text state

\* if option has zero products, checkbox should visually match disabled/unavailable state



Spacing:



```text

distance between checkbox and label: 18px

vertical distance between options: 34px

horizontal distance between option columns/items: 58px

```



Requirements:



\* filter options must be fetched from backend

\* backend must return option labels and option values/codes

\* backend must return product count per option

\* option count must be displayed near label if this is consistent with the design

\* unavailable options with count `0` should be disabled or visually unavailable according to current UX

\* selected option state must be preserved when switching categories

\* selected option state must be preserved after applying filters

\* selected option state must be preserved after page reload

\* use URL query params as the primary source of state persistence where possible

\* localStorage may be used only if the current project pattern requires it, but URL params are preferred for shareable/filterable catalog state



\---



\# Part 6 — Universal Checkbox / Form Input Component



Create or extend a reusable form input component for checkbox fields.



Requirements:



\* checkbox must be a universal reusable form component, not a one-off checkbox inside filters

\* it should support checked/unchecked state

\* it should support disabled state

\* it should support accessible label connection

\* it should support project styling/tokens

\* it should be usable inside forms

\* it should not break existing form patterns



The filter options must be placed inside a form.



The form should keep selected filter state locally while the user toggles options before applying.



\---



\# Part 7 — Price Filter Inputs



For the price filter category, implement two price inputs:



\* from / `от`

\* to / `до`



Use existing localized labels.



Input requirements:



```css

font-size: 20px;

color: same as other characteristic text;

border-color: #1E1E1E;

border-radius: 0;

padding-top: 13px;

padding-bottom: 13px;

padding-left: 48px;

padding-right: 48px;

text-align: center;

placeholder-color: #AAAAAA;

```



Spacing:



```text

distance between price fields must match the horizontal spacing used for other characteristics/options

```



Requirements:



\* price input text size must be `20px`

\* placeholder color must be `#AAAAAA`

\* text must be centered

\* no rounded corners

\* border color must be `#1E1E1E`

\* use global tokens in `globals.css`

\* do not use arbitrary values directly in JSX/TSX

\* validate numeric values

\* prevent invalid price ranges where min > max

\* preserve price filter state before apply

\* preserve price filter state after reload through URL params where possible



\---



\# Part 8 — Scrollbar



The filter panel scrollbar must be styled.



Required:



```css

scrollbar color: #525252;

scrollbar width: 4px;

```



Requirements:



\* scrollbar should apply to the scrollable part of the filter panel

\* do not globally break all scrollbars unless the project already has global scrollbar styling

\* add reusable token/style if needed



\---



\# Part 9 — Apply / Reset / State Behavior



Implement complete filter behavior.



Required:



1\. User opens filters.

2\. User selects filter category.

3\. User checks/unchecks options.

4\. User enters price range.

5\. State is kept locally before applying.

6\. On apply:



&#x20;  \* filters are sent to backend

&#x20;  \* page is reset to first page

&#x20;  \* product list updates

&#x20;  \* selected filters remain visible

&#x20;  \* URL query params are updated if the project uses routing params

7\. On page reload:



&#x20;  \* selected filters are restored

&#x20;  \* product list loads with the same filters

8\. On reset/clear:



&#x20;  \* all filters are cleared

&#x20;  \* page resets to first page

&#x20;  \* product list updates



If there is already a product listing state management pattern, follow it.



Do not implement filter state in a way that conflicts with pagination/sorting/search.



\---



\# Part 10 — Backend Filter Metadata



Implement backend functionality so the frontend can fetch filter metadata dynamically.



The frontend must not hardcode all filter categories/options.



Backend should return:



\* list of filter categories

\* localized category labels

\* option values/codes

\* localized option labels

\* product count for each option

\* disabled/unavailable state if count is `0`

\* price range metadata if useful



Possible endpoint:



```text

GET /api/catalog/filters

```



or follow the existing backend route conventions.



Example response shape, adapted to project conventions:



```json

{

&#x20; "filters": \[

&#x20;   {

&#x20;     "key": "mechanism",

&#x20;     "label": "Механизм",

&#x20;     "type": "checkbox",

&#x20;     "options": \[

&#x20;       {

&#x20;         "value": "MECHANICAL",

&#x20;         "label": "Механические",

&#x20;         "count": 191,

&#x20;         "disabled": false

&#x20;       },

&#x20;       {

&#x20;         "value": "KINETIC",

&#x20;         "label": "Кинетик",

&#x20;         "count": 0,

&#x20;         "disabled": true

&#x20;       }

&#x20;     ]

&#x20;   },

&#x20;   {

&#x20;     "key": "price",

&#x20;     "label": "Цена",

&#x20;     "type": "range",

&#x20;     "min": 0,

&#x20;     "max": 564500

&#x20;   }

&#x20; ]

}

```



Use the real project model names and language codes.



Requirements:



\* labels must be localized according to the requested/current language

\* counts must be calculated from real products

\* counts should respect active/visible product status if the catalog only shows active products

\* do not include deleted/inactive products unless current catalog logic does

\* counts must be returned separately for each option

\* backend must be efficient enough for normal catalog usage

\* add indexes/migrations if required for performance



\---


# Important Addition — Category-Specific Filters and Product Type Architecture

Extend the filtering task with category-specific filter behavior.

The catalog must not use one universal filter set for all product categories.

Each product category must have its own filter configuration based on the characteristics that are relevant to that category.

Before coding:

1. Inspect the current product category model.
2. Inspect the current product characteristics model.
3. Inspect how wristwatch characteristics are currently implemented.
4. Inspect whether categories support hierarchy/parent-child relationships.
5. Inspect whether category-specific characteristics already exist.
6. Plan the backend data model so filters can be generated per category.

---

## 1. Category-Specific Filters

Required behavior:

1. Each category must have its own filter set.
2. Filter metadata returned by the backend must depend on the selected category.
3. The frontend must render only filters relevant to the current category.
4. Product filtering must apply only valid filters for the selected category.
5. Invalid filters for the current category must be ignored or safely removed from URL/query state.
6. Filter state must reset or normalize when switching between categories if the selected filters are not valid for the new category.
7. Counts must be calculated only for products from the current category scope.
8. If no category is selected, backend may return a default/general filter set or no category-specific filters, depending on the current catalog UX.

The frontend must not hardcode category-specific filter sets. The backend must be the source of truth.

---

## 2. Wristwatch Category Inheritance

There is already a main category for wristwatches / regular watches.

The following new categories must be added as child categories or subcategories of the wristwatch category:

1. `Классические часы`
2. `Спортивные часы`
3. `Дайверские часы`
4. `Хронографы`

These categories must inherit the same characteristics and filters as the parent wristwatch category.

Required behavior:

1. These four categories must be connected to the parent wristwatch category.
2. They must use the same filter set as wristwatches.
3. They must appear as separate catalog categories.
4. Product listing by one of these categories must show only products from that category/subcategory.
5. Filter metadata for these categories must include the wristwatch filters.
6. Product filtering must work the same way as for wristwatches.

Use the existing category naming/localization structure.

Do not hardcode Russian category names directly in frontend components.

All category names must be localized or stored through the existing i18n/category translation model.

---

## 3. Interior Clocks Category

Add or support a separate category:

`Интерьерные часы`

Interior clocks must have a different characteristic set from wristwatches.

They must not reuse wristwatch-specific filters such as bracelet material, glass, gender, case size for wristwatches, or wristwatch-only mechanism filters unless these fields are also logically relevant.

Interior clocks must have their own characteristics and filters.

Required interior clock fields/characteristics:

* Product name
* Category
* Price
* Description
* Brand / manufacturer
* Brand country or production country
* Case material
* Color
* Interior style
* Mechanism type
* Power type
* Dimensions
* Weight
* Warranty
* Stock availability
* Photos

Important data model rule:

Some of these fields already exist in the base product table/model and must remain base characteristics for all products.

Base/common product fields should include existing fields such as:

* name
* category
* price
* description
* brand/manufacturer if already generic
* stock availability
* photos/images
* status
* marketplace links if already added
* any other already-existing generic product fields

Do not duplicate base product fields inside an interior-clock-specific table/structure.

Only add missing interior-clock-specific characteristics that are not already covered by the base product model.

Examples of likely interior-clock-specific characteristics:

* brand country or production country
* case material
* color
* interior style
* mechanism type
* power type
* dimensions
* weight
* warranty

Use the same architectural pattern already implemented for wristwatch characteristics.

If wristwatch-specific characteristics are implemented as enums/reference tables/i18n tables/characteristic entities, follow the same approach for interior clocks.

Do not invent a second inconsistent characteristic system.

---

## 4. Backend Requirements for Category-Specific Characteristics

Implement backend support for category-specific product characteristics.

Required:

1. Backend must know which characteristics belong to each category.
2. Backend must support inherited characteristics from parent categories.
3. Wristwatch child categories must inherit wristwatch characteristics.
4. Interior clocks must have their own characteristics.
5. Filter metadata endpoint must accept category context.
6. Product list endpoint must accept category context.
7. Product list endpoint must apply only valid filters for that category.
8. Counts must be calculated per filter option within the current category scope.
9. Product create/edit APIs must support the correct characteristic fields depending on category.
10. CRM product create/edit forms must render the correct characteristic fields for the selected category.

Possible backend behavior:

```text
GET /api/catalog/filters?category=classic-watches
GET /api/catalog/filters?category=sport-watches
GET /api/catalog/filters?category=diver-watches
GET /api/catalog/filters?category=chronographs
GET /api/catalog/filters?category=interior-clocks
```

Use the existing route/category slug conventions if different.

Example response behavior:

* For `classic-watches`, return wristwatch filters.
* For `sport-watches`, return wristwatch filters.
* For `diver-watches`, return wristwatch filters.
* For `chronographs`, return wristwatch filters.
* For `interior-clocks`, return only interior-clock filters.

---

## 5. Database / Migration Requirements

Add migrations if needed.

Required database changes may include:

1. New categories:

   * `Классические часы`
   * `Спортивные часы`
   * `Дайверские часы`
   * `Хронографы`
   * `Интерьерные часы`

2. Category hierarchy support if it does not exist:

   * parent category relation
   * category type
   * category slug
   * category translations

3. Interior-clock characteristics if missing:

   * brand country / production country
   * case material
   * color
   * interior style
   * mechanism type
   * power type
   * dimensions
   * weight
   * warranty

4. Any reference tables/enums/i18n tables needed for these characteristics.

Do not manually modify the database.

Use the existing migration tool.

Preserve existing product data.

Do not break existing wristwatch products.

---

## 6. CRM Integration

The CRM product create/edit form must become category-aware.

Required behavior:

1. Admin selects product category.

2. Form renders only the characteristics relevant to that category.

3. If selected category is:

   * `Классические часы`
   * `Спортивные часы`
   * `Дайверские часы`
   * `Хронографы`

   then the form must show the same characteristics as wristwatches.

4. If selected category is:

   * `Интерьерные часы`

   then the form must show interior-clock characteristics.

5. Common product fields must always be available:

   * name in required languages
   * category
   * price
   * description in required languages
   * brand/manufacturer
   * stock availability
   * photos
   * status
   * other existing base product fields

6. Category-specific fields must be validated only when relevant to the selected category.

7. Product update must preserve existing category-specific data.

8. Switching category must not silently lose entered data without warning if this is possible in the current UI.

All CRM labels, placeholders, validation messages, and options must be localized.

---

## 7. Public Frontend Category Behavior

The public catalog must support category-specific filters.

Required behavior:

1. Opening a category page loads filters for that category only.
2. Wristwatch child categories show wristwatch filters.
3. Interior clocks show interior-clock filters.
4. Product cards/listing remain compatible with all product types.
5. Filter URL params must include category context.
6. If the user changes category, invalid filter params from the previous category must be removed or ignored.
7. Pagination resets to page 1 when category or filters change.
8. Sorting must continue to work with all categories.

---

## 8. Global Smart Search Across All Products

Search must work globally across the whole store, not only inside the current category.

Required behavior:

1. Search must search across all products in the store.

2. Search must not be restricted to the current category.

3. Search must include products from:

   * wristwatches
   * classic watches
   * sport watches
   * diver watches
   * chronographs
   * interior clocks
   * accessories
   * any other existing product categories

4. When search is submitted:

   * all filters must reset
   * current category scope must reset unless the existing UX explicitly supports category-scoped search
   * page must reset to page 1
   * user must be taken to the catalog/search results page

5. If search is submitted from a product detail page, the user must be redirected to the catalog page with the search query applied.

Example behavior:

```text
User is on /products/romanson-tm0b06
User searches: "romanson"
Frontend redirects to /catalog?search=romanson&page=1
Filters are cleared.
Backend searches across all products.
```

Use the actual project routes.

Do not keep the user on the product detail page after search submit.

---

## 9. Accessories Category

Add or support the category:

`Аксессуары`

Accessories must have their own category entry.

If accessories have an existing product model/characteristics, use those.

If accessory-specific characteristics are not yet defined, implement only the base product fields first and design the backend so accessory-specific filters can be added later without rewriting the filter system.

Required:

1. Accessories must appear as a category.
2. Search must include accessories.
3. Catalog must be able to list accessories.
4. Filter metadata for accessories must not show wristwatch-only filters unless accessories actually use those characteristics.
5. Document accessory filter limitations if no accessory-specific characteristics exist yet.

---

## 10. Backend Filter Metadata Response Must Include Category Context

Update the filter metadata response so frontend can understand the category context.

Recommended response shape:

```json
{
  "category": {
    "id": 10,
    "slug": "classic-watches",
    "label": "Классические часы",
    "parentSlug": "wristwatches",
    "inheritsFiltersFrom": "wristwatches"
  },
  "filters": [
    {
      "key": "mechanism",
      "label": "Механизм",
      "type": "checkbox",
      "options": [
        {
          "value": "MECHANICAL",
          "label": "Механические",
          "count": 191,
          "disabled": false
        }
      ]
    }
  ]
}
```

Adapt this to the existing DTO conventions.

For interior clocks:

```json
{
  "category": {
    "slug": "interior-clocks",
    "label": "Интерьерные часы",
    "parentSlug": null,
    "inheritsFiltersFrom": null
  },
  "filters": [
    {
      "key": "interiorStyle",
      "label": "Стиль интерьера",
      "type": "checkbox",
      "options": []
    },
    {
      "key": "powerType",
      "label": "Тип питания",
      "type": "checkbox",
      "options": []
    }
  ]
}
```

---

## 11. Verification Checklist Addition

Before finishing, additionally verify:

* each category has its own filter metadata
* wristwatch child categories inherit wristwatch filters
* `Классические часы` uses wristwatch filters
* `Спортивные часы` uses wristwatch filters
* `Дайверские часы` uses wristwatch filters
* `Хронографы` uses wristwatch filters
* `Интерьерные часы` uses interior-clock filters
* `Аксессуары` does not incorrectly show wristwatch-only filters
* interior-clock-specific fields are added only where missing
* base product fields are not duplicated
* CRM product form changes fields depending on selected category
* backend product filtering validates filters against category
* search works globally across all product categories
* search from product detail page redirects to catalog
* search clears filters and resets pagination
* category change clears invalid filters
* migrations preserve existing data
* public product listing works for wristwatches, wristwatch child categories, interior clocks, and accessories

---

## 12. Documentation Updates Addition

Update `docs/PROJECT_MAP.md` with:

* category-specific filtering architecture
* category hierarchy and inheritance rules
* wristwatch child categories
* interior clocks category and characteristics
* accessories category
* global search behavior
* product detail search redirect behavior
* CRM category-aware product form behavior
* migrations added for categories/characteristics

Update `docs/PROJECT_SKILLS.md` with permanent rules:

* catalog filters must be category-specific
* child categories may inherit filters from parent categories
* wristwatch child categories inherit wristwatch filters
* interior clocks have their own characteristic/filter set
* base product fields must not be duplicated in category-specific characteristic models
* search is global across all store products
* search from product detail pages must redirect to catalog
* category changes must clear invalid filters
* CRM product forms must render characteristics based on selected category



\# Part 11 — Backend Product Filtering



Implement backend filtering for the product list.



The product list endpoint must accept filters such as:



\* price min

\* price max

\* brand

\* bracelet material

\* case material

\* mechanism

\* gender

\* case size

\* glass

\* and all other filter categories used by the catalog



Use the real product fields/entities/enums.



Requirements:



\* support multiple selected values per filter

\* support price range

\* support pagination

\* support sorting

\* reset page on frontend when filters are applied

\* return total product count for pagination

\* prevent SQL injection

\* use type-safe query building where possible

\* keep existing product listing behavior compatible

\* avoid duplicated products when joining i18n/characteristic tables



Recommended backend approach:



\* use JPA Specifications / Criteria API / QueryDSL / existing query pattern if available

\* avoid huge fragile string-concatenated SQL

\* normalize incoming filter parameters

\* validate filter keys and values



\---



\# Part 12 — Smart Search



Implement smart search using the existing search input.



Required behavior:



1\. User enters a search query.

2\. On search submit:



&#x20;  \* all filters are cleared/reset

&#x20;  \* page resets to first page

&#x20;  \* search query is sent to backend

&#x20;  \* product list updates

3\. Search must try to find products even when the user has typos.

4\. Search should search across useful product fields:



&#x20;  \* localized product name

&#x20;  \* model

&#x20;  \* SKU

&#x20;  \* brand

&#x20;  \* collection

&#x20;  \* relevant characteristics if useful



Backend smart search options:



Choose the best approach for the current backend/database.



Preferred if PostgreSQL is used:



\* use PostgreSQL `pg\_trgm` trigram search with similarity/ILIKE

\* add migration to enable extension if allowed:



&#x20; \* `CREATE EXTENSION IF NOT EXISTS pg\_trgm;`

\* add indexes where appropriate

\* use similarity threshold tuned reasonably



Alternative options:



\* use a Java fuzzy matching library if already present or acceptable

\* implement token-based normalized search

\* implement syllable/token splitting if useful for Russian text

\* fallback to simple normalized case-insensitive search if fuzzy search cannot be implemented cleanly



Requirements:



\* do not add a heavy dependency unless necessary

\* if adding a dependency, document it in `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md`

\* handle Russian text correctly

\* normalize query:



&#x20; \* trim spaces

&#x20; \* case-insensitive

&#x20; \* optionally replace ё/е if useful

&#x20; \* ignore duplicate spaces

\* do not crash on empty search

\* if search is empty, return normal catalog listing



If robust fuzzy search cannot be implemented safely in this pass, implement simple search and document what remains.



\---



\# Part 13 — Frontend Search Integration



Use the existing search input visually.



Requirements:



\* do not redesign the search input unless needed

\* implement submit/search behavior

\* when search is submitted, clear all selected filters

\* update URL query params where possible

\* reset page to first page

\* preserve search query after reload if present in URL

\* show loading state while searching

\* show empty state if no products found

\* show error state if backend search fails

\* all messages must be localized



\---



\# Part 14 — Localization



All user-facing text must be localized.



This includes:



\* `Фильтры`

\* filter category labels

\* filter option labels if generated frontend-side

\* price labels `от` and `до`

\* apply/reset buttons if added

\* empty states

\* loading states

\* error states

\* search messages

\* validation messages



If backend provides localized labels, frontend should still localize static UI labels.



Do not hardcode Russian text directly in components.



\---



\# Part 15 — Design Tokens / globals.css



Add or reuse global tokens/classes in `globals.css` for all reusable visual values.



Required values include:



Colors:



```text

\#33363F

\#131313

\#000000

\#AAAAAA

\#525252

\#1E1E1E

```



Font sizes:



```text

22px

18px

16px

20px

```



Spacing:



```text

20px

18px

34px

58px

102px

42px

13px

48px

4px

500px

```



Use the project’s existing token naming style.



Do not use arbitrary Tailwind values like:



```tsx

text-\[22px]

text-\[#33363F]

gap-\[20px]

placeholder:text-\[20px]

```



If the project already has tokens for these values, reuse them.



\---



\# Part 16 — Verification Checklist



Before finishing, verify:



\* filter trigger uses `FilterIcon` at `24px × 24px`

\* filter trigger text is `22px`, color `#33363F`

\* distance between icon and text is `20px`

\* filter panel opens/closes like the existing sorting block

\* filter panel width behavior matches the existing sorting block

\* filter panel max height is `500px`

\* panel adapts to content height

\* left filter category labels are `18px`, color `#131313`

\* active category font weight is `600`

\* distance between filter categories is `42px`

\* distance between left sidebar and options area is `102px`

\* option labels are `16px`, color `#000000`

\* unavailable option labels are `#AAAAAA`

\* distance between checkbox and label is `18px`

\* vertical distance between options is `34px`

\* horizontal distance between option groups/columns is `58px`

\* checkbox is implemented as a reusable form input component

\* filter options are inside a form

\* selected state is kept before applying

\* selected state persists after applying

\* selected state persists after reload

\* applying filters resets page to first page

\* price inputs match all requested styles

\* scrollbar is `#525252`, width `4px`

\* filter categories/options/counts come from backend

\* backend filtering works for multiple values and price range

\* option counts are returned per option

\* search works through backend

\* search resets filters

\* search resets page to first page

\* search handles typos if fuzzy search was implemented

\* fallback search is documented if fuzzy search was not feasible

\* sorting and pagination still work

\* all new UI text is localized

\* no new raw hex/arbitrary Tailwind values are introduced for reusable values



\---



\# Part 17 — Documentation Updates



Update `docs/PROJECT\_MAP.md` if:



\* new filter components are created

\* new form input/checkbox component is created

\* catalog API client changes

\* backend filter/search endpoints are added

\* backend repositories/services change

\* migrations/indexes/extensions are added

\* global style tokens change

\* localization structure changes



Update `docs/PROJECT\_SKILLS.md` with permanent rules/patterns:



\* catalog filters must be backend-driven

\* filter option labels/counts must come from backend or a shared dictionary

\* filter state must be persisted in URL params where possible

\* applying filters must reset pagination to first page

\* search must clear filters and reset pagination

\* reusable form inputs such as checkboxes must be componentized

\* filter/search UI must use localization, `Text`, `Button`, and global design tokens

\* avoid arbitrary Tailwind values and raw hex colors in reusable UI

\* smart search should use pg\_trgm/fuzzy matching where feasible, with documented fallback



\---



\# Final Response Required



After implementation, respond with:



```markdown

Summary:

\- \[what changed]



Frontend filters:

\- \[components, state, URL params, checkbox/input behavior]



Backend filters:

\- \[metadata endpoint, filtering endpoint, counts]



Smart search:

\- \[approach used and fallback if any]



Localization:

\- \[keys/files added or updated]



Design tokens:

\- \[tokens/classes added or reused]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, limitations, risks, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



