# SGS-013: Write the AoE4 Build Order Simulator design doc `docs/aoe4-build-order.md`

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.1
- **Priority**: high
- **Risk**: high
  <!-- Defines the contract every AoE4 ticket and review is judged against: A1, A2, A3 and S3 are stated in it,
       and it fixes the public paste grammar and route bounds (PROJECT.md triggers: touches an invariant; changes a
       public schema, API, or cross-component contract). No logic changes. -->
- **LOC estimate**: ~300-450 lines of prose, 0 business logic (one new file, `docs/aoe4-build-order.md`; `docs/` on origin/main 6013fcc holds only `combat-simulator.md` and `api/openapi.json`)
- **Depends on**: SGS-012 (by rule; no technical dependency)
- **On merge**: CONTEXT.md Design docs row: change "`docs/aoe4-build-order.md` (TODO, M2)" to "(on `main`, SGS-013)". CONTEXT.md
  Decisions: delete the AoE4 lines the doc now carries in full ("AoE4 model scope", "AoE4 simulation", "AoE4 game data",
  "AoE4 gather rates", "AoE4 builder scaling", "AoE4 auto-houses", "AoE4 triggers", "AoE4 outputs", "AoE4 patch policy",
  "AoE4 v1 coverage and structure"); the reviewer confirms each is covered before the manager deletes it. Keep "AoE4
  interface" (route and page are not built yet) and "Dependency upgrade" (SGS-012). Key surfaces and Paths edits (M2.9)
  wait for the route and page tickets.
- **Source**: MILESTONES M2.1; reports/M2-plan.md outline A; design/M2.md (owner-approved; bounds table, grammar details,
  generic `walkSeconds` and loader contracts added 2026-10-30); CONTEXT.md Decisions; ARCHITECTURE.md "Adding an app" step 1

## Context

`docs/aoe4-build-order.md` does not exist, so A1 to A3 and the paste grammar have nothing authoritative to be reviewed
against, and REPO.md's review checklist judges behavior against the page's design doc. The doc states the model, the
data sources, the paste grammar, the `CivRules` seams, the route bounds and the outputs, as settled rules. Every later
AoE4 ticket (data, engine, parser, route, page) implements against it; SGS-014 and the interpreter and parser tickets
restate parts of it in code and tests, so a divergence found there comes back here as a doc fix.

## Scope

Create `docs/aoe4-build-order.md`: prose, tables, and two Mermaid diagrams (a data-flow flowchart from paste text through
parse, validate and simulate to the three graphs; a state diagram of one step's life: unarmed, armed, waiting, started,
completed, not-reached). Style follows `docs/combat-simulator.md` (title, one-paragraph lead, one `##` per topic,
rules stated flatly). Content is transcribed from design/M2.md and CONTEXT.md Decisions; where design/M2.md and CONTEXT.md
differ, design/M2.md wins (it is later). Where the design leaves a value to a later ticket the doc names the file that
will hold it and does not invent it.

1. **Purpose and model.** Simulates an *Age of Empires IV* build order step by step for the English civilization and
   returns one deterministic result per build order and data set. English only; other civs are a later extension.
2. **Determinism, bounds, resources (A1, A2, A3, S3).** (respec 1) Same input and data give the same result: no
   randomness, no clock. Every game number comes from a versioned data file. Resources never go negative; an unaffordable
   step waits and the wait is reported. Every numeric input has a bound in `SIM_INPUT_BOUNDS`; a violation (including a
   non-integer where an integer is required, or a non-finite number) is an `out-of-range` issue, and the bounds apply to
   JSON and paste alike. The doc carries design/M2.md's bounds table row for row: text 20,000 characters / 200 steps;
   `durationSeconds` int 60..3600, default 1200; `Trigger.seconds` int 0..3600; villager `Trigger.count` int 1..200;
   `produce.count` and `move.count` int 1..200 (produce default continuous); `builders` and `houseBuilders` int 1..200,
   default 1; `instance` int 1..200, default every instance; `walkSeconds` (`SimInputs` and per-step on `produce`,
   `build`, `move`) number 0..60, default from `rules/base.json`, step default inherit; `walkSecondsCamp` and
   `walkSecondsTownCenter` number 0..60; `dropOffSeconds` number 0..30; `influenceCoverage` values number 0..1, default
   `{ mill: 1 }`. `sampleSeconds` is 5.
