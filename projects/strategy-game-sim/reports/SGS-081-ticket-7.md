# SGS-081 ticket author 7 (re-spec 7, spec-gate 4 findings)

Ticket: tickets/SGS-081-aoe4-retune-prebuilt-farms.md, rewritten in place; Re-spec 2026-11-03 (7) appended.

1. Floors home: new `lib/aoe4-build-order/production-floors.ts` exports `PRODUCTION_FLOORS` (keyed by build `name`) and
   `MAX_FLOATING_AT_1200`, constants only. `builds.test.ts` and `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts`
   import it; `test-helpers.ts` is not edited (builds.test.ts uses its existing `countAt` and `sampleIndex`). Criterion 1
   reworded; diff-stat criterion names the file and states test-helpers.ts unchanged; README opening sentence names the
   new module. `git grep -l production-floors -- lib acceptance` at 2fc9593: no output (file is new), end state: two files.
2. 1TC: verified at 2fc9593 the file has 25 steps; 0-23 from the guide (22 = research steeled-arrow, time 420;
   23 = research iron-undermesh, untriggered); 24 = depleted gold move-all reaction to gold#2, added in a later commit
   ("add the English 1TC gold reaction"), not from the guide. Frozen set is `steps.slice(0, 24)` exactly. Added
   non-reaction steps go between 23 and the gold reaction; added reactions after it, so it stays the first reaction
   (the builds.test.ts gold case uses `findIndex(step.reaction)`). Every added step has a time trigger >= 420 or is a
   reaction. Criterion 4 reworded accordingly. Specs that index from `english1tc.steps.length` (timelines, markers)
   follow the re-pin rule.
3. Table declared authoritative (no recompute). "Floor reasoning" trimmed: data, the producer assumptions, the
   0.875 food derivation (782/1172/481 -> 780/1180/490, checked), and the measured 2fc9593/main values; unit maxima
   removed. Table values unchanged.
Notes folded: `i = sampleIndex(result, 1200)` used for both `gatherRates.food[i]` and `floating.*[i]`; instantaneous
food dip noted (floor not lowered); the spec loops over the shared row's units and resources (lint:dup).

Criteria checked: `git grep -c MAX_SPEAR_LONGBOW_STEPS 2fc9593 -- acceptance` prints `...prebuilt-farms.spec.ts:2`
(matches criterion). Open questions: none. Diagrams: none (unchanged).
