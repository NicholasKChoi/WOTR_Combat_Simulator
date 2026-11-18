# SGS-204 ticket 9 (re-spec 3)

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-204-upgrade-dot-tier-indicator.md`

Summary: "Show which tier upgrade each Units chart upgrade dot is", Chore, component aoe4-build-order, Milestone none, Risk standard, about 90 business-logic LOC, no dependencies. Re-spec 3 folds in owner answer Q138 and the two non-blocking notes from spec gate 8; nothing else changed.

- Context: the "owner tagged it a standalone chore" note is replaced by a citation of the PROJECT.md Decisions line (Q138) that keeps a tagged standalone chore a Chore when it adds small visible UI text, and says the spec gate and review do not bounce it for that. This closes gate 8 gap 1.
- Unverified assumptions: adds that if the placement takes pixel positions from recharts plot or scale hooks (not from the plot box and domains `SeriesChart` already has), the hooks must return the plot's pixel box and the scale that maps an upgrade to where `ReferenceDot` draws it, at every width and zoom. Only the Chromium acceptance spec exercises that. The implementer names the hooks it reads in recharts 3.10.1.
- Criterion 1, now tagged `(respec 3)`: adds an invented-id case, `mighty-widgets` with `widget` gives `Mighty`. A test also fails if the function works from a list of known tier words or units. This makes the "no hard-coded tier word" criterion (A1) testable beyond the current data ids.
- Added `## Re-spec 3 - 2026-11-17`. The branch work at tip 1f5ebe0 that Re-spec 2 listed as standing still stands; the implementer adds the invented-id unit case.

Lint: `ticket-lint.py` passes (exit 0).
Diagrams: none (single component, outside the core loop).
Open questions: none.
Overlap with other tickets: none.
