```text

You are working as a senior UI/UX QA engineer, responsive-design auditor, and technical specification writer.



Your task is NOT to implement fixes yet.



Your task is to:



1\. inspect the current VYMPEL public frontend;

2\. reproduce all UI/responsive/localization issues described below;

3\. collect clear screenshots of every problematic area;

4\. investigate the relevant components and likely technical causes;

5\. transform the notes into a detailed, professional implementation specification for the next Codex agent.



The next agent must be able to implement the fixes using your document and screenshots without needing to rediscover the problems.



Do not modify production UI code unless a very small temporary local change is strictly necessary to reproduce an issue. Revert any temporary diagnostic change before finishing.



\---



\# 1. Mandatory preparation



Before starting:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current git diff.

5\. Identify:

&#x20;  - the public frontend project;

&#x20;  - the CRM project if relevant;

&#x20;  - the backend project;

&#x20;  - existing responsive breakpoints;

&#x20;  - global spacing and typography tokens;

&#x20;  - shared header, footer, catalog, product card, breadcrumb, toast, icon, menu, and localization components.

6\. Inspect the current routing structure and determine the exact URLs needed for screenshots.

7\. Do not reset or discard unrelated user changes.



\---



\# 2. Important execution rules



This is an audit and documentation task.



Do not start implementing all fixes.



Do not run commands indefinitely.



If a frontend/backend server is already running, reuse it.



If starting a server is necessary for browser inspection:



1\. start only the minimum required application;

2\. give it a clear timeout;

3\. if it is not ready within approximately 90 seconds, stop it and report the problem;

4\. stop all processes after screenshot collection;

5\. do not leave orphaned Node/Java processes;

6\. do not wait indefinitely on `npm run dev`, `npm run start`, Gradle bootRun, watch mode, or browser QA scripts.



Do not treat a long-running server command as a finite verification command.



\---



\# 3. Deliverables



Create the following structure:



```text

docs/tasks/vympel\_ui\_polish\_audit/

├── UI\_POLISH\_IMPLEMENTATION\_SPEC.md

├── SCREENSHOT\_INDEX.md

└── screenshots/

&#x20;   ├── desktop/

&#x20;   ├── tablet/

&#x20;   └── mobile/

```



Use descriptive screenshot names, for example:



```text

desktop\_product\_active\_thumbnail\_border\_1440.png

desktop\_catalog\_search\_offset\_1280.png

tablet\_accessories\_toolbar\_overlap\_1000.png

mobile\_sort\_button\_label\_390.png

mobile\_brand\_menu\_alignment\_390.png

```



Do not use meaningless screenshot names such as `screenshot1.png`.



\---



\# 4. Required screenshot sizes



At minimum inspect and capture the relevant pages at:



\## Desktop



```text

1920 × 1080

1440 × 900

1280 × 800

```



\## Tablet / problematic intermediate widths



```text

1100 × 800

1024 × 768

1000 × 800

900 × 800

768 × 1024

```



The width around `1000px` is especially important because previous toolbar collisions occurred there.



\## Mobile



```text

430 × 932

414 × 896

390 × 844

375 × 812

360 × 800

320 × 568

```



Do not create screenshots at every size for every issue when the result is identical. Capture enough evidence to demonstrate:



\- desktop behavior;

\- intermediate/tablet behavior;

\- mobile behavior;

\- breakpoint-specific regressions.



\---



\# 5. Required format for each issue



In `UI\_POLISH\_IMPLEMENTATION\_SPEC.md`, describe every issue using this structure:



```markdown

\## UI-XX — Clear issue title



\### Scope

\- Desktop / Tablet / Mobile / Shared

\- Route(s)

\- Component(s)



\### Current behavior

Describe exactly what is wrong now.



\### Expected behavior

Describe the required final result precisely.



\### Screenshot evidence

\- `screenshots/...png`

\- viewport size

\- route

\- interaction steps required to reproduce



\### Likely technical cause

Describe the probable source:

\- wrong breakpoint;

\- duplicated active style;

\- absolute positioning;

\- inconsistent token;

\- stale locale state;

\- missing backend data;

\- incorrect icon mapping;

\- excessive section spacing;

\- etc.



Do not claim certainty when the code does not prove it.



\### Recommended implementation

Describe the safest professional solution.



\### Responsive rules

Describe desktop, tablet, and mobile behavior separately where relevant.



\### Acceptance criteria

Provide a concrete checklist that the implementing agent can verify.



\### Regression risks

List related elements that must not be broken.

