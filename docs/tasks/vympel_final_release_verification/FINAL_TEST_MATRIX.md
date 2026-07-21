# Final Test Matrix

Date: 2026-07-19

| Layer | Gate | Result | Exact evidence / notes |
| --- | --- | --- | --- |
| Backend | Focused CMS lifecycle regression | PASS | `CmsMediaLifecycleServiceTest`; `logs/backend/cms-media-lifecycle-test.log` |
| Backend | Full Gradle suite, forced rerun | PASS | 36 suites; 149 tests; 0 failures/errors; 1 skipped; `gradle-test-rerun.log` |
| Backend | `bootJar` | PASS | `logs/backend/bootjar.log` |
| Public | Clean `npm ci` | PASS | `npm-ci-final-a11y.log` |
| Public | ESLint | PASS | `lint-definitive-data-a11y.log` |
| Public | TypeScript | PASS | `typecheck-definitive-data-a11y.log` (zero compiler output, exit 0) |
| Public | Vitest | PASS | 8 files, 23 tests; `unit-tests-definitive-data-a11y.log` |
| Public | Production build | PASS | Next 16.2.10; 32 pages; `build-final-data-a11y-configured.log` |
| Public | Production status semantics | PASS | valid 200; localized RU/KZ/EN missing 404; transient backend failure not 404 |
| Public | Security headers | PASS | 3/3 script cases plus live probes |
| Public | Asset/bundle budget | PASS | public assets 7.33 MiB; JS 1.33 MiB |
| CRM | Clean `npm ci` | PASS | `npm-ci-final-patched.log` |
| CRM | ESLint + TypeScript | PASS | final finite gate logs |
| CRM | Vitest | PASS | 6 files, 23 tests |
| CRM | Production build | PASS | Next 16.2.10; 17 pages |
| CRM | Production headers/security | PASS | final header and security logs |
| CRM | Bundle budget | PASS | JS 1.09 MiB |
| Dependencies | Public full npm audit | PASS | 0 vulnerabilities |
| Dependencies | CRM full npm audit | PASS | 0 vulnerabilities |
| Database | Fresh PostgreSQL 16 migration | PASS | 77 changelog rows, latest current change, 51 tables |
| Database | Existing-data PostgreSQL 18 upgrade | PASS WITH CONDITION | 78 rows due absent historical source migration; all current invariants pass |
| API | Public representative matrix | PASS | 24 operations, expected 200/201/400/404 semantics |
| API | CRM representative matrix | PASS | admin/manager/customer/auth/limit semantics verified; corrected customer-only probe 403 |
| Auth | Refresh rotation/replay/logout | PASS | refresh 200, old token replay 401, rotated session 200, logout 204, refresh after logout 401 |
| RBAC | Manager/customer denial continuity | PASS | manager users/CMS 403 while session remains usable; customer-only CRM 403 |
| Rate limiting | Invalid CRM login sequence | PASS | 401, 401, 429 with `Retry-After: 2` |
| CMS | Draft/publish/unpublish/delete | PASS locally | public content transitions and reference cleanup verified |
| CMS media | After-commit lifecycle | PASS after fix | zero after-commit errors; cleanup processed/succeeded 1/1 |
| Storage | Product and CMS disposable objects | PASS | upload/read/reorder/main/delete; object returned 404 after deletion/cleanup |
| Browser | Public route/locale sweep | PASS | RU/KZ/EN and missing/error states; no overflow/duplicate IDs/missing alt in tested final states |
| Browser | CRM responsive sweep | PASS | dashboard/products/CMS at 1440/1280/1024/768 widths |
| Accessibility | axe-core 4.12.1 | PASS | 0 violations on `/ru`, `/kz/catalog`, `/en/product/44`, CRM `/login` |
| Accessibility | Manual keyboard/focus/semantics | PASS for sampled flows | sheets/dialog close, focus restoration, headings, landmarks, names, tables |
| Security | Runtime headers/CORS/errors | PASS locally | exact allowed origins, evil origin 403, sanitized 400/401, restricted root health/env |
| Privacy | Schema/retention checks | PASS | no sensitive analytics columns; no analytics older than 180 days; token hashes valid |
| Performance | Bounded HTTP load | PASS | 240/240 HTTP 200; 20 concurrency; 132 rps; p95 507.8 ms; max 944.8 ms |
| Cleanup | Audit rows/objects/processes/containers | PARTIAL / BLOCKED | disposable rows/objects removed and all four audit listeners closed; two named containers and two named temp directories remain because the approval service rejected deletion after reaching its usage limit |

## Skips and Warnings

- One backend test is intentionally skipped; there are no test failures or errors.
- Seven MapStruct compile warnings remain.
- A first sandboxed production build could not fetch Google Fonts; the identical permitted build passed. This is an environment/network constraint, not an application failure.
- The sandbox blocked child-process/browser startup for two gates; the same commands passed with the required scoped permission.

## Not Executed as Production Proof

- Production-scale load, chaos, multi-region, and long-duration soak testing.
- Real production Redis/TLS/ingress/alert/backup restore validation.
- Full assistive-technology user testing.
- Runtime SQL query-count instrumentation during this resumed pass.
