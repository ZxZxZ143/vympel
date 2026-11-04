# Gallery release and ten-reference retry

This is an operator preparation package. The new storefront must first pass immutable publication and staging deployment. The ten-row transaction requires its own authorization after that deployment. The current application is `0c538aa8a872bd1586c88488bfff136d8f3b049e` and its media references are restored.

## Admission before any future reference change

1. Pin the **deployed** candidate source, OCI index and amd64 child for all three applications from the successful Release Images manifest. Confirm the VM ID `3531996634123212598` in `vympel-staging`, `me-central1-b`. Use the installed Compose pair and confirm all seven services, existing data-container IDs, networking, mounts, limits, backups, host Nginx/TLS, preview/CRM authentication and noindex. Record CPU, memory, swap and disk headroom. A new OS Login registration requires separate operator authorization.
2. Re-read the restored snapshot at `/var/backups/vympel/backfill/20261104-ten-0c538aa/snapshot.private.json`. Compare all 142 `media`/`cms_media` rows, all 92 Liquibase checksums/order and clear lock, all 251 original bucket-file hashes and the ten original bodies. Capture a **fresh private snapshot for this retry**, including full affected rows, CMS timestamp and dependencies, current object hashes, signed outbox state and rollback configuration. Retain the previous snapshot and recovery bundles. [Latest read-only admission](staging-readonly.json)
3. Independently read the 65 **existing** objects. The reviewed manifest digest must be `0effd7c78b16ece3ee0362a1d24bdfce64fd4bb3417324c89118e129492d725f`. For every key require private authenticated HEAD/GET, exact bucket, key prefix/source UUID, length, MIME, SHA-256 metadata and body hash. Require immutable cache policy, public HTTPS GET 200 and conditional `If-None-Match` 304. Re-read the ten old public originals and compare their pinned hashes. Stop on a missing, extra, mismatched or ambiguously owned family. This retry has **zero planned object writes**. [Verified object manifest](reviewed-manifest.json)
4. Require the exact nine product rows below to remain their active product's main image. CMS row 17 must remain `ACTIVE`, `OBJECT_STORAGE` and referenced only by the RU desktop slot in published block 1, `home.heroSlider.slide1`. Its expected original timestamp is `2026-10-24T16:27:23.787916+00:00`. EN/KZ desktop IDs are 22/18, and mobile RU/EN/KZ IDs are 21/19/20. Recheck foreign-key consumers, `cms_banner_media`, `media_i18n` and the existing `home` job. Stop on additional owners, ambiguity, a changed row or an in-flight job. [Exact old/new keys and row fingerprints](staging-readonly.json)

| Product | Product media row | Product | Product media row | Product | Product media row |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 46 | 90 | 54 | 101 | 35 | 75 |
| 53 | 100 | 7 | 25 | 56 | 103 |
| 64 | 111 | 37 | 77 | 11 | 29 |

5. On the newly deployed release, **before the reference change**, capture the six hero compositions, page screenshots, gallery interactions with legacy originals, public DTOs for RU/EN/KZ and the matched 92-condition performance baseline. Store the current page samples and measurements in a new evidence directory. Do not use 0c538aa measurements for the new release's before/after comparison.

## Guarded apply and restoration

Only an approved operator on the verified staging host should use these scripts. Use the existing private PostgreSQL connection, supply a new UUID per outbox request and keep the result private until sanitized. They use psql variables and `ON_ERROR_STOP`. A failed check aborts the transaction, including the outbox write.

```sh
# Future apply, after fresh admission and separate authorization
psql -X -v request_id="$FORWARD_UUID" -f retry-apply.sql
# Record the successful COMMIT, request UUID and exact CMS timestamp printed by the script.

# Restoration if any subsequent mandatory gate fails
psql -X -v request_id="$RESTORE_UUID" -v forward_request_id="$FORWARD_UUID" \
  -v cms_applied_at="$COMMITTED_CMS_TIMESTAMP" -f retry-restore.sql
```

The forward script locks the selected products, media rows, CMS page/block and `home` outbox job in a serializable transaction. It checks ID, unique old key, owner, complete row fingerprint and expected affected count before each update. It changes only nine URLs and the CMS key/timestamp. Its outbox statement is the repository's deduplicated `home` job. Require that the existing backend worker delivers a signed request for the **same UUID** and records `SUCCEEDED`. Read back all ten transitions, the remaining 132 media rows and unrelated-table fingerprints independently. Any failure requires exact reference restoration. [Forward SQL](retry-apply.sql) · [Restoration SQL](retry-restore.sql)

The reverse script checks the forward request ID, exact committed CMS timestamp, new key and owner. It normalizes the expected changed fields to compare the rest of each row with its original fingerprint. It restores the ten original keys and the original CMS timestamp, and queues a new signed `home` refresh. Confirm the restored snapshot and the new request's `SUCCEEDED` state. A stale receipt or concurrently edited row stops the script. Preserve evidence and inspect the conflict before any further action. Retain all legacy objects and all 65 new objects. The release rollback and the media rollback are separate procedures. [Local PostgreSQL 16 rehearsal](sql-rehearsal.json)

