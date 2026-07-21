# Step 8 Deployment Runbook

Date: 2026-07-19

This runbook covers SEC-003, SEC-004, PERF-003, OBS-001, OBS-002, API-002, and UI-001. It does not authorize the Step 9 release, cross-browser, responsive, screenshot, or broad end-to-end pass.

## Browser security headers

| Surface | Response classes verified | Application source | Required deployment ownership |
| --- | --- | --- | --- |
| Public Next.js | HTML, `/_next/static/*`, `/api/telemetry`, public files | `vympel_front/security-headers.mjs` through `next.config.mjs` | Ingress must preserve these headers and own HSTS. |
| CRM Next.js | HTML, `/_next/static/*`, `/api/telemetry` | `vympel_crm/security-headers.mjs` through `next.config.mjs` | Ingress must preserve these headers and own HSTS. |
| Spring API | API/security defaults plus `X-Request-Id` | Spring Security and `RequestCorrelationFilter` | Ingress must preserve the request ID; only the two probe groups are anonymous. |

Both Next applications emit `Content-Security-Policy` by default, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive `Permissions-Policy`. The production CSP has no wildcard source and no `unsafe-eval`. `unsafe-inline` remains limited to script/style because the current Next.js static bootstrap and inline styles require it; removing it requires a nonce/hash architecture and separate measurement.

`SECURITY_HEADERS_CSP_MODE=report-only` switches only the CSP header name for staging observation. Roll out as follows:

1. Configure the exact API/media origins with `NEXT_PUBLIC_BASE_API_PUBLIC`, `NEXT_PUBLIC_CRM_API_BASE`, and `NEXT_PUBLIC_MEDIA_ORIGINS`; do not use `*`.
2. Deploy staging with `SECURITY_HEADERS_CSP_MODE=report-only`, exercise Step 9 routes, and inspect browser/ingress CSP violation output.
3. Correct only evidenced missing origins, then unset the variable or set `enforce` for production.
4. Run `npm run test:security` and the applicable production response test after every allow-list change.

Local HTTP intentionally emits no `Strict-Transport-Security`. Production ingress owns HSTS because it knows whether TLS and every subdomain are safe. Start with `Strict-Transport-Security: max-age=31536000; includeSubDomains` only after all covered subdomains are HTTPS. Do not add `preload` until the separate irreversible preload requirements are approved.

## Analytics privacy, schema, and retention

| Field | Previous classification | Step 8 state | Retention |
| --- | --- | --- | --- |
| `product_id` | Business dimension | Retained | 180 days |
| `event_type` | Business event | Retained, allow-listed | 180 days |
| `created_at` | Event time | Retained | 180 days |
| `session_id` | Pseudonymous identifier | Accepted only as an ephemeral duplicate-protection input; never persisted | Limiter window only |
| `user_id` | Direct account link | Column and historical values removed | None |
| `ip_address` | Network identifier | Collection and column removed | None |
| `user_agent` | Device fingerprint input | Collection and column removed | None |
| `metadata_json` | Unbounded/high-risk payload | Collection and column removed | None |

Liquibase changeset `2026-07-19-01-minimize-product-analytics` halts if the expected historical schema is not present, then drops the five raw columns. This is intentional historical-data remediation, not reversible data preservation. A rollback to old application code requires a database backup restore or a forward schema compatibility migration; do not blindly roll the binary back after applying this changeset.

The cleanup service uses a PostgreSQL transaction advisory lock and bounded batches. Configure:

- `VYMPEL_ANALYTICS_RETENTION_DAYS=180`
- `VYMPEL_ANALYTICS_CLEANUP_ENABLED=true`
- `VYMPEL_ANALYTICS_CLEANUP_DRY_RUN=true` for the first deployment
- `VYMPEL_ANALYTICS_CLEANUP_CRON`, `VYMPEL_ANALYTICS_CLEANUP_BATCH_SIZE`, and `VYMPEL_ANALYTICS_CLEANUP_MAX_BATCHES` for the bounded window

Preflight/dry-run count:

```sql
SELECT count(*)
FROM product_analytics_event
WHERE created_at < now() - interval '180 days';
```

Confirm the dry-run candidate log, dashboard period semantics, and policy approval before setting `VYMPEL_ANALYTICS_CLEANUP_DRY_RUN=false`. Monitor `analytics_retention_deleted_total`; a second instance skips while the advisory lock is held. Aggregate dashboards now label their maximum window as 180 days, so expired row deletion does not imply an all-time report.

## Minimal health probes

- Liveness: `GET /actuator/health/liveness`
- Readiness: `GET /actuator/health/readiness`
- Other Actuator paths, including `/actuator/health`, remain protected.
- Anonymous responses never show component details.
- Liveness contains only application liveness state. Readiness includes application readiness plus PostgreSQL.

