# Multi-Architecture Image Verification

## Purpose

Vympel publishes one OCI image index per immutable SHA or release-candidate tag. Each index must contain exactly one `linux/amd64` application manifest and one `linux/arm64` application manifest. Build attestations may add `unknown/unknown` manifests and are not application platforms.

The authoritative images remain separate:

- `ghcr.io/zxzxz143/vympel-backend`
- `ghcr.io/zxzxz143/vympel-storefront`
- `ghcr.io/zxzxz143/vympel-crm`

## RC.2 baseline

`v1.0.0-rc.2` is immutable at commit `633db42643d42ee6448919b5f6b6b16a7da1ca17`. Registry inspection on 2026-07-27 found only `linux/amd64` application children:

| Image | OCI index digest | linux/amd64 child | linux/arm64 |
| --- | --- | --- | --- |
| Backend | `sha256:6272e041e0a60747eb647a300b9165c8eeb5dbf784c8a48dc795c132a91f88df` | `sha256:7d1f348074c2b5b053a5cf527112441d8b1cbfabae5ff7f215a62211cfbc1eb8` | Missing |
| Storefront | `sha256:23f99e15cc31027ce6b5618ba01b45c990781047acb9572031c3abc75985b328` | `sha256:29f76309a747c835401142d4c7fd97f4bb5e1b7b8903ea752961e8f79ea3d004` | Missing |
| CRM | `sha256:7de1c4b0967aaf6cfbae7ec13c626685096403b368cb0e4434baf3a98322abef` | `sha256:7efc1818a2670b15ff060dc88c886b10eb49f3f10d678ca3d0db99bd1f28a8a7` | Missing |

RC.2 was not moved or republished. A later RC is required for ARM64.

## Build architecture

All three Dockerfiles use official architecture-neutral base references:

- Backend: `eclipse-temurin:17-jdk-jammy` and `eclipse-temurin:17-jre-jammy`. The architecture-neutral Spring Boot JAR compiles on BuildKit's native `$BUILDPLATFORM`, while the runtime stage resolves for the requested target platform; this avoids running Gradle under QEMU without changing runtime architecture.
- Storefront and CRM: `node:22-alpine`.
- Frontend dependency installation runs inside the selected build platform. No host `node_modules`, downloaded architecture-specific executable, or hardcoded architecture URL is copied into an image.
- `next -> sharp@0.35.3` is lockfile-controlled and installs the selected platform's musl native package during `npm ci`.
- Runtime users remain `vympel` for backend and `node` for both Next.js apps.

Manual publication calls Docker's reusable GitHub Builder workflow at immutable commit
`3415a188caae9a0da7fba83bc06985776e0b1790` with:

```text
platforms: linux/amd64,linux/arm64
distribute: true
default runner: ubuntu-24.04
linux/arm64 runner: ubuntu-24.04-arm
```

Each platform is built on its native GitHub-hosted architecture and the reusable
workflow assembles one final OCI index. QEMU is not used for `npm ci` or image
publication. Ordinary push CI remains a faster native `linux/amd64` build-only
check. The guarded publication jobs are the multi-platform authority. This follows
Docker's [official distributed GitHub Actions pattern](https://docs.docker.com/build/ci/github-actions/multi-platform/).

## Automated publication proof

For each image, `.github/workflows/release-images.yml`:

1. Runs the reusable Full Release Gate before registry login or writes.
2. Rejects every existing full-SHA or RC tag across all three image repositories
   before publication fans out.
3. Builds the storefront first on native amd64 and ARM64 runners, then builds
   backend and CRM on the same native runner mapping. This prioritizes the
   historically failure-prone frontend dependency stage before the other
   repositories are written.
4. Assembles and pushes one OCI index for `linux/amd64,linux/arm64` per image.
5. Adds OCI labels, BuildKit provenance/SBOM, Docker's signed SLSA attestations,
   and signed GitHub provenance for the final index.
6. Reads the exact `linux/amd64` and `linux/arm64` child digests from the registry index.
7. Records the index and both child digests in per-image metadata.
8. Pulls each child by digest and verifies architecture, non-root user, OCI source/revision labels, and absence of secret-bearing image environment metadata.
9. Runs the exact SHA-tagged amd64 images in isolated Compose.
10. Enables QEMU only for a post-publication runtime rehearsal of the exact
    ARM64 images with ARM64 PostgreSQL, Redis, and MinIO.
11. Requires Liquibase completion, backend readiness, storefront `/ru`, CRM `/login`, a real storefront `/_next/image` transform, ARM64 Java, ARM64 Node, and native `sharp` transforms in both Next containers.
12. Emits a consolidated release manifest only after both runtime jobs pass.

The disposable QEMU override supplies Redis `--ignore-warnings ARM64-COW-BUG` because Redis cannot distinguish the emulation host's kernel signature from the historical native ARM64 copy-on-write defect and otherwise exits before application verification. This exception exists only in `deployment/rehearsals/compose.arm64-images.yml`. The Oracle native ARM64 Compose file does not suppress the warning and therefore keeps Redis's fail-closed kernel check.

