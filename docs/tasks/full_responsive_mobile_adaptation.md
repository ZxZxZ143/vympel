You are working as a senior frontend engineer and senior product designer on this project.



Your task is to create a full responsive adaptation of the entire public website for tablets and mobile phones.



This is not a quick “make it fit screen” task. The mobile version must feel like a polished premium e-commerce product, with intuitive navigation, correct proportions, accessible controls, smooth layouts, and no broken screens even on very small devices.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect all public pages and routes.

5\. Inspect current layout/container system.

6\. Inspect current header/navigation/search implementation.

7\. Inspect catalog page, filters, sorting, category selector, product cards, product detail page, cart, favorites, brand pages, about page, info pages, footer, banners, sliders, and CRM only if shared components are affected.

8\. Inspect existing global typography, spacing, breakpoints, and `globals.css`.

9\. Inspect existing `Text`, `Heading`, `Button`, form components, product cards, image components, sliders, toasts, and shadcn components.

10\. Make a short responsive implementation plan before coding.



Follow project rules:



\* all user-facing text must be localized

\* use existing `Text`, `Heading`, `Button`, product cards, form components, and design tokens

\* use global tokens/classes instead of arbitrary Tailwind values

\* do not hardcode raw UI strings in JSX/TSX

\* do not break existing desktop design

\* preserve the premium VYMPEL visual identity

\* update `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md` after finishing



\---



\# Main Goal



Create complete responsive design for:



1\. Large tablets

2\. Small tablets

3\. Mobile phones

4\. Very small mobile screens



The site must work correctly at least for these viewport widths:



```text

1440px desktop

1200px small desktop

1024px tablet landscape

768px tablet portrait

640px large mobile

480px mobile

390px common iPhone width

360px small Android

320px very small devices

```



Do not only test one mobile width.



The result must be:



\* accessible

\* intuitive

\* visually balanced

\* touch-friendly

\* readable

\* fast

\* not cramped

\* not oversized

\* consistent with the desktop design



\---



\# Responsive Design Principles



Apply senior-level responsive design principles:



1\. Use fluid layouts where possible.

2\. Avoid fixed desktop widths on mobile.

3\. Use responsive grids.

4\. Use sensible breakpoints.

5\. Keep touch targets large enough.

6\. Avoid horizontal scrolling.

7\. Avoid text overflow.

8\. Avoid layout shifts.

9\. Preserve visual hierarchy.

10\. Keep important actions easy to reach.

11\. Keep product cards readable.

12\. Keep filters usable on small screens.

13\. Keep banners visually impressive.

14\. Keep typography proportional, not too tiny and not too huge.

15\. Respect `prefers-reduced-motion`.

16\. Keep performance in mind.



Recommended touch target:



```text

minimum interactive target: around 44px × 44px

```



\---



\# Breakpoint Strategy



Create or reuse a clear breakpoint system.



If the project already has breakpoints, follow them.



If not, define consistent responsive behavior around:



```text

mobile: 0–639px

large mobile: 640–767px

tablet: 768–1023px

small desktop: 1024–1279px

desktop: 1280px+

```



Do not scatter random breakpoints everywhere.



Document the final breakpoint logic in `PROJECT\_SKILLS.md`.



\---



\# Typography Responsiveness



Text must scale properly across devices.



Important:



\* text must not become too small on mobile

\* headings must not be too huge on mobile

\* line-height must remain readable

\* paragraph width must remain comfortable

\* product card text must not overflow

\* buttons must remain readable



Use fluid typography or responsive tokens where appropriate.



Examples of expected behavior:



```text

Large desktop hero title: large/premium

Tablet hero title: slightly reduced

Mobile hero title: readable and balanced

Mobile body text: not below comfortable size

```



Avoid:



\* 64px headings staying huge on 320px screens

\* 12px body text that becomes unreadable

\* text overflowing outside cards

\* long product names breaking layout



\---



\# Spacing Responsiveness



Desktop spacing is currently often around `120px`.



On mobile/tablet, spacing must adapt.



Recommended behavior:



```text

Desktop block spacing: 120px

Tablet block spacing: 80px–96px

Mobile block spacing: 56px–72px

Small mobile block spacing: 48px–56px

```



Use the project’s existing spacing token style.



