# M3 designer pass 4

Design: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/design/M3.md
(rewritten in place, no change log).

All 9 ticket-writer questions are answered in the design. No question needs the owner. Owner decisions: none open.

## Contracts changed

- Time format (new contract): `lib/aoe4-build-order/format-time.ts` exports `formatMinSec(seconds): string`. It is
  moved from `components/apps/aoe4-build-order/chart-rows.ts` by the cleanup ticket and is not re-exported there.
  The file has no imports. Output is unchanged: 0 -> `0:00`, 65 -> `1:05`, 3600 -> `60:00`. `parse-text.ts` `@m:ss`
  goes through it.
- engine-common: `villagerWalkSeconds(state: EffectState, walkSeconds: number)`. The `data` parameter is dropped and
  the function reads `state.data`.
- nodeRefIssue: `nodeRefIssue(value: unknown, finiteOnly): NodeRefProblem | null`, with
  `interface NodeRefProblem { code: 'syntax'|'unknown-id'|'out-of-range'|'invalid'; reason: string }`.
  - The caller's message is `${reason} in ${path}`.
  - A non-string value gives `syntax` with reason `node must be a string`.
  - Every other reason quotes the value.
- Inputs: `houseBuilderSource` and `trips` do not use nodeRefIssue. `gold#2` there stays `unknown-id` with the M2
  message.
- Depletion recording (new contract):
  - `recordRunOut(stock, ref, at, idleVillagers)`
  - `recordIdleArrival(stock, ref, at, count)`
  - `sortWarnings(warnings): SimWarning[]` is pure and is the one sort.
  - The contract has a rules table covering first call, repeat, count 0, a ref not in the stock, and a ref that is
    not depleted.
- Step status:
  - `accrueWait(engine: EngineState, stepIndexes: readonly number[], seconds: number): void` is exported from
    simulate.ts. It is the only writer of `waitBreakdown`, and it skips trigger, earlier-step and null.
  - An unregistered action gives `prerequisite`.
- Warning messages: step-stuck is `step <index+1> (<action>) was still waiting on <waitingOn> at <m:ss duration>,
  from <m:ss at>.` The number in the message is 1-based; the `step` field stays 0-based.
- formatBuildStep: it writes `whenever` exactly when `reaction` is true and the trigger is `depleted`. Otherwise the
  reaction is dropped. Round-trip is promised for valid orders only.
- OpenAPI:
  - New `DepositRef` enum (`gold#2`..`gold#8`).
  - `NodeRef` = oneOf [GatherNodeId, DepositRef] and `FiniteNodeRef` = oneOf [FiniteGatherNodeId, DepositRef].
    A test pins them against NODE_REFS (15) and FINITE_NODE_REFS (13).
  - `spent` uses propertyNames $ref SpendCategory.
  - nodeAmounts uses propertyNames $ref FiniteNodeRef.
  - Every schema is a $ref target.
- research.ts: `researchEntry(baseId, state: EffectState): SnapshotEntry | undefined`.
- Test ids: `step-field-trigger-count` for a villagers trigger's count.
- Modules: `english-1tc.json` keeps its file name and its name "ENG 1TC". The new build file is
  `english-spear-longbow-maa-crossbow.json`.

## Behavior rules added or changed

- Node stock recording: at the end of each run-out instant, `recordRunOut` runs in FINITE_NODE_REFS order. Every
  arrival at a depleted ref calls `recordIdleArrival`.
- Idle villagers leaving: numbered `move`, `move all` and `build` take gatherers first, then idle villagers. The
  order is unobservable.
- Auto-houses, exact fit: the zero-lead stall is kept as a known limit and gets no rule. It is unreachable with
  shipped data (Starting state).
- Reaction wake: while a reaction waits on resources, its affordability instant is a nextWake candidate. It goes in
  a wake-only list, not `reserve` and not `needs`.
- Reaction validation: reactions are checked in list order like any step. They count as a rally source and count
  for the repeat-research rule.
