# Monorepo Baseline Verification

Date: 2026-07-21  
Workspace: `E:\vympel_full`  
Target branch: `main`  
Baseline commit: `0fd2f14f75021aab8eafcd4c6f34739d3d1a3418`

No secret values are included in this report.

## Git Metadata and Backup Gate

| Check | Command or evidence | Exit | Result |
| --- | --- | ---: | --- |
| External backup root | `Get-Item E:\vympel_git_backup_20260721_183725` | 0 | Pass; directory exists outside the workspace. |
| Original root metadata backup | Documented path `repositories\workspace-root\.git` | 0 | Pass; destination exists and is intentionally empty. |
| Storefront metadata backup | `git --git-dir=<storefront backup> fsck --full` | 0 | Pass; `master` remains at `ab5ae2458b44c6f1749deb6b65aecb93bbe169bf`. |
| Backend metadata backup | `git --git-dir=<backend backup> fsck --full` | 0 | Pass; `main` remains at `5115c33842e5290974f39229c4e7e182b3cf8f7e`; original remote metadata remains only in the backup. |
| Source preservation | `verification\move-verification-summary.json` | 0 | Pass; 988 pre/post canonical source hashes matched at the metadata move. |
| Canonical source entry points | Storefront/CRM package manifests and locks, backend Gradle wrapper/build, root Compose | 0 | Pass; every checked source entry point exists. |
| Nested canonical Git metadata | Recursive `.git` scan of storefront, CRM, backend, infrastructure, and deployment roots | 0 | Pass; zero nested paths. |

The external backup was not modified, deleted, restored, or treated as canonical source.

## Root Repository

| Command | Exit | Result |
| --- | ---: | --- |
| `git init -b main` | 0 | Initialized one repository at `E:/vympel_full/.git`. |
| `git rev-parse --show-toplevel` | 0 | Returned `E:/vympel_full`. |
| `git symbolic-ref --short HEAD` | 0 | Returned `main`. |
| `git remote -v` | 0 | Empty; no remote was added or inherited. |

## Ignore, Candidate, and Secret Audit

The root ignore policy was expanded before staging to cover local backup archives, private-key/container credential files, browser-test caches, infrastructure state, and temporary deployment secret material while retaining lockfiles, Gradle wrapper files, source, tests, Dockerfiles, Compose templates, Liquibase changelogs, workflows, scripts, documentation, and intentional release evidence.

| Check | Exit | Result |
| --- | ---: | --- |
| `git check-ignore -v` for all four working `.env` files and generated trees | 0 | Pass; real environment files, dependency trees, Next output, Gradle/build output, IDE state, and ordinary logs are ignored. |
| `git check-ignore -v` for examples, lockfiles, wrapper, and release evidence | 0 | Pass; examples and required canonical files remain candidates. |
| `git ls-files --others --exclude-standard` inventory | 0 | 1,142 pre-report candidate files; largest is the intentional 1,266,796-byte final-release evidence log. |
| Exact private-key/provider-token/access-key signature scan | 1 (`rg` no matches) | Pass; no matching candidate path. |
| JWT-shaped signature scan | 1 (`rg` no matches under the final pattern) | Pass; the separately reviewed synthetic masking fixture remains documented in `PRE_COMMIT_SECRET_REPORT.md`. |
| Secret-like literal assignment scan | 1 (`rg` no matches) | Pass; no unexplained candidate path. |

See `docs/cleanup/PRE_COMMIT_SECRET_REPORT.md` for the path/risk/status/action inventory. Resolved Compose output was not stored because it can contain interpolated local values.

## Backend Baseline

Java: Microsoft OpenJDK 17.0.18 configured through `JAVA_HOME` for the Gradle wrapper.

| Command | Exit | Result |
| --- | ---: | --- |
| `.\gradlew.bat test` | 0 | Pass; Gradle reported `BUILD SUCCESSFUL`. |
| `.\gradlew.bat bootJar` | 0 | Pass; executable Spring Boot JAR built successfully. |

The first sandboxed Gradle attempt was blocked before task execution because the wrapper could not write its user-cache lock. The exact commands passed after granting the requested Gradle-cache filesystem access; this was not an application failure.

## Storefront Baseline

| Command | Exit | Result |
| --- | ---: | --- |
| `npm ci` | 0 | Pass; 662 packages installed, 0 vulnerabilities reported. |
| `npm run lint` | 0 | Pass after repairing 14 React 19 lint violations involving render-time ref access and synchronous effect resets. |
| `npm run typecheck` | 0 | Pass. |
| `npm run test` | 0 | Pass; 8 files, 23 tests. |
| `npm run build` | 0 | Pass; Next.js 16.2.10 production build generated all RU/KZ/EN routes. |

Vitest and the production build required permission to spawn their bounded local esbuild/Next workers after default sandbox attempts returned `spawn EPERM`. The elevated reruns passed; no development server remained running.

## CRM Baseline

| Command | Exit | Result |
| --- | ---: | --- |
| `npm ci` | 0 | Pass; 387 packages installed, 0 vulnerabilities reported. |
| `npm run lint` | 0 | Pass. |
| `npx tsc --noEmit` | 0 | Pass; the baseline package did not yet expose a `typecheck` script. |
| `npm run test` | 0 | Pass; 6 files, 23 tests. |
| `npm run build` | 0 | Pass; Next.js 16.2.10 production build generated all CRM routes. |

Vitest and the post-compile Next worker required the same bounded process-spawn permission after default sandbox attempts returned `spawn EPERM`. The elevated reruns passed; no development server remained running.

## Infrastructure Baseline

| Command | Exit | Result |
| --- | ---: | --- |
| `docker compose config --quiet` | 0 | Pass; authoritative local `compose.yml` resolves without printing interpolated values. |

## Baseline Decision

All required finite baseline checks pass. The final staged index contains 1,143 intentional files, the prohibited-path classifier reports zero violations, the staged private-key/provider-token signature scan has no matches, and the only JWT-shaped match is the documented synthetic masking fixture. The candidate is approved for the local commit `Initial Vympel monorepo baseline`. No remote, push, registry operation, or external deployment is authorized or performed.

The commit was created successfully as `0fd2f14f75021aab8eafcd4c6f34739d3d1a3418`. Immediately afterward, root `git status` was clean, root `git log` resolved the commit, no remote existed, and no nested canonical `.git` directory was present.
