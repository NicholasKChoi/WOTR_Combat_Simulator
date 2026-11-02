# SGS-035 ticket report 1

File: projects/strategy-game-sim/tickets/SGS-035-aoe4-engine-common-dup-check.md (outline A, M3.13 plus backlog).

Summary: engine-common.ts (RESOURCE_TOLERANCE, VILLAGER_ID, HOUSE_ID, costOf, canAfford, payCost, villagerWalkSeconds, markCompleted), GATHER_NODES, RESOURCE_KINDS, SpendCategory in model.ts, EngineState.spent running totals (owner answer 1), test-helpers.ts, jscpd pinned 4.3.0 with threshold 0 (answer 2), .jscpd.json with tests in paths and acceptance/ out (answer 3), test migration of the 6 flagged clones, new tests, ARCHITECTURE.md line. On merge: REPO.md commands.lint.

Risk: high. REPO.md criticalPaths `lib/**` applies; the plan's "medium" is its own scale. Size ~110 business lines touched.
Diagram: pay path flowchart (read, act, record). Dependencies: none.

Checks run against main f078c11:
- jscpd 4.3.0 dry run with the design settings: 6 clones, exit 1; clean path exit 0 (threshold 0 works).
- Count greps in the criteria were run: 9 / 6 / 3 hits today.
- Mutation prototype (throwaway worktree, removed): houseDemand reading entries[0] instead of the tier lookup changes spearman-3 count at 400 s from 108 to 73, so the planned test can fail.
- Stall reproduced: house time 0 and walkSeconds 0 gives 3 villagers at 900 s vs 43 shipped.

Findings that shape the ticket:
- Source-shape tests read simulate.ts, houses.ts, research.ts literals (simulate.test.ts:723 allows one tolerance literal in simulate.ts; it must be updated when 1e-9 moves). houses.test.ts and research.test.ts shape tests stay valid.
- Design snapshot has equal costs for spearman-2/3, so the auto-house tier test needs editGameData.
- validate.ts has its own VILLAGER const; left out of scope (not an engine module in the Shared code rule).
- spawnUnit has a third copy of the move-speed division; folded in conditionally.

Open questions (both designer): the 0-build/0-walk stall has no rule in the design (swapping to RESOURCE_TOLERANCE does not fix it; ticket does not fix it); villagerWalkSeconds takes a redundant data parameter.
Overlap: none with existing tickets. Later: SGS-037 and SGS-043 use the exports; SGS-040 replaces parse-text's GATHER_NODE_ORDER; SGS-053 owns the move-speed doc wording.
