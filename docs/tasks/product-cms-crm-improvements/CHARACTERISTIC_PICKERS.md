# All creatable characteristic pickers

> Final release readiness and updated test/security results: [FINALIZATION.md](FINALIZATION.md).

Date: 2026-10-17
Branch: `codex/product-cms-crm-improvements`
Scope: CRM frontend and documentation. Existing backend/API, data, storefront typography and prior work are preserved.

## Reusable components and behavior

`vympel_crm/src/features/products/ReferenceOptionPicker.tsx` is the single shared collection-style picker for single and multiple selections. `CreatableReferenceSelect` delegates whenever `onAdd` or deletion is supported, including empty dictionaries and dictionaries containing only protected options. `CreatableReferenceMultiSelect` delegates with `multiple` instead of using a separate checkbox list. The existing `ReferenceCreateDialog` and add callbacks remain in use.

The picker has search, independent text/selection and trash buttons, selected checkmarks, internal list scrolling and an ellipsized trigger with the full selection in its title. It renders a nonmodal dialog through a body portal, above form/table clipping and below confirmation dialogs. Placement follows the trigger during resize/scroll, flips above when needed, and responds to visual-viewport and panel-size changes. Normal panels match their trigger; an oversized bulk-table trigger is clamped to the viewport with 8px insets to prevent page overflow.

Search receives focus on opening. Arrows/Home/End navigate choices; Home/End retain text-editing behavior inside search. Native Enter/Space activate buttons. Escape returns to the trigger. Shift+Tab from search returns to the trigger, and Tab from the last portal control continues into the form. Multiple selections remain open while toggling, and trash never toggles a selection. Existing small action icons and CRM styles are reused, without new dependencies.

## Complete field and API mapping

All 21 characteristic fields, covering the existing 15 allowed characteristic reference types, now use the shared picker. Collections use the same component as before.

| Profile | Fields | Reference type |
| --- | --- | --- |
| Wristwatch | Mechanism (`mechanismId`) | `watch-mechanisms` |
| Wristwatch | Gender (`genderId`) | `genders` |
| Wristwatch | Case material (`caseMaterialId`) | `case-materials` |
| Wristwatch | Strap/bracelet material (`strapMaterialId`) | `strap-materials` |
| Wristwatch | Glass (`glassTypeId`) | `glass-types` |
| Wristwatch | Water resistance (`waterResistanceId`) | `watch-water-resistances` |
| Wristwatch | Stone inlay (`stoneInlayId`) | `stone-inlays` |
| Wristwatch | Dial type (`dialTypeId`) | `watch-dial-types` |
| Wristwatch | Dial markings (`dialMarkingId`) | `watch-dial-markings` |
| Wristwatch | Power source (`powerSourceId`) | `watch-power-sources` |
| Wristwatch | Strap color, dial color (`strapColorId`, `dialColorId`) | `colors` |
| Wristwatch | Features, multiple (`featureIds`) | `watch-features` |
| Interior clocks | Case material (`interiorCaseMaterialId`) | `case-materials` |
| Interior clocks | Color (`interiorColorId`) | `colors` |
| Interior clocks | Style (`interiorStyleId`) | `interior-styles` |
| Interior clocks | Mechanism (`interiorMechanismTypeId`) | `interior-mechanisms` |
| Interior clocks | Power type (`powerTypeId`) | `interior-power-types` |
| Accessories / Apple case | Body material, insert material (`accessoryCaseMaterialId`, `accessoryInsertMaterialId`) | `case-materials` |
| Accessories / Apple case | Color (`accessoryColorId`) | `colors` |
| Shared | Collection (`collectionId`) | Existing collection endpoint |

Category profiles verified: `WATCH_WRIST`, `WATCH_WALL`, `WATCH_FLOOR`, `ACCESSORIES`, `APPLE_CASE`. All applicable fields are covered in product creation, product editing, bulk common defaults and bulk row overrides. The current schema has no separate interior-clock feature multi-select; none was invented. Existing `ProductForm` and `BulkProductCreateView` already supplied the correct creation/deletion adapters and required no edits in this pass.

## Protection and confirmation

Canonical category/brand/country fields retain their existing fixed selectors and permissions. Seeded/system/canonical values inside creatable dictionaries are searchable/selectable but have no active trash button. Reference trash requires the server-provided `deletable === true` flag. The unchanged server additionally checks its allowed types and `CRM_[0-9A-F]{16}` custom code, locks the row, rejects saved-product/dependent usage and preserves CRM permissions/audit logging. Collection deletion retains the existing in-use guard. There is no force-delete, cascade or silent product reassignment.

`useReferenceDeletion` reuses `ConfirmDialog`. RU/KZ/EN messages distinguish characteristic and collection titles and display the exact value, safely escaped as text, with an irreversible-action explanation. Cancel/Escape before submission sends no request. During submission, controls are disabled, a synchronous guard blocks duplicate requests, and `aria-busy` plus a localized deleting label communicate progress. The dialog traps focus and makes the background inert, then restores focus to the stable field trigger. Success closes it and shows localized feedback; failure keeps it open with localized protected/in-use/error feedback and unchanged options/form values.

## Cache and form synchronization

On success, `removeReferenceFromCache` filters only the corresponding reference array. `clearDeletedReference` clears only matching string IDs in affected unsaved fields. Shared materials update case/strap/interior/accessory selectors; shared colors update strap/dial/interior/accessory selectors. Multiple features remove only the deleted ID and preserve other selections. The existing form adapters update React Hook Form fields, bulk common values and all affected rows. Unrelated text, material selections with an equal numeric color ID, validation state and other fields are preserved. There is no automatic product save, full-page reload or references refetch after deletion. Failed deletion performs none of these state changes.

