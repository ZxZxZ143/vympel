# Backend APT security release validation

**BACKEND APT SECURITY FIX READY FOR RELEASE** — local admission passed.
Publication and deployment require separate explicit approval for the new SHA.

2026-11-05. Local-only patch. Parent and verified remote main:
`d53729af07bcf93ea8a2e05d1f098240e226f97b`. Staging and application rollback
target remain `292d086d59f4198fb4efb40d48c08630e52e29f5`.
The final local commit receipt records the new candidate SHA separately.

## Failure and fix

[Release Images 42047887021](https://github.com/ZxZxZ143/vympel/actions/runs/42047887021)
failed before publication because the Jammy backend contained `apt` and
`libapt-pkg6.0` 2.4.14. Both triggered HIGH CVE-2026-109518. Ubuntu identifies
2.4.15ubuntu0.1 as fixed for Jammy. An on-path attacker can exploit package
redirect/retry handling, so disabling retries also protects the upgrade itself.
[Ubuntu CVE record](https://ubuntu.com/security/CVE-2026-109518) ·
[USN-8996-1](https://ubuntu.com/security/notices/USN-8996-1) ·
[Bootstrap mitigation](https://ubuntu.com/blog/apt-vulnerability-fixes-available)

Only the runtime APT sequence changes. The same digest-pinned Temurin
17.0.19_10 Jammy base runs update and the targeted `--only-upgrade apt
libapt-pkg6.0` with command-scoped `-o Acquire::Retries=0`. Each package must
have a successful dpkg query, installed status, strictly valid Debian version
and version >= 2.4.15ubuntu0.1 before existing runtime dependencies install.
Explicit failure exits prevent the second package from masking the first.
No signature bypass, repository replacement, package deletion, scanner
suppression, severity change or application dependency update was introduced.

## Final image evidence

| Check | linux/amd64 | linux/arm64 |
| --- | --- | --- |
| Execution | Native Docker Desktop Linux | Docker Desktop QEMU |
| apt / libapt-pkg6.0 | Both 2.4.15ubuntu0.1 | Both 2.4.15ubuntu0.1 |
| Official provenance | Ubuntu Jammy updates/security | Ubuntu ports Jammy updates/security |
| Installed package count | 195 | 193 |
| Package differences from published 292 | Only apt and libapt-pkg6.0 | Only apt and libapt-pkg6.0 |
| Trivy actionable HIGH / CRITICAL | 0 / 0 | 0 / 0 |
| CVE-2026-109518 | Absent | Absent |
| Java | Temurin 17.0.19+10 | Temurin 17.0.19+10 |
| cwebp | 1.2.2, identical executable and linked libraries | 1.2.2, identical executable and linked libraries |
| Application JAR | Byte-identical to published 292 | Byte-identical to published 292 |

Final local image IDs:

- AMD64: `sha256:9d83058812cbc3e6d86250aa5c6bdf739ca221260dadde6c7618d4a42fe30faf`
- ARM64: `sha256:842217ff517955b9c863430ea08a8008248e624e20c0828bdbff6261a8f89229`

cwebp executable SHA-256:

- AMD64: `50a4168c6d0a713c22a2188d49786cb97d219c591bc48ecfaa73c07a93acffe9`
- ARM64: `dd4883dd5a1ea7ebe5204baf3084b279cc8331aebf505371876c2efa834084ec`

Both application JARs match `e247110a54c068764ab67c4e405b9fb8215feb5879d5c045ced361866334ceed`.
Full native-library fingerprints, `/etc/os-release`, package database and
apt-cache policy/provenance captures accompany the local validation evidence.
Refreshing package lists for provenance ran only in disposable containers and
left the package database unchanged. The final image retains its dpkg database.
The base image excludes documentation/locales; verification warnings for those
paths are retained, and executable/library integrity remains checked.

Trivy 0.70.0 used OS and library scanning, `--ignore-unfixed`,
`--severity HIGH,CRITICAL` and `--exit-code 1`, without ignore files. A new
database was downloaded for this task: vulnerability DB schema 2, updated
2026-11-05 13:09:41 UTC; Java DB schema 1, updated 2026-11-05 01:08:50 UTC.
Both final scans returned exit 0. Raw JSON, logs and database metadata are
preserved. These are local scans, not a canonical publication run.
The same scanner/database rejected the published 292 positive control with
exit 1 and both expected CVE-2026-109518 findings at version 2.4.14.

## Application and frontend checks

- Backend `test bootJar`: 367 discovered, 366 passed, one opt-in restored-live-DB
  rehearsal skipped because no external restored database was supplied.
- The canonical five migration/security test classes: 39 passed, no skips.
- Bootstrap guard regression: 22 cases per architecture, including each old,
  absent, malformed, unconfigured and query-failed package independently.
- Both final runtime images became healthy. Readiness, liveness and public
  ping returned 200, unauthenticated CRM returned 401, and OOM state stayed
  false. Candidate startup applied zero migrations over the baseline's 92
  changesets; the complete ordered IDs/authors/paths/checksums stayed identical.
  Actual results are recorded in `health.json`.
- Source/schema/DTO/storage contracts and Gradle dependencies are unchanged.
  UID/GID 10001, filesystem ownership, Java memory options, entrypoint, port,
  stop signal and image healthcheck are preserved.
- Storefront Node 22.23.2: clean lockfile install, 283 tests/50 files, lint,
  types, 206 WebP/39 original integrity checks, sharp/glob guards, audit,
  production build, unchanged budgets and production-status/noindex passed.
- Fresh isolated browser regressions passed all 11 groups plus real touch,
  keyboard, fallback, no-JS and independent-rail/catalog contracts against
  the unchanged d537 storefront image. The earlier sealed local matrix still
  validates 56 -> 0 far requests. This is not deployed performance evidence.
- The 48 real staging baseline and 24 navigation observations, accepted ten
  references and 65-object evidence remain sealed and unchanged. No accepted
  image was re-encoded, uploaded or referenced differently.

The auxiliary `npm run test:security` exits 9 on Node 22 because it includes
`--test-isolation=none`. The supported direct command
`node --test scripts/test-security-headers.mjs` passed all three cases.
Backend CI, Storefront CI, CRM CI, Full Release Gate and Release Images do not
invoke that auxiliary npm script. No frontend/package-script edit belongs to
this APT patch.

## Reproduction and limitations

`python deployment/rehearsals/backend-apt-security.py LOCAL_BACKEND_IMAGE`
executes the actual Dockerfile guard in network-isolated, read-only containers
using real dpkg. Acquisition and package-query outputs are controlled only in
this test, with dependency-install reachability as the assertion.

Windows export initially converted text resources to CRLF. Rebuilding from
unfiltered Git blobs restored byte-identical Linux JARs. All application
classes and dependency entries were already identical. Network failures in
npm, Ubuntu ports and the Gradle distribution were preserved; successful
retries did not change dependency versions or security policy. The clean
frontend install used integrity-checked npm cache from the canonical
dependencies stage after registry tarball connections reset. Audits remained
online. A Trivy shared-cache lock failure was resolved by sequential scans.

ARM64 execution is emulated, and native ARM64 release admission remains
mandatory. A preliminary 240-second health observer expired under QEMU.
The final observer uses the existing disposable ARM64 rehearsal's 720-second
envelope, without changing the image healthcheck or deployment resources.
The full synthetic encoder unit test used the existing Windows cwebp 1.6.0;
actual Linux cwebp 1.2.2 binaries and linked libraries were independently
verified against both deployed-release platform children.

## Publication boundary and resource impact

Anonymous GHCR checks returned 404 `MANIFEST_UNKNOWN` for all three d537
immutable tags, with all three published 292 indexes verified as independent
positive controls. No push, workflow dispatch, GHCR publication, GCP access,
OS Login registration, deployment, live SQL or MinIO write occurred.
Staging 292 is the last independently admitted state; this local task does
not claim a fresh private VM inspection.

Docker-reported local image size increases are 1,810,690 bytes on AMD64 and
1,730,908 bytes on ARM64. Application code, JVM options and service counts are
unchanged, so no material application CPU/RAM increase is expected. That is
an expectation, not a live resource measurement.

After separate approval for the exact new SHA, fast-forward main and use one
canonical Release Images dispatch with the existing preview/API/protected CRM
origins. Native builds, full gates, immutable manifests and post-publication
runtime admission remain mandatory. Deployment needs fresh admission and a
fresh capture of the active 292 rollback selectors. Restore those application
selectors/images on failure; do not roll back media references or database
history. Live backfill remains separately unauthorized.

Raw evidence and the final commit receipt are retained in the operator-local
Codex Security collection under `artifacts/apt-20261105/`, including
`verification-evidence.zip`, `EVIDENCE_SHA256SUMS.json`, full Trivy JSON,
package/codec captures, test logs, browser observations and intermediate
failures. These evidence files are not application inputs or GHCR artifacts.
