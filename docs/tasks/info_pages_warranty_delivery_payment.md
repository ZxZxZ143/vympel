You are working as a senior frontend/fullstack engineer on this project.



Create three public informational pages according to the attached screenshots and the specifications below:



1\. Warranty page / `Гарантийные обязательства`

2\. Delivery page / `Доставка`

3\. Payment page / `Оплата`



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect existing public page layout, header, footer, navigation, typography, page paddings, and global styles.

5\. Inspect existing `Text`, `Heading`, `Button`, icon components, and `globals.css`.

6\. Inspect existing image/assets folder and find `shop.png`.

7\. Follow existing localization rules and design token rules.



Important project rules:



\* all user-facing text must be localized

\* use existing `Text` and `Heading` components where appropriate

\* use global design tokens/classes instead of raw Tailwind arbitrary values

\* do not hardcode raw hex colors directly in components if reusable tokens should exist

\* use the same standard page layout/paddings as the rest of the public site

\* update `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md` after finishing



\---



\# Pages to create



Create routes according to the existing project route style.



Preferred routes if no convention exists yet:



```text

/guarantee

/delivery

/payment

```



or Russian route names if the current project already uses them:



```text

/garantiya

/dostavka

/oplata

```



Use the actual project convention.



Add internal navigation links to these pages wherever appropriate, for example footer/help navigation if such block exists.



\---



\# Common page layout



All three pages must use the standard public page layout:



\* existing header

\* existing navigation

\* existing search area

\* standard page container width

\* standard left/right page paddings

\* standard footer

\* same visual rhythm as other pages



Do not create a custom isolated layout.



\---



\# Common typography rules



\## Page title



The title must use the standard page heading style already used in the project.



Use existing `Heading` component and global typography tokens.



Titles:



```text

Гарантийные обязательства

Доставка

Оплата

```



\## Main text



For paragraph text use:



```css

font-family: Inter;

font-weight: 300;

font-size: 20px;

line-height: normal / project readable paragraph line-height;

color: #000000;

```



Interpret `ширина 300` as `font-weight: 300`.



For bold/highlighted text inside paragraphs use:



```css

font-weight: 500;

```



Paragraph spacing:



```text

margin between paragraphs: 30px

```



For all text styling, use existing project tokens if they exist. If missing, add reusable tokens/classes in `globals.css`.



Do not hardcode inline styles.



\---



\# Warranty page



Route: warranty/guarantee page according to project convention.



Title:



```text

Гарантийные обязательства

```



Spacing:



```text

distance from title to first text block: 40px

```



Main text content:



```text

Мы гарантируем качество и надёжность реализуемых изделий и несём полную ответственность за их исправность в течение установленного гарантийного срока.



Перед отправкой каждое изделие проходит обязательную проверку на отсутствие производственных дефектов, брака и несоответствий комплектации. Мы отправляем только исправную и полностью укомплектованную продукцию.



В случае выхода изделия из строя в период действия гарантийного срока наша компания берет на себя все расходы, связанные с гарантийным обслуживанием, включая:



организацию и оплату доставки изделия в сервисный центр;

проведение диагностических и ремонтных работ;

последующую доставку отремонтированного изделия обратно получателю.

```



Important bold parts:



\* `каждое изделие проходит обязательную проверку`

\* `все расходы, связанные с гарантийным обслуживанием`



Use semantic inline text styling or existing rich text rendering. Do not hardcode separate random spans if a project text component supports variants.



\---



\## Warranty info badges



After the first main text block, add two badge/card items with icons like in the screenshot.



Use existing icons if available. If suitable icons do not exist, use the closest project icons or create small reusable icons consistently with project icon style.



Badge/card requirements:



```text

vertical padding top/bottom: 60px

distance between badge blocks: 72px

distance between icon and text: 20px

border color: #D2D2D2

```



Main badge text:



```css

font-size: 22px;

color: #33363F;

```



Subtext:



```css

font-size: 15px;

color: #AAAAAA;

```



Badge 1:



```text

1 год

гарантийный срок

```



Badge 2:



```text

Поддержка клиентов

всегда на связи с вами

```



