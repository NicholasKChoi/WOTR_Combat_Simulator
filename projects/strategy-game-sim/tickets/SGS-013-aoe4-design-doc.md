# SGS-013: Write the AoE4 Build Order Simulator design doc `docs/aoe4-build-order.md`

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.1
- **Priority**: high
- **Risk**: high
  <!-- Defines the contract every AoE4 ticket and review is judged against: A1, A2, A3 and S3 are stated in it,
       and it fixes the public paste grammar and route bounds (PROJECT.md triggers: touches an invariant; changes a
       public schema, API, or cross-component contract). No logic changes. -->
- **LOC estimate**: ~250-350 lines of prose, 0 business logic (one new file, `docs/aoe4-build-order.md`; `docs/` on origin/main 6013fcc holds only `combat-simulator.md` and `api/openapi.json`)
- **Depends on**: SGS-012 (by rule; no technical dependency)
- **On merge**: CONTEXT.md Design docs row: change "`docs/aoe4-build-order.md` (TODO, M2)" to "(on `main`, SGS-013)". CONTEXT.md
  Decisions: delete the AoE4 lines the doc now carries in full ("AoE4 model scope", "AoE4 simulation", "AoE4 game data",
  "AoE4 gather rates", "AoE4 builder scaling", "AoE4 auto-houses", "AoE4 triggers", "AoE4 outputs", "AoE4 patch policy",
  "AoE4 v1 coverage and structure"); the reviewer confirms each is covered before the manager deletes it. Keep "AoE4
  interface" (route and page are not built yet) and "Dependency upgrade" (SGS-012). Key surfaces and Paths edits (M2.9)
  wait for the route and page tickets.
- **Source**: MILESTONES M2.1; reports/M2-plan.md outline A; design/M2.md (owner-approved); CONTEXT.md Decisions; ARCHITECTURE.md "Adding an app" step 1

## Context

`docs/aoe4-build-order.md` does not exist, so A1 to A3 and the paste grammar have nothing authoritative to be reviewed
against, and REPO.md's review checklist judges behavior against the page's design doc. The doc states the model, the
data sources, the paste grammar, the `CivRules` seams, the route bounds and the outputs, as settled rules. Every later
AoE4 ticket (data, engine, parser, route, page) implements against it.

## Scope

Create `docs/aoe4-build-order.md`: prose, tables, and two Mermaid diagrams (a data-flow flowchart from paste text through
parse, validate and simulate to the three graphs; a state diagram of one step's life: unarmed, armed, waiting, started,
completed, not-reached). Style follows `docs/combat-simulator.md` (title, one-paragraph lead, one `##` per topic,
rules stated flatly). Content is transcribed from design/M2.md and CONTEXT.md Decisions; where the design leaves a value
to a later ticket the doc names the file that will hold it and does not invent it.

1. **Purpose and model.** Simulates an *Age of Empires IV* build order step by step for the English civilization and
   returns one deterministic result per build order and data set. English only; other civs are a later extension.
2. **Determinism, bounds, resources (A1, A2, A3, S3).** Same input and data give the same result: no randomness, no clock.
   Every game number comes from a versioned data file. Resources never go negative; an unaffordable step waits and the wait
   is reported. Every numeric input has a bound enforced in `SIM_INPUT_BOUNDS`; stated here: paste text at most 20,000
   characters, at most 200 steps, `durationSeconds` default 1200 and range 60..3600, `sampleSeconds` 5.
3. **Data sources.** Pinned aoe4world snapshot (`data/aoe4-build-order/aoe4world/english.json`, entries verbatim, filtered
   to civs containing `en`) with `source` (repo, commit, committedAt, fetchedAt, patch live on committedAt, patchSource);
   hand-entered rules (`rules/base.json` civ-agnostic, `rules/english.json` overlay), each value a `HandValue` with
   `source` and `unverified`. Gather rates and carry capacities come from the fandom wiki (0.75/s for sheep, farm, gold,
   stone and wood; berries 0.69/s since update 12.0.1974; capacity 10, 25 for hunted meat) and builder scaling from the
   wiki Villager page (no patch stated); all labeled unverified. SichYuriy/aoe4-production-calculator values are a
   cross-check in a test only, never a source. Patch policy: the data reflects the current game only; no per-patch support.
   Ids are aoe4world `baseId`s, never names.
4. **Model rules**, each stated once: ordering and triggers (list order, arming, "not before" time, villagers alive,
   `waitSeconds = startedAt - armedAt`, `waiting` vs `not-reached`); queues (one per building instance, production and
   research share it, produce on a busy producer switches, pause clears); tier resolution and `upgradeTargets`; ages and
   landmarks (`^age[1-3]_landmark\d$`); trip model (`cycle = capacity / rate + walk / moveSpeedMultiplier + dropOffSeconds`,
   camp vs town center walk) and continuous income; construction `base x 3 / (builders + 2)` with the 100/75/50/30%
   table for 1, 2, 4, 8 builders; auto-houses (start computed from house build time, builder walk and combined production
   rate; builders and source resource are inputs, default 1 from wood; back-to-back or more builders when production
   outpaces one house; an explicit house step overrides; supply capped at 200); farms and mill coverage; English farm
   bonus near a mill (wiki values +20/25/30/30% by age, unverified). Includes the v1 coverage list and the out list
   (sacred sites, relics, trade, fishing, cattle, depletion; later: Council Hall, Network of Castles, Abbey of Kings).
