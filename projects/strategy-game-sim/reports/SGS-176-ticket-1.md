# SGS-176 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-176-lib-export-doc-comments.md

Summary: Chore, Component aoe4-build-order (the change also spans lib/combat-simulator, noted in Context), Milestone none, Priority low, Risk low. About 320 lines, all comments (about 310 `export` lines under `lib/` at origin/main, test files included in that count), so under the 400-line limit and written as one ticket. No dependencies, On merge none. Criteria: every export in non-test `lib/` has a doc comment naming its job and design-doc section where one applies; the diff adds only comment lines in `lib/`; tsc and tests pass with no test edits; no ticket ids in comments.

Diagrams: none (single-component, no diagram required).
Open questions: none.
Overlap: none found with open tickets. BACKLOG.md and the graph were not edited.
Not run: no scratch checkout made; no mutation or search criterion needs running (criteria are diff and typecheck based). ticket-lint passed.

Note for manager: the Component field takes one value, and the work spans two components. The export counts are approximate (grep of `^export` at origin/main).
