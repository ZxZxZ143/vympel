# Product / CMS / CRM UX refinement

> Final release readiness and updated test/security results: [FINALIZATION.md](FINALIZATION.md).

Date: 2026-10-17
Branch: `codex/product-cms-crm-improvements`
Status: completed locally on the existing work; no deployment, image publication, commit, merge or dependency added.

> Follow-up: [all creatable characteristic pickers](CHARACTERISTIC_PICKERS.md) supersedes this pass’s protected-only native selects and checkbox feature list with a shared single/multiple portal picker.

## Result

* **Storefront discount:** shared small neutral badge at the top-left of each discounted card, separate from the favorite control. Final price is first and primary; original price remains struck through. The detail page reuses the same badge/price styling. Follow-up requested by the user: original Inter/h6/regular price typography is restored on mobile and desktop; the mobile size override and tabular numerals were removed, allowing normal wrapping. Discount calculations and server final-price precedence are unchanged.
* **CRM list:** one compact nonwrapping price/discount row with save/clear icons, compact stock and action buttons, smaller model text and variant thumbnails, restrained status chips and explicit column widths. All icon actions retain localized accessible names and titles. Full names/SKUs remain available through titles and edit navigation. At 1280px the 935px available table fits without horizontal overflow; mobile keeps a 920px table inside its own horizontal scroll container. Permanent deletion still appears only for archived products.
* **Storage notice:** floating bottom-center strip, max 64rem on desktop, moderate rounded corners and subtle shadow/border. Mobile copy/actions stack above navigation; details remain expandable and scrolling is bounded. RU/KZ/EN summaries are concise. Equal-weight necessary-only / analytics actions, consent persistence/reopening, analytics gating, actual storage disclosure and measured cart offset are preserved.
* **Reference cleanup:** removed `CatalogCleanupPanel` from the product list. Create/edit and bulk-create fields offer a separate trash action beside custom options, confirmation before any request, localized inline dependency/protection errors, an in-flight guard and success notification. A successful response removes the cached option and clears only its matching unsaved selections, including shared dictionaries and bulk rows. Protected-only fields keep native selects. Search, arrow/Home/End navigation, Enter/Space activation, Tab and Escape are supported; focus returns to the field after the dialog, including when the final custom option is deleted.
* **Browser findings fixed:** Node and Edge ICU disagreed on Kazakh grouping (`107 955` vs `107,955`), causing hydration errors. Price formatting now normalizes numeric separators for RU/KZ/EN, covered by a simulated-browser regression. The existing Markdown toolbar used translated labels as React keys; both list actions translated to “Список”. It now uses existing unique action IDs, with no content/editing behavior change.

## Fields with inline deletion

The same field adapters cover single-product creation/editing and bulk common defaults/per-row overrides. Trash is shown only for server-declared deletable reference options. Collections use their existing unused-only delete endpoint. Categories, brands, production countries and other canonical/non-creatable controls have no new delete action.

| Picker/field family | Existing deletion type | Coverage |
| --- | --- | --- |
| Collection | `collections` | Brand-filtered collection selectors, including bulk defaults/overrides |
| Watch mechanism | `watch-mechanisms` | Watch mechanism |
| Gender | `genders` | Gender |
| Case/accessory/interior materials | `case-materials` | Case material, interior case material, accessory body and insert material |
| Strap material | `strap-materials` | Shares the materials cache with all case/material fields |
| Glass | `glass-types` | Glass type |
| Stones | `stone-inlays` | Stone inlay |
| Colors | `colors` | Strap, dial, interior and accessory colors; shared cache/selection cleanup |
| Interior style | `interior-styles` | Interior style |
| Interior mechanism | `interior-mechanisms` | Interior mechanism type |
| Interior power | `interior-power-types` | Interior power type |
| Dial type | `watch-dial-types` | Watch dial type |
| Dial markings | `watch-dial-markings` | Dial markings |
| Watch power | `watch-power-sources` | Power source |
| Water resistance | `watch-water-resistances` | Water-resistance reference |
| Watch features | `watch-features` | Checkbox multi-select; trash is outside the checkbox label |

No API, database, permission, audit, archive-only deletion, collection/reference safety or banner-inheritance rule changed in this pass. New options returned by creation already carry the backend `deletable` property. No option is deleted locally when the server rejects it.

## Verification

| Check | Result |
| --- | --- |
| Storefront `npm run lint` / `npm run typecheck` | Passed |
| Storefront `npm test` | **42 files, 177 tests passed** |
| Storefront `npm run build` | Passed after the ICU formatting fix |
| CRM `npm run lint` / `npm run typecheck` | Passed; final build also reran TypeScript |
| CRM `npm test` | **19 files, 114 tests passed**, including final toolbar-key change |
| CRM `npm run build` | Passed after all source edits |
| Both apps `npm run test:budgets:ci` | Passed; storefront JS 1.26/1.65 MiB, CRM 1.51/1.53 MiB, public assets 8.90/24 MiB |
| Backend targeted Gradle tests | **57 passed**: `CatalogImprovementsIntegrationTest` 48, `CatalogBannerServiceTest` 4, `ProductPricingTest` 3, `ResourceNotFoundServiceTest` 2 |
| Browser runtime | No uncaught exceptions after formatting fix; final CRM form console has no warnings/errors |

