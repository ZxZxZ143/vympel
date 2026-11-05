# Matched visual inspection

PASS — directly inspected four final baseline/candidate screenshot pairs from `baseline-matrix-admitted` and `candidate-matrix-admitted`, using the final candidate image recorded in the build receipt:

| Pages | Viewport / DPR | Files on each side |
| --- | --- | --- |
| Home | 390 / 2 | `4G-normal-390-home-rail.png` |
| Home | 1440 / 1 | `4G-normal-1440-home-rail.png` |
| Product 56 recommendations | 390 / 2 | `4G-normal-390-56-rail.png` |
| Product 56 recommendations | 1440 / 1 | `4G-normal-1440-56-rail.png` |

Images were captured after the warm window and the same scroll-to-rail step, before next navigation, with the same cookie-banner state. Product order, first-view images, image fit/aspect, card boundaries, gaps, text wrapping, prices, favorite/cart controls, desktop arrows and mobile navigation show no visible difference in these pairs. The desktop home banner and card overlap also match. No new blank or broken image is visible. File hashes are retained in `visual-checks.json` as supplementary evidence.

Mobile has two visible cards; desktop has three full cards and a narrow part of the next card. That existing layout explains the four-image SSR bootstrap. The fixed cookie banner occludes the same lower content on both sides; separate functional regressions dismiss it before exercising controls.

This is a comparison against the published application, not a Figma implementation or a claim about every page/state. Automated geometry and CLS checks cover the complete matched matrix separately. Functional last-position, no-JS and resize screenshots are retained in `candidate-regression-complete`.
