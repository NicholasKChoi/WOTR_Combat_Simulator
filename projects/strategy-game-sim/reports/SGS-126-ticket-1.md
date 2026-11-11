# SGS-126 ticket report (run 1)

File: `tickets/SGS-126-pin-compare-pinned-only-legend-fixture.md`. Lint: clean.

Summary: Bug, component aoe4-build-order, risk low, ~10 LOC, one test in `acceptance/aoe4-build-order-pin-compare.spec.ts`. No dependencies, On merge none. The fix pins `DEFAULT_PASTE` at 1200 s (produces spearmen/longbowmen, military spend non-zero by 1200 s per the compare-table test and `aoe4-simulate-api-prebuilt-plans.spec.ts`) and runs `NO_MILITARY_PASTE` as the current run, so the units chart has pinned-only series. Keeps the `only.length > 0` precondition. Criteria: test passes, precondition kept, three mutation checks (pinned-only `lines` forced to `both`, `isLineHidden` ignoring `pinned:` keys, `legendItems` dropping pinned-only keys), only that spec file changes. Diagrams: none required.

Caveats:
- I did not run the spec or the mutations (acceptance is not mine to run); the 1200 s default-build unit production is inferred from existing specs, and the ticket tells the implementer to confirm the precondition and pick exact durations.
- Mutation targets (`legendItems`, `isLineHidden` in `chart-rows.ts`, dashed swatch in `chart-legend.tsx`) were read on origin/main, where SGS-113 is merged.

Overlap: SGS-118 (`sgs-118-acceptance-test-debt`, not yet merged) edits other tests in the same spec file (deletes `holdSimulate`/`bodyDuration`, moves to `helpers.ts`). Ticket restricts the edit to this test's body and forbids depending on new helpers; no logical conflict, possible textual merge only if hunks touch adjacent lines.

Open questions: none.
