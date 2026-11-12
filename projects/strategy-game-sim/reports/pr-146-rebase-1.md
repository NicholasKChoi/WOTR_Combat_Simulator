# PR 146 rebase 1

Trigger: #145 (sgs-136) squash-merged into main as b37b56b.

| branch | new tip | own commits | PR base | footer |
|---|---|---|---|---|
| sgs-140-editor-compact-mode | ffc4346d790ccf726b8fdad3208f76a8cb3ee9cf (was 3ca726c) | 1 | main | updated (#145 dropped, only #146 remains) |

- Replayed with `git rebase --onto origin/main b97ddcb`; no conflicts. origin/main is an ancestor of the new tip and `origin/main..HEAD` is exactly the one compact-mode commit. (git cherry listed the three squashed SGS-136 commits as `+` because the squash changed their patch ids; they were correctly excluded by the explicit replay base.)
- Force-pushed with lease. PR stays draft. Base and body set via `gh api -X PATCH`.
- Rebase worktree removed. No builds run.
