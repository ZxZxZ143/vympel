# Final Security Verification

Date: 2026-07-19

## Application Security Gates

| Control | Result | Evidence |
| --- | --- | --- |
| Dependency audit | PASS | Public and CRM full npm audits report 0 vulnerabilities after Next.js/next-intl/transitive updates. |
| Authentication | PASS | Login, refresh rotation, old-token replay denial, logout revocation, and post-logout denial verified. |
| Authorization | PASS | ADMIN access, MANAGER scoped access, MANAGER 403 continuity, and customer-only CRM 403 verified. |
| Rate limiting | PASS | Invalid login sequence 401/401/429 with `Retry-After: 2`; test suite covers deterministic and store behavior. |
| CORS | PASS locally | Exact public 3100 and CRM 3101 origins allowed; `evil.example` rejected 403. |
| Error disclosure | PASS | Representative 400/401 bodies contain safe request IDs and no stack, SQL, secret, or internal class disclosure. |
| Actuator exposure | PASS locally | Liveness/readiness are 200; root health details and environment endpoint are restricted (401). |
| Response headers | PASS locally | Enforced CSP without `unsafe-eval`/wildcard, `DENY`, `nosniff`, strict-origin referrer policy, permissions policy, and no-cache on protected API responses. |
| Upload validation | PASS | Declared/content type mismatch rejected 400; valid product/CMS images accepted. |
| Secret scan | PASS for source scope | No private-key, AWS key, or literal password/JWT-secret pattern found in application source/scripts/config checked by Step 9. |

Runtime probe details are in `logs/backend/runtime-security-probes.json`. HSTS is intentionally absent from direct local HTTP and must be asserted at the HTTPS ingress in staging.

## Session and Token Security

- Refresh token rotation returns a new session and rejects replay of the prior token.
- Logout returns 204 and revokes subsequent refresh use.
- Database refresh hashes are 64 hexadecimal characters; the invalid-hash invariant is zero.
- Expired sessions are not left active in either rehearsal.
- Customer-only access to a protected CRM resource returns 403; a previous ambiguous dual-role probe is explicitly superseded by `upgrade_customer_rbac_correction.log`.

## Privacy and Analytics

- Sensitive analytics identifier columns are absent from the final schema.
- No product analytics rows older than the 180-day retention boundary remain in either rehearsal.
- Runtime/security logs mask disposable email addresses and do not print tokens or passwords in the inspected final path.
- Telemetry was disabled in the verification frontend builds; production collector, alerting, retention, and data-processing configuration remain deployment-owned.

## Findings Fixed During Step 9

- High-severity Next.js and related dependency advisories were removed; the final full audits are zero.
- Accessibility-related HTML/ARIA issues were fixed as defense-in-depth for safe, unambiguous interaction.
- The CMS after-commit transaction bug was fixed, preventing a successful response from leaving lifecycle work in an exception path.

## Open Production Conditions

1. Validate TLS versions/ciphers, HSTS, redirect policy, cookie behavior, trusted proxy CIDRs, and header preservation at ingress.
2. Validate shared Redis authentication/TLS/ACLs, multi-instance rate limiting, and fail-mode behavior.
3. Configure and rotate production JWT, revalidation HMAC, database, MinIO, and telemetry secrets using the deployment secret manager.
4. Verify backup encryption/restore, external alert delivery, retention jobs, and incident runbooks.
5. Repeat a dependency/SBOM/container-image scan in CI for the exact deployable images.

Verdict: **passes local application security/privacy verification; production remains conditional on target-environment controls.**
