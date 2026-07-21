You are working as a senior fullstack engineer on this project.



Implement a full product reviews and rating system for the public shop and CRM.



Users must be able to leave a product rating and an optional text review without registration. Unregistered users must be marked as guests. Reviews must be moderated in CRM before appearing publicly.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect current product entity/model, product detail page, product cards, catalog API, CRM structure, auth/security, migrations, localization, and global design tokens.

5\. Inspect existing CRM notification/toast/loading/error patterns.

6\. Inspect current public form components and RHF / React Hook Form setup.

7\. Make a short implementation plan before coding.



Follow project rules:



\* all user-facing text must be localized

\* use existing `Text`, `Heading`, `Button`, form components, and design tokens

\* use RHF for forms

\* use global tokens/classes instead of arbitrary Tailwind values/raw hex

\* do not hardcode Russian/English/Kazakh strings in components

\* update `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md` after finishing



\---



\# Main Goal



Create product rating and reviews.



Required:



1\. User can leave a rating for a product.

2\. User can optionally leave a text review.

3\. Registration is not required.

4\. If user is not authenticated, review author must be marked as `Гость`.

5\. Review must not appear publicly until CRM/admin approves it.

6\. CRM must show new reviews.

7\. CRM must support moderation:



&#x20;  \* approve review

&#x20;  \* reject/hide review

&#x20;  \* delete review

8\. Product rating must be displayed:



&#x20;  \* on product detail page

&#x20;  \* on product cards

&#x20;  \* in catalog

&#x20;  \* in brand/new/similar/favorites sections where product cards are used



\---



\# Part 1 — Database / Backend Model



Add migrations for product reviews if not already present.



Recommended entity/table:



```text

product\_review

```



Suggested fields:



```text

id

product\_id

user\_id nullable

author\_name nullable

author\_type enum: GUEST / USER / ADMIN if needed

rating integer not null

text nullable

status enum: PENDING / APPROVED / REJECTED / DELETED

created\_at

updated\_at

moderated\_at nullable

moderated\_by nullable

moderation\_comment nullable

```



Rules:



1\. Rating must be from 1 to 5.

2\. Text review is optional.

3\. Guest reviews must be allowed.

4\. Guest author should be displayed as `Гость` if no name is provided.

5\. Public endpoints must show only `APPROVED` reviews.

6\. Pending/rejected/deleted reviews must not appear on public product pages.

7\. Rating aggregate must be calculated only from approved reviews.

8\. Deleted reviews should either be soft-deleted by status or physically deleted according to project conventions. Prefer soft delete if the project uses it.



Add useful indexes:



```text

product\_id

status

created\_at

product\_id + status

```



\---



\# Part 2 — Backend Public API



Add public endpoints for product reviews.



Use existing route conventions.



Possible endpoints:



```text

GET  /api/products/{productIdOrSlug}/reviews

POST /api/products/{productIdOrSlug}/reviews

GET  /api/products/{productIdOrSlug}/rating

```



or integrate into existing product endpoints.



Public product DTO / card DTO should include rating summary:



```json

{

&#x20; "ratingAverage": 4.7,

&#x20; "ratingCount": 12

}

```



Requirements:



1\. Product detail response should include rating summary.

2\. Product card/catalog response should include rating summary.

3\. Product detail page should be able to load approved reviews.

4\. Review creation endpoint must accept:



&#x20;  \* rating

&#x20;  \* optional text

&#x20;  \* optional guest name if project wants it

5\. If user is authenticated, attach review to user.

6\. If user is not authenticated, create review as guest.

7\. New reviews must have `PENDING` status by default.

8\. After submitting, user sees message that review was sent for moderation.

9\. Do not expose moderation fields publicly.

10\. Validate inputs.

11\. Prevent raw stack traces/errors from being returned.



Optional but recommended:



\* basic spam protection:



&#x20; \* length limit for review text

&#x20; \* rate limiting if project has infrastructure

&#x20; \* do not allow empty rating

&#x20; \* trim review text

&#x20; \* sanitize text display



\---



\# Part 3 — Rating Aggregation



Implement rating calculation.



Rules:



1\. Average rating uses only approved reviews.

2\. Rating count uses only approved reviews.

3\. If no approved reviews:



&#x20;  \* ratingAverage can be `null` or `0`, depending on project style

&#x20;  \* ratingCount must be `0`

4\. Product cards should handle no-rating state gracefully.

5\. Product detail page should handle no reviews gracefully.



Recommended:



