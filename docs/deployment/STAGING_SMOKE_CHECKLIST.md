# Staging Smoke Checklist

Record release SHA, all three image digests, date/operator, target environment, and sanitized evidence.

- [ ] Environment validation and placeholder scan pass.
- [ ] PostgreSQL backup/restore prerequisite is recorded.
- [ ] Migration job exits successfully and `databasechangelog` matches source.
- [ ] Backend liveness/readiness are healthy internally; protected Actuator paths remain inaccessible externally.
- [ ] Storefront RU, KZ, and EN home/catalog/product paths return expected content.
- [ ] Storefront server-side API and browser-visible API/media origins point to staging.
- [ ] CRM login works using a disposable/approved staging ADMIN; refresh cookie is Secure, HttpOnly, and has the approved SameSite value.
- [ ] If initial ADMIN setup is required, provision the four `VYMPEL_BOOTSTRAP_ADMIN_*` values through the staging secret manager for one controlled deployment only.
- [ ] Verify CRM login and ADMIN authorization, then set `VYMPEL_BOOTSTRAP_ADMIN_ENABLED=false`, remove or rotate the temporary password secret, and redeploy.
- [ ] Existing ADMIN bootstrap is idempotent, does not reset the existing password, and remains disabled after controlled setup.
- [ ] Representative CRM read/write flow works with request IDs and no secret-bearing errors.
- [ ] CMS publish triggers signed server-only revalidation and content becomes fresh in RU/KZ/EN.
- [ ] Image upload limits, object retrieval, orphan/lifecycle behavior, and private credentials are correct.
- [ ] CORS allows only explicit storefront/CRM origins; credentialed wildcard is rejected.
- [ ] HTTP redirects to HTTPS; TLS, forwarded headers, upload/timeouts, and security headers are correct.
- [ ] PostgreSQL, Redis, MinIO console, internal app ports, and protected Actuator endpoints are not publicly exposed.
- [ ] Redis-backed rate limiting works across instances; outage behavior is understood.
- [ ] Logs/telemetry contain release SHA and request IDs but no password, token, cookie, HMAC, or customer payload.
- [ ] Bounded health/smoke scripts pass and leave no temporary servers or test records.
- [ ] SEO canonical domain, metadata, `robots.txt`, and sitemap behavior have been checked for the selected staging policy.

Any unchecked security, migration, authentication, storage, or recovery item blocks production promotion.
