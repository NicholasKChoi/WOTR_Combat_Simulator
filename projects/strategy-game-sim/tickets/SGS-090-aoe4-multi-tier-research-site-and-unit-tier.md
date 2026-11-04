# SGS-090: Research at the entry's own producer; resolve a unit to the highest researched tier that has an entry

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage 2026-11-03: engine cleanups)
- **Priority**: low
- **Risk**: high
  <!-- strongModelTriggers: changes what a run computes (research target and unit tier resolution), though only
       for data no shipped file contains. No criticalPaths symbol changes; picked high because the tier is the
       owner's call to discard (see Open questions). -->
- **Invariants**: A1 (game numbers come only from data files), A3 (same build order and data give the same timings)
- **LOC estimate**: 20 (`researchEntry`, `researchHandler`, `resolveUnitEntry` in `lib/aoe4-build-order/research.ts`)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md bullets on `validate.ts:311` `research X at B` (SGS-041 review) and `research.ts` `resolveUnitEntry` fallback (SGS-062 review); triage of the multi-tier bullets, below. Branch: `sgs-090-aoe4-multi-tier-research-site-and-unit-tier`.

## Context

Multi-tier handling landed (SGS-052/053). Checked on `main` at `ee7ecb9`, three of the five triaged backlog bullets are
already fixed or intended (listed under Triage). Two gaps remain, both only reachable with data that has more than one
entry per tech baseId or a unit tier gap. **No shipped data reaches either**: in
`data/aoe4-build-order/aoe4world/english.json` every `technologies` and `upgrades` `baseId` has exactly one entry, and
every `upgradeTargets` value in `rules/english.json` has a unit entry at its upgrade's age. The ticket is a
correctness hardening for future data; the owner may discard it.

## Triage (dropped, with evidence on `main`)

- `effects.ts` `activeEffects` applies every entry of a baseId: fixed. `EffectState.researchedIds` holds entry ids and
  `activeEffects` reads `state.data.byId.get(id)` per researched id; `research.test.ts` "applies only the effects of the
  researched entry, not of its sibling" pins it.
- `effects.ts` `conditionWeight` exact-age match: intended. The four `farmGatherRate` rows in `rules/english.json` carry
  `condition.age` 1, 2, 3, 4 with values 1.2, 1.25, 1.3, 1.3, each replacing the last, so "from age N on" would stack
  them. `docs/aoe4-build-order.md` ("Overlay effects") states "`age`: the current age is exactly this age".
- `research.ts` age max vs first-entry check: fixed. `researchEntry` picks the highest entry at or below the current
  age and the handler uses it for age, cost and producers; `research.test.ts` "multi-tier research" pins it.

## Scope

Paths relative to the repo root.

1. `research.ts` `researchEntry(baseId, state, at?)`: with `at` given, consider only entries whose `producedBy` includes
   `at`, still choosing the highest entry at or below the current age; without `at` the result is unchanged.
   `researchHandler` passes `step.at`. When no entry qualifies it returns `{ started: false, waitingOn: 'prerequisite' }`
   with no reserve, the existing outcome for "every tier above the age". The handler then no longer sends an entry to a
   building that is not in that entry's `producedBy`.
2. `research.ts` `resolveUnitEntry`: among the researched upgrades that target the unit, take the highest upgrade age that
   has a unit entry at that age and return that entry; with none, return the lowest-age entry as today. A researched
   upgrade with no unit entry at its age changes no tier (already stated in `docs/aoe4-build-order.md`, "Tiers").
3. Docs (`docs/aoe4-build-order.md`): in the research-target paragraph (starts "A `research` step goes to `at`") and the
   wait text after "A completed research adds a marker", state that with `at` the entry researched is the highest one at
   or below the age that the building `at` produces, and the step waits (`prerequisite`) while there is none. In the
   "Tiers" paragraph keep "An upgrade with no unit entry at its age changes no tier" and add that it does so even when a
   lower upgrade of the unit has an entry. The `invalid` rule "`at` is not a `producedBy` building of the technology"
   stays: it accepts any entry's producer, and the engine now picks per entry.
4. Tests (`lib/aoe4-build-order/research.test.ts`, "multi-tier research" and `resolveUnitEntry` blocks, using the
   existing `addTier` and `editGameData` helpers). Any existing test whose expected value changes is listed in the
   report; none is expected to.

**Out of scope:** `researchNotes` (`research.ts`) classifies the first entry of a tech only; a tier whose effects differ in
support is not noted per tier. `schema.ts` `techSites` (union of producers) is correct for validation and stays. No data,
API, or UI change.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Shipped results unchanged: before editing, run `simulateBuildOrder` on each of the build orders under
      `data/aoe4-build-order/builds/` and on `data/aoe4-build-order/builds/*` with `at` added to every `research` step
      that has none (the first `producedBy` building), with the default inputs, and save `JSON.stringify` of each result.
      After the change, the same run gives byte-identical output. The report states the files run and "identical".
- [ ] `research.test.ts` case: a tech with entry A (age 1, `producedBy` `['mill']`) and entry B (age 2,
      `producedBy` `['mill', 'town-center']`), step `research` with `at: 'town-center'` at age 2 researches B; at age 1 it
      returns `{ started: false, waitingOn: 'prerequisite' }` and pays nothing. Catches a handler that sends A to the
      wrong building.
- [ ] `research.test.ts` case: the same tech with `at: 'mill'` at age 2 researches B (highest entry that `mill`
      produces); without `at` the result is B as before. Catches a filter that ignores age or drops the no-`at` path.
- [ ] `research.test.ts` `resolveUnitEntry` case: unit with entries at ages 2, 3, 4, upgrades targeting it at ages 3 and 4,
      the age-4 unit entry removed, both upgrades researched: result is the age-3 entry (today: the age-2 entry). Also
      the existing single-upgrade gap case still gives the lowest-age entry.
- [ ] No criterion in the existing `researchEntry`, `a research step`, and `resolveUnitEntry` tests changes meaning.
- [ ] `docs/aoe4-build-order.md` states the `at` and tier-gap rules from Scope 3; `git grep -n "first entry" -- lib/aoe4-build-order/research.ts docs/aoe4-build-order.md` shows no line claiming the handler checks only the first entry.
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npm test` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

- **owner**: With shipped data neither gap can occur. Keep this hardening for future civ data (a second civ, or aoe4world
  adding a second entry per tech), or discard the ticket and delete the two backlog bullets as "theoretical"?
- **owner**: When `at` names a building that produces only a lower-age entry than the current age, the step researches that
  lower entry (this ticket's rule). Alternative: wait for the highest entry overall and report `prerequisite`. Which?