```text

average = AVG(rating) WHERE product\_id = ? AND status = APPROVED

count = COUNT(\*) WHERE product\_id = ? AND status = APPROVED

```



Keep performance reasonable. If product list becomes slow, optimize query or add aggregate fields later, but implement cleanly first.



\---



\# Part 4 — Public Product Detail UI



Add review/rating section to product detail page.



Section should match VYMPEL design.



Required elements:



1\. Product rating summary:



&#x20;  \* average rating

&#x20;  \* number of reviews

&#x20;  \* star display

2\. List of approved reviews.

3\. Empty state if no reviews:



&#x20;  \* `Пока нет отзывов`

&#x20;  \* `Станьте первым, кто оставит отзыв о товаре.`

4\. Review form:



&#x20;  \* rating selector, 1–5 stars

&#x20;  \* optional text review textarea

&#x20;  \* optional guest name if appropriate

&#x20;  \* submit button

5\. Success toast/message after submit:



&#x20;  \* review sent for moderation

6\. Error state if submit fails.

7\. Loading state while submitting.

8\. Form must use RHF.

9\. Button disabled while request is pending.

10\. All text localized.



Review form behavior:



\* rating is required

\* text review is optional

\* guest user is allowed

\* if unauthenticated, review author type is guest

\* after successful submit, form resets

\* new pending review should not immediately appear in public list unless project explicitly shows “pending” only to submitter; simpler: do not show until approved



\---



\# Part 5 — Rating on Product Cards



Update product card component.



Product cards must show rating summary.



Required:



1\. Display rating average and review count, if available.

2\. If no reviews, show a clean no-rating state or hide rating line depending on best UI.

3\. Rating display must not break product card layout.

4\. Must work on:



&#x20;  \* catalog

&#x20;  \* home page

&#x20;  \* brand pages

&#x20;  \* favorites

&#x20;  \* similar products

&#x20;  \* new products

&#x20;  \* search quick results if useful

5\. Must be responsive on mobile.

6\. Must not make cards too crowded.



Possible card display:



```text

★ 4.8 · 12 отзывов

```



or a subtle star row according to current project style.



Use existing icons if possible. Do not add heavy icon libraries.



\---



\# Part 6 — CRM Review Management



Add CRM review moderation.



CRM must allow admin/manager to see and manage reviews.



Possible CRM route:



```text

/crm/reviews

```



or follow existing CRM routing.



Required CRM functionality:



1\. List reviews.

2\. Highlight new/pending reviews.

3\. Filter by status:



&#x20;  \* pending

&#x20;  \* approved

&#x20;  \* rejected

&#x20;  \* deleted

&#x20;  \* all

4\. Search/filter by:



&#x20;  \* product

&#x20;  \* rating

&#x20;  \* status

&#x20;  \* date

5\. Show review details:



&#x20;  \* product name/model/SKU

&#x20;  \* rating

&#x20;  \* text

&#x20;  \* author type: guest/user

&#x20;  \* author name if available

&#x20;  \* created date

&#x20;  \* status

6\. Actions:



&#x20;  \* approve

&#x20;  \* reject/hide

&#x20;  \* delete

7\. Confirmation for delete.

8\. Success/error toasts for all actions.

9\. Loading states for all mutations.

10\. Buttons disabled while request is pending.

11\. All CRM text localized.



Important:



New reviews must be easy to notice in CRM.



Add a clear section/card/count for pending reviews if CRM dashboard exists.



Example:



```text

Новые отзывы: 5

```



\---



\# Part 7 — CRM Backend API



Add protected CRM/admin endpoints.



Possible endpoints:



```text

GET    /api/crm/reviews

GET    /api/crm/reviews/{id}

PATCH  /api/crm/reviews/{id}/approve

PATCH  /api/crm/reviews/{id}/reject

DELETE /api/crm/reviews/{id}

```



or use existing route conventions.



Requirements:



1\. CRM review endpoints must be protected.

2\. Only authorized CRM/admin users can moderate reviews.

3\. Public users cannot approve/delete reviews.

4\. Deleting should follow project convention:



&#x20;  \* soft delete via status `DELETED`

&#x20;  \* or physical delete if project uses physical delete

5\. Moderation must update:



&#x20;  \* status

&#x20;  \* moderatedAt

&#x20;  \* moderatedBy if available

6\. Public rating summary must update after moderation.

7\. Public approved reviews must update after moderation.



\---



\# Part 8 — Guest Review Handling



Unregistered users can leave reviews.



Required behavior:



1\. No login required.

