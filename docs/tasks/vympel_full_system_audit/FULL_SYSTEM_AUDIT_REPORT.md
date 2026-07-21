# Vympel Full System Audit

Audit date: 2026-07-16. Audience: technical implementation and release stakeholders.

# Executive summary

Vympel is **NOT READY** for production release. REC-001, API-001, WEB-001, CRM-001, AUTH-001, SEC-001, SEC-002, Step 5 CMS lifecycle/revalidation, and Step 6 PERF-001/PERF-002/PERF-004 are regression-verified. Sensitive public/auth routes have distributed endpoint-risk-specific controls; insecure non-local configuration fails before startup; CMS media now has a reference-safe lifecycle; catalog/collection/recommendation query counts are bounded. The current finite backend suite passes 33 suites / 127 tests. Remaining blockers/debt include target verification before deleting five CMS candidates, a deployed CMS-to-rendered-page check, browser security headers, analytics retention/minimization, PERF-003 static assets/production concurrency measurement, and blocked current visual evidence.

The original audit reproduced the critical recommendation defect in product 45's Russian HTML. The implementation now uses a dedicated seven-stage, deduplicated, in-stock-first backend contract and renders no recommendation section on true exhaustion, timeout, or internal failure. Live public API verification for products 28, 43, 44, and 45 passed before Step 7 narrowly demoted image-less product 45 to DRAFT; current responsive/browser screenshot certification remains pending under `BLOCK-UI-001`.

Evidence quality is high for code, API, database, CMS, auth, logging, and finite checks. It is incomplete for current visual/responsive certification: the mandatory in-app browser controller could not bootstrap, so no current screenshots are claimed. This limitation must be closed during implementation before release.

# Environment and services tested

| Component | Tested state |
| --- | --- |
| Backend | Spring Boot 4.0.2, Java 17, local port 8080 |
| Database | PostgreSQL 18.1, local port 5432, 50 public tables after Step 3 refresh-session migration |
| Object storage | Local MinIO ports 9000/9001 reachable; Docker control unavailable |
| Abuse state | Disposable Redis 7.4 integration plus bounded local test mode; production requires shared TLS Redis |
| Public frontend | Next.js 16.1.3 / React 19, local port 3000 |
| CRM/CMS UI | Next.js 16.1.3 / React 19, local port 3001 |
| Locales | ru, kz, en |
| Data baseline | 19 products, 24 reviews, 5 CMS pages, 137 analytics events, 3 users |

The running services existed before the audit and were treated as user-owned; none was stopped or replaced. No new long-running process was started.

# Test coverage and limitations

- Backend: 28 suites / 109 tests passed, including all previous coverage plus limiter concurrency/cardinality/TTL/failure/proxy/backoff/persistence/startup tests, a two-client disposable Redis rehearsal, real HTTP login backoff, and real HTTP analytics deduplication with cleanup.
- Public: 2 Vitest files / 6 tests, full ESLint, typecheck, production build, and the finite production status/content matrix passed; request/review/search cooldown UI and retry parsing are covered.
- CRM: 3 Vitest files / 15 tests, lint, and production build passed; login cooldown parsing/localization and refresh-429 access-session preservation are covered.
- API: public/CRM reads, invalid inputs, size bounds, CORS, MANAGER/ADMIN roles, public review/request/analytics writes, and CMS mutation/public visibility were exercised.
- Database: schema, constraints, indexes, cardinalities, invariants, Liquibase state, orphan data, and representative query plans were inspected.
- UI: 36 valid public route/locale combinations were requested; rendered HTML and responsive source were inspected.
- Limitation: no current desktop/tablet/mobile screenshots or browser interactions due `BLOCK-UI-001`. Image upload and full browser-driven product CRUD therefore remain integration-test gaps.
- Measurements are local-development observations with 19 products, not production load or real-user performance certification.

# Critical issues

## REC-001 — Recommendation empty/failure behavior violates the absolute customer UI rule (resolved)

