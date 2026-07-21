



````text

You are working as a senior fullstack QA engineer, backend auditor, database engineer, security reviewer, performance engineer, and senior UX/UI reviewer.



Perform a complete end-to-end audit and testing pass for the entire VYMPEL application.



You must inspect and test:



1\. Backend.

2\. Database and migrations.

3\. Public storefront.

4\. CRM/admin application.

5\. CMS.

6\. Authentication and authorization.

7\. Product/catalog system.

8\. Search, filtering, sorting, and pagination.

9\. Product images and MinIO storage.

10\. Cart and favorites.

11\. Reviews and moderation.

12\. Customer requests/applications.

13\. Analytics.

14\. Recommendation system.

15\. Caching and revalidation.

16\. Logging and error handling.

17\. Responsive UI and UX.

18\. Performance and optimization opportunities.



Your main task is to:



1\. find functional bugs;

2\. find runtime and data consistency bugs;

3\. find security and authorization issues;

4\. find database and migration issues;

5\. find performance bottlenecks;

6\. find UX/UI and responsive design problems;

7\. reproduce every important issue;

8\. save screenshots for visual/UI problems;

9\. identify the exact files/components/services/endpoints involved;

10\. create a detailed implementation report;

11\. create a complete, professional prompt for Codex Code that explains exactly how to fix all discovered issues.



Do not perform a broad production-code rewrite during this task.



This is primarily an audit, testing, evidence collection, and implementation-planning task.



Small temporary diagnostic changes are allowed only when strictly needed to reproduce or isolate an issue. Revert temporary diagnostic changes before finishing.



Do not discard unrelated user changes.



\---



\# 1. Mandatory preparation



Before testing:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Read all relevant existing audit/task documents under `docs/tasks`.

5\. Inspect the current git diff.

6\. Identify:

&#x20;  - public frontend project;

&#x20;  - CRM frontend project;

&#x20;  - backend project;

&#x20;  - database technology and migrations;

&#x20;  - MinIO/storage configuration;

&#x20;  - authentication model;

&#x20;  - CMS architecture;

&#x20;  - test scripts;

&#x20;  - environment files/examples;

&#x20;  - logging configuration;

&#x20;  - caching configuration;

&#x20;  - recommendation system implementation.

7\. Create a short test plan before running tests.



Write the initial plan in this format:



```markdown

Testing plan:

\- Applications/services to inspect

\- Required local dependencies

\- Existing automated tests

\- Critical business flows

\- Security areas

\- Database areas

\- UI viewports

\- Performance areas

\- Safe execution order

````



\---



\# 2. Important process rules



Do not allow commands to run indefinitely.



Do not leave orphaned processes.



Long-running application servers may be started only for controlled testing.



If a server must be started:



1\. start it as a managed background process;

2\. write stdout/stderr to clearly named temporary log files;

3\. wait no longer than approximately 90 seconds for readiness;

4\. verify readiness through a health endpoint or finite request;

5\. perform tests;

6\. stop the process afterward;

7\. confirm that no test Node/Java/server process remains running.



Do not leave commands such as these hanging:



```text

npm run dev

npm run start

next dev

next start

gradle bootRun

mvn spring-boot:run

watch mode

```



These may be used only as controlled temporary servers, not as final checks.



Final verification commands must be finite.



Examples:



```text

npm run lint

npm run typecheck

npm run build

npm test

./gradlew test

./mvnw test

```



Use the actual scripts available in the project.



If a check hangs:



1\. stop it;

2\. diagnose why;

3\. use a targeted finite alternative;

4\. document the limitation honestly.



\---



\# 3. Required deliverables



Create this structure:



```text

docs/tasks/vympel\_full\_system\_audit/

├── FULL\_SYSTEM\_AUDIT\_REPORT.md

├── CODEX\_CODE\_IMPLEMENTATION\_PROMPT.md

├── TEST\_MATRIX.md

├── API\_TEST\_REPORT.md

├── DATABASE\_AUDIT.md

├── PERFORMANCE\_AUDIT.md

