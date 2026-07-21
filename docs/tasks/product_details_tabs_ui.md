You are working as a senior frontend engineer on this project.



Implement precise UI corrections for the product detail tabs/details section based on the attached screenshot and the exact specifications below.



The screenshot is a visual reference for structure and placement. However, the exact font sizes, weights, colors, spacing, and dimensions listed in this task have higher priority than the screenshot.



Before changing code:



1\. Read `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md` if they exist.

2\. Inspect the product detail page and find the components responsible for:



&#x20;  \* tabs section

&#x20;  \* active tab underline

&#x20;  \* product description block

&#x20;  \* product characteristics/specifications block

&#x20;  \* bottom links: `Все наручные часы Romanson` and `О бренде`

3\. Inspect the existing localization structure.

4\. Inspect the existing `Text` component.

5\. Inspect the existing `Heading` component.

6\. Inspect `globals.css` and the current typography/color token system.

7\. Follow the existing project architecture and naming conventions.



\---



\# Main Goal



Update the product details section so it matches the provided design reference and exact specifications.



Also apply the project-wide rules:



\* All user-facing text must come from localization.

\* Normal text must use the existing `Text` component where appropriate.

\* Headings must use the existing `Heading` component where appropriate.

\* Reusable colors, font sizes, and typography values must be added to or reused from `globals.css` / global design tokens.

\* Do not use arbitrary Tailwind values directly in components, for example:



&#x20; \* `text-\[20px]`

&#x20; \* `text-\[22px]`

&#x20; \* `text-\[#33363F]`

&#x20; \* `border-\[#525252]`

\* Instead, define or reuse named tokens/classes in `globals.css` and then use those classes.



\---



\# Required UI Changes



\## 1. Tabs Text



This applies to the tab labels:



\* `Описание`

\* `Гарантия`

\* `Доставка`

\* `Заказ и оплата`



Required typography:



```css

font-family: Inter;

font-weight: 400;

font-style: normal;

font-size: 22px;

line-height: 100%;

letter-spacing: 0%;

color: #000000;

```



Implementation requirements:



\* Use localization keys for all tab labels.

\* Use the project `Text` component if it is the correct component for tab text.

\* Do not hardcode tab labels directly in JSX/TSX.

\* Add or reuse global typography/color tokens instead of arbitrary Tailwind values.



\---



\## 2. Active Tab Underline



The active tab underline must have:



```css

border: 4px solid #525252;

```



Additional requirements:



\* underline width must match the width of the active tab label text

\* distance between the tab text and the underline: `50px`

\* the underline must visually belong to the active tab

\* do not make the underline full-width

\* do not use an approximate underline length



The color `#525252` must be added to or reused from `globals.css` / global color tokens.



\---



\## 3. Distance Between Tab Labels



The horizontal distance between tab labels must be:



```css

225px

```



Requirements:



\* apply this spacing consistently between tab items

\* preserve the existing tab logic/state if it already exists

\* do not break tab switching behavior



If the current layout uses flex/grid, adjust spacing cleanly using the project’s styling approach.



\---



\## 4. Product Description Text



This applies to the main product description paragraphs on the left side.



Required typography:



```css

font-family: Inter;

font-weight: 300;

font-style: normal;

font-size: 20px;

line-height: 100%;

letter-spacing: 0%;

color: #000000;

```



Requirements:



\* move all hardcoded description text to localization if it is not already localized

\* render description text using the existing `Text` component

\* do not use raw `<p>`, `<span>`, or `<div>` for user-facing typography unless required for semantics/accessibility

\* if semantic paragraphs are required, still apply the project typography system consistently

\* preserve the current content and paragraph structure



\---



\## 5. Product Characteristics Names



This applies to characteristic names such as:



\* `Артикул`

\* `Браслет`

\* `Корпус`

\* `Страна`

\* `Пол`

\* `Стекло`

\* `Размер корпуса`

\* `Камень-вставка`

\* `Тип механизма`



Required typography:



```css

font-family: Inter;

font-weight: 500;

font-style: normal;

font-size: 20px;

line-height: 100%;

letter-spacing: 0%;

color: #000000;

```



Requirements:



\* move all characteristic names to localization

\* use the project `Text` component or appropriate typography component

\* keep the visual separation between name and value

\* do not hardcode labels directly in JSX/TSX



\---



\## 6. Product Characteristics Values



This applies to characteristic values such as:



\* `TM0B06MMW`

\* `Металлический`

\* `Стальной`

\* `Австрия`

\* `Мужские`

\* `Минеральное`

\* `36 мм`

\* `Swarovski`

\* `механические`



Required typography:



```css

font-family: Inter;

font-weight: 300;

font-style: normal;

font-size: 20px;

line-height: 100%;

letter-spacing: 0%;

color: #000000;

```



Requirements:



\* if characteristic values are static text, move them to localization

\* if characteristic values come from product data/API, do not move dynamic values themselves to localization

\* still localize units or static display labels where applicable

\* use the project `Text` component or appropriate typography component

\* preserve existing data mapping and product logic



\---



\## 7. Spacing Between Characteristics



