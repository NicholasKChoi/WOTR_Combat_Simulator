# SGS-077: Add a cumulative gathered resources series and chart

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none yet (owner request 2026-11-02; not part of M4, whose criteria are all done)
- **Priority**: medium
- **Risk**: standard
  <!-- Adds one field to the public simulate response (additive, OpenAPI minor bump) and one counter in the
       engine's income credit; no existing field or behavior changes. Under ~100 lines of business logic. -->
- **Invariants**: A3-style determinism holds (same build and inputs, same series); S3 unchanged (no new input)
- **LOC estimate**: about 50 lines of business logic (engine counter and sampling about 15 in `lib/aoe4-build-order/simulate.ts`, `model.ts` and `schema.ts` type about 5, `results.tsx` chart about 12, compare panel row optional, see item 4); OpenAPI, docs and tests excluded
- **Depends on**: none (main `ee7ecb9`). Touches `results.tsx`, as does SGS-076; whichever lands second rebases (the new chart goes in the charts column).
- **On merge**: none
- **Source**: owner request in chat 2026-11-02: "can we also show total gathered resources as a chart?"

## Context

The result carries per-minute `gatherRates`, banked `floating` and cumulative `spent` (by spend category, summed
over the four kinds), but no cumulative amount gathered per resource. Floating cannot recover it: spending is not
broken down by resource. The engine credits income in one place, `creditIncome` in `lib/aoe4-build-order/simulate.ts`
(line ~706 on main): unstocked refs add `rate * seconds`, stocked refs add what `drawDown` takes. Counting there gives
an exact running total.

## Scope

All paths are relative to the repo root.

**1. Engine.** Add `gathered: Resources` to the engine state, zero at start (starting resources are not gathered).
In `creditIncome`, add the same amounts credited to `engine.resources` to `engine.gathered`, for both the unstocked
and the stocked paths. Nothing else credits it: starting resources, refunds (if any) and deposits are not gathering.
Grep `engine.resources\[.*\] +=` to confirm `creditIncome` is the only gather credit; if another gather credit site
exists, it counts too and the PR names it.

**2. Result.** `SimulationResult` (`lib/aoe4-build-order/model.ts`) gains
`gathered: Record<ResourceKind, number[]>` beside `floating`, commented "Cumulative resources gathered; starting
resources excluded." `simulateBuildOrder` samples `engine.gathered[kind]` at each sample time, next to `floating`.
Each series is non-decreasing and has `times.length` entries. Update the zod result schema in
`lib/aoe4-build-order/schema.ts` if it describes the result.

**3. OpenAPI and docs.** `docs/api/openapi.json`: add `gathered` to the result schema (same shape as `floating`, in
`required`), bump `info.version` 2.0.0 to 2.1.0 (additive). `docs/aoe4-build-order.md`: add `gathered` to the result
field list next to `floating` (line ~710) and to the charts paragraph (line ~764) and the result diagram (line ~663).
The contract check must pass.

**4. Chart.** In `components/apps/aoe4-build-order/results.tsx`, add a fourth `SeriesChart` with
`testId="chart-gathered-resources"`, title "Gathered resources", `yLabel="Resources"`,
`series={resourceSeries(result.gathered)}`, markers and the pinned overlay as the other resource charts do. Place it
directly after "Gather rates". A pinned run from local storage saved before this change has no `gathered`: the chart
draws without a pinned overlay in that case and nothing throws (check `pin-storage.ts`; if it validates the stored
result, an old pin without `gathered` is either accepted with the overlay omitted or dropped as it handles other
shape changes, and the PR says which).

**5. Tests.**
- Unit (`lib/aoe4-build-order/*.test.ts`, next to the existing series tests): for the default build at 600 s,
  `gathered[kind]` is non-decreasing, starts at 0, and for each kind
  `gathered[kind].at(-1) ≈ floating[kind].at(-1) - start[kind] + spentOn[kind]` where `spentOn` is summed from the
  engine's payments (or, if no per-kind spend total is available, assert the weaker
  `gathered[kind].at(-1) >= floating[kind].at(-1) - start[kind]`, and the PR says which). Over any sample interval
  with no node running out, `gathered` grows by `gatherRates / 60 * dt` within 1e-6.
- Acceptance API (`acceptance/aoe4-simulate-api-*.spec.ts`, the series or contract spec): the response has
  `gathered` with four arrays of `times.length` numbers.
- Acceptance page: after a run, `chart-gathered-resources` is visible on the Results tab; with a pin it shows the
  pinned overlay like `chart-floating-resources`.
- `acceptance/aoe4-narrow-layout.spec.ts` still passes (the new chart and its legends fit 390 px).

**Out of scope:** a per-resource spend breakdown; a total-of-all-kinds line; changing `gatherRates`, `floating` or
`spent`; a compare-panel key number for gathered totals; resource counts per node.

## Diagrams

One new field threaded from the engine counter to one chart; no diagram required.

## Acceptance criteria

- [ ] The simulate response includes `gathered` (four non-decreasing arrays, `times.length` long, starting at 0).
- [ ] Unit tests tie `gathered` to `gatherRates` over intervals and bound it by floating minus starting resources.
- [ ] `docs/api/openapi.json` lists `gathered` (required) at version 2.1.0 and the contract check passes.
- [ ] `docs/aoe4-build-order.md` documents `gathered` and the new chart.
- [ ] The Results tab shows `chart-gathered-resources` after "Gather rates", with the pinned overlay when pinned.
- [ ] An old stored pin without `gathered` does not crash the page.
- [ ] No existing response field, test id or expected test value changes; the full acceptance and unit suites pass.
- [ ] No INVARIANTS.md regressions

## Open questions

None. Defaults chosen: starting resources excluded, chart placed after "Gather rates", OpenAPI 2.1.0. The owner can
change any of these at spec gate.
