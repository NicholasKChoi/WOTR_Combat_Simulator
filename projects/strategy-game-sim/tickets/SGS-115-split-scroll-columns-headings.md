# SGS-115: Scroll the build and results columns separately and make the headings consistent

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M8 / M8.3, M8.9 (scrolling layout doc, split-scroll spec)
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none
- **LOC estimate**: 80 (`use-run-bar-height.ts` about 25, `workbench-tabs.tsx` and `workbench.module.css` about 20, page, `build-input.tsx` and `build-text-editor.tsx` about 25; business logic only)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M8.md C11 (Split layout) and the "Layout, legend and step table" table; MILESTONES.md M8.3 and M8.9

## Context

In the split layout (1200 px and wider) the page scrolls as a whole, so hovering a step row far down the build
column shades a chart that has scrolled out of view. M8.3 makes the Build and Results columns scroll separately
inside a viewport-high area below the run bar, and makes the headings consistent (today Results is a bare `h2`,
the build side has no heading, and the editor has its own visible `Build order` label).

## Scope

Names follow design/M8.md C11. All paths are under `components/apps/aoe4-build-order/` unless given.

- **`use-run-bar-height.ts` (new).** Exports `useRunBarHeight(ref: RefObject<HTMLElement | null>): void`. In an
  effect it takes `ref.current` (a null `current` is a no-op) and the element's `closest('section')` (the page's
  `<section class="container ...">`). It writes `--aoe4-run-bar-height` with `style.setProperty` on that section as
  `` `${Math.ceil(form.getBoundingClientRect().height)}px` `` once on mount and on every `ResizeObserver` callback
  for the form. Cleanup disconnects the observer and calls `removeProperty`. No section or no `ResizeObserver`:
  nothing is written, and the CSS fallback `0px` applies. The hook runs in every view; only the split layout
  reads the value. Cleanup follows the existing `useSplitLayout` hook (`use-split-layout.ts`) in style.
- **`build-input.tsx`.** `BuildInput` gains the prop `runBarRef: RefObject<HTMLFormElement | null>`, set as `ref` on its
  `<form data-testid="run-bar">`.
- **`pages/apps/aoe4-build-order.tsx`.** Creates `const runBarRef = useRef<HTMLFormElement>(null)`, passes it to
  `BuildInput`, and calls `useRunBarHeight(runBarRef)`. The page renders
  `<h2 className="h4" id="build-order-heading" data-testid="build-order-heading">Build order</h2>` as the first child
  of the `build` node it passes to `WorkbenchTabs`, above the editor, the step table or `step-table-unavailable`, so
  it shows in both editor views, inside `panel-build` in the tabs layout and inside the build column in the split
  layout. The existing results `<h2 className="border-bottom">Results</h2>` becomes
  `<h2 className="h4 border-bottom" data-testid="results-heading">Results</h2>`, still the first child of the
  `results` node. Chart titles stay `h3.h5` and legend headings stay `h4.h6` (untouched).
- **`build-text-editor.tsx`.** Delete the visible `<label htmlFor="build-order-text">Build order</label>`. The
  component gains the required prop `labelledBy: string`, set as `aria-labelledby` on the textarea; the page passes
  `'build-order-heading'`. The textarea's accessible name stays "Build order" and the text shows once.
  `StepKindLegend` stays where it is, under the heading.
- **`workbench-tabs.tsx` and `workbench.module.css`.** `WorkbenchTabs` wraps each panel (`panel-build`,
  `panel-results`) in a column `div`. The wrapper is rendered in both layouts so a layout switch never remounts the
  panels (an existing guarantee: editor focus, an uncommitted table cell and chart state survive a resize); only
  in the split layout does it carry `data-testid="build-column"` / `data-testid="results-column"` and the column
  class. `panel-build` and `panel-results` keep their current test ids, roles and `hidden` rules. In
  `workbench.module.css`, `.workbenchSplit` gets `height: calc(100dvh - var(--aoe4-run-bar-height, 0px))` with the
  grid rows bounded to that height (`minmax(0, 1fr)`; today `align-items: start` lets the columns grow), and the
  column class gets `overflow-y: auto; min-height: 0; overscroll-behavior: contain`. Below 1200 px nothing changes:
  tabs, and the page scrolls.
