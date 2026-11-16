# SGS-180 ticket report 1

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-180-split-layout-specs-to-desktop-viewports.md` (ticket-lint clean).

Summary: Feature, M10, aoe4-build-order, risk low, test-only (0 business LOC; about 160 spec lines deleted, about 40 changed in three files). Depends on SGS-179 (`MIN_SUPPORTED_VIEWPORT`). Covers M10.3 and M10.1 (kept split specs).
- `aoe4-split-layout`: keep "split at 1280" with all tab and tablist asserts dropped; delete tabs at 390, breakpoint, switches live, both round trips, view toggle disabled, both resize rows, the old first-paint case, and the `tablist` helper.
- `aoe4-split-scroll`: delete "below 1200 no columns" and "below 768 bar static" (and `NARROW_VIEWPORT`); headings case loses its tabs row; the 768x1024 focus-ring case moves to `MIN_SUPPORTED_VIEWPORT`; drop `showTab`.
- `aoe4-results-split`: drop the tabs row and `showTab`.
- `aoe4-split-tab-order`: no change (grep found nothing).

Diagrams: none (no-diagram sentence).

Open questions: none.

Notes:
- Deviation from the plan text: the plan only drops the `tab-build`/`tab-results` count asserts in "split at 1280". The ticket also drops its `workbench-tabs` (tablist) assert, since C2 says no spec references that id after M10.
- No file overlap with SGS-179 (helpers, narrow, small-screen, inline-issues, pin-compare) or SGS-183 (step-table, m4-flow, run-errors, chart-layout, marker-labels, six showTab specs). Checked by reading both tickets.
- Dependency note: SGS-179 had no branch yet; I read its ticket only. The focus-ring move to `MIN_SUPPORTED_VIEWPORT` was not run (constant not available at base); the ticket makes the implementer run it per file.
- The criteria are test-based, so no command criterion was run here; no scratch checkout was made.
