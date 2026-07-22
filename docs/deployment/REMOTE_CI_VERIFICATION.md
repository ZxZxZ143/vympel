# Remote CI Verification

Date: 2026-07-22
Repository: `ZxZxZ143/vympel`
Branch: `main`
Verified release-candidate commit: `954e8a3a659371ba0203369aec9d2fef968fab5b`
Release-candidate tag: `v1.0.0-rc.1`
Sharp remediation commit: `0fe55f39db7c7b5c495e200e778841584014ce04`

## Post-RC sharp security remediation

Status: local and remote GitHub Actions verification passed for the exact sharp remediation commit.

Both frontend applications were affected through `next@16.2.10 -> optional sharp@^0.34.5 -> sharp@0.34.5`. The latest stable Next.js release checked during remediation, 16.2.11, still declares `sharp@^0.34.5`, so a framework patch does not remove the vulnerable range. Storefront and CRM now use a narrowly scoped `next -> sharp@^0.35.0` npm override, currently locked at 0.35.3; Next.js, React, React DOM, next-intl, TypeScript, Node, the audit threshold, and image optimization remain unchanged. No direct global `sharp` override was added.

Local clean installs resolved one installed path per app at `next@16.2.10 -> sharp@0.35.3 overridden`. High-level and full npm audits returned zero vulnerabilities. Lint, typecheck, 13 storefront test files / 41 tests, 8 CRM test files / 25 tests, production builds, security-header checks, storefront production status/content, CRM login/header/noindex behavior, and asset/bundle budgets passed. Pinned actionlint 1.7.7 passed.

The final Node 22 Alpine images built as Linux/amd64. Both containers became healthy; standalone output contained `sharp@0.35.3`; in-container WebP and AVIF transforms loaded libvips 8.18.3; and storefront `/_next/image` returned HTTP 200 `image/webp` for both a local asset and a public-HTTPS copy of the same repository image. Published `sharp@0.35.3` metadata includes Linux glibc and musl binaries for amd64 and arm64. `scripts/check-sharp-security.mjs` now prints the finite installed graph and rejects any stable `sharp` below 0.35.0 in both component workflows.

| Workflow | Run | Result | Sharp remediation evidence |
| --- | --- | --- | --- |
| Storefront CI | [29944334362](https://github.com/ZxZxZ143/vympel/actions/runs/29944334362) | PASS | Clean install, `test:sharp-security`, lint, typecheck, 41 tests, unchanged high audit, build, budget, and storefront image |
| CRM CI | [29944334256](https://github.com/ZxZxZ143/vympel/actions/runs/29944334256) | PASS | Clean install, `test:sharp-security`, lint, typecheck, 25 tests, unchanged high audit, build, budget, and CRM image/login health |
| Backend CI | [29944334263](https://github.com/ZxZxZ143/vympel/actions/runs/29944334263) | PASS | Unchanged backend boundary remained green |
| Full Release Gate | [29944335708](https://github.com/ZxZxZ143/vympel/actions/runs/29944335708) | PASS | Reusable backend/storefront/CRM jobs, shared deployment gates, and immutable metadata all passed |
| Release Images | [29944334455](https://github.com/ZxZxZ143/vympel/actions/runs/29944334455) | PASS, BUILD ONLY | Backend, storefront, and CRM Linux images built; push-policy passed and no registry publication occurred |
| Performance budgets | [29944335576](https://github.com/ZxZxZ143/vympel/actions/runs/29944335576) | PASS | Storefront and CRM production budgets passed |

The aggregate artifact is `full-release-gate-0fe55f39db7c7b5c495e200e778841584014ce04` (ID `8539612937`, digest `sha256:ca3991665d2e21baae6c9800fa1b06a01541d88e1e3c7a45562f3ed0f7332814`). Release Images produced commit-specific backend metadata artifact ID `8539534694`, storefront ID `8539520122`, and CRM ID `8539513123`. These are evidence artifacts for non-publishing builds, not registry image digests.

The immutable `v1.0.0-rc.1` tag still points to `954e8a3a659371ba0203369aec9d2fef968fab5b` and does not contain this post-RC fix. It was not moved or rewritten. If the verified security fix is promoted as a release candidate, create a new tag such as `v1.0.0-rc.2` at the approved verified commit; this task did not create a new tag.

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
