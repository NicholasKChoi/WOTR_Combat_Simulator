# SGS-027: Add the AoE4 effect interpreter, gather trip model and builder scaling

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.3 (builder scaling 3/(N+2), trip model, calculator cross-check; the engine, A2 and veterancy halves are later tickets)
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: changes what a simulation computes (gather rates, build times, production speed) and
       estimated 200-300 lines of business logic (over 150). Adjacent invariants: A1, A3. -->
- **LOC estimate**: ~230 business logic (`effects.ts` additions ~120: state type, target matching, condition check,
  `modifiedValue`; `gather.ts` ~70; `construction.ts` ~15; `rules/base.json` retune only if the cross-check forces it);
  tests on top
- **Depends on**: none (SGS-014 is merged: `model.ts`, `data.ts`, `effects.ts`, `rules/base.json`, `rules/english.json`)
- **On merge**: none
- **Source**: M2.3; design/M2.md "Engine rules" (trip model, construction, `productionSpeed`), "Rules files and loader"
  (`OverlayEffect.condition`); reports/M2-plan-2.md outline D; docs/aoe4-build-order.md "Trip model", "Construction",
  "Overlay effects", "Calibration and cross-check"

## Context

The engine (a later ticket) needs three pure pieces before it can credit income or time a build: one interpreter that
turns researched techs, completed buildings and `civData.effects` rows into a modified number, a trip model that turns
that into an effective gather rate, and the builder-count scaling of construction time. Splitting them out keeps the
engine free of rules (A1) and lets them be checked in isolation (A3: pure functions of their arguments).

## Scope

All edits in `lib/aoe4-build-order/` (on main 68e004a). No page, route, `model.ts` or `data.ts` type change.

1. **`effects.ts`** (existing; keep `SUPPORTED_EFFECT_PROPERTIES`, `IGNORED_EFFECT_PROPERTIES`, `classifyTech` as is). Add:
   - `EffectState` (exported, read-only): `{ data: GameData; age: number; buildings: ReadonlyMap<string, number>;
     researched: ReadonlySet<string> }` (`buildings` = completed building baseId -> count; `researched` = tech baseIds).
     It carries `data` so `modifiedValue` and `effectiveGatherRate` keep the design's signatures.
   - `ModifierTarget` (exported): `{ baseId: string; classes: readonly string[]; producer?: string }`.
   - `modifiedValue(base: number, property: string, target: ModifierTarget, state: EffectState): number`. Active effects
     are (a) `effects` of every `type: 'technology'` snapshot entry whose baseId is in `state.researched`
     (`data.byBaseId`), and (b) `data.civData.effects` rows whose `grantedBy` is `'civ'`, or a baseId present in
     `state.buildings` with count >= 1, or in `state.researched`. An effect applies when its `property` equals the argument,
     its `select` matches the target, and its `condition` holds. Only `type: 'passive'` and `effect` `change` or `multiply`
     are applied; any other effect is skipped, not applied (`classifyTech` rejects such techs before a run).
     Result = `(base + sum of change values) x product of multiply values`.
   - Selection: `select.id` matches when it contains `target.baseId`; `select.class` is a list of class sets and matches
     when every class of at least one set is in `target.classes`; an effect with both requires both; an empty `select`
     matches nothing.
   - Condition, every present field must hold: `age` equals `state.age`; `producer` equals `target.producer` (an absent
     `target.producer` fails it); `nearBuilding` scales the effect by coverage, see next bullet.
   - Coverage: `EffectState` also carries `coverage: Readonly<Record<string, number>>` (= `SimInputs.influenceCoverage`).
     `nearBuilding: b` scales a `multiply` value v to `1 + (v - 1) x c` and a `change` value to `value x c`, with
     `c = coverage[b]` when `state.buildings` has `b` with count >= 1, else 0 (so the effect is a no-op).
     A missing `coverage[b]` is 0. Look up with `Object.hasOwn`/`Map` style (a baseId such as `__proto__` must find nothing).
   - `productionSpeed` is a speed: the function returns the multiplier; the engine divides `costs.time` by it.
2. **`gather.ts`** (new): `effectiveGatherRate(node: GatherNodeId, state: EffectState, inputs: SimInputs): number`, per
   villager, in resource per second (the engine converts to per minute for `gatherRates`).
   - `rules = state.data.base.gatherNodes[node]`; villager target = `{ baseId: 'villager', classes }` with `classes` read
     from the snapshot entry `villager` (`data.byBaseId`).
   - `rate`: start from `rules.rate.value` and pass it through `modifiedValue` once per entry of `rules.rateProperties`, in
     order. `capacity`: same over `rules.capacityProperties`. `moveSpeedMultiplier = modifiedValue(1, 'moveSpeed', ...)`.
   - `walk` = `inputs.trips[node].walkSecondsCamp` when any baseId in `rules.dropOffs` is in `state.buildings` with
     count >= 1, else `walkSecondsTownCenter`. `cycle = capacity / rate + walk / moveSpeedMultiplier + dropOffSeconds`;
     return `capacity / cycle`.
