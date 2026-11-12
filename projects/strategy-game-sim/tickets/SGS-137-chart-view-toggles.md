# SGS-137: Replace the Per villager checkbox with view toggles on Gather rates and Units produced

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.6
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none (no engine, data, or simulation path is touched; the view only reads `productionBuildings` that the simulator ticket adds)
- **Unverified assumptions**: none
- **LOC estimate**: 140 (`chart-view-toggle.tsx`, `buildingSeries` and the per-view series selection in `result-series.ts`, view state and chart table in `results.tsx`; business logic only, CSS and tests excluded)
- **Depends on**: SGS-134, SGS-135, SGS-136, SGS-138
- **On merge**: none
- **Source**: `design/M9.md` C7, the "Chart views (M9.6)" behavior rules and the M9.6 row of the Criteria map (view half); plan outline J

## Context

The Gather rates chart has a `Per villager` checkbox that divides rates by gatherers, and the Units produced chart has one view only. M9.6 replaces the checkbox with a two-option view toggle on each of those charts: Rate or Villagers (the `gatherers` counts) on Gather rates, Units or Buildings (the `productionBuildings` series) on Units produced. The toggle sits in the chart header slot, which SGS-135 has moved out of the collapsible body, so it works while the chart is collapsed.

## Scope

State at `origin/main`, plus the end states of SGS-134 (`Results` takes `chartLayout`), SGS-135 (`ChartHeader` renders the `controls` slot in the header, `SeriesChart` passes `headerControls` to it), SGS-136 (`SimulationResult.productionBuildings: BuildingSeries[]`, `BuildingSeries { baseId, name, counts }`) and SGS-138 (design C6: pinned `Line`s are excluded from the tooltip, so the tooltip lists only current-run series; pinned lines keep `data-series="pinned:<key>"`, their dashed style and the `isLineHidden` hiding; `chart-pinned-legend` replaces the pinned key). Everything is in `components/apps/aoe4-build-order/` unless named otherwise. Contract names and shapes are those of `design/M9.md` C7; use them exactly. This ticket does not edit `chart-header.tsx`, `chart-legend.tsx`, `chart-layout.ts`, `use-chart-drag.ts`, `line-chart.tsx` or anything under `lib/`.

- `chart-view-toggle.tsx` (new): `ChartView<V>`, `ChartViewToggle`, `GatherRatesView` and `UnitsProducedView` per C7. DOM per C7: a `role="group"` container with `data-testid="chart-view-toggle"`, `aria-label="<name> view"` and bootstrap `btn-group btn-group-sm`, and one `<button type="button" data-testid="chart-view-option" data-view={value} aria-pressed>` per view. Clicking the selected option does nothing (no `onChange`). Do not mix bootstrap `d-*`/`flex-*` utilities with module CSS on one element (REPO.md review checklist).
- `result-series.ts`:
  - Add `buildingSeries(result)` mapping each `result.productionBuildings` entry to a `ChartSeries` (`key` = `baseId`, `name`, `values` = `counts`), in the order the result gives. Remove `perVillagerSeries`.
  - (respec 1) The choice of series per view (the "series" column of the two C7 tables) is an exported pure function or table in this module, so a Vitest case reaches it (design Test levels: component logic a Vitest case must reach is an exported pure function). Its name is the implementer's; it is not a design contract, so the report names it for CONTEXT.md Key surfaces. `results.tsx` uses it for both the current and the pinned run.
- `results.tsx`:
  - Replace the `perVillager` state with two view states, `GatherRatesView` (default `rate`) and `UnitsProducedView` (default `units`). They live in `Results` state and are not persisted.
  - Gather rates chart: view table per C7. `rate` plots `resourceSeries(run.gatherRates)` with y label `Per minute`; `villagers` plots `resourceSeries(run.gatherers)` with y label `Villagers`. Labels of the options are `Rate` and `Villagers`. `headerControls` becomes a `ChartViewToggle` (the checkbox and its `gather-rates-per-villager` test id are removed).
  - Units produced chart: `units` plots `unitSeries(run)` with y label `Count`; `buildings` plots `buildingSeries(run)` with y label `Buildings`. Option labels `Units` and `Buildings`. It gains a `ChartViewToggle` as `headerControls`.
  - The series function is applied to the pinned run too, so pinned lines follow the view: `villagers` uses `pinned.gatherers` with the existing pinned rules; `buildings` uses `pinned.productionBuildings`, matched to current lines by `baseId` (the series `key`). A building present only in the pinned run gets only a dashed line, as units do today. The series legend entries and names change with the view in the same render.
  - The Units produced y label changes from today's `Units` to `Count` only through the C7 table; no other chart's label changes.
