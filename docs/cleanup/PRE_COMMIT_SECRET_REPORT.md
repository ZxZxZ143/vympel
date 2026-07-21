# Pre-Commit Secret Report

Date: 2026-07-21  
Scope: Staged canonical baseline after root Git initialization  
Result: Pass for the baseline commit; the staged index has been audited.

No secret values are included in this report.

## Findings

| Path | Risk type | Git status | Action |
| --- | --- | --- | --- |
| `E:\vympel_full\.env` | Local Docker/database/JWT/rate-limit/Redis/S3/CMS/bootstrap configuration | Ignored (verified) | Preserve in place; never stage |
| `E:\vympel_full\vympel_back\.env` | Local backend database/JWT/rate-limit/Redis/S3/CMS/bootstrap configuration | Ignored (verified) | Preserve in place; never stage |
| `E:\vympel_full\vympel_front\.env` | Local storefront API/media/CMS server configuration | Ignored (verified) | Preserve in place; never stage |
| `E:\vympel_full\vympel_crm\.env` | Local CRM API/media/telemetry configuration | Ignored (verified) | Preserve in place; never stage |
| Root and app `.env.example` / `.env.docker.example` files | Configuration key inventory; sensitive root values are blank and app examples use placeholders | Untracked baseline candidate | Include after final placeholder review |
| `E:\vympel_full\compose.yml` | Sensitive variable names wired through environment references; no hardcoded secret was identified | Untracked baseline candidate | Include; never write resolved Compose output to the repository |
| Backend `application.yml` and `application-local.yml` | Environment references and explicit local-only configuration contract | Untracked baseline candidate | Include; production remains fail-closed through `NonLocalSecurityConfigurationValidator` |
| `E:\vympel_full\vympel_back\src\test\java\com\shop\vympel\logging\SensitiveDataMaskerTest.java` | Compact JWT-shaped synthetic masking fixture | Untracked baseline candidate | Include; it is not a credential |
| `docs/tasks/vympel_final_release_verification/logs/**` | Required release evidence that mentions credential field names in bounded test/runtime messages | Untracked baseline candidate by explicit evidence exception | Include as repository-owned evidence; exact credential-signature scans are clean |
| Storefront/CRM telemetry source and examples | Telemetry flags/environment identifiers; no credential-bearing telemetry assignment detected | Untracked baseline candidate | Include |

## Signature Scan

The effective 1,139-file pre-report candidate set was scanned without printing matching contents.

| Pattern class | Result |
| --- | --- |
| PEM/OpenSSH private-key header | 0 matches |
| AWS access-key identifier | 0 matches |
| GitHub token prefix | 0 matches |
| Slack token prefix | 0 matches |
| Stripe secret-key prefix | 0 matches |
| Compact JWT-shaped value | 1 match: the intentional `SensitiveDataMaskerTest` fixture documented above |

A key-name/assignment scan also reviewed password, secret, token, access-key, Redis URL, database password, bootstrap administrator password, CMS revalidation secret, and telemetry credential-like names. Results were blank example slots, environment references, placeholder/local examples, documentation/evidence text, runtime code identifiers, or synthetic test fixtures. No unexplained literal credential candidate remained.

## Post-Initialization Ignore and Candidate Verification

The final baseline index contains 1,143 files. It confirms all four real `.env` files are ignored while `.env.example` files remain staged. Dependencies, `.next`, Gradle/build output, IDE files, and runtime logs outside the release-evidence tree are ignored. The largest candidate is the intentional 1,266,796-byte final-release evidence log; no unexplained large archive, database export, copied repository, dependency cache, or build output is staged.

The following staged-index checks were completed immediately before the baseline commit:

1. `git status --ignored --short` review for all four `.env` files and generated trees passed.
2. Candidate and staged-file inventory plus largest-file review passed.
3. The staged private-key/provider-token/access-key signature scan returned no matches.
4. `git diff --cached --name-only` returned 1,143 files and the prohibited-path classifier returned zero violations.
5. The only staged JWT-shaped match is the documented synthetic masking fixture. Secret-like code paths were reviewed as environment interpolation, security code identifiers, placeholders, or synthetic local/test fixtures.

## Decision

Secret review passes for the explicitly authorized baseline commit. No real environment file, private key, provider token, database dump, dependency cache, build output, old Git backup, or temporary verification repository is staged.

## Deployment Implementation Candidate Gate

The separately authorized deployment/ADMIN implementation was scanned again before its second commit. The 59-file pre-report candidate set contained only source, tests, lockfiles, Docker/Compose/proxy templates, placeholder environment examples, scripts, workflows, runbooks, and cleanup/project-memory updates.

| Path | Risk type | Git status | Action |
| --- | --- | --- | --- |
| Root and application working `.env` files | Database, JWT, HMAC, Redis, object-storage, CMS, and local bootstrap values | Ignored; absent from candidate set | Preserved locally; never print or stage |
| `infrastructure/env/*.env.example` | Deployment credential names and deliberately invalid placeholder values | Implementation candidate | Include; fail-closed validator rejects placeholders/all-zero SHA |
| `deployment/release-manifest.example.yml` | Registry/digest/backup evidence fields | Implementation candidate | Include placeholder-only template; real release manifests stay outside Git if they contain sensitive evidence |
| `.github/workflows/release-images.yml` | Optional registry credentials | Implementation candidate | Include secret-name references only; push requires manual input plus repository variable and configured secrets |
| Dockerfiles and deployment Compose | Runtime secret injection boundaries | Implementation candidate | Include; no `.env`, credential, or private key is copied/baked |
| Disposable ADMIN verification container/database | Temporary local account and encoded hash | Removed runtime state; never a Git candidate | Only sanitized pass/fail evidence retained |

Pre-report candidate scans returned zero prohibited generated/secret paths, PEM/OpenSSH private-key headers, AWS/GitHub/Slack/Stripe provider-token signatures, compact JWT-shaped values, or secret-bearing `NEXT_PUBLIC_*` keys. `git diff --check` passed. The final staged index contains 60 intentional files and was rescanned after this report itself was staged: zero prohibited paths, private keys, provider tokens, JWT-shaped values, browser-exposed secret keys, mutable application `latest` tags, or unexplained files above 2 MiB; all nine shell scripts are mode `100755`, no remote exists, and the staged diff whitespace check passes. No resolved Compose output, password, hash, access/refresh token, TLS key, database dump, dependency tree, build output, Docker credential, or verification database/container enters the commit.