Do not keep huge desktop spacing on tiny screens if it creates empty awkward layouts.



Do not make mobile spacing too cramped.



\---



\# Large Banner Behavior



Large banners must remain visually important on mobile and tablet.



Important user requirement:



Large banners should still feel like large banners. When scrolling, as they enter the active viewing zone, they should occupy a large part of the screen and not collapse into tiny strips.



Because final images may be changed later, estimate reasonable responsive sizes now.



Requirements:



1\. Banners must stretch to available width.

2\. Height should adapt based on width and aspect ratio.

3\. Banners should not become too short on mobile.

4\. Banners should not be cropped badly.

5\. If image contains text, keep it readable where possible.

6\. Use `object-fit` carefully:



&#x20;  \* `contain` if text must remain fully visible

&#x20;  \* `cover` if visual composition is more important

&#x20;  \* choose per banner type



For major hero/about/brand/cooperation banners:



```text

Desktop: preserve full large visual banner feel

Tablet: banner should occupy a strong visual area

Mobile: banner should still take a large portion of viewport when active

```



Possible guidance:



```text

Mobile hero/banner min-height: around 55vh–75vh if image composition allows

Tablet hero/banner min-height: around 50vh–65vh

```



But choose actual values based on current image ratio and design.



Do not blindly set all banners to the same height if it distorts them.



\---



\# Header / Mobile Navigation



Create a proper mobile header.



Required:



1\. Header must not overflow on mobile.

2\. Logo remains visible and centered or placed according to mobile pattern.

3\. Icons must remain accessible.

4\. Search must be usable.

5\. Navigation links should not remain as cramped desktop links on mobile.

6\. Use a burger menu / drawer / bottom sheet / mobile menu if appropriate.

7\. Category navigation must be accessible on mobile.

8\. Brand navigation must be accessible on mobile.

9\. Cart and favorites icons must remain visible or easy to access.

10\. Language selector must not break layout.



Recommended mobile patterns:



\* compact top bar with logo and key icons

\* burger menu for navigation

\* full-screen or side drawer menu

\* search expands into full-width overlay

\* sticky search/category controls on catalog if useful



Use common large e-commerce mobile patterns, but style them in VYMPEL design.



\---



\# Search Responsiveness



Smart search must work on all screens.



Requirements:



1\. On mobile, search should become full-width or near full-width.

2\. Search overlay must not overflow.

3\. Product quick results must be readable.

4\. Search input must not push important header elements awkwardly.

5\. Search from product page/catalog/home must behave consistently.

6\. Search dropdown should become a mobile-friendly panel if needed.

7\. Touch interaction must be comfortable.

8\. Escape/outside close behavior should still work where applicable.

9\. Full search submit still redirects to catalog.



\---



\# Catalog Mobile Design



The catalog is one of the most important pages.



Implement a mobile catalog experience similar to major e-commerce apps, adapted to VYMPEL style.



Required:



1\. Product grid adapts:



&#x20;  \* desktop: existing grid

&#x20;  \* tablet: fewer columns

&#x20;  \* mobile: 2 columns if readable, or 1 column for very small screens if needed



2\. Product cards must remain readable:



&#x20;  \* image large enough

&#x20;  \* name visible

&#x20;  \* price visible

&#x20;  \* favorite/cart actions accessible

&#x20;  \* no text overflow

&#x20;  \* unavailable state clear



3\. Filters must be mobile-friendly:



&#x20;  \* do not show huge desktop dropdown if it breaks mobile

&#x20;  \* use drawer/bottom sheet/full-screen panel if appropriate

&#x20;  \* filter categories and options must be easy to tap

&#x20;  \* apply/reset buttons should be accessible

&#x20;  \* selected filters should be visible or easy to review



4\. Sorting must be mobile-friendly.



5\. Category selector must be mobile-friendly.



6\. Search must fit catalog layout.



7\. Pagination/load more must be usable.



Recommended mobile pattern:



```text

Catalog toolbar:

\[Categories] \[Filters] \[Sort]



Filters open as bottom sheet/full-screen drawer on mobile.

Categories open as drawer/menu with parent/child navigation.

Sort opens as small bottom sheet/list.

```



Choose the best implementation based on current code.



\---



\# Product Detail Mobile Design



Product detail page must be fully responsive.



