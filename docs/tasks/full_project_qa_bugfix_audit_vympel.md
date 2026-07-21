You are working as a senior fullstack engineer, QA engineer, security reviewer, and UI/UX reviewer.



Perform a full project QA audit and bugfix pass for the VYMPEL watch store.



Use the project documentation and the expected behavior described below as the source of truth.



Do not rewrite the whole project from scratch. Carefully inspect the current implementation, find bugs/regressions, and fix them safely.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect current git diff.

5\. Inspect frontend public site.

6\. Inspect CRM/admin frontend.

7\. Inspect backend APIs, services, DTOs, validation, migrations, storage, CMS, CRM, auth, reviews, products, filters, search, cart, favorites, and analytics.

8\. Inspect localization files.

9\. Inspect global design tokens and shared components.

10\. Create a short QA plan before editing files.



Important command rule:



Do not run long-running commands as final checks.



Do not run:



```text

npm run dev

npm run start

next dev

next start

watch commands

server commands that never exit

browser QA commands that start a server and keep running

```



Use only finite checks:



```text

npm run lint

npm run build

npm run typecheck

npm test

```



Backend finite checks:



```text

./gradlew test

./mvnw test

```



Use the actual available project scripts.



If visual QA needs a running server, explain what command the user should run manually.



\---



\# Main goal



Check the whole project for:



1\. Runtime bugs.

2\. Broken user flows.

3\. Incorrect API/backend behavior.

4\. Broken CRM flows.

5\. CMS not reflecting public changes.

6\. Broken image upload/display.

7\. Bad cache behavior.

8\. Broken product filters/search/sorting.

9\. Broken cart/favorites.

10\. Broken responsive/mobile UI.

11\. Broken dialogs/popups.

12\. Security/validation issues.

13\. Unlocalized text.

14\. UI regressions.

15\. Inconsistent design.

16\. Performance issues.

17\. Bad code quality.



If you find problems, fix them immediately.



\---



\# Expected project behavior



Use this as the checklist for correct behavior.



\---



\# 1. Public site — general behavior



The public VYMPEL site must work as a polished e-commerce store.



Required:



1\. No runtime crashes.

2\. No hydration errors.

3\. No infinite render/fetch loops.

4\. No broken images.

5\. No fake placeholder product images.

6\. No horizontal overflow.

7\. No clipped critical text.

8\. No overlapping major UI elements.

9\. All links that should navigate must work.

10\. All user-facing text must be localized.

11\. Desktop and mobile must both be usable.

12\. UI must match VYMPEL minimal/premium style.



\---



\# 2. Product catalog



Catalog must support:



1\. Category navigation.

2\. Filters.

3\. Sorting.

4\. Search.

5\. Pagination.

6\. Product cards.

7\. Correct empty/loading/error states.



Important rules:



1\. Filters must work by selected filters only.

2\. If no filter is selected, products must still load.

3\. Detailed watch characteristics must be read from `watch\_detail`.

4\. Countries are tied to brand if that is still project logic.

5\. Country filter should be just “Страна” if implemented.

6\. Category-specific filters must work.

7\. Child watch categories inherit wristwatch filters:



&#x20;  \* Классические часы

&#x20;  \* Спортивные часы

&#x20;  \* Дайверские часы

&#x20;  \* Хронографы

8\. Interior clocks must have their own characteristics and filters.

9\. Accessories must have their own valid structure.

10\. Products without stock must appear at the end regardless of sorting.

11\. Out-of-stock products must be visually marked.

12\. Catalog pagination must not wrap awkwardly.

13\. Page change must scroll to top/product list.

14\. Breadcrumbs must be plain black, 20px, font-weight 300.

15\. Product cards must not stretch full width on desktop; they must be constrained by the grid.



\---



\# 3. Catalog search



Search must work globally across all products.



Required:



1\. Search works outside categories and across the whole store.

2\. Product page search redirects to catalog search.

3\. Search handles typos/fuzzy matching if implemented.

4\. Search has quick results where expected.

