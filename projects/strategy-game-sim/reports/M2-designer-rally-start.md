# M2 designer revision: villager rally and starting villager assignment (owner, 2026-10-31)

Design: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/design/M2.md
(sections changed in place: Modules `model.ts` exports, Contracts code block, Issue codes `invalid` row, new
"Rally and start" block, Task-switch walk bullet, Starting units, bounds table, Paste format + grammar, Extension
points, new Owner decisions section). Closes BACKLOG.md "AoE4 default villager production has no rally target".

## Changed contracts (all additive)

- `BuildOrder.start?: BuildStart` (new optional field).
- `BuildStart { villagers?: Partial<Record<GatherNodeId, number>>; rally?: GatherNodeId }` (new type, exported from `model.ts`).
- `BuildStep` gains action `{ action: 'rally'; producer: string; instance?: number; to: GatherNodeId; walkSeconds?: number }`
  (takes the shared optional `trigger`, so time, villagers and any later `Trigger.kind`).
- `produce.rally` meaning: optional for villagers (was required); allowed only on villager `produce`; it now also
  sets the producer's standing rally (owner decision 2).
- `SIM_INPUT_BOUNDS`: per-step `walkSeconds` row gains `rally`; new row `start.villagers` values int 0..200.
- Paste: new step `rally <producer>[#k] -> <node> [walk Ns]`; new `start [N <node>]... [-> <node>]` line.
- `BuildOrderIssue.code` unchanged (no new code). `CivData`, `GameData`, `loadGameData` unchanged.

## Rules

- Villager producers = `producedBy` of the `villager` entries (`capital-town-center`, `town-center`, `kings-palace`).
- Rally state per producer instance `{ node, walkSeconds? }`, last writer wins from the writer step's `startedAt`.
  Writers: `rally` step, villager `produce` with `rally`. Scope: `instance` = that instance; none = all existing
  instances of the baseId plus the baseId default for later instances. New instance: baseId default, else `start.rally`.
  Spawned villagers are never re-routed. Instance rally for an unbuilt instance is held.
- `rally` step: no cost or supply; `startedAt = completedAt = armedAt`, `waitSeconds` 0, `completed`.
- Rally walk: every spawned villager walks spawn -> node at `(source.walkSeconds ?? inputs.walkSeconds) / moveSpeedMultiplier`;
  `start.rally` routes use `inputs.walkSeconds`.
- `start.villagers`: replaces the civ split whole (omitted nodes 0), placed at t=0 with no walk; sum must equal
  sum of `civData.startingState.villagers.value` (6 for English).
- Validation (`invalid` unless noted): sum mismatch; unknown node key (`unknown-id`); value out of 0..200
  (`out-of-range`); `walkSeconds` without `rally` on produce; `rally` on non-villager produce; `rally` step on a
  building that produces no villagers; no `start.rally` while a starting building is a villager producer;
  `build` of a villager producer with neither `start.rally` nor an earlier baseId-wide rally source for that baseId.
  Removed: "villager `produce` without `rally` is `invalid`".
  These static rules make "a villager spawns with no rally" impossible, so `simulateBuildOrder` needs no runtime
  issue and its signature and `SimulationResult` are unchanged.
- Paste `start` line: at most one, before every step, no trigger prefix; repeated node, second `start`, or `start`
  after a step = `syntax`. `formatBuildOrderText` emits it first, nodes in `GatherNodeId` order.

## A3 determinism consequence

Rally state is a pure function of the build order and step start times, so A3 holds. The one new observable
ordering rule: within one instant, steps start (list order) before villagers spawn, so `@T rally` routes a villager
spawning at T; a step armed by a spawn (`villagers` trigger) starts at that instant after the spawn, so
`at N vils rally` routes villager N+1 onward. The engine ticket's A3 test should include a mid-game rally change and a
`start.villagers` split.

## Owner decisions (open, each written into the design under the recommended option)

1. Rally changes are ordered steps (gated by "every earlier step has started") vs. a separate `rallies` timeline
   ignoring step order. Recommend steps.
2. Villager `produce ... -> node` also sets the standing rally vs. routes only that order's villagers. Recommend
   standing rally (the game's rally point belongs to the building).
3. `start.rally` required for English vs. defaulting to the node with the most starting villagers (`sheep`).
   Recommend required.

## docs/aoe4-build-order.md on origin/main (68e004a) that now disagrees

- l.19-20: default continuous villager production; add that its villagers go to the producer's rally.
- l.53: per-step `walkSeconds` row lacks `rally`; table lacks `start.villagers` values row (int 0..200, default civ split).
- l.116-122 Starting state: add build-order `start.villagers` override (replaces split, no walk, sum rule) and `start.rally`.
- l.124-129 Ordering and triggers: add the same-instant rule (steps before spawns; spawn-armed steps after).
- l.163: "once on `produce` with `rally`, from spawn to the node" -> every spawned villager walks spawn to its rally node; walk from the rally source.
- l.254: `BuildOrder` is `{ civ, name, source?, steps }` -> add `start?` (`BuildStart`).
- l.257-263 action table: `produce` row "`rally?` (required for villagers)" -> optional, villager only, sets standing rally; add `rally` row.
- l.272-276 paste table: add `rally <producer>[#k] -> <node> [walk Ns]`; add the `start` line.
- l.280-291 examples: `produce villager ... -> sheep` still valid; add a `start` line and a `rally` example.
- l.293-309 grammar: add `start` line rules.
- l.322 `invalid` row and l.324-326: remove "villager `produce` without `rally`"; list the new invalid rules.
- New section (or under Model rules): Rally rules (state, scope, last writer, new instances, no re-route, rally step timing).

## Ticket files using a changed contract

No open ticket file uses them; all existing tickets are integrated. Affected integrated work:
- tickets/SGS-014-aoe4-data-model-loader.md: its `lib/aoe4-build-order/model.ts` on main must gain `BuildStart`,
  `BuildOrder.start?`, the `rally` action, and fix the `produce` comment ("rally is required for villagers").
  `CivData` and the loader are unchanged.
- tickets/SGS-013-aoe4-design-doc.md: the doc lines above.
Unwritten tickets that must copy these contracts: parse-text, validate, simulate (engine), route/OpenAPI, prebuilt builds.
Suggest folding the `model.ts` type additions into the validate or parse ticket rather than a separate ticket.