Deployment policy treats PostgreSQL as required for serving the application. Redis protects abuse-controlled writes and S3/MinIO supports uploads/media administration, but neither is required for every public read; they are therefore monitored separately rather than making the whole service unready. Restrict both probe paths to cluster/ingress health-check networks even though the application layer permits them anonymously. Successful probe requests log at debug; failures retain normal visibility.

## First-party telemetry and request correlation

Public and CRM clients send same-origin events to their own `/api/telemetry` collectors. No third-party SDK or external destination was added. Both browser and server flags must be true (`NEXT_PUBLIC_TELEMETRY_ENABLED=true` and `TELEMETRY_ENABLED=true`); the default is a no-op.

Events contain only application, environment, release, normalized route, locale, device class, event type, bounded message/metric data, and an actual backend request ID when one exists. The scrubber removes URL queries, emails, telephone numbers, IPv4/IPv6 addresses, JWT-like tokens, long secrets, authorization/cookie fields, passwords, access/refresh tokens, and review/request text. Client error boundaries report unexpected failures and provide retry UI. API clients report network errors and 5xx responses; routine 400/404/429 responses are not elevated. Backend `X-Request-Id`/error `requestId` values flow into typed client errors and support references; no identifier is fabricated.

Web Vitals captured are LCP, INP, CLS, FCP, and TTFB. Only Web Vitals use bounded sampling (`NEXT_PUBLIC_TELEMETRY_WEB_VITALS_SAMPLE_RATE`, default `0.1`); errors are deduplicated but not sampled. Route values replace IDs with low-cardinality placeholders. Operational reference thresholds are LCP 2500 ms, INP 200 ms, CLS 0.1, FCP 1800 ms, and TTFB 800 ms. These are alert targets, not a claim that Step 8 improved field data.

Set distinct `TELEMETRY_ENVIRONMENT`/`NEXT_PUBLIC_TELEMETRY_ENVIRONMENT` and `TELEMETRY_RELEASE`/`NEXT_PUBLIC_TELEMETRY_RELEASE` values per deployment. The current collector writes scrubbed structured events to platform logs; retain them for at most 30 days and apply the platform's access controls. A future external provider requires a new privacy/configuration review and bundle measurement.

## Assets and budgets

`vympel_front/scripts/optimize-public-images.py --apply` is an explicit 25-file pipeline. It preserves pixel dimensions, encodes WebP at quality 84/method 6, verifies decode/dimensions, and removes only the exact source allow-list after successful output. It does not touch runtime user uploads. Liquibase changeset `2026-07-19-02-update-public-image-paths-to-webp` updates matching `cms_media` `PUBLIC_PATH` records without rewriting historical seed migrations.

Run `cd vympel_front && npm run test:budgets:ci` after both Next builds. The gate enforces 24 MiB total public assets, 1.5 MiB per raster unless explicitly documented in the empty allow-list, 1.65 MiB public static JS, and 1.40 MiB CRM static JS. `.github/workflows/performance-budgets.yml` runs the builds and this gate in CI. See `STEP_8_ASSET_INVENTORY.md` for measurements and ownership.

## API and accessibility contracts

Public catalog sort accepts only `newest`, `oldest`, `priceAsc`, `priceDesc`, `nameAsc`, and `nameDesc`. Omitted/blank sort retains the default. Any other nonempty or differently cased value returns 400 `INVALID_SORT`; callers cannot select arbitrary properties. The public sort controls emit only their supported subset and keep the existing URL contract.

Accessibility names for navigation landmarks, home/language controls, pagination, banner carousel controls, catalog breadcrumbs, meaningful philosophy images, search inputs, and telemetry error UI live in RU/KZ/EN messages. Shared components receive localized names instead of carrying an English default. Step 9 still owns real screen-reader, locale-switching, mobile, and high-DPI release smoke checks.

## Finite verification and forward recovery

Required commands:

```text
vympel_back: .\gradlew.bat test
vympel_front: npm run lint && npm run typecheck && npm test && npm run build
vympel_front: npm run test:security && npm run test:production-status && npm run test:budgets:ci
vympel_crm: npm run lint && npm test && npm run build
vympel_crm: npm run test:security && npm run test:production-headers
```

If CSP blocks a required origin, return staging to report-only while narrowing the allow-list; do not disable all headers. If telemetry causes operational trouble, disable either telemetry flag without affecting page function. If analytics cleanup removes unexpected rows, stop cleanup, preserve evidence, and recover from a verified database backup; deleted raw identifiers cannot be reconstructed by application rollback. If WebP references fail, fix forward with a new CMS mapping/static deployment or restore both assets and DB URLs together.
