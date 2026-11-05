# Local carousel discovery protocol — 2026-11-05

Scope: frontend implementation and local admission only. The accepted staging SHA is `292d086d59f4198fb4efb40d48c08630e52e29f5`. No GitHub/GHCR writes, deployment, SQL, MinIO mutation, encoding of the next batch, OS Login renewal, or production operation is part of this task.

## Controlled applications and inputs

The baseline is the exact published linux/amd64 child `ghcr.io/zxzxz143/vympel-storefront@sha256:1dd91655b7efcf1e56617553c788e11aaf140e67ab3b8a7f4d8e28f72bc4571d`. The candidate is a local production Docker build with the same canonical preview/API/media origins, staging flags and accepted release metadata. Its local image identity and changed-source hashes are recorded in the build receipt. This image is not published, and the retained baseline metadata does not designate it an accepted release.

Both run with Docker network `none`, read-only API/media fixture mounts, the same frozen public JSON and exact image bodies. An in-container GET adapter serves SSR reads. A loopback relay and TLS server preserve browser origins `preview.vympel.kz` and `api.vympel.kz`; process-only certificate SPKI pinning and DNS mapping do not modify global trust/DNS. Other hosts fail closed. No Playwright routing or `httpCredentials` is used in performance measurement. Basic Auth is bootstrapped on robots.txt through temporary CDP Fetch handling, then interception is disabled and ordinary HTTP cache is enabled. Analytics/write endpoints are blocked.

The ten accepted references were verified through fresh public GET responses. Fixtures do not replace them with legacy URLs or invent another media family. Existing downloaded bodies are rehashed; missing existing static Next optimizer responses are retrieved by GET and shared by both sides. No new batch encoding is performed.

## Matched matrix

Each side runs all 48 combinations: `/ru/product/56`, `/ru/product/46` and `/ru`, 390px/DPR2 and 1440px/DPR1, normal and controlled slow transport, forced reported ECT 3G and 4G, cold and warm HTTP cache. Browser version is recorded. Slow transport is 150ms latency, 200,000 B/s down and 93,750 B/s up; forcing ECT is a separate variable. Normal is unthrottled loopback and cannot represent internet latency.

Admitted measurements use `Network.emulateNetworkConditionsByRule` for actual request throttling and the browser flag for ECT, verifying the reported type before navigation and at cutoff. Unlike the deprecated combined command, by-rule throttling leaves navigator state independent; this distinction is documented in the [Chromium protocol source](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/Network.pdl). A four-control probe downloaded the same 2,135,712-byte frozen image in 22–29ms unthrottled and 10.89–10.97s at 200,000 B/s, retaining the requested 3g/4g in both cases. The deprecated combined command produced an ECT mismatch in a slow/3G diagnostic; that incomplete matrix is excluded, and both complete sides use the corrected protocol.

Cold uses a fresh context and cleared HTTP cache. The observation ends 6.5 seconds after DOMContentLoaded on normal transport or 30 seconds on slow transport. Only image URLs actually requested in that cold window are fully decoded in a separate inert priming page, outside timing. Warm uses that same context after priming, with the original transport conditions restored. A warm prime is not a promise about new URLs discovered later. No navigation/scroll experiment occurs before the cold and warm measurements have both completed.

CDP records exact URLs, request start/initiator/priority, completion and partial bytes, direct cache signals, wire HTTP 304, response cache headers and failures. DOM samples every 200ms record all cards, horizontal and viewport visibility, mounted resources, responsive attributes and geometry. LCP keeps the actual element/URL and load/render times; CLS and broken images are retained. Completed wire bytes include headers. Pending bytes and requests are separate from completed transfers and must not be presented as completed savings. Direct hits are not inferred from HTTP 200 alone.

