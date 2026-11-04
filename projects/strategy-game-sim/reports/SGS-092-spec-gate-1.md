# SGS-092 spec gate 1

Verdict: READY. Risk tier low confirmed (test-only; no criticalPaths symbol, no strongModelTriggers item; dependency SGS-081 merged as b9481e3).

Checked against origin/main b9481e3:
- Grounded: research.test.ts "changes neither population nor units produced" (only unitsProduced today); RESOURCE_CHARTS in m3-flow and pin-compare, CHART_IDS in pin-compare, CHARTS in gathered-resources; run() in pin-compare and the inline wait in timeline-compare both duplicate runSimulation; local finalCount in timelines (returns undefined, not 0) and spend-population; veterancy-conversion "per-baseId counts sum" test (longbowman-2 then -3, final sum 63); simulate.acceptance.test.ts per-series loop; series() in test-helpers.ts; step-table test with step-add then immediate Run; house-warnings it.each uses a rest digest while the late-house test uses the named list; results-split.spec.ts exists; StepTimeline returns null for zero rows and timelineRows maps steps one to one, so the empty-steps case holds; results.tsx columns have no data-testid.
- Out-of-scope claims hold (INVALID_PASTE and compare keys already in helpers.ts).
- Open questions none; no invariant adjacency; no contract changes; docs: no md names these test symbols; repo lesson on polling is addressed in Scope 4.

Notes (non-blocking):
1. Scope 2 does not name the exported four-chart list (CHART_IDS vs CHARTS). The criterion grep accepts either; pick CHART_IDS.
2. Criterion 3 says the waitForResponse grep "shows no such match" in pin-compare, but three method-less waitForResponse calls remain there (lines ~503, 560, 576, out of scope). Read it as "no match for the local run helper at line ~21"; the implementer should not touch the others.
3. Scope 3: the simulate.acceptance.test.ts loop also asserts toHaveLength(times.length) per series; keep that per series and group only the monotonic and sum checks by baseId (needs a Set of baseIds).
4. Scope 4: the flake proof is statistical (3 suite runs plus repeat-each=5); acceptable, but the implementer should state the diagnosed race in the report.
5. Scope 6: the new case may use either viewport; structure assertions do not depend on it.
