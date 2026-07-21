# Step 4 Security Rollout - SEC-001 and SEC-002

Date: implemented 2026-07-16; interrupted-session recovery reconciled 2026-07-17. Scope: abuse resistance and secure configuration defaults only.

## Delivered controls

- Endpoint-specific fixed-window limits run through an atomic Redis operation in deployed environments. A bounded in-memory store exists only for explicit `local` and `test` profiles.
- Limiter identities are HMAC-SHA-256 digests. Raw IP addresses, email addresses, contact values, tokens, and internal bucket keys are not written to limiter logs or metrics.
- Client IP resolution ignores forwarding headers from untrusted direct peers. A numeric CIDR allow-list controls which reverse proxies may supply `X-Forwarded-For`; malformed or oversized chains fall back to the direct peer.
- Authentication and public writes fail closed when the limiter store is unavailable. Search/catalog reads and logout fail open to protect availability. Store failure returns a safe correlated 503 when the policy fails closed.
- Every 429 response includes `Retry-After`, `retryAfterSeconds`, `code=RATE_LIMIT_EXCEEDED`, and the same `requestId` exposed in `X-Request-Id`. It never returns a policy name, raw identity, or limiter key.
- Failed login accounts receive exponential temporary backoff after three failures; success clears the account failure state.
- Registration adds a normalized identity bucket, reviews add source/product plus rapid-duplicate protection, customer requests add normalized email/phone duplicate protection, and analytics adds source throttling plus event/session/product deduplication.
- Analytics metadata is limited to ten entries with 50-character keys and primitive/null values no longer than 200 characters. It is validated before product lookup or duplicate acknowledgement; rejected or deduplicated events do not reach persistence.
- Non-local startup rejects a disabled limiter plus blank, weak, placeholder, localhost, insecure-transport, wildcard-origin, memory-limiter, and missing mandatory service configuration. Local exceptions require the explicit `local` profile; test fixtures require `test`. A mixed `production,local` profile is not exempt.

## Protected endpoint inventory

| Endpoint | Auth | Risk | Admission identity / policy | Exhausted behavior |
| --- | --- | --- | --- | --- |
| `POST /api/crm/auth/login` | anonymous credentials | critical brute force / stuffing | source plus normalized account failure/backoff; global write guard | 429, fail closed |
| `POST /api/auth/login/email` | anonymous credentials | critical brute force / stuffing | source plus normalized account failure/backoff; global write guard | 429, fail closed |
| `POST /api/auth/register/email` | anonymous | high account spam / DB growth | source plus normalized email HMAC; global write guard | 429, fail closed |
| `POST /api/crm/auth/refresh` | refresh cookie | high retry/replay loop | source; global write guard | 429, fail closed |
| `POST /api/crm/auth/logout` | optional refresh cookie | low accidental loop | source | 429; limiter outage fails open so logout remains available |
| `POST /api/public/product/{id}/reviews` | guest or optional access JWT | high spam / DB growth | global, source, source-product, rapid source-product-content duplicate | 429, fail closed; moderation remains pending |
| `POST /api/public/requests` | anonymous | high form spam / DB growth | global, source, normalized email/phone HMAC | 429, fail closed |
| `POST /api/public/analytics/products/events` | anonymous | high popularity manipulation / DB growth | global, source, source-event-product-session duplicate | 429 for source/global; duplicate returns 200 with `tracked=false` |
| `GET /api/public/product/search/quick/{lang}` | anonymous | medium query/typing abuse | source | 429; limiter outage fails open |
| Catalog/by-code/by-id/filter reads | anonymous | medium read/query abuse | generous source policy | 429; limiter outage fails open |
| `GET /api/public/product/{lang}/{id}/recommendations` | anonymous | medium query/popularity surface | generous source policy | 429; public UI preserves REC-001 silent omission; limiter outage fails open |

No password reset/change endpoint or anonymous upload endpoint exists in the inspected application. `/api/crm/auth/me`, protected dashboards, and ordinary CRM mutations remain governed by JWT/role checks and existing paging/request bounds; they were not given low anonymous quotas in this scoped step. Any future anonymous write must be added to this inventory and the early filter before release.

## Default policy matrix