- **Severity:** Critical
- **Status:** Implemented and verified on 2026-07-16; manual responsive/browser QA remains pending under `BLOCK-UI-001`.
- **Historical evidence:** Product 45 visibly rendered the forbidden empty text; product-page source had only a same-category lookup and visible `ErrorState` / `EmptyState` branches.
- **Root cause:** No backend recommendation algorithm or fallback endpoint existed.
- **Fix:** Implemented the staged recommendation service, bounded public endpoint, typed frontend client, and silent conditional recommendation component specified in `RECOMMENDATION_AUDIT.md`.
- **Acceptance criteria:** Every product receives alternatives whenever any valid alternative exists anywhere in the public catalog; failures/true global emptiness hide the whole section silently; current/inactive/duplicate products never appear; required scenario tests pass.
- **Verification:** Service/controller and frontend regression suites passed. Finite live public endpoint checks returned 12 unique active alternatives for products 28/43/44/45, excluded each source product, and preserved in-stock-first ordering. Non-empty resolution is bounded to three SQL queries independent of the 12-item limit.

# Backend findings

## API-001 — Missing resources return inconsistent 400 and 500 responses (resolved)

- **Severity:** High
- **Status:** Implemented and verified on 2026-07-16.
- **Historical evidence preserved:** A missing public product returned 400 and an unknown category returned 500 because expected absence used validation/JPA persistence exceptions.
- **Root cause:** Expected lookup absence was represented by `IllegalArgumentException`, `EntityNotFoundException`, or deferred entity references and therefore entered validation or database-failure mappings.
- **Fix:** Added `ResourceNotFoundException`; changed requested product/category/brand/review/request/CRM-user/CMS/reference lookups to use it; mapped it to the existing safe `ApiErrorResponse` as 404 with `requestId`. Validation remains 400, authentication 401, authorization 403, and unexpected/persistence failure 500.
- **Files changed:** backend domain exception, `GlobalErrorHandler`, relevant product/category/catalog/review/request/CRM/CMS/storage/reference services and mapper, plus handler/service tests.
- **Verification:** Java 17 full suite passed 56/56. A bounded production-jar matrix returned valid ping/product 200, malformed product id 400, unauthenticated CRM 401, missing product/category 404; all error bodies retained `requestId`, exposed no SQL/stack trace, and the expected 404 identifiers had zero matches in `error.log`.
- **Remaining risk:** The automated handler matrix covers 403 and simulated persistence 500; the live bounded run did not create new role/test-failure fixtures because Step 2 did not alter auth and the audited MANAGER 403 boundary already passed.

- **API-002 (Low):** unknown catalog sort silently falls back to newest.
- Backend input bounds, safe errors, role enforcement, review aggregation, and request correlation passed.
- Legacy `/api/admin/*` endpoints remain protected but overlap newer CRM routes; no immediate authorization failure was found. Consolidation should be considered only after usage inventory.

# Database findings

- Current rows satisfy price/stock/category/media/review translation invariants.
- **DB-001 (Medium, resolved 2026-07-17):** price, stock, media position uniqueness, and main-image position are protected by guarded DB constraints.
- **DB-002 (Medium, resolved/revalidated 2026-07-17):** all six reusable CMS media foreign keys use `ON DELETE SET NULL`, with stricter application reference checks.
- **DATA-001 (Low, resolved 2026-07-17):** About is 10/20/30 and page order is transactional, unique, and ten-step normalized.
- **DATA-002 (Low, resolved 2026-07-17):** ACTIVE requires a main IMAGE at position 0; product 45 is DRAFT and public no-photo fallback remains.
- Liquibase lock is clear; the configured chain includes the two Step 5 changesets. Step 5 has explicit rollback; older rollback debt remains.

# Public frontend findings

- All 12 representative routes returned 200 in all three locales, and `html[lang]`/viewport metadata matched.

## WEB-001 — Public missing pages render 404 UI with HTTP 200 (resolved)

- **Severity:** High
- **Status:** Implemented and verified on 2026-07-16.
- **Historical evidence preserved:** Unknown path, product, category, and brand pages rendered localized not-found content while returning HTTP 200.
- **Root cause:** The locale-wide `loading.tsx` introduced streaming before route absence was resolved; dynamic screens also handled missing data after descendant fetch/render work.
- **Fix:** Removed the locale-wide loading boundary, moved product/category/brand existence resolution into route owners, and call `notFound()` only for confirmed API 404 results. The existing localized `not-found.tsx` remains the UI; temporary backend failures stay on a non-404 safe error path.
- **Files changed:** localized product/catalog/brand route owners, catalog preloader and affected screen/component data handoff, deleted locale `loading.tsx`, and a finite production status-test script/package command.
- **Verification:** Production Next matrix asserted status and rendered content: valid home/product/category/brand 200; unknown route in ru/kz/en 404 with exact localized title; missing product, unknown category, and unknown brand 404; simulated backend 500 was not converted to 404. Owned processes and ephemeral ports were verified closed.
- **Remaining risk:** No sitemap or canonical generator exists in the current public repo; `notFound()` prevents missing pages from rendering route metadata. If sitemap/canonical generation is later introduced, it must reuse the same existence contract.

