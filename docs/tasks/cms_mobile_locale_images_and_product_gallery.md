You are working as a senior fullstack engineer and senior frontend UI/UX designer.



Implement two focused improvements:



1\. CMS must support mobile image variants for all 3 languages.

2\. Product page image gallery must be redesigned like the attached reference: smaller vertical thumbnails, scroll/up-down navigation, main image slider, and lightbox slider.



Do not rewrite unrelated product/CMS logic.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the attached reference image carefully.

5\. Inspect current CMS image variant model, DTOs, CRM CMS editor, backend save/update logic, public CMS endpoint, and public CMS image selection.

6\. Inspect current product page gallery/photo component.

7\. Inspect product image DTOs, main image/order logic, and image upload flow.

8\. Follow existing localization, `Text`, `Heading`, `Button`, image helpers, and global design token rules.

9\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Part 1 — CMS mobile image variants for 3 languages



Current CMS requirement:



For image blocks/banners/sliders, desktop language variants are not enough. Mobile versions must also support all 3 languages.



Required image variants:



```text

desktopRu / default desktop image

desktopKz

desktopEn



mobileRu / default mobile image

mobileKz

mobileEn

```



Use the project’s actual locale codes.



If current locale codes are:



```text

ru

kz

en

```



use those exactly.



Required behavior:



1\. Admin can upload desktop image for each language.

2\. Admin can upload mobile image for each language.

3\. All language/mobile variants are optional except the main/default image if block type requires an image.

4\. Optional image fields should be hidden under a collapsed section or shown after clicking a button like:



&#x20;  \* `Добавить изображения для других языков`

&#x20;  \* `Добавить мобильные версии`

5\. Each uploaded image variant must show preview.

6\. Saving a CMS block with variants must update existing records, not create duplicate translations.

7\. Re-saving the same CMS block must be idempotent.

8\. Public frontend must choose the correct image based on locale and device.



Image fallback order:



```text

1\. mobile image for current locale

2\. desktop image for current locale

3\. mobile image for default locale

4\. desktop image for default locale

5\. static fallback only if CMS image is missing

```



Important:



\* Use existing MinIO/storage logic.

\* Do not create a second storage system.

\* Do not create duplicate `cms\_block\_translation` rows for the same `(blockId, lang)`.

\* Optional mobile/language variants must not break saving.



\---



\# Part 2 — Product page gallery redesign



Use the attached reference as visual direction.



Current gallery must be improved.



Required desktop layout:



1\. Main product image stays large in the center/right area.

2\. Thumbnails are vertical on the side.

3\. Inactive side thumbnails must be smaller than they are now.

4\. Active thumbnail must be visually highlighted with a clean border.

5\. If there are many thumbnails, they must not extend below the main image.

6\. Thumbnails must either:



&#x20;  \* scroll inside their own vertical container, or

&#x20;  \* switch using up/down arrow buttons.



Preferred behavior:



\* Use up/down buttons like the reference.

\* Thumbnail list has fixed visible area.

\* When active image approaches the last visible thumbnail, thumbnail list scrolls down by 2 items.

\* Same behavior upward when moving toward the top.



Expected UX:



```text

\[up button]

\[thumb 1 active]

\[thumb 2]

\[thumb 3]

\[thumb 4]

\[thumb 5]

\[down button]



\[large main image]

```



Requirements:



1\. Thumbnail container height must be tied to the main image height.

2\. Thumbnail list must not overflow below the main image.

3\. Up/down buttons should be disabled or visually inactive at edges.

4\. Thumbnail click changes main image.

5\. Keyboard accessibility is preferred where reasonable.

6\. Product without images still shows the existing styled “Фотографии нет” state.



\---



\# Part 3 — Main image as slider



The main product photo area must behave like a slider.



Required:



1\. Main image can be switched with next/previous controls.

2\. Clicking side thumbnails changes main image.

3\. Swiping on mobile should switch images if current project supports touch/swipe.

4\. Main image slider and thumbnails must stay synchronized.

5\. If user changes image from main slider, active thumbnail updates.

6\. If there are many thumbnails, thumbnail list scrolls to keep active thumbnail visible.

7\. If needed for visual balance, increase the main image size slightly.

8\. Main image must remain proportional and not distort.

9\. No layout jump when images change.



\---



\# Part 4 — Image lightbox / enlarged photo viewer



When user clicks the main product photo:



1\. Open enlarged image viewer / lightbox.

