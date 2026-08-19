#!/bin/sh
set -eu

origin=${1:?Usage: verify-preview-indexing.sh STOREFRONT_ORIGIN}
case "$origin" in
  http://*|https://*) ;;
  *) echo "Storefront origin must be an absolute HTTP(S) origin" >&2; exit 1 ;;
esac

temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT HUP INT TERM

headers=$temp_dir/headers
home=$temp_dir/home.html
robots=$temp_dir/robots.txt
sitemap=$temp_dir/sitemap.xml

curl --fail --silent --show-error --dump-header "$headers" --output "$home" "$origin/ru"
curl --fail --silent --show-error --output "$robots" "$origin/robots.txt"
curl --fail --silent --show-error --output "$sitemap" "$origin/sitemap.xml"

if ! grep -Eiq '^x-robots-tag:[[:space:]]*noindex,[[:space:]]*nofollow[[:space:]]*$' "$headers"; then
  echo "Preview response is missing the global X-Robots-Tag noindex policy" >&2
  exit 1
fi
if ! grep -Eiq '<meta[^>]+name="robots"[^>]+content="noindex,[[:space:]]*nofollow"' "$home"; then
  echo "Preview HTML is missing the robots noindex policy" >&2
  exit 1
fi

if grep -Eiq '<link[^>]+rel="canonical"|rel="alternate"|property="og:|name="twitter:' "$home"; then
  echo "Preview HTML advertises canonical, alternate, or social discovery metadata" >&2
  exit 1
fi
if grep -Eiq '^sitemap:' "$robots"; then
  echo "Preview robots.txt advertises a sitemap" >&2
  exit 1
fi
if grep -Eiq '<loc>' "$sitemap"; then
  echo "Preview sitemap contains indexable locations" >&2
  exit 1
fi

echo "Preview indexing contract passed: global noindex, no discovery metadata, no advertised/indexable sitemap."
