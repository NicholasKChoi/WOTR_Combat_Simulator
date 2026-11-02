# SGS-037: Add node refs, the warnings contract and the depletion module

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.1 and M3.11 (types and stock math only), M3.12 (`Severity`)
- **Priority**: high
- **Risk**: high
  <!-- REPO.md criticalPaths `lib/**` applies (production files under lib/aoe4-build-order change). The outline said low; by the template a critical-path glob forces high. Otherwise this is small: ~185 lines of business logic, every name already fixed by design/M3.md, so the new response fields do not count as a public-schema change under strongModelTriggers. -->
- **Invariants**: A1 (no node amount appears in code; this ticket ships none), A2 (the stock clamps at 0, never negative), A3 (stock math is a pure function of its arguments, no clock), S3 (`MAX_DEPOSITS` bounds the deposit list)
- **LOC estimate**: ~185 business logic (`depletion.ts` ~120: stock creation, draw-down with clamp, next run-out, results, warning sort; `model.ts` ~55: consts, `nodeKindOf`, types; `simulate.ts` ~8: empty result fields through the sort). Tests, `openapi.json` and doc text excluded.
- **Depends on**: SGS-035 (`GATHER_NODES`, `RESOURCE_TOLERANCE` in `engine-common.ts`, `test-helpers.ts`)
- **On merge**: none
- **Source**: `design/M3.md` (Contracts: Types, Severity, Node references, Run refs; Behavior rules: node stock, warnings ordering; OpenAPI list); `plans/M3-20261101.md` outline C and owner-approved design question 6 (empty `depletions`/`warnings` fields)

## Context

D (SGS-038, engine depletion) and H (SGS-042, `step-stuck`) both need one `warnings` contract and one set of node-ref types, and they should be able to land in parallel. This ticket adds those types, a pure stock module (`depletion.ts`) that needs no engine, and the two result fields, always empty until the engine fills them. No behavior of any run changes: every node is still infinite.

## Scope

Base: `origin/main` f078c11 plus SGS-035. Today `model.ts` has types only (`GatherNodeId`, `ResourceKind`, `Trigger` = `time | villagers`) and no node list; `SimulationResult` ends at `notes` (`model.ts`), and `simulateBuildOrder` returns it at `simulate.ts:696-707`. Names are `design/M3.md` names, unchanged.

**`lib/aoe4-build-order/model.ts`** (runtime consts live here with `GATHER_NODES`, `RESOURCE_KINDS`, `SpendCategory` from SGS-035; those are used, not redefined)
- `FiniteGatherNodeId` (`sheep | berry | deer | boar | gold | stone`) and `FINITE_GATHER_NODES` (that order).
- `MAX_DEPOSITS = 8`; `DepositRef` (`` `gold#${2|...|8}` ``); `NodeRef = GatherNodeId | DepositRef`; `FiniteNodeRef = FiniteGatherNodeId | DepositRef`.
- `NODE_REFS` (15: `GATHER_NODES` with `gold#2`..`gold#8` right after `gold`; first `sheep`, last `stone`) and `FINITE_NODE_REFS` (13: same insertion; first `sheep`, last `stone`). The deposit refs are produced from `MAX_DEPOSITS` in one place, so the two lists and the type cannot drift.
- `nodeKindOf(ref: NodeRef): GatherNodeId` (`gold#3` -> `gold`; a plain id -> itself).
- `Severity` (`error | warning | info`) and `SEVERITIES` (that order, most severe first).
- `StepWait` (`resources | villagers | population | prerequisite | trigger | earlier-step`). Only the type: `StepTiming.waitingOn` and `waitBreakdown` are H's.
- `NodeDepletion { node: FiniteNodeRef; amount: number | null; depletedAt: number | null }`.
- `SimWarning`: the three-variant union on `code` (`node-depleted`, `idle-arrival`, `step-stuck`) exactly as in the design.
- `SimulationResult.depletions: NodeDepletion[]` and `.warnings: SimWarning[]`.
- Not touched here: `BuildStep` node fields (still `GatherNodeId`), `Trigger`, `move.count`, `SimInputs.nodeAmounts` (all D or E), `BuildOrderNote.severity` (G).

