You are working as a senior fullstack engineer, security reviewer, and code quality auditor.



Perform a full project audit and improvement pass.



Goal:



Find and fix bugs, security vulnerabilities, unsafe patterns, performance issues, duplicated code, unstable architecture, and code-quality problems so the project moves closer to modern commercial-grade standards used in large companies.



Do not rewrite the whole project from scratch. Work carefully, incrementally, and safely.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the full project structure.

5\. Inspect frontend, backend, CRM, CMS, catalog, product pages, cart/favorites, reviews, filters, search, auth, file upload, MinIO/image handling, analytics, and migrations.

6\. Inspect package scripts and dependencies.

7\. Inspect environment/config handling.

8\. Inspect current git diff before making changes.

9\. Create a short audit plan before editing files.



Important command rule:



Do not run long-running commands as final checks.



Do not run:



```text

npm run dev

npm run start

next dev

next start

watch commands

server commands that stay alive forever

```



Use only finite checks, for example:



```text

npm run lint

npm run build

npm run typecheck

npm test

```



Adapt to the actual project scripts.



If browser/manual QA is needed, explain what should be run manually instead of starting an endless server process.



\---



\# Main audit goals



Perform a full audit in these areas:



1\. Security vulnerabilities.

2\. Runtime bugs.

3\. Data consistency bugs.

4\. API validation and error handling.

5\. Authentication and authorization.

6\. Frontend stability.

7\. Backend correctness.

8\. Database/migration quality.

9\. File upload / image storage safety.

10\. CMS safety.

11\. CRM access protection.

12\. Reviews/moderation safety.

13\. Cart/favorites/localStorage safety.

14\. Performance.

15\. Code cleanliness.

16\. Type safety.

17\. Accessibility basics.

18\. Commercial-grade maintainability.



\---



\# Part 1 — Security audit



Check and fix security issues.



\## Authentication / authorization



Verify:



1\. CRM routes are protected.

2\. CMS routes are protected.

3\. Admin-only actions are not accessible to public users.

4\. Review moderation endpoints are protected.

5\. Product create/update/delete endpoints are protected.

6\. User/admin management endpoints are protected.

7\. Analytics/admin endpoints are protected.

8\. Public endpoints expose only safe public data.

9\. Role checks happen on backend, not only frontend.

10\. Tokens/sessions are handled safely according to current architecture.



Fix any missing backend authorization.



Do not rely only on frontend route guards.



\## Input validation



Check all create/update endpoints.



Validate:



\* product data

\* review data

\* CMS content

\* image uploads

\* user creation/update

\* auth forms

\* filters/search/sorting params

\* pagination params

\* category/brand/product identifiers

\* CRM quick edit fields

\* cart/order/WhatsApp checkout data if backend involved



Backend must reject invalid input safely.



Frontend must show localized friendly validation errors.



\## SQL / query safety



Check:



1\. No unsafe string concatenation in SQL/native queries.

2\. Sort keys are whitelisted.

3\. Filter keys are whitelisted.

4\. Search params are safely bound.

5\. Pagination values are bounded.

6\. No untyped nullable PostgreSQL params that cause runtime errors.

7\. Dynamic queries are built safely.



\## XSS / unsafe rendering



Check:



1\. Review text is rendered safely.

2\. CMS text is rendered safely.

3\. Product descriptions are rendered safely.

4\. No unsafe `dangerouslySetInnerHTML` unless sanitized and justified.

5\. User-generated content must not execute HTML/JS.

6\. Toast/error messages must not show unsafe raw backend stack traces.



\## File upload / MinIO



Check image/file upload security:



1\. Validate file type.

2\. Validate file size.

3\. Validate file extension and MIME type.

4\. Avoid path traversal.

5\. Avoid exposing private MinIO internals.

6\. Use existing storage service.

7\. Do not allow arbitrary file upload abuse.

8\. Handle failed upload cleanup if needed.

9\. Image URLs must be safe and generated consistently.



\## Public data exposure



Check DTOs and API responses.



Public endpoints must not expose:



\* internal IDs if not needed

\* moderation fields

\* admin metadata

\* user private data

\* stack traces

\* internal MinIO keys if not intended

\* sensitive config/env data

\* raw database errors



\---



\# Part 2 — Bug audit



Find and fix runtime bugs.



Specifically check for:



1\. `.length`, `.map`, `.filter`, `.reduce` on possibly undefined API data.