5\. Search does not break layout.

6\. On desktop, active search expands smoothly toward center, but does not become edge-to-edge.

7\. On catalog page, search keeps proper toolbar positioning.

8\. On product page, search behavior matches catalog search.

9\. On mobile, search icon-only inactive state must match catalog behavior where required.

10\. Parent toolbar/block must not shrink or jump when search opens.



\---



\# 4. Category navigation



Required:



1\. Desktop category dropdown works.

2\. Mobile categories page/panel works.

3\. Bottom mobile nav opens categories.

4\. “Все товары” exists where needed.

5\. Parent categories with children must have “Все товары” action for parent listing.

6\. Nested category navigation works.

7\. Category icons on mobile are meaningful and not all identical.

8\. “Детские часы” category exists and works if already added.



\---



\# 5. Product page



Product page must work fully.



Required:



1\. Product title, gender, rating, price, stock state, add to cart, favorite, and question/request buttons work.

2\. Product images load from backend.

3\. Product without images shows styled “Фотографии нет” state.

4\. No fake image placeholders.

5\. Product description must not overflow.

6\. Long text must wrap safely.

7\. Characteristics must not overlap description.

8\. Product tabs must work:



&#x20;  \* Описание

&#x20;  \* Гарантия

&#x20;  \* Доставка

&#x20;  \* Заказ и оплата

&#x20;  \* Отзывы

9\. Tab underline must be aligned.

10\. Product reviews must live inside the tabs, not as a duplicated separate block.

11\. Description links spacing must match requirements.

12\. “Все наручные часы …” and “О бренде” links must work.



\---



\# 6. Product gallery



Product gallery must match the intended behavior.



Required:



1\. Use shadcn-based carousel/slider pattern if implemented.

2\. Show one main image at a time.

3\. Main image carousel loops if multiple images exist.

4\. Side thumbnails on desktop.

5\. Thumbnails are not too small.

6\. Active thumbnail uses dark/project-style highlight, not red.

7\. Thumbnail arrows render only when thumbnails overflow.

8\. Thumbnail rail stays constrained to main image height.

9\. No vertical stack of huge full-size images.

10\. Main photo appears first.

11\. Saved image order is respected.

12\. Product cards use main photo.

13\. If main photo missing, use first ordered photo.

14\. If no photos, use no-photo state.

15\. Clicking main image opens lightbox.

16\. Lightbox supports next/previous.

17\. Mobile gallery uses one main image with horizontal thumbnails or another clean mobile pattern.

18\. No broken gallery layout on mobile.



\---



\# 7. Product reviews



Reviews must work correctly.



Required:



1\. Guest users can leave reviews.

2\. Unauthenticated users are displayed as `Гость`.

3\. Review rating is required.

4\. Review text is optional.

5\. Reviews are moderated before public display.

6\. Rating uses only approved reviews.

7\. Product cards show rating summary where appropriate.

8\. Reviews tab shows summary, form, filters, sorting, pagination, and review list.

9\. Reviews are paginated 15 per page.

10\. Sorting works:



\* newest

\* oldest

\* highest rating

\* lowest rating

\* positive first

\* negative first



11\. Filters work:



\* rating 1–5

\* with text

\* without text



12\. Changing filters/sort resets review page to 1.

13\. Reviews without text show clean localized message.

14\. No `.length` / `.map` crash on undefined reviews.

15\. Sticky review form works on desktop if still intended, and does not break mobile.

16\. CRM moderation still works.



\---



\# 8. Cart



Cart must work.



Required:



1\. Add to cart works.

2\. Quantity changes work.

3\. Cannot add more than available stock.

4\. If stock limit reached, plus button blocks and shows tooltip/message.

5\. Remove item requires styled confirmation dialog.

6\. Clear cart requires styled confirmation dialog.

7\. Dialog buttons must be round/pill-shaped and project-styled.

8\. Checkout button sends WhatsApp message with:



&#x20;  \* greeting

&#x20;  \* all positions

&#x20;  \* quantity

&#x20;  \* SKU/article

