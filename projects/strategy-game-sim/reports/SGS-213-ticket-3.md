# SGS-213 ticket author (re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-213-step-popover-beside-text-and-skips-no-wait.md

## Summary

"Open the step popover beside the build text and skip it for no-wait steps" (Bug, aoe4-build-order, standalone, standard risk, about 70 LOC, no dependencies). I folded in the three blocking gaps from spec-gate report 2:

1. **Viewports and the skippable check.** Scope and criterion 1 now both name `MIN_SUPPORTED_VIEWPORT` (1200) and `WIDE_VIEWPORT` (1800) from `acceptance/helpers.ts`, replacing the 1280 px value. I removed "where it fits": the acceptance test always asserts that popover.left >= textarea.right and that the two boxes do not intersect. Only the unit test covers the no-room fallback.
2. **Top alignment.** The acceptance test scrolls a mid-list line that shows a popover to the viewport centre and asserts that the popover's top is within 1 px of the line's top. The near-bottom case stays an inside-the-viewport assertion. Only the pure-function unit test covers the clamp. The unit test rows put anchor.left well left of textarea.right, so a placement that ignores the textarea edge fails.
3. **Repeated steps.** The criterion is now a unit test of the predicate on `combineRuns` output. Two completed copies with zero waits give false. Completed copies whose waits sum above zero give true. A predicate applied to a single copy fails. I dropped the "per-copy lines as before" claim because that behavior does not change.

I tagged the changed criteria `(respec 1)` and appended `## Re-spec 1 - 2026-11-21`. No branch work exists (the TASK-GRAPH row has no branch).

Verified at origin/main: `MIN_SUPPORTED_VIEWPORT`, `SPLIT_VIEWPORT` and `WIDE_VIEWPORT` in `acceptance/helpers.ts`. `combineRuns` in `step-annotations.ts` sums `waitSeconds` across copies and takes the least-advanced status.

## Lint

- ticket-lint.py with `--spec` against origin/main: no output, exit 0.
- The spec-gate items self-check is skipped because the ticket is `standard`; spec-gate runs on it.

## Diagrams

None. The change stays in one component outside the core control loop, so the ticket uses the "no diagram required" line.

## Open questions

None.

## Overlap

None found.
