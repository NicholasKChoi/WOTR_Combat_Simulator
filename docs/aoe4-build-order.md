# AoE4 Build Order Simulator

The model the build order simulator follows, the data it reads, its input limits and bounds, and the seams for
extending it. This is the reference reviews judge the simulator's behavior against. Each section states the
rule; the code and its tests implement it. The build order format, the routes and the result it returns are in
the [format doc](aoe4-build-order-format.md); what the page does with a result is in the
[page doc](aoe4-build-order-ui.md).
A map of the modules and the data flow in the code is in
[`lib/aoe4-build-order/README.md`](../lib/aoe4-build-order/README.md).

## Purpose and model

The simulator plays an *Age of Empires IV* build order step by step for the English civilization: villager
production, gathering, construction, research and age-ups. It returns one deterministic result per build
order and data set: when each step started and finished and why it waited, series over time of units
produced, gather rates, resources gathered, floating resources, spending and population, chart markers for age-ups and research,
and warnings and notes. English is the only civilization; other civilizations are a later extension
through the seams in Extension points.

Unit combat stats are not modeled. There is no combat: blacksmith and other combat technologies and unit
upgrades cost resources and queue time and mark the charts, but change no unit stat (hitpoints, attack,
armor or similar).

The model treats the game as a small set of ordinary rules:

- Town centers and landmarks are ordinary buildings. They are built, produce and research like any other
  building.