2\. Unsafe optional objects.

3\. State initialized from stale props and never updated.

4\. Infinite render loops.

5\. Infinite fetch loops.

6\. Unstable query keys.

7\. Incorrect `useEffect` dependencies.

8\. localStorage access during SSR/render.

9\. Hydration mismatches.

10\. Components assuming data exists before loading finishes.

11\. Incorrect fallback values like fake price/stock.

12\. Broken pagination.

13\. Broken filters.

14\. Broken sorting.

15\. Broken category-specific logic.

16\. Broken review pagination/filter/sort.

17\. Broken sticky positioning.

18\. Broken mobile layout if obvious.



Fix root causes, not symptoms.



\---



\# Part 3 — Data consistency audit



Check source-of-truth issues.



Important examples:



1\. Product price must have one canonical source.

2\. Product stock must have one canonical source.

3\. Product availability must be derived consistently.

4\. Product rating must use approved reviews only.

5\. Review count must use approved reviews only.

6\. Product filters must use selected filters only.

7\. Watch detail filters must use `watch\_detail`, not fake/direct fields.

8\. Country belongs to Brand if this is the project rule.

9\. CMS content must have fallback if missing.

10\. CRM quick edits must update the same fields that public product lists read.



Document canonical sources in `PROJECT\_MAP.md`.



\---



\# Part 4 — Error handling audit



Improve error handling.



Required:



1\. Backend errors should return clean API errors.

2\. Frontend should show friendly localized messages.

3\. Do not show raw stack traces to users.

4\. Do not silently fail CRM actions.

5\. Mutations should have loading/success/error states.

6\. Public pages should have loading/error/empty states.

7\. CMS should have error states.

8\. Review forms should show validation and submit errors.

9\. Cart/favorites localStorage failures should not crash the app.

10\. Product not found and 404 states should remain clean.



\---



\# Part 5 — Performance audit



Check and improve performance.



Frontend:



1\. Avoid unnecessary re-renders.

2\. Memoize expensive derived arrays/objects where useful.

3\. Avoid unstable query keys.

4\. Avoid loading huge payloads unnecessarily.

5\. Use pagination for lists.

6\. Use image optimization where project supports it.

7\. Avoid duplicated API calls.

8\. Keep search debounced.

9\. Avoid rendering all reviews/products at once.

10\. Avoid large unused imports.



Backend:



1\. Add indexes where needed.

2\. Avoid N+1 queries.

3\. Use pagination for product/review/CRM lists.

4\. Avoid fetching huge data for cards.

5\. Optimize filter/search queries.

6\. Avoid expensive count queries where possible.

7\. Ensure public endpoints return only required DTO fields.



Database:



Check indexes for:



\* product category

\* product brand

\* product active/status

\* product reviews product\_id/status/created\_at/rating

\* analytics events product\_id/event\_type/created\_at

\* CMS page/block keys

\* filters/search fields if already implemented



Add migrations only when justified.



\---



\# Part 6 — Code quality cleanup



Clean and improve code quality.



Fix:



1\. Duplicated logic.

2\. Dead code.

3\. Unused imports.

4\. Unused variables.

5\. Overly large components.

6\. Components with mixed business/UI logic.

7\. Repeated localStorage logic.

8\. Repeated API calls.

9\. Repeated route strings.

10\. Repeated magic constants.

11\. Hardcoded UI text.

12\. Hardcoded colors/spacing when tokens should exist.

13\. Unsafe `any` usage where reasonable to fix.

14\. Inconsistent DTO shapes.

15\. Inconsistent naming.

16\. Console logs/debug code.

17\. Temporary comments that should not be in commercial code.



Do not remove useful comments that explain non-obvious business rules.



\---



\# Part 7 — Architecture standards



Improve architecture toward commercial-grade standards.



Apply:



1\. Centralized API client behavior.

2\. Typed DTOs.

3\. Shared route helpers.

4\. Shared form components.

5\. Shared dropdown/select components.

6\. Shared toast helpers.

7\. Shared empty/error state components.

8\. Shared cart/favorites storage services.

9\. Shared CMS content helpers.

10\. Shared review query helpers.

11\. Clear separation between:



\* UI

\* state

\* API

\* mapping

\* validation

\* business rules



Do not over-engineer, but reduce chaos.



\---



\# Part 8 — Frontend standards



Check frontend against modern standards:



1\. React components should be stable and typed.

2\. Hooks should follow rules of hooks.