2\. Lightbox must allow browsing all product photos.

3\. User must be able to go next/previous inside enlarged view.

4\. Active image in lightbox must start from the image clicked on product page.

5\. Close by:



&#x20;  \* close button

&#x20;  \* Escape

&#x20;  \* backdrop click if project pattern allows it

6\. Lightbox must be responsive.

7\. Mobile lightbox must support swipe if feasible.

8\. Use existing modal/dialog component if available.

9\. Do not show fake placeholder images in lightbox.

10\. If no photos exist, clicking no-photo state should not open lightbox.



\---



\# Part 5 — Mobile gallery behavior



Mobile product image gallery must also be improved.



Required:



1\. Main image appears first and stays large enough.

2\. Thumbnails can become horizontal below the main image.

3\. Horizontal thumbnail list must scroll if many images.

4\. Main image still acts as a slider.

5\. Lightbox still works.

6\. No horizontal body overflow.

7\. Controls must be touch-friendly.



Recommended mobile structure:



```text

\[large main image slider]



\[horizontal scroll thumbnails]

```



Do not force the desktop vertical thumbnail layout onto small screens if it breaks.



\---



\# Part 6 — Product image ordering/main photo compatibility



The gallery must respect existing product photo logic:



1\. Photos are displayed in saved order.

2\. Main photo appears first.

3\. Product cards still use main photo.

4\. Product detail gallery uses ordered images.

5\. If main photo is missing, fallback to first ordered photo.

6\. If no photos, show styled no-photo state.



Do not break CRM image ordering/main photo features.



\---



\# Part 7 — Styling requirements



Gallery must match VYMPEL style:



1\. Minimal premium design.

2\. Subtle borders.

3\. Soft rounded corners.

4\. Clean active thumbnail state.

5\. Up/down buttons minimal and elegant.

6\. No heavy marketplace UI.

7\. No default ugly browser controls.

8\. Use global design tokens/classes.

9\. Do not use arbitrary raw hex/Tailwind values if reusable tokens should exist.



\---



\# Part 8 — Verification checklist



Before finishing, verify:



\## CMS image variants



\* desktop RU/default image can be uploaded

\* desktop KZ image can be uploaded

\* desktop EN image can be uploaded

\* mobile RU/default image can be uploaded

\* mobile KZ image can be uploaded

\* mobile EN image can be uploaded

\* optional variants are optional

\* variant previews work

\* saving same block twice does not create duplicate translations

\* public page chooses correct locale/mobile image

\* fallback order works

\* CMS changes appear publicly with current cache/revalidation logic



\## Product gallery desktop



\* side thumbnails are smaller than before

\* active thumbnail is highlighted

\* many thumbnails do not overflow below main image

\* up/down buttons work

\* thumbnail list scrolls by 2 when approaching edge

\* clicking thumbnail changes main image

\* main image next/previous works

\* main image and thumbnails stay synchronized

\* main image size is visually balanced



\## Product gallery mobile



\* main image is large and responsive

\* thumbnails become horizontal or otherwise mobile-friendly

\* no horizontal body overflow

\* touch controls are usable



\## Lightbox



\* clicking main image opens enlarged view

\* next/previous works in lightbox

\* starts from clicked image

\* close works

\* mobile lightbox works

\* no-photo state does not open lightbox



\## Existing behavior



\* product cards still use main image

\* no-photo fallback still works

\* CRM photo order/main photo logic still works

\* no fake placeholder images return

\* all user-facing text localized

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* CMS desktop/mobile image variant structure

\* CMS image fallback order

\* product gallery component structure

\* thumbnail scrolling/up-down behavior

\* main image slider behavior

\* lightbox behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* CMS image blocks must support optional desktop/mobile image variants for each project locale.

\* CMS image variants must use existing storage and fallback safely by locale/device.

\* CMS update must be idempotent and must not create duplicate translations.

\* Product gallery must respect saved image order and main photo.

\* Product detail thumbnails must not overflow beyond main image area.

\* Product main image must support slider behavior.

\* Enlarged product photos must be browsable in a lightbox.

\* Products without images must show the styled no-photo state, not fake placeholders.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



CMS image variants:

\- \[desktop/mobile language variants and fallback]



Product gallery:

\- \[thumbnail redesign and scrolling/up-down controls]



Main image slider:

\- \[how image switching works]



Lightbox:

\- \[enlarged image browsing behavior]



Responsive:

\- \[desktop/mobile behavior]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



