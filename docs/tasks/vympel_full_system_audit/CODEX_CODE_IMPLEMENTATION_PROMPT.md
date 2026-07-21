# Codex Code Implementation Prompt — Vympel Full-System Audit Remediation

You are the implementation agent for the Vympel full-stack repository. Implement the verified audit findings in priority order. Do not repeat the audit, do not perform unrelated redesigns, and do not weaken existing role, validation, logging, localization, or responsive behavior.

## Mandatory files to read before editing

1. `AGENTS.md`
2. `docs/PROJECT_MAP.md`
3. `docs/PROJECT_SKILLS.md`
4. `docs/tasks/vympel_full_system_audit/FULL_SYSTEM_AUDIT_REPORT.md`
5. `docs/tasks/vympel_full_system_audit/TEST_MATRIX.md`
6. `docs/tasks/vympel_full_system_audit/API_TEST_REPORT.md`
7. `docs/tasks/vympel_full_system_audit/DATABASE_AUDIT.md`
8. `docs/tasks/vympel_full_system_audit/SECURITY_AUDIT.md`
9. `docs/tasks/vympel_full_system_audit/PERFORMANCE_AUDIT.md`
10. `docs/tasks/vympel_full_system_audit/UI_UX_AUDIT.md`
11. `docs/tasks/vympel_full_system_audit/RECOMMENDATION_AUDIT.md`
12. `docs/tasks/vympel_full_system_audit/LOGGING_AUDIT.md`
13. `docs/tasks/vympel_full_system_audit/SCREENSHOT_INDEX.md`
14. Relevant historical task documents named by `prepare_vympel_full_system_audit.md`, especially CMS caching, server logging, favorites/recommendations, reviews, analytics, and UI polish specifications.

Follow the repository startup/end-of-task protocols exactly. Update both project memory files after implementation.

## Non-negotiable recommendation rule

The public product page must never display “no similar products”, “recommendations unavailable”, a recommendation error, retry UI, or any equivalent empty/failure message.

- Use a multi-stage recommendation fallback across the valid public catalog.
- Exclude the current product, inactive/archived products, duplicates, and products the public catalog cannot open.
- Prefer in-stock products and return a stable bounded count in the requested locale with main-image/no-photo behavior.
- If and only if the entire catalog has no valid alternative, omit the complete recommendation section silently: no title, blank container, message, or excess spacing.
- A recommendation timeout or internal failure is also silent to the customer and must be logged/observable server-side.

## Priority and issue inventory

| Priority | Issue IDs |
| --- | --- |
| P1 Critical | REC-001 |
| P1 High security/contracts/session | SEC-001, SEC-002, CRM-001, AUTH-001, API-001, WEB-001 |
| P2 High data/CMS/performance/tests | CMS-001, PERF-001, TEST-001 |
| P2 Medium platform hardening | CMS-002, SEC-003, SEC-004, PERF-002, PERF-004, OBS-001, OBS-002; DB-001/DB-002 completed Step 7 |
| P3 Medium/low optimization and cleanup | PERF-003, API-002, UI-001; DATA-001/DATA-002 completed Step 7 |

Implement and verify each priority group before proceeding. Keep commits/changes reviewable by issue ID if the workflow permits.

## P1 — REC-001 recommendation subsystem

### Root cause and evidence

`vympel_front/src/screens/ProductPage/index.tsx` currently calls `PublicApiController.getProductsList` once for the current category, then renders visible `ErrorState` or `EmptyState`. Product 45 rendered `Похожие товары пока не найдены`; rare-category products 43/44 also have no same-category alternatives. No backend recommendation service exists.

### Backend implementation

- Add a dedicated recommendation DTO, service, repository/projection queries, and public endpoint. Prefer a route consistent with the existing controller, for example `GET /api/public/product/{lang}/{id}/recommendations?limit=12` in `vympel_back/src/main/java/com/shop/vympel/controllers/ProductPublicController.java`.
- Implement an ordered candidate accumulator (`LinkedHashSet`/ID set plus ordered result list) with these schema-adapted stages:
  1. Same category plus matching important watch/interior details when applicable.
  2. Same category and brand.
  3. Same category within a documented configurable price band.
  4. Popular/in-stock products in the parent category.
  5. New/popular in-stock products from related categories.
  6. Globally popular in-stock products.
  7. Valid out-of-stock alternatives only after exhausting in-stock stages.
