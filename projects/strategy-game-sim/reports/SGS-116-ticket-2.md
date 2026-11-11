# SGS-116 ticket report 2 (re-spec 2)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-116-step-table-readability.md
Lint: clean.

## Summary
SGS-116 "Label the run cell, stop waiting steps reading 0:00, and fix badge, select, border and editor-scroll readability", component aoe4-build-order, M8 / M8.5, risk low, about 90 LOC, no dependencies. Re-spec 2 settles two findings from implementer report 1. The criteria still cover the `waitedText` rule, run-cell labels, gutter title, badge nowrap, select fit, the 390 px kind border, the layout case, scroll reset and typing, the `Waited` grep, docs and tsc/lint/test. Two criteria changed and are tagged `(respec 2)`: the layout case and the scroll/typing cases.

## Decisions
1. The layout `deletesInside` finding: no replacement select cap. `deletesInside` is now measured against `step-table-scroll`, not the panel.
   - Evidence: design/M8.md C12 says "The table may scroll sideways inside `step-table-scroll` instead of wrapping" and "The 7.5rem cap on the step-table selects is removed. At 1280px a select with 'Capital Town Center' selected shows the whole label." M8.5 (MILESTONES.md) asks that selects not truncate names like "Capital Town Center" at 1280 px.
   - The selects are `w-auto`, so each one is as wide as its longest option. Any cap narrower than that truncates some selected name, which breaks M8.5.
   - The shipped docs already say "a table that still cannot fit scrolls inside its own box (`step-table-scroll`), and the Build panel itself never scrolls sideways". So the end state is the existing design: the panel does not overflow (`panelFits` is kept), and the actions column is reached by scrolling the box.
   - New check: in one `page.evaluate`, scroll the box fully right, then every `step-delete` rect lies within the box rect, and the box's computed `overflow-x` is `auto`.
   - This is not marked `owner`, because the design already decided it.
2. The typing case: the ticket now specifies the implementer's case. The caret is placed with `setSelectionRange` in the visible part of the long line, `y` is typed, and `scrollLeft` must be unchanged. The ticket also says why `End`-then-type is not used: Chromium re-scrolls to the caret, so that version passes even when the reset always runs.

## Branch work
Branch sgs-116-step-table-readability (22ba507) stands. Its code, unit tests, docs and typing case already match. Only the layout case's `deletesInside` measurement needs editing. The `Waited` grep criterion holds on the branch: matches only in `build-text-editor.tsx` and `step-annotation.tsx`. I did not run the new layout check: it does not exist yet in that form, and acceptance runs are not this role's.

## Diagrams
None. Single-component change, "no diagram required".

## Open questions
None.

## Overlap
None new. Unit-test CSS assertions stay out of scope (M8.7 ticket), as before.
