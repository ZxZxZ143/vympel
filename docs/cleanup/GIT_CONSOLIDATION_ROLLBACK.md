# Git Consolidation Rollback Plan

Date: 2026-07-21  
Status: Metadata move completed and verified; root initialization not started  
Workspace: `E:\vympel_full`  
External backup root: `E:\vympel_git_backup_20260721_183725`

## Safety State at Preparation

- The external backup root did not exist when checked at 2026-07-21 18:37 Asia/Qyzylorda, so it contained no unrelated data.
- The `E:` drive was ready and reported 230,869,196,800 bytes available.
- The three source metadata directories contained 746 files and 12,826,710 bytes in total.
- Every destination below is unique and outside `E:\vympel_full`.
- No source `.git` directory has been moved, copied, deleted, repaired, or initialized yet.
- No `.gitmodules` file exists, so there is no submodule metadata to back up or remove.
- The external backup must not be permanently deleted during this task.

## Backup Mapping

Each metadata directory will retain the literal name `.git` inside an app-specific backup directory.

| Current `.git` path | Backup destination | Pre-move inventory |
| --- | --- | --- |
| `E:\vympel_full\.git` | `E:\vympel_git_backup_20260721_183725\repositories\workspace-root\.git` | 0 files, 0 bytes; empty/unusable |
| `E:\vympel_full\vympel_front\.git` | `E:\vympel_git_backup_20260721_183725\repositories\vympel_front\.git` | 330 files, 12,582,700 bytes; branch `master`, commit `ab5ae2458b44c6f1749deb6b65aecb93bbe169bf` |
| `E:\vympel_full\vympel_back\.git` | `E:\vympel_git_backup_20260721_183725\repositories\vympel_back\.git` | 416 files, 244,010 bytes; branch `main`, commit `5115c33842e5290974f39229c4e7e182b3cf8f7e` |

## Completed Move Record

The user approved exactly the three mapped metadata moves, which completed on 2026-07-21 at 19:01:39 Asia/Qyzylorda.

| Original path | Final backup path | Verification |
| --- | --- | --- |
| `E:\vympel_full\.git` | `E:\vympel_git_backup_20260721_183725\repositories\workspace-root\.git` | Original directory moved and destination exists with 0 files as expected. The original path was absent at move verification; documentation tooling subsequently recreated a new empty directory there at 19:02:37. It has zero entries and is not a Git repository. |
| `E:\vympel_full\vympel_front\.git` | `E:\vympel_git_backup_20260721_183725\repositories\vympel_front\.git` | Destination exists; all 330 file hashes match; `fsck` exit 0; `master` at `ab5ae2458b44c6f1749deb6b65aecb93bbe169bf`; original path absent |
| `E:\vympel_full\vympel_back\.git` | `E:\vympel_git_backup_20260721_183725\repositories\vympel_back\.git` | Destination exists; all 416 file hashes match; `fsck` exit 0; `main` at `5115c33842e5290974f39229c4e7e182b3cf8f7e`; original path absent; original `origin` URL preserved inside the backup |

Additional verification:

- SHA-256 pre/post manifests match for every metadata file.
- SHA-256 pre/post manifests match for 988 canonical application source, configuration, documentation, migration, lock, and evidence-index files. Active evidence logs under `docs/tasks/**/logs/**` were left untouched but excluded from content hashing because one was locked by a retained process; they are not application source.
- Canonical `vympel_front`, `vympel_crm`, and `vympel_back` contain zero nested `.git` files/directories outside pruned generated trees.
- `.gitmodules` count remains zero; none was removed or modified.
- The old root `.git` is in the external backup. A newly created empty root `.git` placeholder has zero entries, and `git status` exits 128; `git init -b main` has not been run.
- No commit, remote change, or push occurred.
- Machine-readable verification lives under `E:\vympel_git_backup_20260721_183725\verification\`, including pre/post manifests, both `fsck` reports, and `move-verification-summary.json`.

## Approved Move Procedure

This procedure was executed only after explicit user approval. It is retained here as the exact operation record.

1. Re-resolve all three source paths and verify they are exactly the paths in the table.
2. Re-check that the external backup root is absent. If it unexpectedly exists, stop rather than merge into or overwrite it.
3. Create only the three destination parent directories under the external backup root.
4. Generate a SHA-256 manifest for every file in the two non-empty metadata directories and record the empty root metadata directory.
5. Move each complete `.git` directory with one same-volume `Move-Item` operation; do not copy individual objects and do not delete a source afterward.
6. Verify every source metadata path is absent and every destination metadata path exists.
7. Compare destination file counts, byte totals, and SHA-256 hashes to the pre-move manifest.
8. Run `git --git-dir=<backup .git> fsck --full` against the storefront and backend backups; both must remain readable.
9. Verify that canonical `vympel_front`, `vympel_crm`, and `vympel_back` contain no nested `.git` path.
10. Stop for separate approval before running `git init -b main` at the workspace root.

## Rollback Before Root Initialization

If the metadata move succeeds but root initialization has not occurred:

1. Confirm these original destinations are absent:
   - `E:\vympel_full\.git`
   - `E:\vympel_full\vympel_front\.git`
   - `E:\vympel_full\vympel_back\.git`
2. Move each backup `.git` directory back to its exact original path using the reverse mapping above.
3. Verify:
   - root `.git` is again empty/unusable;
   - storefront branch is `master` at `ab5ae2458b44c6f1749deb6b65aecb93bbe169bf`;
   - backend branch is `main` at `5115c33842e5290974f39229c4e7e182b3cf8f7e` with its original `origin` URL;
   - storefront status returns 348 entries (10 staged, 121 tracked with unstaged changes, 227 untracked);
   - backend status returns 385 entries (54 staged, 121 tracked with unstaged changes, 264 untracked).
4. Compare restored metadata file hashes with the manifest.

## Rollback After Root Initialization

Never restore an old root `.git` over a newly initialized root repository.

1. Stop all Git activity in the workspace.
2. Obtain explicit approval to move the new root `.git` to a separate recovery backup; do not delete or overwrite it.
3. Verify `E:\vympel_full\.git` is absent after that approved move.
4. Restore the three old metadata directories using the reverse mapping.
5. Run the same branch, commit, remote, status-count, hash, and `fsck` checks described above.

Source files do not need to be copied during rollback because the consolidation plan moves metadata only. Current working-tree contents remain in place throughout.

## Rollback After a Baseline Commit

The baseline commit has its own explicit approval gate. If rollback is requested after it exists:

1. Do not reset, clean, restore, or rewrite the new repository.
2. Move the new root `.git` to a separate approved recovery backup so the baseline commit is retained.
3. Restore all prior metadata from `E:\vympel_git_backup_20260721_183725` as described above.
4. Keep both external backups until the user explicitly authorizes a later retention decision.

## Recovery Verification Checklist

- [ ] Every original metadata path restored.
- [ ] Storefront commit and branch match the inventory.
- [ ] Backend commit, branch, and remote match the inventory.
- [ ] Staged index state is visible again in both repositories.
- [ ] Unstaged and untracked counts match or any later intentional source edits are explained.
- [ ] `git fsck --full` has no missing/corrupt objects.
- [ ] No source, migration, lockfile, release evidence, or local `.env` file was moved.
- [ ] External backup retained.
