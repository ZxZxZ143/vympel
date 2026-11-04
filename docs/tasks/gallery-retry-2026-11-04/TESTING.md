# Gallery regression and reproduction

The real product details route is rendered by a local **production** Next server. The production-status mock supplies three gallery images. `/ru/product/46` uses legacy originals. On `/ru/product/47` the main image uses the verified responsive family and its siblings remain legacy. The browser runs at 390px/DPR2 and 1440px/DPR1. Each case holds application JavaScript requests while allowing the server HTML, CSS and images to load. It attempts a real pointer click, releases the scripts, and records gallery readiness and Radix dialog state on the browser's monotonic clock.

An unchanged baseline build reproduced an enabled zoom button and a lost click on both URL shapes at both widths. The user event reached the zoom button, the dialog stayed closed after hydration, and an explicit subsequent click opened it. The deployed incident has matching restored-state controls but no hydration timestamp for its original failed click. [Baseline production traces](reproduction.json)

The fixed SSR section is busy and its gallery controls are natively disabled. Once Embla publishes the hydrated main carousel API, the shared admission observes `aria-busy="false"`, verifies selection **2 then 1** via `aria-pressed`, and checks pointer/keyboard zoom, decoded main/thumbnail variants, the single decoded original, Escape, labelled close and return of focus. The responsive original is first requested on zoom. Both the legacy and responsive cases pass without a page error. [Fixed production traces](regression.json) · [Cached gallery and injected-404 regression results](replay-regressions.json)

Run from `vympel_front` using its locked dependencies, Node and an installed Playwright browser. Point `PLAYWRIGHT_MODULE` to the installed Playwright or playwright-core module if it is not on the module search path. The gallery regression blocks requests outside loopback. `GALLERY_MEDIA_DIR` is optional and accepts the existing local directory of reviewed objects for a byte-realistic run. Its fallback uses committed test image bytes. Neither path invokes an encoder.

```powershell
$env:NEXT_PUBLIC_APP_ENV='local'
$env:NEXT_PUBLIC_SITE_URL='http://127.0.0.1:19745'
$env:NEXT_PUBLIC_BASE_API_PUBLIC='http://127.0.0.1:19746/api/public'
$env:BASE_API_PUBLIC=$env:NEXT_PUBLIC_BASE_API_PUBLIC
$env:NEXT_PUBLIC_MEDIA_ORIGINS='http://127.0.0.1:19746'
$env:NEXT_PUBLIC_TELEMETRY_ENABLED='false'
$env:SITE_INDEXING_ENABLED='false'
$env:PLAYWRIGHT_MODULE='E:/vympel_full/.cache/image-optimization/browser/node_modules/playwright-core/index.mjs'
$env:GALLERY_MEDIA_DIR='E:/vympel_full/.cache/backfill-ten-20261104/plan'
npm run build
npm run test:gallery
```

`GALLERY_EVIDENCE` optionally selects a fresh output file for per-case timing evidence. To reproduce the **old** behavior, run this harness with `node scripts/test-production-status.mjs --reproduce-old-gallery` against a build of `0c538aa`. That diagnostic expects an enabled SSR button. Only `npm run test:gallery` is the fixed-release regression gate.

The existing replay browser suite also ran against a local server serving its precomputed fixtures, with encoding disabled. The gallery waits for acknowledged selection/open/close/focus and the fallback cases require an actual injected 404 followed by the intended decoded original or fallback. An initial replay attempt encountered an unprimed CMS homepage and its old fixed-delay assertion failed. The final replay first confirmed the intended CMS fixture was served, then all six tests passed.