3. **Data sources.** (respec 1) Pinned aoe4world snapshot (`data/aoe4-build-order/aoe4world/english.json`, entries
   verbatim, filtered to civs containing `en`) with `SnapshotSource` fields (repo, commit, committedAt, fetchedAt, patch
   live on committedAt, patchSource); hand-entered rules (`rules/base.json` civ-agnostic: `gatherNodes`, `builderScaling`,
   `maxPopCap`, `walkSeconds`; `rules/english.json` overlay: starting state, supply, `effects`, `upgradeTargets`), each
   leaf a `HandValue` with `source` and `unverified`. `loadGameData(civ)` is synchronous, builds its `GameData` indexes
   once per civ, returns the same deep-frozen instance, throws for a civ without data or a duplicate `id`, and resolves
   every id through its maps (an id like `__proto__` finds nothing). Gather rates and carry capacities come from the
   fandom wiki (0.75/s for sheep, farm, gold, stone and wood; berries 0.69/s since update 12.0.1974; capacity 10, 25 for
   hunted meat) and builder scaling from the wiki Villager page (no patch stated); all labeled unverified. The base
   task-switch walk is 5 s, labeled unverified as an unmeasured assumption (about 5-6 tiles at villager speed 1.12
   tiles/s). SichYuriy/aoe4-production-calculator values are a cross-check in a test only, never a source. Patch policy:
   the data reflects the current game only; no per-patch support. Ids are aoe4world `baseId`s, never names.
4. **Model rules**, each stated once (respec 1): ordering and triggers (list order, arming, "not before" time, villagers
   alive, `waitSeconds = startedAt - armedAt`, `waiting` vs `not-reached`); queues (one per building instance, production
   and research share it, produce on a busy producer switches, pause clears); tier resolution and `upgradeTargets`; ages
   and landmarks (`^age[1-3]_landmark\d$`); trip model (`cycle = capacity / rate + walk / moveSpeedMultiplier +
   dropOffSeconds`, camp vs town center walk) and continuous income; **task-switch walk**: one base walk
   `SimInputs.walkSeconds`, overridden per step by the step's `walkSeconds`, effective walk = `(step.walkSeconds ??
   inputs.walkSeconds) / moveSpeedMultiplier` (the trip model's villager `moveSpeed` multiplier, read when the walk
   starts), paid idle once per villager on `move`, twice on `build` (to the site, then to `then`), once from spawn to
   the node on `produce` with `rally`, and both legs by auto-house builders at `inputs.walkSeconds`; the trip model's
   per-node walk and drop-off seconds model the gather cycle, not task switches; construction `base x 3 / (builders + 2)`
   with the 100/75/50/30% table for 1, 2, 4, 8 builders; auto-houses (start computed from house build time, builder walk
   and combined production rate; builders and source resource are inputs, default 1 from wood; back-to-back or more
   builders when production outpaces one house; an explicit house step overrides; supply capped at 200); farms and mill
   coverage; overlay effects: `condition` fields all must hold, `age` is the exact current age, `nearBuilding` applies to
   the `influenceCoverage` share, `producer` holds only for production time at that building; `productionSpeed` divides
   `costs.time`; English farm bonus near a mill (wiki values +20/25/30/30% by age, unverified); King's Palace villager
   production +10% as an overlay row conditioned on that producer. Includes the v1 coverage list and the out list
   (sacred sites, relics, trade, fishing, cattle, depletion; later: Council Hall, Network of Castles, Abbey of Kings).
5. **Technologies.** (respec 1) `SUPPORTED_EFFECT_PROPERTIES` (the design's eleven), ignored combat properties, and the
   `classifyTech` order: `unknown` property (`forestry-1`) rejects as `unknown-tech-effect`; an unlisted property, or a
   supported one with `effect` not `change|multiply` or `type` not `passive`, rejects as `unsupported-tech` (`buildTime`
   is unlisted, so `military-academy` and `lightweight-beams` reject); ignored properties give `effects-ignored`
   (Blacksmith and University techs cost and queue, supported effects apply, one `tech-effect-ignored` note per research
   step); a technology with empty or absent `effects` and no overlay row granting it gives `effects-unmodeled` (costs and
   queues, one `tech-effect-unmodeled` note with empty `properties` per research step); else `supported`. Upgrades are
   supported iff listed in `upgradeTargets`, else rejected as `unsupported-tech` naming `upgradeTargets`; veterancy
   upgrades occupy the queue and change the tier of later units. Effects stated only in description text are not
   detected; the doc says they are listed in `data/aoe4-build-order/README.md` Known data gaps. Exact
   `IGNORED_EFFECT_PROPERTIES` membership is stated as "enumerated from the snapshot's English techs in `effects.ts`",
   not copied.
6. **Build order input.** (respec 1) JSON model (types from design Contracts, tagged triggers, unknown kinds rejected,
   `walkSeconds` on `produce` only with `rally`) and the paste grammar table with one example per action, including the
   `walk Ns` suffix on `produce`, `build` and `move`; comment and blank-line rules; error `line`; `BuildOrderIssue` codes.
   Grammar details from design/M2.md: `@m:ss` is `@\d+:\d\d` with any number of minute digits and seconds `00`-`59`
   (`@1:61` is `syntax`; `@75:00` parses and fails the 3600 s bound as `out-of-range`; `@60:00` is valid); `produce`
   suffixes in the order `[xN]`, `[-> node]`, `[walk Ns]`, any other order `syntax`; `walk Ns` is always last (`walk 6s`:
   keyword, space, integer, `s` with no space); paste walk values are integers, JSON may use decimals; a `produce` walk
   without `-> node` is `invalid`; `xN` and `#k` take no space, `->` is whitespace-delimited; ids and node names are
   case-sensitive lowercase kebab-case `[a-z0-9]+(-[a-z0-9]+)*`, other characters `syntax` (not lowercased); keywords
   lowercase; numbers unsigned decimal integers.
