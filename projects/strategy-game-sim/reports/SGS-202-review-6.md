# SGS-202 review 6

- Branch `sgs-202-house-demand-held-order`, tip eaa94293d9552f537765feb6f8f640e0a1a99add, base `origin/main` bd0caf9 (full review, not delta).
- Verdict: **REQUEST CHANGES** (one blocking `test` finding; the engine change, docs and other tests are correct).

## Blocking findings

1. `lib/aoe4-build-order/simulate-busy-buildings.test.ts:285`, `:296-297`, `:306` - test - The hold-guard test's link to the base start is two assertions on a literal: `expect(countingHeld).toBeGreaterThan(2)` and `expect(countingHeld).toBeLessThan(70)`, where `countingHeld = 48.383333333` is a hard-coded constant. Neither can fail under any production or data change (common.md, Tests: no assertions that restate a literal). The test name, "holds barracks 1 and 3 through the instant the first house would start if their orders counted", relies on that link. Separately, test 3's name claims the no-hold build "starts its first house when the wood is banked", and no assertion checks the wood. Why it matters: the guard that criterion 1 requires ("asserts the instance is held at the instant the base engine starts that house") compares a constant with constants. The 2 and 70 bounds are not tied to the run's hold window, so a fixture change that ends the hold before the base start (for example man-at-arms time 70 -> 40) is not caught by these lines. Direction:
   - Compute the constant from the engine instead of writing it: after `simulate` is defined, `const countingHeld = simulate(busy).houseStarts[0]`.
   - In test 3, pin it: `expect(countingHeld).toBeCloseTo(48.383333333, 6)`.
   - In test 1, bound it by the run's own hold window: `expect(countingHeld).toBeGreaterThan(2)` and `expect(countingHeld).toBeLessThan(withHold.result.steps[3].startedAt!)`.
   - What these lines then fail on: the fixture break above (`startedAt` becomes 40 while `countingHeld` stays 48.383, so the second bound fails), or a planner break at `lib/aoe4-build-order/houses.ts:51` that drops `demand.populationPerSecond * horizon` (`countingHeld` goes from 48.383 to `undefined`, so `toBeGreaterThan` fails).
   - Precondition: the no-hold start is fractional and lies strictly inside the hold (2 s, 70 s) today. Before: 48.383 in (2, 70). After either break: outside the window, or undefined.
   - (text) Rename test 3 from `'still counts producers that are not held, so the same build with no hold starts its first house when the wood is banked'` to `'still counts producers that are not held, so the same build with no hold starts its first house at 48.383 s'`. Facts kept: it counts producers that are not held, and it uses the same build with no hold. Fact dropped (the defect): "when the wood is banked", which no assertion checks.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Held order contributes nothing; first house later than base; guard; first-pass decides | pass (guard wording is finding 1) | Test 2 pins 70. I ran the new tests against the base `simulate.ts`: `expected 48.38333333333334 to be 70`. I ran mutation M1 (clear `engine.held` for pass 1 only): `expected 50 to be 70`. The guard's spearman counts at 45/50 (2, 2) and `startedAt: 70` show the hold covers 48.38; the literal bounds do not (finding 1). |
