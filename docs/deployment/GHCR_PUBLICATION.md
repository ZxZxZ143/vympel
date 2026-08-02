# GitHub Container Registry Publication

## Canonical packages

Vympel publishes three independent OCI indexes with `linux/amd64` and
`linux/arm64` application manifests:

- `ghcr.io/zxzxz143/vympel-backend`
- `ghcr.io/zxzxz143/vympel-storefront`
- `ghcr.io/zxzxz143/vympel-crm`

Every set uses the same full 40-character Git commit SHA. `latest` is never a release or deployment tag. An approved Git release tag may be added to the same digest only when that existing Git tag resolves to the exact published commit.

## Published release-candidate evidence

### RC.11 supported catalog-domain candidate

`v1.0.0-rc.11` is an annotated, immutable tag on exact source commit
`d6cc31e0ed7d9d1a08337f7fd2633ad8f461e3ff`. Trusted Release Images run
[30762647549](https://github.com/ZxZxZ143/vympel/actions/runs/30762647549)
passed the reusable source gate, registry non-overwrite preflight, six native
platform builds, final-index attestations, exact-image amd64 and ARM64 runtime
and migration rehearsals, bundle URL scans, and consolidated manifest
generation without a retry.

| Image | OCI index digest | linux/amd64 child | linux/arm64 child |
| --- | --- | --- | --- |
| Backend | `sha256:17420941c75a209c5cda98720d9063dd399a9d9f25f773ab518cc38d65a13c9c` | `sha256:b2ce99e9fecfddc8519e12f165f5d959c7cd8b5bce0fae0dcc4e37dad011b1a9` | `sha256:d8228ce10be216b3d3413a9d9a39323acfb44d93da1919549e60a77433d41087` |
| Storefront | `sha256:22ea0df8cb26338f538bedf574691ce3644730ac2b56b9862111e6acf94d6e55` | `sha256:64fd538287d3843f4dfe09cea02129c1c271e913ace4d0a60564e103ae30a1e5` | `sha256:9f331883a6aa6229c4f6f6184bd790a6b2027821409afcb5e5e574ebb1bf6b4b` |
| CRM | `sha256:838df2acd92e879ddd00a592e620d12403c798636d90cca89ff50b186e6b0e5c` | `sha256:2e9864605492795aa0129ffd6569d60be42e2a52b2005077ac62b60d0a69fa60` | `sha256:a4eefd66ed686b2dfeb13e3ca3f8082ffd3273f12cb01cf6cbb9c05d00151932` |

The digest-complete artifact
`published-release-manifest-d6cc31e0ed7d9d1a08337f7fd2633ad8f461e3ff`
is artifact ID `8838158146` with ZIP digest
`sha256:d0ec9205985a345c2239f958098638b9370785205f45a0160cf7e09b1a3767d2`
and is preserved at
`deployment/releases/v1.0.0-rc.11.yml`. Its registry-derived values and exact
RC.10 sslip staging public-build contract match independent registry/source
inspection. `database.expected_latest_change` was corrected from the
generator's stale `2026-07-19-02-update-public-image-paths-to-webp` value to
the tagged source's actual final changeset
`2026-08-02-01-supported-brand-country-domain`. Both RC/full-SHA tags resolve
to the same indexes, all three `latest` refs remain absent, RC.10's tag and
recorded image digests are unchanged, and no cloud deployment ran.

### RC.9 application update candidate

`v1.0.0-rc.9` is an annotated, immutable tag on exact source commit
`7167aa31618d6c090c8c5b04394c04ab03866dc4`. Trusted Release Images run
[30557528961](https://github.com/ZxZxZ143/vympel/actions/runs/30557528961)
passed the reusable source gate, six native platform builds, final-index
attestations, metadata, exact-image amd64 and ARM64 runtime rehearsals,
frontend bundle URL scans, and consolidated manifest generation. A single
failed-jobs rerun recovered the backend amd64 signing step after BuildKit
returned a transient `context canceled`; no duplicate dispatch or tag was
created.

| Image | OCI index digest | linux/amd64 child | linux/arm64 child |
| --- | --- | --- | --- |
| Backend | `sha256:fbc8bb2cc560ff11433e8e31b07d2c15878fe532db33f67ad1ee0d48c3eb05e5` | `sha256:43e221b9db04cab0f8145316c6a277d7a0a144f5bf9161b2094a158285aeeaba` | `sha256:6c3b2b0746829ed53356063f4f50283d48c8f33d21808b626542660bb7e6e00d` |
| Storefront | `sha256:6a2784e65525557ecc43bbe66a0b8d4cdc429b5f01a0a4948b4506e036debcaa` | `sha256:9644cc6ca2473d98ba503ea572c157deba25b083297bec00ac3bd4cd41e7092b` | `sha256:44fd6f392f7723955cf91bd5f5899b3718182d872f81c6833c49b0fb8a81ea1c` |
| CRM | `sha256:92f63711232821274c94992be4d757585b0b56dd5d41340b367fedb41d678f2f` | `sha256:cf6438b9edddeb59ff0825a05de65e91dff1522e70b8f37b67c36e9062f1fa60` | `sha256:f08302c38d4adb60dffadd559c54fe3b777f4ddaa89f0e31ee468f24bcfbf342` |

The digest-complete artifact
`published-release-manifest-7167aa31618d6c090c8c5b04394c04ab03866dc4`
is artifact ID `8766245749` with ZIP digest
`sha256:c37aaa1d61630f8b201cd9cfa627f0d6aa4b051260339a9c7e457eb0da4bc89d`.
The durable record is `deployment/releases/v1.0.0-rc.9.yml`; its registry and
public-build data match the artifact, while `database.expected_latest_change`
was corrected from the generator's stale RC.8 constant to the actual final
committed changeset `2026-07-30-02-update-contact-banner-media`. Independent
registry inspection confirmed matching RC/full-SHA indexes and correct
source/revision/version labels on both application platforms. No cloud
deployment ran.

### RC.8 temporary public GCP candidate

`v1.0.0-rc.8` is an annotated, immutable tag on exact source commit
`aadfabfd23a4196bc385ae41a0f3b8719172ffbc`. Trusted Release Images run
[30400324979](https://github.com/ZxZxZ143/vympel/actions/runs/30400324979)
passed the reusable source gate, six native platform builds, final-index
attestations, metadata, exact-image amd64 and ARM64 runtime rehearsals,
frontend bundle URL scans, and consolidated manifest generation.

| Image | OCI index digest | linux/amd64 child |
| --- | --- | --- |
| Backend | `sha256:47dcad868b3804fac91b58e23f5fdb6d2c914d39016bd5d0ca727672bb60a6d7` | `sha256:2dff06fc116f4472033f2e7e9af1a4bccb4dc08facc7a76fa07084a78539e69e` |
| Storefront | `sha256:42a6e04c243772efc98a021998338e25a1b532cccfb073db645768c3dd2db389` | `sha256:869c5e4c32bafd60a02f7473940e662f661086fe2df74775b95787f40023d453` |
| CRM | `sha256:7755917ba4ace3ab2602b2126ad6aeea88993e66b70702f6707008db6516aec6` | `sha256:78c2efb3b9187a02293e7757647c33705cfeba58b55e2dedcfe633bf788aa961` |

The digest-complete artifact
`published-release-manifest-aadfabfd23a4196bc385ae41a0f3b8719172ffbc`
is artifact ID `8704956171`, ZIP digest
`sha256:f5a4536ab7e7c89033ed76753f30499f61ef5feb6f0983a28973d81d823a6e6f`,
and is preserved exactly at `deployment/releases/v1.0.0-rc.8.yml`. It records
the approved `34.18.200.58.sslip.io` public build values, disabled telemetry,
and `placeholder_acknowledged: false`. Independent registry inspection
confirmed that the RC and full-SHA tags resolve to the same indexes. RC.7
retains its original digests. No cloud deployment ran.

### RC.2 amd64-only baseline

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
