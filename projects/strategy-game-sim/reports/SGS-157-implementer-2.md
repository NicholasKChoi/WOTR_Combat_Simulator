# SGS-157 implementer report (2)

Status: needs_review
Branch: sgs-157-buildings-chart-overlap, tip c8cb3b349640878f39a7c6ead2c405bece76c55f (one commit on e50e074)
Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-157-buildings-chart-overlap

## Files
- components/apps/aoe4-build-order/chart-rows.ts: `lineOffsets` (slot i of n gets i*0.45/n), `offsetSlotKeys` (visible current, then visible pinned-only keys), `toOffsetChartRows`, `trueCount` (rounds the drawn value); `ChartRow` exported.
- components/apps/aoe4-build-order/line-chart.tsx: `offsetLines` prop; rows via `toOffsetChartRows(..., hidden)`; `YAxis allowDecimals={!offsetLines}`; Tooltip formatter `trueCountFormatter` when set.
- components/apps/aoe4-build-order/results.tsx: passes `offsetLines` for `chart-units-produced` in Buildings view only.
- components/apps/aoe4-build-order/chart-rows.test.ts: unit tests for the new seams.
- acceptance/aoe4-chart-views.spec.ts: new Buildings test (y ticks whole and >= 0; tooltip values whole).
- docs/aoe4-build-order.md: one sentence added after the view-toggle paragraph.

## Tests
- Unit full suite: 83 files passed, 2560 passed / 15 skipped. chart-rows.test.ts: 38 pass.
- Invariants encoded: offsets non-negative, distinct, increasing, < 0.5 (n = 2, 3, 17); equal counts draw distinct values within [count, count+0.5); same offset at every time and count 0 stays >= 0; hidden series take no slot (rows equal a chart without it); pinned shares the current key's offset and a pinned-only key gets its own higher slot; `trueCount` returns the integer count, not the drawn value.
- Acceptance (ran aoe4-chart-views.spec.ts once, the ticket requires an acceptance test there): 8 passed.
- No pre-existing test edited. Other charts/Units view go through the unchanged `toChartRows` path (opt-in defaults false).
- Pinned outputs: none.
- Not a unit-tested seam: the Tooltip formatter wiring and `allowDecimals`; covered only by the acceptance test.

## Doc claims
- docs/aoe4-build-order.md: "In the Buildings view each line is drawn a small amount above its true count (a different amount per visible building, the same at every time, always below half a building) ... the y axis shows whole numbers only and the tooltip shows each building's true count. A pinned building's line is drawn at the same offset as the current line with its key, and a building hidden in the legend takes no offset." True by `lineOffsets`, `toOffsetChartRows`, `YAxis allowDecimals`, `trueCountFormatter`.
- chart-rows.ts comments: "Slot i of n gets i * 0.45 / n ..." (`lineOffsets`); "The offset is below half a count, so rounding a lifted value gives back the integer count." (`trueCount`).

## Mutation checks (chart-rows.ts, restored via git checkout each time)
- `lineOffsets` negated: "expected -0.225 to be greater than or equal to 0".
- `(i+1)*0.5/n`: "expected 0.5 to be less than 0.5".
- drop `.filter(!hidden.has)` in `offsetSlotKeys`: hidden-slot test fails (offsets 1.15/1.3 vs 1/1.225).
- drop pinned prefix strip: "expected 1 to be 1.1125".
- `trueCount` without `Math.round`: "expected 2.225 to be 2".
- line-chart.tsx: formatter replaced with `formatChartValue`, and `allowDecimals` left true: the acceptance test fails on `Number.isInteger(...)` Expected true / Received false in each. Both restored.

## Codegen / build / lint
- codegen: not set. `next build`: passes. `tsc --noEmit`: clean. `lint:dup`: 0 clones. Diff reviewed; no tool-made changes.

## Invariants
A1-A3: display-only change, no simulation or data touched; upheld.

## Unverified assumptions added
None beyond the ticket's. The y-tick selector `.recharts-cartesian-axis-tick-value[text-anchor="end"]` (y ticks; x ticks are middle-anchored) was verified by the passing acceptance run.

## Notes
- Slot 0 gets offset 0 (allowed: non-negative); its line sits exactly on its true count.
- Out-of-scope findings: none.
- Bug-ticket regression-on-base run: the regression for this ticket is the acceptance test plus unit tests; I did not run the scratch-checkout base check. The unit tests reference functions that do not exist on base, so they fail there trivially; the acceptance tick/tooltip test was not run against base.
