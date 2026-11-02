# SGS-037: Add node refs, the warnings contract and the depletion module

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.1 and M3.11 (types and stock math only), M3.12 (`Severity`)
- **Priority**: high
- **Risk**: high
  <!-- REPO.md criticalPaths `lib/**` applies (production files under lib/aoe4-build-order change). The outline said low; by the template a critical-path glob forces high. Otherwise this is small: ~185 lines of business logic, every name already fixed by design/M3.md, so the new response fields do not count as a public-schema change under strongModelTriggers. -->
- **Invariants**: A1 (no node amount appears in code; this ticket ships none), A2 (the stock clamps at 0, never negative), A3 (stock math is a pure function of its arguments, no clock), S3 (`MAX_DEPOSITS` bounds the deposit list)
- **LOC estimate**: ~195 business logic (`depletion.ts` ~130: stock creation, draw-down with clamp, next run-out, recording, results, warning sort; `model.ts` ~55: consts, `nodeKindOf`, types; `simulate.ts` ~8: empty result fields through the sort). Tests, `openapi.json` and doc text excluded.
- **Depends on**: SGS-035 (`GATHER_NODES`, `RESOURCE_TOLERANCE` in `engine-common.ts`, `test-helpers.ts`, and the move of `formatMinSec` to `lib/aoe4-build-order/format-time.ts`)
- **On merge**: none
- **Source**: `design/M3.md` (Contracts: Types, Severity, Node references, Run refs, Depletion recording, Warning messages; Behavior rules: node stock, warnings ordering; OpenAPI list); `reports/M3-designer-4.md` decision rows 1c, 2, 9; `plans/M3-20261101.md` outline C and owner-approved design question 6 (empty `depletions`/`warnings` fields)

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

**`lib/aoe4-build-order/depletion.ts`** (new; imports `RESOURCE_TOLERANCE` from `engine-common.ts` and `formatMinSec` from `format-time.ts`, and defines no tolerance of its own)
- `NodeStock`: per run ref the starting `amount` (`number | null`, `null` = infinite), `remaining`, `depletedAt`, the idle count recorded at the end of the run-out instant, and the idle arrivals (first arrival time, total count). Internals beyond that are free.
- `runRefs(order: BuildOrder): FiniteNodeRef[]`: `FINITE_GATHER_NODES` plus every `DepositRef` named in `order.start` (villagers keys, rally) and in any step node field (`produce.rally`, `rally.to`, `build.from`, `build.then`, `move.from`, `move.to`), in `FINITE_NODE_REFS` order. It filters the node strings it finds against `FINITE_NODE_REFS`, so D's type widening needs no change here; E adds the read of a `depleted` trigger's `node` when that trigger kind exists. An order naming no deposit returns exactly the six finite nodes, first `sheep`, last `stone`.
- `createNodeStock(refs, inputs)`: `inputs` only needs `nodeAmounts: Readonly<Record<FiniteNodeRef, number | null>>`, typed structurally so `SimInputs` (which gains `nodeAmounts` in D) satisfies it with no import cycle. Each ref starts at `nodeAmounts[ref]`. A ref starting at 0 is depleted from t=0 (`isDepleted` true at once); like any run-out it gets `depletedAt` and its `node-depleted` warning only when the engine calls `recordRunOut` for it (design: at the end of the t=0 instant).
- `drawDown(stock, gatherers, rateOf, seconds)`: `gatherers: Readonly<Partial<Record<NodeRef, number>>>`, `rateOf: (ref: FiniteNodeRef) => number`. Each stocked, not-depleted ref loses `gatherers[ref] * rateOf(ref) * seconds`, clamped so `remaining` never goes below 0, and `remaining <= RESOURCE_TOLERANCE` becomes exactly 0. Returns the amount actually drawn per ref, so D credits that and not the unclamped product. `null` amounts and depleted refs draw nothing. Deposits are independent (a `gold#2` draw never changes `gold`).
- `nextRunOut(stock, gatherers, rateOf, now): number | null`: the earliest `now + remaining / (gatherers * rateOf)` over stocked, not-depleted refs with gatherers above 0 and a rate above 0; `null` when there is none.
- `isDepleted(stock, ref)`: true for a stocked ref whose `remaining` is 0, including one that started at 0; false for `null` amounts and for a ref not in the stock.
- `depletionResults(stock): { depletions: NodeDepletion[]; warnings: SimWarning[] }`: `depletions` has one entry per stock ref in `FINITE_NODE_REFS` order (`amount` = starting amount or `null`; `depletedAt` or `null`). `warnings` has one `node-depleted` per depleted ref (`severity: 'warning'` when the recorded idle count is above 0, else `'info'`; message uses the ref id and `formatMinSec` from `format-time.ts`, not a display name: `gold#2 ran out at 18:35; 6 villagers are idle there.` and, with 0, `gold ran out at 9:10; no villagers were left idle.`) and one `idle-arrival` (`severity: 'warning'`) per ref with recorded idle arrivals (message `3 villagers arrived at depleted berry from 5:10 on and are idle.`), already in the warnings order. `at` of `node-depleted` is `depletedAt`; `idleVillagers` is the recorded count.
- `recordRunOut(stock, ref, at, idleVillagers): void`: sets `depletedAt = at` and the idle count used by `node-depleted`. A second call for the same ref is ignored (first record wins); a ref not in the stock, or not depleted, is ignored. D (SGS-038) calls it once per run-out at the end of the run-out instant, with `at = now`, `idleVillagers = idle[ref]`.
- `recordIdleArrival(stock, ref, at, count): void`: the first call sets the `idle-arrival` warning's `at`; every call adds `count` to its `idleVillagers`. `count` 0, a ref not in the stock, or a ref that is not depleted is ignored. (Villagers made idle by the run-out itself are never passed here.)
- `sortWarnings(warnings: readonly SimWarning[]): SimWarning[]`, exported from `depletion.ts`: by `at`; at equal `at`, node warnings (`node-depleted`, `idle-arrival`) before `step-stuck`, node warnings in `FINITE_NODE_REFS` order of `node`, `node-depleted` before `idle-arrival` for the same ref; `step-stuck` last, by `step` index. It is pure and returns a new array. It is the one warnings sort: `depletionResults` returns its warnings already through it, `simulate.ts` passes the merged list through it once, and no other module sorts warnings.