3. **`construction.ts`** (new): `constructionSeconds(baseSeconds: number, builders: number, data: GameData): number` =
   `baseSeconds x numerator / (builders + offset)` with `numerator`, `offset` from `data.base.builderScaling`. Throws a
   `RangeError` naming the value when `builders` is not an integer >= 1 (input range 1..200 is enforced by validation).
4. **Calibration.** If the cross-check below fails at the stated tolerance, retune the `walkSecondsCamp`,
   `walkSecondsTownCenter` or `dropOffSeconds` `HandValue` in `data/aoe4-build-order/rules/base.json` (update its `source`),
   never code. Seeds already reproduce the calculator net rates within rounding (largest gap 0.006/min, farm), so no
   change is expected.
5. **Docs.** docs/aoe4-build-order.md already states these rules; check "Trip model", "Construction", "Overlay effects" and
   still read true, and add to its Overlay effects section one sentence naming the order
   `change` before `multiply`, and that a missing `influenceCoverage` entry means 0. Update the comment at the top of
   `effects.ts` only if it becomes wrong. Grep `modifiedValue|effectiveGatherRate|constructionSeconds` in `docs/` and
   `data/aoe4-build-order/README.md` for any claim the code contradicts.

**Out of scope:** the engine, queues, rally and walk-per-task-switch legs (`inputs.walkSeconds`), research timing,
paste parse and validation, `civ-rules.ts` hooks, `houses.ts`. Gather-rate sourcing (BACKLOG), Forestry and Crosscut
Saw's +5 capacity (owner kept both out of M2; they stay in the README known data gaps). Effects on non-villager targets
(fishing boats, scouts, siege) are matched by `select` and therefore not applied to villagers; no special handling.
No per-trip deposits; no `buildTime` property.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `constructionSeconds(100, n, data)` returns 100, 75, 50, 30 for n = 1, 2, 4, 8 with the English `GameData`; with a
      `GameData` whose `builderScaling.numerator` is 4 and `offset` 3 it returns `100 x 4 / (n + 3)`; `builders` of 0 or 1.5
      throws `RangeError`.
- [ ] Trip model: with no building in a node's `dropOffs`, `effectiveGatherRate` equals `capacity / (capacity / rate +
      walkSecondsTownCenter + dropOffSeconds)`; with a `lumber-camp` in `state.buildings` for `wood` it uses
      `walkSecondsCamp`. The test uses a `GameData` copy where camp and town-center walks differ (the seeds are equal), so
      swapping the two fails it.
- [ ] Wheelbarrow researched (`wheelbarrow` in `state.researched`): carry capacity +5 and `moveSpeed` x1.15 change the
      `sheep`/`wood` rate to the hand-computed value from the formula; the rate differs from the unresearched value.
- [ ] A gather-rate tech changes the rate: `double-broadax` raises `wood` by the cycle formula with rate x1.15;
      `shaft-mining` (overlay row, `grantedBy` research) raises `gold` and `stone` and does nothing to `wood`.
- [ ] English farm bonus: with `mill` in `state.buildings`, age 2 and coverage `{ mill: 1 }` the `farm` rate property is
      x1.25; with coverage `{ mill: 0.5 }` it is x1.125; at age 3 x1.3; with no mill, or coverage missing, x1.0.
- [ ] King's Palace: `modifiedValue(1, 'productionSpeed', villager target with producer 'kings-palace', state)` is 1.1 when
      `kings-palace` is a completed building and 1 when it is not; with `producer: 'capital-town-center'` or no `producer`
      it is 1 (the row's `condition.producer` fails).
- [ ] `select` matching: an effect whose `select.id` omits `villager` (fishing-boat techs such as `extended-lines`) leaves a
      villager value unchanged; a `select.class` set matches only when all its classes are on the target.
- [ ] Calculator cross-check (test labeled as a cross-check only): for sheep, berry, deer, farm, wood, gold and stone with
      the default `SimInputs`, no techs and no buildings, `effectiveGatherRate x 60` is within 0.05 per minute of the net
      rate in that node's `walkSecondsCamp.source` (37.05, 32.93, 41.7, 36.718, 31, 37, 37); boar has no calculator value
      and is excluded. The expected numbers live in the test, not in `lib/` or `data/` (A1).
- [ ] Determinism: calling each function twice with the same arguments gives identical numbers, and neither mutates
      `state` or `data` (the frozen `GameData` would throw). No `Math.random`, `Date`, or module-level mutable state in the
      three files (`git grep -nE "Math\.random|Date\.now|new Date" lib/aoe4-build-order/{effects,gather,construction}.ts` finds none).
- [ ] No game number appears in the three files other than `0`, `1` and the identity `base`: changing an `OverlayEffect`
      value or a `rules/base.json` value in a test `GameData` changes the output (A1).
- [ ] `npm test`, `npx tsc --noEmit` pass; existing `effects.test.ts` and `data.test.ts` unchanged and green.
- [ ] No INVARIANTS.md regressions

## Open questions

None for the owner. Contract choices made here for the designer to confirm if wanted: `EffectState` carries `data` and
`coverage` so the design's `modifiedValue(base, property, target, state)` and `effectiveGatherRate(node, state, inputs)`
signatures stay as written; `effectiveGatherRate` takes a `GatherNodeId` (not `GatherNodeRules`) because `inputs.trips` is
keyed by it. The engine ticket builds `EffectState` from its own state.
