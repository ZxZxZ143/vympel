# Image performance validation and bounded backfill

These tools read public staging data and write local evidence. They do not upload
objects, update a database, publish images, or deploy a service. The reviewed
baseline release is `d8e661620a330431dc8bfd94ae06e5ef95c58f89`.

## Prerequisites

- Install the storefront's locked dependencies with `npm ci` in `vympel_front`.
- Browser tools accept `PLAYWRIGHT_MODULE` as an absolute path to an installed
  Playwright or playwright-core module. `PLAYWRIGHT_CHANNEL` defaults to `msedge`.
  Playwright was installed only in the ignored task cache, not as an app dependency.
- `VYMPEL_IMAGE_VARIANTS_EXECUTABLE` is an executable path to `cwebp`. For a real
  backfill, prepare the plan using the codec from the exact reviewed backend image,
  and retain its digest and `cwebp -version`. The manifest records the codec version.
  Different codec versions can produce different bytes: never overwrite a family
  to accommodate a checksum conflict.
- Evidence defaults to `.cache/image-optimization`; override with
  `IMAGE_EVIDENCE_DIR`. Do not store credentials in evidence or command files.

## Browser measurements

`node scripts/image-performance/browser-measure.mjs` takes
`IMAGE_TEST_ORIGIN`, `IMAGE_TEST_LABEL`, and optional `IMAGE_TEST_SLOW=true`.
For Basic-authenticated staging, set `VYMPEL_PREVIEW_USER` and
`VYMPEL_PREVIEW_PASSWORD` in the process environment. Requests to production
storefront domains are blocked. Inspect the recorded unexpected-host list.

Normal mode covers 18 page/viewport combinations with cold and warm browser
caches. Slow mode covers home/catalog/product at 390 and 1440 pixels, 1.6 Mbps
download, 0.75 Mbps upload and 150 ms latency, with a 30-second observation window.
Incomplete downloads remain explicitly visible in the CDP records. A warm run
following an incomplete cold run is **not** a fully populated-cache experiment.
Do not mistake its provisional LCP for the final LCP after every image arrives.

CDP captures image URL/status, wire bytes (including partial data), priority,
cache policy/ETag, response timing and cache hits. DOM snapshots capture displayed
and natural dimensions, responsive candidates, LCP element, CLS, overflow and
hero visibility samples. `naturalWidth` with width descriptors can be density
corrected; encoded pixel dimensions come from the original audit/variant manifest.
No Playwright request routing is used for performance measurements: routing
disables normal browser HTTP caching.

For a controlled comparison, run `replay-fixture.mjs` on port 14441. It caches
GET-only public API responses and downloads at most 80 explicitly encountered
media sources locally. Each image is processed through the bounded backfill
preparer. It never forwards writes. The `/before` view retains original URLs and
the `/after` view advertises completed variant families. API payloads/photographs
are otherwise identical. This is a local counterfactual, not a staging deployment.

Use a separate `git archive d8e6616 vympel_front` checkout for the baseline; do not
revert the working tree. Build it for port 14442 and the candidate for port 14443:

```text
BASE_API_PUBLIC=http://127.0.0.1:14441/before/api/public
NEXT_PUBLIC_BASE_API_PUBLIC=http://127.0.0.1:14441/before/api/public
NEXT_PUBLIC_MEDIA_ORIGINS=http://127.0.0.1:14441
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:14442
SITE_INDEXING_ENABLED=false
```

For the candidate substitute `/after/` and port 14443. These are **build-time** as
well as runtime inputs. Never publish the locally compiled fixture builds.
`browser-scroll.mjs` measures all rendered catalog/brand cards on those two local
ports. `browser-regressions.mjs` checks gallery mounting, thumbnail bounds,
on-demand originals, keyboard/focus and forced failures on the local candidate.
Only the failure tests intercept requests.

## Prepare a review-only sample

Input contains an explicit HTTPS media origin and **1–10** unique legacy public
product/CMS PNG/JPEG URLs. Optional `sha256` pins the original; optional `file`
reads a downloaded original relative to the input file instead of fetching it.
No bucket enumeration, database connection, cloud credentials or recursive
migration is supported.

```text
node scripts/image-performance/prepare-backfill.mjs explicit-input.json local-plan-directory
```

Each output family contains the original unchanged and at most 6 product / 8 CMS
WebPs, with widths clamped to source width. Metadata, dimensions, alpha, output
size, MD5 and SHA-256 are checked. Animated/EXIF-bearing inputs are skipped.
The preparer caps each input at 10 MiB / 25 million pixels / 10,000 pixels per
dimension, encoding time at 20 seconds per family and derivatives at 32 MiB.
Identical re-runs verify existing files and the exact manifest; a mismatch fails.
The SQL always ends in **ROLLBACK**, contains no DELETE, and is not executed.

The ten-image example and its measured manifest live in
`docs/tasks/image-optimization/`. Local output objects remain in the ignored
task cache. This sample covers nine catalog originals and one CMS desktop image;
gallery siblings and other locale/mobile compositions require their own reviewed
explicit batches. No sample is a full-library migration.

## Separately reviewed application procedure

1. Obtain authorization for the specific staging batch and reviewed checksums;
   verify PostgreSQL/MinIO backups and the exact backend codec/image digest.
2. Re-read every old public object and compare SHA-256 to the selected input.
   Stop if anything changed. Preserve the old keys and original bytes.
3. Upload derivatives first and the copied original last. Use Content-MD5,
   `If-None-Match: *`, the recorded content type and
   `Cache-Control: public, max-age=31536000, immutable`. A 412 is acceptable only
   after GET verifies an already-identical object. A mismatch stops the batch;
   never overwrite, delete, or silently regenerate that URL.
4. GET every manifest object through the public gateway; verify SHA-256, dimensions,
   content type, cache policy and 200/304 behavior before changing any reference.
5. Review the generated transaction, expected row IDs/counts, ownership and active
   CMS lifecycle status. Update only those locked rows. Add the approved CMS
   revalidation outbox action for affected pages; the review SQL intentionally does
   not assume page dependencies or bypass the normal revalidation mechanism.
   Commit only under the separately approved application step. No schema migration.
6. Check public DTOs, original fallback, RU/EN/KZ, gallery and browser metrics before
   considering another batch. Keep a before/after reference map for rollback.
   To roll back references, restore the reviewed old keys; old objects still exist.
   Retain newly generated objects for investigation; this workflow never deletes them.

## Verification commands

Frontend: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`,
`npm run test:images`, `npm run test:security`, `npm run test:sharp-security`,
`npm run test:glob-security`, `npm run test:production-status`,
`npm run test:budgets:ci`. Generate committed static derivatives explicitly with
`npm run images:generate`; generation is not part of request handling or startup.

Backend: `./gradlew test`; set `VYMPEL_IMAGE_VARIANTS_EXECUTABLE` to enable the
native encoder test. `ResponsiveImageStorageIntegrationTest` starts an isolated
container of the staging MinIO digest and verifies actual checksum rejection,
conditional writes, metadata and family deletion. Never point it at a live bucket.

Build and scan the candidate backend image locally before release. The release
verifier also requires `cwebp -version` to succeed for both published architectures.
The source change does not authorize publishing that release or deploying it.
