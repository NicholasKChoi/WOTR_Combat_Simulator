# Rebase cascade: #127-#129 onto main 14639c0

| Branch | PR | New tip | Own commits | PR base | Footer |
|---|---|---|---|---|---|
| sgs-116-step-table-readability | #127 | 5ade9f035288390ea9f36c1ac31e4233c148e168 | 2 | main | updated |
| sgs-118-acceptance-test-debt | #128 | e91b484bbd019450d784a5a909c9658b0331bf4c | 1 | sgs-116-step-table-readability | updated |
| sgs-123-my-builds-library | #129 | cf78c623aa8ad3b9e35c11854b0d5e834b7a88ad | 1 | sgs-118-acceptance-test-debt | updated |

- #127's base was already main when I started. The first two cherry `+` lines were the squash-merged chart commits, so replay base was 55ed3a1.
- Replay bases for #128 and #129 were the old parent tips (f45a37d, 3779d08).
- Ancestry and `git log` checks passed for every branch. No conflicts. All pushes were force-with-lease against the old tips.
- `gh pr edit --body-file` failed (Projects classic GraphQL deprecation). The footers were applied with `gh api -X PATCH` instead. The footers now list #127, #128, #129 with #126 dropped.
- No builds were run. The worktree was removed.