- Use existing `ProductAnalyticsEventRepository`/promotion data only as one bounded ranking signal; keep deterministic tie-breakers: stage, stock, promotion/popularity, recency, ID.
- Fetch compact projections in bounded batches; avoid loading all entities or issuing one query per candidate. Reuse public visibility/status rules and localized product mapping.
- Treat a missing source product as API-001 404. Log internal stage/failure metrics without exposing failure details in the response.
- Decide cache keys/invalidation for product status, category, brand, price, stock, media, and promotion changes. Do not return stale inaccessible items.

### Public frontend implementation

- Add the typed endpoint to the existing public API controller/client/types.
- Replace lines 127–149 and the visible branches around lines 222–247 in `vympel_front/src/screens/ProductPage/index.tsx`.
- Render `SectionWithTitle` and carousel only when `items.length > 0`.
- On endpoint error/timeout/empty result, return no recommendation section. Keep diagnostics in server logging only.
- Remove or leave unused only outside this surface the `similar.empty*`/`similar.error*` strings; add a test proving they are never rendered on a product page.

### Required tests

- Backend service/controller tests for many matches, same-category-only, rare category, no brand/detail match, accessories, interior clocks, wristwatches, out-of-stock source, image-less product, inactive candidates, duplicate candidates, stable limit/order, locale, and a single-public-product catalog.
- Query-count or repository-call bounds so the fallback chain does not become PERF-001.
- Frontend render tests: items render; empty and exception omit title/body/spacing; forbidden phrases are absent in ru/kz/en.
- Cross-system E2E for products 28, 43, 44, and 45 using disposable/seeded data.

### Acceptance criteria

REC-001 is complete only when every product gets alternatives whenever any valid public alternative exists, and complete catalog exhaustion/failure hides the whole section silently.

## P1 — API-001 and WEB-001 not-found correctness

### Backend

- Introduce a domain not-found exception and a 404 branch in `GlobalErrorHandler` with the current safe envelope/request ID.
- Replace missing-entity `IllegalArgumentException` / `EntityNotFoundException` usage in public/CRM services where the condition is genuinely not found. Preserve 400 for validation and 500 for unexpected persistence failure.
- Cover missing product, category, review, request, user, CMS block/page as applicable.

### Next.js public routes

- Inspect `src/app/[locale]/[...notFound]/page.tsx`, product/category/brand dynamic pages, and async fetch placement.
- Ensure unknown path, missing product, unknown category, and unknown brand return real HTTP 404 before streaming commits while retaining localized not-found UI and valid-route performance/caching.
- Add production-server integration tests that assert status and content; development-only behavior is insufficient.

### Acceptance criteria

Malformed IDs are 400, unauthenticated/forbidden are 401/403, missing resources are 404, unexpected failures are 500, and valid routes remain 200.

## P1 — CRM-001 and AUTH-001 session lifecycle

**Implementation status (2026-07-16): complete and verified for Step 3.** The accepted design keeps the access token in CRM sessionStorage and moves the rotating refresh token to a host-only HttpOnly `/api/crm/auth` cookie with `SameSite=Lax`, production `Secure=true`, exact credentialed CORS, and Origin/Referer validation. Backend sessions persist only SHA-256 jti hashes, rotate under lock, revoke families on replay, revoke on logout/role/status changes, and clean retired rows. The CRM uses one single-flight refresh and one original retry; 403 preserves the session. The Step 3 baseline was backend 79/79 and CRM 13/13; after the 2026-07-17 Step 4 recovery the cumulative baseline is backend 109/109 and CRM 15/15. Production HTTPS and same-site CRM/API deployment remain explicit prerequisites.

### CRM-001

- In `vympel_crm/src/shared/api/client.ts`, stop clearing session on 403. Clear/renew only on 401 or verified invalid authentication.
- Preserve MANAGER session on ADMIN-only denial; show localized forbidden feedback and role-gate navigation/actions.

