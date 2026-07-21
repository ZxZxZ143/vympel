# Final API Matrix

Date: 2026-07-19  
Runtime: isolated current-code backend on port 18091 with the PostgreSQL 18 upgrade rehearsal.

## Public API

| Area | Operations verified | Expected result |
| --- | --- | --- |
| Availability | ping | 200 |
| Catalog | list, capped size, category list/code/products, quick search, filters | 200; cap returned page size 60 |
| Catalog validation | invalid sort | 400, sanitized error |
| Product | detail, recommendations, reviews, batch summary | 200; batch reports missing IDs separately |
| Product missing/invalid | missing ID, malformed ID, invalid locale | 404 / 400 / 400 |
| CMS reads | home, about, catalog, product, brands | 200 with expected block counts |
| Analytics | accepted event, invalid payload | 200 / 400 |
| Customer request | create | 201; clean rehearsal retained one disposable proof row |
| Review | create; missing target | 201 / 404 |

Primary evidence: `logs/backend/upgrade_public_api_matrix.log`. The matrix contains 24 named requests and their request IDs, duration, status, and response size.

## CRM API and Authentication

| Scenario | Result |
| --- | --- |
| ADMIN login and `/me` | 200 / 200 |
| ADMIN products, references, reviews, requests, analytics, dashboard, activity, CMS, users, collections | 200 |
| Refresh rotation | refresh 200; replay old refresh 401; rotated access `/me` 200 |
| Logout | 204; refresh after logout 401 |
| MANAGER products | 200 |
| MANAGER users and CMS | 403 / 403; subsequent `/me` remains 200 |
| CUSTOMER-only CRM protected request | 403 (corrected disposable-account proof) |
| Invalid login limiter | 401, 401, 429; `Retry-After: 2` |

Primary evidence: `upgrade_crm_api_matrix.log` and `upgrade_customer_rbac_correction.log`. One row in the initial matrix used a customer account that had also been granted a CRM role and therefore returned 200; the dedicated correction created a customer-only principal and proved 403.

## CMS and Storage

| Flow | Result |
| --- | --- |
| CMS upload, draft create/update/reorder, publish, public read, unpublish, delete | All expected operations 200 |
| Public content transition | Draft not exposed; published content exposed; unpublished content removed |
| Media reference list | Present while used; empty after block deletion |
| Product media | Upload/read/reorder/set-main/delete; object becomes 404 |
| CMS orphan lifecycle after fix | Zero after-commit errors; 1 orphan found; cleanup 1 processed/1 succeeded; media/block rows absent; object 404 |

Local CMS mutations returned `refreshStatus: NOT_REQUIRED` because no revalidation target was configured. That makes real staging revalidation a production-promotion condition, not a local API failure.

## Error Semantics and Contract Notes

- 200: successful reads/mutations where the existing contract returns a body.
- 201: customer request/review creation and registration.
- 202: customer login contract.
- 204: logout.
- 400: validation/type/locale/sort errors; response contains a safe request ID and no stack/SQL detail.
- 401: invalid/replayed/revoked credentials.
- 403: authenticated insufficient role and disallowed CORS origin.
- 404: missing products/categories/routes and deleted storage objects.
- 409: conflict handling is covered by the backend handler tests; no disposable live conflict was required for the final matrix.
- 429: deterministic login limit with `Retry-After`.

No API contract change was introduced during Step 9; fixes were transaction, dependency, markup, and evidence related.