&#x20;  \* product name

&#x20;  \* each item total

&#x20;  \* total order sum

9\. Cart persists via localStorage if that is current design.

10\. Cart does not crash on invalid localStorage.

11\. Toasts work.



\---



\# 9. Favorites



Favorites must work.



Required:



1\. Add/remove favorite works through localStorage.

2\. Favorite state displays on cards/catalog/product pages.

3\. Favorites page opens and does not hang.

4\. Products show in grid, aligned from start.

5\. Favorites page has top spacing and navigation.

6\. Removing from favorites shows toast:



&#x20;  \* product removed

&#x20;  \* action button `Отменить`

7\. Undo restores product to favorites.

8\. Do not show `Открыть избранное` after removing from favorites.

9\. Add-to-favorite toast can have `Перейти` action.

10\. Toast action buttons must be round/pill-shaped.



\---



\# 10. Toasts



Toasts must be polished.



Required:



1\. Toasts match VYMPEL design.

2\. Toast buttons are round/pill-shaped.

3\. Navigation action labels should be concise: `Перейти`.

4\. Favorite removal toast uses `Отменить`.

5\. Toast text may wrap cleanly on mobile.

6\. Toast must not overflow viewport.

7\. Toast must not look like debug/error badge.

8\. Toast must not cover important UI aggressively.



\---



\# 11. Dialogs / popups



All dialogs/popups must work correctly.



Required:



1\. Normal dialogs close on outside click.

2\. Escape closes dialogs where appropriate.

3\. Close icon works.

4\. Clicking inside content does not close dialog.

5\. Opening dialog must not shift page left/right.

6\. Scrollbar inside long dialogs must be hidden or styled cleanly.

7\. Scrollbar must not visually escape rounded dialog.

8\. Dialog must remain usable on mobile/small-height screens.

9\. Buttons must be project-styled.

10\. No default ugly browser confirm.



Check:



\* “Задать вопрос по модели”

\* “Оставить заявку”

\* cart item delete

\* cart clear

\* image lightbox

\* any CRM dialogs if relevant



\---



\# 12. “Оставить заявку” request system



Required:



1\. “Оставить заявку” opens dialog.

2\. Form styling follows project design.

3\. Phone mask works:



&#x20;  \* `+7 777 777 77 77`

&#x20;  \* auto-format

&#x20;  \* paste support

&#x20;  \* digit limit

&#x20;  \* backspace works

&#x20;  \* normalized submit value

4\. At least one contact method required:



&#x20;  \* valid email or full phone

5\. Request saves to database.

6\. CRM has request management page.

7\. CRM can view, filter, search, change status, add admin comment.

8\. CRM endpoints are protected.

9\. Public endpoint validates input and returns safe errors.

10\. Success/error/loading states work.



\---



\# 13. CRM product management



CRM must work reliably.



Required:



1\. Product creation works with only essential required fields.

2\. Optional fields do not block draft/product creation.

3\. Long descriptions do not go into short title fields.

4\. Product create/update validation matches backend.

5\. Product price/stock use one canonical source of truth.

6\. CRM product list shows newly created products immediately without server restart.

7\. CRM product list supports pagination/search/status filters if needed.

8\. Product can be found by:



&#x20;  \* id

&#x20;  \* name/title

&#x20;  \* model

&#x20;  \* SKU/article

&#x20;  \* brand

&#x20;  \* category

9\. Quick price edit works.

10\. Quick stock edit works.

11\. Product links Kaspi/Wildberries work and are returned to frontend.

12\. Product categories have correct fields.

13\. Bulk product creation works by category.

14\. Bulk creation allows per-product editing of every characteristic.

15\. Descriptions have language fields.

16\. Success/error/loading states exist for all mutations.

17\. CRM product images upload works.

18\. Multiple product photos upload.

19\. Photo order can be changed.

20\. Main photo can be set.

21\. Product card/page uses main photo.



\---



\# 14. CRM users/admin



If implemented, verify:



1\. Admin can create users.

2\. Admin can edit users.

