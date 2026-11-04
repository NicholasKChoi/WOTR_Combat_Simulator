# SGS-092 ticket report

Ticket: projects/strategy-game-sim/tickets/SGS-092-aoe4-test-hygiene.md
Risk: low (test-only). Depends on: SGS-081 (overlaps timelines, spend-population, helpers.ts, simulate-house-warnings digests). Branch: sgs-092-aoe4-test-hygiene.
Size: ~100 test lines, 0 business logic. Diagram: none required.

Verified on main (cc9bb04), per backlog line:
- 27 research.test.ts naming: still valid. The test is now "changes neither population nor units produced" (not line 345); adding a spawnedPopulation equality assertion passes (ran vitest on research.test.ts in a throwaway worktree, reverted).
- 41 duplicated constants: partly stale. INVALID_PASTE and compare keys already in acceptance/helpers.ts. Still valid: RESOURCE_CHARTS/CHART_IDS/CHARTS in pin-compare, m3-flow, gathered-resources; run() reimplementation in pin-compare and a second in timeline-compare. Covered.
- 44 first-series reads: valid for timelines and spend-population finalCount; simulate.acceptance.test.ts loop is per tier series. Covered.
- 48 step-table flake: valid; line numbers moved. Only the "after a table edit Run posts exactly..." test waits for the POST. Root cause not reproduced (no acceptance run); ticket requires finding the race and proving with 3 full-suite runs plus --repeat-each=5.
- 50 edges issue counts: STALE (toHaveLength(1) present). Dropped.
- 71 digest pins: valid. Ticket digests a named field list.
- 72 empty-steps results split: valid; new case in aoe4-results-split.spec.ts (columns have no test ids, so assert child count 2, chart visible, step-timeline-scroll absent).

Not run: acceptance specs and the proposed mutations (new checks do not exist yet). Worktree removed.
Open questions: none. Overlap: SGS-082 deletes aoe4-build-order.spec.ts (excluded here).
