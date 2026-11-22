# SGS-213 acceptance-test report 9

Verdict: PASS. Tip before: f1bf9afd. New tip: 6f9b91f02772ee301b6db84dc8c3299b90b2ce28 (one test commit, test file only).

## Tests written
- `acceptance/aoe4-step-annotations.spec.ts`: "a repeated step follows its combined run..." pins the repeated-step criterion at the boundary. `build house with 2 from sheep x2` (both copies completed, wait 0) shows no popover on hover or caret. `build barracks with 9 from sheep x2` (a waiting copy) shows one. Both fixtures are asserted from the API result first.
- Small refactor of the implementer's no-wait test: its hover-and-caret no-popover sequence is now the helper `expectNoPopoverOnHoverAndCaret`, shared with the new test. The refactor was needed because jscpd flagged the duplicate (threshold 0%). Behaviour of that test is unchanged.

Already covered by the implementer's specs, so not duplicated: placement beside the textarea at 1200 and 1800 px for hover and caret, mid-list top alignment within 1 px, the inside-viewport test, the no-wait and not-reached test, and the caret and shared-active-step tests. The pure-function criteria are covered by the implementer's unit tests.

## Run
- `acceptance:setup` ran. `aoe4-step-annotations.spec.ts` in full: 32 passed. `npx vitest run components/apps/aoe4-build-order`: 36 files, 1055 tests passed.
- `npx tsc --noEmit && npm run lint:dup` is clean after the helper extraction. It first failed on the duplicate in my own new test, which the helper fixed.

## Mutation checks
Run in scratch `mutate-SGS-213` (provisioned with `link-node-modules.sh .` and `npm run acceptance:setup`). Each break was reset with `git checkout -- <file>` plus `git diff --exit-code`. The scratch was then removed.

- `step-annotations.ts:49` `hasPopover` always true: fails the no-wait hover assertion in both the new test and the existing no-wait test (`toHaveCount(0)`, received 1).
- `build-text-editor.tsx` guard changed to `hasPopover(run) || !lineRef.current?.matches(':hover')`: a working alternative that shows the no-wait popover on caret only. Fails the caret `toHaveCount(0)` assertion, at the helper's line 217, in both tests.
- `hasPopover` changed to wait-only (`completed && waitSeconds > 0`): this is the rejected "wait only" alternative, and it hides the waiting and not-reached steps. Fails `toBeVisible` for the not-reached step and for the waiting repeated step.
- Guard changed to also show when the textarea is focused: the hover assertion fails, since the textarea is focused at that point. It does not isolate the caret assertion, so the caret-only guard above was used for that.
- `annotation-popover.tsx` placement, three breaks against the "opens beside the textarea" tests:
  - Beside branch disabled (the base's below-line behaviour): `apart` and `rightOfTextarea` fail.
  - `anchor.top + 10`: `levelWithLine` fails.
  - `textarea.right - 5`: `rightOfTextarea` and `apart` fail.
- Not killable at acceptance: the "applied to a single copy instead of the combined run" alternative. In both fixtures the first copy and the combined run agree on `hasPopover`. The unit test on `combineRuns` covers it.
- Task-checkout state before and after (status listing empty, tracked-diff hash `e69de29b...`) matches.

## Failures
None. No impl-defects or spec-gaps.

## Not expressible
The no-room fallback to the viewport clamp, which the ticket covers by unit test only.
