# Final Database Verification

Date: 2026-07-19

## Rehearsals

| Target | Result |
| --- | --- |
| PostgreSQL 16 clean database | PASS — 77 changelog rows, 51 application tables, current latest change `2026-07-19-02-public-image-webp`, zero checksum gaps |
| PostgreSQL 18 existing-data upgrade | PASS WITH CONDITION — 78 changelog rows, 51 tables, 19 representative products, current latest change, zero checksum gaps |

The one-row difference is an executed historical change in the upgrade source: `2026-07-13-01-seed-accessory-split-categories|codex|db/changelog/...|EXECUTED`. That file and row do not exist in current source or the clean rehearsal. Current changes apply successfully in both paths, but the historical artifact must be reconciled or explicitly accepted before production.

## Final Invariants

The exact SQL output is retained in `logs/database/final-invariants.log`. Both databases returned zero for all applicable invariants:

- negative price or stock;
- duplicate media positions or multiple main images;
- invalid media foreign keys;
- active products without a main image;
- invalid CMS media references;
- duplicate CMS block order or translations;
- eligible CMS orphan rows;
- expired active refresh sessions and invalid refresh hash shape;
- analytics older than 180 days or sensitive analytics columns;
- stuck/overdue revalidation jobs;
- residual Step 9 CMS blocks.

The upgrade database had 77 `EXECUTED` and 1 `MARK_RAN` current/history records; the clean database had 76 `EXECUTED` and 1 `MARK_RAN`. No null Liquibase checksums were present.

## Disposable Write and Cleanup Proof

- Clean-database public flow created one customer request through the real API; no users were left by the aborted registration probe.
- Upgrade-database CMS lifecycle used media ID 26 and block ID 23; both returned zero rows after cleanup.
- The corresponding MinIO object returned HTTP 404 after cleanup.
- Full container removal is the final cleanup boundary; no user PostgreSQL database on port 5432 was mutated by cleanup.

## Migration Risk and Recovery

- Schema correctness and data invariants pass on both clean and upgrade routes.
- Production rollout must use a backup/restore rehearsal and forward-fix strategy; destructive rollback was not attempted.
- Before migration promotion, compare production `databasechangelog` to the release artifact and decide how to preserve/document the missing historical `2026-07-13-01` record without editing applied history in place.

Verdict: **database-ready for staging; production conditional on history reconciliation and target backup/restore proof.**
