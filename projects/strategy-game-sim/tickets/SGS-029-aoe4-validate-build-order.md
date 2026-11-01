# SGS-029: Validate build orders and resolve simulation inputs

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.4 (rejections), S3 bounds
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: public input contract (the issue codes and BuildOrder acceptance every caller sees), the S3 bound table, and over 150 lines of business logic. -->
- **LOC estimate**: ~330 (new `lib/aoe4-build-order/validate.ts`: shape, ids, tech, bounds, rally/start, producer-capability and repeat-research rules, `resolveSimInputs`; tests and a ~5-line doc paragraph on top)
- **Depends on**: SGS-025 (doc), SGS-026 (types). SGS-028 (parser) is a sibling; this ticket must not import `parse-text.ts`.
- **On merge**: none
- **Source**: design/M2.md Contracts (Route request and issues, Issue codes, Line map, Rally and start, Producer capability, Repeat research, bounds table, Route); reports/M2-designer-line-map.md; reports/M2-designer-wave2.md (answers 3, 4); reports/M2-designer-wave4.md (trips merge); reports/M2-designer-wave5.md (decision 2, repeat research); docs/aoe4-build-order.md (as updated by SGS-025); plan outline M, spec gaps T1, T3

## Context

Every input path (paste text after parsing, JSON body) reaches the engine through `validateBuildOrder`, and the route also
resolves `SimInputs` through `resolveSimInputs`. Together they enforce the S3 caps and turn every bad input into a
`BuildOrderIssue` instead of a throw or a runaway simulation. The rally and `start` rules make "a villager spawns with
no rally in effect" impossible, so the engine needs no runtime rally error.

## Scope

New file `lib/aoe4-build-order/validate.ts` (does not exist on main 68e004a) and `validate.test.ts` beside it, styled
like `effects.test.ts` (Vitest, `loadGameData('english')`). Uses `GameData` (`byBaseId`, `base`, `civData`), `classifyTech`
(`effects.ts`) and, from SGS-026, `BuildOrder`, `BuildStep`, `BuildStart`, `BuildOrderLines`, `BuildOrderIssue`, `SimInputs`. Type names are not redefined here.

**Exports (exactly these four, matching the design Modules row):**

- `validateBuildOrder(input: unknown, data: GameData, options?: ValidateOptions)` with
  `interface ValidateOptions { lines?: BuildOrderLines }`. Returns `{ ok: true; order: BuildOrder } | { ok: false; issues: BuildOrderIssue[] }`
  (the shape fixed in the design Line map block; the union stays unnamed, inferred and not exported; callers narrow on `ok`). Never throws, whatever `input` is.
  All issues are collected, in list order: top level first (`civ`, `name`, `start`, `steps` shape), then `start` rules, then
  steps in index order, fields in the order the step is declared in design/M2.md. `issues[0]` is therefore stable (the route uses its message as `error`).
- `resolveSimInputs(partial: unknown, data: GameData)`: returns `{ ok: true; inputs: SimInputs } | { ok: false; issues: BuildOrderIssue[] }` (Line map block shape; unnamed, not exported). Its issues never carry `step` or `line`; messages name the field path (`inputs.durationSeconds`, `inputs.trips.farm.walkSecondsCamp`).
- `SIM_INPUT_BOUNDS`: a read-only record, one `{ min, max, integer }` entry per row of the design bounds table, keyed `textChars` (20000, enforced by the route), `steps` (max 200), `durationSeconds` (60..3600), `triggerSeconds` (0..3600), `triggerCount` (1..200), `count` (`produce.count`, `move.count`, 1..200), `builders` and `houseBuilders` (1..200), `instance` (1..200), `walkSeconds` (0..60, `SimInputs` and per-step), `startVillagers` (0..200), `walkSecondsCamp`, `walkSecondsTownCenter` (0..60), `dropOffSeconds` (0..30), `influenceCoverage` (0..1, not integer). The route (SGS-033) imports this and the value of `textChars`.
- `ValidateOptions`.

**Checks in `validateBuildOrder`** (every message names the step (`steps[i]`, or `line N` when `options.lines` gives one) and the offending id, kind or property):

