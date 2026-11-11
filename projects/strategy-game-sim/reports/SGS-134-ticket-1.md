# SGS-134 ticket report 1

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-134-chart-layout-model-key-results-collapse.md`

Summary: "Widen the chart layout model, make the key-results panel collapsible, and give the page the one layout owner". Component aoe4-build-order, Risk standard, about 180 lines of business logic, Depends on SGS-128. Covers design C2 (`KEY_RESULTS_PANEL_ID`, `LayoutPanelId`, `moveChartTo`, widened toggle and normalize, functional-setState hook with a `loaded` gate), the `CollapseCaret` part of C3, C4 (collapsible ComparePanel, pin buttons stay in the header when collapsed, owner decision 6A) and C5 (page calls the hook once, Results takes `chartLayout`). Tests: Vitest for chart-layout, a new `compare-panel.test.ts` (static markup), and a new Playwright spec `acceptance/aoe4-key-results-collapse.spec.ts` (separate file so the chart-header ticket's rewrite of `aoe4-chart-layout.spec.ts` does not conflict). Docs fixes named in Scope (Results heading and pin buttons text; chart-layout storage text). Lint passes.

Diagrams: none (single-component).

Open questions: none.

Overlap: none with open tickets. The chart-header ticket (outline H) later removes the Up and Down buttons and `pendingFocus` in `results.tsx`; this ticket leaves them. It uses `fakeStorage` and `throwingStorage` from SGS-128's end state, in place of the local copies in `chart-layout.test.ts`.

Notes for the manager:
- The ticket has no Vitest hook test (no DOM environment per design Test levels). The functional-setState and `loaded` rules are a review check; the Playwright reload case catches a default overwriting stored state.
- Outline G lists no acceptance spec; I added one because the design's M9.4 row requires a key-results caret and reload case.
- Ran `ticket-lint.py`: clean. The one search criterion (`useChartLayout(` outside tests) was checked against `origin/main` and excludes the hook's own definition.
