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

Manual publication uses Buildx with QEMU and:

```text
platforms: linux/amd64,linux/arm64
```

Ordinary push CI remains a faster native `linux/amd64` build-only check. The guarded publication job is the multi-platform authority. This follows Docker's [official GitHub Actions multi-platform pattern](https://docs.docker.com/build/ci/github-actions/multi-platform/).

## Automated publication proof

For each image, `.github/workflows/release-images.yml`:

1. Runs the reusable Full Release Gate before registry login or writes.
2. Rejects an existing full-SHA or RC tag.
3. Builds and pushes one OCI index for `linux/amd64,linux/arm64`.
4. Adds OCI labels, BuildKit provenance/SBOM, and signed GitHub provenance.
5. Reads the exact `linux/amd64` and `linux/arm64` child digests from the registry index.
6. Records the index and both child digests in per-image metadata.
7. Pulls each child by digest and verifies architecture, non-root user, OCI source/revision labels, and absence of secret-bearing image environment metadata.
8. Runs the exact SHA-tagged amd64 images in isolated Compose.
9. Enables QEMU and separately runs the exact SHA-tagged ARM64 images with ARM64 PostgreSQL, Redis, and MinIO.
10. Requires Liquibase completion, backend readiness, storefront `/ru`, CRM `/login`, a real storefront `/_next/image` transform, ARM64 Java, ARM64 Node, and native `sharp` transforms in both Next containers.
11. Emits a consolidated release manifest only after both runtime jobs pass.

The disposable QEMU override supplies Redis `--ignore-warnings ARM64-COW-BUG` because Redis cannot distinguish the emulation host's kernel signature from the historical native ARM64 copy-on-write defect and otherwise exits before application verification. This exception exists only in `deployment/rehearsals/compose.arm64-images.yml`. The Oracle native ARM64 Compose file does not suppress the warning and therefore keeps Redis's fail-closed kernel check.

The same override gives a cold emulated backend start a longer readiness window. The local proof applied all 77 Liquibase changesets and reached `UP` in about six minutes under QEMU; this is an emulation allowance, not a relaxation of the native Oracle health policy.

## Independent registry inspection

Run these commands for the RC tag and then repeat them for the exact full SHA:

```bash
docker buildx imagetools inspect ghcr.io/zxzxz143/vympel-backend:v1.0.0-rc.3
docker buildx imagetools inspect ghcr.io/zxzxz143/vympel-storefront:v1.0.0-rc.3
docker buildx imagetools inspect ghcr.io/zxzxz143/vympel-crm:v1.0.0-rc.3
```

Machine-readable inspection:

```bash
docker buildx imagetools inspect \
  ghcr.io/zxzxz143/vympel-backend:v1.0.0-rc.3 \
  --raw | jq '.manifests[] | {digest, platform}'
```

Explicit platform pulls:

```bash
docker pull --platform linux/amd64 ghcr.io/zxzxz143/vympel-backend:v1.0.0-rc.3
docker pull --platform linux/arm64 ghcr.io/zxzxz143/vympel-backend:v1.0.0-rc.3
```

Repeat both pulls for storefront and CRM. Compare the output to `deployment/releases/v1.0.0-rc.3.yml`; do not copy only the index digest when a child digest is required.

## Current next-RC evidence

Status: pending the implementation commit, remote CI, immutable tag, and trusted publication run.

The completed evidence section must record:

- exact source commit and RC tag;
- release workflow run URL;
- index and both child digests for all three images;
- explicit RC-tag and SHA-tag platform inspection;
- backend ARM64 Liquibase/readiness and `os.arch=aarch64`;
- storefront/CRM `process.arch=arm64`, `sharp` native transform, and storefront `/_next/image` result;
- exact public build configuration compiled into the frontend images;
- confirmation that no cloud deployment ran.
