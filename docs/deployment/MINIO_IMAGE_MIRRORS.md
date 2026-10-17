# MinIO image recovery mirrors

Date: 2026-10-17. These are support images used by isolated release rehearsals and the existing Compose definitions. No running server, storage configuration or data was changed.

## Reason and approval

The existing Docker Hub and Quay repositories rejected anonymous pulls, and Full Release Gate run 39038713180 failed its unchanged support-image availability check. The user explicitly authorized copying the verified cached images to their GHCR namespace. GitHub CLI received the required write:packages scope through user-approved device authentication; credentials are not included in this repository.

## Source and content verification

Original MinIO Server index: sha256:14cea493d9a34af32f524e538b8346cf79f3321eff8e708c1e2960462bd8936e (RELEASE.2025-09-07T16-13-09Z).
Original Client index: sha256:a7fe349ef4bd8521fb8497f55c6042871b2ae640607cf99d9bede5e9bdf11727 (RELEASE.2025-08-13T08-35-41Z).

Before upload, the exported local OCI archive was checked against these previously committed index hashes. Every available amd64/arm64 child manifest, config and compressed layer was checked for both SHA-256 and descriptor size. Uploaded child manifests retain exactly these hashes:

| Image | Platform | Unchanged child digest |
| --- | --- | --- |
| Server | linux/amd64 | sha256:a1a8bd4ac40ad7881a245bab97323e18f971e4d4cba2c2007ec1bedd21cbaba2 |
| Server | linux/arm64 | sha256:9966a92a734f9411e32f4f41d7d9d826fcdc0f68c4e20b70295bd4e7c11f8a2f |
| Client | linux/amd64 | sha256:eb4ea9884b77704230e2423e9004d2fa738dc272876b9cc41a297d29443b8780 |
| Client | linux/arm64 | sha256:37d109dddbbb2c95873f5fc81ac93f37023264770fc580a7564148892087b1b7 |

Both platform binaries reported their expected release versions. The original indexes also described ppc64le, whose blobs were absent locally and which Vympel does not require. New two-platform indexes therefore have different digests; their underlying amd64/arm64 images are byte-identical to the approved originals.

## Immutable consumption

- Server: ghcr.io/zxzxz143/vympel-minio@sha256:fef3b9cf8ce1bcb83cd30b9a41273c8585855c0a269fa97cf297c6615745b969
- Client: ghcr.io/zxzxz143/vympel-minio-client@sha256:b13adbe0366ec9311957246a2303d69f561f224e58a6eed6687e25db27791bc5

The recovery packages were confirmed absent before their first upload. Source-index-derived immutable tags identify the copies and platform children; no latest alias was created. Compose and the release gate consume exact index digests. Keep the existing cold manifest/platform availability gate and isolated runtime rehearsals. Future replacement requires a new reviewed digest, not overwriting these artifacts.

The public-read package setting is required for the existing credential-free support-image checks. Validate anonymous manifest access and both platforms before treating recovery as complete.

## Upstream source and license

The unchanged binaries carry GNU AGPLv3 and MinIO notices. Corresponding source: [Server commit 07c3a429](https://github.com/minio/minio/tree/07c3a429bfed433e49018cb0f78a52145d4bedeb), [Client commit 7394ce0d](https://github.com/minio/mc/tree/7394ce0dd2a80935aded936b09fa12cbb3cb8096). Original notices and licenses remain inside the unchanged image layers. These mirrors recover availability of the approved versions; they do not imply upstream maintenance or a new security update.
