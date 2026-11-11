# batch12 rebase cascade

Trigger: #134 (sgs-120-named-routes) squash-merged into main as d206c1d.

| Branch | New tip | Own commits | PR base | Footer |
|---|---|---|---|---|
| sgs-121-named-build-routes (#135) | 3723ca5 (was 6ca957b) | 2 (fe4301c, 3723ca5) | main (already main) | updated, #134 dropped |
| sgs-124-page-library (#136) | dcb174ae88fa2765f25eaa8f72f419e3c2e7ad68 (was bbf6c56) | 4 | sgs-121-named-build-routes (kept; #135 is unmerged) | updated, #134 dropped |

Full #135 tip: 3723ca5 (see `git rev-parse origin/sgs-121-named-build-routes`).

- #135 replayed with `rebase --onto origin/main c09b34d`; no conflicts. `git cherry` listed 6 pluses because the squash made the earlier commits non-equivalent, so the replay base was c09b34d as instructed.
- #136 replayed with `rebase --onto 3723ca5 6ca957b`; no conflicts. Ancestor check and `git log` range verified for both.
- Both pushed with force-with-lease. Nothing aborted.
- Footers edited via the REST API because `gh pr edit` fails here (classic Projects error).
- Worktree: $FACTORY_DIR/worktrees/rebase-sgs-121 (left for the next prune; removal fails EBUSY in the sandbox).
