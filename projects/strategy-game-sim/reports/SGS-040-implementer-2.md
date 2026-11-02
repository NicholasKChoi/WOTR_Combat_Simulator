# SGS-040 implementer 2 (rework 1)
Branch sgs-040-aoe4-paste-grammar-deposits-reactions, tip d8c9a95d586243e20a0326b7fb047aa1de80dd87, worktree .claude/code-factory/worktrees/sgs-040-aoe4-paste-grammar-deposits-reactions.
- docs/aoe4-build-order.md: move row now `move <N or all> <node> ...`, no bare pipe; the row has 3 cells like the others.
- parse-text.test.ts: dead assertion now checks formatBuildStep output; new test for start deposit order with keys { stone, gold#3, gold, gold#2 } -> `start 2 gold 1 gold#2 1 gold#3 1 stone`.
- Mutation: reversed NODE_REFS in formatStart; the new test and 2 existing ones failed; reverted.
- tsc clean, lint:dup 0 clones, npm test 989/989 pass. No pre-existing tests edited besides the dead assertion.
- Ticket checklist ticked (state branch file, uncommitted).
Status: needs_review
