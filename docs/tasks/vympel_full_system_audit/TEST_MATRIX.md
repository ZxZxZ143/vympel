# Test Matrix

Audit date: 2026-07-16. Implementation evidence current through 2026-07-17 Step 7.

| Area | Scenario | Method | Result | Issue / note |
| --- | --- | --- | --- | --- |
| Backend | Unit, context, HTTP lifecycle, and disposable Redis/PostgreSQL tests | Gradle, Java 17 | PASS | 34 suites / 139 tests: 138 passed and the opt-in external rehearsal test skipped in the ordinary suite; it passed separately against both the restored copy and live DB. |
| Public frontend | Vitest / lint / typecheck / production build / status integration | npm scripts | PASS | 5 files / 14 tests, full ESLint, typecheck, and production build passed; Step 7 intentionally changed no public behavior. |
| CRM | Vitest / lint / production build | npm scripts | PASS | 5 files / 19 tests, full ESLint, and production build passed; stable-code localization and prior auth/CMS contracts remain covered. |
| Dependencies | Production dependency advisory scan | npm audit in both Next apps | PASS | 0 advisories. |
| API | Public ping and request correlation | HTTP | PASS | Request ID present. |
| API | Invalid auth / input / bounds | HTTP + handler tests | Historical PASS with API-002 exception | At audit time malformed input was 400/unauthenticated 401 while sort stayed permissive; the Step 8 matrix below supersedes the sort exception. |
| API | 400/401/403/404/500 semantics | Handler/service tests | PASS | Dedicated tests cover validation/malformed payload, authentication, authorization, domain absence, persistence failure, request ID, and no SQL/stack-trace leakage. |
| API | Public product missing | Bounded production-jar HTTP | PASS | API-001 fixed: now 404; historical result was 400. |
| API | Unknown category | Bounded production-jar HTTP | PASS | API-001 fixed: now 404; historical result was 500. |
| API | Public review create | Disposable HTTP + DB cleanup | PASS | Created PENDING review, removed. |
| API | Public request create | Disposable HTTP + DB cleanup | PASS | Created NEW request, removed. |
| API | Public analytics create | Disposable HTTP + DB cleanup | PASS | Event persisted, removed. |
| Auth | Unauthenticated CRM access | HTTP | PASS | Protected endpoints returned 401. |
| Auth | MANAGER role boundaries | Disposable role/token + CRM client test | PASS | ADMIN-only users request returns 403; same access token still reaches `me`; client preserves session and shows localized forbidden feedback. CRM-001 resolved. |
| Auth | ADMIN role boundaries | Disposable role/token | PASS | CMS/users available to ADMIN. |
| Auth | Session renewal | Unit/client + finite random-port HTTP lifecycle | PASS | Access-only JSON, cookie rotation, single-flight retry, replay family invalidation, logout, role/status revocation, and cleanup passed. AUTH-001 resolved. |
| Auth | JWT contract | Unit tests | PASS | Issuer/audience/type/subject/jti/iat/exp and bounded skew enforced; access/refresh type confusion and expiry rejected. |
| Auth | Refresh cookie and CSRF model | Unit + HTTP | PASS with production prerequisite | Host-only HttpOnly path-scoped SameSite=Lax cookie; exact Origin/Referer; wildcard fails closed. Production must set Secure=true and stay same-site. |
| CMS | Create / repeated update / publish / public read / unpublish / delete | Disposable ADMIN flow + service/outbox tests | PASS | Content commit is independent from durable, explicit revalidation outcome; deployment URL/secret remains a release prerequisite. |
| CMS | Translation uniqueness | DB query after repeated update | PASS | Exactly one ru/kk/en row. |
| CMS | Media lifecycle | Unit/integration + configured-DB dry run | PASS with operational hold | All six references, grace, retry, storage-first deletion, stale claim recovery, and upload spoof rejection pass. Dry run: 24 rows, 5 eligible, 0 deleted pending target proof. |
| CMS | Durable public revalidation | Backend/public/CRM tests + production Next HTTP | PASS with deployment prerequisite | Outbox/retry/partial success pass; signed route returned 200, bad signature 401, replay 409; deployed authenticated rendered-page check remains. |
| Database | Liquibase history and lifecycle/outbox/integrity migrations | Configured PostgreSQL + disposable PostgreSQL 16 container + restored live-data copy | PASS | Fresh chain, restored-copy rehearsal, and forced live migration passed; 76 changesets and lock clear. |
| Database | Core invariants | SQL + direct invalid writes + concurrency | PASS | DB-001/DB-002/DATA-001/DATA-002 resolved; seven new constraints, six `SET NULL` CMS media FKs, and zero dirty invariant rows. |
| Public routes | 12 routes × 3 locales | HTTP | PASS | 36/36 returned 200. |
| Public 404 | Unknown path/product/category/brand | Production HTTP + HTML | PASS | WEB-001 fixed: real 404 plus localized content; unknown path checked in ru/kz/en. |
| Public 404 | Temporary backend failure | Production HTTP + HTML | PASS | Simulated backend 500 is not converted into a false 404. |
| Recommendations | Many-alternative category | Live API + backend regression tests | PASS | Product 28 returned 12 unique active alternatives; current product excluded and in-stock ordering preserved. |
| Recommendations | Rare category / accessory | Live API + frontend regression tests | PASS | Products 43/44 and image-less product 45 returned valid alternatives before Step 7; product 45 is now DRAFT. Regression tests retain the silent non-empty/omission contract. |
| Recommendations | Request failure / true catalog exhaustion | Backend + frontend regression tests | PASS | Timeout/internal failure and zero valid alternatives return/render no recommendation section; no heading, empty/error text, or retry control is emitted. |
| Security | CORS allowlist | Preflight | PASS | Trusted accepted, untrusted rejected. |
| Security | Output safety / request IDs | HTTP + logging tests | PASS | Safe JSON bodies, correlation IDs, and no stack trace or SQL detail in 404/500 responses. |
| Security | Abuse resistance | Unit/integration/live HTTP | PASS | SEC-001 resolved: endpoint-specific global/source/identity/content controls, login backoff, deduplication, and safe 429/503 contracts. |
| Security | Distributed limiter semantics | Two Redis clients + concurrency/TTL | PASS | Atomic shared capacity/window passed; disposable Redis removed. |
| Security | Forwarded identity spoofing | Unit + live HTTP | PASS | Only trusted numeric proxy CIDRs can supply bounded `X-Forwarded-For`; untrusted spoof stayed in the direct-peer bucket. |
| Security | Runtime secret guard | Startup initializer tests + production JAR | PASS | SEC-002 resolved: strict TLS production-like config passed validation; live placeholder exited 1/no port; live full stack used explicit test-only loopback exceptions and served ping 200; no path leaked values. |
| Security | 429 client UX | Public/CRM Vitest + build | PASS | Body/header cooldown parsed; forms/login preserve input, disable bounded retry, localize RU/KZ/EN, and do not auto-retry. |
| Security | Browser response headers | HTTP | FAIL | SEC-003. |
| Security | Analytics privacy | Schema/source inspection | FAIL | SEC-004. |
| Performance | Warm endpoint timing | Repeated local HTTP | PASS for current tiny data | Not a scale proof. |
| Performance | Query plans | PostgreSQL EXPLAIN ANALYZE | PASS for current 19 products | PERF-001 remains structural. |
| Performance | Catalog filters | Source inspection | FAIL at scale | PERF-001. |
| Performance | Favorites/cart refresh | Source inspection | FAIL at scale | PERF-002. |
| Performance | Static assets | File inventory | FAIL | PERF-003: 40.48 MB / 46 files. |
| Logging | File routing / rotation / masking | Tests + config + runtime files | Historical PASS | Expected 404 lookup identifiers had zero `error.log` matches and unexpected failures remained ERROR; the originally open OBS-001/OBS-002 are closed in the Step 8 matrix below. |
| Responsive UI | Source breakpoints / overflow guards | CSS and component inspection | PASS source-level | Runtime proof blocked. |
| Responsive UI | Required viewport interactions and screenshots | In-app browser | BLOCKED | BLOCK-UI-001. |
| Cleanup | Disposable rows/users/processes/containers | SQL + process/port/container verification | PASS | Auth fixtures cleaned; disposable PostgreSQL/Redis containers removed; task JVM stopped, port 18084 closed, task logs removed; only pre-existing MinIO remained. |

