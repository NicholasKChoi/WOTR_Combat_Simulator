# SGS-095: Fix four test-hygiene follow-ups: spear-build step lookup, schema table titles, stale pin comment, combat-simulator acceptance flake

- **Type**: Task
- **Component**: aoe4-build-order (items 1-3), combat-simulator (item 4)
- **Milestone / criteria**: - (owner-chosen backlog cleanup, 2026-11-06: test hygiene)
- **Priority**: low
- **Risk**: low
  <!-- Test-only: no product code, API, schema, config or invariant touched. -->
- **Invariants**: none
- **LOC estimate**: 0 business-logic lines (about 40 lines of test and helper edits)
- **Depends on**: none (start from main at 9274372 or later)
- **On merge**: none
- **Source**: review findings on SGS-093 (review-1, tech-lead), SGS-091 (review-1, acceptance-test); each re-checked on origin/main 9274372 below

## Context

Four small weaknesses in tests, each found in review of an earlier ticket. All four still apply on main, with item 3's wording updated because the comment it named was already rewritten.

## Scope

Test and test-helper files only. Paths relative to the repo root.

1. **Hard-coded step index.** `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts` has `const MAN_AT_ARMS_STEP = 34`, used in `steps.find((s) => s.step === MAN_AT_ARMS_STEP)`. The API result's `steps` carry only the index (`StepTiming.step` in `lib/aoe4-build-order/model.ts`), but the spec already imports the build JSON. Derive the index from `spearLongbow.steps` as the first step with `action === 'produce'` and `unit === 'man-at-arms'` (today that is the step triggered at the Castle landmark second; later men-at-arms steps carry an `instance`). Fail loudly (throw) when no step matches. Keep `CASTLE_LANDMARK_SECONDS` and `MAN_AT_ARMS_START_SECONDS` as they are.
2. **Schema table titles and collection-time work.** In `lib/aoe4-build-order/schema.test.ts`, `describe('quoted ids in issue messages')` builds `cases` with `sites.flatMap(...)` in the describe body, calling each row's `run(value)` and `expected(...)` while collecting, and the `it.each` title ends in `%#` (prints the row index, for example "is quoted as 2"). Change so each `it` computes `run(value)` and the expected tail inside the test body (rows hold site, length, and the value or the inputs to build it), and the title states the rule without the index (for example `'%s: a %i character value is quoted whole up to 40 characters and cut with "..." beyond'`, wording the implementer's choice, no `%#`). A thrown schema error then fails one test instead of the whole file at collection.
3. **Stale pin comment.** In `lib/aoe4-build-order/simulate-house-warnings.test.ts`, the `it.each` in `describe('timing with the auto-house warnings')` has a comment above the `ENG Spear/Longbow into MAA/Crossbow` row beginning "Re-pinned for villagerTarget: ...". The task as given quoted "Re-pinned for the house lead-time rule"; main already carries different wording, but the comment is still a change-history note that describes one past re-pin and goes stale at the next one. Delete it (the file's other comment above the digests states the lasting rule). Do not change any pinned digest.
4. **Flaky `waitForResponse` in `acceptance/combat-simulator-battles.spec.ts`.** The test 'clearing battles shows the server error and no results' timed out waiting for the `/api/fight` POST once in a full `npm run acceptance` run and passed 7/7 alone. Suspected cause, to be confirmed by the implementer: the `test.beforeEach` waits only for `networkidle`, which does not mean React has hydrated `pages/apps/combat-simulator.js`; a click on `Fight!` before hydration submits the form natively (no `onSubmit` handler yet, so no `fetch`, and the page reloads), and the response wait never resolves. Full-suite load widens that window. The same `goto` + `networkidle` beforeEach is copied in `acceptance/combat-simulator.spec.ts` and `acceptance/combat-simulator-validation.spec.ts`. Reproduce under load first (for example `npx playwright test combat-simulator --repeat-each=10 --workers=4` or the full suite) and record the evidence in the report. Then replace the `networkidle` wait with a signal that the form handler is attached, in one helper exported from `acceptance/helpers.ts` (name chosen by the implementer) that the three combat-simulator specs call from their `beforeEach`. The signal must be observable state, not a fixed sleep or `waitForTimeout`; follow the repo lesson on polling. If the reproduction shows a different cause (for example the first `/api/fight` compile in `next dev` exceeding a timeout), fix that cause instead and say so in the report; the criterion below still holds.

**Out of scope:** product code, `playwright.config.ts` timeouts or retries (a retry would hide the race), the AoE4 acceptance specs' own waits, any digest or expected-value change.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts` contains no numeric step-index literal for the men-at-arms step; the index is found from the build's steps by action and unit, and the spec throws a clear error when the build has no such step.
- [ ] Mutation check: in a throwaway worktree, inserting one extra `pause` step at the start of `data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json` leaves this spec's men-at-arms timing tests passing (they failed with the hard-coded index).
- [ ] In `lib/aoe4-build-order/schema.test.ts`, no `it.each` title contains `%#`, and nothing in the `quoted ids in issue messages` describe body calls `checkBuildOrder`, `checkSimInputs`, or a row's `run` at collection time; every call is inside an `it` callback.
- [ ] Mutation check: breaking the schema so one `sites` row's check throws (for example making `checkSimInputs` throw) fails only the tests of the affected rows, and the other tests in the file still run and pass.
- [ ] The "Re-pinned for ..." comment above the spear/longbow digest row in `lib/aoe4-build-order/simulate-house-warnings.test.ts` is gone, and every pinned digest and `held` value in that file is unchanged.
- [ ] No `networkidle` wait remains in the three `acceptance/combat-simulator*.spec.ts` files, and each calls the same shared helper from `acceptance/helpers.ts` to open the page and wait until the fight form's submit handler is attached.
- [ ] The report records the reproduction: the failing command, the observed failure before the change, and the same command passing after it (at least 10 repeats of `combat-simulator-battles.spec.ts` with several workers).
- [ ] `npm test`, `npx tsc --noEmit`, and `npm run acceptance` pass with no test removed, and the implementer lists every file edited.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
