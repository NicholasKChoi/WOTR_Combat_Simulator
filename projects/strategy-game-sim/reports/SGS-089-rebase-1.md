# SGS-089 rebase 1

Result: NO PUSH NEEDED. PR #93 was already squash-merged into main (MERGED 2026-11-04T16:18:34Z, merge commit fad1e41).
origin/main is fad1e41 (not the expected 9dfe36f; fad1e41 is #93 on top of 9dfe36f).

Rebase: both SGS-089 commits (4865a9d, 308d8f9) were dropped by git as "patch contents already upstream". No conflicts.
New tip: fad1e410c587deac77823d78daf8a6bd79ff697a (identical to origin/main). Merge base: fad1e41 (same commit); 0 commits ahead of main, empty diff vs origin/main.
Remote branch sgs-089-... no longer exists on origin (ls-remote empty). Nothing pushed; force-push skipped because it would recreate a branch for a merged PR.

Checks (in worktree, logs in scratchpad): tsc --noEmit pass; lint:dup pass; npm test pass (47 files, 1458 passed, 10 skipped).
Both guards (productionSeconds and spawnUnit/auto-house) are present in main's simulate.ts.
