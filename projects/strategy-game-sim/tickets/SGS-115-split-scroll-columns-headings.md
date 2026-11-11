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
  `` `${Math.ceil(form.getBoundingClientRect().height + (parseFloat(getComputedStyle(form).marginBottom) || 0))}px` ``
  (the space the bar takes: its border box plus its bottom margin) once on mount and on every `ResizeObserver`
  callback for the form. The form keeps its `mb-3`; the margin is static, so no extra trigger watches it. Cleanup
  disconnects the observer and calls `removeProperty`. No section or no `ResizeObserver`: nothing is written, and
  the CSS fallback `0px` applies. The hook runs in every view; only the split layout reads the value. Cleanup
  follows the existing `useSplitLayout` hook (`use-split-layout.ts`) in style.
- **`saved-build-error`.** The alert the page renders between the run bar and `WorkbenchTabs` is not measured and
  does not change the split height. It is ordinary page content above the workbench (like the page `h1`): once the
  page is scrolled so the workbench sits under the stuck bar, the alert has scrolled under the bar. No code change.
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
  column class gets `overflow-y: auto; min-height: 0; overscroll-behavior: contain` plus `overflow-x: hidden`.
  `overflow-y: auto` alone computes `overflow-x` to `auto`, which would give a too-wide child a sideways column
  scrollbar; the docs promise the Build panel "never scrolls sideways" (wide content such as the step table already
  scrolls inside its own box, `step-table-scroll`, and the compare tables inside `compare-scroll`). The workbench's
  top sits one run-bar bottom margin (`mb-3`) below the stuck bar's border box, which the hook's value already
  counts, so the split's bottom is the viewport bottom. Below 1200 px nothing changes: tabs, and the page scrolls.
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
- **"each column scrolls on its own" precondition (the only remaining implementer work on branch
  `sgs-115-split-scroll`).** In `acceptance/aoe4-split-scroll.spec.ts`, the test's page-scroll precondition (today
  `await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)).toBe(true)`,
  which only proves the page has overflow) is replaced verbatim with
  `await expect.poll(() => page.evaluate(() => window.scrollY < document.documentElement.scrollHeight - window.innerHeight)).toBe(true)`,
  so the wheel runs only when the window still has room to scroll further down from where it is. Then remove
  `overscroll-behavior: contain` from `.column` in `workbench.module.css`, run the spec, confirm the test fails on
  the `window.scrollY` "unchanged" assertion, restore the CSS, and record both runs in the report. No production
  code changes.

**Out of scope:** per-chart collapse and reorder, the legend, step-table and run-cell polish, the library select
and save panel (other M8 tickets that touch the same files in different hunks); the breakpoint (stays 1200 px); the
tabs layout's behavior; `StepKindLegend` placement; Tab-order coverage of the split layout (backlog).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) At `SPLIT_VIEWPORT` (and again at `WIDE_VIEWPORT`), with a result shown, `saved-build-error` absent
  (the test asserts it has count 0), and the page scrolled to its end so the run bar is stuck, one `page.evaluate`
  reads: `workbench-split`'s top equals the run bar's border-box bottom plus the bar's computed `margin-bottom`
  (within 1 px), and its bottom equals `innerHeight` (within 1 px). Pinned by `aoe4-split-scroll.spec.ts`; it fails
  if the `height` rule or the custom property is removed, or if the hook drops the margin (the bottom then overshoots
  the viewport by the margin).
- [ ] (respec 2) Each column scrolls itself. `aoe4-split-scroll.spec.ts` "each column scrolls on its own", at
  `SPLIT_VIEWPORT` with the long build shown, for `build-column` and then `results-column`: the test asserts the
  column has `scrollHeight > clientHeight`, scrolls the column to its end and asserts its `scrollTop` is above 0, then
  asserts the page can still scroll further down from its current position
  (`window.scrollY < document.documentElement.scrollHeight - window.innerHeight`, under `expect.poll`; overflow
  alone, `scrollHeight > innerHeight`, does not satisfy this), then sends `page.mouse.wheel(0, 200)` with the
  pointer over the column and asserts `window.scrollY` and the other column's `scrollTop` did not change. It fails if
  either column loses `overflow-y: auto` or `min-height: 0`, and it fails (on the `window.scrollY` assertion) when
  `overscroll-behavior: contain` is removed from `.column` in `workbench.module.css`; the implementer runs that
  mutation, restores the CSS and records the failing output in the report.
