You are working as a senior fullstack engineer on this project.



Create full public brand pages and brand navigation according to the attached screenshots and the specifications below.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the existing public frontend routing.

5\. Inspect the existing header/navigation implementation.

6\. Inspect the existing product card component.

7\. Inspect the existing catalog/product listing API.

8\. Inspect the brand entity/model/API if it already exists.

9\. Inspect current assets/images structure.

10\. Inspect localization files.

11\. Inspect `Text`, `Heading`, `Button`, `globals.css`, and existing page layout tokens.

12\. Make a short implementation plan before coding.



Follow project rules:



\* all user-facing text must be localized or come from backend/i18n data

\* use `Text` for normal text and `Heading` for headings where appropriate

\* use existing design tokens/global classes

\* do not hardcode arbitrary Tailwind values or raw hex colors in components if reusable tokens should exist

\* do not break existing catalog/product pages

\* update `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md` after finishing



\---



\# Main Goal



Implement brand pages like in the screenshots.



Each brand must have its own public page with:



1\. Breadcrumbs.

2\. Brand title.

3\. Short brand description.

4\. Brand banner image.

5\. Brand history section.

6\. Link to catalog filtered by this brand.

7\. “Новинки” section with 15 products from the same brand.

8\. Catalog/banner image below or around the products according to existing page layout.

9\. Correct brand navigation from the header.



\---



\# Brands to implement



Create/support pages for these brands:



\* ROMANSON

\* ADRIATICA

\* APELLA

\* PIERRE RICAUD

\* RHYTHM

\* ROYAL LONDON



Important:



Use actual brand names/slugs from the existing database if they already exist.



If the project currently uses `PIERRE RICAUDE` somewhere because of existing data or asset naming, inspect and keep compatibility, but the displayed official brand name should be `PIERRE RICAUD` unless existing data requires otherwise.



\---



\# Brand Text Content



Use the following content for brand pages.



\## ROMANSON



Short description:



```text id="6hn3ip"

Южнокорейский бренд, воплощающий современную эстетику и утончённый минимализм. Каждая модель отражает стремление к гармонии формы и функции, сочетая лаконичный дизайн с высоким качеством исполнения.

```



History:



```text id="i4ilmw"

Бренд Romanson был основан в 1988 году в Южной Корее и назван в честь швейцарского города Romanshorn, известного своей часовой традицией.

С самого начала компания ориентировалась на сочетание швейцарского качества и оригинального дизайна, что позволило ей быстро завоевать доверие покупателей.

Уже в первые годы Romanson начал экспортировать часы на международные рынки, включая Ближний Восток, Северную Америку и позже Россию и Европу. В 1990-е и 2000-е годы бренд представил несколько значимых коллекций, участвовал в международных выставках вроде Baselworld и открыл собственные производственные и исследовательские центры.

Сегодня Romanson - это глобально известный производитель часов, чья продукция продаётся более чем в 70 странах мира, оставаясь символом сочетания стиля и качества.

```



\## ADRIATICA



Short description:



```text id="p5ytyd"

Швейцарский бренд часов с богатой историей, воплощающий традиции точного механизма и элегантного классического дизайна. Каждая модель сочетает фирменное качество Swiss Made и универсальный стиль, подходящий как для повседневной носки, так и для торжественных событий.

```



History:



```text id="3arffw"

Бренд Adriatica начал своё существование в 1931 году - тогда его создала швейцарская компания Swiss Watch Company, став частью многовековой часовой традиции Швейцарии.

С момента основания производство часов постоянно развивалось: в 1960-х годах фабрика переехала в часовые центры Биль/Бьен и Базель, где продолжилась работа над коллекциями для мужчин и женщин, включая знаковую линейку “Adriatica World Champion”.

С 1999 года часы производятся на собственной мануфактуре в Донгио (кантон Тичино), а компания принимает участие во внедрении новых технологий и дизайна, укрепляя своё международное присутствие.

Adriatica - признанный швейцарский бренд, хорошо известный на рынках Европы и Северной Америки, чья продукция сочетает надёжность, точность и стиль, подтверждённые знаком Swiss Made.

```



