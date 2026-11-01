# SGS-032: Research technologies and veterancy upgrades in the engine queue

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.3 (techs; an upgrade delays production and changes the produced tier)
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: changes what a simulation computes (tier of every produced unit, income after a tech) and the order of operations a result depends on (research shares the instance FIFO with production, A3); edits the core loop file simulate.ts; adjacent invariants A1, A2, A3. -->
- **LOC estimate**: ~160 business logic (`research.ts` new: handler ~60, tier resolution ~30, notes ~30; `simulate.ts` call sites ~15 in place); tests on top.
- **Depends on**: SGS-030 (and transitively SGS-027, SGS-029). Sibling SGS-031 (`build`, `move`, ages) is ticketed in parallel; the handlers are disjoint. Both add one entry to the `stepHandlers` literal and one clause to the result assembly in `simulate.ts`, so expect a trivial textual conflict there.
- **On merge**: none
- **Source**: design/M2.md "Engine rules" (Queue, Tier, `classifyTech`), "Production" (Follow-ons: `research` pays at step start, appended to the FIFO, never replaces the order); reports/M2-plan-2.md outline H; reports/M2-designer-wave3.md (SGS-032 must); design/M2.md "Research target" and "Repeat research" (reports/M2-designer-wave5.md); docs/aoe4-build-order.md "Queues", "Tiers", tech classification, "Outputs"

## Context

A `research` step is the only way a technology or veterancy upgrade takes effect. It must cost resources (A2), occupy its building's queue for its research time, delay the production behind it, and from completion change gather rates (techs) or the tier of units paid afterwards (upgrades). This extends the SGS-030 loop through the handler seam it fixed; it does not change the loop.

## Scope

Names are SGS-030's Seam signatures, used unchanged: `EngineState`, `StepHandler`, `StepStart`, `stepHandlers`, `BuildingInstance`, `PaidItem`, `ProductionOrder`. From earlier tickets: `classifyTech` (`effects.ts`, on origin/main 68e004a), `modifiedValue`, `data.upgradeTargets` (`Map<upgradeBaseId, HandValue<unitBaseId>>`), `BuildOrderNote` and `TechSupport` (`model.ts`). Validation (SGS-029) already guarantees the tech exists, is not `rejected`, that `at` is in the union of the tech entries' `producedBy`, and that no `research` step repeats the `tech` of an earlier one (design "Repeat research", `invalid`); the engine re-checks none of it. In particular the engine has no "already researched or already queued" check and never pays for a tech twice (respec 1).

### 1. New `lib/aoe4-build-order/research.ts`

Imports `EngineState`, `StepHandler`, `BuildingInstance`, `PaidItem` from `./simulate` as types only (`import type`), so there is no runtime cycle.

- `researchHandler: StepHandler<'research'>`. Tech entry = lowest-age `data.byBaseId.get(step.tech)` entry. Target (design "Research target", respec 1): candidates = `[step.at]` if given, else the entry's `producedBy` in snapshot order; target = the lowest-numbered existing instance (`instance` 1 first) of the first candidate baseId that has any instance. Queue length (`paid`, `order`) is not consulted. No `instance` field on `research`. Returns:
  - no candidate instance exists: `{ started: false }` (no reserve), blocks later steps, like `produce`. This includes a tech with empty `producedBy` and no `at` (`upgrade-king-3`, `upgrade-king-4`): it never starts;
  - `entry.age > state.age`: `{ started: false }` (no reserve);
  - costs (`food/wood/gold/stone`) not all `<=` the floating resources: `{ started: false, reserve: <the tech's costs> }`;
  - else pay: subtract the costs from `state.resources` (`popcap` is 0 for techs; do not touch `population`), append `{ entry, complete }` to the target's `paid` (FIFO, behind any unit already paid), return `{ started: true }`. The target's `order` is left untouched: it pays its next unit only when `paid` is empty again, so it resumes after the research.
  - `complete(state, at)`: add `entry.baseId` to `state.researched`, set `state.steps[index].completedAt = state.time` and status `completed`. Nothing else: no population change, nothing in `unitsProduced`.
