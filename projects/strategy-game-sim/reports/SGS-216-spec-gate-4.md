# SGS-216 spec gate (report 4)

Verdict: READY

ticket-lint (graph + spec at origin/main): no errors, no warnings. Read at origin/main after `git fetch`; Depends on none. No scratch checkout made.

Both gaps from report 2 are closed:
- The UI doc's "the other two charts have none" view-toggle sentence (docs/aoe4-build-order-ui.md line 122) is now in Scope's doc list.
- The `chart-layout.test.ts` rule now covers every case built from the four-id list or treating `chart-floating-resources` as last, with examples. A search confirms the cases that depend on it: the `[units, rates, gathered, floating]` destructure at line 18, and the `DEFAULT_CHART_LAYOUT.order` equals `RESULT_CHART_IDS` assertions at lines 64 and 141, which follow by themselves.

Checked:
- Grounded scope: all named files exist; new names are marked new. `results.tsx` `charts` is `Record<ChartId, ...>`, so adding the id forces the new entry at type level.
- Other consumers of the chart list: `use-chart-drag.ts` is generic over `ChartId`. No other unit test names a chart id.
- Docs: the stale sites found by search are the UI doc "four" sentences (lines 122 and 178), the format doc line 471 to 473 ("four graphs", "`spawnedPopulation` has no graph"), and the data-flow diagram at lines 229 to 232 (`floating` is the last graph node). All are in Scope.
- `page-help.tsx` has no Population mention today, and Scope covers `help-charts`.
- Risk standard is right (no criticalPaths symbol). No input validation, rule exceptions or overlap. Unverified assumptions are listed. `On merge: none` is valid. The 18:15 value is a design constant.

## Notes (non-blocking)
- The `docs/aoe4-build-order-ui.md` line 178 "out of four" sentence and the `docs/aoe4-build-order-format.md` diagram are in Scope. The diagram edit is "add the population graph" and needs no new decision.
- The `Population cap 18:15` literal rests on the design constant. `data-at` equal to the API's `populationCapReachedAt` is the durable check.