The vertical distance between characteristic rows must be:



```css

22px

```



Requirements:



\* apply consistent spacing between all characteristic rows

\* preserve alignment between label and value columns

\* do not use random margins per item



\---



\## 8. Bottom Links



This applies to the links:



\* `Все наручные часы Romanson`

\* `О бренде`



Required typography:



```css

font-family: Inter;

font-weight: 500;

font-style: normal;

font-size: 20px;

line-height: 100%;

letter-spacing: 0%;

color: #33363F;

```



Spacing requirement:



```css

distance between the previous section and these links: 130px;

```



Requirements:



\* move both link texts to localization

\* preserve existing link behavior/routes if they exist

\* preserve arrows/icons if they are part of the current UI

\* align arrows/icons properly with the updated text

\* add or reuse `#33363F` as a global color token

\* use the project `Text` component or link text variant if available



\---



\# Design Token Requirements



Add or reuse global tokens/classes in `globals.css` for these values:



\## Font sizes



\* `20px`

\* `22px`



Use the project naming convention. For example:



```css

.text-base-product { font-size: 20px; }

.text-tab-product { font-size: 22px; }

```



or Tailwind-compatible token names if the project already uses that style.



Do not use arbitrary values like:



```tsx

text-\[20px]

text-\[22px]

```



\## Colors



Add or reuse tokens for:



\* `#000000`

\* `#525252`

\* `#33363F`



Do not scatter raw hex values across components.



\## Typography weights



Use the correct Inter weights:



\* `300` for description and characteristic values

\* `400` for tab labels

\* `500` for characteristic names and bottom links



If the project already has typography variants in `Text` / `Heading`, extend them carefully instead of bypassing the components.



\---



\# Localization Requirements



All user-facing static text touched in this task must be added to localization files and rendered through localization keys.



This includes:



\* tab labels

\* description text

\* characteristic labels

\* static characteristic values if they are not dynamic data

\* bottom link texts



Do not leave hardcoded Russian UI strings directly inside components.



Use the existing localization structure and naming style.



If a text value comes from backend/product data, do not incorrectly hardcode it into localization. Keep dynamic data dynamic.



\---



\# Component Requirements



Use existing project components:



\* `Text` for normal text

\* `Heading` for headings, if headings exist in this section



Replace raw typography tags where appropriate:



\* raw `<p>`

\* raw `<span>`

\* raw `<div>`

\* raw `<h1>`, `<h2>`, `<h3>`



Do not replace semantic tags if it would harm accessibility. If semantic tags are needed, keep semantics but apply typography through the project system.



\---



\# Engineering Requirements



Do:



\* follow existing project architecture

\* preserve tab switching logic

\* preserve existing routing/link behavior

\* preserve product data mapping

\* preserve accessibility where possible

\* keep the implementation clean and maintainable

\* update only relevant files

\* add reusable tokens instead of one-off styles

\* use localization for all touched static text



Do not:



\* rewrite the whole product page unnecessarily

\* break product data rendering

\* break tab functionality

\* use hardcoded Russian text in components

\* use arbitrary Tailwind values for reusable sizes/colors

\* use raw hex colors directly in components

\* use raw text tags when the project has `Text` / `Heading`

\* change content meaning



\---



\# Verification Checklist



Before finishing, verify that:



\* tab labels use Inter 400, 22px, line-height 100%, color #000000

\* active tab underline is 4px solid #525252

\* active underline width matches the active tab text width

\* distance between tab text and underline is 50px

\* distance between tab labels is 225px

\* description uses Inter 300, 20px, line-height 100%, color #000000

\* characteristic names use Inter 500, 20px, line-height 100%, color #000000

\* characteristic values use Inter 300, 20px, line-height 100%, color #000000

\* distance between characteristic rows is 22px

\* bottom links use Inter 500, 20px, line-height 100%, color #33363F

\* distance between previous section and bottom links is 130px

\* all touched static text is localized

\* reusable font sizes and colors are defined/reused in `globals.css`

\* no new arbitrary Tailwind values were introduced for these reusable values

\* `Text` and `Heading` components are used according to project rules

\* tab functionality still works

\* links still work



\---



\# Documentation Updates



Update `docs/PROJECT\_SKILLS.md` with any new permanent rules or confirmations:



\* product tabs typography must use global tokens

\* product details text must use localization

\* characteristic labels must be localized

\* reusable typography/colors must be stored in `globals.css`

\* use `Text` / `Heading` instead of raw text tags



Update `docs/PROJECT\_MAP.md` if:



\* product details component structure changed

\* localization files changed

\* global styles/tokens changed

\* shared UI components changed



\---



\# Final Response Required



After implementation, respond with:



```markdown

Summary:

\- \[what changed]



Localization:

\- \[what keys/files were added or updated]



Typography/components:

\- \[where Text/Heading were used or replaced]



Design tokens:

\- \[what was added or reused in globals.css]



Design match:

\- \[confirm tab typography, underline, description, characteristics, links, and spacing]



Tests:

\- \[what was run, or why not run]



Notes:

\- \[assumptions, risks, or skipped checks]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added or confirmed]

```



