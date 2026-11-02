# M4 designer report 1

Design: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/design/M4.md

## Contracts fixed (all new to M4)
C1 zod dependency and compiler setting; C2 `BuildOrderCatalog`, `buildOrderCatalog`, `buildOrderShape`,
`buildOrderSchema`, `simInputsSchema`, `checkBuildOrder`, `checkSimInputs`, `resolveSimInputs`, `nearestId`,
`OPTIONAL_STEP_FIELDS`, `StepOptions.names`, `snapshotFileSchema`/`baseRulesFileSchema`/`civRulesFileSchema`;
C3 zod-to-`BuildOrderIssue` mapping, `BuildOrderIssue.suggestion`; C4 API body (page posts `buildOrder`);
C5 `UnitSeries.counts` = units at a tier at a time, `convertUnits`; C6 warnings `auto-houses-never-start`,
`auto-houses-held` and their sort rank; C7 `HouseDemand.pending`; C8 page/tab/editor test ids, `lineCount`,
`issueLines`, `BuildTextEditor`, `IssueList`, `WorkbenchTab`, `PageProps.catalog`; C9 step table ids,
`FIELD_LABELS`, start row ids; C10 `TimelineRow.blockedBy`/`longWait`, `LONG_WAIT_SECONDS` 60; C11 `KeyValue`,
`CompareRow.direction`, `ComparePanel` props; C12 chart legend ids, `chart-pinned-marker`, `placeMarkers`
export, `SeriesChart.pinnedMarkers`; C13 `PIN_STORAGE_KEY`, `StoredPin`, read/write/clear.

## Design choice made (criterion delegated it)
M4.5: late explicit `build house` is met by the `auto-houses-held` warning, not by changing the gate (gate kept per M4.3).

## Extension points
Per-civ catalog; per-tier unit ledger (future losses); sortWarnings rank tuple; compareRows row list;
versioned localStorage keys; removable `text` branch in the route.

## Owner decisions
1. zod types under `strict: false`: A precursor strictNullChecks ticket fixing 177 errors (recommended) / B casts plus round-trip test.
2. API `text`: A keep (recommended) / B keep and deprecate in OpenAPI / C remove.
3. Veterancy: A move counts to the upper tier in `unitsProduced` (recommended) / B add a separate `unitsByTier` series.

## Ticket sequencing notes
Serialize: simulate.ts (M4.2, M4.3/5, M4.4); the page (M4.1 client, M4.7, M4.8, M4.12); line-chart (M4.11, then M4.12);
compare-panel (M4.10, then M4.12). M4.6 after M4.2 and M4.4; M4.13 and M4.14 last.
