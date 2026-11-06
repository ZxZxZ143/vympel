# Storefront motion and footer store link — local verification (2026-11-06)

Scope: `vympel_front` only. Local commit, not pushed or deployed.

## What changed

* `HomeMotion` (the existing home GSAP/ScrollTrigger orchestrator) now takes `variant`:
  `full` (default, unchanged home choreography) or `minimal` (only `reveal` / `stagger` / `data-motion-inner`, opacity + transform).
  A debounced body `ResizeObserver` (`HOME_MOTION.refreshDelay`, 200 ms) calls `ScrollTrigger.refresh()` so sections that move
  after filters, pagination or streamed content still cross their start.
* Full variant with the home `data-motion` markup: About, Brands list, brand page (header/history; product grid excluded),
  guarantee/delivery/payment (`InfoPageLayout`: text blocks, warranty badges, store photo unveil, contacts).
* Minimal variant: catalog lower sections (marketplaces, contact banner, benefits) and product recommendations + contact banner.
  Filters, sort, search, grid, pagination, gallery, model selector, cart/favorite actions and tabs are outside every motion root.
* Footer "Наш магазин" / "Our Store" / "Біздің дүкен" (mobile card and desktop column) links to
  `https://2gis.kz/almaty/geo/70000001028382844` with `target="_blank" rel="noopener noreferrer"` and a localized `footer.shopAria`.

## Gates

`npm run test` (51 files / 290 tests, incl. new `Footer/index.test.tsx` and motion-variant cases), `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:budgets`
(storefront static JS 1.50 / 1.65 MiB) — all passed.

## Stand verification

Stand: `stand.ps1 Restart -Rebuild` with a fresh `bootJar` (PostgreSQL 55440, backend 18080, storefront 3300), left running.
Headless Edge via Playwright (`verify-motion.mjs`, `cls.mjs` in this folder; raw results in `motion-verify.json`).

* Routes: `/ru`, `/ru/about`, `/ru/brands`, `/ru/brands/romanson`, `/ru/delivery`, `/ru/guarantee`, `/ru/payment`,
  `/ru/catalog`, `/ru/product/100` at 390×844 and 1440×900, with `prefers-reduced-motion` `no-preference` and `reduce`.
* Every route: HTTP 200, no page or console errors, nothing hidden inside the first viewport, zero targets hidden after a full
  scroll pass, no horizontal overflow, CLS 0 except the home page (see limitation).
* Reduced motion: zero targets ever hidden on every route and width.
* JavaScript disabled (390 px): zero hidden targets on About, delivery, catalog and product.
* Catalog: no `data-motion` inside the toolbar or product grid; page 2 navigation took ~130 ms in the harness and the lower
  sections still revealed afterwards (stale-trigger regression check).
* Product: gallery not animated; the only buttons inside motion targets are the favorite/cart buttons of recommendation cards,
  which stay clickable while they fade in.
* Footer link: two anchors per locale (RU/EN/KZ) with the 2GIS URL, `_blank`, `noopener noreferrer` and the localized label.

## Limitations

* Home page at 390 px shows one layout shift of 0.0398 when the Philosophy copy is split into SplitText line masks
  (`home-motion-line-mask`). Home motion markup is unchanged by this task; the shift predates it (not re-measured on the old
  build) and is left as a follow-up. No other page uses `lines` at a width where it shifted.
* The desktop app's Browser pane was hidden, so GSAP did not tick there; all measurements come from headless Edge.
* Stand products have no photos (built-in fallback), so image-specific visuals were not judged.
