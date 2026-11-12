# SGS-135 ticket 2 (re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-135-chart-header-drag-handle-and-caret.md

Summary: "Replace the chart Collapse, Up and Down text buttons with a drag handle and a caret" (aoe4-build-order, M9.4, ~160 business-logic lines, depends on SGS-134). I re-specced it against spec-gate 1 and folded in all four blocking gaps. (1) The `chart-move-` grep now covers the whole repo, and no test spells the old ids to assert they are absent. The old "no buttons without layout" case is rewritten to assert there is no handle and no caret. (2) The pointer-drag test must make the whole path reachable, either with a tall viewport or by collapsing charts first. It reads bounding boxes and drops at a y between the third and fourth charts' midpoints, which gives index 2 and order [2,3,1,4]. (3) `dropIndexAt` counts only midpoints strictly above the pointer. `dropIndexAt([10, 20], 10)` is 0, and a test fails if an equal midpoint is counted. (4) The no-op first-chart ArrowUp test checks only the status text, after a real move that announced a different chart, so the test can fail. That the ref stays null is now a review check. The gate's notes are folded into Scope: Escape needs a keydown listener that pointer capture does not provide, and the implementer chooses how to add it. Bootstrap's `visually-hidden` works because `pages/_app.js` loads Bootstrap 5 CSS globally (I verified this). Announcement tests assert the title and the number. The caret criterion now also requires `aoe4-gather-rates-per-villager.spec.ts` to pass. The changed criteria are tagged `(respec 1)`, and a `## Re-spec 1 - 2026-11-11` section is appended.

Checks: at origin/main, `git grep "chart-move-"` matches `line-chart.tsx`, `results.tsx`, `line-chart.test.ts` and `acceptance/aoe4-chart-layout.spec.ts`. All four files are ones Scope rewrites, so the end-state grep is consistent with Scope. Lint passes with no errors.

Diagrams: none. It is a single component outside the core control loop.

Open questions: none.

Overlap: none. The gate found SGS-137 and SGS-138 consistent with this ticket.
