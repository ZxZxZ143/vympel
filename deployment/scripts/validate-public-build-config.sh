#!/bin/sh
set -eu

[ "$#" -eq 7 ] || {
  echo "usage: $0 STOREFRONT_API_BASE CRM_API_BASE MEDIA_ORIGINS STOREFRONT_SITE_URL ENVIRONMENT ALLOW_PLACEHOLDERS RELEASE_ID" >&2
  exit 1
}

storefront_api_base=$1
crm_api_base=$2
media_origins=$3
storefront_site_url=$4
deployment_environment=$5
allow_placeholders=$6
release_id=$7

is_placeholder() {
  value=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  case "$value" in
    *localhost*|*127.0.0.1*|*"[::1]"*|*.invalid*|*.test*|*.example*|*example.com*|*example.org*|*replace_me*|*domain_pending*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

validate_https_url() {
  label=$1
  value=$2
  if ! printf '%s\n' "$value" | grep -Eq '^https://[A-Za-z0-9._~:/?=&%+,-]+$'; then
    echo "$label contains unsupported or unsafe URL characters" >&2
    exit 1
  fi
  case "$value" in
    https://*) ;;
    *)
      echo "$label must be an absolute HTTPS URL" >&2
      exit 1
      ;;
  esac
  case "$value" in
    *" "*|*"	"*|*"#"*|*"@"*)
      echo "$label must not contain whitespace, fragments, or credentials" >&2
      exit 1
      ;;
  esac
  if is_placeholder "$value" && [ "$allow_placeholders" != "true" ]; then
    echo "$label contains a localhost or placeholder value; set the explicit placeholder acknowledgement only for a non-deployable release" >&2
    exit 1
  fi
}

validate_origin() {
  label=$1
  value=$2
  validate_https_url "$label" "$value"
  authority=${value#https://}
  case "$authority" in
    */*|*\?*)
      echo "$label must be an HTTPS origin without a path or query" >&2
      exit 1
      ;;
  esac
}

validate_https_url STOREFRONT_API_BASE "$storefront_api_base"
validate_https_url CRM_API_BASE "$crm_api_base"
validate_origin STOREFRONT_SITE_URL "$storefront_site_url"

case "$storefront_api_base" in
  */api/public) ;;
  *) echo "STOREFRONT_API_BASE must end with /api/public" >&2; exit 1 ;;
esac
case "$crm_api_base" in
  */api/crm) ;;
  *) echo "CRM_API_BASE must end with /api/crm" >&2; exit 1 ;;
esac

old_ifs=$IFS
IFS=,
set -- $media_origins
IFS=$old_ifs
[ "$#" -gt 0 ] || {
  echo "MEDIA_ORIGINS must contain at least one HTTPS origin" >&2
  exit 1
}
for origin in "$@"; do
  validate_origin MEDIA_ORIGINS "$origin"
done

case "$deployment_environment" in
  ci|staging|production) ;;
  *) echo "ENVIRONMENT must be ci, staging, or production" >&2; exit 1 ;;
esac
case "$allow_placeholders" in
  true|false) ;;
  *) echo "ALLOW_PLACEHOLDERS must be true or false" >&2; exit 1 ;;
esac
if ! printf '%s\n' "$release_id" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "RELEASE_ID must be an exact lowercase commit SHA" >&2
  exit 1
fi

if [ "$allow_placeholders" = "true" ]; then
  echo "Public build configuration validated with an explicit non-deployable placeholder acknowledgement."
else
  echo "Public build configuration validated for deployment."
fi
