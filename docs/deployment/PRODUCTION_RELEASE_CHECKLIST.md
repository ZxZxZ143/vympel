# Production Release Checklist

## Before approval

- [ ] Hosting/provider, domains, registry, PostgreSQL, Redis, object storage, secrets manager, monitoring, and owners are selected.
- [ ] Full release gate passed at the exact 40-character Git SHA.
- [ ] The release manifest records three immutable image refs and verified digests; none uses `latest`.
- [ ] Images were built for the final public API/media origins.
- [ ] Secrets were generated/stored outside Git and environment validation passes.
- [ ] TLS, proxy trust boundaries, explicit CORS, Secure/HttpOnly/SameSite cookies, and no public data-service/admin ports are proven.
- [ ] Database backup completed; isolated restore rehearsal meets RPO/RTO.
- [ ] `databasechangelog` matches source, including an explicit decision for `2026-07-13-01-seed-accessory-split-categories`.
- [ ] Migration/forward-fix plan and previous compatible image SHA are recorded.
- [ ] CMS signed revalidation and freshness, object-storage versioning/backup, Redis TLS/ACL/private network, and multi-instance rate limiting are proven.
- [ ] Monitoring dashboards, alert delivery, retention, and on-call ownership are proven.
- [ ] SEO canonical domain, sitemap, robots, localized metadata, and analytics consent/baseline decisions are approved.
- [ ] Staging smoke checklist passed on the same images and production-like configuration.

## Controlled ADMIN setup (only if no ADMIN exists)

- [ ] Temporary credentials are supplied by the secret manager; bootstrap is enabled for one controlled deployment.
- [ ] Exactly one ADMIN and CRM login are verified without recording the password/hash.
- [ ] Bootstrap is disabled, temporary credentials are rotated/removed, and the disabled configuration is redeployed.
- [ ] ADMIN remains usable and its password hash is unchanged.

## Deploy and close

- [ ] Migration job succeeds before application promotion.
- [ ] Backend, storefront, CRM, then reverse proxy become healthy within bounded time.
- [ ] Production smoke tests and CMS freshness pass.
- [ ] Release manifest, approvals, sanitized logs, and image digests are retained.
- [ ] Rollback SHA remains available; no database rollback is automated.

Production is **NOT READY** until every target-environment item above has evidence and explicit approval.
