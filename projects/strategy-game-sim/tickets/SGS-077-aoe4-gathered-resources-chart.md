# SGS-077: Add a cumulative gathered resources series and chart

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none yet (owner request 2026-11-02; not part of M4, whose criteria are all done)
- **Priority**: medium
- **Risk**: high
  <!-- simulateBuildOrder is a REPO.md criticalPaths symbol and this ticket changes what it samples and returns (a
       new gathered series), and it adds a required field to the public simulate response (OpenAPI minor bump).
       The change is additive: no existing field's value, no payment or affordability check, and no wake time
       changes. About 30 lines of business logic. -->
- **Invariants**: A2 unchanged (the new counter only mirrors what `creditIncome` adds to `engine.resources`; it
  never feeds a payment, an affordability check or a wake time); A3 (the same build order, data and inputs give
  the same `gathered` series); S3 unchanged (no new input, no new loop)
- **LOC estimate**: about 30 lines of business logic (engine counter, initialisation and sampling about 10 in
  `lib/aoe4-build-order/simulate.ts`, `model.ts` field 2, `results.tsx` chart about 10); OpenAPI, docs and tests
  excluded
- **Depends on**: none (main `ee7ecb9`). Touches `results.tsx`, as does SGS-076; whichever lands second rebases (the
  new chart goes in the charts column).
- **On merge**: none
- **Source**: owner request in chat 2026-11-02: "can we also show total gathered resources as a chart?"

## Context

The result carries per-minute `gatherRates`, banked `floating` and cumulative `spent` (by spend category, summed
over the four kinds), but no cumulative amount gathered per resource. Floating cannot recover it: spending is not
broken down by resource. The engine credits income in one place, `creditIncome` in `lib/aoe4-build-order/simulate.ts`:
unstocked refs add `rate * seconds`, stocked refs add what `drawDown` takes. Counting there gives an exact running
total.

## Scope

All paths are relative to the repo root.

