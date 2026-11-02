# SGS-038 spec gate 4

Verdict: READY

Method: throwaway worktree at 93a1e2b, merged origin/main 77fa279 (clean, no conflicts), applied the ticket agent's diff
(scratchpad/sgs-038-test-edits.diff) cleanly. Worktree removed afterwards.

Results on merged tree + 7 edits:
- npx tsc --noEmit: clean (covers the contract spec `locations` and `simInputOverrides` records).
- npx vitest run: 33 files, 828 tests pass.
- ENG 1TC research-extension pin recomputed through simulateBuildOrder on the merged tree: food 618.3789316586852,
  wood 3269.775976995086, gold 242.9497986659074, steps[14].startedAt 363.82392930629044, steps[25].startedAt
  711.0333333333333. All match the ticket (041/043 do not move it; main still has 596.28 only because the createdBy walk fix is not on main).
- OpenAPI example `depletions` is the six null finite rows; JSON parses.
- Playwright was NOT run: next dev would not start in the temp worktree (symlinked node_modules, missing .next manifest). Spec edits are covered by tsc plus the pin recompute above.

Interaction with SGS-041/043 (all benign, none changes the 7 edits):
- Edges spec key list gains spent/spawnedPopulation/populationCapReachedAt on main; the ticket does not touch that spec and 038 adds no result key.
- simulate.ts export count on main is 12 (041/043 add none), so 12 -> 13 with assignGatherers holds.
- SimulationResult/model.ts: 043 adds fields, no exports; model.ts export test untouched, still correct (038 adds no model export).
- EffectState researchedIds: main already updated simulate.test.ts rateOf; no overlap with the listed edits.
- OpenAPI 043 additions (spent, spawnedPopulation) sit apart from the depletions example; merged cleanly.
- validate.test.ts defaults test: nodeAmounts: expect.any(Object) still fits; validate.acceptance runtime-name list unchanged by 041/043.

Other checks: scope, criteria, invariants, diagram, risk (high), docs, open questions (none) are unchanged from the prior gate and show no new gap.

Notes (non-blocking):
- 043 added Engine.spawnedPopulation, incremented in spawnUnit and seeded from aliveVillagers in createEngine. The implementer must keep
  that increment when routing the spawn walk through assignGatherers, and idle villagers stay counted (aliveVillagers includes idle). Rebase conflict in spawnUnit/createEngine is likely but mechanical.
- The PR body should list the seven edited tests, as the criteria already require.
- Playwright run of the full suite remains for the implementer's gate.
