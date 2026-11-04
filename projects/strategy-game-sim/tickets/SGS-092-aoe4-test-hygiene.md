# SGS-092: Fix AoE4 test hygiene: shared helpers, per-baseId unit sums, named-field digests, step-table flake, empty-steps results split

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage, 2026-11-03: test hygiene)
- **Priority**: low
- **Risk**: low
  <!-- Test-only: no product code, API, schema, config or invariant touched. -->
- **Invariants**: none
- **LOC estimate**: 0 business-logic lines (about 100 lines of test and helper edits across `lib/aoe4-build-order/*.test.ts` and `acceptance/*.ts`)
- **Depends on**: SGS-081 (it edits `acceptance/aoe4-simulate-api-timelines.spec.ts`, `acceptance/aoe4-simulate-api-spend-population.spec.ts`, `acceptance/helpers.ts` and re-pins the digests in `lib/aoe4-build-order/simulate-house-warnings.test.ts`; start from main after it merges)
- **On merge**: none
- **Source**: BACKLOG.md bullets on research.test.ts naming, duplicated acceptance constants and `run()`, first-series unit reads, the `aoe4-step-table.spec.ts` flake, whole-result digest pins, and the missing empty-steps results-split case

## Context

Seven backlog items about weak or duplicated AoE4 tests. Each was re-checked on main (cc9bb04); two were already fixed and are dropped (see Out of scope).

## Scope

Test and test-helper files only. Name code by symbol; paths are relative to the repo root.

1. **Misnamed test.** In `lib/aoe4-build-order/research.test.ts`, the `it('changes neither population nor units produced')` in `describe('technology effects apply from completion')` only compares `unitsProduced`. Also assert `result.spawnedPopulation` equals `plain.spawnedPopulation` (checked: it holds on main).
2. **Duplicated acceptance constants and `run()`.**
   - Move `RESOURCE_CHARTS` (gather-rates, gathered-resources, floating-resources test ids) and the four-chart id list (`CHART_IDS` in `aoe4-build-order-pin-compare.spec.ts`, `CHARTS` in `aoe4-gathered-resources.spec.ts`) into `acceptance/helpers.ts` as exports; `aoe4-build-order-pin-compare.spec.ts`, `aoe4-build-order-m3-flow.spec.ts` and `aoe4-gathered-resources.spec.ts` import them and drop their local copies.
   - `run()` in `aoe4-build-order-pin-compare.spec.ts` and the response wait in `aoe4-build-order-timeline-compare.spec.ts` reimplement `runSimulation` in `acceptance/helpers.ts`. Keep only each file's own setup (fill text, fill duration) and call `runSimulation` for the click and response wait.
3. **Unit counts must sum every series of a base unit.** A veterancy upgrade moves units to a higher-tier series of the same `baseId` (`UnitSeries` in `model.ts`), so a read of the first `find` match undercounts.
   - Add one `finalCount(body, baseId)` export to `acceptance/helpers.ts`: the sum over every `unitsProduced` series of that `baseId` of its last count, 0 when none. `aoe4-simulate-api-timelines.spec.ts` and `aoe4-simulate-api-spend-population.spec.ts` drop their local `finalCount` and use it.
   - In `lib/aoe4-build-order/simulate.acceptance.test.ts`, the never-decreasing check and the villagers-plus-scouts sum (the loop over `result.unitsProduced` before the `series(result, 'man-at-arms')` read) work per `baseId` using the `series` helper from `test-helpers.ts`, not per tier series.