Required:



1\. Product image/gallery should be prominent.

2\. Thumbnail gallery must adapt:



&#x20;  \* desktop side thumbnails may become horizontal slider on mobile

&#x20;  \* images must not overflow

3\. Product title, price, availability, actions must be readable.

4\. Add-to-cart / WhatsApp / favorite actions should be easy to tap.

5\. Product details/tabs/characteristics must adapt:



&#x20;  \* tabs may become horizontal scroll or accordion

&#x20;  \* content must remain readable

6\. Marketplace links/buttons must fit mobile.

7\. Similar products must be responsive.

8\. No desktop-only layout should remain broken.



Mobile product page should feel like a premium product page, not compressed desktop.



\---



\# Product Cards



All product cards must adapt across:



\* catalog

\* home page sections

\* brand pages

\* favorites

\* cart recommendations

\* similar products

\* new products



Requirements:



1\. Maintain consistent card proportions.

2\. Image area should stay visually strong.

3\. Text should not overflow.

4\. Price should remain readable.

5\. Favorite/cart buttons must remain tappable.

6\. Product card grid must start from the left/start where required.

7\. Cards must not look overly tiny on mobile.

8\. Cards must not create horizontal scroll.



\---



\# Cart Mobile Design



Cart page must work well on mobile.



Required:



1\. Cart items stack cleanly.

2\. Product image, name, price, quantity, total must be readable.

3\. Quantity controls must be touch-friendly.

4\. Stock limit tooltip/inline warning must work.

5\. Checkout/WhatsApp button must be prominent.

6\. Order total should be clear.

7\. Cart should not overflow horizontally.



Recommended:



\* sticky checkout summary at bottom if it fits project style

\* or clear summary block after items



\---



\# Favorites Mobile Design



Favorites page must be responsive.



Required:



1\. Favorite products grid starts from the left/start.

2\. On mobile, use 2-column or 1-column layout depending on card readability.

3\. Similar products section must adapt.

4\. Empty state must look good.

5\. Active favorite state must remain visible.



\---



\# Brand Pages Mobile Design



Brand pages must adapt.



Required:



1\. Brand hero title scales down correctly.

2\. Description remains readable.

3\. Brand banner remains visually strong.

4\. History text width adapts.

5\. New products grid adapts.

6\. Brand catalog banner remains responsive.

7\. No horizontal overflow.



\---



\# About / Informational Pages Mobile Design



Pages like:



\* About us

\* Warranty

\* Delivery

\* Payment

\* 404

\* Empty/error pages



must be responsive.



Requirements:



1\. Two-column text blocks stack on mobile.

2\. Company cards become one column or suitable grid.

3\. Instagram slider remains usable.

4\. Store image/contact block stacks cleanly.

5\. Footer links do not overflow.

6\. Text remains readable.

7\. Large images remain responsive.



\---



\# Footer Mobile Design



Footer must adapt.



Required:



1\. Footer columns stack or become accordions if needed.

2\. Links remain tappable.

3\. Logo/social/contact area remains readable.

4\. No horizontal overflow.

5\. Spacing remains elegant.



\---



\# Forms Mobile Design



All forms must be usable on mobile:



\* search

\* filters

\* cart forms

\* CRM only if shared components affected

\* contact/application forms if available

\* product forms if public-facing



Requirements:



1\. Inputs must be full-width or comfortably sized.

2\. Labels and errors must be readable.

3\. Validation messages must not break layout.

4\. Buttons must be large enough.

5\. Keyboard behavior must not hide important controls where possible.



\---



\# Accessibility Requirements



Improve mobile accessibility:



1\. All buttons and links must have accessible labels.

2\. Interactive icons must be tappable.

3\. Focus states must be visible.

4\. Dropdowns/drawers must close predictably.

5\. Body scroll should be locked when mobile drawer/modal is open if needed.

6\. Keyboard navigation should not be broken.

7\. Color contrast must remain acceptable.

8\. `prefers-reduced-motion` should reduce or disable non-essential animations.



\---



\# Animation Requirements



Mobile animations must be smooth and subtle.



Use transitions for:



\* mobile menu open/close

\* filter drawer open/close

\* category submenu

\* search overlay

\* product card hover/tap feedback

\* tabs/accordions



