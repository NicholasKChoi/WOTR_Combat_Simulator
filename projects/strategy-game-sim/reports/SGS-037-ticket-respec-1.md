# SGS-037 re-spec 1

Folded designer pass 4 rows into tickets/SGS-037-aoe4-node-refs-warnings-depletion-module.md.

- Row 2: Scope now defines `recordRunOut(stock, ref, at, idleVillagers)`, `recordIdleArrival(stock, ref, at, count)` and `sortWarnings(warnings: readonly SimWarning[])` in depletion.ts, with the design's rules (first record wins, ignore non-stock/non-depleted/count 0, idle arrivals sum, sortWarnings is the one sort). New acceptance criterion for both recorders. A ref starting at 0 is depleted at once but gets depletedAt/warning only via recordRunOut at the end of t=0 (berry criterion changed accordingly).
- Row 9: OpenAPI adds `DepositRef` enum; `NodeRef` and `FiniteNodeRef` are `oneOf` refs; `FiniteGatherNodeId` referenced from `FiniteNodeRef`; union test pins accepted values to NODE_REFS / FINITE_NODE_REFS. NodeRef stays unreferenced until D, so any every-schema-referenced check exempts it.
- Row 1c: depletion.ts imports `formatMinSec` from format-time.ts; Depends on notes SGS-035 does the move; message texts fixed in Scope and Acceptance.
- Both designer open questions deleted; Open questions is "None."
- LOC estimate ~195. Risk stays high (critical path lib/**).
- Not run: no command-based criteria changed beyond the existing git grep for tolerance literals (unchanged).