- The engine's existing item start gives the duration `entry.costs.time / modifiedValue(1, 'productionSpeed', { baseId: entry.baseId, classes: entry.classes, producer: instance.baseId }, state)`; no engine change is needed for it. Effects take hold from `complete` through the existing `modifiedValue` reads (the next instant recomputes income; walks already started keep their duration; units already in production keep theirs).
- `resolveUnitEntry(baseId: string, state: EffectState): SnapshotEntry | undefined`: the entries for `baseId` (`data.byBaseId`, ascending age); among `state.researched` baseIds `u` with `data.upgradeTargets.get(u)?.value === baseId`, take the largest upgrade entry `age` (`data.byBaseId.get(u)`) and return the unit entry whose `age` equals it; no researched upgrade, or no unit entry at that age: the lowest-age entry. Availability (`entry.age > state.age`) stays SGS-030's check, applied to the returned entry. A unit's entry is fixed when paid, so a unit paid before the upgrade completes keeps the lower tier.
- `researchNotes(order: BuildOrder, data: GameData): BuildOrderNote[]`: for each `research` step in step order, reached or not, `classifyTech(entry, data)`: `effects-ignored` gives one `{ code: 'tech-effect-ignored', step: index, tech: step.tech, properties, message }`; `effects-unmodeled` gives one `{ code: 'tech-effect-unmodeled', ..., properties: [] }` with a message saying the effect is not simulated; `supported` gives none. Messages name the tech and, for ignored, the properties. A pure function of `(order, data)`, so it never depends on the run (A3).

### 2. `simulate.ts` (edits in place; no other loop change)