Targeted component checks covered price order/badge placement; discount validation and explicit clearing; archived-only permanent deletion; protected options; no selection on trash click; cancel without mutation; confirmed deletion only; duplicate-submit suppression; in-use/protected/collection errors; last-option focus restoration; checkbox behavior; shared-dictionary cleanup; and preservation of unrelated unsaved RHF edits. The backend run used Java 17 and a fresh disposable PostgreSQL 16 database on loopback port 55439. It verified real database discounts, in-use/protected reference and collection safety, audit/media behavior, archive-only deletion and banner inheritance. The temporary container was removed after the successful run; the existing stand database was not used for these tests.

A fresh headless Edge profile exercised the running source stand at **1440, 1280, 390 and 320px**: no document-level horizontal overflow, no favorite/badge collision, centered notice, aligned CRM price/discount groups and contained mobile table scrolling. RU/KZ/EN consent dismissal, reload and reopening were exercised. Product detail was checked at desktop and mobile KZ. In form browser checks, synthetic custom values and DELETE responses (409 then 204) were intercepted in the test browser; no real reference was deleted. Search and Escape/focus were checked at 1440/320px. Real backend safety was independently checked on the isolated database.

Both user screenshots were studied. The marketplace badge placement was adapted into Vympel's existing neutral design; the CRM screenshot's stacked controls were replaced by the compact row. No Figma source was supplied and no pixel-perfect claim is made.

## Local visual evidence

* [Catalog and centered notice, desktop](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/refinement-catalog-1440.png)
* [Catalog, 320px](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/refinement-catalog-320.png)
* [CRM compact row, 1280px](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/refinement-crm-products-1280.png)
* [Inline reference options, 320px](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/refinement-reference-options-320.png)
* [In-use rejection, 320px](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/refinement-reference-in-use-320.png)
* [Product detail, mobile KZ](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/refinement-product-detail-mobile.png)

Screenshots are local development evidence and include the normal Next.js development indicator. Final captures were refreshed after the toolbar-key correction. The verification browser was logged out (204) and closed after checking; the user stand remains running. Ignored `.cache/ux-refinement/` contains baseline hashes, finite test/build logs, browser scripts and assertions. These are not publication/deployment artifacts. The user stand remains at [storefront](http://localhost:3000/ru) and [CRM](http://localhost:3001/products).

## Exact files changed in this refinement

Compared with the hash snapshot taken immediately before this pass, including pre-existing untracked files. Backend edits, migrations, API contracts and `next.config.mjs` changes from the original implementation/startup are not part of this inventory. The removed cleanup panel files existed as untracked files at the baseline, so they do not appear as tracked Git deletions.

| Change | File |
| --- | --- |
| Modified | `docs/PROJECT_MAP.md` |
| Modified | `docs/PROJECT_SKILLS.md` |
| Modified | `docs/tasks/product-cms-crm-improvements/IMPLEMENTATION.md` |
| Added | `docs/tasks/product-cms-crm-improvements/REFINEMENT.md` |
| Modified | `vympel_crm/src/app/globals.css` |
| Modified | `vympel_crm/src/features/products/BulkProductCreateView.tsx` |
| Deleted | `vympel_crm/src/features/products/CatalogCleanupPanel.test.tsx` |
| Deleted | `vympel_crm/src/features/products/CatalogCleanupPanel.tsx` |
| Modified | `vympel_crm/src/features/products/CreatableReferenceFields.tsx` |
| Modified | `vympel_crm/src/features/products/ProductForm.kaspi.test.tsx` |
| Modified | `vympel_crm/src/features/products/ProductForm.tsx` |
| Modified | `vympel_crm/src/features/products/ProductListView.test.tsx` |
| Modified | `vympel_crm/src/features/products/ProductListView.tsx` |
| Added | `vympel_crm/src/features/products/ReferenceOptionPicker.tsx` |
| Added | `vympel_crm/src/features/products/referenceDeletion.test.tsx` |
| Added | `vympel_crm/src/features/products/referenceDeletion.tsx` |
| Modified | `vympel_crm/src/shared/i18n/messages.ts` |
| Modified | `vympel_crm/src/shared/markdown/MarkdownEditor.tsx` |
| Added | `vympel_crm/src/shared/ui/ActionIcon.tsx` |
| Modified | `vympel_crm/src/shared/ui/ConfirmDialog.tsx` |
| Modified | `vympel_front/src/app/globals.css` |
| Modified | `vympel_front/src/components/GoodCard/index.tsx` |
| Modified | `vympel_front/src/components/PrivacyNotice/index.tsx` |
| Modified | `vympel_front/src/components/ProductPrice/index.test.tsx` |
| Modified | `vympel_front/src/components/ProductPrice/index.tsx` |
| Modified | `vympel_front/src/messages/en.json` |
| Modified | `vympel_front/src/messages/kz.json` |
| Modified | `vympel_front/src/messages/ru.json` |
| Added | `vympel_front/src/utils/formatProductPrice.test.ts` |
| Modified | `vympel_front/src/utils/formatProductPrice.ts` |

## Price typography follow-up — 2026-10-17

At the user’s request, removed the card-only mobile size override and forced tabular numerals, returning the existing shared `Text size="h6"` styling. Verified live computed styles at 1440/390/320px: Inter, 28px, weight 400, normal numerals, no document overflow. Existing ProductPrice tests: 5 passed; targeted ESLint and storefront typecheck passed. No new tests or full rebuild were needed for this CSS/class-only correction. Discount logic and badge placement were not changed.