## Finite verification commands used

- Backend: the repository Java 17 `.\gradlew.bat test` command documented in `PROJECT_MAP.md`; the complete suite passed 109/109 across 28 suites. `RedisRateLimitStoreIntegrationTest` proved shared atomic capacity/TTL across two clients; `CrmAuthLifecycleIntegrationTest` proved real HTTP login backoff, non-CRM role-safe failure, and analytics deduplication; disposable services/fixtures were cleaned.
- Step 4 live HTTP: a task-owned test-profile jar on temporary port 18084 used low direct Spring policy overrides. Search returned `200,200,429`; invalid request `400,429`; invalid review `400,429`; invalid analytics `400,400,429`; invalid CRM login `401,401,429`. Spoofed forwarding did not bypass, all 429 bodies/headers correlated safely, no write rows were created, and the exact process/logs/port were cleaned.
- Step 4 startup HTTP: the production-profile JAR rejected a placeholder probe with exit 1/no port/no value echo, then started against disposable loopback PostgreSQL/Redis with complete synthetic values and explicit test-only localhost/insecure-transport exceptions, returning ping 200. Strict TLS/non-local endpoint configuration passed the validator matrix. The JVM, both containers, ports, and logs were removed; only pre-existing MinIO remained.
- Public: `npm run test` (6/6), `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:production-status` passed. The last command asserted status plus localized body content on isolated ephemeral processes and verified cleanup. The audit baseline dependency scan remains recorded.
- REC-001 live API: a production backend jar was started on temporary port 18081, products 28/43/44/45 were checked through the public endpoint, and the exact JVM was stopped; the port was confirmed closed.
- CRM: `npm test` (15/15), `npm run lint`, and `npm run build` passed; the audit baseline dependency scan remains recorded.

