# Final Performance Verification

Date: 2026-07-19

## Production Build Budgets

| Budget | Observed | Limit | Result |
| --- | ---: | ---: | --- |
| Public static assets | 7.33 MiB | 24.00 MiB | PASS |
| Public static JavaScript | 1.33 MiB | 1.65 MiB | PASS |
| CRM static JavaScript | 1.09 MiB | 1.40 MiB | PASS |
| Oversized-raster detector | Rejected generated over-limit fixture; accepted explicit bounded exception | Required self-test | PASS |

Evidence: `logs/public/budgets-release-final.log`.

## Initial Self-Hosted Transfer

| Route | Document | Referenced resources | Total |
| --- | ---: | ---: | ---: |
| `/ru` | 157,985 B | 1,672,486 B | 1,830,471 B |
| `/ru/catalog?categoryCode=WATCH_WRIST` | 136,909 B | 1,376,265 B | 1,513,174 B |
| `/ru/product/1` | 128,880 B | 1,434,188 B | 1,563,068 B |

The same production status gate also proved valid/missing/temporary-failure status behavior. Evidence: `production-status-release-final.log`.

## Bounded Backend Load

The isolated upgrade runtime handled 240 catalog requests at concurrency 20:

- 240 HTTP 200, 0 failures;
- elapsed 1.82 s; about 132 requests/s;
- p50 90.5 ms;
- p95 507.8 ms;
- p99 690 ms;
- maximum 944.8 ms.

Evidence: `logs/backend/upgrade_bounded_load.log`.

## Interpretation and Limits

- Results show no obvious local regression and satisfy repository budgets; they are not a production capacity/SLO claim.
- The final pass did not attach runtime SQL query-count instrumentation. Repository tests and prior bounded three-query evidence cover the query-shape regressions, but staging observability should verify real query counts and slow-query behavior.
- A long-duration soak, cache-warm/cold split, multi-node Redis, real network latency, and production-sized data were not exercised.
- Google Fonts are fetched at build time; a sandboxed build without network failed, while the permitted build succeeded. CI needs deterministic access or a future font self-hosting decision.

Verdict: **performance gates pass for staging; production capacity must be validated and monitored in the target environment.**
