# Security Audit

## Technical summary

Authorization, exact credentialed CORS, BCrypt password hashing, typed JWT validation, rotating hash-backed CRM refresh sessions, safe error bodies, input constraints, upload validation, and log masking are good foundations. SEC-001 and SEC-002 were implemented on 2026-07-16 and reconciled after interrupted work on 2026-07-17: sensitive public/auth traffic is bounded with shared Redis semantics, and non-local startup rejects insecure or disabled protection before beans are created. The original audit left browser headers and analytics minimization open as SEC-003/SEC-004; Step 8 resolves both below.

## SEC-001 — No rate limiting or abuse control on sensitive public endpoints

- **Severity:** High
- **Status:** Resolved and verified on 2026-07-16 (historical finding retained below)
- **Affected endpoints:** CRM/customer login and registration, public reviews, customer requests, analytics events, quick search.
- **Historical evidence:** At audit time there was no limiter/filter/gateway control; analytics was permit-all and persisted each tested request.
- **Root cause:** Security focused on authentication and validation, not request-volume admission control.
- **Implemented fix:** Added configurable global/source/account/contact/product/content layers, exponential login backoff, analytics deduplication/metadata bounds, atomic Redis fixed windows, bounded local memory mode, HMAC identities, trusted-proxy-only forwarding, safe 429/503 contracts, privacy-safe metrics/sampled logs, and localized public/CRM cooldown UX. High-risk routes fail closed on store failure; selected reads/logout fail open.
- **Verification:** Backend 109/109 includes concurrent exact-capacity/cardinality/window/failure-mode tests, a two-client disposable Redis integration test, proxy spoof/malformed-chain tests, bounded-memory reclamation, identity/policy isolation, no-downstream persistence assertions, real HTTP analytics deduplication, and real HTTP login backoff. A bounded live matrix produced search `200,200,429`, request `400,429`, review `400,429`, analytics `400,400,429`, and CRM login `401,401,429`; spoofed forwarding did not bypass limits and 429 bodies/headers were correlated and key-free.
- **Remaining operational risk:** Shared NATs can need capacity tuning; Redis TLS/ACL/persistence/memory/eviction and an ingress/WAF ceiling are deployment prerequisites. See `STEP_4_SECURITY_ROLLOUT.md`.

## SEC-002 — Local default credentials and JWT secret can start outside a local profile

- **Severity:** High
- **Status:** Resolved and verified on 2026-07-16 (historical finding retained below)
- **Historical evidence:** Base `application.yml` contained usable database/JWT/MinIO fallbacks and no production startup guard.
- **Root cause:** Local convenience defaults were embedded in the base profile.
- **Implemented fix:** Usable values now live only in explicit local/test profiles. Base configuration requires injected DB/JWT/limiter/S3/CORS/Redis values and secure cookie defaults. A pre-bean validator rejects a disabled non-local limiter, blank/placeholder/weak or reused keys, local/insecure services, wildcard/non-HTTPS origins, memory limiting, missing required CMS configuration, and mixed production/local profiles without printing values. Placeholder-only backend/public examples, a secret-free non-root Dockerfile, Redis Compose support, and rotation/rollout guidance were added.
- **Verification:** Startup tests cover local/test exemptions, mixed-profile rejection, each required configuration family, exact-origin CORS, no-value-leak failure messages, and a strict `rediss://`/HTTPS production-like pass. A final production-profile JAR with a placeholder probe exited 1 before opening a port and did not echo the value. A separate full-stack local proof used explicit localhost/insecure-transport exceptions only for task-owned PostgreSQL/Redis, then applied migrations and served ping 200 without logging synthetic secrets; every task resource was removed. The full backend suite and executable JAR build pass.
- **Remaining operational risk:** Secret injection/rotation, Redis/S3/DB endpoint TLS, exact ingress CIDRs, and profile selection remain deployment-owned; CI must activate `test` or inject production-like values.

## 2026-07-17 interrupted-session recovery reconciliation

