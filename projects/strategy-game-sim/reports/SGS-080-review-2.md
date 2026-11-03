# SGS-080 review 2 (delta)

- Branch `sgs-080-aoe4-one-villager-per-farm` (local only, reviewed by SHA), delta `61590e2..123936b`, base `main` `1bdf1d6`. Delta mode: only the Rework 1 change and regressions were checked.
- Verdict: **APPROVE**

## Blocking findings

None.

## Rework 1 required fixes

The delta is 5 files, 10 insertions and 7 deletions. It touches no source under `lib/` or `app/`.

1. Doc sentence (`docs/aoe4-build-order.md:403`): **fixed**. It now reads exactly the replacement text from review-1. The text matches `fillSlots`, which `completeConstruction` calls to move idle farmers onto a completed farm. The paragraph no longer contradicts itself.
2. Depletion-engine spec (`acceptance/aoe4-simulate-api-depletion-engine.spec.ts:211-218`): **fixed**. It starts with `{ wood: 6 }` and runs `[PAUSE, farm, farm, farm]`, where each `farm` is a `build farm from wood then farm` step. The assertions are unchanged: no `farm` or `wood` depletion, `warnings` equals `[]`, and food and wood rates are above 0. The test passes. `implementer-2` lists it as a Scope 5 edit.
3. Contract spec (`acceptance/aoe4-simulate-api-contract.spec.ts:133`, `:485-499`): **fixed**. `farm-idle` is now third in the code list. `WarningKeys<'farm-idle'>` with `{ code, severity, message, at, idleVillagers }` is the third entry of both the type and the value tuple, which matches the `oneOf` index. Both tests pass.
4. Version pins: **fixed**. `aoe4-gathered-resources.spec.ts:68-70` and `aoe4-simulate-api-issue-shape.spec.ts:13-16` now pin `2.2.0`, in both the test names and the assertions.
5. The 6 shipped-build acceptance failures are untouched: **confirmed**.

## Results (run on Node 24.22.2, detached worktree at 123936b)

- `npx tsc --noEmit`: exit 0.
- `npm run lint:dup`: "Found 0 clones."
- `npx playwright test` (full suite): 696 passed, 6 failed. The failures are exactly the 6 known SGS-081 shipped-build ones: knight-longbow-page:12, spear-longbow-build:34 (at 1200 s and at 3600 s) and :43, and veterancy-conversion:38 and :44. In review-1 the suite had 11 failures; the 5 that this rework targeted now pass.
- `npx vitest run`: 2 failed, 1335 passed, 10 skipped. The 2 failures are the same shipped-build ones as in review-1: `builds.test.ts` ENG Spear/Longbow, and `research.acceptance.test.ts` Knight/Longbow veteran conversion.

## Acceptance criteria

All 18 are ticked in the ticket:

- The criteria that review-1 passed are unchanged, because the delta touches no engine code.
- The three that review-1 failed now pass:
  - The OpenAPI/contract spec passes.
  - The docs no longer contradict the code.
  - The Scope 5 edit for the hour-long farm case is made and listed.

## Invariants touched

None. The delta changes only acceptance specs and one doc sentence. Review-1's invariant verdicts (all hold) still apply.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there are no bot findings.

## Non-blocking notes

- The edited doc line at `:403` is about 185 characters long and was not rewrapped. The doc already has 44 lines over 130 characters, so this is not a departure from its style.

## Coverage

- Reviewed the full delta: the 5 files listed above.
- Did not re-review the engine diff from review-1 (delta mode).
