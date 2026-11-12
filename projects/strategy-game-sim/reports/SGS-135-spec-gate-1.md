# SGS-135 spec gate 1

Verdict: NEEDS_SPEC

Read at `origin/main` (fetched). SGS-134 is still `draft` with no branch, so its end state was taken from its ticket file. The code the ticket names was spot-checked: `ChartHeader` and `ChartControls` in `line-chart.tsx`, `pendingFocus` in `results.tsx`, `.chartHeader` and `.chartButtons` in `results.module.css`, the `chart controls` cases in `line-chart.test.ts`, and the "Chart controls" paragraph at `docs/aoe4-build-order.md` lines 995-1003. All exist as described. Contract names match `design/M9.md` C3, and the SGS-134 split (`CollapseCaret`, `moveTo`, `chartLayout`) is consistent. SGS-137 and SGS-138 are consistent with this ticket's end state, so there is no throwaway-work overlap.

## Gaps

1. **Acceptance criteria (search criterion vs required test)** - the `SeriesChart` criterion says "No `chart-move-up` or `chart-move-down` markup exists" and also "`git grep -n "chart-move-"` has no match in source, tests, acceptance specs or docs". A test that asserts the absence (`not.toContain('chart-move-up')`, as the old `has no buttons without layout` case does) puts that string into a test file, so the grep fails. The implementer must choose between the two. Fix: keep the grep criterion and drop the "no markup" test. Alternatively, scope the grep to `components/**/*.tsx` and `docs/`, excluding tests, and say absence tests are allowed. Either way the two statements must hold together in the end state.

2. **Acceptance criteria (pointer drag spec)** - "viewport that shows the results" and "a mouse drag of the first chart's handle to below the third chart" leave the geometry open. Three problems:
   - Each expanded chart body is 360px, so the first handle and the point below the third chart do not fit in a default viewport. The page has no auto-scroll, and a mouse position outside the viewport cannot be dragged to. The implementer will guess a viewport size or collapse charts.
   - "Below the third chart" is ambiguous against `dropIndexAt`. The count includes the fourth chart's midpoint if the pointer is below it. The pointer must be below the third chart's midpoint and above the fourth's to give [2,3,1,4]. A pointer in the fourth chart's lower half gives [2,3,4,1].
   - The split view has its own scrolling column.
   Fix: state the rule. The test sets a viewport tall enough that all four handles and the drop point are visible (or collapses charts first), and the drop point is a y between the third chart's vertical midpoint and the fourth chart's vertical midpoint, which gives target index 2.

3. **Acceptance criteria (`dropIndexAt` on a midpoint)** - "exactly on a midpoint (the rule decides which side; the test pins what the code returns and the report records it)". The design says "counts the other sections whose vertical midpoint is above the pointer", so a midpoint equal to `pointerY` is not above it. Leaving it to the implementer to pin whatever the code returns means a flipped comparison passes. Fix: state it. A midpoint equal to `pointerY` is not counted, so `dropIndexAt([10,20], 10)` is 0. Use that as the test row and drop "the report records it".

4. **Acceptance criteria (first-chart ArrowUp)** - "fails if the first chart's ArrowUp moves focus or changes the status text". The focus half cannot fail. If a wrong implementation set `focusAfterMove` on a no-op move, the effect would focus the handle that already has focus. The status-text half can fail. Fix: keep the status-text check, and drop the focus-moves wording or add that after the no-op key the next unrelated order change focuses only the moved chart's handle. The "ref stays null" detail is a review check on `results.tsx`, not a test.

## Notes (non-blocking)

- The "Per villager checkbox stays usable while collapsed" case relies on `aoe4-gather-rates-per-villager.spec.ts`, which uses `chart.scrollIntoViewIfNeeded` and the `gather-rates-per-villager` testid. The slot move does not break it, but run it as part of the check.
- The `chart-reorder-help` and `chart-order-status` wording is pinned only as "names the chart and its new 1-based position out of the chart count". That is acceptable (a content rule, not a quoted string). The tests should assert the chart title and the number, not a full sentence.
- Visually hidden class: the design uses `visually-hidden` and no other usage was found in the grep at `origin/main` (pages, components, CSS). Confirm Bootstrap's utility is loaded on this page, or add a module class.
- Escape cancel: pointer capture keeps pointer events on the handle, but a keydown for Escape needs a document-level listener. The ticket does not say so, but it follows from the design row and is the implementer's call.
- The docs line 976-977 statement about the Per villager checkbox is untouched here, and SGS-137 owns it. That is correct.
- Risk `standard` and LOC 160 are consistent. Open questions: none. On merge `none` is valid.
