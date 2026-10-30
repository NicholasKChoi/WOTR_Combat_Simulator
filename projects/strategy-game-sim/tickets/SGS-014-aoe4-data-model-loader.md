# SGS-014: Add the English aoe4world snapshot, rules files, model types and data loader

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.2 (and the type half of M2.3, M2.4)
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: defines cross-module contracts (model.ts types, GameData, classifyTech, rules-file schema) that
       every later AoE4 ticket reads; adjacent invariant A1 (game numbers only from patch-labeled data files). -->
- **LOC estimate**: ~300 business logic (model.ts types ~120, data.ts ~100, effects.ts classification ~80), plus
  ~310 KB of data files (English snapshot, two rules files) and tests
- **Depends on**: SGS-012
- **On merge**: none
- **Source**: M2.2; design/M2.md Modules, Contracts (`model.ts`, "Rules files", `classifyTech`); reports/M2-plan.md outline B;
  reports/M2-research-1.md, -2.md, -4.md

## Context

The engine, validator and route all need typed game data, but no AoE4 code or data exists yet (`data/` and
`lib/aoe4-build-order/` are absent on `origin/main` 6013fcc). This ticket commits the pinned English aoe4world snapshot and
the hand-entered rules files, defines the shared types, and adds the loader and tech classifier. Every game number comes from
these files (A1); later tickets read the exports named here and add no constants of their own.

## Scope

Exploration (aoe4world/data at `e89f01e598998bf76bdddfbf2afce1659fee00cf`, committed 2026-10-28T23:06:27Z, the latest when this
ticket was written; the implementer may pin a newer commit and records whichever it uses): `<kind>/all.json` for
`units`, `buildings`, `technologies`, `upgrades` in that repo is byte-identical to `data.aoe4world.com/<kind>/all.json`. Filtered
to entries whose `civs` contains `en` it holds 43 units, 30 buildings, 69 technologies and 11 upgrades (about 183 KB compact,
about 309 KB with 2-space indent). Properties used by English technology `effects` (23): the 11 supported ones minus
`farmGatherRate`, `berryGatherRate`, `productionSpeed` (no English tech uses them), plus `buildTime`, `unknown` and 13 combat or
non-economy stats.

### 1. Snapshot: `data/aoe4-build-order/aoe4world/english.json`

Top level `{ source, units, buildings, technologies, upgrades }` (design "Modules"). Each array holds the upstream entries
verbatim (all fields kept, upstream order), filtered to `civs` containing `en`, written with 2-space indent. `source` is
`{ repo, commit, committedAt, fetchedAt, patch, patchSource }`: `repo` `aoe4world/data`; `commit` the full 40-character sha;
`committedAt` and `fetchedAt` ISO 8601; `patch` the game patch live on `committedAt` (the upstream files carry none, so the
implementer looks it up and `patchSource` is the URL it came from); if no citable patch is found, stop and report instead of
writing a guess.

### 2. Refresh procedure: `data/aoe4-build-order/README.md`

States the steps to refresh the snapshot (fetch the four `all.json` files at a chosen commit, filter by `civs`, write
`english.json`, update `source`), how hand-entered values are labeled (`HandValue`: `source`, `unverified`), and the known gaps
listed under "Known data gaps" below. A small filter script next to it (for example `refresh-snapshot.mjs`) is allowed; it is
not imported by the app.

### 3. Rules files (hand-entered; every value is a `HandValue<T>` with a non-empty `source` and `unverified: true`)

`data/aoe4-build-order/rules/base.json` (civ-agnostic; keys exactly `gatherNodes`, `builderScaling`, `maxPopCap`,
`reassignSeconds`, `builderWalkSeconds`):

