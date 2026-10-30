# Tech-lead gate: batch 2 (SGS-005)

Decision: no blockers. Draft PR opened.

- PR #20 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/20, base `main`, head `sgs-005-n-battle-outcome-frequencies` at da88cc126db9014a03dd967e7e5a7f1071316e56 (pushed, no new commits).
- Stacking: single PR, so `gh stack link` was not applicable (it needs at least 2 PRs; the call returned "requires at least 2 arg(s)"). No footer.

## Reviewed
- Range cc47156..da88cc1 (3 commits, all authored and committed by choinickolas@gmail.com).
- 11 files, +1038/-154. Business logic: +359/-84 in simulate.ts (new), fight.ts, results.js, combat-simulator.js, battle.ts. Unit tests and acceptance specs were read at stat level only.
- Stack check: one task, diff against main contains only this task.

## Flag-list checks
- W1: battle.ts changes only `concat` to `push` and removes console.log. Dice, threshold, reroll and casualty logic are unchanged.
- W2: simulateBattles builds fresh BaseArmy instances for each iteration and classifies each battle with battleOutcome.
- S3: `battles` is capped at 1..100,000 in the handler, and simulateBattles also enforces it with a RangeError. The worst case took 0.44 s.
- Contract: the /api/fight response shape breaks. results.js is its only consumer (milestone Safety and contracts) and is updated in the same diff. getStats/BattleStats are retained.
- Irreversibility, security, open questions: none.

## Non-blocking notes
- The 100k loop runs synchronously and blocks the event loop for about 0.4 s per request. This is acceptable under the cap on serverless.
- OutcomeAccumulator stores rounds as number[] and converts to Int32Array only to sort. This is O(N) and fine.
- Follow-ups for the human: the "Current code" paragraph in docs/combat-simulator.md still describes the single-battle response; on merge the manager updates CONTEXT.md Key surfaces (ticket section 7); after merge, check the Vercel preview time at N=100,000.
- `git push -u` pushed the branch but did not write upstream tracking config, most likely because of the sandbox. This is harmless.
