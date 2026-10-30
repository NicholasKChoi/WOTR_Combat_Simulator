# SGS-014: Add the English aoe4world snapshot, rules files, model types and data loader

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.2 (and the type half of M2.3, M2.4)
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: defines cross-module contracts (model.ts types, GameData, classifyTech, rules-file schema) that
       every later AoE4 ticket reads; adjacent invariant A1 (game numbers only from patch-labeled data files). -->
- **LOC estimate**: ~320 business logic (model.ts types ~120, data.ts ~110, effects.ts classification ~90), plus
  ~310 KB of data files (English snapshot, two rules files) and tests
- **Depends on**: SGS-012
- **On merge**: none
- **Source**: M2.2; design/M2.md Modules, Contracts (`model.ts` block, "Rules files and loader" block, Engine rules
  `classifyTech` bullet, "Starting units" paragraph); reports/M2-plan.md outline B; reports/M2-research-1.md, -2.md, -4.md, -5.md; owner answers 2026-10-30

## Context

The engine, validator and route all need typed game data, but no AoE4 code or data exists yet (`data/` and
`lib/aoe4-build-order/` are absent on `origin/main` 6013fcc). This ticket commits the pinned English aoe4world snapshot and
the hand-entered rules files, defines the shared types, and adds the loader and tech classifier. Every game number comes from
these files (A1); later tickets read the exports named here and add no constants of their own.

## Scope

Exploration (aoe4world/data at `e89f01e598998bf76bdddfbf2afce1659fee00cf`, committed 2026-10-28T23:06:27Z, the latest when this
ticket was written; the implementer may pin a newer commit and records whichever it uses): `<kind>/all.json` for
`units`, `buildings`, `technologies`, `upgrades` in that repo is byte-identical to `data.aoe4world.com/<kind>/all.json`. Filtered
to entries whose `civs` contains `en` it holds 43 units, 30 buildings, 69 technologies and 11 upgrades (153 entries, every `id`
unique; about 183 KB compact, about 309 KB with 2-space indent). Properties used by English technology `effects` (23): the 11
supported ones minus `farmGatherRate`, `berryGatherRate`, `productionSpeed` (no English tech uses them), plus `buildTime`,
`unknown` and 13 combat or non-economy stats. The English snapshot has two town-center buildings: `capital-town-center-1`
(classes include `town_center_capital`, `landmark`; the starting town center) and `town-center-1` (`town_center_non_capital`;
the buildable one); `kings-palace-2` has `town_center_non_capital` and its description is "Acts as a Town Center. Produces
Villagers +10% faster."; villager `producedBy` is `capital-town-center, kings-palace, town-center`. Every English building has
`costs.popcap` 0.

### 1. Snapshot: `data/aoe4-build-order/aoe4world/english.json`

Top level `{ source, units, buildings, technologies, upgrades }` (design "Modules"). Each array holds the upstream entries
verbatim (all fields kept, upstream order), filtered to `civs` containing `en`, written with 2-space indent. `source` is a
`SnapshotSource` `{ repo, commit, committedAt, fetchedAt, patch, patchSource }`: `repo` `aoe4world/data`; `commit` the full
40-character sha; `committedAt` and `fetchedAt` ISO 8601; `patch` the game patch live on `committedAt` (the upstream files carry
none, so the implementer looks it up and `patchSource` is the URL it came from); if no citable patch is found, stop and report
instead of writing a guess.

### 2. Refresh procedure: `data/aoe4-build-order/README.md`

States the steps to refresh the snapshot (fetch the four `all.json` files at a chosen commit, filter by `civs`, write
`english.json`, update `source`), how hand-entered values are labeled (`HandValue`: `source`, `unverified`), and the "Known data
gaps" listed below. A small filter script next to it (for example `refresh-snapshot.mjs`) is allowed; it is not imported by the
app.

### 3. Rules files (hand-entered; every leaf is a `HandValue<T>` or an `OverlayEffect`, each with a non-empty `source`)

