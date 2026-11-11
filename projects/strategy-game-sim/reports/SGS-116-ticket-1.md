# SGS-116 ticket, re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-116-step-table-readability.md

## Summary

SGS-116 "Label the run cell, stop waiting steps reading 0:00, and fix badge, select, border and editor-scroll readability". Component aoe4-build-order, M8 / M8.5, risk low, about 90 business-logic LOC, no dependencies, On merge none. The criteria cover: `waitedText` table over all four statuses; run-cell markup unit test; acceptance for the labelled run cell, the gutter title, badge nowrap, select width, the 390-wide kind border, keeping the layout case, and the scrollLeft reset and keep cases; the `Waited` grep; docs; tsc, lint:dup and unit tests. Checked against the revised design/M8.md: C12 and the M8.5 rows did not change in this revision, and the ticket still matches them.

## Changes (respec 1)

- Blocking gap fixed: the grep criterion is now `git grep -n "Waited" -- components/apps/aoe4-build-order ':!*.test.ts' ':!*.test.tsx'`, and every match must be in `step-annotation.tsx` or `build-text-editor.tsx`. Run against origin/main, it finds only `build-text-editor.tsx` (the gutter title), which fits Scope. In the end state the run cell label adds `step-annotation.tsx`.
- Note folded in: the select-width acceptance check measures the text width plus the select's padding, border and arrow space against the select's width.
- Note folded in: the run-cell acceptance criterion names the existing case to extend, "a not-reached step reads an en dash for its times and its cause, and its cell is tinted" (confirmed in `acceptance/aoe4-step-annotations.spec.ts` on origin/main).
- Note folded in: Scope says the implementer chooses how the editor tells its own `onChange` apart from other text changes (for example a ref flag). The two acceptance cases pin the behavior.
- Added `## Re-spec 1 - 2026-11-10`. ticket-lint passes with no errors.

## Diagrams

None. Single component, no core loop.

## Open questions

none

## Overlap

Unit-test class-name assertions and the vitest `css` setting stay with the unit-test-debt ticket, as before. No new overlap.
