# CMS Revalidation Integration Report

Date: 2026-07-22
Scope: isolated production-like integration using the current backend, production storefront build, PostgreSQL 16, signed revalidation endpoint, and persistent retry queue.

Latest cleanup/readiness rerun: `02d552977bfa` (passed after requiring the final PostgreSQL postmaster).

## Result

**PASS.** `deployment/rehearsals/cms-revalidation.ps1` used a random, unprinted HMAC secret and temporary ADMIN credentials. It created draft namespaced home-page blocks, published them through the real CRM API, observed public storefront HTML, and removed all disposable blocks and jobs before destroying the isolated database.

| Scenario | Result |
| --- | --- |
| Initial signed publish | `SUCCESS` |
| Public content after initial publish | Fresh immediately |
| Paused storefront publish | `FAILED_RETRY_SCHEDULED` |
| Persistent queue after failure | `RETRY` |
| Recovery after storefront resume | `SUCCEEDED`, attempt 2 |
| Public content after retry | Fresh |
| Invalid HMAC | HTTP 401 |
| Configured backend timeout | 500 ms |
| Observed bounded failure | 555 ms, then retry scheduled |
| Timeout recovery | `SUCCEEDED`, attempt 2 |
| Browser/static/log secret scan | No exposure found |
| Disposable blocks/media/jobs | Cleaned; isolated resources removed |

## Retry-contract correction

The rehearsal found that the backend preserves the operation request ID but re-signs retries with a current timestamp. The storefront receiver now treats the same validly signed request ID/version/page as idempotent while rejecting request-ID reuse for a different page. Unit tests cover first delivery, re-signed retry, conflicting-page rejection, and replay-window eviction. This prevents a lost success response from turning a legitimate retry into a permanent 409 failure.

## Remaining provider-specific proof

Repeat the freshness and failure scenarios through the real staging load balancer, DNS, TLS termination, trusted proxy chain, and monitoring provider. Do not copy the local HMAC value; provision a new value through the selected secret manager.
