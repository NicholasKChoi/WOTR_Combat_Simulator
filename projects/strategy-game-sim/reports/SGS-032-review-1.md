# SGS-032 review 1

- Ticket: SGS-032 (research handler and veterancy), risk high, full review (first review)
- Branch: sgs-032-aoe4-research-veterancy @ 422b26f (local), base origin/main a714a23 (merge-base matches)
- Worktree: $FACTORY_DIR/worktrees/review-sgs-032 (detached; removed after review)
- Verdict: **APPROVE**

## Blocking findings

None.

## Spec gaps

None that block. One ticket and design data error, covered under Acceptance criteria (Notes) and Out of scope:
the `shaft-mining` example for `effects-unmodeled` is wrong for the shipped data.

## Gates run

- `npx tsc --noEmit`: clean.
- `npm test`: 21 files, 590 tests, all pass.
- `npx next build`: succeeds. No aoe4 page or route exists yet, and the diff touches only `lib/` and `docs/`, so no page could be loaded under `npm run dev`.
- Review bot: `reviewBot.cli` and `rulesFile` are empty, so none was run.
- Hygiene: the commit is authored by choinickolas@gmail.com. The code, comments, docs and commit message contain no ticket ids, invariant numbers or factory pointers.

## Points the manager asked about

1. **Affordability margin `Math.sqrt(Number.EPSILON)` (research.ts:10) against `1e-9` (simulate.ts:14).**
   - A2 holds. The check runs before any spend (research.ts:44), and the subtraction is clamped with `Math.max(0, ...)` (research.ts:48), which is the same clamp as `payUnit` (simulate.ts:225). Floating can never go negative.
   - The two margins behave the same in practice. I measured the shortfall at the gold-arrival instant in the float-rounding test: 1.42e-14. I swapped the margin to `1e-9` and then to `1e-12`, and every behavioral test still passed; only the 0/1 source-literal test failed.
   - The only theoretical difference: research accepts a shortfall between 1e-9 and 1.5e-8 resource units. With the `1e-9` margin, `affordableAt` (simulate.ts:407) would instead schedule a wake a few nanoseconds later. That cannot be seen in the output.
   - There is no stall risk. When research's check fails, the shortfall is above 1.5e-8, which is above 1e-9, so `affordableAt` always schedules a wake.
   - The ticket allows it. It fixes no tolerance, requires `import type` only from `./simulate`, and forbids literals other than 0 and 1.
   - The implementer's cycle claim is correct. `simulate.ts:281` reads `researchHandler` while the module is being evaluated. If research.ts imported simulate.ts at runtime, a test that loads `./research` first would evaluate simulate.ts before research.ts and hit a TDZ error.
   - Maintainability: two constants with the same name and comment but different values. See Non-blocking note 1.
2. **The surviving payOrder age-check mutant (simulate.ts:326) is unreachable.** I confirmed it: dropping the check leaves all 519 aoe4 tests passing. Reasoning:
   - Orders come from only two places. `produce` (simulate.ts:253) runs after the same `resolveUnitEntry` plus `entry.age > state.age` check. `addBuildingInstance`'s default villager order uses `villager-1`, which is age 1, the minimum.
   - No age-up exists on this base, and per the design ages never decrease.
   - No `upgradeTargets` row targets `villager`.
   - Every technology and upgrade in the snapshot has exactly one entry (I counted 0 multi-age ones). The handler checks that entry's age against the current age before paying (research.ts:37), so a resolved tier's age is always at or below the current age.
   - So the claim holds on today's data. Keeping the check as a mirror of `produce` is reasonable. Non-blocking note 2 covers a data shape that would make it reachable.
