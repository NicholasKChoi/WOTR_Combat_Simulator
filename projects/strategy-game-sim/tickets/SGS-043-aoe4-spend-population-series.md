# SGS-043: Add spend and spawned-population series to the simulation result

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.6 (engine side: military spent, time to 200 pop)
- **Priority**: medium
- **Risk**: standard
  <!-- (re-rated 2026-11-01, symbol-scoped criticalPaths) Adds recorded series only; payment and event order are unchanged. Adjacent to A2/A3. -->
- **Invariants**: A2 (the series read the same bank-checked payments, via `payCost`), A3 (series are pure functions of engine state; no clock)
- **LOC estimate**: ~50 (`simulate.ts` sampling, seed and spawn hook, `model.ts` fields; excludes tests, OpenAPI JSON and docs)
- **Depends on**: SGS-035, SGS-037
- **On merge**: none
- **Source**: design/M3.md (Contracts `SimulationResult`; Rules rows "spend", "population"); plan M3-20261101 outline I; owner answer (1): SGS-035 owns the spend totals.

## Context

M3.6's pin-and-compare panel needs military spent at 10, 15 and 20 minutes and the time the army reaches 200
population. The engine reports neither: `simulateBuildOrder` (`lib/aoe4-build-order/simulate.ts`) samples only
`gatherRates` and `floating`, and its `population` counts queued, paid units (for supply checks), not spawned ones.
This ticket only samples and exposes numbers; it changes no payment, supply or ordering behavior.

## Scope

Base: `origin/main` plus SGS-035 and SGS-037. From SGS-035: `SpendCategory` in `model.ts`, running cumulative
totals `EngineState.spent: Record<SpendCategory, number>` accumulated inside `payCost` (all four resources summed;
`villagers` from `payUnit` of a villager, `military` from `payUnit` of any other unit, `buildings` from
`startConstruction`, `research` from the research handler), and `lib/aoe4-build-order/test-helpers.ts`. From SGS-037:
`SimulationResult.depletions` and `.warnings` (in `model.ts`, the OpenAPI `required` list, the 200 example, the
`result-series.test.ts` literal and the contract spec key literal). If either lands with different names, use its names.

1. `lib/aoe4-build-order/model.ts`: add to `SimulationResult`
   - `spent: Record<SpendCategory, number[]>`: cumulative paid, one value per entry of `times`;
   - `spawnedPopulation: number[]`: one value per entry of `times`;
   - `populationCapReachedAt: number | null`.
2. `lib/aoe4-build-order/simulate.ts`
   - `EngineState.spawnedPopulation: number`, the summed `entry.costs.popcap` of spawned, living villagers (idle
     and walking ones included) and units. `createEngine` (line ~595) seeds it from the start state: the start
     villagers (`aliveVillagers`, popcap 1 each) plus, for each `start.units.value` baseId, its count times the
     popcap of `data.byBaseId.get(baseId)[0]` (today `engine.population` at line ~638 counts each start unit as 1;
     the seed uses the entry popcap, which is 1 for the English scout). (respec 2) A start-unit baseId with no
     `data.byBaseId` entry throws `Error` with the message `startingState.units: "<baseId>" is not a unit baseId in
     the snapshot` (the message `data.ts` line ~108 uses when loading); it is never skipped or counted as 0. The
     shipped data cannot reach this (the loader already rejects it); it guards `editGameData` and `rules.startingState`.
   - `spawnUnit` (the one place a paid item becomes a unit; line ~218) adds `entry.costs.popcap` before the
     `entry.baseId !== VILLAGER` early return, so villagers and other units both count. Queued, paid units are not
     counted, so `payUnit` does not touch it.
   - Engine-internal `populationCapReachedAt: number | null` (on `Engine`, not `EngineState`): set to
     `state.time` the first time `spawnedPopulation >= data.base.maxPopCap.value`, never overwritten. The same check
     runs once on the seed in `createEngine`, so a seed that already reaches the cap gives `0`.
   - In the `simulateBuildOrder` sampling loop (lines ~670-690, beside `floating`), push `engine.spent[category]`
     for each category and `engine.spawnedPopulation` per sample time. The value at a sample is the value after
     `runInstant` for that instant, the same convention as `floating`, so a spawn or payment at exactly a sample time
     is included. Return the three new fields from the result.
