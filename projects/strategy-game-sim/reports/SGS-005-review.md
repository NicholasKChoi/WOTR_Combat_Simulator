# SGS-005 review 1

- Verdict: **REQUEST CHANGES** (one blocking finding, a small fix to a comment and a test name)
- Reviewed: tip 6525ab0 against base origin/main cc47156, full mode. The branch is not on origin, so the review worktree was created from the local commit 6525ab0.
- Gates run here: `npx tsc --noEmit` clean; `npm test` 57/57; `npx next build` succeeds; `npm run acceptance` 81 passed, 21 failed (every failure is an old single-battle API spec; see below); `/api/fight` was exercised with curl under `next start`.

## Blocking findings

1. `lib/combat-simulator/simulate.ts:51` - convention (comment bar) / correctness of a stated fact - The comment says "0.1 * 30 is 3.0000000000000004, whose ceiling is 4". That is false: in JS `0.1 * 30 === 3` and `Math.ceil(0.1 * 30) === 3`. (`0.1 * 3` is the expression that gives 0.30000000000000004.) I checked every N from 1 to 100,000 for p = 10, 50, 90: `Math.ceil(f * N)` and `Math.ceil((p * N) / 100)` never differ. - Why it matters: the only justification shipped with the rank formula is a false claim about float behavior, and any reviewer can disprove it in a console. - Direction: delete the comment. `Math.ceil((p * n) / 100)` is the doc's `ceil(p / 100 × N)` written directly and needs no explanation. If a comment stays, it must state something true.
   - Related, same fix: `lib/combat-simulator/simulate.test.ts:91`, the test named "computes the rank with integer arithmetic for N = 30", cannot tell integer from float rank. Mutation check: I replaced the formula with `Math.ceil((p / 100) * sorted.length)` and all 24 tests still passed. The test still has value, since its expected values (p10 3, median 15, p90 27) catch an off-by-one or a floor/ceil swap, but its name overclaims. Rename it to say what it checks, for example "gives p10 3, median 15, p90 27 for N = 30".
   - The implementer report says "A version using `0.1*N` returns p10 4 and fails". That is not reproducible: such a version returns p10 3 and passes.

## Spec gaps

None blocking. For the manager: the ticket criterion "(catches `0.1 * N` float error)" and the section 1 sentence "not `0.1 * N`, to avoid float error" rest on a false premise. No N in 1..100,000 triggers the error for p = 10, 50, 90. The integer form is still correct and matches the doc, so nothing needs to change in behavior. Only the "catches" claim cannot be met by any test, and it should not be asked of acceptance.

## Implementer / acceptance split

Section 6 lists both unit and acceptance specs under the ticket's Tests heading but doesn't say which role writes them. In this factory, acceptance-test owns harness specs, so the implementer leaving the section 6 acceptance work (updating the old-shape specs and adding the new HTTP/UI specs) to the acceptance gate fits the role split. I confirmed the 21 failures are the ones the implementer listed: `fight-api.spec.ts` (1), `fight-api-validation.spec.ts` (11: valid fights and range boundaries), and `fight-api-caps.spec.ts` (9). Each one reads `survivor`, `attack`/`defend` or the averages from the old response. None comes from a defect in the new code, and I don't count them against the implementation. The UI specs (`combat-simulator*.spec.ts`) and the landing spec pass. Note for acceptance: the caps-spec intents (no negative counts, leaders never lost, at most 5 hits, fresh armies) need to be restated against `survivors` and `hitsPerRound`, because the armies are no longer in the response.

## Acceptance criteria

