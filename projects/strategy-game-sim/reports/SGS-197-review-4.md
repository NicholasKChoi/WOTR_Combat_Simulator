# SGS-197 review 4 (full review)

- Branch `sgs-197-chart-zoom-pan`, tip `8a7ce31c77b54c235f3f7d1bb21c17ef6863d247`, base `origin/main` @ `22c47e0`.
- Verdict: **REQUEST CHANGES**. The production code matches the contract and I found no correctness defect. Three acceptance cases cannot fail as written, and one criterion's required "a test fails if ..." check is not met.

## Blocking findings

1. `acceptance/aoe4-chart-zoom.spec.ts:189-200` - test - "a drag across a collapsed chart leaves it unzoomed" presses at a hard-coded page point (400, 300), and that point is not on the chart. The inspection loaded the page at 1800x900 (the spec's `WIDE_VIEWPORT`), picked the Knight/Longbow build, collapsed `chart-gather-rates` and read `document.elementFromPoint(400, 300)`: it is `SELECT[data-testid=build-order-select]` in the Build column (scrollY 0). So the drag goes to the build dropdown, and no change to the chart code can make this test fail. The B-Z1 "on a collapsed chart" case is therefore untested. - Direction: press on the collapsed chart itself. After collapsing, read the RATES tbody rect in one evaluate. Take the point at 30% of its width and at its vertical middle, and in the same evaluate assert `document.elementFromPoint(x, y).closest('tbody')?.dataset.testid === 'chart-gather-rates'`. Press there, move 300 px right in steps, release, expand, then `expectUnzoomed`. Production change it fails on: `onPointerDown` moved from the `chart-plot` div (`line-chart.tsx:158`) to the `<tbody>` (`line-chart.tsx:130`), with the plot box taken from the chart width and geometry constants. The design allows that option ("left to tickets"). The box then outlives the plot, and a press on the collapsed row starts a selection. Before the fix the tbody has no `data-zoom-from`; with that break it has one.

2. `acceptance/aoe4-chart-zoom.spec.ts:589` - test - In "the window survives collapse, reorder, ...", the reorder step's check, `previousElementSibling ... not.toBeNull()`, holds before the key press. `CHART_IDS` (`chart-layout.ts:3`) puts `chart-units-produced` before `chart-gather-rates`, so the RATES tbody already has a previous sibling. If ArrowDown moved nothing, the test would still pass while claiming the window survives a reorder. - Direction: assert the previous sibling's `data-testid` is `chart-units-produced` before the press. After the press, poll until it is `chart-gathered-resources`, then call `stays()`. Production change it fails on: deleting the ArrowDown mapping in `chart-header.tsx:17`. The sibling stays `chart-units-produced` (expected `chart-gathered-resources`) instead of the test passing with no reorder.

3. `acceptance/aoe4-chart-zoom.spec.ts:381-409` and `line-chart.tsx:120` - test - Criterion B-Z7 says "A test fails if `placeMarkers` is still given the full game's `end`." No test does. If `line-chart.tsx:120` is reverted to `placeMarkers(labelled, end, plotWidth, ...)` (no origin), the spec still passes. The implementer's report says so ("The marker-label overlap check cannot distinguish..."). The unit row in `chart-markers.test.ts` covers `placeMarkers`' `origin` parameter but not this call site. The `rows === labelRows` assertion at :405 holds under that break too, because both values come from the same `placed`. - Direction: add a case with a window that has a labelled age-up just inside its right edge. Verified in the inspection: select 600 s to 790 s on `chart-gather-rates` (fractions 0.5 and 0.6583 of the 1200 s end). Castle is at 777 s, and the API result should assert first that the marker is inside the window and that `to - at <= 20`. Then, in one evaluate under `toPass`, assert that every unrotated `text.recharts-label` rect lies within the grid rect horizontally (1 px slack). Measured with the current code: at 1200 px the grid is 724-1138 and the "Castle 12:57" label is 1043-1109; at 1800 px they are 1024-1528 and 1426-1492. With the full-game end, the label fits to the right of its line and runs to about 1176 at 1200 px, past the grid right of 1138, so the test fails.

4. `acceptance/aoe4-chart-zoom.spec.ts:433-456` and `line-chart.tsx:126,197` - test - Criterion B-Z7 says "a `chart-step-band` area is clipped to the window". The spec covers only a band wholly inside the window and one wholly outside it. Partial overlap is checked only by the `bandIn` unit rows, and nothing tests the wiring. In recharts 3.10.1, `ReferenceArea` defaults to `ifOverflow: 'discard'` and drops an area with either corner outside the domain (`node_modules/recharts/lib/cartesian/ReferenceArea.js:67`). So if the call site lost the clip (`x1={highlight.from} x2={highlight.to}` at `line-chart.tsx:197`, or `const band = highlight` at :126), a band crossing the window edge would disappear from the page and every test would still pass. - Direction: in the step-band test, hover a step whose span crosses `shown.from` (assert `startedAt < shown.from < completedAt` from the API first). Assert one `chart-step-band` whose `data-from`/`data-to` are the step's own times. In one evaluate under `toPass`, assert the band rect's left is within 1 px of the grid's left and its right is within 1.5 px of `grid.left + (completedAt - shown.from) / (shown.to - shown.from) * grid.width`. Production change it fails on: `x1={highlight.from}` at `line-chart.tsx:197`. The band count goes from 1 to 0.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Select (B-Z1 to B-Z3) | **fail** | Select, the threshold, under 30 s, full game, axis, label rows, legend and middle button are tested (spec :120-187). The collapsed-chart case cannot fail (finding 1). Code: `use-chart-zoom.ts` `onPointerDown`/`onUp`. |
| Plot box (respec 1) | pass | Grid rect read at pointer down (`use-chart-zoom.ts` `latest.current.readPlot()`, `line-chart.tsx` `readGridBox`). Fractions tested at 1200 and 1800 (spec :119-137). Label-row press tested after asserting `data-label-rows != 0` (:142, :154); the implementer's mutation of `y >= plot.top` failed it. |
| Zoom in a zoomed chart (B-Z4) | pass | Spec :202-219. `timeAtX` is clamped to `startShown`. |
| Cancel (B-Z5) | pass | Spec :235-262. `finish` removes `pointerup` before release. |
| Shown range (B-Z6) | pass | Spec :322-377. Domain `[from,to]` with `allowDataOverflow` (`line-chart.tsx`), and `rowsInWindow` rows feed both recharts and `wholeNumberAxis`. See the note on the y-axis poll. |
| Markers, band, pinned (B-Z7) | **fail** | DOM filtering, the pinned legend and the inside/outside band are tested (:381-456). The required "fails if `placeMarkers` given the full game's end" check is missing (finding 3), and partial-overlap clipping is untested at the call site (finding 4). |
| Pan buttons (B-Z8) | pass | Spec :460-501. The step, span kept, both edges, `aria-disabled`, computed opacity compared with the enabled button, focus kept, Enter and Space. |
| Shift+drag (B-Z9) | pass | Spec :503-548. The direction `-(dx/width)*span` matches design B-Z9. |
| Reset (B-Z10) | pass | Spec :202-231. Focus moves to `chart-collapse` via the same tbody query pattern as `results.tsx:63`. |
| Independence (B-Z11) | pass | Spec :552-573, which first asserts that lines and markers exist. |
| Survives (B-Z12) | **fail** | Duration capping, keeping the cap and unzooming are well tested (:601-622). The reorder step's check holds before the press (finding 2). Code: render-time re-clamp stores `clampWindow(stored, end)`. |
| Reload (B-Z13) | pass | Spec :624-636. |
| Keyboard (B-Z14) | pass | Spec :640-660. `aoe4-split-tab-order.spec.ts` is not edited in the diff. |
| Dimmed results (B-Z15) | pass | Spec :662-673, which asserts opacity 0.5 first. |
| No listener outlives its drag | pass | Spec :264-318. Read against the leak cases: a leaked `pointermove`, a pan `keydown` and a `pointerup` each fail it. Collapse mid-drag is handled by `plotRef(null)` -> `finish(true)`. |
| `DRAG_THRESHOLD_PX` | pass | Exported in `chart-drag.ts:1` and imported by both hooks. The private copy is deleted and `tsc --noEmit` is clean. The listed existing specs are unedited. |
| Unzoomed chart unchanged | pass | By reading the code: unzoomed, `shown = {0,end}`, so `placeMarkers(labelled, end, ..., 0)` is identical to the base. `band = highlight`, the domain is `['dataMin','dataMax']` and `allowDataOverflow={false}`. The only change is the added `chart-plot` div. The inspection found no overflow or overlap unzoomed at 1200, 1280 and 1800. |
| No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- A1, A2 and A3 (AoE4 paths): hold. The diff changes only chart UI state and drawing. No game number, spend or simulation path is touched, and nothing in the simulation reads `Date.now`.
- S1: holds. The only new imports are from the same app directory.
- spec-checklist Contracts, Scope and Naming: names match C10 to C13 (`useChartZoom`, `PlotBox`, `TimeWindow`, test ids). Nothing out of scope is implemented (no storage, no linked zoom, no keyboard range, `touch-action` untouched, no upgrade dots). No invented constants: `SELECTION_COLOR` and the opacity are styling, which the ticket leaves open.

## Bot reconciliation

There is no `reviewBot.cli` and no `rulesFile` in REPO.md, so nothing to reconcile.

## Lint

`npx tsc --noEmit && npm run lint:dup`: clean (0 clones across 168 files). Touched unit files (`line-chart.test.ts`, `chart-markers.test.ts`, `chart-zoom.test.ts`): 111 passed.

## UI inspection

I served the task checkout with `npx next dev` on port 3871 and ran `inspect.cjs` and `inspect2.cjs` with the repo's Playwright. The server is stopped and the port is free. The page was loaded with the Knight/Longbow build on `chart-gather-rates` at 1200, 1280 and 1800 px, in four states: unzoomed, selecting (button held), zoomed to 360-660 s, and panned to the right edge with Show later disabled.
- Clipped overflow: none in any state or width. Document horizontal overflow: none.
- Overlaps: none between the zoom bar's children, between the zoom bar and the plot (bar bottom above plot top at every width), or between marker labels.
- Mid-word wraps in the zoom bar: none.
- Disabled vs enabled pan button: opacity 0.5 vs 1, cursor `not-allowed` vs `pointer`. Selecting cursor: `crosshair`.
- Window 600-790 s: the Castle label stays inside the grid at 1200 and 1800 (numbers in finding 3).
- Collapsed RATES at 1800x900: point (400, 300) is `build-order-select` (finding 1).
- Screenshots read: `unzoomed-1280`, `selecting-1200`, `zoomed-1200`, `edge-1800`. No visible defect.

## Non-blocking notes

- `acceptance/aoe4-chart-zoom.spec.ts:376`: the Buildings y-axis poll `toBeGreaterThan(2)` would also pass on the full-game axis, whose top is above 2 as well. Recharts 3 feeds chart data through a `useEffect` dispatch (`recharts/lib/context/chartDataContext.js:15`), so the axis renders one commit after `data-zoom-*`. For a discrete pointerup, React flushes that synchronously, and the implementer's mutation did fail it, so I am not sure a stale read can happen. A safer form is to read the x tick labels and the y top in one evaluate and poll until every x tick is inside the window and the top is above 2.
- `acceptance/aoe4-chart-zoom.spec.ts:58-64`: `gridBox` is a one-selector `readLayout(chart, { grid: '.recharts-cartesian-grid' })`. The exemplar uses `readLayout` for this.
- `results.module.css:73` styles the zoom bar through `[data-testid='chart-zoom-bar']`. This is the only CSS selector in the repo keyed on a test id. It works because the bar's markup belongs to SGS-196 and has no class hook. A class on the bar would be cleaner when that file is next touched.
- `chart-markers.ts`: the `end` parameter now means the plot's span; the comment says so. A rename was not called for by the ticket.
- `use-chart-zoom.ts:14`: `ZoomDragMode` is exported but used only in the file.
- The hook returns `dragMode` and `plotRef` beyond C11's return shape. These are additions, not a closed seam.
- During a selection the recharts tooltip stays up and can show a stale time (`selecting-1200.png` shows a "0:00" tooltip box over the plot while the pointer is near 6:00). B-Z1 only says hovering pauses, so this is not a defect against the ticket.
- For the M11 docs ticket: `docs/aoe4-build-order-ui.md:203` ("The x axis covers the union of both runs' sample times") and :129 ("Each chart also draws the result's `markers`") stop being true while a chart is zoomed. This ticket puts docs out of scope, so the docs ticket should reword them.

## Coverage

- Reviewed: every file in `git diff origin/main...HEAD`: `use-chart-zoom.ts`, `line-chart.tsx`, `chart-markers.ts`, `chart-drag.ts`, `use-chart-drag.ts`, `results.module.css`, `line-chart.test.ts`, `chart-markers.test.ts`, `acceptance/aoe4-chart-zoom.spec.ts`.
- Compared against siblings: `use-chart-drag.ts` (the session, capture, capture-phase Escape and `finish` shape match), `results.tsx:63` (querySelector focus pattern), `chart-zoom-bar.tsx`, `chart-zoom.ts`, `acceptance/aoe4-chart-views.spec.ts` (exemplar), and `acceptance/helpers.ts`.
- REPO.md review checklist: "Every diff" was done: `next build` per the implementer's record, and the touched page loaded via the inspection. Under "AoE4 build order" I checked for copied helpers (none; `DRAG_THRESHOLD_PX` is now shared), Bootstrap utilities mixed with module CSS on one element (none; `chartPlot` is module-only), the 1200/1280/1800 screenshots and the visible disabled state.
- Not run, per role: acceptance and browser test files. Their coverage was judged by reading them. I did not run `npx next build` myself.
- No REVIEW.md exists at the repo root, and no LSP tool was available.