3. `docs/api/openapi.json`: add a `SpendCategory` schema (enum `villagers`, `military`, `buildings`, `research`, with a
   description; names equal the TS names). Add `spent` to `SimulationResult.properties` as
   `{ type: object, propertyNames: { $ref: SpendCategory }, required: [villagers, military, buildings, research],
   additionalProperties: { type: array, items: { type: number, minimum: 0 } } }` (the M2 `propertyNames` form `trips`
   uses, `openapi.json` line ~987), so `SpendCategory` is referenced. Add `spawnedPopulation` (array of integers
   `>= 0`) and `populationCapReachedAt` (number or null, minimum 0) likewise, each with a description, and all three
   to `required`. (respec 2) The 200 `example` response (`paths./api/aoe4-build-order/simulate.post.responses.200`,
   line ~256; 60 s at 5 s, 13 samples) gets the exact `spent`, `spawnedPopulation` and `populationCapReachedAt` the
   engine returns for the `buildOrder` and `text` request examples, copied from a real run (for example a POST to
   the dev server or `simulateBuildOrder` in a scratch script), never hand-written. The contract spec asserts the live
   response `toEqual` the example.
4. (respec 2) `acceptance/aoe4-simulate-api-contract.spec.ts`
   - The `simulationResult: Record<keyof SimulationResult, true>` literal (line ~311) gains `spent`,
     `spawnedPopulation` and `populationCapReachedAt` (tsc fails otherwise).
   - Add `SpendCategory` to `SHARED_SCHEMAS` (line ~62) and assert its enum equals the keys of a
     `Record<SpendCategory, true>` literal, so a TS category the schema lacks fails tsc or the test.
   - In "real responses against the schemas" (line ~241), add: the real 200 body with one `spent` category deleted
     fails `expectInvalid('SimulationResult', ...)`, and with an extra `spent` key (for example `spent.other = [0]`)
     fails too.
5. (respec 2) `components/apps/aoe4-build-order/result-series.test.ts`: the hand-made `SimulationResult` literal
   (line ~17) gains `spent` (four series of `times.length`), `spawnedPopulation` and `populationCapReachedAt: null`.
   No expected value in that file changes.
6. (respec 2) Unit tests: a new `lib/aoe4-build-order/simulate-series.test.ts` holds the `spent` and
   `spawnedPopulation` / `populationCapReachedAt` criteria below, using `test-helpers.ts` (`run`, `editGameData`,
   `buildOrder`, `inputsFor`, `sampleIndex`) and defining none of its exports locally (the jscpd check stays at zero
   clones). No existing test's expected values change.
7. `docs/aoe4-build-order.md` "Outputs" list (line ~499): add the three fields with the spend category rules, the
   spawned-versus-queued distinction, and that `populationCapReachedAt` is a spawn instant (not a sample time). Fix
   any sentence that says the result has only the fields it listed before.

**Out of scope:** the compare panel and key-number extraction (SGS-048); the `markers`, `depletions` and `warnings`
fields (beyond keeping the SGS-037 versions intact); changing `population` (the supply-check count); death or other
population decreases (nothing dies in the model); the spend/`payCost` refactor itself (SGS-035).

## Diagrams

Single-component change outside the core control loop; no diagram required. (It adds two read-only samples to the
existing sampling loop and one counter increment at the existing spawn point; no state transition changes.)

## Acceptance criteria

- [ ] For a build that pays for villagers, a non-villager unit, a house and a tech, `result.spent.villagers`,
  `.military`, `.buildings` and `.research` each end at the sum of food+wood+gold+stone of exactly those
  payments, taken from the snapshot costs (not hard-coded in the test).
