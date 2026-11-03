# SGS-076 spec gate 1

Verdict: NEEDS_SPEC (two small gaps, both closable without the owner). Risk `low` is correct.

## Checked and fine
- Files exist: results.tsx, results.module.css (already used by step-timeline.tsx), workbench.module.css (.runBar sticky top 0, data-testid="run-bar" exists), step-timeline.tsx (step-timeline-scroll box, `mb-3`), acceptance/helpers.ts (openPage, runSimulation), docs "Page" section.
- Risk: one component, CSS and JSX only, no criticalPaths or strongModelTriggers hit. low confirmed.
- Invariants S1 ok; no open questions; no contract or dependency; no diagram trigger; no lessons conflict (repo lesson on one-evaluate layout reads is a Notes item below).
- Test rule present and correct for a layout-only change.

## Gaps
1. Scope 1, grid children - "wrap StepTimeline and the three SeriesCharts in a new div ... two-column grid" gives four or five direct children. The charts would auto-place into columns by order, and `StepTimeline` returns `null` when `rows.length === 0` (step-timeline.tsx line 18), which would shove the first chart into the 40% left column. An implementer must guess the structure. Fix: say the split div has exactly two child wrappers (timeline column, charts column) that always render; the sticky and max-height rules go on the timeline column wrapper (with `align-self: start`, needed for sticky in a grid) and `min-width: 0` on the charts wrapper. Also say where overflow-y: auto lives (the column wrapper; the inner `step-timeline-scroll` keeps its overflow-x box).
2. Scope 1, sticky offset - "top: the run bar's height" has no value. The run bar is `flex-wrap` with `py-2 mb-3` and its height is not a CSS constant; pure CSS cannot read it. The page already measures it in JS (pages/apps/aoe4-build-order.tsx lines 138-144, `runBar.current.getBoundingClientRect().height`). Fix: pick one. Either a fixed CSS value valid at 1200 px and wider (state it, e.g. a rem constant plus a note that the bar is one row there, and the criterion 2 test verifies it), or a CSS variable set from the existing measurement. The acceptance check (timeline top at or below `run-bar` bottom) then has a defined pass condition.

## Notes
- The Playwright spec should read all rects in a single `page.evaluate` or wrap in `expect.poll` (repo LESSONS.md); Scope 4 says `boundingBox()`, which that lesson warns against for sequential reads. Reword Scope 4 to "read rects in one evaluate/poll", and use `getByTestId('run-bar')` for the run bar.
- Scope 4 scroll step: say how to scroll (e.g. `scrollIntoViewIfNeeded` on `chart-floating-resources`) and that the expectation is polled, since Bootstrap smooth scrolling is on.
- Scope 1 says "results.module.css class" while results.tsx currently imports only workbench.module.css; note the second import (or put the class in workbench.module.css).
- Criterion 5 ("no `aria-*` or `data-*` added") conflicts slightly with adding `data-testid="results-split"`; it says "only results-split is added", so fine, but the two column wrappers must carry no test ids.
- Criteria are otherwise observable. "No INVARIANTS.md regressions" is boilerplate but acceptable.