7. **Route.** `POST /api/aoe4-build-order/simulate` request (exactly one of `text` or `buildOrder`, optional partial
   `inputs`), 200/400/405 shapes, `error` = first issue's message, malformed JSON keeps Next's plain-text 400; the full
   contract lives in `docs/api/openapi.json` once the route exists, so the doc names it and does not copy field lists.
8. **Outputs.** `SimulationResult` fields and meaning (units produced by unit and tier, gather rates per minute, floating
   resources, step timings, ages, notes with both note codes); three graphs over time. The charting library and its test
   selectors are not in this doc (they live in the component and its tests).
9. **`CivRules` seams.** The eight hooks, value vs event kind, `rules.hook?.(...) ?? default`, English = `{}`.
10. **Extension points.** The design's table, reworded without product history.

Shipped text states facts only. It never names tickets, milestones, invariant numbers, factory files, or who decided what
(common.md hygiene).

**Out of scope:** any code, data file, JSON values, OpenAPI edit, or test; editing `design/M2.md`; the page title and
prebuilt build order (the page ticket); the charting library and its version.

## Diagrams

Single-component change outside the core control loop; no diagram required. (The doc itself carries the two diagrams
listed in Scope; it changes no code.)

## Acceptance criteria

- [ ] `docs/aoe4-build-order.md` exists and covers sections 1 to 10 of Scope as `##` headings; the file is 300 to 450 lines (respec 1)
- [ ] `git grep -nE 'SGS-|M2\.[0-9]|INVARIANTS|CONTEXT\.md|design/M2|owner|Recharts|reassignSeconds|builderWalkSeconds' -- docs/aoe4-build-order.md` prints nothing (today the file does not exist, so it prints nothing; the check is meaningful after the change because the source material contains all of those words) (respec 1)
- [ ] `git grep -c '^```mermaid' -- docs/aoe4-build-order.md` prints at least 2
- [ ] Every contract name matches design/M2.md exactly (`SimulationResult`, `StepTiming`, `BuildOrderIssue` and `BuildOrderNote` codes, `TechSupport` kinds including `effects-unmodeled`, `SIM_INPUT_BOUNDS`, `SimInputs.walkSeconds`, `CivRules` hook names, `upgradeTargets`, `influenceCoverage`, `loadGameData`, `GameData`, `SnapshotSource`, `OverlayEffect` `condition` fields `age`/`nearBuilding`/`producer`); no name the design lacks appears (respec 1)
- [ ] The engine rules (including the task-switch walk rule and its divisor), the `classifyTech` order and the paste grammar table and grammar details agree with design/M2.md line by line; the reviewer diffs them against it (respec 1)
- [ ] The doc's bounds table has one row per row of design/M2.md's `SIM_INPUT_BOUNDS` table with the same type, min..max and default, and states that a violation is an `out-of-range` issue for JSON and paste alike (respec 1)
- [ ] Each number the doc states (20,000, 200, 1200, 60..3600, 0..3600, 1..200, 0..60, 0..30, 0..1, 5 s sample, 5 s base walk, 3/(N+2) table, 0.75, 0.69, 10, 25, +20/25/30/30%, +10% King's Palace, 200 pop cap) matches CONTEXT.md Decisions or design/M2.md, and the doc labels the wiki-sourced ones and the 5 s walk unverified (respec 1)
- [ ] The doc states no hand-entered value that neither source gives (camp and town-center walk, drop-off, supply start and per-house, starting resources, landmark effects); it names `rules/base.json` or `rules/english.json` as their home (respec 1)
- [ ] The doc states A1, A2, A3 and S3 behavior in its own words (no negative resources and reported waits; deterministic; versioned data; bounded inputs)
- [ ] The v1 coverage list and the out list match CONTEXT.md "AoE4 v1 coverage and structure" item for item
- [ ] No file other than `docs/aoe4-build-order.md` changes
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-10-30

- Underspecified: `SIM_INPUT_BOUNDS` had no ranges past text, steps and duration, the paste token rules were open, and
  the ticket predated the generic `walkSeconds`, `effects-unmodeled`, overlay `condition` semantics and the ratified
  `data.ts` names.
- Changed: Scope 2-6 and the criteria now carry the full bounds table, grammar details, task-switch walk rule (5 s
  default, divided by the move-speed multiplier), King's Palace producer condition and unmodeled-tech note; open
  questions 1-2 deleted as answered, 3 folded into Context as a note.
- No branch work exists.