Implemented: the shared client dispatches localized forbidden feedback without clearing or refreshing; shared permission helpers cover nav and direct admin-only routes. CRM unit tests and the finite Spring HTTP flow prove MANAGER 403 followed by same-token `me` 200.

### AUTH-001

- Inspect `AuthController`, `CrmAuthController`, `AuthServiceImpl`, `JwtService`, `JwtAuthFilter`, `vympel_crm/src/shared/api/session.ts`, login/provider/shell code.
- Make an explicit architecture decision:
  - Preferred where topology permits: short access token plus rotating HttpOnly Secure SameSite refresh cookie with CSRF design, revocation, reuse detection, and logout.
  - Otherwise: a fully implemented refresh endpoint and rotation lifecycle with a documented storage threat model.
  - If refresh is intentionally deferred, stop issuing/storing the unused 14-day token and document deliberate 15-minute sessions.
- Add single-flight refresh and one retry only; never loop. Mask tokens in logs.

Implemented: `/login`, `/refresh`, and `/logout` now form a complete cookie-backed lifecycle with issuer/audience/type/jti/iat/exp validation, bounded skew, server-side hashed refresh families, rotation/reuse detection, role/status invalidation, idempotent logout, cleanup, single-flight client retry, cookie bootstrap, and deterministic expiry behavior. A fresh PostgreSQL 16 container ran the entire Liquibase chain and schema invariants before automatic removal.

### Acceptance criteria

MANAGER remains logged in after a 403; expired access behaves predictably; refresh/revocation/reuse/logout tests pass; tokens never enter logs/client error telemetry.

## P1 — SEC-001 and SEC-002

### SEC-001 abuse resistance

**Implementation status (2026-07-17 recovery): SEC-001 and SEC-002 are complete and verified in Step 4.** Historical requirements are retained below. Recovery hardened direct limiter-store failure translation, concurrent local cardinality, validation-before-dedup, CRM login role semantics, refresh-429 session preservation, and mandatory non-local limiting without adding a parallel limiter or migration. See `SECURITY_AUDIT.md`, `API_TEST_REPORT.md`, `TEST_MATRIX.md`, and `STEP_4_SECURITY_ROLLOUT.md` for current evidence, policy defaults, deployment prerequisites, failure modes, telemetry, rollout, and secret rotation.

- Inventory public/auth routes: registration, both logins, reviews, requests, analytics, quick search.
- Implement configurable endpoint-specific rate limits/backoff and 429 responses with `Retry-After`.
- Use a distributed store if production is multi-instance; do not present per-instance counters as globally reliable.
- Trust forwarded client IP only from known proxies. Add analytics deduplication and metadata size/type hardening.
- Document operational tuning and WAF/proxy layering.

### SEC-002 secret configuration

- Move insecure DB/JWT/MinIO fallbacks out of base config into explicit local/test profiles.
- Add non-local startup validation for missing/placeholder/weak JWT keys, storage credentials, database credentials, and CMS revalidation secret/URL where required.
- Keep examples in `.env.example`/docs with placeholders only. Add CI/startup tests.

### Acceptance criteria

Normal flows pass; bursts are bounded; multi-instance semantics are correct; non-local startup rejects insecure placeholders; no secrets appear in output/logs.

## P2 — CMS-001 and CMS-002

### CMS-001 media lifecycle

- In `CmsServiceImpl`, `CmsMediaRepository`, controller, entities, and storage service, implement complete reference counting/querying across main, kz/en localized, and mobile media slots.
- Add ADMIN-only list/diagnose and safe delete for unused media; delete object-storage keys with retry/compensation semantics.
- Add a grace-period orphan cleanup job or explicit admin action with dry-run. Never delete referenced media.
- Reconcile the 7 current orphan rows only after verifying object references in the target environment.

### CMS-002 revalidation

- Make staging/production `VYMPEL_CMS_PUBLIC_REVALIDATE_URL` and shared secret required and observable.
- Preserve database success when refresh fails, but return/log an explicit partial-success state and retry path.
- Add an integration test from CRM mutation to a production-built public rendered page; keep 30-second ISR as a safety net, not the primary editor experience.

