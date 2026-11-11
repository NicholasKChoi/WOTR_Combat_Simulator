# stack-129-rebase-5

| branch | new tip | own commits | PR base | footer |
|---|---|---|---|---|
| sgs-123-my-builds-library (#129) | ec51ae626902fdc8fd4b0caad8f33594d03ec6d8 | 1 | main | removed |

Replayed 6599f26 onto main (784229a) with --onto from 022fa41, no conflicts. Verified main is an ancestor and the log shows only the one own commit. Force-pushed with lease. `gh pr edit` failed on a Projects-classic GraphQL error for the body, so the body was PATCHed with `gh api` (base was already main). The cf-stack footer is gone. The worktree is removed.
