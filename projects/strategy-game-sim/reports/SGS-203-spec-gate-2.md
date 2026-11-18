# SGS-203 spec gate (report 2)

Verdict: NEEDS_SPEC

Checked against origin/main (fetched). No dependencies.

## Gaps

1. Scope - "the `.legend` or a new class in `results.module.css`" - `.legend` is not the marker control's own class. It is shared by the series legend (`chart-series-legend`), the pinned legend (`chart-pinned-legend`) and `MarkerControl` (chart-legend.tsx lines 17, 49, 74). Making `.legend` sticky pins the series and pinned legends too, which Out of scope forbids and would cover chart content. An implementer could pick either. Fix: Scope says a new class used only by `MarkerControl`. Also say the `mb-3` utility on that element is removed. It is `!important` in Bootstrap, so a CSS class cannot override it, and the "padding in place of the bottom margin" step needs it gone.

2. Acceptance criterion 5 - "stays above the chart content ... below the run bar" - not observable as written.
   - The run bar sits outside `results-column` (a `position: sticky` form above `workbench-split`), so the control and run bar never overlap and no test can fail on "below the run bar".
   - "A marker label or tooltip is never drawn over the control" names no observation.
   - Fix: two checks. (a) With the column scrolled so a marker label or the chart plot lies under the control's rect, `document.elementFromPoint` at the control's centre, read in the same `evaluate` as the rects, returns the control or a descendant. (b) The help dialog (z-index 1080) is not covered by the control. Drop the run-bar clause, or restate it as "the control's z-index is below the run bar's" only if the owner wants a style check.

## Notes

- The Unverified assumptions entry is good. The hook must remove the custom property or write 0 when the control is absent, so a run without markers leaves no scroll padding. Criterion 7 covers the strip but not the padding; consider adding "no scroll-padding without markers".
- The scroll-padding hook should write to the results column only. `.column` is shared with `build-column`, so do not put the padding in the shared CSS rule unconditionally.
- Existing-test rule, Docs (lines 135, 137, 159 of `docs/aoe4-build-order-ui.md`; line 135 "the marker control below" is also worth a glance), Risk (standard is right: no criticalPaths symbol), On merge, Invariants, Diagrams, input validation and open questions are all fine. No overlap with SGS-204, SGS-205 or SGS-206 (open drafts); 206 touches the chart table, so expect a merge conflict at most, not throwaway work.
