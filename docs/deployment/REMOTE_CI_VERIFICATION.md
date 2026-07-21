# Remote CI Verification

Date: 2026-07-22
Repository: `ZxZxZ143/vympel`
Branch: `main`
Verified release-candidate commit: `954e8a3a659371ba0203369aec9d2fef968fab5b`
Release-candidate tag: `v1.0.0-rc.1`

## Required workflow results

| Workflow | Run | Result | Release evidence |
| --- | --- | --- | --- |
| Backend CI | [29869704771](https://github.com/ZxZxZ143/vympel/actions/runs/29869704771) | PASS | Full Gradle suite with isolated PostgreSQL, boot JAR, migration verification, ADMIN regression, backend image build, and readiness |
| Storefront CI | [29869704667](https://github.com/ZxZxZ143/vympel/actions/runs/29869704667) | PASS | Clean install, lint, typecheck, tests, build, audit/budget/SEO gates, image build, and health |
| CRM CI | [29869704621](https://github.com/ZxZxZ143/vympel/actions/runs/29869704621) | PASS | Clean install, lint, typecheck, tests, build, audit/budget/noindex gates, image build, and login-page health |
| Full Release Gate | [29869704977](https://github.com/ZxZxZ143/vympel/actions/runs/29869704977) | PASS | Shared deployment gate plus reusable backend/storefront/CRM jobs and immutable release metadata |
| Release Images | [29869704834](https://github.com/ZxZxZ143/vympel/actions/runs/29869704834) | PASS, BUILD ONLY | Three separate full-SHA images built; login skipped, `pushed=false`, and push-policy gate passed |
| Performance budgets | [29869704670](https://github.com/ZxZxZ143/vympel/actions/runs/29869704670) | PASS | Storefront and CRM production budgets passed |
| Tagged Full Release Gate | [29870201605](https://github.com/ZxZxZ143/vympel/actions/runs/29870201605) | PASS | Tag push reran shared deployment, backend, storefront, CRM, and release-metadata jobs successfully on the same commit |

All rows above ran against the same exact 40-character commit. Required gates were not bypassed or weakened. The main-branch run is the release-candidate verification authority, and the independently successful tag-triggered run confirms the pushed tag resolves to the same verified source.

## Immutable release artifacts

| Artifact | ID | Size | GitHub artifact digest |
| --- | ---: | ---: | --- |
| `full-release-gate-954e8a3a659371ba0203369aec9d2fef968fab5b` | `8510711242` | 1,368 bytes | `sha256:81f3cadb28739a740cd3d6bde5f169cf7516538d0b2b4ad3719d40e0dad111a6` |
| Backend image metadata | `8510653908` | 335 bytes | `sha256:7ed709203bf1a6ff3cf9a6f7c40c84f957186a59a5637996bf524ccefbae085f` |
| Storefront image metadata | `8510640861` | 343 bytes | `sha256:27ba1b3c0f733ad86b94f18aedbdd6ad9e05a409e3dbba334b4a44b54c0b4b93` |
| CRM image metadata | `8510634686` | 325 bytes | `sha256:980f8355b05633a1f2970d73d59f8da528c087ca52dfc1514b5164a828191bd7` |
| Tagged full-release manifest | `8510903526` | 1,373 bytes | `sha256:0810b73e2c7deee23db501328d037e03efdc99d85f3700d5de2769819c747824` |

The full-gate artifact contains `v1.0.0-rc.1.yml` and the gate result for the verified commit. Its image boundaries are `vympel-backend`, `vympel-storefront`, and `vympel-crm`; each uses the full commit SHA. Registry repositories remain explicit placeholders and image digests remain pending until an approved registry publication. These GitHub artifact digests are evidence-file digests, not container-image registry digests.

## Remote-only corrections

The initial remote runs exposed Linux and orchestration issues that local Windows verification could not prove. Each correction was committed and pushed normally; no history was rewritten.

| Commit | Correction |
| --- | --- |
| `02bcec65c1a8384b6d7584360ade8c5b32e6ae42` | Isolated standalone and reusable workflow concurrency |
| `4d688b4315b66998b69cbd90faf870d9ccb47eda` | Preserved Gradle wrapper executable mode |
| `106c8ca51a234034699b4a38e1f3a3209d29819a` | Cross-platform rehearsals and automatic non-publishing image builds |
| `6e12dd3dde4e0f2b45ae99d9c53012f01faac398` | Buildx load/attestation mode, build URL, and portable command resolution |
| `053fb424ca1682d42c3048974e4020a700068a4d` | Bounded proxy-upstream readiness |
| `9c97c0482e22c0be19f25ff6f097eb45051f23c0` | Isolated PostgreSQL service for backend CI |
| `55bda3657783e591189b03e7f50a8f64601f1c8e` | Deterministic integration fixture and final-postmaster checks |
| `954e8a3a659371ba0203369aec9d2fef968fab5b` | Validated immutable release-manifest generation |

## Publication and deployment disposition

- No Docker registry was configured, no registry credentials were supplied, and no image was pushed.
- No external staging or production deployment ran.
- No cloud resource was created.
- No credentials or secret values are recorded in this report or its artifacts.
- Remote CI resolves the provider-independent workflow gate only. Hosting, domains, registry digests, managed data services, secret management, public TLS/trusted proxies, monitoring delivery, and real staging proof remain provider-specific.