## 2026-07-17 Step 5 CMS delta

- Backend: 31 suites / 123 tests passed with zero failures, errors, or skips after adding CMS lifecycle, concurrent-reference compensation, outbox/revalidation, upload-content, security-config, and migration coverage. The focused configured-DB dry run passed in 25 seconds and printed `totalRows=24 candidates=5 pageItems=5`; it asserted the row count was unchanged.
- Public: 3 Vitest files / 9 tests, lint, typecheck, and production build passed. The bounded production revalidation HTTP probe produced 200/401/409 for success/bad-signature/replay and closed port 3117.
- CRM: 4 Vitest files / 17 tests, TypeScript no-emit check, lint, and production build passed. Added feedback tests distinguish successful content with pending retry from successful content with terminal/not-configured cache failure.
- Migration: disposable PostgreSQL 16 full-chain rehearsal covered the lifecycle columns/checks/indexes, revalidation outbox, media preservation, and six-slot reference detail. No migration or reconciliation test deleted a media row or object.
- Remaining release checks: inject the production URL/matching server-only secret, run an authenticated CMS mutation to a production-rendered page, and verify each of the five dry-run candidates in MinIO plus CRM/public previews before any cleanup deletion.

## 2026-07-17 interrupted-session recovery delta

- Re-inventory confirmed that all anonymous auth/write routes and the required expensive public reads remain mapped to the single early rate-limit architecture; no duplicate implementation or Liquibase change was needed.
- The current task-owned live matrix on port 18086 reproduced quick `200,200,429`, request `400,429`, review `400,429`, analytics `400,400,429`, and CRM login `401,401,429`; an untrusted spoofed forwarding address did not escape the quick-search bucket.
- A current production-profile placeholder probe exited 1 before port 18087 opened and named only the JWT configuration rule. The probe value did not appear in output.
- Cleanup recheck: ports 18086/18087 closed, task stdout/stderr removed, no task Redis/PostgreSQL container remained, no database rows were created by invalid live writes, and only the pre-existing Java/containers remained.

The matrix distinguishes reproducible failures from blocked runtime-visual checks; a blocked check is not counted as a pass.

## 2026-07-17 Step 7 database integrity delta

- Preflight found zero negative price/stock, media-position duplicates, invalid main positions, and invalid CMS references; it found only the exact About 30/30/30 group and audited image-less ACTIVE product 45.
- PostgreSQL 16 full-chain tests assert the seven new constraints, preserved partial main-image index, all six CMS `SET NULL` FKs, About 10/20/30, zero ACTIVE-without-main rows, direct invalid-write rejection, and concurrent stock/media/CMS invariants.
- A 74-change-set live dump restored to a disposable database migrated to 76 changesets and passed direct negative price/stock and duplicate CMS-order rejection before the forced live migration ran.
- Live postflight: seven Step 7 constraints, six reusable-media `SET NULL` FKs, lock clear, product 45 DRAFT, About 10/20/30, and zero negative price/stock, ACTIVE-without-main, duplicate media order, invalid main position, or duplicate CMS order rows.
- Backend uncached full suite: 34 suites / 139 tests, zero failures/errors, one expected skip for the environment-gated external rehearsal (run separately twice). CRM: 19/19. Public: 14/14. Both Next apps passed lint/build; public typecheck also passed.
- Cleanup verification reported zero remaining task rehearsal databases and no remaining temporary dump; no user-owned service or pre-existing MinIO container was stopped.

## 2026-07-17 Step 6 performance delta

