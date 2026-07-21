You are working as a senior fullstack engineer on this project.



Improve the product reviews system.



Add review pagination, sorting, filtering, review UX improvements, and fix the sticky review form.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect current product reviews backend endpoints.

5\. Inspect current product reviews database/entity/repository/service.

6\. Inspect current product detail reviews tab.

7\. Inspect current review form sticky layout.

8\. Inspect product tabs layout.

9\. Inspect CRM review moderation if implemented.

10\. Follow existing localization, `Text`, `Heading`, `Button`, RHF, toast, pagination, and global design token rules.



Do not run long-running dev/start/watch commands as final checks.



\---



\# Main task



Improve product reviews inside the `Отзывы` tab.



Required features:



1\. Pagination for reviews.

2\. 15 reviews per page.

3\. Sorting for reviews.

4\. Filtering by rating score.

5\. Filtering reviews with text / without text.

6\. Sorting by positive/negative reviews.

7\. Sorting by newest reviews.

8\. Fix sticky review form.

9\. Add any missing review UX improvements that are needed for a polished shop experience.



\---



\# Part 1 — Review pagination



Add pagination to public product reviews.



Required:



1\. Show only 15 reviews per page.

2\. Pagination must work inside the `Отзывы` tab.

3\. Pagination must not reload the whole product page unnecessarily.

4\. Pagination state should be reflected in URL query params if the project’s pattern supports it.

5\. If URL state is too risky, keep local state but do not break back/forward navigation.

6\. Changing review page should scroll to the top of the review list, not to the top of the whole page.

7\. Pagination must be responsive.

8\. Pagination must not create horizontal overflow on mobile.

9\. Empty pages must be handled safely.



Preferred backend behavior:



```text

GET /api/products/{productIdOrSlug}/reviews?page=1\&size=15

```



Use the actual route conventions in the project.



Backend response should include pagination metadata:



```json

{

&#x20; "items": \[],

&#x20; "page": 1,

&#x20; "size": 15,

&#x20; "totalItems": 42,

&#x20; "totalPages": 3

}

```



Adapt to existing DTO conventions.



\---



\# Part 2 — Review sorting



Add sorting for reviews.



Required sort options:



1\. Newest first.

2\. Oldest first.

3\. Highest rating first.

4\. Lowest rating first.

5\. Positive first.

6\. Negative first.



Use short localized labels in the UI.



Recommended labels:



```text

Сначала новые

Сначала старые

Высокая оценка

Низкая оценка

Сначала положительные

Сначала отрицательные

```



Positive/negative logic:



\* positive: rating 4–5

\* negative: rating 1–2

\* neutral: rating 3



For “positive first”, order should generally be:



```text

rating DESC, createdAt DESC

```



For “negative first”:



```text

rating ASC, createdAt DESC

```



\---



\# Part 3 — Review filtering



Add review filters.



Required filters:



1\. Filter by rating:



&#x20;  \* all

&#x20;  \* 5 stars

&#x20;  \* 4 stars

&#x20;  \* 3 stars

&#x20;  \* 2 stars

&#x20;  \* 1 star



2\. Filter by review text:



&#x20;  \* all reviews

&#x20;  \* with text

&#x20;  \* without text



Recommended labels:



```text

Все оценки

5 звёзд

4 звезды

3 звезды

2 звезды

1 звезда



Все отзывы

С текстом

Без текста

```



Requirements:



1\. Filters must combine with sorting.

2\. Filters must combine with pagination.

3\. Changing filters must reset review page to 1.

4\. Changing sort must reset review page to 1.

5\. Backend must apply filtering correctly.

6\. Public reviews must still only show approved reviews.

7\. Pending/rejected/deleted reviews must not appear publicly.



\---



\# Part 4 — Backend review query requirements



Fix or extend backend review query logic.



The public review list endpoint must support:



```text

page

size = 15

sort

rating

hasText

```



Rules:



1\. Always filter by product.

2\. Always filter by status `APPROVED`.

3\. Apply rating filter only if selected.

4\. Apply text filter only if selected.

5\. Apply sort safely.

6\. Validate sort keys.

7\. Validate rating value 1–5.

8\. Prevent SQL injection.

9\. Keep stable ordering with createdAt as secondary sort where needed.



Example conceptual logic:



```text

WHERE product\_id = :productId

AND status = APPROVED

AND (:rating IS NULL OR rating = :rating)

AND (:hasText IS NULL OR text is/is not empty)

ORDER BY selected sort

LIMIT 15 OFFSET ...

```



Do not use ambiguous nullable PostgreSQL parameters if they caused issues before. Use safe dynamic query/specification methods.



\---



\# Part 5 — Frontend review controls



Inside the `Отзывы` tab, add a clean controls row above the review list.



Controls:



1\. Rating filter.

2\. Text/no-text filter.

3\. Sort dropdown.



The UI must match VYMPEL style.



Requirements:



1\. Controls should be compact and not visually heavy.

2\. On desktop, controls can be in one row above reviews.

3\. On mobile, controls should wrap cleanly or become horizontal scroll chips.

4\. Do not create body horizontal overflow.

5\. All labels must be localized.

6\. Loading state should be shown when reviews update.

7\. Review list should not jump aggressively.

8\. Empty state should explain the current filters.



Example empty state:



```text

По выбранным фильтрам отзывов пока нет.

Попробуйте изменить фильтр или сортировку.

```



\---



\# Part 6 — Fix sticky review form



Current problem:



