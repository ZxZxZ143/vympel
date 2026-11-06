# 9306e04 staging deployment — 2026-11-06

**DEPLOYED ON GCP STAGING.** Storefront motion reuse and the footer 2GIS store link are live on
VM `3531996634123212598`. No rollback was needed. No migration, data or configuration change.

## Release

- `main` fast-forwarded `7d6462e..9306e04` (includes docs commit `218604b`).
- Push runs for `9306e04`: Storefront CI, Full Release Gate, Performance budgets, Release Images (push) — success.
- [Release Images 42220962441](https://github.com/ZxZxZ143/vympel/actions/runs/42220962441) (`workflow_dispatch`,
  `publish_images=true`, all other inputs default: API `https://api.vympel.kz/api/public`, site
  `https://preview.vympel.kz`, `staging`) — success. Index digests are in that run's metadata.
- Access: after explicit user approval the existing `google_compute_engine` key was re-registered in OS Login with
  `--ttl=1h` (expiry 2026-11-06T20:46:48Z); IAP tunnel on 127.0.0.1:22341 with the pinned host key
  `compute.3531996634123212598`. No IAM, firewall, metadata or DNS change. Tunnel and an SSH port forward
  (127.0.0.1:3401 → VM 127.0.0.1:3000) were closed at 20:05 UTC.

## Admission and recovery point

Before rollout: repo clean at `7d6462e`, `RELEASE_TAG=7d6462e`, seven healthy services, 92 migrations, lock clear,
94 media / 52 cms_media rows, 57 GB free.

Backup `/var/backups/vympel/releases/20261106-9306e04` (393 MB, 146 media keys, 1383 MinIO files); `pg_restore --list`
shows 55 table-data entries.

| File | SHA-256 |
| --- | --- |
| `staging.env` | `f8d7c90a5430d64ff7ccb0d3ac1dbdeba2af5e3228ea6c6cb4873f45dfa54099` |
| `compose.host-ports.yml` | `d9a86a9cb30606a0426ec1209b75a94a7cc660dea2c8b6c95d375a723ae664ce` |
| `compose.single-vm-staging.yml` (7d6462e) | `a034683165e04d0d30c416e4611e1b99d31767b3577fc74ae973e4c5ec87280c` |
| `postgres.dump` | `f5271024928e2c86e11e2df1bc0643e46e0233fb8790049b7e62d5d1257d2a83` |
| `media-keys.jsonl` | `abd8d6e574af82ebe577ce0e4cbcfa271f7c3d4b74fdc818592e2d58f6219ead` |
| `minio-data.tar` | `74adb15d306d7f0cea7414222edf728a0cd1936cb24b8201f94fa6d2ce285f25` |

## Rollout

Same operator sequence as `7d6462e` (scripts in ignored `.cache/deploy-9306e04/`): checkout `9306e04`,
`RELEASE_TAG` rewritten from the backed-up env, `compose pull`, then `up -d --no-deps --no-build --pull never --wait`
for backend, storefront, CRM with both Compose files. PostgreSQL, Redis, MinIO and the media gateway kept their
container IDs (`data_services_unchanged=true`). No infrastructure, deployment, Dockerfile or Liquibase file differs
between the two commits.

## Verification

- All seven services healthy; 92 migrations, lock clear; media/cms_media counts unchanged; zero backend `ERROR`
  lines in the first 10 minutes.
- From the VM (`127.0.0.1:3000`): `/ru`, `/en`, `/kz`, About, Brands, `/ru/brands/romanson`, delivery, guarantee,
  payment, catalog and `/ru/product/3` return 200 with `data-motion` markup; every page has two footer anchors to
  `https://2gis.kz/almaty/geo/70000001028382844` with `target="_blank" rel="noopener noreferrer"` and the RU/EN/KZ
  `footer.shopAria` labels.
- Headless Edge over the port forward (`staging-motion-verify.json`), 390/1440 px, motion and reduced motion: nothing
  hidden in the first viewport, zero targets hidden after scrolling, nothing hidden without JS, no horizontal overflow,
  catalog toolbar/grid and product gallery/actions outside motion roots, catalog page 2 still reveals lower sections.
  Browser console CORS errors come only from the test origin `127.0.0.1:3401` (the API allows the real site origin).

## Observations / follow-ups

- About at 1440 px: CLS 0.2534 at ~1.2 s, identical with reduced motion; source `div.about-page-content` pushed down
  when the CMS hero banner (`h-auto`, no reserved height) loads. Not caused by motion; banner markup unchanged.
- Home at 390 px: SplitText Philosophy line-mask shift 0.0398 (already noted locally).
- Storefront log: `Failed to update prerender cache for /ru ... mkdir '/app/.next/server/route-cache'` (ENOENT) once
  after start; runtime cache-directory issue of the image, not related to this change. Pages render 200.
- Orphan container `vympel-migrate-3977907` reported by Compose; left untouched.
- Public `https://preview.vympel.kz` answers 401 to unauthenticated requests (access gate), so public checks ran from
  the VM.

## Rollback

`7d6462e` images remain in GHCR. Restore `staging.env` from the backup directory, check out `7d6462e`, and recreate
backend, storefront and CRM with the same `--no-deps` sequence (the `rollback()` function in `deploy.sh`).
