# Vympel Metric Inventory

| Signal | Metric / source | Labels with bounded cardinality | Purpose |
| --- | --- | --- | --- |
| HTTP requests | `http_server_requests_seconds_*` | method, status, URI template | Error ratio and latency |
| CMS outcomes | `cms_revalidation_attempts_total` | outcome | Success, retry, permanent failure |
| CMS queue | `cms_revalidation_queue_jobs` | status | Backlog and stuck work |
| CMS latency | `cms_revalidation_latency_seconds_*` | outcome | Revalidation target latency |
| Rate limits | `rate_limit_allowed_total`, `rate_limit_rejected_total` | policy | Policy traffic and rejections |
| Rate-limit dependency | `rate_limit_store_errors_total` | policy | Redis/local store failure |
| Auth sessions | `auth_session_events_total` | event, outcome | Session start, refresh rotation/replay, logout |
| Database pool | `hikaricp_connections_*` | pool | Capacity, pending and timeout visibility |
| JVM/process | standard Micrometer JVM/process metrics | application, environment | Memory, CPU, uptime and process restarts |
| Container restarts | target container platform | service, environment, instance | Restart count and crash-loop detection |
| Proxy | JSON access logs | host, status, request ID | Edge status, latency and upstream timing |

Never add user IDs, email addresses, raw client IPs, tokens, request IDs, product IDs, or CMS block IDs as metric labels.
