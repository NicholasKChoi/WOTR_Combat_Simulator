# SGS-137: Replace the Per villager checkbox with view toggles on Gather rates and Units produced

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.6
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none (no engine, data, or simulation path is touched; the view only reads `productionBuildings` that the simulator ticket adds)
- **Unverified assumptions**: none
- **LOC estimate**: 120 (`chart-view-toggle.tsx`, `buildingSeries` in `result-series.ts`, view state and chart table in `results.tsx`; business logic only, CSS and tests excluded)
- **Depends on**: SGS-134, SGS-135, SGS-136
- **On merge**: none
- **Source**: `design/M9.md` C7, the "Chart views (M9.6)" behavior rules and the M9.6 row of the Criteria map (view half); plan outline J

## Context

The Gather rates chart has a `Per villager` checkbox that divides rates by gatherers, and the Units produced chart has one view only. M9.6 replaces the checkbox with a two-option view toggle on each of those charts: Rate or Villagers (the `gatherers` counts) on Gather rates, Units or Buildings (the `productionBuildings` series) on Units produced. The toggle sits in the chart header slot, which SGS-135 has moved out of the collapsible body, so it works while the chart is collapsed.

## Scope

State at `origin/main`, plus the end states of SGS-134 (`Results` takes `chartLayout`), SGS-135 (`ChartHeader` renders the `controls` slot in the header, `SeriesChart` passes `headerControls` to it) and SGS-136 (`SimulationResult.productionBuildings: BuildingSeries[]`, `BuildingSeries { baseId, name, counts }`). Everything is in `components/apps/aoe4-build-order/` unless named otherwise. Contract names and shapes are those of `design/M9.md` C7; use them exactly. This ticket does not edit `chart-header.tsx`, `chart-layout.ts`, `use-chart-drag.ts`, `line-chart.tsx` or anything under `lib/`.

- `chart-view-toggle.tsx` (new): `ChartView<V>`, `ChartViewToggle`, `GatherRatesView` and `UnitsProducedView` per C7. DOM per C7: a `role="group"` container with `data-testid="chart-view-toggle"`, `aria-label="<name> view"` and bootstrap `btn-group btn-group-sm`, and one `<button type="button" data-testid="chart-view-option" data-view={value} aria-pressed>` per view. Clicking the selected option does nothing (no `onChange`). Do not mix bootstrap `d-*`/`flex-*` utilities with module CSS on one element (REPO.md review checklist).
- `result-series.ts`: add `buildingSeries(result)` mapping each `result.productionBuildings` entry to a `ChartSeries` (`key` = `baseId`, `name`, `values` = `counts`), in the order the result gives. Remove `perVillagerSeries`.
- `results.tsx`:
  - Replace the `perVillager` state with two view states, `GatherRatesView` (default `rate`) and `UnitsProducedView` (default `units`). They live in `Results` state and are not persisted.
  - Gather rates chart: view table per C7. `rate` plots `resourceSeries(run.gatherRates)` with y label `Per minute`; `villagers` plots `resourceSeries(run.gatherers)` with y label `Villagers`. Labels of the options are `Rate` and `Villagers`. `headerControls` becomes a `ChartViewToggle` (the checkbox and its `gather-rates-per-villager` test id are removed).
  - Units produced chart: `units` plots `unitSeries(run)` with y label `Count`; `buildings` plots `buildingSeries(run)` with y label `Buildings`. Option labels `Units` and `Buildings`. It gains a `ChartViewToggle` as `headerControls`.
  - The series function is applied to the pinned run too, so pinned lines follow the view: `villagers` uses `pinned.gatherers` with the existing pinned rules; `buildings` uses `pinned.productionBuildings`, matched to current lines by `baseId` (the series `key`). A building present only in the pinned run gets only a dashed line, as units do today. The series legend entries and names change with the view in the same render.
  - The Units produced y label changes from today's `Units` to `Count` only through the C7 table; no other chart's label changes.