| Policy | Capacity / window | Identity / layering | Store failure |
| --- | --- | --- | --- |
| CRM login source | 20 / 5 minutes | trusted client source; account failure/backoff is separate | fail closed |
| Customer login source | 30 / 5 minutes | trusted client source; account failure/backoff is separate | fail closed |
| Login account failures | 10 / 15 minutes | normalized account HMAC | fail closed |
| Registration source | 5 / hour | trusted client source | fail closed |
| Registration identity | 3 / day | normalized email HMAC | fail closed |
| CRM refresh | 60 / minute | trusted client source | fail closed |
| CRM logout | 60 / minute | trusted client source | fail open |
| Public review source | 8 / hour | source-only outer guard | fail closed |
| Public review product | 5 / hour | source plus product | fail closed |
| Rapid duplicate review | 1 / 2 minutes | source/product/rating/text HMAC | fail closed |
| Customer request source | 5 / hour | trusted client source | fail closed |
| Customer request contact | 1 / 30 minutes | normalized email/phone HMAC | fail closed |
| Analytics source | 120 / minute | trusted client source | fail closed |
| Analytics duplicate | 1 / 30 seconds | source/event/product/bounded-session HMAC | duplicate is acknowledged as `tracked=false` |
| Quick search | 120 / minute | trusted client source | fail open |
| Catalog/filter/recommendation reads | 600 / minute | trusted client source | fail open |
| Global public-write burst | 300 / minute | global deployment bucket | fail closed |

Authentication and public-write requests perform a small, bounded number of atomic limiter operations because global, source, and identity/duplicate defenses are intentionally layered. Quick/catalog reads perform one limiter operation. No limiter path scans Redis or the database.

## Required deployment configuration

Use `vympel_back/.env.example` as a key inventory only. Inject real values through the deployment secret manager; never copy values into source, CI output, or an image layer.

- Set a production-like profile that is not `local` or `test`.
- Provide non-placeholder PostgreSQL URL/user/password, S3 endpoint/bucket/access/secret, exact HTTPS storefront/CRM CORS origins, a secure refresh cookie, and the CMS URL/secret when CMS revalidation is required.
- Generate independent high-entropy values of at least 48 characters for `VYMPEL_JWT_SECRET` and `VYMPEL_RATE_LIMIT_HMAC_SECRET`. They must not match.
- Set `VYMPEL_RATE_LIMIT_STORAGE=redis` and a protected `rediss://` URL. Plain `redis://` is rejected outside local/test unless the narrowly scoped insecure-service-transport override is intentionally enabled for a protected private network.
- Set `VYMPEL_TRUSTED_PROXY_CIDRS` to only the final ingress/load-balancer networks that actually connect to the application. Keep Spring's generic forwarded-header strategy disabled; the limiter resolver is the only owner of `X-Forwarded-For` trust.
- Apply an ingress/WAF global connection/request ceiling as an outer layer. The application limits remain authoritative for endpoint/account/contact/dedup semantics.
- Configure Redis persistence/replication, authentication/ACLs, TLS, memory alerts, and a deliberate eviction policy. Limiter state may expire; unrelated Redis data must not be silently evicted by abuse traffic.

Local development must explicitly activate `local`. `docker compose up -d redis minio` starts dependencies; `docker compose --profile backend up --build` is an opt-in local-only full backend stack. The base profile has no usable local DB/JWT/S3/CORS/Redis defaults.

## Metrics, logs, and alerting

Metrics are bounded by configured policy/event enums:

- `rate_limit_allowed_total{policy=...}` and `rate_limit_rejected_total{policy=...}`
- `rate_limit_store_errors_total{policy=...}`
- `rate_limit_latency{policy=...}`
- `login_backoff_total`
- `analytics_deduplicated_total{eventType=...}`

Security logs record the policy category, outcome, safe request correlation, and sampled aggregate rejection count. Alert on sustained rejection-rate changes, any fail-closed store errors, Redis latency/saturation/evictions, or a login-backoff spike. Do not add raw limiter identities to dashboards or logs.

## Rollout and failure modes

1. Provision Redis with TLS/ACLs and deploy the new environment values to staging. Prove startup rejects a deliberately omitted value without printing it.
2. Put the application behind the intended ingress, set only its numeric CIDRs as trusted, and verify direct spoofed forwarding headers cannot create new buckets.
3. Start with the documented defaults, observe rejection ratios by policy and NAT-heavy traffic, then tune through environment values. Do not disable account/contact/duplicate layers to compensate for a shared NAT source limit.
4. Exercise a controlled Redis outage: auth/public writes/analytics must return safe 503, while quick/catalog reads remain available and logout remains idempotent.
5. Roll out by a small instance percentage, watch limiter latency/rejections/store errors, then expand. Keep edge limits active during rollback.

