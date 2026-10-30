# M2 research 4: English v1 model coverage and civ extensibility

## Question
What should the v1 simulation cover for English, and how is it structured so other civs are added without a rewrite? Changes: the scope list in `docs/aoe4-build-order.md`, the data-file schema, the engine/rules module boundary, M2 exit criteria.

## Facts (verified by fetching data.aoe4world.com `technologies/all.json`, `buildings/all.json`, `units/all.json` on 2026-10-30)
- Layout: one JSON entry per civ-variant per age (`wheelbarrow-1`, `horticulture-2`); each has `id, baseId, civs[], age, costs{food,wood,stone,gold,popcap,time}, producedBy[]`. Technologies add `effects[]`, units add `movement.speed`, buildings add `influences[]` (text only) and no `effects`. https://github.com/aoe4world/data (README via fetch)
- Tech `effects` are structured: `{property, select:{id|class}, effect: change|multiply, value, type: passive|influence|...}`. 48 distinct (property, effect) pairs. Economic ones: `foodGatherRate, woodGatherRate, goldGatherRate, stoneGatherRate, farmGatherRate, berryGatherRate, huntGatherRate, carryCapacity, huntCarryCapacity, moveSpeed, productionSpeed, buildTime, food/wood/goldCost`. Some are `unknown`.
- English examples: wheelbarrow-1 = carryCapacity +5 and moveSpeed x1.15 on villager (cost 50w/150g, 90s, producedBy mill). horticulture-2 = foodGatherRate x1.1 (mill). fertilization-3 = x1.1. double-broadax-2 woodGatherRate x1.15 (lumber-camp); specialized-pick-2 gold/stone x1.15 (mining-camp). Notable: `foodGatherRate` selects villager (all food), `farmGatherRate`/`berryGatherRate` exist separately.
- Villager: 50 food, 20 s, popcap 1, producedBy `town-center, capital-town-center, kings-palace`; `movement.speed` 1.125 (gives the walk-speed default research-1 lacked; unit presumably tiles/s, unverified).
- Building `costs.popcap` is 0 for house and town center: supply values are NOT in the data (matches research-2).
- English unique buildings (landmarks) are in the data with cost/time/age: Council Hall (age 1, 400f 200g, 190s), Abbey of Kings (age 1, same), King's Palace (age 2, 1200f 600g, 220s), White Tower (age 2), Wynguard Palace and Berkshire Palace (age 3, 2400f 1200g, 250s), Cathedral of St. Thomas (age 4, wonder). Their effects ("Produces Villagers +10% faster", "Works +100% faster", "Longbowmen -5% cheaper") exist only as description text.
- English farm bonus ("Farm harvest rate +20%/+25%/+30%/+30% by Age within the influence of a Mill") is only in `influences[]` text of farm-1 and mill-1. enclosures-4 (unique, age 4) has a structured effect (goldGatherRate +0.17, type influence).
- Per-civ differences are already visible in the data: `producedBy` for the same tech varies (Japanese `kura-storehouse`, Mongol/Golden Horde `ger`, Sengoku `forge`, Mongol `steppe-redoubt`); Delhi tech time is 157 vs 45. So the generic engine must key on the civ's own entries, not on a global name table.

## Candidate mechanics for English v1

