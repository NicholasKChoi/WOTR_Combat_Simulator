# SGS-133 implementer report 2

Status: needs_review

- Branch: sgs-133-split-scroll-anchoring-run-bar-cap, tip 464ea8f (rebased onto origin/main e15a982; earlier commit now 6cd40b8)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-133-split-scroll-anchoring-run-bar-cap

## Changed (only acceptance/aoe4-split-scroll.spec.ts)

- Capped state is built through the real UI: storage writes throw, clipboard rejects, saveCopy, click copy-saved-link (hint shows), reopen copy form, clear the copy name (error shows).
- Precondition evaluate: saved-build-link, save-copy-form, copy-saved-link-hint, my-builds-unavailable shown; scrollHeight > clientHeight; height <= 0.4 x 720. auto-run-status removed from the precondition and the test (position check deleted).
- Case (c) content check (one evaluate): at scrollTop 0 my-builds-unavailable bottom is below the bar bottom; at max scrollTop its rect is inside the bar within 1px.
- Case (c) focus check (new test): at max scrollTop build-order-select top is above the bar top; after locator.focus() its rect is inside the bar within 1px.
- Case (a) already asserts bar top 0 +/-1px and scrollY +/-1px; unchanged.
- Cap CSS, anchoring, docs and helpers untouched.

## Important finding on the spec

Clearing the copy name is "optional" in the ticket but is required for the content check. Without the name error the notice bottom is 523.5 against a bar bottom of 532.8 (scrollHeight 306 vs clientHeight 287, the 19px overflow is padding/margins), so my-builds-unavailable is not below the bar at scrollTop 0. With the error it is 524 to 556 against 533. The ticket should make the name-error step required, not optional.

## Tests

- tsc --noEmit and npm run lint:dup: 0 clones. The local saveCopy(page) in aoe4-my-builds-unreadable.spec.ts takes no name and asserts a 201; it is not a clone of the shared helper and jscpd reports none.
- aoe4-split-scroll.spec.ts: 16 passed.
- Every spec using run-bar, auto-run-status or save-* ids (auto-run, build-order*, named-builds*, builds-api*, step-annotations, compact-view, my-builds*, save-*, small-screen, smoke-preview, split-scroll): 379 passed, 1 failed. The failure was aoe4-build-order-step-band.spec.ts:143 (not a user of run-bar or save-*), flaky under load; it passes 13/13 alone.
- I did not rerun npm test or next build (no production code changed since report 1: 2411 passed, build pass).

## Mutation checks

- workbench.module.css:10 `max-height: 40dvh` -> `none`: the capped test, the focus test and the capped focus-ring test fail (the capped test fails at the precondition `scrollHeight > clientHeight`). To prove the content check itself catches it, I also removed the earlier overflow and height expectations temporarily: it then failed on `belowAtTop` expected true, received false. Reverted both.
- Focus check: fails under the same mutation (select top is not above bar top when the bar does not scroll). Reverted.
- Case (a) mutation from report 1 was not rerun (test unchanged).

## Pre-existing tests edited

None in this pass (the earlier pass changed none of the assertions in aoe4-my-builds.spec.ts).

## Doc claims

None changed in this pass.

## Out-of-scope findings

- aoe4-build-order-step-band.spec.ts:143 is flaky when run in a large parallel batch.

## Unverified assumptions added

None.
