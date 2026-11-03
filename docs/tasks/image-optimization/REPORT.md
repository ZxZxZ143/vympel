# Image loading optimization — 2026-11-03

Status: **IMAGE OPTIMIZATION READY FOR STAGING RELEASE** as a source change and
reviewable bounded backfill. No push, merge, GHCR publication, GCP deployment or
live media/database write was performed. Production is untouched. The known-good
rollback release remains `d8e661620a330431dc8bfd94ae06e5ef95c58f89`.

**The measured “after” is a local replay with prepared media variants, not a
deployed staging result. Existing legacy media retain original delivery until a
separately reviewed backfill updates their references.** A source-only deployment
does not automatically confer the reported product-byte savings on old uploads.

## 1. Ranked measured causes

1. **Oversized originals / no responsive product delivery.** Nine catalog photos
   contain 16,015,944 payload bytes; product 46's four gallery originals contain
   9,662,235 bytes. Product originals are roughly 1.1–2.6 MB each, despite cards
   displaying at approximately 159 px on a 390 px screen, 322 px at 768 px and
   315 px at 1440 px. `unoptimized` bypasses resizing for thumbnails, main images
   and cards. Native CMS picture sources distinguish compositions but previously
   supplied no resolution candidates.
2. **Unbounded early image work.** The baseline gallery fetched all four original
   photos before lightbox interaction; homepage slides/backdrops and brand cards
   competed for bandwidth. Reusing a URL avoids a second network fetch in many
   cases but does not make a full-resolution decorative backdrop inexpensive.
3. **Missing explicit public-media freshness policy.** All 24 audited original
   responses lacked Cache-Control; ETag and Last-Modified were present. All 24
   explicit conditional GETs returned 304. Actual authenticated staging browser
   repeat visits nevertheless transferred nearly the same image bytes. Local
   replay revalidated instead: these are different observed cache behaviors and
   are reported separately, not attributed to an unproven single server defect.
4. **Bandwidth dominates on a slow connection.** At 1.6 Mbps, baseline pages still
   had 4–11 unfinished image requests at 30 seconds. Every optimized slow case
   completed its observed image requests within the same window.
5. **Latency exists but does not explain the bulk of the delay.** Median first
   public-media HTTP TTFB was 197.95 ms, repeat 189.77 ms. This is end-to-end
   gateway/MinIO/network latency; no per-hop server trace establishes a separate
   MinIO or Nginx bottleneck. Product/CMS original requests do not invoke Next's
   optimizer. Small existing icon optimizer requests remain.
6. **Animation was secondary in the captured normal baseline.** For mobile RU
   home, the LCP image loaded around 3310 ms and rendered at 3360 ms, a roughly
   50 ms gap. Hero opacity/complete snapshots and exact LCP elements are retained.
   They are visibility observations, not a precise React hydration profiler.
   GSAP timing and approved geometry were not redesigned.

## 2. Exact source/configuration changes

- Backend `ImageVariantEncoder` runs a single native cwebp process at a time on
  new uploads, with immediate original fallback when busy/disabled/unsupported,
  timed out or failed. `ResponsiveImageLayout` defines the bounded family contract.
  `ObjectStorageService` writes verified derivatives first, byte-identical original
  last, and only then persists the original key. Failed object writes clean up
  newly created keys. Both CMS deletion and product deletion outbox understand
  these families; they never enumerate/delete an arbitrary prefix.
- Backend Docker installs the distribution-maintained `webp` package. Configuration
  adds `VYMPEL_IMAGE_VARIANTS_ENABLED` and `VYMPEL_IMAGE_VARIANTS_EXECUTABLE`; the
  staging Compose override exposes only the optional enable flag. No API response
  shape, shared DTO, DB schema, auth policy, service limit or public port changed.
  Existing CRM uploads allow 60 seconds and staging upload proxy routes 120 seconds,
  compatible with the 20-second encoding budget; the CRM client needed no change.
