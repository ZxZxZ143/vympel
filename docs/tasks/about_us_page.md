You are working as a senior frontend engineer on this project.



Create the public “About Us” page according to the attached screenshots and the specifications below.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect existing public page layout, header, footer, navigation, page container, typography, and global styles.

5\. Inspect existing `Text`, `Heading`, `Button`, carousel/slider, dots, icon components, and `globals.css`.

6\. Inspect existing image assets:



&#x20;  \* `about-us-banner`

&#x20;  \* `insta-1`, `insta-2`, `insta-3`, etc.

&#x20;  \* marketplace logos if they exist

&#x20;  \* cooperation/contact banner assets if they exist

7\. Use existing components/blocks wherever possible.

8\. Follow localization and design token rules.



Project rules:



\* all user-facing text must be localized

\* use `Text` for normal text and `Heading` for headings

\* use existing global design tokens/classes

\* do not hardcode raw UI strings in JSX/TSX

\* do not use arbitrary Tailwind values/raw hex colors in components if reusable tokens should exist

\* update `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md` after finishing



\---



\# Main Goal



Create the “About Us” page.



Preferred route if no route exists yet:



```text

/about

```



or use the project’s existing route convention.



The page must include:



1\. Header/navigation.

2\. Full-width banner image.

3\. Two-column text block under banner.

4\. “О компании” grid with 4 info cards.

5\. “Наша деятельность в соцсетях” infinite Instagram slider.

6\. “Сотрудничество и партнёрство” contact/cooperation block.

7\. “Онлайн площадки” marketplace block.

8\. Footer.



Use the attached screenshots as visual reference.



\---



\# General Layout



Use the standard public page layout and project paddings.



All main blocks must have standard vertical spacing:



```text

block spacing: 120px

```



This applies between:



\* banner and intro text block

\* intro text block and “О компании”

\* “О компании” and social media block

\* social media block and cooperation block

\* cooperation block and online platforms block

\* online platforms block and footer



Do not create a separate layout system.



\---



\# Banner



Use existing asset:



```text

about-us-banner

```



Requirements:



1\. Banner must stretch across the full screen width.

2\. Banner height must be determined automatically based on image width/aspect ratio.

3\. Do not crop or distort the image.

4\. The banner already contains text inside the image, so do not add extra text over it.

5\. Use responsive image behavior.

6\. On smaller screens, image must remain readable and not overflow viewport.



\---



\# Intro Text Block Under Banner



Create two-column block under the banner.



Both columns must occupy equal width.



Column gap:



```text

20px

```



\## Left text



Text:



```text

Vympel - дистрибьютор часов

с более чем 30-летним опытом работы на рынке.

```



Typography:



```css

font-family: Inter;

font-weight: 300;

font-size: 32px;

color: #33363F;

```



\## Right text



Text:



```text

За эти годы мы сформировали партнёрства с ведущими мировыми брендами и создали надёжную систему поставок, чтобы предлагать клиентам только оригинальную продукцию и безупречный сервис. Наша миссия - делать качественные часы доступными тем, кто ценит эстетику, точность и истинную культуру времени.

```



Typography:



```css

font-family: Inter;

font-weight: 400;

font-size: 18px;

color: #696E7D;

```



Responsive:



\* On desktop: two equal columns.

\* On mobile: stack columns vertically with clean spacing.



\---



\# “О компании” Section



Section title:



```text

О компании

```



Use existing section heading style if available, matching the screenshot.



Create a 4-card grid.



Grid:



```text

columns: 2 on desktop

items: 4

gap: 20px

```



On smaller screens, cards should stack or adapt responsively.



Card styling:



```css

background: #F8F8F8;

border-color: #D2D2D2;

border-radius: 20px;

padding-top: 30px;

padding-bottom: 30px;

padding-left: 34px;

padding-right: 34px;

```



Card content alignment:



```text

align to top-left

```



Card header row:



\* title and number badge must be in one row/block

\* title must align vertically to the center of the number circle

\* number circle should be on the right like in the screenshot



Card title typography:



```css

font-family: Inter;

font-weight: 400;

font-size: 24px;

color: #000000;

```



Card text typography:



```css

font-family: Inter;

font-weight: 400;

font-size: 18px;

color: #3D3D3D;

```



