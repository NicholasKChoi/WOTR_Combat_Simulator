# SGS-038: Run nodes dry in the engine: idle villagers, numbered deposits, `move all` and node amounts

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.1 (run-out time reported), M3.2, M3.11 (`gold#2`..`gold#8`, move to a deposit), M3.8 (`build` `then` = created node, no second walk)
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: changes what a run computes and the order of operations a result depends on; changes the public request schema (BuildStep node fields, move.count, SimInputOverrides.nodeAmounts); critical path lib/**; well over 250 lines of business logic. -->
- **Invariants**: A1 (the `createdBy` and `amount` facts live in `rules/base.json`, none in code), A2 (a run-out moves nobody into a negative stock; payments still check before spending), A3 (run-out times are a pure function of the order, data and inputs), S3 (`nodeAmount` is a bounded input, enforced in `validate.ts`)
- **LOC estimate**: ~380 (`simulate.ts` ~190: stock per run ref, run-out wakes and instant, `assignGatherers`/`availableAt`, take-from-idle, `move all`, `createdBy` arrival, house-builder reads; `validate.ts` ~110: `nodeRefIssue`, node-ref table in every node position, `nodeAmounts` table, `move` count `all`; `houses.ts` ~10; `data.ts`, `api.ts`, `model.ts` widening ~40; `base.json` 1 line; tests and `openapi.json` excluded). Split candidate if the diff passes ~450: validation and inputs (`nodeRefIssue`, `nodeAmounts`, `move all` shape, OpenAPI) first, engine second.
- **Depends on**: SGS-037 (node refs, warnings contract, `depletion.ts`), SGS-035 (`engine-common.ts`, `test-helpers.ts`)
- **On merge**: none
- **Source**: `design/M3.md` (Contracts: Node references, Inputs; Behavior rules: node stock, deposits, arrivals, idle villagers, `move all`, build walk); `plans/M3-20261101.md` outline D and design questions 5 and 6

## Context

Today every node is infinite and `EngineState.gatherers` is keyed by the eight `GatherNodeId`s, so a node never runs out and a build can name no second gold deposit. This ticket makes the engine honor a stock per run ref: when a ref runs dry its gatherers go idle, later arrivals go idle, and the run-out is reported. No default amount ships here: `rules/base.json` gets no `amount`, so every node stays infinite and ENG 1TC is untouched except for the `createdBy` walk fix, until SGS-039 turns depletion on. Depletion is reachable only through `nodeAmounts` overrides (and `editGameData`) between this ticket and SGS-039.

## Scope

Names below follow `design/M3.md` and SGS-037/SGS-035. Line numbers refer to `main` f078c11 and shift after SGS-035.

**`lib/aoe4-build-order/model.ts`**
- Widen every `BuildStep` node field from `GatherNodeId` to `NodeRef`: `produce.rally`, `rally.to`, `build.from`, `build.then`, `move.from`, `move.to`, and `BuildStart.rally`, `BuildStart.villagers` keys (`Partial<Record<NodeRef, number>>`).
- `move.count: number | 'all'`.
- `SimInputs.nodeAmounts: Record<FiniteNodeRef, number | null>` (all 13 keys).
- Does not add `Trigger` kinds, `reaction`, `waitingOn` or `waitBreakdown` (SGS-039, SGS-042).

**`lib/aoe4-build-order/data.ts` and `data/aoe4-build-order/rules/base.json`**
- `GatherNodeRules.amount?: HandValue<number>` and `createdBy?: string`.
- `base.json`: `gatherNodes.farm.createdBy: "farm"`, and nothing else. No `amount` anywhere (the six values land with SGS-039).

**`lib/aoe4-build-order/simulate.ts`**
- `EngineState.gatherers` and new `EngineState.idle`: `Record<NodeRef, number>` over `NODE_REFS` (`createEngine` seeds all 15 at 0, then `order.start.villagers`). New `EngineState.stock`: a `NodeStock` from `createNodeStock(runRefs(order), inputs)`.
- `assignGatherers(state, ref, count)`: the one arrival path (add to `idle[ref]` if `isDepleted(stock, ref)`, else to `gatherers[ref]`). It replaces the five direct `gatherers[...] +=/-=` mutations (spawn walk at `spawnUnit`, `startConstruction`, `completeConstruction`, `move` start and arrival). Exported, as it is a contract.
- `availableAt(state, ref) = gatherers[ref] + idle[ref]`. `build` and numbered `move` check `availableAt(from)` and remove gatherers first, then idle ones, in one internal helper.
- `move` with `count: 'all'`: takes `availableAt(from)` at its start, never waits on `villagers`, completes at the start instant when that is 0 and moves nobody.
- `build` with `gatherNodes[then].createdBy === step.building` (the `then` default stays `from`): builders join `then` at completion through `assignGatherers` with no second walk. Every other `build` keeps both legs. Auto-houses always keep both legs and return to `from`.
- Run-out machinery in the main loop, using SGS-037's `drawDown`, `nextRunOut`, `isDepleted`, `depletionResults`: `nextWake` adds each run ref's `nextRunOut` as a candidate (so a run-out lands on its exact time, not on a sample); the income credit loop becomes `drawDown`, crediting a finite ref only while it is not depleted; `incomePerSecond` and `nodeRate` take a `NodeRef` and call `nodeKindOf(ref)` for rates, trips and `dropOffs`. Run-outs apply first in `runInstant`, before `offerSteps`, in `FINITE_NODE_REFS` order: set `depletedAt = now`, move all `gatherers[ref]` into `idle[ref]`.
- `node-depleted` is recorded once per run-out with `idleVillagers = idle[ref]` read at the end of that instant (after steps, events and production), `severity: 'warning'` when above 0 else `'info'`. A ref starting at 0 runs out at t=0.
- `idle-arrival`: the first arrival at an already depleted ref records one warning with `at` = that time and `idleVillagers` = the total that arrived idle there by the horizon, `severity: 'warning'`. Villagers idle at the run-out instant do not count.
- Auto-houses: `houseBuilderSource` (deposit 1 for `gold`) and the fullest-node fallback read `gatherers` only, over `NODE_REFS` order restricted to run refs (`GATHER_NODES` order for any ref a build does not name), and never take idle villagers. A builder returning to a depleted ref is an idle arrival.
- `SimulationResult.depletions` filled from `depletionResults(stock)` (one per run ref, `FINITE_NODE_REFS` order, `amount` = starting amount or `null`, `depletedAt` or `null` at the horizon) and `warnings` filled from the same call. SGS-037's sort stays the only sort.
- `aliveVillagers` counts idle villagers (they are alive; `at N vils` and population include them).

**`lib/aoe4-build-order/houses.ts`**: reads of `gatherers` keyed by `GatherNodeId` (if any remain after SGS-035) move to `NodeRef`; no behavior change.

**`lib/aoe4-build-order/validate.ts`**
- `nodeRefIssue(value, finiteOnly)` per the design's node-ref table (valid, `invalid`, `out-of-range`, `unknown-id`, `syntax`). It replaces `isKnownId(data, 'node', ...)` in every step node field, `start.rally` and `start.villagers` keys, so each position gives the same issue for the same input. Exported (contract).
- `move.count` accepts the string `all` (`FieldSpec` kind for `count` allows it on `move` only); `"All"` and `"3"` are `syntax`; `produce.count` stays number-only. `all` skips the `count` bound.
- `SIM_INPUT_BOUNDS.nodeAmount: bound(0, 100000)` (integer). `resolveSimInputs` reads `nodeAmounts` per the design's input table, defaults each finite node to `gatherNodes.<node>.amount?.value ?? null` and each `gold#k` to `gatherNodes.gold.amount?.value ?? null`, and returns all 13 keys. Issues carry the path `inputs.nodeAmounts.<key>`.
- `houseBuilderSource` and `trips` keys stay `GatherNodeId` and keep today's `unknown-id` for any `#` form (see Open questions).

**`lib/aoe4-build-order/api.ts`**: `SimInputOverrides.nodeAmounts?: Partial<Record<FiniteNodeRef, number | null>>`.

**`docs/api/openapi.json`** (same diff; `acceptance/aoe4-simulate-api-contract.spec.ts` validates with `additionalProperties: false`): `BuildStep` node fields `$ref` `NodeRef` (SGS-037 added the schema); `move.count` `oneOf` integer 1..200 or const `all`; `SimInputOverrides.nodeAmounts` object with `FiniteNodeRef` keys and `integer 0..100000 | null` values; response `depletions` and `warnings` already exist from SGS-037.

**`docs/aoe4-build-order.md`** (every statement this ticket makes untrue):
- Purpose line 25 "Resources are infinite: a resource node never runs out" and "Out: ... resource depletion" (line 323): finite nodes run out through `nodeAmounts`; defaults stay infinite until SGS-039, so say that amounts default to infinite today and where the starting amounts come from.
- Bounds table: `nodeAmounts` values (int 0..100000, `null` infinite), `move.count` also `all`.
- Task-switch walk bullets (lines 216-217): `build` pays two legs except when `then` is the node the building creates (farm); numbered deposits and idle villagers.
- `build` and `move` paragraphs (lines 254-258): they take idle villagers too; `move all`; waits.
- Houses and supply (lines 270-278): builders read gatherers only, never idle ones; a builder returning to a depleted node goes idle.
- Build order input (lines 364-372): node refs (`gold#2`..`gold#8`, deposit 1 is plain `gold`), `move.count: all`. Paste syntax for these is SGS-040's; here state JSON only.
- Extension points table row "Depletion, positions, per-trip deposits".
- Add a short "Depletion" section: stock, run-out instant, idle accounting, `depletions` and `warnings` (`node-depleted`, `idle-arrival`) with their severities.

**Tests** (use `test-helpers.ts`; drive depletion with `nodeAmounts` and `editGameData`; no new local `run`/`inputsFor`): see criteria. New files `simulate-depletion.test.ts`, additions to `validate.test.ts`.

**Out of scope:** `Trigger` kinds `depleted`/`bank` and `reaction` (SGS-039); `waitingOn`/`waitBreakdown`/`step-stuck` (SGS-042); paste grammar for `gold#2`, `move all` (SGS-040); `base.json` `amount` values and ENG 1TC reactions (SGS-039); severity lists on the page (SGS-045); `trips`/`houseBuilderSource` keyed by deposit; automatic fallback node for idle villagers; `spent` and population series (SGS-043); `markers`.

## Diagrams

Changes the engine's core loop (`runInstant` and the wake/credit step), so the path is grouped into read, act, record:

```mermaid
flowchart TD
  subgraph read["read (per instant)"]
    R1["stock.remaining per run ref"] --> R2["nextRunOut per ref with gatherers > 0"]
    R2 --> R3["nextWake = min(sample, event, time trigger, affordableAt, run-out)"]
  end
  subgraph act["act (runInstant)"]
    A0["credit income: drawDown(stock, gatherers, rateOf, dt)"] --> A1["run-outs first, FINITE_NODE_REFS order: gatherers[ref] -> idle[ref], depletedAt = now"]
    A1 --> A2["offerSteps (build/move take gatherers then idle; move all takes availableAt)"]
    A2 --> A3["applyDueEvents: arrivals via assignGatherers (depleted ref -> idle)"]
    A3 --> A4["offerSteps, startProduction, startAutoHouses (gatherers only)"]
  end
  subgraph record["record (end of instant)"]
    C1["node-depleted: idleVillagers = idle[ref] now; severity warning if > 0 else info"]
    C2["idle-arrival: first arrival at a depleted ref"]
    C3["depletions[] and warnings[] at the horizon"]
  end
  read --> act --> record
  record -->|next instant| read
```

## Acceptance criteria

- [ ] With `nodeAmounts: { berry: 600 }` and 3 villagers gathering berry, `depletions` has a berry entry with `amount: 600` and `depletedAt` equal to `600 / (3 * berry gather rate)` within `RESOURCE_TOLERANCE`, not rounded to a 5 s sample, and the berry villagers are idle from then on (gather rate for food from berry drops to 0 at the next sample, `floating.food` stops rising from berry).
- [ ] A ref's stock never goes below 0: total food credited from berry over the run equals 600 when it runs out (to `RESOURCE_TOLERANCE`).
- [ ] `remaining <= RESOURCE_TOLERANCE` counts as depleted; `nodeAmounts: { berry: 0 }` is depleted at t=0 with `depletedAt: 0`, one `node-depleted` warning, and any villager sent there is idle.
- [ ] Infinite stays infinite: with no `nodeAmounts`, `depletions` has the six finite refs with `amount: null`, `depletedAt: null`, no warnings, and the existing simulate, houses, research and builds tests pass unchanged (any whose numbers move is listed in the PR body with the reason).
- [ ] `nodeAmounts: { gold: null }` keeps deposit 1 infinite while `gold#2` (named by the order) keeps the data default (`null` in this ticket) and `nodeAmounts: { 'gold#2': 2500 }` gives deposit 2 a stock of 2500; deposits draw down independently (deposit 1 running out changes nothing at `gold#2`). `depletions` has `gold#2` only when the order names it; an override for an unnamed deposit is accepted and unused.
- [ ] A `node-depleted` warning has `idleVillagers` read at the end of the run-out instant: a `move all` step with a `time` trigger equal to the run-out instant that moves everyone away gives `idleVillagers: 0` and `severity: 'info'`; with villagers still there it is `severity: 'warning'` and the count.
- [ ] `idle-arrival`: a `move 3 sheep to berry` that lands on a depleted berry records one `idle-arrival` (`severity: 'warning'`, `at` = the arrival time, `idleVillagers` 3); a second arrival there adds to the count and records no second warning; villagers already idle at the run-out instant are not counted.
- [ ] Spawned villagers walking to a depleted rally ref, `build` `then` a depleted ref, and an auto-house builder returning to a depleted ref all arrive idle through `assignGatherers`. Idle villagers count in `at N vils` and in population and gather nothing. `git grep -nE "gatherers\[[^]]+\] *(\+=|-=)" lib/aoe4-build-order/simulate.ts` finds 5 lines on `main` and at most 2 after (the arrival add and the take-from removal).
- [ ] `move 6 berry to farm` after berry ran out takes the idle berry villagers (availableAt counts idle); `build ... from berry` takes gatherers before idle ones. `gatherers[ref]` and `idle[ref]` are never both above 0 (asserted in a test across a run with moves).
- [ ] `move all gold to gold#2` takes everyone available at its start instant (gatherers first, then idle), walks them as a numbered move does, never waits on `villagers`; with 0 available it starts and completes at that instant and moves nobody; a second `move all` from the same ref at the same instant is a no-op.
- [ ] Auto-house builders never come from idle villagers: with `houseBuilderSource: 'gold'` and only idle villagers on gold, the fallback picks the fullest non-idle node in `GATHER_NODES`/`NODE_REFS` order restricted to the run; a builder that returns to a depleted ref goes idle and records an `idle-arrival`.
- [ ] `build farm from berry then farm` (farm `createdBy: "farm"`): builders join `farm` at completion with no second walk (the arrival time is completion time, not completion plus a walk); `build mill from sheep then berry` and an explicit `then` equal to `from` still pay both legs; auto-houses still pay both legs. The ENG 1TC farm builds shift earlier by one walk each; the builds test still passes and the PR body lists the changed ENG 1TC numbers.
- [ ] A run-out is a wake: with no sample or event at the run-out time, the simulation still applies it at the exact time (test with `durationSeconds` and an amount whose run-out falls between samples). The same inputs give an equal result twice (A3).
- [ ] `warnings` for a run have `node-depleted` before `idle-arrival` for the same ref and are in SGS-037's sort order; this ticket adds no second sort.
- [ ] `nodeRefIssue` returns, for each row of the design's node-ref table, the listed code: `gold`, `gold#2`, `gold#8`, `wood` valid; `gold#1`, `wood#2`, `berry#2`, `stone#2` `invalid`; `gold#0`, `gold#9` `out-of-range`; `iron`, `iron#2` `unknown-id`; `gold#02`, `gold#`, `gold#x`, `gold#2#3` `syntax`; `farm`/`wood` with `finiteOnly` `invalid`. Each of the same values in `produce.rally`, `rally.to`, `build.from`, `build.then`, `move.from`, `move.to`, `start.rally` and a `start.villagers` key yields the same code.
- [ ] `resolveSimInputs`: each row of the design's `nodeAmounts` table gives the listed result (`{ berry: 0 }` valid, `{ gold: null }` valid, `{ farm: 500 }` and `{ wood: 500 }` `invalid`, `{ 'gold#9': 5 }` `out-of-range`, `{ iron: 5 }` `unknown-id`, `1.5`, `-1`, `100001`, `Infinity` `out-of-range`, `"5"`, `nodeAmounts: 5`, `{ 'gold#02': 5 }` `syntax`), the returned `inputs.nodeAmounts` has all 13 keys, and issues name `inputs.nodeAmounts.<key>`.
- [ ] `move` with `"count": "all"` validates; `"All"` and `"3"` are `syntax`; `produce` with `"count": "all"` is `syntax`.
- [ ] `houseBuilderSource: 'gold#2'` and `trips: { 'gold#2': ... }` are still `unknown-id` (unchanged until the designer answers).
- [ ] `docs/api/openapi.json` carries the changed `BuildStep` node fields, `move.count` and `SimInputOverrides.nodeAmounts`, and `acceptance/aoe4-simulate-api-contract.spec.ts` passes with a request using `gold#2`, `move all` and `nodeAmounts`.
- [ ] `docs/aoe4-build-order.md` no longer says nodes never run out or that `build` always pays two legs; `git grep -n "never runs out" docs/aoe4-build-order.md` finds 1 line on `main` and 0 after.
- [ ] `npx tsc --noEmit` and `npm run lint:dup` (zero clones) pass; no helper, tolerance or resource list is redefined outside `engine-common.ts`/`model.ts`.
- [ ] No INVARIANTS.md regressions

## Open questions

- **designer**: `houseBuilderSource` and `trips` stay keyed by `GatherNodeId`, and the design says `houseBuilderSource: 'gold'` names deposit 1. It does not say what `houseBuilderSource: 'gold#2'` (or `trips.gold#2`) gives. This ticket leaves today's `unknown-id`. Confirm that, or name the issue code.
- **designer**: a `build` with `from` on a depleted ref whose idle count is enough (`availableAt >= builders`) starts and takes idle villagers (design: "take from `availableAt(from)`"). Confirm that taking idle before gatherers is not wanted; this ticket takes gatherers first, then idle, for both `build` and numbered `move`, the same order the design gives for `move all`.
