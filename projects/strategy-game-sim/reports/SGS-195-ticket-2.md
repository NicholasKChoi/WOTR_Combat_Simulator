# SGS-195 ticket 2 (re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-195-one-marker-control-for-every-chart.md

## Summary

This is the SGS-195 re-spec for "Add one shared marker control for every chart" (aoe4-build-order, about 150 LOC, depends on SGS-194). Both acceptance findings now appear in Scope and criteria as test-only changes. I read both specs at branch tip d570df7.

1. `acceptance/aoe4-chart-layout.spec.ts`, the first/last-chart arrow-key loop. The test places the handle with `scrollIntoView({ block: 'start' })`. On the shorter page that clamps to the column's maximum scroll, so `before.top < before.max` fails. I decided this without the owner: only the handle placement changes. The column must have scroll room above and below the handle whatever content follows the last chart. Examples: end alignment, or a computed position inside (0, max). Both precondition assertions stay, so a scroll in either direction is still caught, and every assertion after the key press keeps its value. Nothing the test proves gets weaker.
2. `acceptance/aoe4-split-scroll.spec.ts`, "the headings share a size and lead their panels". The query is scoped to the headings inside `chart-table`. The chart titles are `th > h3` in each chart `tbody`; the `Markers` heading and the compare-panel `h3` sit outside it. The same-size check is unchanged, and the `Markers` `h3`/`h6` markup stays.

Criteria: the old "pass with no changed assertion" criterion now covers only readability, step-band, pin-compare and the doc check. Two new `(respec 1)` criteria cover chart-layout (no assertion removed or loosened; it fails on any scroll, move, announcement, store or focus change) and split-scroll (reads only chart titles; it fails if two chart titles differ in size). Scope also tells the implementer to search for other tests that read every page heading or need scroll room below the last chart. I ran no browser tests, because acceptance runs belong to the acceptance-test agent.

Still stands: all production code at d570df7, the rewritten marker-labels spec, the unit tests and the doc edit.

Diagrams: none (single component, no diagram required).
Open questions: none.
Overlap: none found.
Lint: `ticket-lint.py` is clean.
Scratch checkout: none made.
