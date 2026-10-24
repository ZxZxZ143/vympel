# PR #20 CI and review follow-up — 2026-10-24

## Findings and fixes

- Review [discussion_r4367401841](https://github.com/ZxZxZ143/vympel/pull/20#discussion_r4367401841) identified stale contextual disabled flags after removing a filter and failing its refresh. The new browser regression reproduced the issue before the fix (`Pending refresh must not enforce disabled flags from a different draft`). Both counts and disabled flags now require a successful snapshot matching the current scope and selection. Fresh zero-count options remain disabled; placeholders are still disabled and selected options remain removable.
- [Storefront CI run 40102027236](https://github.com/ZxZxZ143/vympel/actions/runs/40102027236) passed lint, typecheck and 265 tests, then failed `npm audit --audit-level=high` for Next and Zod. Storefront Next and eslint-config-next are aligned at **16.4.3**, and Zod is pinned at **4.6.6**. Existing sharp/glob protections and CI security thresholds remain intact. No CRM/backend dependency changes.
- Fixed-version references: [Next advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [Next 16.4.3 release](https://github.com/vercel/next.js/releases/tag/v16.4.3), [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- The lockfile retains unrelated package versions. Linux generation restores platform-specific emnapi metadata; a clean install with the Docker-pinned Node 22 image passed, including both postinstall guards. Windows initially held an old sharp DLL open in the running stand; the incremental install repaired dependencies without stopping PostgreSQL or the backend.

## Verification of the fix

| Check | Result |
| --- | --- |
| Frontend tests | 265 passed / 45 files |
| ESLint / TypeScript | Passed |
| Next 16.4.3 production build | Passed in the isolated storefront copy |
| npm audit | 0 vulnerabilities, including high/critical |
| Clean Linux npm ci | Passed with pinned Node 22 Alpine, postinstall guards included |
| Security headers | 3 passed |
| sharp / glob guards | Passed |
| Production HTTP/status matrix | Passed: 200/404, RU/KZ/EN, transient failures, preview noindex policy |
| Review regression | Failed before the fix; passed after the fix, including pending/error/reopen/recovery and fresh zero-count disabling |
| Real filter browser checks | Passed at 1440/390px: 41/2 → 8/1, Apply/Reset/history/reload, empty categories, persistent disabled zero options, no overflow/errors |
| git diff --check | Passed |

The review regression uses explicitly intercepted responses; the contextual/zero-option checks use the real local API. See [updated resilience results](../catalog-contextual-filters/resilience-results.json). Local application source checks were rerun after the dependency update. Backend source was unchanged; [Backend CI 40102027168](https://github.com/ZxZxZ143/vympel/actions/runs/40102027168) and [performance budgets 40102027210](https://github.com/ZxZxZ143/vympel/actions/runs/40102027210) passed on the pre-fix PR head. Post-push CI is tracked in GitHub separately from these local results.

The local storefront was refreshed in place. The 100-product PostgreSQL stand and backend were preserved. Work remains on `codex/catalog-brand-pagination-search-order`; no merge, auto-merge, image publication or deployment is authorized.