- `result-series.test.ts`: remove the `perVillagerSeries` cases; add `buildingSeries` cases (the field mapping and the order kept) and (respec 1) cases for the per-view series selection (see criteria). Any `SimulationResult` fixture in this file already carries `productionBuildings` from SGS-136. (respec 1) Any Vitest case that SGS-138 added or moved to check the pinned run's per-villager values is deleted with `perVillagerSeries` or rewritten to the Villagers view.
- Tests for the toggle markup: `chart-view-toggle.test.ts` (new, `renderToStaticMarkup`, as in `save-build.test.ts`): group label, one option per view, `aria-pressed` true on only the selected value, `data-view` values. No hook or DOM test (design Test levels: the repo has no DOM test environment).
- Acceptance:
  - `acceptance/aoe4-chart-views.spec.ts` (new) replaces `acceptance/aoe4-gather-rates-per-villager.spec.ts` (in whatever form SGS-138 left it), which is deleted. Keep the cases that still apply from the old spec in the new view terms: the current run's tooltip value matches the sampled `gatherRates` or `gatherers` response data at the hovered sample, the y label, the other charts' labels unchanged, a hidden legend entry stays hidden across a view switch. (respec 1) Pinned values are never read from the tooltip, which after SGS-138 lists no `(pinned)` rows: the pinned run is checked through its drawn lines (`path[data-series="pinned:<key>"]`) in Playwright and through the per-view series selection in Vitest (see criteria).
  - (respec 1) The hover and tooltip helpers (`hoverPlot`, `readTooltip`, `hoverRead`, `samplesAt`, `expectOneOf`) live inside the old spec, which is deleted: move the ones the new spec uses into it (or into `acceptance/helpers.ts` if another spec needs them), so no copy remains for lint:dup to flag. Reuse `acceptance/helpers.ts` (`openPage`, `showTab`, `waitForRun`, `CHART_IDS`).
  - `acceptance/aoe4-chart-layout.spec.ts` (rewritten by SGS-135): every use of the Per villager checkbox (`gather-rates-per-villager`, the `Per villager per minute` label) moves to the Villagers view of the toggle, keeping what the case proves (a header control stays visible and usable while the chart is collapsed, and its choice survives collapsing and expanding).
  - Any other spec that references the checkbox or its labels: find with `git grep -n "per-villager\|Per villager"` over `acceptance/` and fix each.
- Docs made untrue, in `docs/aoe4-build-order.md`:
  - (respec 1) The chart-series table under "A 200 draws four line charts": it states one series set per chart (Units produced plots each `unitsProduced` `unitId`; Gather rates plots per-minute rates). The rows describe the default views; the alternate series of each toggle (Gather rates: `gatherers`, keys and names as the resource rows; Units produced: `productionBuildings`, key `baseId`, name `name`) are described next to the table.
  - The paragraph stating that the Gather rates chart has a `Per villager` checkbox (off by default, divides `gatherRates` by `gatherers`, y label `Per villager per minute`, pinned run also per villager).
  - Any statement that the header slot holds the Per villager checkbox or that the Per villager choice survives a collapse (SGS-135 rewrote the "Chart controls" paragraph; update what it still says about the checkbox).
  - Grep the doc and `ARCHITECTURE.md` for `Per villager`, `per-villager`, `perVillagerSeries` and `gather-rates-per-villager` and fix every statement the change contradicts. Add the two toggles: which views each chart offers, the defaults, the y labels, that the choice is not persisted and resets on reload, that the toggle is in the header and works while collapsed, how pinned lines follow the view, and that a building only in the pinned run shows only a dashed line. Scope names the statements only; the implementer writes the replacements. Do not quote measured results.

