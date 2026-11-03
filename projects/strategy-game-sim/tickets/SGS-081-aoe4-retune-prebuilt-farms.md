# SGS-081: Re-time the farm steps of the prebuilt AoE4 builds for one villager per farm

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none yet (owner request 2026-11-03; backlog "One farm per farmer (AoE4 sim)"; split from SGS-080)
- **Priority**: medium
- **Risk**: standard
  <!-- Data and test pins only: no engine, route or schema change, so no strongModelTriggers item and no criticalPaths
       symbol applies. Standard, not low: it re-authors three shipped data files that every build-quality test and the
       page read, the step lists are found by iterating against the new engine, and the new floors test gates them.
       (respec 4) -->
- **Invariants**: A2 (farm and production-building steps are paid like any build; a step never starts unaffordable, so a
  re-authored build must not leave a step waiting); A3 (builds stay deterministic; the `man-at-arms` time trigger is
  hard-coded and must be re-checked); A1 not touched (no game number moves into code; floors are test constants about
  build quality, not game data)
- **LOC estimate**: about 40 business-logic-free lines (the floors constants in `production-floors.ts`, their case in `builds.test.ts`); the three
  build JSONs re-authored (data, not counted); README Prebuilt-builds prose; acceptance spec trimmed; test re-pins
- **Depends on**: SGS-080 (lands stacked on it; SGS-080 and SGS-081 ship as one stack, never 080 alone). SGS-079 is
  integrated on main, so its README rule (choices, not measured results) is the starting text.
- **On merge**: none
- **Source**: BACKLOG.md "One farm per farmer (AoE4 sim)" (owner, 2026-11-02); `reports/SGS-080-ticket-1.md` (Split);
  owner milestone check and decision 2026-11-03 (respec 4: rebuild, not re-time)

## Context

SGS-080 limits farm gathering to one villager per built farm. Villagers sent to `farm` with no free farm wait idle and
the run returns a `farm-idle` warning (text: `<n> villager(s) arrived at farm from <m:ss> on with no free farm and wait
idle until one is built.`; no off switch). The earlier passes of this ticket re-timed farm steps and, for the
spear/longbow build, sent would-be farmers to wood: the warning went away but that build became food-starved (see
Re-spec 4). (respec 4) Owner decision: every prebuilt build is re-simulated and re-authored under the one-farmer rule so
that it is a viable version of its stated plan, with enough farms paid from its own economy, and measurable floors keep
a starved build from passing.

## Scope

Paths are relative to the repo root. Engine behavior is SGS-080's end state: an arrival at `farm` beyond the built farms
idles at the farm and takes one when it completes; `farm-idle` is emitted at most once per run; an extra farmer
auto-takes the next farm built, so a build never needs a `move` to promote a waiting farmer. Step numbers are 0-based
`steps[]` indexes unless marked 1-based.

**Branch state (respec 4).** Work continues on `sgs-081-aoe4-retune-prebuilt-farms` (tip `2fc9593`, stacked on
`sgs-080-aoe4-one-villager-per-farm`). Kept: the per-build `farm-idle` case in `builds.test.ts`; the `farm-idle` sentence
in `docs/aoe4-build-order.md`; the README opening sentence on the farm rule; the test re-pins already made, which are
re-derived again where the rebuild moves them. Replaced: the spear/longbow rally-to-wood edits and its README `Farms:`
paragraph; the spear/longbow section of `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts`. The knight/longbow file
is the starting point for its rebuild (it already meets the floors below at `2fc9593`), not a finished end state.

**1. Re-author each build** (`data/aoe4-build-order/builds/`), by simulating it against the stacked engine and editing
until it meets every bar in Scope 2. (respec 4) Each build keeps its stated plan, which is what its README entry says
it is:

- `english-spear-longbow-maa-crossbow.json` "ENG Spear/Longbow into MAA/Crossbow": Feudal through the Council Hall,
  spearmen and longbowmen, Castle through the King's Palace, then men-at-arms and crossbowmen; villagers continuous from
  the Town Center and, once built, the King's Palace.
- `english-knight-longbow.json` "ENG Knight/Longbow (King's Palace)": the ENG 1TC opening to Feudal through
  `abbey-of-kings`, longbowmen, Castle through `kings-palace`, knights from stables; villagers continuous.