Use localization keys.



\---



\## Warranty lower text



After badges, add lower text block.



Text styling is the same as the upper paragraph text:



```css

font-family: Inter;

font-weight: 300;

font-size: 20px;

color: #000000;

```



Bold/highlighted fragments use:



```css

font-weight: 500;

```



Text:



```text

Гарантийное обслуживание осуществляется при соблюдении условий эксплуатации изделия и не распространяется на повреждения, возникшие в результате механических воздействий, неправильного использования или самостоятельного вмешательства в конструкцию изделия.



Наша цель - обеспечить клиенту максимально простой и прозрачный процесс гарантийного обслуживания, без дополнительных затрат и сложностей.

```



Spacing:



```text

distance to footer: 170px

```



\---



\# Delivery page



Route: delivery page according to project convention.



Title:



```text

Доставка

```



Spacing:



```text

distance from title to first text block: 40px

```



Main text content:



```text

Доставка заказов осуществляется службами доставки маркетплейсов, на которых представлен наш товар:



Kaspi

Wildberries

Ozon



Все логистические операции, включая обработку заказа, сроки и стоимость доставки, выполняются выбранным маркетплейсом в соответствии с его правилами.

Актуальная информация о сроках и способе доставки отображается при оформлении заказа на платформе маркетплейса.



Также вы можете получить заказ самостоятельно в нашем магазине.

```



Bold/highlighted fragments:



\* `маркетплейсом в соответствии с его правилами`

\* `самостоятельно в нашем магазине`



Then add the store information block with image and contact details.



\---



\## Delivery store image



Use image:



```text

shop.png

```



The image already exists in the project.



Requirements:



```text

width: 659px

height: 470px

top margin: 30px

right margin/gap to contact block: 50px

bottom margin: 30px

```



The image must adapt responsively to screen size.



Use:



\* max-width behavior

\* object-fit: cover or project-standard image behavior

\* no distortion

\* responsive layout on smaller screens



\---



\## Delivery contact block



Next to the image, show contact information with icons like in the screenshot.



Icon/text spacing:



```text

distance between icon and text: 12px

```



Main text near icon:



```css

font-size: 20px;

color: #1E1E1E;

```



Subtext if present:



```css

font-size: 18px;

color: #AAAAAA;

```



Spacing:



```text

distance from main text to subtext: 9px

distance between icon blocks: 30px

```



Content:



Address:



```text

ТД ЦУМ

Проспект Абылай хана, 62

3 этаж, напротив эскалатора

```



Subtext:



```text

Алмалинский район, Алматы,

050004/A05A2M6

```



Working hours:



```text

Сегодня с 10:00 до 19:00

```



Phone:



```text

+7–747–408–06–20

```



After the image/contact block, add final text:



```text

Перед выдачей заказ может быть дополнительно проверен на комплектность и внешний вид.

```



Use same main text styling.



\---



\# Payment page



Route: payment page according to project convention.



Title:



```text

Оплата

```



Spacing:



```text

distance from title to first text block: 40px

```



The Payment page is visually similar to the Delivery page.



Main text content:



```text

При оформлении заказа на маркетплейсах оплата производится непосредственно на платформе маркетплейса в соответствии с его правилами и доступными способами оплаты:



Kaspi

Wildberries

Ozon



Доступные способы оплаты, сроки зачисления средств и подтверждение платежа определяются выбранным маркетплейсом и отображаются при оформлении заказа.



Также вы можете оплатить заказ в нашем магазине.

```



Important: fix the typo from the original request. The correct phrase is:



```text

Также вы можете оплатить заказ в нашем магазине.

```



Bold/highlighted fragments:



\* `непосредственно на платформе маркетплейса`

\* `самом магазине` or `нашем магазине` depending on exact phrase



Then reuse the same store image/contact layout from Delivery page.



Use image:



```text

shop.png

```



Same image requirements:



```text

width: 659px

height: 470px

top margin: 30px

right gap: 50px

bottom margin: 30px

responsive/adaptive

```



Same contact block:



Address:



```text

ТД ЦУМ

Проспект Абылай хана, 62

3 этаж, напротив эскалатора

```