3\. `useEffect` should not be abused for derived state.

4\. API data should be normalized before rendering.

5\. Form state should use RHF where project standard requires it.

6\. Accessibility labels for icon buttons.

7\. Focus states.

8\. Keyboard interaction for dropdowns/modals where feasible.

9\. SSR-safe browser APIs.

10\. No layout-breaking arbitrary styles.

11\. Localization for all user-facing text.



\---



\# Part 9 — Backend standards



Check backend against commercial standards:



1\. Controllers thin.

2\. Services contain business logic.

3\. Repositories are query-focused.

4\. DTOs separate from entities.

5\. Validation on request DTOs.

6\. Mappers do not hide fake defaults.

7\. Transactions where multiple writes must be atomic.

8\. Protected endpoints enforce roles.

9\. Errors are consistent.

10\. Migrations are clean and idempotent where applicable.

11\. No secrets in code.

12\. Config comes from environment.



\---



\# Part 10 — Dependency and config audit



Inspect dependencies/config.



Check:



1\. Unused dependencies.

2\. Known risky packages if obvious.

3\. Duplicate libraries for same task.

4\. Build scripts.

5\. Typecheck/lint scripts.

6\. Env variable handling.

7\. `.env` leakage risk.

8\. API base URL handling.

9\. Production/dev config separation.

10\. Image/domain config if Next.js.



Do not upgrade major dependencies unless clearly safe and necessary.



\---



\# Part 11 — Prioritization



Work in safe priority order:



\## Priority 1 — Critical



\* security holes

\* broken auth/authorization

\* runtime crashes

\* data corruption

\* public exposure of private data

\* infinite loops



\## Priority 2 — Important



\* validation

\* error handling

\* source-of-truth bugs

\* performance bottlenecks

\* broken UX states



\## Priority 3 — Cleanup



\* duplication

\* unused code

\* naming

\* refactoring

\* polish



Do not spend all time on cosmetic refactoring while critical issues remain.



\---



\# Part 12 — Reporting



Before making broad changes, produce a short audit summary:



```markdown

Audit plan:

\- Critical areas to inspect

\- Likely risks

\- Planned safe fix order

```



After implementation, provide a final report with:



1\. Found issues.

2\. Fixed issues.

3\. Security improvements.

4\. Performance improvements.

5\. Code cleanup.

6\. Remaining risks.

7\. Checks run.



\---



\# Part 13 — Verification commands



Run only finite commands.



Use actual project commands, for example:



```text

npm run lint

npm run typecheck

npm run build

npm test

```



For backend, use relevant finite commands, for example:



```text

./mvnw test

./gradlew test

```



or actual project scripts.



Do not run dev/start/watch commands as verification.



If a command fails:



1\. Fix if related to this task.

2\. If unrelated/pre-existing, document clearly.

3\. Do not hide failures.



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* security architecture notes

\* canonical source-of-truth notes

\* API/client changes

\* shared helpers/components added

\* backend validation/auth changes

\* performance/index changes

\* known remaining risks



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Never render API data before normalizing optional arrays/objects.

\* Public endpoints must expose only safe DTOs.

\* CRM/CMS/admin endpoints must be protected on backend.

\* Dynamic filters/sorts must use whitelisted keys.

\* User-generated and CMS content must be rendered safely.

\* File uploads must validate type/size and use existing storage.

\* Do not use fake fallback product data for price/stock.

\* Do not run long-running dev/start/watch commands as final checks.

\* All user-facing text must be localized.

\* Shared reusable logic should be centralized instead of duplicated.

\* Commercial code should avoid dead code, debug logs, hardcoded magic values, and unsafe `any`.



\---



\# Final response required



```markdown

Audit summary:

\- \[main areas inspected]



Critical fixes:

\- \[security/runtime/data issues fixed]



Security:

\- \[auth/validation/XSS/upload/API exposure fixes]



Backend:

\- \[services/controllers/DTOs/repositories/migrations/indexes changes]



Frontend:

\- \[components/hooks/API/state/error handling changes]



Performance:

\- \[query/render/image/pagination/index improvements]



Code cleanup:

\- \[dead code/duplication/types/refactors]



Checks:

\- \[commands run]

\- \[results]

\- \[commands intentionally not run and why]



Remaining risks:

\- \[anything still needing follow-up]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



Do not claim the project is fully secure unless you actually verified the relevant areas. Be specific and honest.



