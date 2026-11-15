# SGS-162 acceptance-test 1

Tip tested: 06eb4218d3bdb4280ac11075d3bee55161ccdee0 (no commit added; the specs were already on the branch).
Harness: Playwright, ACCEPTANCE_PORT=3717 (default 3128 was busy). acceptanceSetup ran.

## Result: all 76 tests in acceptance/aoe4-my-builds.spec.ts pass, including the pre-existing storage-event tests.

## Specs under test
- `reopening and new versions > an unrelated key changing in another tab causes no storage write in this tab` (spec :956): criterion 2.
- `storage unavailable > another tab storing builds does not make this tab list them` (spec :1068): criterion 1.
- Criterion 3 is covered by the existing two-tab/null-key/unrelated-key tests, which pass unchanged.

## Mutation checks (pages/apps/aoe4-build-order.tsx, `reread`, ~line 219-222; both undone, `git diff --exit-code` clean)
- Test :1068: dropped `|| !myBuildsAvailable(storage)`. It failed on `expect(groupOptions(page, 'My builds')).toHaveCount(0)`, Expected 0, Received 2. Good.
- Test :956: moved the `browserStorage()`/`myBuildsAvailable` probe above the key filter. It failed, but on `expect.poll(() => seenStorageKeys(page)).toContain('unrelated-key')` ("Timeout 5000ms exceeded while waiting on the predicate", 23.7s), NOT on the final `storageWrites` toEqual([]) assertion. Likely the tabs probe each other in a storm and the evaluate polls stall, so the test does fail for the right underlying reason, but not on the assertion naming the behavior. Per the strict bar this is a weak mutation result: the test detects the ping-pong only indirectly via a timeout. Not rewritten (no impl defect; a possible hardening is to assert the write count before awaiting the poll, or poll `storageWrites` directly).

## Failures
None.

## Criteria not expressible
None.
