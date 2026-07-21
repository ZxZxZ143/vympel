You are working as a senior fullstack engineer and UI/UX designer.



Implement popup/dialog behavior fixes and add a full “Оставить заявку” request system with CRM processing.



This task includes:



1\. Fix all public popups/dialogs so they close when clicking outside.

2\. Fix page horizontal shift when dialogs open.

3\. Add application/request dialog opened by “Оставить заявку”.

4\. Save submitted requests to database.

5\. Add CRM functionality to view and process these requests.



Do not rewrite unrelated site sections.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect existing popup/dialog/modal components.

5\. Inspect current “Задать вопрос по модели” modal.

6\. Inspect current “Оставить заявку” button/location.

7\. Inspect shadcn Dialog/AlertDialog usage.

8\. Inspect backend entities/migrations/controllers/services.

9\. Inspect CRM routing/sidebar/pages.

10\. Follow localization, `Text`, `Heading`, `Button`, RHF, toast, loading/error, and design-token rules.

11\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Part 1 — Popup/dialog outside click close



Current problem:



Popups/dialogs do not close when clicking outside them.



Required:



1\. All normal public dialogs/popups must close when clicking outside the dialog content.

2\. Escape key should close dialog where appropriate.

3\. Close icon should still work.

4\. Clicking inside dialog content must not close it.

5\. Destructive confirmation dialogs may keep safer behavior if the project intentionally requires explicit cancel, but ordinary forms should close on outside click.

6\. Use shadcn Dialog behavior if available.

7\. Do not use broken custom overlay logic if shadcn already handles this.



Apply at least to:



\* “Задать вопрос по модели”

\* “Оставить заявку”

\* cart/favorites confirmation dialogs if they are normal dialogs and safe to close

\* other public modal forms if using same component



\---



\# Part 2 — Fix screen shift when dialog opens



Current problem:



When a popup opens, the page shifts slightly to the left.



This is usually caused by scrollbar removal/body scroll lock adding/removing viewport width.



Required:



1\. Opening dialog must not visually shift the page left/right.

2\. Body scroll locking must be stable.

3\. Header/content must not jump.

4\. Overlay must cover page without changing layout width.

5\. Use a stable scroll-lock strategy:



&#x20;  \* preserve scrollbar gap

&#x20;  \* or use `scrollbar-gutter: stable`

&#x20;  \* or shadcn/Radix scroll lock configuration if available

6\. Do not add hacky negative margins.

7\. Verify on desktop and mobile.



Add global CSS if needed:



```css

html {

&#x20; scrollbar-gutter: stable;

}

```



Only if compatible with the project.



\---



\# Part 3 — “Оставить заявку” dialog



When user clicks the “Оставить заявку” button, open a dialog with request form.



The dialog must match the attached design direction and project style.



\## Dialog styling



Dialog content:



```text

padding-x: 50px

padding-y: 40px

```



Dialog should be centered, rounded, clean, premium, VYMPEL style.



Close icon:



\* top-right

\* clean minimal style

\* same behavior as existing dialogs



\## Dialog title



Title text example:



```text

Оставить заявку

```



Title params:



```css

font-size: 24px;

font-weight: 500;

color: #000000;

```



Spacing:



```text

margin-bottom: 43px

```



\## Field labels



Field label params:



```css

font-size: 16px;

font-weight: 400;

color: #000000;

```



Spacing:



```text

margin-bottom: 12px

```



\## Inputs



Input style:



```css

border-color: #D2D2D2;

border-radius: fully rounded / pill;

font-size: 15px;

color: #000000;

placeholder-color: #AAAAAA;

padding-x: 16px;

padding-y: 22px;

```



Active/focus state:



```css

border-color: #000000;

```



Spacing after each field:



```text

margin-bottom: 35px

```



\## Submit button



Button style:



```css

font-size: 18px;

color: #FFFFFF;

background: #525252;

padding-x: 14px;

width: 100%;

border-radius: pill/round;

```



Button must match site style.



\---



\# Part 4 — Request form fields



Use a clean form with React Hook Form.



Recommended fields:



1\. Name

2\. Phone

3\. Email

4\. Message/comment



But keep it convenient. At least one contact method must be required.



Validation:



1\. Name optional or required depending on current business style.

2\. Phone or email required.

3\. Email must be valid if entered.

4\. Phone must be valid enough if entered.

5\. Message optional but useful.

6\. Trim values.

7\. Show localized validation errors.

8\. Submit button disabled while submitting.

9\. Loading state while submitting.

10\. Success toast after submit.

11\. Error toast if backend request fails.



Suggested labels/placeholders:



```text

Ваше имя

Ваш e-mail

Ваш номер

Комментарий

Отправить

```



If using only email/phone/message like the existing question modal, that is acceptable, but “Оставить заявку” should be useful for CRM.



\---



\# Part 5 — Backend: save requests to DB



Add backend persistence for submitted applications/requests.



Create migration/entity/table.



Recommended table:



```text

customer\_request

```



Fields:



```text

id

name nullable

email nullable

phone nullable

message nullable

source nullable

status

created\_at

updated\_at

processed\_at nullable

processed\_by nullable

admin\_comment nullable

```



Recommended status enum:



```text

NEW

IN\_PROGRESS

DONE

CANCELLED

```



Rules:



1\. Public user can submit request without authentication.

