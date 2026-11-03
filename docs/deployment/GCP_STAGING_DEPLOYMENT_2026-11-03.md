# GCP staging deployment — 2026-11-03

Status: **STAGING DEPLOYMENT PASSED**. Final rollout passed at
2026-11-03 09:27:41 UTC; independent final audit/public checks passed at
09:28:09–09:28:13 UTC. Active release:
`d8e661620a330431dc8bfd94ae06e5ef95c58f89`.

## Scope and target

This was an explicitly authorized staging image deployment. Production, DNS,
TLS, cloud networking and the retired load-test environment were not changed.
The separately approved access repair set `enable-oslogin=TRUE` on this VM
only and registered the operator's public key with a two-hour expiry. No IAM
role, project-wide login policy or cloud resource was created.

| Field | Verified value |
| --- | --- |
| Project / zone | `vympel-staging` / `me-central1-b` |
| VM / immutable ID | `vympel-staging` / `3531996634123212598` |
| Address | `34.18.200.58` (private `10.212.0.2`) |
| OS / architecture | Ubuntu 24.04.4 LTS / `linux/amd64` |
| Actual machine / disk | `e2-medium`, 3,908 MiB RAM, 2,047 MiB swap, 80 GB disk |
| Initial headroom | 2,493 MiB available RAM; 61 GB free filesystem space |
| Docker / Compose | 29.6.2 / v5.3.1 |
| Previous source and active release | `83af6ad8a8d8c5ef3569d0592b5e9e324e59f688` |
| Requested release | `d8e661620a330431dc8bfd94ae06e5ef95c58f89` |

The installed project is `vympel-gcp-staging`, using
`/opt/vympel/repository/infrastructure/compose/compose.single-vm-staging.yml`,
`/etc/vympel/compose.host-ports.yml`, and `/etc/vympel/staging.env`.
The checkout was clean. Its actual 4 GB host differs from the runbook's 8 GB
reference machine; services were started in bounded phases and limits were
preserved. No infrastructure service was recreated.

## Immutable image evidence