```



\---



\# 6. Audit and document the following issues



\## UI-01 — Product gallery active thumbnail border



Current requirement:



\- inspect the small product gallery thumbnails on the product page;

\- active thumbnail must have a simple `1px` black border;

\- remove red borders, thick rings, doubled borders, shadows, or other competing active states;

\- inactive thumbnails keep the normal neutral project border;

\- the active state must remain clear on desktop and mobile;

\- lightbox, carousel synchronization, ordering, and main-photo behavior must not be affected.



Capture:



\- active thumbnail on desktop;

\- active thumbnail on mobile if thumbnails are shown there;

\- current incorrect border styling.



\---



\## UI-02 — Cart icon consistency



Current requirement:



\- inspect all cart icon states;

\- inactive cart icon must use the same base icon/glyph as the active cart icon;

\- only state styling may differ:

&#x20; - fill;

&#x20; - background;

&#x20; - border;

&#x20; - counter;

&#x20; - emphasis;

\- do not use two visually different basket illustrations for active and inactive state.



Inspect at least:



\- header cart icon;

\- product card cart button;

\- catalog card;

\- favorites;

\- cart-related active state.



Document which shared icon/component should become the source of truth.



\---



\## UI-03 — Cart page top spacing



Current requirement:



\- top spacing on the cart page is too large;

\- reduce it;

\- compare it with Favorites, Catalog, and other standard inner pages;

\- identify the standard page-top spacing token used elsewhere;

\- recommend an exact token/value based on the existing design system rather than guessing.



Capture desktop and mobile cart page.



\---



\## UI-04 — Catalog search positioning



Current requirement:



On catalog desktop/tablet layout, search must have:



```text

top offset: 19px

right offset: 38px

```



It must:



\- remain aligned inside the catalog toolbar;

\- not drift;

\- not overlap category, filter, sorting, or gender controls;

\- not break the opened category/filter/sorting panels;

\- remain stable when any panel opens;

\- remain correct around 1000–1280px;

\- preserve the existing active-search animation and functionality.



Capture:



\- normal toolbar;

\- filters open;

\- sorting open;

\- categories open;

\- approximately 1000px width;

\- large desktop.



Clearly document the search containing block and which element should be the positioning reference.



\---



\## UI-05 — Catalog typography consistency



Inspect typography for:



\- filters;

\- sorting trigger;

\- selected sort text;

\- `Все / Женские / Мужские`;

\- category title;

\- catalog toolbar controls;

\- opened sorting options.



Required:



1\. Gender/accessory filter labels must use the same font size and visual language as the catalog filters.

2\. Sorting trigger must use the same typography family, weight, color, and baseline.

3\. Do not leave a mix of visibly different font sizes and weights in one toolbar.

4\. Opened sorting options must use:



```text

font-size: 16px

```



5\. Identify the correct shared `Text` variant/token instead of recommending scattered raw styles.



Capture desktop, tablet, and mobile toolbar typography.



\---



\## UI-06 — Remove sorting arrow



Current requirement:



\- sorting trigger must display only its text, such as:

&#x20; - `По цене`;

&#x20; - `Сначала новые`;

&#x20; - another selected option;

\- remove the upward/downward arrow rendered beside the label;

\- do not remove the sorting icon if it belongs to the toolbar design;

\- opened sorting panel still clearly shows the selected option.



Document the difference between:



\- toolbar sorting icon;

\- unwanted direction arrow appended to the label;

\- radio indicator inside the opened list.



\---



\## UI-07 — Sorting menu font size



Required:



\- sorting options inside the opened dropdown/panel must use `16px`;

\- maintain consistent line height and touch/click target;

\- selected option must remain obvious;

\- typography must remain readable on mobile and desktop.



Capture opened sorting panel on desktop and mobile.



\---



\## UI-08 — Standard section spacing and footer spacing



Audit vertical spacing across the public site.



Use the landing page as the visual source of truth.



Required:



1\. Catalog section spacing must match the standard rhythm used on the landing page.

2\. Spacing between the final main content block and footer should use the same standard on all pages.

3\. This applies to desktop and mobile.

4\. Avoid both:

&#x20;  - excessive empty space;

&#x20;  - content pressed directly against the footer.

5\. Identify the current landing-page spacing tokens/values.

6\. Recommend shared tokens rather than one-off margins.



Inspect at least:



\- landing page;

\- catalog;

\- product page;

\- cart;

\- favorites;

\- brands;

\- about;

\- warranty;

\- delivery;

\- payment;

\- brand detail page.



Create a small spacing comparison table in the specification:



```markdown

| Page | Current spacing | Landing standard | Recommended change |

