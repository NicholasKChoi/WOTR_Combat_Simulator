# SGS-035 re-spec 1

File: projects/strategy-game-sim/tickets/SGS-035-aoe4-engine-common-dup-check.md (id, file, graph row kept). Risk stays high (REPO.md criticalPaths lib/**).

Folded designer pass 4 rows:
- 1a: zero-time stall dropped from Out of scope as a known limit (no rule); open question deleted.
- 1b: Scope item 2 and the engine-common test criterion now use `villagerWalkSeconds(state: EffectState, walkSeconds)`, reading `state.data`; open question deleted.
- 1c: new Scope item 10 moves `formatMinSec` to `lib/aoe4-build-order/format-time.ts` (no re-export from chart-rows); importers updated (`line-chart.tsx`, `chart-rows.test.ts` -> new `format-time.test.ts`; `parse-text.ts:301` uses it per design). New criterion tagged (respec 1) with a grep check run against main (1 definition in chart-rows.ts today). Docs item renumbered 11; LOC estimate ~120.

Open questions: none. Diagram unchanged.
