# Vympel Log Field Contract

Backend application logs are structured logfmt records with ISO timestamp, level, `requestId`, `userId`, `roles`, HTTP method/path, thread, logger, event message, and sanitized exception type. The masking layout applies to console and rolling files. Security and CRM audit events use stable `event=...` fields and never include tokens or plaintext credentials.

The reverse proxy emits JSON with `time`, `request_id`, `remote_addr`, `host`, `method`, `uri`, `status`, `bytes`, `request_time`, and `upstream_time`. Provider ingestion must redact or hash client addresses according to policy and must not add cookies, authorization headers, request/response bodies, or query secrets.

Storefront and CRM server failures emit a bounded JSON record with `event`, service, release, error type, method, sanitized path, router kind, route path, and route type. Exception messages, headers, bodies, and environment values are intentionally excluded.