- Storefront adds `responsiveImages.ts`, `ResponsiveProductImage`, a static
  manifest and 206 hash-addressed variants of 39 existing static sources.
  GoodCard uses real srcSet/sizes; catalog initially prioritizes two cards and
  below-fold brand cards no longer force four eager requests.
- Gallery thumbnails use at most 320 px candidates; main images mount only the
  selected and adjacent loop slides. Only the selected open lightbox mounts an
  original. Navigation, ordering, dialogs and accessibility labels are retained;
  closing the dialog explicitly restores focus to the selected main-image button.
- CMS pictures retain separate mobile/desktop compositions, resize candidates,
  original/static fallbacks, and first-slide priority. Decorative backdrops use
  at most 160 px. Empty wrappers remain mounted for GSAP; distant slide URLs are
  withheld. Banner object-cover sizes use actual frame heights/aspect ratios.
  Both native image components recover errors that finished before hydration.
- Next headers cache only hash-addressed static derivatives immutably. The media
  gateway adds a narrow public-image policy described below. Release verification
  requires cwebp on both published backend architectures. Production deployment
  configuration was not edited.
- Reproduction, regression and bounded preparation tools are in
  [scripts/image-performance](../../../scripts/image-performance/README.md).

## 3–6. Measurements: bytes, LCP, cold/warm caches

Actual staging baseline used authenticated Edge against preview.vympel.kz plus
public api.vympel.kz media, 18 page/viewport combinations × cold/warm. Normal
staging observation was 6.5 seconds. The local baseline is the immutable d8e6616
storefront, serving the same captured API payloads and originals. The optimized
view substitutes only locally prepared media URLs and the source changes.
Normal replay observes 3 seconds; slow replay observes 30 seconds.
The fixture eventually reached its explicit 80-source preparation cap and rejected
additional API expansions with local 502 responses. No recorded image request in
normal/slow before or after failed HTTP or transport, and all scrolled card images
completed. These bounded image results do not constitute a complete-site API or
prefetch equivalence test. Device pixel
ratio is 2 below 700 px and 1 otherwise. These are single runs, not statistical
field-performance estimates; millisecond-level localhost differences are noise.

Browser media preparation used cwebp 1.6.0 on Windows; the final backend image
contains Ubuntu cwebp 1.2.2. The runtime benchmark of the same catalog source
produced a 45,012-byte 480 px image versus 44,898 bytes in the replay (0.25%
difference). The report does not promise byte-identical output across codecs.
Live backfill must use the reviewed runtime codec/digest and regenerate/review
its manifest, never overwrite a published immutable family.

### Actual staging baseline (bytes and milliseconds)

| Viewport / page | Cold bytes | Warm bytes | Cold LCP | Warm LCP |
|---|---:|---:|---:|---:|
| 390 / /ru | 18,390,448 | 18,390,448 | 3,360 | 2,024 |
| 390 / /ru/catalog | 14,358,957 | 14,358,129 | 2,664 | 1,820 |
| 390 / /ru/product/46 | 9,723,866 | 9,723,036 | 5,248 | 2,552 |
| 390 / /ru/brands/romanson | 7,630,805 | 7,629,977 | 2,712 | 3,076 |
| 1440 / /ru | 12,883,361 | 12,883,361 | 2,956 | 2,308 |
| 1440 / /ru/catalog | 16,083,283 | 16,082,455 | 3,244 | 1,616 |
| 1440 / /ru/product/46 | 9,722,878 | 9,722,048 | 5,324 | 2,088 |
| 1440 / /ru/brands/romanson | 21,140,222 | 21,139,394 | 3,596 | 4,724 |

### Controlled local replay (complete initial observation, bytes / ms)

