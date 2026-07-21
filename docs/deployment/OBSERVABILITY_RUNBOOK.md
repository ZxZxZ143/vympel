# Observability Runbook

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
