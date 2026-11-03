# SGS-067 implementer report 1
Branch sgs-067-aoe4-inline-issues-suggestions, tip 7db4db5fc2a5a840a509a06f3ebdbe84dfd5c161, worktree $FACTORY_DIR/worktrees/sgs-067-aoe4-inline-issues-suggestions (base origin/main 12639c4). Status: needs_review.

Files: pages/apps/aoe4-build-order.tsx (derived issues, checked flag, rejection scroll effect), build-text-editor.tsx (errorLines, data-error), issue-list.tsx (suggestion element), text-lines.ts + test (issueLines), docs/aoe4-build-order.md, acceptance/aoe4-build-order-inline-issues.spec.ts (new; 10 tests), acceptance/aoe4-build-order.spec.ts (2 edits).
Results: tsc, lint:dup, next build clean; npm test 1287 passed; npm run acceptance 658 passed after the edit below (the one failure was fixed and rerun alone). Port 4041 free.
Edited existing tests: aoe4-build-order.spec.ts "the gutter has one line number per line of text" (a\nb\n now has a live parse issue, so the no-data-error check moved from first() to last()); "over 20000 characters" toHaveText -> toContainText.
Mutations (all failed as expected, undone): errorLines={[]} in page; editor ignores errorLines; no setChecked; setChecked only on rejection (valid-Run spec fails); suggestion removed; check issues before Run; scrollIntoView removed (line-62 and table-view specs fail); issueLines without sort / dedupe-skip (unit fail).
Notes: new specs are in a new file, not appended to the main spec. CSS scroll-margin-top not added; the effect sets scrollMarginTop inline from the measured run-bar height (same as the results panel). The no-line scroll spec passes even without scrolling (short page, list already visible); the list can't be scrolled fully into view at page bottom, so only its top is asserted. Page uses scoped refs: editorBox.querySelector for the gutter item.
Invariants: S1 imports only lib/aoe4-build-order and components/apps/aoe4-build-order; S3 cap stays in textToBuildOrder, no network on edit.
Out of scope: none.
