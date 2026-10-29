# SGS-004 acceptance report

Saved by the manager from the acceptance-test agent's hand-back. The agent could not write outside its worktree.

**Verdict: PASS.** No failures, no impl-defects, no spec-gaps.

## Tip and run

- Tested c53942c. New spec committed as 4e7dd0b on scratch branch `sgs-004-acc`, then cherry-picked onto `sgs-004-wotr-combat-caps` as 76a266e (adds only `acceptance/fight-api-caps.spec.ts`).
- `npm ci`, `npm run acceptance:setup`, `npm run acceptance` against `next dev`: 102 passed (91 existing + 11 new).
- `npx tsc --noEmit` clean; `npm test` 33/33.

## Tests written (`acceptance/fight-api-caps.spec.ts`)

1. Elite-only 7 vs 10 regulars: returned regulars/elites never negative over 100 fights (elite-downgrade rule).
2. Elite-only 10 vs elite-only 10: same check, 100 fights.
3. Elite-only 10 vs 1 regular: same check, 100 fights.
4. Leaders in the response equal the request (5 and 3), 50 fights.
5. 10/0/5 vs 10/0/5: average hits per round at most 5, and average x rounds is a whole number, 100 fights.
6. 10/0/5 vs a lone regular, 400 fights: every one-round fight records at most 5 attacker hits (HTTP-visible 5-hit cap; probabilistic).
7. 0/10/5 vs 10/0/5: exactly one side standing, rounds >= 1, survivor matches.
8. 1v1: survivor is "n/a" exactly when both armies are wiped out.
9. Repeated fights start from fresh armies (W2).
10. UI: Fight! with 10/0/5 vs 0/10/5 renders "Army Results" and a table.
11. `GET /api/models/army` returns 500, same as base 006c553.

## Fault injection

Temporarily reverted the dice cap and the `takeHit` downgrade: tests 1-3, 5 and 6 failed. Both files restored and clean afterward.

## Caveats

- Test 6 cannot fail on a correct cap; without the cap it caught the defect in the one run tried.
- A missing reroll cap is not detectable over HTTP (the dice cap already limits misses to 5); the ticket marks it review-only.
- Exact dice counts per roller call, leader-reroll counts, scripted hit counts, `resolveRound` simultaneity and the `battleOutcome` throw are covered by the Vitest unit tests. Docs, import-boundary grep and `next build` are review items.

Scratch worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/worktrees/agent-a626a05ae8b167f1c` (branch `sgs-004-acc`).
