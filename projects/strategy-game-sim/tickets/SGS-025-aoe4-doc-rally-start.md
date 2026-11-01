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
does; "owner confirmed" and decision history stay out. Transcribe from design/M2.md.

1. l.19-20 (model bullets): default continuous villager production sends each villager to its producer's rally.
2. l.53 and the bounds table: the per-step `walkSeconds` row gains `rally` (`produce`, `build`, `move`, `rally`); new row `start.villagers` values, int, 0..200, default the civ split.
3. l.116-122 Starting state: a build order's `start.villagers` replaces the civ split whole (omitted nodes get 0), is placed at t=0 with no walk, and must sum to the civ's starting villagers (sum of `civData.startingState.villagers.value`; 6 for English). `start.rally` is the rally for starting villager producers. Both `start` fields are optional in the schema and `start: {}` is well-formed (not a `syntax` issue), but an English order still needs `start.rally` because its starting `capital-town-center` is a villager producer (rework 1).
4. l.124-129 Ordering and triggers: the same-instant rule. Steps start in list order before villagers spawn at that instant; a step armed by a spawn (`villagers` trigger) starts after the spawn. So `@T rally` routes the villager spawning at T, and `at N vils rally` routes villager N+1 on.
5. l.154-164 Task-switch walk: replace "once on `produce` with `rally`, from spawn to the node" with "every spawned villager walks once from spawn to its producer instance's rally node"; the walk comes from the rally source (the `rally` step or `produce` that set it) as `(source.walkSeconds ?? inputs.walkSeconds) / moveSpeedMultiplier`; `start.rally` routes use `inputs.walkSeconds`.
6. l.254 JSON: `BuildOrder` is `{ civ, name, source?, start?, steps }`; define `BuildStart { villagers?, rally? }` with the field meanings.
7. l.257-263 action table: `produce` row `rally?` becomes optional, villager only, sets the producer's standing rally (`walkSeconds?` only with `rally`); new `rally` row: `producer`, `instance?`, `to`, `walkSeconds?`, with the shared optional trigger.
8. l.272-276 paste table: add `rally <producer>[#k] -> <node> [walk Ns]`.
9. l.280-291 examples: add a `start` line first (for example `start 4 sheep 2 wood -> sheep`) and a `rally` line; the existing `produce villager ... -> sheep` line stays valid.
10. l.293-309 grammar: the `start` line, `start [N <node>]... [-> <node>]`, at least one part; at most one, before every step line, no trigger prefix; a repeated node, a second `start`, or a `start` after a step is `syntax`; `formatBuildOrderText` emits it first, nodes in `GatherNodeId` order. `walk Ns` is last on `rally` lines too, so the list at l.300 becomes `produce`, `build`, `move` and `rally`.
11. l.322 and l.324-326 Issues: drop "a villager `produce` without `rally`" from the `invalid` row and the following paragraph (a villager `produce` without `rally` is valid and uses the standing rally). List the `invalid` rules: `start.villagers` sum mismatch; `walkSeconds` without `rally` on `produce`; `rally` on a non-villager `produce`; a `rally` step whose `producer` is a known building that produces no villagers; no `start.rally` while a starting building is a villager producer; a `build` of a villager producer with no `start.rally` and no earlier baseId-wide rally source for that baseId. State `unknown-id` for an unknown `start` node key and `out-of-range` for a `start.villagers` value outside 0..200. (respec 1) Rewrite the l.311-312 sentence ("A paste error carries the 1-based `line`; a step error carries `step`") to state the three cases from design/M2.md's Line map block: a paste step issue carries both `step` and `line`; a paste `start` issue carries `line` only; a JSON `start` issue carries neither (a JSON step issue carries `step` only). Rewrite the "reported on that step (`step`, or `line` for paste)" clause at l.325-326 to match. Do not describe `BuildOrderLines` or the parse/validate signatures; they stay in design/M2.md.
12. New "Rally rules" subsection under Model rules, after Task-switch walk: villager producers (`producedBy` of the civ's `villager` entries; English `capital-town-center`, `town-center`, `kings-palace`); per-instance state `{ node, walkSeconds? }`; writers (`rally` step, villager `produce` with `rally`), last writer wins from the writer's `startedAt`; scope (`instance` = that instance; none = every existing instance of the baseId plus the default for the baseId's later instances); a new instance takes its baseId default, else `start.rally`; an instance-scoped rally for an unbuilt instance is held for it; spawned villagers are never re-routed (`move` does that); `rally` step timing (`startedAt = completedAt = armedAt`, `waitSeconds` 0, status `completed`, no cost or supply); the static validation rules make "a villager spawns with no rally in effect" impossible, so the engine reports no rally error.
13. Grep the rest of the doc (`rally`, `walkSeconds`, `startingState`, Extension points, the issues flowchart) and fix anything else these changes make untrue. Add to Extension points a row for military rally points and more `start` fields, as design/M2.md has.

**Out of scope:** code (`lib/aoe4-build-order/model.ts` types are a separate ticket), `docs/api/openapi.json`, `design/M2.md`, README or `data/` files, any rally behavior beyond design/M2.md.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] (respec 1) `git grep -n "required for villagers" -- docs/aoe4-build-order.md` finds nothing (finds l.259 on 68e004a), and `git grep -nE "villager.{0,20} without .rally. is .invalid|or a villager .produce. without .rally." -- docs/aoe4-build-order.md` finds nothing (finds l.322 and l.325 on 68e004a). The second pattern targets only the removed claim; the required sentence "a villager `produce` without `rally` is valid and uses the standing rally" does not match it.
- [x] (respec 1) The Issues paragraph states that a paste step issue carries `step` and `line`, a paste `start` issue carries `line` only, and a JSON `start` issue carries neither; the old "A paste error carries the 1-based `line`; a step error carries `step`" sentence is gone, and the doc does not mention `BuildOrderLines`.
- [x] The `produce` row says `rally?` is optional, villager only, and sets the standing rally; a `rally` row lists `producer`, `instance?`, `to`, `walkSeconds?`.
- [x] `BuildOrder` shows `start?` and `BuildStart { villagers?, rally? }`; the paste table has the `rally` line and the grammar has the `start` line with its three `syntax` cases.
- [x] The bounds table has the `start.villagers` values row (int 0..200) and the per-step `walkSeconds` row names `rally`.
- [x] The Task-switch walk bullet says every spawned villager walks from spawn to its rally node, with the source's `walkSeconds` and `inputs.walkSeconds` for `start.rally`.
- [x] The `invalid` row and paragraph list exactly the six `start`/rally rules in Scope item 11, with the `unknown-id` and `out-of-range` cases for `start`, and no longer say a villager `produce` needs `rally`.
- [x] A "Rally rules" subsection covers state, writers, scope, last-writer, new-instance default, held instance rally, no re-route, `rally` step timing, and the same-instant rule, each matching design/M2.md "Rally and start" word for word in meaning (reviewer compares).
- [x] Starting state says `start.villagers` replaces the split whole, no walk, sum equals the civ's starting villagers (6 for English).
- [x] The doc contains no decision history ("owner", "confirmed", dates); `git grep -ni "owner" -- docs/aoe4-build-order.md` finds nothing (finds nothing on 68e004a too).
- [x] The doc and design/M2.md agree: every rule in design/M2.md "Rally and start" appears in the doc, and no rule appears in the doc that the design lacks.
- [x] Only `docs/aoe4-build-order.md` changes; `npx tsc --noEmit` and `npm test` stay green.
- [x] (respec 1) No INVARIANTS.md regressions; the doc stays consistent with the adjacent entries A2 (the `rally` step has no cost or supply), A3 (the same-instant ordering rule; rally state is a pure function of the order), and S3 (the new `start.villagers` bound, int 0..200).

## Open questions

None.

## Re-spec 2026-10-31

- Underspecified: AC1's `villager .produce. without .rally.` grep forbade the sentence Scope item 11 requires, and Scope carried a stale hedge about a line-map seam that design/M2.md already has (Line map block, c83ca33).
- Changed: AC1 now greps only the removed claim (l.322, l.325); Scope item 11 states the three issue-location cases from the Line map block and rewrites l.311-312 and l.325-326, with no `BuildOrderLines` or signatures; new AC for that; invariants A2, A3, S3 named. Risk stays standard.
- Existing branch work: none on this ticket; nothing to discard.

## Rework 1 - 2026-10-31 (review)

Bounced by review 1 (reports/SGS-025-review-1.md) at tip 548a923. No earlier gate passed the code.

Findings:
- `docs/aoe4-build-order.md:129`: "Both `start` fields are optional, and `start: {}` is valid" contradicts the doc's own rule at l.371 (no `start.rally` while a starting building is a villager producer is `invalid`). English always starts with `capital-town-center`, so `start: {}` and a start-less English order are always `invalid`.

Required fixes:
- [x] l.129: say the `start` fields are optional in the schema and `start: {}` is well-formed (not a `syntax` issue), and that an English order still needs `start.rally` because its starting town center is a villager producer. No new rule.
- [x] l.372: "rally source covering every instance" says baseId-wide (a `rally`/`produce` source with no `instance`), as design/M2.md does.
- [x] l.311: reword "each line stands alone" so it no longer implies `start` and `rally` lines have no effect on later lines.
- [x] l.376-378: reflow the paragraph broken mid-line.