\## APELLA



Short description:



```text id="eu1bsv"

Швейцарский бренд часов, сочетающий вековые традиции точного хронометража и элегантный, выдержанный дизайн. Высокая точность механизмов, маркировка Swiss Made и лаконичность делает их универсальными для повседневных и деловых образов.

```



History:



```text id="63hp0k"

История Appella началась в 1943 году, когда швейцарский мастер часового дела Поль Глокер основал бренд в рамках компании EBOSSA, базировавшейся на производстве механизмов Roskopf - признанных образцов швейцарского качества того времени.

С первых лет своего существования Appella ориентировалась на классическое Swiss Made качество, сочетая надёжные механизмы с изящным дизайном. С течением времени бренд развивался, сохраняя связь с часовой традицией и постепенно расширяя своё присутствие на международных рынках.

В более поздний период бренд перешёл под управление компании ADRIATICA PR \& A Watch Sagl, что укрепило его позиции на мировой арене и позволило ещё больше подчеркнуть швейцарское качество, точность и эстетическую выразительность.

Каждая модель отражает уважение к классическому часовому искусству и стремление к совершенству.

```



\## PIERRE RICAUD



Short description:



```text id="711wrw"

Немецкий часовой бренд, в котором классическая элегантность гармонично сочетается с актуальными дизайнерскими решениями. Каждая модель продумана до мелочей: выверенные пропорции, качественные материалы и надёжные механизмы формируют сбалансированный аксессуар.

```



History:



```text id="0e3u57"

Бренд Pierre Ricaud был основан более двадцати лет назад немецким часовым концерном MAKK Uhrenshop. С момента своего появления марка ориентировалась на создание часов, сочетающих европейскую надёжность, актуальный дизайн и доступность для широкой аудитории.

В процессе развития бренд последовательно расширял линейки моделей, уделяя внимание и классическим формам, и современным трендам.

В производстве используются качественные материалы и проверенные механизмы японского и швейцарского производства, что обеспечивает точность хода и долговечность изделий. Дополняя техническую надёжность продуманной эстетикой - сдержанные циферблаты и декоративные элементы, включая кристаллы Swarovski, - Pierre Ricaud смог занять устойчивую позицию на международном рынке и сформировать репутацию стильного и практичного часового бренда с немецким подходом к качеству.

```



\## RHYTHM



Short description:



```text id="gqv90c"

Японский бренд с богатой историей в производстве часов и механизмов, известный сочетанием технической точности и продуманного дизайна. Его изделия предлагают стильные и практичные решения. Rhythm уделяет особое внимание качеству материалов и точности хода.

```



History:



```text id="8r9us0"

История компании Rhythm начинается в 1950 году в Японии, когда она была основана как производитель часов и точных механизмов. С самых ранних лет бренд стал известен своими интерьерными и настенными часами, а в 1951 году выпустил одну из первых в стране моделей с пластиковым корпусом - важный шаг в развитии массового производства.

В 1953 году Rhythm заключила партнёрство с Citizen Watch Co., что позволило получить доступ к новым технологиям и расширить коммерческие возможности.

В последующие десятилетия компания активно росла: её продукция стала экспортироваться на зарубежные рынки, а в 1963 году Rhythm была зарегистрирована на Токийской фондовой бирже.

Rhythm также внедрила философию контроля качества «Zero Defect» и выпустила одни из первых японских кварцевых часов, укрепив репутацию производителя надёжных и инновационных изделий.

```



\## ROYAL LONDON



Short description:



```text id="e1joic"

Английский часовой бренд, в основе которого сочетание традиционного британского стиля и современной практичности. Часы Royal London создаются с вниманием к деталям, вдохновляясь эстетикой Лондона, что делает их стильным аксессуаром для любого образа.

```



History:



