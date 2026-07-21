# API Test Report

## Technical summary

The API is reachable, role-protected, correlated with request IDs, safe on malformed input, and now bounded by endpoint-risk-specific abuse controls. SEC-001/SEC-002 were implemented and verified on 2026-07-16: normal traffic passes, exhausted buckets return a stable correlated 429 contract, fail-closed limiter outages use safe 503, duplicate analytics can return `tracked=false`, and insecure non-local configuration cannot start. The original permissive unknown-sort finding is resolved as API-002 in the Step 8 section below.

## Endpoint coverage

| Surface | Representative checks | Result |
| --- | --- | --- |
| Public health | `GET /api/public/ping` | 200, request ID present. |
| Product | Detail, catalog, by-code, quick search, filters, reviews | Valid requests pass; missing product/category now return 404. |
| CMS | Public page reads for home/about/catalog/product/brands | 200 with expected published block counts. |
| Public mutation | Review, customer request, analytics event | Created successfully; audit records removed. |
| CRM auth | Login, `me`, refresh, replay, logout, missing/invalid refresh | Access-only JSON plus HttpOnly cookie; valid rotation 200; replay/family invalidation and post-logout refresh 401 `INVALID_SESSION`; logout 204/idempotent. |
| CRM MANAGER | Products, references, reviews, requests, analytics, dashboard, activity | 200; CMS/users 403; same access token still returns 200 from `me` after a forbidden users request. |
| CRM ADMIN | CMS pages, users, product detail | 200. |
| CRM role/status invalidation | Admin promotes and disables a disposable user, then the old refresh is retried | Current database role immediately governs access; role change and disable each revoke refresh, which returns 401. |
| CRM cookie-origin policy | Trusted/untrusted refresh/logout origins | Trusted same-site origin passes; untrusted origin is rejected 403 without token/exception leakage. |
| CMS mutation | Create/update/publish/public read/unpublish/delete | Passed with disposable block. |
| Bounds | Oversized page sizes | Public catalog capped at 60; CRM capped at 100; reviews capped at 15. |
| Invalid input | Lang, decimals, booleans, review rating/sort, auth | 400/401 with safe JSON; the original API-002 permissive-sort observation is superseded by the Step 8 strict-sort proof below. |
| Abuse contract | CRM/customer login, registration, refresh/logout, review, request, analytics, quick/catalog/recommendation reads | Configured source/identity/content policies; 429 includes `Retry-After`, `retryAfterSeconds`, and matching request ID; internal policy/key/identity omitted. |
| Abuse storage | Two independent Redis clients under concurrency | One shared atomic capacity and TTL; no per-instance multiplication; container removed after the test. |
| Forwarded identity | Trusted/untrusted/malformed `X-Forwarded-For` | Only configured direct proxy CIDRs are trusted; spoofed direct headers stay in the direct-peer bucket. |

## API-001 — Missing resources return inconsistent 400 and 500 responses (resolved)

- **Severity:** High
- **Status:** Implemented and verified on 2026-07-16.
- **Affected code:** `ResourceNotFoundException`, `GlobalErrorHandler`, product/category/catalog/review/request/CRM-user/CMS/storage/reference lookup services, and `EntityReferenceMapper`.
- **Historical evidence preserved:** Before remediation, a missing public product returned `400 BAD_REQUEST` with `Product not found`, while `GET /api/public/product/by-code/ru/NOT_A_CATEGORY` returned 500.
- **Root cause:** Product lookup uses `IllegalArgumentException`, globally mapped to 400. Category lookup uses `jakarta.persistence.EntityNotFoundException`; the handler groups `PersistenceException` with database failures and maps it to 500.
- **Implemented fix:** Added `ResourceNotFoundException` for valid absent lookups only. `GlobalErrorHandler` maps it to 404/`RESOURCE_NOT_FOUND` with the existing safe envelope and `requestId`, logs expected absence at INFO without stack traces, and keeps persistence/unexpected failures at 500/ERROR. Validation-related `IllegalArgumentException` remains 400.
- **Tests added:** `GlobalErrorHandlerTest` covers 400 validation/malformed payload, 401, 403, 404, simulated persistence 500, request ID, and SQL/stack-trace non-disclosure. `ProductServiceImplTest` covers missing product; `ResourceNotFoundServiceTest` covers representative category, brand, review, request, CRM user, CMS page, and CMS block misses.
- **Final verification:** Java 17 Gradle suite passed 56/56. A bounded production-jar HTTP matrix passed: valid ping/product 200; malformed ID 400; unauthenticated protected endpoint 401; missing product/category 404. All checked error responses included `requestId`, leaked no SQL/stack trace, and expected 404 identifiers produced zero `error.log` matches. The task-owned JVM, port, and temporary logs were cleaned up.
- **Status-code contract:** malformed/validation 400; unauthenticated 401; authenticated-but-forbidden 403; valid missing resource 404; unexpected/persistence failure 500.
- **Remaining risk:** Live 403 and induced 500 were not recreated with new disposable auth/database fixtures during this scoped step; both are covered in handler tests, and the existing audited MANAGER 403 boundary remains passing.

