# SGS-158 implementer report 2

- Ticket: SGS-158 (Bug, risk high, standalone)
- Branch: `sgs-158-dice-hit-5-or-6`
- Tip SHA: `a412a69f93509dda033f14ee4e6c92d22dfb5b60` (one commit on `origin/main` e50e074, authored as choinickolas@gmail.com)
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-158-dice-hit-5-or-6`

## Files touched

- `lib/combat-simulator/battle.ts`: adds the module constant `MIN_HIT_FACE = 5` (not exported). `calculateCombatRollResults` now tests `thisDice >= MIN_HIT_FACE`. The unused `threshold` option and its `||` default are removed from `CombatRollOps`, which the ticket allows.
- `lib/combat-simulator/battle.test.ts`: adds 3 tests (10 cases), covering the combat-die faces 1-6, the re-roll faces 4/5/6, and the re-roll count when the combat roll shows 5s.
- `docs/combat-simulator.md`: changes Round order steps 2 and 3 and the two flowchart nodes `hit` and `reroll` to "5 or 6".

I grepped for the rule wording before editing (`6 only`, `a 6`, `each 6`, `on a 6`, and dice/face/roll near `6` in `lib/combat-simulator`, `components/apps/combat-simulator`, `pages/api/fight.ts`, `docs/api/openapi.json`, `acceptance/`). The only hits outside the doc were scripted rolls that use 6 as a hit and 1 as a miss. Those rolls stay valid under the new rule, so no other file pinned the 6-only rule.

## Tests

- `npx vitest run lib/combat-simulator/battle.test.ts`: 33 passed, 0 failed.
- `npm test` (full suite): 83 files passed and 1 skipped; 2562 tests passed, 15 skipped, 0 failed.

Invariants the new tests encode:
- `combat dice > scores $hits hits for a combat die showing $face` (faces 1-6). Faces 1-4 score 0 hits and faces 5 and 6 score 1, for both the attacker and the defender combat rolls.
- `leader rerolls > scores $hits hits for a rerolled die showing $face` (faces 4, 5, 6). Each side has 1 regular and 1 leader, both combat dice show 1, and the re-roll faces are scripted through `resolveRound`. A re-rolled 4 scores 0 hits and a 5 or a 6 scores 1, on both sides.
- `leader rerolls > counts a rolled 5 as a hit, not a miss to reroll`. Each side has 5 regulars and 5 leaders, with combat faces `[5,5,1,1,1]` and `[5,1,1,1,1]`. The re-roll calls ask for `[3, 4]` dice, so the 5s are not re-rolled.

## Pre-existing tests edited

None. The existing tests use only the faces 1 (miss) and 6 (hit), so they still pass unchanged. The `rollDice` test keeps its assertions (`[1, 6, 4]`), and `rollDice` is untouched.

## Doc claims (`docs/combat-simulator.md`)

- "2. **Hits.** A die hits on a 5 or a 6; a 1 to 4 misses." This holds because `battle.ts:calculateCombatRollResults` counts `thisDice >= MIN_HIT_FACE` (5) as a hit and everything else as a miss, and `rollDice` yields faces 1-6.
- "A re-rolled die hits on a 5 or a 6." `resolveRound` passes both leader re-rolls through the same `calculateCombatRollResults`.
- Flowchart `hit["Each 5 or 6 is a hit; every other result is a miss"]` and `reroll["... missed dice; each 5 or 6 is a hit"]` rest on the same code as the two items above.
- I reread the rest of the doc. "At most 5 hits per round", the casualty rules, and the other sections do not depend on the hit face. No sentence still says only a 6 hits.

## Pinned outputs

None. The ticket asks for no engine-returned value to be pinned.

## Bug regression (base run)

- Base: `origin/main` e50e0749ac1b59657daf9d5283a5e67935d90e25, in scratch checkout `regress-SGS-158` (removed afterwards).
- I copied the new `battle.test.ts` into the scratch checkout and ran `npx vitest run lib/combat-simulator/battle.test.ts`: 3 failed, 30 passed. The failing assertions were:
  - `combat dice > scores 1 hits for a combat die showing 5`: `expected [ +0 ] to deeply equal [ 1 ]`
  - `leader rerolls > counts a rolled 5 as a hit, not a miss to reroll`: `expected [ 5, 5 ] to deeply equal [ 3, 4 ]`
  - `leader rerolls > scores 1 hits for a rerolled die showing 5`: `expected [ +0 ] to deeply equal [ 1 ]`

## Mutation checks (each undone, and the file was rerun green before commit)

1. `battle.ts` `calculateCombatRollResults`: changed `>=` to `>`. The combat face-5 row, the re-roll face-5 row, and the re-roll count test failed with the same assertions as the base run. Undone.
2. `battle.ts` `resolveRound`, both leader-roll lines: passed `leaderRoll.map(d => d === 5 ? 4 : d)`, which keeps the 6-only rule for re-rolls while combat dice use 5-or-6. Only `scores 1 hits for a rerolled die showing 5` failed (`expected [ +0 ] to deeply equal [ 1 ]`). Undone.
3. `battle.ts` `resolveRound`, attack re-roll count: added the rolled 5s back into `misses.length`. Only `counts a rolled 5 as a hit...` failed (`expected [ 5, 4 ] to deeply equal [ 3, 4 ]`). Undone.
4. `battle.ts`: set `MIN_HIT_FACE = 4`. The combat face-4 and re-roll face-4 rows failed (`expected [ 1 ] to deeply equal [ +0 ]`). Undone.

## Measured one-versus-one result (for the report and PR body)

`simulateBattles({1,0,0}, {1,0,0}, 100000)`, measured with a temporary vitest file that I deleted afterwards:
- hitsPerRound attacker `[0.6688, 0.3312, 0, 0, 0, 0]`, defender `[0.6693, 0.3307, ...]`. A lone die hits about 1 time in 3 (0.331).
- Outcomes: attacker 0.402, defender 0.401, tie 0.197. Mean rounds 1.809.
- These match the theory for p = 1/3: tie = p²/(1-(1-p)²) = 0.2 and mean rounds = 1/(5/9) = 1.8. Under the old rule, p was 1/6.

## Statistical acceptance specs (not run; acceptance-test owns them)

I measured the same matchups with `simulateBattles` under the new rule:
- Strong attacker `0/10/5 vs 1/0/0` (1000 battles): attacker 1.0, which meets the > 0.99 the spec requires. The mirrored strong defender: defender 1.0.
- Equal armies `5/0/0 vs 5/0/0` (1000 battles): attacker 0.493 and defender 0.48, inside the spec's 0.3-0.7 range; p10 is 2.
- Lone defender `10/0/5 vs 1/0/0` (5000 battles): p90 is 1 (the spec needs ≤ 2), and the attacker's 5-hit share is 0.055 (the spec needs > 0).
- One-versus-one (5000 battles): ties 1031, attacker 2011, defender 1958, all above 0.

I expect every spec to still hold, and I edited none.

## Codegen, build, lint

- codegen: not set.
- build (`link-node-modules.sh . && npx next build`): succeeded.
- lint (`npx tsc --noEmit && npm run lint:dup`): tsc was clean, and jscpd found 0 clones.
- `git status` was clean after the commit. No tool-made changes to revert.
- Runtime: Node 24 via `shellSetup`. No version mismatch.

## Invariant check

- W1: the code and `docs/combat-simulator.md` change together. The doc states 5-or-6 for the combat roll and the re-roll, in the list and in the flowchart.
- W2: `resolveRound`, `Battle`, and `simulateBattles` keep their shape, and no state is shared across battles.
- The rest are untouched: `rollDice`, the 5-dice and 5-reroll caps, the casualty order, the response shape, and OpenAPI.

## Unverified assumptions added

None.

## Out-of-scope findings

None.

## Status

`needs_review`
