# GitHub Container Registry Publication

## Canonical packages

Vympel publishes three independent Linux/amd64 images:

- `ghcr.io/zxzxz143/vympel-backend`
- `ghcr.io/zxzxz143/vympel-storefront`
- `ghcr.io/zxzxz143/vympel-crm`

Every set uses the same full 40-character Git commit SHA. `latest` is never a release or deployment tag. An approved Git release tag may be added to the same digest only when that existing Git tag resolves to the exact published commit.

## Published release-candidate evidence

`v1.0.0-rc.2` is an annotated tag on exact source commit `633db42643d42ee6448919b5f6b6b16a7da1ca17`. Manual Release Images run [30208034635](https://github.com/ZxZxZ143/vympel/actions/runs/30208034635) passed its publication policy, reusable Full Release Gate, three image builds, signed provenance, exact-image inspection, isolated Compose runtime, consolidated manifest, and final publication boundary.

| Image | Registry digest | GitHub attestation |
| --- | --- | --- |
| `ghcr.io/zxzxz143/vympel-backend` | `sha256:6272e041e0a60747eb647a300b9165c8eeb5dbf784c8a48dc795c132a91f88df` | [37173264](https://github.com/ZxZxZ143/vympel/attestations/37173264) |
| `ghcr.io/zxzxz143/vympel-storefront` | `sha256:23f99e15cc31027ce6b5618ba01b45c990781047acb9572031c3abc75985b328` | [37173260](https://github.com/ZxZxZ143/vympel/attestations/37173260) |
| `ghcr.io/zxzxz143/vympel-crm` | `sha256:7de1c4b0967aaf6cfbae7ec13c626685096403b368cb0e4434baf3a98322abef` | [37173168](https://github.com/ZxZxZ143/vympel/attestations/37173168) |

Each digest has both the full-SHA tag and `v1.0.0-rc.2`; no `latest` tag was created. The digest-complete workflow artifact is `published-release-manifest-633db42643d42ee6448919b5f6b6b16a7da1ca17` (ID `8633714297`, artifact digest `sha256:2ffa0c4251c3bdc334da99581460690d6e5cb1eef1251bd6e4628844b3fed51e`) and is preserved at `deployment/releases/v1.0.0-rc.2.yml`.

The publication used loopback storefront/CRM build URLs for a non-deployable registry/runtime rehearsal. Create a new immutable Git tag and image set after final public origins are approved; do not move or overwrite `v1.0.0-rc.2`.

## Publication authority

`.github/workflows/release-images.yml` is the only image-publication workflow. Relevant `main` changes still build all three images without registry authentication or publication. Registry login and push require all of the following:

1. A `workflow_dispatch` run in `ZxZxZ143/vympel`, never a pull request or fork.
2. `publish_images=true`.
3. The reusable Full Release Gate, including backend, storefront, CRM, deployment, audit, and sharp checks, passes for the dispatched commit.
4. If `release_tag` is supplied, the workflow is dispatched from that exact tag ref and the tag resolves to the same commit.
5. Neither the full-SHA tag nor the optional release tag already exists for any target image.

The workflow authenticates to `ghcr.io` as `${{ github.actor }}` with the repository-provided `${{ secrets.GITHUB_TOKEN }}`. It does not require a custom write token, repository variable, PAT, personal password, or registry secret.

## First publication procedure

1. Run both Node security gates locally:

   ```text
   cd vympel_front
   npm ci
   npm ls next sharp
   npm audit --audit-level=high

   cd ../vympel_crm
   npm ci
   npm ls next sharp
   npm audit --audit-level=high
   ```

   The clean installs must print the fail-closed `minimatch 3.1.5` / `brace-expansion 5.0.8` compatibility verification. A zero-vulnerability audit without a working lint/build owner is not sufficient.

2. Push the publication changes normally and wait for Backend CI, Storefront CI, CRM CI, Full Release Gate, and the non-publishing Release Images run to pass on one exact commit.
3. Because `v1.0.0-rc.1` predates the sharp remediation, do not move it. Create a new annotated RC tag, such as `v1.0.0-rc.2`, on the exact verified commit and push the tag normally.
4. Wait for the tag-triggered Full Release Gate to pass.
5. Open **Actions → Release Images → Run workflow**, select the exact RC tag, set `publish_images=true`, and set `release_tag` to the same RC tag. Supply browser-visible build URLs appropriate for the image set. Placeholder or localhost URLs are acceptable only for a non-deployable registry/runtime rehearsal; rebuild for approved final origins before deployment.
6. Confirm that the workflow publishes, pulls, inspects, and health-checks all three SHA-tagged images, and that the consolidated `published-release-manifest-<sha>` artifact has real `sha256:` digests with no pending values.
7. Save the non-secret manifest as release evidence, for example `deployment/releases/v1.0.0-rc.2.yml`, without changing the immutable Git tag.

The workflow generates OCI source, revision, version, and title labels; BuildKit provenance and SBOM attestations; a signed GitHub provenance attestation; per-image metadata; and one consolidated digest manifest. It then pulls the exact SHA references and uses them in a namespaced local Compose rehearsal with disposable PostgreSQL, Redis, and MinIO data.

## Package visibility

Package visibility remains a manual decision. Do not change repository visibility and do not use an unsupported API workaround to change package visibility.

Current state recorded after run `30208034635`: backend, storefront, and CRM packages are all **Public**. Their visibility was inspected without mutation. GitHub's package page also marks the newest package version as “Latest”; that UI marker is not a `latest` container tag, and the listed release version carries only the full SHA and `v1.0.0-rc.2`.

### Public packages

Public packages can be pulled by deployment servers without registry authentication, which is simplest for a test environment. Anyone can download and inspect public image layers and metadata.

### Private packages

Private packages require the deployment server to authenticate before `docker compose pull`. Use a dedicated deployment identity and a read-only credential with only `read:packages`. Never use the GitHub account password, `GITHUB_TOKEN` outside Actions, or a write-capable deployment token.

```sh
printf '%s' "$GHCR_READ_TOKEN" | docker login ghcr.io --username DEPLOY_ACCOUNT --password-stdin
```

Keep the credential outside Git, Compose files, image layers, environment examples, logs, and release manifests.

## Deployment and digest policy

Set:

```text
REGISTRY=ghcr.io/zxzxz143
RELEASE_TAG=<full-40-character-commit-sha>
```

The staging and production Compose files resolve:

```text
${REGISTRY}/vympel-backend:${RELEASE_TAG}
${REGISTRY}/vympel-storefront:${RELEASE_TAG}
${REGISTRY}/vympel-crm:${RELEASE_TAG}
```

The full SHA is the normal deployment selector. For stronger registry immutability, an approved operator may substitute the manifest-recorded `repository@sha256:<digest>` reference in a controlled environment-specific override after verifying that all three digests belong to the same release SHA. Never substitute artifact ZIP digests or local image IDs for registry digests.

## Rollback and retention

Rollback sets all three applications to one previous compatible full SHA and reruns health/smoke checks:

```sh
deployment/scripts/rollback.sh infrastructure/compose/compose.production.yml /secure/vympel/production.env PREVIOUS_40_CHARACTER_SHA
```

Retain every image version referenced by an active deployment, an approved release manifest, or the documented rollback window. Remove only unreferenced failed/abandoned versions after confirming that no release manifest or environment uses their SHA or digest. Never delete or retag the current release or its rollback target, never move an RC tag, and never automate broad GHCR cleanup without an explicit retention review.

Image publication does not deploy Vympel to staging, production, or any hosting provider.
