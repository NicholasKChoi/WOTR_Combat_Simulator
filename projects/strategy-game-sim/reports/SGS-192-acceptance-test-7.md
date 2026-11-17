# SGS-192 acceptance-test 7

Verdict: PASS. Branch sgs-192-wait-details, base tip 60eb68b, new commit 811f1e3 (local, not pushed).
Harness ran: Chromium via Playwright, `acceptance:setup` run first.

## Tests written (acceptance/aoe4-simulate-api-waits.spec.ts, new describe "waitingFor and waitDetails say what a wait is for")
1. A never-waiting step has `waitingFor: null`, `waitDetails: []`.
2. Resource wait: `short` kinds are whole numbers >= 1; one `resources` entry carries all 300 s (entries merge by target).
3. Started build: `waitingFor` null, one `villagers` entry (node sheep, needed 9, available 6 from the first interval) whose seconds equal `waitBreakdown.villagers`.
4. Move short of villagers: `villagers` detail, node sheep, needed 9, available in [6, 9).
5. Build above the age: `age` detail (2, landmark null), one entry with 600 s.
6. Produce knight at Dark Age: `age` 3 reported, not the missing stable.
7. Produce from unbuilt barracks: `building` naming barracks, instance null; `capital-town-center#2`: instance 2.
8. Population hold with auto-houses off: `population` detail, needed > 0, used + needed > supply.
9. Scout then villager from the TC: one `building-busy` entry, every false, instance null, seconds equal `waitBreakdown.prerequisite`.
10. Instance-pinned produce behind a busy instance: `building-busy` with instance 1, every false.
11. Villagers then resources: two entries in first-accrued order, seconds equal each breakdown reason.
12. Not-reached steps: null and empty.
13. Whole english-1tc build at 1200 s: per reason, entry seconds sum to `waitBreakdown`; `waitingFor` is non-null exactly for `waiting` steps; resource entries have whole-number shortfalls; asserts first that some step has details.
14. Two runs return identical `waitingFor` and `waitDetails`.

## Results
- `aoe4-simulate-api-waits.spec.ts`: 35 passed (21 existing, 14 new).
- All `aoe4-simulate-api*` specs plus `fight-api-spec-surface.spec.ts`: 469 passed, including the contract spec with the new `StepWaitDetail` and `StepWaitEntry` checks.
- `aoe4-gathered-resources.spec.ts`: 5 passed.
- `npx tsc --noEmit` and `npm run lint:dup`: clean.

## Mutation checks (each undone with `git checkout -- <file>`; `git diff --exit-code` clean)
- `simulate.ts:561` `waitingFor = outcome.detail` to `null`: tests 2, 3, 4, 5, 6 and more failed on the missing detail.
- `simulate.ts:403` age check skipped: test 6 failed (building reported instead of age).
- `simulate.ts:411` `populationWait(state, 0)`: test 8 failed (`needed > 0`).
- `simulate.ts:419` instance forced to null: test 10 failed.
- `simulate.ts:407` instance forced to null: test 7 failed.
- `wait-detail.ts:59` needed and available swapped: tests 3 and 4 failed.
- `simulate.ts:958` merge-by-key removed: tests 2, 3, 5, 9 failed (60, 13, 961 and 2 entries).
- `wait-detail.ts:49` result plus 0.5: tests 2 and 13 failed on the whole-number assertion.

## Mutations that survive at this boundary (covered by the implementer's unit tests, not expressible through the API)
- `simulate.ts:419` `every` forced to false: no API test fails. A no-instance produce that waits on two or more busy instances needs a bank deep enough to start all of them and an economy that leaves them busy. Every attempt through english-1tc was resource-bound (the busy wait never came first), and the API start has no way to grant starting buildings or resources. `simulate-wait-details.test.ts:95` pins `every: true`.
- `wait-detail.ts:49` `Math.ceil` to `Math.floor`: no API order reaches a fractional shortfall under 1 at an offer instant. `simulate-wait-details.test.ts` holds the 0.4 case.

## Failures
None.

## Criteria not expressible in this harness
- `every: true` over several instances and the fractional round-up (above).
- `ageWait` naming a landmark under construction: no API order starts a landmark of the current age and waits above it within a reasonable run; unit tests cover it.

## Notes
- The `move` available count grows during a 60 s run (6, then 7 as a villager spawns), so test 4 asserts a range. `waitDetails` keep the first interval's 6, as B-W6 says.
- One port in 3100-3999 was still listening after the runs. Playwright's own `webServer` stops its server on exit, so it probably belongs to another checkout; I started nothing else.
