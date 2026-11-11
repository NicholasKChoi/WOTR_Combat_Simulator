| branch | new tip | own commits | PR base | footer |
|---|---|---|---|---|
| sgs-119-named-build-shapes (#125) | 58a1baa085ef53445d2db77b83f2b23a069c4b2f | 2 | main | removed (single PR) |

Replayed onto origin/main 7d31a79 with `--onto origin/main 612a4f3` (612a4f3 was the squashed parent commit). Ancestry verified. `git log origin/main..HEAD` shows only the two own commits (72739d7, 58a1baa). Force-pushed with lease. PR base was already main. `gh pr edit` failed on a projects-classic GraphQL error, so the body was patched with `gh api -X PATCH`. The cf-stack block is removed. No conflicts. Worktree removed.