- **Docs.** `docs/aoe4-build-order.md`, "Page" section (the paragraph that begins "The page is
  `/apps/aoe4-build-order`"): state that at 1200 px and wider the two columns fill the viewport below the run bar and
  each scrolls on its own, that the page does not scroll to reach either column's content, and that the two
  columns and the tabs carry the headings `Build order` and `Results` at the same size. Fix the sentences this
  makes untrue, found by grepping the section for "page scrolls", "two equal columns" and "never scrolls
  vertically": the run-bar sentence, which says the bar stays at the top "while the page scrolls" and holds in the
  split layout only as far as the page still scrolls above the columns, and the editor sentence, whose text view
  "never scrolls vertically" must say the textarea does not (its column does). Docs describe the rules, not
  measurements.
- **Acceptance.** New `acceptance/aoe4-split-scroll.spec.ts` (uses `SPLIT_VIEWPORT` and `WIDE_VIEWPORT` from
  `acceptance/helpers.ts`; every rect read in one `page.evaluate` or under `expect.poll`, per LESSONS). Existing
  specs that look at layout stay valid; any test of the old layout (the page scrolling to reach the results, a
  panel's height) is changed to the new rule, and the implementer lists every test it edits.

**Out of scope:** per-chart collapse and reorder, the legend, step-table and run-cell polish, the library select
and save panel (other M8 tickets that touch the same files in different hunks); the breakpoint (stays 1200 px); the
tabs layout's behavior; `StepKindLegend` placement; Tab-order coverage of the split layout (backlog).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At `SPLIT_VIEWPORT` (and again at `WIDE_VIEWPORT`), with a result shown and the page scrolled to its end so the
  run bar is stuck, `workbench-split`'s top equals the run bar's bottom (within 1 px) and its bottom is at most
  `innerHeight`. Pinned by `aoe4-split-scroll.spec.ts`; it fails if the `height` rule or the custom property is removed.
- [ ] Each column scrolls itself: with a build long enough that `build-column` has `scrollHeight > clientHeight`
  (the test asserts this first), scrolling `build-column` changes its `scrollTop` and leaves `window.scrollY` and
  `results-column.scrollTop` unchanged; the same for `results-column` with `build-column.scrollTop` unchanged. It
  fails if either column loses `overflow-y: auto` or `min-height: 0`.
- [ ] Hover still shades charts: with the long build's last step row's annotation (`build-order-line-annotation`)
  scrolled into view in the build column and hovered, at least one `chart-step-band` is shown in a results chart that
  is within the viewport. It fails if the columns stop scrolling separately and the chart is off screen.
- [ ] The run bar height follows its content. In one `page.evaluate`, the run bar's rect height and the
  `--aoe4-run-bar-height` value of `getComputedStyle(workbench-split)` agree within 1 px, before and after a change
  that grows the bar (an invalid duration that shows `duration-error`, or a narrower viewport that wraps it). The
  test asserts the bar's height did change. It fails if the observer is not re-armed or the value is written once only.
- [ ] Below 1200 px the page uses the tabs layout, `build-column` and `results-column` do not exist, and the page
  scrolls (the document's `scrollHeight` exceeds `innerHeight` with a result shown); the existing
  `aoe4-split-layout` and `aoe4-small-screen` specs keep passing, including the layout round trips that keep editor
  focus, the pin and an uncommitted table cell (no panel remounts).
- [ ] The textarea's accessible name is "Build order" (`getByRole('textbox', { name: 'Build order' })` finds
  `build-order-text`) through `aria-labelledby="build-order-heading"`, and the text "Build order" is shown once as a
  heading in each of: split text view, split table view, tabs Build panel. `git grep 'htmlFor="build-order-text"' -- components pages`
  finds nothing.
- [ ] `build-order-heading` is the first element of `panel-build` in every view, including `step-table-unavailable`
  (an unparseable text shown in the table view), and `results-heading` is the first element of `panel-results`.
- [ ] The computed font size of `build-order-heading` equals that of `results-heading` in both the split and the
  tabs layout, and every chart title (`h3`) has the same computed font size as the others. It fails if either `h2`
  loses the `h4` class.
- [ ] `use-run-bar-height.ts` writes nothing and does not throw when `ref.current` is null or `ResizeObserver` is
  missing (checked by reading, as the unit environment has no DOM; the implementer notes it in the report).
- [ ] `docs/aoe4-build-order.md` "Page" describes the separately scrolling columns and the two headings, and no
  sentence in that section still says the page scrolls to reach a column's content or that the text view's box
  scrolls vertically.
- [ ] `npx tsc --noEmit`, `npm run lint:dup`, `npm test` and the acceptance specs `aoe4-split-scroll`,
  `aoe4-split-layout`, `aoe4-small-screen` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none
