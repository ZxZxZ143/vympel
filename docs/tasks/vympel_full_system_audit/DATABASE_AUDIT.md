# Database Audit

## Technical summary

PostgreSQL 18.1 is consistent at the current data volume, Liquibase is unlocked, and Step 7 now enforces the audited price, stock, product-media order/main-image, CMS order, and ACTIVE-product image rules. The reusable CMS media lifecycle remains the Step 5 ownership model across all six reference slots.

## Inventory and cardinalities

| Object | Count / state |
| --- | --- |
| Public tables | 49 |
| Liquibase changesets | 76 applied; lock clear |
| Products | 19: 18 ACTIVE, 1 DRAFT |
| Product translations | 57; ru/kk/en coverage complete |
| Product media | 45 |
| Reviews | 24 total: 22 APPROVED, 1 DELETED, 1 REJECTED |
| CMS | 5 pages, 17 blocks, 51 translations, 24 media |
| Product analytics events | 137 at the baseline snapshot |
| Customer requests | 1 baseline row |
| Users | 3 baseline users |

## Invariant results

- Nonpositive prices: 0. Negative stock: 0. Products without category: 0.
- Multiple main product images: 0. Duplicate product media positions: 0.
- Active products without a canonical main image: 0. Product 45 was narrowly demoted to DRAFT; public no-photo handling remains defensive.
- Duplicate CMS translations: 0. Self-parent categories: 0.
- Duplicate CMS block sort groups: 0. About is normalized to hero 10, intro 20, cooperation 30.
- Unreferenced `cms_media`: 7 of 24 rows.
- Active brands without active products: 2; they remain intentionally visible through the static public brand registry.
- Legacy `cms_banner`, `cms_banner_media`, and translation tables are empty.

## DB-001 — Core numeric and media ordering invariants are enforced in PostgreSQL

- **Severity:** Medium
- **Status:** Resolved and migration-rehearsed 2026-07-17
- **Evidence:** `2026-07-17-02-database-hardening.xml` adds nonnegative price/stock/media-position checks, unique `(product_id,type,position)`, and main-image-at-position-zero enforcement while preserving `ux_media_one_main_image_per_product`.
- **Root cause:** Validation is concentrated in DTO/service code, leaving direct SQL, future jobs, and races able to bypass it.
- **Implemented fix:** Guarded data normalization runs first; unknown dirty rows halt the migration. Service writes take product locks and use a clear-main -> collision-free temporary order -> contiguous zero-based final order protocol.
- **Acceptance criteria:** Invalid direct inserts/updates fail; migrations pass on a data copy; service tests and DB integration tests cover boundaries and concurrent reorder behavior.
- **Regression risks:** Existing hidden bad rows in other environments can block deployment; run diagnostic SQL before applying constraints.

## DB-002 — CMS media foreign-key lifecycle is consistent

- **Severity:** Medium
- **Status:** Resolved and revalidated 2026-07-17
- **Evidence:** All six reusable-media foreign keys report `ON DELETE SET NULL`; application cleanup still refuses deletion while any draft or published block references the row.
- **Root cause:** Media variants were introduced across migrations without one lifecycle policy.
- **Required fix:** Define the intended ownership model. If CMS media is reusable, use `SET NULL` consistently plus explicit safe deletion; if block-owned, use ownership tables/cascade rules. Pair this with CMS-001 garbage collection.
- **Acceptance criteria:** Deleting an unused media row cannot leave invalid references; referenced media deletion has a deterministic, tested result across all six media slots.
- **Regression risks:** Changing foreign keys without a reference audit can unexpectedly clear live images.
- **Implementation:** `2026-07-17-01-cms-media-lifecycle-revalidation.xml` documents reusable ownership and normalizes `media_id`, `media_kz_id`, `media_en_id`, `mobile_media_id`, `mobile_media_kz_id`, and `mobile_media_en_id` to `ON DELETE SET NULL`. Each column has a reference index. Application cleanup remains stricter than the FK: it locks the row and refuses deletion while any of the six columns reference it.
- **Lifecycle schema:** `cms_media` now records `ACTIVE`/`DELETE_PENDING`/`DELETE_FAILED`, cleanup protection, orphan/delete/attempt timestamps, attempt count, next retry, and a bounded error code. `cms_revalidation_job` is a unique page-key outbox with claim/retry/completion timestamps and a due-job index.
- **Rehearsal evidence:** Fresh PostgreSQL 16 migration testing assigned one media row to all six slots and returned six slot-level references. The migration preserved the existing media row; rollback definitions cover the new indexes/table/columns and legacy default-media FK restoration.

## DATA-001 — About ordering is normalized and collision-safe

- **Severity:** Low
- **Status:** Resolved 2026-07-17
- **Evidence:** `about.heroBanner=10`, `about.intro=20`, and `about.cooperationBanner=30`; duplicate `(page_id,sort_order)` groups are zero.
- **Root cause:** Sort order is not unique within a page. Repository ordering adds ID, so output is deterministic but editor intent is unclear.
- **Required fix:** Normalize existing orders and make reorder behavior resolve collisions transactionally. A unique constraint is optional only if the UI deliberately permits ties.
- **Acceptance criteria:** CMS presents and persists an unambiguous block order; repeated reorder does not produce ties.
- **Regression risks:** Reordering live blocks can change public layout; take a pre-migration snapshot.

