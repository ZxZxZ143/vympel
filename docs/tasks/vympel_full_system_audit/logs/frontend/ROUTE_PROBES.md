# Public Frontend Route Probe Evidence

Audit date: 2026-07-16. Base URL: `http://localhost:3000`.

- Home, catalog, brands, delivery, guarantee, payment, favorites, cart, about, product 45, `WATCH_WRIST` catalog, and the Romanson brand page returned 200 in `ru`, `kz`, and `en` (36 route/locale combinations).
- Each locale root emitted the corresponding `html[lang]` value and a viewport meta tag.
- Product 45 rendered the Russian text `Похожие товары пока не найдены` in server HTML, proving the forbidden recommendation empty message is customer-visible.
- Unknown public path, missing product, unknown catalog category, and unknown brand rendered 404 UI markup but returned HTTP 200 (soft 404).
- Timed warm local-development probes: catalog median 416 ms / p95 515 ms across 8 requests; product 45 median 497 ms / p95 535 ms across 8 requests. These are local dev measurements, not production SLO evidence.
- Runtime viewport screenshots and interactive overlay checks were blocked because the required in-app browser bootstrap failed with `Cannot redefine property: process` after a clean kernel reset.
