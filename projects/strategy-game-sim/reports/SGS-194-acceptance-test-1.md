# SGS-194 acceptance-test 1

Verdict: PASS. Branch `sgs-194-results-charts-table`, tip 141a2534210f3fadaaa86a5ed830389888f0d05c (checkout clean, no commits added by this gate).

## Harness
`acceptanceSetup` ran (node_modules linked, Chromium installed). I ran the full suite: `npx playwright test --reporter=line` in the task checkout. Result: **1131 passed, 0 failed, 0 skipped** (3.9 min). The run includes `aoe4-chart-layout`, `aoe4-results-split` and `aoe4-split-tab-order`, plus every other aoe4 spec that reads chart markup.

## Tests written
None. The implementer's specs already cover each observable criterion through the page:
- `acceptance/aoe4-chart-layout.spec.ts` (+145 lines): column alignment at `MIN_SUPPORTED_VIEWPORT` and `WIDE_VIEWPORT`, collapse/expand, reorder and persistence, and the rework case (re-expanded chart's marker label anchor and right edge match the always-expanded chart).
- `acceptance/aoe4-results-split.spec.ts`: charts are the row groups of `chart-table`, in order; "the charts fill the Results width" passes unchanged.
- `aoe4-split-tab-order` passes with no edit.

I found no uncovered criterion that needed a new test, so no mutation checks were run (they apply to tests I wrote). The implementer reported a mutation run on the rework case, and review 2 confirmed it.

## Failures
None.

## Criteria not expressible in this harness
None.

## Cleanup
The Playwright `webServer` started and stopped its own dev server. Nothing of mine is still running.