After both windows, the same transport remains in effect: scroll to the first rail, wait 1.8 seconds, activate next with the keyboard, and observe for at most about 15 seconds. A settled target's image-ready delay is separated from the animation/polling delay. Pending slow images are reported rather than reclassified as successful. Unthrottled cleanup decoding happens after the interaction cutoff solely to verify eventual correctness. Arbitrary cold jumps beyond a bounded adjacent range cannot guarantee an already downloaded multi-megabyte original.

Fixtures are run sequentially for admitted comparisons. The first baseline matrix was exploratory: it had a missing static width and an overlap with independent live timing collection. The second stopped at an asserted ECT mismatch. Both are retained and excluded from final paired results; only the complete `matrix-admitted` directories enter the comparison. Earlier probes/builds and test-harness failures are also retained; they do not silently become passed gates.

## Functional and accessibility admission

Production browser tests exercise all 12 recommendation cards, actual forbidden far-image requests, bounded initial activation, first/last/next/previous, keyboard and focus, local cart/favorite state, product navigation, responsive families, original/placeholder recovery, resize/reInit, mobile/desktop screenshots and the existing pointer/keyboard original-on-demand lightbox verifier. The ordinary catalog contract remains default-on in GoodCard. Static image priorities and banner code are unchanged.

The durable network/geometry evidence gate is `node vympel_front/scripts/check-carousel-discovery-evidence.mjs BASELINE_DIR CANDIDATE_DIR`. It requires all 48 matched tuples, unchanged content/links/families/geometry, a reproduced baseline leak and zero far-resource requests after the change. Its negative controls must reject a deliberately injected far request and changed card width. Parser-time attribution has 200ms DOM-sampling resolution; no claim of sub-frame visibility timing is made.

For the fixed-position cold/warm windows, far means outside the final styled initial horizontal range plus its single neighbours and four SSR bootstrap images. Request-time visibility is a separate approximate sample attribute. A preceding sample may still have zero layout inside a hidden Next stream, or all vertically stacked cards before CSS; it cannot redefine that bound. One adjacent cache hit exposed this analysis issue; `analysis-correction.json` retains the exact timestamps and correction, applied equally to both sides without changing the independent network gate or raw observations.

The real homepage is tested with scripting disabled, including native horizontal scrolling to the last card and all SSR image fallbacks. A separate local harness uses the actual GoodsCarousel/Embla/ResponsiveProductImage with a thin card to isolate absent IntersectionObserver, ResizeObserver, MutationObserver and absent carousel API from unrelated application widgets. It also exercises independent rails and live short/empty/reordered data. Missing MutationObserver requires host-side polling because Playwright's page.waitForFunction itself depends on MutationObserver; this is a test-tool constraint, not an application fix.

Product recommendations are inside an existing streamed Next Suspense boundary. Their normal no-JS production document can remain in a hidden streaming container until Next's script runs; baseline and candidate must be compared explicitly. The local carousel change does not claim to repair that server streaming limitation. The homepage and isolated SSR carousel fallback are evaluated separately.

## Separate live timing

Nine read-only browser navigations cover three repeats of product 56, catalog and home with cold HTTP cache and an already authenticated connection pool. Navigation Timing and CDP distinguish DNS, TCP/TLS, request-start delay, response wait, download and browser/image render delay. Zero DNS/TLS values on reused connections do not prove zero connection setup cost. Three separate curl processes additionally measure fresh TCP/TLS connections. Browser/server wait includes network/edge/application time; it is not a backend compute measurement. No infrastructure changes follow from these samples.

## Preservation and review

Accepted ten-reference and warm-investigation evidence seals are checked before and after. Existing unrelated working-tree changes remain unstaged. The next ten media candidates remain seven main images plus three product-46 gallery images. Their old cwebp 1.6.0 estimates are not measurements of deployed cwebp 1.2.2. Private owner/lifecycle checks and any future encoding/upload/reference write require separate authorization.

A focused local commit is permitted only after applicable gates pass. Publication/deployment still requires explicit operator approval. Local fixture numbers are never reported as deployed staging improvements.
