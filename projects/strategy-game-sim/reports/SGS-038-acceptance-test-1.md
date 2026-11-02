# SGS-038 acceptance-test 1

Branch `sgs-038-aoe4-depletion-engine`, tested tip 4749c131, new commit **04ff671** (tests only, authored choinickolas@gmail.com). Node 24, Playwright harness ran (own `next dev`).

## Tests written

`acceptance/aoe4-simulate-api-depletion-engine.spec.ts` (new, 21 tests) and 3 tests added to `acceptance/aoe4-simulate-api-contract.spec.ts`. All pass.

Finite stock:
- exact run-out instant not on a sample, `depletedAt` = amount / (n * rate), gathered food = amount (crit 110, 111, 124)
- gatherers idle after: food rate 0 at next sample, bank flat (110)
- one node-depleted warning at that instant with idle count 3 (115)
- `berry: 0`: depletedAt 0, info when empty, warning with 3 villagers present (112)
- `berry: null` stays infinite, no warning, income continues 3600 s
- same depleting request twice gives byte-identical bodies (A3)

Arrivals at a dry node (116, 118):
- move onto it: one idle-arrival at arrival time 10, after node-depleted
- two produced villagers rallied there aggregate into one warning (count 2)
- the 3 run-out villagers produce no idle-arrival
- `walkSeconds: 0` arrival at the run-out instant counts in both warnings

move all (121):
- takes everyone, starts at 0, waitSeconds 0, rates equal a control start
- from an empty node completes at its start instant and moves nobody
- takes the idle villagers of a node that ran out

Deposits (114): independence (gold#2 depletedAt identical whether gold is finite or null), each credits its full stock (+400), no gold#2 row unless named while an override for it is accepted.

Infinite nodes: farm and wood never deplete over 3600 s.

Farm build (123 behavior): farm builders gather at completion (rate jumps at the first sample at or after completedAt); mill with then=sheep and then=berry still pays the walk back.

ENG 1TC vs origin/main 77fa279: 1200 s food 400.185 (main 378.086), food rate at sample 52 and final, wood and gold banks, step timings within 1e-9, plus two orders with no farm build unchanged from main (villagers x20 food 15780.897488678529; mill order food 7786.373096630632).

Contract spec (130): request with `gold#2`, `move all`, `nodeAmounts` validates as SimulateRequest and its live 200 validates as SimulationResult (same ajv config); `nodeAmounts: {farm}` is schema-invalid and a 400 `invalid`; `produce count: 'all'` schema-invalid and a 400 `syntax`.

## Main comparison (done via the route handler built from 77fa279 and from the branch, ENG 1TC and 5 other orders)

Matches the brief exactly: research-extension final food 596.2798390913501 -> 618.3789316586852 (existing timelines pin), ENG 1TC floating food at 1200 s 378.086 -> 400.185, food gatherRates differ at 6 samples (farm-walk window), step 23 startedAt/waitSeconds move by one ulp, wood and gold banks move by one ulp. `depletions` all null, `warnings` empty. Mill-build and villagers-only orders are bit-identical to main. The farm-only order differs only in the farm-walk window.

## Results

- New and touched specs: 85 passed. All `aoe4*` acceptance specs: 405 passed. `tsc --noEmit` and `lint:dup` clean (0 clones).
- No failures; no impl-defect or spec-gap found.

## Mutation checks (each applied, spec rerun, reverted with `git checkout --`; working tree clean after)

| Break | Failed |
|---|---|
| M1 drop run-out from `nextWake` | exact-instant test, gold independence |
| M3 run-out leaves gatherers in place | idle-rate test, move-all-idle |
| M4 `recordRunOut` idle count 0 | node-depleted count, 0-stock, same-instant |
| M5 drop `recordIdleArrival` | all 3 arrival tests |
| M6 `move all` takes 1 | move-all, move-all-idle |
| M7 `availableAt` ignores idle | move-all-idle |
| M8 / M17 / M15 farm walks back (code, data `createdBy`, farm given stock) | farm-join test, ENG 1200 s test |
| M9 idle arrival overwrites instead of adds | rally aggregation |
| M10 random jitter in `depletedAt` | determinism test and others |
| M11 null override becomes 0 | null-stays-infinite, gold independence |
| M12 farm accepted in `nodeAmounts` | contract 400 test |
| M13 produce accepts `all` | contract 400 test |
| M14 gold#2 shares gold stock | independence, full-stock credit, contract request |
| M16 row for unnamed deposit | unnamed-deposit test, documented-200 examples |
| M18 arrivals on dry ref gather | all 3 arrival tests |
| M2b income credit scaled 1.01 | exact-instant gather equality, full-stock credit |

M2 (remove the `Math.min` clamp in `drawDown`) survives at the API level: the run-out wake lands on the exact instant, so `wanted` never exceeds `remaining` and the clamp is unobservable through the route. Not a test gap in the API; the unit tests own it. Treated as an equivalent mutant.

## Criteria

Ticked 130 in the ticket. Left 113 and 123 for the PR body. Criteria not expressible at the API level: 119 grep count, 122 auto-house builder source (needs `houseBuilders` internals; `autoHouses` runs are only covered by the unit tests), 126 to 129 validate table (unit-level; contract spec covers a few at the boundary).

## Notes

Scratch comparison files are in the scratchpad only; the probe worktree `probe-main-77fa279` was removed. Nothing started by me still runs (the `next dev -p 3173` process belongs to the sgs-045 worktree).
