# Rebase cascade: #133 onto main

| branch | new tip | own commits | PR base | footer |
|---|---|---|---|---|
| sgs-115-split-scroll (#133) | df58ca1 | 3 | main (was sgs-112-server-debt) | removed (single PR left) |

- Replay base 92d5ccc; the 3 commits from the squashed #132 were dropped. Own commits: ffdead3, a463e5f, df58ca1.
- Verified: origin/main is an ancestor of HEAD, and `origin/main..HEAD` shows exactly those 3 commits.
- Force-pushed with lease (3bc3a1e -> df58ca1). Base and body were patched via `gh api -X PATCH`.
- No conflicts. Scratch worktree removed.
