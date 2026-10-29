# SGS-005 spec-readiness gate, pass 2

Verdict: READY

Checked: ticket (re-spec 1), prior gate `reports/SGS-005-spec-gate.md`, `reports/SGS-005-respec.md`, SGS-001/003/004/006/007 tickets, CONTEXT.md, INVARIANTS.md, spec-checklist.md, REPO.md, LESSONS.md files (all empty), and code at origin/main d54af2e (`pages/api/fight.ts`, `pages/api/models/army.ts`, `pages/apps/combat-simulator.js`, `components/apps/combat-simulator/{army,results}.js`). Nothing was run.

## Prior gaps

| # | Prior gap | Status |
|---|-----------|--------|
| 1 | Statistic shape delegated to a doc that names no fields | Closed. Section 1 pins every key, type, nearest-rank formula (integer p, `Math.ceil(p*N/100)`), survivor element encoding and sort order, fixed 6-slot hit arrays. Matches SGS-001 section 9 (nearest-rank, whole rounds, survivors per winning side, ties none, hits pooled over all rounds) and CONTEXT.md "WOTR outcomes". |
| 2 | "No other statistics" excluded hits per round | Closed. Last General criterion now says exactly the CONTEXT.md/doc statistics, hits per round included. |
| 3 | Response armies vs page form values contradiction | Closed. Response carries no armies (matches CONTEXT.md Decision); page snapshots FormData; criterion checks no `attack`/`defend` keys; W2 covered by unit independence test plus 5v5 HTTP test. |
| 4 | Key surfaces not addressed | Closed. Section 7 gives the exact lines for the manager to copy after merge; the ticket does not edit CONTEXT.md. |
| 5 | Time budget stale / no pass-fail | Closed. Two named worst-case matchups, N = 100,000, 10 000 ms request timeout in a harness spec, stop-and-report if exceeded, cap not lowered. Owner decision recorded. |
| 6 | Misattributions to SGS-004 | Closed. Validation, 405, `{ error }`, caps credited to SGS-003; SGS-004 for the lib seam and 5-hit cap. |
| 7 | `battles` parsing | Closed. SGS-003 rule reused, 1..100,000, absent = 1000, `""`, `"1e3"`, `null`, `true`, `" 5"`, `"+5"` etc. listed as 400, ordering after SGS-003's checks, 405 and army-field precedence criterion. |
| 8 | No harness dependency / no test plan | Closed. Depends on SGS-002 and SGS-007; unit, HTTP and UI criteria; existing single-battle specs updated, not deleted. |

## Consistency with SGS-004's seam

- `Battle(attack, defend, roll = rollDice)` in `lib/combat-simulator/battle.ts`, `BaseArmy` in `lib/combat-simulator/army.ts`: the ticket's "same injectable dice source SGS-004's battle function takes" and "fresh `BaseArmy` per iteration" fit. `BattleResult` keeps `attackArmy`/`defendArmy` (post-battle survivor counts), `attackHitsPerRound`/`defendHitsPerRound` and `rounds`, which is everything the accumulator needs.
- SGS-004 leaves both `console.log` calls and the `getStats()`/`BattleStats` code in place and says SGS-005 removes the logs and changes the response shape; SGS-005 does both. Its "drop `BattleStats`/`getStats()` if nothing else uses them" is guarded by the condition, so SGS-004 tests that only read `attackHitsPerRound` are unaffected.
- SGS-004's 5-hit cap makes the hit-count-6 throw unreachable in production; consistent.
- SGS-004 and SGS-005 both edit `battle.ts` and `fight.ts`; the dependency chain serializes them. SGS-004's "acceptance passes with no spec files changed" and SGS-005's spec rewrite are sequential, not conflicting.
- SGS-006 copies the section 1 names and `battles` 1..100000 default 1000; matches.

## Owner-confirm item 7 (survivor frequency denominator)

Does not block. The default (that side's wins) is stated, `count` is in every element so either share is derivable, SGS-001 describes the statistic as counts only, and CONTEXT.md does not fix a denominator. If the owner flips it, the rework is one divisor in the accumulator, the sums-to-1 assertions, and the UI column label. Recommend the manager keep the default and not wait.

## Other checks

- Grounded scope: all named existing symbols (`Results` import, `BattleStats`, `getStats`, both `console.log`, `#fight-form`, "Army Results", "Fighting Stats" headings, `role="alert"` from SGS-003) exist on main or in SGS-003/004 as stated. New files are marked new.
- Invariants: W1, W2, S3 named; criteria satisfy them (fresh armies per iteration, cap checked before the loop).
- Size: ~265 business LOC, under 400. Diagram present. Lessons: none to apply. Risk `high` is correct (public API shape, W2/S3, control loop, over 150 LOC); no `criticalPaths`.

## Notes (non-blocking)

1. Loop independence criterion: "same per-battle results as running each battle alone" is under-specified for a stateful dice source, and the section 1 object does not expose per-battle results. Suggest the test use a stateless roller (constant faces, for example all 6s, so 5/0/0 vs 5/0/0 ties in round 1) and compare the N = 2 summary with the N = 1 summary doubled; a reused army would show a 0-round second battle (`rounds.p10` 0 or mismatched counts). Alternatively let the loop accept a per-battle callback or a roller factory.
2. "No per-round or per-battle server log output (checked on the dev server output)": no mechanism is named, and the harness may not pipe `webServer` stdout. Suggest adding a grep criterion (no `console.` in `lib/combat-simulator/` or `pages/api/fight.ts`) and keeping the dev-output check as a manual PR note.
3. UI criterion "renders ... with the response's numbers" relies on section 5's one-decimal percent rule; say the spec compares the displayed text to `(100 * frequency).toFixed(1)` so it is checkable.
4. Name the exported roller type (SGS-004 leaves it unnamed) once SGS-004 merges, or say "the roller type SGS-004 exports".
5. The handler "calls the function with validated counts": `parseFightForm` returns `BaseArmy` objects (SGS-004/003 shape). Read the counts from those before the loop; the loop builds its own fresh armies and never touches them.
6. Playwright's default per-test timeout is 30 s; the time-budget spec sends two 100,000-battle requests after a warm-up, so set `test.setTimeout` explicitly if they share a test.
7. Native number-input validation (min/max/step) blocks submitting `0` or `100001` in the browser; only the emptied field reaches the server, which is what the UI criterion tests. The HTTP criteria cover the rest.