[Release Images run 40913646976](https://github.com/ZxZxZ143/vympel/actions/runs/40913646976)
passed the publication gate, all six native image builds, final-index
attestations, metadata, both architecture runtime jobs and manifest generation.
The non-publishing `build` job was intentionally skipped.

Artifact `12915598089`,
`published-release-manifest-d8e661620a330431dc8bfd94ae06e5ef95c58f89`, was
downloaded afresh. Its ZIP SHA-256 was
`f5563e927add008f7706f84e21ece88d952a8b1faabf958a511ac206c62122e2`.
The extracted file matched the locally preserved publication manifest exactly.
Anonymous GHCR reads independently hashed the indexes, amd64 children and
configuration blobs and verified source/revision labels and non-root users.
Pull verification repeated digest, architecture and label checks on the VM.

| Application | Approved OCI index digest | Previous OCI index digest |
| --- | --- | --- |
| Backend | `sha256:bf1f2eb3e6c7c11d271d3e82a0820ef876e63ed991d716b7f017a5677546cc12` | `sha256:1aac61a71db84c02d39a48613b80972fafc95163d4ee7ef4f1adf4cb91cfe27c` |
| Storefront | `sha256:7550e7cca797199ceeb02d9e6243e17d2fead3b3ae3fc80d3986b063552aa509` | `sha256:97c2a03827413260109ba08131bf334f0a99869fce1e981dd7a1bec30b1cb711` |
| CRM | `sha256:b6b4f7b619bf9d347c2490e0933e07ebca82085b55f1990568456a6470184a16` | `sha256:3853b9ca516516b9158ddc7e860c5cfa080c171153966bc1e7f578c216465687` |

All new tags are the same full requested SHA. None is from incomplete
`c84a28b`; no mutable tag was used. The exact frontend contract matches the
existing routes: `https://preview.vympel.kz`,
`https://api.vympel.kz/api/public`, media at `https://api.vympel.kz`, and
`https://x7m2q9k4n6p8.vympel.kz/api/crm`. Staging, release metadata, disabled
telemetry and explicit noindex remain consistent with the publication evidence.

## Backup and recovery admission

Root-only recovery material is retained on the VM at
`/var/backups/vympel/releases/20261103-d8e6616` (directory mode 0700, private
files 0600). It contains the exact previous env, Compose override, Nginx and
certificate configuration, rendered Compose/container snapshots, PostgreSQL
custom dump, full MinIO data/metadata archive, checksums and restore evidence.

The first live MinIO copy was rejected because background files changed while
copying. Backend and MinIO were then paused together for **2.59 seconds**,
08:02:30.632–08:02:33.219 UTC, to capture a consistent database/media copy;
both were unpaused in a guaranteed cleanup path. The rejected archive is retained
and is not the admitted backup.

| Verified backup | SHA-256 |
| --- | --- |
| `postgres.dump` | `d49ce4216ad4cde5121b4d6ca311c80b5636710d6b6f607f2663d59977323c69` |
| `minio-data.tar.gz` | `5cbf3ff01060049e241d41a948fbdbc45eb444aa7c6fde23bf89a17289c46180` |
| `configuration.tar.gz` | `9fce2fe5a529b81ffcc1404c7bc73c9b72f31bdfca844c5292e4e058f1063344` |

The isolated recovery project `vympel-recovery-d8e6616-20261103` used separate
bind-mounted scratch data, an internal network, no published ports, cached
exact previous images and bounded resources. PostgreSQL restored successfully:
66 products, 94 media records, 20 CMS blocks, three users, 92 changesets and
zero unvalidated constraints. All 269 copied MinIO files matched their hashes.
The restored backend reached readiness, returned a catalog with 63 public
products and a product detail, and read three restored media objects whose
bytes matched live storage. Recovery containers were stopped afterward; their
scratch data was retained. No live volume was deleted or detached.

An encrypted off-VM copy is retained locally at
`E:/vympel_full/.cache/staging-d8e6616-20261103/recovery-bundle.p7m`
(166,953,532 bytes; SHA-256
`7697cdbe7ccc8dbb38a21827b46f9fac32ad26fbe291dde7660cbd3bf60ef9f2`).
It uses CMS envelope encryption with AES-256-CBC and a task-specific RSA key.
`backup-key.dpapi` protects the private key with Windows CurrentUser DPAPI;
retain it and `backup-certificate.pem` with the encrypted bundle. Streaming
decryption verified the original tar SHA-256
`d96b5f6b591d1fc264d65ae7071f1d7836fcdac9151116e5cc8a97d704845fdf`.
No plaintext recovery archive or permanent plaintext key was written locally.
This is a verified deployment recovery copy, not a new automated backup/PITR policy.

## Database and controlled rollout

`validate-environment.sh`, `backup-check.sh` and
`check-liquibase-history.sh` passed against release-specific admission evidence.
The history gate used a narrow `psql` adapter into the existing PostgreSQL
container so its private service hostname remained private. The unreconciled
historical accessory changeset was absent. No acceptance record or checksum
was fabricated or changed.

The deployed and new migration sources are identical. All 92 live identities
belong to the new packaged graph; the latest is
`2026-10-17-01-product-discounts` by `codex`, checksum
`9:8a962d140c89812d9eab486f1db2988e`. The database lock was clear.

The candidate preserved every credential and changed only `RELEASE_TAG` and
`NEXT_PUBLIC_APP_RELEASE`. Full rendered Compose comparison proved ports,
networks, volumes, limits and all other values unchanged. Gate-only evidence
and TLS-path variables stayed in a separate admission file. Pulls did not
recreate containers. The finite migration uses both installed Compose files,
`run --rm --no-deps migrate`, and the exact new backend image; applications use
`up --no-build --no-deps --pull never --wait` in backend/frontends phases.
Generic `deploy.sh` is unsuitable unchanged because this host uses host Nginx
and a second Compose file; the existing migration helper would also start
dependencies without `--no-deps`.

Rollback retains the prior image set and env and changes application containers
only. Database rollback, volume deletion, rebuilds and load tests were not used.

## Rollback history and verifier corrections

The first migration exited successfully. All new applications became healthy;
nine localized pages, 26 JavaScript chunks, three optimized images and preview
indexing passed. The subsequent Nginx equality assertion was defective: it
combined `nginx -T` stdout with stderr syntax diagnostics, while its baseline
contained stdout only. Actual configuration bytes were unchanged (SHA-256
`523969d73cd332aa6fb81692dc44c14a853c42a5e9d71ec70d53a149582422f9`).
Authentication and CORS responses independently matched expectations.

Automatic application rollback completed at **09:08:12.870 UTC** and the old
release was verified healthy. First-attempt logs/results were preserved under
the VM recovery directory's `attempt1/`. The comparator was corrected to check
Nginx exit status and compare configuration stdout separately; no security,
health or integrity gate was removed. The same approved release was retried.

The second attempt passed migration, internal and external HTTP smoke, image
identity, healthy/OOM state, persistent-container identity, mount/port/resource
comparisons and the corrected Nginx check. It then rolled back because a second
verifier defect matched `OutOfMemoryError` inside the ordinary JVM startup
option `-XX:+ExitOnOutOfMemoryError`. There was **no OOM exception**, container
OOM kill, startup failure, checksum conflict or connection-pool error in the
saved backend log. The traceback identifies the log assertion, not Nginx, as
the second failure. Rollback completed at **09:17:08.716 UTC**, restoring all
three previous images and their healthy application endpoints.

Second-attempt logs are retained under `attempt2/`. The corrected detector uses
word boundaries around the exception name. Before another rollout it was
checked against the actual failed-attempt log, the normal JVM option and seven
real error examples; all passed. The two rollbacks were caused by task-specific
verification errors, not a demonstrated release defect. Both increased staging
interruption and are retained in this record rather than omitted from the final
outcome. No security or runtime-health requirement was relaxed.

## Final verification

All three active application image IDs equal the approved OCI indexes in the
table above, and all three configured tags are the full `d8e6616` release SHA.
The VM checkout is that exact SHA and is clean. The active environment is
byte-identical to the reviewed candidate.

| Check | Result |
| --- | --- |
| Finite migration | Exit 0; 0 run, 92 previously run, 92 total |
| Database history | Original IDs, authors, filenames, checksums, execution types and order unchanged; lock clear |
| Data counts | 66 products and 94 media records, unchanged |
| Backend | Healthy, readiness `UP`, no startup/checksum/pool/OOM error signatures |
| Storefront | Healthy; home/catalog/product pages in RU/EN/KZ all 200 |
| Frontend assets | 26 referenced JavaScript chunks and three optimized images all 200 |
| Preview indexing | Repository indexing script passed; noindex/nofollow in pages and public response headers |
| CRM | Healthy; internal login page 200; external UI/auth paths retain Basic Auth 401 |
| CRM Bearer routing | Invalid Bearer request reaches Spring JSON 401 with no Basic challenge; Nginx route/forwarding unchanged |
| Public API | Ping 200; private CRM, actuator and Swagger paths 404 |
| CORS | Preview origin returned exactly; no wildcard introduced |
| DNS/TLS | All three approved domains resolve to `34.18.200.58`; HTTPS certificate verification passed, no unexpected redirects |
| Persistent services | PostgreSQL, Redis, MinIO and media gateway healthy; original container IDs unchanged throughout |
| Redis | Authenticated `PING` returned `PONG` |
| Mounts/limits/ports | Compared against the original pre-deployment snapshot and unchanged; no container OOM |
| Capacity | 2,336 MiB available RAM, 85 MiB swap used, approximately 60 GB free disk at final audit |

The preserved named volumes are `vympel-gcp-staging_postgres-data`,
`vympel-gcp-staging_redis-data`, `vympel-gcp-staging_minio-data`, and
`vympel-gcp-staging_backend-logs`. Data-service ports remain unpublished;
application/media bindings remain loopback-only (8080, 3000, 3001, 9002).
Existing public Nginx/TLS and cloud firewall configuration were unchanged.

A browser smoke could not run: the computer-use runtime failed to start
because its Windows launcher reached a locked BitLocker drive, and the existing
frontend tooling did not provide Playwright. Bounded HTTP checks ran through
loopback on the VM and public HTTPS from both VM and operator workstation.
No browser rendering/hydration or authenticated CRM session is claimed.
No load/stress test ran. No application source changes were needed.

## Interruption windows and retained diagnostics

This single-VM update was not zero-downtime. A backup pause lasted 2.59 seconds.
The following are observed application recreation-to-health windows; they
bound potential service interruption, not continuously measured outage totals.
The two verifier-triggered rollbacks added avoidable restart windows.

| Operation | UTC start | All applications healthy / rollback verified |
| --- | --- | --- |
| First application rollout | 09:02:31.484 | 09:05:07.847 |
| First rollback | 09:05:36.262 | 09:08:12.870 |
| Second application rollout | 09:11:39.826 | 09:14:07.260 |
| Second rollback | 09:14:32.682 | 09:17:08.716 |
| Final application rollout | 09:24:37.055 | 09:27:13.134 |

The final attempt required no rollback; two earlier attempts did. Previous
images and verified recovery material remain available. No schema reversal,
volume deletion, infrastructure recreation or production change occurred.
The separately approved VM-only OS Login setting remains enabled; the
registered public key has its requested two-hour expiry.

Sanitized evidence is in [`docs/tasks/gcp-staging-d8e6616`](../tasks/gcp-staging-d8e6616/README.md).
Private operational logs remain under the root-only VM recovery directory:
`migration.log`, `backend-start.log`, `frontends-start.log`,
`backend-runtime.private.log`, `preview-indexing.log`, `rollout-events.json`,
`rollout-result.json`, `final-audit.json`, and archived `attempt1/` / `attempt2/`.
Credentials, raw rendered configuration, private keys, recovery archives and
unfiltered logs are excluded from Git. The publication manifest is preserved
unchanged: its `deployment_performed: false` describes publication time, while
this record and final audit describe the subsequently completed deployment.