## Verification

| Check | Result |
| --- | --- |
| Focused picker, form-profile and localization tests | Passed; included in the final complete suite |
| `npm --prefix vympel_crm test` | 20 files, 153 tests passed |
| `npm --prefix vympel_crm run lint` | Passed |
| `npm --prefix vympel_crm run typecheck` | Passed |
| `npm --prefix vympel_crm run build` | Passed after all production-code changes |
| `node scripts/check-performance-budgets.mjs --require-build` | Passed: CRM 1.51/1.53 MiB, storefront 1.26/1.65 MiB, public assets 8.90/24 MiB; no budget changes in this pass |
| Browser widths | 1440, 1024, 768, 390 and 320px passed |
| Browser keyboard/touch | Tab continuation, Shift+Tab, arrow navigation, Enter selection, upward filtered placement and 44×44px touch trash buttons passed |
| Browser create/edit/bulk | New/edit selectors and bulk common/row portal checks passed; no page overflow or runtime errors observed |
| Backend tests | Not rerun: no backend source or deletion contract changed in this pass |
| Local stand | CRM, storefront and backend readiness returned HTTP 200 after verification |

`ProductReferenceFields.test.tsx` checks every field across all five profiles in create/edit/bulk, including protected-only dictionaries and native canonical brand/country selectors. It verifies shared-color cache/RHF synchronization and preservation of unrelated values in each mode. `referenceDeletion.test.tsx` covers all 15 endpoint types, protection, search/select, independent trash actions, exact confirmation, cancel, busy/error states, local cleanup, multiple selections and keyboard behavior. Existing Kaspi create/edit tests now operate the actual custom picker and continue covering new-option creation and save flows. Locale tests cover the new RU/KZ/EN confirmation strings.

A repeated profile run exposed a test timing assumption: the modal DOM can disappear before its passive-effect cleanup restores background accessibility/focus. The test now waits for the accessible picker and asserts restored trigger focus; the final full suite, lint and typecheck pass. No production change was needed for that test correction.

Browser verification used a separate headless profile and intercepted reference writes with synthetic fixtures. Non-auth writes outside those fixtures were blocked. Actual reference/product data was not deleted, created or saved. The verification session was logged out and its browser closed; the user's local services remain running. Local logs are under ignored `.cache/reference-picker-all/` (`crm-tests-final.log`, `crm-lint-final.log`, `crm-typecheck-final.log`, `crm-build.log`, `browser-results.json`, `browser-keyboard.json`).

## Visual evidence and limits

The existing collection selector implementation is the visual reference. The pasted request described two screenshots, but supplied no new image files for this pass; no pixel-perfect Figma claim is made. Verified the actual single/multiple lists, checkmarks, independent trash controls, compact spacing, confirmation layering, narrow viewport containment and bulk-table portal behavior.

- [Desktop single picker](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/characteristics-single-1440.png)
- [320px single picker](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/characteristics-single-320.png)
- [390px multiple picker](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/characteristics-multi-390.png)
- [390px bulk row](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/characteristics-bulk-row-390.png)
- [320px confirmation](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/characteristics-confirm-320.png)
- [Touch / upward placement](C:/Users/kyrlu/.codex/visualizations/2026/10/17/01a14979-67af-7d00-a9f1-76f27f370266/characteristics-touch-upward-390.png)

The existing bulk table still scrolls horizontally; its oversized row controls were not redesigned. Their dropdown panels are clamped to the visible viewport. Real deletion against saved data was deliberately not exercised; backend guards are unchanged and frontend error flows were verified with isolated responses. No deployment, image publication or merge was performed.

## Exact files changed in this pass

Compared against the recorded task-start file hashes, not against Git HEAD (which includes earlier uncommitted work):

| File | Change |
| --- | --- |
| `vympel_crm/src/features/products/ReferenceOptionPicker.tsx` | Shared single/multiple picker, body portal, geometry, keyboard and independent trash |
| `vympel_crm/src/features/products/CreatableReferenceFields.tsx` | Always use picker for creatable fields; delegate multiple values |
| `vympel_crm/src/features/products/referenceDeletion.tsx` | Exact localized characteristic/collection confirmation and busy text |
| `vympel_crm/src/shared/ui/ConfirmDialog.tsx` | Expose busy state to assistive technology |
| `vympel_crm/src/app/globals.css` | Shared portal/picker styling; remove obsolete multi-checkbox styling |
| `vympel_crm/src/shared/i18n/messages.ts` | RU/KZ/EN confirmation/deleting messages |
| `vympel_crm/src/features/products/ProductReferenceFields.test.tsx` | New all-profile/all-mode and shared-color synchronization tests |
| `vympel_crm/src/features/products/referenceDeletion.test.tsx` | Expanded type, multiple selection, empty dictionary and keyboard coverage |
| `vympel_crm/src/features/products/ProductForm.kaspi.test.tsx` | Adapt existing flows to real picker interaction |
| `vympel_crm/src/shared/i18n/messages.test.ts` | Confirmation locale coverage |
| `docs/PROJECT_MAP.md` | Actual picker architecture, field coverage and evidence link; Last Updated |
| `docs/PROJECT_SKILLS.md` | Shared picker, portal, keyboard/focus and testing lessons; Last Updated |
| `docs/tasks/product-cms-crm-improvements/REFINEMENT.md` | Link to this superseding follow-up |
| `docs/tasks/product-cms-crm-improvements/CHARACTERISTIC_PICKERS.md` | This final implementation/verification report |

No backend, storefront, dependency, deployment or budget files changed in this pass.