**`lib/aoe4-build-order/depletion.ts`** (new; imports `RESOURCE_TOLERANCE` from `engine-common.ts` and defines no tolerance of its own)
- `NodeStock`: per run ref the starting `amount` (`number | null`, `null` = infinite), `remaining`, `depletedAt`, the idle count recorded at the end of the run-out instant, and the idle arrivals (first arrival time, total count). Internals beyond that are free.
- `runRefs(order: BuildOrder): FiniteNodeRef[]`: `FINITE_GATHER_NODES` plus every `DepositRef` named in `order.start` (villagers keys, rally) and in any step node field (`produce.rally`, `rally.to`, `build.from`, `build.then`, `move.from`, `move.to`), in `FINITE_NODE_REFS` order. It filters the node strings it finds against `FINITE_NODE_REFS`, so D's type widening needs no change here; E adds the read of a `depleted` trigger's `node` when that trigger kind exists. An order naming no deposit returns exactly the six finite nodes, first `sheep`, last `stone`.
- `createNodeStock(refs, inputs)`: `inputs` only needs `nodeAmounts: Readonly<Record<FiniteNodeRef, number | null>>`, typed structurally so `SimInputs` (which gains `nodeAmounts` in D) satisfies it with no import cycle. Each ref starts at `nodeAmounts[ref]`. A ref starting at 0 is depleted at t=0 (`depletedAt: 0`, one `node-depleted` warning in the results, idle count 0 until recorded).
- `drawDown(stock, gatherers, rateOf, seconds)`: `gatherers: Readonly<Partial<Record<NodeRef, number>>>`, `rateOf: (ref: FiniteNodeRef) => number`. Each stocked, not-depleted ref loses `gatherers[ref] * rateOf(ref) * seconds`, clamped so `remaining` never goes below 0, and `remaining <= RESOURCE_TOLERANCE` becomes exactly 0. Returns the amount actually drawn per ref, so D credits that and not the unclamped product. `null` amounts and depleted refs draw nothing. Deposits are independent (a `gold#2` draw never changes `gold`).
- `nextRunOut(stock, gatherers, rateOf, now): number | null`: the earliest `now + remaining / (gatherers * rateOf)` over stocked, not-depleted refs with gatherers above 0 and a rate above 0; `null` when there is none.
- `isDepleted(stock, ref)`: true for a stocked ref whose `remaining` is 0, including one that started at 0; false for `null` amounts and for a ref not in the stock.
- `depletionResults(stock): { depletions: NodeDepletion[]; warnings: SimWarning[] }`: `depletions` has one entry per stock ref in `FINITE_NODE_REFS` order (`amount` = starting amount or `null`; `depletedAt` or `null`). `warnings` has one `node-depleted` per depleted ref (`severity: 'warning'` when the recorded idle count is above 0, else `'info'`; message names the ref id and the time, not a display name) and one `idle-arrival` (`severity: 'warning'`) per ref with recorded idle arrivals, already in the warnings order.
- Recording functions for a run-out instant (ref, `at`, idle count at the end of the instant) and for an idle arrival (ref, `at`, count). The seven listed functions cannot set `depletedAt` for a mid-run run-out (`drawDown` has no clock), and D (SGS-038) calls `depletionResults(stock)` for both warning kinds, so the stock must hold these. See Open questions.
- The one warnings sort, exported, taking a `SimWarning[]`: by `at`; at equal `at`, node warnings (`node-depleted`, `idle-arrival`) before `step-stuck`, node warnings in `FINITE_NODE_REFS` order of `node`, `node-depleted` before `idle-arrival` for the same ref; `step-stuck` last, by `step` index. It is a pure function that does not mutate its input. H and D push into the list and use this sort. Name: see Open questions.

**`lib/aoe4-build-order/simulate.ts`**: `simulateBuildOrder` returns `depletions: []` and `warnings` as the empty list passed through the sort, so D and H add content without touching the result shape or a second sort.

