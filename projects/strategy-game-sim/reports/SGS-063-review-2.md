# SGS-063 review 2 (re-review after rework 1)

- Ticket: SGS-063 (auto-house warnings)
- Branch: sgs-063-aoe4-auto-house-warnings, tip 0bd46731353a8b55baeed12a3989d8bbdf43e4c8 (local only, not on origin)
- Base: 028fc437982db99fce026f6144aa1bda0ea461c7 (merge-base with origin/main). Reviewed `git diff 028fc43...0bd4673`, 2 commits:
  14d77ac (warning work) and 0bd4673 (rework fix).
- `git range-diff c566e07..b924ee1 028fc43..14d77ac` reports `=`, so the first commit is unchanged from the one reviewed in review 1. This pass ran in full anyway because review was the gate that bounced the ticket.
- origin/main has moved one commit since then (f3e06e6, chart markers dashed). It touches no file in this diff except `docs/aoe4-build-order.md`, and `git merge-tree` merges cleanly.
- Verdict: **APPROVE**

## Blocking findings

None.

## Rework verification

- **Flag reset point** (simulate.ts:654-655). `engine.supplyBlocked = false` now runs after `applyDueEvents` and before the second `offerSteps`. `startProduction`, and so the `payOrder` supply clause, runs after the reset, so its refusal still counts. Every step that was refused for supply in the first pass is offered again in the second pass:
  - `offerReactions` re-offers every reaction that has not started (simulate.ts:474-485).
  - The ordered cursor does not advance on a refusal (simulate.ts:491-502).

  So clearing the flag cannot drop a block that still holds. The new comment is accurate.
- **Repro values** (stock data, 9 wood villagers, 200 s):
  - House at(0) gives `at` 1, `seconds` 19. The produce step's `waitSeconds` is 19 (starts at 20).
  - House at(5) gives `at` 5, `seconds` 20. `waitSeconds` is 20 (starts at 25).

  The implementer's `at` 5 for the second case is right: the ordered cursor reaches the produce step only once the house at(5) starts. These are unit tests only. The route rejects 9 starting villagers ("start.villagers sums to 9, the civ starts with 6"), so this repro cannot go through the API.
- **Mutation: old reset point restored.** Both repro rows fail (2 failed, 22 passed). Undone, tree clean.
- **Mutation: `autoHouses` conjunct dropped from `accrueHeld`.** All 1298 tests still pass, as the implementer says. This is fine under accepted deviation 1: `houseWarnings` returns `[]` when auto-houses are off, so the fields cannot be observed. The field comment at simulate.ts:148 ("while the house gate kept auto-houses off") is now exact.
- **Stock-data pin.** Start `{rally: sheep}`, steps `[build house, 1 builder, from sheep, at(300)]`, 400 s. Returns `auto-houses-held` with step 0, at 60, seconds 240, in the unit test (`pins a late house on stock data`) and through the route (curl against `next dev` on 3823). Message: "production was held at the supply limit for 4:00 from 1:00 while auto-houses waited for step 1 (build house) to start."
- **Knight/Longbow.** One `auto-houses-held`: step 23, at 461.81904761904764, seconds 21.236012345678944. It appears at default, 1200, 1800 and 3600 s with `autoHouses` default or true, and never with `autoHouses: false`. The README sentence in `data/aoe4-build-order/README.md` is accurate: "step 24" (1-based), "0:21 (21.2 s) from 7:42 (461.8 s)", at default inputs, 1800 s and 3600 s. ENG 1TC and Spear/Longbow emit neither warning.

## Timing (A3)

I dumped full `SimulationResult`s from base 028fc43 (a separate detached worktree) and from tip 0bd4673, using the same temporary vitest dump file in each. The dump file was deleted afterwards. 66 runs in total:

- the 36-run matrix: 3 shipped builds × durations {default, 1200, 1800, 3600} × `autoHouses` {default, false, true};
- both repro rows and the stock pin;
- a 27-run late-house sweep: second house at {60..540 step 60} × wood villagers {3, 6, 9}, 600 s.

To compare, I removed the `auto-houses-*` entries from the tip's warnings and diffed each run's JSON text against base: **0 diffs**. Every non-warning field matches byte for byte, and so does every other warning. The digest pins in the test file (late-house run and the three shipped builds at 1800 s) pass on the tip, which agrees with the base dump. A3 holds.

