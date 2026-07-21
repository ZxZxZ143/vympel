#!/bin/sh
set -eu

die() {
  printf '%s\n' "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command is unavailable: $1"
}

read_env() {
  env_file=$1
  env_key=$2
  awk -v key="$env_key" '
    index($0, key "=") == 1 {
      value = substr($0, length(key) + 2)
      sub(/\r$/, "", value)
      print value
      found = 1
      exit
    }
    END { if (!found) exit 1 }
  ' "$env_file"
}

require_env_value() {
  env_file=$1
  env_key=$2
  value=$(read_env "$env_file" "$env_key" 2>/dev/null || true)
  [ -n "$value" ] || die "$env_key is missing or blank in $env_file"
  printf '%s' "$value"
}

compose() {
  compose_file=$1
  env_file=$2
  shift 2
  docker compose --env-file "$env_file" -f "$compose_file" "$@"
}
