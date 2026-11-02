# SGS-043 review 1

Branch sgs-043-aoe4-spend-population-series, tip be39f66 (one commit on origin/main 9137cf2). Full review, first pass.
Note: the branch is not on origin (`origin/sgs-043-...` does not exist); reviewed a detached worktree at the tip SHA.

**Verdict: REQUEST CHANGES** (one blocking test finding; the code itself is correct).

## Blocking findings

1. `lib/aoe4-build-order/simulate-series.test.ts:140-163` - test - The criterion "populationCapReachedAt ... stays set
   after later spawns" has no test, and the implementer's reason (untestable because supply is capped at `maxPopCap`)
   is wrong. Ticket Scope 6 puts this criterion in this file. With the `populationCapReachedAt === null` guard removed
   from `noteCapReached` (`simulate.ts:204`), all 674 lib tests still pass, so the "never overwritten" rule is
   unpinned. It is reachable through the engine: the spec seeds `spawnedPopulation` from the start unit's entry popcap
   while the supply-check `population` counts each start unit as 1. With `editGameData` setting the start unit's
   (scout) popcap to 4 and `maxPopCap` to start+3+1 (7 -> 11), the start is 10 spawned / 7 supply-pop, and three
   villagers can still be paid. The first spawn reaches the cap at 22 s and two more spawn after it (series ends at
   13). A scratch test asserting `populationCapReachedAt` is 22 and the last `spawnedPopulation` is above the cap
   passed on the branch and failed with the guard removed (scratch file deleted). Popcap-0 snapshot units are another
   route (110 entries have `popcap: 0`). Direction: add this test (reuse `rich`, `capped`-style `editGameData`, the
   existing `produce(3)` shape). Keep the criterion as written. No NEEDS_SPEC.

## Spec gaps

None.

## Points the manager asked to judge

1. Untestable claim: inaccurate (see finding 1). The criterion stands. The behavior is correct (verified with a
   scratch run), but the regression test is missing.
2. No `SPEND_CATEGORIES` export: acceptable. Design M3 Modules (`model.ts` row) and Contracts name `SpendCategory`
   only, with no runtime list. The ticket asks for none, and `data.acceptance.test.ts` pins the `model.ts` exports.
   `Object.keys(spent)` iterates a local literal typed `Record<SpendCategory, number[]>`, so tsc enforces all four
   keys. Own string-key order is guaranteed, so A3 holds.
3. A2/A3 untouched: payment code (`payUnit`, `startConstruction`, research `payCost`, `canAfford`) is unchanged.
   Sampling only reads `engine.spent` and `engine.spawnedPopulation` after `runInstant`, and adds no clock or
   randomness. No tolerance or helper was copied into `simulate.ts`. The new code uses `entry.costs.popcap` and
   `data.base.maxPopCap.value` from data (A1). The doc sentences I checked match the code (Outputs list, OpenAPI
   descriptions, `model.ts`/`simulate.ts` comments).

## Acceptance criteria

- PASS: spent ends at the snapshot cost per category (`simulate-series.test.ts:39-44`, costs from `ENGLISH.byBaseId`).
- PASS: spent length, non-decreasing, 0 at t=0 (`:46-57`).
- PASS: a payment at a sample time is included (`:59-63`, research at t=10).
- PASS: auto-house under buildings (`:65-69`).
- PASS: spawnedPopulation[0] comes from start data, with length and monotonicity (`:81-88`, start popcap `:90-99`).
- PASS: a missing start-unit baseId throws with the data.ts message (`simulate.ts:574`, identical to `data.ts:108`; test `:101-106`).
- PASS: queued units are excluded until spawn, for a villager and for man-at-arms (`:108-122`).
- PASS: a multi-popcap unit adds its popcap (`:124-131`).
- PARTIAL: cap instant is exact (`:146-152`) and `null` when never reached (`:154-156`). "Stays set after later
  spawns" is correct in code but untested (finding 1).
- PASS: cap at or below start gives 0 (`:158-161`).
- PASS: the jq check prints `[["spent","spawnedPopulation","populationCapReachedAt"],[]]`.
- PASS: the 200 example equals live output. `npm run acceptance -- aoe4-simulate-api-contract aoe4-simulate-api-edges`
  ran 89 passed.
- PASS: `spent` uses `propertyNames` `$ref` SpendCategory and `required` with the four categories. The mutation
  test removes or adds a key (`contract.spec.ts:313-323`). The enum equals the TS keys (`:186-189`).
- PASS: docs Outputs describes all three. `git grep spawnedPopulation -- docs` gives 6 matches.
- PASS: no existing expected values change. Existing test edits are only the `result-series.test.ts` literal, the
  contract spec additions and the three edges keys (base list plus three, sorted).
- PASS: no invariant regressions (below).

Criteria left unticked because the verdict is not APPROVE.

## Invariants

- A1 holds: no new literals. Popcap and the cap come from the snapshot and base rules.
- A2 holds: no payment path changed. `spent` is accumulated in `payCost` (SGS-035), and this ticket only samples it.
- A3 holds: no clock or randomness. Iteration is over a literal's own string keys, so the order is deterministic.
- S3: no new loop bound or input.
- spec-checklist: names match the design Contracts (`spent`, `spawnedPopulation`, `populationCapReachedAt`,
  `SpendCategory`). Nothing out of scope, no `golang/`, no invented constant. No new `simulate.ts` or `model.ts`
  exports.

## Linter / gates (Node 24.22.2, review worktree)

- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones.
- `npm test`: 32 files, 747 passed.
- `npx next build`: ok.
- `npm run acceptance`: 368 passed, 1 failed:
  `combat-simulator-battles.spec.ts:77` ("outcome rows follow the response keys..."). The diff touches no combat code.
  Rerunning `npm run acceptance -- combat-simulator-battles` gave 7/7 passed, so this is a load flake, not caused by
  the diff.

## Bot reconciliation

No `reviewBot.cli` and no `rulesFile` are configured, so none ran.

## Non-blocking notes

- `simulate-series.test.ts:9` `KINDS` restates `RESOURCE_KINDS` (`model.ts:19`). The REPO checklist forbids copying
  constants within `lib/aoe4-build-order/`. Sibling tests inline the same list (`build-move.acceptance.test.ts:72`,
  `research.acceptance.test.ts:187`), so this is not blocking, but importing `RESOURCE_KINDS` is free while the file is
  being reworked anyway.
- `simulate-series.test.ts:11` local `costOf(baseId): number` shares its name with `engine-common.ts` `costOf(entry, n):
  Resources`, which has different semantics. Consider `totalCostOf`.
- With a start unit whose popcap is above 1, `spawnedPopulation` can exceed the supply-check `population` (the ticket
  specifies that seed). This is by design, but SGS-048/054 readers should know.

## Coverage

Reviewed the full diff: `simulate.ts`, `model.ts`, `simulate-series.test.ts`, `openapi.json`, both acceptance specs,
`result-series.test.ts` and `docs/aoe4-build-order.md`. Compared against `engine-common.ts` (`payCost`), `research.ts`,
`data.ts:108`, `test-helpers.ts` and the sibling test files.
REPO checklist "Every diff": `next build` ran. No page or component source changed (only a component test literal),
so no page load was needed. The API response shape was exercised by the contract and edges specs.
"AoE4 build order": no copied helper or tolerance in engine code, and the doc matches the code. No chart change.