| Viewport / page | Cold bytes before → after | Saved | Requests before → after | Cold LCP before → after | Warm bytes before → after |
|---|---:|---:|---:|---:|---:|
| 390 / /ru | 18,320,734 → 847,371 | 95.37% | 13 → 13 | 516 → 360 | 2,680 → 0 |
| 390 / /ru/catalog | 14,354,618 → 513,802 | 96.42% | 9 → 9 | 448 → 348 | 2,989 → 0 |
| 390 / /ru/product/46 | 9,721,145 → 313,167 | 96.78% | 7 → 9 | 292 → 236 | 1,917 → 0 |
| 390 / /ru/brands/romanson | 7,628,200 → 232,332 | 96.95% | 5 → 1 | 360 → 192 | 1,918 → 846 |
| 390 / /en | 12,353,674 → 852,469 | 93.10% | 13 → 13 | 320 → 228 | 2,684 → 0 |
| 390 / /kz | 12,346,055 → 851,017 | 93.11% | 13 → 13 | 220 → 212 | 2,684 → 0 |
| 1440 / /ru | 12,880,205 → 560,859 | 95.65% | 10 → 10 | 216 → 184 | 2,722 → 0 |
| 1440 / /ru/catalog | 16,078,507 → 351,998 | 97.81% | 10 → 10 | 256 → 288 | 3,257 → 0 |
| 1440 / /ru/product/46 | 9,720,157 → 281,041 | 97.11% | 7 → 9 | 240 → 216 | 1,917 → 0 |
| 1440 / /ru/brands/romanson | 7,628,200 → 317,258 | 95.84% | 5 → 5 | 248 → 204 | 1,918 → 0 |
| 1440 / /en | 10,242,346 → 572,643 | 94.41% | 10 → 10 | 244 → 276 | 2,724 → 0 |
| 1440 / /kz | 10,238,958 → 571,837 | 94.42% | 10 → 10 | 256 → 212 | 4,244,112 → 0 |
| 360 / /ru | 28,096,847 → 783,307 | 97.21% | 23 → 14 | 212 → 164 | 4,020 → 0 |
| 360 / /ru/catalog | 16,098,087 → 289,494 | 98.20% | 12 → 9 | 188 → 308 | 3,257 → 0 |
| 360 / /ru/product/46 | 9,721,145 → 363,243 | 96.26% | 7 → 10 | 216 → 212 | 1,917 → 0 |
| 768 / /ru | 18,740,020 → 518,938 | 97.23% | 17 → 10 | 200 → 200 | 2,680 → 0 |
| 768 / /ru/catalog | 16,078,507 → 396,286 | 97.54% | 10 → 7 | 184 → 328 | 3,257 → 0 |
| 768 / /ru/product/46 | 22,743,530 → 281,041 | 98.76% | 14 → 9 | 244 → 212 | 3,793 → 0 |

### Slow replay (30-second cutoff; baseline has unfinished images)

| Viewport / page | Observed cold LCP before → after (ms) | Unfinished image requests before → after | Warm LCP before → after (ms) | Warm image bytes before → after |
|---|---:|---:|---:|---:|
| 390 / /ru | 8,808 → 3,576 | 11 → 0 | 420 → 220 | 5,916,378 → 0 |
| 390 / /ru/catalog | 5,296 → 3,500 | 8 → 0 | 396 → 232 | 5,948,723 → 0 |
| 390 / /ru/product/46 | 3,716 → 4,228 | 4 → 0 | 384 → 224 | 5,995,097 → 0 |
| 1440 / /ru | 8,652 → 3,184 | 10 → 0 | 380 → 252 | 5,897,724 → 0 |
| 1440 / /ru/catalog | 5,136 → 3,940 | 9 → 0 | 416 → 224 | 5,948,723 → 0 |
| 1440 / /ru/product/46 | 3,792 → 3,424 | 4 → 0 | 408 → 216 | 5,950,097 → 0 |

### Aggregate browser image timing (median ms, wire responses only)

| Run | Cold TTFB / download | Warm TTFB / download |
|---|---:|---:|
| before | 936.45 / 759.23 | 801.26 / 573.03 |
| replay-before | 13.33 / 12.93 | 2.32 / 0.18 |
| replay-after | 6.91 / 0.83 | 1.84 / 0.3 |