├── SECURITY\_AUDIT.md

├── UI\_UX\_AUDIT.md

├── SCREENSHOT\_INDEX.md

├── logs/

│   ├── frontend/

│   ├── crm/

│   ├── backend/

│   └── tests/

└── screenshots/

&#x20;   ├── public/

&#x20;   │   ├── desktop/

&#x20;   │   ├── tablet/

&#x20;   │   └── mobile/

&#x20;   └── crm/

&#x20;       ├── desktop/

&#x20;       └── tablet/

```



Do not save secrets, tokens, passwords, private user data, or sensitive production information in reports or screenshots.



Use descriptive filenames.



Examples:



```text

public\_mobile\_catalog\_sort\_overlay\_bottom\_nav\_390.png

public\_desktop\_product\_gallery\_active\_thumbnail\_1440.png

crm\_product\_create\_image\_upload\_error\_1440.png

crm\_cms\_banner\_not\_reflected\_publicly\_1440.png

```



\---



\# 4. Issue format



Every discovered issue must receive an ID.



Use prefixes:



```text

BE-001    Backend

DB-001    Database

API-001   API contract

SEC-001   Security

FE-001    Public frontend

CRM-001   CRM

CMS-001   CMS

REC-001   Recommendation system

PERF-001  Performance

UX-001    UX/UI

RESP-001  Responsive

TEST-001  Test infrastructure

LOG-001   Logging

```



Describe each issue using:



```markdown

\## ISSUE-ID — Clear title



\### Severity

\- Critical / High / Medium / Low



\### Area

\- Backend / Database / Public / CRM / CMS / etc.



\### Route / endpoint / screen

\- Exact route, endpoint, or workflow



\### Current behavior

\- What is wrong



\### Expected behavior

\- Correct business behavior



\### Reproduction steps

1\. ...

2\. ...

3\. ...



\### Evidence

\- Screenshot

\- Log excerpt

\- API response

\- SQL result

\- Test failure



\### Likely root cause

\- Files/classes/components/services involved

\- Explain uncertainty when not fully proven



\### Recommended fix

\- Specific implementation direction



\### Acceptance criteria

\- Concrete verifiable checklist



\### Regression risks

\- Related behavior that must remain working

```



\---



\# 5. Test matrix



Create `TEST\_MATRIX.md`.



For every major system include:



```markdown

| Area | Scenario | Preconditions | Steps | Expected | Actual | Status | Issue ID |

```



Statuses:



```text

PASS

FAIL

PARTIAL

BLOCKED

NOT APPLICABLE

