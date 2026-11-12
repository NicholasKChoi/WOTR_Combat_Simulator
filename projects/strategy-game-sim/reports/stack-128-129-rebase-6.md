# Rebase cascade after #138 squash-merge (origin/main 2ad0dafb)

| Branch | New tip | Own commits | PR base | Footer updated |
|---|---|---|---|---|
| sgs-128-shared-test-helpers-and-jscpd-gates (#139) | 802e22208f1bc9dc2ca3dd72ace2ee7e660ff3f3 | 3 | main (already main) | yes |
| sgs-129-strict-typescript (#140) | fedc9892ee5b481d765fea4aafe3096845d675f2 | 1 | sgs-128-shared-test-helpers-and-jscpd-gates | yes |

- #139 replayed with `--onto origin/main 8691f1e` (the old sgs-127 tip). Own commits: d883e36, 4938c74, 802e222.
- #140 replayed with `--onto 802e222 9bbe59d`. Own commit: fedc989.
- No conflicts. Ancestry and own-commit log verified for both. Both pushed with force-with-lease.
- Footers now list #139 and #140 only (merged #138 dropped). `gh pr edit` failed on a Projects-classic deprecation error, so footers were applied with `gh api PATCH`.
- Worktree removed.
