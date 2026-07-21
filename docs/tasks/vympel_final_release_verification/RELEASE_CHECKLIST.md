# Release Checklist

Date: 2026-07-19

## Completed Local Release Gates

- [x] Backend focused regression, full forced test suite, and boot JAR pass.
- [x] Public clean install, lint, typecheck, 23 tests, production build, status/security/budget gates pass.
- [x] CRM clean install, lint, typecheck, 23 tests, production build, header/security/budget gates pass.
- [x] Public and CRM full dependency audits report zero vulnerabilities.
- [x] PostgreSQL clean and upgrade migration rehearsals reach the latest current change.
- [x] Final database invariants are zero.
- [x] Public/CRM/auth/RBAC/rate-limit API matrices pass with corrected customer-only proof.
- [x] Disposable product/CMS media lifecycle and MinIO deletion pass.
- [x] Current browser route/responsive/manual focus checks pass for sampled scope.
- [x] Final axe run reports zero violations on four representative pages.
- [x] Screenshots and evidence are indexed with correct media extensions.
- [x] No Must-fix Step 9 issue remains open.
- [x] Audit-owned cleanup complete. The 2026-07-21 repository cleanup audit removed the remaining Step 9 container, clean/upgrade rehearsal volumes, both named temporary directories, and lingering 3100/3101 audit processes. User-owned services and final evidence were preserved.

## Required Before Staging Deployment

- [ ] Freeze and identify the exact source/package/container revisions; the current root/CRM Git baseline is not trustworthy.
- [ ] Run the same finite gates in CI from a clean checkout.
- [ ] Provision staging secrets through the deployment secret manager.
- [ ] Compare staging database history and rehearse the current migration on a fresh production-like copy.

## Required Before Production Promotion

- [ ] Resolve or formally accept `FINAL-DB-001` (missing historical Liquibase source artifact).
- [ ] Complete backup restore rehearsal and document forward recovery/rollback checkpoints.
- [ ] Configure CMS revalidation URL and HMAC; prove publish, failure, retry, and cache freshness end to end.
- [ ] Validate HTTPS redirect, TLS, HSTS, CSP/header preservation, trusted proxies, and cookies at ingress.
- [ ] Validate shared Redis authentication/TLS/ACL, multi-node rate limiting, and outage behavior.
- [ ] Decide/implement sitemap, robots, canonical, and locale alternates, or explicitly accept `FINAL-SEO-001`.
- [ ] Verify telemetry/error alert delivery and retention/cleanup schedules.
- [ ] Run staging smoke, browser, and accessibility matrix with production-like content.
- [ ] Execute canary rollout with dashboards for error rate, latency, DB locks, auth replay, and CMS queue age.

## Go/No-Go Rule

- Current decision: **READY FOR STAGING**.
- Production is **NO-GO** until all unchecked production conditions are closed or signed off by the accountable release owner.