```



Do not mark something PASS if it was only inspected but not executed.



\---



\# 6. Backend testing



Inspect and test the complete backend architecture.



\## 6.1 Build and tests



Check:



1\. Backend compiles.

2\. Existing unit/integration tests pass.

3\. Migrations apply.

4\. Application starts with test/local configuration.

5\. Health endpoint works if present.

6\. No startup exceptions.

7\. No repeating warning/error loops.



\## 6.2 Controllers and APIs



Test all important endpoints for:



1\. correct HTTP methods;

2\. correct status codes;

3\. valid request handling;

4\. invalid request handling;

5\. missing entity handling;

6\. authorization;

7\. role restrictions;

8\. pagination;

9\. sorting;

10\. filtering;

11\. consistent response shapes;

12\. clean error responses;

13\. request IDs if implemented;

14\. no stack traces exposed publicly.



Cover at least:



\* authentication;

\* products;

\* categories;

\* brands;

\* product details;

\* product images;

\* price/stock updates;

\* catalog filters;

\* search;

\* reviews;

\* review moderation;

\* CMS public endpoints;

\* CMS CRM endpoints;

\* customer requests;

\* analytics;

\* user administration.



\## 6.3 Validation



Check that backend validates:



\* required product fields;

\* optional product fields;

\* title and description lengths;

\* price;

\* stock;

\* SKU/model;

\* category;

\* brand;

\* URLs;

\* uploaded image type and size;

\* reviews;

\* rating range;

\* phone/email;

\* CMS link types;

\* CMS translation uniqueness;

\* pagination limits;

\* sort keys.



Expected validation errors must not become generic transaction failures.



\## 6.4 Transactions and consistency



Check atomicity for:



\* product creation plus image attachment;

\* product deletion/deactivation;

\* image main-photo switching;

\* image reordering;

\* CMS block update;

\* review moderation and rating recalculation;

\* customer request status changes;

\* quick price/stock changes.



Identify partial-save risks.



\---



\# 7. Database audit



Create `DATABASE\_AUDIT.md`.



Inspect:



1\. all migrations;

2\. migration ordering;

3\. duplicate or conflicting schema definitions;

4\. missing foreign keys;

5\. missing unique constraints;

6\. incorrect nullability;

7\. string lengths;

8\. cascade behavior;

9\. orphan removal risks;

10\. indexes;

11\. stale/dead tables;

12\. inconsistent enum values;

13\. source-of-truth conflicts.



Verify canonical sources for:



\* product price;

\* product stock;

\* product availability;

\* product status;

\* product images;

\* main image;

\* image order;

\* product category;

\* brand country;

\* watch details;

\* review rating/count;

\* CMS translations;

\* CMS image variants.



\## Required database scenarios



Test or inspect:



1\. Newly created product appears immediately without server restart.

2\. CRM list is not backed by stale application cache.

3\. Product image rows are linked to the correct product.

4\. Only one product image is main.

5\. Image order remains stable.

6\. Only one CMS translation exists per block/language.

7\. Localized/mobile image variants do not create duplicate translations.

8\. Brands with zero products can still be returned.

9\. Approved reviews alone affect public rating.

10\. Deleted/rejected reviews do not affect public rating.



\## Query performance



Use database tools where safe:



```text

EXPLAIN

EXPLAIN ANALYZE

```



for important queries:



\* catalog filtering;

\* search;

\* product list;

\* CRM product list;

\* review list;

\* recommendations;

\* analytics;

\* CMS page content.



Do not run destructive or expensive production-grade analysis on a real production database.



Use local/test data only.



\---



\# 8. Public frontend testing



Test complete public user flows.



\## 8.1 Core pages



Check:



\* home;

\* catalog;

\* category pages;

\* product page;

\* brand list;

\* brand page;

\* favorites;

\* cart;

\* about;

\* warranty;

\* delivery;

\* payment;

\* 404;

\* empty/error states.



\## 8.2 Catalog



Test:



1\. Products load with no filters selected.

2\. Only selected filters are applied.

3\. Watch detail filters use `watch\_detail`.

4\. Wristwatch child categories inherit valid filters.

5\. Interior clocks use their own characteristics.

6\. Accessories do not show inappropriate watch filters.

7\. Gender filtering/categories work correctly.

8\. Sorting works.

9\. Sorting label/icon behavior is correct.

10\. Pagination works.

11\. Page changes scroll correctly.

12\. Out-of-stock products appear last.

13\. Search works across categories.

14\. Search handles typos if implemented.

15\. Search does not break toolbar layout.

16\. Empty state is styled.

17\. Error state is styled.



\## 8.3 Product page



Test:



\* correct product data;

\* price;

\* stock;

\* characteristics;

\* descriptions;

\* translated content;

\* breadcrumbs;

\* product gallery;

\* thumbnail state;

\* carousel loop;

\* lightbox;

\* favorite;

\* add to cart;

\* stock limit;

\* product tabs;

\* reviews;

\* contact/request dialog;

\* recommendations.



\## 8.4 Cart



Test:



1\. Add item.

2\. Remove item.

3\. Undo/confirmation where applicable.

4\. Quantity increase/decrease.

5\. Stock limit.

6\. Clear cart.

7\. Persistence after reload.

8\. Invalid localStorage handling.

9\. WhatsApp checkout message contents.

10\. Correct totals.



\## 8.5 Favorites



Test:



1\. Add favorite.

2\. Remove favorite.

3\. Undo removal.

4\. Persistence.

5\. Favorite state on every card/page.

6\. Favorites page grid.

7\. Empty state.

8\. No infinite rendering.



\## 8.6 Localization



Test all supported locales.



At minimum:



```text

