# SGS-206 acceptance-test report 9

Verdict: PASS. 29 new tests written, all pass; no failures, no impl-defects, no spec-gaps.

- Branch `sgs-206-chart-table-hover-and-drag`, tested tip `e9d022197f095e59083189d640ca033d987e47d6`, new commit **578c17a54a580fab7e992e8a649bdfb65846f2a5** (one file added, no non-test file touched).
- File: `acceptance/aoe4-chart-row-feedback.spec.ts` (Chromium, 1280x3400 viewport, Playwright harness ran with its own `next dev`; `acceptanceSetup` ran first).
- `npx tsc --noEmit` and `npm run lint:dup`: clean (0 clones). Nothing left running.

## Tests written (criterion each pins)
Header row highlight:
1. Hover over the title tints only that header row, at least 1.1:1 against its resting colour (recorded 1.186), other rows and the body row unchanged, moving off restores.
2. Hover over the handle cell tints the row too.
3. Tab focus on a handle tints its row; Tab to the next chart's handle moves the tint; body row unchanged.
4. Keyboard focus on the collapse caret / on a view toggle button tints that row only (2 tests).
5. Mouse click on the caret / on a view toggle from a fresh load: tinted while hovered, then no row tinted after the pointer leaves, while the button is `:focus-within` and not `:focus-visible` (2 tests; fails under `:focus-within`).
6. Contrast, hover and keyboard focus, for Units produced and Gather rates rows: title, grip, caret, both toggle labels each at least 4.5:1 against the composited backdrop (4 tests). Lowest ratio recorded: 4.689 (grip, caret, toggles).
7. After pressing the other view toggle, both toggle labels keep 4.5:1 under hover (lowest 4.689).
8. Compare panel caret (`compare-collapse`, pointer elsewhere, unfocused) keeps `rgba(0, 0, 0, 0)`; the chart caret does not.

Drag feedback:
9. Dragged group displaced by the pointer travel (+30, +200, -20), group opacity 0.6, rows 1, other groups' tops/bottoms unchanged.
10. Indicator absent, no transform, no `data-dragging` with no drag and below the 4 px threshold; present past it.
11. Drop, Escape, `pointercancel` and `lostpointercapture` each: indicator present, transform set, `data-dragging` set first, then all cleared; order unchanged for the three cancels (4 tests).
12. No layout shift: other groups' boxes and the table box equal before, during, and after Escape (one evaluate).
13. Indicator spans the table width (+-1 px) and meets exactly the slot span a release would drop into: slots 2, 1, 0, 3 in sequence as the pointer moves.
14. Indicator shows at the chart's own slot.
15. Drop agreement table (5 rows): past the third chart, above the first, below the last, inside own rows, between two collapsed charts. Each asserts the indicator slot, the dropped order built from that slot, the `chart-order-status` text (empty for no change) and the stored layout.
16. Tab-focused handle then dragged, pointer over another header row: precondition handle matches `:focus-visible`, no header row tinted during the drag; after Escape the row is tinted again.
17. Mouse drop from a fresh load: no tint during the drag, handle focused after the drop, no tint once the pointer is off the table, then hover tints the row under the pointer again.

## Results
- New spec: 29 passed. With `aoe4-chart-layout`, `aoe4-split-tab-order`, `aoe4-results-split`: 66 passed. `aoe4-chart-views`, `-zoom`, `-readability`, `aoe4-units-chart-upgrade-dots`, `aoe4-key-results-collapse`: 60 passed. No pre-existing test edited or failing.
- One test-side fix before the run was clean: button colours transition for 150 ms, so the contrast check polls until the ratio settles (a first read mid-transition gave 4.36 and 2.27).

## Mutation checks (each reverted with `git checkout -- <file>`; `git diff` empty after every batch)
`chart-header.module.css`:
- hover rule selector disabled: fails the 7 hover-dependent tests on `>= 1.1` (received 1).
- focus rule `:has(:focus-visible)` to `:focus-within`: fails both click tests and the drop test on the leftover tint.
- focus rule disabled: fails Tab, caret, toggle, focus-contrast and no-tint tests on `>= 1.1`.
- `:not([data-dragging])` removed from the focus rule: fails only the Tab-then-drag test (dragged row tinted). Removed from the hover rule: fails the Tab-then-drag test and the fresh-drop test.
- tint changed to `--bs-tertiary-bg`: fails hover test (ratio 1.054).
- tint also applied to the body row (`~ tr`): fails hover test's body-row assertion.
- `--bs-btn-bg` line removed: fails the 4 contrast tests (< 4.5) and the pressed-toggle test.
- opaque rule made global (`:global(.btn-outline-secondary)`): fails the compare caret test (received `rgb(255, 255, 255)`).

`use-chart-drag.ts`:
- transform removed: fails the follow test and "not none" in the 4 clearing tests; half the travel and `Math.abs` each fail the follow test's offset check.
- `finish` not clearing the transform: fails 4 clearing tests and the layout-shift test; `setDragging(null)` skipped: fails the 4 clearing tests.
- Escape handler removed: fails the Escape test, layout-shift test and the Tab-then-drag test.
- `pointercancel` listener removed: fails only the cancelled-pointer test; `lostpointercapture` removed: fails only the lost-capture test.
- indicator +30 px, not repositioned on move, or placed at the pointer y: fail the indicator tests and all 5 drop rows.
- `onUp` index 0: fails third, last and collapsed rows; `onUp` +1: fails own, third, first, collapsed rows.
- threshold bypassed (`>= 0`): fails the below-threshold test.

`chart-drag.ts`: boundary at first bottom fails above-first, own slot, indicator sequence; last boundary at top fails below-last and the sequence; between-boundary at upper top or one slot too high fails third and collapsed rows and the sequence.

`results.module.css` / `results.tsx` / `chart-header.tsx`: group opacity removed fails the 0.6 assertion; rows individually dimmed fails the rows-1 assertion; indicator not full width fails the width check; indicator `position: relative` fails indicator tests and layout shift; table shifted while the indicator shows fails the table-box assertion; other groups shifted fails the other-groups assertion and the layout-shift test; indicator always rendered fails the absence tests; `data-dragging` removed from the header row fails the clearing tests and both no-tint tests.

Not killable: none retained. The hover half of the no-tint criterion (hover on a row while dragging) cannot be isolated: with pointer capture no row matches `:hover`, as the re-spec says, so the hover exclusion is only killed through the fresh-drop test (removing it fails that test) and not by hover alone.

## Failures
None. Not expressible: none; page scroll drift is out of test scope per the ticket.