### Acceptance criteria

CMS replace/delete does not leak indefinitely; referenced media is safe; publish/unpublish reaches rendered public pages within the documented target; secrets stay masked.

### Step 5 implementation record — 2026-07-17

- **CMS-001 implemented:** Media is reusable across all six default/localized/mobile slots. The ordered Liquibase migration normalizes every FK to `SET NULL`, adds lifecycle/protection/grace/retry state and reference/cleanup indexes, and includes rollback. ADMIN reference inspection, paged dry-run, explicit cleanup, and the scheduled bounded worker share a locked recheck. Only eligible `OBJECT_STORAGE` rows can reach `DELETE_PENDING`; storage deletion precedes DB deletion, failure becomes retryable `DELETE_FAILED`, and stale claims recover. Upload bytes are signature/dimension checked and object keys are not returned/logged.
- **CMS-001 reconciliation hold:** The configured DB has 24 rows and 5 currently eligible zero-reference dry-run candidates. The dry run changed nothing. Do not delete these until target MinIO plus public/CRM previews verify each is truly safe.
- **CMS-002 implemented:** Each CMS mutation commits a page-key-deduplicated outbox job with the content, then after-commit/scheduled delivery signs the fixed payload with timestamped HMAC. The public route allows only `home`, `about`, `catalog`, `product`, and `brands`, rejects invalid/expired/replayed/oversized input, and targets the matching tag/path set. Retry/backoff/timeouts/stale-claim recovery and latency/outcome logging are bounded. Non-local startup requires enabled URL/strong secret.
- **Partial-success contract:** CRM receives `contentSaved` separately from `NOT_REQUIRED`, `SUCCESS`, `FAILED_RETRY_SCHEDULED`, `FAILED_NOT_CONFIGURED`, or `FAILED_PERMANENT`; content is never rolled back by revalidation failure. Localized warnings distinguish pending retry from configuration/terminal failure. Normal 30-second tagged ISR remains the safety net.
- **Verification:** Backend full suite and focused read-only dry run passed; public 9 tests/lint/typecheck/build plus a production-route 200/401/409 probe passed; CRM 17 tests/typecheck/lint/build passed. The deployed authenticated mutation-to-rendered-page and target orphan deletion remain explicit release checks.

## P2 — PERF-001 catalog facets

- Refactor `ProductCatalogService.priceFilter`, `watchDetails`, `interiorClockDetails`, and per-option counts to aggregate/projection queries.
- Do not call `findAll(baseSpecification)` to calculate facets or issue unbounded one-count-per-option queries.
- Preserve category inheritance, wrist/interior/accessory profiles, selected-filter semantics, locale labels, price bounds, stock-last order, pagination, typo search, and current public contract.
- Create a realistic seeded benchmark and record query count/p50/p95 before and after.

## P2 — TEST-001 focused regression suite

- Add tests at the lowest reliable layer; do not introduce a large framework without need.
- Required automated paths: recommendation fallback/silent failure, 401 versus 403 session behavior, refresh lifecycle decision, real 404 statuses, public shopping state, product create/image upload/reorder/main/delete/archive, CMS publish-to-rendered-public, review moderation, request processing, and mobile catalog overlays.
- Use isolated disposable fixtures and verify cleanup. Never store test tokens or credentials in artifacts.

## P2 — Database migrations: DB-001 and DB-002 (completed Step 7)

- Add new ordered Liquibase changesets; do not edit applied changesets.
- Before constraints, add precondition/diagnostic SQL for negative price/stock, duplicate media positions, and invalid CMS media references.
- Add `CHECK (price >= 0)`, `CHECK (stock_quantity >= 0)`, and the agreed unique product image position rule while preserving the existing partial unique main-image rule.
- Normalize CMS media FK delete semantics only after documenting reusable versus owned media. Include every variant column.
- Provide rollback where safe or a tested forward-recovery procedure. Rehearse on a production-like copy.

