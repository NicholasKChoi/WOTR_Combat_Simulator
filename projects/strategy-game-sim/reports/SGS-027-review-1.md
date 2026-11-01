# SGS-027 review 1

- Branch: sgs-027-aoe4-effects-gather-construction, tip ea51a21, base 68e004a (full review, first pass)
- Note: the branch exists only locally. `origin/sgs-027-aoe4-effects-gather-construction` does not exist, so I reviewed local ea51a21 in a detached worktree.
- **Verdict: APPROVE**

## Blocking findings

None.

## Spec gaps

None. The two choices the implementer made:

1. **A missing villager entry throws** (`gather.ts:5-8`). The design does not cover this case. The trip model has no valid answer without the villager's classes. A plain `Error` with a `fn: message` prefix matches `classifyTech`'s default branch (`effects.ts:75`) and the loader's own throws on broken data. Accepted.
2. **A tech with both snapshot effects and overlay rows applies both** (`effects.ts` `activeEffects`). design/M2.md:265 and docs/aoe4-build-order.md:188-190 say an overlay row is "active once its `grantedBy` ... is built or researched". Nothing in either says an overlay row replaces the snapshot effects. Applying both is the literal reading. In the current data no overlay-granting tech has snapshot effects (`shaft-mining` has `[]`; the other granters are `civ` and `kings-palace`), so nothing is double-counted today. Accepted.

## Acceptance criteria (all ticked in the ticket)

- [x] constructionSeconds: gives 100/75/50/30 for English. The (4,3) data case gives `100x4/(n+3)`. Builders of 0, -1, 1.5 and NaN throw `RangeError`, and the message names the value (construction.test.ts).
- [x] Trip model: a copy with camp walk 2, town-center walk 10 and drop-off 1. A lumber-camp count of 0 still uses the town-center walk; a count of 1 uses the camp walk. I swapped the two walks myself and 3 tests failed.
- [x] Wheelbarrow on sheep and wood: `cycleRate(15, 0.75, walk/1.15, 0)`, and the result differs from the unresearched rate.
- [x] Double Broadax raises wood by x1.15. Shaft Mining (an overlay row) raises gold and stone, and wood is unchanged.
- [x] Farm bonus: x1.25 at age 2 with coverage 1, x1.125 with coverage 0.5, x1.3 at age 3. It is 1 with no mill and 1 with coverage missing.
- [x] King's Palace: 1.1 when the palace is built and the producer is `kings-palace`. It is 1 when the palace is not built, when the producer is `capital-town-center`, and when there is no producer.
- [x] select: `extended-lines` leaves the villager unchanged and still applies to `fishing-boat`. Class sets need every class in the set, and any one set is enough. A select with both id and class needs both to match. An empty select matches nothing.
- [x] Calculator cross-check: 7 nodes within 0.05/min. Boar is excluded. The expected numbers exist only in gather.test.ts, and the test is labeled as a cross-check.
- [x] Determinism and purity: repeated calls give the same result, the state objects are frozen, and the Map and Set contents are unchanged after the call. The grep finds no `Math.random`, `Date.now` or `new Date` in the three files, and they have no module-level mutable state.
- [x] No game numbers: the only literals in the three files are 0 and 1 (I grepped for them). Tests change an overlay value, the base rate and builderScaling, and the output changes each time.
- [x] `npm test` passes (12 files, 161 tests) and `npx tsc --noEmit` is clean. effects.test.ts, data.test.ts and data/ are unchanged in the diff.
- [x] No INVARIANTS.md regressions (see below).

## Invariants touched

- A1 (game numbers come from data) holds. The rate, capacity, property lists, dropOffs and builderScaling come from `data.base`. Effect values come from the snapshot or the overlay. Walks and drop-off times come from `inputs.trips`.
- A2 (resources never go negative): not touched. These functions do no spending.
- A3 (determinism) holds. The functions are pure. Effects are applied in Set and array insertion order, which JS guarantees, so the same state gives the same floating-point result.
- S1 (apps are independent) holds. The only imports are `./data`, `./model` and `./effects`.
- S3 (bounded simulation): no new input. The `builders` range check sits behind validation, and the function also guards it.

## Contract

