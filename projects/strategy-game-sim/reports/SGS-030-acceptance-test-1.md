# SGS-030 acceptance-test 1: PASS

Branch sgs-030-aoe4-engine-core, new tip = commit adding `lib/aoe4-build-order/simulate.acceptance.test.ts` (local, not pushed; see handback for SHA). Base tip f657815.

Harness: Vitest on the module exports (no HTTP boundary until SGS-033). `npm ci` ran; `npx vitest run lib/aoe4-build-order` 484 passed in 14 files; `npx tsc --noEmit` clean.

## Tests written (13, all pass)
- Wood-only start split: hand-computed floating wood at t=10, wood gatherRate, food 150/100/50 at payments, villager counts 1/2/3 then capped by supply.
- `at 8 vils` trigger arms exactly at 40 (spawn of villager 2); pins walking villagers counted once and the walk end moving them.
- Counted `produce villager x3`: spawns 20/40/60, completed at 60, no further order.
- Two capital TCs, `produce villager x1`: both instances paid together (food 100 at t=0), two spawns at 20.
- `produce villager x5` replaced by `@25 pause`: step completed at 25, unpaid units dropped, 2 villagers total.
- Seam handler returning `reserve {food:200}`: first villager payment waits until food reaches 250 (t = 50/(6r)), food never below 150; handler with no reserve: villager paid at 0, step stays waiting.
- `triggerHolds` on live state (captured via `schedule`): undefined, villagers (walking counted), time.
- `addBuildingInstance` x40 houses: supply capped at `maxPopCap`.
- Sampling: durations 3, 5, 62 give [0,3], [0,5], [..55,60,62].
- Horizon: scout produce in-progress at duration 10, completed at 23 at duration 30.
- 60 seeded generated orders (produce/pause/rally/scout, time and villagers triggers, barracks): determinism, floating >= 0, array lengths, step timing ordering/status consistency, cumulative counts, total units within supply 3.

## Mutation checks (each reverted with `git checkout`, `git diff --exit-code` clean)
- Remove supply cap in addBuildingInstance: supply test failed.
- Drop walking from alive villager count: trigger test failed.
- Ignore reserve in orderNeed: reserve test failed.
- Never decrement `walking`: first survived; added the `at 8 vils` trigger test, which then failed.
- Pause leaves order: pause/early-replace test failed.
- completeIfUncarried never completes: 4 tests failed.
- Order supply check off (line 331): 3 failed. Step supply check off (line 249): generated-orders test failed.

## Failures
None. No impl-defect or spec-gap found.

## Not expressed
HTTP/API surface (route is SGS-033). Docs criteria and source-shape greps (A1 literals, exports) are covered by the implementer's tests, not duplicated.
