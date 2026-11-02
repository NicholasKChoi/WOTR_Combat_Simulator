# SGS-043 implementer 1
Branch sgs-043-aoe4-spend-population-series, tip be39f66cd5bfc506330a4260d0829385a1a82e86, base origin/main 9137cf2.
Worktree: .claude/code-factory/worktrees/sgs-043-aoe4-spend-population-series. Status: needs_review.
Files: model.ts (3 fields), simulate.ts (spawnedPopulation, populationCapReachedAt, startUnitPopulation, sampling), simulate-series.test.ts (13 tests), openapi.json (SpendCategory, 3 properties/required, example from a real run), contract spec (literal, SHARED_SCHEMAS, enum test, spent mutation test), edges spec (3 pinned keys), result-series.test.ts literal, docs Outputs.
Gates: tsc ok; lint:dup 0 clones; npm test 747 pass; next build ok; npm run acceptance 369 pass; jq check prints [["spent","spawnedPopulation","populationCapReachedAt"],[]].
Mutation checks done and undone for popcap use, cap check order/>=, seed, start-unit popcap, throw, sample series, spent category, and the openapi propertyNames.
