# Tech-lead gate: batch M3 wave 3 (SGS-041, SGS-043)

## Decision
No blockers. Two independent draft PRs opened on main.

- SGS-041: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/47 (base main), branch sgs-041-aoe4-research-multitier-note-severity, tip c56a5f67709bb078cea073814e062c7086026736. Merge risk medium.
- SGS-043: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/48 (base main), branch sgs-043-aoe4-spend-population-series, tip 3209540eba69386faea349aa24684e6b4c64c624. Merge risk medium.

## Reviewed
- origin/main 9137cf2d3a1b03f1f25af429e2244f9cdd9c3dc7.
- SGS-041: 0695d47, c56a5f6; 20 files, +309/-64 (TS logic +34/-12 in research.ts, effects.ts, model.ts, simulate.ts; OpenAPI +6/-1; docs +19/-7; tests +250/-44).
- SGS-043: be39f66, 4f5fb10, 3209540; 9 files, +535/-2 (TS logic +43/-0 in simulate.ts, model.ts; OpenAPI +128/-1; docs +8; tests +356/-1).
- Both stacks contain only their own task on main (2 and 3 commits). All authored as choinickolas@gmail.com.
- Combined merge (git merge-tree, clean) checked in a scratch worktree: `npx tsc --noEmit` clean; `npm test` 32 files / 756 tests pass. The 200 example's `notes` is `[]`, so SGS-041's required `severity` does not invalidate SGS-043's example.

## Blocker categories checked
- Invariants A1/A2/A3: research still pays through canAfford/payCost with category research; tiers and costs from snapshot entries; no clock/randomness; researchNotes still pure of (order, data). Spend series sample the payCost totals; no new numbers in code. No violation.
- Correctness: handler's old `entry.age > state.age` check is replaced by the undefined pick, same no-start/no-reserve result. Effects now by entry id; only production EffectState producer is the engine, which sets researchedIds. Population seed/increment/cap logic matches the ticket.
- Irreversibility: none (no migrations, additive response fields).
- Concurrency: none. Security: none.
- Open questions: none answered unilaterally (CONTEXT has none; behavior matches design rows).
- Contract: both add required fields to the response (additive); SGS-041 rewords note messages (display text only, no in-repo parser). Page consumer unaffected.
- Blast radius: matches commit messages. criticalPaths: SGS-043 changes simulateBuildOrder (sampling only) ; SGS-041 touches createEngine/EngineState only (not listed symbols).

## PR #47 (SGS-041) body sections
## Merge risk
**medium** - adds a required field to the public `BuildOrderNote` response and rewords note messages; additive, a revert undoes it, and the research payment path still goes through the existing affordability check.

## Review focus
- [`lib/aoe4-build-order/research.ts:41-57`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/47/files#diff-6dea0adf30bf11d9accf8e7e324e7d858172051b5845ec1a4cbae0e47c1be4d4R41-R57) - the tier is re-picked on every attempt, so a research step that waited across an age-up pays the higher tier's cost and gets its producer from that tier; if the pick or the reserve went wrong, a multi-tier tech would be charged the wrong amount or wait forever. The shipped data has no multi-tier tech, so only the unit tests exercise this - check the age gate and the reserve amount.
- [`lib/aoe4-build-order/effects.ts:106-112`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/47/files#diff-2f5d23b8e5c2c4231e7e6b7e8013022bb050f0ba61c679138d5d79cedb27e14aR106-R112) - tech effects now come only from `researchedIds`; any `EffectState` that fills `researched` but not `researchedIds` silently loses every tech effect (gather rates, build speed) with no error. The engine is the only production producer today - check that no other caller builds one.

## PR #48 (SGS-043) body sections
## Merge risk
**medium** - adds required fields to the public `SimulationResult` response and samples them inside `simulateBuildOrder`; additive, a revert undoes it, and payment and step order are untouched.

## Review focus
- [`lib/aoe4-build-order/simulate.ts:569-579`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/48/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R569-R579) - the start population seed now looks up each start unit's entry and throws on a missing one, so a civ rule whose `startingState` returns an unknown unit turns every simulate request into a 500 where it used to run. Check that only loader-validated or rule-produced baseIds reach it.
- [`lib/aoe4-build-order/simulate.ts:203-215`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/48/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R203-R215) - `spawnUnit` is the only place `spawnedPopulation` grows and the cap instant is set; a unit that appears by another path would be missing from the series and the time-to-cap. Check that `spawnUnit` is the only way a unit spawns.

## Non-blocking notes
- SGS-043 commit subjects 3209540 and 4f5fb10 contain the ticket id ("SGS-043 acceptance: ...", "SGS-043 rework 1: ..."). With squash merge, GitHub's default squash message lists every commit subject; set the squash message to the PR title/summary at merge so the id does not land on main.
- SGS-043 `startUnitPopulation` throws a plain Error inside the request path; the route has no try/catch, so it would surface as a 500. Unreachable with shipped data (loader rejects it first); listed as a review hotspot.
- SGS-041 multi-tier behavior is exercised only by unit tests with editGameData; the shipped snapshot has one entry per tech.
