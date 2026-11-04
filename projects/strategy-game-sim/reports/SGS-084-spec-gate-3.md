# SGS-084 spec gate 3

Verdict: READY. Risk `high` confirmed (simulateBuildOrder is a criticalPaths symbol, and a required field is added to the public response).

## Rewritten build-step criterion, checked against origin/main b9481e3
- `startConstruction` calls `sendWalking` at startedAt, so the builders leave `engine.gatherers` then. The sampling loop runs `runInstant` and only then records samples with `times[sample] <= engine.time`. A sample at 30 therefore sees the drop, and sample `i-1` sees 4 wood gatherers.
- `completeConstruction` calls `markCompleted` at completion. The builders rejoin only in `arrive`. `then` defaults to `from` (wood), and a house does not create a wood node, so `arrive` is scheduled `villagerWalkSeconds(...)` later. The "still 2 just after completedAt, 4 after the walk-back" clause is correct.
- Default `walkSeconds` is 5 and the house builders come from `builderScaling` 3/(n+2). For a base house time of about 25 s, completedAt is about 53.75 and the builders arrive at about 58.75. Sample 55 shows 2 and sample 60 shows 4, so the criterion holds with default inputs. I did not confirm the house base time of 25 s in the snapshot.

## Other checks
- Scope is grounded (`incomePerSecond`, `NODE_REFS`, `gatherRates` sample loop, `SimulationResult`, `result-series.ts`, `line-chart.tsx`).
- The gate-2 gap is closed. All other criteria are unchanged from gate 2 and stay testable.
- Existing tests follow a stated rule, not a list. The OpenAPI bump is relative. No input validation applies. Invariants A2, A3 and S3 are named.
- Contracts and docs are in Scope. Open questions: none. On merge: none needed.

## Notes (non-blocking)
- "The sample just after completedAt" is ambiguous when completedAt is a multiple of 5. The first sample strictly after it would then be completedAt+5, which equals the arrival time and shows 4. The default inputs give 53.75, so it is fine. The implementer should read it as "the first sample after completedAt that is earlier than completedAt plus the walk-back".
- Auto-houses could add builders drawn from wood in that run. The paste is short enough that none are expected before 0:30. The implementer should confirm this and, if needed, set the `autoHouses` input to off in the test.
