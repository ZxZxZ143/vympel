# 9db9e85 staging deployment — 2026-11-14

**DEPLOYED ON GCP STAGING.** Public accessory product pages work again on VM `3531996634123212598`. No rollback was needed.

## Incident

- Every accessory product detail (`GET /api/public/product/{lang}/{id}`, category `ACCESSORIES`) returned 500
  `INTERNAL_ERROR`; watches returned 200. The storefront page itself answered 200 and rendered the
  "product unavailable" state; storefront logs only showed `ApiError ... status: 500`.
- Backend log: `LazyInitializationException: Could not initialize proxy [Material#9] - no session` in
  `AccessoryDetailService.materialDto` ← `getByProductIdOrNull` ← `ProductServiceImpl.getPublic`.
- Root cause: `open-in-view=false`, `getPublic` is not transactional and `getByProductIdOrNull` had no
  transaction, so LAZY material/color proxies were detached; `Optional.orElse(material.getCode())` touched the
  proxy even when a translation existed.

## Release

- Fix commit `9db9e85` (read-only transaction + `orElseGet`, Testcontainers regression test) pushed to `main`
  as a fast-forward of `45e2efb`. Backend-only change, no Liquibase changesets.
- Locally: regression test fails on the old code with the same exception; full backend suite 390 tests,
  0 failures, 2 skipped (JDK 17, Docker 29).
- Push runs on `9db9e85`: Backend CI, Full Release Gate, Performance budgets, Release Images (push) — success.
- [Release Images 43619481540](https://github.com/ZxZxZ143/vympel/actions/runs/43619481540) (`workflow_dispatch`,
  `publish_images=true`, other inputs default) — success, amd64 + arm64 for all three images.
- Access: with explicit user approval the `google_compute_engine` key was registered in OS Login with `--ttl=1h`
  (expiry 2026-11-14T17:46:55Z), first for read-only log diagnosis and then for this rollout. IAP tunnel on
  127.0.0.1:22341 with the pinned host key; closed after verification. No IAM, firewall, metadata or DNS change.

## Admission and recovery point

Before rollout: repo clean at `052422c`, `RELEASE_TAG=052422c`, seven healthy services, 93 migrations, lock clear,
327 media / 52 cms_media rows, 54 GB free.

Backup `/var/backups/vympel/releases/20261114-9db9e85` (606 MB, 379 media keys, 3056 MinIO files).

| File | SHA-256 |
| --- | --- |
| `staging.env` | `83a3a4d143d3a1ab5185e382f8b25e94a1820c6bef8b8fd719988cce485f54c6` |
| `compose.host-ports.yml` | `d9a86a9cb30606a0426ec1209b75a94a7cc660dea2c8b6c95d375a723ae664ce` |
| `compose.single-vm-staging.yml` (052422c) | `a034683165e04d0d30c416e4611e1b99d31767b3577fc74ae973e4c5ec87280c` |
| `postgres.dump` | `f4c4565f6636f6afbecbe644605528203e8c56655642985ea6f37ac5668742d1` |
| `media-keys.jsonl` | `1cf9907394e96e7da56c2f79b39526f5c5e186ad57158b1e7dfc29dbe29c1fa8` |
| `minio-data.tar` | `cf150b2fd84c4229a56f5aeb7ebd8bace1b1fadc70ecd3840757762bbef417d9` |

## Rollout

Scripts in ignored `.cache/deploy-9db9e85/`. The script refused to continue if infrastructure, Dockerfiles or
`db/` changed between `052422c` and `9db9e85` (empty diff). Checkout `9db9e85`, `RELEASE_TAG` rewritten from the
backed-up env, `compose pull backend storefront crm`, then `up -d --no-deps --no-build --pull never --wait` for
backend, storefront and CRM. No migration run (93 before and after). Every compose call used `< /dev/null`.
PostgreSQL, Redis, MinIO and the media gateway kept their container IDs (`data_services_unchanged=true`).
Compose warned about an orphan `vympel-migrate-3977907` container from an earlier finite migration; left untouched.

## Verification (from the VM)

- All seven services healthy; backend readiness 200; zero backend `ERROR` / `LazyInitializationException` lines after start.
- All 11 accessory products (239, 234, 233, 229, 227, 226, 225, 224, 109, 104, 74): API 200 and storefront
  `/ru/product/{id}` 200; page 234 renders `<title>Pierre Ricaud PR160.5 — Vympel</title>`.
- `accessoryDetails` resolves material and color names (e.g. 239: `Нержавеющая сталь`, `Розовое золото`).
- Watches 3 and 232 still 200; `/ru`, `/ru/catalog`, CRM `/login` 200; public `https://api.vympel.kz` returns 200 for 234 and 74.
- Not verified: an in-browser check behind the preview Basic Auth.

## Rollback

`052422c` images remain in GHCR. Restore `staging.env` from the backup directory, check out `052422c`, and recreate
backend, storefront and CRM with the same `--no-deps` sequence (`rollback()` in `deploy.sh`). No schema change.
