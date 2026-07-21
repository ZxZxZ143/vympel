# Backup and Restore Rehearsal Report

Date: 2026-07-22
Scope: isolated local technical proof; this is not managed-provider restore proof.

## Result

**PASS.** `deployment/rehearsals/backup-restore.ps1` created a uniquely named PostgreSQL source and restore pair, applied the full current Liquibase history, inserted only namespaced representative records, created a custom-format backup, restored it, and started the current backend image against the restored database. The script removed both databases, their volumes, network, and temporary dump in `finally` cleanup.

## Evidence

| Check | Result |
| --- | --- |
| Rehearsal ID | `d22b5176088a` |
| PostgreSQL | `16.13` |
| Backup command | `pg_dump --format=custom --no-owner --no-acl` |
| Format | PostgreSQL custom |
| Size | 148,414 bytes |
| SHA-256 | `3e5e8ea9c1c3dc119864b912bc42ea258688008774a1dbe075a69a0bfddfd285` |
| Liquibase rows | 77 |
| Public base tables | 51 |
| Representative country/translation/CMS/user | `1 / 1 / 1 / 1` |
| Unvalidated constraints | 0 |
| Latest changeset | `2026-07-19-02-update-public-image-paths-to-webp` |
| Restored backend readiness | `UP` |

The representative user was disabled and used the literal non-credential marker `NOT_A_REAL_CREDENTIAL`. No customer data or working credentials were used. Source and restored summaries matched exactly.

## Remaining provider-specific proof

Before production, repeat restore testing with the selected managed PostgreSQL service, its encryption and retention controls, production-compatible roles/extensions, the actual backup transport, and the accountable recovery-time/recovery-point objectives.
