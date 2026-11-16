# SGS-183 ticket report 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-183-tabs-layout-cases-to-default-viewport.md
Lint: ticket-lint.py clean. Read at origin/main 6411526 (no scratch checkout made, none needed).

Summary: Feature (test-only), aoe4-build-order, M10, risk low, 0 business-logic lines (about 150 spec lines deleted, about 100 changed across eleven acceptance specs), Depends on none. Covers outline E: step-table (keep WIDE half, delete 390 half, the 700/1024 labelled-fields case and the tabs view-toggle describe), m4-flow, run-errors tabs describe, chart-layout (default viewport; drag reorder 1024x2800 to 1280x2800), marker-labels (delete 390 describe and PHONE), and showTab-only removals in six specs. Criteria cover the removed names, the deleted and kept cases, the always-visible Results assertions, viewports, no unsettled reads after showTab goes, and the green run, typecheck and lint:dup.

Diagrams: none (single-component, no control loop).
Open questions: none.

Notes for the manager
- Beyond outline E's wording, the ticket also drops `showTab` from `aoe4-marker-labels` `setup` (the design inventory says tab steps go from every spec, and F deletes `showTab`). It uses only the default viewport and `WIDE_VIEWPORT`/1280x2800, never `MIN_SUPPORTED_VIEWPORT`, so it stays independent of SGS-179.
- Dropping `showTab` at wide viewports also drops its panel-visible assert, so a criterion requires later reads of Results content to wait on that content.
- Overlap: none with A, B, C, D file sets. Files still holding `showTab`/`TABS_VIEWPORT` at base outside E: auto-run, inline-issues, pin-compare, chart-views, editor-width, my-builds, narrow-layout, results-split, save-open, small-screen, split-layout, split-scroll, step-annotations. All belong to A-D per the plan; E leaves them alone and the implementer reports any hit found.
- Nothing run beyond reading specs and the lint; the acceptance suite was not run.
