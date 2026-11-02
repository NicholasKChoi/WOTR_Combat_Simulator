# SGS-043 implementer 2 (rework 1)
Branch sgs-043-aoe4-spend-population-series, tip 4f5fb104ae6df1cd5177361b13c3a2331b0dcc56 (new commit on be39f66).
Touched: lib/aoe4-build-order/simulate-series.test.ts only (new test "stays set after later spawns"; RESOURCE_KINDS import; costOf renamed totalCostOf).
Mutation: removing the populationCapReachedAt === null guard in simulate.ts failed the new test; reverted.
tsc clean, lint:dup 0 clones, npm test 748/748. Status: needs_review.
