# SGS-084: Add a gatherers series and a per-villager view of the Gather rates chart

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog item, 2026-11-03)
- **Priority**: medium
- **Risk**: high
  <!-- simulateBuildOrder is a REPO.md criticalPaths symbol and this ticket changes what it samples and
       returns (a new gatherers series), and it adds a required field to the public simulate response
       (OpenAPI minor bump). Additive: no existing field's value, payment check, affordability check or wake
       time changes. About 40 lines of business logic. -->
- **Invariants**: A2 unchanged (the new series only counts `engine.gatherers`; it never feeds a payment, an affordability check or a wake time); A3 (the same build order, data and inputs give the same `gatherers` series); S3 unchanged (no new input, no new loop)
- **LOC estimate**: about 40 lines of business logic (engine count and sampling about 15 in `lib/aoe4-build-order/simulate.ts`, `model.ts` 2, `result-series.ts` about 10, `results.tsx` and `line-chart.tsx` about 15); OpenAPI, docs and tests excluded
- **Depends on**: none (main `b9481e3`, which has SGS-077, SGS-080 and SGS-081). Touches `results.tsx`; SGS-082 does not.
- **On merge**: none (the backlog bullet "Gather rate per villager as well as raw" is deleted by the manager)
- **Source**: owner request 2026-11-03, BACKLOG.md: "the Gather rates chart should be able to show rate per villager (resource/min divided by villagers on that resource), not only the raw resource/min it shows today, with a toggle between the two."

## Context

`SimulationResult.gatherRates` is income per minute per resource, but the result holds no count of villagers on each resource: `unitsProduced` has the villager total only, and `steps`/`markers` do not give the split. The count cannot be recovered client-side, and the per-villager rate differs by node (sheep, berries, farms, wood), so the split is not derivable from the rate either. The engine knows it exactly: `simulateBuildOrder` in `lib/aoe4-build-order/simulate.ts` computes `incomePerSecond` as the sum over `NODE_REFS` with `engine.gatherers[ref] > 0` of `engine.gatherers[ref] * rateOf(ref)`, grouped by the node's resource. Summing `engine.gatherers[ref]` over the same refs gives the matching divisor, so rate / count is exactly the mean per-villager rate. Decision: add an engine series (public API field) and divide on the client.

## Scope

All paths are relative to the repo root.

**1. Engine.** In `lib/aoe4-build-order/simulate.ts`, add a function beside `incomePerSecond` that returns, per `ResourceKind`, the sum of `engine.gatherers[ref]` over `NODE_REFS` with `engine.gatherers[ref] > 0`, grouped by `engine.data.base.gatherNodes[nodeKindOf(ref)].resource`, the same grouping `incomePerSecond` uses. In `simulateBuildOrder`, declare a `gatherers` record beside `gatherRates`, push the count in the same per-kind sample loop that pushes `gatherRates`, and return it directly after `gatherRates`. A villager walking to a node, building, or idle is not in `engine.gatherers` and so not counted, which matches `gatherRates`. Do not change `incomePerSecond`, `creditIncome`, `nextWake` or any payment path.

**2. Result.** `SimulationResult` in `lib/aoe4-build-order/model.ts` gains `gatherers: Record<ResourceKind, number[]>` directly after `gatherRates`, with the comment `// Villagers gathering each resource; the divisor of gatherRates.`. Each series has `times.length` entries. `lib/aoe4-build-order/api.ts` aliases the type and needs no edit; `schema.ts` validates requests only and does not change.

**3. OpenAPI.** In `docs/api/openapi.json`:
- `components.schemas.SimulationResult.required`: add `"gatherers"` directly after `"gatherRates"`.
- `components.schemas.SimulationResult.properties.gatherers`: new property after `properties.gatherRates`, the same shape (object, `required` food/wood/gold/stone, `additionalProperties: false`, each kind an array of `integer` with `minimum: 0` and its own description), with description "Number of villagers gathering each resource at each sample; gatherRates divided by this is the mean rate per villager."
- The 200 response example of the simulate operation: add `gatherers` after `gatherRates`, copied from a real response for the `buildOrder` request example (the contract spec compares them with `toEqual`).
- `info.version`: bump the minor (additive), from the current value.