- Backend full suite passed 33 suites / 127 tests with zero failures, errors, or skips after the catalog facet/summary repositories, batch-summary service/controller, recommendation shared hydration, metrics, and updated bounded-query tests. Focused coverage includes fixed facet repository-call count as option count grows; no product entity `findAll`/per-option `count`; batch input validation at empty/60/61/non-positive and 4 KiB declared-body boundaries, deduplication, first-occurrence order, locale, missing IDs, price/stock/image mapping; recommendation three-step maximum, stage fallback, deduplication, inactivity, ordering, and silent failures.
- Public full Vitest passed 5 files / 14 tests. New tests prove one batch POST for deduplicated collection IDs, 60-ID client cap, simultaneous identical request coalescing, batch-to-local snapshot mapping, and unavailable marking without identity loss. Existing recommendation tests continue to prove non-empty rendering and complete empty/error/forbidden-copy omission. Public lint, TypeScript no-emit, and the Next production build passed.
- A disposable PostgreSQL 16 full-chain database held 600 varied products. Live SQL logging verified catalog base 3 queries, category-filtered catalog 5 including two category-context reads, generic/wrist/interior/accessory facets 1/4/4/3, quick search 2, batch 1, and recommendations at most 3. Response byte sizes for catalog/facet fixtures matched baseline.
- The local 8-sample-after-3-warmup benchmark recorded p50/p95 improvements documented in `PERFORMANCE_AUDIT.md`; it used SQL logging and is comparative evidence only. `EXPLAIN (ANALYZE, BUFFERS)` did not justify a new index or migration.
- CRM source was unaffected by Step 6. Its prior finite Step 5 results remain current; no Step 6 CRM behavior or contract changed.

## Step 8 finite verification - 2026-07-19

| Area | Command/evidence | Result |
| --- | --- | --- |
| Backend complete | `vympel_back/.\gradlew.bat test` | PASS, full suite, 1m20s; includes Liquibase, retention, probes, sort/error, security, and existing regressions. |
| Backend artifact | `vympel_back/.\gradlew.bat bootJar` | PASS, executable Spring Boot JAR assembled in 7s. |
| Backend focused integration | `--tests com.shop.vympel.controllers.CrmAuthLifecycleIntegrationTest` | PASS, 41s; includes expired/current analytics retention and omitted/blank/case-invalid sort. |
| Public unit/integration | `vympel_front/npm test` | PASS, 7 files / 20 tests; telemetry 5, sort config 1, and existing suites. |
| CRM unit/integration | `vympel_crm/npm test` | PASS, 6 files / 23 tests; telemetry 4, API client 10, localization/auth/CMS. |
| Public static quality | `npm run lint`, `npm run typecheck`, `npm run build` | PASS; 32 production routes generated, including `/api/telemetry`. |
| CRM static quality | `npm run lint`, `npm run build` | PASS; 17 production routes generated, including `/api/telemetry`. |
| Header unit policy | Both `npm run test:security` | PASS, 3/3 each; enforced/report-only/local-prod matrix. |
| Public production HTTP | `npm run test:production-status` | PASS; headers on HTML/static/API/public file; status/localization matrix; ports/processes cleaned. Route totals: 1,763,786 B home, 1,446,622 B catalog, 1,496,590 B product. |
| CRM production HTTP | `npm run test:production-headers` | PASS; HTML/static/API headers and cleanup. |
| Assets/bundles | `vympel_front/npm run test:budgets:ci` | PASS; detector self-test, 7.33/24.00 MiB public, 1.26/1.65 MiB public JS, 1.06/1.40 MiB CRM JS. |
| Image integrity | optimizer validation plus Pillow decode/dimension inventory | PASS; 46 images decode and 25 conversions preserve dimensions. |
| Accessibility i18n | locale parse/message tests, build/typecheck, hard-coded-label search | PASS for source architecture; physical screen-reader/locale-switch smoke deferred to Step 9. |

No long-running verification process remains. Temporary mock APIs/Next servers used ephemeral ports and their scripts verified port closure. No analytics test row or telemetry event was written to a user-owned runtime database/log sink: backend integration used its isolated test database, and telemetry remained disabled during production probes.

## Step 9 Final Reconciliation - 2026-07-19

Final reruns passed: backend 36 suites/149 tests with 0 failures/errors and 1 skip; public lint/typecheck, 8 files/23 tests, 32-page production build, status/security/budget gates; CRM lint/typecheck, 6 files/23 tests, 17-page build, header/security/budget gates. Both full npm audits are zero. Clean and upgrade migration rehearsals pass their current invariants. axe 4.12.1 reports zero violations on four representative pages. Exact commands/evidence and limitations are in `../vympel_final_release_verification/FINAL_TEST_MATRIX.md`.
