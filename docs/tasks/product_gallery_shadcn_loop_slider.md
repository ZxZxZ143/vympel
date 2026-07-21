You are working as a senior frontend engineer and UI/UX designer.



Fix only the product page gallery/slider implementation.



The current gallery is close, but it still needs to be implemented as a proper shadcn-based product gallery with loop behavior, better thumbnails, project-style active state, and arrows rendered only when needed.



Do not change unrelated product page sections.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current product gallery component.

5\. Inspect current shadcn components available in the project.

6\. Inspect whether shadcn Carousel is already installed/configured.

7\. Inspect product image DTO/order/main-photo logic.

8\. Inspect existing lightbox implementation if present.

9\. Follow existing localization, design tokens, image helpers, and project UI rules.



\---



\# Main Goal



Rebuild/refine the product gallery using shadcn carousel/slider patterns.



Gallery must be:



\* fully functional

\* looped/cyclic

\* synchronized between main image and thumbnails

\* visually consistent with VYMPEL design

\* stable on desktop and mobile

\* not rendering unnecessary arrows

\* not showing a vertical stack of large images



\---



\# Required behavior



\## 1. Main product image slider



The main product image area must work as a real carousel/slider.



Requirements:



1\. Use shadcn Carousel or existing shadcn-based carousel pattern.

2\. Show only one main image at a time.

3\. Enable loop/cyclic behavior.

4\. User can switch images forward/backward.

5\. Slider must not create layout jumps.

6\. Slider must not distort images.

7\. Slider must respect product image order.

8\. Main photo must appear first.

9\. If there is no explicit main photo, use the first ordered image.

10\. If there are no images, show the existing styled no-photo state.



Important:



Do not render all product images as large vertical blocks.



Correct:



```text

\[thumbnail rail] \[one large active image]

```



Incorrect:



```text

\[large image]

\[large image]

\[large image]

```



\---



\# 2. Thumbnail rail on desktop



Desktop layout must use a vertical thumbnail rail.



Requirements:



1\. Thumbnails are displayed vertically beside the main image.

2\. Thumbnail blocks must be slightly larger than they are now.

3\. Current thumbnails are too small; increase them moderately.

4\. Keep the size balanced so they do not dominate the main image.

5\. Thumbnail images must be centered and not distorted.

6\. Active thumbnail must be highlighted.

7\. Active highlight must not be red.

8\. Use a project-style color for active state:



&#x20;  \* preferably black / dark neutral

&#x20;  \* or existing dark project token

9\. Active state should look premium and clean.

10\. Use subtle border/background/ring from project tokens.

11\. No bright foreign colors.



Suggested visual direction:



```text

inactive thumbnail:

\- light border

\- white/light background

\- soft radius



active thumbnail:

\- dark border/ring

\- clean premium emphasis

\- no red outline

```



\---



\# 3. Thumbnail scrolling / arrows



Arrows for thumbnails must be rendered only when needed.



Requirements:



1\. If all thumbnails fit inside the visible thumbnail rail, do not render up/down arrows.

2\. If thumbnails overflow the visible rail, render up/down controls.

3\. Up/down controls must be minimal and in project style.

4\. Controls must be disabled or hidden when scrolling in that direction is not possible.

5\. Thumbnail rail must stay constrained to the main image height.

6\. Thumbnails must not go below the main image.

7\. The thumbnail visible window should move when active image changes.

8\. When approaching the edge of visible thumbnails, shift/scroll the thumbnail window by 2 items where appropriate.



Important:



Do not render decorative arrows just because the component supports them.



Arrows are functional controls only.



\---



\# 4. Sync between carousel and thumbnails



Main slider and thumbnails must be synchronized.



Required:



1\. Clicking a thumbnail changes the main slide.

2\. Changing main slide updates active thumbnail.

3\. Next/previous main slider controls update thumbnail highlight.

4\. Looping from last image to first updates thumbnail highlight.

5\. Looping from first image to last updates thumbnail highlight.

6\. Thumbnail rail scrolls to keep active thumbnail visible.

7\. No desync between active index and visible image.



\---



\# 5. Main image navigation controls



Main image slider can have previous/next controls, but they must be rendered only when useful.



Requirements:



1\. If there is only one image, do not show prev/next controls.

2\. If there are multiple images, show controls only if they look appropriate.

3\. Controls must not overlap important product image content badly.

4\. Controls must be subtle and project-styled.

5\. On mobile, swipe should be supported if shadcn carousel/Embla supports it.



\---



\# 6. Lightbox compatibility



If lightbox/enlarged photo viewer exists, keep it working.



Required:



1\. Clicking main image opens lightbox.

2\. Lightbox starts from currently active image.

3\. Lightbox supports next/previous.

4\. Lightbox respects image order.

5\. Lightbox loops if the main carousel loops, or at least handles boundaries cleanly.