4. **Flaky `acceptance/aoe4-step-table.spec.ts`.** The test "after a table edit Run posts exactly the textarea text and draws the charts" (the only test in the file that waits for the simulate POST) has timed out at 60 s under full-suite load and passes alone. Find the race (it picks a prebuilt, switches to the table, clicks `step-add`, then clicks Run at once) and wait for a ready signal before clicking Run (for example `step-row` count equal to the build's step count plus one, or `expect.poll`), not a fixed timeout. Follow the repo lesson on polling.
5. **Whole-result digest pins.** In `lib/aoe4-build-order/simulate-house-warnings.test.ts`, the `it.each` "leaves every field of %s at 1800 s but warnings and gathered as it was" digests `rest` (every field but `warnings` and `gathered`), so any new result field changes all pins. Digest a named field list instead, the same list the late-house test uses (`spawnedPopulation`, `spent`, `steps`, `populationCapReachedAt`, `depletions`, `markers`), sharing one small helper between the two. Re-pin the three rows; the implementer records the new values in the report and the test title says which fields are covered.
6. **Empty-steps results split.** Add a case to `acceptance/aoe4-results-split.spec.ts`: run the text `start -> sheep` (no steps), open Results, and check that `results-split` has exactly two element children, neither has a `data-testid`, the second contains a visible `chart-units-produced`, and `step-timeline-scroll` is absent. (`StepTimeline` in `components/apps/aoe4-build-order/step-timeline.tsx` returns null for empty steps; `results.tsx` renders both columns unconditionally.)

**Out of scope:**
- `acceptance/aoe4-build-order.spec.ts` (SGS-082 deletes it; leave its own constants alone).
- Dropped as already fixed on main: `INVALID_PASTE` and the compare-row keys (now in `acceptance/helpers.ts`); the issue-count check on the `aoe4-simulate-api-edges.spec.ts` request-shape rows (`expect(issues).toHaveLength(1)` is present).
- Other `waitForResponse` uses in `aoe4-build-order-pin-compare.spec.ts` that do not filter on method.
- Any product code change; chart tooltip floats; the other backlog items.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `research.test.ts` "changes neither population nor units produced" asserts both `unitsProduced` and `spawnedPopulation` equal the no-research run; `npx vitest run lib/aoe4-build-order/research.test.ts` passes.
- [ ] `RESOURCE_CHARTS` and the four-chart id list are each defined once, in `acceptance/helpers.ts`: `git grep -nE "(RESOURCE_CHARTS|CHART_IDS|CHARTS) = \[" -- acceptance ':!acceptance/aoe4-build-order.spec.ts'` matches only `helpers.ts`.
- [ ] No spec other than `acceptance/helpers.ts` pairs `waitForResponse` with `SIMULATE_PATH` and a POST method filter in a local run helper: `git grep -n "waitForResponse" -- acceptance ':!acceptance/aoe4-build-order.spec.ts'` shows no such match in `aoe4-build-order-pin-compare.spec.ts` or `aoe4-build-order-timeline-compare.spec.ts`.
- [ ] `finalCount` is defined once, in `acceptance/helpers.ts`, and sums the last count of every series of the base unit (0 when none). Pin case in `acceptance/aoe4-simulate-api-veterancy-conversion.spec.ts`: in the existing "per-baseId counts sum" test, `finalCount(result, 'longbowman')` equals the last value of the per-baseId sum and is greater than the last count of the first `longbowman` series (the converted tier, which ends at 0). It must fail if the helper reads only the first matching series. (Vitest excludes `acceptance/`, so the helper is pinned through this spec.)
- [ ] `simulate.acceptance.test.ts` computes never-decreasing and the villagers-plus-scouts sum per `baseId`; with a veterancy upgrade completing mid-run it must not fail on the lower-tier series dropping.
- [ ] `aoe4-step-table.spec.ts` has no fixed-timeout wait added; the Run click in the table-edit test follows an awaited ready signal. Proven by 3 consecutive passing full-suite runs of `npm run acceptance` with that spec green, plus the spec at `--repeat-each=5`; the report lists the runs.
- [ ] The three shipped-build digest pins in `simulate-house-warnings.test.ts` hash a named field list, not a destructured rest. Test case: adding an extra top-level field to the simulate result (for example a temporary `extra: 1` in `simulateBuildOrder`'s return) leaves all pin tests green; changing any of a step's `startedAt` by 1 s makes the three build rows and the late-house row fail.
- [ ] `aoe4-results-split.spec.ts` has the empty-steps case from Scope 6. Mutation to run: make `results.tsx` skip the timeline column when `steps` is empty; the new case must fail (child count 1).
- [ ] The implementer lists every test file edited. `npm test` and `npx tsc --noEmit && npm run lint:dup` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
