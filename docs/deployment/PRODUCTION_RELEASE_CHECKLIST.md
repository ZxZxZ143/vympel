# Production Release Checklist

## Condition classification for `v1.0.0-rc.1`

| Classification | Conditions |
| --- | --- |
| Resolved locally | Three-image builds; SEO/CRM crawler policy; ADMIN regression and controlled procedure; canonical 77-change migration; isolated PostgreSQL backup/restore; signed CMS freshness/retry/timeout; proxy routing/policy; Prometheus/rule syntax; Compose/workflow/script validation |
| Verified in remote CI | Exact commit `954e8a3a659371ba0203369aec9d2fef968fab5b` passed backend, storefront, CRM, full release, performance, and three-boundary no-push image workflows; evidence is in `REMOTE_CI_VERIFICATION.md` |
| Provider-specific | Hosting, final domains, registry/digests, managed PostgreSQL restore, Redis, object storage, secret manager, monitoring/alert delivery, public TLS/trusted proxies, real staging |
| Blocked | Any target database containing `2026-07-13-01-seed-accessory-split-categories` without an exact accountable external acceptance record |
| Accepted risk | None granted by this repository task; local self-signed TLS and local restore are explicitly non-production evidence |

## Before approval

- [ ] Hosting/provider, domains, registry, PostgreSQL, Redis, object storage, secrets manager, monitoring, and owners are selected.
- [x] Full release gate passed at exact SHA `954e8a3a659371ba0203369aec9d2fef968fab5b`; RC tag `v1.0.0-rc.1` points to that commit.
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

- [ ] Temporary `VYMPEL_BOOTSTRAP_ADMIN_EMAIL`, `VYMPEL_BOOTSTRAP_ADMIN_PASSWORD`, and `VYMPEL_BOOTSTRAP_ADMIN_NAME` values are provisioned through the secret manager.
- [ ] `VYMPEL_BOOTSTRAP_ADMIN_ENABLED=true` is used for one controlled deployment only.
- [ ] CRM login and ADMIN authorization are verified; exactly one ADMIN exists without recording the password/hash.
- [ ] `VYMPEL_BOOTSTRAP_ADMIN_ENABLED=false` is restored.
- [ ] The temporary password secret is removed or rotated.
- [ ] The service is redeployed with bootstrap disabled; ADMIN remains usable and its password hash is unchanged.

## Deploy and close

- [ ] Migration job succeeds before application promotion.
- [ ] Backend, storefront, CRM, then reverse proxy become healthy within bounded time.
- [ ] Production smoke tests and CMS freshness pass.
- [ ] Release manifest, approvals, sanitized logs, and image digests are retained.
- [ ] Rollback SHA remains available; no database rollback is automated.

Production is **NOT READY** until every target-environment item above has evidence and explicit approval.