3. **shaft-mining.** The claim is true. `shaft-mining-3` has empty `effects`, and `rules/english.json` lines 169 and 183 carry overlay rows with `grantedBy: "shaft-mining"`. `classifyTechnology` (effects.ts:60-62) therefore returns `supported`, so no note is produced. The replacement is sound: `admiralty-2` has empty effects and no overlay row (grep finds no `admiralty` in the rules), so it is `effects-unmodeled`. The test asserts its note with `properties: []` (research.test.ts:395) and asserts that shaft-mining yields none.
4. **Invariants and docs.** See below. The docs edits agree with design/M2.md: "Research target" l.224-229, Follow-ons l.221-222, Payment ("Entry (age, tier) is fixed at payment") l.210, Tier l.170-172, and notes "reached or not, in step order" l.194.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Upgrade delays production and changes the tier | pass | research.test.ts:119-156. spearman-2 at 15; research startedAt 5, completedAt 75 (production 15-75); spearman-3 spawns at 90 against the second spearman-2 at 30 without the research; separate series with tiers 2 and 3; the order is still `{step 0, spearman, continuous}` |
| 2 | Tier fixed at payment, plus `resolveUnitEntry` unit tests | pass | research.test.ts:158-219. The unit paid at 0 spawns at 100 as spearman-2; the unit paid at 70 is spearman-3; the untimed run gives two spearman-2. Covers no upgrade, veteran, the highest of two, the gap case (spearman-3 removed), and an unknown unit |
| 3 | Research target | pass | research.test.ts:221-246, using the `stepHandlers.research` wrapper. capital-town-center #1; `at town-center` gives #1 with snapshots showing #1 has 1 paid plus an order and #2 has 0 and no order; without the capital it gives town-center #1 |
| 4 | A2 waits and reserves | pass | research.test.ts:248-309. startedAt = 100/(6 x gold rate); floating at or above 0; villager held by the food reserve (1 villager against 2). No target, `at` missing, unreached age (with an age-3 contrast) and upgrade-king-3 all wait, block the next step, and do not hold back the villager. The `lean` and unreached-age data distinguish a reserve (food 60 and 120 against the 50 + reserve need) |
| 5 | Techs apply from completion (wheelbarrow) | pass | research.test.ts:311-360. Costs paid at start, completedAt = 90/speed, rates before 90 equal the run without research, rates after use the wheelbarrow rate, unitsProduced unchanged, and changed time or cost data changes the output |
| 6 | Research shares the queue | pass | research.test.ts:362-377. Villager at 20, research 5 to 40 (production 20-40), next villager at 60 |
| 7 | Notes | pass in substance | research.test.ts:379-422. bloomery gives ignored `['meleeAttack']`; reached and unreached steps both get notes, in step order; wheelbarrow and veteran-spearmen give none; deep-equal across runs; a rejected tech (`forestry`) gives none. The literal `shaft-mining` example is a ticket data error (point 3), and `admiralty` stands in for it |
| 8 | Reuse greps | pass | `classifyTech` call at research.ts:79; the `byBaseId.get(...unit)` grep finds nothing (houses.ts is not on this base); `resolveUnitEntry(` appears 2 times in simulate.ts (lines 243 and 325) |
| 9 | Mutations | pass | Re-applied by me. `entries[0]` makes 5 tests fail, including delay/tier. Skipping `researched.add` makes 4 fail, including the wheelbarrow rates test |
| 10 | A1 literals | pass | The source-shape test passes; research.ts uses only 0 and 1 (the tolerance is `Math.sqrt(Number.EPSILON)`). The data-change test passes |
| 11 | Docs "resumes" / "fixed when paid" | pass | docs l.180 and l.188 |
| 12 | Docs "lowest-numbered" | pass | docs l.173-177 name `at`, `producedBy` (snapshot order), and that queue length is not consulted |
| 13 | Seam test delete and restore | pass | simulate.test.ts:533-554 deletes the handler, sees `['waiting','not-reached']`, restores it in `finally`, asserts `toBe(saved)` and that the real handler runs. Every override (research.test.ts:93-109, simulate.acceptance.test.ts via `withHandler` at :171) restores the saved value in `finally` |
| 14 | npm test and tsc pass | pass | See Gates run |

All 14 are ticked in the ticket.

## Invariants touched

- **A1 (game numbers only from data): holds.** research.ts has no literal other than 0 and 1. Cost, time, age, producedBy and the tier target come from `data`. The tolerance is not a game number.
- **A2 (resources never negative, waits reported): holds.**
  - The affordability check runs before the spend (research.ts:44-49).
  - The reserve is returned only when the step is short of resources alone (no-target and age waits return `{started:false}` with no reserve, research.ts:37-38).
  - The wait is reported through the engine's existing `startedAt`/`waitSeconds` (simulate.ts:300-301).
  - The order-payment reserve path is unchanged.
- **A3 (deterministic): holds.**
  - No randomness and no clock.
  - `researchTarget` walks an ordered array, and the max in `resolveUnitEntry` does not depend on order.
  - `researchNotes` is a pure function of `(order, data)`, and a test checks it.
- S1 holds (no cross-app import). S3 is not affected (no new input).

## Bot reconciliation