3\. Admin can change roles/status.

4\. Protected endpoints are enforced on backend.

5\. Success/error/loading states work.

6\. Unauthorized users cannot access CRM.



\---



\# 15. CMS



CMS is critical and must be checked carefully.



Required:



1\. CMS editor works.

2\. CMS saves changes.

3\. CMS publishes/activates blocks.

4\. CMS public pages actually use backend CMS data.

5\. Public pages must not keep using static/preloaded banners if CMS data exists.

6\. Static/local images are fallback only.

7\. Public CMS endpoint returns updated published content.

8\. CMS changes appear immediately or after at most the second reload.

9\. Cache/revalidation works.

10\. Public pages remain fast through caching.

11\. No stale cache forever.

12\. CMS block editors show only supported fields.

13\. Blocks without text should not show text fields.

14\. Image blocks support optional variants:



\* desktop RU/default

\* desktop KZ

\* desktop EN

\* mobile RU/default

\* mobile KZ

\* mobile EN



15\. Variants are optional.

16\. CMS image fallback order:



\* mobile current locale

\* desktop current locale

\* mobile default locale

\* desktop default locale

\* local fallback



17\. CMS updates must be idempotent.

18\. Saving same CMS block twice must not duplicate translations.

19\. `cms\_block\_translation` must be upserted by `(blockId, lang)`.

20\. Frontend CMS payload must contain only one translation per language.

21\. Optional image variants must not create duplicate translation rows.

22\. Public CMS images must use backend URLs and existing storage.

23\. CMS image replacement must avoid stale browser/CDN cache.



\---



\# 16. Brand pages



Brand pages must work.



Required:



1\. Brand listing page `/brands` exists if implemented.

2\. Footer “Бренды” links to all-brands page.

3\. Brand names link to brand pages.

4\. Brand page title does not overflow mobile.

5\. Brand banner is large enough on mobile.

6\. Brand pages use backend/CMS banners if configured.

7\. Brand product lists show products for that brand.

8\. New products section works.

9\. Breadcrumbs work and are readable.



\---



\# 17. Info pages



Check:



\* О нас

\* Гарантия

\* Доставка

\* Оплата

\* Brands page

\* Favorites

\* Cart



Required:



1\. Pages open.

2\. Layout works on desktop/mobile.

3\. Footer spacing is not excessive.

4\. Text styles match project.

5\. Internal links work.

6\. Mobile bottom nav does not cover footer/content.

7\. CMS content/banners are used where expected.



\---



\# 18. Mobile adaptation



Mobile version must be usable at:



```text

320px

360px

390px

480px

768px

```



Required:



1\. No horizontal overflow.

2\. Header is clean.

3\. Bottom nav works.

4\. Catalog toolbar works.

5\. Category page/panel works.

6\. Product cards fit.

7\. Product gallery works.

8\. Product tabs/reviews work.

9\. Cart/favorites work.

10\. Footer is mobile-designed, not just shrunken desktop.

11\. Advantage blocks align from start where required.

12\. “Смотреть все” near headings is smaller.

13\. Spacing after “Философия” is standard.

14\. Info pages do not have huge bottom gaps.

15\. Filter active state uses border/outline, not underline.

16\. Mobile CMS banners work across pages, not only home.



\---



\# 19. Desktop design



Desktop must remain polished.



Required:



1\. Product cards not full-width.

2\. Filters/category/sort dropdowns not clipped.

3\. Filter/category panels use intended wide layout.

4\. Search animation is polished.

5\. Breadcrumbs are black 20px weight 300.

6\. Product tab content matches required text/style.

7\. Cart confirmations are styled.

8\. Product gallery resembles reference: thumbnails + one main image.

9\. No broken popups.

10\. No debug badges.



\---



\# 20. Backend/API/security



Check backend for:



1\. Protected CRM endpoints.

2\. Protected CMS endpoints.

3\. Protected review moderation endpoints.

4\. Public endpoints only expose safe DTOs.

5\. No stack traces returned to frontend.

