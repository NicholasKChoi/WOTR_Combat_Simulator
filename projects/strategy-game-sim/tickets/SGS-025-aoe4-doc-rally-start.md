# SGS-025: Update the AoE4 build order doc for villager rally and start assignment

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.1 (kept current), M2.3, M2.4
- **Priority**: high
- **Risk**: standard
  <!-- Docs only, one file, no logic, so no strongModelTriggers item applies alone. Not low: the doc states the public
       paste grammar, the `BuildOrder` JSON shape and the input bounds, and every later AoE4 ticket is reviewed against it. -->
- **LOC estimate**: ~80-120 lines of prose, 0 business logic (one file, `docs/aoe4-build-order.md`, 441 lines on origin/main 68e004a)
- **Depends on**: none (SGS-013 merged)
- **On merge**: none
- **Source**: design/M2.md "Rally and start", Task-switch walk, bounds table, Paste format and grammar, Issue codes, Owner decisions (owner-confirmed 2026-10-31); reports/M2-designer-rally-start.md (list of disagreeing lines); BACKLOG "AoE4 default villager production has no rally target"

## Context

`docs/aoe4-build-order.md` on main still says a villager `produce` requires `rally` and has no `rally` step or
`start` line. design/M2.md now settles villager rally and the starting villager assignment. Every downstream
ticket (types, parse, validate, engine, route, page) is reviewed against this doc, so it must state the
settled rules first.

## Scope

