You are working as a senior frontend engineer and UI designer.



Improve the dropdown/select UI used in the reviews filters/sorting area and any other matching public selects where the same component is reused.



Current problem:



The dropdown looks too native/basic and visually weak. The current arrow/indicator also looks unattractive.



It should be redesigned in the VYMPEL style.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current select/dropdown component(s) used for review sorting/filtering.

5\. Inspect the language selector, because its visual style should be used as inspiration.

6\. Inspect global design tokens and reusable UI components.

7\. Follow existing localization, `Text`, `Button`, and design-token rules.



\---



\# Main task



Make the dropdowns/selects visually better.



Use a style inspired by the language selector:



\* light/translucent feel

\* subtle border

\* premium minimal appearance

\* elegant hover/focus states

\* custom красивый dropdown indicator instead of the current default-looking arrow



This applies first of all to review sorting/filter dropdowns, but if the project already has a shared select component for public UI, improve the shared component so the style becomes consistent.



\---



\# Visual requirements



\## Base field



The closed dropdown should have:



1\. clean rounded shape

2\. subtle outline/border

3\. slightly translucent/light background

4\. refined padding

5\. good vertical centering

6\. elegant typography

7\. compact but premium appearance



Visual direction:



\* similar in spirit to the language switcher

\* not too heavy

\* not browser-default looking

\* not overly dark or marketplace-like

\* should match the overall VYMPEL style



\## Border / surface



Required feel:



\* subtle stroke

\* slightly transparent or soft light background

\* refined contrast with surrounding page

\* keep it readable on all current page backgrounds



You may implement something visually like:



\* soft white / translucent surface

\* subtle gray border

\* very light shadow if appropriate

\* hover/focus enhancement



But do it through project tokens/classes, not random one-off styles.



\---



\# Dropdown indicator



Current indicator looks weak.



Replace it with a prettier custom indicator.



Requirements:



1\. use a custom chevron/caret/arrow icon

2\. it must look elegant and minimal

3\. it must be properly centered vertically

4\. it must animate subtly on open/close if appropriate

5\. it must match the language selector style

6\. do not use an ugly default native arrow if avoidable



Preferred behavior:



\* closed: small elegant downward chevron

\* open: chevron rotates upward or rotates 180°

\* animation subtle and smooth



If there is already an icon set in the project, reuse it.



\---



\# Dropdown menu / popup



The opened dropdown list must also look polished.



Requirements:



1\. same stylistic language as the field

2\. light/translucent look

3\. subtle border

4\. clean radius

5\. no raw browser-native dropdown look

6\. comfortable option height

7\. good hover/active state

8\. selected option visually clear

9\. proper shadow / layering

10\. no clipped menu

11\. no ugly hard edges



Menu should feel like a polished custom dropdown, not a default OS control.



\---



\# Typography and spacing



Requirements:



1\. text vertically centered

2\. no cramped options

3\. enough horizontal padding

4\. text readable on desktop and mobile

5\. selected value readable in the trigger

6\. long labels should not break layout badly



\---



\# Focus / interaction states



Add clean interaction states:



1\. hover

2\. focus-visible

3\. open state

4\. selected option state

5\. disabled state if applicable



Focus state should be accessible and visible, but still elegant.



\---



\# Scope



At minimum, apply this to:



\* review sorting dropdown

\* review filter dropdowns if they use selects

\* any closely related public-facing selects sharing the same component



If the select is shared and safely reusable, update the common select component rather than styling only one instance.



Do not accidentally break CRM admin selects if they intentionally use a different style, unless the component is truly shared and should remain consistent.



\---



\# Mobile behavior



Ensure dropdowns also look good on mobile:



1\. trigger remains tappable

2\. menu fits viewport

3\. no horizontal overflow

4\. indicator remains aligned

5\. typography remains readable

6\. opened menu does not look cramped



\---



\# Technical guidance



1\. Prefer improving the shared select/dropdown component if one exists.

2\. If native `<select>` is used and cannot be styled enough, replace with a project-consistent custom select component only if it is safe and not excessive.

3\. Reuse the style language of the language selector.

4\. Use project design tokens and reusable classes.

5\. Do not hardcode arbitrary raw values everywhere if the styles are reusable.

6\. Keep accessibility intact.



\---



\# Verification checklist



Before finishing, verify:



\* dropdown trigger looks visually improved

\* style feels similar to language selector

\* border is subtle and elegant

\* background has a light/translucent feel

\* custom dropdown indicator is used

\* indicator looks better than current one

\* open/close visual state is clear

\* menu looks polished

\* selected option is clear

\* keyboard interaction still works

\* mobile layout still works

\* no horizontal overflow

\* no broken select logic



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` if shared select/dropdown components were changed.



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Public dropdown/select components should use the VYMPEL design style, inspired by the language selector.

\* Avoid raw native-looking dropdown indicators when a polished custom indicator is available.

\* Reusable select styles should have subtle borders, light surfaces, and consistent hover/focus/open states.



\---



\# Final response required



```markdown id="4sq0lz"

Summary:

\- \[what changed]



Dropdown styling:

\- \[trigger/menu/indicator improvements]



Scope:

\- \[which selects/components were updated]



Accessibility:

\- \[focus/keyboard/mobile behavior]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



