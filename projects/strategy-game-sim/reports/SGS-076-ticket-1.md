# SGS-076 ticket re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-076-aoe4-timeline-beside-charts.md
Status to record: ready for spec gate (re-spec 1 done). Risk stays `low`.

## Summary

"Show the step timeline beside the charts on wide screens", component aoe4-build-order, about 40 lines (no business
logic) across `results.tsx`, `workbench.module.css` and `pages/apps/aoe4-build-order.tsx`, plus a new Playwright spec
and one edited test. No dependencies. Twelve criteria: markup structure, side by side at 1280, sticky below the run
bar, sticky below a wrapped run bar, stacked at 1024, no sideways page scroll, polled single-evaluate rect reads,
the narrow-layout spec edit, docs, suites, attributes, invariants.

## Gate gaps resolved

1. Grid structure: `results-split` has exactly two always-rendered children (`styles.timelineColumn`,
   `styles.chartsColumn`) with no test ids. Sticky, `align-self: start`, `max-height`, `overflow-y: auto` on the
   timeline column; `min-width: 0` on the charts column; all rules inside `@media (min-width: 1200px)`.
2. Sticky offset: CSS variable `--run-bar-height`, set on the page `section` by a `ResizeObserver` on the run bar
   using `getBoundingClientRect().height` (the existing measurement), so it follows a wrapping run bar. Pass
   condition: `barBottom - 1 <= timelineTop <= barBottom + 1`, plus `chart-units-produced` top above `barBottom` to prove
   the page scrolled past the split. A wrapped-run-bar case (append a `flex: 0 0 100%; height: 3rem` child) pins the
   variable updating.

Notes folded in: rects read in one `page.evaluate` inside `expect.poll`, no `boundingBox()`; scroll by
`scrollIntoView({ block: 'end', behavior: 'instant' })` then poll; classes in `workbench.module.css` (already
imported, sits beside `.runBar`).

## New finding (fixed in Scope 7)

The old criterion "aoe4-narrow-layout.spec.ts passes unchanged" contradicted Scope. Its 1280 px test
"the timeline and compare tables fit their boxes" asserts `step-timeline-scroll` `scrollWidth <= clientWidth`; in
the 2:3 split at 1280 px the timeline box is about 427 px wide and the table needs 540, so it fails. I prototyped
the Scope in a throwaway worktree on main `ee7ecb9` and ran the AoE4 page specs (aoe4-build-order*, aoe4-narrow-layout,
aoe4-step-table): 155 passed, 1 failed, that test. Scope 7 now edits it: `compare-scroll` stays checked at 1280x720,
the `step-timeline-scroll` check moves to 1024x768 (stacked). The 390 px tests are unchanged.

The prototype also passed every new spec condition: at 1280x800 both tops 838.8 and timeline right 524 < chart left
542; after scrolling, timeline top = run-bar bottom = 93.9; after the wrap, both 165.9; at 1024 timeline bottom
2578 < chart top 2597; page scrollWidth 1280. I did not run the sticky mutations (removing sticky, `top: 0`, fixed
offset); the measured numbers show each would put the timeline top above or at 0, below `barBottom - 1`.

## For the manager (not blocking)

- UX trade-off, measured on the prototype with the default build at 200 s (25 rows): the table's natural width is
  about 1090 px, so in the 427 px column (499 px at 1400 px and wider) it wraps heavily and scrolls sideways. The
  timeline grows from about 1690 px tall (stacked) to about 3440 px, viewed through a sticky column about 700 px high.
  This is what the owner asked for and the ticket's defaults (2:3 split) allow; the owner may want a wider timeline
  column or a narrower table after SGS-078 lands. Not entered as an open question.
- Diagrams: none (single-component layout change).
- Open questions: none.

## Overlap

- SGS-077 (in_progress) adds a fourth `SeriesChart` in `results.tsx`; Scope 1 puts every chart in the charts column,
  so whichever lands second rebases and the new chart goes in the charts column. `chart-floating-resources` stays
  last, so the spec's scroll target holds.
- SGS-078 (in_progress) changes the step timeline columns and colours (`step-timeline.tsx`) and likely the same docs
  paragraph; text conflict only. Its column changes may change the table's width, which the Scope 7 edit tolerates.

## Cleanup

Throwaway worktree `worktrees/ticket-SGS-076` removed; its Playwright web server exited with the run. The
`next dev -p 3502` and Playwright processes still running belong to the sgs-078 worktree, not this run.