- `english-1tc.json` "ENG 1TC": the guide transcription. (respec 7) At `2fc9593` the file has 25 steps: indexes 0 to
  23 are transcribed from the guide (index 22 is `research steeled-arrow` with a `time` trigger of 420; index 23 is
  `research iron-undermesh` with no trigger); index 24 is the `depleted gold` `move all` reaction to `gold#2`, which
  was added for this simulator, not transcribed from the guide. Frozen set: indexes 0 to 23 keep their index, action,
  target, every other field and trigger exactly as at `2fc9593`, so the build still follows its source. The gold
  reaction is not frozen in position but keeps its content. Added non-reaction steps go after index 23 and before
  the gold reaction (so the gold reaction's index rises by the number added); added reactions go after the gold
  reaction, so it stays the first reaction step. Every added step carries a `time` trigger of 420 s or later or is a
  reaction (`reaction: true` with a `depleted` trigger); no added step is untriggered. The added steps carry the guide's plan (Feudal, continuous
  spearmen and longbowmen, continuous villagers) on through 1200 s: farms, rallies or moves to farm, and production
  buildings (owner decision: guide steps frozen, post-guide steps added).

Allowed edits, all builds: add, remove, reorder or re-time `build farm` steps; change the target, count or timing of
rallies, `move` steps and reactions; add production buildings (`barracks`, `archery-range`, `stable`; owner-confirmed) and `produce`
steps for the units the plan names, and houses; re-set the `man-at-arms` `time` trigger. Farms are paid from the
build's own economy (for example the wood the old versions floated). Not allowed: a unit, landmark or age the plan does
not name; dropping a unit, landmark, tech or age the plan names; stopping continuous villager production before 1200 s;
a game number in a build file; a non-integer or negative number (every build re-parses from its paste text). Steps
another test locates by index shift when steps are inserted; Scope 3 covers them.

**2. Bars.** At default inputs with depletion on (`resolveSimInputs({ durationSeconds })`, as `simulateTo` in
`builds.test.ts` does):