| Mechanic | Verdict | Reason |
|---|---|---|
| Villager production (TC, King's Palace) | IN | core; King's Palace +10% via hand-entered modifier |
| Gathering: sheep, berries, deer, boar, farms, wood, gold, stone | IN | per CONTEXT gross rate + trip model; cattle/fish/trade out |
| Hunt (deer, boar) | IN, labeled | huntCarryCapacity 25 and huntGatherRate effects are structured |
| Drop-off buildings (mill, lumber camp, mining camp, TC) | IN | as walk-distance inputs per resource plus build cost/time; no spatial map |
| Economic techs via `effects` (wheelbarrow, horticulture, fertilization, double broadax, lumber preservation, specialized pick, cupellation, etc.) | IN | generic effect interpreter; v1 supports only the econ properties above, rejects/ignores others with an explicit "unsupported effect" error for econ-relevant ones |
| Wheelbarrow moveSpeed | IN | scales the walk part of the trip (walk seconds = distance / speed) |
| Age-ups (landmark builds, 2 choices per age) | IN | ordinary buildings; age gates techs/buildings. Age 2/3 landmarks both in; age 4 out |
| Landmark side effects: Council Hall/White Tower/Wynguard production | OUT | military production deferred |
| Military production buildings and units | LATER (v1.1) | CONTEXT outputs say "units produced"; decide if this means villagers only. Generic production-building mechanic comes free from villager producers |
| English: farm bonus near mill (+20/25/30/30% by age) | IN | defining English eco trait; hand-entered (text only) |
| English: cheaper farms | IN if confirmed | farm-1 shows 37 wood (cost already civ-specific in data); verify no extra rule |
| King's Palace +10% villager speed | IN | hand-entered |
| Network of Castles, Council Hall longbow -5%, Abbey king, Wynguard | OUT | military/defense |
| Sacred sites, relics | OUT | map-dependent, no eco in a pure build order |
| Trade, fishing, cattle/pastures | OUT / LATER | not in scope of English opener; fish/trade add rule surface |
| Starting resources, units, pop cap | IN | hand-entered named inputs (start 200f/200w/100g? unverified) |
| Pop cap and houses | IN | per research-2, hand-entered supply |
| Resource depletion, map, travel by position | OUT | CONTEXT: infinite resources, named distances |
| Idle/villager reassignment cost | LATER | already a named input seam in CONTEXT |

## Extensibility structure (recommended)

Layers:
1. **Data (per civ, from snapshot, generic)**: `data/aoe4-build-order/<patch>/{units,buildings,technologies}.json` filtered to the civ (`civs` includes the id). Engine looks up by id; never by English name.
2. **Hand-entered overlay (per civ, labeled unverified/sourced)**: `rules/<civ>.json` data, not code: starting resources/units/pop cap, supply per building, gross rates and capacities (from research-1), builder formula, and text-only bonuses expressed in the same `effects` schema (e.g. farm +20/25/30/30% by age near mill; King's Palace production x1.1). Overlay entries use the same effect shape as aoe4world so the interpreter handles both.
3. **Engine (generic)**: event loop, queues, trip model, effect interpreter (select + change/multiply over property), supply, triggers. No civ ids.
4. **Civ hooks (code, optional, default no-op)**: a small interface `CivRules` with named hook points. Missing hooks fall back to identity.

Hook points, ordered by who needs them:

| Hook | English v1 | Needed by other civs |
|---|---|---|
| `gatherRateModifier(ctx)` (ctx: resource, age, nearbyDropOff, state) | NO as code: farm-near-mill by age fits as a conditional effect in data (select + condition `nearBuilding: mill` + age table). Build the *condition field* in the effect schema; no hook | Abbasid House of Wisdom, Delhi/Ayyubid sheep, Rus bounty/hunt, Malian pit mines (gold from buildings), Chinese dynasty bonuses |
| `productionModifier` (rate/cost) | NO as code: King's Palace x1.1 and Council Hall are data multipliers on the producer | French/HRE/Mongol-style production boosts that depend on state |
| `supplyProvider` | NO: supply is a data field per building (overlay) | Mongols (ger/no houses), Rus, Ottoman-like different supply sources |
| `villagerProducer` | NO: `producedBy` in data already lists producers | Japanese/Mongol nonstandard producers; Chinese/Ottoman variants |
| `onBuildingComplete` | likely NO | Abbasid (age-up grants), HRE prelates, French landmarks, Malian pit mines |
| `dropOffRule` (which buildings accept which resource) | NO: `producedBy`/building `classes` (`resource_drop_off`, `land_food_deposit`) cover mill/camps | Japanese kura storehouse, Mongol ger, Ottoman |
| `startingState` | data (overlay) | Mongol/Ottoman start variations |
| `onAgeAdvance` | NO | Chinese dynasties, HRE, Abbasid wings |

So v1 code ships the interface with zero English-specific hooks, one resolver that reads `rules/<civ>.json`, and an explicit "unsupported" error for unknown effect properties or conditions. English behavior lives entirely in data except what proves not expressible. Design rule: add a hook only when a civ's behavior cannot be expressed as (selector, property, op, value, condition) plus a data field. The conditional effect (`condition: {nearBuilding|age|buildingCount}`) is the one schema extension English needs.

Variant civs (e.g. Delhi 157 s techs, Order of the Dragon, Jeanne d'Arc, Ayyubid, Zhu Xi) appear as separate `civs` codes (`ay`, `od`, `jd`, `zx`) with their own entries, so no merging logic is needed beyond filtering by civ code.

## Data not in aoe4world (hand-entered, unverified)
1. Starting resources/villagers/pop cap and supply per house/TC (popcap is 0 in data).
2. Gross gather rates, carry capacity, builder formula 3/(N+2) (wiki, undated).
3. Farm-near-mill English bonus (text-only `influences`).
4. Landmark effects: King's Palace +10% villager speed, Council Hall +100% production, longbow -5% (text-only).
5. Drop-off walk distances and drop-off seconds (named inputs; defaults calibrated to the calculator).
6. Villager walk-speed unit and unit-to-seconds conversion (`movement.speed` 1.125 present; unit unverified).
7. Age-up unlock rules (which techs/buildings need which age): `age` is in data, but the second-landmark / Feudal-prerequisite rules are not (landmark count prerequisites unverified).
8. Cattle/pasture, fishing: absent; not in v1.

## Recommendation
Adopt the IN list above, with military production and units as LATER. Implement as: generic engine + per-civ data overlay in the same `effects` schema + an empty `CivRules` hook interface (only the conditional-effect schema extension is built). Reason: all English v1 behavior is expressible as selector/property/op/value/condition data, so code hooks have no v1 user; building them would be speculative, but the hook names are documented in the design doc as the seams.

## Open points for the owner
1. Does "units produced" in outputs mean villagers only for v1, or military too? (If military, the Council Hall/Archery production comes into scope and the English longbow bonus.)
2. Include age 3 landmarks (Wynguard/Berkshire) as pure age-up buildings, or stop at Castle Age?
3. Which econ techs are in scope: all structured ones in the snapshot, or a curated list? Recommend: all with supported econ properties, unsupported ones rejected.
4. Is farm-count modeling in scope (farm cost/build, one villager per farm, mill coverage as a boolean input)?
5. Accept hand-entered overlay values, labeled unverified, until checked in game?
6. Conditional-effect schema (age table, `nearBuilding`) in v1: approve as the only schema extension?

## Unknowns
- Whether `type: influence` effects need extra handling (enclosures-4 uses it); not verified.
- Whether any English eco effects use `property: unknown`; not checked per tech.
- Exact English starting values and age-up prerequisites: in-game check or aoe4world civ page.
- Mapping of the 48 effect properties to engine support beyond econ: only econ ones examined.

## Sources
- https://github.com/aoe4world/data (README layout)
- https://data.aoe4world.com/technologies/all.json, /buildings/all.json, /units/all.json (fetched 2026-10-30)
- /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/CONTEXT.md:52-92, INVARIANTS.md (A1-A3), reports/M2-research-1.md, M2-research-2.md