**4. Docs.** In `docs/aoe4-build-order.md`, every statement this makes untrue:
- The result field list in Outputs: add a `gatherers` bullet after `gatherRates`: "per `ResourceKind`, the number of villagers gathering that resource at each sample (those counted in `gatherRates`; walking, building and idle villagers are not)."
- The overview paragraph under the title (it lists "gather rates, resources gathered, ..."): no edit needed unless it enumerates result fields; check it.
- The request-to-result flowchart near the end of the Build order input section: no new node (the series feeds the existing gather-rates graph); leave it.
- The chart table under Outputs, Page: the row "Gather rates (per minute)" gets a sentence after the table: "The Gather rates chart has a `Per villager` checkbox, off by default. On, each series shows `gatherRates` divided by `gatherers` at the same sample (0 where `gatherers` is 0) and the y axis label reads `Per villager per minute`; a pinned run is drawn the same way."

**5. Series helper.** In `components/apps/aoe4-build-order/result-series.ts`, add `perVillagerSeries(rates, gatherers)` returning the same `ChartSeries[]` as `resourceSeries(rates)` (same keys, names and order) with each value `rate / count`, and 0 when `count` is 0 (never `NaN` or `Infinity`).

**6. Chart.** In `components/apps/aoe4-build-order/results.tsx`, hold a `perVillager` boolean state (default false) in `Results`. For the Gather rates `SeriesChart` (`testId="chart-gather-rates"` stays), when on use `perVillagerSeries(result.gatherRates, result.gatherers)` for `series`, `perVillagerSeries(pinned.gatherRates, pinned.gatherers)` for the pinned series, and `yLabel="Per villager per minute"`; when off nothing changes (`yLabel="Per minute"`, `resourceSeries(...)`). `SeriesChart` in `line-chart.tsx` gains an optional `headerControls?: ReactNode` prop rendered beside the `<h3>`; `Results` passes a checkbox there (`className="form-check-input"` with a label "Per villager", `data-testid="gather-rates-per-villager"`, matching the checkbox in `step-table.tsx`). Toggling must not remount the chart: legend hidden-state and pinned lines survive it.

**7. Existing tests.** Every test that pins the response key list or enumerates `SimulationResult` keys gets `gatherers` (examples: the `simulationResult` key table in `acceptance/aoe4-simulate-api-contract.spec.ts`, the key list in `acceptance/aoe4-simulate-api-edges.spec.ts`, the `result()` builder in `components/apps/aoe4-build-order/result-series.test.ts`). `lib/aoe4-build-order/simulate-house-warnings.test.ts` digests the whole result minus named keys: (rework 1) main now digests a named list of fields, so no edit is needed: take main's version on rebase; the three pins stay as they are; do not re-pin. Any other test that fails only because the result has a new key is fixed the same way. The implementer lists every test it edits.

**Out of scope:** per-node or per-ref villager counts; a toggle on any other chart; persisting the toggle across reloads or pins; changing `gatherRates` semantics; idle or walking villager series; the tooltip float formatting (separate backlog item).

## Diagrams

Single-component change outside the core control loop (a read-only count added to the sampling step); no diagram required.

## Acceptance criteria

