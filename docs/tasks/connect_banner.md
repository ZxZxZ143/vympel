You are working as a senior frontend engineer on this project.



Implement a new contact/banner section using the existing image asset `connect-banner.jpg`, which is already located somewhere in the project.



Before changing code:



1\. Read `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md` if they exist.

2\. Find where image/static assets are stored in the project.

3\. Locate `connect-banner.jpg`.

4\. Inspect the current page/component where this banner should be added.

5\. Inspect the existing localization structure.

6\. Inspect the existing `Text` component.

7\. Inspect the existing `Heading` component.

8\. Inspect `globals.css` and the current typography/color token system.

9\. Follow the existing project architecture, naming conventions, and styling approach.



\---



\# Main Goal



Create a new banner/contact section based on the existing image `connect-banner.jpg`.



The banner must:



\* use `connect-banner.jpg` as the background/image asset

\* stretch to the full available width of the parent container

\* have adaptive height based on its content

\* have exact paddings, typography, colors, and spacing from this task

\* use localization for all user-facing text

\* use existing `Text` / `Heading` components where appropriate

\* use global design tokens from `globals.css` instead of arbitrary Tailwind values or raw hex values inside components



\---



\# Required Banner Content



The banner must contain the main heading:



`Готовы связаться с Vympel?`



The heading should visually appear as two lines if the layout requires it:



```text

Готовы связаться

с Vympel?

```



The banner must also contain:



\* a button with localized text

\* a side text block with localized text



Use the current project content/navigation logic if there is already an existing contact action, route, popup, or form.



Do not invent unrelated behavior. If the intended button action is unclear, preserve the closest existing contact behavior or make the button structurally ready and document the assumption in the final response.



\---



\# Layout Requirements



\## Banner Wrapper



The whole banner block must have:



\* margin-top from the previous section: `122px`

\* width: full available width of the parent container

\* height: adaptive based on content

\* left padding: `50px`

\* right padding: `38px`

\* top padding: `44px`

\* bottom padding: `63px`



Use `connect-banner.jpg` as the banner background or image according to the existing project pattern.



The image must:



\* cover the banner area cleanly

\* not distort

\* stay visually consistent with the design

\* not break responsive behavior



\---



\## Right Text Block



The right-side text block must have additional internal paddings:



\* top padding: `30px`

\* bottom padding: `10px`



Preserve its logical placement on the right side of the banner if the layout is desktop.



On smaller screens, make the layout responsive according to the project’s existing responsive patterns.



\---



\# Typography Requirements



\## Main Heading



For the text:



`Готовы связаться с Vympel?`



Required typography:



```css

font-family: Inter;

font-weight: 500;

font-style: normal;

font-size: 60px;

line-height: 100%;

letter-spacing: 0%;

color: #FFFFFF;

```



Implementation requirements:



\* use localization key for this text

\* use the project `Heading` component if it supports this use case

\* if `Heading` needs a new variant/size, extend it carefully according to the project pattern

\* do not hardcode the heading text directly in JSX/TSX

\* do not use arbitrary Tailwind values like `text-\[60px]`

\* add or reuse a global typography token in `globals.css`



\---



\## Button Text



Required typography for the button text:



```css

font-family: Inter;

font-weight: 400;

font-style: normal;

font-size: 20px;

line-height: 100%;

letter-spacing: 0%;

color: #3D3D3D;

```



Button background:



```css

background-color: #FFFFFF;

```



Button padding:



```css

padding-left: 15px;

padding-right: 15px;

padding-top: 52px;

padding-bottom: 52px;

```



Spacing:



\* margin-top / distance from heading text to button: `30px`



Implementation requirements:



\* use localized button text

\* preserve or reuse existing button component if it can match the required design

\* if the existing button component cannot match the required design, extend it carefully

\* do not hardcode raw hex colors directly in the component

\* define/reuse global tokens in `globals.css`

\* do not use arbitrary Tailwind values like `text-\[20px]`, `text-\[#3D3D3D]`, or `py-\[52px]`



\---



\## Side Text



Required typography for the side text:



```css

font-family: Inter;

font-weight: 500;

font-style: normal;

font-size: 18px;

line-height: 100%;

letter-spacing: 0%;

color: #E4E4E4;

```



Implementation requirements:



\* use localization key for the side text

\* use the project `Text` component

\* if `Text` needs a new variant/size, extend it carefully according to the project pattern

\* do not hardcode the side text directly in JSX/TSX

\* do not use arbitrary Tailwind values like `text-\[18px]` or `text-\[#E4E4E4]`

\* add or reuse global typography/color tokens in `globals.css`



\---



\# Design Token Requirements



Add or reuse global tokens/classes in `globals.css` for the values used in this banner.



\## Font sizes



Add or reuse tokens for:



