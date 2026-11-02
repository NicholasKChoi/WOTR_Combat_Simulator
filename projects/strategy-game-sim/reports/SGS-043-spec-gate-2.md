# SGS-043 spec gate 2

Verdict: READY

Checked against origin/main, design/M3.md, SGS-035, SGS-037, REPO.md, both LESSONS.md (empty).

Gate-1 gaps: all five closed.
1. Risk is high with the criticalPaths reason.
2. The 200 example is copied from a real run, and the criterion names the contract spec's equality test.
3. The required-list check is an order-independent jq set difference, and SGS-037 is in Depends-on.
4. The contract spec, result-series.test.ts and simulate-series.test.ts are in Scope.
5. The "no expected value changes" wording is in, and a missing start-unit baseId throws with the data.ts:108 message.

Re-check results
- Grounded: spawnUnit (:218, the villager early return at :224), payUnit, the seed at :638, data.ts:108 message, SHARED_SCHEMAS (:62), simulationResult literal (:311) and the Outputs heading (:499) all exist. The cast `state as Engine` in spawnUnit means an Engine-level populationCapReachedAt is reachable there.
- Contracts: names and the cumulative-at-sample convention match design/M3.md (SimulationResult, rules rows spend/population). SpendCategory and EngineState.spent come from SGS-035. depletions and warnings come from SGS-037. SpendCategory in OpenAPI is added only here, and the design says the same.
- Invariants A2/A3 are named and not contradicted. Size is ~50 LOC. The diagram waiver is fine. On merge: none is right. Docs are in Scope. Decisions agree. Open questions: none.

Notes (non-blocking)
- Line numbers in Scope are base-branch numbers and will drift after SGS-035/037 land. The ticket already says to use their names.
- The "SGS-035 owns the spend totals" source note matches SGS-035's out-of-scope line.
