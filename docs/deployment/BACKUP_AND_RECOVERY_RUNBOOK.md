# Backup and Recovery Runbook

## Required coverage

- PostgreSQL: automated encrypted backups plus point-in-time recovery where supported.
- Object storage: versioning, retention/lifecycle rules, and a recoverable copy in a separate failure domain.
- Configuration: environment variable names, deployment manifest, image digests, proxy templates, and infrastructure configuration; never copy plaintext secrets into Git or release evidence.
- Redis: treat rate-limit state as disposable unless the selected service has another documented business requirement.

## Release gate

The production environment file must identify the latest database backup and restore-rehearsal evidence. `deployment/scripts/backup-check.sh production <env-file>` rejects missing/placeholding evidence. A backup is not proven until a restore has succeeded in an isolated target and application-level checks have read the restored data and media.

## Restore rehearsal

1. Record recovery point objective, recovery time objective, source backup identifier, and responsible operator.
2. Provision an isolated private recovery database and object-storage namespace.
3. Restore without overwriting production.
4. run Liquibase comparison, row/count sanity checks, ADMIN/CRM authentication, representative catalog/media reads, and CMS consistency checks.
5. Record elapsed time and sanitized evidence, then destroy the isolated resources according to provider policy.

## Incident recovery

Freeze writes if required, preserve evidence, choose the recovery point with stakeholders, restore to a separately verified target, and switch traffic only after migrations and smoke checks pass. Never let `rollback.sh` perform a database restore. A restore that can discard writes requires explicit incident authority.

The external Git metadata backup at `E:\vympel_git_backup_20260721_183725` is separate repository-history recovery material. Deployment scripts must not move, modify, or delete it.