## Acceptance criteria

- [open] 1 never-start through the API. The unit test passes, and the route returns it by hand (step 0, at 0, "...did not fire by 6:40..."). The Playwright test is the acceptance gate's, so this stays unticked.
- [pass] 2 never-start not emitted (autoHouses off, no house, not a reaction, fired and still waiting).
- [open] 3 held exact pair. The unit pins are correct (220/80 on edited data, 60/240 on stock data), and the route gives 60/240 by hand. The Playwright test is the acceptance gate's, so this stays unticked.
- [pass] 4 held not emitted (autoHouses off, gate open, gate opens the same instant, maxPopCap, final instant only), and each row is paired with an emitted row one wake past the boundary.
- [pass] 5 both from one run, and the tie order (unit test plus the 16-row sortWarnings permutation).
- [pass] 6 timing unchanged: digest pins plus the 66-run base/tip diff.
- [pass] 7 shipped-build warnings reported, and the Knight README states them.
- [pass] 8 OpenAPI 5 variants and the contract tuple; the contract spec passes in the acceptance run.
- [pass] 9 step-stuck grep. openapi:1891, docs:405, 724 and 736 name both new codes. docs:417 is the severity row, with the two new rows after it. docs:322 and 726 do not list the codes.
- [pass] 10 `they stay off; with no`: 0 hits.
- [pass, ticked] 11 mutations. The gate-always-open mutation kills the held tests, and the first-only accrual mutation kills the pinned seconds test (implementer report; review 1 reproduced both). The never-start half cannot hold by design (accepted deviation 2 in review 1).
- [pass] 12 checks:
  - `npx tsc --noEmit` clean.
  - `npm run lint:dup` 0 clones.
  - `npm test` 43 files, 1298 passed / 8 skipped.
  - `npm run acceptance` 569 passed (Node 24.22.2, ACCEPTANCE_PORT=3823).
  - `npx next build` passed.
  - The implementer's report lists the edited tests (none edited in rework).
- [pass] 13 no invariant regressions.

Ticked in the ticket: 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13. Left open: 1 and 3.

## Invariants touched

- A1 holds. The cap is read from `engine.data.base.maxPopCap.value`, and the change adds no game-number literal.
- A2 holds. The rework touches only `supplyBlocked` and the `accrueHeld` condition, and no resource is written.
- A3 holds. There is no clock or randomness, and the 66-run diff is identical outside the auto-house warnings.
- S3 holds. A run emits at most two extra warnings.

## Contract and scope

- The amended Scope line ("cleared after `applyDueEvents` and just before the second `offerSteps`") matches simulate.ts:654-655.
- The docs house paragraph says an instant counts as held when the block holds and "the step has not started by the end of that instant". The code now matches that, so no doc, OpenAPI or README sentence is contradicted.
- `houseGateOpen` semantics, `startAutoHouses`, `planAutoHouse` and wake times are unchanged. The diff makes no UI change, does not touch shipped build data, and does not touch `golang/`.

## Linter

`npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## Conventions

The rework commit is two lines of engine logic and a new `it.each` table that follows the file's existing tables (`run`, `at`, `house` helpers, four-space indent). The commit message describes the change without process history. There are no new convention departures since review 1.

## Non-blocking notes

- The repro test asserts `result.steps[2].waitSeconds` equals `seconds`. This is a good cross-check that the held time matches the step's own wait.
- The branch is not on origin. The manager pushes it.

## Coverage

- **Files reviewed:** every file in the diff (model.ts, simulate.ts, depletion.ts, simulate-house-warnings.test.ts, depletion.test.ts, builds.test.ts, openapi.json, aoe4-simulate-api-contract.spec.ts, docs/aoe4-build-order.md, data/aoe4-build-order/README.md). For the first commit I relied on the range-diff identity with b924ee1 and on review 1's line-by-line pass, and re-read the full simulate.ts, model.ts and depletion.ts diff.
- **REPO.md, Every diff:** `next build` passed. I ran the route by hand under `next dev` on 3823; the acceptance suite loads the page.
- **REPO.md, AoE4 build order:**
  - No helper was copied.
  - Engine-rule docs were checked against the code.
  - No chart changed.

All processes I started are stopped (port 3823 free). Both review worktrees are removed.