- Step status, no handler: the step gets `prerequisite`, then is `waiting` with step-stuck.
- waitBreakdown is filled only through `accrueWait`.
- Research notes: `researchNotes` classifies the lowest-age entry `[0]` and is pure in (order, data).
- Step table:
  - `defaultStep` values are fixed:
    - produce villager from villagerProducers[0]
    - pause villagerProducers[0]
    - rally villagerProducers[0] -> nodes[0]
    - build house from wood
    - research techs[0]
    - move 1 nodes[0] to wood
  - `defaultTrigger` values are fixed: time 0, villagers 1, depleted finiteNodes[0], bank resources[0] 100.
  - The time field takes whole seconds and is labeled "seconds".
- Prebuilt builds, how they meet it:
  - No shipped build carries a step the paste grammar cannot format.
  - The depletion ticket asserts bar parts 1-3 at 1200 s and 3600 s, and parts 4-5 at 1200 s only.
  - ENG 1TC's gold reaction (N = 2, since gold runs out near 3305 s) lands with the paste-grammar ticket, which
    extends parts 4-5 to 3600 s.
- Left to tickets: the `defaultStep`/`defaultTrigger` item and the time field form are removed, because the design
  now fixes them.

## Decision table

| # | question | decision | tickets to change |
|---|---|---|---|
| 1a | SGS-035: zero-time house stall | Keep as a known limit: unreachable with validated input, no rule. The backlog item is dropped. | SGS-035 (open question resolved, no scope change) |
| 1b | SGS-035: villagerWalkSeconds data param | `(state: EffectState, walkSeconds)`; reads `state.data` | SGS-035 |
| 1c | formatMinSec home | `lib/aoe4-build-order/format-time.ts`, moved by SGS-035, no re-export | SGS-035 (adds the move); SGS-047/048/049 (import path); SGS-037/038/042 (messages use it) |
| 2 | SGS-037: recording function names | `recordRunOut`, `recordIdleArrival`, `sortWarnings`, with the rules table | SGS-037, SGS-038 (calls), SGS-042 (sortWarnings) |
| 3a | SGS-038: `gold#2` in houseBuilderSource/trips | stays `unknown-id`, M2 message | SGS-038 (drop the wait-for-designer note) |
| 3b | SGS-038: take order when leaving | gatherers first, then idle (unobservable) | SGS-038 |
| 3c | SGS-038: nodeRefIssue shape | `NodeRefProblem \| null`; message `${reason} in ${path}` | SGS-038, SGS-039 (trigger node message), SGS-054 (docs) |
| 4 | SGS-041: which entry the notes classify; state type | `[0]` lowest-age, pure; `EffectState`; returns `SnapshotEntry \| undefined` | SGS-041 (drop open questions) |
| 5a | SGS-042: accrueWait | `accrueWait(engine, stepIndexes, seconds)`, the only writer | SGS-042, SGS-039 |
| 5b | SGS-042: step-stuck numbering | 1-based `step N (action)`; field stays 0-based | SGS-042 |
| 5c | SGS-042: unregistered action | `prerequisite` | SGS-042 |
| 6 | SGS-040: reaction on a non-depleted trigger | dropped by formatBuildStep; round-trip promised for valid orders only | SGS-040 |
| 7 | SGS-046: trigger count id, time field, defaults | `step-field-trigger-count`; whole seconds labeled "seconds"; defaults as listed | SGS-046 (drop open questions), SGS-055 (use trigger-count) |
| 8 | SGS-050: rename english-1tc? | Not renamed; stays "ENG 1TC". The new file is `english-spear-longbow-maa-crossbow.json`. The pass-2 report was wrong. | none |
| 9 | SGS-054: deposit refs in OpenAPI | `DepositRef` schema; NodeRef/FiniteNodeRef as oneOf refs; spent and nodeAmounts via propertyNames | SGS-037 (DepositRef, oneOf, union test); SGS-043 (spent propertyNames); SGS-038 (nodeAmounts propertyNames); SGS-054 (27 AoE4 schemas, 36 total; exemption question removed) |
| - | SGS-039 answers already folded in by the manager | reaction affordability wake; list-order validation of reactions; prebuilt bar split | none (SGS-039 already consistent) |

## Extension points touched

- Numbered stone deposits and More deposits now name the OpenAPI `DepositRef` enum as the place that grows.

## Owner questions

None.