There is no review bot (`reviewBot.cli` is empty) and no rules file.

## Conventions

- research.ts follows simulate.ts formatting: 2-space indent, semicolons, `import type` split as at simulate.ts:2-5.
- research.test.ts follows simulate.test.ts layout: 4-space indent, no semicolons, local `gameData`/`inputsFor`/`run` helpers duplicated per file as in simulate.test.ts:24-49 and simulate.acceptance.test.ts:14-35.
- The `withHandler` fix in both test files is identical.

## Non-blocking notes

1. **Duplicated affordability helpers (research.ts:7-10, 40-49 and 28-29).**
   - research.ts re-implements several simulate.ts pieces: `RESOURCES` (simulate.ts:17), `costOf(entry,1)` (simulate.ts:111-117), `affordable` (simulate.ts:119-121), the spend loop in `payUnit` (simulate.ts:224-226), and `markCompleted` (simulate.ts:188-191).
   - It also defines a `RESOURCE_TOLERANCE` with a different value and a copied comment. A maintainer who tunes simulate.ts:14 will not see the second copy.
   - The ticket's type-only import rule forces this today, and the behavior is equivalent (see point 1).
   - Suggested follow-up: move the resource helpers and one tolerance into a small runtime module (for example `lib/aoe4-build-order/resources.ts`) that both files import.
2. **Latent mismatch between the max-entry tier and the entries[0] age check.**
   - `resolveUnitEntry` takes the max age over all entries of a researched upgrade baseId (research.ts:65-67), while the handler checks only `entries[0]`'s age (research.ts:35, 37).
   - If a future snapshot gave an upgrade entries at two ages, researching it at the lower age would resolve the higher-tier unit. `produce` and `payOrder` would then wait on age, which is where simulate.ts:326 becomes reachable.
   - No such entry exists today, and the ticket's wording ("the largest upgrade entry age") allows the current reading.
3. The test named "changes neither population nor units produced" (research.test.ts:345) asserts only `unitsProduced`. Population is not in `SimulationResult`, so this is the best observable proxy. The name overstates it a little.
4. The seam replacement was added as a new `it` (simulate.test.ts:533) instead of editing the old one in place. The old `it` was trimmed to build and move. The result is equivalent to what the ticket asks.
5. The implementer report's Invariants section swaps the labels: it calls A1 "determinism" and A3 "data-driven". Only the report is affected; the code satisfies both.
6. The docs Queues paragraph at l.164-165 still says "paid unit(s)". The new l.179-181 paragraph makes clear that research joins that queue, so it reads correctly. Optional wording: "paid item".

## Out-of-scope findings

- The `shaft-mining` example for `effects-unmodeled` is wrong for the shipped data, because `rules/english.json` l.169 and l.183 grant overlays for it, which makes it `supported`. It appears in docs/aoe4-build-order.md l.312 (Technologies item 4, pre-existing), design/M2.md l.199, and the SGS-032 ticket's Notes criterion. `admiralty` is a correct example. A docs/design fix ticket or note is needed.
- effects.ts:105-106 (`activeEffects`) applies the effects of every entry of a researched baseId (flatMap over all ages). This is harmless today because every technology has one entry. It is the same multi-age-entry assumption as Non-blocking note 2.

## Manager actions

- SGS-031 merge order: whichever of SGS-031 and SGS-032 merges second must route the auto-house `populationPerSecond` unit lookup through `resolveUnitEntry` (making `git grep -c "resolveUnitEntry(" simulate.ts` equal 3). It must also drop the `build`/`move` part of the seam test (simulate.test.ts:522-531) and keep the delete-and-restore test.

## Coverage

- Reviewed in full: lib/aoe4-build-order/research.ts, research.test.ts, the simulate.ts diff plus all of simulate.ts, the simulate.test.ts and simulate.acceptance.test.ts diffs, and the docs/aoe4-build-order.md diff with its surrounding Queues, Tiers and Technologies sections.
- Cross-checked: effects.ts `classifyTech`, the snapshot and rules data (shaft-mining, admiralty, upgrades, upgradeTargets), and design/M2.md Engine rules, Production, Research target and Repeat research.
- REPO.md Review checklist:
  - "Every diff": `next build` was run. No page exists for this component, so nothing could be loaded with `npm run dev`.
  - No other section's paths are touched (aoe4 has no checklist section yet).
- Not reviewed: SGS-031's houses.ts, which is not on this base.
