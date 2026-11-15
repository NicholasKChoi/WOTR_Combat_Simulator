# SGS-158 review 1

- Branch: `sgs-158-dice-hit-5-or-6`, tip `a412a69f93509dda033f14ee4e6c92d22dfb5b60`, base `origin/main` e50e074 (not stacked)
- Mode: full review
- Verdict: **APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

1. Combat die 5 and 6 hit, 1-4 miss; a test covers the 4/5 boundary and fails if strict at 5. **Pass.** `battle.ts:115` `thisDice >= MIN_HIT_FACE` with `MIN_HIT_FACE = 5` (`battle.ts:101`). Test `combat dice > scores $hits hits for a combat die showing $face` (faces 1-6, both sides, no leaders so re-roll calls are 0). I mutated `>=` to `>` in my scratch: the face-5 row, the re-roll face-5 row, and the re-roll count test failed (3 failed, 30 passed). Reverted.
2. Re-rolled die hits on 5 and 6, a re-rolled 4 misses; a test scripts the re-roll faces through `resolveRound`. **Pass.** `leader rerolls > scores $hits hits for a rerolled die showing $face` (faces 4/5/6): combat faces are 1, so every hit comes from the re-roll, and `calls` is asserted `[1,1,1,1]` first. A re-roll-only 6-only rule fails the face-5 row (the implementer's mutation 2; consistent with the setup I read).
3. Re-roll count treats a rolled 5 as a hit. **Pass.** `counts a rolled 5 as a hit, not a miss to reroll`: combat faces `[5,5,1,1,1]` and `[5,1,1,1,1]` with 5 leaders each, so re-roll calls are `[3,4]`. Under the old rule they are `[5,5]` (the base run records that failure, and my `>` mutation reproduced it).
4. `rollDice` unchanged. **Pass.** The diff does not touch `rollDice` (`battle.ts:86-98`); the existing `rollDice` test is unchanged.
5. Doc states 5-or-6 for the combat roll and re-roll, in the list and flowchart; no sentence still says only a 6 hits. **Pass.** `docs/combat-simulator.md:34,36,56,57`. Grep for `6 only`, `a 6`, `each 6`, `hit on`, `1/6`, `sixes` over docs, lib, components, pages, acceptance, README, ARCHITECTURE, openapi: no remaining statement of the 6-only rule.
6. Pre-existing tests keep their assertions. **Pass.** The diff only adds tests to `battle.test.ts`; no existing line changes. Existing scripted rolls use 1 (miss) and 6 (hit), which hold under both rules.
7. Implementer's report records a one-versus-one measurement near 1/3. **Pass.** Report: hitsPerRound `[0.6688, 0.3312, ...]` over 100000 battles. My own run (50000 battles via `simulateBattles`): attacker share of 1 hit 0.3316, defender 0.3338; ties 0.2004, mean rounds 1.804 (theory 0.2 and 1.8). With one leader re-roll, the attacker's 1-hit share was 0.555 (theory 1-(2/3)^2 = 0.556).
8. No INVARIANTS.md regressions. **Pass.** See below.

Bug-type checks: the implementer's report records the base run failing 3 tests on the assertions that name the bug (`expected [ +0 ] to deeply equal [ 1 ]` for a combat 5 and a re-rolled 5; `expected [ 5, 5 ] to deeply equal [ 3, 4 ]` for the re-roll count), not on setup. The fix is at the cause the ticket names (`calculateCombatRollResults` comparison and the `||` default, both removed in favor of the constant). Removing `threshold` from `CombatRollOps` is allowed by the ticket; no caller passed it (`resolveRound`, `battle.ts:126-139`, the only callers), and tsc is clean.

## Invariants touched

- W1 (combat follows docs/combat-simulator.md): **holds.** Code and doc change in the same diff; all four roll paths in `resolveRound` share `calculateCombatRollResults`, so combat and re-roll dice both hit on 5-6, matching steps 2-3 and the flowchart. "At most 5 hits per round" (step 4) still holds: the re-roll count is still bounded by misses.
- W2 (independent battles): **holds.** `MIN_HIT_FACE` is a module constant; no new state; `resolveRound`/`Battle`/`simulateBattles` unchanged in shape.
- S1-S3, H*, A*: paths not touched.

spec-checklist: Contracts (no names/API/metric change; CONTEXT Key surfaces unaffected), Scope (no out-of-scope work, no `golang/`, no open question answered by an invented constant: 5 is the owner-confirmed rule), Naming (`MIN_HIT_FACE` states intent), W1/W2 as above. All pass.

## Lint

`npx tsc --noEmit && npm run lint:dup`: tsc clean; jscpd 0 clones over 159 files.

Unit: `npx vitest run lib/combat-simulator`: 4 files, 64 tests passed.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty; no bot run.

## Conventions

- Test layout matches the nearest sibling tests: `it.each` object rows with `$name` titles as in `battle.test.ts:79-90`, and the shared `playRound`/`scriptedRoller`/`army` helpers (`battle.test.ts:16-45`). No repeated blocks.
- Constant naming follows `MAX_COMBAT_DICE`/`MAX_LEADER_REROLLS` (`battle.ts:83-84`).

## Non-blocking notes

- `battle.ts:101`: `MIN_HIT_FACE` sits by itself above `CombatRollOps` rather than next to the other dice constants at `battle.ts:83-84`. Placing it with them would read more naturally; not a defect.
- Row titles render as "scores 1 hits ..." (`$hits hits`). Cosmetic.
- The pre-existing comment at `battle.ts:82` ("Separate from the army-size threshold in BaseArmy.takeHit, which is also 5 ...") is about `MAX_COMBAT_DICE` and stays true; now a third unrelated 5 (`MIN_HIT_FACE`) sits nearby, but it is named distinctly.

## UI inspection

Not run: the diff changes no UI (only `lib/combat-simulator/battle.ts`, its test, and the design doc).

## Coverage

- Files reviewed: `lib/combat-simulator/battle.ts`, `lib/combat-simulator/battle.test.ts`, `docs/combat-simulator.md` (whole doc reread), plus `acceptance/fight-api-caps.spec.ts` and the statistical ranges in `acceptance/fight-api-battles.spec.ts` read against the new rule (the implementer's measurements put every range inside its bound; lone defender p90 stays 1 since P(0 hits from 10 dice) = (2/3)^10 ~ 0.017).
- REPO.md review checklist, Every diff: the implementer recorded a clean `npx next build`; I did not rerun it. No page loads were needed since no page or component changed.
- Combat simulator section: field round-trip unaffected (no field change). "Exercise `/api/fight` with curl" was not done (common.md forbids curl); I exercised `simulateBattles`, which the route calls, with 50000 battles per matchup, and outcomes moved as the ticket says (lone-die hit rate 1/3).
- No REVIEW.md at the repo root. Design doc: none (standalone ticket, Milestone none).
- Acceptance specs not run (acceptance-test owns them).