- `gatherNodes`: one entry per `GatherNodeId` (`sheep, berry, deer, boar, farm, wood, gold, stone`) with `resource`,
  `rate` (resources per second), `capacity`, `rateProperties[]`, `capacityProperties[]`, `dropOffs[]` (camp baseIds only; the
  town center is the fallback in the trip model) and `trip` (`walkSecondsCamp`, `walkSecondsTownCenter`, `dropOffSeconds`, each a
  `HandValue<number>`). Values, with the sources research 1 names (fandom wiki "Resource (Age of Empires IV)" and "Villager
  (Age of Empires IV)", read 2026-10-30, patch not stated):

  | node | resource | rate /s | capacity | rateProperties | capacityProperties | dropOffs |
  |---|---|---|---|---|---|---|
  | sheep | food | 0.75 | 10 | `foodGatherRate` | `carryCapacity` | `mill` |
  | berry | food | 0.69 (since update 12.0.1974) | 10 | `foodGatherRate`, `berryGatherRate` | `carryCapacity` | `mill` |
  | deer | food | 0.825 | 25 | `huntGatherRate` | `carryCapacity`, `huntCarryCapacity` | `mill` |
  | boar | food | 0.9 | 25 | `huntGatherRate` | `carryCapacity`, `huntCarryCapacity` | `mill` |
  | farm | food | 0.75 | 10 | `foodGatherRate`, `farmGatherRate` | `carryCapacity` | `mill` |
  | wood | wood | 0.75 | 10 | `woodGatherRate` | `carryCapacity` | `lumber-camp` |
  | gold | gold | 0.75 | 10 | `goldGatherRate` | `carryCapacity` | `mining-camp` |
  | stone | stone | 0.75 | 10 | `stoneGatherRate` | `carryCapacity` | `mining-camp` |

  Hunt nodes exclude `foodGatherRate` because the snapshot descriptions of horticulture-2, fertilization-3 and
  precision-cross-breeding-4 say "Does not apply to hunted meat". Each `dropOffs` baseId must be an English snapshot building
  with class `resource_drop_off`.
- `trip` seeds: the calculator values are net rates, so the seed is the per-trip overhead `t = capacity / (net per minute / 60)
  - capacity / rate`, put entirely in both `walkSecondsCamp` and `walkSecondsTownCenter` with `dropOffSeconds` 0, so the seed
  reproduces the calculator rate under `cycle = capacity / rate + walk + dropOff`. `source` says so (calculator
  SichYuriy/aoe4-production-calculator `src/data/BaseGatheringRates.ts`, derived; split between walk and drop-off unknown;
  the engine ticket retunes). Net per minute: sheep 37.05, berry 32.93, deer 41.7, farm 36.718, gold 37, stone 37, wood 31.
  Resulting seeds in seconds: sheep 2.86, berry 3.73, deer 5.67, farm 3.01, gold 2.88, stone 2.88, wood 6.02. Boar has no
  calculator value (see Open questions).
- `builderScaling`: `{ numerator: HandValue<number> = 3, offset: HandValue<number> = 2 }` (build time = base x numerator /
  (builders + offset)); source fandom "Villager (Age of Empires IV)", Building construction section, no patch stated.
- `maxPopCap`: 200 (CONTEXT.md owner decision; secondary sources in research 2).
- `reassignSeconds`, `builderWalkSeconds`: see Open questions.

`data/aoe4-build-order/rules/english.json` (keys exactly `startingState`, `supply`, `effects`, `upgradeTargets`):

- `startingState`: `{ age, resources, villagers, buildings }`, each field a `HandValue` of `number`,
  `Record<ResourceKind, number>`, `Record<GatherNodeId, number>` and `string[]` (baseIds; `town-center`). Values: see Open
  questions.
- `supply`: `Record<baseId, HandValue<number>>`. The snapshot carries no supply (`costs.popcap` is 0 for `house` and
  `town-center`, research 2 and 4). Keys: `house`, `town-center`. Values: see Open questions.
- `effects: OverlayEffect[]` with exactly four rows now, the English farm bonus: `property: farmGatherRate`,
  `select: { id: ['villager'] }`, `effect: multiply`, `type: passive`, `grantedBy: 'civ'`,
  `condition: { age: 1 | 2 | 3 | 4, nearBuilding: 'mill' }`, `value` 1.2, 1.25, 1.3, 1.3. `source`: the `influences` text of
  `farm-1` and `mill-1` in the snapshot ("Farm harvest rate increased +20%/+25%/+30%/+30% by Age while within the influence of a
  Mill."); `unverified: true`. No King's Palace row yet (see Open questions).
- `upgradeTargets: Record<upgrade baseId, HandValue<unit baseId>>`, 11 rows, source "snapshot upgrade entry description and the
  unit entry at the same `age`":
  `early-men-at-arms`, `men-at-arms`, `elite-men-at-arms` -> `man-at-arms`; `veteran-spearmen`, `elite-spearmen` -> `spearman`;
  `veteran-horsemen`, `elite-horsemen` -> `horseman`; `veteran-longbowmen`, `elite-longbowmen` -> `longbowman`;
  `elite-crossbowmen` -> `crossbowman`; `elite-knights-or-lancers` -> `knight`. Checked against the snapshot: every target has a
  unit entry whose `age` equals the upgrade's `age` (2, 3 or 4).

### 4. Types: `lib/aoe4-build-order/model.ts`

Exactly the design "Contracts" block, with the design's names and shapes: `CivId, ResourceKind, GatherNodeId, Trigger,
BuildStep, BuildOrder, HandValue, TripInputs, SimInputs, UnitSeries, StepTiming, SimulationResult, BuildOrderIssue,
BuildOrderNote, TechSupport`, plus `OverlayEffect` as described in the design's "Rules files" paragraph. Type-only module, no
runtime code, no React or Next imports.

### 5. Loader: `lib/aoe4-build-order/data.ts`

`loadGameData(civ: CivId): GameData`, synchronous. The JSON is read with static `import` (resolved by the bundler, so no `fs`
path to trace on Vercel; `resolveJsonModule` is already on), cast through the snapshot and rules types. The names below that the
design does not list (`SnapshotEntry`, `SnapshotEffect`, `SnapshotSource`, `BaseRules`, `GatherNodeRules`, `CivData`, the
`GameData` fields) are this ticket's proposal and need ratifying (see Open questions); they are exported from `data.ts`:

```ts
interface GameData {
  civ: CivId
  source: SnapshotSource                       // english.json source
  byId: Map<string, SnapshotEntry>             // unit, building, technology and upgrade entries by id (wheelbarrow-1)
  byBaseId: Map<string, SnapshotEntry[]>       // same entries by baseId, ascending age
  base: BaseRules                              // rules/base.json
  civData: CivData                             // rules/<civ>.json (startingState, effects)
  supply: Map<string, HandValue<number>>       // civData.supply, keyed by baseId
  upgradeTargets: Map<string, HandValue<string>>
}
```

- Id lookups use `Map`, so a user-supplied id such as `constructor` or `__proto__` finds nothing.
- `loadGameData` builds the indexes once per civ at first call, returns the same deep-frozen instance every time (the engine
  must not be able to mutate shared data between requests; A3), and throws `Error` for a civ with no data.
- Duplicate `id` across the four arrays is an error at load.
- No validation of rules content beyond that; reference checks live in the tests below.

### 6. Tech classification: `lib/aoe4-build-order/effects.ts`

Exports `SUPPORTED_EFFECT_PROPERTIES`, `IGNORED_EFFECT_PROPERTIES` (both `ReadonlySet<string>`) and
`classifyTech(entry, data): TechSupport` as in the design "Engine rules" bullet. The interpreter (`modifiedValue`) is added to
this file by a later ticket; this ticket adds classification only.

- `SUPPORTED_EFFECT_PROPERTIES` = `foodGatherRate, woodGatherRate, goldGatherRate, stoneGatherRate, farmGatherRate,
  berryGatherRate, huntGatherRate, carryCapacity, huntCarryCapacity, moveSpeed, productionSpeed` (design).
- `IGNORED_EFFECT_PROPERTIES`, enumerated from the English technologies in the snapshot: `areaOfEffect, attackSpeed, fireArmor,
  healingRate, hitpoints, lineOfSight, maxRange, meleeArmor, meleeAttack, rangedArmor, rangedAttack, rangedResistance,
  siegeAttack`.
- Order (design): any effect with `property` `unknown` -> `rejected` / `unknown-tech-effect` (property `unknown`); else any
  property in neither set, or a supported property whose `effect` is not `change|multiply` or whose `type` is not `passive`
  -> `rejected` / `unsupported-tech` (the first such property in effect order); else any ignored property -> `effects-ignored`
  with `properties` the distinct ignored properties in order of first appearance; else `supported`.
- Applying that to the snapshot gives: 7 `unknown` techs (`arrowslits, boiling-oil, cannon-emplacement, forestry,
  siege-engineering, springald-emplacement, tithe-barns`); 3 `unsupported-tech` (`enclosures` for its `influence`-typed
  `goldGatherRate`, `lightweight-beams` and `military-academy` for `buildTime`, which is neither a combat stat nor in the
  supported list); the rest accepted. `buildTime` stays out of both sets because it changes build and production times the
  engine models; the design lists it as a later move into `SUPPORTED_EFFECT_PROPERTIES`.
- A technology whose `effects` is empty or absent (5 of the 69: `admiralty, naval-arrowslits, serpentine-powder,
  shaft-mining, silk-bowstrings`) returns `{ kind: 'effects-ignored', properties: [] }`, so the later research handler costs
  it, queues it and notes it rather than silently treating a text-only effect as modeled (see Open questions).
- An entry with `type: 'upgrade'` is `supported` iff its `baseId` is in `data.upgradeTargets`; otherwise `rejected` /
  `unsupported-tech` with `property: 'upgradeTargets'` (see Open questions). Every English upgrade is listed, so only a test
  fixture reaches this branch.

### Known data gaps (written into the README, not modeled)

Snapshot technologies whose text says more than their structured `effects`: `shaft-mining-3` (gold and stone gather rate
+15%, `effects` empty) and `crosscut-saw-4` (wood carry capacity +5 in the description, only `woodGatherRate` structured).
Both are classified from their `effects` only.

### Tests (Vitest, `lib/aoe4-build-order/*.test.ts`, covered by the existing `lib/**/*.test.ts` include)

- Snapshot: `source` has all six fields non-empty, `commit` matches `/^[0-9a-f]{40}$/`, `patchSource` starts with `http`; every
  entry in the four arrays has `civs` containing `en`; every `id` is unique.
- Hand values: walk both rules files recursively; every object with a `value` key also has a non-empty string `source` and a
  boolean `unverified`; the walk finds at least the count of values this ticket writes (so a loader or file that drops values
  fails); `unverified` is `true` for every value.
- References: every `dropOffs` baseId, `supply` key, `startingState.buildings` entry, `condition.nearBuilding` and
  building/tech `grantedBy` resolves in `byBaseId`; every `upgradeTargets` key resolves to an upgrade entry and its value to a
  unit with an entry whose `age` equals the upgrade's; every overlay `property` is in `SUPPORTED_EFFECT_PROPERTIES`.
- Drift guard: the set of properties used across English technology `effects` is a subset of supported + ignored +
  `{unknown, buildTime}`, so a refreshed snapshot with a new property fails until it is classified.
- `classifyTech`: `wheelbarrow-1` supported; `forestry-1` rejected `unknown-tech-effect`; `enclosures-4` rejected
  `unsupported-tech` naming `goldGatherRate`; `military-academy-3` rejected `unsupported-tech` naming `buildTime`;
  `fitted-leatherwork-2` (Blacksmith) `effects-ignored` naming `meleeArmor` and `rangedArmor` as present in its effects;
  `professional-scouts-2` `effects-ignored` with `['rangedAttack']` only (mixed supported + ignored); `shaft-mining-3`
  `effects-ignored` with `[]`; an upgrade in `upgradeTargets` supported; the same upgrade with its `upgradeTargets` row removed
  (fixture `GameData`) rejected; a fixture tech with a supported property typed `influence` rejected `unsupported-tech`.
- Loader: `byBaseId.get('man-at-arms')` ages ascend; two calls return the same instance; assigning to a nested field of the
  returned object throws `TypeError`; `loadGameData('x' as CivId)` throws; `byId.get('constructor')` is `undefined`.

**Out of scope:** the effect interpreter (`modifiedValue`), gather and construction math, validation, the paste parser, the
engine, `civ-rules.ts`, `SIM_INPUT_BOUNDS`, `resolveSimInputs`, the API types, any page or chart, `docs/aoe4-build-order.md`,
other civs, the King's Palace and Council Hall rows, retuning the trip seeds against the calculator, `package.json` changes.

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
- [ ] `rules/base.json` has exactly the keys `gatherNodes, builderScaling, maxPopCap, reassignSeconds, builderWalkSeconds`, and
      `gatherNodes` has exactly the eight `GatherNodeId` keys with the rates, capacities, property mappings and drop-offs in the
      Scope table; `rules/english.json` has exactly `startingState, supply, effects, upgradeTargets`, with four farm-bonus rows and
      the 11 `upgradeTargets` rows listed. Every value is a `HandValue` (or an `OverlayEffect`) with a non-empty `source` and
      `unverified: true`.
- [ ] `lib/aoe4-build-order/model.ts` exports every type named in Scope 4:
      `git grep -hoE "^export (type|interface) [A-Za-z]+" -- lib/aoe4-build-order/model.ts | awk '{print $3}' | sort` prints the
      16 names `BuildOrder, BuildOrderIssue, BuildOrderNote, BuildStep, CivId, GatherNodeId, HandValue, OverlayEffect,
      ResourceKind, SimInputs, SimulationResult, StepTiming, TechSupport, Trigger, TripInputs, UnitSeries`.
- [ ] `classifyTech` over every English technology in the snapshot returns exactly: 7 `rejected/unknown-tech-effect`
      (`arrowslits, boiling-oil, cannon-emplacement, forestry, siege-engineering, springald-emplacement, tithe-barns`), 3
      `rejected/unsupported-tech` (`enclosures, lightweight-beams, military-academy`), and for the other 59 `supported` or
      `effects-ignored`; `wheelbarrow` is `supported`, a Blacksmith tech is `effects-ignored` naming its properties.
- [ ] `loadGameData('english')` returns indexes that resolve `wheelbarrow-1` by id and `villager` by baseId, the same instance
      on every call, deep-frozen (a write throws `TypeError`); an unknown civ throws.
- [ ] A1: `git grep -nE "\b(0\.75|0\.69|0\.825|0\.9)\b" -- lib/aoe4-build-order ':!*.test.ts'` prints nothing (no gather rate or
      scaling constant in code); `git grep -nE "(from|import\()\s*['\"].*(components|pages)/apps/" -- lib/aoe4-build-order` prints
      nothing (S1).
- [ ] Tests exist for each bullet under "Tests" and fail for a real reason: removing `moveSpeed` from
      `SUPPORTED_EFFECT_PROPERTIES` fails the `wheelbarrow-1` test and the drift guard; deleting one `source` string from either
      rules file fails the hand-value walk; deleting an `upgradeTargets` row fails the reference test; removing the deep freeze
      fails the `TypeError` test.
- [ ] `npx tsc --noEmit`, `npm test` and `npx next build` pass; the build output lists no new route (nothing imports the new
      modules yet).
- [ ] No INVARIANTS.md regressions

## Open questions

Owner (needs an in-game check or a source; the implementer must not guess these):

1. Starting state and supply values, found in no source: starting villager count and their assignment across
   `Record<GatherNodeId, number>`, starting resources (research 4 lists 200 food / 200 wood / 100 gold with a question mark;
   stone 0 is not sourced), starting pop cap and whether `town-center` contributes supply to it (research 2: secondary sources
   say start cap 10, conflicting on the town center; its own recollection says above 10), supply per `house` (secondary sources:
   10). `maxPopCap` 200 is from CONTEXT.md.
2. `reassignSeconds` and `builderWalkSeconds` defaults: no source in the research (research 2 suggested 0 for the builder walk
   "for v1"; nothing for reassignment). Both are named inputs, so any value works mechanically; the owner picks.
3. Small data gaps: (a) carry capacity of `sheep` (wiki: 10 for all, 25 for hunted meat; whether sheep count as hunted is not
   stated, research 1 raises the same doubt for cattle; the table above uses 10); (b) walk-overhead seed for `boar` (no
   calculator value; deer's 5.67 s is the nearest analogue, not a source); (c) whether `wheelbarrow` carry capacity +5 applies to
   hunted-meat trips (the table maps both `carryCapacity` and `huntCarryCapacity` onto hunt nodes; if not, drop
   `carryCapacity` from the hunt rows).
4. Text-only economy effects: `shaft-mining-3` (empty `effects`; expressible as two overlay rows, `goldGatherRate` and
   `stoneGatherRate` x1.15 `grantedBy: 'shaft-mining'`) and `crosscut-saw-4` (+5 wood carry capacity, needs a per-resource
   capacity property the schema lacks). Proposal: not modeled in v1 (both get an `effects-ignored` note). Does the owner want
   the `shaft-mining` rows added?

Designer (design/M2.md is silent; the ticket proposes, the designer ratifies before spec-gate):

5. Names the design does not have, which later tickets will import: `SnapshotEntry, SnapshotEffect, SnapshotSource, BaseRules,
   GatherNodeRules, CivData`, the `GameData` field list and Map-valued lookups in Scope 5, `HandValue`-wrapped `startingState`
   fields, and `HandValue`/`TripInputs`/`OverlayEffect` living in `model.ts` beyond its export list. If the designer prefers
   other names or shapes, they replace the ones here.
6. `OverlayEffect.condition.age`: exact age (four farm-bonus rows, as written here) or "at least" (the semantics the
   interpreter ticket implements). The design says only "all fields must hold".
7. King's Palace "Produces Villagers +10% faster" (snapshot description of `kings-palace-2`; design: "King's Palace +10% via
   hand-entered modifier") applies to villagers produced at that building only, but `OverlayEffect` has no way to name the
   producer (`select` names the unit, `condition` allows `age` and `nearBuilding`). Add a `condition.producer`, use a
   `CivRules.productionModifier` hook, or another mechanism? This ticket writes no King's Palace row until decided, and a
   follow-up row (or this ticket's rework) adds it before the engine ticket needs it.
8. `classifyTech` details the design leaves open, as implemented above: (a) a technology with empty `effects` is
   `effects-ignored` with `properties: []`; (b) `buildTime` is rejected as `unsupported-tech` (military-academy-3 and
   lightweight-beams-4 become unresearchable) rather than ignored; (c) an upgrade absent from `upgradeTargets` is rejected with
   `property: 'upgradeTargets'`, because `TechSupport.rejected` requires a `property` string.
