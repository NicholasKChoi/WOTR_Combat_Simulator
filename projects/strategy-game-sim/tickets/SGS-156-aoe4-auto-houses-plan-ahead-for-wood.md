# SGS-156: Auto-houses plan ahead for wood and hold their cost back from steps and orders

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: high
- **Risk**: high
- **Invariants**: A2 (resources never go negative: new hold on step and order payments), A3 (same build and data give the same timings: changes the order of work inside an instant and the wake times)
- **Unverified assumptions**: none
- **LOC estimate**: 220 (due-house projection in `houses.ts`; the hold field, the shared held-affordability helper, the three house passes in `runInstant` and the wake needs in `simulate.ts`; the step checks in `produce`, `build` and `research`; business logic only)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md item "AoE4 auto-houses: plan ahead for wood" (owner request, 2026-11-13)

## Context

With thin wood, the Town Center gets supply-capped even with `autoHouses` on: steps and unit orders spend the wood first, and a house starts only the instant wood reaches its cost, after the TC is already housed (one more wood villager does not help, since steps take the extra wood first).

### Cause

- `planAutoHouse` in `lib/aoe4-build-order/houses.ts` projects population over the lead (walk plus build time) only. It ignores the time needed to gather the house's cost, so a house is never due before it is affordable.
- `startAutoHouses` in `lib/aoe4-build-order/simulate.ts` runs last in `runInstant`, after `offerSteps` and `startProduction`, and reserves nothing. Step handlers (`produce`, `build` in `simulate.ts`, `researchHandler` in `research.ts`) call `canAfford(state.resources, cost)` directly, and `orderNeed`/`payOrder` add only the waiting step's `engine.reserve`; nothing holds wood back for a house.
- Tests did not catch it because they pin it: `simulate-construction.test.ts` ("wake when the house becomes affordable") expects the house to start when wood reaches the cost, and `docs/aoe4-build-order.md` "Houses and supply" documents that auto-houses ignore reservations.
- Same defect elsewhere: every payment path (step handlers, including reaction steps offered by `offerReactions`, and order payments) and `nextWake`, which must wake for the held amount.

### Evidence

Fixture (default inputs; 4-5 villagers on wood, a council hall making longbows nonstop, food floating 2,000+). Today the TC is housed at pop 50, 60 and 70, at 10:00-10:35, 12:00-12:40 and 14:05-14:40:

```
start -> sheep
produce villager from capital-town-center
at 7 vils rally capital-town-center -> gold
at 8 vils build mining-camp from gold then gold
at 10 vils rally capital-town-center -> wood
at 15 vils rally capital-town-center -> sheep
@2:30 build council-hall with 3 from sheep then sheep
build mill from sheep then sheep
@4:30 produce longbowman from council-hall
@5:00 build farm from sheep then farm
build farm from sheep then farm
build farm from sheep then farm
build farm from sheep then farm
build farm from sheep then farm
build farm from sheep then farm
```

## Scope

Changes the documented house contract and every saved build's simulated result.