- **UI-001 (Low):** some accessible labels are hard-coded in English.
- Historical PERF-002 finding: cart/favorites persisted client state but refreshed one request per product. Step 6 replaced this with one capped batch-summary request while retaining failure-safe local state.
- Recommendation rendering now follows the resolved REC-001 silent-section contract; manual viewport confirmation remains blocked.

# CRM findings

## CRM-001 — A legitimate 403 response clears a valid CRM session (resolved)

- **Severity:** High
- **Status:** Implemented and verified on 2026-07-16.
- **Historical evidence preserved:** MANAGER correctly received 403 for CMS/users, but the shared client cleared session on both 401 and 403.
- **Root cause:** Authentication failure and authorization denial are conflated in the shared client.
- **Implemented fix:** `crmFetch` preserves access state on 403 and emits localized RU/KZ/EN forbidden feedback. Admin-only navigation uses shared permission helpers, and direct admin-only routes render a forbidden state without redirecting or logging out. Unexpected 5xx/network errors retain the session and expose a retryable state.
- **Acceptance criteria:** MANAGER remains signed in after a forbidden ADMIN-only request; ADMIN access still works; expired/invalid auth still routes to login; unit/integration tests cover 401 versus 403.
- **Verification:** CRM tests prove 403 preserves the access token, emits no expiry event, and performs no refresh. The finite Spring HTTP sequence proves MANAGER users receive 403 on `/api/crm/users` and can immediately call `/api/crm/auth/me` with the same access token. Backend security returns 401 for invalid/expired access and 403 only for authenticated role denial.

## AUTH-001 — Refresh tokens are issued and stored but cannot refresh a session (resolved)

- **Severity:** High
- **Status:** Implemented and verified on 2026-07-16.
- **Historical evidence preserved:** Backend issued 15-minute access and 14-day refresh tokens, CRM stored both in sessionStorage, and no refresh endpoint or client lifecycle existed.
- **Root cause:** Token issuance was implemented without rotation/consumption/revocation lifecycle.
- **Architecture implemented:** Access JWT remains in CRM sessionStorage; refresh JWT is returned only as a host-only HttpOnly cookie scoped to `/api/crm/auth`, `SameSite=Lax`, and production-configured `Secure`. Current localhost ports and the required production topology are same-site. Cookie-authenticated refresh/logout additionally require an exact allow-listed Origin/Referer because Spring CSRF is otherwise disabled.
- **Backend implementation:** JWTs require issuer, audience, type, subject, jti, iat, and exp with bounded skew. `refresh_token_session` stores only SHA-256 jti hashes and family/replacement/revocation metadata. Rotation uses a pessimistic lock; reuse revokes the active family; logout is idempotent; role changes/user disable revoke active refresh sessions; current database roles and enabled status govern access; retired rows have scheduled cleanup.
- **CRM implementation:** Every request includes credentials. One module-scoped promise coalesces simultaneous 401s, refresh bypasses recursive interception, and each original request retries once. Cookie bootstrap avoids login-form flash. Failed server logout preserves local state; successful 204 clears it.
- **Acceptance criteria:** Sessions behave predictably after 15 minutes; only one retry occurs; revoked/expired/reused refresh tokens fail safely; tokens never appear in logs; auth tests cover rotation and logout.
- **Verification:** Unit/integration tests cover token type/expiry/issuer/audience, hash-only persistence, rotation, replay/family revocation, logout, disabled/no-role rejection, current roles, cookie attributes, exact origins, simultaneous 401 single flight, second-401 bound, bootstrap, and logout network failure. The finite HTTP sequence proves login -> me -> rotate -> replay rejection/family invalidation -> role/status revocation -> logout -> rejected refresh with disposable user cleanup.
- **Deployment prerequisite/risk:** Production must use HTTPS, `VYMPEL_CRM_REFRESH_COOKIE_SECURE=true`, exact non-wildcard CORS origins, and a same-site CRM/API topology. Cross-site deployment requires a new SameSite/CSRF design.
- **Migration recovery:** Both Liquibase changesets have explicit reverse-order rollback. Rolling back the table intentionally invalidates every CRM refresh session, so refresh traffic must be stopped/cookies expired and users must reauthenticate. PostgreSQL applies these DDL changes transactionally, and Hibernate validation fails startup rather than serving with a partial schema.

