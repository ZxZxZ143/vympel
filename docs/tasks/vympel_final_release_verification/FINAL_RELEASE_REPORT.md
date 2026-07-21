# Vympel Final Release Verification Report

Date: 2026-07-19  
Scope: Step 9 of 9, resumed final verification of the public storefront, CRM, Spring backend, PostgreSQL migrations, MinIO lifecycle, and release controls.

## Release Readiness Verdict

**READY FOR STAGING**

All newly discovered Must-fix findings were corrected and their affected gates were rerun. Backend, storefront, and CRM finite suites pass; both clean and existing-data migration rehearsals reach the current schema; representative public/CRM/auth/CMS/storage flows pass; final axe scans report zero violations on four representative pages; production dependency audits report zero known vulnerabilities; and the final asset/bundle budgets pass.

This is not approval for an unattended production rollout. Production promotion remains conditional on the items in `RELEASE_CHECKLIST.md`, especially reconciliation of one historical Liquibase row whose source changelog file is absent, deployment-level TLS/HSTS/Redis/backup checks, a configured CMS revalidation target, and an SEO implementation decision.

## Step 9 Fixes

1. **CMS after-commit transaction failure** — `CmsMediaLifecycleService` now performs post-commit database work in an explicit `REQUIRES_NEW` transaction. A focused regression test was added. The rerun produced no after-completion exception and removed the disposable CMS block, media row, and MinIO object.
2. **Vulnerable frontend dependency graph** — public and CRM were upgraded to Next.js `16.2.10`; public `next-intl` to `4.13.2`; patched transitive versions are enforced where required. Clean installs, builds, tests, and full dependency audits pass with zero advisories.
3. **HTML language correctness** — the public `kz` route now emits standards-correct `lang="kk"`, covered by three tests and verified in the browser.
4. **Accessibility defects** — corrected text contrast, decorative image alternatives, heading hierarchy, duplicate landmark naming, missing error-state H1 semantics, carousel accessible naming, and the rating ARIA role. The final four-page axe run is clean.
5. **Small-screen presentation** — the 320 px home carousel controls no longer collide with content; catalog mobile sheets cover the fixed bottom navigation and restore focus on close.
6. **Evidence integrity** — recovered artifacts were indexed, current screenshots were retained, JPEG captures were renamed from misleading `.png` extensions to `.jpg`, and the CMS cleanup status artifact was corrected with a direct HTTP 404 object probe.

## Environment Tested

| Component | Verification target |
| --- | --- |
| Backend | Java 17 Spring Boot JAR; isolated services on ports 18090/18091 |
| Databases | Disposable PostgreSQL 16 clean install on 55432 and PostgreSQL 18 upgrade rehearsal on 55433 |
| Public | Next.js 16.2.10 production build/run on 3100, configured for the isolated backend |
| CRM | Next.js 16.2.10 production build/run on 3101, configured for the isolated backend |
| Storage | Existing MinIO on 9000, using only disposable Step 9 objects |
| Browser | Current in-app Chromium plus matched Chrome 150/ChromeDriver 150 for axe 4.12.1 |

User-owned services on 3000/3001/8080/5432/8000/9000/9001 were not replaced or cleaned. The root repository and CRM do not provide a trustworthy Git baseline; source parity between the verification copies and public/CRM working trees was therefore checked by SHA-256, with only TypeScript build caches differing.

## Gate Summary

| Area | Result | Evidence |
| --- | --- | --- |
| Backend tests | PASS — 36 suites, 149 tests, 0 failures/errors, 1 skipped; 54.568 s XML total | `logs/backend/gradle-test-rerun.log` |
| Backend package | PASS — boot JAR built | `logs/backend/bootjar.log` |
| Public finite gates | PASS — lint, typecheck, 8 files/23 tests, 32-page build, status/security/budget suites | `logs/public/` final logs |
| CRM finite gates | PASS — lint, typecheck, 6 files/23 tests, 17-page build, headers/security/budgets | `logs/crm/` final logs |
| Dependency security | PASS — public and CRM full npm audits: 0 vulnerabilities | `npm-audit-all-final*.json` |
| Clean migration | PASS — current latest changelog, 51 tables, invariants zero | `logs/database/final-invariants.log` |
| Upgrade migration | PASS WITH CONDITION — schema/data valid; one historical executed row has no source file | `logs/database/final-invariants.log` |
| API/auth/RBAC | PASS — representative 200/201/202/204/400/401/403/404/429 behavior | `FINAL_API_MATRIX.md` |
| CMS/storage | PASS locally — publish/unpublish/reference/lifecycle cleanup verified | `logs/backend/upgrade_cms_lifecycle.log`, corrected cleanup JSON |
| UI/responsive | PASS on required sampled routes/viewports | `FINAL_UI_UX_VERIFICATION.md` |
| Accessibility | PASS for tested scope — final axe 0 violations on 4 pages plus manual checks | `FINAL_ACCESSIBILITY_VERIFICATION.md` |
| Security/privacy | PASS locally; deployment controls remain staging-owned | `FINAL_SECURITY_VERIFICATION.md` |
| Performance | PASS bounded local gates; not a production capacity claim | `FINAL_PERFORMANCE_VERIFICATION.md` |

## Historical Issue Reconciliation

The 25 issues from the original full-system audit are now classified as:

- **Resolved: 22** — REC-001, API-001, API-002, WEB-001, CRM-001, AUTH-001, SEC-001 through SEC-004, PERF-001 through PERF-004, DB-001, DB-002, DATA-001, DATA-002, OBS-001, OBS-002, UI-001, BLOCK-UI-001.
- **Partially resolved: 3** — CMS-001 and CMS-002 are locally verified but production object retention/revalidation infrastructure still needs staging proof; TEST-001 has strong finite/manual evidence but no permanent checked-in browser/axe suite.
- **Regressed: 0.**
- **Blocked: 0.**

