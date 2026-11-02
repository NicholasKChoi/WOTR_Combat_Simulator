# SGS-063 implementer 2 (rework 1)

- Ticket: SGS-063 (auto-house warnings), rework 1 (review-1 findings)
- Branch: sgs-063-aoe4-auto-house-warnings, stacked on sgs-062 c566e07 (not rebased)
- Tip: 8f8376bab6fcbfabe5f7e2f52c213ee05cbe511d (new commit on top of b924ee1, no amend), author choinickolas@gmail.com
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-063-aoe4-auto-house-warnings
- Node v24.22.2

## Files touched

- `lib/aoe4-build-order/simulate.ts`: `runInstant` resets `supplyBlocked` after `applyDueEvents`, just before the second `offerSteps` (it was at the start); `accrueHeld` checks `engine.inputs.autoHouses` again; the `supplyBlocked` field comment now says "in the final pass of the latest runInstant".
- `lib/aoe4-build-order/simulate-house-warnings.test.ts`: two new tests, listed below.

## Required fixes (all ticked in the ticket)

1. Flag reset moved to just before the second `offerSteps`. One comment explains why it sits there.
2. Repro pin: `it.each` over house at(0) giving at 1, seconds 19, and house at(5) giving at 5, seconds 20. Stock English data, 9 villagers on wood, 200 s, steps `[pause capital-town-center, build house at(h), produce villager at(1), build house at(150)]`. The test also asserts that the produce step's `waitSeconds` equals `seconds`.
   With the house at(5), `at` is 5, not 1. The ordered cursor reaches the produce step only once the house at(5) starts, so the step is first refused for supply at 5. The review gave only `seconds` 20 for this case. The test pins at 5 and seconds 20, which matches `waitSeconds` 20 (5 to 25).
3. `accrueHeld` checks `autoHouses` again, so the field comment is exact for runs with auto-houses off.
4. Stock-data pin: start `{rally: sheep}`, steps `[build house, 1 builder, from sheep, at(300)]`, 400 s. Returns exactly `[{code: auto-houses-held, step 0, at 60, seconds 240}]`. This matches the review's API run and is the run the acceptance gate will use.

## Tests

- `simulate-house-warnings.test.ts`: 24 passed (was 21; 3 new cases).
- `npm test`: 41 files, 1112 passed, 8 skipped.
- `npm run acceptance` (ACCEPTANCE_PORT=3813): 554 passed.
- No pre-existing test was edited.

## Mutation checks (each undone; `git diff` confirmed clean source afterwards)

- Reset restored to the start of `runInstant` (the old reset point): both repro rows fail (24 and 25 reported). All other tests pass. This is the check the checklist asks for.
- Accrual counts only the first blocked interval: 6 fail, among them the 220/80 pin, the stock-data 60/240 pin, both repro rows and the Knight 1800 s pin.
- `houseGateOpen` always returns true: 11 fail, among them every held test, the stock pin, both repro rows, the both-together test and both digest pins.
- `autoHouses` conjunct dropped from `accrueHeld`: no test fails. This is expected. `houseWarnings` already returns `[]` when auto-houses are off, so `heldAt` and `heldSeconds` are not observable then (review deviation 1). The conjunct only makes the field comment exact.

## Timing check (A3)

I dumped full results from base c566e07 (`git archive` of lib and data) and from the tip. The runs covered all three shipped builds × durations {default, 1200, 1800, 3600} × autoHouses {default, false, true}, 36 runs in all. In every run, every field except `warnings` is byte-identical. Within `warnings`, every non-auto-house warning is identical. The only difference is the added `auto-houses-*` entries:

- ENG 1TC: none, at every duration and setting.
- ENG Spear/Longbow into MAA/Crossbow: none, at every duration and setting.
- ENG Knight/Longbow (King's Palace): one `auto-houses-held` (step 23, at 461.81904761904764, seconds 21.236012345678944) at default, 1200, 1800 and 3600 s with auto-houses on or default. None with `autoHouses: false`. These values are the same as in review 1, so the README sentence stays accurate.

## Codegen, build, lint

- codegen: not set.
- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `next build` was not re-run in this pass. The change is two lines of engine logic plus tests, and tsc is clean. Review 1 ran `next build` on b924ee1.

## Invariants

- A1: the cap is still read from `engine.data.base.maxPopCap.value`.
- A2: the new code reads only `supplyBlocked`, `population`, `supply` and `inputs`, and writes no resources.
- A3: no clock or randomness, and the 36-run base/tip diff is identical outside `warnings`.

## Docs

`docs/aoe4-build-order.md` (house paragraph) already says that an instant counts as held when a produce step waits on population and the house step has not started by the end of that instant. The code now matches that wording, so the docs, OpenAPI and README are unchanged.

## Out-of-scope findings

None.

## Processes

The acceptance run started and stopped its own server. Nothing listens on 3813.

## Status

needs_review