The backend MANAGER/ADMIN access matrix itself passed.

# CMS findings

## CMS-001 — Uploaded CMS media has no deletion or garbage-collection lifecycle (implemented; existing candidates retained)

- **Severity:** High
- **Status:** Code and schema resolved 2026-07-17; destructive reconciliation partially blocked pending target-environment MinIO/public/CRM proof
- **Evidence:** 7 of 24 `cms_media` rows are unreferenced by any main/localized/mobile media field. Upload creates object+row; block update/delete can orphan it; no media delete or GC path exists.
- **Root cause:** CMS media is modeled as reusable storage but lifecycle ownership and cleanup were never implemented.
- **Required fix:** Add reference queries, safe admin delete for unused media, object-store deletion with compensating/error handling, and scheduled/administrative orphan cleanup after a grace period. Never delete referenced media.
- **Acceptance criteria:** Replacing/deleting blocks does not leak indefinitely; dry-run orphan report is available; deletion removes DB/object atomically enough to retry; referenced media is protected; integration tests cover all media slots.
- **Regression risks:** False orphan detection can remove live content; include every reference column and a grace window.
- **Step 5 implementation:** Media ownership is explicitly reusable. All six default/localized/mobile slots are indexed, queryable, and normalized to `ON DELETE SET NULL`; application cleanup still refuses any referenced row. Uploaded OBJECT_STORAGE rows carry `ACTIVE`/`DELETE_PENDING`/`DELETE_FAILED`, grace/protection/orphan/delete-attempt/retry metadata. Detach events run after commit. ADMIN reference and paged dry-run endpoints are read-only; explicit/scheduled bounded cleanup locks and rechecks each row, deletes storage first, deletes the DB row only after storage success, retries failures with backoff, and recovers stale claims. `PUBLIC_PATH` is excluded. Upload validation now verifies actual image signatures/dimensions, and DTOs/logs do not expose object keys.
- **Current reconciliation:** The configured-DB dry run observed 24 rows and 5 currently eligible zero-reference candidates, then proved the row count unchanged. No candidate/object was deleted because this session could not verify those MinIO objects and every public/CRM preview path in the target environment. Use the new reference endpoint and managed visual/object checks before an ADMIN cleanup run.

## CMS-002 — Proactive public cache revalidation is not configured locally (implemented)

- **Severity:** Medium
- **Status:** Implemented and verified 2026-07-17; deployment must inject the documented URL and matching server-only secret
- **Evidence:** Every disposable CMS mutation returned cache refresh message `NOT_CONFIGURED`; backend URL/secret and frontend secret were blank. Direct public CMS API reflected publish/unpublish immediately; public Next pages otherwise rely on 30-second tagged caching.
- **Root cause:** Cross-service revalidation configuration is optional and absent in the tested environment.
- **Required fix:** Make staging/production revalidation URL+secret required, fail or alert clearly when missing, and add an integration probe from CMS mutation to public rendered page while retaining safe ISR fallback.
- **Acceptance criteria:** Published/unpublished content reaches a production-built public page within the documented target; invalid secrets fail; mutation response and logs identify refresh outcome without exposing secrets.
- **Regression risks:** Treating refresh failure as database rollback can make editors retry successful writes; expose partial success clearly.
- **Step 5 implementation:** Every CMS mutation writes a page-key-deduplicated `cms_revalidation_job` in the content transaction. Delivery occurs after commit and through a scheduled retry worker with locks, bounded attempts/backoff/timeouts, stale-claim recovery, safe request IDs, and outcome/latency logging. The backend signs version/timestamp/request UUID/page key with HMAC-SHA256. The public route bounds the body, timestamp, replay set, page-key allow-list, and signature, then expires only `cms:{pageKey}` plus known paths. Non-local startup rejects disabled/missing/weak revalidation configuration. CRM now distinguishes successful content persistence from SUCCESS, retry scheduled, not configured, and permanent cache outcomes with localized feedback. Thirty-second tagged ISR remains the safety net.
- **Freshness target:** Healthy configured delivery completes after commit and before the CRM mutation response returns, within the 3-second HTTP timeout. Transient failure is reported as partial success; default retry is due after 5 seconds and polled every 5 seconds, while `revalidate: 30` remains the independent fallback bound.
- **Verification:** Unit/integration tests cover success, wrong secret, unknown/expired input, targets, network retry, disabled/not-configured behavior, and migration/outbox state. A bounded production Next server returned 200 for a valid signed request, 401 for an invalid signature, and 409 for replay; the task process was stopped and port 3117 confirmed closed. A deployed authenticated CRM-to-rendered-page probe remains an environment release check, not a locally claimed pass.

