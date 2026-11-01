# BATCH-025-027 rebase 1

main = 833814f (SGS-025 squash). Replayed with `git rebase --onto`, force-pushed with lease, in the task worktrees (left in place).

| branch | PR | new tip | own commits | PR base | footer |
|---|---|---|---|---|---|
| sgs-026-aoe4-model-rally-start-types | #31 | e2206f1 (was 1fc08bd) | 3 | main | skipped (gh-stack) |
| sgs-027-aoe4-effects-gather-construction | #32 | 77e9370 (was e0bf455) | 3 | sgs-026-aoe4-model-rally-start-types | skipped (gh-stack) |

No conflicts. Native stack: `gh stack link 31 32` refused because the stack still holds #30 (merged) as #30, #31, #32. #31 and #32 are linked in order, so I changed nothing. `gh stack view` fails here because no local stack is initialized.
#31 mergeable_state is "blocked" (likely pending checks or review).