- [ ] Each `spent` series has `times.length` entries, never decreases, and starts at 0 when nothing is paid at t=0.
- [ ] A payment made at an instant equal to a sample time is included in that sample (same convention as `floating`).
- [ ] An auto-house (`step: null` construction) is counted under `buildings`.
- [ ] `spawnedPopulation[0]` equals the start villagers plus the start units' popcap (read the
  start state from data, not a literal) and the series has `times.length` entries and never decreases.
- [ ] (respec 2) With `editGameData` adding a start-unit baseId that has no `byBaseId` entry, `simulateBuildOrder`
  throws an `Error` whose message names that baseId.
- [ ] A unit that is paid but still in its production queue at a sample time is not in `spawnedPopulation` at that
  sample, and is in it at the first sample at or after its spawn. This holds for a villager and for a non-villager
  unit.
- [ ] A multi-popcap unit (a snapshot entry with `costs.popcap > 1`) raises `spawnedPopulation` by its popcap, not by 1.
- [ ] With `maxPopCap` lowered by `editGameData` to a value reached by a known spawn, `populationCapReachedAt`
  equals that spawn's instant (not rounded to a sample time) and stays set after later spawns; when the cap is never
  reached it is `null`.
- [ ] With `maxPopCap` at or below the start population, `populationCapReachedAt` is `0`.
- [ ] (respec 2) `docs/api/openapi.json` `SimulationResult.required` gains exactly `spent`, `spawnedPopulation` and
  `populationCapReachedAt` against the base branch and loses nothing. With
  `R='.components.schemas.SimulationResult.required'`,
  `jq -c -n --slurpfile a <(git show origin/main:docs/api/openapi.json) --slurpfile b docs/api/openapi.json "[(\$b[0]|$R) - (\$a[0]|$R), (\$a[0]|$R) - (\$b[0]|$R)]"`
  prints `[["spent","spawnedPopulation","populationCapReachedAt"],[]]` (in the order they are appended); it prints
  `[[],[]]` before the change.
- [ ] (respec 2) The 200 example's `spent`, `spawnedPopulation` and `populationCapReachedAt` are the engine's output:
  `npm run acceptance -- aoe4-simulate-api-contract` passes, including "the buildOrder request example returns the
  documented 200 body" and the `text` variant (live response `toEqual` the example) and the ajv validation of the
  example.
- [ ] (respec 1) `SimulationResult.properties.spent` has `propertyNames` `$ref` `#/components/schemas/SpendCategory`
  and `required` of the four categories; (respec 2) in the contract spec, a real 200 body with a `spent` category
  removed, or with an extra `spent` key, fails `expectInvalid('SimulationResult', ...)`, and `SpendCategory`'s enum
  equals the TS `SpendCategory` keys.
- [ ] `docs/aoe4-build-order.md` Outputs section describes all three fields; `git grep -n spawnedPopulation -- docs`
  finds it (0 matches today).
- [ ] (respec 2) No expected value in any existing test changes: the `floating`, `gatherRates`, `steps`,
  `unitsProduced`, `depletions` and `warnings` outputs are unchanged for the shipped English build. The only edits to
  existing test files are the added fields in the `result-series.test.ts` literal and the contract spec additions in
  Scope 4. `npm test`, `npx tsc --noEmit` and `npm run lint:dup` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-01

- Underspecified: how `spent` is expressed in OpenAPI and who references `SpendCategory`.
- Changed: Scope 3 and a new criterion fix the `propertyNames` `$ref` `SpendCategory` form (designer pass 4, row 9); SGS-054 no longer needs to add that reference.
- Branch work: none yet; engine scope and other criteria stand.

## Re-spec 2026-11-01 (2)

- Underspecified: Risk tier (criticalPaths), the 200 example's exact-equality test, merge-order-dependent required count, unlisted test files, and the missing-start-unit seed case.
- Changed: Risk high; depends on SGS-037; example copied from a real run; required-list check is a jq set difference against base; Scope 4-6 name the contract spec, `result-series.test.ts` and `simulate-series.test.ts`; missing start-unit baseId throws; "no expected value changes" criterion.
- Branch work: none yet; engine scope 1-2 stands.