CMS create, repeated update, translation merge, publish, public API visibility, unpublish, and delete passed.

# Recommendation system findings

REC-001 is implemented through `ProductRecommendationRepository`, `ProductRecommendationService`, `ProductRecommendationResponse`, and `GET /api/public/product/{lang}/{id}/recommendations`. Candidate selection applies stages 1–7 in one ranked SQL query, then batch-hydrates localized names, collection, main/fallback image, and approved rating aggregate. The product page starts this no-store request in its existing parallel data batch and renders the complete recommendation section only for non-empty results; failures are logged server-side and omitted from customer UI.

# Security findings

- **SEC-001 (High, resolved 2026-07-16):** layered Redis-backed limits, login backoff, public-write/analytics deduplication, trusted-proxy identity, safe 429/503, privacy-safe telemetry, and localized cooldown clients are implemented and verified.
- **SEC-002 (High, resolved 2026-07-16):** usable local defaults are isolated to explicit profiles; non-local startup rejects weak/missing/placeholder/local/insecure deployment configuration without printing values.
- **SEC-003 (Medium):** public and CRM responses omit baseline browser security headers.
- **SEC-004 (Medium):** raw IP and full user-agent analytics lack documented minimization/retention.
- Step 4 evidence after recovery: backend 109/109; live matrix search `200,200,429`, request `400,429`, review `400,429`, analytics `400,400,429`, CRM login `401,401,429`; automated real HTTP analytics returned `tracked=true` then `tracked=false` with one row; spoofed forwarding did not bypass and disposable runtime resources were removed.
- Passing controls: exact CORS allow-list, BCrypt, safe error JSON, role boundaries, text/link/upload validation, log masking, and the recorded zero-advisory dependency baseline.

# Performance findings

- **PERF-001 (High, RESOLVED Step 6):** the original catalog facet path repeatedly loaded/counted product scopes; fixed grouped projection queries now keep count independent of option cardinality.
- **PERF-002 (Medium, RESOLVED Step 6):** the original cart/favorites path made one detail request per item; one maximum-60 batch request now performs one SQL hydration.
- **PERF-003 (Medium):** 46 public assets total 40.48 MB; several individual assets exceed 2 MB.
- **PERF-004 (Medium, RESOLVED Step 6):** recommendations remain three bounded queries, now use shared hydration, emit metrics/slow logs, and stream independently from main content; production concurrency measurement remains a release exercise.
- Backend warm medians were 21–41 ms for sampled endpoints; the small dataset prevents scale conclusions.

# UI/UX findings

- REC-001 source and regression coverage now enforce silent complete-section omission; current viewport/browser confirmation remains part of `BLOCK-UI-001`.
- WEB-001 is resolved: status/content regression coverage now protects SEO/cache/monitoring semantics for missing public pages.
- UI-001 reduces localized screen-reader quality.
- Source shows good accessible-name coverage for gallery, favorites, cart, dialogs, navigation, filters, and carousel controls.

# Responsive findings

Public and CRM styles contain deliberate breakpoints, min-width guards, scroll wrappers, overlay width limits, responsive galleries, and reduced-motion handling. These are positive source signals only. Runtime tap/focus/keyboard/overflow/text-wrap behavior at required viewports is unverified due BLOCK-UI-001 and must not be described as passed.

# Logging and observability

- Dedicated log files, correlation IDs, masking, routing tests, size/time rotation, and retention caps passed inspection.
- **OBS-001 (Medium):** actuator health is 401, so an unauthenticated orchestrator cannot use it.
- **OBS-002 (Medium):** no public/CRM client error reporting, release correlation, Web Vitals, or end-to-end request tracing exists.
- API-001 is resolved: expected 404 control flow logs at INFO without stack traces and is not routed to the database/error log; unexpected failures remain ERROR with server-side context.

# Automated test gaps

## TEST-001 — Critical browser and cross-service flows lack automated regression coverage

