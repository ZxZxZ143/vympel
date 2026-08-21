# Google Compute Engine Single-VM Staging Runbook

## Status and deployment boundary

The checked-in GCP environment example remains a record of the previously
deployed sslip.io routing contract and its immutable image selector. The
release workflow is prepared to create a new SHA-only image set for
`preview.vympel.kz`, `api.vympel.kz`, and the protected CRM origin
`x7m2q9k4n6p8.vympel.kz`, but Google Cloud resource changes and external
deployment remain unauthorized:
do not edit the VM environment, create or change DNS, change Nginx/TLS, pull or
start containers, run migrations, or touch the production `vympel.kz` routing
without separate approval.

The recommended target is one `e2-standard-2` Compute Engine VM (2 vCPU, 8 GB)
running Ubuntu 24.04 LTS on `linux/amd64`. Use:

- `infrastructure/compose/compose.single-vm-staging.yml`
- `infrastructure/env/gcp-staging.env.example`
- `infrastructure/reverse-proxy/single-vm-staging.conf.template`

`v1.0.0-rc.7` remains immutable and evidence-only. `v1.0.0-rc.8` is the
deployable image candidate for this temporary public routing contract. It is
immutable at `aadfabfd23a4196bc385ae41a0f3b8719172ffbc`; all three OCI
indexes, their `linux/amd64` children, exact frontend bundle URL scans, amd64
and ARM64 runtime checks, and the digest-complete manifest passed in Release
Images run
[30400324979](https://github.com/ZxZxZ143/vympel/actions/runs/30400324979).
The exact registry and public-build record is
`deployment/releases/v1.0.0-rc.8.yml`. No Google Cloud resource or external
deployment was created.

## Preview-domain runtime changes required later

These are requirements for a separately authorized future deployment, not
commands to apply during image publication:

- Storefront public origin: `https://preview.vympel.kz`.
- Public API base: `https://api.vympel.kz/api/public`.
- Public media origin: `https://api.vympel.kz`; backend
  `VYMPEL_S3_PUBLIC_ENDPOINT` must become `https://api.vympel.kz/media`.
- Backend `VYMPEL_CORS_ALLOWED_ORIGINS` must allow exactly
  `https://preview.vympel.kz,https://x7m2q9k4n6p8.vympel.kz`; do not use `*`.
  `https://crm.34.18.200.58.sslip.io` may remain as a third origin only during
  a bounded rollback transition and must be removed after old CRM shutdown.
- CRM host: `x7m2q9k4n6p8.vympel.kz`. CRM frontend:
  `https://x7m2q9k4n6p8.vympel.kz`. CRM API:
  `https://x7m2q9k4n6p8.vympel.kz/api/crm`. Compile the CRM image with
  `NEXT_PUBLIC_CRM_API_BASE=https://x7m2q9k4n6p8.vympel.kz/api/crm`. Do not
  create or use `crm.vympel.kz`.
- The public `api.vympel.kz` ingress must not expose `/api/crm`; it remains
  limited to the approved `/api/public/*` and `/media/*` surfaces.
- Basic Auth is an ingress-only control. Protect the CRM UI and the exact auth
  endpoints `/api/crm/auth/login`, `/api/crm/auth/refresh`, and
  `/api/crm/auth/logout`. Set `auth_basic off` for all other `/api/crm/*`
  routes so their `Authorization: Bearer ...` header is not consumed by
  Nginx. Keep all Basic Auth credentials and hashes only on the VM.
- Keep backend-to-storefront CMS revalidation on the internal Compose URL
  `http://storefront:3000/api/revalidate`. Do not route signed webhook delivery
  out through the public preview hostname.
- Keep `SITE_INDEXING_ENABLED=false`. The preview hostname is not a production
  canonical-domain approval and must remain globally `noindex, nofollow` with
  no advertised/indexable sitemap.

The repository template is deliberately not repinned to an unpublished SHA or
mixed with these future runtime values. After publication, an authorized
deployment task must copy the digest-complete manifest values into the external
VM environment as one atomic change and perform the separate Nginx/DNS/TLS
review.

## Architecture and ports

```text
Internet :80/:443
  -> Google Cloud VPC firewall
  -> host Nginx
       storefront domain -> 127.0.0.1:3000 -> storefront
       protected CRM /   -> 127.0.0.1:3001 -> CRM
       protected CRM /api/crm/* -> 127.0.0.1:8080 -> backend
       API /api/public/* -> 127.0.0.1:8080 -> backend
       API /media/       -> 127.0.0.1:9002 -> read-only media gateway -> minio:9000

Private Docker networks
  backend/migrate -> postgres:5432
  backend/migrate -> redis:6379
  backend/migrate -> minio:9000
```

PostgreSQL, Redis, MinIO API/console, and Actuator are not public. Ports 3000,
3001, 8080, and the read-only media gateway on 9002 bind only to `127.0.0.1`.
Only host Nginx listens publicly on 80/443.

## 1. Manual Google Cloud preparation

Choose the project, region, zone, custom VPC/subnet if required, operator SSH
CIDR, boot-disk size, final domains, backup destination, and alert owner first.
The commands below are examples for an authorized operator and are intentionally
not executed by repository preparation.

```bash
gcloud config set project PROJECT_ID
gcloud compute addresses create vympel-staging-ip --region=REGION
STATIC_IP="$(gcloud compute addresses describe vympel-staging-ip \
  --region=REGION --format='value(address)')"

gcloud compute firewall-rules create vympel-staging-web \
  --network=VPC_NAME \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:80,tcp:443 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=vympel-staging

gcloud compute firewall-rules create vympel-staging-ssh \
  --network=VPC_NAME \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:22 \
  --source-ranges=OPERATOR_PUBLIC_CIDR \
  --target-tags=vympel-staging

gcloud compute instances create vympel-staging \
  --zone=ZONE \
  --machine-type=e2-standard-2 \
  --image-project=ubuntu-os-cloud \
  --image-family=ubuntu-2404-lts-amd64 \
  --boot-disk-type=pd-balanced \
  --boot-disk-size=100GB \
  --address="$STATIC_IP" \
  --tags=vympel-staging
```

Do not create VPC ingress for 3000, 3001, 5432, 6379, 8080, 9000, 9001, or
9002. Prefer OS Login/IAP or tightly scoped key-based SSH according to project
policy. Enable deletion protection, labels, VM Manager, snapshots, and alerting
only after the owner approves those policies.

## 2. Bootstrap Ubuntu and Docker

After verifying the SSH host key:

```bash
uname -m
lsb_release -a
sudo apt update
sudo apt full-upgrade -y
sudo apt install -y ca-certificates curl git gettext-base jq nginx openssl snapd
sudo timedatectl set-timezone UTC
```

`uname -m` must return `x86_64`. Install Docker Engine and the Compose plugin
from Docker's official Ubuntu apt repository, not the convenience script:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker nginx
sudo docker version
sudo docker compose version
```

Keep using `sudo docker` unless policy explicitly accepts the root-equivalent
`docker` group. A small encrypted-disk swap file may be used as an emergency
cushion, but it is not additional application capacity.

## 3. Checkout and GHCR access

```bash
sudo install -d -m 0755 /opt/vympel
sudo git clone https://github.com/ZxZxZ143/vympel.git /opt/vympel
cd /opt/vympel
sudo git fetch --tags --prune
sudo git checkout --detach EXACT_REVIEWED_DEPLOYMENT_COMMIT
sudo git status --short
```

The status must be empty. Public GHCR packages need no login. If package
visibility is private, use a dedicated token with only `read:packages`:

```bash
read -rsp 'GHCR read-only token: ' GHCR_READ_TOKEN
printf '%s' "$GHCR_READ_TOKEN" |
  sudo docker login ghcr.io --username PACKAGE_READER --password-stdin
unset GHCR_READ_TOKEN
```

Never put the token in Git, Compose, systemd, shell history, or the staging env.

## 4. Create the staging environment

```bash
sudo install -d -m 0700 /etc/vympel
sudo cp infrastructure/env/gcp-staging.env.example \
  /etc/vympel/gcp-staging.env
sudo chmod 0600 /etc/vympel/gcp-staging.env
sudoedit /etc/vympel/gcp-staging.env
```

Replace every `REPLACE_ME` value. The checked-in sslip.io routing values match
the preserved prior staging contract only; they are not the preview-domain
promotion instructions above. Use the exact release
SHA and public values recorded by the selected digest-complete manifest:

| Variable class | Variables | Rule |
| --- | --- | --- |
| Image selection | `REGISTRY`, `RELEASE_TAG` | Runtime; select an immutable published image set. |
| Build-time public | `NEXT_PUBLIC_BASE_API_PUBLIC`, `NEXT_PUBLIC_CRM_API_BASE`, `NEXT_PUBLIC_MEDIA_ORIGINS`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_APP_RELEASE`, `NEXT_PUBLIC_TELEMETRY_ENABLED` | Non-secret and compiled into frontend output; runtime values must match the manifest exactly. |
| Runtime public routing | `STOREFRONT_DOMAIN`, `CRM_DOMAIN`, `API_DOMAIN`, `VYMPEL_CORS_ALLOWED_ORIGINS`, `VYMPEL_S3_PUBLIC_ENDPOINT` | Real HTTPS origins used by Nginx/backend. |
| Runtime internal | `VYMPEL_DB_URL`, `VYMPEL_REDIS_URL` | Must use `postgres` and `redis` service names; Compose fixes MinIO and CMS revalidation to `minio` and `storefront`. |
| Runtime secrets | database/Redis/MinIO credentials, JWT/rate-limit/CMS secrets, optional bootstrap password | Server-only; never `NEXT_PUBLIC_*` and never image build arguments. |

Keep `PUBLIC_BUILD_PLACEHOLDERS_ACKNOWLEDGED=false`. The Redis password in
`VYMPEL_REDIS_URL` must equal `VYMPEL_REDIS_PASSWORD`.

## 5. Validate before startup

```bash
cd /opt/vympel
COMPOSE_FILE=infrastructure/compose/compose.single-vm-staging.yml
ENV_FILE=/etc/vympel/gcp-staging.env

sudo sh deployment/scripts/verify-single-vm-staging.sh \
  "$COMPOSE_FILE" "$ENV_FILE"

RELEASE_TAG="$(sudo sed -n 's/^RELEASE_TAG=//p' "$ENV_FILE")"
for image in vympel-backend vympel-storefront vympel-crm; do
  sudo docker buildx imagetools inspect \
    "ghcr.io/zxzxz143/${image}:${RELEASE_TAG}"
done

sudo sh deployment/scripts/check-liquibase-history.sh "$ENV_FILE"
sudo docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull
```

Require exactly one `linux/amd64` child in each OCI index and compare all three
index/child digests with the published release manifest. Stop if the frontend
contract contains placeholders, localhost/loopback URLs, or differs from the
real environment. If the Liquibase history check requests accountable
acceptance, stop and follow `LIQUIBASE_HISTORY_RECONCILIATION.md`.

## 6. Install host Nginx

The checked-in HTTP-first template records the older three-upstream routing
shape and must not be installed unchanged for the protected CRM origin. In a
separately authorized VM/Nginx task, preserve the existing forwarding,
timeouts, upload limits, request IDs, and Actuator denial while applying these
location boundaries on `x7m2q9k4n6p8.vympel.kz`:

- `/` -> Basic Auth -> `127.0.0.1:3001` CRM frontend.
- Exact `/api/crm/auth/login`, `/api/crm/auth/refresh`, and
  `/api/crm/auth/logout` -> Basic Auth -> `127.0.0.1:8080` backend.
- Remaining `/api/crm/*` -> `auth_basic off` -> `127.0.0.1:8080` backend,
  preserving the browser Bearer `Authorization` header.
- `api.vympel.kz/api/crm` and `api.vympel.kz/api/crm/*` -> unavailable (404).
- `/actuator`, Swagger/OpenAPI, MinIO API, and MinIO console remain
  unavailable on the CRM and public API hosts.

Do not store the Basic Auth password or htpasswd contents in the repository,
release manifest, image metadata, or build arguments.

For the preserved sslip rollback topology only, the existing template renders
the three domain placeholders as follows. Do not use this command to replace
the protected-origin location design described above:

```bash
. /etc/vympel/gcp-staging.env
sudo env \
  STOREFRONT_DOMAIN="$STOREFRONT_DOMAIN" \
  CRM_DOMAIN="$CRM_DOMAIN" \
  API_DOMAIN="$API_DOMAIN" \
  envsubst '$STOREFRONT_DOMAIN $CRM_DOMAIN $API_DOMAIN' \
  < /opt/vympel/infrastructure/reverse-proxy/single-vm-staging.conf.template \
  | sudo tee /etc/nginx/sites-available/vympel-staging >/dev/null
sudo ln -s /etc/nginx/sites-available/vympel-staging \
  /etc/nginx/sites-enabled/vympel-staging
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

The template blocks `/actuator` and `/actuator/*`; MinIO API/console remain
private. Review the rendered file before reloading.

## 7. Start and verify the finite migration

```bash
cd /opt/vympel
COMPOSE_FILE=infrastructure/compose/compose.single-vm-staging.yml
ENV_FILE=/etc/vympel/gcp-staging.env
sudo docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" \
  up -d --no-build --remove-orphans --wait --wait-timeout 600

sudo docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -a
sudo docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" \
  logs --no-color --tail 200 migrate

curl --fail http://127.0.0.1:8080/actuator/health/readiness
curl --fail http://127.0.0.1:3000/ru
curl --fail http://127.0.0.1:3001/login
sudo ss -lntp
```

Require `migrate` to exit 0, all long-running services healthy, only Nginx on
public `:80/:443`, and application listeners only on loopback. Never run
`down --volumes`.

## 8. Static IP, DNS, and HTTPS

The VM must retain the reserved regional static IPv4 address. Create the three
DNS A records only after the owner approves the real domains, then verify them
from outside Google Cloud. When HTTP routing is correct:

```bash
. /etc/vympel/gcp-staging.env
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx \
  -d "$STOREFRONT_DOMAIN" -d "$CRM_DOMAIN" -d "$API_DOMAIN"
sudo nginx -t
sudo certbot renew --dry-run
```

Verify storefront `/ru`, CRM `/login`, API `/api/public/ping`, media reads, CORS,
cookies, and that public `/actuator` returns 404.

## 9. One-time ADMIN bootstrap

1. Set `VYMPEL_BOOTSTRAP_ADMIN_ENABLED=true` and temporary email/password/name
   only in `/etc/vympel/gcp-staging.env`.
2. Recreate backend and wait for health.
3. Verify exactly one ADMIN can log in.
4. Immediately set the flag false and clear the temporary password.
5. Recreate backend again and rotate the account password through the app.

Never retain the bootstrap password in logs, backups, shell history, or Git.

## 10. Update and rollback

Before every update, create verified PostgreSQL and MinIO backups. Change only
to a digest-recorded immutable release whose public contract matches the same
domains, then repeat manifest, Liquibase, pull, startup, and smoke checks:

```bash
cd /opt/vympel
COMPOSE_FILE=infrastructure/compose/compose.single-vm-staging.yml
ENV_FILE=/etc/vympel/gcp-staging.env
sudoedit /etc/vympel/gcp-staging.env
sudo docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull
sudo docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" \
  up -d --no-build --remove-orphans --wait --wait-timeout 600
```

Application rollback selects the prior verified image set and repeats the same
command. Liquibase is forward-fix-only; never move a release tag, force-push,
edit an applied changeset, delete named volumes, or treat application rollback
as database rollback.

## Memory budget

Long-running limits total 5,440 MiB:

| Service | Limit |
| --- | ---: |
| PostgreSQL | 1,536 MiB |
| Redis | 256 MiB |
| MinIO | 512 MiB |
| Backend | 2,048 MiB |
| Storefront | 512 MiB |
| CRM | 512 MiB |
| Media gateway | 64 MiB |

This leaves 2,752 MiB of an 8 GiB VM for Ubuntu, Docker, host Nginx, filesystem
cache, and operational headroom. The finite migration job is limited to 1,536
MiB and runs before backend/storefront/CRM. `MaxRAMPercentage=60` caps the
backend heap at an estimated 1.20 GiB inside its 2,048 MiB limit, leaving about
819 MiB for native JVM overhead. The same published Temurin 17 image reports an
estimated 891.31 MiB heap under the 1,536 MiB migration limit.

## Manual work remaining

- Approve Google Cloud project/region/zone, VPC/subnet, billing, IAM/OS Login,
  SSH source, static IP, VM, disk, deletion protection, and firewall rules.
- Treat the SHA in `infrastructure/env/gcp-staging.env.example` as historical
  sslip.io state. A future authorized preview deployment must replace it and
  every compiled/runtime public value from the new digest-complete SHA
  manifest in one reviewed operation; never mix the old image with new origins.
- Retain the old sslip CRM host only for a bounded rollback window. After the
  new CRM UI, login/refresh/logout, Bearer API calls, and cookie rotation are
  verified, remove the old CRM origin from CORS, disable its Nginx route, and
  retire its DNS/TLS only in a separately authorized cleanup task.
- Generate/store real secrets outside Git and decide backup/restore retention.
- Create the VM, DNS, Nginx/Certbot configuration, monitoring, and alerts.
- Perform the first authorized deployment, ADMIN bootstrap, external smoke
  tests, backup, and isolated restore rehearsal.