| 2 | Not-held and busy-with-paid producers still count | pass | Test 3: the no-hold build starts at 48.3833. The implementer recorded the same start at the base. Its M4 (add 0 for every instance) fails test 3 with `undefined`. |
| 3 | Each pass uses the latest hold; exclusion ends after the starting offer | pass | Test 2 asserts the house start equals `steps[3].startedAt` (70). I ran mutation M2 (pass 3 reads the hold as it stood at the instant's start): `expected 72 to be 70`. |
| 4 | Held order's production time still checked | pass | Test 5: it throws with `autoHouses: true`, and with `autoHouses: false` there is no throw and 1 man-at-arms. I ran mutation M3 (skip held before `productionSeconds`): `expected function to throw an error, but it didn't`. |
| 5 | Existing tests keep assertions | pass | The diff edits no existing test, only imports and a new describe. Full `npm test`: 2863 passed, 15 skipped, 0 failed. |
| 6 | Docs state exclusion and which hold each pass uses; productionModifier claim stays true | pass | The Houses and supply sentences match `houseDemand` (simulate.ts:676-680) and `runInstant` (744-755). The productionModifier claim stays true because `productionSeconds` is called before the held test (simulate.ts:678). The README bullet matches. |
| 7 | Determinism and non-negative resources | pass | Test 4 (`noneNegative`, re-run `toEqual`). The existing A2/A3 tests pass. |
| 8 | No INVARIANTS.md regressions | pass | See below. |

Bug regression record: the implementer recorded the failure at base bd0caf9 on the assertion that names the bug (`expected 48.38333333333334 to be 70`). I reproduced it in my scratch with the base `simulate.ts`.

## Invariants touched

- A1 (game numbers from data): holds. No literal in engine code. The test fixtures edit data only.
- A2 (resources never negative): holds. Only the demand estimate changes. `payOrder`, `startProduction` and `runHousePass` payments are unchanged.
- A3 (determinism): holds. `Set.has` on `engine.held`, with no new state, randomness or clock.

## Contract and checklist

- spec-checklist (Contracts, Scope, Naming, A1-A3): no new names. No golang/ or out-of-scope change. No invented constant. A1-A3 pass.
- Scope: one condition in `houseDemand`, plus docs and tests. No change to `offerSteps`, `planAutoHouse`, reserve/house-hold rules, or the `runInstant` pass order (ticket Out of scope respected).
- Doc claims: I checked all 4 in the implementer's list against the code. All are true.
- The code comment at simulate.ts:677 states a hidden constraint and is true. It meets the comment bar.

## Lint

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.

## Bot reconciliation

`reviewBot.cli` is empty: skipped.

## Non-blocking notes

- `lib/aoe4-build-order/README.md:151` is 164 characters wide. Every other line in that file is 120 or fewer, and the neighbors wrap at about 110. Rewrap after "the projected" to match.
- `docs/aoe4-build-order.md:348`: "Each run" comes one paragraph before "The planner runs three times in an instant" introduces the runs. "Each planner run" would read without the forward reference.
- The new describe's local `simulate` and `houseSeconds` helper repeats the shape of `houseStarts` in `simulate-construction.test.ts:454`, but there with a fixed house time. Two copies is under the three-copy threshold. A shared `houseStarts` helper in `test-helpers.ts` would be a follow-up, not this ticket.

## Coverage

- Files reviewed:
  - `lib/aoe4-build-order/simulate.ts` (houseDemand, startProduction, offerSteps, runHousePass, runInstant, nextWake)
  - `lib/aoe4-build-order/houses.ts:51`
  - `lib/aoe4-build-order/simulate-busy-buildings.test.ts`
  - `lib/aoe4-build-order/test-helpers.ts` (`housesDone`)
  - `docs/aoe4-build-order.md` (Queues, Houses and supply)
  - `lib/aoe4-build-order/README.md`
  - Sibling comparison: `simulate-construction.test.ts:454-465`, `simulate-house-hold.test.ts`.
- Mutations I ran myself, each undone and the tip restored: M1, M2, M3, and the base engine. I did not rerun M4 or the A3 mutation; those rely on the implementer's record.
- UI inspection: not run. The diff changes no UI.
- REPO.md Review checklist, Every diff: `npx next build` was not rerun by me. The implementer recorded a successful build, and the diff touches no page or component. I did not load the page; the engine change is covered by unit tests. AoE4 build order section: no copied helper or tolerance in `lib/aoe4-build-order/`. Engine rule change checked against `docs/aoe4-build-order.md`, with no contradicted sentence. The UI items do not apply.
- No REVIEW.md at the repo root. LESSONS.md has one entry (Paths `acceptance/**`), which does not apply. Exemplars: none of their kinds (acceptance specs, blob store tests) are in the diff.