**Out of scope:** `productionBuildings` in the simulator, OpenAPI and `lib/` (SGS-136); the header slot, `chart-header.tsx` and the drag and caret work (SGS-135); the layout model and key-results panel (SGS-134); the tooltip exclusion of pinned lines and the pinned legend entry (SGS-138); marker legend changes; persisting the view; a third view on either chart; a DOM test environment.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `ChartViewToggle` static markup renders one `chart-view-toggle` group labelled `<name> view` with one `chart-view-option` per view, each with its `data-view`; `aria-pressed="true"` is on the option equal to `value` only. A test fails if two options are pressed or the `data-view` is the label instead of the value.
- [ ] Gather rates, Playwright: the view starts as Rate (`aria-pressed` true on `rate`, y label `Per minute`); clicking Villagers makes it pressed and the other not, the y label `Villagers`, and the hovered tooltip value for a resource equals the `gatherers` value at that sample in the simulate response (not the `gatherRates` value; the test picks a sample where the two differ and asserts that first). Clicking Rate returns the original label and rate value. Clicking the already-selected option changes nothing.
- [ ] Units produced, Playwright: starts as Units (y label `Count`, legend entries are unit names); clicking Buildings gives y label `Buildings` and legend entries equal to the names in the response `productionBuildings` (asserted non-empty first), and the plotted series count matches; clicking Units restores the original. The other charts' y labels do not change when either toggle is used.
- [ ] A toggle of a chart that is collapsed is visible and works: the view changes while collapsed and the new view is shown on expand. The test asserts the chart body is hidden before the click.
- [ ] A reload resets both charts to their defaults after a non-default view was chosen.
- [ ] (respec 1) Per-view series selection, Vitest: for a run whose `gatherers` differ from its `gatherRates`, the Villagers selection returns the run's `gatherers` per resource and the Rate selection its `gatherRates`; for a run with `productionBuildings`, the Buildings selection returns `buildingSeries` of that run and the Units selection its `unitSeries`. A test fails if Villagers plots rates, Buildings plots units, or a selection reads a run other than the one passed.
- [ ] (respec 1) Pinned run, Playwright, read from drawn lines and never from the tooltip: with two runs whose food gatherer counts differ at some sample (the test asserts this from the two responses first), switching Gather rates to Villagers keeps both `path[data-series="food"]` and `path[data-series="pinned:food"]` drawn, and their drawn paths differ; the test fails if the pinned line were drawn from the current run's series. In Buildings view, with a pinned run that has a building the current run lacks (asserted from the responses first), that building's `pinned:<baseId>` line is drawn and no solid `<baseId>` line is, and a building in both runs has both lines. A series hidden through the Gather rates legend stays hidden (both its lines absent, its legend item still pressed) across a switch to Villagers and back.
- [ ] `buildingSeries` keeps each `productionBuildings` entry's `baseId` as `key`, its `name`, and its `counts` as `values`, in the result's order; a test with two entries in a non-alphabetical order fails if the output is re-sorted. `perVillagerSeries` no longer exists.
- [ ] (respec 1) No source, test, acceptance spec or doc references the Per villager checkbox: `git grep -n "gather-rates-per-villager\|perVillagerSeries"` has no match in the tree, `git grep -n "Per villager" -- docs ARCHITECTURE.md acceptance components` has no match, and `acceptance/aoe4-gather-rates-per-villager.spec.ts` is deleted. The hover helpers exist in one acceptance file only.
- [ ] A header toggle stays usable by keyboard: Enter and Space on a focused option select it (native button behavior; the Playwright case presses the key and checks `aria-pressed`).
- [ ] (respec 1) The docs listed in Scope, including the chart-series table, no longer contradict the code and describe both toggles as above.
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npm test` pass; `next build` succeeds; the new and rewritten acceptance specs pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-11

- Underspecified: the pinned-run check read `(pinned)` tooltip values that SGS-138 removes, and the two tickets both reworked the old per-villager spec; the docs chart-series table and the old spec's inline helpers were not named.
- Changed: SGS-137 now depends on SGS-138 and checks pinned values from drawn `pinned:<key>` paths in Playwright plus an exported per-view series selection in Vitest; Scope adds the doc table, moving the hover helpers, and the `Per villager` search.
- Stands: no branch work exists yet; all other scope and criteria are unchanged.
