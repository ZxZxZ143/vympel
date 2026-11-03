# Existing GCP staging deployment evidence — 2026-11-03

Final status: **STAGING DEPLOYMENT PASSED**. Active release:
`d8e661620a330431dc8bfd94ae06e5ef95c58f89` on VM
`3531996634123212598` (`vympel-staging`, `me-central1-b`).

Read the [deployment record](../../deployment/GCP_STAGING_DEPLOYMENT_2026-11-03.md)
for scope, exact digests, backup locations, interruption windows and limitations.

| Evidence | Purpose |
| --- | --- |
| [workflow-verification.json](workflow-verification.json) | GitHub publication/runtime job conclusions |
| [published-release-manifest.yml](published-release-manifest.yml) | Freshly retrieved, unchanged publication artifact |
| [release-verification.json](release-verification.json) | Independent GHCR hashing, amd64 platform and source/revision checks |
| [backup-verification.json](backup-verification.json) | Backup hashes, isolated database/media/application restore and pause window |
| [offvm-verification.json](offvm-verification.json) | Verified encrypted off-VM copy decryption |
| [admission-verification.json](admission-verification.json) | Environment, backup and Liquibase gates; exact Compose change scope |
| [pull-verification.json](pull-verification.json) | Pulled image identities and original applications still healthy before rollout |
| [rollout-result.json](rollout-result.json) | Successful final attempt, active digests, migration, HTTP checks and timestamps |
| [final-audit.json](final-audit.json) | Original-to-final integrity comparison, all seven healthy services, both previous rollbacks and verifier corrections |
| [public-smoke.json](public-smoke.json) | Independent workstation DNS/TLS/routing/authentication checks |

`rollback_needed: false` in the successful final-attempt result applies only to
that attempt. Two earlier attempts rolled back after verifier false positives;
their events and diagnoses are retained in `final-audit.json`. The unchanged
publication manifest's `deployment_performed: false` describes publication time.

All committed evidence is sanitized. Raw Compose/container environments, keys,
database/media archives, credentials and unfiltered operational logs are kept
outside Git. The temporary IAP tunnel was closed after final verification.
