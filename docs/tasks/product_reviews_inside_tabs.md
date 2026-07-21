You are working as a senior frontend/fullstack engineer on this project.



Fix the product detail reviews layout.



Currently the reviews block is rendered as a separate section below the product tabs. This is wrong.



The reviews block must be moved into the same tab list where these tabs are located:



\* Описание

\* Гарантия

\* Доставка

\* Заказ и оплата



Add a new tab:



\* Отзывы



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current product detail tabs implementation.

5\. Inspect the current reviews/rating section implementation.

6\. Inspect product review form, review list, rating summary, and API integration.

7\. Follow existing localization, `Text`, `Heading`, `Button`, form, RHF, toast, and global design token rules.



\---



\# Main task



Move the entire reviews section into the product detail tabs.



Required tab order:



```text

Описание

Гарантия

Доставка

Заказ и оплата

Отзывы

```



When the user clicks `Отзывы`, show:



1\. rating summary

2\. review form

3\. review list

4\. empty state if there are no reviews

5\. loading/error states if needed



Do not duplicate the reviews block outside the tabs.



\---



\# Tab underline styling



Fix the active tab underline.



Current requirement:



1\. The active underline must align with the same horizontal line under the tabs.

2\. The underline for `Отзывы` must behave exactly like other active tabs.

3\. The active underline width must match the active tab text or follow the existing active-tab rule.

4\. The distance between the tab label text and the underline must be `50px`.

5\. The underline must not jump, shift, or appear on a different baseline.

6\. The bottom divider line must remain visually consistent across all tabs.



Expected behavior:



```text

Описание        Гарантия        Доставка        Заказ и оплата        Отзывы



\[active underline aligned on the same baseline]

```



Use global spacing/token classes where possible.



Do not add arbitrary one-off styles if this value should become reusable.



\---



\# Reviews layout inside tab



Inside the `Отзывы` tab, keep the existing two-column desktop layout if it works:



Left side:



\* rating summary

\* review form

\* moderation note



Right side:



\* review cards/list



But improve the behavior:



1\. The review form block must use `position: sticky`.

2\. It must be pinned near the top while the user scrolls through reviews.

3\. It should follow the review list smoothly.

4\. It must not overlap the product tabs/header.

5\. It must not cover other content.

6\. It must respect the current sticky header if the project has one.



Recommended:



```css

position: sticky;

top: \[safe offset based on header/tabs height];

```



Use the actual layout and header structure to choose the correct `top`.



\---



\# Mobile behavior



On mobile/tablet:



1\. Tabs must remain usable.

2\. If tabs do not fit, use horizontal scroll tabs or the existing mobile tab pattern.

3\. Reviews content should stack vertically.

4\. Sticky review form may be disabled on small screens if it hurts usability.

5\. Review form must not cover review cards.

6\. No horizontal overflow.

7\. All text must remain readable.



Recommended mobile structure:



```text

Отзывы

Rating summary

Review form

Review list

```



\---



\# Review form sticky rules



The sticky review form must:



1\. Stick only within the reviews tab content area.

2\. Stop before the end of the reviews section.

3\. Not overlap footer or following sections.

4\. Work only on desktop/tablet where there is enough space.

5\. Be normal/static on small mobile screens if sticky causes layout problems.



\---



\# Data and behavior must remain working



Do not break:



1\. review submission

2\. rating selection

3\. optional text review

4\. guest review behavior

5\. moderation note

6\. loading/success/error toasts

7\. rating summary

8\. approved review list

9\. CRM moderation behavior

10\. product rating on cards



This is primarily a layout/placement fix, not a backend rewrite.



Only change backend/API if the current frontend integration requires it.



\---



\# Localization



Add/update localization keys if needed:



\* Отзывы

\* Ваш отзыв

\* Отправить отзыв

\* Отзыв появится после проверки модератором

\* Пока нет отзывов

\* Ошибка загрузки отзывов



Do not hardcode strings directly in JSX/TSX.



\---



\# Verification checklist



Before finishing, verify:



\* `Отзывы` appears as a product detail tab

\* reviews block is no longer duplicated outside the tabs

\* clicking `Отзывы` shows the review section

\* active underline aligns with the same underline baseline as other tabs

\* distance between tab text and underline is `50px`

\* review form is sticky on desktop

\* review form does not overlap tabs/header/content

\* review list scrolls naturally

\* mobile layout does not break

\* review submission still works

\* rating summary still works

\* approved reviews still render

\* all text is localized

\* docs are updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* product detail tabs now include reviews

\* reviews tab layout

\* sticky review form behavior

\* mobile reviews tab behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Product reviews must live inside the product detail tabs, not as a separate duplicated block.

\* Active tab underline must stay aligned across all product tabs.

\* Product tab underline spacing from label must remain consistent.

\* Desktop review form may use sticky positioning, but mobile must remain usable and non-overlapping.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Product tabs:

\- \[how reviews were moved into tabs]



Tab underline:

\- \[how underline alignment and 50px spacing were fixed]



Reviews layout:

\- \[sticky form behavior and review list layout]



Mobile:

\- \[how reviews tab adapts]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



