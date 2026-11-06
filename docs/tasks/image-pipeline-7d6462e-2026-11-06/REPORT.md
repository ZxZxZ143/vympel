# Responsive image pipeline release and full media conversion — 2026-11-06

**DEPLOYED AND CONVERTED ON GCP STAGING.** Every product image (94/94) and every
object-storage CMS image (32/32 convertible) now references a complete responsive-v1
WebP family. No rollback was needed.

## Release

- Commit `7d6462e706935342c87d25f7cb40ab412bbc9ebd` (parent `55576ffc`), fast-forwarded to `main`.
- [Release Images 42208169897](https://github.com/ZxZxZ143/vympel/actions/runs/42208169897): all gates,
  six native builds, three signed indexes, published amd64/ARM64 verification, manifest and
  `publication_result` succeeded. Indexes: backend `sha256:964d3624…`, storefront `sha256:1b642b44…`,
  CRM `sha256:395eae51…` (full digests in the workflow metadata/manifest).
- Access: the existing `google_compute_engine` key was registered in OS Login for 2 hours
  (expiry 2026-11-06 13:38 UTC) after explicit operator approval; IAP tunnel on 127.0.0.1:22337,
  pinned host key `compute.3531996634123212598`. No IAM/firewall/DNS change. Tunnel closed after use.

## Admission and recovery point

VM `3531996634123212598`, repo clean at `55576ffc`, `RELEASE_TAG=55576ffc`, seven healthy services,
92 migrations with clear lock, 142 media rows (10 responsive).

Backup `/var/backups/vympel/releases/20261106-7d6462e` (213 MB), taken without pausing services:

| File | SHA-256 |
| --- | --- |
| `staging.env` | `47f7c8e944f801152e511ae0723f4ede02d7e32549b089779118b272469dd6ad` |
| `compose.host-ports.yml` | `d9a86a9cb30606a0426ec1209b75a94a7cc660dea2c8b6c95d375a723ae664ce` |
| `compose.single-vm-staging.yml` (55576ffc) | `424298b07d5d5a69d9f5eb054bc2d2ef868ac0115fb140df51e632b1a496be09` |
| `postgres.dump` (55 tables with data) | `01baf1d66624c56f7407448213227cbef341c0616efd6851dd9da87a3fade771` |
| `media-keys.jsonl` (142 pre-conversion keys) | `74052e5518b01a9ac52b14afb2ccb309e2d2456ad37d6cde41145442a6bcba41` |
| `minio-data.tar` (454 files) | `0704637ad820fd41eb9a696b5ce7542eb8da50f03104ca7803d09fcfbd159b42` |

No isolated restore rehearsal or off-VM copy was made for this point (earlier verified backups
remain). `pg_restore --list` validated the dump.

## Rollout

Operator scripts are under `.cache/deploy-7d6462e/` (ignored). Only backend, storefront and CRM were
recreated with both Compose files, `--no-deps --no-build --pull never --wait`; PostgreSQL, Redis,
MinIO and the media gateway kept their container IDs. Backend runs cwebp 1.2.2 with
`VYMPEL_IMAGE_VARIANTS_DEFERRED_ENABLED=true` and the scheduled sweep off. Unauthenticated
`POST /api/crm/media/responsive-backfill` returns 401. Media keys were byte-identical to the
backup after deployment. Two backend ERROR lines after start, both unrelated: one fail-open Redis
rate-limit store failure at startup, and a 500 for a mistyped probe path `/api/public/products`
(pre-existing NoResourceFound mapping).

## Conversion

Run through the ADMIN endpoint from the operator's signed-in CRM tab (Claude in Chrome, refresh
cookie → bearer).

1. Dry run: PRODUCT 85 `WOULD_CONVERT` (119.8 MB originals), CMS 31 `WOULD_CONVERT` (28.8 MB),
   zero skips. The other 16 CMS rows are not object-storage/active candidates.
2. Single-row canary (media 11): family with the same UUID, `w160/w320/w374.webp` + original;
   public 200, `image/webp`, `public, max-age=31536000, immutable`; original size unchanged.
3. Full run 12:02:06–12:08:19 UTC, 9 calls: PRODUCT 84 + CMS 31 `CONVERTED`, no other status.
   63 create-only writes hit existing identical second-batch objects and were reused.
   Backend peaked ~82% CPU / ~880 MiB of 2 GiB; host available RAM ≥ 915 MiB; API latency
   0.25–0.47 s during the run.

## Independent audit

- 116 changed rows (85 media, 31 cms_media); every family has all expected derivatives and its
  original; every legacy key equals `<area>/<uuid>.<ext>` of its family and its object still exists.
- 92 migrations, lock clear, deletion outbox empty; signed revalidation `home` and `catalog`
  SUCCEEDED at 12:08:13/12:08:18 UTC.
- Storefront HTML (`/ru`, `/ru/catalog/WATCH_WRIST`, `/ru/product/3`, `/ru/product/46`): 58–139
  WebP family URLs, **zero** legacy product/CMS original URLs.
- Seven services healthy; disk 54 GB free.

## Not done / follow-ups

- No live test upload through CRM yet (would create a media row on a real product); upload-time
  and deferred conversion are covered by unit tests only.
- No matched browser performance BEFORE/AFTER matrix for this release.
- Legacy originals (~148.6 MB) are now unreferenced and retained; any cleanup needs a separate review.

## Restore of references (if ever needed)

For each converted row the legacy key is derivable from its family path and is also recorded in
`media-keys.jsonl`. Restoring means updating only `media.url` / `cms_media.object_key` back to those
keys (CAS on the current family key) and enqueueing CMS revalidation; no object deletion is needed.
Application rollback to `55576ffc` uses the captured `staging.env` and the same `--no-deps`
sequence as in `deploy.sh`.
