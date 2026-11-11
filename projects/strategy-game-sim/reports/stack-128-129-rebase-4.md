Rebase cascade after #127 merged (d6aa171). All clean, no conflicts.

| Branch | New tip | Own commits | PR base | Footer |
|---|---|---|---|---|
| sgs-118-acceptance-test-debt (#128) | 022fa41920739b7e3a552dc322f12f550d5c6a6b | 1 (replayed from 5ade9f0) | main | updated |
| sgs-123-my-builds-library (#129) | 6599f26743ccdbb9eece242658f74de825da34bf | 1 (replayed from e91b484) | sgs-118-acceptance-test-debt | updated |

Footers drop merged #127. Bodies were applied with gh api PATCH because gh pr edit --base hit a Projects classic GraphQL error (the base change on #129 still succeeded; #128 was already on main). Both branches were force-pushed with lease. The worktree was removed.
