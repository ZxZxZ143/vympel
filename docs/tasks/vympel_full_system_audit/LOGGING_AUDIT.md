# Logging and Observability Audit

## Technical summary

Backend logging is materially stronger than a default setup: correlation IDs, sensitive-data masking, dedicated application/error/security/CRM action files, size/time rotation, retention caps, and passing routing/masking tests. Health exposure and end-to-end observability remain incomplete, and the browser applications have no error-reporting integration.

## Passing evidence

- Runtime files existed for application, error, security, and CRM actions, with archives dating from July 1.
- Rotation is configured at 50 MB, 30 days, and 256 MB per log family.
- Dedicated log routing, request correlation, and sensitive masking tests passed.
- Error responses include request IDs and omit stack traces; server error logs retain full diagnostic stacks.
- Repository ignore rules exclude runtime log files.

## OBS-001 — Health endpoint is unavailable to unauthenticated orchestrators

- **Severity:** Medium
- **Status:** Reproduced
- **Evidence:** `GET /actuator/health` returned 401 because the security chain protects every route not explicitly permitted.
- **Root cause:** Actuator routes have no distinct operational authorization policy.
- **Required fix:** Define the deployment model: permit only minimal liveness/readiness health without details, or require a platform-specific internal credential/network policy. Keep environment, beans, config, and metrics protected.
- **Acceptance criteria:** Orchestrator health checks work in the target environment; anonymous users cannot retrieve sensitive actuator details; tests cover exposure rules.
- **Regression risks:** Broad `/actuator/**` permit rules would leak operational data; allow only required health groups.

## OBS-002 — No frontend/CRM error reporting or request-linked client telemetry

- **Severity:** Medium
- **Status:** Confirmed by source/config inspection
- **Evidence:** No client error-reporting integration, release correlation, or web-vitals reporting was found. Backend logs have request IDs, but UI errors are mainly console/local state.
- **Root cause:** Observability work focused on the Spring service and file logs.
- **Required fix:** Add privacy-reviewed client error capture, release/environment tags, route/locale context, Web Vitals, and propagation/display of backend request IDs for support. Add metrics for API latency/errors, DB pool, slow queries, cache invalidation, recommendation stages/failures, and public-write rate limits.
- **Acceptance criteria:** A staged client exception and API 500 can be traced from UI report to backend request ID; sensitive values are scrubbed; alerts and retention are documented.
- **Regression risks:** Client telemetry can collect personal data or tokens; enforce allow-lists and sampling.

## Additional operational notes

- Expected not-found requests currently create error noise because API-001 classifies an unknown category as a persistence failure.
- CMS mutation responses reported cache refresh `NOT_CONFIGURED` locally; monitor refresh failures separately from successful database writes after CMS-002 is fixed.
- No slow-query visibility is configured. Add threshold logging/metrics only with bounded parameter masking, not full sensitive SQL values.

## Step 8 closure - OBS-001 and OBS-002 - 2026-07-19

### OBS-001 - RESOLVED

- **Architecture/configuration:** Actuator exposes the `health` endpoint family only. Spring Security anonymously permits exactly `/actuator/health/liveness` and `/actuator/health/readiness`; the root health route and every other Actuator route remain protected. Liveness exposes application state only; readiness exposes state plus PostgreSQL, with details disabled. Successful probes log at debug so routine checks do not flood application logs.
- **Migrations:** None.
- **Tests/results:** Full Spring tests and PostgreSQL/Liquibase integration passed with the probe configuration. The dependency policy intentionally excludes Redis/S3 from readiness because they are not required for every public read.
- **Deployment risk:** Limit probe paths to cluster/ingress health networks and monitor Redis/storage separately.

### OBS-002 - RESOLVED

- **Architecture/files:** Public and CRM `TelemetryProvider`, route/global error boundaries, telemetry libraries/tests, same-origin `/api/telemetry` collectors, and API error paths now form a first-party pipeline. It is a no-op unless browser and server flags are both enabled. No external SDK was added.
- **Data/configuration:** Scrubbers remove tokens, cookie/auth fields, secrets, email, phone, IPv4/IPv6, query strings, passwords, and review/request content. Events are size-bounded and contain normalized route, locale, device class, app/environment/release, event type, metrics, and real request ID only. API clients report network/5xx failures, not routine 400/404/429. LCP/INP/CLS/FCP/TTFB use bounded default 10% sampling; errors are deduplicated but unsampled.
- **Migrations:** None.
- **Tests/results:** Public telemetry 5/5 and CRM telemetry 4/4 passed; client API suites preserve backend request IDs; public/CRM production builds and JS budgets passed. No telemetry SDK bundle cost exists.
- **Deployment risk:** Current collectors write scrubbed JSON to deployment logs, with a required platform retention ceiling of 30 days. Environment/release values, access control, alert routing, and runtime event arrival need deployment/Step 9 confirmation before enabling production.

Operational thresholds, flags, response ownership, and forward-disable instructions are in `STEP_8_DEPLOYMENT_RUNBOOK.md`.

## Step 9 Final Reconciliation - 2026-07-19

Runtime probes preserved request IDs and emitted sanitized 400/401 responses without stack/SQL disclosure. Final public runtime stderr was empty; post-fix backend errors were limited to intentional negative probes. Telemetry remained disabled, so real collector/alert arrival is still a production-environment condition. A low-priority observation remains: a synthetic dual-role CRM activity stored one selected actor role while request MDC retained both roles. See `../vympel_final_release_verification/FINAL_SECURITY_VERIFICATION.md` and `FINAL_ISSUE_REGISTER.md`.
