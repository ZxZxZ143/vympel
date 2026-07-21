Resume the previous responsive/mobile adaptation task safely.



The previous run was stopped because one of the scripts/checks entered an infinite or extremely long execution. Do not continue blindly.



Before making new changes:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current git diff and changed files.

5\. Identify what parts of `docs/tasks/full\_responsive\_mobile\_adaptation.md` were already completed.

6\. Identify what parts are still incomplete.

7\. Identify which script/check caused the infinite execution.

8\. Do not run that same command again until you understand why it hangs.



\---



\# Important execution rule



Do not run long or potentially infinite scripts without limits.



If a check/build/lint/test command is needed:



1\. Prefer targeted checks first.

2\. Use the smallest relevant command.

3\. Avoid watch mode.

4\. Avoid dev servers that keep running forever unless explicitly needed.

5\. If a command is expected to stay alive, do not treat it as a normal verification command.

6\. If a command hangs, stop and explain the reason instead of retrying endlessly.



Do not use commands like these as final checks unless they are intentionally handled:



```text id="jru148"

npm run dev

next dev

vite --watch

jest --watch

test --watch

```



Use non-watch commands instead, for example:



```text id="h9pdks"

npm run lint

npm run build

npm run typecheck

npm test -- --runInBand

```



Adapt to the actual project scripts.



\---



\# Recovery plan required



Before coding, write a short recovery plan:



```markdown id="xef2qq"

Already completed:

\- \[...]



Incomplete:

\- \[...]



Broken / risky:

\- \[...]



Next safe steps:

\- \[...]

```



Then continue only from the unfinished parts of the responsive/mobile adaptation task.



Do not restart the entire task from zero.



Do not revert unrelated changes.



\---



\# Continue the previous task



Continue implementing full responsive adaptation for:



\* header/mobile navigation

\* search behavior on mobile/tablet

\* catalog layout

\* filters/categories/sorting on mobile

\* product cards

\* product detail page

\* cart

\* favorites

\* brand pages

\* about/info pages

\* footer

\* large banners



Keep the previous requirement:



Large banners must remain visually large on tablet/mobile and should still occupy a strong part of the screen when they enter the active viewing area.



The site must not break even at very small widths such as:



```text id="05rwa4"

390px

360px

320px

```



No horizontal overflow.



Text must remain readable and proportional.



Touch targets must remain comfortable.



\---



\# Additional toast UI fixes



Also fix toast styling.



Current requirements:



1\. Toast text must not wrap to a new line if it can reasonably fit.

2\. Toast content should stay on one line on desktop/tablet.

3\. On very small mobile screens, avoid ugly wrapping; use a responsive layout only if absolutely necessary.

4\. Use `white-space: nowrap` or a similar project-safe approach where appropriate.

5\. Prevent toast layout from becoming too wide for mobile screens.

6\. Toast action button must be round/circular.

7\. Toast action button text must be 3px larger than the current toast button text.

8\. Keep toast style consistent with VYMPEL design.

9\. Do not leave default shadcn styling if it does not match the project.

10\. Use global tokens/classes instead of raw arbitrary styles where reusable.



Example:



```text id="ttkli5"

Toast message: Товар добавлен в корзину

Button: Перейти

```



The message should not break awkwardly into multiple lines.



The button should look rounded/circular and visually polished.



\---



\# Responsive toast behavior



Toast must work correctly on:



```text id="p0eex5"

desktop

tablet

mobile

very small mobile

```



Requirements:



\* no horizontal overflow

\* no clipped text

\* action button remains tappable

\* button does not overlap message

\* toast does not cover important UI too aggressively

\* toast respects project animation style



\---



\# Verification checklist



Before finishing, verify:



\## Recovery



\* current diff was inspected

\* already completed work was not rewritten unnecessarily

\* infinite script/check was identified

\* no watch/dev server command was used as a final check



\## Responsive



\* site does not overflow horizontally at 320px

\* header works on mobile

\* catalog works on mobile

\* product page works on mobile

\* cart and favorites work on mobile

\* footer works on mobile

\* large banners remain visually strong on mobile/tablet

\* text is readable and proportional



\## Toasts



\* toast text does not wrap awkwardly

\* toast action button is round/circular

\* toast action button text is 3px larger than before

\* toast works on mobile

\* toast does not overflow viewport

\* toast style matches VYMPEL



\## Technical



\* no infinite render loops

\* no endless scripts

\* no hydration errors

\* no broken layout after responsive changes

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* what responsive work was completed

\* mobile/tablet layout changes

\* toast styling changes

\* any risky/unfinished responsive areas



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Do not run watch/dev-server commands as final verification checks.

\* After interrupted Codex runs, inspect git diff and continue only unfinished parts.

\* Responsive work must be verified at very small widths, including 320px.

\* Toast text should avoid awkward wrapping.

\* Toast action buttons must follow project design and remain mobile-safe.



\---



\# Final response required



```markdown id="ok4ess"

Recovery summary:

\- \[what was already completed]

\- \[what was incomplete]

\- \[what caused/likely caused infinite execution]



Responsive continuation:

\- \[what was completed now]



Toast fixes:

\- \[text no-wrap behavior]

\- \[round button]

\- \[button text size increase]



Checks:

\- \[what was run]

\- \[what was intentionally not run and why]



Notes:

\- \[remaining risks or follow-up items]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