5. **Technologies.** Supported properties, ignored combat properties, rejection rules and the `classifyTech` order;
   `forestry-1` as the example of a rejected `unknown` effect; Blacksmith and University techs cost and queue with effects
   ignored and one `tech-effect-ignored` note per research step; veterancy upgrades occupy the queue and change the tier of
   later units. Exact `IGNORED_EFFECT_PROPERTIES` membership is stated as "enumerated from the snapshot's English techs
   in `effects.ts`", not copied.
6. **Build order input.** JSON model (types from design Contracts, tagged triggers, unknown kinds rejected) and the paste
   grammar table with one example per action, comment and blank-line rules, error `line`, and `BuildOrderIssue` codes.
7. **Route.** `POST /api/aoe4-build-order/simulate` request, 200/400/405 shapes, `error` = first issue's message,
   malformed JSON keeps Next's plain-text 400; the full contract lives in `docs/api/openapi.json` once the route exists, so
   the doc names it and does not copy field lists.
8. **Outputs.** `SimulationResult` fields and meaning (units produced by unit and tier, gather rates per minute, floating
   resources, step timings, ages, notes); three graphs over time. The charting library and its test selectors are not in
   this doc (they live in the component and its tests).
9. **`CivRules` seams.** The eight hooks, value vs event kind, `rules.hook?.(...) ?? default`, English = `{}`.
10. **Extension points.** The design's table, reworded without product history.

Shipped text states facts only. It never names tickets, milestones, invariant numbers, factory files, or who decided what
(common.md hygiene).

**Out of scope:** any code, data file, JSON values, OpenAPI edit, or test; editing `design/M2.md`; the page title and
prebuilt build order (the page ticket); the Recharts version.

## Diagrams

Single-component change outside the core control loop; no diagram required. (The doc itself carries the two diagrams
listed in Scope; it changes no code.)

## Acceptance criteria

- [ ] `docs/aoe4-build-order.md` exists and covers sections 1 to 10 of Scope as `##` headings; the file is 250 to 400 lines
- [ ] `git grep -nE 'SGS-|M2\.[0-9]|INVARIANTS|CONTEXT\.md|design/M2|owner|Recharts' -- docs/aoe4-build-order.md` prints nothing (today the file does not exist, so it prints nothing; the check is meaningful after the change because Scope's source material contains all of those words)
- [ ] `git grep -c '^```mermaid' -- docs/aoe4-build-order.md` prints at least 2
- [ ] Every contract name matches design/M2.md exactly (`SimulationResult`, `StepTiming`, `BuildOrderIssue` codes, `TechSupport`, `SIM_INPUT_BOUNDS`, `CivRules` hook names, `upgradeTargets`, `influenceCoverage`); no name the design lacks appears
- [ ] The engine rules, the `classifyTech` order and the paste grammar table agree with design/M2.md line by line; the reviewer diffs them against it
- [ ] Each number the doc states (20,000, 200, 1200, 60..3600, 5, 3/(N+2) table, 0.75, 0.69, 10, 25, +20/25/30/30%, 200 pop cap) matches CONTEXT.md Decisions or design/M2.md, and the doc labels the wiki-sourced ones unverified
- [ ] The doc states no hand-entered value that neither source gives (walk, drop-off, supply start and per-house, starting resources, landmark effects); it names `rules/base.json` or `rules/english.json` as their home
- [ ] The doc states A1, A2, A3 and S3 behavior in its own words (no negative resources and reported waits; deterministic; versioned data; bounded inputs)
- [ ] The v1 coverage list and the out list match CONTEXT.md "AoE4 v1 coverage and structure" item for item
- [ ] No file other than `docs/aoe4-build-order.md` changes
- [ ] No INVARIANTS.md regressions

## Open questions

1. **For the designer (design/M2.md):** `SIM_INPUT_BOUNDS` has no numeric ranges beyond 20,000 characters, 200 steps and
   `durationSeconds` 60..3600. Time-trigger seconds, villager-count trigger, `count`, `builders`, `instance`, `move` count,
   `houseBuilders`, `reassignSeconds`, `builderWalkSeconds` and trip seconds are unbounded in the design. This ticket does
   not invent them (S3 makes the omission matter); the doc says only that each is bounded. Either the designer adds a
   bounds table now (and this ticket copies it) or the parser/validator ticket owns the numbers and then adds them to the
   doc.
2. **For the designer:** the paste grammar table is silent on token details: whether `m:ss` allows minutes of 60 or more
   (`@60:00`), whether `xN` and `-> node` may appear in either order, case sensitivity of ids, and whether ids may contain
   anything but `[a-z0-9-]`. Default if unanswered: the doc fixes `m:ss` with seconds 00-59 and unlimited minutes up to the
   time bound, `xN` before `->`, lowercase `baseId`s only.
3. **Overlap:** SGS-014 (data and model types) and SGS-016/SGS-017 (interpreter, parser) restate parts of this doc in code
   and tests; they follow this doc, so a change found there comes back here as a doc fix, not a silent divergence.