```text id="7xq4if"

История Royal London началась в 1997–1998 годах, когда британская компания Condor Group Ltd., специализировавшаяся на производстве ремешков и аксессуаров, решила создать собственный часовой бренд и представить на рынок собственные модели. Первые часы под маркой Royal London были представлены в 1998 году, а их логотип с короной символизировал высокий стиль и классическую эстетику.

С тех пор бренд развивался, сочетая традиционный британский дизайн с качественными компонентами и расширяя своё международное присутствие через партнёрства с розничными сетями по всему миру.

В 2018 году Royal London представил коллекцию Made in London, в которой высококачественные детали из разных стран собираются непосредственно в Лондоне, укрепляя концепцию британского дизайна и технической продуманности.

```



\---



\# Brand Page Route



Implement brand pages using the current routing style.



Preferred route if no route exists yet:



```text id="zl4jzb"

/brands/\[brandSlug]

```



Examples:



```text id="3s7w7s"

/brands/romanson

/brands/adriatica

/brands/appella

/brands/pierre-ricaud

/brands/rhythm

/brands/royal-london

```



If the project already has another brand route convention, follow it.



Brand navigation and breadcrumbs must use the actual route.



\---



\# Header Brand Navigation



Create navigation to brand pages like in the screenshot.



The top navigation has items:



\* Наручные часы

\* Интерьерные часы

\* Бренды

\* Аксессуары



When the user opens/selects `Бренды`, show a dropdown panel with brand links:



\* ROMANSON

\* ADRIATICA

\* APELLA

\* PIERRE RICAUD

\* RHYTHM

\* ROYAL LONDON



Requirements:



1\. The `Бренды` navigation item must look active/bold when the brand dropdown/page is active.

2\. Dropdown layout must match the screenshot:



&#x20;  \* white panel

&#x20;  \* brand names in one horizontal row where space allows

&#x20;  \* same page/container width behavior as the current nav/dropdown system

&#x20;  \* subtle bottom rounded shape/shadow if the existing design uses it

3\. Each brand name is a link to that brand page.

4\. Brand names in the dropdown are uppercase.

5\. All static nav labels must be localized.

6\. Do not hardcode duplicate nav markup if a nav/dropdown pattern already exists.

7\. Existing search input in header must remain in the same position/style.

8\. Existing header icons must not break.



\---



\# Breadcrumbs



Brand page breadcrumbs must look like the screenshot:



Example:



```text id="qvy6m2"

Главная — Бренды — Romanson

```



Typography:



```css id="8xyufm"

font-family: Inter;

font-weight: 300;

font-style: Light;

font-size: 20px;

line-height: 100%;

letter-spacing: 0%;

color: #000000;

```



Use project tokens/global classes instead of hardcoded styles.



Breadcrumbs must be localized.



\---



\# Brand Hero Section



Brand title:



\* Always uppercase.

\* Top margin from breadcrumbs/previous block: `40px`.



Typography:



```css id="426hca"

font-family: Inter;

font-weight: 400;

font-style: Regular;

font-size: 64px;

line-height: 100%;

letter-spacing: 0%;

text-align: center;

color: #1E1E1E;

```



Short brand description:



\* Top margin from title: `45px`.

\* Centered.

\* Should have readable max-width like in the screenshot.



Typography:



```css id="refp3b"

font-family: Inter;

font-weight: 400;

font-style: Regular;

font-size: 18px;

line-height: 33px;

letter-spacing: 0%;

text-align: center;

color: #A1A1A1;

```



\---



\# Brand Banner



Add brand banner image below the short description.



Spacing:



```text id="6jxzty"

vertical margin/top offset: 71px

```



Image requirements:



\* full viewport/content width according to existing page layout

\* height: `573px`

\* height should adapt proportionally/responsively to width

\* object-fit should keep the image visually correct

\* do not distort image



Banner image naming convention:



```text id="cbz33r"

{BRAND\_NAME}\_brand\_banner

```



Examples:



```text id="hsm0ri"

ROMANSON\_brand\_banner

ADRIATICA\_brand\_banner

APELLA\_brand\_banner

PIERRE\_RICAUD\_brand\_banner

RHYTHM\_brand\_banner

ROYAL\_LONDON\_brand\_banner

```



Inspect actual project asset filenames and extensions. Use the real existing filenames. If filenames are slug-based or lowercase, create a clean mapping.



Do not break build if an image is missing. Use a safe fallback or document missing assets.



