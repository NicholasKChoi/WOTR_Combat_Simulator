# SGS-203 review 8 (delta after Rework 1)

Verdict: **APPROVE**
Branch: sgs-203-marker-control-stays-in-view, tip 85508a7fb229b315ab9cc6e9a45b2a7f4a73b424.
Delta: `git diff 6c71747..85508a7`. This is one commit, and it changes one file, `acceptance/aoe4-marker-control-sticky.spec.ts`, by +15/-13.
Production code is unchanged since my first review: `git diff 6c71747..HEAD -- ':!acceptance'` is empty.

## Blocking findings

None.

## Required fixes from review 6

1. **The one-line focus-clearance case could not fail.** Landed.
   - `focusClearance` now runs first on `CHART_IDS[1]` (spec line 145). From my measurements in review 6, its handle is at relTop 746, so the scroll target is 1046, below the column's max scroll of 1554.
   - Before the focus, the spec asserts the precondition (line 133): `before.targetTop < before.columnTop`, so the handle starts above the column top. It reads both values in one `readStuck` evaluate.
   - The precondition sits inside `focusClearance`, so the wrapped call on the second-to-last chart (line 150) is guarded the same way.
   - The implementer's mutation of `workbench.module.css:45` to `scroll-padding-top: 0px` failed this call at line 143: expected >= -1, received -74.17. That matches the before/after values I predicted (about 0 with the padding, about -74 without).
   - My direction also asked for an assertion that the scroll target is at most `max`. It was not added. The handle-above-column-top assertion covers it: a clamped scroll leaves the handle below the column top, and the precondition then fails. This is not a defect.
2. **Layout values read in separate evaluates.** Landed.
   - `readStuck(page, targetSelector?)` returns `targetTop` from the same evaluate as the column rect, the control rect and the `elementFromPoint` hit.
   - All three sites use it: the first-chart header (line 91), the focus handle (line 140) and the chart body row (line 159).
   - Each selector is equivalent to the locator it replaced (a descendant of `[data-testid="<chart>"]`).

The rework touches nothing else. Every other spec line is identical to 6c71747.

## Spec gaps

None.

## Acceptance criteria

Criteria 1-3 and 6-10 are unchanged from review 6 (pass): no production code changed, and those tests were not weakened.

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 4 | Focus or scroll-into-view clearance; fails without the padding | pass | Both focus calls now have a precondition under which the scroll can move the handle. The one-line call fails at -74.17 when the padding is removed. |
| 5 | Drawn over the chart content; `elementFromPoint` read in the same evaluate as the rects | pass | Line 158 reads the plot top, the control rect, `onTop` and `opaque` in one evaluate. |

Invariants: the delta is test-only and touches no INVARIANTS.md path. Review 6's assessment stands.

## Test files across the branch

`git diff origin/main...HEAD` touches two test paths:
- `acceptance/aoe4-marker-control-sticky.spec.ts`, re-read in full against the Bar. All 5 tests can fail.
- `components/apps/aoe4-build-order/chart-legend.test.ts`, unchanged since 6c71747. It only adds lines.

## Lint

`npx tsc --noEmit && npm run lint:dup` in the task checkout: clean, 0 clones.

## Bot reconciliation

REPO.md has no `reviewBot` block, so this section was skipped.

## UI inspection

Not run: the delta changes no UI. Review 6's inspection covers the production code, which is unchanged.

## Non-blocking notes

- `readStuck` maps a selector that matches nothing to `targetTop: null`, and the call sites use `s.targetTop!`. At line 159, `null < controlBottom` is `true`, so a body-row selector that missed would pass that element of the tuple. The locator it replaced threw instead.
  - This cannot happen today: `relativeTop` at line 154 dereferences the same selector with `!` and would throw first.
  - Still, `expect(s.targetTop).not.toBeNull()`, or throwing inside the evaluate when a requested target is missing, would keep the old strictness.
- The non-blocking notes from review 6 still apply:
  - shared height hook;
  - `PinnedLegend` render in the unit test;
  - pre-hover label check in spec test 2.

## Coverage

- Reviewed the full delta and re-read the whole spec file.
- Confirmed there is no production diff since 6c71747.
- Ran lint.
- Did not run acceptance tests (review does not).
