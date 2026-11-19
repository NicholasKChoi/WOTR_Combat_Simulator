# SGS-210 implementer-9 (Rework 1)

Status: needs_review
Branch: sgs-210-annotations-group-repeated-step-copies, tip d6545499c02fa84014ddbe328d709871d6a2095f
Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-210-annotations-group-repeated-step-copies
Checkout call: reused; tip unchanged (0f45468...) so no own-commit check needed.

## Files touched
- components/apps/aoe4-build-order/step-annotations.test.ts: test "gives a repeated source copies equal to its copy count and a run equal to the combined run" now uses its own timings (copy 1 1..6, copy 2 11..15, source 1 21..25) via runInput with the identity-path live; asserts copies length 2 and run matches { runStep: 0, startedAt: 1, completedAt: 15 }.
- docs/aoe4-build-order-ui.md: line 106 Finished sentence and line 211 hover sentence replaced with the exact text from the Required fixes.

## Mutation checks (step-annotations.ts:231, undone via git checkout)
- combineRuns(copies) -> copies[0]: the test failed (plus other combine/blockedBy tests that also reach buildAnnotations).
- combineRuns(copies) -> copies[copies.length - 1]: the test failed (same set plus alignment tests).
Both mutations undone; tree clean before commit.

## Tests and checks
- step-annotations.test.ts: 103 passed.
- npm test: 94 files passed, 1 skipped; 3025 tests passed, 15 skipped.
- tsc --noEmit clean; lint:dup 0 clones.
- Codegen/build: not applicable to this rework (no signature or generated changes).
- Pre-existing tests edited: only the one above, as directed by the Required fixes.

## Doc claims
- Line 106: "the last copy's finish once every copy has finished (`ongoing` while a copy is in progress and no copy is waiting or not reached, an en dash while any copy is waiting or not reached)"; wording supplied verbatim by review.
- Line 211: "...the span shows once any copy has started, even while the row reads waiting or not reached ... a waiting or not-reached step none of whose copies has started, or a row with no run times, shows no band."; verbatim from review.

## Invariant check, unverified assumptions, out-of-scope
No production code changed; invariants upheld. No assumptions added. No out-of-scope findings.
