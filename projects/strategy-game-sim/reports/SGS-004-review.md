# SGS-004 review (pass 1, full)

- Verdict: **APPROVE**
- Branch: sgs-004-wotr-combat-caps, tip c53942c (11a5e74 move, 8e7d690 restructure, c53942c caps). Base origin/main 006c553.
- Review worktree: `worktrees/review-sgs-004-wotr-combat-caps` (detached at c53942c; branch is not pushed, so created from the local ref). Removed when done.

## Blocking findings

None.

## Spec gaps

None.

## Implementer departures (judged)

1. **Dropped `Army` import, not `Results`.** Confirmed on 006c553: `pages/api/fight.ts` imports only `NextApiRequest/NextApiResponse` and `{ Army, BaseArmy } from './models/army'`. It has no `Results` import, and `Army` was the unused name. The ticket's intent was "drop the unused import", and the implementer did that. Accepted.
2. **`BattleOptions` landed in commit 2, not commit 1.** The ticket's Commit order lists `BattleOptions` under commit 2. The spec-gate-3 note only says commit 1 *may* carry the parameter-list change. Commit 1 carries `(attack, defend, roll = rollDice)`, and commit 2 adds `options`. This matches the ticket. Accepted.

## Acceptance criteria

All 23 pass and are ticked in the ticket.

| Criterion | Result | Evidence |
|---|---|---|
| 10v10 first two calls get 5 | pass | battle.test.ts "rolls at most 5 combat dice per side"; fails on commit 2 code (mutation check below) |
| 3+2 gets 5, 3 gets 3 | pass | battle.test.ts "rolls 5 dice for a 5-unit army..." |
| Leader reroll (5,5)->5, (5,2)->2, (3,5)->3, (0,5)->0 | pass | battle.test.ts `it.each`, asserts `calls[2]` |
| MAX_LEADER_REROLLS review-only | pass | battle.ts:138,141 both leader `Math.min` calls include `MAX_LEADER_REROLLS`; constant at battle.ts:85 |
| All-6s whole battle: round 1 = 5, all entries <= 5 | pass | test drives `Battle` with 8 scripted calls (2 rounds, tie) |
| Combat 1s + leader 6s: 5 per side from rerolls | pass | asserts calls [5,5,5,5] and hits [5]/[5] |
| resolveRound exactly one round | pass | calls [3,2,0,0], rounds 1, hits [2]/[1], armies 2/0 and 0/0; scripted roller throws on a 5th call |
| Simultaneous casualties | pass | 1v1 [6],[6] -> both 0/0, 1 hit each |
| shouldStop table | pass | 4 cases |
| battleOutcome values, throws when both alive, members of OUTCOME_KINDS | pass | |
| Battle loop: 2 rounds / 8 calls / "attack"; tie "n/a"; "defend" | pass | |
| Battle with no roller / no options compiles and runs; BattleOptions exported, no fields | pass | tsc clean; battle.ts:162 `export type BattleOptions = {}`; test with Math.random mocked |
| 0/7 trace 1/6, 0/6, 1/5, 0/5, 1/4 | pass | army.test.ts |
| 6/0->5/0, 0/3->1/2, 2/0->1/0 | pass | army.test.ts |
| Exhaustive 1-10 units never negative, ends 0/0, leaders unchanged | pass | army.test.ts, loop bounded by 2*units |
| Docs: Extension points names the three seams; two Current code notes gone; no other change | pass | `git diff 8e7d690 c53942c -- docs/` shows only the two removed notes and the new `### Extension points` at the end of "Departures from the published game" (before `## Not modeled`). Rule text unchanged. The remaining Current code notes (input bounds, N, independence, outcome reporting) are still accurate. |
| lib imports nothing from next/react/pages/components | pass | grep: only `./army` (battle.ts) and nothing (army.ts) |
| `npm run acceptance` passes, no spec changes, on final commit and commit 2 | pass | ran it myself: 91/91 on c53942c and 91/91 on 8e7d690; `git diff 006c553 c53942c -- acceptance/` is empty |
| GET /api/models/army same status base vs branch | pass | **base 006c553: 500; branch c53942c: 500** (both under `next dev`, "resolver is not a function": no default export on either) |
| Fight! 10/0/5 vs 0/10/5 renders "Army Results" | pass | `acceptance/combat-simulator-validation.spec.ts:77` clicks exactly this case in Chromium and asserts the `Army Results` heading; it passed in my run |
| npm test, tsc, next build pass | pass | 33/33; tsc exit 0; `next build` succeeded |
| Commit 1 pure move; commit 2 no behavior change | pass | diffed the moved blocks: army.ts identical to the old file; battle.ts is the old bodies plus `export` keywords, `DiceRoller`, `rollDice` -> `roll`, and the `Battle(attack, defend, roll = rollDice)` signature. Commit 2 moves the while body into `resolveRound` verbatim (`battleResult` -> `battle`), the loop condition is the De Morgan equivalent, and `getSurvivor` maps through the record. |
| No invariant regressions | pass | see below |

Mutation check: with commit 2's `army.ts`/`battle.ts` and the final tests, 5 tests fail (7-elite trace, exhaustive no-negative, 5-dice cap, both hits-per-round). With the final code they pass. The tests can fail for real reasons.

## Invariants

