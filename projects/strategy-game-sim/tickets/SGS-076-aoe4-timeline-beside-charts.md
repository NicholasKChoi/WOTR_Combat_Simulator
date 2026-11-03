# SGS-076: Show the step timeline beside the charts on wide screens

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none yet (owner request 2026-11-02; not part of M4, whose criteria are all done)
- **Priority**: medium
- **Risk**: low
  <!-- One component, CSS module and JSX wrapper changes plus one Playwright spec; no route, schema, engine or
       other public surface; no adjacent invariant; no business logic. -->
- **Invariants**: none adjacent (S1 holds: styles stay inside `components/apps/aoe4-build-order/`)
- **LOC estimate**: about 40 lines, none of it business logic (a two-column wrapper in `results.tsx` about 15 lines, `results.module.css` about 25 lines; the spec is not counted)
- **Depends on**: none (SGS-069, SGS-070, SGS-073 are integrated on main `ee7ecb9`)
- **On merge**: none
- **Source**: owner request in chat 2026-11-02: "make the timeline render side by side with the graphs on certain screen widths ... this will improve the ability to understand how different build changes affect the graphs"

## Context

On the Results tab, `Results` (`components/apps/aoe4-build-order/results.tsx`) stacks everything in one column:
stale notice, warnings, info list, the step timeline (`step-timeline-scroll`), then the three charts
(`chart-units-produced`, `chart-gather-rates`, `chart-floating-resources`, each 360 px tall). To relate a step's
start or finish time to a bend in a chart, the user has to scroll between the timeline and the charts. On a wide
screen there is room to put the timeline in a column next to the charts so both stay visible while tweaking a build
and re-running.

## Scope

All paths are relative to the repo root and under `components/apps/aoe4-build-order/` unless stated.

**1. Two-column layout at 1200 px and wider.** In `results.tsx`, wrap `StepTimeline` and the three `SeriesChart`s in
a new `div` with `data-testid="results-split"` and a `results.module.css` class. The stale notice, warnings and info
list stay above it, full width, unchanged. At a viewport of 1200 px and wider (Bootstrap `xl`, where the page
`container` is 1140 px; use `@media (min-width: 1200px)`), the wrapper is a two-column grid:
- left column: the step timeline, with `position: sticky; top:` the run bar's height (the run bar is already
  `position: sticky; top: 0` from SGS-073, so the timeline must sit below it, not under it) and
  `max-height: calc(100vh - <that offset>)` with `overflow-y: auto`, so it stays on screen while the charts scroll;
- right column: the three charts stacked as today, `min-width: 0` so `ResponsiveContainer` shrinks to the column.
- Column widths: timeline about 40%, charts about 60% (`grid-template-columns: minmax(0, 2fr) minmax(0, 3fr)`).
  The timeline table keeps `min-width: 30rem` and its own `overflow-x: auto` box (SGS-073), so if the left column is
  narrower than 30rem the table scrolls inside its box.

**2. Below 1200 px nothing changes.** The wrapper is a plain block; the order (timeline, then charts) and every
existing style are as on main. The 390 px rule of SGS-073 (`document.documentElement.scrollWidth <= 390`) still holds.

**3. Pinned runs.** With a pin, the charts' dashed pinned series and the `ComparePanel` (above `Results`, in the page)
are unchanged; the compare panel stays full width above the split.

**4. Playwright check.** New `acceptance/aoe4-results-split.spec.ts`, using `openPage` and `runSimulation` from
`acceptance/helpers.ts`, run the default build (200), click `tab-results`, then:
- At 1280x800: the `step-timeline-scroll` box's right edge is left of the `chart-units-produced` box's left edge
  (`boundingBox()`), and the two boxes' top edges are within 40 px of each other.
- At 1280x800, after scrolling the page so `chart-floating-resources` is in view, `step-timeline-scroll` is still in
  the viewport (sticky) and not covered by the run bar (its top is at or below the run bar's bottom).
- At 1024x768: `step-timeline-scroll`'s bottom edge is above `chart-units-produced`'s top edge (stacked, as today).
- At 1280x800: `document.documentElement.scrollWidth <= 1280`.

**5. Docs.** `docs/aoe4-build-order.md` section "Page": one sentence that at 1200 px and wider the step timeline sits
beside the charts and stays on screen while they scroll.

**Test rule:** this ticket changes only layout, so no existing test's expected value changes. If an existing spec
breaks on element order or position, the implementer repoints it and lists the edit.

**Out of scope:** changing the page `container` to full width; a user toggle for the layout; linking timeline rows to
chart markers (hover or click highlighting); moving the compare panel or message lists into a column; any change to
the timeline columns, chart content, test ids other than the new `results-split`, simulation or API.

## Diagrams

Single-component layout change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At 1280x800 on the Results tab, `step-timeline-scroll` is left of `chart-units-produced` with tops within 40 px.
- [ ] At 1280x800, scrolled to `chart-floating-resources`, `step-timeline-scroll` is visible and below the run bar.
- [ ] At 1024x768 the timeline is above the charts, as on main.
- [ ] `acceptance/aoe4-narrow-layout.spec.ts` still passes unchanged (390 px rule holds).
- [ ] No existing `data-testid`, `id`, `aria-*` or `data-*` attribute is added, removed or renamed; only `results-split` is added.
- [ ] The full existing acceptance and unit suites pass; every existing test edited is listed in the PR.
- [ ] `docs/aoe4-build-order.md` "Page" describes the wide layout.
- [ ] No INVARIANTS.md regressions

## Open questions

None. Defaults chosen: 1200 px breakpoint (Bootstrap `xl`), 2:3 column split, sticky timeline. The owner can change
any of these at spec gate.
