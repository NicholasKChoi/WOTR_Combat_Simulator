# SGS-150 acceptance-test 1

Verdict: PASS. Tip 9450b34. No tests written and no commit made: the ticket edits the two specs, so I ran them
and mutation-checked them. The worktree is clean.

## Run
- Harness ran. Browser setup was run first. Command: `npx playwright test acceptance/aoe4-small-screen.spec.ts acceptance/aoe4-build-order-step-band.spec.ts --repeat-each=8 --workers=6`
- Result: 168 of 168 passed in 1.6 min. That is every test in both files, 8 times each, with 6 parallel workers.
  It includes the two target tests.
- `npx tsc --noEmit` passes. The diff against the previous commit (HEAD~1) touches only the two spec files.
  No production file changes.

## Criteria
- Assertions kept. The small-screen test still asserts `static` position, a scroll above 0, a 200 run, an unchanged
  scroll after the run, Build tab selected, bar above the viewport, and zero title overlaps. The step-band test
  still covers all five transitions (focus the target row's delete button, hover the start row, focus the duration
  input, hover the target row, focus the start row's control). The final overlap check moved into the poll's
  object equality.
- Layout reads are in one evaluate or inside a poll. The scroll-offset poll replaces the single `scrollInstantly` read.
  The run-bar position and title overlap are read in one evaluate inside the poll.
- Step-band: each step now waits on `expect.poll` over a single evaluate of band and active-row counts. The page is
  scrolled instantly up front, with an assertion that both row centres are visible, so no step scrolls.

## Mutation checks (each undone with `git checkout -- <files>`; `git diff --exit-code HEAD` clean)
1. Small-screen, run bar sticky at 360 px (`components/apps/aoe4-build-order/workbench.module.css:19`, `static` changed to `sticky`).
   Failed at `aoe4-small-screen.spec.ts:39`: expected `static`, received `sticky`.
2. Same break with the spec's line 39 assertion temporarily stubbed out, to reach the new poll. The poll failed at
   `aoe4-small-screen.spec.ts:59`: expected `{barAbove: true, overlaps: 0}`, received `{barAbove: false, overlaps: 2}`. The spec edit was reverted too.
3. Step-band, start row `onFocus` clear removed (`components/apps/aoe4-build-order/step-table.tsx:243`).
   Failed at `aoe4-build-order-step-band.spec.ts:153`: expected `{active:0, bands:0}`, received `{active:1, bands:4}`.
4. Step-band, start row `onPointerEnter` clear removed (`step-table.tsx:243`). Failed at the same poll with the same expected/received.
   Per the failure output it fails at the same `expectState` poll. I did not check which of the two `cleared` steps (after hover, after the final focus) it failed on.

## Not reproduced / not expressible
- I did not reproduce the original flakes on the pre-fix code, since that is the implementer's PR-body duty. I
  confirmed only that the post-fix specs are stable over 8 repeats under 6 workers.
- The 168 runs are a point-in-time sample. They do not prove the flake is gone, only that it did not recur in 8 repeats.

## Failures
None.