**`docs/api/openapi.json`** (same diff; every response schema is `additionalProperties: false` with a full `required` list and a description on every property and variant):
- New schemas `FiniteGatherNodeId` (enum, 6), `NodeRef` (enum, the 15 `NODE_REFS`), `FiniteNodeRef` (enum, the 13 `FINITE_NODE_REFS`), `Severity` (enum `error`, `warning`, `info`), `StepWait` (enum of the six), `NodeDepletion` (closed object, all three required, `amount` and `depletedAt` `number | null`, `node` `$ref` `FiniteNodeRef`), `SimWarning` (`oneOf` three closed variants tagged by a `code` const; every field required; `severity` `$ref` `Severity`, `node` `$ref` `FiniteNodeRef`, `waitingOn` `$ref` `StepWait`).
- `SimulationResult` gains `depletions` (array of `NodeDepletion`) and `warnings` (array of `SimWarning`), both in `required`.
- The 200 example gets `"depletions": []` and `"warnings": []`; the contract spec compares the live response to it with `toEqual`.
- `NodeRef` is not yet referenced by a request schema (D does that); that is intended.

**Tests that must change with the result type**
- `components/apps/aoe4-build-order/result-series.test.ts`: the hand-made `SimulationResult` literal gains `depletions: []` and `warnings: []` (tsc fails otherwise).
- `acceptance/aoe4-simulate-api-contract.spec.ts`: add `depletions: true, warnings: true` to the `simulationResult` key literal; add `NodeDepletion` to the response-schema lists and key literals; `SimWarning` is a `oneOf`, so it cannot go through the "response-side schemas are closed" loop as is. Assert its three variants separately (closed, every field required, descriptions). Add the new enum schemas to the shared-schema name check.

**Docs** (`docs/aoe4-build-order.md`)
- Outputs list (line ~501-519): add `depletions` and `warnings` bullets. State the shape (`NodeDepletion`; `SimWarning` with `code`, `severity`, `at`), that `severity` is one of `error`, `warning`, `info`, that `warnings` are sorted by `at` with the tie rules above, and that both lists are always empty today because no node runs out (the engine still treats every node as infinite).
- Lines 25 and 323 ("Resources are infinite", "Out: ... resource depletion") and the Extension points row at line 617 stay true after this ticket; confirm they are unchanged. D, E and T own the later rewrites. Grep run on main: `git grep -n -i "depletion\|depleted\|runs out" -- docs/aoe4-build-order.md` finds exactly lines 25 (via "never runs out"), 323 and 617.

**Out of scope:** engine use of the stock (D); `nodeAmounts` in `SimInputs`, `validate.ts`, `nodeRefIssue`, `data.ts`/`base.json` amounts, and `BuildStep` field widening (D, E); `Trigger` kinds and `reaction` (E); `StepTiming.waitingOn`, `waitBreakdown`, `step-stuck` emission (H); `BuildOrderNote.severity` and `info` notes (G); page changes (K); parse-text's own `GATHER_NODE_ORDER` (F).

## Diagrams

Single-component change outside the core control loop (the engine loop is untouched; `simulate.ts` only returns two empty fields); no diagram required.

## Acceptance criteria

