# SGS-194 implementer report 2 (Rework 1)

Status: needs_review

- Ticket: SGS-194. Branch: sgs-194-results-charts-table. Tip: 141a2534210f3fadaaa86a5ed830389888f0d05c (previous tip 819d7892, base origin/main 87f0cd7).
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-194-results-charts-table
- Checkout sync: `checkout.sh task` reused the checkout at 819d7892. The branch has no `origin/<branch>` ref, so the own-commit check was skipped, as common.md allows.

## Required fixes (all ticked in the ticket)
1. `components/apps/aoe4-build-order/line-chart.tsx` label-width effect: the guard is now `if (!text || labelKey === '' || collapsed) return` and the deps are `[labelKey, chartWidth, collapsed]`. This is the review's text, applied verbatim.
2. `acceptance/aoe4-chart-layout.spec.ts`: new describe "AoE4 chart marker labels after collapse" (viewport 1280x2800), case "a chart whose markers change while collapsed places its labels like an always-expanded chart once expanded". Steps:
   - Load the default build and collapse `chart-gathered-resources`.
   - Assert the textarea contains `at 9 vils build abbey-of-kings with 3 from sheep then sheep`, replace it with `@6:00 build ...`, and wait for the run.
   - Read the Feudal age-up marker from the response (asserted defined) and set the duration to `ceil(feudal.at) + 12`. Wait for the run.
   - Before expanding, assert under `expect.poll` that the Floating resources chart has the Feudal label with `text-anchor="end"` and a right edge inside the plot.
   - Expand. In one evaluate under `expect.poll`, assert both charts read `{ anchor: 'end', fits: true }`.
   - The plot's right edge is `.recharts-cartesian-grid`'s bounding rect, with a 0.5 px tolerance.
3. Ran aoe4-chart-layout, aoe4-results-split and aoe4-split-tab-order together: 37/37 pass. That is the 36 from pass 1 plus the new case. The tab-order spec is unedited.

## Files touched this pass
- components/apps/aoe4-build-order/line-chart.tsx: the measure effect skips while collapsed and re-runs on `collapsed`.
- acceptance/aoe4-chart-layout.spec.ts: the new case, plus imports of `markerLabel`, `SimulationResult` and `waitForRun`.

## Tests
- Acceptance: 37 passed across the three named specs.
- Unit: `npm test` gave 2614 passed and 15 skipped (83 files passed, 1 skipped).
- Invariant encoded: a chart that was collapsed while its labelled markers changed places those labels the same way as an always-expanded chart once it is expanded: same anchor, and the label does not go past the plot's right edge.

## Mutation checks
- I reverted `line-chart.tsx` to the old guard and deps (`if (!text || labelKey === '') return`, `[labelKey, chartWidth]`). The new case failed on its final `expect.poll` (spec line 509): `chart-gathered-resources` received `{ anchor: 'start', fits: false }` and expected `{ anchor: 'end', fits: true }`. Floating resources stayed `end`/`true`. I restored the fix, re-ran, and the case passed. No break was committed.

## Pre-existing tests edited
None this pass. Only a new case was added to `aoe4-chart-layout.spec.ts`.

## Doc claims
- Commit message: "The measuring svg sits in the chart's body row, which is not rendered while the chart is collapsed, so label widths measured then were 0 and stayed 0 after expanding."
  - `line-chart.tsx` puts the svg in `tr[chart-body-row]` with `hidden={collapsed}`.
  - The review measured length 0 under display: none.
  - The mutation run above shows the stale placement.
- No code comments or docs were added.

## Build, lint
- `npx tsc --noEmit` is clean and `npm run lint:dup` finds 0 clones.
- `npx next build` succeeds (after link-node-modules).
- Codegen is not set.
- `git diff --stat origin/main` shows only the 9 files from pass 1. No tool-made changes.

## Invariant check
A1 to A3 untouched: this is a UI effect change only. Persistence is untouched.

## Unverified assumptions added
None.

## Out-of-scope findings
None.

## Processes
Playwright's webServer started and stopped its own `next dev`. Nothing I started is left running.