Rotating the limiter HMAC secret invalidates all existing buckets immediately; plan this as a brief reset and monitor abuse afterward. JWT secret rotation invalidates active access/refresh credentials under the current single-key model, so schedule it as a coordinated reauthentication event. Database/S3/CMS credential rotation must overlap old/new credentials where the provider supports it, then remove the old credential after health and functional checks.

## Verification evidence

- Backend: 28 suites / 109 tests, zero failures/errors/skips. Coverage includes identity/policy isolation, exact concurrency, strict concurrent local cardinality, window expiry, bounded local storage/reclamation, filter and direct-backoff fail-open/closed behavior, spoof-resistant proxy resolution, login backoff, no-downstream-call on 429, safe error contracts, exact-origin and non-local-enabled startup guards, analytics/request/review pre-persistence rejection, a two-client Redis/Testcontainers atomic counter test, real HTTP analytics deduplication with an after-test zero-row assertion, and real HTTP login backoff including non-CRM role credentials.
- Public: 2 Vitest files / 6 tests, lint, typecheck, production build, and production status/content matrix passed. Request/review/search UIs preserve input and show localized RU/KZ/EN cooldowns without automatic retry.
- CRM: 3 Vitest files / 15 tests, lint, and production build passed. Login preserves email and shows localized cooldown state; refresh 429 preserves a still-valid access session and emits no expiration event.
- Live bounded matrix on a task-owned test server: quick search `200,200,429`; customer request `400,429`; review `400,429`; analytics `400,400,429`; CRM invalid login `401,401,429`. Invalid write payloads avoided database mutation. Spoofed `X-Forwarded-For` from an untrusted peer did not bypass limits. All 429 responses were correlated and safe.
- Live production guard: a final executable JAR with the production profile and an injected placeholder JWT probe exited with code 1 before opening its port, reported the configuration category, and did not echo the probe value.
- Valid non-local startup: the same JAR started under the production profile against task-owned loopback PostgreSQL/Redis, using complete synthetic values plus the explicit localhost/insecure-transport exceptions required only for that disposable local proof. It applied the migration chain and served public ping with 200; logs contained none of the synthetic DB/JWT/HMAC/S3 secrets. Unit validation separately passed a strict `rediss://`/HTTPS production-like configuration with neither exception. The JVM, two containers, ports, and logs were removed. Do not carry the local exception flags into deployment.
- Recovery live proof: a new task-owned test-profile JAR on port 18086 reproduced the same matrix. The third quick request carried an untrusted spoofed `X-Forwarded-For` and still returned the original-bucket 429. Its body/header cooldown was 59 seconds, request IDs matched, and neither internal policy nor spoof value appeared in the response/logs.
- Cleanup: task JVM and ports 18086/18087 were closed, task logs removed, the task Gradle daemon stopped, no recovery Redis/PostgreSQL container remained, and pre-existing user processes/containers were preserved.

## Recovery reconciliation and final Step 4 disposition

The 2026-07-17 inventory found one coherent architecture and preserved it. Six partial edges were completed: safe wrapping of direct store operations, strict local-store identity capacity, analytics validation before deduplication, indistinguishable/backed-off CRM failure for valid non-CRM users, access-session preservation on refresh 429, and rejection of disabled limiting outside local/test. The protected endpoint and default policy tables above are the final Step 4 policy contract; controller/security re-inventory found no anonymous upload or password-reset route requiring another policy.

**SEC-001: RESOLVED. SEC-002: RESOLVED.** No database schema or Liquibase migration changed. Production remains conditional on TLS/ACL-protected Redis, deliberate eviction/persistence/alerts, exact trusted ingress CIDRs, an edge/WAF ceiling, strong secret injection/rotation, and staged failure/tuning rehearsal.

## Deferred security work

At Step 4 close, SEC-003 browser response headers and SEC-004 analytics identifier retention/minimization remained open. SEC-001 limited and deduplicated analytics input but intentionally did not alter the raw analytics IP/user-agent schema or retention policy. Step 8 resolved both findings; see `SECURITY_AUDIT.md` and `STEP_8_DEPLOYMENT_RUNBOOK.md` for the current contract.
