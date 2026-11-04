# SGS-088 acceptance-test 1

Verdict: PASS. Branch sgs-088-aoe4-workbench-ui-state-kept, new tip 3b0bd18 (was 85e9ed4, base 3c7b66a). Harness ran (Playwright, Chromium, own next dev).

## Coverage of criteria (all already covered by implementer specs; verified passing after rebase)
- Move/delete flags: step-table.spec "moving a row carries its open state and deleting a row keeps the others".
- Text edit sets rally -> row open with value: "a text edit that sets an optional field on a closed row opens it in the table" (rally only; count not separately tested, same code path).
- Text/Table and Run/Results keep open row: "an opened row stays open through Text and Table and through a Run".
- Buttons disabled on Results, forced click, aria-pressed, active fill differs, enabled on Build: "the Text and Table buttons are disabled while Results is shown".
- Pin restore 400/500 drop, no POST on next load, abort keeps key, user Pin during delayed 500 kept: pin-compare spec (5 cases).
- Unit helpers: step-table-model.test.ts, 109 pass.
- Docs grep for `per row index|mounts it afresh|network or server failure`: no hits.

## Gaps filled (commit 3b0bd18, acceptance/aoe4-step-table.spec.ts)
1. "an opened row stays open through text that does not parse and back" (unparseable text leaves flags unchanged).
2. "a row added by a text edit after the text shrank does not inherit a dropped row's open state" (merge drops stale tail).
Both pass.

## Runs
- Step-table, pin-compare, inline-issues specs (SGS-085 interplay): 79 passed before additions; the 2 new tests pass. No flakes hit (step-band :101 and timeline-compare :72 not run).
- tsc --noEmit, lint:dup, vitest step-table-model: pass. Full acceptance suite not run (out of scope).

## Mutation checks (each reverted with git checkout; git diff --exit-code on non-test files clean)
- mergeExternalEdit keeps stale tail -> new test 2 failed.
- editText clears flags on unparseable text -> new test 1 failed.
- viewDisabled forced false -> disabled test failed.
- moveFlag made a no-op -> move/delete test failed.
- restore effect drops only on 400 -> the 500 case and no-POST-next-load case failed.
- pinTouched removed from first guard -> user-pin-during-restore test failed.

## Failures
None. Not expressible: nothing missed.
