# Liquibase History Reconciliation

Date: 2026-07-22
Condition: `2026-07-13-01-seed-accessory-split-categories`

## Disposition

**FORMALLY BLOCKED FOR A DATABASE THAT CONTAINS THE HISTORICAL ROW.** The exact source artifact could not be recovered safely, so no changelog was invented and no applied database row was changed. A fresh database whose history does not contain this row may use the canonical 77-change chain. Any target database that contains it must pass `deployment/scripts/check-liquibase-history.sh` with a separate accountable acceptance record before migration.

## Evidence searched

- Canonical source: every changelog and retained task/report/log artifact under `E:\vympel_full`.
- Preserved backend Git metadata: reachable refs and every unreachable blob in `E:\vympel_git_backup_20260721_183725\repositories\vympel_back\.git`.
- Consolidation-time full working copy: `E:\backup\vympel_full`, clearly identified by its 2026-07-21 backup timestamp.
- Historical database evidence: `docs/tasks/vympel_final_release_verification/FINAL_DATABASE_VERIFICATION.md` and `logs/database/final-invariants.log`.
- Current isolated/local PostgreSQL history was inspected read-only; it is the clean 77-row chain and does not contain the historical row.

The searches found no XML/SQL source artifact in reachable commits, dangling blobs, either working tree, or retained logs. The historical upgrade database and its disposable volume had already been removed by the recorded cleanup audit, so the full row can no longer be queried from that rehearsal.

## Recovered identity

| Field | Recovered value | Evidence quality |
| --- | --- | --- |
| ID | `2026-07-13-01-seed-accessory-split-categories` | Exact retained database report |
| Author | `codex` | Exact retained database report |
| Changelog path | Only `db/changelog/...` was retained | Incomplete; exact filename unavailable |
| Logical file path | Unknown | Not recoverable |
| SQL/change definition | Unknown | Not recoverable |
| Contexts / labels | Unknown | Not recoverable |
| Execution type | `EXECUTED` | Exact retained database report |
| Liquibase checksum | Unknown | Not retained and not recoverable |

Because path, body, and checksum are unavailable, restoring a same-ID file would risk both checksum failure and duplicate seed effects. The release therefore does not add, rename, or emulate the executed change.

## Compatibility control

`deployment/scripts/check-liquibase-history.sh` queries only the target `databasechangelog` identity fields. Its behavior is fail-closed:

1. If the row is absent, the canonical clean chain may proceed.
2. If the row is present, deployment stops unless `VYMPEL_LIQUIBASE_HISTORY_APPROVAL_FILE` points to an external record marked `APPROVED`.
3. The external record must match the target row's ID, author, filename, checksum, and execution type exactly, must name the exact 40-character release commit, and must contain an accountable approver, timestamp, and evidence reference.
4. The committed example remains `PENDING` and cannot satisfy the gate.

This control is invoked before the one-time migration job. It never updates `databasechangelog`.

## Verification results

- Clean database: the 2026-07-22 RC backup/restore rehearsal passed all 77 canonical changes, 51 application tables, current latest change `2026-07-19-02-update-public-image-paths-to-webp`, and backend readiness after restore.
- Historical upgrade: previously reached all current changes with 78 history rows and zero invariant failures, but the unresolved extra row remains a production condition.
- Duplicate seed risk: not introduced because the missing artifact was not recreated.
- Compatibility test: passed absent-row continuation, unexplained-row blocking, exact accountable acceptance, and mismatched-identity blocking in `deployment/rehearsals/liquibase-history-compatibility.sh`.

## Remaining risk and acceptance ownership

Production remains blocked for any database containing the row until a database owner/release owner examines that target's exact `databasechangelog` row and provenance, records accountable acceptance outside Git, and the pre-deployment compatibility gate matches it exactly. Provider selection does not resolve this history decision by itself.