Timing uses CDP requestTime/receiveHeadersStart/receiveHeadersEnd, not delayed responseReceived event dispatch. Cache-only responses have no network TTFB/download to report. Normal final replay maximum CLS: 0.000577. Maximum image preloads: 4 before, 2 after. Full URLs, dimensions, timings, priorities, LCP elements and cache flags are in the JSON evidence beside this report.

The strongest complete-grid comparison is independent of lazy-loading thresholds:
after scrolling all nine catalog cards, product image wire bytes fell from
16,018,491 to **574,174 mobile (96.42% less)** and **305,702 desktop (98.09% less)**.
All 15 rendered Romanson cards fell from 24,498,740 to 890,460 mobile and 477,268
desktop. These include wire overhead; the 16,015,944 figure above is payload only.
There were no pending requests at the end of these full-grid runs.

The gallery comparison is page-initial transfer, before lightbox interaction.
No repeated identical image URL requests were recorded within any normal staging
or local page visit (cold/warm analyzed separately). Small thumbnails and main
variants can create more distinct requests than a
single reused original URL (7 → 9 total page image requests), while dramatically
reducing bytes and decoded source sizes. Opening a lightbox deliberately fetches
one full original; advancing fetches the next selected original. It is not valid
to count that intentional full-resolution view as an initial-page optimization.

Slow-network baseline LCP is **provisional**: home still shows consent text as
the largest painted element, and product shows the page banner while original
gallery downloads remain unfinished. Optimized mobile product LCP is the actual
clock photograph. Therefore the raw 3716 → 4228 ms values do not demonstrate a
product-image regression: the baseline clock still had not finished downloading
at the 30-second cutoff. Slow warm baseline also follows an incomplete cold run
and is not a fully primed cache. All optimized slow warm cases transferred zero
image bytes; requests were served from browser cache.

Image CDP records retain response timing, HTTP/wire status, cache markers, ETag,
priority, initiator and completion. DOM snapshots retain displayed/natural sizes,
srcSet/sizes, LCP element and CLS. Native width descriptors may density-correct
naturalWidth; use manifests/audit metadata for encoded pixel dimensions.

## 7. Variant specifications and lifecycle

| Area | Candidates (source-clamped, deduplicated) | Encoding |
|---|---|---|
| Product | 160, 320, 480, 800, 1200, 1600 px | WebP q88, alpha q100, method 4, sharp YUV, ICC retained |
| CMS | Product widths + 1920, 2560 px | Same; mobile/desktop originals remain distinct |
| Static assets | 160 through 2560, only smaller than source and smaller in bytes | sharp WebP q90, alpha q100, effort 4; original retained |
| Lightbox | Original, selected image only | Original bytes unchanged |

Keys are `product|cms/responsive-v1/<uuid>/<source-sha256>/<width>x<height>/wN.webp`
and `original.<ext>`. No upscaling. Presence of a persisted original family key
promises every advertised candidate exists. Old/signed/arbitrary URLs are never
guessed into a derivative path. GIF, APNG and EXIF-bearing JPEG retain originals
to avoid flattening animation or changing orientation. AVIF was not adopted:
WebP already exceeded the byte target and adding another codec/memory workload
has no demonstrated benefit for this constrained host.

S3 writes include Content-MD5, SHA-256 metadata and If-None-Match: `*`. Actual
staging-digest MinIO integration proved checksum rejection (BadDigest), overwrite
rejection (412), round-trip original bytes and bounded family cleanup. A failed
encoder does not create a partial advertised family. No image GET can encode.

## 8. Public caching

- New insert-only UUID/family objects: one-year public immutable metadata.
- Existing recognized UUID images without origin policy: one-hour public cache.
  Their paths are preserved; no mutable arbitrary URL gets an immutable fallback.
- Completed versioned families without origin policy: one-year public immutable.
- Signed queries, non-benign queries or Authorization: private, no-store.
- Unknown paths and failed responses: no generated cache policy. Only successful
  200/206/304 responses receive it. ETag, Last-Modified and conditional forwarding
  remain intact. Origin cache policy is honored for eligible unauthenticated GETs.