Subtext:



```text

Алмалинский район, Алматы,

050004/A05A2M6

```



Working hours:



```text

Сегодня с 10:00 до 19:00

```



Phone:



```text

+7–747–408–06–20

```



After the image/contact block, add payment methods text:



```text

При самовывозе из нашего магазина оплата возможна следующими способами:



наличным расчётом;

банковскими картами через терминалы Kaspi Bank и Halyk Bank;

банковским переводом.



Оплата производится в момент получения товара.

```



Use same paragraph typography and spacing.



\---



\# Reusable components



Avoid duplicating large markup.



Create reusable components if appropriate:



```text

InfoPageLayout

InfoTextBlock

StoreLocationBlock

IconInfoItem

WarrantyBadge

```



or follow current project structure.



The Delivery and Payment pages should reuse the same store location/contact block.



Do not create separate duplicated versions of the same block.



\---



\# Icons



Use existing project icons if they exist:



\* location pin

\* clock

\* phone

\* warranty/shield

\* support/user



If they do not exist, add simple reusable icons consistent with current icon style.



Do not import a large icon library unless the project already uses it.



\---



\# Localization



All text must be localized.



Add localization keys for:



\* page titles

\* all paragraphs

\* all list items

\* highlighted text if needed

\* warranty badges

\* delivery/payment address info

\* working hours

\* phone label if used

\* error/empty states if any



Do not hardcode Russian text directly in JSX/TSX.



\---



\# Design tokens / globals.css



Add or reuse global tokens/classes for:



Colors:



```text

\#000000

\#33363F

\#AAAAAA

\#D2D2D2

\#1E1E1E

```



Font sizes:



```text

20px

22px

15px

18px

24px if needed

```



Spacing:



```text

40px

30px

60px

72px

20px

12px

9px

50px

170px

470px

659px

```



Use existing naming conventions.



Avoid arbitrary Tailwind values in components where reusable tokens should exist.



\---



\# Responsive behavior



Make pages responsive:



1\. On desktop, Delivery/Payment image and contact block should be side by side.

2\. On smaller screens, stack image and contact block vertically.

3\. Image should not overflow viewport.

4\. Text should remain readable.

5\. Standard page paddings should be preserved.



\---



\# Verification checklist



Before finishing, verify:



\## Warranty page



\* page route works

\* title uses standard heading style

\* title-to-text spacing is 40px

\* paragraph text uses Inter 300, 20px, black

\* highlighted text uses weight 500

\* paragraph spacing is 30px

\* warranty badges have correct icon/text spacing

\* badge border color is #D2D2D2

\* badge main text is 22px #33363F

\* badge subtext is 15px #AAAAAA

\* badge gap is 72px

\* badge vertical padding is 60px

\* lower text appears correctly

\* footer spacing is 170px



\## Delivery page



\* page route works

\* text content is correct

\* title-to-text spacing is 40px

\* `shop.png` is used

\* image is 659x470 on desktop and responsive

\* image top/right/bottom spacing follows requirements

\* contact icon block uses correct typography and spacing

\* final delivery text appears



\## Payment page



\* page route works

\* text content is correct

\* typo is fixed: `оплатить`, not `олптатить`

\* same store block is reused

\* payment methods list appears

\* final payment sentence appears



\## Technical



\* no raw hardcoded UI text in components

\* localization keys are added

\* existing header/navigation remains working

\* existing search remains working

\* no unnecessary duplicated components

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* new informational page routes

\* shared info page components

\* store location block

\* image asset usage for `shop.png`

\* localization files updated



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Informational pages must reuse standard public page layout.

\* Delivery and Payment pages must reuse the same store location/contact block.

\* Static page text must be localized.

\* Large static text pages must use `Text`/`Heading` and global typography tokens.

\* Uploaded/page images like `shop.png` must be responsive and not distorted.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Pages:

\- \[routes/pages created]



Components:

\- \[shared components added/reused]



Assets:

\- \[shop.png usage]



Localization:

\- \[keys/files added]



Styling:

\- \[tokens/classes added or reused]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions, missing assets, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