Implemented in `2026-07-17-02-database-hardening.xml` with HALT preconditions, explicit schema rollback, forward-only recovery for targeted data corrections, restored-live-data rehearsal, forced live migration, and postflight SQL. All six reusable CMS media FKs remain `SET NULL`; no parallel ownership migration was added.

## P2 — SEC-003, SEC-004, PERF-002, PERF-004, OBS-001, OBS-002

- **SEC-003:** add tested CSP/frame-ancestors, nosniff, referrer, permissions headers in both Next apps or the edge. Stage CSP report-only first; apply HSTS only at HTTPS ingress.
- **SEC-004:** minimize/hash IP with managed key if needed, bound user-agent data, document/enforce retention/deletion, and version analytics identity semantics.
- **PERF-002:** add a deduplicated/capped public batch-summary endpoint and use it for favorites/cart instead of per-ID detail requests.
- **PERF-004:** ensure the new recommendation path is bounded, timed, cached appropriately, and does not delay main product content on failure.
- **OBS-001:** expose only minimal liveness/readiness according to deployment policy; never broadly permit sensitive actuator endpoints.
- **OBS-002:** add privacy-safe frontend/CRM error capture, release/environment/route/locale context, Web Vitals, API error correlation via request ID, backend metrics, slow-query/cache/recommendation/rate-limit telemetry.

## P3 — PERF-003, API-002, DATA-001, DATA-002, UI-001

- **PERF-003:** convert/resize the 40.48 MB static asset set, use responsive image sizes/loading, add CI asset/route budgets, and approve visual parity.
- **API-002:** reject nonblank unsupported catalog sort with 400 (recommended) or document/test an explicit alternative; omission still defaults to newest.
- **DATA-001 (completed Step 7):** About is 10/20/30; CMS page-row locking plus temporary/final phases keep order unique and deterministic.
- **DATA-002 (completed Step 7):** ACTIVE requires a canonical main image; DRAFT/ARCHIVED may be image-less and public no-photo rendering remains defensive.
- **UI-001:** localize hard-coded accessible strings such as main navigation, language selector, homepage, pagination, page navigation, and search in ru/kz/en.

## Responsive/UI verification and screenshots

The audit captured no current screenshots because the required browser controller failed; `SCREENSHOT_INDEX.md` records the blocker. After implementing fixes, perform a current visual pass and populate the existing directories/index.

- Public: 1440×900, 1024×768, 390×844, 320×568.
- CRM: 1440×900, 1024×768, 768×1024.
- Exercise navigation, catalog filter/sort overlays, product gallery/lightbox/tabs/reviews/request dialog, favorites/cart, CRM tables/forms, CMS editor, confirmation dialogs, keyboard focus/Escape/backdrop, long localized text, loading/error/empty states.
- Capture only meaningful defects or proof required by a fixed issue. Every referenced screenshot must appear in `SCREENSHOT_INDEX.md` with issue ID, route, viewport, state, and proof.

## Required finite verification commands

Use the commands documented in `docs/PROJECT_MAP.md`; at minimum:

1. Backend Java 17 Gradle test command.
2. Public frontend: `npm run lint`, `npm run typecheck`, `npm run build`, plus the added test command.
3. CRM: `npm run lint`, `npm run build`, plus the added test command.
4. Production dependency audit for both Next applications.
5. Liquibase validation/update rehearsal against a disposable database copy, then invariant SQL.
6. Production-server HTTP matrix for real 404 status, security headers, CORS, auth 401/403, bounds, and recommendation endpoint.
7. Focused load/query-count benchmark for catalog facets, recommendations, favorites/cart batch, and public write limits.
8. CMS publish/unpublish to rendered public page and media orphan lifecycle integration tests.
9. Runtime responsive/browser pass and screenshot index update.

Do not run unbounded watch/dev/test processes as final verification. Do not stop user-owned services. Remove all disposable data and verify cleanup.

## Regression risks to manage explicitly