## CRM-001 / AUTH-001 — CRM authorization and refresh lifecycle (resolved)

- **Status:** Implemented and verified on 2026-07-16.
- **Endpoints:** `POST /api/crm/auth/login`, `POST /api/crm/auth/refresh`, `POST /api/crm/auth/logout`, `GET /api/crm/auth/me`, and role-gated CRM routes.
- **Contract:** Login/refresh return only `{ accessToken }`; refresh credential travels only as the scoped HttpOnly cookie. Refresh/logout require an exact trusted browser origin. Refresh failures use safe `401 INVALID_SESSION`; authenticated role denial remains 403 and does not invalidate the access token.
- **Finite verification:** `CrmAuthLifecycleIntegrationTest` ran a random-port Spring stack against migrated PostgreSQL with unique users and cleanup. It proved login -> me -> rotation -> old-token replay -> active-family rejection -> MANAGER 403 -> same-token me -> database role promotion -> role-change refresh revocation -> user disable refresh revocation -> logout -> post-logout rejection, plus untrusted-origin rejection.
- **Client verification:** 13 CRM Vitest tests prove 403 preservation, one refresh for simultaneous 401s, one original retry, no recursion on refresh/second 401, cookie-only bootstrap, localized permissions, role navigation, and logout success/failure behavior.
- **Security evidence:** Cookie flags/path/max-age, issuer/audience/type/jti/iat/exp/skew, hash-only session persistence, replay detection, and no secret-bearing error/log payloads are directly tested.

## SEC-001 / SEC-002 - Abuse and deployment configuration contracts (resolved)

- **Status:** Implemented on 2026-07-16 and recovery-verified on 2026-07-17.
- **429 contract:** `status=429`, `code=RATE_LIMIT_EXCEEDED`, safe message, positive bounded `retryAfterSeconds`, matching `Retry-After`, `X-Request-Id`, and body `requestId`. No policy name, raw address/account/contact, HMAC, or internal key is returned.
- **503 contract:** A high-risk policy whose Redis operation fails returns a safe correlated service-unavailable response and does not continue to the controller/repository. Explicit low-risk read policies remain available.
- **Finite live matrix:** Quick search `200,200,429`; invalid customer request `400,429`; invalid review `400,429`; invalid analytics `400,400,429`; invalid CRM login `401,401,429`. Invalid write bodies were chosen so the matrix created no database rows. The final attempt supplied a spoofed forwarding address from an untrusted direct peer and remained in the original source bucket.
- **Dedup/validation:** Contact/review/analytics unit integration proves rejection or `tracked=false` before repository save. Analytics accepts only bounded primitive metadata and validates it before product lookup or duplicate acknowledgement.
- **Client contract:** Public request/review/search and CRM login parse body/header cooldowns, preserve user input, disable the relevant action, localize RU/KZ/EN copy, and do not automatically retry. A throttled CRM refresh preserves the existing access token and surfaces 429; only refresh 401 clears the session.
- **Startup contract:** Outside exclusive local/test profiles, rate limiting must remain enabled and database, JWT, limiter HMAC/Redis, S3, CORS, cookie, and required CMS configuration must be strong and deployment-safe. Failure messages name only the property/rule, never its value. Live production-profile proof covered placeholder failure before port binding and a full synthetic loopback startup that used explicit test-only local/insecure-service exceptions, migrated disposable PostgreSQL, connected to disposable Redis, and served ping 200 without secret leakage. Strict TLS/non-local endpoint validation passes separately in the startup unit matrix.
- **Operational contract:** Redis, proxy/WAF, failure modes, tuning, telemetry, rollout, and secret rotation are documented in `STEP_4_SECURITY_ROLLOUT.md`.

## API-002 — Unknown catalog sort silently becomes `newest`

