You implemented the product gallery incorrectly.



The current result does \*\*not\*\* match the requested behavior or the reference.



What is wrong now:



1\. The gallery became a huge vertical stack of large images.

2\. The layout is broken and does not resemble the reference at all.

3\. Side thumbnails are not implemented correctly.

4\. The main image is not behaving like a slider.

5\. The thumbnail list is not constrained relative to the main image.

6\. The gallery is not visually balanced.

7\. The result looks like raw full-size images rendered one under another, which is incorrect.



You must \*\*fix only the product page gallery implementation\*\* and make it match the requested behavior much more closely.



Do not redesign unrelated product page sections.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current product gallery implementation and the broken result.

5\. Re-read the original gallery requirements.

6\. Use the provided reference image as the source of truth for layout direction.

7\. Do not run long-running dev/start/watch commands.



\---



\# Main task



Re-implement the product image gallery so it works like this:



\## Desktop layout



The gallery must consist of:



\### Left column



A vertical list of \*\*small thumbnails\*\*.



\### Center/main area



One \*\*large main image\*\*.



\### Right area



Existing product information block remains as is.



The current implementation with giant stacked images is wrong and must be removed.



\---



\# Required desktop gallery behavior



\## 1. Main image



1\. Only \*\*one main image\*\* is shown at a time.

2\. The main image must be large and visually dominant.

3\. The main image area may be slightly larger than before if needed for balance.

4\. The main image must not distort.

5\. The main image must keep stable dimensions when switching images.

6\. Clicking the main image opens enlarged viewer/lightbox.



\---



\## 2. Side thumbnails



1\. Thumbnails must be shown in a \*\*vertical column\*\* beside the main image.

2\. Inactive thumbnails must be \*\*smaller than they are now\*\*.

3\. Active thumbnail must be clearly highlighted.

4\. Thumbnails must not be rendered as full-size images.

5\. Thumbnails must fit inside a constrained vertical area tied to the main image height.

6\. If there are too many thumbnails, they must \*\*not go below the main image\*\*.



This is critical.



\---



\## 3. Thumbnail overflow behavior



If there are more thumbnails than visible space:



\### Preferred behavior



Use \*\*up/down navigation buttons\*\* like in the reference.



Requirements:



1\. Up button above the thumbnail list.

2\. Down button below the thumbnail list.

3\. Thumbnail list shows only a limited number of visible thumbnails.

4\. When user navigates and reaches the edge of the visible window, the list should scroll.

5\. When approaching the last visible item, the thumbnail list should shift \*\*down by 2 items\*\*.

6\. The same logic should work upward.

7\. Up/down buttons should disable gracefully at edges.



Do \*\*not\*\* let thumbnails continue downward outside the intended area.



\---



\## 4. Main image slider behavior



The main image area must work like a slider:



1\. User can switch images using thumbnails.

2\. User can switch images with previous/next controls if implemented.

3\. Main image and thumbnails must stay synchronized.

4\. When active image changes, active thumbnail changes too.

5\. If active thumbnail is outside visible range, thumbnail window scrolls to keep it visible.

6\. This must work smoothly.



\---



\## 5. Enlarged image / lightbox



When clicking the main image:



1\. Open a lightbox / enlarged image viewer.

2\. User must be able to browse all gallery images there.

3\. Next/previous in enlarged mode must work.

4\. The lightbox must open on the currently active image.

5\. Close button / Escape / backdrop close should work if consistent with project patterns.

6\. This is not optional.



\---



\## 6. Mobile behavior



On mobile, do \*\*not\*\* use the broken desktop stacked behavior.



Required mobile approach:



1\. One main large image at the top.

2\. Main image works like a slider.

3\. Thumbnails should be horizontal under the main image, or another clean mobile pattern.

4\. Horizontal thumbnail list may scroll if many images.

5\. Clicking main image opens lightbox.

6\. Lightbox on mobile must also allow browsing images.

7\. No giant vertical stack of full-size images.



\---



\# Visual direction



Use the attached reference as layout direction.



The result should look conceptually like this:



```text id="h326fa"

\[ up arrow ]



\[thumb]

\[thumb]

\[thumb]

\[thumb]

\[thumb]



\[ down arrow ]     \[ large main image ]

```



Not like this:



```text id="vrxg71"

\[ giant image ]

\[ giant image ]

\[ giant image ]

```



\---



\# Existing product image logic must be preserved



Keep compatibility with:



1\. uploaded product images

2\. main photo logic

3\. image ordering logic

4\. no-photo fallback



Required:



\* gallery uses ordered images

\* main product photo appears first

\* product without images shows the styled “Фотографии нет” state

\* no fake placeholder image

\* product cards still use main image



\---



\# Strong restrictions



Do not:



\* render all product images at full size in the page flow

\* stack full-size images vertically

\* break product page layout

\* break mobile layout

\* rewrite unrelated product info sections

\* change CMS task in this step unless required for compilation

\* change backend unless absolutely necessary for gallery DTO compatibility



This task is about \*\*correct gallery UI behavior\*\*.



\---



\# Implementation guidance



Use a clean structure, for example:



```text id="xkp6u6"

ProductGallery

&#x20;├─ ThumbnailRail

&#x20;│   ├─ UpButton

&#x20;│   ├─ VisibleThumbnailsWindow

&#x20;│   └─ DownButton

&#x20;├─ MainImageSlider

&#x20;└─ ProductImageLightbox

```



Recommended state:



\* `activeIndex`

\* `visibleStartIndex` for thumbnail window

\* derived visible thumbnails

\* lightbox open state



Do not overcomplicate it, but implement it correctly.



\---



\# Verification checklist



Before finishing, verify:



\## Desktop



\* only one large main image is visible

\* side thumbnails are small

\* active thumbnail is highlighted

\* thumbnails do not extend below main image

\* up/down buttons work

\* thumbnail list scrolls by 2 near edges

\* main image changes on thumbnail click

\* main image slider works

\* layout resembles the reference



\## Lightbox



\* main image click opens enlarged view

\* next/previous works in lightbox

\* starts at active image

\* close works



\## Mobile



\* no stacked huge images

\* one main image at a time

\* mobile thumbnails are usable

\* lightbox works

\* no horizontal overflow



\## Existing data logic



\* ordered images are respected

\* main photo appears first

\* no-photo fallback works

\* no regressions in product page info block



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` if gallery component structure changed.



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Product gallery must show one main image at a time, not render full-size images in a vertical stack.

\* Thumbnail rail must be constrained to main image height.

\* Thumbnail overflow must be handled with scrolling or up/down navigation.

\* Product image lightbox must support browsing all images.



\---



\# Final response required



```markdown id="6ezjmg"

Summary:

\- \[what changed]



Gallery fix:

\- \[how broken stacked layout was replaced]



Desktop behavior:

\- \[thumbnail rail / main image / navigation]



Mobile behavior:

\- \[mobile gallery behavior]



Lightbox:

\- \[enlarged image browsing]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



