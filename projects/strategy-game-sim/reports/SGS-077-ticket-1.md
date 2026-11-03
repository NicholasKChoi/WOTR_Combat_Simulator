# SGS-077 ticket (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-077-aoe4-gathered-resources-chart.md
Base checked: main ee7ecb9.

## Summary

"Add a cumulative gathered resources series and chart". Component: aoe4-build-order. Risk: high. About 30 lines of
business logic. Depends on: none. It relates to SGS-076, since both touch `results.tsx`. The engine gets a
`gathered` counter in `creditIncome` on both the unstocked and the stocked paths. `SimulationResult.gathered` is
sampled beside `floating`. OpenAPI gets the schema, the required entry and the 200 example, with version 2.1.0. Five
passages in `docs/aoe4-build-order.md` are fixed. A third chart of four, `chart-gathered-resources`, is added. Scope
also says how existing chart and series lists and typed fixtures change. There are two new unit cases and one API
acceptance check. The ticket has 9 criteria.

## Gaps resolved (spec gate 1)

1. Risk is now high. The comment names criticalPaths `simulateBuildOrder` and the new public response field, and
   says the change is additive instead of "no behavior changes".
2. The old-pin paragraph and its criterion are deleted. Scope 5 says the pinned run is re-simulated from stored
   text, so its overlay uses its own `gathered`.
3. The unit tests:
   - Constant-rate fixture: `run([pauseTownCenter], { autoHouses: false, nodeAmounts: INFINITE_NODES,
     durationSeconds: 300 })`.
   - Prebuilt builds: a four-kind sum identity (gathered = floating - start + total spent) plus a per-kind bound.
   - Deviation from the manager's wording: "no depletion" is defined as every `depletions` entry having
     `depletedAt === null`, not as `depletions` being empty. The `NodeDepletion` comment in `model.ts` says there is
     "one per run ref", so the array is never empty. An "empty" premise would fail on every fixture.
4. Two more doc passages are added: the overview line and the chart table ("four line charts" plus a "Gathered
   resources" row). The "draws three graphs" paragraph is also included.
5. OpenAPI locations are named: `SimulationResult.required`, `SimulationResult.properties.gathered`, and the 200
   example under `paths["/api/aoe4-build-order/simulate"].post`. The example must be copied from a real response,
   because the contract spec compares it with `toEqual`.
6. Typed fixtures are named. `result-series.test.ts` `result()` and the contract spec's
   `Record<keyof SimulationResult, true>` are the two that `tsc --noEmit` flags, confirmed in the throwaway worktree.
7. Chart ids: `chart-gathered-resources` is added to `CHARTS` and `yLabels` in `aoe4-build-order.spec.ts`, to its
   two-chart literal loop, to `CHART_IDS` and `RESOURCE_CHARTS` in pin-compare (with the title changed from "all
   three charts" to "every chart"), and to `RESOURCE_CHARTS` in m3-flow. The `simulate.test.ts` series-length list
   also gains `gathered`. The wording is now "one more SeriesChart (four in all), placed third". Criterion 8 allows
   exactly these edits.
8. Invariants: A2 unchanged, A3, S3 unchanged. Scope 2 says the `schema.ts` step is a no-op and so is the `api.ts`
   step.

## Verification run

I used a throwaway worktree at main with a minimal `gathered` implementation, then removed it:

- Constant-rate fixture: every `depletedAt` is null and `spent` is all zero. The per-interval
  `gatherRates/60*dt` check and `gathered = floating - floating[0]` hold within about 1e-12.
- All three prebuilt builds at 600 s: the sum identity holds within about 1e-11, the series are non-decreasing,
  the per-kind bound holds, and `gathered[0]` is 0.
- Mutation: removing the stocked-path counter breaks the sum identity on all three builds (error over 1000).
  The unstocked mutation fails the constant case by construction, because that fixture only uses unstocked refs.
- `git grep -c chart-gathered-resources -- acceptance` finds nothing on main today, as expected.

## Diagrams

None. This is a single component with no change to the event loop's decisions.

## Open questions

None.

## Overlap

- SGS-076 also edits `results.tsx` layout; whichever lands second rebases.
- SGS-076's ticket names the three chart ids and the 360 px height. Its criteria refer to `chart-units-produced` and
  `chart-floating-resources` only, so the new chart does not invalidate them.
