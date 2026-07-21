# Vympel Full System Audit — Initial Testing Plan

Date: 2026-07-16

Testing plan:

- **Applications/services to inspect:** Spring Boot backend (`vympel_back`), PostgreSQL schema and Liquibase history, MinIO/S3 configuration, public Next.js storefront (`vympel_front`), protected Next.js CRM (`vympel_crm`), CMS save/public-read path, analytics, logging, and the product-page/favorites recommendation surfaces.
- **Required local dependencies:** Java 17, Gradle wrapper, Node.js/npm with the checked-in lockfiles, PostgreSQL at the configured local test database, disposable Testcontainers Redis for SEC-001 shared-counter verification, and MinIO only for bounded upload/media scenarios. Existing processes are treated as user-owned until their command lines and listeners are identified; only audit-started processes will be stopped.
- **Existing automated tests:** backend JUnit/Spring tests through `gradlew.bat test`; public frontend finite `lint`, `typecheck`, and `build`; CRM finite `lint` and `build`. No established frontend component or E2E test suite is documented, so browser scenarios will be recorded as executed, partial, or blocked rather than overstated.
- **Critical business flows:** public product/catalog/search/filter/sort/pagination, product detail/reviews/recommendations, cart/favorites persistence and limits, public request submission, CRM login/protected access, product create/edit/price/stock/image flows, review moderation, request processing, analytics, CMS repeated save/publish/public freshness, and locale switching (`ru`, `kz`, `en`).
- **Security areas:** server-side route authorization and role boundaries, invalid/expired JWT behavior, public exposure, input and sort validation, upload type/extension/size/ownership checks, XSS-sensitive content rendering, CORS/CSRF assumptions, rate limiting/spam exposure, secrets/default configuration, safe error responses, request IDs, dependency advisories, and sensitive logging.
- **Database areas:** Liquibase ordering and checksum state; constraints, foreign keys, nullability, enum consistency, cascade/orphan risks, canonical price/stock/status/image/review/CMS sources, one-main-image and one-translation invariants, stale rows, indexes, query shapes, and safe local `EXPLAIN` evidence where access is available.
- **UI viewports:** public at 1920x1080, 1440x900, 1280x800, 1100x800, 1024x768, 1000x800, 900x800, 768x1024, 430x932, 414x896, 390x844, 375x812, 360x800, and 320x568; CRM at 1440x900, 1280x800, 1024x768, and 768x1024. Screenshots will be saved only for meaningful defects or evidence gaps.
- **Performance areas:** Next build output and route rendering modes, large/static image inventory, repeated API calls, cache/revalidation behavior, client boundaries, localStorage work, API pagination caps, repository/entity-fetch patterns, recommendation fallback query design, analytics aggregation, database indexes/query plans, logging overhead, and missing observability.
- **Safe execution order:** complete static inventory; run finite tests/builds and dependency checks with captured logs; inspect/query the local database read-only; identify existing listeners; start only missing services as managed bounded processes; run API and browser scenarios; stop only audit-started processes; synthesize evidence and issue IDs; verify reports, screenshots, documentation, and process cleanup.

Scope guard: this pass will not broadly modify production code or data. Any mutation scenario will use disposable local/test records only when credentials and cleanup are demonstrably safe; otherwise it will be marked blocked or supported by source-level evidence.

## Completion record

- Static inventory, finite tests/builds/advisory scans, HTTP/API probes, role tests, database/Liquibase queries, CMS mutation/public-read flow, performance timing/query plans, logging inspection, and report synthesis were completed.
- Disposable users, activities, CMS block, review, customer request, and analytics rows were removed and verified absent.
- No audit-started long-running process exists; the already-running services remained user-owned.
- Runtime browser viewport interaction and screenshot capture is the only planned phase blocked by tooling (`BLOCK-UI-001`); it is not counted as passed.
- Production source code was not modified. Audit/report documentation and project memory were the only repository changes.