**`lib/aoe4-build-order/simulate.ts`**: `simulateBuildOrder` returns `depletions: []` and `warnings` as the empty list passed through the sort, so D and H add content without touching the result shape or a second sort.

**`docs/api/openapi.json`** (same diff; every response schema is `additionalProperties: false` with a full `required` list and a description on every property and variant):
- New schemas `FiniteGatherNodeId` (enum, 6), `DepositRef` (enum `gold#2`..`gold#8`, 7), `NodeRef` (`oneOf` `$ref` `GatherNodeId` and `$ref` `DepositRef`; `GatherNodeId` already exists), `FiniteNodeRef` (`oneOf` `$ref` `FiniteGatherNodeId` and `$ref` `DepositRef`), `Severity` (enum `error`, `warning`, `info`), `StepWait` (enum of the six), `NodeDepletion` (closed object, all three required, `amount` and `depletedAt` `number | null`, `node` `$ref` `FiniteNodeRef`), `SimWarning` (`oneOf` three closed variants tagged by a `code` const; every field required; `severity` `$ref` `Severity`, `node` `$ref` `FiniteNodeRef`, `waitingOn` `$ref` `StepWait`).
- `SimulationResult` gains `depletions` (array of `NodeDepletion`) and `warnings` (array of `SimWarning`), both in `required`.
- The 200 example gets `"depletions": []` and `"warnings": []`; the contract spec compares the live response to it with `toEqual`.
- References in this ticket: `FiniteGatherNodeId` and `DepositRef` from `FiniteNodeRef`; `DepositRef` from `NodeRef`; `FiniteNodeRef` from `NodeDepletion.node` and `SimWarning`. `NodeRef` is not yet referenced by a request schema (D does that, with `BuildStep` fields); that is intended, so the contract spec's every-schema-is-referenced check (if it exists) exempts `NodeRef` until D lands.
- Each list is written once, as in `model.ts`; a union test pins that the values `NodeRef` accepts equal the 15 `NODE_REFS` and `FiniteNodeRef` the 13 `FINITE_NODE_REFS`.

**Tests that must change with the result type and the model.ts exports** (respec 2)
- `lib/aoe4-build-order/data.acceptance.test.ts`, "repository constraints" > "model.ts exports exactly the 19 documented types and the two shared lists" (lines ~310-337): rename it to "model.ts exports exactly the 27 documented types and the shared lists"; add the 8 new type names (`DepositRef`, `FiniteGatherNodeId`, `FiniteNodeRef`, `NodeDepletion`, `NodeRef`, `Severity`, `SimWarning`, `StepWait`) to its sorted type list (19 -> 27); set the runtime-export list (const/function/class/enum, in source order) to `['GATHER_NODES', 'RESOURCE_KINDS', 'FINITE_GATHER_NODES', 'MAX_DEPOSITS', 'NODE_REFS', 'FINITE_NODE_REFS', 'nodeKindOf', 'SEVERITIES']`. Its other assertions (`effects-unmodeled`, `walkSeconds`) stay.
- `acceptance/aoe4-simulate-api-edges.spec.ts`, "result shape" > "a villager-only order returns every result field, aligned to the times axis" (line ~47-49): the pinned response key list gains `depletions` and `warnings`; no other assertion in it changes.
- `components/apps/aoe4-build-order/result-series.test.ts`: the hand-made `SimulationResult` literal gains `depletions: []` and `warnings: []` (tsc fails otherwise).
- `acceptance/aoe4-simulate-api-contract.spec.ts`: add `depletions: true, warnings: true` to the `simulationResult` key literal; add `NodeDepletion` to the response-schema lists and key literals; `SimWarning` is a `oneOf`, so it cannot go through the "response-side schemas are closed" loop as is. Assert its three variants separately (closed, every field required, descriptions). Add the new enum schemas (including `DepositRef`) to the shared-schema name check, and the `NodeRef`/`FiniteNodeRef` union test.

