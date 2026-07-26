# GitHub Container Registry Publication

## Canonical packages

Vympel publishes three independent Linux/amd64 images:

- `ghcr.io/zxzxz143/vympel-backend`
- `ghcr.io/zxzxz143/vympel-storefront`
- `ghcr.io/zxzxz143/vympel-crm`

Every set uses the same full 40-character Git commit SHA. `latest` is never a release or deployment tag. An approved Git release tag may be added to the same digest only when that existing Git tag resolves to the exact published commit.

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
   npm ls next sharp
   npm audit --audit-level=high

   cd ../vympel_crm
   npm ls next sharp
   npm audit --audit-level=high
   ```

2. Push the publication changes normally and wait for Backend CI, Storefront CI, CRM CI, Full Release Gate, and the non-publishing Release Images run to pass on one exact commit.
3. Because `v1.0.0-rc.1` predates the sharp remediation, do not move it. Create a new annotated RC tag, such as `v1.0.0-rc.2`, on the exact verified commit and push the tag normally.
4. Wait for the tag-triggered Full Release Gate to pass.
5. Open **Actions → Release Images → Run workflow**, select the exact RC tag, set `publish_images=true`, and set `release_tag` to the same RC tag. Supply browser-visible build URLs appropriate for the image set. Placeholder or localhost URLs are acceptable only for a non-deployable registry/runtime rehearsal; rebuild for approved final origins before deployment.
6. Confirm that the workflow publishes, pulls, inspects, and health-checks all three SHA-tagged images, and that the consolidated `published-release-manifest-<sha>` artifact has real `sha256:` digests with no pending values.
7. Save the non-secret manifest as release evidence, for example `deployment/releases/v1.0.0-rc.2.yml`, without changing the immutable Git tag.

The workflow generates OCI source, revision, version, and title labels; BuildKit provenance and SBOM attestations; a signed GitHub provenance attestation; per-image metadata; and one consolidated digest manifest. It then pulls the exact SHA references and uses them in a namespaced local Compose rehearsal with disposable PostgreSQL, Redis, and MinIO data.

## Package visibility

Package visibility remains a manual decision. Do not change repository visibility and do not use an unsupported API workaround to change package visibility.

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
