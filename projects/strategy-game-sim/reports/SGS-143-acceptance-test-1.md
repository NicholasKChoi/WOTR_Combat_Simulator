# SGS-143 acceptance-test 1

Verdict: PASS. Tip d698acf1 (no new commit; no test edits needed).

## Tests (already in the diff, `acceptance/aoe4-split-scroll.spec.ts`)
- :362 "a control scrolled in from the top of the capped bar shows its whole focus ring": criterion 1 (ring top stays inside the bar scrollport). Precondition asserts the bar overflows and the select starts above the bar.
- :384 "with a fractional bar height the page end brings the bar to the top and the workbench to the bottom exactly": criterion 2. Precondition asserts a fractional bar height and the property tracking it.
- Criterion 3 is covered by existing tests (:279 capped, :415 below 768 px static and uncapped); both pass unchanged.

I judged these sufficient and added none.

## Run
Harness provisioned (`acceptance:setup`), `npm run acceptance -- acceptance/aoe4-split-scroll.spec.ts`: 18 passed, 0 failed. Lint (`tsc --noEmit`, `lint:dup`) clean.

## Mutation checks
- Removed `scroll-padding-block` in `workbench.module.css:12`: test :362 failed on `ringTopGap` (expected true, received false). Undone via `git checkout`; `git diff --exit-code` clean.
- Restored `Math.ceil` in `use-run-bar-height.ts:12`: test :384 failed on `barAtTop` (expected true, received false), at spec line 412. Undone; diff clean.

## Failures
None. The 0.5px split-bottom tolerance (review-accepted) is in the test; the bar-top check uses 0.05px.

## Not expressible
None.