Spacing between title and text:



```text

15px

```



Number typography:



```css

font-family: Montaga;

font-weight: 400;

font-size: 35px;

color: #33363F;

```



Number badge/circle:



```css

background: #FFFFFF;

padding-top: 11px;

padding-bottom: 11px;

padding-left: 14px;

padding-right: 14px;

```



Badge must look like a clean white circle/rounded circle as in the screenshot.



\---



\## Company Card Content



\### Card 1



Number:



```text

01

```



Title:



```text

Официальность и гарантия

```



Text:



```text

Мы работаем официально и являемся авторизованными дистрибьюторами на территории Казахстана. Мы гарантируем подлинность и качество всех часов, представленных в нашем магазине, а также предоставляем сервис и гарантию.

```



\### Card 2



Number:



```text

02

```



Title:



```text

Опыт и экспертность

```



Text:



```text

Наша компания более 30 лет занимается дистрибуцией оригинальных часов, ежегодно посещает международные выставки, общается с экспертами и следит за трендами часового искусства.

```



\### Card 3



Number:



```text

03

```



Title:



```text

Тщательный отбор товаров

```



Text:



```text

Каждая модель, которая попадает в наш каталог, проходит строгий отбор. Мы оцениваем дизайн, качество материалов и точность механизма, чтобы быть уверенными, что предлагаем только действительно достойные часы.

```



\### Card 4



Number:



```text

04

```



Title:



```text

Персонализированный сервис

```



Text:



```text

Наши менеджеры помогут вам на каждом этапе - от выбора до покупки. Мы готовы ответить на любые вопросы, дать рекомендации и помочь подобрать часы, которые станут вашим личным отражением стиля.

```



\---



\# Social Media Section



Section title:



```text

Наша деятельность в соцсетях

```



Create an infinite slider with Instagram post images.



Assets:



```text

insta-1

insta-2

insta-3

insta-4

...

```



Inspect the real filenames/extensions in the project.



Requirements:



1\. Use existing slider/carousel functionality if it already exists.

2\. Use existing dots/pagination functionality under the slider if it already exists.

3\. Slider must loop infinitely.

4\. Each post card must be clickable.

5\. On click, navigate to Instagram.

6\. Use existing Instagram link from the project/contact config if available.

7\. If Instagram link is missing, add a centralized placeholder/config value and document it.

8\. Do not hardcode Instagram URL randomly in multiple places.



Post card styling:



```css

border-radius: 16px;

padding: 17px;

gap between posts: 20px;

```



Instagram icon:



\* use existing Instagram icon from the project

\* icon appears as a circular mark over the image like in the screenshot

\* border/padding around the icon:



```css

padding: 17px;

border-color: #D2D2D299;

```



Image behavior:



\* images must not be distorted

\* use object-fit cover if needed

\* rounded corners must match screenshot

\* slider must be responsive



\---



\# Cooperation / Partnership Section



Section title:



```text

Сотрудничество и партнёрство

```



Create the cooperation banner/block like in the screenshot.



The block contains large text:



```text

Хотите

связаться

с Vympel?

```



Button:



```text

Оставить заявку

```



Right-side text:



```text

Мы всегда рады новым сотрудничествам и открыты к интересным проектам.



За более чем 30 лет работы мы накопили богатый опыт в сфере дистрибуции часов, знаем рынок и умеем создавать ценность для наших партнёров. Будь то совместные акции, эксклюзивные коллекции или специальные проекты - мы готовы обсуждать любые идеи и воплощать их вместе с вами.



Свяжитесь с нами, и давайте создавать уникальные решения, которые объединят стиль, качество и доверие.

```



Requirements:



1\. Reuse existing contact/cooperation/banner component if one exists.

2\. Use existing background asset if available.

3\. If no component exists, create a reusable section component consistent with the project style.

4\. Button should navigate to contact/application form or open existing contact flow if available.

5\. Do not create a dead button.

6\. All text must be localized.



\---



\# Online Platforms Section



Section title:



```text

Онлайн площадки

```



Create 3 platform cards:



1\. Kaspi.kz

2\. Ozon

3\. Wildberries



Requirements:



1\. Use existing marketplace logos/assets if they exist.

2\. Cards must match screenshot:



