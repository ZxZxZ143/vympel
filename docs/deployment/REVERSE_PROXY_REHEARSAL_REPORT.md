# Reverse Proxy Rehearsal Report

Date: 2026-07-22
Scope: isolated local syntax and routing proof using disposable mock upstreams and a temporary self-signed certificate.

## Result

**PASS.** `deployment/rehearsals/reverse-proxy.ps1` rendered the production template, passed `nginx -t`, exercised the HTTP and HTTPS listeners, and removed its generated certificate, key, containers, network, and temporary files.

| Check | Result |
| --- | --- |
| Rehearsal ID | `4e57b0f0c2c0` |
| Storefront routing | Passed |
| CRM routing | Passed |
| API routing and one-second bounded response | Passed |
| Forwarded host/proto/port/request ID | Passed |
| Client IP forwarding | Passed in isolated direct-proxy topology |
| 10 MB upload policy | 11 MB request rejected |
| Upstream CSP/HSTS preservation | Passed |
| Protected Actuator path | Blocked with 404 |
| Invalid host | Rejected with 421 |
| HTTP-to-HTTPS syntax/behavior | 308 redirect passed |
| Nginx syntax | Passed |

## Boundaries

The certificate was self-signed and ephemeral. This report does not claim public certificate-chain, DNS, HSTS preload, CDN/load-balancer, or provider trusted-proxy validation. No private key was retained or committed. Those checks remain mandatory in real staging.