6\. Validation errors are clean.

7\. Request IDs in logs/errors if implemented.

8\. File upload validates type/size.

9\. MinIO/storage uses existing service.

10\. No duplicate storage systems.

11\. No SQL injection/dynamic sort issues.

12\. Sort/filter keys are whitelisted.

13\. Pagination params bounded.

14\. User-generated content rendered safely.

15\. CMS/review text cannot inject HTML/JS.

16\. No secrets/tokens/passwords logged.



\---



\# 21. Logging



If logging system exists, verify:



1\. Logs write to server files.

2\. Logs rotate/retain.

3\. Request correlation ID works.

4\. Errors are logged.

5\. Sensitive data is not logged.

6\. Generated logs are gitignored.

7\. CRM/admin actions log enough context if implemented.



\---



\# 22. Code quality



Clean problems found during audit:



1\. Unused imports.

2\. Dead code.

3\. Debug logs.

4\. Duplicated logic.

5\. Unsafe `any` where easy to fix.

6\. API data rendered before normalization.

7\. Hardcoded text.

8\. Magic colors/sizes that should use tokens.

9\. Broken types.

10\. Repeated route strings.

11\. Repeated localStorage logic.

12\. Unclear DTO mappings.



Do not over-refactor working code unnecessarily.



\---



\# Priority order



Fix in this order:



\## Priority 1 — Critical



1\. Runtime crashes.

2\. Backend errors.

3\. Broken product creation/image upload.

4\. CMS public rendering not working.

5\. CRM list stale data.

6\. Security/auth failures.

7\. Broken cart/favorites core flows.

8\. Infinite loops.



\## Priority 2 — Important



1\. Filter/search/sort bugs.

2\. Product gallery bugs.

3\. Reviews bugs.

4\. Dialog bugs.

5\. Mobile layout issues.

6\. Data consistency bugs.



\## Priority 3 — Polish



1\. Visual alignment.

2\. Spacing.

3\. Toast/button styling.

4\. Code cleanup.

5\. Minor performance improvements.



\---



\# Required audit workflow



Before editing, write:



```markdown

QA plan:

\- \[areas to inspect]

\- \[likely risks]

\- \[safe fix order]

```



Then inspect and fix.



Do not claim everything works unless it was actually checked.



\---



\# Verification



Run finite checks only.



Use available scripts:



Frontend:



```text

npm run lint

npm run typecheck

npm run build

```



Backend:



```text

./gradlew test

./mvnw test

```



or actual project commands.



If full checks are too slow or hang:



1\. Stop them.

2\. Use targeted checks.

3\. Report exactly what was checked and what still needs manual QA.



Do not run dev/start/watch commands as final checks.



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with any real architectural/data-flow changes.



Update `docs/PROJECT\_SKILLS.md` with any permanent rules discovered during the audit.



At minimum, make sure docs reflect:



1\. CMS public rendering/caching rules.

2\. Product image order/main photo rules.

3\. CRM product list cache/invalidation rules.

4\. Dialog behavior rules.

5\. Search/catalog rules.

6\. Review moderation/pagination rules.

7\. Mobile design rules.

8\. Backend security/validation rules.



\---



\# Final response required



```markdown

QA summary:

\- \[what areas were inspected]



Critical issues found:

\- \[issue + fix]



Frontend fixes:

\- \[public UI/search/catalog/product/cart/favorites/mobile fixes]



Backend fixes:

\- \[API/service/DTO/security/cache/storage fixes]



CRM fixes:

\- \[product/CMS/reviews/requests/users fixes]



CMS fixes:

\- \[public rendering/cache/image variant fixes]



Validation/security:

\- \[what was improved]



Performance/cache:

\- \[what was improved]



Code cleanup:

\- \[what was cleaned]



Checks:

\- \[commands run]

\- \[results]

\- \[commands intentionally not run and why]



Manual QA needed:

\- \[what user should verify manually]



Remaining risks:

\- \[honest remaining limitations]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



Be honest. If something cannot be fully verified, say so clearly.



