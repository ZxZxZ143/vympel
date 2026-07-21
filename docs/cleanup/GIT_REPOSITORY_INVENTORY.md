# Git Repository Inventory

Date: 2026-07-21  
Workspace: `E:\vympel_full`  
Phase: Metadata move completed and verified; root initialization awaits separate approval.

## Summary

The pre-move scan found exactly three `.git` directories outside generated dependency/build trees and no `.git` files. No `.gitmodules` file exists. On 2026-07-21 the three directories were moved intact to the external paths recorded below after explicit approval. The storefront, CRM, and backend contain no nested Git metadata, and root initialization has not started. Documentation tooling later recreated a new empty root `.git` directory with zero entries; it is not a Git repository (`git status` exits 128) and is not the backed-up original metadata.

All histories, indexes, reflogs, dangling objects, and the backend remote configuration are preserved under `E:\vympel_git_backup_20260721_183725\repositories\`. Pre/post metadata hashes and 988 canonical source hashes matched. See `GIT_CONSOLIDATION_ROLLBACK.md` for exact final paths and restoration instructions.

| Repository | Branch | Remote | Last commit | Dirty | Unique history | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| `E:\vympel_full\.git` (directory) | None | None | None | Not measurable; empty metadata directory | None; zero files/objects/refs | TEMPORARY - SAFE TO REMOVE, but move to the external backup first |
| `E:\vympel_full\vympel_front\.git` (directory) | `master` | None | `ab5ae2458b44c6f1749deb6b65aecb93bbe169bf` - 2026-03-23 - `initial commit` | Yes: 348 status entries; 10 staged, 121 tracked entries with unstaged changes, 227 untracked files | Yes: one reachable commit, no configured remote, and no matching commit in another discovered repository | BACK UP AND REMOVE FROM WORKSPACE; retain the backup rather than importing it into the requested clean baseline |
| `E:\vympel_full\vympel_back\.git` (directory) | `main` | `origin` = `git@github.com:ZxZxZ143/vympel-backend.git` | `5115c33842e5290974f39229c4e7e182b3cf8f7e` - 2026-03-02 - `ADD: full product add, get product detail, some fixes` | Yes: 385 status entries; 54 staged, 121 tracked entries with unstaged changes, 264 untracked files | No locally unique reachable commits detected: all three commits are reachable from the locally recorded `origin/main`; remote server reachability was not re-fetched | BACK UP AND REMOVE FROM WORKSPACE; do not reuse its remote automatically |

## Discovery Method and Scope

- Traversed the workspace while pruning `.git`, `node_modules`, `.next`, `.gradle`, `build`, `target`, `dist`, `out`, `coverage`, `test-results`, and `playwright-report` trees.
- Found no nested Git metadata in CRM, temporary verification copies, backup directories, dependencies, or caches.
- Set `GIT_OPTIONAL_LOCKS=0` for read-only Git inspection so status/log queries did not refresh indexes.
- Ran `git fsck --full` against both usable repositories. Both returned exit code 0 with no missing/corrupt objects and no dangling commits. Storefront has four dangling blob/tree messages; backend has 92 dangling blob/tree messages. Moving each `.git` directory as-is preserves these objects and its index.
- The backend local `main` and locally stored `origin/main` both resolve to `5115c33842e5290974f39229c4e7e182b3cf8f7e`. No network fetch was performed, so this is a local-ref comparison rather than proof that GitHub is currently reachable.

## Root Metadata Detail

- Path: `E:\vympel_full\.git`
- Type: directory
- Files: 0
- Size: 0 bytes
- `git status`, `git log`, branch, and remote inspection all fail because the directory is not a repository.
- There is no history or index to import. It will still be included in the external backup for exact rollback.

## Storefront Repository Detail

- Path: `E:\vympel_full\vympel_front\.git`
- Metadata: 330 files, 12,582,700 bytes.
- Reachable history: one commit (`ab5ae2458b44c6f1749deb6b65aecb93bbe169bf`).
- Commit tree: 126 files using the earlier root-style layout (`components/`, `public/`, `assets/`, `api/`, and similar paths), while the current canonical app is primarily under `src/`.
- Staged snapshot: 9 additions and 1 rename.
- Unstaged snapshot: 104 deletions and 17 modifications. All 121 tracked status entries have an unstaged component, including files that also have staged state.
- Untracked files: 227, grouped as `src` 184, `public` 35, `scripts` 3, plus one each for `vitest.config.ts`, `security-headers.mjs`, `.env.example`, `Dockerfile`, and `.dockerignore`.
- History assessment: usable but locally unique because no remote is configured. Preserve the full metadata externally. The requested target is a new clean baseline, so importing this one-commit history is not recommended unless the user changes that target.

### Storefront staged snapshot

- `A` - `src/assets/icons/SortIcon.tsx`
- `A` - `src/components/CatalogPage/Catalog/CategoryBreadCrumbs/index.tsx`
- `A` - `src/components/CatalogPage/Catalog/Sort/config.ts`
- `A` - `src/components/CatalogPage/Catalog/Sort/index.tsx`
- `A` - `src/components/CatalogPage/Catalog/Sort/type.ts`
- `A` - `src/components/CatalogPage/Catalog/index.tsx`
- `A` - `src/components/form/RadioGroup/index.tsx`
- `A` - `src/hooks/usePagination.tsx`
- `A` - `src/hooks/useSort.ts`
- `R100` - `proxy.ts` -> `src/proxy.ts`

## Backend Repository Detail

- Path: `E:\vympel_full\vympel_back\.git`
- Metadata: 416 files, 244,010 bytes.
- Reachable history: three commits: `ca7181742053c12cfe320211245154908135889a`, `2e8a9561570a180e042a7b574c480ddb862b9962`, and `5115c33842e5290974f39229c4e7e182b3cf8f7e`.
- Commit tree: 162 files; all three commits are reachable from local `origin/main`.
- Staged snapshot: 26 additions and 28 renames.
- Unstaged snapshot: 121 modifications. All tracked status entries have an unstaged component, including the 54 entries that also have staged state.
- Untracked files: 264, grouped as `src` 261 plus `.env.example`, `Dockerfile`, and `.dockerignore`.
- History assessment: usable. No locally unique reachable commit was detected relative to the stored remote-tracking ref, but the external backup remains necessary to preserve the index, reflogs, dangling objects, remote configuration, and exact recovery state.

### Backend staged snapshot

- `A` - `src/main/java/com/shop/vympel/controllers/CategoryController.java`
- `A` - `src/main/java/com/shop/vympel/db/entity/i18n/EmbeddableId.java`
- `A` - `src/main/java/com/shop/vympel/db/entity/i18n/EntityI18n.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/CategoryI18Repository.java` -> `src/main/java/com/shop/vympel/db/repositories/category/CategoryI18Repository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/CategoryRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/category/CategoryRepository.java`
- `R058` - `src/main/java/com/shop/vympel/db/repositories/MediaRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/media/MediaRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/ProductCategoryRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/ProductCategoryRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/ProductDescriptionI18Repository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/ProductDescriptionI18Repository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/ProductDescriptionRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/ProductDescriptionRepository.java`
- `R050` - `src/main/java/com/shop/vympel/db/repositories/ProductRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/ProductRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/Producti18nRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/Producti18nRepository.java`
- `A` - `src/main/java/com/shop/vympel/db/repositories/product/features/BrandCountryRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/BrandRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/features/BrandRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/CollectionRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/features/CollectionRepository.java`
- `A` - `src/main/java/com/shop/vympel/db/repositories/product/features/CountryI18nRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/FeatureRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/features/FeatureRepository.java`
- `A` - `src/main/java/com/shop/vympel/db/repositories/product/features/GenderI18nRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/GenderRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/features/GenderRepository.java`
- `A` - `src/main/java/com/shop/vympel/db/repositories/product/features/GlassTypeI18nRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/GlassTypeRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/features/GlassTypeRepository.java`
- `A` - `src/main/java/com/shop/vympel/db/repositories/product/features/MaterialI18nRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/MaterialRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/features/MaterialRepository.java`
- `A` - `src/main/java/com/shop/vympel/db/repositories/product/features/MechanismI18nRepository.java`
- `A` - `src/main/java/com/shop/vympel/db/repositories/product/features/StoneInlayI18nRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/StoneInlayRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/features/StoneInlayRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/WatchDetailRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/watchDetail/WatchDetailRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/WatchMechanismRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/product/watchDetail/WatchMechanismRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/RoleRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/user/RoleRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/UserRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/user/UserRepository.java`
- `R100` - `src/main/java/com/shop/vympel/db/repositories/UserRoleRepository.java` -> `src/main/java/com/shop/vympel/db/repositories/user/UserRoleRepository.java`
- `A` - `src/main/java/com/shop/vympel/dtos/category/CategoryWithParentResponse.java`
- `A` - `src/main/java/com/shop/vympel/dtos/product/ProductShortResponse.java`
- `R100` - `src/main/java/com/shop/vympel/dtos/product/DescriptionCreateRequest.java` -> `src/main/java/com/shop/vympel/dtos/product/description/DescriptionCreateRequest.java`
- `R100` - `src/main/java/com/shop/vympel/dtos/product/DescriptionResponse.java` -> `src/main/java/com/shop/vympel/dtos/product/description/DescriptionResponse.java`
- `R100` - `src/main/java/com/shop/vympel/dtos/product/ImagesUploadRequest.java` -> `src/main/java/com/shop/vympel/dtos/product/description/ImagesUploadRequest.java`
- `R100` - `src/main/java/com/shop/vympel/dtos/product/ProductNameCreateRequest.java` -> `src/main/java/com/shop/vympel/dtos/product/description/ProductNameCreateRequest.java`
- `R100` - `src/main/java/com/shop/vympel/dtos/product/WatchDetailCreateRequest.java` -> `src/main/java/com/shop/vympel/dtos/product/details/WatchDetailCreateRequest.java`
- `R100` - `src/main/java/com/shop/vympel/dtos/product/WatchDetailResponse.java` -> `src/main/java/com/shop/vympel/dtos/product/details/WatchDetailResponse.java`
- `R100` - `src/main/java/com/shop/vympel/dtos/product/WatchDetailUpdateRequest.java` -> `src/main/java/com/shop/vympel/dtos/product/details/WatchDetailUpdateRequest.java`
- `A` - `src/main/java/com/shop/vympel/dtos/product/features/BrandResponse.java`
- `A` - `src/main/java/com/shop/vympel/dtos/product/features/CaseMaterialResponse.java`
- `A` - `src/main/java/com/shop/vympel/dtos/product/features/CollectionResponse.java`
- `A` - `src/main/java/com/shop/vympel/dtos/product/features/FeatureDto.java`
- `A` - `src/main/java/com/shop/vympel/dtos/product/features/GenderResponse.java`
- `A` - `src/main/java/com/shop/vympel/dtos/product/features/GlassTypeResponse.java`
- `A` - `src/main/java/com/shop/vympel/dtos/product/features/MechanismResponse.java`
- `A` - `src/main/java/com/shop/vympel/dtos/product/features/StoneInlineResponse.java`
- `A` - `src/main/java/com/shop/vympel/dtos/product/features/StrapMaterialResponse.java`
- `R100` - `src/main/java/com/shop/vympel/mappers/CategoryMapper.java` -> `src/main/java/com/shop/vympel/mappers/category/CategoryMapper.java`
- `A` - `src/main/java/com/shop/vympel/mappers/category/CategoryReferenceMapper.java`
- `A` - `src/main/java/com/shop/vympel/services/categoryProduct/CategoryProductService.java`
- `A` - `src/main/java/com/shop/vympel/services/categoryProduct/CategoryProductServiceImpl.java`
- `A` - `src/main/resources/db/changelog/2026-03-10-01-fix-lang-and-add-checks-countryi18n.xml`
- `A` - `src/main/resources/db/changelog/2026-03-13-01-add-model-product.xml`

## Canonical Source and Local-State Classification

| Classification | Paths / findings | Intended baseline action |
| --- | --- | --- |
| Canonical root source/tooling | `AGENTS.md`, `compose.yml`, `.github/workflows/`, root `scripts/`, `.env.example`, `.env.docker.example`, `.gitignore` | Include |
| Storefront application | `vympel_front/src/`, `public/`, tests, scripts, package manifests/lockfile, Dockerfile/config | Include |
| CRM application | `vympel_crm/src/`, tests, package manifests/lockfile, Dockerfile/config | Include |
| Backend application | `vympel_back/src/`, 37 Liquibase changelog files, Gradle wrapper, build scripts, Dockerfile, compatibility Compose file | Include |
| Documentation and release evidence | `docs/`, including final reports, 40 screenshots, and task-owned evidence under `docs/tasks/**/logs/**` | Include; evidence log exceptions intentionally override generic log/temp ignores |
| Local secrets | Root/backend/storefront/CRM `.env` files | Preserve locally; exclude |
| Dependencies and build output | Storefront/CRM `node_modules`, `.next`; backend `.gradle`, `build` | Preserve on disk; exclude |
| Runtime logs | Root `logs/`, backend `logs/` and archives | Preserve on disk; exclude |
| IDE/tool state | Three `.idea` trees plus empty root `.agents` and `.codex` directories | Preserve on disk; exclude (empty directories would not be committed in any case) |
| Temporary audit workspaces | `.step9_verification_work`, `.step9_lockregen_crm` | Already absent; ignore rules prevent recurrence |
| Database dumps/backups | No `.dump` or `.backup` file found outside excluded/generated trees; the repository-owned Step 7 `.sql` preflight is source | Exclude future dumps/backups; include the SQL preflight |
| Copied repositories/backups inside workspace | None found | No action |
| `.gitmodules` | None found | No action and no removal approval required |

## Candidate Baseline Inventory Before Root Initialization

Using the canonical root ignore rules and excluding `.git` metadata produced 1,139 candidate files before these cleanup reports were added: backend 452, documentation 347, storefront 258, CRM 74, root scripts 2, and six root/config entries. Required lockfiles, Gradle wrapper, Docker/Compose files, Liquibase master, source/tests, `.env.example`, final reports, screenshots, and evidence logs were present. Actual `.env`, dependencies, builds, IDE state, and runtime logs were absent.

The largest candidate was a required final-release evidence log at 1,266,796 bytes. No candidate exceeded 1.3 MB; the next largest files were intentional storefront media assets and package lockfiles. No archive, duplicate source copy, dependency cache, local database dump, or old Git backup was present in the candidate set.

## Approval Boundary

The approved metadata move is complete. The next restricted action is `git init -b main` at `E:\vympel_full`; it has not been run and requires separate explicit user approval. Commit, remote, and push gates remain unapproved.