## Mandatory acceptance after a future authorized retry

| Gate | Evidence required before acceptance |
| --- | --- |
| A. Catalog | At 390 and 1440px, scroll each of the nine targeted catalog cards into view. Require a decoded `currentSrc` in its own verified family, `image/webp`, valid `srcSet`/`sizes`, HTTP 200, no completed broken image and no overflow. Record the selected URL. |
| B. Gallery readiness | Open `/ru/product/46` in a fresh authenticated browser context. Require gallery `aria-busy="false"` and enabled main/thumbnail buttons. Preserve early pointer and readiness timestamps if a check fails. Image decoding alone cannot satisfy this gate. |
| C. Selection | Select thumbnail 2 and observe its visible button become `aria-pressed="true"`. Select 1 and require the same acknowledgement. Verify the selected main image belongs to product 46's verified family. |
| D. Pointer and keyboard | Activate the main trigger by pointer and then by keyboard in separate open/close cycles. Require one accessible Radix dialog with a title. Repeat at both widths. |
| E. Original | Observe image requests from navigation onwards. No full responsive original should load before zoom. Each open dialog must contain one decoded full original matching the pinned key and SHA. Preserve the responsive main and thumbnail selections. |
| F. Close and focus | Close by Escape and by the labelled close button. Require the dialog to disappear and focus to return to the selected main trigger. Exercise next/previous image and focus retention. Use the updated executable B–F check below. |
| G. CMS and fallbacks | Compare all six before/after hero compositions. RU desktop must decode the selected CMS 17 WebP with sizes/srcset. RU mobile and both other locales must keep their own previously captured compositions. In separate browser contexts, inject derivative-only 404s and then derivative-plus-original 404s for the exact product/CMS family. Require decoded original or existing placeholder/static fallback as appropriate. Record actual injected requests. |
| H. Integrity/security | Independently compare all 65 object checksums/MIME/dimensions/cache/ETags/304, all ten legacy originals, the remaining DB rows and 251 old bucket files. Require the same TLS fingerprints, Basic/Bearer boundaries, CORS, preview global noindex and existing 401/404 restrictions. Confirm 33 matched public DTOs reflect only the approved references. |
| I. Real performance | Run the same before and after protocol on preview. Use 390/DPR2 and 1440/DPR1, the identical RU/EN/KZ samples, normal 6.5s and slow 30s at 1.6/0.75 Mbps with 150ms latency. Bootstrap Basic Auth only at preview `robots.txt`, disable Fetch interception, clear browser cache in a fresh context, prime measured URLs outside the cold observation window, and repeat in the same context. Record real cache hits, total and selected bytes, network timing, actual LCP element/URL, CLS, pending requests and six screenshot pairs. Keep the two repeated normal primary-route samples. The 92 before and 92 after tuples must match exactly. |
| J. Service safety | Monitor immutable release and seven original service identities, CPU/RAM/swap/disk through the entire bounded window. Preserve production routing, limits, volumes, migration history, app images and credentials. Fail on OOM, unhealthy/restarted services, stale monitor, sustained resource pressure, unexpected writes or unmet acceptance before the deadline. |

```sh
# Future staging B–F gate. Credentials are supplied only in the process environment.
node scripts/image-performance/check-backfill-gallery.mjs \
  docs/tasks/gallery-retry-2026-11-04/reviewed-manifest.json FRESH-gallery-receipt.json
```

The retained measurement runner is `docs/tasks/image-backfill-ten-2026-11-04/browser.mjs`. Use a fresh `IMAGE_EVIDENCE_DIR` for each phase, `IMAGE_TEST_SLOW=false` / `true`, and the same browser channel and runner hash throughout. Its Basic Auth setup differs from the **functional** B–F check, which may use `httpCredentials` because it does not measure cache performance. Keep its warm hit counts and selected-family metrics distinct from total page transfer. Before any future COMMIT, start a finite resource monitor and arrange exact automatic rollback on a failed gate, lost acceptance signal or expired deadline. The previous operation's completed watcher, markers and SQL receipts cannot be reused.

## Release boundary

Use the existing `.github/workflows/release-images.yml` on `main` with [the reviewed publication inputs](publication-inputs.json). Record the immutable candidate from the final report, confirm that `main` still equals its expected parent, verify fast-forward ancestry and that all three new SHA tags are unambiguously absent with known-good registry controls. Only after publication approval, push the exact SHA non-force and dispatch **once**. Require all source/security/native builds, finalized indexes, attestations, amd64 and arm64 runtime checks, manifest and final SUCCESS. Independently verify the three published registry indexes, six platform children, public origins, codec and provenance. A partial or ambiguous publication stops the deployment.

Staging deployment requires its own explicit authorization and fresh recovery. Use the installed two-file Compose configuration on the existing VM. The pre-gallery application rollback target is the actually running `0c538aa` and its freshly captured environment. Preserve the earlier `d8e6616` release history. After deployment verify the new public release, readiness contract and legacy gallery first. Authorize the **ten-row, zero-upload** retry separately only after this admission succeeds. No reference change or release publication/deployment was performed during this preparation.
