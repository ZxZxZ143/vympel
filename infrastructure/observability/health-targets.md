# Health and Restart Targets

- Backend liveness: `/actuator/health/liveness`; no database dependency.
- Backend readiness: `/actuator/health/readiness`; includes database state.
- Storefront: localized production route `/ru`.
- CRM: unauthenticated login page `/login` with `noindex, nofollow` metadata.
- Reverse proxy: private container probe on port 8080 at `/healthz`.
- Metrics: application-network-only backend `/actuator/prometheus`; not published and blocked at the public reverse proxy.
- Containers: alert from the selected runtime's restart-count signal; `process_start_time_seconds` is only the provider-neutral application fallback.

The examples are not added to default Compose. Operators may run Prometheus/blackbox exporter under an explicit, separate profile or use equivalent managed monitoring.
