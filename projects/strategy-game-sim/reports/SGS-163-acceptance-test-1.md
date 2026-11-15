# SGS-163 acceptance-test 1

Tip tested: e510f1fd05980dece2dc918ea5b6d58ba5fff07a (no commit made; no new tests written, the diff is the test).

## Result: PASS

- Harness ran: `npx playwright test acceptance/aoe4-simulate-api-depletion-engine.spec.ts` with ACCEPTANCE_PORT=3778. 19 of 19 passed, including "produced villagers rallied to it add to a single idle-arrival warning" (spec:119), against unchanged product code.
- The new test's bracket assertions (spec:140-141) and its preconditions (exactly one villager at first sample, second count in a later sample, step started by t1 - sampleSeconds) all hold.

## Mutation check

- Break: `lib/aoe4-build-order/depletion.ts:112`, `at: record?.at ?? at` changed to `at` (keeps the latest arrival's at).
- Result: test failed on the intended assertion, spec:141 `expect(arrivals[0].at).toBeLessThanOrEqual(firstSampleSeconds + produce.walkSeconds)`: expected <= 25, received 65.
- Undone with `git checkout -- lib/aoe4-build-order/depletion.ts`; `git diff --exit-code` clean, status clean.

## Not run

Mutations for the two precondition assertions (second count in a later sample; step start) were not run; the ticket assigns only the keep-latest mutation here.

No failures. Server on port 3778 stopped (nothing listening).
