# SGS-111 tech-lead gate 1

**Decision: PASS. 1 draft PR opened.**

- PR #117: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/117
- Base: main. Head: sgs-111-drop-house-gate at tip 8ac8ee9 (pushed; no new commits).

## Merge risk
**high** - removes two `SimWarning` codes from the public simulate response and OpenAPI contract, and changes the timings of every order that has a `build house` step

## Review focus
- `lib/aoe4-build-order/simulate.ts:660-664` (`startAutoHouses`)
  - Failure: without the gate, the planner now runs while explicit house steps are still to come. If it ignored an explicit house started in the same instant, every order with `build house` steps would build surplus houses, spending wood and shifting every later timing.
  - Check: steps run before `startAutoHouses` in `runInstant`, and an explicit house started in the same instant suppresses the auto-house it covers.
  - Pinned by `simulate-house-gate.test.ts`: "count an explicit house started at the planner instant as under construction" (lines 106-111) and "starts an auto-house before the late step and keeps population rising past the supply limit" (lines 68-73).
- `lib/aoe4-build-order/model.ts:159-163` (`SimWarning` union)
  - Failure: an API client that branches on `auto-houses-held` or `auto-houses-never-start` will never see those codes again. A client with a stale copy of the schema still validates, because the response only narrows.
  - Check: the OpenAPI `SimWarning` `oneOf` and the TypeScript union list the same four codes.
  - Pinned by `aoe4-simulate-api-contract.spec.ts`: "every SimWarning variant is closed, requires every property and is tagged by a code const" (lines 131-138).
- `data/aoe4-build-order/builds/english-knight-longbow.json:318-327` (data retune)
  - Failure: the retune clears the floating-resource bar at 20:00 with little margin (wood is about 46 under the cap). A small engine or data change later could push the prebuilt build over the cap, or leave its farmers idle.
  - Check: the rally and farm destinations still match the README description.
  - Pinned by `builds.test.ts`: "meets its production floors and keeps its floating resources under the cap at 1200 s" (lines 77-89).

## What I reviewed
- Commit range: origin/main...8ac8ee9, 4 commits.
- 16 files, +334/-477 in total. Reviewable change is +12/-80 LoC:
  - `simulate.ts` +3/-66
  - `model.ts` +1/-3
  - `depletion.ts` +1/-4
  - `english-knight-longbow.json` +7/-7
- Not counted as reviewable: tests, both docs files, the OpenAPI JSON, and the README.
- Read INVARIANTS.md, the CONTEXT.md open questions (none), M7 design "Removed contracts (M7.8)", the ticket, and the implementer report's retune rationale.

## Blocker scan
- Invariants:
  - A3: no randomness or clock added; determinism is pinned by tests.
  - A2: the payment path is unchanged. The `payOrder` change only folds the supply check into the early return and behaves the same.
  - A1: the retune is in the data file only.
- Contract removal: the owner chose it (design M7 "Removed contracts", DQ1 = A). No component, page or util reads the removed codes; I grepped for them. The response only narrows. This sets the high rating but is not a blocker.
- `supplyBlocked`: nothing reads it on the branch any more.
- Irreversibility, concurrency, security: none.
- No open question was answered on its own authority.
- Stack check: one branch on main, and its diff holds only this task.

## Untested hotspots
None. Each Review focus entry has a test whose assertions fail if that logic breaks.

## Non-blocking notes
- `git push -u` pushed the branch but could not write the upstream config: `.git/config` was locked, most likely by another process. The remote ref is correct (8ac8ee9). Only the local upstream tracking is unset.
- `english-knight-longbow` step 44 (the 12:00 rally to wood) is now redundant after the step 28 rally change. It was left in place to keep step indices stable.
- The knight-longbow README paragraph mentions a "Town Center rally to farm" that does not exist in the build. This predates the change.
- The knight-longbow wood float sits close to the cap (fragile tuning). This is listed in Review focus.
