# CMS Revalidation Runbook

## Configuration

The backend calls the storefront server-only revalidation endpoint. Configure:

- `VYMPEL_CMS_PUBLIC_REVALIDATE_ENABLED=true`
- `VYMPEL_CMS_REVALIDATE_REQUIRED=true`
- `VYMPEL_CMS_PUBLIC_REVALIDATE_URL=https://<storefront>/api/revalidate`
- `VYMPEL_CMS_REVALIDATE_SECRET` as a high-entropy HMAC secret in the secret manager
- storefront `CMS_REVALIDATE_SECRET` from the same secret, never as `NEXT_PUBLIC_*`

The browser-visible API and media origins are separate build-time values. Do not use a public variable for the HMAC secret.

## Verification

1. Publish a harmless staging CMS change.
2. Confirm the CRM response succeeds and contains a request ID.
3. Confirm the backend outbox/retry path records delivery without request content or secrets.
4. Fetch the affected RU, KZ, and EN storefront pages until the new version is visible within the agreed freshness objective.
5. Confirm an invalid signature is rejected and protected CMS/Actuator endpoints are not exposed by the proxy.
6. Restore the staging content if the test change was temporary.

Treat required revalidation failure as a release blocker. Do not delete queued work to make the check green; diagnose reachability, TLS, signature parity, and storefront health, then allow bounded retry. Rotate the HMAC secret through the secret manager and redeploy both backend and storefront together.