1. Shape (`syntax`): `input` is an object; `civ` and `name` strings; `source` a string when present; `steps` an array; `start` an object when present (`villagers` an object of numbers, `rally` a string); each step an object with a string `action` among `produce|rally|pause|build|research|move`, and the fields of that variant (design Contracts block) present and correctly typed; `trigger` an object with a string `kind` and a numeric `seconds`/`count` for its kind. Extra, unknown properties on `input`, `start`, steps and triggers are ignored. A step with a shape issue gets no further checks.
2. `unknown-trigger-kind`: a `kind` string other than `time` or `villagers` (for example `{"kind":"resource"}`).
3. `unknown-id`: `civ` not equal to `data.civ`; `produce.producer`, `rally.producer`, `pause.producer`, `build.building`, `research.at` not a building baseId in `data.byBaseId`; `produce.unit` not a unit baseId; `research.tech` not a technology or upgrade baseId; any node (`rally`, `from`, `then`, `to`, `start.rally`, `start.villagers` keys) not a key of `data.base.gatherNodes`. Look ids up through the `Map`s and `Object.hasOwn`, never by indexing (user key `__proto__` must find nothing).
4. Tech: for `research`, `classifyTech(entry, data)`; `rejected` becomes an issue with the tech's code, naming tech and property (`forestry` -> `unknown-tech-effect`; `military-academy` -> `unsupported-tech`, property `buildTime`); `effects-ignored` and `effects-unmodeled` are accepted (the engine adds the notes).
5. `out-of-range`: every number against `SIM_INPUT_BOUNDS` (trigger `seconds`/`count`, `instance`, `count`, `builders`, per-step `walkSeconds` on `produce|rally|build|move`, `start.villagers` values), non-integer where `integer`, non-finite; `steps.length > 200` is one `out-of-range` issue and per-step checks are skipped (bounded work on hostile input).
6. `invalid` (design "Rally and start"): `start.villagers` values (all valid, keys known) not summing to the sum of `data.civData.startingState.villagers.value` (6 for English); `produce.walkSeconds` without `rally`; `rally` on a `produce` whose unit is not `villager`; a `rally` step whose `producer` is a known building that produces no villagers; no `start.rally` while a building in `data.civData.startingState.buildings.value` is a villager producer (message names it; English `capital-town-center`); a `build` of a villager producer with neither `start.rally` nor an earlier (lower step index) baseId-wide rally source for that baseId, where a source is a `rally` step or a villager `produce` with `rally`, with no `instance`, and `producer` equal to that baseId. Villager producers are the union of `producedBy` over `data.byBaseId.get('villager')` (snapshot: `capital-town-center`, `kings-palace`, `town-center`). A villager `produce` without `rally`, and `start: {}` or no `start`, pass the other rules in this list; `start: {}` or no `start` still fails the starting-building rule above, because English starts with a villager producer.
7. `invalid` (design "Producer capability"; the engine assumes both hold and has no runtime check): a `produce` whose `producer` is not in the union of `producedBy` over every `data.byBaseId.get(unit)` entry (all tiers), message naming the step or line, the producer and the unit (`produce villager from house` fails, `from kings-palace` passes); a `research` with `at` where `at` is not in the union of `producedBy` over the tech's entries, message naming the step or line, the tech and the building (`wheelbarrow at house` fails, `at mill` passes: snapshot `wheelbarrow-1` `producedBy: ['mill']`). No check when `at` is absent. Each runs only after that step's ids resolved: a step whose `producer`, `unit`, `tech` or `at` is `unknown-id` gets no producer-capability issue. An entry above the current age is not this rule (the engine makes the step wait).
8. `invalid` (design "Repeat research"; the engine assumes it holds and has no runtime check) (respec 3): a `research` step whose `tech` equals the `tech` of an earlier (lower step index) `research` step. The issue is on the later step only, and its message names the tech and the earlier step (`steps[j]`, or `line N` when `options.lines?.steps[j]` is a number). With three of the same tech, steps 2 and 3 each get one issue naming step 1 (the first). Compared by baseId as written; `at` does not matter (`wheelbarrow` then `wheelbarrow at mill` is a repeat). Runs only after ids resolve: a `research` step whose `tech` is `unknown-id` neither gets nor causes a repeat issue (an earlier step with an unknown tech is not an "earlier step" for this rule); a tech that is `rejected` by check 4 likewise does not count. `wheelbarrow` then `textiles` gives no issue.
9. Issue location: a step issue has `step: i` and, when `options.lines?.steps[i]` is a number, `line` equal to it; a `start` issue has no `step` and `line: options.lines.start` when present; top-level issues (`civ`, `name`, `steps`) have neither. A missing line entry omits `line` and never throws, including when `lines.steps` is shorter than `steps`. Without `options` no issue has a `line`.

