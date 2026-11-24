#!/bin/sh
# Verifies the production indexing contract of a running storefront:
# no global noindex, indexable home page with canonical/hreflang on the
# approved origin, robots.txt advertising the sitemap, and a non-empty
# sitemap whose locations all use the approved origin.
set -eu

origin=${1:?Usage: verify-public-indexing.sh STOREFRONT_ORIGIN CANONICAL_SITE_URL}
canonical=${2:?Usage: verify-public-indexing.sh STOREFRONT_ORIGIN CANONICAL_SITE_URL}
canonical=${canonical%/}

case "$origin" in
  http://*|https://*) ;;
  *) echo "Storefront origin must be an absolute HTTP(S) origin" >&2; exit 1 ;;
esac
case "$canonical" in
  https://*) ;;
  *) echo "Canonical site URL must be an absolute HTTPS origin" >&2; exit 1 ;;
esac

temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT HUP INT TERM

headers=$temp_dir/headers
home=$temp_dir/home.html
robots=$temp_dir/robots.txt
sitemap=$temp_dir/sitemap.xml

curl --fail --silent --show-error --retry 6 --retry-all-errors --retry-delay 10 --max-time 60 --dump-header "$headers" --output "$home" "$origin/ru"
curl --fail --silent --show-error --retry 6 --retry-all-errors --retry-delay 10 --max-time 60 --output "$robots" "$origin/robots.txt"
curl --fail --silent --show-error --retry 6 --retry-all-errors --retry-delay 10 --max-time 60 --output "$sitemap" "$origin/sitemap.xml"

if grep -Eiq '^x-robots-tag:.*noindex' "$headers"; then
  echo "Production response still carries an X-Robots-Tag noindex header" >&2
  exit 1
fi
if grep -Eiq '<meta[^>]+name="robots"[^>]+content="[^"]*noindex' "$home"; then
  echo "Production home page still declares robots noindex" >&2
  exit 1
fi
if ! grep -Eiq "<link[^>]+rel=\"canonical\"[^>]+href=\"$canonical/ru\"" "$home"; then
  echo "Production home page is missing the canonical link to $canonical/ru" >&2
  exit 1
fi
if ! grep -Eiq "<link[^>]+rel=\"alternate\"[^>]+hrefLang=\"kk\"[^>]+href=\"$canonical/kz\"" "$home"; then
  echo "Production home page is missing hreflang alternates on $canonical" >&2
  exit 1
fi
if ! grep -Eiq "^sitemap:[[:space:]]*$canonical/sitemap.xml[[:space:]]*$" "$robots"; then
  echo "robots.txt does not advertise $canonical/sitemap.xml" >&2
  exit 1
fi
if grep -Eiq '^disallow:[[:space:]]*/[[:space:]]*$' "$robots"; then
  echo "robots.txt disallows the whole site" >&2
  exit 1
fi

locations=$(grep -Eo '<loc>[^<]+</loc>' "$sitemap" | sed -e 's#<loc>##' -e 's#</loc>##')
if [ -z "$locations" ]; then
  echo "Sitemap contains no locations" >&2
  exit 1
fi
if printf '%s\n' "$locations" | grep -Ev "^$canonical/" >/dev/null; then
  echo "Sitemap contains locations outside $canonical" >&2
  exit 1
fi
if ! printf '%s\n' "$locations" | grep -Eq "^$canonical/ru$"; then
  echo "Sitemap is missing the Russian home page" >&2
  exit 1
fi

count=$(printf '%s\n' "$locations" | wc -l | tr -d ' ')
echo "Public indexing contract passed: indexable pages, canonical/hreflang on $canonical, advertised sitemap with $count locations."