2\. Backend creates review as guest.

3\. Author display:



&#x20;  \* if authenticated user: show safe user name if available

&#x20;  \* if guest: show `Гость`

4\. Do not expose guest private technical data publicly.

5\. Do not require user account for review submission.

6\. Review still requires moderation before public display.



Optional:



\* guest name field can be added, but not required

\* if guest name is empty, use `Гость`



\---



\# Part 9 — Styling / Design System



Review/rating UI must match VYMPEL style.



Use:



\* subtle borders

\* clean typography

\* restrained stars/icons

\* project colors

\* project spacing

\* card-like surfaces where appropriate

\* existing `Text`, `Heading`, `Button`



Do not use generic bright marketplace design.



Do not leave default browser form styles.



All states must be polished:



\* no reviews

\* loading

\* error

\* submitted for moderation

\* pending reviews in CRM

\* approved/rejected/deleted statuses



Add global tokens/classes if needed.



\---



\# Part 10 — Localization



Add localization keys for:



Public:



\* Reviews

\* Rating

\* Leave a review

\* Your rating

\* Review text

\* Send review

\* Review sent for moderation

\* No reviews yet

\* Be the first to leave a review

\* Guest

\* Rating required

\* Failed to send review

\* Reviews count labels



CRM:



\* Reviews moderation

\* New reviews

\* Pending

\* Approved

\* Rejected

\* Deleted

\* Approve

\* Reject

\* Delete

\* Confirm delete

\* Review approved

\* Review rejected

\* Review deleted

\* Failed to load reviews

\* Failed to update review

\* Author

\* Product

\* Rating

\* Status

\* Date



Do not hardcode strings in components.



\---



\# Part 11 — Security / Validation



Required:



1\. Validate rating range 1–5 on backend.

2\. Validate review text length.

3\. Trim review text.

4\. Do not allow HTML/script injection in reviews.

5\. Render review text safely.

6\. Protect CRM endpoints.

7\. Public endpoint must not expose moderation/private data.

8\. Public list shows only approved reviews.

9\. Handle missing product safely.

10\. Handle deleted/unavailable product according to project rules.



Optional but good:



\* basic rate limiting if infrastructure exists

\* duplicate review control by user/product if logged in

\* duplicate guest control by session/IP only if safe and simple



Do not overcomplicate if not supported.



\---



\# Part 12 — Verification Checklist



Before finishing, verify:



\## Public review creation



\* guest can submit rating without login

\* guest review is marked as guest

\* text review is optional

\* rating is required

\* invalid rating is rejected

\* submitted review becomes pending

\* pending review does not appear publicly

\* success toast/message appears

\* error handling works



\## Product detail



\* rating summary appears

\* approved reviews list appears

\* no-reviews state works

\* review form works

\* UI is responsive



\## Product cards



\* rating appears on product cards

\* no-rating state does not break cards

\* catalog cards still align

\* mobile cards do not overflow



\## CRM



\* reviews page/list exists

\* pending reviews are visible

\* review details are readable

\* approve works

\* reject works

\* delete works

\* moderation actions show toast/loading/error states

\* public product rating updates after approval/delete



\## Backend



\* migrations apply

\* public endpoints work

\* CRM endpoints are protected

\* rating summary uses only approved reviews

\* deleted/rejected reviews are not public



\---



\# Documentation Updates



Update `docs/PROJECT\_MAP.md` with:



\* product review/rating tables/entities

\* public review endpoints

\* CRM review moderation endpoints/pages

\* rating summary flow

\* product card rating display

\* guest review behavior

\* review status lifecycle



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Public reviews must be moderated before display.

\* Guest users can leave reviews and must be displayed as `Гость`.

\* Product rating uses only approved reviews.

\* Product cards should display rating summary when available.

\* CRM must track new/pending reviews and allow approve/reject/delete.

\* Review forms must use RHF and localized validation.

\* Public review text must be rendered safely.

\* CRM review actions must have loading/success/error states.



\---



\# Final Response Required



```markdown

Summary:

\- \[what changed]



Backend:

\- \[entities/migrations/endpoints/services]



Public reviews:

\- \[product page review form/list/rating]



Product cards:

\- \[rating display changes]



CRM moderation:

\- \[review tracking/moderation/delete]



Guest behavior:

\- \[how guest reviews work]



Security/validation:

\- \[review validation/safe rendering/protection]



Localization:

\- \[keys/files added]



Tests:

\- \[what was run or why not run]



Notes:

\- \[assumptions/limitations/follow-up]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



