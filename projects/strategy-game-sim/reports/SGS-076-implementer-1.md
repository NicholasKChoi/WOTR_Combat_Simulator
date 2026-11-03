# SGS-076 implementer 1

(The implementer wrote only a stub here; the manager transcribed its handback.)

Status: needs_review. Branch sgs-076-aoe4-timeline-beside-charts, tip 5d97714 (one commit on ee7ecb9, authored choinickolas@gmail.com). Worktree: .claude/code-factory/worktrees/sgs-076-aoe4-timeline-beside-charts.

## Files touched
- components/apps/aoe4-build-order/results.tsx: `results-split` div with two always-rendered columns; `timelineColumn` holds only `StepTimeline`, `chartsColumn` holds the three charts in their old order.
- components/apps/aoe4-build-order/workbench.module.css: the three classes, all inside `@media (min-width: 1200px)`, after `.runBar`.
- pages/apps/aoe4-build-order.tsx: `pageSection` ref on the `section`; a `ResizeObserver` effect on the run bar sets `--run-bar-height` from `getBoundingClientRect().height` and disconnects on cleanup. The two `scrollMarginTop` effects are untouched.
- acceptance/aoe4-results-split.spec.ts (new): 5 cases (side by side, sticky, sticky after the run bar wraps, stacked at 1024, no sideways scroll). Rects are read in one `page.evaluate` inside `expect.poll`; no `boundingBox()`.
- acceptance/aoe4-narrow-layout.spec.ts: edited per Scope 7.
- docs/aoe4-build-order.md: wide-layout sentence after "Narrow layout"; "(beside them at 1200 px and wider)" in the step timeline paragraph.

## Pre-existing test edited
acceptance/aoe4-narrow-layout.spec.ts, "AoE4 build order at a 1280 px screen" > "the timeline and compare tables fit their boxes" is now "the compare table fits its box" (checks `compare-scroll` at 1280x720). The `step-timeline-scroll` check moved to a new describe at 1024x768, "the stacked timeline fits its box". The 390 px tests are unchanged.

## Tests
- New spec: 5 passing. Narrow-layout spec: the 5 original 390 px tests plus the 2 edited ones pass.
- Unit `npm test`: 1307 passed, 10 skipped. Full `npm run acceptance`: 696 passed.

## Mutation checks (each undone)
- Removing `position: sticky`: the sticky and wrapped-bar cases fail.
- Offset `top: 0`: the same two cases fail.
- No `observer.observe(bar)`: the same two cases fail.
- Media query lowered to 900 px: the stacked-at-1024 case fails.
- Removing `align-self: start`: no case fails, because `max-height` caps the item and it still sticks. The property is kept because Scope requires it. The criterion that says its absence fails the spec is not reproducible.

## Doc claims
- "At 1200 px and wider the step timeline sits in a column to the left of the charts and stays on screen just below the run bar while the charts scroll; it scrolls vertically inside that column, and sideways inside its own box when the table is wider than the column." Backed by workbench.module.css and the spec cases.
- "(beside them at 1200 px and wider)". Backed by the `@media (min-width: 1200px)` grid.

## Build, lint, codegen
`npx next build` passed; `npx tsc --noEmit` and `npm run lint:dup` clean; no codegen. Ran on Node v22.17.0 (engines 24.x).

## Invariants
S1 holds. No `data-testid`, `id`, `aria-*` or `data-*` added or changed apart from `results-split`.

## Out of scope
None.

## Rebase onto ebc063d
- New tip: cda1497d58137f276501f0646b8f9a411c254bcf (single commit on origin/main ebc063d), Node 24.22.2.
- Conflict: results.tsx only. Kept the results-split columns and put main's `landmarks={landmarks}` prop on the `StepTimeline` inside the timeline column. docs/aoe4-build-order.md and pages/apps/aoe4-build-order.tsx auto-merged cleanly (my sentence and ref/effect only).
- Spec fix: main's timeline now has a legend row above `step-timeline-scroll`, so the scroll box sits about 54 px below the chart top and the original 40 px / sticky checks failed. The spec now uses `step-timeline-legend` (the first element of the timeline column) for the top-edge checks, and still uses `step-timeline-scroll` for right/bottom edges. Mutation re-check: `top: 0` fails 2 sticky cases.
- Results: tsc clean, lint:dup 0 clones, npm test 1318 passed / 10 skipped, full acceptance 696 passed (includes results-split, narrow-layout, timeline-compare, simulate-api-timelines).