\---



\# Brand History Section



Section heading text:



```text id="xmx8mb"

История бренда

```



Bottom margin after heading:



```text id="t7vnba"

33px

```



Typography:



```css id="6rob68"

font-family: Inter;

font-weight: 400;

font-style: Regular;

font-size: 24px;

line-height: 100%;

letter-spacing: 0%;

color: #000000;

```



History text:



Bottom margin after text:



```text id="5u50aj"

33px

```



Typography:



```css id="hvgcau"

font-family: Inter;

font-weight: 400;

font-style: Regular;

font-size: 18px;

line-height: 33px;

letter-spacing: 0%;

color: #696E7D;

```



The text must use the brand history content provided above.



\---



\# Catalog Link



Add link:



```text id="bcmjl0"

Перейти к каталогу

```



Typography:



```css id="o1j4vb"

font-family: Inter;

font-weight: 500;

font-style: Medium;

font-size: 20px;

line-height: 100%;

letter-spacing: 0%;

color: #33363F;

```



Behavior:



\* link must navigate to catalog filtered by the current brand

\* example:

&#x20; `/catalog?brand=romanson\&page=1`

\* use the actual route/query param style used in this project

\* include arrow icon if existing design uses it

\* do not break filters/search state



\---



\# New Products Section



Add section title:



```text id="o4mzy4"

Новинки

```



Top margin from previous section:



```text id="0c9u9n"

120px

```



Typography:



```css id="p3o8fy"

font-family: Judson;

font-weight: 400;

font-style: Regular;

font-size: 34px;

line-height: 100%;

letter-spacing: 0%;

color: #1E1E1E;

```



Products:



\* show 15 products

\* products must belong to the same brand as the brand page

\* products should be the newest products if `createdAt` / date sorting exists

\* otherwise use the existing catalog/product sort logic for “new products”

\* do not show products from other brands

\* use the existing product card component

\* preserve existing add-to-cart/favorite behavior

\* preserve existing product card image logic



Product card grid spacing:



```text id="cmnzm1"

horizontal gap: 67px

vertical gap: 44px

```



Use tokens/global classes.



If there are fewer than 15 products for a brand, show the available products and do not crash.



\---



\# Catalog Banner for Products



Add catalog banner image for the brand product section where it fits the design.



Image requirements:



\* width: full available width

\* height: `487px`

\* height should adapt proportionally/responsively to width

\* do not distort image



Banner image naming convention:



```text id="shmza6"

{BRAND\_NAME}\_catalog\_banner

```



Examples:



```text id="9sjvfn"

ROMANSON\_catalog\_banner

ADRIATICA\_catalog\_banner

APELLA\_catalog\_banner

PIERRE\_RICAUD\_catalog\_banner

RHYTHM\_catalog\_banner

ROYAL\_LONDON\_catalog\_banner

```



Inspect actual project assets and use real filenames/extensions.



\---



\# Backend Requirements



If backend already supports brands and brand product queries, reuse it.



If not, add or extend backend endpoints.



Possible endpoints:



```text id="y1u30a"

GET /api/brands

GET /api/brands/{slug}

GET /api/brands/{slug}/products?limit=15\&sort=new

```



or use existing conventions.



Required backend behavior:



1\. Return brand by slug.

2\. Brand response should include:



&#x20;  \* id

&#x20;  \* slug

&#x20;  \* display name

&#x20;  \* short description

&#x20;  \* history text

&#x20;  \* banner image key/path if backend manages image references

3\. Return newest products by brand.

4\. Product list must include only products of the current brand.

5\. Product list must respect active/visible product status.

6\. Product cards must receive the same DTO shape as current catalog cards.

7\. Do not break existing public product endpoints.



If the project stores brand content only on frontend, implement cleanly there, but prefer backend/i18n storage if the project already has brand entities.



If DB changes are needed, add migrations.



\---



\# Data / Seed Requirement



Add or update brand content data.



Depending on project architecture, this can be done through:



\* backend migrations/seed data

\* brand i18n table

\* frontend static brand content config

\* existing CMS/reference-data pattern



Use the project’s existing data pattern.