&#x20;  \* light background

&#x20;  \* subtle border

&#x20;  \* rounded corners

&#x20;  \* logo centered

3\. Cards should be clickable if marketplace links exist in project config.

4\. If links are not available, keep cards non-clickable or document missing links.

5\. Do not invent random marketplace URLs if not present in the project.

6\. All section text must be localized.



\---



\# Footer



Use the existing public footer.



Make sure footer links include:



\* Наручные часы

\* Интерьерные часы

\* Аксессуары

\* Бренды

\* Мужские часы

\* Женские часы

\* Спортивные часы

\* Детские часы if available

\* Ремни if available

\* Кейсы if available

\* О нас

\* Оплата

\* Гарантия

\* Доставка



Links must use real internal route helpers.



Do not leave dead links.



\---



\# Localization



All text must be localized.



Add localization keys for:



\* page title / route label

\* intro left text

\* intro right text

\* “О компании”

\* all 4 card titles

\* all 4 card texts

\* “Наша деятельность в соцсетях”

\* “Сотрудничество и партнёрство”

\* cooperation banner text

\* “Оставить заявку”

\* “Онлайн площадки”

\* marketplace labels if needed

\* Instagram accessibility labels



Do not hardcode Russian text directly in JSX/TSX.



\---



\# Design Tokens / globals.css



Add or reuse tokens/classes for:



Colors:



```text

\#33363F

\#696E7D

\#F8F8F8

\#D2D2D2

\#000000

\#3D3D3D

\#FFFFFF

\#D2D2D299

```



Font sizes:



```text

32px

18px

24px

35px

```



Spacing:



```text

120px

20px

30px

34px

15px

11px

14px

17px

```



Radius:



```text

20px

16px

```



Use the project’s existing token naming style.



Do not use arbitrary Tailwind values directly in components when these values are reusable.



\---



\# Responsive Requirements



Page must be responsive:



1\. Banner scales with width.

2\. Intro two columns stack on mobile.

3\. Company cards become one column on small screens.

4\. Instagram slider remains usable on mobile.

5\. Cooperation banner adapts without text overflow.

6\. Marketplace cards wrap/stack cleanly.

7\. Footer remains consistent.



\---



\# Verification Checklist



Before finishing, verify:



\* About page route works.

\* Header/navigation works.

\* `about-us-banner` loads and spans full screen width.

\* Banner height adapts automatically based on image width.

\* Intro block has two equal columns on desktop.

\* Intro column gap is 20px.

\* Block spacing is 120px.

\* “О компании” has 4 cards in grid.

\* Cards have correct background, border, radius, padding.

\* Card titles/text/numbers match requested typography.

\* Number badge appears correctly in the same header row as title.

\* Social media section uses `insta-\*` assets.

\* Social slider loops infinitely.

\* Slider dots work if existing slider supports dots.

\* Instagram icon mark appears on posts.

\* Instagram post click navigates correctly.

\* Cooperation block appears and button works.

\* Online platforms section appears.

\* Marketplace cards show correct logos.

\* Footer appears and links are valid.

\* All text is localized.

\* No raw hardcoded UI strings remain in components.

\* No arbitrary Tailwind/raw hex values are introduced where tokens should exist.

\* Page is responsive.



\---



\# Documentation Updates



Update `docs/PROJECT\_MAP.md` with:



\* About page route

\* About page components

\* banner asset usage

\* Instagram slider asset naming

\* cooperation block

\* marketplace block

\* footer/internal navigation changes if made



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* About page uses `about-us-banner` as a full-width responsive banner.

\* Instagram section uses `insta-\*` assets and existing slider/dots functionality.

\* Static public pages must use localization, `Text`/`Heading`, and global tokens.

\* Reusable about/company cards must use project design tokens, not inline hardcoded styles.

\* Footer/internal links must always use real route helpers.



\---



\# Final Response Required



```markdown

Summary:

\- \[what changed]



About page:

\- \[route and main sections]



Assets:

\- \[about-us-banner and insta-\* usage]



Components:

\- \[cards/slider/cooperation/marketplace blocks]



Navigation:

\- \[links/buttons added or fixed]



Localization:

\- \[keys/files added]



Styling:

\- \[tokens/classes added or reused]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



