# SGS-013 spec gate

Verdict: NEEDS_SPEC (4 gaps, none owner-only; each is a small ticket edit)

Checked against: ticket SGS-013 (draft, risk high), design/M2.md (working tree, which has an uncommitted `startingState.units` edit),
CONTEXT.md, INVARIANTS.md, SGS-014, origin/main 6013fcc (docs/ holds only combat-simulator.md, api/openapi.json: confirmed).

## Gaps

1. **Scope 4 / 8 / criteria - starting units (design/M2.md pending edit)** - The design now adds `startingState.units:
   HandValue<Record<string, number>>` (English `{ scout: 1 }`), a "Starting units" rule: they count toward population (7/10 at
   start), never appear in `unitsProduced` (series start at 0), the `startingState` CivRules hook may override the whole object, and
   sheep are not units in v1. The ticket's model rules and Outputs say nothing about starting units or about what counts toward
   population, so an author working from the ticket alone would omit the rule, or would list `startingState` as the four old fields.
   Fix: add to Scope 4 a "starting state and population" rule (starting units count toward population but are not produced; sheep are
   the `sheep` gather node, not units); add to Scope 8 that `unitsProduced` counts produced units only; add a criterion that the doc
   states both and that the `CivData.startingState` field list equals the design's (`age, resources, villagers, units, buildings`)
   when the doc names it; add the Source line "design/M2.md Starting units paragraph". Land the design edit before the ticket reaches
   an implementer; the ticket must not cite it while it is uncommitted. Also update SGS-014 (its Open question 1 and Known data gap
   about the scout are now answered), outside this ticket.

2. **Scope (state diagram) - state names vs `StepTiming.status`** - The ticket lists the diagram states as "unarmed, armed, waiting,
   started, completed, not-reached". The design's `StepTiming.status` is `completed | in-progress | waiting | not-reached`; `armed`,
   `unarmed`, `started` are not result values and `in-progress` is missing from the diagram. The implementer must guess how they map,
   and the "names match design exactly" criterion is ambiguous for these. Fix: say the diagram is conceptual and map it: unarmed (trigger
   not met or an earlier step not started) -> armed (`armedAt` set) -> waiting while unaffordable or supply-blocked -> started
   (`startedAt` set; status `in-progress`) -> completed (`completedAt`); at the horizon unarmed gives `not-reached`, armed/not started
   gives `waiting`, started/not finished gives `in-progress`. State that Outputs lists all four `status` values.

3. **Scope 3 - "all labeled unverified" contradicts SGS-014** - The ticket says the gather rates and carry capacities (0.75, 0.69, 10, 25)
   are "all labeled unverified" and criterion 7 says the doc labels "the wiki-sourced ones" unverified. SGS-014 (same milestone, the file
   that will hold the values) sets the sheep, deer and boar capacities from owner in-game observation with `unverified: false`, and gives
   deer 0.825/s and boar 0.9/s, which neither design/M2.md nor CONTEXT.md states. A doc author copying Scope 3 would mislabel the
   observed capacities or, to be safe, drop the deer/boar rates inconsistently. Fix: reword Scope 3 to "wiki-sourced rates and capacities
   are unverified; the sheep, deer and boar capacities are observed in game and not marked unverified" (or: the doc states only the
   values CONTEXT/design give and says per-node rates, capacities and their labels live in `rules/base.json`). Pick one and align
   criterion 7 and 8 ("states no hand-entered value neither source gives").

4. **Scope 1 / 4 - CONTEXT.md Decisions lines deleted on merge but not fully carried** - On merge deletes "AoE4 model scope",
   "AoE4 simulation" and "AoE4 game data" on the claim the doc carries them in full. Not enumerated in Scope: town centers and landmarks
   are ordinary buildings; "optimal villagers" means villager producers produce continuously by default; every construction pulls its
   assigned villagers off their resource; resources are infinite (no depletion) in v1 (only appears in the "out" list); every quantity
   that could vary is a named input and a later spread is a new field beside existing ones (Extension points "Spread result" covers the
   second half only). The reviewer will confirm coverage item by item, so an omission then forces a re-spec or a lost rule. Fix: add these
   sentences to Scope 1 and 4 (a one-line checklist is enough) and a criterion "each deleted Decisions line has its rules in the doc".

## Notes (non-blocking)

- Criterion 2 grep: make it case-insensitive and extend it: `-niE 'SGS-|M2\.[0-9]|INVARIANTS|CONTEXT|design/M2|owner|recharts|reassignSeconds|builderWalkSeconds|reports/|research|respec'`.
  The spec's own check currently lets "recharts" and "reports/" through.
- The doc will reference files that do not exist at its merge (`rules/*.json`, `data/aoe4-build-order/README.md`, `lib/aoe4-build-order/*`,
  `docs/api/openapi.json` entry). The ticket should say these are created by later tickets and the doc names them as the future home,
  worded as present-tense facts ("the OpenAPI spec is authoritative"), not "once the route exists" (process wording).
- Scope 5 and design: tech-effect-ignored notes are emitted "per research step (reached or not), in step order"; Scope 5 omits "reached or
  not" and "in step order". Add them.
- Paste examples (Scope 6) should use real baseIds from the design (`villager`, `town-center`, `house`, `wheelbarrow`, `veteran-longbowmen`)
  and valid node names so they parse under the doc's own grammar.
- Criterion "states A1, A2, A3 and S3 behavior in its own words" is subjective; acceptable because the reviewer reads it, but a sentence
  per behavior with its observable test (e.g. unaffordable step has `waitSeconds > 0`) would make it checkable.
- CONTEXT.md "AoE4 interface" (kept on merge) still says the API route is "left to the M2 technical design"; the design decided it. On merge
  rewrite it to the decision (route chosen) instead of keeping it as-is; otherwise it reads as an undecided point.
- The four 'Risk' triggers apply (public contract, adjacent invariants A1-A3, S3): `high` is correct. Dependencies (SGS-012, "by rule") and
  size (prose, 0 logic, 300-450 lines achievable; combat-simulator.md is 164 lines for comparison) are fine. Diagram trigger statement is
  correct (docs only; the doc carries its own two). Open questions: ticket and CONTEXT.md both None. LESSONS.md files are empty.
- Checked OK: every CONTEXT.md Decisions line named in On merge exists; Design docs row text matches; the bounds table in Scope 2 matches
  design/M2.md row for row; engine rules, `classifyTech` order and grammar details in Scope 4-6 match the design; 5 s walk and divisor match.