If possible, add more products with different categories and characteristics for these brands so brand pages and catalog filters have enough realistic data.



Important:



\* Do not randomly create invalid products.

\* Use existing product seed/migration style.

\* Products must have valid categories, characteristics, brand relation, images, price, status, and stock.

\* If adding many products is too large for this pass, add a clean seed structure or document what remains.



\---



\# Localization



All static UI labels must be localized:



\* navigation labels

\* breadcrumbs labels

\* `История бренда`

\* `Перейти к каталогу`

\* `Новинки`

\* empty states

\* loading states

\* error states



Brand content can come from backend/database if the project supports multilingual brand data.



If only Russian content is currently provided, implement Russian content and keep architecture ready for other languages if existing project uses RU/KZ/EN.



\---



\# Styling / Design Tokens



Add or reuse global tokens/classes for all reusable values:



Colors:



```text id="sx0rf3"

\#000000

\#1E1E1E

\#A1A1A1

\#696E7D

\#33363F

```



Font sizes:



```text id="jhvjvw"

20px

64px

18px

24px

34px

```



Line heights:



```text id="3kaysw"

100%

33px

```



Spacing:



```text id="u3zcyn"

40px

45px

71px

33px

120px

67px

44px

573px

487px

```



Use the project’s existing token naming style.



Do not add arbitrary Tailwind values directly in components if reusable tokens should exist.



\---



\# Loading / Empty / Error States



Brand page must handle:



1\. brand loading

2\. brand not found

3\. brand products loading

4\. no products for brand

5\. API errors

6\. missing banner image fallback



All states must be localized.



\---



\# Search Behavior



The header search input must continue working.



If the user searches from a brand page:



\* redirect to catalog/search page

\* clear brand-specific state unless current project search supports brand-scoped search

\* apply search query globally across the store

\* page must reset to 1



Do not break existing search behavior.



\---



\# Verification Checklist



Before finishing, verify:



\* brand dropdown opens from `Бренды`

\* brand dropdown visually matches screenshot

\* each brand link opens correct brand page

\* `Бренды` nav item is active on brand pages

\* breadcrumbs match design and route

\* brand title is uppercase

\* brand title has correct typography and top spacing

\* short description has correct typography and spacing

\* brand banner loads from existing asset naming

\* brand banner has correct size behavior

\* `История бренда` section uses correct text and typography

\* `Перейти к каталогу` links to catalog filtered by brand

\* `Новинки` section has correct typography and spacing

\* product section shows up to 15 products from the same brand only

\* products from other brands are not shown

\* catalog banner loads from existing asset naming

\* product card spacing is correct

\* page uses standard layout parameters like other pages

\* search from brand page still works

\* localization keys are added

\* no raw hardcoded UI strings remain in components

\* no raw hex/arbitrary Tailwind values are introduced where tokens are needed

\* backend endpoints/migrations are added only if needed

\* docs are updated



\---



\# Documentation Updates



Update `docs/PROJECT\_MAP.md` with:



\* brand page route

\* brand navigation/dropdown structure

\* brand data source

\* brand banner asset mapping

\* catalog banner asset mapping

\* brand products API/data flow

\* search behavior from brand pages

\* any migrations/seed changes



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* brand pages use backend/database or centralized brand content config as the source of truth

\* brand pages must show only products from the same brand in the new products section

\* brand images follow `{BRAND\_NAME}\_brand\_banner` and `{BRAND\_NAME}\_catalog\_banner` mapping unless project asset naming says otherwise

\* brand page search redirects to global catalog search

\* brand navigation dropdown links must use real brand slugs

\* brand content and static labels must be localized



\---



\# Final Response Required



```markdown id="p122j1"

Summary:

\- \[what changed]



Brand pages:

\- \[routes/pages/components added]



Navigation:

\- \[brand dropdown/header changes]



Brand data:

\- \[where content is stored]



Products:

\- \[how 15 brand products are loaded]



Assets:

\- \[banner mapping used]



Backend:

\- \[endpoints/migrations/seed changes if any]



Localization:

\- \[keys/files added]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, missing assets, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