```



\---



\## UI-09 — Product Description tab link spacing



Current issue:



In the product `Описание` tab, spacing before:



\- `Все наручные часы ...`;

\- `О бренде`;



is still too large.



Required:



1\. Make the gap significantly smaller.

2\. It should follow the same compact content-to-action spacing used elsewhere.

3\. Check desktop and mobile separately.

4\. Preserve the required spacing between the two links themselves if that has a separate design rule.

5\. Do not alter the product description typography or links unnecessarily.



Capture the whole Description tab so the vertical rhythm is visible.



\---



\## UI-10 — Product breadcrumb separator sizing



Current requirement:



\- long dash separators on the product page breadcrumbs must have the same size and visual appearance as catalog breadcrumbs;

\- separators must not look taller, wider, darker, or heavier;

\- breadcrumb text remains plain black, `20px`, weight `300`, according to the established project rule;

\- use the shared breadcrumb component/token where possible.



Capture catalog and product breadcrumbs side by side or as separate screenshots.



\---



\## UI-11 — Brand history localization does not update



Current problem:



When changing language, some brand-page content remains in the previous language, including:



\- brand history description;

\- short brand description;

\- headings or other brand CMS/content fields;

\- possibly banner text and links.



Required audit:



1\. Reproduce switching between all supported locales.

2\. Determine which content updates and which remains stale.

3\. Inspect:

&#x20;  - locale state;

&#x20;  - API query keys;

&#x20;  - CMS response;

&#x20;  - translation mapper;

&#x20;  - server/client component boundaries;

&#x20;  - memoization;

&#x20;  - fallback order;

&#x20;  - cached brand data.

4\. Document whether the cause is:

&#x20;  - frontend stale state/cache;

&#x20;  - incorrect API locale;

&#x20;  - missing translations in backend;

&#x20;  - fallback always selecting Russian;

&#x20;  - hardcoded content;

&#x20;  - CMS mapping issue.



Required final behavior:



\- all translatable brand content updates when locale changes;

\- no full page/server restart required;

\- missing current-locale translation uses the documented fallback;

\- content from the previous locale must not remain visible.



Capture the same brand page in RU/KZ/EN.



\---



\# Mobile-specific issues



\## UI-12 — Warranty, Payment, and Delivery bottom spacing



Current problem:



The gap between the final content and footer on mobile is still too large.



Required:



\- reduce it further;

\- it should match normal spacing on the rest of the site;

\- use the shared final-section/footer spacing token;

\- do not leave large page-specific `margin-bottom` or padding;

\- check that the fixed mobile bottom navigation does not create a false extra gap.



Capture:



\- Warranty;

\- Payment;

\- Delivery;



at 390px and, where useful, 320px.



\---



\## UI-13 — All brands page must show brands without products



Current requirement:



1\. The all-brands page must show every available brand from the backend.

2\. Brands with zero products must not be removed.

3\. The frontend must not filter by `productCount > 0`.

4\. The backend query must not exclude empty brands.

5\. Brand links must remain available even if their brand product page currently has an empty catalog state.



Also fix the text under the brand name:



\- it must show the number of products;

\- not the number of brands;

\- use correct pluralization/localization:

&#x20; - `0 товаров`;

&#x20; - `1 товар`;

&#x20; - `2 товара`;

&#x20; - `5 товаров`;

&#x20; - equivalent KZ/EN forms.



Capture at least one brand with products and one without products.



If current data contains no zero-product brand, inspect the API/code and document how to test it safely.



\---



\## UI-14 — Product Description spacing on mobile



The same issue as UI-09, but verify mobile independently:



\- reduce the spacing before `Все наручные часы ...` and `О бренде` even more;

\- make it match the standard compact mobile rhythm;

\- prevent large empty gaps;

\- ensure links remain easy to tap.



\---



\## UI-15 — Product contact banner spacing



Current problem:



The gap before the `Связаться с нами` / cooperation/contact banner on the product page is too large.



Required:



\- reduce it to the same standard inter-section spacing used elsewhere;

\- audit both desktop and mobile, with special attention to mobile;

\- preserve the banner’s own internal padding;

\- change only the external gap before/after the banner.



Capture enough surrounding content to show the spacing context.



\---



\## UI-16 — Mobile sorting trigger must be icon-only



Current requirement:



\- remove the sorting description/selected text from the mobile toolbar button;

\- show only the sorting icon;

\- add localized `aria-label`;

\- the selected sorting value remains visible inside the opened sorting panel;

\- desktop/tablet behavior can retain text where space allows;

\- do not remove the actual sorting state.



Capture inactive mobile toolbar and opened sorting panel.



\---



\## UI-17 — Logical catalog category icons



Audit all category and subcategory icons in the mobile catalog/category menu.



Current problem:



\- some icons are generic, duplicated, or unrelated to the category.



Required:



1\. Recommend a specific logical icon for every visible category and important subcategory.

2\. Reuse the project’s existing icon set where possible.

3\. Do not add multiple heavy icon libraries.

4\. Keep one consistent stroke/fill style.

5\. Icons must be understandable at small sizes.

6\. Add accessible labels where needed.



At minimum inspect:



\- all products;

\- wristwatches;

\- interior clocks;

\- accessories;

\- classic watches;

\- sports watches;

\- diving watches;

\- chronographs;

\- children’s watches;

\- men’s/women’s branches where represented as categories.



In the specification, add an icon mapping table:



```markdown

