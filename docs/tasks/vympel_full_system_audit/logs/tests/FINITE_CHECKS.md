# Finite Check Evidence

Audit date: 2026-07-16.

| Application | Check | Result | Evidence summary |
| --- | --- | --- | --- |
| Backend | `gradlew.bat test` with Java 17 | PASS | 13 suites, 42 tests, 0 failures, 0 errors, 0 skipped. |
| Public frontend | `npm run lint` | PASS | ESLint completed without findings. |
| Public frontend | `npm run typecheck` | PASS | TypeScript completed without errors. |
| Public frontend | `npm run build` | PASS | Next.js production build completed; 31 routes emitted. |
| Public frontend | `npm audit --omit=dev --json` | PASS | 0 known advisories at all severities. |
| CRM | `npm run lint` | PASS | ESLint completed without findings. |
| CRM | `npm run build` | PASS | Next.js production build completed; 16 routes emitted. |
| CRM | `npm audit --omit=dev --json` | PASS | 0 known advisories at all severities. |

The first backend test attempt could not use the sandboxed Gradle cache because of a lock permission. The same finite test command was rerun with the repository's approved Java/Gradle execution permission and passed. No dependency upgrades were performed.
