# SGS-092 implementer report

Branch sgs-092-aoe4-test-hygiene, tip 74b6f028ef4b1c5273c558abf6765f731f222550, worktree /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-092-aoe4-test-hygiene. Base origin/main b9481e3. Status: needs_review.

## Files touched
- lib/aoe4-build-order/research.test.ts: "changes neither population nor units produced" also asserts spawnedPopulation equals the plain run.
- lib/aoe4-build-order/simulate.acceptance.test.ts: length check per series; never-decreasing and villagers-plus-scouts sum per baseId via `series`.
- lib/aoe4-build-order/simulate-house-warnings.test.ts: `digestTimeline` helper (named fields) shared by the late-house test and the it.each; titles name the fields; three rows re-pinned.
- acceptance/helpers.ts: exports RESOURCE_CHARTS, CHART_IDS (units chart + RESOURCE_CHARTS), finalCount (sum of last count over every series of the baseId, 0 when none).
- acceptance/aoe4-build-order-pin-compare.spec.ts, aoe4-build-order-m3-flow.spec.ts, aoe4-gathered-resources.spec.ts: drop local constants, import from helpers.
- acceptance/aoe4-build-order-pin-compare.spec.ts `run()` and aoe4-build-order-timeline-compare.spec.ts `runWith`: call `runSimulation`; keep only fill setup. Unused SIMULATE_PATH import dropped from timeline-compare.
- acceptance/aoe4-simulate-api-timelines.spec.ts, aoe4-simulate-api-spend-population.spec.ts: local finalCount removed, helper used (unused `Series` type removed from timelines).
- acceptance/aoe4-simulate-api-veterancy-conversion.spec.ts: in the per-baseId test, finalCount(result,'longbowman') equals sums.at(-1) and is greater than the first longbowman series' last count.
- acceptance/aoe4-step-table.spec.ts: table-edit test awaits step-row count == build.steps.length before and +1 after step-add, then clicks Run (no fixed timeout).
- acceptance/aoe4-results-split.spec.ts: new empty-steps case.

## Re-pinned digests (simulate-house-warnings.test.ts, fields spawnedPopulation, spent, steps, populationCapReachedAt, depletions, markers, 1800 s)
- ENG 1TC: c1b3ee597d0a715f -> 42b0afc54e5e8bf8
- ENG Spear/Longbow into MAA/Crossbow: 813cdb5546b36b2a -> 1cead3b6a8f33aa3
- ENG Knight/Longbow (King's Palace): afa35f19e9a258a6 -> 082d524201cfafbd
Late-house pin 67af1a20a5434d6f unchanged. The old comment above the it.each ("Re-pinned for the house lead-time rule...") was left in place.

## Tests and gates
- `npm test`: 45 files, 1350 passed, 10 skipped. Targeted: research, simulate.acceptance, simulate-house-warnings pass.
- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
- `npx next build`: succeeded.
- Acceptance: results-split + veterancy-conversion 9 passed; aoe4-step-table.spec.ts `--repeat-each=5`: 115 passed; three consecutive full `npm run acceptance` runs: 740 passed each (exit 0), step-table spec green in each.
- No pre-existing assertion edited except the re-pinned digests (ticket Scope 5 requires it).

## Mutation checks (all undone)
- simulate.ts return gets `extra: 1`: simulate-house-warnings 24/24 still pass (digests ignore new fields).
- simulate.ts line 512 `startedAt = engine.time + 1`: the three build rows, the late-house row and two other tests fail.
- research.test.ts: expectation altered to plain.spawnedPopulation shifted by 1: fails (test-side break only; no production break was made for this line).
- results.tsx: skip timeline column when steps empty: new results-split case fails (Expected 2 children, Received 1).
- helpers.ts finalCount reading only the first matching series: veterancy-conversion per-baseId test fails.
- Not mutation-checked: the simulate.acceptance.test.ts per-baseId change (would need a veterancy upgrade mid-run in that fixture; the series helper is the one already used in the file). The step-table readiness wait was not mutation-checked either; the race is load-dependent.

## Doc claims
- helpers.ts comment: "A veterancy upgrade moves units to a higher-tier series of the same base unit, so sum every series." True per UnitSeries/baseId (model.ts) and the veterancy-conversion spec (longbowman-2 and longbowman-3).
- simulate-house-warnings.test.ts comment: "Digests of spawnedPopulation, spent, steps, populationCapReachedAt, depletions and markers; the warnings must leave them unchanged." Matches digestTimeline.

## Invariants
None touched; no product code changed. aoe4-build-order.spec.ts untouched.

## Out-of-scope findings
None. Note: the other waitForResponse uses in pin-compare (lines about 499, 556, 572) intentionally left.
