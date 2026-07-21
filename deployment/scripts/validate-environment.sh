#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/lib.sh"

[ "$#" -eq 1 ] || die "usage: $0 <deployment.env>"
ENV_FILE=$1
[ -f "$ENV_FILE" ] || die "environment file does not exist: $ENV_FILE"

required_keys='REGISTRY RELEASE_TAG STOREFRONT_DOMAIN CRM_DOMAIN API_DOMAIN TLS_CERT_DIR VYMPEL_DB_URL VYMPEL_DB_USERNAME VYMPEL_DB_PASSWORD VYMPEL_JWT_SECRET VYMPEL_RATE_LIMIT_HMAC_SECRET VYMPEL_REDIS_URL VYMPEL_TRUSTED_PROXY_CIDRS VYMPEL_S3_BUCKET VYMPEL_S3_REGION VYMPEL_S3_ENDPOINT VYMPEL_S3_PUBLIC_ENDPOINT VYMPEL_S3_ACCESS_KEY VYMPEL_S3_SECRET_KEY VYMPEL_CORS_ALLOWED_ORIGINS VYMPEL_CMS_PUBLIC_REVALIDATE_URL VYMPEL_CMS_REVALIDATE_SECRET NEXT_PUBLIC_BASE_API_PUBLIC NEXT_PUBLIC_CRM_API_BASE NEXT_PUBLIC_MEDIA_ORIGINS STOREFRONT_HEALTH_URL CRM_HEALTH_URL API_HEALTH_URL'

for key in $required_keys; do
  value=$(require_env_value "$ENV_FILE" "$key")
  printf '%s' "$value" | grep -Eiq 'REPLACE_ME|example\.invalid|<[^>]+>' \
    && die "$key still contains a deployment placeholder"
done

release_tag=$(require_env_value "$ENV_FILE" RELEASE_TAG)
printf '%s' "$release_tag" | grep -Eq '^[0-9a-f]{40}$' \
  || die "RELEASE_TAG must be a lowercase 40-character Git commit SHA"
printf '%s' "$release_tag" | grep -Eq '^0{40}$' \
  && die "RELEASE_TAG must not be the all-zero example value"

registry=$(require_env_value "$ENV_FILE" REGISTRY)
printf '%s' "$registry" | grep -Eiq '(^|[/:])latest($|[/:])' \
  && die "REGISTRY must not encode latest as the release identifier"

jwt_secret=$(require_env_value "$ENV_FILE" VYMPEL_JWT_SECRET)
limiter_secret=$(require_env_value "$ENV_FILE" VYMPEL_RATE_LIMIT_HMAC_SECRET)
cms_secret=$(require_env_value "$ENV_FILE" VYMPEL_CMS_REVALIDATE_SECRET)
[ "${#jwt_secret}" -ge 48 ] || die "VYMPEL_JWT_SECRET must contain at least 48 characters"
[ "${#limiter_secret}" -ge 48 ] || die "VYMPEL_RATE_LIMIT_HMAC_SECRET must contain at least 48 characters"
[ "${#cms_secret}" -ge 48 ] || die "VYMPEL_CMS_REVALIDATE_SECRET must contain at least 48 characters"
[ "$jwt_secret" != "$limiter_secret" ] || die "JWT and limiter HMAC secrets must differ"

cors=$(require_env_value "$ENV_FILE" VYMPEL_CORS_ALLOWED_ORIGINS)
printf '%s' "$cors" | grep -q '\*' && die "credentialed CORS must not contain a wildcard"

if grep -Eiq '^NEXT_PUBLIC_[A-Z0-9_]*(SECRET|PASSWORD|TOKEN|PRIVATE_KEY|ACCESS_KEY)=' "$ENV_FILE"; then
  die "a secret-bearing key is exposed through NEXT_PUBLIC_*"
fi

bootstrap_enabled=$(read_env "$ENV_FILE" VYMPEL_BOOTSTRAP_ADMIN_ENABLED 2>/dev/null || printf 'false')
if [ "$bootstrap_enabled" = "true" ]; then
  require_env_value "$ENV_FILE" VYMPEL_BOOTSTRAP_ADMIN_EMAIL >/dev/null
  bootstrap_password=$(require_env_value "$ENV_FILE" VYMPEL_BOOTSTRAP_ADMIN_PASSWORD)
  [ "${#bootstrap_password}" -ge 16 ] || die "bootstrap password must contain at least 16 characters"
fi

tls_dir=$(require_env_value "$ENV_FILE" TLS_CERT_DIR)
[ -d "$tls_dir" ] || die "TLS_CERT_DIR does not exist: $tls_dir"
[ -r "$tls_dir/fullchain.pem" ] || die "TLS full chain is unreadable"
[ -r "$tls_dir/privkey.pem" ] || die "TLS private key is unreadable"

printf '%s\n' "Environment validation passed for immutable release $release_tag."