The review form has `position: sticky`, but sticky behavior does not work.



Fix it properly.



Investigate likely causes:



1\. Parent container has `overflow: hidden`, `overflow: auto`, or `overflow: scroll`.

2\. Parent height is not suitable for sticky.

3\. Sticky element is inside a grid/flex container with incorrect alignment.

4\. `top` value is wrong.

5\. Sticky is disabled by transform/filter/perspective on parent.

6\. Sticky element is inside tab content that collapses or remounts incorrectly.

7\. Sticky element has no proper container boundary.



Required behavior:



1\. On desktop, review form block must stick near the top while scrolling through reviews.

2\. It must stay inside the reviews tab section.

3\. It must not overlap tabs/header.

4\. It must not cover review cards.

5\. It must stop naturally before the end of the reviews section.

6\. On mobile, sticky can be disabled if it hurts usability.

7\. Mobile should stack:



&#x20;  \* rating summary

&#x20;  \* review form

&#x20;  \* filters/sort

&#x20;  \* review list



Recommended:



```css

.reviewFormAside {

&#x20; position: sticky;

&#x20; top: var(--safe-sticky-offset);

&#x20; align-self: flex-start;

}

```



Use real project tokens/classes.



Do not hardcode a random `top` value if there is an existing sticky header offset token.



\---



\# Part 7 — Additional review UX improvements



Add missing review UX polish if not already implemented:



1\. Rating distribution summary if feasible:



&#x20;  \* 5 stars count

&#x20;  \* 4 stars count

&#x20;  \* 3 stars count

&#x20;  \* 2 stars count

&#x20;  \* 1 star count



2\. Show review count next to rating.



3\. Show current applied filters clearly.



4\. Add “Reset filters” button when filters are active.



5\. Show guest author as `Гость`.



6\. Show review date in a readable format.



7\. For reviews without text, show a clean message:



&#x20;  \* `Пользователь оставил оценку без текста.`



8\. Do not show duplicate generic text if backend already has review text.



9\. Keep review card design clean and consistent.



10\. If a user submits a review, show success toast:



&#x20;   \* `Отзыв отправлен на модерацию`



Only implement rating distribution if it is reasonable with current backend. If not, document it as follow-up.



\---



\# Part 8 — CRM consistency



If CRM review moderation already exists, make sure these changes do not break it.



Also consider adding useful CRM improvements if simple:



1\. CRM review list should support the same filters:



&#x20;  \* rating

&#x20;  \* with/without text

&#x20;  \* status

&#x20;  \* date

2\. CRM pending reviews should remain easy to find.

3\. Approving/rejecting/deleting reviews must update public rating summaries.



Do not overbuild CRM in this task if it risks breaking public reviews.



\---



\# Part 9 — Localization



Add/update localization keys for:



Public review filters/sorting:



```text

Отзывы

Сначала новые

Сначала старые

Высокая оценка

Низкая оценка

Сначала положительные

Сначала отрицательные

Все оценки

5 звёзд

4 звезды

3 звезды

2 звезды

1 звезда

Все отзывы

С текстом

Без текста

Сбросить фильтры

По выбранным фильтрам отзывов пока нет

Пользователь оставил оценку без текста

Отзыв отправлен на модерацию

```



Pagination:



```text

Следующая страница

Предыдущая страница

Страница

```



Do not hardcode text directly in JSX/TSX.



\---



\# Part 10 — Verification checklist



Before finishing, verify:



\## Reviews pagination



\* only 15 reviews appear per page

\* pagination works

\* page change fetches correct reviews

\* page change scrolls to review list top

\* mobile pagination does not overflow



\## Reviews sorting



\* newest first works

\* oldest first works

\* highest rating first works

\* lowest rating first works

\* positive first works

\* negative first works

\* sorting resets review page to 1



\## Reviews filtering



\* filter by 5 stars works

\* filter by 4/3/2/1 stars works

\* with text works

\* without text works

\* filters combine with sorting

\* filters reset pagination to page 1

\* reset filters works

\* empty state works



\## Sticky form



\* form sticks on desktop

\* form does not overlap tabs/header

\* form stays inside review section

\* form is usable on mobile

\* no parent overflow breaks sticky



\## Existing behavior



\* review submission still works

\* guest reviews still work

\* moderation rule still works

\* only approved reviews are public

\* product card rating still works

\* CRM moderation still works



\## Technical



\* no infinite render loops

\* no repeated endless review fetching

\* no body horizontal overflow

\* no hardcoded strings

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* public reviews pagination

\* review sorting/filtering query params

\* review endpoint response shape

\* sticky review form layout

\* review filters UI

\* any CRM consistency changes



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Public product reviews must be paginated, 15 per page.

\* Review sorting/filtering must be backend-driven and only use approved reviews publicly.

\* Changing review filters/sort must reset review page to 1.

\* Review form sticky behavior must be implemented with valid sticky parent layout.

\* Mobile review form should not use sticky if it harms usability.

\* Review filters/sorting/pagination must not cause infinite fetch loops.

\* Reviews without text should display a clean localized no-text message.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Reviews pagination:

\- \[15 per page behavior]



Reviews sorting/filtering:

\- \[sort and filter options added]



Sticky form:

\- \[root cause and fix]



Backend:

\- \[endpoint/query/DTO changes]



Frontend:

\- \[controls/layout/pagination changes]



CRM:

\- \[what was preserved or improved]



Tests:

\- \[what was run or why not run]



Notes:

\- \[limitations or follow-up]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