`unverified` is `true` for every value except the three carry capacities the owner observed in game (sheep, deer, boar; see the
table), which are `unverified: false` with `source` "owner, in-game observation 2026-10-30". (respec 1)

`data/aoe4-build-order/rules/base.json` (`BaseRules`; keys exactly `gatherNodes`, `builderScaling`, `maxPopCap`, `walkSeconds`)
(respec 1):

- `gatherNodes`: one `GatherNodeRules` per `GatherNodeId` (`sheep, berry, deer, boar, farm, wood, gold, stone`) with
  `resource`, `rate` (resources per second), `capacity`, `rateProperties[]`, `capacityProperties[]`, `dropOffs[]` (camp baseIds
  only; the town center is the fallback in the trip model) and `trip` (`walkSecondsCamp`, `walkSecondsTownCenter`,
  `dropOffSeconds`, each a `HandValue<number>`). Rates and the non-owner capacities cite research 1's sources (fandom wiki
  "Resource (Age of Empires IV)" and "Villager (Age of Empires IV)", read 2026-10-30, patch not stated):

  | node | resource | rate /s | capacity | rateProperties | capacityProperties | dropOffs |
  |---|---|---|---|---|---|---|
  | sheep | food | 0.75 | 10 (owner, in-game, `unverified: false`) | `foodGatherRate` | `carryCapacity` | `mill` |
  | berry | food | 0.69 (since update 12.0.1974) | 10 | `foodGatherRate`, `berryGatherRate` | `carryCapacity` | `mill` |
  | deer | food | 0.825 | 25 (owner, in-game: 25, 30 with Wheelbarrow; `unverified: false`) | `huntGatherRate` | `carryCapacity`, `huntCarryCapacity` | `mill` |
  | boar | food | 0.9 | 25 (owner, in-game: 25, 30 with Wheelbarrow; `unverified: false`) | `huntGatherRate` | `carryCapacity`, `huntCarryCapacity` | `mill` |
  | farm | food | 0.75 | 10 | `foodGatherRate`, `farmGatherRate` | `carryCapacity` | `mill` |
  | wood | wood | 0.75 | 10 | `woodGatherRate` | `carryCapacity` | `lumber-camp` |
  | gold | gold | 0.75 | 10 | `goldGatherRate` | `carryCapacity` | `mining-camp` |
  | stone | stone | 0.75 | 10 | `stoneGatherRate` | `carryCapacity` | `mining-camp` |

  (respec 1) Hunt nodes keep `carryCapacity` because the owner observed Wheelbarrow's +5 on hunted meat (25 -> 30). Hunt nodes
  exclude `foodGatherRate` because the snapshot descriptions of horticulture-2, fertilization-3 and precision-cross-breeding-4
  say "Does not apply to hunted meat"; sheep are not hunted meat (capacity 10), so sheep use `foodGatherRate`, not
  `huntGatherRate`. Each `dropOffs` baseId must be an English snapshot building with class `resource_drop_off`.
- `trip` seeds: the calculator values are net rates, so the seed is the per-trip overhead `t = capacity / (net per minute / 60)
  - capacity / rate`, put entirely in both `walkSecondsCamp` and `walkSecondsTownCenter` with `dropOffSeconds` 0, so the seed
  reproduces the calculator rate under `cycle = capacity / rate + walk + dropOff`. `source` says so (calculator
  SichYuriy/aoe4-production-calculator `src/data/BaseGatheringRates.ts`, derived; split between walk and drop-off unknown;
  the engine ticket retunes). Net per minute: sheep 37.05, berry 32.93, deer 41.7, farm 36.718, gold 37, stone 37, wood 31.
  Resulting seeds in seconds: sheep 2.86, berry 3.73, deer 5.67, farm 3.01, gold 2.88, stone 2.88, wood 6.02. (respec 1) Boar:
  5.67 in both walk fields and `dropOffSeconds` 0, `source` "no source; copied from deer, nearest analogue (no calculator
  value for boar)", `unverified: true`.
- `builderScaling`: `{ numerator: HandValue<number> = 3, offset: HandValue<number> = 2 }` (build time = base x numerator /
  (builders + offset)); source fandom "Villager (Age of Empires IV)", Building construction section, no patch stated.