- Recommendation/analytics popularity abuse is now bounded by SEC-001 source/global controls and analytics deduplication; production effectiveness still depends on shared Redis and correct ingress CIDRs.
- Staged recommendation/filter queries can create N+1 explosions or stale inaccessible items.
- Auth refresh can loop, replay, race across tabs, or introduce CSRF.
- CSP can break Next scripts, MinIO/CDN images, styles, and telemetry.
- DB constraints/FK changes can fail on unseen environment data or clear live CMS media.
- Media GC can delete live assets if any reference column or grace-period rule is missed.
- Real 404 restructuring can alter streaming, metadata, and cache behavior.
- Asset compression can harm brand-image quality.
- Rate limits can penalize shared NAT users if identity/proxy handling is naive.

## Completion and documentation requirements

- Resolve every issue ID or explicitly document why it is deferred, with owner/risk; do not silently drop IDs.
- Update `docs/PROJECT_MAP.md` for new endpoints/services/migrations/tests/configuration and commands.
- Update `docs/PROJECT_SKILLS.md` with durable patterns and mistakes, especially silent recommendation fallbacks, 401/403 separation, not-found exception mapping, CMS media lifecycle, secure profile defaults, and query-count testing.
- Update the audit reports/test matrix with implementation status and current screenshot evidence rather than deleting the original evidence.
- Final response must follow `AGENTS.md`, list what changed/tested, visual match notes, risks, and both documentation updates.

The work is not complete until REC-001's absolute UI rule is proven, all P1 items pass automated verification, database migrations are rehearsed safely, disposable data is removed, and the blocked current visual pass is completed.

## 2026-07-17 implementation progress: Step 6 complete

PERF-001, PERF-002, and PERF-004 are implemented and verified on a disposable 600-product PostgreSQL fixture. Future agents must preserve these contracts:

- facet metadata is one base aggregate plus at most one typed profile aggregate; never restore full-product scans or per-option counts;
- catalog/quick/batch/recommendation cards share `PublicProductSummaryRepository`; do not fork per-card translation/media/rating loaders;
- cart/favorites refresh only through `POST /api/public/product/batch-summary/{lang}`, capped at 60, with no per-ID failure fallback;
- recommendation selection remains a maximum three fresh queries and the server component remains behind null-fallback `Suspense`;
- no cache or index was added because the realistic local benchmark did not justify its correctness/write/invalidation cost;
- repeat production-copy query plans and concurrent load measurement before changing indexes, caching, or pagination semantics.

At the Step 7 handoff, the next separately scoped work was Step 8; Step 7 constraints/data normalization were not to be reopened or Step 9 folded into it without new evidence and explicit scope. The completion handoff below supersedes that sequencing state without deleting the original decision.

## Step 8 completion handoff - 2026-07-19

Step 8 is complete in code and finite local verification:

- SEC-003: RESOLVED - tested public/CRM security headers, exact-origin CSP, report-only staging mode, ingress-owned HSTS.
- SEC-004: RESOLVED - raw analytics identifiers/payloads removed, historical columns dropped, locked bounded 180-day cleanup and dry-run controls tested.
- PERF-003: RESOLVED - 25 static photographic/banner fallbacks optimized, CMS paths migrated, repository/JS budgets and CI gate passing.
- OBS-001: RESOLVED - minimal anonymous liveness/readiness groups only, with hidden detail and protected remaining Actuator routes.
- OBS-002: RESOLVED - disabled-by-default first-party error/Web Vitals pipeline, scrubbing, deduplication, normalized routes, and actual request-ID propagation.
- API-002: RESOLVED - exact six-value server sort allow-list and 400 `INVALID_SORT` for unsupported nonempty values.
- UI-001: RESOLVED - affected accessible names are localized in RU/KZ/EN and generic components no longer use an English default.

Architecture, config, migrations, measured results, forward recovery, and deployment risks are recorded in `STEP_8_DEPLOYMENT_RUNBOOK.md`; image ownership is in `STEP_8_ASSET_INVENTORY.md`. Do not reopen these decisions without new evidence.

The next authorized phase is Step 9 only. It must perform the final browser/device/responsive/accessibility/screenshot/release verification, including CSP observation against real deployed origins, full converted-asset route comparison, telemetry arrival/alerts when enabled, probe network policy, and rollback rehearsal. Step 8 did not start or claim that release pass.
