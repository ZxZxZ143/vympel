# Backup and Restore Rehearsal Report

Date: 2026-07-22
Scope: isolated local technical proof; this is not managed-provider restore proof.

## Result

**PASS.** `deployment/rehearsals/backup-restore.ps1` created a uniquely named PostgreSQL source and restore pair, applied the full current Liquibase history, inserted only namespaced representative records, created a custom-format backup, restored it, and started the current backend image against the restored database. The script removed both databases, their volumes, network, and temporary dump in `finally` cleanup.

## Evidence

| Check | Result |
| --- | --- |
| Rehearsal ID | `aaeaae0e31b6` (rerun after final-postmaster readiness correction) |
| PostgreSQL | `16.13` |
| Backup command | `pg_dump --format=custom --no-owner --no-acl` |
| Format | PostgreSQL custom |
| Size | 148,409 bytes |
| SHA-256 | `5ec91b10bf5f8dc0a5531d642e0d89b7c2cab01d0781c2f7c44bbef855e8a058` |
| Liquibase rows | 77 |
| Public base tables | 51 |
| Representative country/translation/CMS/user | `1 / 1 / 1 / 1` |
| Unvalidated constraints | 0 |
| Latest changeset | `2026-07-19-02-update-public-image-paths-to-webp` |
| Restored backend readiness | `UP` |

The representative user was disabled and used the literal non-credential marker `NOT_A_REAL_CREDENTIAL`. No customer data or working credentials were used. Source and restored summaries matched exactly.

## Remaining provider-specific proof

Before production, repeat restore testing with the selected managed PostgreSQL service, its encryption and retention controls, production-compatible roles/extensions, the actual backup transport, and the accountable recovery-time/recovery-point objectives.