- No proxy cache, paid CDN, disk reservation, new instance, admin/API response
  cache, exposure of MinIO console/API, Redis, PostgreSQL or Actuator was added.

An isolated Nginx gateway passed eight checks: legacy policy, immutable family,
ETag/304, signed/authenticated private policy, POST denial and two uncached 404s.
See [cache evidence](cache-verification.json). This is configuration validation;
host-Nginx end-to-end verification must be repeated after an authorized rollout.

## 9. CPU/RAM implications

The storefront retains its 0.20 CPU / 512 MiB / 192 MiB cache-tmpfs limits. Product
and CMS bytes are served directly; no new storefront image conversion is used.
The backend keeps 0.80 CPU / 2 GiB. One native encoder slot is shared; contenders
keep originals instead of queuing. The whole product upload batch shares a
20-second encoding deadline; CMS has 20 seconds. Existing limits remain 10 MiB
per source, 10 files per batch, 25 MP / 10,000 px, with 32 MiB derivative output.
Temporary source/output files are deleted; originals survive all fallbacks.

Local Docker benchmark used the final runtime codec at a 0.80 CPU quota and a
256 MiB container bound (codec-only, **not** the complete JVM or the GCP VM):

| Input / work | Wall time | Cgroup CPU time | Peak container memory |
|---|---:|---:|---:|
| Actual 1254×1254 catalog photo, six widths through 1254 | 10.481 s | 9.751 s | 50.69 MiB |
| Synthetic 5000×5000 bound probe, six widths through 1600 | 24.643 s | 17.629 s | 195.09 MiB |

The second is a resource probe, not replacement product photography; it exceeds
the runtime deadline and would fall back to the original. Native-process memory
is additional to the existing JVM. The actual 4 GB staging host has less headroom
than the runbook's historical 8 GB reference. Fresh whole-VM/JVM peak RAM and
concurrent-load effects were **not** measured; monitor them during the first
authorized upload batch and disable new encoding if needed. No claim of live VM
resource reduction is made. Ten prepared images retain 17,865,831 original bytes
and add 5,386,790 derivative bytes; storage growth must be reviewed per batch.

## 10. Quality and visual regression

Compared actual before/after captures at 360, 390, 768 and 1440 px and RU/EN/KZ.
The photo selection, mobile/desktop composition, layout, aspect ratios, controls
and text geometry remain. A detected under-resolution of tall object-cover
banners was corrected before final captures. Product dial lettering, metallic
colors, straps and transparent boundaries were visually inspected at displayed
sizes in a four-watch original/480 px comparison. No synthetic photos were used.

No broken images, horizontal overflow, page errors or unexpected production
requests occurred in the final normal replay. Maximum normal CLS is recorded in
the evidence summary; small sub-0.002 changes exist, so this is not a claim of
identical pixel output or zero measurable layout movement. No new design/Figma
reference was supplied. See the retained screenshots and
[quality comparison](quality-comparison.png).

## 11. Actual verification outcomes

- Storefront: **275 tests / 47 files passed**, typecheck, lint and production build
  passed. Security headers 3/3, sharp security and glob guards passed.
- Static media: **206 variants / 39 originals** passed checksum, type, dimensions,
  aspect-ratio, size and actual transparency checks. Original static files did not change.
- Performance budgets passed without raising limits: public assets 16.90/24 MiB,
  storefront JS 1.48/1.65 MiB, existing CRM JS 1.52/1.53 MiB.
- Production-route/status checks passed (valid 200, absent 404, temporary failure
  not converted to 404, locale/indexing/security checks). No deployed production test ran.
- Backend full suite: **365 tests, 0 failures/errors, 1 skip**; final changed-area
  rerun: **19 tests passed, 0 skips**, including actual native encoding and the new
  isolated MinIO integration. Final backend Docker build passed.