The same override gives a cold emulated backend start a longer readiness window. The local proof applied all 77 Liquibase changesets and reached `UP` in about six minutes under QEMU; this is an emulation allowance, not a relaxation of the native Oracle health policy.

## Incomplete RC.3 publication

Annotated tag `v1.0.0-rc.3` remains immutable at
`a87c2883023b6ef6d8ed56f33856a242963a0c51`. Trusted Release Images run
[30223751287](https://github.com/ZxZxZ143/vympel/actions/runs/30223751287)
was cancelled after 90 minutes and is not a release.

The prior single-runner QEMU build reached the storefront ARM64 `npm ci` step,
where QEMU reported `uncaught target signal 4 (Illegal instruction)` and the
process stopped making progress. Backend and CRM had already published their
indexes, while storefront had not published any RC.3 tag:

| Image | RC.3 result | OCI index | linux/amd64 child | linux/arm64 child |
| --- | --- | --- | --- | --- |
| Backend | Partial publication only | `sha256:069a4e76b608e2cbebc080efbd385b3cdbbef2ec748aacf8a74230f8c8c237ef` | `sha256:83fbd435ec0c81e81c3ded634634e5af61c60b993c150a5c3b518e086dc85075` | `sha256:ad15c36a11122385e40c6ab3e401e6723e13efb15bdb91073a732b273c7b665b` |
| Storefront | Missing; no RC.3 tag | — | — | — |
| CRM | Partial publication only | `sha256:fde50bc3bb573fd2e9689de762dc204412b10886482782c252da56cbc97e4cad` | `sha256:41bfe673e85356b897113faf08fd8e12e1199ff55fdb11177a231687ff6744fc` | `sha256:bb787fb52d9ec229a377c834968a6489cec7586b631bccd6b29109905669c857` |

No published-image runtime verification or consolidated release manifest ran.
The backend and CRM tags are retained as failure evidence and will not be
overwritten. RC.3 must never be deployed or retried; the native-runner correction
requires a later immutable candidate.

## RC.4 native-builder path failure

Annotated tag `v1.0.0-rc.4` remains immutable at
`ac924fae45e94911c65c95a18f10e8c53a587c3a`. All six main-branch workflows
and tag-triggered Full Release Gate run
[30228362372](https://github.com/ZxZxZ143/vympel/actions/runs/30228362372)
passed. Trusted Release Images run
[30228582070](https://github.com/ZxZxZ143/vympel/actions/runs/30228582070)
then passed its complete reusable gate and all-repository absence preflight.

The pinned distributed builder assigned the storefront jobs to native
`ubuntu-24.04` and `ubuntu-24.04-arm` runners, but both stopped before executing
the Dockerfile. With Git context `./vympel_front`, the reusable workflow uses
that component directory as the context root; `file:
./vympel_front/Dockerfile` was therefore searched beneath the component
directory and did not exist. Backend and CRM were intentionally ordered after
storefront and were skipped.

Registry inspection after the run confirmed that no backend, storefront, or CRM
RC.4/full-SHA tag was written. RC.4 remains an immutable no-publication failure
record and must not be moved or retried. The corrected reusable calls use
`file: ./Dockerfile` relative to each component Git context; publication moves
to RC.5.

## Independent registry inspection

Run these commands for the RC tag and then repeat them for the exact full SHA:

```bash
docker buildx imagetools inspect ghcr.io/zxzxz143/vympel-backend:v1.0.0-rc.5
docker buildx imagetools inspect ghcr.io/zxzxz143/vympel-storefront:v1.0.0-rc.5
docker buildx imagetools inspect ghcr.io/zxzxz143/vympel-crm:v1.0.0-rc.5
```

Machine-readable inspection:

```bash
docker buildx imagetools inspect \
  ghcr.io/zxzxz143/vympel-backend:v1.0.0-rc.5 \
  --raw | jq '.manifests[] | {digest, platform}'
```

Explicit platform pulls:

```bash
docker pull --platform linux/amd64 ghcr.io/zxzxz143/vympel-backend:v1.0.0-rc.5
docker pull --platform linux/arm64 ghcr.io/zxzxz143/vympel-backend:v1.0.0-rc.5
```

Repeat both pulls for storefront and CRM. Compare the output to
`deployment/releases/v1.0.0-rc.5.yml`; do not copy only the index digest when a
child digest is required.

## Current next-RC evidence

Status: pending the context-relative Dockerfile correction commit, remote CI,
immutable RC.5 tag, and trusted publication run. RC.3 is permanently partial;
RC.4 is permanently unpublished.

The completed evidence section must record:

- exact source commit and RC tag;
- release workflow run URL;
- index and both child digests for all three images;
- explicit RC-tag and SHA-tag platform inspection;
- backend ARM64 Liquibase/readiness and `os.arch=aarch64`;
- storefront/CRM `process.arch=arm64`, `sharp` native transform, and storefront `/_next/image` result;
- exact public build configuration compiled into the frontend images;
- confirmation that no cloud deployment ran.
