# Tech-lead gate re-run: batch 2 (SGS-005), PR #20 body refresh

Decision: no blockers. Existing draft PR #20 body updated in place. Nothing was pushed, and the PR is still a draft.

- PR #20 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/20, base `main`, head `sgs-005-n-battle-outcome-frequencies` at da88cc1. Merge risk: **medium**.
- The body was edited with `gh api -X PATCH .../pulls/20 -F body=@file`. Added `## Merge risk` and `## Review focus`. Summary (with timings), Reviewer guide, Invariants and scope (with the docs follow-up), and the attribution footer are unchanged.

## Reviewed
- Range cc47156..da88cc1 (merge-base with origin/main is still cc47156). origin/main has moved to 7d86b0e, a docs-only change. `git merge-tree` against origin/main is clean.
- 11 files, +1038/-154. Business logic is +359/-84 (recomputed): simulate.ts, battle.ts, fight.ts, results.js, combat-simulator.js. I read all of it in full. I read the tests where they pin W2 and S3.
- Single task, so the stack check is trivially fine.

## Flag-list re-check
- W1: battle.ts changes only `concat` to `push` and removes `console.log`. Rules are unchanged.
- W2: fresh `BaseArmy` per iteration (simulate.ts:187-188). This is pinned by the unit test "starts every battle from the input counts" and by "does not mutate the input counts".
- S3: `battles` is capped at 1..100,000 in fight.ts `validateBattles` and again in `simulateBattles` (RangeError). Pinned by unit tests and by the acceptance boundary specs (100000 ok, 100001 rejected) and the 10 s timing spec.
- Contract: the `/api/fight` response shape breaks. The milestone names results.js as the only consumer, and it is updated in the same diff. This is expected and not a blocker.
- Irreversibility, concurrency, security, open questions: none. AoE4 questions are untouched.

## Merge risk
medium. The diff touches a public surface (API response shape) but a revert fully undoes it, there is no persisted state, and the tests pin the new behavior. I did not rate it high because the only consumer moves atomically with the API in one Vercel deployment.

Review focus (one entry): fight.ts:115. Stale browser tabs running the old `Results` crash on render against the new response until reloaded, and any external direct caller breaks.

## Non-blocking notes
- REPO.md says a route change updates `docs/api/openapi.json` in the same diff. That file does not exist on main, and the PR states "No OpenAPI spec yet" as a non-goal. Track it as a follow-up.
- The "Current code" paragraph in docs/combat-simulator.md is still stale (already noted in the body).
- The synchronous 100k loop blocks for about 0.4 s per request. This is acceptable under the cap.
