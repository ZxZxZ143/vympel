# Remote CI Verification

Date: 2026-07-29
Repository: `ZxZxZ143/vympel`
Branch: `main`
Verified release-candidate commit: `aadfabfd23a4196bc385ae41a0f3b8719172ffbc`
Release-candidate tag: `v1.0.0-rc.8`
Preserved earlier verified amd64-only candidate: `v1.0.0-rc.2` -> `633db42643d42ee6448919b5f6b6b16a7da1ca17`

## GCP staging RC.8 verification

Exact source `aadfabfd23a4196bc385ae41a0f3b8719172ffbc` passed Performance
Budgets run
[30399583227](https://github.com/ZxZxZ143/vympel/actions/runs/30399583227),
Storefront CI run
[30399583382](https://github.com/ZxZxZ143/vympel/actions/runs/30399583382),
CRM CI run
[30399583388](https://github.com/ZxZxZ143/vympel/actions/runs/30399583388),
Full Release Gate run
[30399583534](https://github.com/ZxZxZ143/vympel/actions/runs/30399583534),
and build-only Release Images run
[30399583742](https://github.com/ZxZxZ143/vympel/actions/runs/30399583742).
Annotated tag `v1.0.0-rc.8` resolves to the same exact commit; its
tag-triggered Full Release Gate run
[30399967023](https://github.com/ZxZxZ143/vympel/actions/runs/30399967023)
also passed.

Trusted Release Images run
[30400324979](https://github.com/ZxZxZ143/vympel/actions/runs/30400324979)
completed successfully with the exact temporary public GCP build values. It
passed all six native architecture builds, final-index attestations, registry
metadata, finite Liquibase/readiness checks, exact-image amd64 and ARM64
runtime rehearsals, native sharp transforms, frontend bundle scans, and
consolidated manifest generation.

The manifest artifact
`published-release-manifest-aadfabfd23a4196bc385ae41a0f3b8719172ffbc`
is ID `8704956171`, size 1473 bytes, ZIP digest
`sha256:f5a4536ab7e7c89033ed76753f30499f61ef5feb6f0983a28973d81d823a6e6f`,
and is preserved at `deployment/releases/v1.0.0-rc.8.yml`. Independent GHCR
inspection confirmed the RC and full-SHA tags resolve to the recorded indexes,
including all three `linux/amd64` children. RC.7 remains unchanged. No Google
Cloud resource, external deployment, DNS change, or TLS issuance occurred.

## ARM64 and Oracle staging verification

### Completed RC.7 verification

The final-index authentication correction passed Performance Budgets run
[30231338581](https://github.com/ZxZxZ143/vympel/actions/runs/30231338581),
build-only Release Images run
[30231338867](https://github.com/ZxZxZ143/vympel/actions/runs/30231338867),
Full Release Gate run
[30231338728](https://github.com/ZxZxZ143/vympel/actions/runs/30231338728),
and tag-triggered Full Release Gate run
[30231592708](https://github.com/ZxZxZ143/vympel/actions/runs/30231592708)
at exact source `477d32b36e817bb92b7000e94851e5756a186d9c`.

Trusted Release Images run
[30231792115](https://github.com/ZxZxZ143/vympel/actions/runs/30231792115)
completed successfully. It passed the reusable source gate and all-repository
absence preflight, built amd64 and ARM64 children on native hosted runners,
assembled and attested all three OCI indexes, recorded exact index/platform
digests, ran the exact amd64 images, and ran the exact ARM64 images through the
bounded QEMU rehearsal. ARM64 proof covered all 77 Liquibase changesets,
backend readiness and Java `aarch64`, Node `arm64`, native sharp transforms in
both Next.js apps, storefront image optimization, CRM `/login`, and storefront
`/ru`.

The consolidated published-manifest artifact is ID `8640548543`, size 1345
bytes, ZIP digest
`sha256:2b265b71e26bdc1ebf2854b8bbf6d227768f106e38e92fd8b87b01427ac3271e`.
The metadata artifact is ID `8640481382`, ZIP digest
`sha256:6fbd4b0777348e6668a57ec8c9c671f022e9f2de72cc99032f5c14445c2ab2fb`.
The complete registry record is committed at
`deployment/releases/v1.0.0-rc.7.yml`.

RC.7 is intentionally evidence-only: it records acknowledged `.invalid`
browser-visible origins, and a later direct amd64 filesystem scan found the
then-unconditional `http://localhost` local-media pattern in the storefront
server chunk. The source correction applies only to future images. No Google
Cloud/Oracle resource, external deployment, DNS change, or TLS issuance
occurred. A later immutable RC is required after real staging domains are
approved.

### Immutable publication history

Implementation commit `05a14b51bdc0ed2484b1257cfa3265cf8bb98b8d`
and CRM performance-build correction
`a87c2883023b6ef6d8ed56f33856a242963a0c51` were pushed normally to
`main`. Performance Budgets run
[30223556868](https://github.com/ZxZxZ143/vympel/actions/runs/30223556868)
and Full Release Gate run
[30223556910](https://github.com/ZxZxZ143/vympel/actions/runs/30223556910)
passed on the latter commit. Annotated tag `v1.0.0-rc.3` points to that
same commit, and tag-triggered Full Release Gate run
[30223734283](https://github.com/ZxZxZ143/vympel/actions/runs/30223734283)
passed.

Trusted Release Images run
[30223751287](https://github.com/ZxZxZ143/vympel/actions/runs/30223751287)
used explicitly acknowledged `.invalid` public origins for a non-deployable
evidence release. It did not complete: QEMU raised an illegal-instruction signal
during storefront ARM64 `npm ci`, the step stopped making progress, and the run
was cancelled at the 90-minute boundary. Backend and CRM RC.3 indexes were
already written; the storefront RC.3 tag is absent. Post-publication runtime
verification and consolidated manifest generation were skipped. RC.3 is
therefore immutable, incomplete, and prohibited from deployment.

The next attempted correction prepared RC.4 by replacing QEMU build execution with
Docker's pinned distributed builder and native `ubuntu-24.04-arm` runners. It
retains the release boundary:

- one `linux/amd64` + `linux/arm64` OCI index per image/tag;
- exact per-platform child-digest metadata;
- isolated amd64 and QEMU-backed ARM64 runtime jobs;
- ARM64 Liquibase/backend readiness, Java/Node architecture, sharp transforms, and storefront `/_next/image` proof;
- explicit build-time frontend public configuration recorded in the release manifest;
- a validated Oracle single-VM Compose/env/HTTP-first Nginx/systemd bundle;
- a preflight that rejects any existing SHA or RC tag across all three
  repositories before publication; and
- storefront-first publication so the previously failing dependency stage
  completes before backend and CRM registry writes begin.

At that point, the RC.4 commit/tag, registry digests, and final status remained
pending until the native-runner correction was committed, pushed normally, and
verified. The later paragraphs preserve that outcome. RC.2 remained the
verified amd64-only baseline and was not moved.

Native-builder correction commit `dc74e8d54a18678e058312026170efe1019d463c`
passed Performance Budgets run
[30227958829](https://github.com/ZxZxZ143/vympel/actions/runs/30227958829)
and non-publishing Release Images run
[30227959010](https://github.com/ZxZxZ143/vympel/actions/runs/30227959010).
Full Release Gate run
[30227958950](https://github.com/ZxZxZ143/vympel/actions/runs/30227958950)
validated workflow YAML/actionlint, scripts, all Compose contracts, Oracle
topology, Nginx syntax, storefront, CRM, and backend tests, but its shared job
failed before later rehearsals when the first Nginx health curl received a
transient TCP reset. The health loop now treats refusal/reset as not-ready within
the existing 90-second deadline; routing assertions after readiness remain
fail-fast. Promotion waits for this correction's new exact-source gate.

Readiness correction commit `ac924fae45e94911c65c95a18f10e8c53a587c3a`
then passed Backend CI
[30228150297](https://github.com/ZxZxZ143/vympel/actions/runs/30228150297),
Storefront CI
[30228150284](https://github.com/ZxZxZ143/vympel/actions/runs/30228150284),
CRM CI
[30228150278](https://github.com/ZxZxZ143/vympel/actions/runs/30228150278),
Performance Budgets
[30228150276](https://github.com/ZxZxZ143/vympel/actions/runs/30228150276),
Full Release Gate
[30228150392](https://github.com/ZxZxZ143/vympel/actions/runs/30228150392),
and non-publishing Release Images
[30228150531](https://github.com/ZxZxZ143/vympel/actions/runs/30228150531).
Annotated tag `v1.0.0-rc.4` points to that exact commit; tag-triggered Full
Release Gate [30228362372](https://github.com/ZxZxZ143/vympel/actions/runs/30228362372)
also passed.

Trusted RC.4 publication run
[30228582070](https://github.com/ZxZxZ143/vympel/actions/runs/30228582070)
passed the reusable gate and absence preflight, then assigned storefront builds
to native amd64 and ARM64 runners. Both failed before Dockerfile execution
because `file: ./vympel_front/Dockerfile` was resolved relative to Git context
`./vympel_front`. Backend/CRM remained skipped by the storefront-first boundary,
and independent registry inspection confirmed all three RC.4 and full-SHA tags
are absent. RC.4 is retained as an immutable no-publication failure. RC.5 will
use `file: ./Dockerfile` relative to each component context.

Context-path correction commit `8bc963babe17b7c4e5177fa19831a8eb310880cf`
passed Performance Budgets run
[30228959296](https://github.com/ZxZxZ143/vympel/actions/runs/30228959296),
build-only Release Images run
[30228959606](https://github.com/ZxZxZ143/vympel/actions/runs/30228959606),
and Full Release Gate run
[30228959409](https://github.com/ZxZxZ143/vympel/actions/runs/30228959409).
Annotated tag `v1.0.0-rc.5` points to that exact commit, and tag-triggered Full
Release Gate run
[30229201663](https://github.com/ZxZxZ143/vympel/actions/runs/30229201663)
passed.

Trusted RC.5 publication run
[30229413801](https://github.com/ZxZxZ143/vympel/actions/runs/30229413801)
published native amd64/ARM64 storefront and CRM indexes and their exact
full-SHA aliases. Both backend architecture jobs failed before Dockerfile
execution: its explicit Dockerfile frontend 1.7.1 did not advertise
`source.git.checksum`, which the pinned BuildKit 0.31.1 Git context requires.
Backend RC.5/full-SHA tags are absent. The workflow correctly failed the
three-repository boundary and skipped index attestation, runtime checks, and
consolidated-manifest generation. RC.5 remains immutable, partial, and
non-deployable; RC.6 will remove the obsolete backend frontend pin while
retaining the Dockerfile's existing architecture-neutral Gradle and
target-platform Temurin runtime stages.

Dockerfile-frontend correction commit
`d422e38e233f00f55e2c96a37d8600c5b316fef9` passed Backend CI
[30230221671](https://github.com/ZxZxZ143/vympel/actions/runs/30230221671),
Performance Budgets
[30230221696](https://github.com/ZxZxZ143/vympel/actions/runs/30230221696),
build-only Release Images
[30230221857](https://github.com/ZxZxZ143/vympel/actions/runs/30230221857),
and Full Release Gate
[30230221709](https://github.com/ZxZxZ143/vympel/actions/runs/30230221709).
Annotated `v1.0.0-rc.6` points to that exact commit; tag-triggered Full Release
Gate [30230421073](https://github.com/ZxZxZ143/vympel/actions/runs/30230421073)
also passed.

Trusted RC.6 publication run
[30230602721](https://github.com/ZxZxZ143/vympel/actions/runs/30230602721)
passed all six native builds and created all three matching RC/full-SHA
multi-platform indexes. The final-index `actions/attest` jobs all failed with
`No credentials found for registry ghcr.io` because login state does not cross
GitHub Actions job boundaries. Metadata, amd64/ARM64 runtime verification, and
the consolidated release manifest were skipped. RC.6 is immutable and
non-deployable. RC.7 adds an explicit GHCR login using only the short-lived
repository `GITHUB_TOKEN` in each attestation matrix job.

## GHCR publication enablement

Status as of 2026-07-26: **PASS — three independent GHCR images published, attested, pulled, inspected, and exercised from one immutable RC source. No hosting deployment ran.**

Exact source commit `633db42643d42ee6448919b5f6b6b16a7da1ca17` passed all required main-branch evidence before tagging:

| Workflow | Run | Result |
| --- | --- | --- |
| Backend CI | [30207532213](https://github.com/ZxZxZ143/vympel/actions/runs/30207532213) | PASS |
| Storefront CI | [30207532189](https://github.com/ZxZxZ143/vympel/actions/runs/30207532189) | PASS |
| CRM CI | [30207532188](https://github.com/ZxZxZ143/vympel/actions/runs/30207532188) | PASS |
| Performance budgets | [30207532192](https://github.com/ZxZxZ143/vympel/actions/runs/30207532192) | PASS |
| Full Release Gate | [30207532251](https://github.com/ZxZxZ143/vympel/actions/runs/30207532251) | PASS |
| Release Images | [30207532316](https://github.com/ZxZxZ143/vympel/actions/runs/30207532316) | PASS, BUILD ONLY |

Annotated tag `v1.0.0-rc.2` resolves to the same commit. Tag-triggered Full Release Gate [30207729407](https://github.com/ZxZxZ143/vympel/actions/runs/30207729407) passed all component, deployment, actionlint, security, and metadata jobs. The older `v1.0.0-rc.1` tag was not moved.

Manual Release Images run [30208034635](https://github.com/ZxZxZ143/vympel/actions/runs/30208034635) was dispatched from `v1.0.0-rc.2` with `publish_images=true` and `release_tag=v1.0.0-rc.2`. It authenticated to GHCR as `github.actor` using only the repository `GITHUB_TOKEN`, rejected pre-existing immutable tags, and passed the same-commit reusable Full Release Gate before any registry write.

| Image | Full-SHA / RC digest | Runtime user | Attestation |
| --- | --- | --- | --- |
| `ghcr.io/zxzxz143/vympel-backend` | `sha256:6272e041e0a60747eb647a300b9165c8eeb5dbf784c8a48dc795c132a91f88df` | `vympel` | [37173264](https://github.com/ZxZxZ143/vympel/attestations/37173264) |
| `ghcr.io/zxzxz143/vympel-storefront` | `sha256:23f99e15cc31027ce6b5618ba01b45c990781047acb9572031c3abc75985b328` | `node` | [37173260](https://github.com/ZxZxZ143/vympel/attestations/37173260) |
| `ghcr.io/zxzxz143/vympel-crm` | `sha256:7de1c4b0967aaf6cfbae7ec13c626685096403b368cb0e4434baf3a98322abef` | `node` | [37173168](https://github.com/ZxZxZ143/vympel/attestations/37173168) |

The workflow published BuildKit `mode=max` provenance and SBOM attestations plus signed GitHub provenance for each pushed digest. It pulled the exact full-SHA references, confirmed Linux/amd64, non-root users, OCI source/revision labels, digest equality, and absence of secret-bearing image environment metadata. The isolated `vympel-ghcr-30208034635-1` Compose project then reported backend, storefront, and CRM healthy; backend readiness passed, and both Next containers successfully called the backend public ping endpoint. Cleanup removed the disposable containers, network, and volumes.

The digest-complete artifact `published-release-manifest-633db42643d42ee6448919b5f6b6b16a7da1ca17` has ID `8633714297` and artifact digest `sha256:2ffa0c4251c3bdc334da99581460690d6e5cb1eef1251bd6e4628844b3fed51e`. Its exact non-secret content is committed at `deployment/releases/v1.0.0-rc.2.yml`. Backend metadata artifact ID is `8633699268`, storefront `8633698670`, and CRM `8633687537`.

All three packages were observed as **Public** after publication; no visibility setting was changed. Each release version lists only `633db42643d42ee6448919b5f6b6b16a7da1ca17` and `v1.0.0-rc.2`. GitHub's “Latest” page badge identifies the newest package version and does not mean a `latest` tag was published.

The storefront/CRM build inputs were loopback URLs for a non-deployable registry/runtime rehearsal. The resulting images are not approved for an external environment; final public origins require a new immutable tag and build. No staging, production, cloud, or hosting deployment was performed.

### Prepublication advisory refresh

The first publication-enablement commit `374c5b3d813be9336941125a2ff03269b0ec79f9` was not eligible for release. Storefront CI run [30206114789](https://github.com/ZxZxZ143/vympel/actions/runs/30206114789) failed the unchanged `npm audit --audit-level=high` step after the npm advisory database began reporting newly disclosed Next.js 16.2.10 and `brace-expansion <=5.0.7` issues. Publication was stopped before any tag or registry write.

Both apps now select supported Next.js and `eslint-config-next` 16.2.12 patches, retain `sharp@0.35.3`, and scope patched `brace-expansion@5.0.8` to `minimatch@3.1.5`. Because the secure brace-expansion release exposes a named CommonJS export while minimatch 3 expects a callable export, clean installs run an exact-version, fail-closed compatibility bridge before lint/build. Local clean Windows installs, full and production-only audits, dependency assertions, lint, typecheck, 41 storefront tests, 25 CRM tests, security-header tests, production builds, budgets, and clean Node 22 Alpine image builds pass.

On remediation commit `8d943f9df96b6f49db53b81c4edb24ce3bb21f34`, Storefront CI [30207052278](https://github.com/ZxZxZ143/vympel/actions/runs/30207052278), CRM CI [30207052316](https://github.com/ZxZxZ143/vympel/actions/runs/30207052316), Performance budgets [30207052292](https://github.com/ZxZxZ143/vympel/actions/runs/30207052292), and build-only Release Images [30207052495](https://github.com/ZxZxZ143/vympel/actions/runs/30207052495) passed. Full Release Gate [30207052395](https://github.com/ZxZxZ143/vympel/actions/runs/30207052395) correctly blocked promotion because actionlint reported SC2086 for a scalar holding multiple Compose arguments in the published-image rehearsal. Commit `acae99b27beeaff1d8761c38c38cdbaf5b578fc1` corrected the shell argument boundary.

Commit `acae99b27beeaff1d8761c38c38cdbaf5b578fc1` proved the actionlint correction: actionlint, YAML, scripts, Compose, proxy, backup/restore, backend, storefront, CRM, Performance budgets [30207222320](https://github.com/ZxZxZ143/vympel/actions/runs/30207222320), and build-only Release Images [30207222476](https://github.com/ZxZxZ143/vympel/actions/runs/30207222476) passed. Full Release Gate [30207222400](https://github.com/ZxZxZ143/vympel/actions/runs/30207222400) then exposed a race in the existing CMS rehearsal: the worker legitimately claimed the retry row as `PROCESSING|1` before the script asserted an instantaneous `RETRY` state. The rehearsal now accepts only the adjacent `RETRY` or `PROCESSING` state with a positive attempt count at that intermediate boundary, while retaining its later `SUCCEEDED` with at least two attempts and fresh public HTML proof. Commit `633db42643d42ee6448919b5f6b6b16a7da1ca17` passed the complete gate and became immutable `v1.0.0-rc.2`.

## Post-RC sharp security remediation

Status: local and remote GitHub Actions verification passed for the exact sharp remediation commit.

Both frontend applications were affected through `next@16.2.10 -> optional sharp@^0.34.5 -> sharp@0.34.5`. The latest stable Next.js release checked during remediation, 16.2.11, still declares `sharp@^0.34.5`, so a framework patch does not remove the vulnerable range. Storefront and CRM now use a narrowly scoped `next -> sharp@^0.35.0` npm override, currently locked at 0.35.3; Next.js, React, React DOM, next-intl, TypeScript, Node, the audit threshold, and image optimization remain unchanged. No direct global `sharp` override was added.

Local clean installs resolved one installed path per app at `next@16.2.10 -> sharp@0.35.3 overridden`. High-level and full npm audits returned zero vulnerabilities. Lint, typecheck, 13 storefront test files / 41 tests, 8 CRM test files / 25 tests, production builds, security-header checks, storefront production status/content, CRM login/header/noindex behavior, and asset/bundle budgets passed. Pinned actionlint 1.7.7 passed.

The final Node 22 Alpine images built as Linux/amd64. Both containers became healthy; standalone output contained `sharp@0.35.3`; in-container WebP and AVIF transforms loaded libvips 8.18.3; and storefront `/_next/image` returned HTTP 200 `image/webp` for both a local asset and a public-HTTPS copy of the same repository image. Published `sharp@0.35.3` metadata includes Linux glibc and musl binaries for amd64 and arm64. `scripts/check-sharp-security.mjs` now prints the finite installed graph and rejects any stable `sharp` below 0.35.0 in both component workflows.

| Workflow | Run | Result | Sharp remediation evidence |
| --- | --- | --- | --- |
| Storefront CI | [29944334362](https://github.com/ZxZxZ143/vympel/actions/runs/29944334362) | PASS | Clean install, `test:sharp-security`, lint, typecheck, 41 tests, unchanged high audit, build, budget, and storefront image |
| CRM CI | [29944334256](https://github.com/ZxZxZ143/vympel/actions/runs/29944334256) | PASS | Clean install, `test:sharp-security`, lint, typecheck, 25 tests, unchanged high audit, build, budget, and CRM image build |
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

## Historical RC.1 publication and deployment disposition

- No Docker registry was configured, no registry credentials were supplied, and no image was pushed.
- No external staging or production deployment ran.
- No cloud resource was created.
- No credentials or secret values are recorded in this report or its artifacts.
- Remote CI resolves the provider-independent workflow gate only. Hosting, domains, registry digests, managed data services, secret management, public TLS/trusted proxies, monitoring delivery, and real staging proof remain provider-specific.
