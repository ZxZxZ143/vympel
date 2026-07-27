# Release Candidate Verification

Date: 2026-07-27
Candidate: `v1.0.0-rc.7`
Status: amd64/ARM64 publication and runtime gates passed; evidence-only public origins and a retained storefront local-media pattern mean provider deployment remains prohibited.

## ARM64 and Oracle staging candidate

Status: RC.7 is immutable, completely published, attested, and runtime-verified
for `linux/amd64` and `linux/arm64`. RC.3 and RC.5 remain immutable and partial;
RC.4 remains immutable and unpublished; RC.6 remains immutable with complete
indexes but incomplete downstream evidence.

Exact source commit `477d32b36e817bb92b7000e94851e5756a186d9c`
passed Performance Budgets run
[30231338581](https://github.com/ZxZxZ143/vympel/actions/runs/30231338581),
build-only Release Images run
[30231338867](https://github.com/ZxZxZ143/vympel/actions/runs/30231338867),
Full Release Gate run
[30231338728](https://github.com/ZxZxZ143/vympel/actions/runs/30231338728),
and tag-triggered Full Release Gate run
[30231592708](https://github.com/ZxZxZ143/vympel/actions/runs/30231592708).
Trusted publication run
[30231792115](https://github.com/ZxZxZ143/vympel/actions/runs/30231792115)
then passed all six native builds, final index and provenance jobs, registry
metadata, amd64 runtime, QEMU ARM64 runtime, and consolidated manifest
generation.

The accepted registry record is:

| Image | Index digest | amd64 child | ARM64 child |
| --- | --- | --- | --- |
| Backend | `sha256:56e18f59861e51cdaf87721784e1bdc11d8bf39f2073f95ed1c1d65199ae7650` | `sha256:1616b6841fa7ee2825920164f4369ae0dedc04a575c6d465e949d81330759f5b` | `sha256:0019dfff9649fff1dfdaba5b7d051f38b29c4138b2fda3550b39c3b1b8073c0d` |
| Storefront | `sha256:19c1aad97804e6bc625a1842e8bad33ee6de1606ee93aa797d330ee208dde7b8` | `sha256:7aa454cce1cfec03b3e93ba02b32f53fd87024ac6e68589db80d433067f5fbac` | `sha256:dfc105358113dbd71ee53fa526cd1fd4602914cc0a23101d21aa202653fd89d8` |
| CRM | `sha256:6ca77f9f69399ffa28401323a2a2bef8a5d99af42025e5261e23aaffff2878af` | `sha256:2ee731cc2ce1bdec930328dbefc338f26cc1e6657020503f655e64bc0d586762` | `sha256:ecbddf8b0f42beb7c0b10c022365e746a513cf1d9065ee80a9dfd6605d870b23` |

The exact release artifact is committed at
`deployment/releases/v1.0.0-rc.7.yml`. The tag and full-SHA aliases match for
every image. Backend Liquibase/readiness/Java ARM64, storefront and CRM native
ARM64 sharp transforms, storefront image optimization, and both Next.js routes
passed. No external deployment ran.

Implementation commit `05a14b51bdc0ed2484b1257cfa3265cf8bb98b8d`
and CRM performance-build correction
`a87c2883023b6ef6d8ed56f33856a242963a0c51` passed the required remote
gates. Annotated tag `v1.0.0-rc.3` resolves to the latter commit. Trusted
publication run
[30223751287](https://github.com/ZxZxZ143/vympel/actions/runs/30223751287)
failed to produce a complete three-image set: QEMU raised an illegal-instruction
signal during storefront ARM64 `npm ci`, backend and CRM indexes had already
published, storefront never published, and runtime/manifest jobs did not run.

RC.3 and its partial GHCR tags must not be moved, overwritten, retried, or
deployed. RC.4 at `ac924fae45e94911c65c95a18f10e8c53a587c3a` passed all
source gates, but publication run
[30228582070](https://github.com/ZxZxZ143/vympel/actions/runs/30228582070)
failed before registry writes because its Dockerfile paths were not relative to
the component Git contexts. RC.4 also must not be moved or retried.

RC.5 at `8bc963babe17b7c4e5177fa19831a8eb310880cf` passed its main and
tag-triggered source gates. Trusted publication run
[30229413801](https://github.com/ZxZxZ143/vympel/actions/runs/30229413801)
published native amd64/ARM64 storefront and CRM indexes, then failed both
backend build jobs before Dockerfile execution. The backend's pinned Dockerfile
frontend 1.7.1 did not support the reusable builder's Git-context
`source.git.checksum` capability. Backend RC.5/full-SHA tags are absent;
storefront and CRM tags are retained as partial failure evidence. Attestation,
runtime verification, and consolidated release-manifest jobs did not run.

RC.5 must not be moved, overwritten, retried, or deployed.

RC.6 at `d422e38e233f00f55e2c96a37d8600c5b316fef9` passed its main and
tag-triggered source gates. Trusted publication run
[30230602721](https://github.com/ZxZxZ143/vympel/actions/runs/30230602721)
passed all six native architecture builds and created all three amd64/ARM64
indexes under matching RC and full-SHA tags. Its final-index attestation matrix
then failed because `actions/attest` had no registry credentials in that
separate job. Release metadata, runtime verification, and consolidated manifest
generation were skipped.

RC.6 must not be moved, overwritten, retried, or deployed. Its per-job registry
authentication correction was verified only under the later immutable RC.7
source and publication.

The release publication is accepted only when:

- backend, storefront, and CRM tags each resolve to one OCI index with `linux/amd64` and `linux/arm64`;
- RC tag and exact SHA tag have the same index digest;
- all six platform child digests are recorded;
- amd64 and ARM64 isolated runtime checks pass;
- ARM64 backend completes Liquibase and readiness with Java `aarch64`;
- ARM64 storefront and CRM run Node `arm64` and native sharp transforms;
- storefront image optimization returns a real optimized image;
- exact frontend public build configuration and latest Liquibase changeset are recorded;
- Oracle account/domain decisions remain explicit;
- deployment remains `false`.

The committed `.invalid` Oracle environment values are deliberate template placeholders. Any release built with reserved placeholders is evidence-only and must carry `placeholder_acknowledged: true`; it cannot be deployed. Final DNS requires a later immutable rebuild with those exact approved public origins.

### Preserved incomplete RC.3 record

| Image | RC.3 status | Index digest | amd64 child | ARM64 child |
| --- | --- | --- | --- | --- |
| Backend | Published, partial set only | `sha256:069a4e76b608e2cbebc080efbd385b3cdbbef2ec748aacf8a74230f8c8c237ef` | `sha256:83fbd435ec0c81e81c3ded634634e5af61c60b993c150a5c3b518e086dc85075` | `sha256:ad15c36a11122385e40c6ab3e401e6723e13efb15bdb91073a732b273c7b665b` |
| Storefront | Missing | — | — | — |
| CRM | Published, partial set only | `sha256:fde50bc3bb573fd2e9689de762dc204412b10886482782c252da56cbc97e4cad` | `sha256:41bfe673e85356b897113faf08fd8e12e1199ff55fdb11177a231687ff6744fc` | `sha256:bb787fb52d9ec229a377c834968a6489cec7586b631bccd6b29109905669c857` |

These two valid component indexes do not make RC.3 a valid Vympel release.
Atomic release acceptance requires all three images plus both runtime jobs and
the consolidated release manifest.

## Current RC.2 publication record

Annotated tag `v1.0.0-rc.2` points to exact source commit `633db42643d42ee6448919b5f6b6b16a7da1ca17`. Backend CI `30207532213`, Storefront CI `30207532189`, CRM CI `30207532188`, Performance budgets `30207532192`, Full Release Gate `30207532251`, and build-only Release Images `30207532316` passed for that commit. Tag-triggered Full Release Gate `30207729407` passed again on the same source.

Manual Release Images run [30208034635](https://github.com/ZxZxZ143/vympel/actions/runs/30208034635) passed publication policy and the reusable same-commit gate, then published all three public packages using the repository `GITHUB_TOKEN`:

| Image | Digest | Attestation |
| --- | --- | --- |
| Backend | `sha256:6272e041e0a60747eb647a300b9165c8eeb5dbf784c8a48dc795c132a91f88df` | [37173264](https://github.com/ZxZxZ143/vympel/attestations/37173264) |
| Storefront | `sha256:23f99e15cc31027ce6b5618ba01b45c990781047acb9572031c3abc75985b328` | [37173260](https://github.com/ZxZxZ143/vympel/attestations/37173260) |
| CRM | `sha256:7de1c4b0967aaf6cfbae7ec13c626685096403b368cb0e4434baf3a98322abef` | [37173168](https://github.com/ZxZxZ143/vympel/attestations/37173168) |

The workflow generated BuildKit provenance/SBOM data and signed GitHub provenance, pulled and inspected the exact SHA references, confirmed amd64/non-root/OCI label/digest/no-secret-metadata requirements, and brought backend, storefront, and CRM to healthy state in an isolated disposable Compose project. The release artifact is preserved at `deployment/releases/v1.0.0-rc.2.yml`. Both the full SHA and RC tag point at each digest; no mutable `latest` tag exists.

This was intentionally a registry/runtime rehearsal with loopback browser-visible build URLs. No external deployment ran, and these frontend images must not be promoted to an external environment. Once final origins are approved, create and publish a new immutable release candidate instead of moving `v1.0.0-rc.2`.

## Preserved starting state

- Baseline commit: `0fd2f14f75021aab8eafcd4c6f34739d3d1a3418`.
- Deployment implementation commit: `af6d1926c7630773d1d7d948016f713d356b3e5f`.
- Historical Git backup: `E:\vympel_git_backup_20260721_183725`, verified intact and never added to the repository.
- ADMIN bootstrap implementation and exact four-variable contract are preserved. Full backend tests passed; production remains disabled by default.

## RC.2 security baseline

Commit `0fe55f39db7c7b5c495e200e778841584014ce04` remediates the high-severity libvips advisories inherited through `next@16.2.10 -> sharp@0.34.5` in both storefront and CRM. A Next-scoped npm override selects stable `sharp@^0.35.0`, currently locked at 0.35.3; no framework/runtime package was downgraded, the high-severity audit gate remains enabled, and a shared CI assertion rejects installed `sharp` versions below 0.35.0. Clean audits, application gates, Linux/amd64 image builds, healthy containers, libvips 8.18.3 WebP/AVIF transforms, and local/remote Next image optimization passed. Storefront CI `29944334362`, CRM CI `29944334256`, Backend CI `29944334263`, Full Release Gate `29944335708`, Release Images `29944334455`, and Performance budgets `29944335576` all passed remotely for the exact commit; the release-image run remained build-only.

This change is intentionally not represented by `v1.0.0-rc.1`, whose immutable target remains `954e8a3a659371ba0203369aec9d2fef968fab5b`. It is included in `v1.0.0-rc.2` at `633db42643d42ee6448919b5f6b6b16a7da1ca17`; neither tag was moved.

## Historical RC.1 provider-independent release gates

| Area | Result | Evidence |
| --- | --- | --- |
| Backend full tests | PASS | 161 tests / 1 skipped on a fresh disposable PostgreSQL 16 database, 2026-07-22 |
| Backend executable JAR | PASS | Gradle `bootJar` |
| ADMIN regression | PASS | Included in full suite; controlled procedure added to staging/production checklists |
| Canonical Liquibase clean path | PASS | 77 changes, latest `2026-07-19-02-update-public-image-paths-to-webp` |
| Historical Liquibase condition | BLOCKED WHEN ROW EXISTS | Exact artifact unrecoverable; fail-closed external acceptance gate and four-path compatibility test pass |
| Storefront clean install | PASS | 662 packages |
| Storefront lint/typecheck/tests/audit/build | PASS | 12 files / 34 tests; 0 vulnerabilities; 34 production routes |
| Storefront SEO | PASS | Canonical/alternates, active-only sitemap, unavailable-backend failure, robots tests |
| CRM clean install | PASS | 387 packages |
| CRM lint/typecheck/tests/audit/build | PASS | 8 files / 25 tests; 0 vulnerabilities; 17 production routes |
| CRM crawler policy | PASS | Global `noindex, nofollow` unit verification |
| Frontend budgets | PASS | Storefront 1.34/1.65 MiB; CRM 1.09/1.40 MiB; assets 7.33/24 MiB |
| Backend image | PASS | `sha256:65228d906ddfac523565ba0a781c5a5c587adf53da8d7bb994498c1f6c4adac9` |
| Storefront image | PASS | `sha256:a93a2be21103b67817bced4d1e4158d805cdd4c55d34620b7ed85c7037190ab6` |
| CRM image | PASS | `sha256:4d6595f2f368c779377cae747103e92063e54421b1c1e9a2d8cdbce98bcbb86a`; `/login` HTTP 200 |
| Local/staging/production Compose | PASS | All three `config --quiet` checks |
| Backup/restore | PASS | final-postmaster rerun `aaeaae0e31b6`; `BACKUP_RESTORE_REHEARSAL_REPORT.md` |
| CMS signed freshness/retry | PASS | final-postmaster rerun `02d552977bfa`; `CMS_REVALIDATION_INTEGRATION_REPORT.md` |
| Reverse proxy | PASS | Rehearsal `2434c49c8067`; second consecutive pass after command-resolution and bounded upstream-readiness corrections |
| Prometheus/rules | PASS | `promtool` 3.5.0; one config and seven rules |
| Workflow semantics | PASS | pinned actionlint 1.7.7 |
| Release image policy | PASS | relevant `main` changes build full-SHA images without publication; registry push remains manually and externally guarded |
| YAML and script syntax | PASS | Psych syntax parsing, eleven POSIX scripts, three PowerShell rehearsals, Node gateway |
| Secret/generated artifact scan | PASS | gitleaks 8.28.0 scanned the exact staged index with redacted output; no leaks found; generated/dependency/dump/key inventory passed |
| Remote GitHub CI | PASS | Exact SHA passed backend, storefront, CRM, full release, performance, and non-publishing release-image workflows; `REMOTE_CI_VERIFICATION.md` |
| Immutable RC manifest | PASS WITH PENDING REGISTRY DATA | Full-gate artifact `full-release-gate-954e8a3a659371ba0203369aec9d2fef968fab5b`, ID `8510711242`, identifies three full-SHA images; registry repositories and image digests intentionally remain pending |
| Release-candidate tag | PASS | Annotated `v1.0.0-rc.1` points to `954e8a3a659371ba0203369aec9d2fef968fab5b`, was pushed normally, and its Full Release Gate run `29870201605` passed all five jobs |

The image IDs above are local verification images, not registry digests. No image was pushed.

## Production-like rehearsal conclusions

- PostgreSQL 16.13 custom-format backup restored with matching 77-change/51-table summaries and zero unvalidated constraints; the current backend reached readiness on the restored database.
- A production storefront validated signed CMS delivery. Storefront unavailability and a 500 ms timeout both produced persistent retries that completed on attempt two and refreshed public HTML. Invalid HMAC returned 401 and no secret reached browser assets, HTML, or application logs.
- Nginx routing, forwarded headers, client IP chain, upload limit, API timeout, upstream security headers, Actuator blocking, invalid host rejection, redirect, and TLS syntax passed with an ephemeral self-signed certificate. Public certificate trust remains unclaimed.
- Provider-neutral Prometheus scrape and alert examples validate but no monitoring provider, alert route, or on-call owner has been configured.

## Remaining provider-specific conditions

Hosting, final domains, managed PostgreSQL/provider restore, Redis, object storage, secret manager, monitoring/alert delivery, public TLS and trusted proxy CIDRs, final-origin image rebuild, and a real staging deployment remain pending. Production is not approved. Any upgrade database containing the unrecoverable historical changeset row also requires accountable external acceptance before migration.
