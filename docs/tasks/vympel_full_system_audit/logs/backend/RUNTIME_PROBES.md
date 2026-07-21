# Backend Runtime Probe Evidence

Audit date: 2026-07-16. Base URL: `http://localhost:8080`.

- Public ping returned 200 and an `X-Request-Id`.
- CRM endpoints returned 401 without a token and safe JSON error bodies with request IDs.
- A disposable MANAGER could access products, references, reviews, requests, analytics, dashboard, and activity; CMS and users returned 403.
- A disposable ADMIN could access CMS pages, users, and product details.
- Trusted-origin CORS preflight for `http://localhost:3000` returned 200 with the matching origin; an untrusted origin returned 403.
- Invalid login returned 401. Invalid languages, ratings, booleans, decimals, and review sorts returned 400.
- Public product ID not found returned 400 instead of 404.
- Unknown category code returned 500 instead of 404 because `EntityNotFoundException` is handled as a persistence failure.
- Catalog `size=9999` was capped at 60; CRM `size=9999` was capped at 100; reviews were capped at 15.
- Valid disposable public review, customer request, and analytics submissions succeeded and were removed afterward.
- A disposable CMS block could be created, updated idempotently, published, observed through the public CMS endpoint, unpublished, and deleted. Three translations remained unique. All disposable users, activities, blocks, reviews, requests, and analytics rows were removed.
- Actuator health returned 401.

No bearer token, password, secret, private user data, or full error stack was copied into this evidence file.