- Register `research: researchHandler` in the `stepHandlers` literal (SGS-031 adds its own entries).
- Replace SGS-030's "lowest-age `data.byBaseId.get(unit)` entry" lookup, at both places it is used (order payment and the `produce` handler), with `resolveUnitEntry(unit, state)`.
- `SimulationResult.notes` = `researchNotes(order, data)` instead of `[]` (SGS-031's notes, if any, are merged in step order).

### 3. Docs (`docs/aoe4-build-order.md`)

- "Queues": research pays at step start, is appended to the instance FIFO behind paid units, never replaces the instance's order, which resumes (pays its next unit) when the research ends; it waits while no target instance exists or the tech's age is not reached, and reserves resources only when short of resources alone.
- "Tiers": the tier is chosen when a unit is paid; a unit paid before an upgrade completes keeps the lower tier; an upgrade with no unit entry at its age does not change the tier.
- Step life: `research` completes when its research time ends.
- "Outputs" `notes` bullet already describes the notes; check it still matches (one per research step, reached or not, step order).
- Grep `docs/` and `data/aoe4-build-order/README.md` for `research`, `tier`, `upgradeTargets`, `veteran` and fix anything contradicted (on 68e004a the "Tiers" paragraph l.135-139 is extended, not contradicted).

**Out of scope:** `build`, `move`, ages, houses (SGS-031); parsing and validation of `research` (SGS-028/029); changes to `effects.ts`, `gather.ts`, `model.ts`, `data.ts`; cancelling or refunding research; new `CivRules` hooks; the route and page (SGS-033).

## Diagrams

Changes a core control loop's queue. State of one instance's queue with research (transitions this ticket adds):

```mermaid
stateDiagram-v2
  Idle --> Researching: research starts on an idle instance (cost paid at step start)
  Producing --> Producing: research starts, paid behind the unit in production; the order stays set
  Researching --> Idle: research ends, tech or upgrade added to researched
  Idle --> Producing: order pays its next unit at the same instant, tier read now
```

Read, act, record for one `research` step offer:

```mermaid
flowchart TD
  subgraph read
    A[tech entry, target instance, age, floating] --> B{target exists, age reached, affordable}
  end
  subgraph act
    B -- no --> C[not started; reserve only if short of resources alone]
    B -- yes --> D[pay costs, append to the instance FIFO, order untouched]
  end
  subgraph record
    D --> E[startedAt; on research end: researched.add, completedAt]
  end
```

## Acceptance criteria

- [ ] Upgrade delays production and changes the tier: test `GameData` (cloned, starting age 3, starting `barracks`, enough food and gold), `produce spearman from barracks` (continuous) then `@0:05 research veteran-spearmen`. Spearman 1 (entry `spearman-2`) is paid at its step start and spawns at its end; the research starts when it ends and takes 60 s (`veteran-spearmen-3`); the next spearman is paid when the research ends and is `spearman-3`, so with the same inputs but no research step the second spearman spawns 60 s earlier and is `spearman-2`. `unitsProduced` has separate series for `spearman-2` and `spearman-3` with `tier` 2 and 3. The `produce` order is still the instance's order after the research.
- [ ] Tier fixed at payment: test `GameData` with two starting `barracks` and spearman `costs.time` 100. Steps: `produce spearman from barracks#2 x1` (paid at 0), `research veteran-spearmen at barracks#1` (starts at 0, completes at 60), `@1:10 produce spearman from barracks#1 x1` (paid at 70). The unit paid at 0 spawns at 100 as `spearman-2` although the upgrade completed at 60; the unit paid at 70 is `spearman-3`. A `produce` step without the `@1:10` trigger would pay at 0 and so also be `spearman-2` (tier is read at payment, not at spawn). `resolveUnitEntry` unit test: no upgrade researched gives the lowest-age entry; `veteran-spearmen` researched gives the age-3 entry; an `upgradeTargets` row pointing at a unit with no entry at the upgrade's age gives the lowest-age entry.
- [ ] (respec 1) Research target: test `GameData` at starting age 2 with a starting `capital-town-center` (instance 1) and two starting `town-center`s (instances 1 and 2), enough food and gold (`textiles-2` costs 50 food, 100 gold, 20 s). `research textiles` (producedBy `capital-town-center`, `kings-palace`, `town-center`) is paid onto `capital-town-center` #1's FIFO; `research textiles at town-center` (separate run) goes to `town-center` #1, not #2, even when `town-center` #1 already has a paid villager and #2 is idle (queue length not consulted). With `capital-town-center` removed from the starting buildings, `research textiles` goes to `town-center` #1 (`kings-palace` has no instance, so the next candidate is used).
- [ ] (respec 1) A2: a `research` step short of resources only is `waiting` with `startedAt` equal to the time the missing resource reaches the cost (hand-computed), floating never below 0, and the order payments respect its reserve (a unit costing a resource the tech also costs is not paid below the tech's cost of it). A research step with no target instance (`research wheelbarrow at mill` with no `mill`), an unreached age (`research veteran-spearmen` at age 2), or a tech with empty `producedBy` and no `at` (`research upgrade-king-3` at age 3, respec 1) is `waiting` at the horizon, reserves nothing (a later-affordable order payment is not held back by its cost), and blocks later steps.
- [ ] Techs apply from completion: `research wheelbarrow at mill` (test `GameData` with a starting `mill`) costs 50 wood and 150 gold at its start, `gatherRates` at samples before its completion (90 s) equal those without the step, and at samples after it equal `gatherers x effectiveGatherRate(...) x 60` computed with `wheelbarrow` researched; `completedAt` equals `startedAt + 90 / productionSpeed multiplier`. It does not change `population` or `unitsProduced`.
- [ ] Research shares the queue: while a tech is researched at the `capital-town-center` (`research` with `at` given, a test tech produced there), the default villager order pays nothing until it ends, then resumes; a villager paid before the research starts still spawns on time.
- [ ] Notes: `research bloomery` (blacksmith tech, `meleeAttack`) yields exactly one `tech-effect-ignored` note with `step` = its index, `tech` `bloomery` and `properties: ['meleeAttack']`, the tech still costs and queues; `research shaft-mining` yields one `tech-effect-unmodeled` note with `properties: []`; a research step that is `not-reached` at the horizon still yields its note; notes are in step order; `research wheelbarrow` and `research veteran-spearmen` yield none. Two runs on equal inputs have deeply equal notes (A3).
- [ ] Reuse: `git grep -nE "classifyTech" -- lib/aoe4-build-order/research.ts` finds at least one call; `git grep -nE "byBaseId.get\(unit\)|\[0\]" -- lib/aoe4-build-order/simulate.ts` finds no remaining direct lowest-entry lookup for a produced unit (check the call sites by reading; the lookup exists only inside `resolveUnitEntry`).
- [ ] Mutation: replacing `resolveUnitEntry`'s upgrade lookup with `entries[0]` makes the delay-and-tier test fail; making `complete` skip `state.researched.add` makes the wheelbarrow test fail. (Both code paths are new in this ticket; confirm each fails when applied.)
- [ ] A1: no numeric literal in `research.ts` other than `0` and `1`; changing a research `costs.time` or a cost in a test `GameData` changes the output.
- [ ] `docs/aoe4-build-order.md` states that research is paid at step start, joins the FIFO and the order resumes after it, and that a unit's tier is fixed when paid: `git grep -niE "resumes|fixed when paid" -- docs/aoe4-build-order.md` finds at least one line (none on 68e004a).
- [ ] `npm test` and `npx tsc --noEmit` pass; no INVARIANTS.md regressions.

## Open questions

None.

## Re-spec 2026-10-31

- Underspecified: which instance takes a `research` when several exist, and what a repeated `research` does; both were Open questions.
- Changed: Scope states the design's Research target rule (candidates `[at]` else `producedBy` in snapshot order, lowest-numbered instance of the first candidate with one, queue length ignored, empty `producedBy` without `at` never starts) and that repeats are a SGS-029 validation issue, so the engine has no repeat check and no pay-again path; added the Research target criterion and the `upgrade-king-3` waiting case; Open questions removed.
- Branch work: none expected yet; any existing `research.ts` handler with the lowest-numbered-instance target still stands; drop any engine repeat check or pay-again test.