- [ ] `NODE_REFS` has 15 entries, first `sheep`, last `stone`, with `gold#2`..`gold#8` immediately after `gold`; `FINITE_NODE_REFS` has 13, first `sheep`, last `stone`, same insertion; `FINITE_GATHER_NODES` is `sheep, berry, deer, boar, gold, stone`; `SEVERITIES` is `error, warning, info`. A unit test pins each, and a `@ts-expect-error` line pins that `'gold#1'` and `'gold#9'` are not `DepositRef`.
- [ ] `nodeKindOf('gold#3')` is `'gold'`, `nodeKindOf('gold')` is `'gold'`, and every `NODE_REFS` entry maps to a `GatherNodeId`.
- [ ] `runRefs` of an order naming no deposit returns the six finite nodes (first `sheep`, last `stone`); an order that names `gold#3` in `start.villagers`, and `gold#2` in a `move` `to`, returns eight refs with `gold#2` and `gold#3` right after `gold`, in `FINITE_NODE_REFS` order, once each. (The test injects deposit refs with one `as unknown as BuildOrder` cast, because step fields are not widened until D.)
- [ ] `createNodeStock` with `nodeAmounts.berry = 0`: `isDepleted(stock, 'berry')` is true at t=0 and `depletionResults` reports `berry` with `depletedAt: 0` and one `node-depleted` warning at `at: 0`.
- [ ] `drawDown` never takes a ref below 0: 10 gatherers at rate 1 for 5 s from `remaining` 20 returns 20 for that ref (not 50) and leaves `remaining` 0 and `isDepleted` true. A ref whose `remaining` ends within `RESOURCE_TOLERANCE` of 0 is set to exactly 0.
- [ ] `drawDown` leaves a `null` amount unchanged and returns nothing for it; leaves a depleted ref at 0 and returns nothing for it; draws `gold` and `gold#2` independently (drawing `gold#2` leaves `gold.remaining` unchanged).
- [ ] `nextRunOut` returns the earliest of several refs' exact times (for example `now + remaining / (gatherers * rate)`), ignores refs with 0 gatherers, 0 rate, `null` amount or already depleted, and returns `null` when none qualifies.
- [ ] `depletionResults` returns one `depletions` entry per stock ref in `FINITE_NODE_REFS` order; a ref still stocked has `depletedAt: null`, a `null` amount reports `amount: null`.
- [ ] A `node-depleted` warning has `severity: 'warning'` when the recorded idle count is above 0 and `'info'` when it is 0; an `idle-arrival` is `'warning'`; no result item has `severity: 'error'`. The message names the ref id (for example `gold#2`), and contains no display name.
- [ ] The warnings sort orders an unsorted list containing all three codes: by `at`; at equal `at`, `berry` before `gold` before `gold#2` before `stone` (the `FINITE_NODE_REFS` order); `node-depleted` before `idle-arrival` for one ref; `step-stuck` after every node warning at that `at`, ordered by `step`. It does not mutate its input, and applying it twice equals applying it once.
- [ ] `simulateBuildOrder` returns `depletions: []` and `warnings: []` for the existing prebuilt build and for a one-step order, and no existing timing, series, step status or note changes (the full unit suite passes unchanged apart from the `result-series.test.ts` literal).
- [ ] `docs/api/openapi.json` defines `FiniteGatherNodeId`, `NodeRef`, `FiniteNodeRef`, `Severity`, `StepWait`, `NodeDepletion` and `SimWarning`; the enums equal `FINITE_GATHER_NODES`, `NODE_REFS`, `FINITE_NODE_REFS`, `SEVERITIES` and the six `StepWait` values (the contract spec asserts equality against the TypeScript consts), `SimulationResult.required` includes `depletions` and `warnings`, and `acceptance/aoe4-simulate-api-contract.spec.ts` passes, including the live-response-equals-example test.
- [ ] `docs/aoe4-build-order.md` Outputs lists `depletions` and `warnings` as described in Scope and says both are empty today.
- [ ] Mutation: removing the clamp from `drawDown` fails the "never below 0" test; flipping the `idleVillagers > 0` severity test to `>= 0` fails the info/warning test; swapping `FINITE_NODE_REFS` order for `NODE_REFS` order in the sort fails the sort test.
- [ ] `depletion.ts` defines no tolerance literal (`git grep -nE "1e-|EPSILON" lib/aoe4-build-order/depletion.ts` finds nothing) and imports `RESOURCE_TOLERANCE`; `npx tsc --noEmit` and `npm run lint:dup` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

- `designer`: the design lists seven `depletion.ts` functions but no way to record a mid-run run-out (instant plus idle count at the end of the instant) or an idle arrival, and `depletionResults(stock)` must report both (D calls only that for `depletions` and both warning kinds). Proposed shape for the designer to confirm or rename: `recordRunOut(stock, ref, at, idleVillagers)` and `recordIdleArrival(stock, ref, at, count)`. D (SGS-038) and E use them, so the names must be fixed before D is written against them.
- `designer`: the design says the warnings are sorted but names no function. This ticket exports one, proposed as `sortWarnings(warnings: SimWarning[]): SimWarning[]` in `depletion.ts`, used by `simulate.ts` and by D and H. Confirm the name and location, or move it to `engine-common.ts`.