6\. Closing lightbox returns to same active image.

7\. No-photo state must not open lightbox.



If lightbox does not exist yet and it is safe to add, add it using existing Dialog/Modal/shadcn patterns. Do not overbuild.



\---



\# 7. Mobile behavior



Mobile gallery must have its own clean layout.



Requirements:



1\. Show one large main image.

2\. Use shadcn carousel/slider behavior.

3\. Enable swipe if supported.

4\. Thumbnails should become horizontal below the main image.

5\. Horizontal thumbnails should scroll if there are many images.

6\. Active thumbnail must use the same dark project-style highlight.

7\. Do not force desktop vertical thumbnail rail on mobile.

8\. Do not render huge vertical image stack.

9\. Do not create horizontal body overflow.

10\. Controls must be touch-friendly.



Recommended mobile layout:



```text

\[large main image carousel]



\[horizontal scroll thumbnails]

```



\---



\# 8. Image sizing



Fix the sizing carefully.



Desktop:



1\. Main image should remain visually dominant.

2\. Thumbnails should be slightly larger than current implementation.

3\. Thumbnail rail must not exceed main image height.

4\. Main image and product info block should remain balanced.



Mobile:



1\. Main image should take full available width.

2\. Height should be stable and proportional.

3\. Thumbnails should be large enough to tap.



Do not use random huge fixed heights that break the layout.



Use responsive tokens/classes where possible.



\---



\# 9. No-photo fallback



Preserve no-photo fallback.



Requirements:



1\. If product has no images, show styled no-photo block.

2\. Do not show fake placeholder image.

3\. Do not initialize carousel with empty invalid slides.

4\. Product page must not crash.

5\. Product cards must still use main photo or no-photo state.



\---



\# 10. Technical implementation guidance



Preferred structure:



```text

ProductGallery

&#x20; ProductGalleryMainCarousel

&#x20; ProductGalleryThumbnailRail

&#x20; ProductImageLightbox

```



State:



```text

activeIndex

thumbnailWindowStart / visible thumbnail window

lightboxOpen

```



Use shadcn Carousel API properly.



Check Embla carousel API if shadcn Carousel uses it:



\* selected scroll snap

\* scrollTo(index)

\* scrollNext()

\* scrollPrev()

\* loop option

\* on select event



Do not implement a fragile custom slider if shadcn Carousel already provides this.



\---



\# 11. Styling rules



Use project design tokens.



Do not use arbitrary raw colors if a token exists.



Active thumbnail must use project-style dark accent.



Avoid:



```text

red border

bright red ring

default ugly carousel arrows

random browser controls

```



Use:



```text

dark neutral active border/ring

subtle inactive border

soft radius

clean spacing

premium minimal controls

```



\---



\# 12. Restrictions



Do not change:



\* product info block

\* price/add-to-cart/favorite logic

\* product tabs

\* reviews

\* CMS logic

\* backend

\* CRM

\* product upload/order/main-photo logic unless needed only for DTO compatibility



This task is only product gallery UI/slider.



\---



\# Verification checklist



Before finishing, verify:



\## Desktop



\* gallery uses shadcn carousel/slider

\* only one main image is visible

\* main image switches correctly

\* loop works

\* thumbnails are slightly larger

\* active thumbnail is dark/project-style, not red

\* thumbnails stay inside rail

\* arrows show only when thumbnails overflow

\* arrows are not rendered when unnecessary

\* thumbnail click changes main image

\* main slider change updates active thumbnail

\* no vertical stack of huge images



\## Mobile



\* one main image visible

\* swipe/slider works

\* horizontal thumbnails work

\* active thumbnail style matches desktop

\* no horizontal body overflow

\* no huge vertical image stack



\## Lightbox



\* opens from active image

\* next/previous works

\* image order is correct

\* close works



\## Data



\* main photo appears first

\* saved image order is respected

\* no-photo fallback works



\## Technical



\* no unrelated changes

\* no hardcoded UI strings

\* no long-running dev/start/watch checks

\* docs updated only if component structure changed



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` if gallery structure/components changed.



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Product gallery must use the shadcn-based carousel/slider pattern.

\* Product gallery must show one main image at a time.

\* Gallery must be looped when there are multiple images.

\* Thumbnail rail arrows must render only when thumbnails overflow.

\* Active thumbnail state must use project-style dark accent, not red.

\* Mobile gallery must use a clean main carousel with horizontal thumbnails.

\* Product gallery must never render all full-size images in a vertical stack.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Gallery:

\- \[shadcn carousel implementation]

\- \[loop behavior]

\- \[thumbnail sync]



Thumbnails:

\- \[size changes]

\- \[active state color/style]

\- \[arrow visibility rules]



Mobile:

\- \[mobile gallery behavior]



Lightbox:

\- \[compatibility / implementation]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