**1. Engine.** Add `gathered: Resources` to the `Engine` interface in `lib/aoe4-build-order/simulate.ts`, initialised
to all zeros in `createEngine` (starting resources are not gathered). In `creditIncome`, add the same amounts credited
to `engine.resources` to `engine.gathered`, on both the unstocked path and the stocked (`drawDown`) path.
`creditIncome` is the only gather credit: its two `engine.resources[...] +=` lines are the only `+=` on resources in
`lib/aoe4-build-order/` (the only other write is `payCost`'s subtraction in `engine-common.ts`). Nothing else touches
`engine.gathered`; `payCost`, affordability checks and wake times do not read it.

**2. Result.** `SimulationResult` in `lib/aoe4-build-order/model.ts` gains
`gathered: Record<ResourceKind, number[]>` directly after `floating`, with the comment
`// Cumulative resources gathered; starting resources excluded.` In `simulateBuildOrder`, declare a `gathered` record
beside `floating`, push `engine.gathered[kind]` in the same sample loop that pushes `floating`, and return it after
`floating`. Each series has `times.length` entries, starts at 0 and never decreases.
`lib/aoe4-build-order/schema.ts` does not describe the result (it validates the build order and inputs only), so it
does not change. `lib/aoe4-build-order/api.ts` aliases `SimulateResponse = SimulationResult` and needs no edit.

**3. OpenAPI.** In `docs/api/openapi.json`:
- `components.schemas.SimulationResult.required`: add `"gathered"` directly after `"floating"`.
- `components.schemas.SimulationResult.properties.gathered`: new property after `properties.floating`, the same
  shape as `floating` (object, `required` food/wood/gold/stone, `additionalProperties: false`, each an array of
  numbers with `minimum: 0`), with description "Cumulative amount of each resource gathered up to each sample;
  starting resources are excluded." Each of the four kind properties carries a description, as `floating`'s do.
- The 200 response example of the simulate operation
  (`paths["/api/aoe4-build-order/simulate"].post.responses["200"].content["application/json"].example`): add
  `gathered` after `floating`, with the values the route returns for the `buildOrder` request example. The contract
  spec's "the buildOrder request example returns the documented 200 body" test compares them with `toEqual`, so
  copy them from a real response, not by hand.
- `info.version`: 2.0.0 to 2.1.0 (additive).

**4. Docs.** In `docs/aoe4-build-order.md`, every statement this makes untrue:
- The overview paragraph under the title ("series over time of units produced, gather rates, floating resources,
  spending and population"): add "resources gathered" after "gather rates".
- The request-to-result flowchart at the end of the Build order input section (the one ending in
  `result --> floating["graph: floating resources"]`): add `result --> gathered["graph: gathered resources"]` between the
  `rates` and `floating` edges.
- The result field list in the Outputs section: add a `gathered` bullet after `floating`: "per `ResourceKind`, the cumulative amount
  gathered since t=0; starting resources are not counted, and it never decreases."
- The paragraph "The page draws three graphs over time from it ...": "three" becomes "four", and the list reads
  "units produced (by unit and tier), gather rates, gathered resources, and floating resources".
- The chart table under Outputs, Page: "A 200 draws three line charts" becomes "A 200 draws four line charts", and a row
  `| Gathered resources | `food`, `wood`, `gold`, `stone` | `Food`, `Wood`, `Gold`, `Stone` |` goes between the
  "Gather rates (per minute)" and "Floating resources" rows.

**5. Chart.** In `components/apps/aoe4-build-order/results.tsx`, add one more `SeriesChart` (four in all) with
`testId="chart-gathered-resources"`, `title="Gathered resources"`, `yLabel="Resources"`,
`series={resourceSeries(result.gathered)}`, `markers={result.markers}`, `pinnedMarkers={pinned?.markers}` and
`pinned={pinned ? { times: pinned.times, series: resourceSeries(pinned.gathered) } : undefined}`, as the other
resource charts do. Order on the page: Units produced, Gather rates, Gathered resources, Floating resources (the new
chart is third). The pinned run is re-simulated from its stored text (`pin-storage.ts` stores only version, name,
text and duration), so the pinned overlay uses the pinned run's own `gathered`.

**6. Existing tests and fixtures.** Rule: a list of the result's charts, fields or per-sample series gains the new
entry; a test that pins the OpenAPI document version moves to 2.1.0; a digest of the whole result leaves `gathered`
out and keeps its pinned value; no other existing expected value changes. Today that means:
- `acceptance/aoe4-build-order.spec.ts`: `CHARTS` gains `'chart-gathered-resources'` (after `'chart-gather-rates'`);
  the `yLabels` map gains `'chart-gathered-resources': 'Resources'` (it is indexed by `CHARTS`, so typecheck
  requires it); the literal `['chart-gather-rates', 'chart-floating-resources']` loop that checks one path per
  resource kind gains it.
- `acceptance/aoe4-build-order-pin-compare.spec.ts`: `CHART_IDS` and `RESOURCE_CHARTS` gain it; the test title
  "... in all three charts" becomes "... in every chart".
- `acceptance/aoe4-build-order-m3-flow.spec.ts`: `RESOURCE_CHARTS` gains it.
- `lib/aoe4-build-order/simulate.test.ts`, "samples every SAMPLE_SECONDS and at the horizon": the `arrays` list
  gains `...Object.values(result.gathered)`.
- Typed `SimulationResult` objects: `components/apps/aoe4-build-order/result-series.test.ts` `result()` gains a
  `gathered` record of three-entry arrays; `acceptance/aoe4-simulate-api-contract.spec.ts`'s
  `simulationResult: Record<keyof SimulationResult, true>` gains `gathered: true`. These two are what
  `npx tsc --noEmit` flags today; any other typed fixture it flags gets the same treatment.
- (respec 2) `acceptance/aoe4-simulate-api-edges.spec.ts`, "a villager-only order returns every result field, aligned
  to the times axis": the sorted expected key list gains `'gathered'` (between `'gatherRates'` and `'markers'`).
- (respec 2) `acceptance/aoe4-simulate-api-issue-shape.spec.ts`, "suggestion is an optional string property and the
  document version is 2.0.0": `expect(spec.info.version).toBe('2.0.0')` becomes `'2.1.0'` and the title ends
  "... the document version is 2.1.0". It is the only test that pins the version
  (`acceptance/fight-api-spec-surface.spec.ts` only checks `info.version` is truthy and does not change).
- (respec 2) `lib/aoe4-build-order/simulate-house-warnings.test.ts`, describe "timing with the auto-house warnings",
  "leaves every field of %s at 1800 s but warnings as it was": the destructure becomes
  `const { warnings, gathered, ...rest }`, the title reads "... at 1800 s but warnings and gathered as it was", and the
  describe comment reads "Digests of every field but warnings and gathered; the warnings must leave them unchanged."
  The three pinned digests stay as on main (`e7f2436b024f722f`, `a0105e4a512765a0`, `46f521f50e92ca03`), not
  re-pinned: unchanged pins are the check that no existing field moved on any prebuilt build. The late-house test
  above it digests named fields only and does not change. SGS-080 re-pins these digests; if it lands after this
  ticket, it computes them with `gathered` excluded.
- Checked and unaffected (they compare two runs of the same engine, digest named fields, or remove a different key):
  `lib/aoe4-build-order/research.acceptance.test.ts` (`rest` vs `plainRest`, both carry `gathered`),
  `acceptance/aoe4-simulate-api-house-lead-time.spec.ts` (digests `spawnedPopulation`, `spent`, `steps`, `warnings`),
  `acceptance/aoe4-simulate-api-contract.spec.ts` "a real 200 validates ..." (`withoutTimes`). No snapshot files exist.
The implementer lists every test it edits in the PR.

**7. New tests.**
- Unit, new `describe('gathered')` in `lib/aoe4-build-order/simulate-series.test.ts`:
  - Constant-rate case: `run([pauseTownCenter], { inputs: { autoHouses: false, nodeAmounts: INFINITE_NODES,
    durationSeconds: 300 } })` on the default game data (`INFINITE_NODES` from `test-helpers.ts`). The fixture
    first asserts its own premise: every `depletions` entry has `depletedAt === null` (that is what "no node runs
    out" means; `depletions` always has one entry per run ref, so it is never empty) and every `spent` value is 0.
    Then, for every kind: `gathered[kind][0] === 0`; for every sample interval `i -> i+1`,
    `gathered[kind][i+1] - gathered[kind][i]` equals `gatherRates[kind][i] / 60 * (times[i+1] - times[i])` within
    1e-6; and at every sample `gathered[kind][i]` equals `floating[kind][i] - floating[kind][0]` within 1e-6.
    Breaks it catches: the unstocked-path credit not counted (deltas are 0), starting resources counted
    (`gathered[0]` is non-zero), or a sampling offset (deltas shift by one interval).
  - Prebuilt builds: for each build in `listBuilds()` at `durationSeconds: 600`, with
    `start = ENGLISH.civData.startingState.resources.value`: every `gathered[kind]` has `times.length` entries,
    starts at 0 and never decreases; at every sample, summed over the four kinds,
    `gathered = floating - start + (sum of the four spent categories)` within 1e-6; and per kind
    `gathered[kind][i] >= floating[kind][i] - start[kind] - 1e-6` (the per-kind bound: no per-kind spend total
    exists, since `spent` sums kinds by category). Break it catches: the stocked (`drawDown`) path not counted;
    the start villagers gather from stocked sheep, so the sum identity misses by far more than 1e-6 on all three
    builds.
- Acceptance API, `acceptance/aoe4-simulate-api-spend-population.spec.ts` (the series spec for the prebuilt build):
  the response for the prebuilt English build has `gathered` with exactly the keys food, wood, gold, stone, each an
  array of `times.length` non-decreasing numbers starting at 0.
- Acceptance page: covered by the list additions in item 6 (`expectChartsDrawn`, the per-chart y-label, marker and
  pinned-overlay tests, and the pin-compare dashed-overlay test now run on `chart-gathered-resources`).
- `acceptance/aoe4-narrow-layout.spec.ts` passes unchanged (the new chart and its legends fit 390 px).

**Out of scope:** a per-resource spend breakdown; a total-of-all-kinds line; changing `gatherRates`, `floating` or
`spent`; a compare-panel key number for gathered totals; resource counts per node.

## Diagrams

One new field threaded from the engine counter to one chart inside one component, outside the event loop's
decisions; no diagram required.

## Acceptance criteria

- [x] (respec 1) The simulate response includes `gathered`: four arrays (food, wood, gold, stone), each
  `times.length` long, starting at 0 and never decreasing; the API acceptance test in
  `acceptance/aoe4-simulate-api-spend-population.spec.ts` checks this.
- [x] (respec 1) The constant-rate unit case in `simulate-series.test.ts` (paused town center, `INFINITE_NODES`,
  300 s, no `depletedAt`, no spend) passes: per-interval growth equals `gatherRates / 60 * dt` and
  `gathered = floating - floating[0]` at every sample, both within 1e-6. Removing the `engine.gathered` line on the
  unstocked path of `creditIncome` makes it fail.
- [x] (respec 1) The prebuilt-builds unit case passes: for each of `listBuilds()` at 600 s, the four-kind sum of
  `gathered` equals floating minus starting resources plus total `spent` within 1e-6 at every sample, and per kind
  `gathered >= floating - start - 1e-6`. Removing the `engine.gathered` line on the stocked (`drawDown`) path of
  `creditIncome` makes it fail.
- [x] (respec 1) `docs/api/openapi.json` is at version 2.1.0; `SimulationResult.required` lists `gathered`;
  `SimulationResult.properties.gathered` has the `floating` shape with descriptions; the 200 response example has
  `gathered`; `acceptance/aoe4-simulate-api-contract.spec.ts` passes, including "the buildOrder request example
  returns the documented 200 body".
- [x] (respec 1) `docs/aoe4-build-order.md` names gathered resources in the overview, the result flowchart, the result
  field list, the "draws four graphs" paragraph and the chart table ("A 200 draws four line charts", with a
  "Gathered resources" row between "Gather rates (per minute)" and "Floating resources").
- [x] (respec 1) After a run, the Results tab shows four charts in the order Units produced, Gather rates, Gathered
  resources (`chart-gathered-resources`, y label "Resources"), Floating resources; with a pin,
  `chart-gathered-resources` draws dashed `pinned:<kind>` lines like the other resource charts (the pin-compare
  dashed-overlay test covers it via `RESOURCE_CHARTS`).
- [x] (respec 1) `git grep -c "chart-gathered-resources" -- acceptance` reports matches in
  `aoe4-build-order.spec.ts`, `aoe4-build-order-pin-compare.spec.ts` and `aoe4-build-order-m3-flow.spec.ts` (none
  today).
- [x] (respec 2) No existing response field changes value: the three 1800 s digests in
  `simulate-house-warnings.test.ts` ("leaves every field of %s at 1800 s but warnings and gathered as it was") keep
  their main values with `gathered` excluded from the digest. Existing tests change only as Scope item 6 lists (chart,
  field and series lists gain the new entry, two typed fixtures gain `gathered`, the issue-shape version pin and title
  move to 2.1.0, the house-warnings digest excludes `gathered`, the pin-compare title); the PR lists every test it
  edits. `npx tsc --noEmit`, `npm test` and `npm run acceptance` pass.
- [x] (respec 2) `git grep -n "toBe('2.0.0')" -- acceptance lib components` finds nothing (one match in
  `aoe4-simulate-api-issue-shape.spec.ts` today), and `git grep -n "toBe('2.1.0')" -- acceptance` finds that test.
- [x] No INVARIANTS.md regressions

## Open questions

None. Defaults chosen: starting resources excluded, chart placed third (after "Gather rates"), OpenAPI 2.1.0. The
owner can change any of these at review.

## Re-spec 2026-11-03

- Underspecified: Risk (criticalPaths `simulateBuildOrder` plus a public response field), an impossible old-pin
  case, an unsound rate assertion on a build whose rates change between samples, two stale doc passages, the
  OpenAPI example and schema locations, typed fixtures, the chart lists in existing specs, and the Invariants
  field.
- Changed: Risk high; old-pin paragraph and criterion deleted; unit tests now use a constant-rate fixture
  (paused town center, infinite nodes, premise asserted via `depletedAt === null` since `depletions` is never empty)
  plus a sum identity over the prebuilt builds, both checked against a throwaway implementation; docs, OpenAPI,
  fixtures and chart-list edits named; chart placed third of four.
- No branch work exists yet.

## Re-spec 2026-11-03 (2)

- Underspecified: the existing-test rule missed three tests the change necessarily touches: the issue-shape version
  pin (2.0.0), the edges result-key list, and the whole-result digest in `simulate-house-warnings.test.ts`.
- Changed: Scope item 6 rule widened (field lists, version pin, whole-result digest) and the three tests named; the
  digest keeps its main pins with `gathered` excluded; criterion on unchanged digests and a version-pin grep added.
  A grep of main for other version pins, result-key lists, whole-result digests and snapshots found no others.
- Branch `sgs-077-aoe4-gathered-resources-chart` @ a471dab stands as is, including its edges and house-warnings edits;
  the only remaining change is the issue-shape assertion and title to 2.1.0.
