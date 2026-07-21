You are working as a senior frontend engineer and UI/UX designer.



Now work \*\*only on the catalog search design and interaction\*\*.



Do not refactor unrelated catalog logic in this task.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current catalog search trigger/input/overlay implementation.

5\. Inspect the current catalog toolbar/header row where search opens.

6\. Inspect current animations/transitions used in the project.

7\. Follow existing localization, `Text`, `Button`, icon, and global design token rules.

8\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Task



Fix only the \*\*design and animation of the active search state\*\*.



Current issues:



1\. The active search expands too aggressively.

2\. It stretches almost across the whole block.

3\. The whole parent block shrinks or changes when search opens.

4\. The search should move to the center more elegantly.

5\. The search is too close to the upper edge.

6\. The opening behavior does not feel polished.



\---



\# Required behavior



\## 1. Search size



When search becomes active:



1\. It must \*\*not stretch across the full width\*\* of the block.

2\. It should occupy approximately \*\*up to 70% of the toolbar/block width\*\* on desktop.

3\. This is \*\*not a hardcoded rule for every screen\*\*, but a design guideline.

4\. On smaller widths, it should adapt responsively.

5\. It must still feel prominent and easy to use.



In other words:



\* make it visually dominant,

\* but not full-bleed,

\* and not edge-to-edge.



\---



\## 2. Parent block must not change



When search opens:



1\. The parent toolbar/block must \*\*not shrink\*\*.

2\. Other layout elements must \*\*not be pushed around\*\*.

3\. The surrounding block must keep its dimensions.

4\. Search should behave like an overlay/positioned expanding element \*\*inside the same area\*\*.

5\. The rest of the toolbar can be visually covered if needed, but the parent layout itself must stay stable.



Important:



\* do not resize the whole toolbar,

\* do not change the height of the parent block unexpectedly,

\* do not cause layout jump.



\---



\## 3. Centered positioning



When active, search should:



1\. Move smoothly toward the center of the toolbar area.

2\. Stay aligned harmoniously within that block.

3\. Look visually balanced relative to the left and right edges.

4\. Not jump to another unrelated area of the page.



Use a polished centered overlay behavior.



\---



\## 4. Vertical placement



The active search should not stick too close to the top border.



Required:



1\. Keep it at the same general vertical zone where it belongs.

2\. Add a comfortable visual offset from the top edge.

3\. It should feel harmoniously positioned inside the block.

4\. It must not visually “touch” the upper border.



In short:



\* same row area,

\* but with proper breathing room from the top.



\---



\## 5. Animation quality



Add a beautiful smooth animation.



Requirements:



1\. Smooth open transition.

2\. Smooth close transition.

3\. Smooth width/position transition.

4\. No jerky jumps.

5\. No sudden resize of surrounding layout.

6\. No flicker.

7\. The animation should feel premium and clean.



You may animate:



\* width

\* transform

\* opacity

\* slight scale

\* shadow/background emphasis if appropriate



But keep it elegant and restrained.



Recommended feel:



\* soft expansion

\* gentle move to center

\* subtle fade/appearance of expanded content

\* polished premium interaction



Do not overdo it.



\---



\## 6. Search dropdown/content area



If there is an expanded search panel/dropdown under the input:



1\. It should remain visually connected to the active search block.

2\. It should inherit the same centered alignment.

3\. It should not force the toolbar block to collapse or resize strangely.

4\. Its appearance should also animate smoothly.

5\. It should stay within the same design language.



\---



\## 7. Visual design rules



The active search must match the store design:



1\. Rounded corners.

2\. Light clean background.

3\. Subtle border.

4\. Premium minimal style.

5\. Good spacing inside.

6\. Search icon aligned cleanly.

7\. Button aligned cleanly.

8\. Placeholder and helper text readable.

9\. No cramped content.



If needed, refine:



\* padding

\* radius

\* shadow

\* internal spacing

\* spacing between first line and second helper line



But do not redesign unrelated components.



\---



\## 8. Responsiveness



Desktop:



\* around \~70% width feel

\* centered

\* elegant animation

\* parent block unchanged



Tablet:



\* still centered and prominent

\* can use a bit more width if needed

\* no overflow



Mobile:



\* adapt sensibly

\* still smooth

\* no broken layout

\* no overflow

\* no overlapping impossible-to-use controls



Do not break current mobile behavior if it is already handled differently, but improve the animation and expanded state there too if relevant.



\---



\# Implementation guidance



Use the cleanest frontend approach.



Preferred approach:



1\. Keep the toolbar container stable.

2\. Position the active search inside it with absolute/relative overlay logic if needed.

3\. Animate width + translate/centering rather than resizing the whole layout.

4\. Use `transform`/`opacity` transitions for smoothness.

5\. Avoid fragile magic positioning that breaks on different widths.



Do not solve this by:



\* setting full width blindly,

\* shrinking the toolbar container,

\* adding hacky negative margins,

\* moving the search outside its intended block.



\---



\# Verification checklist



Before finishing, verify:



\* inactive search looks normal

\* active search opens with a smooth animation

\* active search does not occupy the full toolbar width

\* active search is roughly within the intended \~70% visual width on desktop

\* parent toolbar/block does not shrink

\* surrounding layout does not jump

\* active search is centered

\* active search has comfortable distance from the top edge

\* close animation is smooth

\* search dropdown/panel stays visually connected

\* no horizontal overflow

\* no broken mobile/tablet behavior

\* no unrelated catalog regressions



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` if search overlay structure/positioning changed.



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Active catalog search should behave as a centered overlay inside the toolbar area.

\* Search expansion must not resize or collapse the parent toolbar block.

\* Search open/close transitions should be smooth and premium, using stable overlay positioning rather than layout jumps.

\* Active search should remain visually dominant but not stretch edge-to-edge across the entire block.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Search design:

\- \[size/position/spacing changes]



Animation:

\- \[open/close/transition improvements]



Layout stability:

\- \[how parent block shrinking/jumping was prevented]



Responsive:

\- \[desktop/tablet/mobile behavior]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