- `result-series.test.ts`: remove the `perVillagerSeries` cases; add `buildingSeries` cases (the field mapping and the order kept). Any `SimulationResult` fixture in this file already carries `productionBuildings` from SGS-136.
- Tests for the toggle markup: `chart-view-toggle.test.ts` (new, `renderToStaticMarkup`, as in `save-build.test.ts`): group label, one option per view, `aria-pressed` true on only the selected value, `data-view` values. No hook or DOM test (design Test levels: the repo has no DOM test environment).
- Acceptance:
  - `acceptance/aoe4-chart-views.spec.ts` (new) replaces `acceptance/aoe4-gather-rates-per-villager.spec.ts`, which is deleted. Keep the cases that still apply from the old spec in the new view terms (tooltip value matches the sampled `gatherRates` or `gatherers` response data at the hovered sample, the y label, the other charts' labels unchanged, a hidden legend entry stays hidden across a view switch, a pinned run's tooltip value follows the view and differs from the current run's). Reuse `acceptance/helpers.ts` (`openPage`, `showTab`, `waitForRun`, `CHART_IDS`) and the old spec's hover and tooltip helpers instead of rewriting them (the lint:dup config scans `acceptance/`).
  - `acceptance/aoe4-chart-layout.spec.ts` (rewritten by SGS-135): every use of the Per villager checkbox (`gather-rates-per-villager`, the `Per villager per minute` label) moves to the Villagers view of the toggle, keeping what the case proves (a header control stays visible and usable while the chart is collapsed, and its choice survives collapsing and expanding).
  - Any other spec that references the checkbox or its labels: find with `git grep -n "per-villager\|Per villager"` over `acceptance/` and fix each.
- Docs made untrue, in `docs/aoe4-build-order.md`: the statement that the Gather rates chart has a `Per villager` checkbox (off by default, divides `gatherRates` by `gatherers`, y label `Per villager per minute`, pinned run also per villager); any statement that the header slot holds the Per villager checkbox or that it survives a collapse (SGS-135 rewrote the "Chart controls" paragraph; update what it still says about the checkbox). Grep the doc and `ARCHITECTURE.md` for `Per villager`, `per-villager`, `perVillagerSeries` and `gather-rates-per-villager` and fix every statement the change contradicts. Add the two toggles: which views each chart offers, the defaults, that the choice is not persisted and resets on reload, that the toggle is in the header and works while collapsed, how pinned lines follow the view, and that a building only in the pinned run shows only a dashed line. Scope names the statements only; the implementer writes the replacements. Do not quote measured results.

**Out of scope:** `productionBuildings` in the simulator, OpenAPI and `lib/` (SGS-136); the header slot, `chart-header.tsx` and the drag and caret work (SGS-135); the layout model and key-results panel (SGS-134); marker and pinned legend changes; persisting the view; a third view on either chart; a DOM test environment.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `ChartViewToggle` static markup renders one `chart-view-toggle` group labelled `<name> view` with one `chart-view-option` per view, each with its `data-view`; `aria-pressed="true"` is on the option equal to `value` only. A test fails if two options are pressed or the `data-view` is the label instead of the value.
- [ ] Gather rates, Playwright: the view starts as Rate (`aria-pressed` true on `rate`, y label `Per minute`); clicking Villagers makes it pressed and the other not, the y label `Villagers`, and the hovered tooltip value for a resource equals the `gatherers` value at that sample in the simulate response (not the `gatherRates` value; the test picks a sample where the two differ and asserts that first). Clicking Rate returns the original label and rate value. Clicking the already-selected option changes nothing.
- [ ] Units produced, Playwright: starts as Units (y label `Count`, legend entries are unit names); clicking Buildings gives y label `Buildings` and legend entries equal to the names in the response `productionBuildings` (asserted non-empty first), and the plotted series count matches; clicking Units restores the original. The other charts' y labels do not change when either toggle is used.
- [ ] A toggle of a chart that is collapsed is visible and works: the view changes while collapsed and the new view is shown on expand. The test asserts the chart body is hidden before the click.
- [ ] A reload resets both charts to their defaults after a non-default view was chosen.
- [ ] Pinned run, Playwright: in Villagers view the pinned dashed lines take their values from the pinned run's `gatherers` (the test uses two runs whose per-resource gatherer counts differ at a sample and asserts they differ first; it fails if the pinned line were drawn from the current run). In Buildings view the pinned lines are matched by `baseId`, and a building only in the pinned run has a dashed line and no solid one. A series hidden through the legend stays hidden across a view switch within the same chart.
- [ ] `buildingSeries` keeps each `productionBuildings` entry's `baseId` as `key`, its `name`, and its `counts` as `values`, in the result's order; a test with two entries in a non-alphabetical order fails if the output is re-sorted. `perVillagerSeries` no longer exists.
- [ ] No source, test, acceptance spec or doc references the Per villager checkbox: `git grep -n "gather-rates-per-villager\|perVillagerSeries"` has no match in the tree, and `acceptance/aoe4-gather-rates-per-villager.spec.ts` is deleted.
- [ ] A header toggle stays usable by keyboard: Enter and Space on a focused option select it (native button behavior; the Playwright case presses the key and checks `aria-pressed`).
- [ ] The docs listed in Scope no longer contradict the code and describe both toggles as above.
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npm test` pass; `next build` succeeds; the new and rewritten acceptance specs pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none