- **Severity:** High
- **Status:** Confirmed
- **Evidence:** Backend now has 109 tests, CRM has 15 focused tests, and public has 6 focused tests plus the production status matrix. CRM auth and limiter behavior cross real Spring/Redis HTTP/storage boundaries, but browser E2E remains absent for product/image CRUD, CMS rendered-page freshness, moderation, request processing, and mobile overlays.
- **Root cause:** Test investment is backend-heavy and critical UI behavior is manually verified.
- **Required fix:** Add focused tests at existing layers first; introduce a bounded browser E2E suite only for cross-system critical paths. Include disposable data fixtures and deterministic cleanup.
- **Acceptance criteria:** CI catches REC-001, CRM-001, AUTH-001, WEB-001, CMS freshness, product image lifecycle, review/request workflow, and mobile overlay regressions; commands are finite and documented.
- **Regression risks:** Brittle selectors and shared mutable local data; use accessible roles/test IDs and isolated fixtures.

# Optimization opportunities

Prioritize query-count reductions and asset budgets backed by realistic data. Do not micro-optimize the current sub-millisecond PostgreSQL plans. Measure production builds, seeded scale, Web Vitals, cache hit/miss, recommendation stage/query counts, and public-write rates before/after each change.

# Issues blocked or not reproducible

- **BLOCK-UI-001:** current runtime screenshots and viewport interactions blocked by in-app browser bootstrap failure. No screenshot evidence was fabricated or borrowed.
- Full multipart product image CRUD was not mutated; service tests passed and MinIO was reachable.
- Docker management was inaccessible, but already-running local services were sufficient for HTTP/DB testing.
- No dependency vulnerability was reproducible in either production npm tree.

# Issue register

| ID | Severity | Area | Disposition |
| --- | --- | --- | --- |
| REC-001 | Critical | Recommendations/UI | Implemented and verified 2026-07-16; manual viewport QA pending |
| API-001 | High | Backend contract | Implemented and verified 2026-07-16 |
| WEB-001 | High | Public/SEO | Implemented and verified 2026-07-16 |
| CRM-001 | High | CRM auth UX | Implemented and verified 2026-07-16 |
| AUTH-001 | High | Token lifecycle | Implemented and verified 2026-07-16; production HTTPS/same-site config required |
| CMS-001 | High | CMS/storage | Lifecycle implemented/verified 2026-07-17; 5 dry-run candidates retained pending target visual/object proof |
| SEC-001 | High | Abuse resistance | Implemented and verified 2026-07-16; production Redis/ingress tuning required |
| SEC-002 | High | Secrets/config | Implemented and verified 2026-07-16; deployment secret injection/rotation required |
| PERF-001 | High | Catalog queries | Resolved Step 6 |
| TEST-001 | High | Regression coverage | Confirmed gap |
| DB-001 | Medium | Constraints | Implemented/live-migrated 2026-07-17 after restored-data rehearsal |
| DB-002 | Medium | CMS FK policy | Implemented/revalidated 2026-07-17 with reusable-media `SET NULL` policy across six slots |
| CMS-002 | Medium | Cache invalidation | Durable signed outbox implemented/verified 2026-07-17; deployment injection/live cross-service proof required |
| SEC-003 | Medium | Browser headers | Reproduced |
| SEC-004 | Medium | Analytics privacy | Confirmed |
| PERF-002 | Medium | Favorites/cart | Resolved Step 6 |
| PERF-003 | Medium | Static assets | Measured |
| PERF-004 | Medium | Product page latency | Resolved Step 6 |
| OBS-001 | Medium | Health | Reproduced |
| OBS-002 | Medium | Client observability | Confirmed gap |
| API-002 | Low | Sort contract | Reproduced |
| DATA-001 | Low | CMS ordering | Implemented/live-normalized 2026-07-17 |
| DATA-002 | Low | Product data | Implemented/live-normalized 2026-07-17; fallback preserved |
| UI-001 | Low | Accessibility i18n | Confirmed |

# 2026-07-17 Step 4 recovery reconciliation

The interrupted-session recovery preserved the inherited Redis/HMAC/proxy/filter/profile architecture and closed six partial edges: direct limiter-store failures, concurrent local-store cardinality, analytics validation order, CRM role-safe login/backoff, refresh-429 access preservation, and non-local limiter-disable prevention. No parallel limiter, database migration, or Step 5 work was introduced. SEC-001 and SEC-002 remain resolved; production release still depends on the documented Redis, ingress/WAF, proxy, secret, monitoring, and staged-rollout prerequisites.

# Recommended implementation order

