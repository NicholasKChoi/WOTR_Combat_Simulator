# SGS-035 acceptance-test 1

Result: PASS. Tip tested e33fbf7; test commit 3d12658 (acceptance/aoe4-simulate-api-timelines.spec.ts, 4 tests).

- Route comparison: POST /api/aoe4-build-order/simulate on this branch vs origin/main f078c11 (two next dev servers), 15 requests (prebuilt English, prebuilt without auto-houses, prebuilt plus 6 more research/produce steps over 900 s, research waiting on age, late research, veteran-spearmen, auto-house x40, payment waits with and without auto-houses, mixed start, paste, a 400): status and body byte-identical (cmp).
- npm run acceptance for acceptance/aoe4*: 133 passed on the branch (includes the 4 new). The 4 new also pass unchanged on main f078c11.
- tsc clean; lint:dup 0 clones.
- Migrated tests: expect counts balance per file, toBeCloseTo precisions unchanged (9/10), no loosened value found; the only count drop (simulate.acceptance.test.ts, 2 to 1) is the countAt helper's inline expect moving into test-helpers.
- Mutations (each reverted, git diff --exit-code clean): villagerWalkSeconds ignoring move speed fails test 2; payCost underpaying fails 2,3,4; canAfford margin 5 fails 1,2. Tolerance 1e-2 and a neutered house shortfall guard pass: sub-1e-8 float margins are not observable through the route.
- Not expressible at the boundary: research tolerance (5e-9 bank gap), house shortfall 1e-10, spend category totals; they are covered by the implementer's unit tests.