- Signatures match the design/M2.md Modules rows 31-33 and the ticket Scope: `modifiedValue(base, property, target, state)`, `effectiveGatherRate(node, state, inputs)`, `constructionSeconds(baseSeconds, builders, data)`.
- `EffectState` and `ModifierTarget` have the fields the ticket specifies (`coverage` included).
- Arithmetic and conditions match the ticket and docs:
  - result = `(base + Σchange) × Πmultiply`;
  - a `multiply` near a building is scaled to `1+(v-1)c`, and a `change` to `v×c`;
  - `c` is 0 unless the building exists and `Object.hasOwn(coverage, b)`;
  - `age` must match exactly; `producer` must equal the target's producer, and an absent target producer fails;
  - only `passive` effects with `change` or `multiply` are applied.
- Trip model matches docs:147-152 and design:175-176.
- Docs: the added sentence at docs/aoe4-build-order.md:197-198 is accurate. The Trip model, Construction and Overlay effects sections still read true. The grep for the three function names in docs/ and the data README finds no claims.
- Scope: no engine, route, page, model.ts or data.ts change, and no `golang/`. base.json is not retuned, because the cross-check passes on the seeds.

## Lint

`npx tsc --noEmit` is clean. There is no ESLint config (REPO.md).

## Review bot

`reviewBot.cli` and `rulesFile` are not set. There are no bot findings to reconcile.

## Conventions

- Production files use 2-space indent with semicolons, and test files use 4-space indent without semicolons. Both match their siblings (effects.ts, effects.test.ts).
- Error messages use the `fn: ...` prefix, as `classifyTech` does at effects.ts:75.
- The tests are in a new modified-value.test.ts because the ticket requires effects.test.ts to stay unchanged. That is justified.

## Correctness

I traced each flag to the value it changes:

- `hasBuilding >= 1`: a count of 0 does not count, and a test covers it.
- `nearDropOff` picks the camp walk when true.
- The undefined-producer guard is correct.
- `'condition' in effect` is safe: snapshot effects carry only `property, select, effect, value, type, target`, never `condition`.
- The upstream `enclosures` row (`type: influence`) is skipped.

There are no errors, resources, locks or async to check.

I re-ran two mutations myself: swapping the walks, and changing the age check to `>`. Both made tests fail. The implementer's list of 30+ mutations is plausible against the tests I read.

## Non-blocking notes

1. gather.ts:24 re-implements `hasBuilding` (effects.ts:21-23) inline. The helper is private, so this is acceptable. If the engine needs the same check, exporting the helper would keep the "count >= 1" rule in one place.
2. gather.ts:1 imports the types `EffectState` and `ModifierTarget` without a `type` modifier. lib siblings use `import type` (effects.ts:1, construction.ts:1), and components/apps/aoe4-build-order/line-chart.tsx:3 uses inline `type`. This works under `isolatedModules`. It is only a style departure.
3. `activeEffects` flattens the effects of every snapshot entry under a researched baseId. Every English technology has one entry today. If a future snapshot had a tech with several tiers, every tier's effects would apply. The research ticket should decide whether `researched` holds baseIds or ids.
4. Two `nearBuilding` multiplies on the same property would each be coverage-weighted and then compounded. The exact answer is `1+(v1·v2-1)c`. This cannot happen today, because only one farm row is active per age.
5. `modifiedValue` rebuilds the active-effect list on every call (3 to 5 calls per `effectiveGatherRate`). That is cheap at current data sizes. The engine may want to cache it per state change.
6. design/M2.md Modules row 31 does not list `EffectState` or `ModifierTarget`. This is the designer follow-up from spec-gate note 1.

## Coverage

- Files reviewed: the full diff of all 7 files: construction.ts, effects.ts, gather.ts, their three test files, and docs/aoe4-build-order.md.
- I also read data.ts (`byBaseId`), the snapshot effects and entries, rules/base.json, rules/english.json, the design/M2.md Modules, Engine rules and Rules files sections, ARCHITECTURE.md and tsconfig.json.
- REPO.md "Every diff":
  - `npx next build` passed in the worktree.
  - No page or route is touched, and the new functions have no importer outside tests yet, so there was no page to load with `npm run dev`.
  - No section with `Paths:` covers `lib/aoe4-build-order/**`. The checklist has no AoE4 section, so it cannot be applied here. This is not a blocker.
