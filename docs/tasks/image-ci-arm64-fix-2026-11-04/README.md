# ARM64 publication runtime prerequisite repair

Scope: local CI repair and verification only. No push, workflow dispatch, GHCR
write, GCP/SSH operation, deployment, database/media change or live backfill is
authorized by this task.

## Confirmed cause and exact correction

Remote main was verified as `bccea7a37ef7939f7f69d973041703b1a113b8be` before
editing. [Release Images run 41698138717](https://github.com/ZxZxZ143/vympel/actions/runs/41698138717)
failed its `verify_published_images` job when the shared verifier ran ARM64
`cwebp -version` on an amd64 runner without QEMU/binfmt registration:

```text
exec /usr/bin/cwebp: exec format error
```

The separate `verify_arm64_images` job already installed QEMU and completed its
full runtime, migration, readiness, indexing and native frontend checks. This
was confirmed again through GitHub's job records. Its steps remain unchanged.

The only executable change adds these four lines to `verify_published_images`,
immediately after checkout and before Buildx:

```yaml
- name: Enable ARM64 emulation
  uses: docker/setup-qemu-action@29109295f81e9208d7d86ff1c6c12d2833863392 # v3.6.0
  with:
    platforms: arm64
```

The existing review patch was checked before editing. The action SHA and
configuration are identical; the display name uses the operator's requested
`Enable ARM64 emulation`. No application, image implementation, Dockerfile,
verification script, build input, URL, security or release dependency changed.

## Local verification

- Ruby `Psych.parse_file`: all 11 workflow/deployment YAML files parsed.
- Full `rhysd/actionlint:1.7.7`: passed, including the bundled shell checks.
- Six structural workflow assertions passed: only the four-line step changes
  the complete workflow; both verifier callers initialize ARM execution; the
  separate ARM job/source gates/dispatch inputs are unchanged; all three native
  dual-platform publishers retain SHA tags, gates, SBOM and signatures; both
  runtime jobs and a successful manifest remain mandatory; verification scripts
  and application trees are unchanged.
- `sh -n` passed for all deployment scripts and rehearsal shell scripts.
- Existing `published-manifest-contract.sh` passed, including frontend URL and
  multi-architecture digest-manifest rejection cases.
- Existing `backup-evidence-contract.sh` and `liquibase-history-compatibility.sh`
  passed with their positive and fail-closed cases.
- Exact existing bccea7a backend children executed locally with networking
  disabled and a read-only filesystem. amd64 reported `x86_64`, ARM64 under
  Docker Desktop emulation reported `aarch64`; both ran as UID 10001 and returned
  cwebp **1.2.2**. These are checks of existing published artifacts, not images
  for the new commit and not a replacement for GitHub-hosted gates.

Published backend children used only for these local runtime checks:

| Platform | Existing bccea7a child digest |
| --- | --- |
| amd64 | `sha256:5c38864515c47f4526c5c03c4423515f5f17e0210a778985060a6baff562f82c` |
| arm64 | `sha256:82c90c4e96cb85a81da028066a66e2e6124197b84accd696dbc128c9194bc001` |

Logs and structural/runtime JSON evidence are retained under
`.cache/image-ci-arm64-fix-20261104/`. The new full commit SHA, fresh remote-main
and tag-absence results are recorded after committing in the local release
readiness receipt; the commit does not attempt to contain its own SHA.

## Next immutable publication

The [dispatch payload](publication-inputs.json) preserves the existing canonical
inputs: preview storefront, public API/media at api.vympel.kz, protected CRM at
x7m2q9k4n6p8.vympel.kz, environment staging, empty release tag, no placeholder
acknowledgement. The unchanged workflow compiles telemetry/indexing as false
and uses `github.sha` as the release identity.

After a new explicit full-SHA approval:

1. Recheck remote main, candidate ancestry and absence of all three new-SHA
   tags. Stop for unexpected main or any inaccessible/existing tag.
2. Non-force fast-forward only the exact approved commit to main. Assert remote
   main equals that SHA, then dispatch Release Images once with the reviewed
   payload. Never reuse or overwrite bccea7a tags.
3. Require the same-commit full source/security gates, six native builds,
   signatures/provenance, both runtime jobs, successful digest-complete manifest
   and final publication result. Independently verify index/child digests,
   revision labels and approved frontend origins. Failure stops deployment.
4. Only after publication succeeds and deployment/access is explicitly approved,
   perform fresh installed-state and consistent-backup/isolated-restore admission
   on project/VM `vympel-staging`, zone `me-central1-b`, ID `3531996634123212598`.
   Do not reuse an expired SSH key registration implicitly.
5. Use project `vympel-gcp-staging`, `/etc/vympel/staging.env`, installed
   `/opt/vympel/repository/infrastructure/compose/compose.single-vm-staging.yml`
   and `/etc/vympel/compose.host-ports.yml`. Preserve limits/ports/volumes/ingress.
   Capture current d8 env, image identities and gateway config for rollback.
6. Pull only the verified three new app images; require migration Run 0,
   Previously run 92, Total 92, unchanged history/checksums and clear lock.
   Replace only gateway (same verified cached image), backend, storefront, CRM.
   Never recreate PostgreSQL/Redis/MinIO. Apply the reviewed finite 15-minute
   health/resource/security/image/cache/browser acceptance with automatic d8
   application/gateway rollback on hard failure.

Staging deployment is **conditional**, pending new approval, successful canonical
publication, a real manifest, fresh access and backup admission. Current recorded
staging/rollback remains `d8e661620a330431dc8bfd94ae06e5ef95c58f89`; this CI-only
task does not re-inspect or modify the VM. No future registry digest or deployment
manifest is invented. Live ten-image backfill always requires separate approval
after verifying the actual deployed codec and final manifest.

## Commit boundary

The new local commit contains only the workflow correction, the task's additions
to `PROJECT_MAP.md` and `PROJECT_SKILLS.md`, this note and the publication payload.
Pre-existing documentation edits, deployment evidence and other working-tree
files remain excluded. No previous commit is amended or rewritten.