**Docs** (`docs/aoe4-build-order.md`)
- Outputs list (line ~501-519): add `depletions` and `warnings` bullets. State the shape (`NodeDepletion`; `SimWarning` with `code`, `severity`, `at`), that `severity` is one of `error`, `warning`, `info`, that `warnings` are sorted by `at` with the tie rules above, and that both lists are always empty today because no node runs out (the engine still treats every node as infinite).
- Lines 25 and 325 ("Resources are infinite", "Out: ... resource depletion") and the Extension points row at line 631 stay true after this ticket; confirm they are unchanged. D, E and T own the later rewrites. Grep run on main: `git grep -n -i "depletion\|depleted\|runs out" -- docs/aoe4-build-order.md` finds exactly lines 25 (via "never runs out"), 325 and 631 (respec 2: line numbers corrected; after this ticket the new Outputs bullets add hits, and the three original lines keep their text).

**Out of scope:** engine use of the stock (D); `nodeAmounts` in `SimInputs`, `validate.ts`, `nodeRefIssue`, `data.ts`/`base.json` amounts, and `BuildStep` field widening (D, E); `Trigger` kinds and `reaction` (E); `StepTiming.waitingOn`, `waitBreakdown`, `step-stuck` emission (H); `BuildOrderNote.severity` and `info` notes (G); page changes (K); parse-text's own `GATHER_NODE_ORDER` (F).

## Diagrams

Single-component change outside the core control loop (the engine loop is untouched; `simulate.ts` only returns two empty fields); no diagram required.

## Acceptance criteria

