# SGS-182 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-182-save-load-auto-run-specs-to-desktop-viewports.md

Summary: "Move the save, load and auto-run specs to desktop viewports". Feature, component aoe4-build-order, M10, risk low, test-only (0 business-logic lines; about 120 spec lines deleted, about 80 changed in four acceptance files). Depends on SGS-179 (MIN_SUPPORTED_VIEWPORT). Covers aoe4-save-open (broken-build case to the default viewport, delete the four "tab after a load" cases), aoe4-save-status (one 1280x800 describe, delete the 1199 and 390 cases), aoe4-my-builds (save-panel layout case rewritten at MIN_SUPPORTED_VIEWPORT, bar at most 40% at 1200x800 and 1280x720), aoe4-auto-run (the two TABS_VIEWPORT describes and the scroll case at the default viewport, with a y > 0 precondition). It drops every showTab call and tab-* assert in these files.

Diagrams: none (single-component, no diagram required).
Open questions: none.
Overlap: none with SGS-179 (helpers.ts, inline-issues, pin-compare) or SGS-183 (step-table, m4-flow, run-errors, chart-layout, marker-labels and the showTab-only specs). The four files are disjoint from both.

Notes:
- The scroll case has a fallback. If the default viewport (Desktop Chrome, 1280x720) cannot scroll the window or the Build column, the implementer reports the measured range and stops for a re-spec. I did not run the page, so this is unverified.
- The ticket has no mutation or search criteria that needed running. Lint passed.
- No scratch checkout was made; I read origin/main (6411526) with `git show`.
