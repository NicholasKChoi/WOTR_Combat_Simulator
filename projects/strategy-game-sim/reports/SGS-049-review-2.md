# SGS-049 review 2 (rework 1, delta review)

- Branch `sgs-049-aoe4-chart-markers-ui`, tip `14a4d62edb2acea88636ac60dc0d52e0947d4e52`, base `origin/main` 1d5f5c9. This was a delta review of `43b8a0b..14a4d62`, which changes `line-chart.tsx`, `compare.ts` and `acceptance/aoe4-build-order.spec.ts`. The doc is unchanged in this delta.
- Reviewed in a detached worktree at `worktrees/review-sgs-049-aoe4-chart-markers-ui`, removed afterwards. Node 24.22.2.
- **Verdict: REQUEST CHANGES** (one blocking finding).

The main rework works. At 1280, 1024, 768 and 576 px no two marker labels overlap, and every label stays inside the plot on all three charts. This also holds when the window is resized after a run. The new 768 px test is sound: it fails when `plotWidth` is forced to 900.

At 390 px, labels still leave the plot, now past the left edge, and they draw over Y-axis tick values.

## Blocking findings

1. `components/apps/aoe4-build-order/line-chart.tsx:29,34-35` - contract (a comment the diff edits is contradicted by the code; the doc sentence breaks at the same width) -
   - **What happens.** At a 390 px viewport (plot width 216 px), on the ENG 1TC run, `steeled-arrow 8:41` and `iron-undermesh 9:41` are drawn from x=130 while the plot starts at x=142. That is 12 px past the left edge of the plot, on all three charts.
     - The labels overlap the Y-axis tick labels: `45` on Units produced, `1350` on Gather rates and `7500` on Floating resources. I measured this from the text bounding boxes and confirmed it in a screenshot.
     - The labels do not overlap each other.
   - **Cause.** `placeMarkers` flips a label to `insideTopRight` whenever `at + width > end`. It does not check that `at - width >= 0`. On a narrow plot, an 18-19 character label (estimated at 133 px, about 700 s at 1200 s / 216 px) fits on neither side, so the flipped label runs off the left edge.
   - **Which sentences this contradicts.**
     - Line 29, which this rework edited: "Labels near the right edge extend leftward to stay inside the plot". This is false at 390 px.
     - The doc's "markers that fall close in time stack their labels in rows so each stays readable" (`docs/aoe4-build-order.md:668-669`). Labels printed over tick values are not fully readable, and the doc does not say where this stops being true.
   - **Why it is blocking.** Review 1 already counted the 390 px edge case (it ran past the right edge then) in the blocking finding. Rework 1 required "keep label stacking and right-edge flipping working off the measured width".
   - **Direction (implementer).** Keep every label inside the plot when it fits on neither side of its line, and record the interval actually used, so the row choice stays correct.
     - For example: when `at - width < 0`, anchor the label at the plot's left edge with a `dx` offset, and make its interval `[0, width]`.
     - Choosing "the side with more room" is not enough. With real glyph widths, `iron-undermesh` would still overflow the right edge by about 1 px.
     - Extend the narrow-screen Playwright test to 390 px, and add a check that each label box lies inside the `.recharts-cartesian-grid` box. Mutation-check it.
   - **Alternative (owner's call, not the implementer's).** Keep the code. The comment and the doc then say that below a plot width of about 250 px (phone screens), labels may run past the plot edge.
   - **Also.** Re-wrap line 29 to the file's width. It is about 200 characters on one line, while its neighbours wrap at about 110. Drop the clause "plotWidth is the measured pixel width of the plot, so row choice tracks the screen", which only restates the parameter.

## Spec gaps

None.

## Rework 1 required fixes

| Fix | Result | Evidence |
|---|---|---|
| Measure the plot width from `ResponsiveContainer` `onResize`; remove `PLOT_WIDTH_PX` | done, except the 390 px edge (finding 1) | `line-chart.tsx:55-57,63`. The measured widths match recharts' grid: 966 / 786 / 546 / 366 / 216 px at 1280 / 1024 / 768 / 576 / 390, the same numbers as review 1. `CHART_MARGIN_PX = 5` matches recharts 3.10.1's `CartesianChart` `defaultMargin`. |
| 768 px Playwright test on ENG 1TC, all three charts | done | `acceptance/aoe4-build-order.spec.ts:378` passes. |
| Mutation: a fixed 900 fails the 768 px test | confirmed by running it | I replaced `plotWidth` with `900`. Result: `Error: labels 2 and 4 in chart-units-produced overlap`, 1 failed. Restored afterwards; `git status` was clean. |
| `compare.ts` imports `AGE_NAMES` from `lib/aoe4-build-order/model` | done | The local copy is deleted, and `git grep AGE_NAMES` shows a single definition, at `model.ts:132`. Its type `Readonly<Record<2\|3\|4,string>>` accepts `KeyAge`. `compare.test.ts` is unchanged (no diff) and its 12 tests pass. |
| Optional tidy items | all done | The spec imports `CHART_MARKER_KINDS`. The horizon test asserts `markers.length > 0` (line 462). The key is `kind:label:at`. The legend uses `mb-3`. |

## Transient first render

