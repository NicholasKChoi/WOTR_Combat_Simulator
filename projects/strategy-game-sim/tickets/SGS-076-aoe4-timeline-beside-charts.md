# SGS-076: Show the step timeline beside the charts on wide screens

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none yet (owner request 2026-11-02; not part of M4, whose criteria are all done)
- **Priority**: medium
- **Risk**: low
  <!-- One component, CSS module, JSX wrappers and one page effect, plus one Playwright spec; no route, schema,
       engine or other public surface; no adjacent invariant; no business logic. -->
- **Invariants**: none adjacent (S1 holds: styles stay inside `components/apps/aoe4-build-order/`, and the CSS variable
  is set on the page's own `section`, not on `document.documentElement`)
- **LOC estimate**: about 40 lines, none of it business logic (`results.tsx` two column wrappers about 8,
  `workbench.module.css` about 20, the run-bar height effect and section ref in `pages/apps/aoe4-build-order.tsx` about 10;
  specs not counted)
- **Depends on**: none (SGS-069, SGS-070, SGS-073 are integrated on main `ee7ecb9`)
- **On merge**: none
- **Source**: owner request in chat 2026-11-02: "make the timeline render side by side with the graphs on certain screen widths ... this will improve the ability to understand how different build changes affect the graphs"

## Context

On the Results tab, `Results` (`components/apps/aoe4-build-order/results.tsx`) stacks everything in one column:
stale notice, warnings, info list, the step timeline (`step-timeline-scroll`), then the charts
(`chart-units-produced`, `chart-gather-rates`, `chart-floating-resources`, each 360 px tall). To relate a step's
start or finish time to a bend in a chart, the user has to scroll between the timeline and the charts. On a wide
screen there is room to put the timeline in a column next to the charts so both stay visible while tweaking a build
and re-running.

## Scope

All paths are relative to the repo root and under `components/apps/aoe4-build-order/` unless stated.

**1. Markup (respec 1).** In `results.tsx`, `Results` wraps the timeline and the charts in a new `div` with
`data-testid="results-split"` and class `styles.resultsSplit`. That div has exactly two child elements, both always
rendered (also when `StepTimeline` returns `null` for an empty `steps`), and neither carries a test id or any other
attribute besides `className`:
- the timeline column, class `styles.timelineColumn`, holding only `<StepTimeline .../>`;
- the charts column, class `styles.chartsColumn`, holding every `SeriesChart` that `Results` renders, in their
  current order (a chart a sibling ticket adds goes in this column too).

The stale notice, warnings and info list stay above the split div, full width, unchanged.

**2. CSS (respec 1).** The three classes go in `workbench.module.css`, which `results.tsx` already imports as
`styles` (no second import). They sit next to `.runBar` because the timeline's sticky offset is the run bar's height.
Every rule for them is inside `@media (min-width: 1200px)` (Bootstrap `xl`, where the page `container` is 1140 px);
below 1200 px the three classes have no rules, so the wrappers are plain blocks.
- `.resultsSplit`: `display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);` plus a column gap
  (`gap: 1rem`).
- `.timelineColumn`: `position: sticky; top: var(--run-bar-height, 0px); align-self: start;`
  `max-height: calc(100vh - var(--run-bar-height, 0px)); overflow-y: auto;`. `align-self: start` is required: a
  stretched grid item is as tall as its row and never sticks. The column scrolls vertically; the inner
  `step-timeline-scroll` box keeps its own `overflow-x: auto` (`results.module.css` `.scrollBox`) and the table keeps
  `min-width: 30rem` (`.scrolledTable`), so a table wider than the column scrolls sideways inside that box, not the
  page.
- `.chartsColumn`: `min-width: 0`, so each chart's `ResponsiveContainer` shrinks to the column.

**3. Sticky offset from the measured run bar (respec 1).** The offset is a CSS variable, not a fixed rem value: the
run bar (`build-input.tsx` `BuildInput`, `data-testid="run-bar"`, `d-flex flex-wrap ... py-2 mb-3`) wraps onto more
rows when its content does not fit one row (a longer prebuilt build name widens the select), so no constant holds.
In `pages/apps/aoe4-build-order.tsx` `AoE4BuildOrder`:
- add a ref to the page's `section` element;
- add a `useEffect` (empty deps) that creates a `ResizeObserver` on `runBar.current` and, on each callback, sets
  `--run-bar-height` on that section's `style` to `${runBar.current.getBoundingClientRect().height}px`, the same
  measurement the two existing `scrollMarginTop` effects use (border-box height; do not use the observer entry's
  `contentRect`, which leaves out the padding and border). The cleanup disconnects the observer.

The two existing `scrollMarginTop` effects are left as they are.

**4. Below 1200 px nothing changes.** The order (timeline, then charts) and every existing style are as on main. The
390 px rule of SGS-073 (`document.documentElement.scrollWidth <= 390`) still holds.

**5. Pinned runs.** With a pin, the charts' dashed pinned series and the `ComparePanel` (above `Results`, in the page)
are unchanged; the compare panel stays full width above the split.

**6. New Playwright spec (respec 1).** `acceptance/aoe4-results-split.spec.ts`, using `openPage`, `runSimulation` and
`showTab` from `acceptance/helpers.ts`: run the default build with duration 200, then `showTab(page, 'results')`.
Every layout check reads all the rects it compares inside one `page.evaluate` (look elements up by
`[data-testid=...]`, read `getBoundingClientRect()`), and wraps that evaluate in `expect.poll` (Bootstrap's
`scroll-behavior: smooth` and recharts redraws move elements between reads). Never compare two `boundingBox()` calls.
The run bar is `[data-testid="run-bar"]` in the evaluate and `page.getByTestId('run-bar')` elsewhere. Cases:
- **side by side, 1280x800**: `step-timeline-scroll`'s right edge is at or left of `chart-units-produced`'s left
  edge, and their top edges differ by at most 40 px. Catches: a split that does not apply at 1280 px, or charts
  auto-placed into the timeline column.
- **sticky below the run bar, 1280x800**: scroll with
  `page.getByTestId('chart-floating-resources').evaluate((el) => el.scrollIntoView({ block: 'end', behavior: 'instant' }))`,
  then poll until all hold: `chart-units-produced`'s top is above the run bar's bottom (the page has scrolled past the
  top of the split), and `step-timeline-scroll`'s top is at or below the run bar's bottom and at most 1 px below it
  (`barBottom - 1 <= timelineTop <= barBottom + 1`, the 1 px allowing for subpixel rounding). Catches: no `sticky`
  (the timeline scrolls off above the bar), `top: 0` (the timeline sits under the bar), or a missing
  `align-self: start` (the column never sticks).
- **sticky below a wrapped run bar, 1280x800**: after the previous scroll, append to the run bar a child
  `div` with inline style `flex: 0 0 100%; height: 3rem` (the run bar is a wrapping flex row, so this pushes it onto
  a second row, as a longer build name or a narrower screen would), then poll the same condition against the new
  run-bar bottom. Catches: a fixed rem offset, or a height measured once on mount and never updated.
- **stacked, 1024x768**: `step-timeline-scroll`'s bottom edge is at or above `chart-units-produced`'s top edge.
  Catches: the grid applying below 1200 px.
- **no sideways page scroll, 1280x800**: `document.documentElement.scrollWidth <= 1280` (polled).

**7. Existing test that asserts the old wide layout.** `acceptance/aoe4-narrow-layout.spec.ts`, describe
"AoE4 build order at a 1280 px screen", test "the timeline and compare tables fit their boxes" asserts
`scrollWidth <= clientWidth` for both `step-timeline-scroll` and `compare-scroll` at 1280x720. At 1280 px the
timeline column is narrower than the table's 30rem minimum, so by design the timeline now scrolls sideways inside
its box and this assertion fails for `step-timeline-scroll` (confirmed against a prototype of this Scope on main
`ee7ecb9`: it was the only failure in the AoE4 page specs). Edit that test: `compare-scroll` keeps the
`scrollWidth <= clientWidth` check at 1280x720; the `step-timeline-scroll` check moves to a 1024x768 viewport, where
the timeline is stacked full width as before. All 390 px tests in that file stay unchanged.

**8. Docs.** `docs/aoe4-build-order.md`, section "Page":
- after the "Narrow layout" paragraph, a sentence: at 1200 px and wider the step timeline sits in a column to the left
  of the charts and stays on screen just below the run bar while the charts scroll; it scrolls vertically inside that
  column, and sideways inside its own box when the table is wider than the column;
- the paragraph starting "A step timeline sits above the charts and below the message lists" gets
  "(beside them at 1200 px and wider)" after "above the charts", so it no longer contradicts the wide layout.

**Test rule:** apart from Scope 7, this ticket changes only layout, so no other existing test's expected value
changes. If another existing spec breaks on element order or position (a sibling ticket may add one first), a test of
the timeline or chart position at 1200 px or wider gets the new expected position; any other test keeps its expected
value and pins a viewport below 1200 px in its setup. The implementer lists every test it edits.

**Out of scope:** changing the page `container` to full width; a user toggle for the layout; linking timeline rows to
chart markers (hover or click highlighting); moving the compare panel or message lists into a column; reusing
`--run-bar-height` in the existing `scrollMarginTop` effects; any change to the timeline columns, chart content, test
ids other than the new `results-split`, simulation or API.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `results-split` has exactly two element children (timeline column, charts column), both present on a result
  with empty `steps`, and neither has a `data-testid`. (respec 1)
- [ ] At 1280x800 on the Results tab, `step-timeline-scroll` is left of `chart-units-produced` with tops within 40 px
  (spec case "side by side"). (respec 1)
- [ ] At 1280x800, scrolled with `scrollIntoView({ block: 'end', behavior: 'instant' })` on `chart-floating-resources`,
  a polled single-evaluate read gives `barBottom - 1 <= timelineTop <= barBottom + 1` and `chart-units-produced` top
  above `barBottom`; removing `position: sticky` or replacing the offset with `top: 0` fails this case. (respec 1)
- [ ] After a `flex: 0 0 100%; height: 3rem` child is appended to `run-bar`, the same condition holds against the new,
  taller run-bar bottom; a fixed rem offset fails this case. (respec 1)
- [ ] At 1024x768 the timeline is above the charts, as on main.
- [ ] At 1280x800 `document.documentElement.scrollWidth <= 1280`.
- [ ] The new spec reads layout rects only inside `page.evaluate` wrapped in `expect.poll`; it has no `boundingBox()`
  call. (respec 1)
- [ ] `acceptance/aoe4-narrow-layout.spec.ts`: the 390 px tests are unchanged and pass; the 1280 px test checks
  `compare-scroll` at 1280x720 and `step-timeline-scroll` at 1024x768, as in Scope 7. (respec 1)
- [ ] No existing `data-testid`, `id`, `aria-*` or `data-*` attribute is added, removed or renamed; only `results-split`
  is added.
- [ ] The full existing acceptance and unit suites pass; every existing test edited is listed in the PR.
- [ ] `docs/aoe4-build-order.md` "Page" describes the wide layout, and its step timeline paragraph no longer says only
  "above the charts". (respec 1)
- [ ] No INVARIANTS.md regressions

## Open questions

None. Defaults chosen: 1200 px breakpoint (Bootstrap `xl`), 2:3 column split, sticky timeline. The owner can change
any of these at review.

## Re-spec 2026-11-03

- Underspecified: the grid children (four or five auto-placed items, and `StepTimeline` can render `null`), the sticky
  offset value, how the spec reads rects and scrolls, and where the CSS lives; the "narrow-layout spec passes
  unchanged" criterion contradicted Scope (at 1280 px the timeline box is narrower than its table).
- Changed: two always-rendered column wrappers without test ids; `--run-bar-height` set by a `ResizeObserver` on the
  run bar onto the page `section`; classes in `workbench.module.css`; spec cases with polled single-evaluate reads,
  an instant `scrollIntoView`, a wrapped-run-bar case and the 1 px pass condition; the 1280 px narrow-layout test
  edit; the second docs sentence.
- Branch work: none (branch not yet created).