- Final local backend Trivy High/Critical **fixable** vulnerability gate passed
  with zero findings. Frontend npm audit high gate passed; **3 low and 16 moderate**
  findings remain in the existing dependency graph. They were not silently fixed
  by unrelated dependency updates or hidden by a weaker gate.
- Browser: 36 real staging baseline cases; 36 normal local before and 36 after;
  12 slow before and 12 slow after; 8 full-grid scroll cases; 6 interaction/failure
  checks. Gallery focus/Escape, selected-only originals and both product/CMS
  fallback chains passed. Eight isolated gateway assertions passed.
- Backfill: 10 images / 65 objects prepared, identical manifest on repeat;
  changed source checksum and 11-image batch rejected. **Zero external writes.**

## 12. Existing-media backfill

Review [explicit sample input](backfill-sample-input.json),
[manifest](backfill-sample-manifest.json), [validation](backfill-validation.json)
and [ROLLBACK-only SQL](backfill-review-only.sql). Preparation retains all originals
and does not connect to PostgreSQL/MinIO for writes. It covers nine catalog images
and one CMS image, not the entire media library. Additional gallery siblings and
mobile/locale banners require separate selected batches. Reproduction and the
checksum/conditional-write/reference/revalidation protocol are in the tool README.

Do not apply the plan before separately reviewing the exact runtime codec,
checksums, target rows, CMS dependencies and batch authorization. Upload and GET
verify every object before committing any DB reference. Old keys remain intact;
no destructive schema migration or original deletion is part of the plan.

## 13. Authorized future rollout and rollback

1. Review this local commit and obtain separate publication/deployment approval.
   Follow the established immutable SHA Release Images pipeline; do not push,
   merge or publish as part of this task, reuse a SHA, use latest or retag d8e6616.
   Retain digests/attestations and validate the public preview API/media contract.
2. Use the actual installed host context from the November 3 deployment report:
   `/opt/vympel/repository`, `/etc/vympel/staging.env`, the repository single-VM
   Compose file **and** `/etc/vympel/compose.host-ports.yml`. Verify current state
   read-only before acting; do not substitute the historical 8 GB reference setup.
3. Verify PostgreSQL and MinIO backups, select the new recorded digests, preserve
   resource limits/ports/Basic Auth/noindex, and use the established staged rollout
   and health/smoke verifiers. Deploy source/config through that process, not edits
   inside running containers. No new Liquibase changeset is required.
4. Verify gateway headers, security boundaries and a small new upload; monitor
   encoder fallback logs, backend latency/CPU/RAM and VM headroom. Apply only a
   separately approved media batch. Trigger normal CMS revalidation where needed.
5. Repeat authenticated public cold/warm/slow browser measurements and visual
   checks against the deployed SHA. Reject broken photos, checksum conflicts,
   OOM/resource pressure, exposed private paths or unacceptable visual changes.

If needed, disable new encoding with `VYMPEL_IMAGE_VARIANTS_ENABLED=false` through
the reviewed configuration rollout; existing variants still work. Roll application
digests/config back to d8e6616 using the established procedure and both Compose
files. Older code can still display family originals through the unchanged URL
DTO. Restoring reviewed old media references is separately controlled; originals
were retained. Do not delete volumes, reverse Liquibase history or delete media
as an application rollback shortcut. Old code does not collect derivative
families on later media deletion, so retain any resulting orphans for a separately
reviewed cleanup rather than expanding rollback into a destructive migration.

## 14–15. Commit and remaining boundaries

The exact task-only local commit SHA is provided in the final response; the commit
containing this report is the review candidate. Unrelated pre-existing changes
remain outside it. No source blocker remains after the listed checks.

Separate authorization is still required for push/merge, immutable publication,
deployment and applying any live backfill. Actual post-change staging LCP/cache
and whole-VM resource validation remain rollout gates, not completed measurements.
Animated/EXIF images intentionally retain their original cost. Local evidence
does not assert WebP byte identity between the measured Windows and runtime codecs.
