# SGS-005 review after rework 1

- Verdict: **APPROVE**
- Reviewed: tip 1414c28 against base origin/main cc47156, full mode (whole branch, 6 files). The branch is not on origin, so the review worktree was made from local commit 1414c28. The rework delta from 6525ab0 is 1 deleted comment line and 1 renamed test.
- Gates run here: `npx tsc --noEmit` clean. `npm test` 57/57. `npx next build` succeeds. `npm run acceptance` gives 81 passed and 21 failed: the same 21 old single-battle API specs as review 1, which belong to the acceptance gate. `/api/fight` was exercised with curl under `next start`, and the page was loaded from the built app.

## Rework 1 required fixes

- [x] `lib/combat-simulator/simulate.ts:51`: the false comment is gone and the code is unchanged (`Math.ceil((p * sorted.length) / 100) - 1`). Confirmed with `git diff 6525ab0..1414c28`.
- [x] `lib/combat-simulator/simulate.test.ts:91`: renamed to "gives p10 3, median 15 and p90 27 for N = 30". The assertions are unchanged, and the name now matches what the test checks.
- [x] Nothing else changed: the delta is exactly those two hunks.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

Unit (all pass, all ticked):
- Accumulator outcome keys, order, zero counts, sum and frequencies: `simulate.test.ts:37-52`.
- Extended kind list, and an unknown kind throws: `simulate.test.ts:54-69`. Counters are built from `kinds` (`simulate.ts:73-78`, `136-140`).
- Percentiles for 1..10, N = 1 and N = 30: `simulate.test.ts:83-94`. Mutation check: replacing the rank with `Math.floor(p*N/100)` (an off-by-one) fails 2 tests.
- Survivors: `simulate.test.ts:106-135`. The sort at `simulate.ts:171` is count desc, then regulars desc, then elites desc.
- Hits per round, including the throw on 6: `simulate.test.ts:139-159`.
- Loop independence (W2): mutation check re-run. Hoisting the `BaseArmy` construction out of the loop fails 4 tests.
- `battles` = N, and counts sum to N: `simulate.test.ts:166-201`.
- Classified with `battleOutcome` (`simulate.ts:190`). `options` is passed unchanged to every `Battle` call and never read (`simulate.ts:180,189`).

HTTP (verified by hand with curl under `next start`; left unticked because the harness specs are the acceptance gate's to write):
- No `battles` key gives 1000, and counts sum to 1000. `1`, `"1"`, `100000`, `"100000"` and JSON `1e3` all give 200 with matching `battles`.
- `0`, `-1`, `100001`, `1.5`, `"1.5"`, `"abc"`, `""`, `"1e3"`, `" 5"`, `"+5"`, `null` and `true` each give 400 `battles must be a whole number between 1 and 100000`.
- Precedence: `attack-regs: 11` with `battles: 0` gives 400 naming `attack-regs`. PUT gives 405 with `Allow: POST`.
- Top-level keys are exactly the section 1 set, and there are no `attack`/`defend` keys.
- One-sided 0/10/5 vs 1/0/0: attacker frequency 1. Mirrored 5/0/0 vs 5/0/0: 0.469 / 0.523 / 0.008, with p10 3.
- Time at N = 100,000 after warm-up: 0/10/0 mirror 0.44 s, 0/10/5 mirror 0.40 s.
- No log output: `grep console.` over `lib/`, `pages/api/` and the WOTR UI finds nothing, and the `next start` log is empty during requests.

UI: the built app serves `<input type="number" id="battles" name="battles" ... min="1" max="100000" step="1" value="1000"/>`. The existing UI specs pass under `next dev`. The new UI specs are for the acceptance gate, so these are unticked.

General, ticked: tsc and build pass, with the page loaded under dev (UI specs) and under the built app; no change to dice, threshold, reroll or casualty semantics, `docs/` or `golang/`; the statistics match CONTEXT "WOTR outcomes"; no invariant regressions. Unticked: the acceptance suite passing (acceptance gate) and the PR description timings (no PR yet).

## Invariants touched

- W1: holds. In `battle.ts`, `concat` became `push` at 95/116/118 (same arrays), and the two `console.log` calls were removed. The 23 battle tests are unchanged and pass.
- W2: holds. Fresh `BaseArmy` objects are built every iteration from plain counts (`simulate.ts:187-188`). The survivor tally copies numbers (`simulate.ts:121-126`) and keeps no reference to the army.
- S3: holds. `battles` is capped in the handler (`fight.ts:53-62`) before any work, and again in `simulateBattles` (`simulate.ts:182-184`).
- S1/S2: not affected.

## Spec checklist

Contract names match ticket section 1 (CONTEXT Key surfaces is the manager's post-merge edit, per section 7). Scope: no `golang/`, `docs/`, OpenAPI or CONTEXT edits, and no new kinds, option fields or termination rules. No invented constants (1000 and 100,000 come from CONTEXT Decisions; 5 is the hit cap). Names state intent.

## Linter

`npx tsc --noEmit`: clean, including test files (`strict: false`, `target: es5`).

## Review bot

`reviewBot.cli` and `rulesFile` are empty, so no bot was run.

## Conventions against nearby code

These are unchanged from review 1 and still hold:
- `simulate.ts` matches `battle.ts` (2-space indent, semicolons, lowercase `Error` messages).
- `simulate.test.ts` matches `battle.test.ts:1-40` (4-space indent, no semicolons, a local roller helper).
- `validateBattles` (`fight.ts:53-62`) reuses `parseCount` and follows the `number | string` shape of `validateField` (`fight.ts:38-51`).
- The page input follows `army.js:17-19`.

## Correctness (REPO.md Review checklist)

- Every diff: `next build` passes, and the page loads under the built app and under `next dev`. I did not click through it by hand; the passing UI specs drive submit and render.
- Combat simulator round trip: form `battles` → `validateBattles` → `simulateBattles` → `SimulationSummary` → `Results` `summary`. The six army fields go from the `submitted` snapshot to `Results` (`results.js:75-77`). Every hop is consistent.
- Boundary cases: exercised with curl (above). Outcome direction: mirrored armies come out near even, and one-sided matchups go one way.
- No swallowed errors, no early returns that skip cleanup, and no state shared across requests (the accumulator is per call).

## Non-blocking notes

- `simulate.ts:6`: `MAX_HITS_PER_ROUND` is exported but only used in the module.
- `simulate.ts:159-160`: a synthetic record with 0 total rounds would give NaN shares. The API cannot produce one.
- `results.js:97`: `OUTCOME_LABELS[kind] ?? kind` reads through the prototype, so a hypothetical kind named `constructor` would render a function. This is not reachable with current or planned kinds. `Object.hasOwn` or a `Map` would close it.
- `docs/combat-simulator.md` "Current code" paragraph still describes the single-battle response. It needs a follow-up from the doc owner, since the ticket makes docs out of scope.

## Coverage

Files reviewed in full: `lib/combat-simulator/simulate.ts`, `simulate.test.ts`, `battle.ts`, `pages/api/fight.ts`, `pages/apps/combat-simulator.js`, `components/apps/combat-simulator/results.js`. Not reviewed: a manual browser click-through, and the new acceptance specs (they don't exist yet; acceptance gate). There is no `design/` file for M1.