- **Severity:** Low
- **Status:** Reproduced
- **Affected code:** catalog sort parsing in `ProductPublicController` / `ProductCatalogService`.
- **Evidence:** An unsupported catalog sort value returned 200 and the newest ordering, while unsupported review sort returned 400.
- **Root cause:** Catalog parsing applies a silent default instead of enforcing the documented allow-list.
- **Required fix:** Choose one public contract and document it. Recommended: reject nonblank unsupported sort values with 400; retain `newest` only when sort is omitted.
- **Acceptance criteria:** Sort allow-list is explicit, invalid values have deterministic behavior, and API/client tests match it.
- **Regression risks:** Existing bookmarked URLs with stale sort values could begin returning 400; the frontend should only emit supported values.

## Passing behaviors worth preserving

- Safe JSON error envelopes do not expose stack traces or SQL details.
- `X-Request-Id` appears on public and error responses.
- Exact-origin CORS behavior is correct for the tested local allow-list.
- Role boundaries are correct at the backend, and the CRM client now preserves the valid session on 403 while surfacing localized authorization feedback.
- Product/review page-size limits and negative-page normalization are enforced.
- Review rating totals include approved reviews only; product 28 reported 22, matching 22 approved rows.
- Public CMS returns an empty page model for an unknown CMS page so static frontend fallbacks can operate; this was treated as intentional, not a missing-resource defect.

## Limitations

Multipart product-image upload was not mutated during this audit; `ObjectStorageService` validation and unit tests passed, and MinIO ports were reachable. Browser-driven CRM product creation was blocked with the visual browser controller. The implementation pass should add an automated disposable product/image CRUD integration test rather than rely on manual repetition.

## 2026-07-17 Step 4 recovery verification

- Backend: 28 suites / 109 tests passed with zero failures, errors, or skips; this includes direct limiter-store failure translation, strict concurrent local cardinality, malformed duplicate analytics ordering, generic non-CRM login failure/backoff, and mandatory non-local limiting.
- CRM: 3 files / 15 tests passed; the added case proves refresh 429 preserves access state and emits no session-expired event. Public remains 2 files / 6 tests.
- Live test-profile matrix on task-owned port 18086: quick search `200,200,429`; request `400,429`; review `400,429`; analytics `400,400,429`; CRM login `401,401,429`. The quick-search rejection had matching 59-second header/body cooldown, matching request IDs, no internal policy/key, and no spoof bypass.
- The task JVM, ports 18086/18087, temporary logs, and task Gradle daemon were removed. Invalid write payloads reached no persistence path, and integration fixtures passed their cleanup assertions.

## 2026-07-17 Step 5 CMS lifecycle and revalidation verification

- **Backend suite:** 31 suites / 123 tests passed with zero failures, errors, or skips, including the post-storage-delete concurrent-reference protection case.
- **ADMIN media operations:** `GET /api/crm/cms/media/orphans` is bounded/read-only, `GET /api/crm/cms/media/{id}/references` enumerates all six safe slot references, and `POST /api/crm/cms/media/orphans/cleanup` runs the same locked/rechecked state machine as the scheduler. Existing `/api/crm/cms/**` ADMIN authorization covers all three; 401/403 semantics remain unchanged.
- **Media response safety:** CMS media responses no longer expose the internal object key. Upload keeps extension/MIME/size limits and now rejects spoofed image bytes or excessive decoded dimensions/pixels before storage.
- **Mutation response contract:** CMS block create/update/delete/reorder/publish/unpublish responses keep the committed content result and add `publicCacheRefresh.contentSaved`, `attempted`, `refreshed`, explicit status, safe message code, and request ID. Revalidation network failure returns `FAILED_RETRY_SCHEDULED`; it does not roll back or misreport the content write.
- **Public revalidation contract:** The storefront accepts only bounded version-1 `{timestamp, requestId, pageKey}` payloads signed with HMAC-SHA256 over every field. Unknown page keys, expired/future timestamps, bad UUIDs, oversized bodies, invalid signatures, and replay are rejected. Callers cannot provide arbitrary cache tags or paths.
- **Finite live proof:** A production-built Next server on task-owned port 3117 returned 200 for a correctly signed `home` request, 401 for a bad signature, and 409 when the valid request ID was replayed. The process was stopped and the port confirmed closed.
- **Limitations:** No authenticated deployed CRM-to-backend-to-public rendered-page run was available, so configuration injection and user-visible deployment latency remain release checks. The configured database dry run was deliberately non-destructive; MinIO/public/CRM visual confirmation is still required before deleting the five candidates.

