You are working as a senior frontend engineer on this project.



Implement and document a strict project-wide rule for localization, typography, headings, text components, and design tokens.



Before changing code:



1\. Read `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md` if they exist.

2\. Inspect the current localization setup.

3\. Inspect the existing `Text` component.

4\. Inspect the existing `Heading` component.

5\. Inspect `globals.css` and the current Tailwind/design-token setup.

6\. Follow the existing project architecture and naming conventions.



\---



\# Main Goal



From now on, all user-facing text on the site must be added to localization files and rendered through localization keys.



Also, all reusable font sizes, colors, placeholder sizes, typography values, and design tokens must be defined in `globals.css` / global design tokens and reused through named classes or existing components.



Do not hardcode text, arbitrary font sizes, arbitrary colors, or one-off Tailwind values directly in components unless there is a strong existing project convention for it.



\---



\# Localization Rules



Find the current localization/i18n structure.



Then make sure that:



1\. All user-facing text added or touched in this task is moved to localization.

2\. Components must use localization keys instead of hardcoded strings.

3\. Do not leave raw Russian/English/Kazakh UI text directly inside JSX/TSX/HTML templates.

4\. Button labels, placeholders, headings, breadcrumbs, product labels, form labels, validation messages, links, empty states, and helper text must all use localization.

5\. If a localization key does not exist, create it in the correct localization file.

6\. Use the project’s existing key naming style.

7\. Do not create a new i18n system if one already exists.

8\. If no localization system exists, document this clearly and create the smallest clean localization structure that fits the project.



After this task, update `docs/PROJECT\_SKILLS.md` with a permanent rule:



“All new user-facing text must be added to localization first and rendered through localization keys.”



\---



\# Text and Heading Component Rules



Find the existing reusable text component, for example `Text`.



Find the existing reusable heading component, for example `Heading`.



Then:



1\. Replace ordinary text tags with the reusable `Text` component where this is not yet done.

2\. Replace ordinary heading tags with the reusable `Heading` component where this is not yet done.

3\. Use the existing variant/size/color props if they already exist.

4\. Do not create duplicate text or heading components.

5\. Do not bypass these components with raw `<p>`, `<span>`, `<div>`, `<h1>`, `<h2>`, etc. for user-facing typography unless there is a valid semantic or accessibility reason.

6\. If raw semantic tags are required, keep semantics but apply the project typography system consistently.

7\. Preserve layout, accessibility, existing logic, and handlers.



After this task, update `docs/PROJECT\_SKILLS.md` with a permanent rule:



“Use the project `Text` component for normal text and the project `Heading` component for headings. Do not use raw typography tags for user-facing text unless required for semantics or accessibility.”



\---



\# globals.css / Design Token Rules



All reusable colors, font sizes, typography sizes, placeholder sizes, and similar visual values must be defined globally.



Use `globals.css` or the existing global token system.



Do not write arbitrary Tailwind values directly in components when the value should be reusable.



For example, do NOT write:



```tsx

placeholder:text-\[15px]

text-\[24px]

text-\[#AAAAAA]

bg-\[#3D3D3D]

```



Instead, define or reuse named values in `globals.css` / global tokens and use them like:



```tsx

placeholder:text-2xs

text-title

text-muted

bg-dark-button

```



Use the actual naming style already used in the project. The examples above are only examples.



Specific rule for placeholders:



\* If a placeholder needs `15px`, do not use `placeholder:text-\[15px]`.

\* Add or reuse a global text-size token, for example `text-2xs`, and use:



&#x20; \* `placeholder:text-2xs`



Specific rule for colors:



\* If colors like `#AAAAAA`, `#33363F`, `#3D3D3D`, `#525252`, `#D2D2D2`, or `#000000` are used repeatedly, they must be added as global design tokens or reused from existing tokens.

\* Do not scatter raw hex values across components.



Specific rule for font sizes:



\* If font sizes like `15px`, `17px`, `18px`, `20px`, `24px`, or `32px` are used in UI, define or reuse global typography tokens.

\* Do not scatter `text-\[...]` values across components.



After this task, update `docs/PROJECT\_SKILLS.md` with a permanent rule:



“Reusable font sizes, colors, placeholder sizes, and typography values must live in `globals.css` / global tokens. Components must use named classes/tokens instead of arbitrary Tailwind values.”



\---



\# Refactor Scope



Apply this to the relevant current page/components you are working on.



If there are obvious nearby violations in the same components, fix them too.



Do not rewrite the entire application unless necessary.



Prioritize:



1\. Current product page / product detail page.

2\. Search form.

3\. Product text block.

4\. Buttons and placeholders.

5\. Breadcrumbs.

6\. Any component touched by the current task.



\---



\# Documentation Updates



Update `docs/PROJECT\_SKILLS.md` and add these rules permanently:



1\. All user-facing text must go through localization.

2\. Use `Text` for normal text.

3\. Use `Heading` for headings.

4\. Use global design tokens from `globals.css` for font sizes, colors, placeholder sizes, and reusable UI values.

5\. Do not use arbitrary Tailwind values like `text-\[15px]`, `placeholder:text-\[15px]`, or raw hex colors in components when a reusable token should exist.

6\. When a new reusable visual value is needed, add it to `globals.css` first and then use the named class/token.



Also update `docs/PROJECT\_MAP.md` if:



\* localization structure changes

\* global styles change

\* typography system changes

\* shared UI components change

\* new components/files are created



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



Tests:

\- \[what was run, or why not run]



Notes:

\- \[assumptions, risks, or skipped checks]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