ru

kz

en

```



Check:



\* navigation;

\* catalog;

\* product page;

\* characteristics;

\* brand history;

\* brand description;

\* CMS content;

\* dialogs;

\* validation;

\* toasts;

\* reviews;

\* footer;

\* empty/error states.



Content must update immediately when locale changes.



Do not leave stale text from the previous locale.



\---



\# 9. CRM testing



Test all CRM systems.



\## 9.1 Authentication and access



Test:



\* login;

\* logout;

\* invalid credentials;

\* expired/invalid token;

\* protected routes;

\* role restrictions;

\* direct endpoint access without UI.



\## 9.2 Product management



Test:



1\. Minimal product creation.

2\. Optional fields.

3\. Category-specific forms.

4\. Three-language titles/descriptions.

5\. Long descriptions.

6\. Product editing.

7\. Quick price update.

8\. Quick stock update.

9\. Product status changes.

10\. Product deactivation/deletion.

11\. Kaspi and Wildberries links.

12\. Newly created product appears immediately.

13\. Pagination.

14\. Search.

15\. Status filters.

16\. Bulk creation.

17\. Per-product override in bulk mode.

18\. Correct success/error/loading states.



\## 9.3 Product images



Test:



1\. Single upload.

2\. Multiple upload.

3\. Invalid type.

4\. Oversized image.

5\. Upload during product creation.

6\. Upload during edit.

7\. Main image selection.

8\. Reordering.

9\. Deleting main image.

10\. Public product page refresh.

11\. Product cards use main image.

12\. No silent failures.



\## 9.4 CMS



Test:



1\. Block create.

2\. Block update.

3\. Block publish/unpublish.

4\. Block delete.

5\. Translation updates.

6\. Save same block repeatedly.

7\. Desktop RU/KZ/EN images.

8\. Mobile RU/KZ/EN images.

9\. Text fields hidden for image-only blocks.

10\. Optional variants.

11\. Preview.

12\. Public page rendering.

13\. Cache invalidation.

14\. Image replacement.

15\. Public fallback only when CMS returns nothing.



\## 9.5 Reviews



Test:



\* pending list;

\* approve;

\* reject;

\* delete;

\* filters;

\* pagination;

\* rating recalculation;

\* public update.



\## 9.6 Customer requests



Test:



\* new request appears;

\* details;

\* status changes;

\* admin comment;

\* search/filter;

\* protected access;

\* loading/success/error feedback.



\## 9.7 Analytics



Test:



\* product views;

\* likes;

\* cart additions;

\* popularity;

\* data consistency;

\* date ranges;

\* empty state;

\* API failures;

\* performance.



\---



\# 10. UI/UX and responsive audit



Create `UI\_UX\_AUDIT.md`.



For every visual issue:



1\. reproduce it;

2\. capture a screenshot;

3\. record route and viewport;

4\. identify component;

5\. provide exact expected behavior;

6\. provide acceptance criteria.



\## Required public viewports



Desktop:



```text

1920 × 1080

1440 × 900

1280 × 800

```



Tablet/intermediate:



```text

1100 × 800

1024 × 768

1000 × 800

900 × 800

768 × 1024

```



Mobile:



```text

430 × 932

414 × 896

390 × 844

375 × 812

360 × 800

320 × 568

```



\## Required CRM viewports



```text

1440 × 900

1280 × 800

1024 × 768

768 × 1024

