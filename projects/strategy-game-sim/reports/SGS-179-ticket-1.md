# SGS-179 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-179-min-viewport-delete-narrow-specs.md
Lint: ticket-lint.py clean.

Summary: Feature, aoe4-build-order, M10, risk low, test-only, no dependencies, about 215 lines deleted and about 80 changed, no business logic. Adds MIN_SUPPORTED_VIEWPORT (1200x800) to acceptance/helpers.ts (only that; SPLIT_MIN_WIDTH, TABS_VIEWPORT, showTab stay for F). Deletes aoe4-narrow-layout.spec.ts and aoe4-small-screen.spec.ts. Moves the 3000-char-token case into inline-issues (default viewport) and the 1800 compare-table-fits case into pin-compare. Drops showTab from both files and rewrites the pin-compare "reload keeps the pin" tabs describe at the default viewport (tab-* asserts dropped). Criteria cover the helper, deleted files plus tsc, the two moved cases, the rewritten reload case, no showTab in the two files, lint:dup, npm test, and per-file acceptance runs.

Diagrams: none (single-component, outside control loop).
Open questions: none.
Overlap: none with open tickets. Verified at origin/main 6411526: no file references either deleted spec by name; helpers they used (scrollInstantly, setDurationInPlace, settledScrollY) are still used by aoe4-auto-run and aoe4-split-scroll specs, so no helper becomes dead.
No scratch checkout was made; I ran no acceptance specs. The search criterion (no showTab in the two files) matches at base today (3 and 24 calls) and holds in the end state.
Note: the 3000-char case at the default viewport "fails if the id makes the page scroll" is left to the implementer to make able to fail; I did not run it.