- **Inherited and preserved:** The existing Redis Lua fixed-window store, bounded local/test store, HMAC identities, trusted-proxy resolver, endpoint policy filter, privacy-safe telemetry, login backoff, write deduplication, localized cooldown UX, explicit profiles, non-root image, and deployment runbook were coherent; no parallel limiter or database migration was added.
- **Recovered gaps:** Direct login-backoff store operations now use the same bounded fail-closed error path as admission checks; concurrent distinct local keys cannot exceed the configured cardinality; analytics metadata is validated before duplicate acknowledgement; valid non-CRM credentials receive the same safe 401/backoff treatment as other CRM login failures; CRM refresh 429 no longer clears a valid access session; and non-local startup cannot disable rate limiting.
- **Current evidence:** Backend 109/109, public 6/6 plus lint/typecheck/build/production-status, CRM 15/15 plus lint/build, the bounded HTTP matrix above, and a current executable production placeholder rejection all passed. Raw credentials, spoofed forwarding values, and synthetic secrets were absent from inspected task logs.
- **Status:** SEC-001 resolved. SEC-002 resolved. Production Redis/WAF/proxy/secret operations remain deployment prerequisites, not locally proven infrastructure state.

## SEC-003 — Public and CRM Next.js responses omit baseline browser security headers

- **Severity:** Medium
- **Status:** Reproduced over HTTP
- **Evidence:** Public home and CRM login returned no CSP, X-Frame-Options/frame-ancestors, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy. Backend API returned `DENY` and `nosniff`.
- **Root cause:** Both Next configs omit response headers and no tested local reverse proxy adds them.
- **Required fix:** Define headers in Next configuration or the deployment edge, including a tested CSP compatible with Next.js, `frame-ancestors`, `nosniff`, a deliberate referrer policy, and a minimal permissions policy. Apply HSTS only at HTTPS production ingress.
- **Acceptance criteria:** Header integration tests cover public and CRM HTML/assets; CSP has no unexpected violations in required flows; local HTTP is not forced into broken HSTS behavior.
- **Regression risks:** A strict CSP can break Next scripts, images from MinIO/CDN, inline styles, analytics, or development HMR; stage with report-only mode first.

## SEC-004 — Analytics stores raw network identifiers without a visible retention/minimization policy

- **Severity:** Medium
- **Status:** Confirmed by schema and service inspection
- **Evidence:** `product_analytics_event` stores raw `ip_address` and full `user_agent`; 137 baseline rows existed. Historical audit traffic had no deduplication/rate limit. Step 4 now adds source throttling, HMAC-keyed duplicate suppression, and bounded metadata, but intentionally does not alter the raw identifier schema or retention policy.
- **Root cause:** Analytics collection was built for event attribution without a documented privacy lifecycle.
- **Required fix:** Confirm legal/business need; minimize or keyed-hash IPs, bound user-agent detail, add retention/deletion jobs, disclose collection, and combine with SEC-001 abuse controls. Avoid reversible hashes without a managed secret.
- **Acceptance criteria:** A documented retention period is enforced; stored fields are minimized; deletion is testable; analytics counts remain useful; privacy documentation is updated.
- **Regression risks:** Changing identity fields can break historical deduplication and trend comparability; version the method.

## Passing controls

- CORS accepted the exact trusted localhost origin and rejected an untrusted origin.
- Backend authorization correctly separated public, customer, MANAGER, and ADMIN routes in tested cases.
- BCrypt is used for passwords.
- Safe error envelopes and dedicated logging tests prevent stack/secret exposure to clients.
- CMS links restrict protocols; public text DTOs reject angle-bracket HTML; image validation checks content type, extension, emptiness, size, count, and product ownership.
- No `dangerouslySetInnerHTML`, `eval`, or dynamic function execution was found in the inspected application source.
- JWT parsing requires signature, issuer, audience, subject, jti, iat, exp, and exact access/refresh type with bounded clock skew; access authorization reloads enabled state and roles from PostgreSQL.
- CRM refresh credentials are inaccessible to JavaScript in a host-only HttpOnly path-scoped cookie; only SHA-256 jti hashes are stored server-side. Rotation, replay family invalidation, idempotent logout, role/status revocation, and cleanup are tested.
- Cookie-authenticated refresh/logout enforce exact allow-listed Origin/Referer in addition to credentialed CORS; wildcard/empty origin configuration fails closed.

