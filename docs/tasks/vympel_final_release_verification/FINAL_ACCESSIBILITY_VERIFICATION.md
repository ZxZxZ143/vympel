# Final Accessibility Verification

Date: 2026-07-19

## Automated Result

axe-core 4.12.1 with matched Chrome/ChromeDriver 150 reported **0 violations** on:

1. `http://127.0.0.1:3100/ru`
2. `http://127.0.0.1:3100/kz/catalog`
3. `http://127.0.0.1:3100/en/product/44`
4. `http://127.0.0.1:3101/login`

Evidence: `logs/e2e/axe-cli-release-final.log`.

Earlier scans are retained because they show the defect/fix chain. They detected heading-order and prohibited-ARIA issues against correctly configured real data, which were fixed before the final zero-violation run.

## Fixes Made

- `/kz` route maps to standards-correct HTML language `kk`.
- Muted and placeholder colors were raised to sufficient contrast; footer opacity reduction was removed.
- Product cards use context-appropriate H2/H3 hierarchy.
- Decorative category images use empty alternatives.
- Duplicate carousel landmark labeling was removed.
- Product error/not-found shells include a screen-reader H1.
- Goods carousels receive localized accessible names.
- Rating stars expose an explicit `role="img"` for their accessible label.

## Manual Checks

- One main landmark and a logical H1 were confirmed on current catalog/product/CRM states.
- Mobile sort/filter sheets and request dialog close with Escape and restore focus.
- Interactive controls in sampled flows had usable visible or accessible names.
- Semantic CRM tables remained present at the tested tablet width.
- No duplicate IDs, missing image alternatives, or document-level horizontal overflow were found in current sampled states.
- The mobile bottom navigation does not remain exposed as the active layer over modal catalog sheets.

## Coverage Limit

Automated scanning cannot detect every accessibility defect. This pass did not include formal screen-reader user testing, voice control, zoom/reflow above the captured widths, forced-colors mode, or a full WCAG audit of every dynamic state. These are recommended in staging; the repository also lacks a permanent checked-in axe/E2E suite (`FINAL-TEST-001`).

Verdict: **passes the tested accessibility gate for staging, with broader assistive-technology validation recommended.**