## 2026-07-17 Step 6 public performance contracts

- `POST /api/public/product/batch-summary/{lang}` accepts JSON `{ "ids": [...] }`. Bean Validation requires a non-empty list of at most 60 positive non-null IDs; the controller also caps a declared body at 4 KiB. The service deduplicates first occurrence, returns valid ACTIVE/public localized summaries in request order, and returns hidden/deleted/inactive/unresolvable IDs together as `missingIds` without revealing which internal state existed.
- Each item includes current name, model/SKU, integer price, stock, public status, main-image URL/no-photo null, marketplace links, collection, brand, visible category, and approved rating summary. It omits descriptions, galleries, reviews, and detail characteristics.
- The endpoint reuses the fail-open `public-catalog-read` source rate-limit policy. It performs one bounded shared summary query, is read-only, and has a 2,000 ms query timeout.
- Live calls against the 600-product disposable database returned 200 for generic/wrist/interior/accessory facets, catalog pages, recommendations, and a batch containing duplicates plus a missing ID. Facet and catalog fixture response byte sizes matched baseline exactly. Malformed JSON still returned the existing safe 400 envelope; normal validation and rate-limit error handling remain centralized.
- Cart and favorites issue one POST each, never fall back to per-ID requests, preserve local snapshots on total failure, and mark only explicit `missingIds` unavailable. Simultaneous identical locale+ordered-ID batches share one in-flight promise; no settled response cache can keep price/stock stale.

## 2026-07-17 Step 7 database-backed error contracts

- Product activation without a canonical main IMAGE at position 0 returns safe `409 PRODUCT_MAIN_IMAGE_REQUIRED`.
- Deleting the final image of an ACTIVE product returns safe `409 PRODUCT_FINAL_IMAGE_DELETE_FORBIDDEN`; DRAFT/ARCHIVED image-less states remain allowed.
- Named Step 7 constraint violations map to stable 400/409 codes for negative price/stock/media position, media order/main conflicts, and CMS order conflicts. Raw SQL, constraint text, and stack traces are not returned.
- CRM maps stable product-image codes to localized RU/KZ/EN copy, preserves pending/loading states, defers activation until selected images finish uploading, and does not offer ACTIVE in bulk creation because that flow has no image phase.
- Public no-photo rendering was not changed; defensive cards/pages remain valid for DRAFT/admin states and future inconsistent upstream data.

## Step 8 API contract results - 2026-07-19

### API-002 - RESOLVED

- **Architecture/files:** `ProductPublicController` maps only `newest`, `oldest`, `priceAsc`, `priceDesc`, `nameAsc`, and `nameDesc`; the existing query service adds deterministic `id DESC`. `InvalidSortException` and `GlobalErrorHandler` return a stable typed failure. The public sort configuration test fixes the client-emitted subset.
- **Configuration/migrations:** None.
- **Behavior:** Omitted or blank sort returns 200 with default order. Unsupported nonempty values, arbitrary property names, and case variants such as `PriceAsc` return 400 `INVALID_SORT` with the response request ID. No raw exception/field name is accepted as sorting input.
- **Tests/results:** Controller unit tests, global error tests, the public frontend sort configuration test, and PostgreSQL-backed public integration cases passed in the full Gradle/Vitest suites.
- **Remaining risk:** Future sorts require coordinated backend/frontend/test changes; do not expose generic framework `Sort` binding.

### Step 8 operational API checks

- Exact anonymous health routes are liveness/readiness only; root/other Actuator paths remain protected and health details are hidden.
- Next same-origin telemetry accepts bounded scrubbed events only when server telemetry is enabled and returns safe no-op behavior otherwise.
- Backend `X-Request-Id` and structured error `requestId` propagate into typed public/CRM errors; telemetry/support references use the real value only.
- Public production status/content matrix still passes valid 200, true 404, localized RU/KZ/EN, and temporary-failure-not-404 behavior while also checking response headers and three route transfer totals.

## Step 9 Final Reconciliation - 2026-07-19

Representative live public and CRM matrices pass expected 200/201/202/204/400/401/403/404/429 semantics. Refresh rotation/replay/logout, manager denial without session loss, corrected customer-only CRM denial, deterministic login limiting, CMS publish/unpublish/reference flow, and disposable MinIO lifecycle were verified against the isolated current-code runtime. The CMS after-commit failure found during the first pass was fixed and rerun cleanly. See `../vympel_final_release_verification/FINAL_API_MATRIX.md`.
