# Main CI after PR #20 — 2026-10-24

## Diagnosis

Inspected every workflow for merge commit `95185e8d3ad389b76abef2f094cd3c863f7eac31`.

- Backend CI, Storefront CI, Performance budgets and Full Release Gate's shared infrastructure checks passed.
- [Full Release Gate](https://github.com/ZxZxZ143/vympel/actions/runs/40103616761) failed only in `crm / verify`, at `npm audit --audit-level=high`: CRM still used Next 16.3.8 and its lint-tool graph retained Zod 4.4.3.
- [Release Images](https://github.com/ZxZxZ143/vympel/actions/runs/40103617019) failed the CRM image scan for Next 16.3.8. Backend and storefront images passed. The final publication-result failure propagated the build failure; all publication jobs were skipped because publication was disabled.
- PR #20's component path filters did not run CRM. The post-merge full matrix exposed this independent dependency baseline; this was not a pagination/filter regression.

## Change

Branch `codex/fix-main-ci-after-pr20` starts from the merged main commit. CRM Next and eslint-config-next are aligned at **16.4.3**. A targeted lockfile update moves transitive Zod to **4.6.7**, without adding an unused direct application dependency. All unrelated locked versions remain unchanged. Lock generation and clean installation use the repository's pinned Node 22 Alpine image.

No CRM screens, business logic, API contracts, migrations, CI thresholds, budget limits, deployment configuration or publication policies change. Existing sharp and glob guards remain enabled. The storefront/backend local test stand is preserved.

## Local verification

| Check | Result |
| --- | --- |
| Clean Windows and Linux npm ci | Passed, including postinstall guards |
| CRM Vitest | **153 passed**, 20 files |
| ESLint / TypeScript | Passed |
| npm audit --audit-level=high | **0 vulnerabilities** |
| Production build | Passed with Next 16.4.3 |
| Existing CRM JS budget | **1.52 / 1.53 MiB**, passed without increasing the limit |
| Security header unit tests | 3 passed |
| Production security headers | Passed for login, telemetry and a static chunk |
| sharp / glob guards | Passed |
| Full CRM Docker build | Passed with synthetic CI public URLs |
| Trivy 0.70.0 image scan | **0 actionable HIGH/CRITICAL findings** in Alpine and Node packages; ignore-unfixed policy matches CI |
| Non-local runtime bundle URL contract | Passed |
| git diff --check | Passed |

[Machine-readable verification summary](verification.json). GitHub workflow status for the eventual PR/main commit is authoritative for remote verification; these results describe the local fixed source tree. No deployment or Docker image publication was performed.