Unit:
- Accumulator outcomes keys/order/zero counts/sum/frequencies: pass (`simulate.test.ts:37-52`).
- Extended kind list plus unknown kind throws: pass (`simulate.test.ts:54-69`). Outcome counters are built from `kinds` (`simulate.ts:74-79`, `137-141`), with no hard-coded tallies.
- Percentiles 1..10 / N=1 / N=30: pass on values (`simulate.test.ts:83-94`). The "catches float error" part cannot be met (see Spec gaps).
- Survivors (combinations, sums, frequencies, `[]`, ties, sort order): pass (`simulate.test.ts:106-135`). The sort at `simulate.ts:172` is count desc, then regulars desc, then elites desc.
- Hits per round (pooled shares, sum to 1, 6 throws): pass (`simulate.test.ts:139-155`).
- Loop independence (W2): pass. Mutation check: hoisting the `BaseArmy` construction out of the loop fails 4 tests.
- `battles` = N and counts sum to N: pass (`simulate.test.ts:174-199`).
- Classified with `battleOutcome`: pass (`simulate.ts:191`, `simulate.test.ts:191-201`). Options pass-through confirmed by reading the code: `simulate.ts:181,190` passes `options` unchanged to every `Battle` call and never reads it.

HTTP (checked by hand with curl under `next start`; the acceptance specs don't exist yet, so the criteria stay unticked):
- No `battles` key gives 200, `battles` 1000, counts summing to 1000: pass.
- 1, "1", 100000, "100000" give 200 (and JSON `1e3` gives 200): pass.
- 0, -1, 100001, 1.5, "1.5", "abc", "", "1e3", " 5", "+5", null, true each give 400 `battles must be a whole number between 1 and 100000`: pass.
- Precedence: an invalid army field with `battles: 0` gives 400 naming `attack-regs`; PUT gives 405 with `Allow: POST`: pass.
- Key sets match section 1 at every level: pass by inspection and curl.
- Sums and p10 >= 1: pass on sampled bodies (counts 1000, hit shares 1.0).
- One-sided: 0/10/5 vs 1/0/0 gives attacker 1.0; the mirror gives defender 1.0: pass.
- No carry-over: 5/0/0 vs 5/0/0 gives 0.481 / 0.509, p10 4: pass.
- No `attack`/`defend` keys in the response: pass.
- Time budget at N = 100,000 under `next start`, after warm-up: 0/10/0 vs 0/10/0 took 0.45 s and 0.41 s; 0/10/5 vs 0/10/5 took 0.38 s and 0.38 s: pass.
- No server log output per round or per battle: pass (`grep console.` over `lib/`, `pages/api/` and the WOTR UI found nothing; the `next start` log is empty during requests).

UI:
- `battles` input defaults to 1000, and the four headings render: the server-rendered input is `<input type="number" id="battles" name="battles" min="1" max="100000" step="1" value="1000">`, and the existing UI specs pass. The new UI specs don't exist yet, so this is unticked.
- Unknown outcome key: `results.js:95-97` iterates `Object.entries(outcomes)` and falls back to the raw key. Correct by reading; no spec yet.
- Submitted snapshot: `combat-simulator.js:31,49` snapshots the posted FormData. Correct by reading.
- Cleared `battles` posts `""`; the 400 is shown in `role="alert"` and the result is cleared (`combat-simulator.js:43-46`). Correct by reading.

General:
- Existing specs updated and `npm run acceptance` passes: **not met yet**. This belongs to the acceptance gate.
- tsc and next build: pass. The page loads under `next start` (HTTP 200). It was not clicked through in a browser by hand; the passing UI acceptance specs drive submit and render.
- No change to dice, threshold, reroll or casualty semantics, `docs/` or `golang/`: pass. Only `concat` became `push` (`battle.ts:95,116,118`) and the two `console.log`s were removed.
- PR description timings: n/a until the PR exists.
- Statistics match CONTEXT "WOTR outcomes" and the doc's Outcome reporting section: pass.
- Invariants: see below.

No criteria were ticked, because the verdict is not APPROVE.

## Invariants touched

- W1: holds. `push` and `concat` build the same arrays, and removing the logs doesn't change behavior. The 23 battle tests are unchanged and pass.
- W2: holds. `simulate.ts:187-190` builds fresh `BaseArmy` objects on every iteration from the plain input counts. The `BattleResult` arrays are read once and dropped, and the survivor tally copies the numbers (`simulate.ts:117-127`) without keeping a reference to the army. A unit test covers this, and the mutation check confirms the test can fail.
- S3: holds. `battles` is capped in the handler (`fight.ts:53-62`) before any work and again in `simulateBattles` (`simulate.ts:183-185`) before the loop. Worst case is about 0.45 s.
- S1/S2: not affected (no cross-app imports, no new page).

## Spec checklist

- Contracts: the names match ticket section 1. CONTEXT Key surfaces still describes the old `BattleStats`, and ticket section 7 assigns that update to the manager after merge.
- Scope: no `golang/`, `docs/`, `openapi.json` or CONTEXT edits; no new outcome kind, option field or termination rule.
- No invented constants: 1000 and 100000 come from CONTEXT Decisions; 5 comes from the hit cap.
- Naming: names state intent, and there are no dead enum values.
- W1/W2/S3: see above.

## Linter

`npx tsc --noEmit`: clean, including test files. `tsconfig.json` has `strict: false` and `target: es5`, so `Map.get(...) + 1` (`simulate.ts:103`) and `Map` iteration through `Array.from` type-check, and SWC/Node handle them at runtime.

## Review bot

`reviewBot.cli` is empty, so no bot was run. `rulesFile` is empty.

## Conventions against nearby code

- `simulate.ts` matches `battle.ts`: 2-space indent, semicolons, exported interfaces, `Error` throws with lowercase messages.
- `simulate.test.ts` matches `battle.test.ts:1-40`: 4-space indent, no semicolons, a local roller helper and `describe`/`it`.
- `validateBattles` (`fight.ts:53-62`) reuses `parseCount` and follows `validateField`'s `number | string` return (`fight.ts:38-51`).
- `results.js` keeps the old Bootstrap table markup and the exact headings, and fixes the old `<thead>` that had no `<tr>`.
- The page input copies `army.js:17-19` (`small-font-size`, label above, `form-control`). Writing `max={100000}` inline matches how `army.js:4-5` duplicates its caps.

## Correctness checks (REPO.md Review checklist)

- Every diff: `next build` passes and the page loads under `next start`. I did not click through `npm run dev` in a browser; the passing UI acceptance specs drive that flow under `next dev`.
- Combat simulator round trip: form `battles` → `validateBattles` → `simulateBattles` → `SimulationSummary` → `Results` props `summary`. The six army fields go from the snapshot to `Results` `submitted[...]`. Every hop is consistent.
- `/api/fight` boundary cases were exercised with curl (above).
- Outcome direction for dice/casualty changes: no semantic change. Large-N outcome shares are symmetric for mirrored armies (0.499/0.498) and one-sided matchups go one way (1.0).
- No early-return cleanup gaps, no swallowed errors, no shared state across requests. The accumulator is per call.

## Non-blocking notes

- `simulate.ts:6`: `MAX_HITS_PER_ROUND` is exported but has no importer outside the module. It could be module-private.
- `simulate.ts:160-161`: if a synthetic record has 0 rounds, `hitsPerRound` would be NaN (0/0). The API can't produce this, since every side has at least one fighter, so every battle lasts at least one round. Fine as is.
- `results.js:52`: mean rounds are shown rounded to 2 decimals. The ticket doesn't specify this, and the old view did the same. The acceptance UI spec should compare mean with the same rounding.
- `docs/combat-simulator.md` Outcome reporting still has the "Current code" paragraph describing the single-battle response. The ticket makes editing docs out of scope; this needs a follow-up from the doc owner.
- `/api/models/army` gives 500 under `next dev` ("resolver is not a function") during the acceptance run. This predates the branch (seen in the SGS-004 review) and is unrelated.

## Coverage

Files reviewed: `lib/combat-simulator/simulate.ts`, `lib/combat-simulator/simulate.test.ts`, `lib/combat-simulator/battle.ts`, `pages/api/fight.ts`, `pages/apps/combat-simulator.js` and `components/apps/combat-simulator/results.js` (all in full). For comparison: `army.ts`, `army.js`, `battle.test.ts`, and the old `results.js`.
Not reviewed: no manual browser click-through (covered by the passing UI acceptance specs). The new acceptance specs don't exist yet. There is no design file under `design/` for M1.