```



CRM does not need to behave like a consumer mobile app unless the project requires it, but it must remain usable without broken layouts.



\## Check specifically



\* horizontal overflow;

\* clipped text;

\* overlapping controls;

\* wrong breakpoints;

\* fixed widths;

\* header/banner conflicts;

\* search positioning;

\* filter/sort/category overlays;

\* mobile bottom navigation;

\* dialogs;

\* internal scrollbars;

\* footer spacing;

\* card grids;

\* typography consistency;

\* active states;

\* icons;

\* touch target sizes;

\* keyboard focus;

\* empty/error/loading states;

\* toast layout;

\* localization expansion.



\## Accessibility checks



Use available tools where possible:



\* axe;

\* Lighthouse accessibility;

\* browser accessibility tree;

\* keyboard navigation.



Check:



\* missing labels;

\* icon-only aria-labels;

\* contrast;

\* focus visibility;

\* dialog focus trap;

\* Escape behavior;

\* semantic headings;

\* button/link semantics.



Save screenshots only for meaningful UI issues.



\---



\# 11. Security audit



Create `SECURITY\_AUDIT.md`.



Inspect:



1\. Backend authorization, not only frontend guards.

2\. JWT/session handling.

3\. Password handling.

4\. Role escalation risks.

5\. IDOR risks.

6\. Public access to CRM/CMS APIs.

7\. Review moderation access.

8\. Product mutations.

9\. Customer request data exposure.

10\. File upload validation.

11\. Path traversal.

12\. MIME spoofing.

13\. XSS in:



&#x20;   \* reviews;

&#x20;   \* CMS;

&#x20;   \* descriptions;

&#x20;   \* customer messages.

14\. SQL injection/dynamic query risks.

15\. Unsafe sorting/filter keys.

16\. CSRF where applicable.

17\. CORS configuration.

18\. Rate limiting/spam exposure.

19\. Secret leakage.

20\. Stack traces.

21\. Sensitive logs.

22\. Dependency vulnerabilities where tools are available.



Permitted tools may include, when available:



```text

npm audit

dependency-check

OWASP tools

Semgrep

ESLint security rules

Gradle/Maven dependency reports

```



Do not install large or invasive tools without a clear reason.



Do not report every dependency warning as exploitable. Explain actual applicability.



\---



\# 12. Performance audit



Create `PERFORMANCE\_AUDIT.md`.



Inspect:



\## Frontend



\* bundle size;

\* unused dependencies;

\* duplicated dependencies;

\* unnecessary client components;

\* repeated API calls;

\* unstable query keys;

\* excessive rerenders;

\* image optimization;

\* large images;

\* lazy loading;

\* font loading;

\* hydration;

\* expensive calculations;

\* carousel performance;

\* localStorage parsing;

\* stale cache behavior.



Use available tools where safe:



```text

Next build output

bundle analyzer if already configured

Lighthouse

React profiler if feasible

browser network/performance panel

```



\## Backend



\* N+1 queries;

\* unnecessary entity graphs;

\* oversized DTOs;

\* missing pagination;

\* inefficient filtering;

\* expensive count queries;

\* caching;

\* thread use;

\* image/storage calls;

\* repeated mapping;

\* transaction scope.



\## Database



\* indexes;

\* query plans;

\* joins;

\* sort operations;

\* full table scans;

\* recommendation query performance;

\* analytics aggregation.



For every optimization recommendation state:



1\. current bottleneck;

2\. evidence;

3\. expected benefit;

4\. risk;

5\. safest implementation.



Do not recommend speculative micro-optimizations without evidence.



\---



\# 13. Logging and observability



Test:



1\. Application logs are written to files.

2\. Error logs are separated if configured.

3\. Rotation works/config exists.

4\. Log directory is configurable.

5\. Request ID appears.

6\. Error response includes safe request ID if intended.

7\. Secrets are not logged.

8\. CRM/admin actions have sufficient context.

9\. Generated log files are gitignored.

10\. Logs persist correctly in deployment/Docker configuration.



Document missing observability such as:



\* no metrics;

\* no health checks;

\* no structured logs;

\* no slow-query visibility;

\* no frontend error reporting.



\---



\# 14. Recommendation system — critical requirement



The recommendation system must be tested and improved in the implementation plan.



\## Absolute UI rule



Under no circumstances may the product recommendation section display messages such as:



```text

Нет похожих товаров

Похожие товары не найдены

Рекомендации отсутствуют