`chartWidth` starts as `null`, so `plotWidth` is 1. I read recharts 3.10.1's `ResponsiveContainer.js`:
- The mount effect sets the container size from `getBoundingClientRect()` without calling `onResize`.
- `onResize` fires only from the `ResizeObserver` callback, which comes on its first observation right after.

So there is one committed render that does show the chart with `plotWidth = 1`. In that render every label is flipped right, on its own row. The next render, from `onResize`, corrects it.

The design is sound:
- `onResize` always arrives after the observer is attached, including after the chart is shown again from `display:none`.
- The server render sees no chart, because `ResponsiveContainer` returns null until it has a size.
- The final layout is correct. I loaded at 1280, then resized to 768 and to 576 with no new run, and found 0 overlaps each time.

Possible downside: a single-frame flicker of the label layout. This is not blocking. A cleaner option is to skip marker labels (or markers) while `chartWidth` is null.

## Acceptance criteria (not ticked: the verdict is not APPROVE)

| # | Criterion | Result |
|---|---|---|
| 1 | `MARKER_COLORS` / `MARKER_KIND_LABELS` / `markerLabel`; `formatMinSec` imported | pass (no change since review 1) |
| 2 | WCAG 3:1, not in `PALETTE` | pass (no change) |
| 3 | N `chart-marker` per chart with attributes, stroke and dash | pass (acceptance) |
| 4 | Label text; same or near-`at` labels do not intersect | pass. I measured 1280-390 px with no label-label overlap on any chart. |
| 5 | Marker legend | pass (acceptance) |
| 6 | `markers: []` | pass (acceptance) |
| 7 | Series legend click | pass (acceptance) |
| 8 | Marker at `durationSeconds` drawn | pass. It now also asserts `markers.length > 0`. |
| 9 | `markers={result.markers}` x3 | pass (no change) |
| 10 | Mutations | pass by inspection (as in round 1), plus the new 768 px mutation, which I ran. |
| 11 | Doc describes markers | content pass. The "stays readable" sentence breaks at 390 px (finding 1). |
| 12 | Diff touches none of the YAxis or margin lines; Y-axis test passes | pass on intent. The literal text is not met: `<YAxis width={110}>` became `width={Y_AXIS_WIDTH}` (same value). The rework fix required coupling the plot width to the Y-axis width, and a shared constant is better than a second `110` literal. The 1280 Y-axis test passes. |
| 13 | tsc, npm test and acceptance pass; no invariant regressions | pass |

## Invariants touched

- S1: holds. `compare.ts` and `line-chart.tsx` import only from `lib/aoe4-build-order/*` and their own app directory.
- A1, A2, A3: not touched (display only; no `lib/**` edit).
- S2, S3: not touched.

## Spec checklist

- Names are unchanged.
- `compare.ts` is listed in the ticket's Out of scope (it belongs to SGS-048), but rework 1 explicitly required this edit, so it is in scope now.
- No invented constants. `Y_AXIS_WIDTH` and `CHART_MARGIN_PX` mirror the existing 110 and recharts' default margin.
- `golang/` is untouched.

## Commands

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npm test`: 36 files, 864 passed.
- `npx vitest run components/apps/aoe4-build-order/compare`: 12 passed.
- `npx next build`: success.
- `npm run acceptance`: 433 passed, including `marker labels stay apart on a narrow screen`.
- Mutation run: described above.
- `next dev` on port 3891, with Playwright probes:
  - ENG 1TC at 1280, 1024, 768, 576 and 390 px: label-label overlap, label inside the plot grid, and label versus other SVG text (ticks and axis label);
  - a live resize from 1280 to 768 to 576.

  The server was stopped and port 3891 is free.

## REPO.md review checklist

- **Every diff.** Build passes. Page loaded on `npm run dev`; I chose ENG 1TC, ran it, and resized.
- **AoE4 build order.**
  - The copied `AGE_NAMES` constant is now removed.
  - Doc sentence check: finding 1.
  - At 1280 px, no marker label overlaps tick or axis-label text on any chart. The 1280 Y-axis test passes.
- Combat simulator, Starcraft helper, Shared code and `golang/`: not touched.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot was run. There is no `rulesFile`.

## Non-blocking notes

- `line-chart.tsx:99`: `.map(({ marker, side, row }, i) =>`. The `i` is now unused, since the key no longer uses it. Drop it.
- `line-chart.tsx:20`: `CHART_MARGIN_PX = 5` silently mirrors recharts' default `LineChart` margin, because `LineChart` gets no `margin` prop. If someone later adds a margin, the plot width drifts.
  - Option: pass `margin` explicitly from the constant. That is a new margin line, which SGS-052 territory may want left alone.
  - Option: say in a short comment that this is recharts' default margin.
- The one-frame transient render described above.

## Out-of-scope findings

None new.

## Coverage

- Delta reviewed in full: `line-chart.tsx` (whole file read), `compare.ts`, `acceptance/aoe4-build-order.spec.ts` (changed hunks, plus the helpers they use).
- Checked that the whole-branch diff against `origin/main` matches review 1 apart from this delta.
- recharts 3.10.1 `ResponsiveContainer.js`, `responsiveContainerUtils.js` (`debounce: 0`) and `CartesianChart.js` (default margin 5) were read to judge the transient render and the margin constant.
- Not reviewed again: `chart-rows.ts`, `chart-rows.test.ts`, `line-chart.test.ts`, `results.tsx` and the doc are unchanged since review 1.