`BLOCK-UI-001` is closed: current browser automation, DOM checks, manual keyboard/focus checks, and 40 indexed captures are available.

## Deferred Findings

| ID | Priority | Disposition | Summary |
| --- | --- | --- | --- |
| FINAL-DB-001 | Medium | Production condition | Upgrade DB has executed historical change `2026-07-13-01-seed-accessory-split-categories`, but that changelog file is absent from current source and from the clean rehearsal. |
| FINAL-SEO-001 | Medium | Production condition | No sitemap, robots route, canonical URL, or locale alternate metadata is implemented. |
| FINAL-TEST-001 | Medium | Can defer for staging | Browser journeys and axe were executed, but are not yet a permanent checked-in E2E/accessibility suite. |
| FINAL-OPS-001 | High | Production condition | TLS/HSTS ingress, shared Redis/TLS/ACLs, backup restore, external alert delivery, and production CMS revalidation must be validated in the target environment. |
| FINAL-OBS-001 | Low | Can defer | For a synthetic dual-role user, the single `actorRole` audit field selected `CUSTOMER` while request context correctly recorded `CUSTOMER,ADMIN`; functional authorization was correct. |

## Residual Risks and Limitations

- **Operational cleanup completed on 2026-07-21:** the later repository cleanup audit found and stopped lingering Step 9 Next servers on 3100/3101, removed the stopped upgrade container, removed the clean/upgrade anonymous database volumes, deleted `.step9_verification_work` and `.step9_lockregen_crm`, and retained this report directory as the authoritative evidence set. See `../vympel_repository_cleanup_audit/REPOSITORY_CLEANUP_AUDIT.md`.
- Local tests prove bounded correctness, not production capacity, multi-node rate-limit behavior, or external alert delivery.
- The CMS revalidation response was `NOT_REQUIRED` locally because no target was configured. The durable outbox/signature/retry code is covered, but a real staging Next.js revalidation target is required before production.
- Runtime SQL query counts were not instrumented in this resumed phase; query-bound repository coverage and prior three-query evidence were retained, while the final bounded HTTP load showed no failures.
- Automated accessibility testing detects only part of the possible problem space. Manual focus, overlay, landmark, heading, alt, overflow, and keyboard checks supplement axe but do not replace testing with assistive-technology users.
- Seven existing MapStruct compile warnings remain non-fatal.

## Staging Actions

1. Deploy the exact verified dependency and source revisions; rerun clean install/build/test gates in CI.
2. Rehearse the production database copy and explicitly resolve or approve `FINAL-DB-001` before migration promotion.
3. Configure the real CMS revalidation URL and HMAC secret; verify publish, partial failure, retry, and public cache freshness.
4. Exercise TLS ingress, HSTS, trusted-proxy headers, shared Redis limiter behavior, health probes, and alert delivery.
5. Run the release smoke matrix and axe against staging with production-like content and supported browsers.

## Production Rollout Actions

1. Require a successful backup restore rehearsal and a documented forward-recovery plan for Liquibase.
2. Decide and implement the SEO baseline or explicitly accept the search-discovery risk.
3. Use canary/limited rollout, monitor 4xx/5xx, auth refresh/replay events, CMS revalidation queue age, DB locks, and request latency.
4. Confirm analytics retention and CMS orphan cleanup schedules are running, then execute a post-deploy smoke and rollback checkpoint.

## Local Docker Startup Addendum (2026-07-21)

The later `Insecure non-local configuration` local-startup failure was a launch-configuration problem, not a reason to relax the production validator. The canonical Compose stack had usable local fallbacks but no populated root `.env`; a direct IntelliJ launch also did not activate `local` or load root `.env`, so base `application.yml` correctly presented blank required values to `NonLocalSecurityConfigurationValidator`.

The correction adds a working, Git-ignored `.env` beside root `compose.yml`, keeps the committed `.env.example` credential/URL fields blank, and makes Compose interpolate the exact existing `VYMPEL_*` contract. Docker values use service DNS (`postgres`, `redis`, `minio`, `public`) and browser values use mapped localhost ports. `application-local.yml` now owns host-facing IDE fallbacks for PostgreSQL 5433, Redis 6379, MinIO 9100, CMS/public 3000, and public/CRM CORS 3000/3001; IntelliJ must explicitly set `SPRING_PROFILES_ACTIVE=local`. Runtime environment variables remain higher precedence and base/non-local configuration remains fail-closed.

Verification passed without printing resolved credentials: `docker compose config` found zero missing required backend fields and zero secret-bearing `NEXT_PUBLIC_*` keys; PostgreSQL, Redis, and MinIO became healthy; MinIO initialization exited 0; the backend rebuilt with profile `local`, Liquibase reported all 77 changesets current, readiness became healthy, and bounded logs contained neither the insecure-config exception nor configured secret values. `docker compose up -d --build --wait` then returned the full backend/public/CRM stack healthy. A separate host Java 17 launch on a temporary port, with Docker-only environment values removed and only `SPRING_PROFILES_ACTIVE=local` supplied, reached readiness `UP` and returned 200 from `/api/public/ping`. `NonLocalSecurityConfigurationValidator` was not changed.

## Final Decision

**READY FOR STAGING.** There are no open Must-fix application defects in the tested scope. Production promotion is conditional and must not bypass the database-history and target-environment checks above. Step 9 operational cleanup was completed by the 2026-07-21 repository cleanup audit.
