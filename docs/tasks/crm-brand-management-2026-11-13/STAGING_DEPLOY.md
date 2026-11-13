# 052422c staging deployment — 2026-11-13

**DEPLOYED ON GCP STAGING.** CRM brand creation/deletion (with brand country) and the Alpine
musl/zlib image fix are live on VM `3531996634123212598`. No rollback was needed.

## Release

- `feature/crm-brand-create` fast-forwarded into `main`: `9306e04..795ae98` (feature + docs commit `0bce9cf`).
- Push CI on `795ae98` failed only on Trivy for CRM/storefront images: new fixed HIGH advisories
  CVE-2026-107891 (musl 1.2.6-r2) and CVE-2026-85091 (zlib 1.3.2-r0) in the pinned `node:22-alpine` base.
  Fixed in `052422c` by adding `musl musl-utils zlib` to the existing runtime `apk upgrade`.
- Push runs for `052422c`: CRM CI, Storefront CI, Full Release Gate, Performance budgets, Release Images (push) — success.
- [Release Images 43425307085](https://github.com/ZxZxZ143/vympel/actions/runs/43425307085) (`workflow_dispatch`,
  `publish_images=true`, all other inputs default) — success, amd64 + arm64 for all three images.
- Access: after explicit user approval the `google_compute_engine` key was registered in OS Login with `--ttl=1h`
  (`--project=vympel-staging` is required; expiry 2026-11-13T13:54:15Z). IAP tunnel on 127.0.0.1:22341 with the
  pinned host key; closed after verification. No IAM, firewall, metadata or DNS change.

## Admission and recovery point

Before rollout: repo clean at `9306e04`, `RELEASE_TAG=9306e04`, seven healthy services, 92 migrations, lock clear,
209 media / 52 cms_media rows, 55 GB free.

Backup `/var/backups/vympel/releases/20261113-052422c` (490 MB, 261 media keys, 2199 MinIO files).

| File | SHA-256 |
| --- | --- |
| `staging.env` | `a882b2eadacc37148242f4d6c92add9103f26c62bd288194ed1fd85fef169b8a` |
| `compose.host-ports.yml` | `d9a86a9cb30606a0426ec1209b75a94a7cc660dea2c8b6c95d375a723ae664ce` |
| `compose.single-vm-staging.yml` (9306e04) | `a034683165e04d0d30c416e4611e1b99d31767b3577fc74ae973e4c5ec87280c` |
| `postgres.dump` | `425ca4a05ec0035f793db837f0cfc16cbb4f6d6f69b67a972ff9f810219ef206` |
| `media-keys.jsonl` | `4f95a82d9e7574a63f1b28aaa654c3dedc3999cd93c0697061c52550795634f1` |
| `minio-data.tar` | `f7c9b3c3af9c789786f73e12ad2f837813e7faf3bf45e7bc3c24581e72f9b301` |

## Rollout

Scripts in ignored `.cache/deploy-052422c/`. Checkout `052422c`, `RELEASE_TAG` rewritten from the backed-up env,
`compose pull backend storefront crm`, then the finite migration `compose run --rm --no-deps migrate`
(log: `$B/migration.log`): `MigrationVerificationRunner` passed with `appliedChanges=93
latestChange=2026-11-13-01-crm-managed-brands`; lock clear; existing 6 brands / 6 mappings / 5 countries unchanged.

The first script stopped right after the migration because `docker compose run` consumed the rest of the script
that was piped through `ssh ... bash -s` (stdin). Applications were still healthy on `9306e04`. The second half
(`deploy-apps.sh`, every compose call with `< /dev/null`) recreated backend, storefront and CRM with
`up -d --no-deps --no-build --pull never --wait`. PostgreSQL, Redis, MinIO and the media gateway kept their
container IDs (`data_services_unchanged=true`).

## Verification (from the VM)

- All seven services healthy; backend readiness 200; zero backend `ERROR` lines after start.
- Storefront `/ru`, `/ru/catalog`, `/ru/brands/romanson` and CRM `/login`, `/products/new` return 200; catalog brand
  facets still list the existing brands.
- `POST /api/crm/brands` and `DELETE /api/crm/brands/1` without a token return 401 (endpoints deployed and protected).
- CRM image runs `musl-1.2.6-r3` and `zlib-1.4-r0`; CRM bundle contains the new brand UI strings.
- Not verified: an authenticated create/delete in the staging CRM (no credentials used); covered by real-PostgreSQL
  integration tests locally.

## Rollback

`9306e04` images remain in GHCR and are compatible with the new schema (the migration only relaxes constraints and
leaves rows untouched). Restore `staging.env` from the backup directory, check out `9306e04`, and recreate backend,
storefront and CRM with the same `--no-deps` sequence (`rollback()` in `deploy-apps.sh`). Liquibase is forward-only;
brands created after the deploy would survive an application rollback.