```



or any equivalent empty-notification text under a product.



The recommendation section must never expose recommendation failure to the customer.



\## Required recommendation fallback strategy



Inspect the current recommendation algorithm and document the exact implementation needed.



The expected fallback chain should be similar to:



```text

1\. Products from the same category with matching important characteristics.

2\. Products from the same category and brand.

3\. Products from the same category in a similar price range.

4\. Popular/in-stock products from the same parent category.

5\. New or popular in-stock products from related categories.

6\. Globally popular in-stock products.

```



Adapt the final order to the actual catalog model.



Rules:



1\. Exclude the current product.

2\. Exclude inactive/deleted products.

3\. Prefer in-stock products.

4\. Avoid duplicates.

5\. Respect locale.

6\. Use main product image/no-photo fallback.

7\. Do not recommend products the public catalog cannot open.

8\. Return a stable limited count.

9\. Avoid returning the same product repeatedly through multiple fallback stages.

10\. Keep query performance acceptable.



\## Empty catalog edge case



If the entire catalog contains no other valid product:



\* hide the recommendation section silently;

\* do not display an empty-state notification;

\* do not leave a large blank section.



This is the only acceptable final fallback.



\## Test scenarios



Test recommendations for:



1\. Product with many similar products.

2\. Product with only same-category alternatives.

3\. Product in a rare category.

4\. Product with no same-brand alternatives.

5\. Product with no matching characteristics.

6\. Out-of-stock product.

7\. Product with no images.

8\. Product in accessories.

9\. Product in interior clocks.

10\. Product in wristwatches.

11\. Catalog with only one valid product.

12\. Locale switching.



\## Recommendation audit report



Create dedicated issues using `REC-xxx`.



Include:



\* current algorithm;

\* current endpoint/query;

\* current failure behavior;

\* duplicates;

\* availability handling;

\* category correctness;

\* performance;

\* fallback design;

\* frontend section behavior;

\* exact files to change.



The Codex Code implementation prompt must make this recommendation fix a high-priority task.



\---



\# 15. Automated test gaps



Identify missing automated tests.



Recommend specific tests for:



\## Backend



\* service tests;

\* repository tests;

\* controller/integration tests;

\* authorization tests;

\* validation tests;

\* recommendation tests;

\* CMS idempotency tests;

\* image upload tests;

\* cache eviction tests.



\## Frontend



\* component tests;

\* hooks;

\* API mappers;

\* localStorage services;

\* recommendation rendering;

\* locale switching;

\* error/empty/loading states.



\## E2E



Recommend or add a plan for Playwright/Cypress scenarios:



\* public shopping flow;

\* CRM product creation;

\* image upload;

\* CMS publish to public page;

\* review moderation;

\* request processing;

\* recommendation fallback;

\* mobile catalog overlays.



Do not add a large new testing framework during the audit unless already available or clearly justified.



\---



\# 16. Codex Code implementation prompt



Create:



```text

docs/tasks/vympel\_full\_system\_audit/CODEX\_CODE\_IMPLEMENTATION\_PROMPT.md

```



This must be a complete implementation-ready prompt for the next Codex Code agent.



It must include:



1\. Mandatory files to read.

2\. All issue IDs.

3\. Priority order.

4\. Exact files/classes/components/endpoints where possible.

5\. Root-cause explanations.

6\. Concrete fixes.

7\. Database migrations required.

8\. Backend changes.

9\. Frontend changes.

10\. CRM changes.

11\. CMS changes.

12\. Recommendation system improvements.

13\. Performance optimizations.

14\. Security fixes.

15\. Test additions.

16\. Screenshot references.

17\. Acceptance criteria.

18\. Regression risks.

19\. Required finite verification commands.

20\. Required documentation updates.



\## Priority order for the implementation prompt



\### Priority 1 — Critical



\* runtime crashes;

\* security/authorization failures;

\* data corruption or source-of-truth conflicts;

\* broken product creation/images;

\* stale CRM data;

\* CMS not reflected publicly;

\* database/migration failure;

\* recommendation system empty/failure behavior;

\* broken checkout/cart/favorites;

\* infinite loops.



\### Priority 2 — High



\* filters/search/sorting/pagination;

\* reviews/moderation;

\* localization;

\* caching;

\* mobile overlays;

\* responsive breakage;

\* logging errors.



\### Priority 3 — Medium



\* performance;

\* UX consistency;

\* spacing;

\* typography;

\* icons;

\* code cleanup.



Do not create a vague prompt such as “fix all issues”.



Every important fix must reference its issue ID and evidence.



\---



\# 17. Final audit report



Create:



```text