1. **Due house** (`planAutoHouse`, `houses.ts`). (respec 2) Let `lead` be today's lead (walk plus build time) and `G` the gather time of one house's cost: for each resource of the cost, `max(0, cost - banked) / income`, the largest of them, where `banked` is the real bank (step reserves are not subtracted) and `income` the current per-second income from the current gatherers (`incomePerSecond` over `gatherRatesOf`, at the moment of planning). A resource with a positive shortfall and zero income gives no finite `G`: the house is not due (the planner returns 0). Otherwise the planner uses the window `W = lead + G` everywhere today's code uses `lead`: pending buildings count toward headroom when they complete by `time + W`, and `shortfall = population + populationPerSecond * W - (supply + supply of those pending)`. A house is due when that shortfall exceeds `RESOURCE_TOLERANCE`. The count (whole-house rounding, the `maxPopCap` room) is computed from that shortfall as today. With `G = 0` (cost fully banked) the result equals today's planner exactly, `arriving` window included. The bank and the income reach the planner as inputs (extend `HouseDemand` or its parameters), built in `houseDemand` in `simulate.ts`. The due state may flip (due, not due, due) as the bank grows and steps spend it; that is intended, with no hysteresis.
2. **How much is held.** (respec 2) While any due house is not started (short of resources, or short of builders), the hold is one house's cost, whatever count the planner returns. Each started house drops out (it is pending and counts toward headroom by its completion time); when the planner still reports a house due after the starts, the hold stays one house's cost. With no due house, or with `autoHouses` off, the hold is zero. (respec 1) The hold is kept while the house is due and affordable but no builders are available (`houseBuilderSource` finds fewer than `houseBuilders` gatherers): owner decision, the house starts the moment builders free up, and holding may stall steps and orders meanwhile; no release for lack of builders while enough villagers exist. (respec 3) Owner answer (Q92, option A): the hold is released (zero) when the total villagers (gathering, walking, or building; not idle) number fewer than `houseBuilders`, since no wait can end it; the house is then not started either. In every other case the hold stays.
3. **When the hold is computed.** (respec 2) One house pass plans the due house, starts every due house it can afford with builders available (as `startAutoHouses` does today, ignoring step reserves), and then sets the hold from what is left. `runInstant` runs that pass three times: after `collectRunOuts` and before the first `offerSteps`; after `applyDueEvents` and before the second `offerSteps` (population, supply and builders change there); and after `startProduction` (a house made due by a payment this instant starts in this instant). The hold is constant between passes: a payment inside `offerSteps` or `startProduction` does not recompute it. `engine.reserve` keeps being reset in `offerSteps`; the hold is a separate field and is not reset there. `nextWake` reads the hold left by the last pass.
4. **How the hold applies.** (respec 2) The hold is a field on `EngineState`, read through one shared affordability helper that every paying step handler uses in place of `canAfford(state.resources, cost)` (`produce`, `build`, `researchHandler` are the current ones; a handler registered through `stepHandlers` uses the same helper). The helper requires, for each resource where the payment's cost is positive, `bank >= cost + hold` (mirroring `orderNeed`); a resource the payment does not spend is not held, so a food-only step never waits on a wood hold. Orders other than villagers need `cost + step reserve + hold` on each resource the unit costs (`orderNeed`); villager orders ignore both, as they ignore the step reserve today. A held step's `reserve` outcome stays its own cost; `payCost` still pays the real cost (A2). Explicit `build house` steps skip the hold: they start as ordered and keep counting toward the planner's headroom. Auto-houses still ignore step reserves.
5. **Wakes.** (respec 2) In `nextWake`, every step need (the cursor step's `engine.reserve` and each of `engine.reactionNeeds`) is evaluated as its cost plus the hold on each resource it spends, so a held step wakes at the instant the bank covers both. Order needs already include the hold when pushed to `engine.needs`; a due, unaffordable house keeps pushing its cost as today. No wake is added for the instant a house stops being due as `G` shrinks: the release takes effect at the next wake the loop already has (sample time, event, run-out, trigger, or an affordability need).
6. **No deadlock on resources.** With no income of a resource the house costs and that resource short, the house is not due and no hold is held; a payment then waits only on its own cost (plus the step reserve for an order). (respec 1) A hold for lack of builders is not released while at least `houseBuilders` villagers exist (gathering, walking, or building; idle villagers do not count), because the cost is banked and builders return as gatherers free up; the "no income" rule only covers a resource that is short and cannot be gathered. (respec 3) With fewer such villagers than `houseBuilders`, no wait can supply builders, so no hold is held and a payment waits only on its own cost (plus the step reserve for an order). Count the villagers from the engine's villager state; the implementer finds the field.
7. **Docs.** `docs/aoe4-build-order.md` "Houses and supply": the statements that the lead is walk plus build time only, that auto-houses are planned only "after production starts", and that auto-houses "ignore a waiting step's resource reservation" for payment become untrue or incomplete; the section also needs the due-house rule, the hold (one house, the resources it applies to) and the passes in the instant. (respec 3) Also fix `docs/aoe4-build-order.md` lines near the builder paragraph ("A house waits only when no node has enough gatherers or a resource of its cost is short; supply may block production meanwhile" now also blocks steps and orders, and the villager-shortage release applies) and the statement that a house under construction "that finishes within the lead counts toward the planner's headroom" (the window is lead plus gather time; one finishing exactly at the window counts). Check the "Extension points" paragraph on `productionModifier` ("when auto houses estimate supply demand") still reads true.
8. **Tests.** Update every test that pins the old contract. A test of the changed behavior gets the new expected value; any other test keeps its expected value and pins the old setting in its setup (for example `autoHouses: false` or banked wood). Likely dependents found by search, as examples: `simulate-construction.test.ts` ("wake when the house becomes affordable"; "project the demand at the modified production speed"; "ignore a waiting step reserve" keeps its assertion since auto-houses still ignore step reserves), `simulate-house-gate.test.ts` ("auto-houses at 120, 220 and 320 s" pins exact house times), `houses.test.ts`, the `paces auto-houses` test in `research.test.ts`, and `build-move.acceptance.test.ts` ("pays the research while an auto-house is building"). List every edited test in the report. Search the Playwright specs under `acceptance/` for dependence on the old timing (examples: `house-gate`, `house-rule`, `waits` with `autoHouses: true`, `spend-population` "counts an auto-house under buildings", `triggers`), and state in the report which depend on it.
9. **Changelog.** Every saved build's result shifts. No changelog file exists on `main`; the PR description states the shift, and the report notes this.
10. **Prebuilt-build bars.** (respec 5) Owner answer (Q98, option A): raise `MAX_FLOATING_AT_1200` in `lib/aoe4-build-order/production-floors.ts`, the one constant shared by `lib/aoe4-build-order/builds.test.ts` ("meets its production floors and keeps its floating resources under the cap at 1200 s") and `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts`, from 2000 to 2600 for every build. With this change the TC is no longer housed, more villagers reach wood, and `ENG 1TC` and `ENG 1TC Council Hall` reach the population cap before 1200 s with no wood spending left in their steps, so their floating wood at 1200 s (about 2512 and 2220 on the branch run) exceeds 2000. No floor is lowered, no build data changes for this, and the cap is not narrowed by build or sample. If the implementer measures any prebuilt build's floating resource above 2600 at 1200 s, it does not pick a higher number: it stops and reports needs_spec with the measured values. The other prebuilt-build bars in the `docs/aoe4-build-order.md` "Prebuilt builds" paragraph (no `waiting` step at 1200 s and 3600 s, the gold `move all` reactions, no `farm-idle` warning) keep holding for every build. Docs: `docs/aoe4-build-order.md` "Prebuilt builds" and `data/aoe4-build-order/README.md` `## Prebuilt builds` refer to the cap as "that file's cap" and do not quote its value today; the implementer greps the docs, comments and tests (including `production-floors.test.ts`) for any statement of the 2000 value or of the cap's reasoning and fixes each, and adds none that quotes the number.

**Out of scope:** explicit `build house` semantics, `autoHouses: false` behavior, how many houses cover a shortfall (whole-house rounding and the `maxPopCap` room), other civs' supply rules, holding resources for anything but houses, UI changes.

## Diagrams

```mermaid
flowchart TD
  subgraph read[Read]
    A[collectRunOuts] --> B["house pass 1: plan with bank and income, start due affordable houses, set hold"]
  end
  subgraph act[Act]
    B --> E["offerSteps: step payments need cost + hold on spent resources"]
    E --> F[applyDueEvents]
    F --> F2["house pass 2: plan, start, set hold"]
    F2 --> F3[offerSteps]
    F3 --> G["startProduction: non-villager orders need cost + step reserve + hold"]
    G --> H["house pass 3: plan, start, set hold"]
  end
  subgraph record[Record]
    H --> I["nextWake: step needs plus hold; order needs; house cost; no due-flip wake"]
  end
```

## Acceptance criteria

- [ ] (respec 2) The fixture above, with default inputs, keeps the Town Center producing villagers from 9:30 to 15:00: in the result's villager unit series, the count never stays flat for longer than one villager production time (from the data) plus one sample interval. The test first asserts that food stays above a villager's cost and villagers stay under the villager target in that window, and it fails at the base (where the count stays flat while the TC is housed). Fewer longbows than today is expected and not asserted.
- [ ] (respec 2) A house is due ahead of affordability: with thin wood and a short bank, the house is due once the shortfall is positive within lead plus gather time, the hold applies, and the house starts when wood covers it, in time for supply; a house whose gather time still leaves slack is not yet due. Tests fail if due-ness ignores gather time, if it ignores the bank, and if a pending building completing after lead but within lead plus gather time is left out of headroom.
- [ ] (respec 2) With the cost fully banked the due-house result equals the previous planner, including which pending buildings count toward headroom.
- [ ] (respec 2) When the planner returns two or more houses and none can start, the hold is one house's cost: a step that leaves exactly one house's cost of wood in the bank pays (a test fails if the hold is the count times the cost).
- [ ] (respec 2) While a house is due and unaffordable, a non-villager unit order and a step payment (`build`, `produce`, `research`, and a reaction step) that would take a resource it spends below the house cost wait; a step that spends none of the house's resources pays; a villager order still pays. Once the house starts, or stops being due, the hold is gone and the next payment goes through.
- [ ] (respec 2) A step held by the house wakes and starts at the instant the bank covers its cost plus the hold (or the house starts), not at a later sample (a test fails if its wake ignores the hold).
- [ ] (respec 2) A house that becomes due through events applied in the instant (a completed unit or building) holds its cost from the second step offer of that instant (a test fails if the hold is computed only at the start of the instant).
- [ ] A due, affordable house with builders available starts before the step that would have spent its wood in the same instant (a test fails if steps are offered first).
- [ ] (respec 1) A due, affordable house with fewer available builders than `houseBuilders` keeps its cost held: a step or non-villager order that would take the bank below the cost waits, and the house starts at the instant builders become available (a test fails if the hold is released for lack of builders, and one fails if the house does not start once builders free up).
- [ ] (respec 2) With zero wood income and wood below the house cost, a wood-costing step and a non-villager order each pay as soon as the bank meets their own cost (plus the waiting step's reserve for the order); no house hold is applied.
- [ ] (respec 3) With fewer villagers (gathering, walking, or building; not idle) than `houseBuilders` and a due house, a wood step and a non-villager order pay at their own cost (plus the waiting step's reserve for the order); the hold is not applied (a test fails if the hold stays). With at least `houseBuilders` villagers, all busy, the hold stays.
- [ ] A waiting step's reserve still does not hold back an auto-house (the existing assertion stays).
- [ ] An explicit `build house` step starts as ordered and is not held by the house reserve.
- [ ] Resources never go negative in any of the above runs, and the same build and data give identical results twice.
- [ ] Every test that pins the old house timing is updated per Scope 8, and the report lists them. `docs/aoe4-build-order.md` "Houses and supply" describes the due-house rule, the hold and the passes in the instant, with no sentence left saying auto-houses ignore all reservations or plan only after production, and every statement of the lead window in that doc (including the builder paragraph and the headroom sentence) matches lead plus gather time.
- [ ] (respec 5) `MAX_FLOATING_AT_1200` is 2600. Every prebuilt build meets its production floors and the floating cap at 1200 s in both `builds.test.ts` and `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts`, and every other prebuilt-build bar in the "Prebuilt builds" doc paragraph still holds, with no floor lowered and no build data changed for this. No doc states the old cap value.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-13

- Underspecified: whether the house cost stays held when the house is due and affordable but builders are unavailable.
- Changed: owner chose to keep holding; Scope 2 and 4 and the criteria now say so, with a new criterion for it; the zero-income rule stays (house not due) and is reconciled with it.
- Stands: all other Scope, diagram and criteria unchanged.

## Re-spec 2 - 2026-11-13

- Underspecified: the due formula and its window, the hold amount for 2+ houses, where in the instant the hold is computed, which resources it binds and how handlers see it, wakes when a house stops being due, and the behavioral signals for the no-income and supply-capped criteria.
- Changed: Scope 1-6 now state the formula (`W = lead + G` for the pending window and the projection), a one-house hold, three house passes per instant, a per-resource hold through one shared helper on engine state, step wakes with the hold and no due-flip wake; criteria rewritten or added for each; Scope 8 names the likely-affected tests and specs.
- Stands: no branch work exists yet; the owner's builder-hold decision and every other rule are unchanged.

## Re-spec 3 - 2026-11-13

- Underspecified: the builder hold never ended when fewer villagers exist than `houseBuilders`; the docs fix missed the builder-paragraph and headroom sentences.
- Changed: Scope 2 and 6 release the hold below that villager count (owner answer Q92, A); a new criterion covers it; Scope 7 and the final criterion cover every statement of the lead window.
- Stands: no branch work exists yet; all other Scope and criteria unchanged.

## Re-spec 4 - 2026-11-15

- Underspecified: Scope 8's existing-test rule covered house-timing and pinned-output tests but not the owner-confirmed prebuilt-build thresholds (production floors and the 1200 s floating cap), which two builds now exceed on wood.
- Changed: new Scope 10 and a criterion keep every prebuilt-build bar holding and forbid changing the floors or the cap on the branch; how ENG 1TC and ENG 1TC Council Hall get back under the cap is an owner question (raise the cap, add a wood sink to the two builds, or narrow the cap).
- Stands: all branch work at ff47225 (engine, docs, tests and pinned-value updates); only the resolution of the two floating-cap failures remains, after the owner answers.

## Re-spec 5 - 2026-11-15

- Underspecified: how the two builds over the floating cap are resolved (open owner question).
- Changed: owner chose option A (Q98): Scope 10 and its criterion raise `MAX_FLOATING_AT_1200` to 2600 for every build; the open question is removed.
- Stands: all branch work at ff47225; only the cap constant (and any doc or test text stating it) remains.

## Rework 1 - 2026-11-15 (review)

Review of tip 411dfb3 (report `reports/SGS-156-review-1.md`): REQUEST CHANGES. Earlier gates passed: implementer at ff47225 (engine fix) and 411dfb3 (cap 2600, Re-spec 5); spec-gate READY (spec-gate-4).

Findings:
- `lib/aoe4-build-order/simulate-house-hold.test.ts:75-79`: "holds one house cost when several houses are due and none can start" checks its "several houses are due" precondition on a different setup (`houseBuilders: 1`, 6 due) from the run it asserts (4 builders, only 2 due, right at the threshold), so a data or tuning change dropping it to 1 leaves the test checking nothing.
- `docs/aoe4-build-order.md:332-333` (text): "Villager payments and explicit `build house` steps ignore the hold." overstates: a `produce villager` step is held (`simulate.ts:394`); only villager order payments skip the hold.

Required fixes:
- [x] Run that test's precondition on the asserted setup, e.g. `holdRun([], { ...slow, wood: 1000 }, {}, { villagers: { sheep: 8 }, rally: 'stone' })`, keeping the `>= 2 * HOUSE_WOOD` assertion (review measured 100, two houses at t=0). The test must fail when `simulate.ts:684` sets the hold to the due count times the house cost (barracks `startedAt` goes from 0 to null); record that mutation in the report.
- [x] (text) Replace the doc sentence with exactly: "Villager order payments and explicit `build house` steps ignore the hold."