- [ ] Hover still shades charts: with the long build's last step row's annotation (`build-order-line-annotation`)
  scrolled into view in the build column and hovered, at least one `chart-step-band` is shown in a results chart that
  is within the viewport. It fails if the columns stop scrolling separately and the chart is off screen.
- [ ] (respec 1) The run bar height follows its content. At `SPLIT_VIEWPORT`, in one `page.evaluate`, the run bar's
  rect height plus its computed `margin-bottom` and the `--aoe4-run-bar-height` value of
  `getComputedStyle(workbench-split)` agree within 1 px, before and after an invalid duration that shows
  `duration-error` grows the bar. The test asserts the bar's rect height did change. It fails if the observer is not
  re-armed or the value is written once only.
- [ ] (respec 1) At `SPLIT_VIEWPORT`, with the long build shown in the table view, `build-column` and
  `results-column` have computed `overflow-x` `hidden`, and `build-column`'s `scrollWidth` does not exceed its
  `clientWidth` (nothing is clipped; wide content scrolls in `step-table-scroll`). It fails if the column class
  loses `overflow-x: hidden` (computed value becomes `auto`).
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

## Re-spec 1 - 2026-11-10

- Underspecified: the run bar's `mb-3` margin was not counted, so the split-height criterion could not hold, and the
  `saved-build-error` alert's effect was unstated; column `overflow-y: auto` silently made `overflow-x` `auto`.
- Changed: per revised design C11 the hook writes border box plus bottom margin; criterion 1 asserts top = bar
  bottom + margin and bottom = `innerHeight` with the alert absent; criterion 4 uses the `duration-error` route only;
  columns get `overflow-x: hidden` with a new criterion.
- Branch work: none yet; no implementation exists to keep or discard.

## Rework 1 - 2026-11-10 (review)

Review bounced at tip 3a0fc44351af4487535f58f5da3dc7f0b8e071ab (report: reports/SGS-115-review-1.md). Only gate so far.

Findings:
- `acceptance/aoe4-split-scroll.spec.ts:22-26, 69-70`: "each column scrolls on its own" sets `scrollTop` from script, which can never move `window.scrollY` or the other column, so the two "unchanged" assertions cannot fail.
- `docs/aoe4-build-order.md:851`: the sentence says the textarea's column scrolls, but below 1200 px there is no scrolling column; the page scrolls (text-fix).

Required fixes:
- [ ] In the "each column scrolls on its own" case, scroll the column to its end, assert the page can still scroll, then `page.mouse.wheel(0, 200)` over the column and assert `window.scrollY` and the other column's scrollTop did not move. Confirm it fails when `overscroll-behavior: contain` is removed from `.column` (`workbench.module.css:26`), then restore.
- [ ] `docs/aoe4-build-order.md:851` (text): replace that line verbatim with: `rows) and does not scroll vertically itself (in the side-by-side layout the Build column scrolls, below 1200 px the page does; a line longer than the box scrolls sideways), and the table view is the`

## Re-spec 2 - 2026-11-10

- Underspecified: criterion 2 and Rework 1 said only "the page can still scroll", so the test's precondition
  checked page overflow (`scrollHeight > innerHeight`), which passes with the window at its maximum `scrollY`, where
  the `window.scrollY` "unchanged" check holds whatever the CSS (review 2).
- Changed: criterion 2 (respec 2) states the precondition as room to scroll further down from the current position
  and requires a recorded failing run with `overscroll-behavior: contain` removed; Scope gives the verbatim
  replacement of the precondition line as the only remaining implementer work.
- Branch work: everything at `sgs-115-split-scroll` tip 637e1ad stands (production code, docs line 851 fix, the
  rest of the wheel-based test); only the one precondition line changes.
