# SGS-149 spec gate 3

Verdict: NEEDS_SPEC (1 gap, not owner-only). Gate-2's gap (last chart's handle index -1 passing vacuously) is closed in wording: Scope item 3 now requires both indexes >= 0 and a walk that continues until the last chart's handle and caret are seen. The new end condition creates a new gap. Risk low stays right. Items 1 and 2 and the other checks are unchanged from gate 2 and still hold.

Read at origin/main after `git fetch origin`: `acceptance/aoe4-split-tab-order.spec.ts`.

## Gap

1. Scope item 3 and criterion 7 (missing stop must fail through the presence assertion) - the walk's new end condition has no stated behavior when the last chart's handle or caret never appears. Today `walk` throws `the caret of <last> was not reached in 150 presses` when its end stop never arrives. If the end condition is "both the last chart's handle and caret seen", then removing the last chart's handle stop (criterion 7) makes the walk run to MAX_PRESSES and throw that error. The spec then fails through `walk`, not through 'every chart section has a handle stop'. Criterion 7 therefore cannot hold, or an implementer guesses (return stops on exhaustion, stop on leaving the section, or keep the throw). A related ambiguity: `expectChartControlsOrder` already asserts `${chart} has a caret stop` inside its per-chart loop. With a chart section removed, that assertion fires before a "chart-rendered" assertion that Scope says goes "after the order assertions". Scope does not say where the rendered assertion sits relative to it. Also, the rendered assertion is only named for the walk's setup; test 1 never calls `expectChartControlsOrder`, so it is unclear which test(s) carry it.
   Proposed fix: state in Scope that the walk ends as soon as the last chart's handle and caret have both been seen, or focus has left the last chart's section, or MAX_PRESSES is reached. On either of the last two it returns the collected stops instead of throwing, so a missing stop is reported by the presence assertion. State that the "every chart is rendered" assertion runs after the order assertions and before the per-chart `has a caret stop` check (or that the missing-section criterion is satisfied by either named assertion), and name which tests include it.

## Notes

- The walk as written still requires `lastChart` not to assert count. That part is clear and testable by the column-swap criterion.
- Criterion 6 (handle-before-caret for the last chart) is now achievable once the gap above is fixed.
- No new overlap with open tickets, no doc impact, and Unverified assumptions: none is still right.