- [x] `NODE_REFS` has 15 entries, first `sheep`, last `stone`, with `gold#2`..`gold#8` immediately after `gold`; `FINITE_NODE_REFS` has 13, first `sheep`, last `stone`, same insertion; `FINITE_GATHER_NODES` is `sheep, berry, deer, boar, gold, stone`; `SEVERITIES` is `error, warning, info`. A unit test pins each, and a `@ts-expect-error` line pins that `'gold#1'` and `'gold#9'` are not `DepositRef`.
- [x] `nodeKindOf('gold#3')` is `'gold'`, `nodeKindOf('gold')` is `'gold'`, and every `NODE_REFS` entry maps to a `GatherNodeId`.
- [x] `runRefs` of an order naming no deposit returns the six finite nodes (first `sheep`, last `stone`); an order that names `gold#3` in `start.villagers`, and `gold#2` in a `move` `to`, returns eight refs with `gold#2` and `gold#3` right after `gold`, in `FINITE_NODE_REFS` order, once each. (The test injects deposit refs with one `as unknown as BuildOrder` cast, because step fields are not widened until D.)
- [x] `createNodeStock` with `nodeAmounts.berry = 0`: `isDepleted(stock, 'berry')` is true at once; after `recordRunOut(stock, 'berry', 0, 0)`, `depletionResults` reports `berry` with `depletedAt: 0` and one `node-depleted` warning at `at: 0`.
- [x] (respec 1) `recordRunOut` sets `depletedAt` and the idle count for a depleted ref; a second call for the same ref changes nothing; a ref not in the stock, or still stocked, is ignored. `recordIdleArrival`: two calls (at 310 count 2, at 400 count 1) on a depleted ref give one `idle-arrival` at `at: 310` with `idleVillagers: 3`; count 0, a non-depleted ref and a ref not in the stock are ignored.
- [x] `drawDown` never takes a ref below 0: 10 gatherers at rate 1 for 5 s from `remaining` 20 returns 20 for that ref (not 50) and leaves `remaining` 0 and `isDepleted` true. A ref whose `remaining` ends within `RESOURCE_TOLERANCE` of 0 is set to exactly 0.
- [x] `drawDown` leaves a `null` amount unchanged and returns nothing for it; leaves a depleted ref at 0 and returns nothing for it; draws `gold` and `gold#2` independently (drawing `gold#2` leaves `gold.remaining` unchanged).
- [x] `nextRunOut` returns the earliest of several refs' exact times (for example `now + remaining / (gatherers * rate)`), ignores refs with 0 gatherers, 0 rate, `null` amount or already depleted, and returns `null` when none qualifies.
- [x] `depletionResults` returns one `depletions` entry per stock ref in `FINITE_NODE_REFS` order; a ref still stocked has `depletedAt: null`, a `null` amount reports `amount: null`.
- [x] A `node-depleted` warning has `severity: 'warning'` when the recorded idle count is above 0 and `'info'` when it is 0; an `idle-arrival` is `'warning'`; no result item has `severity: 'error'`. (respec 1) The messages equal the design's: `gold#2 ran out at 18:35; 6 villagers are idle there.`, `gold ran out at 9:10; no villagers were left idle.`, `3 villagers arrived at depleted berry from 5:10 on and are idle.` (times through `formatMinSec`; no display names).
- [x] The warnings sort orders an unsorted list containing all three codes: by `at`; at equal `at`, `berry` before `gold` before `gold#2` before `stone` (the `FINITE_NODE_REFS` order); `node-depleted` before `idle-arrival` for one ref; `step-stuck` after every node warning at that `at`, ordered by `step`. (respec 2) It is `sortWarnings`, returns a new array without mutating its input, and applying it twice equals applying it once.
- [x] `simulateBuildOrder` returns `depletions: []` and `warnings: []` for the existing prebuilt build and for a one-step order, and no existing timing, series, step status or note changes (respec 2) (the full unit suite and the Playwright acceptance suite pass, with pre-existing tests changed only as "Tests that must change" lists: the `result-series.test.ts` literal, the `data.acceptance.test.ts` export-list test, the `aoe4-simulate-api-edges.spec.ts` key list and the contract spec).
- [x] `docs/api/openapi.json` defines `FiniteGatherNodeId`, `DepositRef`, `NodeRef`, `FiniteNodeRef`, `Severity`, `StepWait`, `NodeDepletion` and `SimWarning`; (respec 9) `DepositRef` enumerates `gold#2`..`gold#8`; `NodeRef` and `FiniteNodeRef` are `oneOf` `$ref`s and the union test shows their accepted values equal `NODE_REFS` and `FINITE_NODE_REFS`; the enums equal `FINITE_GATHER_NODES`, `SEVERITIES` and the six `StepWait` values (the contract spec asserts equality against the TypeScript consts), `SimulationResult.required` includes `depletions` and `warnings`, and `acceptance/aoe4-simulate-api-contract.spec.ts` passes, including the live-response-equals-example test.
- [x] (respec 2) `lib/aoe4-build-order/data.acceptance.test.ts` "model.ts exports exactly the 27 documented types and the shared lists" passes: the 27 `export type|interface` names in `model.ts` equal its sorted list, and the runtime exports equal `['GATHER_NODES', 'RESOURCE_KINDS', 'FINITE_GATHER_NODES', 'MAX_DEPOSITS', 'NODE_REFS', 'FINITE_NODE_REFS', 'nodeKindOf', 'SEVERITIES']`.
- [x] (respec 2) `acceptance/aoe4-simulate-api-edges.spec.ts` "a villager-only order returns every result field" passes with `depletions` and `warnings` in its key list.
- [x] `docs/aoe4-build-order.md` Outputs lists `depletions` and `warnings` as described in Scope and says both are empty today.
- [x] Mutation: removing the clamp from `drawDown` fails the "never below 0" test; flipping the `idleVillagers > 0` severity test to `>= 0` fails the info/warning test; (respec 2) replacing `FINITE_NODE_REFS.indexOf` with `FINITE_GATHER_NODES.indexOf` in `sortWarnings` fails the sort test (deposit refs then rank ahead of `berry`). (Swapping in `NODE_REFS` is an equivalent mutant: it differs only by `farm` and `wood`, which are never a warning `node`.)
- [x] `depletion.ts` defines no tolerance literal (`git grep -nE "1e-|EPSILON" lib/aoe4-build-order/depletion.ts` finds nothing) and imports `RESOURCE_TOLERANCE`; `npx tsc --noEmit` and `npm run lint:dup` pass.
- [x] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-01

- Underspecified: "Tests that must change" omitted two pre-existing tests the new exports and result fields break: the `data.acceptance.test.ts` model.ts export-list test (implementer pass 1 found it) and the `aoe4-simulate-api-edges.spec.ts` result key list (found by grep; the implementer ran only the contract spec). The doc line numbers were stale, and the sort mutation was an equivalent mutant.
- Changed: both tests added to Scope with their exact new lists, plus two acceptance criteria; the simulate criterion's "unchanged apart from" list now names them; doc lines are 25/325/631; the sort mutation now uses `FINITE_GATHER_NODES.indexOf`.
- Branch `sgs-037-aoe4-node-refs-warnings-depletion-module` (7db2324) stands: all production code, new tests, openapi and docs. Rework adds only the two test edits and runs the full Playwright suite.