docs/tasks/vympel\_full\_system\_audit/FULL\_SYSTEM\_AUDIT\_REPORT.md

```



Required sections:



```markdown

\# Executive summary



\# Environment and services tested



\# Test coverage and limitations



\# Critical issues



\# Backend findings



\# Database findings



\# Public frontend findings



\# CRM findings



\# CMS findings



\# Recommendation system findings



\# Security findings



\# Performance findings



\# UI/UX findings



\# Responsive findings



\# Logging and observability



\# Automated test gaps



\# Optimization opportunities



\# Issues blocked or not reproducible



\# Recommended implementation order



\# Final readiness assessment

```



Do not claim the application is production-ready unless the evidence supports it.



Use an honest readiness classification:



```text

NOT READY

READY WITH CRITICAL FIXES

READY WITH HIGH-PRIORITY FIXES

READY FOR STAGING

READY FOR PRODUCTION

```



Explain the reason.



\---



\# 18. Screenshot index



Create `SCREENSHOT\_INDEX.md`:



```markdown

| Screenshot | Issue ID | Application | Route | Viewport | State | What it proves |

```



Every screenshot referenced in any report must appear here.



\---



\# 19. Completion criteria



This task is complete only when:



1\. Backend has been tested or explicitly marked blocked.

2\. Database and migrations have been inspected.

3\. Public frontend critical flows have been tested.

4\. CRM critical flows have been tested.

5\. CMS save-to-public flow has been tested.

6\. Recommendation system has been tested.

7\. Security audit has been performed.

8\. Performance bottlenecks have been investigated.

9\. UI has been checked across required viewports.

10\. UI problems have screenshots.

11\. All issues have IDs, severity, evidence, causes, fixes, and acceptance criteria.

12\. The full report has been created.

13\. The Codex Code implementation prompt has been created.

14\. Temporary servers/processes have been stopped.

15\. No temporary test credentials or secrets were committed.

16\. No unrelated production-code changes remain.



\---



\# 20. Final response format



```markdown

Audit summary:

\- \[applications/services tested]

\- \[number of scenarios]

\- \[number of PASS/FAIL/BLOCKED]

\- \[number of issues by severity]



Critical findings:

\- \[issue IDs and brief descriptions]



Recommendation system:

\- \[current behavior]

\- \[fallback issues]

\- \[required implementation]



Screenshots:

\- `docs/tasks/vympel\_full\_system\_audit/screenshots`

\- \[number created]



Reports created:

\- `FULL\_SYSTEM\_AUDIT\_REPORT.md`

\- `TEST\_MATRIX.md`

\- `API\_TEST\_REPORT.md`

\- `DATABASE\_AUDIT.md`

\- `PERFORMANCE\_AUDIT.md`

\- `SECURITY\_AUDIT.md`

\- `UI\_UX\_AUDIT.md`

\- `SCREENSHOT\_INDEX.md`



Implementation prompt:

\- `CODEX\_CODE\_IMPLEMENTATION\_PROMPT.md`



Readiness:

\- \[classification and explanation]



Blocked checks:

\- \[anything that could not be tested]



Source changes:

\- \[confirm no unrelated production changes remain]



Process cleanup:

\- \[confirm temporary servers and test processes were stopped]



Next step:

\- Codex Code should implement the generated prompt issue-by-issue in priority order.

```



Be thorough, specific, and honest.



The purpose of this task is not to create the impression that everything works. The purpose is to prove what works, identify what does not, and produce an implementation-ready correction plan.

