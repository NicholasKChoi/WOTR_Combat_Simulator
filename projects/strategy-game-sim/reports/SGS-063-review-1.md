# SGS-063 review 1

- Ticket: SGS-063 (auto-house warnings)
- Branch: sgs-063-aoe4-auto-house-warnings, tip b924ee12f0cfc7db647ee7f480a2c95cce6e2dcf (local only, not on origin)
- Reviewed: `git diff c566e07..b924ee1` (the one commit stacked on sgs-062)
- Verdict: **REQUEST CHANGES** (one blocking correctness finding)

## Blocking findings

1. `lib/aoe4-build-order/simulate.ts:651` (`runInstant`, `engine.supplyBlocked = false` before the first `offerSteps`). Category: correctness/contract.
   - **What:** the flag is set by the first `offerSteps` pass and is never cleared for the second pass. A
     produce step that waits on population in pass 1, then starts in pass 2 after `applyDueEvents` completes
     a house at that same instant, leaves `supplyBlocked` true. `accrueHeld` then counts the interval from
     that instant to the next wake as held, even though production resumed at that instant.
   - **Repro (unit, stock English data, 9 villagers on wood, 200 s):** steps `[pause capital-town-center,
     build house at(0), produce villager at(1), build house at(150)]`. Step 2 is armed at 1 and starts at 20
     (`waitSeconds` 19). The warning reports `at 1, seconds 24` ("held ... for 0:24 from 0:01"). With the
     house trigger at(5), the step waits 20 s (5 to 25) and the warning reports 25 s. In both cases the
     overcount is exactly the interval after the house completes.
   - **Why it matters:** the message, the OpenAPI `seconds` description ("Total seconds production was
     held"), and the new docs sentence (docs/aoe4-build-order.md:324-327: "an instant counts as held when a
     `produce` step waits on population ...") all say production was held. The code counts an interval in
     which production was running. A user reads a held time longer than the step's own `waitSeconds`. This
     happens whenever an earlier explicit house unblocks a produce step while the last house has not started.
   - **Direction:** clear the flag after `applyDueEvents`, just before the second `offerSteps`, so that the
     final pass and `startProduction` decide it. Every population-blocked step is offered again in pass 2:
     reactions that have not started are re-offered, and so is the cursor step. I applied this change and
     re-ran it. It gives 19 s and 20 s for the two repros. It leaves the 220/80 pin, the Knight pin
     (461.819/21.236), all three shipped builds (default, 1200, 1800 and 3600 s, autoHouses on and off) and a
     27-run late-house sweep unchanged. Add a unit test that pins the repro above (`at` 1, `seconds` 19).
     The ticket's Scope line says "cleared at the start of `runInstant`". Its stated reason, that only the
     last `runInstant` of an instant counts, still holds after the move. The manager should amend that line
     in the ticket so the code and the ticket agree. The design (C6 / Engine table: "an instant at which ...
     production was blocked") supports the fix.

## Spec gaps

None that block. One note for the acceptance gate: the unit pin of 220 s / 80 s uses edited game data
(`twoTowns`: a second TC and 5000 food). `POST /api/aoe4-build-order/simulate` cannot take that data, so
"the same values through the API" cannot be reproduced literally. A stock-data late-house body works through
the route. I ran start `{rally: sheep}`, steps `[build house, 1 builder, from sheep, at(300)]` and
`durationSeconds` 400. It returns `auto-houses-held` with step 0, at 60 and seconds 240. The acceptance test
should pin a stock-data run like this. If the criterion's "same values" wording must hold, the implementer
should add the same run to the unit test.

## Deviations ruled

1. **`accrueHeld` drops the `autoHouses` check.** Accepted. `heldAt` and `heldSeconds` are read only in
   `houseWarnings` (simulate.ts:891-898), which returns `[]` when `!engine.inputs.autoHouses`
   (simulate.ts:879). Neither field reaches any other output. Checked through the API: the never-firing build
   with `autoHouses: false` returns `[]`. All three shipped builds with `autoHouses: false` match base.
   Non-blocking note: the field comment (simulate.ts:148, "while the house gate kept auto-houses off") is
   loose for `autoHouses: false` runs, where the field still accrues. Restoring the one conjunct would keep the
   ticket's classification rule literal and the comment exact.
2. **The never-start test survives a gate forced open.** Accepted, by design. C6 and the Engine table
   define never-start only from `autoHouses`, `isReaction(L)` and `armedAt === null`; the gate is not a
   condition. No correct never-start test can depend on the gate. I re-ran the mutation: gate always open
   fails 8 tests (every held test, both-together, both digest pins). The never-start rows are killed by the
   isReaction, armedAt and autoHouses mutations the implementer reports. The acceptance criterion's "and
   never-start" half cannot be met as written. The criterion should be read as held-only.
3. **No Playwright API tests.** Accepted for this gate, because acceptance-test owns test authoring. Criteria
   1 and 3 stay open until the acceptance gate adds the API cases (see the Spec gaps note on 220/80). I checked
   the route by hand with `next dev` on 3803:
   - never-firing reaction house, 400 s: `auto-houses-never-start` (step 0, at 0, "...did not fire by
     6:40...") followed by `auto-houses-held` (step 0, at 60, seconds 340).
   - with `autoHouses: false`: `[]`.
   - Knight/Longbow at default inputs: one `auto-houses-held`, step 23, at 461.819, seconds 21.236.

## Knight/Longbow warning and README

This is real behaviour. Steps 21-23 (0-based) are the three houses before the King's Palace. Step 23 is the
last `build house` and starts at 488.86. Production first hits supply at 461.819. It is released when house
step 21 completes at 483.055, which adds supply. 483.055 - 461.819 = 21.236, exactly the reported `seconds`.
From 483.06 to 488.86 production is not blocked, so nothing more accrues. The fix in finding 1 does not change
this value; I verified that. `formatMinSec` rounds, giving 7:42 and 0:21. Step 23 is "step 24" 1-based.
The README sentence is accurate: one `auto-houses-held` at default inputs (1200 s), 1800 s and 3600 s,
"0:21 (21.2 s) from 7:42 (461.8 s)", step 24 being the third of the pre-palace houses. ENG 1TC and
Spear/Longbow emit neither warning at any of those durations. The UI renders the warning in the warnings
list; I loaded the page and ran Knight/Longbow at 1280 px.

## Timing (A3)

I dumped full results on base c566e07 and on the tip for the three shipped builds × {default 1200, 1200,
1800, 3600} × {autoHouses default, false}, plus 27 late-house variants. Every field except `warnings` is
byte-identical. Within `warnings`, every non-auto-house warning is also identical. The only difference is
the added `auto-houses-*` entries. A3 holds.

## Acceptance criteria

The verdict is not APPROVE, so no criterion is ticked in the ticket.

- [fail-pending] 1 never-start exact warning: passes in the unit test, and the route returns it by hand. The API test is the acceptance gate's.
- [pass] 2 never-start not emitted for autoHouses off, no house, not a reaction, fired-and-waiting: unit rows present, and the mutations kill them.
- [fail] 3 held exact pair: the unit pin 220/80 is correct for that build, but `seconds` overcounts in the case in finding 1. The API half is open, and cannot be done with the twoTowns data.
- [pass] 4 held not emitted for autoHouses off, gate open, gate opens the same instant, maxPopCap, final-instant-only: each has a paired emitted row one step past the boundary.
- [pass] 5 both together and the sort order: unit test plus the sortWarnings table (a 16-row permutation, verified unique). tieRank matches `[2,step,0]`/`[2,step,1]`.
- [pass] 6 timing unchanged: digest pins at 1800 s plus my full base/tip diff.
- [pass] 7 warnings reported per shipped build, and the README states the Knight warning accurately.
- [pass] 8 OpenAPI has 5 variants, the two new ones closed, with every property required and described; the contract spec passes.
- [pass] 9 grep: openapi:1891 and docs:405, 724-725 and 736-737 name both new codes; docs:417 is the step-stuck severity row, followed by the new rows; docs:322 is the new house paragraph.
- [pass] 10 `they stay off; with no`: 0 hits.
- [partial] 11 mutations: the gate mutation kills the held tests; the never-start half cannot be met by design (deviation 2). The first-only accrual mutation kills the pinned test.
- [pass] 12 tsc clean, jscpd 0 clones, vitest 1109 passed / 8 skipped, acceptance 554 passed (Node 24.22.2, ACCEPTANCE_PORT=3803), `next build` passed.
- [pass] 13 no invariant regressions.

## Invariants touched

- A1 holds: the cap is read from `engine.data.base.maxPopCap.value`, and the code has no number literals.
- A2 holds: the new code reads `population`, `supply` and `time`, and writes only `supplyBlocked`, `heldAt` and `heldSeconds`.
- A3 holds: there is no clock or randomness, and the base/tip diff is identical outside `warnings` (see Timing).
- S3 holds: at most two new warnings per run.

## Contract and scope

- Names match C6: `auto-houses-never-start` and `auto-houses-held`; fields step, at, seconds; messages
  checked character by character against C6 and the ticket.
- `houseGateOpen` semantics are unchanged; `lastHouseStep` is the shared lookup. `startAutoHouses` and
  `planAutoHouse` are untouched, and no wake-time code is touched.
- The diff makes no UI change, touches no shipped build data, and does not touch `golang/`.
- The payOrder split raises the flag only on the supply clause, as the ticket requires.

## Linter

`npx tsc --noEmit` clean. `npm run lint:dup`: 0 clones.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## Conventions

- The `houseWarnings` and `accrueHeld` placement and shape match `stepStuckWarning` (simulate.ts:852) and
  `accrueWait`. The Engine field comments follow the neighbouring field comments (simulate.ts:142-145).
- The test file follows the simulate-*.test.ts siblings: it uses the test-helpers `run`, `at` and
  `editGameData`, four-space indent, and `it.each` tables for the boundary rows.
- `builds.test.ts:83`: the `'node' in w` narrowing is equivalent and needed for tsc.

## Non-blocking notes

- simulate.ts:148 field comment, see deviation 1.
- OpenAPI `SimulationResult.warnings` description omits "by step" for the auto-house tie. The two warnings
  always share step `L`, so this is moot.

## Coverage

I reviewed every file in the diff: model.ts, simulate.ts, depletion.ts, simulate-house-warnings.test.ts,
depletion.test.ts, builds.test.ts, openapi.json, aoe4-simulate-api-contract.spec.ts, docs/aoe4-build-order.md
and data/aoe4-build-order/README.md. I also checked the UI consumers of `warnings` (messages.ts and
message-lists.tsx read fields generically) and the knight build JSON. REPO.md checklist: for Every diff I ran
`next build` and loaded the page in `next dev`. In AoE4 build order, no helper is copied (`lastHouseStep` is
extracted), the engine-rule docs were checked against the code (finding 1 is the one contradiction), and no
chart changed. The API was exercised with curl.
