# SGS-005 implementer report

- Ticket: SGS-005, run N independent battles and report outcome frequencies
- Branch: `sgs-005-n-battle-outcome-frequencies` (base origin/main cc47156)
- Tip: 6525ab0b833f8bf29d1f522e4342c7ebe75800e1 (author choinickolas@gmail.com)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-005-n-battle-outcome-frequencies
- Status: needs_review

## Files touched
- `lib/combat-simulator/simulate.ts` (new): `OutcomeAccumulator(kinds = OUTCOME_KINDS)` with `record(BattleRecord)` / `summary()`; `simulateBattles(attack, defend, battles, roll = rollDice, options: BattleOptions = {})`; constants `DEFAULT_BATTLES` 1000, `MAX_BATTLES` 100000, `MAX_HITS_PER_ROUND` 5.
- `lib/combat-simulator/simulate.test.ts` (new): 24 Vitest cases.
- `lib/combat-simulator/battle.ts`: removed both `console.log`s (per-round and final); `rollDice` and `calculateCombatRollResults` use `push` instead of `concat`. Dice, threshold, reroll and casualty semantics are unchanged.
- `pages/api/fight.ts`: `validateBattles` reuses `parseCount` and runs after every existing check. The handler calls `simulateBattles(form.attack, form.defend, battles)` with no options. The `FormParseResult` / `parseFightForm` code is no longer used, so I removed it. `getStats`, `BattleStats` and `getSurvivor` stay in battle.ts as the manager note asked.
- `pages/apps/combat-simulator.js`: number input `name="battles"` (default 1000, min 1, max 100000, step 1, not required). On submit the page keeps a snapshot of the posted FormData and passes `{ submitted, summary }` to Results.
- `components/apps/combat-simulator/results.js`: rewritten. It has the headings "Army Results" (from the snapshot, plus a "Battles: N" line from the response), "Fighting Stats" (rows from `Object.entries(outcomes)` with labels Attacker wins / Defender wins / Tie, or the raw key otherwise, then a rounds table), "Surviving Units" (one table per side, with a "no wins" row when a side never won) and "Hits per Round" (rows 0-5). Percent is `(100*frequency).toFixed(1)%`. Mean rounds are rounded to 2 decimals for display.

## Design notes
- The accumulator checks the whole record before changing any state. It throws on an unknown kind, on an `attacker`/`defender` win with no `winner`, on a hit count outside 0-5, and when a hit array's length differs from `rounds`. A rejected record leaves no partial tally. `summary()` with zero battles throws.
- Survivor `frequency` uses the sum of that side's survivor tallies as its denominator. By construction this equals `outcomes.<side>.count`, and it works even if a custom kind list leaves out a side.
- Rounds are stored as O(N) integers and sorted with `Int32Array.sort()`. Nearest-rank uses `Math.ceil((p * n) / 100)`.
- `simulateBattles` throws `RangeError` outside 1..MAX_BATTLES (S3 enforced where the simulation runs). The handler validates first, so this never reaches a client.

## Tests
- `npm test`: 4 files, 57 passed, 0 failed (24 new in simulate.test.ts).
- Invariants the tests encode:
  - The outcomes keys exactly match OUTCOME_KINDS, in order, with a count of 0 for kinds that never occurred. Counts sum to N and frequencies sum to 1.
  - An extended kind list `[...OUTCOME_KINDS, 'extra']` adds an `extra` entry with correct counts, and an unknown kind throws.
  - Nearest-rank cases: 1..10 shuffled gives 5/1/9 with mean 5.5; N=1 gives the same value for all three; 1..30 gives p10 3, median 15, p90 27. A version using `0.1*N` returns p10 4 and fails.
  - Survivor tallies follow the pinned sort order, sum to the win count, and have frequencies summing to 1. A side with no wins gives `[]`, and ties add nothing.
  - Pooled hit shares are exact. A hit count of 6 throws without recording anything.
  - W2: with a stateless roller (one hit per combat roll), N=2 equals N=1 doubled and matches a direct `Battle` on fresh `BaseArmy` objects. A version that reused armies would make the second battle a 0-round win and fail.
  - Classification via `battleOutcome`: cycling rollers produce an attacker win, a defender win and a tie, each counted under its own key.
  - Input counts are not mutated, and out-of-range `battles` throws.
- Options pass-through is checked by reading the diff, as the ticket specifies: `simulateBattles` passes `options` unchanged to every `Battle` call.

## Gates
- codegen: not set.
- lint (`npx tsc --noEmit`): clean.
- build (`npm ci && npx next build`): compiled successfully.
- unit: 57/57.
- `grep console. lib/ pages/api/`: no matches.
- Manual curl under `next start`:
  - Default request returns 200 with `battles` 1000 and counts summing to 1000.
  - `1e3` (JSON number) and `"1"` return 200.
  - Each of 0, -1, 100001, 1.5, "1.5", "abc", "", "1e3", " 5", "+5", null and true returns 400 with `battles must be a whole number between 1 and 100000`.
  - Invalid army field together with `battles: 0` returns 400 naming `attack-regs`. PUT returns 405.
- Manual curl under `next dev`: the 1000-battle request logged nothing per round or per battle.
- Timing at N=100,000, after one warm-up request:

  | Matchup | next start, before push fix | next dev, before push fix | next start, final | next dev, final |
  |---|---|---|---|---|
  | 0/10/0 vs 0/10/0 | 4.6 s | 14.0 s | 0.44 s | 0.44 s |
  | 0/10/5 vs 0/10/5 | 4.5 s | 14.0 s | 0.40 s | 0.40 s |

  Default N=1000 takes 0.02 s under next start and 0.08 s under next dev. Because next dev went over budget before the fix, I applied the concat-to-push rewrite the ticket allows.
- Acceptance (`npm run acceptance`): 81 passed, 21 failed. Every failure is an existing API spec that asserts the old single-battle shape:
  - `fight-api.spec.ts`: checks `survivor` / `rounds`.
  - `fight-api-validation.spec.ts`: 11 "valid fights" and range-boundary cases checking BattleStats keys and averages.
  - `fight-api-caps.spec.ts`: 9 cases reading `attack`/`defend`, averages and `survivor`.

  The UI specs (`combat-simulator*.spec.ts`) pass. The implementer role does not author acceptance-harness specs, so section 6's spec updates and the new HTTP/UI specs are left to the acceptance gate. The caps-spec rewrites need care, because the response no longer carries armies and their intents (no negative counts, 5-hit cap, fresh armies) must be restated as checks on `survivors` and `hitsPerRound`.
- Not done: loading the page in a browser by hand. The passing UI acceptance specs cover the submit and render path. I loaded the page under dev and start (HTTP 200).

## Invariant check
- W1 upheld: only the logging and the concat-to-push change touch battle.ts. Faces, the `> 5` threshold, reroll counts, casualty order and round order are unchanged, and the 23 existing battle tests pass unchanged.
- W2 upheld: every iteration builds fresh `BaseArmy` objects from the validated counts and nothing carries over between battles. A unit test encodes this.
- S3 upheld: `battles` is capped at 100000 in the handler and again in `simulateBattles`. The worst cases finish in under 0.5 s.
- S1 / S2 are untouched. No `docs/` or `golang/` changes.

## Out-of-scope findings
- `docs/combat-simulator.md` "Outcome reporting" still has a "Current code" paragraph describing the single-battle response, which is now stale. Editing docs is out of scope here; it is a follow-up for the doc owner.
- CONTEXT.md Key surfaces needs the section 7 lines (manager edit).
- The `battle.test.ts` `console.log` spy is now unnecessary but harmless; I left it.

## Status
needs_review.
