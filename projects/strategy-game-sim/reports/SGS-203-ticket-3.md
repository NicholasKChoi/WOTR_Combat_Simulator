# SGS-203 ticket report 3 (re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-203-marker-control-stays-in-view.md

## Summary

This re-spec fixes "Keep the marker control in view while the results column scrolls". It is a Bug in aoe4-build-order, Milestone none, Risk standard, about 35 business-logic lines, with no dependencies. I checked the code at origin/main after a fetch. The `chart-legend.tsx` call sites confirm that `styles.legend` is shared by `chart-series-legend`, `chart-pinned-legend` and `chart-marker-legend`, and that the marker control carries `mb-3`. `.column` is shared by `build-column` and `results-column` in `workbench-columns.tsx`.

Changes from the spec-gate-2 findings:

- **Gap 1 (shared `.legend` class):** Scope now requires a new class in `results.module.css` that only `MarkerControl` uses. `.legend` must not become sticky, and the `!important` `mb-3` utility is removed so the bottom margin can become padding. A new criterion checks that the series legend and pinned legend still scroll out of view.
- **Gap 2 (stacking criterion):** The stacking criterion is now observable. With chart content scrolled under the control, `document.elementFromPoint` at the control's centre, read in the same `evaluate` as the rects, must return the control or one of its descendants. The dimmed-state clause stays.
  - The run-bar clause is gone. The run bar is outside `results-column`, so the two never overlap.
  - The gate suggested a "help dialog z-index 1080" check, but z-index 1080 belongs to `.annotationPopover`. The help dialog is a modal `<dialog>` (`showModal`, top layer), so a criterion on it could not fail. The stacking bound is a Scope rule instead: the control stays below the annotation popover and the modal help dialog. It is not a criterion.
- **Non-blocking notes:** Scope now writes the measured scroll padding to the Results column only, never to the shared `.column` rule. The padding is removed or set to zero when the control is absent. Criterion 7 now checks that `scroll-padding-top` is zero without markers and that the Build column never gets it.

Context's Cause and the LOC estimate were updated to match. `## Re-spec 1 - 2026-11-17` was appended, and the changed criteria and Scope lines are tagged `(respec 1)`. ticket-lint passes with no output.

## Diagrams

None. The ticket keeps the "no diagram required" sentence.

## Open questions

None.

## Overlap

No new overlap. Spec-gate 2 found no overlap with SGS-204, SGS-205 or SGS-206. SGS-206 touches the chart table, so at most a merge conflict is expected. No branch exists for SGS-203 (status `needs_spec`), so no branch work is affected.