- `maxPopCap`: 200; source CONTEXT.md owner decision with the gamewatcher population-limit page from research 5 (10 + 19 houses
  x 10).
- (respec 1) `walkSeconds`: 5, `unverified: true`, `source` "owner assumption: about 5-6 tiles at villager speed 1.12 tiles/s,
  no measurement" (design "Rules files and loader"). Replaces the former `reassignSeconds` and `builderWalkSeconds`.

`data/aoe4-build-order/rules/english.json` (`CivData`; keys exactly `startingState`, `supply`, `effects`, `upgradeTargets`):

- (respec 1) `startingState`, each field a `HandValue`, sources from research 5 (fandom "English", "Early Economy (Age of
  Empires IV)", "Sheep"; AoE forum "Start with more villager than 6?"; diamondlobby build guides), all `unverified: true`:
  - `age`: 1.
  - `resources`: `{ food: 200, wood: 200, gold: 100, stone: 0 }` (fandom "English" starting resources; stone 0 is the owner's
    answer, no source lists it; the `source` text says so).
  - `villagers`: `{ sheep: 6, berry: 0, deer: 0, boar: 0, farm: 0, wood: 0, gold: 0, stone: 0 }`.
  - `buildings`: `['capital-town-center']` (the starting town center is the capital entry; see the Scope exploration note).
  - (respec 2) `units`: `{ scout: 1 }` (unit `baseId` -> count of non-villager units at t=0; design "Starting units"). At
    `e89f01e` the English snapshot has exactly one scout entry, `scout-1`, `baseId` `scout`, age 1, `costs.popcap` 1. The
    engine counts these toward population (English starts 7/10: 6 villagers + 1 scout) and never lists them in
    `unitsProduced`; this ticket only writes and checks the data. Sheep are not units: the five starting sheep stay the `sheep`
    gather node.