## DATA-002 — ACTIVE products require a canonical main image

- **Severity:** Low
- **Status:** Resolved 2026-07-17
- **Evidence:** Product 45 is DRAFT, zero ACTIVE products lack an IMAGE main at position 0, activation without one returns `409 PRODUCT_MAIN_IMAGE_REQUIRED`, and final-image deletion for ACTIVE returns `409 PRODUCT_FINAL_IMAGE_DELETE_FORBIDDEN`.
- **Root cause:** Activation does not require product media.
- **Required fix:** Decide the business rule. Recommended: allow drafts without media, warn or block ACTIVE promotion when no image exists, while keeping no-photo rendering defensive.
- **Acceptance criteria:** CRM clearly signals the state; public cards never break; activation behavior matches the documented rule.
- **Regression risks:** A strict rule may prevent edits to existing image-less active products until data is remediated.

## Query-plan observations

At 19 products, PostgreSQL appropriately chose sequential scans for simple ACTIVE and model searches; execution was approximately 0.1 ms. Category lookup used the category code index and product-category primary key. Published CMS blocks used `cms_page_page_key_key` and `idx_cms_block_page_status_sort` with approximately 0.12 ms execution. Analytics aggregation scanned 137 recent rows in approximately 0.13 ms. These numbers prove current health, not future scale.

## Migration observations

- The Step 5 changelog is included after the existing chain and adds two ordered changesets: CMS media lifecycle/FK normalization and the revalidation outbox.
- The new Step 5 changesets include explicit rollback blocks. Older migrations may still lack rollback coverage; that historical operational debt remains outside Step 5.
- Any implementation migration must include preconditions, diagnostic SQL, a tested rollback or forward-recovery plan, and a production-copy rehearsal.
- Step 7 adds two ordered changesets after Step 5. Schema rollback explicitly drops only the new constraints; the two targeted data corrections use documented forward recovery rather than guessing old live state.

## 2026-07-17 CMS data reconciliation

The read-only `CmsMediaDryRunIntegrationTest` observed 24 `cms_media` rows and 5 currently eligible cleanup candidates, returned all 5 in the first bounded page, asserted zero references for each, and confirmed the row count stayed 24. This differs from the original raw count of 7 because lifecycle cleanup eligibility also applies storage type, protection, grace, retry, and stale-claim rules. No database row or storage object was deleted. Target-environment MinIO and public/CRM preview proof is required before running the ADMIN cleanup action.

## 2026-07-17 Step 6 query-plan decision

The performance rehearsal used a disposable PostgreSQL 16 database with the full Liquibase chain and 600 temporary products. The scoped 342-row wristwatch ID page used a hash semi-join and top-N heapsort with 24 shared-buffer hits, 3.527 ms planning, and 0.542 ms execution. The grouped brand facet over the same scope used a hash semi-join/right-join with 16 shared-buffer hits, 5.402 ms planning, and 0.510 ms execution. Sequential scans are appropriate at this fixture size; the existing category/product/detail/media/review indexes remain available for larger cardinalities.

No index or schema migration was added in Step 6. The main defect was repeated query execution and entity/N+1 hydration, not a demonstrated missing index. Step 6 replaced those paths with bounded aggregate/projection queries. Step 7 then added only correctness constraints; it did not add speculative performance indexes.

## 2026-07-17 Step 7 migration and live-data rehearsal

- `STEP_7_DATABASE_PREFLIGHT.sql` records the read-only dirty-row, FK-action, constraint, and media-reference diagnostics.
- Preflight on `vympel_db` found zero negative price/stock rows, zero media order/main conflicts, one exact About duplicate group, and one exact image-less ACTIVE product (id 45 / audited SKU). Unknown dirty rows are HALT preconditions.
- A custom-format dump of the 74-change-set database was restored into a disposable PostgreSQL database. The finite Spring/Liquibase rehearsal applied both changesets, produced seven new constraints, normalized About, demoted only the audited product, and rejected invalid price/stock/CMS-order writes.
- The same forced finite test then migrated `vympel_db`. Postflight reports 76 changesets, seven Step 7 constraints, six CMS media `SET NULL` FKs, zero Liquibase locks, and zero negative values, ACTIVE-without-main rows, duplicate media positions, invalid main positions, or duplicate CMS orders.
- Fresh-chain PostgreSQL 16 tests also cover direct invalid writes and concurrent stock decrements, product-image reorder/main assignment, and CMS reorder normalization.
- After the live postflight and uncached full suite passed, the exact task-owned rehearsal database and temporary dump were removed; the live database remained at 76 changesets with lock clear.

## Step 9 Final Reconciliation - 2026-07-19

PostgreSQL 16 clean and PostgreSQL 18 existing-data rehearsals both reach current change `2026-07-19-02`, expose 51 tables, and return zero for the final integrity/privacy/session/CMS/revalidation invariants. One production condition remains: the upgrade history contains executed `2026-07-13-01-seed-accessory-split-categories`, while that changelog artifact is absent from current source and the clean chain. See `../vympel_final_release_verification/FINAL_DATABASE_VERIFICATION.md`.