2\. Request is saved with status `NEW`.

3\. Backend validates contact fields.

4\. Backend returns safe response.

5\. Do not expose stack traces.

6\. Add requestId to error responses if existing logging system supports it.



Public endpoint example:



```text

POST /api/requests

```



or follow existing project route conventions.



\---



\# Part 6 — CRM processing for requests



Add CRM page/section for submitted requests.



Possible route:



```text

/crm/requests

```



Requirements:



1\. CRM list of requests.

2\. New requests should be visible.

3\. Show fields:



&#x20;  \* name

&#x20;  \* phone

&#x20;  \* email

&#x20;  \* message

&#x20;  \* source

&#x20;  \* status

&#x20;  \* created date

&#x20;  \* processed by / processed date if available

4\. Filter by status:



&#x20;  \* all

&#x20;  \* new

&#x20;  \* in progress

&#x20;  \* done

&#x20;  \* cancelled

5\. Search by:



&#x20;  \* name

&#x20;  \* phone

&#x20;  \* email

&#x20;  \* message

6\. Open request details.

7\. Change status.

8\. Add/edit admin comment.

9\. Mark as processed/done.

10\. Delete/archive if project convention allows it.

11\. All CRM actions must have loading/success/error states.

12\. Buttons disabled while mutations are pending.

13\. CRM endpoints must be protected.

14\. Only authorized CRM/admin users can process requests.



CRM endpoints example:



```text

GET    /api/crm/requests

GET    /api/crm/requests/{id}

PATCH  /api/crm/requests/{id}/status

PATCH  /api/crm/requests/{id}/comment

DELETE /api/crm/requests/{id}

```



Adapt to existing backend conventions.



\---



\# Part 7 — “Оставить заявку” trigger



Find all “Оставить заявку” buttons, especially on cooperation/about/banner blocks.



Required:



1\. Clicking “Оставить заявку” opens the new dialog.

2\. It must not redirect unless project explicitly needs redirect.

3\. The source field should identify where request came from, for example:



&#x20;  \* `about\_cooperation\_banner`

&#x20;  \* `footer`

&#x20;  \* `home\_banner`

4\. If there are multiple triggers, pass a source value to backend.



\---



\# Part 8 — UX feedback



Public form:



1\. Success toast:



```text

Заявка отправлена

Мы свяжемся с вами в ближайшее время.

```



2\. Error toast:



```text

Не удалось отправить заявку

Попробуйте ещё раз.

```



3\. Loading button state:



```text

Отправляем...

```



4\. After success:



&#x20;  \* close dialog

&#x20;  \* reset form



CRM:



\* request status update success toast

\* request update error toast

\* loading states



All text must be localized.



\---



\# Part 9 — Security / validation



Required:



1\. Validate public request payload on backend.

2\. Limit message length.

3\. Limit name/email/phone length.

4\. Do not allow HTML/script injection.

5\. Render message safely in CRM.

6\. Public endpoint should have basic spam protection if existing infrastructure supports it.

7\. Do not expose CRM request list publicly.

8\. CRM endpoints must be backend-protected by roles.



Optional if easy:



\* simple rate limit by IP for public request submissions

\* honeypot hidden field to reduce spam



Do not overbuild if infrastructure does not exist.



\---



\# Part 10 — Responsive behavior



Dialog must work on desktop and mobile.



Desktop:



\* centered modal

\* width visually close to design

\* padding 50px x / 40px y



Mobile:



\* fit viewport

\* safe horizontal padding

\* inputs full width

\* no overflow

\* close icon accessible

\* keyboard should not break layout



If desktop padding is too large on mobile, adapt responsively.



\---



\# Verification checklist



Before finishing, verify:



\## Dialog behavior



\* outside click closes normal dialogs

\* Escape closes dialog

\* close icon works

\* clicking inside dialog does not close it

\* page does not shift left/right when dialog opens

\* overlay works

\* mobile dialog fits screen



\## Application form



\* “Оставить заявку” opens dialog

\* fields render with required styles

\* focus border becomes black

\* submit button full width

\* validation works

\* loading state works

\* success toast works

\* form resets after success

\* request is saved to DB



\## Backend



\* migration applied

\* public request endpoint works

\* validation works

\* safe errors returned

\* CRM endpoints protected



\## CRM



\* requests page exists

\* new requests appear

\* status can be changed

\* admin comment can be saved

\* loading/success/error states work

\* unauthorized users cannot access CRM requests



\## Technical



\* no hardcoded UI strings

\* no long-running dev/start/watch final checks

\* no layout regressions

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* request/application DB table

\* public request endpoint

\* CRM request processing routes/pages/endpoints

\* dialog shared behavior

\* scroll shift fix strategy

\* request source handling



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Normal public dialogs should close on outside click and Escape.

\* Opening dialogs must not shift page layout.

\* “Оставить заявку” submissions must be saved to DB and processed through CRM.

\* Public request forms must validate contact fields and show localized success/error states.

\* CRM request actions must have loading/success/error states.

\* CRM request endpoints must be protected on backend.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Dialog behavior:

\- \[outside click close / scroll shift fix]



Application form:

\- \[fields/styling/validation]



Backend:

\- \[entity/migration/public endpoint]



CRM:

\- \[request management page/actions]



Security:

\- \[validation/protection]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



