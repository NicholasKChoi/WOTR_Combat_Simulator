# SGS-137 implementer report 1

Status: needs_review

- Branch `sgs-137-chart-view-toggles`, tip `4c86b5bc5d495e5e3f84096ecfb99535d131e267`, worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-137-chart-view-toggles`. Base origin/main 4f369f3.

## Files
- `components/apps/aoe4-build-order/chart-view-toggle.tsx` (new): `ChartView`, `ChartViewToggle`, `GatherRatesView`, `UnitsProducedView` per C7. The selected option's click calls no `onChange`.
- `components/apps/aoe4-build-order/result-series.ts`: add `buildingSeries`, `gatherRatesSeries(view, run)`, `unitsProducedSeries(view, run)`; remove `perVillagerSeries`.
- `components/apps/aoe4-build-order/results.tsx`: two view states (defaults `rate`, `units`), toggles as `headerControls`, y labels `Per minute`/`Villagers`/`Count`/`Buildings`; the same series function is applied to the pinned run.
- `components/apps/aoe4-build-order/result-series.test.ts`: perVillager cases removed; `buildingSeries`, `gatherRatesSeries`, `unitsProducedSeries` cases added.
- `components/apps/aoe4-build-order/chart-view-toggle.test.ts` (new): static markup.
- `acceptance/aoe4-chart-views.spec.ts` (new); `acceptance/aoe4-gather-rates-per-villager.spec.ts` deleted (hover helpers moved into the new spec; nothing else used them); `acceptance/aoe4-chart-layout.spec.ts` moved to the Villagers toggle.
- `docs/aoe4-build-order.md`: series table rows renamed to default views, the checkbox paragraph replaced by a toggles paragraph, the Chart controls paragraph updated.

## For CONTEXT.md Key surfaces
Exported per-view series selection: `gatherRatesSeries(view, run)` and `unitsProducedSeries(view, run)` in `components/apps/aoe4-build-order/result-series.ts`. Also `ChartViewToggle` in `chart-view-toggle.tsx`.

## Tests
- Full `npm test`: 81 files passed, 1 skipped; 2487 passed, 15 skipped.
- New/changed Vitest files: 16 tests pass. Invariants encoded: only the selected option has `aria-pressed="true"`; `data-view` is the value and not the label; `buildingSeries` keeps the result order and field mapping; Villagers reads `gatherers`, Rate reads `gatherRates`; Buildings reads `buildingSeries(run)`, Units reads `unitSeries(run)`; a selection reads only the run passed (pinned rows keep the pinned run's own values).
- Pre-existing tests edited: `result-series.test.ts` `perVillagerSeries` describe block removed (the ticket says to remove it with the function). No other assertion changed.
- Pinned outputs: none.

## Mutation checks (all undone; final run 16 pass)
- `result-series.ts` gatherRatesSeries swapped to `gatherRates : gatherers`: failed "plots gatherRates in the rate view..." and "reads only the run it is given".
- `unitsProducedSeries` always `unitSeries(run)`: failed "plots unitSeries in the units view and buildingSeries..." and "reads only the run it is given".
- `buildingSeries` re-sorted by baseId: failed "maps baseId to key... in the result order".
- toggle `aria-pressed` always true: failed both "presses only the option equal to ..." cases.
- toggle `data-view={view.label}`: failed the "renders one labelled group..." case.

## Doc claims
All in `docs/aoe4-build-order.md`, true per `results.tsx` and `result-series.ts`:
- "Gather rates and Units produced each have a two-option view toggle (`chart-view-toggle`, buttons `chart-view-option` with `aria-pressed`); the other two charts have none." (`results.tsx` charts table)
- "Rate (the default, `gatherRates`, y axis label `Per minute`) and Villagers (`gatherers`, ..., y axis label `Villagers`)" and "Units (the default, y axis label `Count`) and Buildings (each `productionBuildings` entry, key `baseId`, name `name`, in result order, y axis label `Buildings`)" (`gatherRatesSeries`, `unitsProducedSeries`, `buildingSeries`).
- "The choice is not stored and resets on reload." (`useState` only).
- "The pinned run follows the view, drawn from its own `gatherers` or `productionBuildings` (matched to the current lines by key); a building only the pinned run has gets only a dashed line." (`chart.series(pinned)`; `toChartRows` and `SeriesChart` pinned lines).
- Chart controls paragraph: "on Gather rates and Units produced, the view toggle"; "the view toggle stay visible and usable. The hidden series, the chosen view and the pinned run survive a collapse and a move" (the view state lives in `Results`, so it survives collapse and reorder).

## Commands
- codegen: none set. `npx tsc --noEmit && npm run lint:dup`: clean (0 clones). `npx next build`: succeeded. `npm test`: pass.
- `git grep "gather-rates-per-villager\|perVillagerSeries"`: no match. `git grep "Per villager" -- docs ARCHITECTURE.md acceptance components`: no match. `lib/aoe4-build-order/gather.ts:18` has an unrelated comment "Per villager, in resource per second".
- Acceptance NOT run. The role rules reserve acceptance runs for the acceptance gate, so `acceptance/aoe4-chart-views.spec.ts` and the edited `aoe4-chart-layout.spec.ts` are typechecked and jscpd-clean but never executed. Risk points the gate should watch:
  - The reload test relies on `acceptBeforeUnload` plus `openPage`.
  - The Buildings pin test uses a 1:00 barracks pasted as `@1:00 build barracks with 1 from sheep` and asserts in-test from the responses that the current run lacks barracks.
  - The Space key test.
  - The pinned-line test asserts drawn `d` differs between the `food` and `pinned:food` paths.

## Invariant check
No engine, data or simulation path touched (A1-A3 n/a). `chart-header.tsx`, `chart-legend.tsx`, `chart-layout.ts`, `use-chart-drag.ts`, `line-chart.tsx` and `lib/` unchanged. No bootstrap `d-*`/`flex-*` utility is mixed with module CSS on the toggle elements.

## Unverified assumptions added
None.

## Out-of-scope findings
- The branch `sgs-137-chart-view-toggles` existed at the base before the worktree add (my first add call created it before failing on the path); I reused it. No other effect.
- A collapse test now appears in both `aoe4-chart-views.spec.ts` and `aoe4-chart-layout.spec.ts` (each required by the ticket); jscpd found no clone.
