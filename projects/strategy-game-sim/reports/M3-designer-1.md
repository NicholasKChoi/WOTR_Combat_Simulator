# M3 designer pass 1

Design: `projects/strategy-game-sim/design/M3.md` (first pass, no revision).

## Contracts fixed

FiniteGatherNodeId, GATHER_NODES, FINITE_GATHER_NODES, RESOURCE_KINDS, Trigger kinds `depleted` and `bank`
(paste `when <node> runs out`, `when <resource> >= N`), SimInputs.nodeAmounts / SimInputOverrides.nodeAmounts,
SIM_INPUT_BOUNDS.nodeAmount and triggerAtLeast, GatherNodeRules.amount and createdBy, StepWait,
StepTiming.waitingOn and waitBreakdown, StepStart.waitingOn, SpendCategory, NodeDepletion, SimWarning
(`node-depleted`, `idle-arrival`), SimulationResult.depletions, warnings, spent, population,
populationCapReachedAt, depletion.ts (NodeStock, createNodeStock, drawDown, nextRunOut, isDepleted,
depletionResults), assignGatherers, availableAt, triggerWakeAt, researchEntry, EffectState.researchedIds,
formatBuildStep, MAX_REPORTED_ISSUES, SimulateError.omittedIssues, StepOptions / stepOptions,
step-table-model functions, KEY_TIMES, KeyNumbers, keyNumbers, CompareRow, compareRows, PinnedSeries,
pinnedKey, toChartRows(times, series, pinned?), SeriesChart.pinned, page test ids, M3.7 build file
`builds/english-spear-archer-maa-crossbow.json`.

## Extension points

Severity levels, save/share, other civs, fallback node, numbered deposits, more triggers, idle series, more
compare metrics, mill coverage, table-editable start.

## Owner decisions (recommendation)

1. Starting amounts: one aggregate per node kind for the starting area, seed values unverified (recommended).
2. "Archer" means longbowman; Feudal council-hall, Castle kings-palace (recommended).
3. Table edits drop comments (accept, recommended).
4. Include the `idle-arrival` warning (recommended).
5. Depletion on by default, null override restores infinite (recommended).
6. Military spent = all resources paid for non-villager units at payment (recommended).
7. Time to 200 pop counts paid, unspawned units (recommended).