**`resolveSimInputs(partial, data)`:** `undefined`/`null` behaves as `{}`; any other non-object is `syntax`. Absent fields take defaults: `trips` per node from `data.base.gatherNodes[node].trip.*.value`, `walkSeconds` from `data.base.walkSeconds.value` (A1: both read from data, never typed in code); `durationSeconds` 1200, `autoHouses` true, `houseBuilders` 1, `houseBuilderSource` `'wood'`, `influenceCoverage` `{ mill: 1 }` are input defaults kept as private constants beside the bounds (not game numbers). (respec 2) Every absent field at any depth takes its default: `trips` merges per node and then per field (each `trips.<node>` may be partial), `influenceCoverage` per key; `{ trips: { farm: { walkSecondsCamp: 3 } } }` changes only that one value, and the other farm fields and every other node keep their defaults. The signature stays `partial: unknown`; the override types (`SimInputOverrides`, `TripInputOverrides`) live in `api.ts` (SGS-033), not here. Each supplied field is type-checked (`syntax`) and bounded (`out-of-range`); an unknown `trips` node key or `houseBuilderSource` is `unknown-id`; an `influenceCoverage` key that is not a building baseId is `unknown-id`. Extra unknown properties are ignored. The returned object and its nested `trips` are fresh copies (the frozen `GameData` is never shared or mutated). No `rules` parameter in v1: no civ has a `startingState` hook and `CivRules` does not exist yet; a later civ adds `rules` to `ValidateOptions`.