- [ ] Every simulate response has `gatherers` with keys `food`, `wood`, `gold`, `stone`, each an array of `times.length` non-negative integers.
- [ ] (respec 1) For every sample and kind, `gatherers[kind][i] === 0` exactly when `gatherRates[kind][i] === 0`, and when positive, `gatherRates[kind][i] / gatherers[kind][i] / 60` equals the per-villager rate of the node(s) gathered. Test case: the paste `start 4 sheep 2 wood -> sheep` with no steps returns at t=0 `gatherers.food[0] === 4`, `gatherers.wood[0] === 2`, `gatherers.gold[0] === 0`, and `gatherRates.food[0] / 4` equals the sheep rate x 60 (input: that start; breaks if the count sums the wrong grouping or includes non-gatherers).
- [ ] (respec 1) Mixed nodes on one resource: with villagers on both berries and sheep, `gatherers.food` is their sum while `gatherRates.food / gatherers.food` is the mean of the two rates weighted by villagers (input: `start 3 sheep 3 berry -> sheep` with no steps; at t=0 `gatherers.food[0] === 6`; catches a count of one node only).
- [ ] (respec 1) A villager that is walking to a node or constructing is not counted. Input: the paste `start 2 sheep 4 wood -> sheep` then `@0:30 build house with 2 from wood then wood`. Let `i` be the first sample with `times[i] >= steps[0].startedAt` and `r = gatherRates.wood[i-1] / gatherers.wood[i-1] / 60` (the per-villager wood rate, unchanged across the two samples since nothing is researched). Then `gatherers.wood[i-1] === 4`, `gatherers.wood[i] === 2` (dropped by n = 2, the `with 2` builders), and `gatherRates.wood[i-1] - gatherRates.wood[i]` equals `2 * r * 60`; the sample just after `steps[0].completedAt` still shows `gatherers.wood === 2` (the builders return to `engine.gatherers` only after the `villagerWalkSeconds` walk-back in `completeConstruction`, `lib/aoe4-build-order/simulate.ts`); at the first sample at or after `steps[0].completedAt` plus the walk-back time (or the last sample of a run long enough to include it), `gatherers.wood` is 4 again. (respec 2) Catches counting from the villager total or the step's `from` node before the builders leave instead of `engine.gatherers`.
- [ ] When a stocked node runs out and its gatherers move or go idle, `gatherers` for its resource drops at the same sample `gatherRates` does (catches a count that keeps depleted villagers).
- [ ] `gatherRates`, `floating`, `gathered`, `spent`, `steps`, `warnings` and every other pre-existing field of the result are unchanged for the same input; the three digests in `simulate-house-warnings.test.ts` keep their current values.
- [ ] `docs/api/openapi.json` validates the response (the existing Ajv check in `acceptance/aoe4-gathered-resources.spec.ts` and the contract spec's "the buildOrder request example returns the documented 200 body" pass), `gatherers` is in `required`, and `info.version` is one minor above its current value.
- [ ] `perVillagerSeries` unit test (table): `rates [120, 60, 0]` with `gatherers [4, 2, 0]` gives `[30, 30, 0]`; a zero count with a positive rate gives 0, not `Infinity`; keys and names equal `resourceSeries`'s (catches an unguarded division).
- [ ] (respec 1) On the page after a run, the Gather rates chart shows a `Per villager` checkbox (`gather-rates-per-villager`), unchecked, with y label (`.recharts-label`) `Per minute`. Checking it changes the y label to `Per villager per minute` and the plotted values to rate / villagers; unchecking restores `Per minute` and the raw values. The other three charts' y labels do not change. (rework 1) Acceptance case in a new spec under `acceptance/` (`acceptance/aoe4-build-order.spec.ts` no longer exists on main), asserting on values, never on rendered line height or pixel position (the y axis rescales on toggle): run the paste `start 4 sheep 2 wood -> sheep` and keep the 200 response body; hover the Gather rates plot at one fixed point, read the tooltip's time label (`m:ss`, map it to sample `i` via `times`) and the `Food` item's value; check it, re-hover the same point, and read again. Expect the unchecked value to equal `gatherRates.food[i]` and the checked value to equal `gatherRates.food[i] / gatherers.food[i]` from the response (rework 1) (numeric compare with a tolerance of at least 0.05: main's tooltip now rounds values to one decimal), each read inside `expect(...).toPass()` or `expect.poll`. Catches a toggle that only changes the label, divides by the wrong series, or draws raw rates.
- [ ] (respec 1) With a pinned run present, the pinned lines in the Gather rates chart also switch to per-villager when the box is checked: the tooltip's `Food (pinned)` value at a hovered sample equals the pinned run's `gatherRates.food[i] / gatherers.food[i]` (rework 1) (pin a run whose food node mix differs from the current run's, so the two per-villager values differ: e.g. pin `start 3 sheep 3 berry -> sheep`, then run `start 6 sheep -> sheep`; a run on the same node with a different villager count gives the same per-villager value). A legend entry hidden before the toggle is still hidden (dimmed, its line absent) after it.
- [ ] (respec 1) `docs/aoe4-build-order.md` has the `gatherers` bullet in Outputs and the toggle sentence after the chart table: `git grep -n "Per villager" -- docs/aoe4-build-order.md` matches the toggle sentence (it matches nothing today), and `git grep -n "number of villagers gathering" -- docs/aoe4-build-order.md` matches the Outputs `gatherers` bullet (also nothing today). The `Gather rates (per minute)` table row stays.
- [ ] No INVARIANTS.md regressions

## Open questions

None. Defaults chosen in Scope: toggle off by default, a checkbox labeled `Per villager`, zero where no villagers gather, not persisted. Change them only if the owner says so.

## Re-spec 2026-11-04

- Underspecified: the page criterion compared rendered line height (the y axis rescales on toggle, so pixels prove nothing); the build-step criterion compared villagers with wood/min; the docs grep named no phrase; Depends on cited a stale base.
- Changed: the page and pinned criteria now read tooltip values against `gatherRates[i] / gatherers[i]` from the response; the build-step criterion names its paste input and states drops of n = 2 villagers and 2 x r x 60 wood/min; the docs criterion greps `Per villager`; start inputs written in valid paste form; base refreshed to `b9481e3`.
- No branch work exists; Scope is unchanged.

- (respec 2) The build-step criterion no longer asserts 4 gatherers at `completedAt`; it asserts 2 just after and 4 after the walk-back. Nothing else changed.

## Rework 1 - 2026-11-04 (review)

Review-1 (`reports/SGS-084-review-1.md`) at tip b90ad269213d2290ad3d2b338162953d5d210eff: REQUEST CHANGES. No gate had passed the task before this.

Findings:
- `lib/aoe4-build-order/simulate-series.test.ts:263`: the test "drops at the same sample as the gather rate when a stocked node runs out" never reads `gatherRates`, so it does not check what its name claims.
- `lib/aoe4-build-order/simulate-series.test.ts:225-229`: `rateOf` is a near copy of `perSecond` in `build-move.acceptance.test.ts:60-64`, which breaks the REPO.md AoE4 rule against copied helpers. `effectStateOf` in `test-helpers.ts:95` already covers it.

Required fixes:
- [ ] In that test, after the `gatherers.wood` assertion, add `expect(result.gatherRates.food[after - 1]).toBeGreaterThan(0)` and `expect(result.gatherRates.food.slice(after).every((r) => r === 0)).toBe(true)`.
- [ ] Replace `rateOf`'s body with `effectiveGatherRate(node, effectStateOf({ buildings: new Map([['capital-town-center', 1]]), coverage: defaults.influenceCoverage }), defaults)`, importing `effectStateOf` from `test-helpers.ts`.
- [ ] Rebase onto current origin/main. For `simulate-house-warnings.test.ts`, take main's version, which digests named fields and needs no `gatherers` exclusion. In `line-chart.tsx`, keep this branch's `textAnchor: 'middle'` y-label change (the review ruled it in scope) and main's `<Tooltip>` changes from SGS-087. Check that `openapi.json` `info.version` is still exactly one minor above main's. Update the 2.3.0 pins in the acceptance specs if main has moved it.