1. Completed 2026-07-16: REC-001 plus backend/frontend tests and silent-failure behavior.
2. Completed 2026-07-16: API-001, WEB-001, CRM-001, AUTH-001, SEC-001, and SEC-002.
3. Completed in code 2026-07-17: CMS-001/CMS-002 lifecycle, durable revalidation, and finite tests; target-environment cleanup/rendered-page release checks remain.
4. Completed 2026-07-17: PERF-001/PERF-002/PERF-004 with a disposable 600-product benchmark and fixed query counts.
5. Completed 2026-07-17: DB-001/DB-002/DATA-001/DATA-002 with preflight diagnostics, restored-data rehearsal, live migration, and recovery plans.
6. SEC-003/SEC-004, PERF-003, OBS-001/OBS-002, API-002, DATA/UI cleanup plus production concurrency measurement.
7. Complete the blocked runtime viewport pass and populate screenshots before release sign-off.

# Final readiness assessment

**NOT READY**

The recommendation, API/real-404, CRM session, abuse-control, secure-default, CMS media-lifecycle, durable-revalidation, Step 6 performance, and Step 7 database/data-integrity requirements are implemented. At the pre-Step-8 checkpoint, readiness was also blocked by SEC-003/SEC-004 and PERF-003; Step 8 resolves those repository findings below. Overall readiness still requires target-environment verification/deletion of the five CMS dry-run candidates, a deployed authenticated CMS-to-rendered-page probe, production concurrency measurement, and required runtime viewport/screen-reader/visual evidence. Production additionally requires documented Redis, ingress, storage, CMS URL/secret, monitoring, CSP/telemetry, probe-network, and staged-rollout controls; passing local tests do not substitute for deployment proof.

# 2026-07-17 Step 7 database integrity completion

DB-001, DB-002, DATA-001, and DATA-002 are closed. The live migration was preceded by read-only diagnostics, a database dump, a restored-copy Spring/Liquibase rehearsal, direct constraint rejection checks, and fresh-chain concurrency tests. Application writers now serialize product-media and CMS-page mutations and use collision-free temporary positions before final canonical order. Stable safe 409 codes cover image activation/final deletion and DB ordering conflicts. CRM defers activation until upload, blocks final ACTIVE-image deletion, removes ACTIVE from image-less bulk creation, and localizes RU/KZ/EN guidance. No Step 8/9 remediation was included.

## 2026-07-17 Step 6 performance remediation

PERF-001, PERF-002, and PERF-004 are resolved in code and finite local verification. Catalog cards and quick search now hydrate through one compact shared projection, facet metadata uses fixed grouped SQL rather than entity scans/per-option counts, and category inheritance/response bytes remained unchanged in live fixtures. Cart and favorites now use `POST /api/public/product/batch-summary/{lang}` with at most 60 positive IDs, first-occurrence deduplication/order, one public summary query, and deterministic `missingIds`; temporary endpoint failure preserves local state, while explicit missing IDs retain their snapshot and become unavailable. Recommendations retain the established three-query maximum but use the shared summary projection and render behind server `Suspense` with a null fallback, so recommendation latency cannot delay the main product page.

On the disposable 600-product PostgreSQL 16 fixture, generic/wrist/interior/accessory facet queries changed from 39/108/97/41 to 1/4/4/3 including category context, catalog base changed from 79 to 3, the 24-result filtered wrist page changed from 78 to 5, and quick search changed from 27 to 2. Cart/favorite refresh changed from N HTTP requests to one HTTP/one SQL request for 1 through 60 items. No cache, index, or Liquibase change was justified. The overall audit remains **NOT READY** for the unrelated blockers already listed; Step 6 is no longer one of them.

## Step 8 implementation closure - 2026-07-19

