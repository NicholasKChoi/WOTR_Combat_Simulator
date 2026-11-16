# SGS-181 ticket report 1

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-181-width-row-specs-editor-annotations-chart-views.md`

Summary: "Move the editor-width, step-annotation and chart-view specs to supported viewports". Feature, M10, component aoe4-build-order, risk low, test-only (0 business logic, about 250 spec lines changed in `aoe4-editor-width`, `aoe4-step-annotations`, `aoe4-chart-views`). Depends on SGS-179 (only for `MIN_SUPPORTED_VIEWPORT`). Criteria cover: no sub-1200 viewport in the three files; half-editor at `MIN_SUPPORTED_VIEWPORT`; typical-line, gutter and Build-panel-overflow rows over `[MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]`; table-finish-time and hover at the default viewport; the 768 and 767/768/850 boundary cases deleted; popover-in-viewport rows; 4px run-cell border at the default viewport; tick-overlap rows; no unsettled reads after `showTab` goes; lint:dup, tsc, unit and per-file acceptance.

Read at `origin/main` 6411526 (the `git fetch` timed out in the sandbox and kept running in the background, so the base is the last fetched main, which matches the plan's). No scratch checkout made; no acceptance run done (the ticket's "passes on today's main" rests on the plan and my read of the specs).

Diagrams: none (single-component, no diagram required).
Lint: `ticket-lint.py` printed no errors.
Open questions: none.

Decisions worth the reviewer's attention:
- The `editorWidth < 768` precondition in the kept editor cases is dropped (it asserts the removed boundary); the font and finish-time assertions carry the compact-editor proof. The plan said "expectations unchanged", so this is a small deviation.
- Table-keeps-finish-time at the default viewport assumes `step-finished` is visible in the table at 1280; the ticket tells the implementer to confirm by running the spec.

Overlap: none with SGS-179 (helpers, narrow, small-screen, inline-issues, pin-compare), SGS-180 (split specs), SGS-182 or SGS-183 (step-table, m4-flow, run-errors, chart-layout, marker-labels, auto-run-contract etc.). `acceptance/helpers.ts` untouched. `aoe4-chart-views` and `aoe4-step-annotations` have `showTab` counts the plan listed (18, 6) that match the base.
