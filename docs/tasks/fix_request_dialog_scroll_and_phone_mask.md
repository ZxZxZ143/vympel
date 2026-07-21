You are working as a senior frontend engineer.



Fix only the “Оставить заявку” dialog UI and phone input behavior.



Do not change backend, CRM logic, request saving logic, or unrelated dialogs unless they share the same broken scroll/input component.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current “Оставить заявку” dialog.

5\. Inspect shared Dialog/Modal components.

6\. Inspect current form input components and RHF setup.

7\. Follow existing localization, `Text`, `Button`, form, and design-token rules.



\---



\# Problem 1 — Dialog scrollbar looks bad



Current issue:



The scrollbar appears outside/too close to the dialog edge and visually breaks the modal design.



Required:



1\. The scrollbar must not visually go outside the dialog.

2\. Either hide the scrollbar cleanly, or style it so it looks premium and stays inside the dialog content area.

3\. The dialog must not lose scroll ability on small screens.

4\. The submit button must remain accessible.

5\. The close icon must remain visible.

6\. The dialog content must not overflow outside rounded corners.

7\. The modal must remain usable on mobile and small-height screens.



Preferred solution:



\* keep the outer dialog visually clean;

\* make only the inner content area scrollable;

\* hide native scrollbar if it looks bad;

\* or style it subtly inside the dialog.



Recommended structure:



```text

DialogContent

&#x20; DialogHeader / title / close

&#x20; ScrollableDialogBody

&#x20;   form fields

&#x20;   submit button

```



CSS behavior:



```css

.dialogContent {

&#x20; overflow: hidden;

}



.dialogBody {

&#x20; max-height: calc(100dvh - safe offsets);

&#x20; overflow-y: auto;

&#x20; scrollbar-width: thin or none;

}

```



If hiding scrollbar:



```css

scrollbar-width: none;

\-ms-overflow-style: none;

```



and:



```css

::-webkit-scrollbar {

&#x20; display: none;

}

```



Only hide scrollbar if scrolling remains intuitive and usable.



If styling scrollbar:



\* width small

\* thumb #D2D2D2 or project-neutral color

\* track transparent

\* border-radius rounded

\* scrollbar inside content area, not outside modal.



\---



\# Problem 2 — Phone input mask



Add phone number input mask for the request dialog.



The phone field must format itself automatically.



Required behavior:



1\. User can type only the needed number of digits.

2\. Extra digits must not be accepted.

3\. Formatting must be automatic.

4\. User should not manually type spaces, brackets, or symbols.

5\. Paste must be handled correctly.

6\. Backspace/delete must work naturally.

7\. Form value should be normalized before sending to backend.

8\. Validation should check that the phone is complete if phone is used as contact method.

9\. Existing rule remains: user must provide email or phone.

10\. If email is empty, phone must be complete.

11\. If phone is empty, email must be valid.



Use Kazakhstan-friendly format.



Recommended display format:



```text

+7 777 777 77 77

```



Behavior:



\* force prefix `+7` or normalize `8` / `7` to `+7`;

\* allow only 10 digits after country code;

\* display as `+7 XXX XXX XX XX`;

\* internal normalized value can be `+77777777777`.



Examples:



```text

7777777777 -> +7 777 777 77 77

87777777777 -> +7 777 777 77 77

+77777777777 -> +7 777 777 77 77

```



Do not allow:



```text

+7 777 777 77 777

```



\---



\# Phone input implementation



Use the cleanest project-safe approach.



Options:



1\. If the project already has an input mask utility/library, reuse it.

2\. If not, implement a small local helper:



&#x20;  \* `normalizePhoneInput`

&#x20;  \* `formatKazakhstanPhone`

&#x20;  \* `getPhoneDigits`

3\. Do not add a heavy dependency unless really necessary.



Recommended helper behavior:



```text

raw input -> keep digits only

if starts with 8 and length > 10, replace first 8 with 7

if starts with 7 and length > 10, treat first 7 as country code

keep max 11 digits including leading 7

display as +7 XXX XXX XX XX

submit normalized as +7XXXXXXXXXX

```



Keep it simple and robust.



\---



\# Form validation



Update request form validation:



1\. Name can stay optional or required according to current form behavior.

2\. Email is optional if phone is provided.

3\. Phone is optional if email is provided.

4\. At least one contact method is required.

5\. If email is entered, validate email format.

6\. If phone is entered, validate full Kazakhstan phone format.

7\. Show localized validation messages.

8\. Do not let incomplete phone submit as valid.



Validation messages examples:



```text

Укажите e-mail или номер телефона

Введите корректный e-mail

Введите номер полностью

```



All text must be localized.



\---



\# Styling



Phone input must keep the same style as other dialog inputs:



\* rounded/pill shape

\* border #D2D2D2

\* black border on focus

\* font-size 15px

\* placeholder #AAAAAA

\* padding x 16px / y 22px

\* no default ugly browser styling



Placeholder:



```text

+7 777 777 77 77

```



\---



\# Verification checklist



Before finishing, verify:



\## Dialog scroll



\* scrollbar no longer ruins visual design

\* scrollbar is hidden or styled inside the dialog

\* dialog content does not overflow rounded corners

\* submit button remains reachable

\* close button remains visible

\* mobile/small-height screen works



\## Phone mask



\* typing digits formats automatically

\* paste formats correctly

\* cannot enter too many digits

\* backspace works

\* `8...` normalizes to `+7...`

\* `7...` normalizes to `+7...`

\* incomplete number shows validation error

\* valid number submits normalized value

\* email-or-phone validation still works



\## Scope



\* backend/CRM request processing is unchanged

\* unrelated dialogs are unchanged unless they use the shared fixed scroll container

\* all new text localized

\* no hardcoded UI strings



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` only if shared dialog/input helpers changed.



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Dialog scrollbars must not visually break rounded modal layouts.

\* Long modal forms should use an inner scrollable body, not outer overflow that escapes the dialog.

\* Phone fields for Kazakhstan users should use a mask like `+7 XXX XXX XX XX` and submit normalized values.

\* Request forms must require at least one valid contact method.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Dialog scroll:

\- \[hidden/styled scrollbar and inner scroll behavior]



Phone mask:

\- \[format/normalization/validation]



Scope:

\- \[what was intentionally not changed]



Tests:

\- \[what was checked]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed or not needed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



