# Final Issue Register

Date: 2026-07-19

## Step 9 Findings

| ID | Severity | Priority | Status | Finding and resolution / disposition |
| --- | --- | --- | --- | --- |
| FINAL-BE-001 | High | Must fix | RESOLVED | CMS delete emitted a `No active transaction` after-completion exception. Post-commit work now uses `REQUIRES_NEW`; focused/full tests and real lifecycle rerun pass. |
| FINAL-SEC-001 | High | Must fix | RESOLVED | Next.js 16.1.3 and public `next-intl` dependency graph contained known advisories. Upgraded and patched; full audits now report zero. |
| FINAL-A11Y-001 | Medium | Must fix | RESOLVED | `/kz` emitted `lang=kz`. Route-to-HTML mapping now emits `kk`, with three tests and browser proof. |
| FINAL-A11Y-002 | High | Must fix | RESOLVED | Contrast, heading order, decorative alt, landmark uniqueness, missing error H1, carousel naming, and prohibited ARIA were detected. Fixed; final four-page axe run is zero. |
| FINAL-UI-001 | Medium | Must fix | RESOLVED | Home carousel arrow controls collided with the banner at 320x568. Final after-state removes the collision. |
| FINAL-RESP-001 | Medium | Must fix | RESOLVED | Mobile catalog sheet/bottom-nav presentation and focus lifecycle were verified and corrected; bottom navigation is obscured while the modal sheet is active and focus returns on close. |
| FINAL-REL-001 | High | Must fix | RESOLVED | Required final release artifacts were missing. The complete Step 9 packet is now present. |
| FINAL-EVID-001 | Medium | Must fix | RESOLVED | Recovered screenshots/transcripts lacked an index and acceptance mapping. Reports and screenshot index now provide it. |
| FINAL-TEST-RECOVERY | High | Must fix | RESOLVED | Interrupted finite-suite evidence was incomplete. Backend/public/CRM gates were rerun from source-matched verification copies. |
| FINAL-DB-001 | Medium | Production condition | OPEN | Upgrade DB contains executed `2026-07-13-01-seed-accessory-split-categories`; the current source tree and clean rehearsal do not contain that file/row. Reconcile or approve before production migration. |
| FINAL-SEO-001 | Medium | Production condition | OPEN | No sitemap, robots route, canonical URL, or locale alternate metadata exists. |
| FINAL-TEST-001 | Medium | Can defer | PARTIAL | Browser and axe evidence is current, but the repository still lacks a permanent checked-in E2E/accessibility suite. |
| FINAL-OPS-001 | High | Production condition | OPEN | Production TLS/HSTS, Redis/TLS/ACL, backups, alert delivery, and CMS revalidation target need target-environment proof. |
| FINAL-OBS-001 | Low | Can defer | OPEN | A synthetic dual-role audit record stored one nondeterministically selected role (`CUSTOMER`) while the request MDC retained `CUSTOMER,ADMIN`. Authorization was not affected. |
| FINAL-GIT-001 | Low | Can defer | CONSTRAINT | Root/CRM Git history is unusable and frontend/backend contain extensive pre-existing changes. SHA-256 source parity and path-specific cleanup were used. |
| FINAL-CLEAN-001 | Medium | Must fix (audit hygiene) | RESOLVED | The 2026-07-21 repository cleanup audit removed the remaining Step 9 container, both rehearsal database volumes, both named temporary directories, and lingering 3100/3101 audit processes while preserving user-owned services and final evidence. |

## Historical Audit Reconciliation

| Status | Count | IDs |
| --- | ---: | --- |
| Resolved | 22 | REC-001; API-001; API-002; WEB-001; CRM-001; AUTH-001; SEC-001–004; PERF-001–004; DB-001; DB-002; DATA-001; DATA-002; OBS-001; OBS-002; UI-001; BLOCK-UI-001 |
| Partially resolved | 3 | CMS-001; CMS-002; TEST-001 |
| Regressed | 0 | None |
| Blocked | 0 | None |

## Release Rule

No open application issue is classified `Must fix`; therefore staging is allowed. `FINAL-CLEAN-001` is resolved. `Production condition` items must be closed or explicitly accepted by the accountable release owner before production promotion.