Edit `docs/aoe4-build-order.md` only. Line numbers are on origin/main 68e004a. State rules flatly, as the rest of the doc
does; "owner confirmed" and decision history stay out. Transcribe from design/M2.md as it stands at implementation time
(a designer is concurrently adding a paste line-map seam to design/M2.md; if the doc describes line numbers on issues for
pasted `start` or step lines, follow design/M2.md's text on that point as it stands then, and add nothing the design lacks).

1. l.19-20 (model bullets): default continuous villager production sends each villager to its producer's rally.
2. l.53 and the bounds table: the per-step `walkSeconds` row gains `rally` (`produce`, `build`, `move`, `rally`); new row `start.villagers` values, int, 0..200, default the civ split.
3. l.116-122 Starting state: a build order's `start.villagers` replaces the civ split whole (omitted nodes get 0), is placed at t=0 with no walk, and must sum to the civ's starting villagers (sum of `civData.startingState.villagers.value`; 6 for English). `start.rally` is the rally for starting villager producers. Both `start` fields are optional and `start: {}` is valid.
4. l.124-129 Ordering and triggers: the same-instant rule. Steps start in list order before villagers spawn at that instant; a step armed by a spawn (`villagers` trigger) starts after the spawn. So `@T rally` routes the villager spawning at T, and `at N vils rally` routes villager N+1 on.
5. l.154-164 Task-switch walk: replace "once on `produce` with `rally`, from spawn to the node" with "every spawned villager walks once from spawn to its producer instance's rally node"; the walk comes from the rally source (the `rally` step or `produce` that set it) as `(source.walkSeconds ?? inputs.walkSeconds) / moveSpeedMultiplier`; `start.rally` routes use `inputs.walkSeconds`.
6. l.254 JSON: `BuildOrder` is `{ civ, name, source?, start?, steps }`; define `BuildStart { villagers?, rally? }` with the field meanings.
7. l.257-263 action table: `produce` row `rally?` becomes optional, villager only, sets the producer's standing rally (`walkSeconds?` only with `rally`); new `rally` row: `producer`, `instance?`, `to`, `walkSeconds?`, with the shared optional trigger.
8. l.272-276 paste table: add `rally <producer>[#k] -> <node> [walk Ns]`.
9. l.280-291 examples: add a `start` line first (for example `start 4 sheep 2 wood -> sheep`) and a `rally` line; the existing `produce villager ... -> sheep` line stays valid.
10. l.293-309 grammar: the `start` line, `start [N <node>]... [-> <node>]`, at least one part; at most one, before every step line, no trigger prefix; a repeated node, a second `start`, or a `start` after a step is `syntax`; `formatBuildOrderText` emits it first, nodes in `GatherNodeId` order. `walk Ns` is last on `rally` lines too, so the list at l.300 becomes `produce`, `build`, `move` and `rally`.
11. l.322 and l.324-326 Issues: drop "a villager `produce` without `rally`" from the `invalid` row and the following paragraph (a villager `produce` without `rally` is valid and uses the standing rally). List the `invalid` rules: `start.villagers` sum mismatch; `walkSeconds` without `rally` on `produce`; `rally` on a non-villager `produce`; a `rally` step whose `producer` is a known building that produces no villagers; no `start.rally` while a starting building is a villager producer; a `build` of a villager producer with no `start.rally` and no earlier baseId-wide rally source for that baseId. State `unknown-id` for an unknown `start` node key and `out-of-range` for a `start.villagers` value outside 0..200. State where each issue is reported: the step, the paste `start` line, or neither `step` nor `line` for JSON `start`.
12. New "Rally rules" subsection under Model rules, after Task-switch walk: villager producers (`producedBy` of the civ's `villager` entries; English `capital-town-center`, `town-center`, `kings-palace`); per-instance state `{ node, walkSeconds? }`; writers (`rally` step, villager `produce` with `rally`), last writer wins from the writer's `startedAt`; scope (`instance` = that instance; none = every existing instance of the baseId plus the default for the baseId's later instances); a new instance takes its baseId default, else `start.rally`; an instance-scoped rally for an unbuilt instance is held for it; spawned villagers are never re-routed (`move` does that); `rally` step timing (`startedAt = completedAt = armedAt`, `waitSeconds` 0, status `completed`, no cost or supply); the static validation rules make "a villager spawns with no rally in effect" impossible, so the engine reports no rally error.
13. Grep the rest of the doc (`rally`, `walkSeconds`, `startingState`, Extension points, the issues flowchart) and fix anything else these changes make untrue. Add to Extension points a row for military rally points and more `start` fields, as design/M2.md has.

**Out of scope:** code (`lib/aoe4-build-order/model.ts` types are a separate ticket), `docs/api/openapi.json`, `design/M2.md`, README or `data/` files, any rally behavior beyond design/M2.md.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `git grep -n "required for villagers" -- docs/aoe4-build-order.md` and `git grep -nE "villager .produce. without .rally." -- docs/aoe4-build-order.md` each find nothing (each finds one line on 68e004a).
- [ ] The `produce` row says `rally?` is optional, villager only, and sets the standing rally; a `rally` row lists `producer`, `instance?`, `to`, `walkSeconds?`.
- [ ] `BuildOrder` shows `start?` and `BuildStart { villagers?, rally? }`; the paste table has the `rally` line and the grammar has the `start` line with its three `syntax` cases.
- [ ] The bounds table has the `start.villagers` values row (int 0..200) and the per-step `walkSeconds` row names `rally`.
- [ ] The Task-switch walk bullet says every spawned villager walks from spawn to its rally node, with the source's `walkSeconds` and `inputs.walkSeconds` for `start.rally`.
- [ ] The `invalid` row and paragraph list exactly the six `start`/rally rules in Scope item 11, with the `unknown-id` and `out-of-range` cases for `start`, and no longer say a villager `produce` needs `rally`.
- [ ] A "Rally rules" subsection covers state, writers, scope, last-writer, new-instance default, held instance rally, no re-route, `rally` step timing, and the same-instant rule, each matching design/M2.md "Rally and start" word for word in meaning (reviewer compares).
- [ ] Starting state says `start.villagers` replaces the split whole, no walk, sum equals the civ's starting villagers (6 for English).
- [ ] The doc contains no decision history ("owner", "confirmed", dates); `git grep -ni "owner" -- docs/aoe4-build-order.md` finds nothing (finds nothing on 68e004a too).
- [ ] The doc and design/M2.md agree: every rule in design/M2.md "Rally and start" appears in the doc, and no rule appears in the doc that the design lacks.
- [ ] Only `docs/aoe4-build-order.md` changes; `npx tsc --noEmit` and `npm test` stay green.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