## Auth/session implementation cross-reference

AUTH-001/CRM-001 are resolved in Step 3 and SEC-001/SEC-002 in Step 4. The chosen auth model remains a sessionStorage access token plus rotating HttpOnly `SameSite=Lax` refresh cookie. Production must not activate `local`, must use HTTPS, exact origins, same-site CRM/API, distributed Redis, and trusted ingress CIDRs. Cross-site deployment remains unsupported by the current CSRF design. At this pre-Step-8 audit point, the remaining security findings were SEC-003 response headers and SEC-004 analytics retention/minimization; their closure is recorded below.

## Step 8 closure - SEC-003 and SEC-004 - 2026-07-19

### SEC-003 - RESOLVED

- **Architecture:** Both Next applications own a tested header allow-list in `security-headers.mjs`, applied by `next.config.mjs` to HTML, `/_next/static/*`, first-party API responses, and public assets. The policy supplies enforced CSP by default, DENY framing, MIME sniff prevention, strict-origin referrers, and disabled camera/microphone/geolocation/payment/USB permissions.
- **Files/configuration:** Public and CRM header builders, Next configs, `.env.example`, header unit tests, and production response probes changed. API/media connectivity is derived from exact configured HTTP(S) origins. Production CSP has no wildcard and no `unsafe-eval`; development adds only localhost/HMR needs. `SECURITY_HEADERS_CSP_MODE=report-only` exists for staging measurement.
- **Migrations:** None.
- **Tests/results:** Both 3-case header unit suites passed. The public production probe passed for HTML, a public image, `/api/telemetry`, and a built JS chunk; the CRM probe passed for HTML, telemetry, and a built JS chunk. Local HTTP correctly emitted no HSTS.
- **Deployment risk:** HSTS belongs at the terminating production HTTPS ingress, not Next. Exercise real staging origins report-only, then enforce; do not weaken CSP broadly for a single violation. The current Next bootstrap still requires measured `unsafe-inline`, documented in the runbook.

### SEC-004 - RESOLVED

- **Architecture:** Persisted analytics is now the minimum aggregate event: product, allow-listed event type, and creation time. `sessionId` is used only for ephemeral duplicate protection. `user_id`, raw IP, full User-Agent, and arbitrary metadata collection/storage were removed. A scheduled transactional service takes a PostgreSQL advisory lock and deletes expired rows in bounded batches.
- **Files/configuration:** `ProductAnalyticsEvent`, request/service/repository/dashboard period code, retention service/job/tests, application configuration, and backend `.env.example` changed. Default policy is 180 days and supports enabled, dry-run, cron, batch-size, and max-batch controls.
- **Migration/existing data:** `2026-07-19-01-minimize-product-analytics` has schema preconditions and drops the five historical raw columns. Historical identifiers are removed rather than pseudonymized. Restoring old code requires backup restore or a forward compatibility migration.
- **Tests/results:** Retention unit tests cover dry-run, lock contention, and bounded termination; PostgreSQL integration proves expired deletion and current-event preservation. The full backend suite passed. The maximum CRM analytics period is now explicitly 180 days.
- **Deployment risk:** Approve policy, deploy cleanup dry-run first, compare the SQL candidate count, then enable deletion. Monitor `analytics_retention_deleted_total` and hold a verified backup.

The complete response-header inventory, field classification, CSP/HSTS rollout, retention SQL, and forward-recovery procedure are in `STEP_8_DEPLOYMENT_RUNBOOK.md`.

## Step 9 Final Reconciliation - 2026-07-19

Application security/privacy gates pass locally: dependency audits are zero after Next.js/next-intl updates; auth rotation/replay/logout and RBAC behave correctly; exact local CORS origins are allowed and a hostile origin is denied; errors are sanitized; health exposure is restricted; CSP/security headers pass; token-hash, analytics minimization, and 180-day retention invariants are zero. TLS/HSTS, shared Redis, secret-manager, alert, and backup controls remain production-environment conditions. See `../vympel_final_release_verification/FINAL_SECURITY_VERIFICATION.md`.