**Doc:** `docs/aoe4-build-order.md` is otherwise updated by SGS-025. This ticket adds one short paragraph under the bounds table (after SGS-025's edits) stating what the doc is silent on: unknown extra properties are ignored; omitted `inputs` fields take their defaults at any depth, with `trips` merged per node and then per field and `influenceCoverage` per key (example `{ trips: { farm: { walkSecondsCamp: 3 } } }`) (respec 2); more than 200 steps is one `out-of-range` issue. It also adds the two producer-capability rules (check 7) to the `invalid` rule list SGS-025 writes under Issues (six `start`/rally rules), and the repeat-research rule (check 8) (respec 3), so the list has nine, and states that the engine assumes them. (respec 1) Grep `docs/aoe4-build-order.md` for `validateBuildOrder`, `resolveSimInputs`, `SIM_INPUT_BOUNDS` and fix any sentence that disagrees with the above.

**Out of scope:** parsing (`parse-text.ts`, SGS-028) and the 20,000-character check (route, SGS-033, which reads `SIM_INPUT_BOUNDS.textChars`); the route and OpenAPI; the engine and its handling of steps (it may assume producer capability holds and that no tech is researched twice); `ValidateOptions.rules`; changes to `model.ts` or `effects.ts`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `validate.ts` exports exactly `validateBuildOrder`, `resolveSimInputs`, `SIM_INPUT_BOUNDS`, `ValidateOptions` (`git grep -nE "^export " -- lib/aoe4-build-order/validate.ts` lists four; no exported result type); both return types match the design Line map block; it does not import `parse-text`. (respec 1)
- [ ] A valid order (`start` with `villagers` summing to 6 and `rally`, a villager `produce` from `capital-town-center` without `rally`, a `rally` step, a `build` of `house`, `research` of `wheelbarrow` with `at: 'mill'` and of `survival-techniques` without `at`) returns `ok: true`. (respec 3: the earlier `wheelbarrow` twice is now a repeat)
- [ ] Each issue code is produced with a message naming the step or line and the offending id, kind or property: `syntax` (non-object step, missing field, mistyped field, unknown `action`, wrong-typed `trigger`), `unknown-trigger-kind` (`{"kind":"resource"}` rejected), `unknown-id` (unit, producer, building, tech, node, `civ`, `start` node key, `rally.to`), `unsupported-tech` and `unknown-tech-effect` (`military-academy`, `forestry`; `forestry-1` is `unknown-id` because ids are baseIds), `out-of-range`, `invalid`.
- [ ] A Blacksmith technology (`bloomery`) and `shaft-mining` are accepted.
- [ ] Every `SIM_INPUT_BOUNDS` row is exercised at min, max and just outside (including `start.villagers` values -1 and 201, `walkSeconds` 60 and 60.5 on a `rally` step, non-integer `count`, `Infinity`); 201 steps gives one `out-of-range` issue and 200 steps is accepted.
- [ ] Each of the nine `invalid` rules has a failing case and a passing neighbour (sum 5 and 7 fail, 6 passes; `walkSeconds` with and without `rally`; `rally` on `scout` fails; `rally` step on `house` fails and on `town-center` passes; `start` without `rally` fails naming `capital-town-center`; `build` of `town-center` and of `kings-palace` fails without `start.rally` or an earlier baseId-wide source, passes with `start.rally`, with an earlier `rally` step, or with an earlier villager `produce` with `rally`, and still fails when the earlier source has `instance` or comes later in the list; `produce villager from house` fails naming `house` and `villager`, `produce villager from kings-palace` passes; `research wheelbarrow at house` fails naming `wheelbarrow` and `house`, `at mill` passes, and without `at` passes; `research wheelbarrow` twice gives exactly one `invalid` issue, with `step: 1`, its message naming `wheelbarrow` and `steps[0]` (or `line N` of step 0 when `options.lines` is given), and `research wheelbarrow` then `research textiles` gives none). (respec 1) (respec 3)
- [ ] Producer capability runs only after ids resolve: `produce villager from no-such-building` and `research no-such-tech at house` each give exactly one issue, `unknown-id`, and no `invalid`. (respec 1) Repeat research runs only after ids resolve: `research no-such-tech` twice gives exactly two issues, both `unknown-id`, and no `invalid`. (respec 3)
- [ ] A JSON `start` issue carries neither `step` nor `line`; with `options.lines` a paste `start` issue carries `line: lines.start` and a step issue carries `step` and `line: lines.steps[i]`; a `lines.steps` shorter than `steps` omits `line` and does not throw; without `options` no issue has `line`.
- [ ] `validateBuildOrder` returns `ok: false` and does not throw for `null`, a string, an array, `{}`, a step list containing `null`, and a `start.villagers` object with an own `__proto__` key (from `JSON.parse`).
- [ ] `resolveSimInputs({}, data)` returns the defaults; a `GameData` built with `buildGameData` from a copy of `rules/base.json` with a changed `walkSeconds` and a changed `trips.farm.walkSecondsCamp` returns those values (A1: mutating the data changes the result); `{ trips: { farm: { walkSecondsCamp: 3 } } }` changes only `trips.farm.walkSecondsCamp` (other farm fields and every other node equal the defaults), and a partial `influenceCoverage` merges per key (respec 2); each field's `out-of-range`, `syntax` and `unknown-id` case is rejected with a path-naming message and no `step`/`line`; mutating the returned `trips` leaves `data` and a second call's result unchanged.
- [ ] `docs/aoe4-build-order.md` has the paragraph above, its Issues `invalid` list names all nine rules (including `produce` producer and `research` `at` capability, and repeat research) (respec 3), and no sentence disagrees with `validate.ts`. (respec 1) The paragraph states the per node, then per field `trips` merge with the example. (respec 2)
- [ ] `npx tsc --noEmit` and `npm test` pass.
- [ ] No INVARIANTS.md regressions (S3: every numeric input is bounded; A1: no game number in `validate.ts`; A3: no clock or randomness)

## Open questions

None.

## Re-spec 2026-10-31

- Underspecified: whether `validateBuildOrder` checks producer capability, and whether the result unions are named.
- Changed: two `invalid` rules (produce producer, research `at`) from design "Producer capability", now eight, with failing/passing and resolve-first cases; result shapes pinned to the Line map block, unnamed; open question removed.
- Branch work: none yet (no branch); nothing to keep or discard.

## Re-spec 2026-10-31 (2)

- Underspecified: how deep the `trips` merge goes ("per key" read as whole-node replacement).
- Changed: design "Route request and issues" (wave 4) pins per node, then per field; rule text, doc paragraph and the `resolveSimInputs` acceptance line now say so with `{ trips: { farm: { walkSecondsCamp: 3 } } }`; signature unchanged, override types stay in SGS-033's `api.ts`.
- Branch work: none yet (no branch); nothing to keep or discard.

## Re-spec 2026-10-31 (3)

- Underspecified: a second `research` of the same tech (design wave 5 "Repeat research" makes it a validation issue; the engine has no runtime check).
- Changed: ninth `invalid` rule (check 8, issue on the later step naming the earlier one, after ids resolve) with failing, passing and resolve-first cases; the valid-order criterion no longer researches `wheelbarrow` twice; docs list says nine.
- Branch work: none yet (no branch); nothing to keep or discard.