Do not over-animate.



Avoid:



\* layout jumps

\* flicker

\* slow heavy animations

\* horizontal shifts that feel broken

\* animations that make mobile feel laggy



\---



\# Performance Requirements



Responsive implementation must not make the site heavy.



Requirements:



1\. Use responsive images/sizes where possible.

2\. Avoid loading huge desktop images unnecessarily if image system supports optimization.

3\. Avoid unnecessary re-renders.

4\. Avoid expensive layout calculations.

5\. Keep sliders efficient.

6\. Do not add heavy dependencies without reason.



\---



\# Technical Approach



Recommended approach:



1\. Audit pages and components.

2\. Create/update global responsive tokens.

3\. Fix layout containers.

4\. Fix header/mobile navigation.

5\. Fix catalog/product pages.

6\. Fix product cards.

7\. Fix cart/favorites.

8\. Fix brand/about/info pages.

9\. Fix footer.

10\. Verify all breakpoints.



Avoid patching every component with random one-off classes.



Prefer reusable responsive patterns:



```text

Container

ResponsiveGrid

MobileDrawer

ResponsiveProductGrid

ResponsiveSection

ResponsiveImageBanner

```



or follow current architecture.



\---



\# Testing / Verification Checklist



Before finishing, manually verify at:



```text

1440px

1024px

768px

480px

390px

360px

320px

```



Check:



\## Global



\* no horizontal scroll

\* header does not break

\* footer does not break

\* text readable

\* buttons tappable

\* images not distorted

\* no layout overlap

\* no huge empty gaps

\* no elements cut off



\## Home



\* hero/banner remains large and premium

\* product sections adapt

\* sliders work

\* search works



\## Catalog



\* category selector works

\* filters work

\* sort works

\* product grid adapts

\* product cards readable

\* search works

\* pagination/load more works

\* no overflow



\## Product page



\* gallery adapts

\* actions tappable

\* price/title readable

\* characteristics/tabs adapt

\* add to cart works

\* favorite works

\* similar products adapt



\## Cart



\* items readable

\* quantity controls work

\* stock limits work

\* checkout button works

\* total readable



\## Favorites



\* grid aligns from start

\* empty state works

\* similar products adapt



\## Brand pages



\* banner responsive

\* title/description readable

\* products adapt



\## About / Info pages



\* banner responsive

\* two-column sections stack

\* cards stack

\* image/contact blocks adapt



\## UX



\* mobile menu works

\* drawers close correctly

\* body scroll does not break

\* animations smooth

\* reduced motion respected



\---



\# Documentation Updates



Update `docs/PROJECT\_MAP.md` with:



\* responsive architecture

\* breakpoints used

\* mobile header/navigation structure

\* mobile catalog/filter behavior

\* responsive product card/grid behavior

\* responsive banner behavior

\* responsive footer behavior

\* key components added/changed



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* All public pages must support tablet and mobile breakpoints.

\* No component may rely only on desktop fixed widths.

\* Large banners must remain visually large on mobile and tablet.

\* Mobile catalog filters should use drawer/bottom-sheet style when desktop dropdown is not suitable.

\* Product cards must remain readable and tappable on small screens.

\* Text must scale proportionally and remain readable.

\* Touch targets should be at least around 44px.

\* Mobile layouts must avoid horizontal scroll.

\* Responsive images must not be distorted.

\* Animations must be subtle and respect `prefers-reduced-motion`.

\* Footer/header/navigation must never contain desktop-only broken layouts on mobile.



\---



\# Final Response Required



```markdown

Summary:

\- \[what changed]



Responsive system:

\- \[breakpoints/tokens/layout changes]



Mobile navigation:

\- \[header/menu/search/category behavior]



Catalog:

\- \[mobile filters/sort/category/product grid]



Product page:

\- \[gallery/details/actions adaptation]



Banners:

\- \[how large banners remain visually strong]



Cart/Favorites:

\- \[mobile behavior]



Other pages:

\- \[about/brand/info/footer responsive changes]



Accessibility:

\- \[touch/focus/reduced-motion improvements]



Tests:

\- \[viewports checked]

\- \[commands run]



Notes:

\- \[assumptions, remaining improvements, image replacements later]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



Do not finish until the site works without layout breaking at 320px width.