| Issue | Status | Architecture and files | Configuration / migration | Tests and measured result | Remaining deployment risk |
| --- | --- | --- | --- | --- | --- |
| SEC-003 | RESOLVED | Shared-per-app header builders in both `security-headers.mjs` files feed `next.config.mjs`; HTML, Next static files, public assets, and first-party API routes share the policy. | Exact API/media origin inputs; CSP defaults enforced and can stage as report-only. HSTS is production-ingress-owned and absent on local HTTP. | Unit header matrices and real public/CRM production-response probes passed; production CSP has no wildcard/`unsafe-eval`. | Staging must exercise real external origins in report-only mode before enforcement; ingress must preserve headers and enable HSTS only after HTTPS coverage. |
| SEC-004 | RESOLVED | Product analytics persists only product, event type, and creation time. Session is an ephemeral deduplication input; IP, UA, account link, and arbitrary metadata are neither collected nor stored. A locked bounded cleanup service enforces 180 days. | Liquibase `2026-07-19-01` drops historical raw columns with HALT preconditions. Cleanup has enabled/dry-run/cron/batch/max-batch controls. | Service/unit/integration tests prove dry-run, lock skip, bounded deletion, current-row preservation, and aggregate use; full Gradle suite passed. | Policy owner must approve 180 days, rehearse dry-run count, and hold a verified backup because raw-column deletion is intentionally irreversible. |
| PERF-003 | RESOLVED | Explicit Pillow pipeline converted 25 local photographic/banner fallbacks to WebP without dimension changes; source and CMS paths now agree. Root finite budget gate covers repository assets and both Next JS outputs. | Liquibase `2026-07-19-02` updates matching `cms_media` public paths. CI builds both apps and runs the budget gate; exception allow-list is empty. | Public tree fell 40.48 -> 7.33 MiB; selected images 36.32 -> 3.18 MiB; largest image 3.36 -> 0.70 MiB. Public/CRM JS are 1.26/1.06 MiB. Production route totals are 1,763,786 B home, 1,446,622 B catalog, and 1,496,590 B product. | Step 9 still owns full route, mobile-crop, high-DPI, and screenshot comparison. No field-CWV improvement is claimed. |
| OBS-001 | RESOLVED | Spring exposes only liveness and readiness health groups anonymously. Liveness is application state; readiness is application state plus PostgreSQL; details never show. | Actuator exposure is `health` only; every other Actuator path remains authenticated. Probe success logs at debug. | Full Spring suite/Liquibase integration passed; security coverage confirms exact anonymous paths. | Ingress should restrict probes to cluster health networks. Redis and object storage follow the documented separate-dependency policy. |
| OBS-002 | RESOLVED | Both Next apps use disabled-by-default, first-party same-origin telemetry collectors, error boundaries, typed request-ID propagation, scrubbed events, deduplication, and sampled normalized Web Vitals. No external SDK was added. | Client/server enable flags, environment/release, and Web Vitals sample rate are configurable; platform log retention is capped operationally at 30 days. | Public 5 telemetry tests and CRM 4 telemetry tests passed; production builds and bundle budgets passed. Error clients cover network/5xx reporting and preserve real backend request IDs. | A production provider/dashboard is not configured; enabling log collection requires deployment access/retention configuration and Step 9 runtime confirmation. |
| API-002 | RESOLVED | Controller allow-list maps six exact public sort tokens and appends the existing deterministic ID tie-breaker; unknown values throw `InvalidSortException`. Frontend controls emit only their supported subset. | No migration. Omitted/blank keeps default; any unsupported nonempty/case-variant returns 400 `INVALID_SORT` with request ID. | Controller, global error, frontend config, and integration cases passed. | Any new sort must be added deliberately to backend allow-list, frontend contract, and tests; arbitrary property sorting remains forbidden. |
| UI-001 | RESOLVED | RU/KZ/EN message namespaces own navigation, pagination, carousel, breadcrumbs, meaningful image alt, search input, and error-boundary names. Shared components receive localized props rather than English defaults. | Translation JSON only; no API/DB migration. | Structured locale parsing, CRM message tests, public build/typecheck, and hard-coded-label search passed. | Step 9 still owns physical screen-reader, language-switch, mobile, and cross-browser smoke checks. |

Detailed rollout/forward-recovery instructions are in `STEP_8_DEPLOYMENT_RUNBOOK.md`; the asset-by-asset evidence is in `STEP_8_ASSET_INVENTORY.md`. Step 8 is complete in code and finite local verification. The full-system audit remains **NOT READY** until the separately scoped Step 9 release verification is executed; this pass did not start it.

## Step 9 Final Reconciliation - 2026-07-19

Step 9 is complete and supersedes the earlier `NOT READY` statement with **READY FOR STAGING**. All new Must-fix findings (CMS after-commit transaction, vulnerable frontend dependencies, HTML language/ARIA/heading/contrast defects, and constrained mobile presentation) were fixed and their gates rerun. Historical status is 22 resolved, 3 partially resolved, 0 regressed, and 0 blocked. CMS-001/CMS-002 remain partial only because production revalidation/retention infrastructure needs staging proof; TEST-001 remains partial because browser/axe coverage is not yet a checked-in permanent suite. See `../vympel_final_release_verification/FINAL_RELEASE_REPORT.md` and `FINAL_ISSUE_REGISTER.md` for production conditions.