\* `60px`

\* `20px`

\* `18px`



Do not use arbitrary Tailwind values like:



```tsx

text-\[60px]

text-\[20px]

text-\[18px]

```



\## Colors



Add or reuse tokens for:



\* `#FFFFFF`

\* `#3D3D3D`

\* `#E4E4E4`



Do not use raw hex values directly in components.



\## Spacing



Add or reuse tokens/utilities according to the existing project style for:



\* `122px`

\* `50px`

\* `38px`

\* `44px`

\* `63px`

\* `30px`

\* `10px`

\* `15px`

\* `52px`



Do not scatter arbitrary values throughout JSX/TSX if these are part of the reusable design system.



\---



\# Localization Requirements



All user-facing text in this banner must be added to localization files and rendered through localization keys.



This includes:



\* main heading text

\* button text

\* side text



Use the existing localization structure and key naming convention.



Do not leave hardcoded Russian UI strings directly inside components.



If localization does not currently have a suitable namespace for this section, create one following the existing project pattern.



\---



\# Component Requirements



Use existing project components:



\* `Heading` for the main banner heading

\* `Text` for the side text

\* existing `Button` component if it can match the design accurately



Do not create duplicate typography components.



If existing `Text`, `Heading`, or `Button` components do not support the required variants, extend them carefully using the project’s existing API/style pattern.



Preserve accessibility:



\* button must remain a real `<button>` or valid link/button component depending on action

\* background image should not replace meaningful text

\* text must remain readable



\---



\# Engineering Requirements



Do:



\* follow the existing project architecture

\* locate and use the existing `connect-banner.jpg` asset

\* create a clean reusable banner component if appropriate

\* use localization for all text

\* use `Text` and `Heading` components

\* use global tokens from `globals.css`

\* keep the layout responsive

\* keep the banner full width inside the parent container

\* keep height adaptive to content

\* update only relevant files



Do not:



\* hardcode user-facing Russian text in JSX/TSX

\* use raw typography tags for styled text when `Text` / `Heading` should be used

\* use arbitrary Tailwind values for reusable font sizes, colors, or spacing

\* use raw hex colors directly in components

\* distort the banner image

\* break existing page layout

\* rewrite unrelated parts of the page

\* invent unrelated business logic



\---



\# Verification Checklist



Before finishing, verify that:



\* `connect-banner.jpg` is used correctly

\* banner stretches to the full available width of the parent container

\* banner height adapts to content

\* banner margin-top from previous section is `122px`

\* banner padding is:



&#x20; \* left `50px`

&#x20; \* right `38px`

&#x20; \* top `44px`

&#x20; \* bottom `63px`

\* right text block has:



&#x20; \* top padding `30px`

&#x20; \* bottom padding `10px`

\* heading uses:



&#x20; \* Inter

&#x20; \* weight `500`

&#x20; \* size `60px`

&#x20; \* line-height `100%`

&#x20; \* color `#FFFFFF`

\* button text uses:



&#x20; \* Inter

&#x20; \* weight `400`

&#x20; \* size `20px`

&#x20; \* line-height `100%`

&#x20; \* color `#3D3D3D`

\* button background is `#FFFFFF`

\* button padding is:



&#x20; \* x `15px`

&#x20; \* y `52px`

\* button is `30px` below the heading

\* side text uses:



&#x20; \* Inter

&#x20; \* weight `500`

&#x20; \* size `18px`

&#x20; \* line-height `100%`

&#x20; \* color `#E4E4E4`

\* all banner texts are localized

\* `Text` / `Heading` are used according to project rules

\* reusable typography, colors, and spacing are added/reused in `globals.css`

\* no new raw hex colors or arbitrary Tailwind typography values were introduced in components

\* responsive behavior is not broken



\---



\# Documentation Updates



Update `docs/PROJECT\_SKILLS.md` with any permanent reusable rules confirmed or added:



\* banner text must be localized

\* banner typography must use `Text` / `Heading`

\* banner colors, spacing, and font sizes must use global tokens

\* `connect-banner.jpg` asset usage pattern if relevant



Update `docs/PROJECT\_MAP.md` if:



\* a new banner component is created

\* localization files change

\* global styles/tokens change

\* shared UI components are extended

\* page structure changes



\---



\# Final Response Required



After implementation, respond with:



```markdown

Summary:

\- \[what changed]



Localization:

\- \[what keys/files were added or updated]



Typography/components:

\- \[where Text/Heading/Button were used or extended]



Design tokens:

\- \[what was added or reused in globals.css]



Design match:

\- \[confirm banner image, paddings, typography, colors, button, side text, and spacing]



Tests:

\- \[what was run, or why not run]



Notes:

\- \[assumptions, risks, or skipped checks]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added or confirmed]

```