- (respec 1) `supply: Record<baseId, HandValue<number>>`, all `unverified: true` (the snapshot carries no supply):
  `capital-town-center` 10 and `town-center` 10 (fandom "Town Center (Age of Empires IV)" and "Capital Town Center": "provides
  ten population"; both are keyed because an English player starts with the capital and can build further town centers),
  `house` 10 (fandom "House (Age of Empires IV)"), `kings-palace` 10 (fandom "King's Palace" infobox Pop 10). No other
  landmark has a row (owner: they add none). Starting pop cap 10 = the `capital-town-center` row; no separate field.
- (respec 1) `effects: OverlayEffect[]` with exactly seven rows, each `type: passive`, `select: { id: ['villager'] }`:
  - Farm bonus, four rows: `property: farmGatherRate`, `effect: multiply`, `grantedBy: 'civ'`,
    `condition: { age: 1 | 2 | 3 | 4, nearBuilding: 'mill' }` (age is the exact current age), `value` 1.2, 1.25, 1.3, 1.3.
    `source`: the `influences` text of `farm-1` and `mill-1` in the snapshot ("Farm harvest rate increased +20%/+25%/+30%/+30%
    by Age while within the influence of a Mill."); `unverified: true`.
  - King's Palace: `property: productionSpeed`, `effect: multiply`, `value` 1.1, `grantedBy: 'kings-palace'`,
    `condition: { producer: 'kings-palace' }`; `source` the snapshot description of `kings-palace-2` ("Produces Villagers +10%
    faster."); `unverified: true` (design "Rules files and loader", last bullet).
  - Shaft Mining, two rows: `goldGatherRate` and `stoneGatherRate`, `effect: multiply`, `value` 1.15,
    `grantedBy: 'shaft-mining'`, no `condition`; `source` the snapshot description of `shaft-mining-3` ("Increase Villagers'
    gathering rate for Gold and Stone by 15%.", its `effects` is empty) and fandom "Shaft Mining" (read 2026-10-30);
    `unverified: true`.
- `upgradeTargets: Record<upgrade baseId, HandValue<unit baseId>>`, 11 rows, source "snapshot upgrade entry description and the
  unit entry at the same `age`", `unverified: true`:
  `early-men-at-arms`, `men-at-arms`, `elite-men-at-arms` -> `man-at-arms`; `veteran-spearmen`, `elite-spearmen` -> `spearman`;
  `veteran-horsemen`, `elite-horsemen` -> `horseman`; `veteran-longbowmen`, `elite-longbowmen` -> `longbowman`;
  `elite-crossbowmen` -> `crossbowman`; `elite-knights-or-lancers` -> `knight`. Checked against the snapshot: every target has a
  unit entry whose `age` equals the upgrade's `age` (2, 3 or 4).

### 4. Types: `lib/aoe4-build-order/model.ts`

Exactly the design's `model.ts` Contracts block, with its names and shapes: `CivId, ResourceKind, GatherNodeId, Trigger,
BuildStep, BuildOrder, HandValue, TripInputs, SimInputs, UnitSeries, StepTiming, SimulationResult, BuildOrderIssue,
BuildOrderNote, TechSupport, OverlayEffect` (respec 1: `TechSupport` includes `{ kind: 'effects-unmodeled' }`; `BuildOrderNote.code`
is `'tech-effect-ignored' | 'tech-effect-unmodeled'`; `SimInputs` has `walkSeconds` and no reassign or builder-walk field;
`OverlayEffect.condition` is `{ age?, nearBuilding?, producer? }`). `OverlayEffect extends SnapshotEffect`, so `model.ts`
imports the `SnapshotEffect` type from `data.ts` (`import type`, no runtime cycle). Type-only module, no runtime code, no React
or Next imports.

### 5. Loader: `lib/aoe4-build-order/data.ts`

(respec 1) Exports `loadGameData(civ: CivId): GameData` and the design's types `GameData`, `SnapshotEntry`, `SnapshotEffect`,
`SnapshotSource`, `BaseRules`, `GatherNodeRules`, `CivData`, with exactly the design's fields (`GameData`: `civ, source, byId,
byBaseId, base, civData, supply, upgradeTargets`). The JSON is read with static `import` (resolved by the bundler, so no `fs`
path to trace on Vercel; `resolveJsonModule` is already on), cast through those types.

- `byId` holds unit, building, technology and upgrade entries by `id` (`wheelbarrow-1`); `byBaseId` the same entries by
  `baseId`, ascending `age`; `supply` and `upgradeTargets` are `Map`s built from `civData`. A user-supplied id such as
  `constructor` or `__proto__` finds nothing.
- `loadGameData` is synchronous, builds the indexes once per civ at first call, returns the same deep-frozen instance every
  time (the engine must not be able to mutate shared data between requests; A3), and throws `Error` for a civ with no data or
  for a duplicate `id` across the four arrays.
- (respec 2) It also throws `Error` when a `civData.startingState.units` key does not resolve in `byBaseId` to an entry with `type: 'unit'`
  (design "Starting units": the loader fails on an unknown id); the message names the key.
- No validation of rules content beyond that; the other reference checks live in the tests below.

### 6. Tech classification: `lib/aoe4-build-order/effects.ts`

Exports `SUPPORTED_EFFECT_PROPERTIES`, `IGNORED_EFFECT_PROPERTIES` (both `ReadonlySet<string>`) and
`classifyTech(entry, data): TechSupport` as in the design "Engine rules" `classifyTech` bullet. The interpreter (`modifiedValue`)
is added to this file by a later ticket; this ticket adds classification only.

- `SUPPORTED_EFFECT_PROPERTIES` = `foodGatherRate, woodGatherRate, goldGatherRate, stoneGatherRate, farmGatherRate,
  berryGatherRate, huntGatherRate, carryCapacity, huntCarryCapacity, moveSpeed, productionSpeed` (design).
- `IGNORED_EFFECT_PROPERTIES`, enumerated from the English technologies in the snapshot: `areaOfEffect, attackSpeed, fireArmor,
  healingRate, hitpoints, lineOfSight, maxRange, meleeArmor, meleeAttack, rangedArmor, rangedAttack, rangedResistance,
  siegeAttack`.
- Order (design), for `type: 'technology'`:
  1. any effect with `property` `unknown` -> `rejected` / `unknown-tech-effect` (property `unknown`);
  2. any property in neither set, or a supported property whose `effect` is not `change|multiply` or whose `type` is not
     `passive` -> `rejected` / `unsupported-tech` (the first such property in effect order); `buildTime` is in neither set, so
     it rejects;
  3. (respec 1) `effects` empty or absent -> `supported` if some `data.civData.effects` row has `grantedBy` equal to the
     entry's `baseId`, else `{ kind: 'effects-unmodeled' }`;
  4. any ignored property -> `effects-ignored` with `properties` the distinct ignored properties in order of first appearance;
  5. else `supported`.
- An entry with `type: 'upgrade'` is `supported` iff its `baseId` is in `data.upgradeTargets`; otherwise `rejected` /
  `unsupported-tech` with `property: 'upgradeTargets'`. Every English upgrade is listed, so only a test fixture reaches the
  rejection.
- (respec 1) Applying that to the 69 English technologies at `e89f01e` gives: 7 `unknown-tech-effect` (`arrowslits,
  boiling-oil, cannon-emplacement, forestry, siege-engineering, springald-emplacement, tithe-barns`); 3 `unsupported-tech`
  (`enclosures` for its `influence`-typed `goldGatherRate`, `lightweight-beams` and `military-academy` for `buildTime`);
  4 `effects-unmodeled` (`admiralty, naval-arrowslits, serpentine-powder, silk-bowstrings`); 41 `effects-ignored`; 14
  `supported` (`crosscut-saw, cupellation, double-broadax, drift-nets, extended-lines, fertilization, greased-axles,
  horticulture, lumber-preservation, precision-cross-breeding, shaft-mining, specialized-pick, survival-techniques,
  wheelbarrow`).

### Known data gaps (written into the README, not modeled)

- (respec 1) `crosscut-saw-4`: its description adds "+5" wood carry capacity, but its `effects` holds only `woodGatherRate`
  x1.15; classified from `effects` (supported), so the +5 is not simulated. A per-resource capacity property would be needed.
- (respec 1) `shaft-mining-3`: `effects` is empty upstream; its +15% gold and stone gather rate comes from the two overlay rows
  in `rules/english.json`.
- (respec 2) The five starting sheep are not units; they are the `sheep` gather node with unlimited food, so sheep food is not
  depleted and no herding is modeled.

### Tests (Vitest, `lib/aoe4-build-order/*.test.ts`, covered by the existing `lib/**/*.test.ts` include)

- Snapshot: `source` has all six fields non-empty, `commit` matches `/^[0-9a-f]{40}$/`, `patchSource` starts with `http`; every
  entry in the four arrays has `civs` containing `en`; every `id` is unique.
- (respec 1) Hand values: walk both rules files recursively; every object with a `value` key also has a non-empty string
  `source` and a boolean `unverified`; the walk finds at least the count of values this ticket writes (so a loader or file that
  drops values fails); `unverified` is `false` for exactly the sheep, deer and boar `capacity` values and `true` for every other.
- (respec 1) References: every `dropOffs` baseId, `supply` key, `startingState.buildings` entry, `condition.nearBuilding`,
  `condition.producer` and building/tech `grantedBy` resolves in `byBaseId`; every `upgradeTargets` key resolves to an upgrade
  entry and its value to a unit with an entry whose `age` equals the upgrade's; (respec 2) every `startingState.units` key
  resolves to a `unit` entry and `startingState.units.value` equals `{ scout: 1 }`; every overlay `property` is in
  `SUPPORTED_EFFECT_PROPERTIES`; every `startingState.buildings` entry has a `supply` row.
- Drift guard: the set of properties used across English technology `effects` is a subset of supported + ignored +
  `{unknown, buildTime}`, so a refreshed snapshot with a new property fails until it is classified.
- (respec 1) `classifyTech`: `wheelbarrow-1` supported; `forestry-1` rejected `unknown-tech-effect`; `enclosures-4` rejected
  `unsupported-tech` naming `goldGatherRate`; `military-academy-3` rejected `unsupported-tech` naming `buildTime`;
  `fitted-leatherwork-2` (Blacksmith) `effects-ignored` naming `meleeArmor` and `rangedArmor` as present in its effects;
  `professional-scouts-2` `effects-ignored` with `['rangedAttack']` only (mixed supported + ignored); `shaft-mining-3`
  supported; the same entry against a fixture `GameData` without the `shaft-mining` overlay rows `effects-unmodeled`;
  `admiralty-2` `effects-unmodeled`; an upgrade in `upgradeTargets` supported; the same upgrade with its `upgradeTargets` row
  removed (fixture `GameData`) rejected with property `upgradeTargets`; a fixture tech with a supported property typed
  `influence` rejected `unsupported-tech`.
- Loader: `byBaseId.get('man-at-arms')` ages ascend; two calls return the same instance; assigning to a nested field of the
  returned object throws `TypeError`; `loadGameData('x' as CivId)` throws; `byId.get('constructor')` is `undefined`. Duplicate-id
  rejection is tested through whatever seam the implementer gives the index builder (an exported or injected entry list).
  (respec 2) Through the same seam, a `CivData` whose `startingState.units` is `{ scoutx: 1 }` throws an `Error` naming `scoutx`,
  and one keyed by a building baseId (`house`) throws.

**Out of scope:** the effect interpreter (`modifiedValue`), gather and construction math, validation, the paste parser, the
engine, `civ-rules.ts`, `SIM_INPUT_BOUNDS`, `resolveSimInputs`, the API types, any page or chart, `docs/aoe4-build-order.md`,
other civs, Council Hall and other later English bonus rows, retuning the trip seeds against the calculator, `package.json`
changes.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `data/aoe4-build-order/aoe4world/english.json` exists with top-level keys exactly `source, units, buildings, technologies,
      upgrades`. `jq '[.units,.buildings,.technologies,.upgrades|length]' -c` prints `[43,30,69,11]` when the pinned commit is
      `e89f01e` (otherwise the counts of the upstream files filtered below, at the recorded commit).
- [ ] For each of the four kinds, `curl -s https://raw.githubusercontent.com/aoe4world/data/<source.commit>/<kind>/all.json |
      jq -S '[.data[]|select(.civs|index("en"))]' | diff - <(jq -S .<kind> english.json)` prints nothing (entries are verbatim and
      complete), and `jq '[.units[],.buildings[],.technologies[],.upgrades[]]|map(select(.civs|index("en")|not))|length'` prints `0`.
- [ ] `source` carries `repo, commit, committedAt, fetchedAt, patch, patchSource`; `patch` names the game patch live on
      `committedAt` and `patchSource` is the URL that states it (A1).
- [ ] (respec 1) `rules/base.json` has exactly the keys `gatherNodes, builderScaling, maxPopCap, walkSeconds` (`walkSeconds.value`
      5, `maxPopCap.value` 200), and `gatherNodes` has exactly the eight `GatherNodeId` keys with the rates, capacities, property
      mappings, drop-offs and trip seeds in Scope 3 (boar 5.67 s).
- [ ] (respec 1) `rules/english.json` has exactly `startingState, supply, effects, upgradeTargets`: `startingState` age 1,
      resources `{food 200, wood 200, gold 100, stone 0}`, villagers 6 on `sheep` and 0 elsewhere, (respec 2) units
      `{ scout: 1 }`, buildings `['capital-town-center']`; `supply` keys exactly `capital-town-center, town-center, house, kings-palace`, each 10; `effects`
      exactly the seven rows in Scope 3 (four farm, one King's Palace, two Shaft Mining); the 11 `upgradeTargets` rows listed.
- [ ] (respec 1) Every rules value is a `HandValue` or an `OverlayEffect` with a non-empty `source`; `unverified` is `false` only
      for the sheep, deer and boar `capacity` values, whose `source` is "owner, in-game observation 2026-10-30".
- [ ] (respec 1) `lib/aoe4-build-order/model.ts` exports every type named in Scope 4:
      `git grep -hoE "^export (type|interface) [A-Za-z]+" -- lib/aoe4-build-order/model.ts | awk '{print $3}' | sort` prints the
      16 names `BuildOrder, BuildOrderIssue, BuildOrderNote, BuildStep, CivId, GatherNodeId, HandValue, OverlayEffect,
      ResourceKind, SimInputs, SimulationResult, StepTiming, TechSupport, Trigger, TripInputs, UnitSeries`; `TechSupport` has the
      `effects-unmodeled` member and `SimInputs` has `walkSeconds`.
- [ ] (respec 1) `lib/aoe4-build-order/data.ts` exports `loadGameData, GameData, SnapshotEntry, SnapshotEffect, SnapshotSource,
      BaseRules, GatherNodeRules, CivData` with the design's field names.
- [ ] (respec 1) `classifyTech` over the 69 English technologies at `e89f01e` returns exactly the counts and lists in Scope 6:
      7 `rejected/unknown-tech-effect`, 3 `rejected/unsupported-tech`, 4 `effects-unmodeled`, 41 `effects-ignored`, 14
      `supported` (including `shaft-mining` and `wheelbarrow`); a Blacksmith tech is `effects-ignored` naming its properties.
- [ ] `loadGameData('english')` returns indexes that resolve `wheelbarrow-1` by id and `villager` by baseId, the same instance
      on every call, deep-frozen (a write throws `TypeError`); an unknown civ throws; a duplicate id throws; (respec 2) a
      `startingState.units` key that is unknown (`scoutx`) or not a unit (`house`) throws an `Error` naming it.
- [ ] A1: `git grep -nE "\b(0\.75|0\.69|0\.825|0\.9|1\.15)\b" -- lib/aoe4-build-order ':!*.test.ts'` prints nothing (no gather
      rate or modifier constant in code); `git grep -nE "(from|import\()\s*['\"].*(components|pages)/apps/" -- lib/aoe4-build-order`
      prints nothing (S1).
- [ ] (respec 1) Tests exist for each bullet under "Tests" and fail for a real reason: removing `moveSpeed` from
      `SUPPORTED_EFFECT_PROPERTIES` fails the `wheelbarrow-1` test and the drift guard; deleting one `source` string from either
      rules file fails the hand-value walk; deleting an `upgradeTargets` row fails the reference test; deleting the two Shaft
      Mining overlay rows fails the `shaft-mining-3` supported test and the classification-count test; flipping the sheep
      capacity to `unverified: true` fails the hand-value walk; removing the deep freeze fails the `TypeError` test; (respec 2)
      removing the `startingState.units` check from `loadGameData` fails the `scoutx` loader test.
- [ ] `npx tsc --noEmit`, `npm test` and `npx next build` pass; the build output lists no new route (nothing imports the new
      modules yet).
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-10-30

- Underspecified: starting state, supply values, walk defaults, sheep/hunt capacities, boar seed and text-only effects had no
  source; names, `condition.age` semantics, the King's Palace mechanism and empty-effects classification awaited the designer.
- Changed: folded in owner answers and the revised design (ratified names, single `walkSeconds` 5, `effects-unmodeled`,
  `condition.producer` King's Palace row, Shaft Mining rows, supply on `capital-town-center` and `town-center`); classification
  counts now 7/3/4/41/14; owner-observed capacities are `unverified: false`. New designer question: the scout in `startingState`.
- Branch work: none (no branch yet).

## Re-spec 2026-10-30 (2)

- Underspecified: `CivData.startingState` had no field for the starting scout, so its 1 population was dropped.
- Changed: design adds `startingState.units`; Scope writes `{ scout: 1 }` (baseId `scout` verified at `e89f01e`), the loader
  throws on a key that is not a unit, tests and criteria cover both; README gap now covers sheep only; open question removed.
- Branch work: none (no branch yet).
