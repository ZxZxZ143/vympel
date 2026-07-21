Fix the Favorites page.



Current problem:



When opening the liked/favorite products page, the page does not load properly and appears to freeze/hang. This may be caused by an infinite render loop, incorrect `useEffect` dependencies, repeated localStorage state updates, repeated API refetching, or unstable derived arrays/objects.



Also fix the Favorites page layout: favorite products must be displayed in a normal grid starting from the beginning/left side of the available content area, not centered in the page.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the Favorites page implementation.

5\. Inspect `useFavorites`, favorites storage, and any localStorage/state hooks.

6\. Inspect product fetching by ids if the Favorites page fetches products from backend.

7\. Inspect the existing product grid/card layout used in catalog pages.

8\. Follow existing localization, `Text`, `Heading`, product card, and global design token rules.



\---



\# Part 1 — Fix page freeze / infinite render



Find and fix the real root cause.



Check specifically:



1\. `useEffect` that reads from localStorage and then updates state on every render.

2\. `useEffect` dependencies containing unstable arrays/objects/functions.

3\. localStorage write happening during render.

4\. product ids array recreated every render and causing endless refetch.

5\. query keys changing every render.

6\. state update inside render body.

7\. favorites hook returning non-memoized values that trigger repeated effects.

8\. product fetching by ids triggering state update loop.

9\. SSR/client hydration mismatch causing repeated updates.



Required behavior:



\* Favorites page opens normally.

\* No infinite render loop.

\* No repeated uncontrolled API calls.

\* localStorage is read safely on client only.

\* invalid localStorage data does not crash the page.

\* favorite state persists after reload.

\* removing a favorite updates the page without freezing.

\* empty favorites state works.



Implementation rules:



\* Do not read/write localStorage directly during render.

\* Use stable memoized ids/values where needed.

\* Use correct `useEffect` dependencies.

\* Use centralized favorites storage/hook.

\* Do not create duplicated favorites state logic inside the page.



\---



\# Part 2 — Favorites grid layout



Favorite products must be displayed as a grid.



Layout requirements:



1\. Products must start from the left/start of the available content area.

2\. Products must not be centered as a small group in the middle.

3\. Use the same product card component as catalog/brand pages.

4\. Use the same standard page container and paddings as the rest of the site.

5\. Use the existing product grid pattern from catalog if available.

6\. Grid must be responsive.



Expected behavior:



```text

\[Product card] \[Product card] \[Product card] ...

\[Product card] \[Product card] \[Product card] ...

```



Not:



```text

&#x20;       \[Product card] \[Product card]

```



Spacing should follow existing product grid/card spacing from the project.



If the existing catalog grid already has correct spacing, reuse it.



\---



\# Part 3 — Similar products section



If the Favorites page has a `Похожие товары` section:



1\. It must not cause infinite re-renders.

2\. It must not refetch repeatedly.

3\. It must use stable query params/ids.

4\. It should appear below favorites with existing required spacing.

5\. It should also use existing product card/grid/carousel components.

6\. It must not center incorrectly unless the existing carousel design requires it.



\---



\# Part 4 — Verification checklist



Before finishing, verify:



\* Favorites page opens without freezing.

\* Browser console has no “Too many re-renders” / maximum update depth errors.

\* Network tab does not show endless repeated requests.

\* localStorage favorites are read correctly.

\* invalid localStorage data is handled safely.

\* empty favorites state works.

\* favorite products render in a grid.

\* grid starts from the left/start of the available content area.

\* favorite active state is correct on cards.

\* removing favorite updates the grid.

\* similar products section does not trigger loops.

\* docs are updated if hooks/layout patterns changed.



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` if Favorites page, hooks, product fetching, or layout structure changed.



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Do not read/write localStorage during render.

\* Favorites/cart hooks must be SSR-safe and must not cause infinite render loops.

\* Arrays used in query keys/effects must be stable/memoized where needed.

\* Favorites page product cards must use the shared product grid/card layout and align from the start of the content area.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Root cause:

\- \[why Favorites page froze]



Favorites logic:

\- \[how localStorage/state/fetching was fixed]



Layout:

\- \[how grid/start alignment was fixed]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



