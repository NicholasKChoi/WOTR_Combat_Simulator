# Tech-lead report: batch SGS-158-SGS-158 (tech-lead-1)

**Decision: PASS - draft PR opened.** No blockers, no untested hotspots.

## Opened PRs (bottom to top)

- SGS-158: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/167, base `main`, head `sgs-158-dice-hit-5-or-6` at `dea14a6491585f03febfe752f53ebf2cded02c82` (draft). Branch pushed with a plain push (new branch on origin), no new commits.

### Merge risk
**medium** - changes `calculateCombatRollResults`, the combat hit rule every simulated battle goes through; response shape is unchanged and a revert fully undoes it.

### Review focus
- [`lib/combat-simulator/battle.ts:114`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/167/files#diff-52e5fe7628335f491e7d6fb7b1485b7fe1d850238cef013055f7184cf0529112R114-R114) - a strict `>` here silently halves every hit rate again, and the leader re-roll count would re-roll 5s - check the comparison is `>=` against a hit face of 5 for all four roll paths in `resolveRound` - pinned by [`lib/combat-simulator/battle.test.ts`: a combat die showing $face scores $hits (hits)](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/167/files#diff-a19503a3f9a310f63d9fa8630ac3998d87e01f8821219c952ec075289df8302eR66-R77), [counts a rolled 5 as a hit, not a miss to reroll](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/167/files#diff-a19503a3f9a310f63d9fa8630ac3998d87e01f8821219c952ec075289df8302eR92-R95) and [a rerolled die showing $face scores $hits (hits)](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/167/files#diff-a19503a3f9a310f63d9fa8630ac3998d87e01f8821219c952ec075289df8302eR97-R106)

Merge risk reasoning: `calculateCombatRollResults` is a `criticalPaths` symbol (medium). Not high: the `/api/fight` response shape and OpenAPI are unchanged (only the estimated values move, which is the bug fix), no migration or persisted data, no concurrency, no security surface. The ticket's `high` risk tier was not used to set the rating.

Hotspot pinning verified by reading assertions: the combat-face table (faces 1-6, asserts attack/defend hits per round), the rolled-5 re-roll count test (asserts re-roll call sizes `[3, 4]`), and the re-roll face table (faces 4/5/6 through `resolveRound`, asserts call sizes and hits). The implementer's mutation runs (`>` for `>=`, 6-only re-rolls, 5s added to misses, `MIN_HIT_FACE = 4`) each failed one of these.

No Preview checks section: the ticket lists `Unverified assumptions: none` and the implementer added none.

## What I reviewed

- Commit range: `e50e074..dea14a6` (3 commits: a412a69 fix, ba9dee1 acceptance spec, dea14a6 constant grouping and test titles). Merge base with `origin/main` (35dd0ab) is e50e074; the one intervening main commit touches only `acceptance/aoe4-results-split.spec.ts`, no overlap.
- Files: `lib/combat-simulator/battle.ts` (+2/-3), `docs/combat-simulator.md` (+4/-4), `lib/combat-simulator/battle.test.ts` (+29), `acceptance/fight-api-hit-rule.spec.ts` (+67). Total +102/-7.
- Stack check: single branch; its diff against `main` contains only this task.
- Invariants: W1 holds (code and doc change together; doc list and flowchart both say 5 or 6; no remaining 6-only sentence). W2 holds (`resolveRound`/`Battle`/`simulateBattles` unchanged in shape). S3 holds: the acceptance spec posts 100000 battles, equal to `MAX_BATTLES` (100000), not above it.
- Removed `threshold` from `CombatRollOps`: the interface is not exported and no caller passed it (grep: only the four `resolveRound` calls), so no consumer break.
- Checked the acceptance spec's expected values: lone die tie 1/5, mean rounds 1.8; leader case attacker 10/19, defender 4/19, tie 5/19 (per-round end probabilities 10/27, 4/27, 5/27 over 19/27). Correct.
- Gate reports read: implementer-2, suite-1 (PASS, 2562 passed), acceptance-test-1 (PASS), review-1 (APPROVE).

## Non-blocking notes

- The acceptance spec runs two 100000-battle requests with a 20 s budget each; it adds acceptance runtime but stays within the battle cap.
- Implementer report 2 records tip a412a69; the branch tip is now dea14a6 after the acceptance and simplify commits. Record dea14a6 in the graph.

## Out-of-scope findings

None.
