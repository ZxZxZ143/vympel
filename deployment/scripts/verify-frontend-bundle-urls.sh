#!/bin/sh
set -eu

if [ "$#" -eq 0 ]; then
  echo "Usage: verify-frontend-bundle-urls.sh PATH..." >&2
  exit 2
fi

for scan_path in "$@"; do
  if [ ! -e "$scan_path" ]; then
    echo "Frontend bundle scan path does not exist: $scan_path" >&2
    exit 2
  fi
done

# Reject concrete non-production destinations. Next.js standalone runtimes contain
# a framework-owned `http://localhost:${...}` URL template for constructing their
# own request origin; it has no fixed port/path and is intentionally not matched.
forbidden_url_pattern='https?://(127\.0\.0\.1|\[::1\])([/:?&#]|$)|https?://localhost(:[0-9]+|/|[[:space:]"'"'"'<>])|https?://[^[:space:]"'"'"'<>]*\.invalid([/:?&#]|$)'

if grep -R -a -q -E "$forbidden_url_pattern" "$@"; then
  echo "Non-local frontend bundle contains a concrete localhost, loopback, or .invalid URL" >&2
  exit 1
fi

echo "Frontend bundle URL contract passed."
