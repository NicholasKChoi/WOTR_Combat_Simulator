# SGS-043: Add spend and spawned-population series to the simulation result

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.6 (engine side: military spent, time to 200 pop)
- **Priority**: medium
- **Risk**: standard
  <!-- Plan said low. It adds three required fields to the public SimulationResult schema and its OpenAPI
       example, so "no public surface change" does not hold; no strongModelTrigger applies (new fields the
       design specifies by exact name; sampling only, no change to what a run computes). -->
- **Invariants**: A2 (the series read the same bank-checked payments, via `payCost`), A3 (series are pure functions of engine state; no clock)
- **LOC estimate**: ~45 (`simulate.ts` sampling and spawn hook, `model.ts` fields; excludes tests, OpenAPI JSON and docs)
- **Depends on**: SGS-035
- **On merge**: none
- **Source**: design/M3.md (Contracts `SimulationResult`; Rules rows "spend", "population"); plan M3-20261101 outline I; owner answer (1): SGS-035 owns the spend totals.

## Context

M3.6's pin-and-compare panel needs military spent at 10, 15 and 20 minutes and the time the army reaches 200
population. The engine reports neither: `simulateBuildOrder` (`lib/aoe4-build-order/simulate.ts`) samples only
`gatherRates` and `floating`, and its `population` counts queued, paid units (for supply checks), not spawned ones.
This ticket only samples and exposes numbers; it changes no payment, supply or ordering behavior.

## Scope

Prerequisite state from SGS-035 (not yet on `main`, so not re-done here): `SpendCategory` in `model.ts`, running
cumulative totals `EngineState.spent: Record<SpendCategory, number>` accumulated inside `payCost` (all four resources
summed; `villagers` from `payUnit` of a villager, `military` from `payUnit` of any other unit, `buildings` from
`startConstruction`, `research` from the research handler). If SGS-035 lands with different names, use its names.

1. `lib/aoe4-build-order/model.ts`: add to `SimulationResult`
   - `spent: Record<SpendCategory, number[]>`: cumulative paid, one value per entry of `times`;
   - `spawnedPopulation: number[]`: one value per entry of `times`;
   - `populationCapReachedAt: number | null`.
2. `lib/aoe4-build-order/simulate.ts`
   - `EngineState.spawnedPopulation: number`, the summed `entry.costs.popcap` of spawned, living villagers (idle
     and walking ones included) and units. `createEngine` seeds it from the start state: the start villagers
     (`aliveVillagers`, popcap 1 each) plus each `start.units.value` baseId times the popcap of
     `data.byBaseId.get(baseId)[0]` (today `engine.population` counts each start unit as 1; the seed must use the
     entry popcap, which is 1 for the English scout).
   - `spawnUnit` (the one place a paid item becomes a unit; line ~218) adds `entry.costs.popcap`. Queued, paid
     units are not counted, so `payUnit` does not touch it.
   - Engine-internal `populationCapReachedAt: number | null` (on `Engine`, not `EngineState`): set to
     `state.time` the first time `spawnedPopulation >= data.base.maxPopCap.value`, never overwritten. If the seed
     already reaches the cap it is `0`.
   - In the `simulateBuildOrder` sampling loop (line ~678, beside `floating`), push `engine.spent[category]` for
     each category and `engine.spawnedPopulation` per sample time. The value at a sample is the value after
     `runInstant` for that instant, the same convention as `floating`, so a spawn at exactly a sample time is
     included. Return the three new fields from the result.
3. `docs/api/openapi.json`: add `spent` (object with the four `SpendCategory` keys, each an array of numbers
   `>= 0`), `spawnedPopulation` (array of integers `>= 0`) and `populationCapReachedAt` (number or null, minimum 0)
   to `SimulationResult.properties` and `required`. Update the 200 `example` response (line ~256) with
   plausible series of the right length so the ajv contract check in
   `acceptance/aoe4-simulate-api-contract.spec.ts` still validates it. Reuse the `SpendCategory` schema if SGS-035
   or an earlier ticket already added one; otherwise add it (names equal the TS names).
4. `docs/aoe4-build-order.md` "Outputs" list (line ~501): add the three fields with the spend category rules, the
   spawned-versus-queued distinction, and that `populationCapReachedAt` is a spawn instant (not a sample time). Fix
   any sentence that says the result has only the fields it listed before.

**Out of scope:** the compare panel and key-number extraction (SGS-048); the `markers`, `depletions` and `warnings`
fields; changing `population` (the supply-check count); death or other population decreases (nothing dies in the
model); the spend/`payCost` refactor itself (SGS-035).

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
- [ ] A unit that is paid but still in its production queue at a sample time is not in `spawnedPopulation` at that
  sample, and is in it at the first sample at or after its spawn.
- [ ] A multi-popcap unit (a snapshot entry with `costs.popcap > 1`) raises `spawnedPopulation` by its popcap, not by 1.
- [ ] With `maxPopCap` lowered by `editGameData` to a value reached by a known spawn, `populationCapReachedAt`
  equals that spawn's instant (not rounded to a sample time) and stays set after later spawns; when the cap is never
  reached it is `null`.
- [ ] With `maxPopCap` at or below the start population, `populationCapReachedAt` is `0`.
- [ ] `docs/api/openapi.json` `SimulationResult.required` contains `spent`, `spawnedPopulation` and
  `populationCapReachedAt` (`jq '.components.schemas.SimulationResult.required | length'` is 10 today, 13 after), and
  `npm run acceptance -- aoe4-simulate-api-contract` passes (ajv validates the updated example and real responses).
- [ ] `docs/aoe4-build-order.md` Outputs section describes all three fields; `git grep -n spawnedPopulation -- docs`
  finds it (0 matches today).
- [ ] Existing `floating`, `gatherRates`, `steps` and `unitsProduced` outputs are unchanged for the shipped English
  build (existing unit tests pass without edits).
- [ ] No INVARIANTS.md regressions

## Open questions

None.