| Category | Current icon | Recommended icon/component | Reason |

```



Do not implement the icons during this audit task.



\---



\## UI-18 — Brand names centered in side menu



Current requirement:



\- in the side/mobile brands menu, every brand name must be centered within its own item/block;

\- not merely centered relative to the entire menu;

\- items with different text lengths must still look balanced;

\- click/touch area must remain full width;

\- do not break hover/active states;

\- inspect wrapping behavior for long brand names.



Capture at least:



\- short brand name;

\- long brand name;

\- active/hovered item if available.



\---



\# 7. Additional responsive audit



After documenting all listed issues, perform a controlled audit for other obvious visual and responsive problems.



Pay special attention to:



\- widths around 1000px;

\- 768px;

\- 430px;

\- 390px;

\- 360px;

\- 320px.



Look for:



1\. overlapping elements;

2\. clipped text;

3\. horizontal body overflow;

4\. controls outside containers;

5\. content hidden behind mobile bottom navigation;

6\. dropdowns or dialogs larger than viewport;

7\. inconsistent active states;

8\. duplicated underlines and filled pills;

9\. inconsistent icon sizes;

10\. excessive whitespace;

11\. content pressed against footer;

12\. search overlapping filters/categories;

13\. fixed widths that break at intermediate sizes;

14\. incorrect localization after language switching;

15\. image aspect ratio problems;

16\. unreadable labels;

17\. buttons with truncated text;

18\. unstable layout when opening panels.



Only add new issues to the specification when they are clearly reproducible.



Assign new IDs starting from:



```text

UI-19

UI-20

...

```



Do not fill the report with subjective minor preferences.



\---



\# 8. Screenshot index



Create `SCREENSHOT\_INDEX.md` with a table:



```markdown

| Screenshot | Issue ID | Route | Viewport | State / interaction | What it proves |

```



Every screenshot referenced in the implementation specification must be included in this table.



\---



\# 9. Final implementation task for the next agent



At the end of `UI\_POLISH\_IMPLEMENTATION\_SPEC.md`, create a consolidated section:



```markdown

\# Implementation order

```



Prioritize fixes:



\## Priority 1 — functional or responsive breakage



\- search position/overlap;

\- locale not updating;

\- brands missing;

\- mobile overlays;

\- horizontal overflow;

\- controls hidden at breakpoints.



\## Priority 2 — inconsistent shared UI



\- cart icon;

\- breadcrumb separators;

\- catalog typography;

\- sorting trigger/menu;

\- category icons.



\## Priority 3 — spacing and polish



\- cart top spacing;

\- Description links;

\- contact banner;

\- footer spacing;

\- active thumbnail border;

\- side-menu centering.



Also provide:



```markdown

\# Shared components/tokens that should be changed

```



List likely reusable components rather than suggesting duplicate page-level patches.



Examples:



\- shared `Breadcrumbs`;

\- shared `CatalogToolbar`;

\- shared `CatalogSearch`;

\- shared `SortTrigger`;

\- shared `ProductThumbnail`;

\- shared `PageSection`;

\- shared `PageFooterSpacing`;

\- shared `BrandCard`;

\- shared `MobileCategoryItem`;

\- shared icon mapping/configuration.



\---



\# 10. Do not implement the fixes yet



This task is considered complete when:



1\. every listed issue has been reproduced or explicitly marked as not reproducible;

2\. screenshots have been collected;

3\. relevant code/components have been identified;

4\. likely root causes have been documented;

5\. concrete acceptance criteria have been written;

6\. the next agent has a clear implementation order;

7\. no unrelated source code changes remain.



Do not finish with a vague checklist.



The document must be implementation-ready.



\---



\# 11. Final response format



```markdown

Audit summary:

\- \[pages and components inspected]

\- \[viewports inspected]

\- \[number of reproduced issues]



Screenshots:

\- \[path to screenshot directory]

\- \[number of screenshots created]



Specification:

\- `docs/tasks/vympel\_ui\_polish\_audit/UI\_POLISH\_IMPLEMENTATION\_SPEC.md`



Screenshot index:

\- `docs/tasks/vympel\_ui\_polish\_audit/SCREENSHOT\_INDEX.md`



New issues discovered:

\- \[UI-19 etc., or none]



Could not reproduce:

\- \[issues and reasons, or none]



Source code changes:

\- \[confirm no implementation changes were left]



Server/process cleanup:

\- \[confirm temporary processes were stopped]



Next step:

\- The next Codex agent should implement the fixes according to the generated specification.

```

```

