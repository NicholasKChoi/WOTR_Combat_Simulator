# BATCH-028-029 rebase 1

Rebased sgs-029-aoe4-validate-build-order onto origin/main (e4343b5) with `--onto origin/main 442832e`. No conflicts.

| branch | old tip | new tip | own commits | PR base | footer |
|---|---|---|---|---|---|
| sgs-029-aoe4-validate-build-order (PR #35, draft) | d8bce08 | 871bbb2 | 3 | main | skipped (gh-stack) |

Own commits: 46bcc82, 475340a, 871bbb2. Force-pushed with lease.

Base: the PATCH to main returned 422 "part of a stack", but the PR base was already main (GitHub retargeted it on the #34 merge). Verified via API; PR still draft.
Stack: `gh stack view` reports the branch is not in a local stack; the GitHub stack (#36) still blocks base edits. It is a single-PR stack, so I did not unstack or re-link. Not repaired beyond this; the caller may decide.
Worktree left on the branch, local tip = 871bbb2.