- Existing bars, unchanged in what they check: at 1200 s and 3600 s no step `waiting`, every non-reaction step started,
  a `not-reached` step has `waitingOn: 'trigger'`; every gold deposit that ran out has a `move all` reaction starting
  at its `depletedAt`, no gold warning of severity `warning`; no `farm-idle` warning at 1200, 1800 and 3600 s; the
  knight/longbow build's `idle-arrival`/`step-stuck`/sheep-reaction case through 1800 s; the King's Palace blacksmith
  case; the 1TC gold cases; the spear/longbow "reaches Castle ..." case (Castle by 1200 s, the opening army before the
  King's Palace in the list, men-at-arms and crossbowmen after it, the `man-at-arms` trigger no earlier than Castle).
- New floors at 1200 s (respec 4, respec 7), one row per build in `PRODUCTION_FLOORS` (keyed by the build file's
  `name`) plus `MAX_FLOATING_AT_1200`, both exported from a new module `lib/aoe4-build-order/production-floors.ts`
  (constants only, no logic, no import of vitest or Playwright, so both test runners can import it).
  `lib/aoe4-build-order/builds.test.ts` imports them and checks them in one new case in the existing
  `describe.each(listBuilds()...)` block using `simulateTo(1200)`, `countAt` and `sampleIndex` from `test-helpers.ts`
  (already exported there; `test-helpers.ts` itself is not edited). The case takes `const i = sampleIndex(result,
  1200)` once and reads both `gatherRates.food[i]` and `floating.<resource>[i]` at that same index:
  - the build has a row (a new prebuilt build without floors fails);
  - for each unit in the row, `countAt(result, unit, 1200)` is at least its floor (`villager` and each military unit
    the plan names);
  - `result.gatherRates.food[i]` is at least the row's `foodPerMinute`. This is the instantaneous rate at that
    sample, which can dip (for example while a farm is rebuilt or farmers walk); the build must clear the floor at
    that sample, and the floor is not lowered for a dip;
  - each of `result.floating.food[i]`, `.wood[i]`, `.gold[i]`, `.stone[i]` is at most `MAX_FLOATING_AT_1200` (one
    constant for all builds).
  - Values (owner-confirmed 2026-11-03: 70% floors and the 2000 cap). (respec 7) This table is authoritative: the
    implementer writes these exact values into `production-floors.ts` and does not recompute or adjust any of them
    from "Floor reasoning" below, which only explains where they came from:

    | Build | villager | military floors | foodPerMinute |
    |---|---|---|---|
    | ENG Spear/Longbow into MAA/Crossbow | 61 | spearman 8, longbowman 8, man-at-arms 21, crossbowman 13 | 780 |
    | ENG Knight/Longbow (King's Palace) | 61 | longbowman 36, knight 23 | 1180 |
    | ENG 1TC | 50 | spearman 39, longbowman 39 | 490 |

    `MAX_FLOATING_AT_1200` = 2000 (owner-confirmed).
  - The case names the build, unit and value on failure (`expect(..., unit)`), following the file's existing style.
- If a build cannot meet a floor or the cap without breaking an existing bar or its plan (for example it reaches the
  200 population cap before 1200 s and floats), the implementer reports `needs_spec` with the build, the bar and the
  simulated values; floors are never lowered on the branch.

**Floor reasoning (respec 4, trimmed respec 7).** Background only; the Scope 2 table wins wherever this differs. Data:
villager 50 food, 20 s; spearman 60 food 20 wood, 15 s; longbowman 40 food 50 wood, 15 s; man-at-arms 90 food 20 gold,
14.65 s; crossbowman 80 food 40 gold, 22.5 s; knight 140 food 100 gold, 35 s; farm 37 wood; barracks, range, stable 150
wood. The unit floors started as estimates of what the plan's minimum producers can make in the window the plan gives
them (one Town Center for villagers, plus the King's Palace after Castle where the plan has one; one barracks and one
range in Feudal; one barracks on men-at-arms and one range on crossbowmen after Castle; three stables and two ranges for
knight/longbow), were scaled to 70%, and were then set by the owner; the unit maxima behind them are not restated here,
so a floor is not expected to equal 70% of any figure in this ticket. Each `foodPerMinute` is the full-rate food demand
of that production times 0.875, rounded up to 10:

- Spear/longbow: villagers 150 (Town Center) + 150 (King's Palace), men-at-arms 369, crossbowmen 213 = 882 per minute,
  so 780. At `2fc9593`: spearman 3, longbowman 6, man-at-arms 1, crossbowman 9, villager 60, food 354 per minute
  (main: 13, 11, 32, 21, 79, 2796).
- Knight/longbow: knights 3 x 240, longbowmen 2 x 160, villagers 300 = 1340 per minute, so 1180. At `2fc9593`:
  knight 31, longbowman 49, villager 79, food 1557, floating food 1427, wood 1460, gold 98, so it passes every value,
  which shows the floors are reachable.
- 1TC: villagers 150, spearmen 240, longbowmen 160 = 550 per minute, so 490. At `2fc9593`: spearman 36, longbowman 45,
  villager 54, food 283 per minute.
- Floating cap: a 20:00 economy of 55 to 80 villagers outgathers the plan's minimum producers, so the cap is what makes
  a build spend its economy (more farms instead of idle wood, more production buildings of the units it names).
  `2fc9593` floats 10014 wood (spear/longbow) and 9037 wood (1TC); main floated 6299 food (spear/longbow). 2000 is the
  owner-confirmed limit; knight/longbow floats at most 1460 at `2fc9593`.

**3. Re-pin.** Any test that pins a shipped build's output (a digest, a time, a count, a population or resource value,
a warning) or locates a shipped build's step by index, and fails after the rebuild, is re-derived from the stack's
output (or its index moved to the same step), never loosened, skipped or deleted; a pin that does not move is left
alone. The implementer lists every test it edits in the report with old and new values. Candidates:
`git grep -lE "english-(1tc|knight|spear)|listBuilds|english1tc|knightLongbow|spearLongbow" -- lib acceptance`. Known
pins: `simulate-house-warnings.test.ts` (three 1800 s digests, the knight/longbow `held` object),
`acceptance/aoe4-simulate-api-house-lead-time.spec.ts` (`shipped` rows, the `withoutPalaceHouses` index filter),
`acceptance/aoe4-simulate-api-timelines.spec.ts` (`english1tc` `steps[4]`, `steps[14]`, `steps[22]`, Feudal
`reachedAt`, final counts; guide steps keep their indexes in 1TC), `research.acceptance.test.ts`,
`acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts` (`FIRST_GOLD_DEPLETED_SECONDS`),
`acceptance/aoe4-simulate-api-knight-longbow-build.spec.ts` (the reaction steps stay the final six, or its count
updates if a reaction is added), `acceptance/aoe4-simulate-api-veterancy-conversion.spec.ts`,
`simulate-construction.test.ts`, `simulate-triggers.test.ts`, `simulate.test.ts` (`listBuilds()[0]`). In
`builds.test.ts`, the 1TC case "runs its first gold deposit dry ..." takes the first reaction step
(`build.steps.findIndex((step) => step.reaction)`) as the gold reaction; Scope 1 keeps the gold reaction first among
1TC's reactions, so that case needs no edit. (respec 7) Specs that index 1TC steps from `english1tc.steps.length`
(`aoe4-simulate-api-timelines.spec.ts`, `aoe4-simulate-api-markers.spec.ts`) move with the added steps under the same
rule.

**4. Acceptance spec** (`acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts`, added at `2fc9593`). (respec 4) Keep the
per-build `farm-idle` loop and the knight/longbow idle case. Delete the "spear/longbow bars after capping the farm
rallies" describe, including `MAX_SPEAR_LONGBOW_STEPS` (it pins the replaced approach; the other bars in it duplicate
`builds.test.ts`). Add one API case per build at `durationSeconds` 1200 that checks the same floors and cap through
`POST /api/aoe4-build-order/simulate`. (respec 7) The spec imports `PRODUCTION_FLOORS` and `MAX_FLOATING_AT_1200` from
`../lib/aoe4-build-order/production-floors` (as other specs import `../lib/aoe4-build-order/builds`), looks up the row
by the build file's `name`, and loops over the row's units and the four resources rather than writing one assertion
per value, so no floor value or per-unit block is repeated; it reads the 1200 s sample index once from the response's
`times` and reads `gatherRates.food` and `floating` at that index. `npm run lint:dup` must stay clean.

**5. README** (`data/aoe4-build-order/README.md`, `## Prebuilt builds` to `## Hand-entered values`). Rewrite each
entry to its rebuilt file, stating choices and rules only (SGS-079 rule: a value written in the build file, such as a
`time` trigger, a farm block time or count, is an input and may stay; a value read from a simulation result is not
written). Changes:

- Opening paragraph: keep the farm rule sentence; add that each build also meets per-build production floors and a
  floating cap at 1200 s, set in `lib/aoe4-build-order/production-floors.ts` and checked in `lib/aoe4-build-order/builds.test.ts` (respec 7; no floor numbers in the README, so the two
  cannot drift).
- Spear/longbow entry: replace the `Farms:` paragraph (it describes rallies sent to wood instead of farm) with the
  rebuilt farm plan and its reasons: where farmers come from, how farms are paid, the production buildings added and
  why. Update the `man-at-arms` trigger sentence to the value in the file and its reason.
- Knight/longbow entry: farm block times and counts match the file's `build farm` steps that carry a `time` trigger; the
  1-based house step number ("the third of these (step 24)") matches the file.
- 1TC entry: add a line listing the steps added after the guide, and why ("Added after the guide: ..."); the Omitted
  list and transcription choices stay.
- Keep each entry's structure (name, source, Omitted list, transcription choices); change no other section.

**6. Docs.** `docs/aoe4-build-order.md`, the bar paragraph under "Prebuilt builds live in
`data/aoe4-build-order/builds/`": keep the `farm-idle` clause and add that every prebuilt build meets its production
floors and floating cap at 1200 s. Grep both docs for `farm`, `floating` and the build names and fix any sentence the
rebuild makes untrue.

**Out of scope:** any engine, route, OpenAPI or UI change; a new prebuilt build; a farm model beyond one villager per
built farm; searching for the optimal build (meeting the bars is enough); the pre-existing 1TC `node-depleted` sheep
warning with 6 idle villagers and the knight/longbow `auto-houses-held` warning, unless the rebuild removes them on its
way (allowed, not required); loosening, skipping or deleting a build-quality assertion (the spear spec section in
Scope 4 is replaced, not loosened: its bars stay in `builds.test.ts`).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] (respec 7) `lib/aoe4-build-order/production-floors.ts` exports `PRODUCTION_FLOORS` with one row per shipped
  build (keyed by build `name`) and `MAX_FLOATING_AT_1200`, with exactly the values of the Scope 2 table and 2000;
  `builds.test.ts` and `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts` both import them from it
  (`git grep -l "production-floors" -- lib acceptance` lists those two files and no copy of a floor value appears in
  either). `builds.test.ts` has one case in the per-build block asserting, at 1200 s with `i = sampleIndex(result,
  1200)`: the row exists; `countAt(result, unit, 1200) >= floor` for every unit in the row; `gatherRates.food[i] >=
  foodPerMinute`; each of the four `floating` series at `[i]` `<= MAX_FLOATING_AT_1200`. Catches:
  run against the build files at `2fc9593`, the case fails for ENG Spear/Longbow into MAA/Crossbow (spearman 3 below 8, food
  354 per minute below 780, wood 10014 floating) and ENG 1TC (spearman 36 below 39, food 283 per minute below 490, wood 9037 floating), and passes
  for ENG Knight/Longbow (King's Palace).
- [x] (respec 4) All three rebuilt builds pass that case and every existing per-build case in `builds.test.ts`,
  including the `farm-idle` case at 1200, 1800 and 3600 s; none is loosened, skipped or deleted, and no floor is below
  the table value.
- [x] (respec 4) Spear/longbow: the "reaches Castle ..." case passes unchanged in what it checks (Castle by 1200 s, the
  Council Hall before the King's Palace, spearman and longbowman `produce` steps before it, man-at-arms and crossbowman
  after it and starting no earlier than its completion, the `man-at-arms` `time` trigger no earlier than Castle and
  `armedAt` equal to it); no `idle-arrival` or `step-stuck` warning through 1800 s.
- [x] (respec 4) Each build keeps its plan: the produced unit types at 3600 s are exactly the README's for that build
  (spear/longbow: villager, spearman, longbowman, man-at-arms, crossbowman; knight/longbow: villager, longbowman,
  knight; 1TC: villager, spearman, longbowman), the landmarks and ages are unchanged, and (respec 7) in `english-1tc.json` `steps.slice(0, 24)` deep-equals
  `steps.slice(0, 24)` of the file at `2fc9593`; the gold `depleted` `move all` reaction to `gold#2` is present
  unchanged and is the first step with `reaction: true`; every step after index 23 other than that reaction has a
  `time` trigger with `seconds >= 420` or `reaction: true` (a reviewer checks with a short script over both versions of
  the file).
- [x] Each build re-parses from its paste text unchanged (existing round-trip case) and validates (existing `validates`
  case).
- [x] (respec 4) `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts` keeps the per-build `farm-idle` loop and the
  knight/longbow idle case, no longer contains `MAX_SPEAR_LONGBOW_STEPS` (`git grep -c MAX_SPEAR_LONGBOW_STEPS --
  acceptance` prints nothing; at `2fc9593` it prints `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts:2`), and has one 1200 s API case per
  build checking the floors and cap from the shared values; `npm run lint:dup` passes.
- [x] Every test that pins a shipped build's output or step index and fails after the rebuild (Scope 3 rule) is
  re-derived from the stacked engine output or has its index moved to the same step; the report lists each test file
  and pin with old and new values.
- [x] In the README Prebuilt-builds section (`awk '/^## Prebuilt builds/,/^## Hand-entered/'
  data/aoe4-build-order/README.md`), `grep -cE '[0-9]+\.[0-9]+ s'` prints 0, no sentence quotes a simulated instant or
  count, and no floor or cap number appears; the spear/longbow entry no longer says villagers are sent to wood instead of
  farm; the 1TC entry lists its added steps; the knight/longbow farm block times match the file (a reviewer compares).
- [x] `docs/aoe4-build-order.md` bar paragraph states the `farm-idle` bar and the production floors and floating cap at
  1200 s.
- [x] The report gives, per build at 1200 s, the unit counts, food rate and floating values (measured results live in
  the report and PR body, not the docs).
- [x] `git diff --stat` against the SGS-080 tip touches only: the three build JSONs, the README,
  `docs/aoe4-build-order.md`, `lib/aoe4-build-order/builds.test.ts`, the new `lib/aoe4-build-order/production-floors.ts`
  (respec 7), and test files (`*.test.ts` under `lib/aoe4-build-order/`, `acceptance/aoe4-*.spec.ts`) listed in the
  report. `lib/aoe4-build-order/test-helpers.ts` is not changed, and no other non-test file under
  `lib/aoe4-build-order/` changes.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint:dup` pass, and `npm run acceptance` passes for every
  `acceptance/aoe4-*.spec.ts`.
- [x] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-03 (7)

- Underspecified (spec-gate 4): the floors' home contradicted itself (a Playwright spec cannot import a vitest file); the 1TC step description missed index 24 (the gold reaction, not from the guide) and the "untriggered" index 23; the "Floor reasoning" maxima did not reproduce the table.
- Changed: floors and cap move to new `lib/aoe4-build-order/production-floors.ts`, imported by `builds.test.ts` and the prebuilt-farms spec, `test-helpers.ts` untouched; 1TC frozen set is `steps[0..23]` exactly, added non-reaction steps go before the gold reaction and added reactions after it, each added step has a `time` >= 420 or is a reaction; the table is authoritative and the reasoning prose is trimmed to the food derivation and measured `2fc9593`/main values; the 1200 s sample is `sampleIndex(result, 1200)` for both food rate and floating.
- Stands: all branch work at `2fc9593` listed in Scope "Branch state"; table values, cap and other criteria unchanged.

## Re-spec 2026-11-03 (6)

- Underspecified: three owner decisions (floors and cap, extra production buildings, 1TC handling) were open.
- Changed: floors now 70% (table in Scope 2), cap 2000, food rates recomputed (780, 1180, 490), extra production buildings allowed, 1TC guide steps 0 to 23 frozen with post-guide steps added; Open questions deleted. The 2fc9593 failure criteria re-checked: spear/longbow and 1TC still fail, knight/longbow still passes.
- Stands: all other Scope and criteria.

## Re-spec 2026-11-03 (4)

- Underspecified: the re-time approach let a build pass with no `farm-idle` while food-starved. Gates had passed at
  tip `2fc9593` (review, acceptance-test). Owner milestone check, simulate API at 1200 s, `2fc9593` vs main `1bdf1d6`:
  spear/longbow food rate 2796 -> 354 per minute; units villager 79 -> 60, spearman 13 -> 3, longbowman 11 -> 6,
  man-at-arms 32 -> 1, crossbowman 21 -> 9; floating food 6299 -> 28, wood 3790 -> 10014, gold about 2310 both; step 21
  (1-based) resource wait 129 s -> 205 s; cause: farmers moved to wood instead of building farms (main's numbers were
  also unrealistic, unlimited farmers per farm). Knight/longbow comparable (villager 78/79, knight 31/31, longbowman
  54/49, food 1557 both). No `farm-idle` on the stack; the 1TC sheep and knight/longbow auto-house warnings are the same
  on main.
- Changed: owner decision: re-simulate and re-author every build (not re-time) as a viable version of its plan; new
  `PRODUCTION_FLOORS` case (unit floors, food rate, floating cap at 1200 s) with proposed values pending owner
  confirmation; the spear/longbow rally-to-wood edits, its README `Farms:` paragraph and the spear section of the
  prebuilt-farms acceptance spec are replaced; 1TC is in scope with guide steps frozen.
- Stands: the `farm-idle` case in `builds.test.ts`, the `farm-idle` sentences in the README and design doc, the re-pin
  rule and edits already made (re-derived again where they move), and the knight/longbow file as the starting point.

## Re-spec 2026-11-03 (3)

- Underspecified: the spear/longbow build could not reach zero `farm-idle` by farm steps alone within the 1200 s
  all-started bar.
- Changed: cap that build's farm rallies (superseded by Re-spec 4).
- Stands: superseded by Re-spec 4.

## Re-spec 2026-11-03 (2)

- Underspecified: the pin list was closed; step numbers had no stated base.
- Changed: Scope 3 became a rule with a grep seed; indexes are 0-based `steps[]`.
- Stands: the re-pin rule (kept in Scope 3).

## Re-spec 2026-11-03

- Underspecified: whether an unused built farm fails the bars, and whether extra farmers wait or stay idle.
- Changed: only idle farmers fail (`farm-idle` absent at 1200, 1800, 3600 s); extra farmers auto-take the next farm.
- Stands: both rules (kept in Context and Scope 2).

## Rework 4 - 2026-11-03 (review, text)

Gate that bounced: review (report `reports/SGS-081-review-1.md`), at tip 70aa21a. Fixed at `7eb1d10` (knight/longbow
README farm-block wording); that wording is rewritten again in Scope 5.

## Rework 5 - 2026-11-03 (owner milestone check, spec)

Replaces the re-time approach with a rebuild (Re-spec 4). Every earlier gate passed at tip `2fc9593`; that tip's
spear/longbow file is food-starved (evidence in Re-spec 4). Branch work that stands is listed under Scope "Branch state".

## Rework 6 - 2026-11-03 (review)

Bounced by review 3 at f0fe3d6 (full review of 2fc9593..f0fe3d6). Earlier gates: spec-gate 5 READY on re-spec 7; implementer 4 at f0fe3d6. Full findings with exact replacement text: reports/SGS-081-review-3.md.

Findings:
1. data/aoe4-build-order/README.md:91-92 (text): says every farm takes a wood gatherer; steps 4-8 take sheep gatherers.
2. data/aoe4-build-order/README.md:85-86 (text): "to wood otherwise" is wrong for 0-20 s (start.rally is sheep).
3. data/aoe4-build-order/README.md:100-102 (text): parenthetical states the baseId rule; steps 50-56 name an instance and wait until it is built.
4. acceptance/aoe4-simulate-api-triggers.spec.ts:444-449 (test): "keeps every step start time of the infinite-node run" compares only the first 24 of 40 non-reaction steps; the length check is near-tautological.
5. Coverage gap: Scope 4 deleted the spear "no idle-arrival / step-stuck warning through 1800 s" test as a duplicate, but the builds.test.ts case runs only for Knight. Criterion 3 is no longer tested for spear.

Required fixes:
- [ ] Replace README.md:91-92 with review-3 finding 1's replacement text, word for word.
- [ ] Replace README.md:85-86 with: "The Town Center rallies to sheep until 20 s, to gold from 130 s to 200 s and from 560 s to 700 s, and to wood otherwise."
- [ ] Replace README.md:100-102 with review-3 finding 3's replacement text, word for word.
- [ ] In aoe4-simulate-api-triggers.spec.ts, compare every non-reaction step between the finite and infinite runs (e.g. `r.steps.slice(0, -1)`), keep the 24 STARTED_AT pins, and restore a length check that pins the exact expected step count.
- [ ] Add automated coverage that the spear/longbow build has no `idle-arrival` or `step-stuck` warning through 1800 s (extend the builds.test.ts case to the spear build, or restore an equivalent case); it must fail if such a warning appears.

## Rework 7 - 2026-11-03 (review)

Bounced by review 4 at 021baa5 (reports/SGS-081-review-4.md). All Rework 6 fixes passed review 4 at 021baa5.

Finding: acceptance/aoe4-build-order.spec.ts:385-396 (`expectMarkerLabelsApart`) fails 9/10 runs of `-g "marker labels"` on 021baa5 vs 0/10 on 2fc9593 (768 px and 390 px 1TC cases, plot-offset check at :396, received 3.5-10.5). Cause: the helper reads label, plot and SVG boxes in separate calls while the page is still smooth-scrolling to the results; the rebuilt 1TC (41 steps) makes the page taller so the scroll runs longer. The page itself is correct once the scroll settles. Violates "every aoe4-*.spec.ts passes" and the LESSONS.md ban on sequential boundingBox() reads.

Required fixes:
- [x] In `expectMarkerLabelsApart`, read the label boxes, plot box, SVG box and `data-label-rows` in one `root.evaluate`, retried with `expect.poll` or `toPass` until the scroll settles. Keep every assertion and tolerance unchanged.
- [x] `-g "marker labels"` passes 10 of 10 consecutive runs alone, and the full `acceptance/aoe4-*.spec.ts` run passes; report both.