- **W1 holds.** battle.ts:131,134 use `min(getCombatStrength(), MAX_COMBAT_DICE)`, which matches Round order step 1. battle.ts:138,141 use `min(misses, leaders, MAX_LEADER_REROLLS)`, which matches step 3. army.ts `takeHit` `> 5` branch: with 0 regulars, `elites--; regulars++`, which matches the Casualties section. The hit threshold (`opts.threshold || 5`, `> threshold`) is unchanged. The call order (attack combat, defend combat, attack leader, defend leader, simultaneous takeHits, recordRound) is unchanged.
- **W2 holds.** The handler builds fresh `BaseArmy` objects per request in `parseFightForm` and passes them to `Battle`. No module-level mutable state was added: `SURVIVOR_LABELS` and `OUTCOME_KINDS` are read-only constants.
- **S3 holds.** Inputs are still capped by the validation from the earlier input-bounds change. The loop still ends only on elimination. Each hit either removes a unit or turns an elite into a regular, so every hit makes progress toward elimination.
- **S1 holds.** lib/combat-simulator imports only within itself.

## Behavior check (dice/casualty logic, real HTTP)

200 fights per scenario against `next dev`, base vs branch:

| Scenario | build | max avg hits/round | sides with negative counts | outcomes (attack/defend/n/a) | mean rounds |
|---|---|---|---|---|---|
| 10r/5L vs 10r/5L | base | 5.00 | 0 | 102/93/5 | 5.12 |
| 10r/5L vs 10r/5L | branch | 3.67 | 0 | 104/92/4 | 6.53 |
| 0r10e/5L vs 10r/5L | base | 5.00 | **129** | 194/6/0 | 5.80 |
| 0r10e/5L vs 10r/5L | branch | 3.33 | 0 | 199/1/0 | 7.03 |

Outcomes moved the way the ticket says. Hits per round drop and battles get longer under the 5-die cap. Negative regulars are gone. Boundary requests are unchanged: 11 regulars returns 400 "attack-regs must be between 0 and 10", and GET returns 405.

## Contract and checklist

- Key surfaces: `POST /api/fight` field names and the `BattleStats` response are unchanged.
- Out of scope: no termination rule beyond elimination, no `BattleOptions` fields, no extra outcome kind, no change to `getStats`, the survivor values, the response shape, or the console.logs, no openapi or golang edits. Nothing out of scope was added.
- No invented constants. `MAX_COMBAT_DICE` and `MAX_LEADER_REROLLS` (both 5) come from the doc.
- Naming: `resolveRound`, `shouldStop`, `BattleOptions`, `OUTCOME_KINDS` match the ticket. There are no dead enum values: `tie` is reachable.
- Hygiene: no ticket ids, factory pointers, or PR numbers in code, docs, or commit messages. All three commits are authored by choinickolas@gmail.com.
- REPO.md review checklist:
  - Every diff: build run, and pages exercised through dev and Playwright.
  - Combat simulator: no field changes on the round trip, `/api/fight` exercised with curl, fights run in bulk.
  - Shared code: not touched.
  - golang: not touched.

## Lint

`npx tsc --noEmit`: clean. There is no ESLint config (REPO.md).

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md. No bot ran and there are no findings to reconcile.

## Conventions

- Production files follow the moved code's style: 2-space indent, semicolons, `let`. army.ts keeps the original's missing trailing newline (same as `pages/api/models/army.ts` on base).
- Test files match the nearest sibling `utils/utils.test.ts:1-10`: 4-space indent, no semicolons, `describe`/`it` from vitest, small arrow helpers at the top. `it.each` tables are new in the repo but idiomatic Vitest.
- The comment on the MAX_* constants (battle.ts:83) records a rejected alternative, merging them with takeHit's `> 5`. The comment bar allows that. The `BattleOptions` comment is the one the ticket asks for.

## Non-blocking notes

- battle.ts:162 `export type BattleOptions = {}`: in TypeScript `{}` accepts any non-nullish value, so `Battle(a, d, roll, 5)` type-checks. The ticket pins this exact form. A later ticket that adds the first field will tighten it naturally. No action.
- battle.ts:164 `shouldStop` takes `options` and never reads it. This is intended by the ticket. `noUnusedParameters` is off, so tsc does not flag it.
- `components/apps/combat-simulator/results.js:6` JSDoc says props "should map to pages/api/fight.ts result". That comment is outside the diff, but the result type now lives in `lib/combat-simulator/battle.ts`. It is a small stale pointer that SGS-005, which replaces the response, could fix.
- docs/combat-simulator.md will conflict textually with SGS-009 (PR 18), as expected. The two branches edit different sections, so this is not a finding.

## Coverage

- Reviewed in full:
  - lib/combat-simulator/army.ts, battle.ts, army.test.ts, battle.test.ts
  - pages/api/fight.ts, pages/api/models/army.ts
  - ARCHITECTURE.md, docs/combat-simulator.md
  - each commit's diff on its own
- Ran:
  - npm ci, tsc, npm test, next build
  - a mutation run of the tests against commit 2 code
  - npm run acceptance on c53942c and 8e7d690
  - next dev on both base and branch for the /api/models/army status and 400 bulk fights
- I did not hand-click in a browser. The Playwright spec covers the exact 10/0/5 vs 0/10/5 click and render.