- Villager producers (town center, King's Palace) are production buildings. By default each one produces
  villagers continuously ("optimal villagers") until a step changes its order. Each spawned villager walks
  to its producer's rally node.
- An age-up is a landmark build. There is no separate age-up action.
- Every construction pulls its builders off their resource for the whole build time; they gather nothing
  while walking and building. Build time depends on the builder count.
- A finite node (sheep, berry, deer, boar, gold, stone) holds a starting stock and runs out; farm and wood
  never run out. By default the six finite nodes start at the owner-supplied, unverified amounts in
  `gatherNodes.<node>.amount` in `rules/base.json`; `inputs.nodeAmounts` overrides them per node, and a
  `null` override keeps a node infinite (see Depletion).

Every quantity that could vary between games (walk time, drop-off time, distance to each resource) is a named
simulator input, never a constant inside the step logic. The result and the API response are additive: a
later spread of outcomes is a new field beside the existing ones, not a change to them.

## Determinism, bounds and resources

- **Same input, same result.** The simulator uses no randomness and never reads the clock, so the same
  build order, inputs and data always give an identical result.
- **Game numbers come from data.** Every game number (cost, build time, gather rate, supply) is read from a
  versioned data file that records its source; no game number is written into the simulation code.
- **Resources never go negative.** A step that cannot be afforded waits until it can, and the wait shows
  in its timing as `waitSeconds > 0`.
- **Every request finishes in bounded time.** Every numeric input has a bound in `SIM_INPUT_BOUNDS`, and an
  input outside its bound is an `out-of-range` issue; nothing is simulated.

A non-integer where an integer is required, and a non-finite number, are also `out-of-range`. The bounds
apply to a pasted order too: the page converts the paste with `textToBuildOrder`, which caps it at 20,000
characters and checks each parsed line like a JSON step. The route accepts only JSON, so the character cap is
not a route bound.

| field | type | min..max | default |
|---|---|---|---|
| paste text (page-side conversion) / steps | | 20,000 chars / 200 steps | |
| `durationSeconds` | int | 60..3600 | 1200 |
| `Trigger.seconds` | int | 0..3600 (the largest `durationSeconds`) | |
| `Trigger.count` (villagers) | int | 1..200 (the population cap) | |
| `Trigger.atLeast` (bank) | int | 0..100,000 | |
| `produce.count`, `move.count` | int (`move.count` also `"all"`) | 1..200 | continuous (produce) |
| `builders`, `houseBuilders` | int | 1..200 | 1 |
| `instance` | int | 1..200 | every instance |
| `walkSeconds` (`SimInputs`) and per-step `walkSeconds` (`produce`, `build`, `move`, `rally`) | number | 0..60 | `rules/base.json`; step: inherit |
| `start.villagers` values | int | 0..200 | the civ split |
| `walkSecondsCamp`, `walkSecondsTownCenter` | number | 0..60 | `rules/base.json` |
| `dropOffSeconds` | number | 0..30 | `rules/base.json` |
| `influenceCoverage` values | number | 0..1 | `{ mill: 1 }` |
| `nodeAmounts` values | int or `null` (infinite) | 0..100,000 | `gatherNodes.<node>.amount` (gold's for `gold#k`); `null` is infinite |

Unknown extra properties on a build order, its `start`, its steps, their triggers and `inputs` are
ignored. Every omitted `inputs` field takes its default at any depth: `trips` merges per node and then
per field, and `influenceCoverage` and `nodeAmounts` per key, so `{ trips: { farm: { walkSecondsCamp: 3 } } }`
changes only that one value and `{ nodeAmounts: { berry: 500 } }` leaves the other nodes at their defaults. A build order with more than 200 steps is one `out-of-range` issue, and its steps are not
checked. A hole in a `steps` array (index `i` with no element) is the same `syntax` issue on step `i` as a step
that is not an object; only library callers can send one, since JSON cannot carry holes.

The result is sampled every `sampleSeconds` = 5 seconds.

## Data sources

**Game data snapshot.** Costs, build times, production times and technology effects come from a pinned
snapshot of aoe4world data (github.com/aoe4world/data), committed as
`data/aoe4-build-order/aoe4world/english.json`. Its entries are copied verbatim and filtered to those whose
`civs` contain `en`; the file holds `{ source, units, buildings, technologies, upgrades }`. Its
`SnapshotSource` records `repo`, `commit`, `committedAt`, `fetchedAt`, `patch` (the game patch live on
`committedAt`, since upstream files carry none) and `patchSource` (the URL stating that patch).

**Hand-entered rules.** Values the snapshot lacks are entered by hand in two files:

- `data/aoe4-build-order/rules/base.json`, civilization-agnostic: `gatherNodes` (per-node rate, carry
  capacity, the effect properties that modify them, drop-off buildings and trip seconds), `builderScaling`,
  `maxPopCap` (200), `villagerTarget` (100) and `walkSeconds`.
- `data/aoe4-build-order/rules/english.json`, the English overlay: `startingState`, `supply`, `effects`
  and `upgradeTargets`.

Every hand-entered value carries its own `source` and its own `unverified` label: as a `HandValue`, or,
for an overlay effect row, as fields of the `OverlayEffect` itself. Supply, the starting state, the overlay
effect rows, the trip walk and drop-off defaults, and the six starting node amounts are labeled unverified. Not every value is: the sheep,
deer and boar carry capacities are observed in game and are not labeled unverified. The rules files are
the record of which value is which.

**Gather rates.** Raw per-resource rates come from the *Age of Empires* fandom wiki (Resource and Villager
pages): for example 0.75/s for sheep, farms, gold, stone and wood, and 0.69/s for berries since update
12.0.1974. Carry capacity is 10, and 25 for hunted meat. The trip model below combines rate and capacity.
Every node's rate and capacity (deer and boar included) and each one's source and label live in
`rules/base.json`; this doc does not restate them. The wiki-sourced gather rates are unverified, with no
patch stated.

**Builder scaling.** The construction formula comes from the wiki Villager page, Building construction
section, with no patch stated; it is unverified.

**Task-switch walk.** The base walk of 5 seconds per task switch (`walkSeconds` in `rules/base.json`) is an
unverified, unmeasured assumption: about 5-6 tiles at villager speed 1.12 tiles/s.

**Calibration and cross-check.** The trip walk and drop-off defaults in `rules/base.json` are tuned so
that effective rates land near the net effective rates of SichYuriy/aoe4-production-calculator; those
defaults are labeled unverified. The calculator's rates are otherwise a labeled cross-check in a test only,
and never a source of raw gather rates.

**Loading.** `loadGameData(civ)` is synchronous. It builds its `GameData` indexes (`byId`, `byBaseId` in
ascending age, `supply`, `upgradeTargets`) once per civilization and returns the same deep-frozen instance
on every call. It throws for a civilization with no data and for a duplicate `id`. Every id lookup goes
through those maps, so a user id such as `__proto__` finds nothing.

**Ids.** Build orders and rules reference aoe4world `baseId`s (`villager`, `town-center`, `house`,
`wheelbarrow`, `veteran-longbowmen`), never display names. The engine resolves a `baseId` to the
civilization's entry for the current age or tier.

**Patch policy.** The data reflects the current game only. There is no per-patch support: refreshing the
snapshot replaces it and records the new commit and patch. Effects the snapshot states only in description
text are listed in `data/aoe4-build-order/README.md` under Known data gaps.

## Model rules

**Starting state and population.** `startingState` in `rules/english.json` has exactly the fields `age`,
`resources`, `villagers`, `units` and `buildings`. `villagers` maps each gather node to the villagers on
it at t=0. `units` maps a unit `baseId` to the count of non-villager units present at t=0; English starts
with one scout. Starting units count toward population, so English starts at 7/10 (6 villagers and 1
scout), but they are not produced. Sheep are not units: sheep are the `sheep` gather node. The
`startingState` hook of `CivRules` may override the whole object. The starting values themselves live in
`rules/english.json`.

A build order's `start.villagers`, when present, replaces the civ's `villagers` split whole (omitted nodes
get 0). It is placed at t=0 with no walk, as the civ split is, and must sum to the civ's starting villager
count, the sum of `civData.startingState.villagers.value` (6 for English). `start.rally` is the rally node
for the starting villager producers. Both `start` fields are optional in the schema, and `start: {}` is
well-formed (not a `syntax` issue). An English order still needs `start.rally`, because its starting town
center is a villager producer.

**Ordering and triggers.** Steps run in list order. A trigger is one of four kinds: a time (`@m:ss`,
meaning "not before" that time), a villager count (`at N vils`, counting villagers alive), a node running
out (`depleted`, holding from the instant that node ref's stock reaches 0) or a bank amount (`bank`,
holding while the banked amount of one resource is at least `atLeast`; it reads the bank and never
changes it). A non-reaction step arms when its trigger holds and every earlier non-reaction step has
started; a step without a trigger arms as soon as those steps have started. Once armed, it waits while any check in the wait
reasons table ([Outputs](aoe4-build-order-format.md#outputs)) fails, then starts. `waitSeconds = startedAt - armedAt`. At the horizon, a
step that never armed is `not-reached`, and a step that armed but never started is `waiting`.

A step marked `reaction` (only a `depleted` step may be one) arms when its trigger holds, without waiting
for earlier steps, and never delays a later step. Because run-outs apply first in the instant, its
`armedAt` is the node's `depletedAt`. Once armed it stays armed and is offered again at every later
instant until it starts, at most once. A reaction waiting on resources starts at the exact instant it
becomes affordable. At one instant, every armed reaction is offered in step order before the first
unstarted non-reaction step, so a reaction wins villagers or resources both need; several reactions on
one ref each see the villagers the earlier ones left.

At one instant, steps start (reactions first, then the rest in list order) before villagers spawn. A step armed by a spawn (a `villagers`
trigger) starts at that instant, after the spawn. So `@T rally` routes the villager spawning at T, and
`at N vils rally` routes villager N+1 onward.

**Priority.** At most one non-reaction step is armed and not started at a time. While it waits on resources
only, it reserves its cost; a reaction never reserves. A producer's order skips paying its next unit if
that would drop any resource the unit costs below the reserving step's cost of that resource. Villager
payments ignore the reserve, so villager production never stops for a waiting step; the step's start is
pushed back by the food the villagers spend instead. A step waiting on supply, on an age or on a building
instance that does not exist reserves nothing. At one instant, steps start before orders pay, so a step
wins a tie with an order payment. A due auto-house also holds its cost back from steps and non-villager
orders (Houses and supply).

**Queues.** Each building instance has one queue, shared by production and research. A `produce` step on
a busy producer replaces its order (a switch); `pause` clears the order. A step names a building by
`baseId`, which applies to every instance, or by `instance` (1-based) for one.

Every villager producer instance starts with a continuous villager order, which a `produce` or `pause`
step replaces. A villager producer instance with no order, after a `pause` or after a counted `produce`
spawns its last unit, goes back to the continuous villager order. This default villager order pays its
next villager only while the villagers alive plus the villagers paid and in production are fewer than
`villagerTarget` (100); a `produce villager` step is not capped. A `pause` on a villager producer
therefore holds it only once that many villagers exist. On any other producer, a counted `produce` that
spawns its last unit leaves the order empty. Only a research resumes the instance's own order. A unit is paid before it is queued: its resource cost and its population are taken
together, and only when every resource covers its cost and supply has room for it. Each instance runs its
paid units first in, first out, one at a time. An order pays its next unit only when its instance has no
paid unit left.

A `produce` step pays its first unit on every targeted instance that exists when it starts, so it waits
while it cannot pay all of them. It waits while no targeted instance exists, and it does not cover
instances built after it starts. A switch or a pause lets the unit in production and every paid unit
finish: nothing is cancelled and there is no refund. The old order's unpaid units are dropped. `pause`
costs nothing, completes the instant it arms, and is a no-op for an instance that does not exist (it is
not held for one built later).

A `research` step goes to `at` if given, else to the first building in the tech's `producedBy` (snapshot
order) that has an instance, and within that building to its lowest-numbered instance (instance 1 first).
Queue length is not consulted, `research` has no `instance` field, and a tech with no producing building
and no `at` never starts. With a capital town center and two town centers, `research textiles` goes to
the capital town center and `research textiles at town-center` to town center 1.

A tech can have one entry per age. Each time a `research` step is offered it researches the tech's
highest-age entry at or below the current age; that entry gives its producing buildings, cost, research
time and effects. A step that waited for an age-up therefore researches the entry of the age it reaches.
A completed research records that entry's `id` (and the tech's `baseId`), and only the effects of
researched entries apply, not those of other entries of the same tech.

A `research` step pays its cost when it starts and is appended to its instance's paid units, behind any
unit already paid. It never replaces the instance's order, which resumes (pays its next unit) when the
research ends. A completed research adds a marker to the result's `markers`. It waits while no target instance exists or while no entry of the tech is at or below the
current age, and it reserves resources only when it is short of resources alone.

**Tiers.** A unit's tier is the entry for the highest tier whose upgrade has been researched, else the
lowest-age entry for its `baseId`. `upgradeTargets` maps an upgrade `baseId` to the unit `baseId` it
upgrades, because aoe4world's `unlocks` is empty; the target tier is the unit entry whose `age` equals the
`age` of the upgrade entry that was researched, not of any other entry of that upgrade. A veterancy
upgrade occupies its building's queue for its research time. When it completes, every spawned unit of its
target below its tier becomes that tier, at that instant. A unit takes its cost, production time and
population from the tier when it is paid, and spawns at the tier researched when it spawns, never below
the tier it was paid at. An upgrade with no unit entry at its age changes no tier and converts nothing,
and an upgrade below the tier units already hold converts nothing.

**Ages and landmarks.** A building whose `classes` match `^age[1-3]_landmark\d$` advances the age from its
`age` to `age + 1` when it completes, so any landmark reaches the next of the four ages. The age advances
only when the landmark's `age` equals the current age: a second landmark of an age already passed moves
nothing. Entries whose `age` is above the current age are unavailable. Entries of the new age are usable
at the instant of the age-up: steps and order payments are re-checked then. An age-up never changes a paid
item or a running production time; a unit paid before it spawns as the entry it was paid as. On a build's
completion the engine adds the instance, calls `onBuildingComplete`, advances the age, then calls
`onAgeAdvance`.

**Trip model.** A gathering villager repeats a cycle:

`cycle = capacity / rate + walk / moveSpeedMultiplier + dropOffSeconds`, and effective rate = `capacity / cycle`.

`rate` and `capacity` are the node's values after technology effects. `walk` is the node's
`walkSecondsCamp` when a building in the node's `dropOffs` exists (mill, lumber camp, mining camp), else
`walkSecondsTownCenter`. `moveSpeedMultiplier` is the villager `moveSpeed` multiplier from technology
effects (Wheelbarrow raises it). Income is credited continuously at the effective rate, not per trip.

**Task-switch walk.** Moving villagers between tasks costs one generic base walk, `SimInputs.walkSeconds`
(default from `rules/base.json`). A step's own `walkSeconds`, when present, overrides it for every villager
movement that step causes. The effective walk is
`(step.walkSeconds ?? inputs.walkSeconds) / moveSpeedMultiplier`, the same villager `moveSpeed` multiplier
the trip model uses, read when the walk starts. The villager is walking and gathers nothing. The
walk is paid:

- once per villager on `move`, from `from` to `to`;
- twice on `build`: once to the site, then once from the site to `then`. When `then` is the node the
  building creates (`gatherNodes.<node>.createdBy`, so `then farm` on a farm build), the builders start
  there at completion with no second walk;
- once per spawned villager, from spawn to its producer instance's rally node. The walk is
  `(source.walkSeconds ?? inputs.walkSeconds) / moveSpeedMultiplier`, where the source is the `rally` step
  or `produce` that set the rally; a `start.rally` route uses `inputs.walkSeconds / moveSpeedMultiplier`;
- for both legs by auto-house builders, at `inputs.walkSeconds / moveSpeedMultiplier` (no step to override it).

The trip model's per-node `walkSecondsCamp`, `walkSecondsTownCenter` and `dropOffSeconds` model the gather
cycle, not task switches.

**Rally rules.** A rally sends each villager a producer spawns to a gather node.

- Villager producers are the `producedBy` buildings of the civ's `villager` entries (English
  `capital-town-center`, `town-center` and `kings-palace`).
- Each producer instance holds a rally state `{ node, walkSeconds? }`.
- Two writers set it: a `rally` step, and a villager `produce` with `rally`. The last writer wins, from the
  writer's `startedAt`. A writer's scope is its `instance`, or with no `instance` every existing instance of
  the `baseId` plus the default for that `baseId`'s later instances.
- A new instance takes its `baseId` default, else `start.rally`.
- An instance-scoped rally for an instance not yet built is held for it.
- Villagers already spawned are never re-routed; `move` does that.
- A `rally` step has no cost and no supply: `startedAt = completedAt = armedAt`, `waitSeconds` is 0 and its
  status is `completed`. Its `walkSeconds` applies to the walk of every villager it routes.
- Same-instant order is in Ordering and triggers.
- The validation rules in [Issues](aoe4-build-order-format.md#build-order-input) guarantee a rally is in effect whenever a villager spawns, so the engine
  reports no rally error. If a villager spawns at a building instance with no rally anyway (an order that
  skipped validation, or a `villagerProducer` hook that makes a building a producer when there is no
  `start.rally`), the engine throws an `Error` naming the building and instance.

**Construction.** Build time with N builders = base build time x 3 / (N + 2), the `builderScaling`
numerator 3 and offset 2 in `rules/base.json`:

| builders | 1 | 2 | 4 | 8 |
|---|---|---|---|---|
| share of base build time | 100% | 75% | 50% | 30% |

A `build` step pays the building's cost when it starts. Its builders come from the villagers at `from`,
gathering ones first, then idle ones (Depletion); the step waits while fewer than `builders` are there. Builders count as villagers for an
`at N vils` trigger throughout. Construction starts when they arrive at the site. The building counts for
nothing until it completes: its supply, its instance and its drop-off appear at that instant, which is
also the step's `completedAt`. The builders then walk to `then` (default `from`), or start there at once
when `then` is the node the building creates. A `build` step waits while its building's entry is above the
current age, while `from` has too few villagers, or while its cost cannot be paid; only the last reserves
resources.

A `move` step waits until `count` villagers are at `from` (gathering or idle), costs nothing, and takes
them off `from` for the walk, gathering ones first. Its `completedAt` is their arrival at `to`.
`move all` takes every villager at `from` when the step starts and never waits; with none there it
starts and completes at that instant and moves nobody, so a second `move all` from the same node at the
same instant is a no-op.

**Houses and supply.** `supply` in `rules/english.json` gives the supply each building provides; total
supply is capped at `maxPopCap`, 200. With `autoHouses` on (the default), the simulator builds houses on
its own so supply does not block production. The planner projects the population one window ahead. The
window is the lead, the builders' walk to the site plus the house build time with `houseBuilders` builders,
plus the gather time of one house's cost: for each resource of the cost, what the bank lacks divided by that
resource's current income from the current gatherers, the largest of them. The bank is the real bank, with no
step reserve taken off it, so the gather time is 0 while the cost is banked. While a resource of the cost is
short and nobody gathers it, no house is due. The projection adds to the current population the combined
rate of every producer with an order, in population per second, over the window. When it passes the
headroom, enough houses are due at once to cover the difference, each with its own `houseBuilders` builders;
houses run concurrently. The headroom is the supply plus the supply of the buildings under construction that
finish within the window (one finishing exactly at the window counts), so a long build such as a landmark
does not hold houses back. Every building under construction still counts toward `maxPopCap`, so planning
stops once supply plus the supply of all of them reaches 200. A house can be due before its cost is banked,
and as the bank grows and steps spend it a house can stop being due and become due again.

The planner runs three times in an instant: after run-outs and before the first step offer, after the
instant's events and before the second step offer, and after production starts. Each run starts every due
house it can pay for and find builders for, then sets the hold: one house's cost while the planner still
reports a house due, however many, and nothing otherwise. The hold stays as set until the next run, so a
payment between two runs does not change it. A step payment (`build`, `produce`, `research`, reactions
included) must leave the hold in the bank on each resource it spends; a resource the step does not spend is
not held, so a food-only step never waits on a wood hold. A non-villager order payment must leave both the
waiting step's reserve and the hold of each resource the unit costs. Villager order payments and explicit
`build house` steps ignore the hold. A held step waits on `resources` and starts at the instant the bank
covers its cost plus the hold. The simulation adds no stop of its own for the instant a house stops being
due; the hold is released at the next instant it already stops at. Nothing is held with `autoHouses: false`,
or while fewer villagers are gathering, walking or building than `houseBuilders` (idle villagers do not
count), since no wait can supply the builders then.

`houseBuilderSource` is the preferred node (`gold` is deposit 1). When it has fewer than `houseBuilders`
villagers gathering, builders come from the node ref with the most gatherers (ties: the first in node order,
`sheep, berry, deer, boar, farm, wood, gold, gold#2..gold#8, stone`, counting only the deposits the order
names). The source is chosen by its gatherers only, so idle villagers alone never make a node the source; at a
farm, the builders are taken from the villagers waiting idle there first, then from its gatherers. They walk
`inputs.walkSeconds / moveSpeedMultiplier` each way and return to the node they came from; returning to a
node that ran out meanwhile, or to a farm with every farm taken, leaves them idle there. A house pays its whole cost (all four resources) when it starts. A house waits only when no node
has enough gatherers or a resource of its cost is short; supply may block production meanwhile, and its hold
may block steps and orders. While no node has enough gatherers but at least `houseBuilders` villagers are
gathering, walking or building, the hold stays and the house starts at the instant a node has enough. Auto-houses
are not order payments: they ignore a waiting step's resource reservation, and never take a resource below
zero.

With `autoHouses` on, auto-houses plan from the start whether or not the order has `build house` steps.
Explicit `build house` steps start as ordered and add houses on top. Whichever kind it is, a house under
construction that finishes within the window counts toward the planner's headroom, so an explicit step that
starts after auto-houses already cover the demand adds a surplus house. With `autoHouses: false` no auto-house is built, and production blocks
at supply until a `build house` step adds more. No warning reports production held at the supply limit.

**Farms and mill coverage.** A farm costs its snapshot cost. The simulation lets one villager gather per
built farm (one per instance of `gatherNodes.farm.createdBy`, starting farms included), with no input to turn
this off. As a simulation rule, a villager that arrives, or starts, at `farm` with every farm taken waits idle
there and is put on the next farm built, the instant it completes; this is how the simulator models extra
farmers, not a claim about how AoE4 handles them. Such villagers give a `farm-idle` warning (see Idle
villagers). `influenceCoverage`
gives, per building `baseId`, the share of gatherers inside that building's influence once one exists;
the default is `{ mill: 1 }`.

**Overlay effects.** `effects` in `rules/english.json` are `OverlayEffect` rows in the aoe4world effect
schema, each active once its `grantedBy` (`civ`, or a building or technology `baseId`) is built or
researched, and each with its own `source` and `unverified` label. An optional `condition` holds only when
all its present fields hold:

- `age`: the current age is exactly this age.
- `nearBuilding`: the effect applies to the `influenceCoverage` share of gatherers for that building.
- `producer`: holds only when the modified value is a production time at an instance of that building.

A modified value is the base value plus every applying `change`, then multiplied by every applying
`multiply`. A missing `influenceCoverage` entry for a `nearBuilding` counts as 0, so the effect does nothing.

`productionSpeed` is a speed: production time = `costs.time` divided by the product of its multipliers.
The English farm bonus near a mill is four rows, one per age, with the wiki values +20%, +25%, +30% and
+30% by age, unverified. The King's Palace villager production bonus, +10%, is a `productionSpeed`
`multiply 1.1` row on `villager`, granted by `kings-palace` and conditioned on `producer: 'kings-palace'`.

**Coverage.** Modeled:

- villager production (town center, King's Palace +10%), continuous until `villagerTarget` (100) villagers;
- gathering sheep, berries, hunt (deer and boar), farms, wood, gold and stone;
- mill, lumber camp and mining camp drop-offs;
- farms (cost, one villager per built farm, extra farmers idle until a farm is built, mill coverage as an input, English farm bonus near a mill, wiki
  values +20/25/30/30% by age);
- generic military production: any production building queues any unit from the data, with continuous,
  pause and switch orders, and no combat;
- age-ups to all four ages via any landmark;
- every English technology whose effects use supported properties (gather rate, carry capacity, move
  speed, production speed);
- combat-only technologies (Blacksmith, University: hitpoints, attack and similar), accepted for cost and
  queue time with the effect ignored; technologies whose effects aoe4world lists as `unknown` (such as
  `forestry-1`) are rejected with a clear error;
- unit veterancy upgrades, researched at their building from data, which move the units already spawned
  and every later one to the upgraded tier; the units-produced graph shows tiers apart;
- houses, starting state and the population cap;
- depletion of finite nodes (Depletion), on by default: the six finite nodes start at the `rules/base.json`
  amounts, a `null` override keeps a node infinite, and `farm` and `wood` never run out.

Later: Council Hall longbow production speed, Network of Castles, Abbey of Kings. Out: sacred sites,
relics, trade, fishing and cattle, and unit combat stats (see Technologies).

## Depletion

**Stock.** Each run ref has a stock: the six finite nodes plus every gold deposit the order names
(`gold#2`..`gold#8`; deposit 1 is plain `gold`). It starts at `inputs.nodeAmounts[ref]`, whose default is
`gatherNodes.<node>.amount` in `rules/base.json` (`gold`'s for every `gold#k`), and `null` is infinite.
The six finite nodes ship owner-supplied, unverified amounts, so every ref is finite by default; a `null`
override keeps a ref infinite. `farm` and `wood` never run out. Over each interval a ref loses what its gatherers earn, the same amount credited to its resource,
and never goes below 0. Deposits draw down independently.

**Run-out instant.** The time a stocked ref reaches 0 is a wake, so a run-out lands on its exact time, not
on a sample; a stock within `RESOURCE_TOLERANCE` of 0 counts as empty, and a ref starting at 0 runs out at
t=0. Run-outs apply first in the instant, before any step: the ref's gatherers become idle there. A ref runs
out at most once and never refills.

**Idle villagers.** Idle villagers are alive: they count in `at N vils` and in population, and gather
nothing. Nothing moves them on its own, except that a farm that completes takes villagers waiting idle at `farm` (below); `move` and `build` take them from their node like gatherers. Every
arrival at a node that has run out (a spawn walking to its rally, a `move`, `build` builders at `then`, an
auto-house builder returning) leaves the villagers idle there. Likewise, an arrival at `farm` with every built
farm taken, or a starting farmer beyond the starting farms, waits idle at the farm (see Farms and mill
coverage); a farm that completes takes the waiting villagers at once, up to one per free farm. At a farm, `move`,
`build` and auto-house builders take the waiting idle villagers before the gatherers, so villagers idle there
only while every farm is taken.

**Results.** `depletions` has one entry per run ref in node-ref order: `amount` (the starting stock, `null`
when infinite) and `depletedAt` (`null` when the ref is still stocked at the horizon). `warnings` gets:

| code | severity | when |
|---|---|---|
| `node-depleted` | `warning` with villagers idle there, else `info` | once per run-out; `idleVillagers` is the idle count at the end of the run-out instant, so a step that moves them away at that instant leaves `info` |
| `idle-arrival` | `warning` | at most once per ref, at the first arrival at the depleted ref; `idleVillagers` adds up every villager that arrived idle there. The run-out's own gatherers do not count; an arrival at the run-out instant counts here and in `node-depleted` |
| `farm-idle` | `warning` | at most once per run, at the first instant a villager arrives, or starts, at `farm` with no free farm (0 for starting farmers); `idleVillagers` adds up every such villager, including those a farm takes later. Message: `3 villagers arrived at farm from 0:50 on with no free farm and wait idle until one is built.` |

Warnings are sorted by `at`; at one instant node warnings come first in node-ref order, with `node-depleted`
before `idle-arrival` for the same ref, then `farm-idle`, then `step-stuck` by step.

## Severity

Every message the simulator returns has a severity level: `error`, `warning`, `info` or `debug`, most severe first.

| item | severity |
|---|---|
| request issues (`BuildOrderIssue`, in a 400) | `error`, and they have no `severity` field |
| `node-depleted` | `warning` when `idleVillagers > 0`, else `info` |
| `idle-arrival` | `warning` |
| `farm-idle` | `warning` |
| `step-stuck` | `warning` |
| `tech-effect-ignored`, `tech-effect-unmodeled` | `debug` |

No item in a result has `error`: an invalid request is rejected before any simulation. The page lists
`warning` messages in a warnings list and `info` messages behind a toggle, and hides `debug` messages, which appear only in the API response (see the [page doc](aoe4-build-order-ui.md#page)).

## Technologies

`SUPPORTED_EFFECT_PROPERTIES` are `foodGatherRate`, `woodGatherRate`, `goldGatherRate`, `stoneGatherRate`,
`farmGatherRate`, `berryGatherRate`, `huntGatherRate`, `carryCapacity`, `huntCarryCapacity`, `moveSpeed`
and `productionSpeed`. `IGNORED_EFFECT_PROPERTIES` are the combat properties (`hitpoints`, `meleeAttack`,
`rangedArmor` and others), enumerated from the snapshot's English technologies in `effects.ts`.

`classifyTech` returns a `TechSupport` by checking, in this order:

1. Any effect `property` is `unknown` (`forestry-1`): rejected as `unknown-tech-effect`.
2. Any property in neither set, or a supported property whose `effect` is not `change` or `multiply` or
   whose `type` is not `passive`: rejected as `unsupported-tech`. `buildTime` is in neither set, so
   `military-academy` and `lightweight-beams` are rejected rather than silently mis-timed.
3. Any property in `IGNORED_EFFECT_PROPERTIES`: `effects-ignored`. The technology costs resources and
   queue time and applies its supported effects. Each research step of it gets one `tech-effect-ignored`
   note naming the ignored properties, reached or not, in step order, worded with the tech's `baseId`
   (`bloomery: its effect on meleeAttack is not simulated; it still costs resources and queue time.`).
4. Empty or absent `effects` (`admiralty`) and no `OverlayEffect` with `grantedBy` equal to its
   `baseId`: `effects-unmodeled`. It costs resources and queue time like any technology, and each research
   step of it gets one `tech-effect-unmodeled` note with empty `properties`, worded with the tech's
   `baseId` so the user sees its effect is not simulated (`admiralty: its effect is not simulated; it still
   costs resources and queue time.`). With such an overlay row it is `supported`.
5. Otherwise: `supported`.

Notes classify a tech by its lowest-age entry, so they depend only on the build order and the data, not on
the age a step is reached at.

An upgrade (`type: 'upgrade'`) is supported if and only if `upgradeTargets` lists it; otherwise it is
rejected as `unsupported-tech` with `property: 'upgradeTargets'`. A rejection is a `BuildOrderIssue`
naming the technology and the property.

Effects stated only in a technology's description text, beside non-empty `effects`, are not detected.

Unit combat stats are not modeled. Combat technologies (blacksmith, university) and unit upgrades cost
resources and queue time and mark the charts, but change no unit stat: hitpoints, attack, armor and similar
properties are in `IGNORED_EFFECT_PROPERTIES` and never applied.

## CivRules seams

`CivRules` in `lib/aoe4-build-order/civ-rules.ts` is the set of per-civilization code hooks, all
optional:

| hook | kind |
|---|---|
| `gatherRateModifier` | value |
| `productionModifier` | value |
| `supplyProvider` | value |
| `villagerProducer` | value |
| `dropOffRule` | value |
| `startingState` | value |
| `onBuildingComplete` | event |
| `onAgeAdvance` | event |

A value hook is `(defaultValue, ctx) => value`; an event hook is `(state, ctx) => void`. The engine calls
every hook as `rules.hook?.(...) ?? default`, so an absent hook leaves the default behavior.
`onBuildingComplete` is called once per completed building, after its instance exists, and `onAgeAdvance`
after a landmark moves the age, in the order given in Ages and landmarks. English needs
none: `civRules('english')` returns `NO_CIV_RULES`, a frozen `{}`. English bonuses that the data can
express, such as the farm bonus and the King's Palace bonus, are `OverlayEffect` rows, not hooks.

`productionModifier` must return a positive finite number for a unit. When a unit's production time
(`costs.time`, divided by `productionSpeed`, then passed through `productionModifier`) is not a positive
finite number, the engine throws an `Error` naming the unit and the producer. The check runs when the
unit's production starts and when auto houses estimate supply demand, which covers every unit an instance
holds an unfinished order for, even one not yet paid. Technology and upgrade times are not checked.

## Extension points

Each direction below is additive: it adds data, a field or a branch at the named seam and leaves existing
fields and results unchanged.

| direction | seam |
|---|---|
| Other civilizations | a new `CivId` value with `aoe4world/<civ>.json` and `rules/<civ>.json`; the engine keys on ids only; `CivRules` hooks for rules the data cannot express |
| More triggers, combinators | four kinds exist (`time`, `villagers`, `depleted`, `bank`); a new `Trigger.kind` is one `triggerHolds` case and one `triggerWakeAt` case in `simulate.ts`, plus its row in the validation kind table; validation keeps rejecting unknown kinds |
| A spread of outcomes | every variable quantity is already in `SimInputs` and the simulator uses no randomness or clock; a `spread` field on `SimulationResult` and `runs` and `seed` on `SimulateRequest` |
| New step kinds (holding villagers idle, sacred sites, trade) | `BuildStep` is tagged on `action`; one handler per action |
| Military rally points, more `start` fields (resources, units) | an optional `unit` on the `rally` step; new optional `BuildStart` fields |
| More technology effects (`buildTime`, `influence`), unit combat stats and combat | move a property into `SUPPORTED_EFFECT_PROPERTIES` and the interpreter; `IGNORED_EFFECT_PROPERTIES` shrinks; combat stats also need a combat model, which does not exist |
| More English bonuses (Council Hall, Network of Castles, Abbey of Kings) | `OverlayEffect` rows in `rules/english.json`; no code |
| Node positions, per-deposit trips | `TripInputs` (stock and run-outs already in `depletion.ts`); rates live only in `gather.ts` |
| More series or notes (rates by node, idle villagers over time) | new `SimulationResult` fields; new `BuildOrderNote` codes |
| Community build order formats | a new parser beside `parseBuildOrderText` that produces a `BuildOrder` |
