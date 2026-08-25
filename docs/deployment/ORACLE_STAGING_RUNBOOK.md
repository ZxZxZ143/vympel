# Oracle Cloud Ampere A1 Staging Runbook

## Status and boundary

This is an operator runbook for one Ubuntu ARM64 staging VM. Repository work does not create an Oracle account, compartment, VCN, subnet, NSG, VM, DNS record, certificate, backup policy, or deployment. Those remain manual and require the account owner's approval.

The target is `VM.Standard.A1.Flex`, approximately 2 OCPUs and 12 GB RAM, with an Ubuntu 24.04 ARM64 image and enough boot storage for images, PostgreSQL, MinIO objects, backups, and growth. OCI documents A1 as a flexible Arm VM shape, so the operator must confirm capacity and current tenancy limits in the chosen region: [OCI Arm-based Compute](https://docs.oracle.com/en-us/iaas/Content/Compute/References/arm.htm).

## Architecture

```text
Internet :80/:443
  -> OCI NSG and host firewall
  -> host Nginx
       shop domain -> 127.0.0.1:3000 -> storefront
       CRM domain  -> 127.0.0.1:3001 -> CRM
       API domain  -> 127.0.0.1:8080 -> backend
       API /media/ -> 127.0.0.1:9002 -> internal media gateway -> minio:9000

Private Docker networks
  backend/migrate -> postgres:5432
  backend/migrate -> redis:6379
  backend/migrate -> minio:9000
```

PostgreSQL, Redis, MinIO ports 5432, 6379, 9000, and 9001 are never published. The apps and media gateway bind only to host loopback. The long-running container memory limits total less than 7 GB and persistent CPU limits are approximately 2 OCPUs, leaving room for Ubuntu, Docker, Nginx, filesystem cache, and short migration bursts.

## Before provisioning

Decide and record:

- tenancy, compartment, home/target region, availability domain, and fault domain;
- VCN/subnet CIDRs and whether this single staging VM receives a reserved public IP;
- final storefront, CRM, and API DNS names;
- operator SSH source CIDR, never `0.0.0.0/0` unless it is a time-bounded emergency approved by the owner;
- 2 OCPU / 12 GB allocation and boot volume size;
- backup destination and retention;
- alert destination;
- whether GHCR is public or which read-only package credential will be installed.

The frontend release uses a build-time public configuration contract. Final domains must be chosen before the deployable RC is built. Runtime changes to `NEXT_PUBLIC_*` do not rewrite browser bundles or static canonical metadata.

## Provision the VM manually

In the OCI Console:

1. Create or select the approved compartment and VCN.
2. Prefer an NSG attached to this VM's VNIC. Oracle recommends NSGs when different resources need distinct security postures: [OCI security rules](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/securityrules.htm).
3. Add stateful ingress:
   - TCP 22 only from the approved operator CIDR.
   - TCP 80 from `0.0.0.0/0` and `::/0` when HTTP validation/public staging is approved.
   - TCP 443 from `0.0.0.0/0` and `::/0` when TLS is ready.
4. Do not add ingress for 3000, 3001, 5432, 6379, 8080, 9000, 9001, or 9002.
5. Launch `VM.Standard.A1.Flex` with an Ubuntu 24.04 aarch64 image, approximately 2 OCPUs and 12 GB RAM, an approved boot volume, and the operator's SSH public key.
6. Enable deletion protection if policy supports it. Apply ownership, environment, cost, and data-classification tags.
7. Assign a boot-volume backup policy after the data retention decision. OCI supports scheduled policy backups and manual point-in-time boot-volume backups: [boot-volume backups](https://docs.oracle.com/en-us/iaas/Content/Block/Concepts/bootvolumebackups.htm).

Do not use cloud-init to inject application secrets. If cloud-init is used for base packages, keep it non-secret and retain the exact submitted content as infrastructure evidence.

## First SSH and host hardening

Run as the Ubuntu operator after verifying the host key:

```bash
uname -m
lsb_release -a
sudo apt update
sudo apt full-upgrade
sudo apt install -y ca-certificates curl git jq nginx openssl ufw unattended-upgrades
sudo timedatectl set-timezone UTC
sudo systemctl enable --now unattended-upgrades
```

`uname -m` must return `aarch64`. Keep SSH keys only, disable password authentication and direct root login after confirming a second working session. Back up the original SSH configuration before editing it, validate with `sudo sshd -t`, and reload rather than restarting blindly.

Docker warns that published container ports interact with firewall rules. This stack binds every container port to `127.0.0.1`, while OCI NSG and host firewall still enforce the public boundary. Review Docker's current [Ubuntu firewall note and supported architectures](https://docs.docker.com/engine/install/ubuntu/).

Host firewall:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from OPERATOR_PUBLIC_CIDR to any port 22 proto tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Replace `OPERATOR_PUBLIC_CIDR` before running the command. Confirm SSH remains accessible before closing the first session.

## Swap and kernel headroom

With 12 GB RAM, start with a 2-4 GB encrypted-at-rest boot-volume swap file if tenancy policy permits it. Swap is a crash cushion, not capacity:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-vympel.conf
```

Verify with `free -h` and `swapon --show`. Do not continue if the filesystem lacks enough space.

## Install Docker Engine and Compose

Use Docker's official Ubuntu apt repository, which supports arm64; do not use the convenience script for this server. Follow the current [Docker Engine Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/) and install:

```bash
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker version
sudo docker compose version
```

Adding a user to the `docker` group grants root-equivalent control. Keep `sudo docker` unless local policy explicitly accepts that privilege.

## Place the repository and real environment

Use a clean checkout owned by root or the deployment operator:

```bash
sudo install -d -m 0755 /opt/vympel
sudo git clone https://github.com/ZxZxZ143/vympel.git /opt/vympel
cd /opt/vympel
git fetch --tags --prune
git checkout --detach EXACT_VERIFIED_COMMIT
git status --short
```

The last command must be empty.

Create the external environment:

```bash
sudo install -d -m 0700 /etc/vympel
sudo cp /opt/vympel/infrastructure/env/oracle-staging.env.example /etc/vympel/staging.env
sudo chmod 0600 /etc/vympel/staging.env
sudoedit /etc/vympel/staging.env
```

Replace every `REPLACE_ME` and `.invalid` value. Set `PUBLIC_BUILD_PLACEHOLDERS_ACKNOWLEDGED=false`. The Redis password embedded in `VYMPEL_REDIS_URL` must equal `VYMPEL_REDIS_PASSWORD`. Public variables must exactly match the published release manifest:

- `NEXT_PUBLIC_BASE_API_PUBLIC`
- `NEXT_PUBLIC_CRM_API_BASE`
- `NEXT_PUBLIC_MEDIA_ORIGINS`
- `NEXT_PUBLIC_SITE_URL`
- environment and release identifier

Real secrets remain only in `/etc/vympel/staging.env`; never print or commit that file.

## Registry authentication

Public packages require no login. If package visibility becomes private, create a dedicated GitHub credential with only `read:packages` and no repository/package write authority:

```bash
read -rsp 'GHCR read-only token: ' GHCR_READ_TOKEN
printf '%s' "$GHCR_READ_TOKEN" | sudo docker login ghcr.io -u PACKAGE_READER --password-stdin
unset GHCR_READ_TOKEN
```

Do not place the token in Compose, shell history, systemd units, or the environment file.

## Validate before starting

```bash
cd /opt/vympel
sudo docker compose \
  --env-file /etc/vympel/staging.env \
  -f infrastructure/compose/compose.oracle-staging.yml \
  config --quiet

sudo docker compose \
  --env-file /etc/vympel/staging.env \
  -f infrastructure/compose/compose.oracle-staging.yml \
  pull

sudo docker buildx imagetools inspect \
  ghcr.io/zxzxz143/vympel-backend:"$(sudo sed -n 's/^RELEASE_TAG=//p' /etc/vympel/staging.env)"
```

Confirm the selected index has `linux/arm64` and its digest matches the committed published release manifest. Repeat for storefront and CRM.

Run the historical Liquibase check before migration:

```bash
cd /opt/vympel
sudo sh deployment/scripts/check-liquibase-history.sh /etc/vympel/staging.env
```

If it requests an approval file, stop. Obtain the exact accountable acceptance described in `docs/deployment/LIQUIBASE_HISTORY_COMPATIBILITY.md`; never invent a changeset or edit `databasechangelog`.

## Install HTTP-first Nginx

Render only the three domain placeholders so Nginx variables such as `$host` remain intact:

```bash
set -a
. /etc/vympel/staging.env
set +a
sudo envsubst '$STOREFRONT_DOMAIN $CRM_DOMAIN $API_DOMAIN' \
  < /opt/vympel/infrastructure/reverse-proxy/oracle-staging.conf.template \
  | sudo tee /etc/nginx/sites-available/vympel-staging >/dev/null
sudo ln -s /etc/nginx/sites-available/vympel-staging /etc/nginx/sites-enabled/vympel-staging
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Review the rendered file before reloading. It blocks public `/actuator/*`, preserves forwarded/WebSocket headers, applies finite timeouts, and contains no TLS key path.

## First start and finite migration

Before any migration of a target that already contains durable data, run
`sudo sh deployment/scripts/backup-check.sh /etc/vympel/staging.env`. A
separately witnessed first boot may omit it only when both the database and
object-storage bucket are newly created and empty; record that fact.

Start the complete stack:

```bash
cd /opt/vympel
sudo docker compose \
  --env-file /etc/vympel/staging.env \
  -f infrastructure/compose/compose.oracle-staging.yml \
  up -d --no-build --remove-orphans --wait
```

The finite `migrate` container must exit 0 before the backend starts. Inspect bounded evidence:

```bash
sudo docker compose --env-file /etc/vympel/staging.env \
  -f infrastructure/compose/compose.oracle-staging.yml ps -a
sudo docker compose --env-file /etc/vympel/staging.env \
  -f infrastructure/compose/compose.oracle-staging.yml logs --no-color --tail 200 migrate
curl --fail http://127.0.0.1:8080/actuator/health/readiness
curl --fail http://127.0.0.1:3000/ru
curl --fail http://127.0.0.1:3001/login
```

Require `migrate` exited 0 and all long-running services healthy. Do not expose Actuator through Nginx.

## DNS, HTTP proof, and Certbot

Only after the owner chooses final domains:

1. Create A/AAAA records for storefront, CRM, and API to the approved VM address.
2. Confirm public DNS resolution from outside OCI.
3. Confirm HTTP routes on port 80.
4. Install Certbot using the current [official Nginx instructions](https://certbot.eff.org/instructions?os=snap&ws=nginx).
5. Install `apache2-utils`, create `/var/lib/letsencrypt` (0755) and
   `/etc/nginx/auth` (0750), then create the VM-only credential with
   `sudo htpasswd -cB /etc/nginx/auth/vympel-crm.htpasswd vympel-preview`.
6. Issue storefront/API TLS with
   `sudo certbot --nginx -d "$STOREFRONT_DOMAIN" -d "$API_DOMAIN"`.
7. Issue CRM TLS without generating a competing Nginx block:
   `sudo certbot certonly --webroot -w /var/lib/letsencrypt -d "$CRM_DOMAIN"`.
8. Render `infrastructure/reverse-proxy/host-crm-https.server.template` to
   `/etc/nginx/conf.d/vympel-crm-https.conf` using only `$CRM_DOMAIN`,
   `$TLS_CERT_DIR` (`/etc/letsencrypt/live/$CRM_DOMAIN`) and
   `$CRM_HTPASSWD_PATH` (`/etc/nginx/auth/vympel-crm.htpasswd`). Copy those two
   exact paths into `/etc/vympel/staging.env`.
9. Run `sudo nginx -t`, inspect Basic/Bearer route separation and redirects,
   then test `sudo certbot renew --dry-run`.

Do not request certificates before DNS resolves. Do not commit `/etc/letsencrypt`, private keys, or rendered host configuration.

## External smoke test

After TLS:

```bash
curl --fail --show-error "https://$STOREFRONT_DOMAIN/ru"
test "$(curl --silent --output /dev/null --write-out '%{http_code}' "https://$CRM_DOMAIN/login")" = 401
read -rsp 'CRM Basic Auth password: ' CRM_BASIC_PASSWORD && echo
curl --fail --show-error --user "vympel-preview:$CRM_BASIC_PASSWORD" "https://$CRM_DOMAIN/login"
unset CRM_BASIC_PASSWORD
curl --fail --show-error "https://$API_DOMAIN/api/public/ping"
test "$(curl --silent --output /dev/null --write-out '%{http_code}' "https://$API_DOMAIN/actuator/health")" = 404
```

Then verify login/refresh/logout cookies, one protected CRM read, storefront catalog/search/detail, image upload and read through `/media/`, CMS publish/revalidation, CORS from both public origins, and backend request IDs. Record timestamps and release digests without recording secrets or customer data.

## One-time ADMIN bootstrap

1. Set `VYMPEL_BOOTSTRAP_ADMIN_ENABLED=true` and supply temporary email/password/name in `/etc/vympel/staging.env`.
2. Recreate only backend after the stack is healthy.
3. Verify the account can log in and has ADMIN.
4. Immediately set the flag false, remove the temporary password, rotate it through the application, and recreate backend again.
5. Confirm restart does not reset or promote any account.

Never leave the bootstrap password in shell history, logs, backups, or the environment file.

## Optional systemd startup

Review `infrastructure/systemd/vympel-oracle-staging.service`, then:

```bash
sudo cp /opt/vympel/infrastructure/systemd/vympel-oracle-staging.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable vympel-oracle-staging.service
sudo systemctl start vympel-oracle-staging.service
sudo systemctl status vympel-oracle-staging.service
```

The unit runs `up --wait` and stops without deleting volumes. It does not perform pulls, migrations outside Compose ordering, backups, or upgrades automatically.

## Backups and restore rehearsal

Application-consistent PostgreSQL backup:

```bash
sudo install -d -m 0700 /srv/vympel/backups
cd /opt/vympel
backup_path=/srv/vympel/backups/vympel-"$(date -u +%Y%m%dT%H%M%SZ)".dump
sudo docker compose --env-file /etc/vympel/staging.env \
  -f infrastructure/compose/compose.oracle-staging.yml \
  exec -T postgres pg_dump -Fc -U vympel -d vympel \
  | sudo tee "$backup_path" >/dev/null
sudo chmod 0600 "$backup_path"
test -s "$backup_path"
```

Also back up MinIO data at the object layer and protect `/etc/vympel/staging.env` through the approved secret/backup system. A boot-volume backup alone is crash-consistent and does not replace PostgreSQL/object-level proof.

At least monthly, restore the newest dump into a separate disposable PostgreSQL container or isolated VM, run `pg_restore --list`, validate representative counts/constraints, and record the result. Never rehearse restore against the live `oracle-postgres-data` volume.

## Upgrade and rollback

Upgrade:

1. Require green remote CI and a digest-complete release manifest with ARM64 proof.
2. Back up PostgreSQL and MinIO and verify the backup files are non-empty.
3. Run `sudo sh deployment/scripts/backup-check.sh /etc/vympel/staging.env` and stop on any stale, failed, or mismatched evidence.
4. Update only `RELEASE_TAG` and the exact matching public contract in `/etc/vympel/staging.env`.
5. Pull, inspect the ARM64 manifest, run the Liquibase history gate, and `up -d --no-build --wait`.
6. Run all smoke tests.

Rollback is application-only to a previously verified compatible image set. Liquibase rollback is forward-fix-only:

```bash
sudoedit /etc/vympel/staging.env
cd /opt/vympel
sudo docker compose --env-file /etc/vympel/staging.env \
  -f infrastructure/compose/compose.oracle-staging.yml \
  pull backend storefront crm
sudo docker compose --env-file /etc/vympel/staging.env \
  -f infrastructure/compose/compose.oracle-staging.yml \
  up -d --no-build --wait backend storefront crm
```

Do not run `down --volumes`, prune globally, or edit an applied migration.

## Troubleshooting

- `no matching manifest for linux/arm64`: wrong/old release; inspect the OCI index and use a later verified RC.
- Backend blocked before startup: inspect migration exit code, PostgreSQL health, canonical env names, and `NonLocalSecurityConfigurationValidator` messages.
- Redis authentication failure: make `VYMPEL_REDIS_PASSWORD` and the password inside `VYMPEL_REDIS_URL` identical.
- Images return 404: confirm bucket initializer completed, object is under the configured bucket, public endpoint ends in `/media`, and both Nginx layers are healthy.
- Browser calls the wrong host: the selected frontend image was built for a different public contract; changing runtime `NEXT_PUBLIC_*` is insufficient.
- 502 from Nginx: check loopback listener with `ss -lntp`, Compose health, and bounded service logs.
- VM memory pressure: inspect `free -h`, `docker stats --no-stream`, OOM logs, and volume space before changing limits. Do not mask a leak by increasing swap.

## Explicitly not performed by repository preparation

- Oracle account, tenancy, compartment, VCN, NSG, subnet, VM, or public IP creation.
- DNS purchase or changes.
- SSH access to an external server.
- Secret generation or storage outside the placeholder template.
- GHCR credentials installed on a server.
- Nginx/Certbot changes on a server or TLS issuance.
- Oracle boot-volume backup creation or policy assignment.
- Any staging or production deployment.
