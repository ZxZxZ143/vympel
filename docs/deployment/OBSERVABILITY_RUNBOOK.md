# Observability Runbook

## Implementation status

Implemented application signals:

- Backend logfmt records are correlated by a validated/generated `X-Request-Id`, pass through the sensitive-data masking layout, and use sanitized API errors.
- Proxy access logs are JSON and include request/upstream timing without bodies or authorization data.
- Storefront and CRM use Next.js `onRequestError` instrumentation to emit bounded JSON records that omit exception messages, headers, bodies, and environment values.
- Liveness/readiness, JVM/process, HTTP, Hikari pool, rate-limit counters/timers, CMS retry outcomes/latency/queue gauges, and auth session rotation/replay/logout counters are available through Micrometer.
- Prometheus export is enabled at application-network-only `/actuator/prometheus`; backend ports are not published by staging/production Compose and the public proxy blocks all `/actuator` routes.
- Every production container has a bounded health check and restart policy. The target platform must supply authoritative container restart counts.

Optional local/provider-neutral examples live under `infrastructure/observability/`. They are intentionally not part of the default local Compose stack. The Prometheus example expects application-network access and a separately operated blackbox exporter.

## Signals

- Backend: structured stdout/stderr and rotating application logs, request IDs, readiness/liveness, HTTP latency/error rates, JVM/process metrics, database pool, Redis rate-limiter state, S3/CMS jobs, analytics cleanup.
- Storefront/CRM: container health, request latency/error rates, Next server errors, and opt-in scrubbed telemetry.
- Proxy: JSON access log to stdout and error log to stderr; retain request ID, status, upstream timing, and host, but never cookies, authorization, query secrets, or request bodies.

## Minimum alerts

Create owned alerts for unavailable readiness, repeated restarts, elevated 5xx, latency saturation, migration failure, database capacity/connection exhaustion, Redis outage, object-storage errors, CMS revalidation backlog/failure, certificate expiry, backup failure, and failed restore rehearsal. Document severity, on-call owner, notification route, and runbook link in the selected monitoring system.

## Triage

1. Identify environment, release SHA, affected host/path, first/last occurrence, and request ID.
2. Compare proxy, app, and dependency signals without exposing credentials or customer content.
3. Decide whether the failure is application-only and safe for immutable image rollback. Never use app rollback as a database rollback.
4. Preserve logs/release metadata and record the incident timeline.

Production approval requires target-environment log ingestion, dashboards, alert delivery, retention, and ownership to be demonstrated. Local telemetry proof alone is insufficient.

## Target-provider requirements still pending

- Choose log/metric storage, retention, access control, alert routing, and on-call ownership.
- Configure an isolated management/application network policy for the metrics endpoint, or add provider-native authenticated scraping without exposing it at ingress.
- Map the provider's container restart, certificate-expiry, managed PostgreSQL, Redis, object-storage, and backup metrics to the inventory.
- Exercise alert delivery and dashboard links in real staging. Example rules are syntax/configuration baselines, not evidence of delivered alerts.
