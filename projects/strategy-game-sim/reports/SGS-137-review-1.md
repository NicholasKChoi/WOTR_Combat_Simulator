# SGS-137 review 1

Verdict: **REQUEST CHANGES**

Branch `sgs-137-chart-view-toggles`, tip `4c86b5b`, base origin/main `4f369f3`. Full review (not delta).

## Blocking findings

1. `acceptance/aoe4-chart-views.spec.ts:30` - test - `yLabel = chart(page, id).locator('.recharts-label')` also matches the age-up marker label. Recharts gives the age-up `ReferenceLine` text the same `recharts-label` class as the y axis label. On the default page build (ENG 1TC, Feudal at 4:23) each chart has two `.recharts-label` elements, so `toHaveText(string)` fails with a Playwright strict mode violation. I ran a probe script (not a test file) against `next dev` on the task worktree. `getByTestId('chart-gather-rates').locator('.recharts-label')` resolved to `["Per minute","Feudal 4:23"]` and `getByTestId('chart-units-produced').locator('.recharts-label')` to `["Count","Feudal 4:23"]`. `expect(loc).toHaveText('Per minute')` threw `Error: strict mode violation: ... resolved to 2 elements`.
   - Why it matters: these tests use the default build and will always fail:
     - the collapse test, `:164` (`toHaveText('Villagers')` after expanding);
     - the reload test, `:180` and `:181`.
     That breaks the criterion "the new and rewritten acceptance specs pass", along with the collapsed-toggle and reload criteria. The other tests pass only because their pasted builds have no age-up step: `expectOtherLabelsUnchanged` at `:41`, and `:94`, `:103`, `:113`, `:117`, `:133`, `:139`, `:146`, `:209`, `:245`. Any later change to those pastes or to marker labelling breaks them too.
   - Direction: narrow the locator to the rotated axis label, as the sibling `acceptance/aoe4-gathered-resources.spec.ts:102` does: `const yLabel = (page: Page, id: string) => chart(page, id).locator('text.recharts-label[transform^="rotate(-90"]')`. Keep every assertion that uses it unchanged.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Toggle static markup | pass | `chart-view-toggle.test.ts`: the group regex and label, `data-view` equals the values, `aria-pressed` per value via `it.each`. The implementer's mutations (always pressed, label used as `data-view`) are caught by these assertions; I confirmed this by reading them. |
| 2 | Gather rates Playwright (Rate/Villagers, tooltip values, re-click no-op) | pass (by reading) | `:88-122`. It asserts that `gatherers` differs from `gatherRates` at the hovered samples before switching. The re-click of the selected option keeps the pressed state and label. |
| 3 | Units produced Playwright | pass (by reading) | `:124-147`. It asserts that `productionBuildings` is non-empty, legend names equal the response names, the `path[data-series]` count equals the building count (no other `path[data-series]` exists in the chart; `chart-legend.tsx:25` puts it on a button), the restore works, and the other charts' labels do not change. |
| 4 | Collapsed toggle works | **fail** | The test at `:149-165` is correct in shape: it asserts the body is hidden before the click. But `:164` hits the strict mode violation (finding 1). The behaviour itself works: my inspection switched the view while collapsed at all 5 widths. |
| 5 | Reload resets defaults | **fail** | `:167-182`: the shape is right (non-default state asserted before the reload), but `:180-181` hit finding 1. |
| 6 | Per-view series selection, Vitest | pass | `result-series.test.ts` `gatherRatesSeries` / `unitsProducedSeries`: the fixture asserts `gatherers != gatherRates` first. Villagers maps to `gatherers` and Rate to `gatherRates`; Buildings maps to `buildingSeries` (key `barracks`) and Units to `unitSeries`. The pinned run keeps its own values through `toChartRows`. |
| 7 | Pinned run from drawn lines | pass (by reading) | `:193-226` asserts that the two runs' food gatherers differ, then checks that `food` and `pinned:food` paths differ in Villagers. The hidden `wood` stays hidden across rate, villagers, rate. `:228-249` asserts barracks only in the pinned response, then checks that `pinned:barracks` is drawn, `barracks` is not, and the shared building has both lines. `isAnimationActive={false}` (`line-chart.tsx:138,153`), so reading `d` is stable. |
| 8 | `buildingSeries` mapping and order; `perVillagerSeries` gone | pass | Non-alphabetical pair (`town-center`, `barracks`) checked with `toEqual`. `git grep perVillagerSeries`: no match. |
| 9 | No Per villager references; old spec deleted; helpers in one file | pass | `git grep "gather-rates-per-villager\|perVillagerSeries"`: none. `git grep "Per villager" -- docs ARCHITECTURE.md acceptance components`: none. Old spec deleted. `hoverPlot`, `readTooltip`, `hoverRead`, `samplesAt` and `expectOneOf` exist only in `aoe4-chart-views.spec.ts`. |
| 10 | Keyboard Enter/Space | pass (by reading) | `:184-191`. Native `<button type="button">`. Space is pressed with villagers already selected, so the press must change the state. |
| 11 | Docs | pass | `docs/aoe4-build-order.md:975-990, 1009-1013`. Every claim in the implementer's Doc claims list checks out against `results.tsx`, `result-series.ts` and `line-chart.tsx` (`toChartRows` matches lines by key, the view state lives in `Results`, so it survives collapse and move). No other statement in the doc or `ARCHITECTURE.md` is left contradicted. |
| 12 | tsc, lint:dup, npm test, next build, specs pass | **fail** (specs) | tsc clean. lint:dup 0 clones in both configs. `npm test`: 81 files passed, 1 skipped; 2487 tests passed. `next build` succeeds. The new spec cannot pass (finding 1); I ran no acceptance specs. |
| 13 | No invariant regressions | pass | See below. |

## Invariants touched

- A1, A2, A3 (`components/apps/aoe4-build-order/**` path match): hold. The diff touches no file under `lib/`, `data/` or `pages/api/` and no simulation path. The view only reads `productionBuildings`.
- S1: holds. The only imports are within `components/apps/aoe4-build-order/`, plus `lib/aoe4-build-order` model types.

## Contract

- C7 names and shapes match: `ChartView<V>`, `ChartViewToggle({ name, views, value, onChange })`, `GatherRatesView`, `UnitsProducedView`, `buildingSeries(result)`, the DOM attributes and the bootstrap classes. The y labels and option labels match both C7 tables. Defaults are `rate` and `units`, and the state is not persisted.
- New exported names for CONTEXT.md Key surfaces: `gatherRatesSeries(view, run)` and `unitsProducedSeries(view, run)` in `components/apps/aoe4-build-order/result-series.ts`.
- Scope: none of the files the ticket excludes (`chart-header.tsx`, `chart-legend.tsx`, `chart-layout.ts`, `use-chart-drag.ts`, `line-chart.tsx`, `lib/`) is touched. The diff adds no `golang/` change, no persistence and no third view. It answers no open question with an invented constant.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. `rulesFile` is empty.

## UI inspection

I served the task worktree with `next dev` on port 3871 and used `inspect.cjs` with the repo's Playwright. I loaded `/apps/aoe4-build-order` (default build ENG 1TC) at 375, 390, 700, 768 and 1280 px, in the Results tab where a tab layout applies, and checked three states: default, both toggles switched (Villagers and Buildings), and Gather rates collapsed.
- Clipped overflow in the chart headers: none. Overlapping header children: none. Option labels wrapping mid-word: none. Horizontal document overflow: none.
- Below the split breakpoint the toggle wraps onto its own line under the title row (header 69px tall at 375 and 390). It sits inline at 700 px and wider.
- The pressed and unpressed styles differ: pressed is `bg rgb(108,117,125)` with white text; unpressed is a transparent background with grey text.
- Y labels change to `Villagers` and `Buildings`. The Units produced legend changes from unit names to `Capital Town Center, Abbey of Kings, Archery Range, Barracks`. The collapsed Gather rates header still shows the toggle with Villagers pressed.
- Screenshots I read: `w375-switched.png`, `w375-collapsed.png`, `w700-default.png`, `w1280-units.png` in `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/ea918271-89a9-476e-95c2-a67b7d3c8a20/scratchpad/review-sgs-137/`. No visual defect.
- A second probe, `ylabel.cjs`, produced the evidence for finding 1.
- The server is stopped (`serve.sh stop 3871`: port free). The task worktree was left clean.

## Non-blocking notes

- `chart-view-toggle.tsx:27` builds the class with a ternary of two full strings. The sibling toggle `build-input.tsx:111` uses `cn('btn btn-outline-secondary', view === option && ['active', styles.activeView])`. The repo checklist only forbids template literals, so this is not blocking, but `cn` would match the sibling.
- `chart-view-toggle.tsx:28`: `onClick={() => view.value !== value && onChange(view.value)}` uses `&&` as a statement. An `if` reads more plainly; this is style only.
- In the pinned Villagers test, `ratePaths` at `:203` is read right after `runOk`. It is only used in `not.toEqual` checks that hold whether or not it is stale, so it does not affect whether the test can fail.
- Out of scope (SGS-136 domain): on the default build the Buildings view lists `Abbey of Kings` as a production building. That is consistent with C9 if the abbey appears in a unit's `producedBy` in the data; I did not verify it.

## Coverage

- Reviewed all 9 changed files:
  - `chart-view-toggle.tsx`, `chart-view-toggle.test.ts`, `result-series.ts`, `result-series.test.ts` and `results.tsx`;
  - `acceptance/aoe4-chart-views.spec.ts`, `acceptance/aoe4-chart-layout.spec.ts`, and the deleted `aoe4-gather-rates-per-villager.spec.ts`;
  - `docs/aoe4-build-order.md`.
- Compared against `build-input.tsx`, `chart-legend.tsx`, `chart-header.tsx`, `line-chart.tsx`, `acceptance/helpers.ts` and `acceptance/aoe4-gathered-resources.spec.ts`.
- Ran tsc, lint:dup, `npm test`, `next build` and the UI inspection. I ran no acceptance specs.
- REPO.md review checklist: I applied "Every diff" (build and page load) and the "AoE4 build order" section (widths, visible state change, no bootstrap utility mixed with module CSS: the toggle uses only bootstrap classes). The "Shared code" and "Combat simulator" sections do not apply.
- The LSP tool was not used: no callers outside `results.tsx` exist for the changed exports (`git grep` for `perVillagerSeries` returns nothing).
- The review worktree was removed.
