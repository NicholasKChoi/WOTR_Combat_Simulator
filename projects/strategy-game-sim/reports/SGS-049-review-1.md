# SGS-049 review 1

- Branch `sgs-049-aoe4-chart-markers-ui`, tip `43b8a0b58efb65777d188000e251616473e07355` (local only; not on origin), base `origin/main` 1d5f5c9. One commit.
- Reviewed in a detached worktree at `worktrees/review-sgs-049-aoe4-chart-markers-ui` (removed afterwards).
- **Verdict: REQUEST CHANGES** (one blocking finding).

## Blocking findings

1. `components/apps/aoe4-build-order/line-chart.tsx:17-19,28-40` and `docs/aoe4-build-order.md:668-669` - contract (doc and comment contradicted by code) -
   `placeMarkers` works out label widths in seconds from a fixed `PLOT_WIDTH_PX = 900` and `LABEL_CHAR_PX = 7`. The chart's real plot width
   depends on the viewport. Measured plot widths are 966 px at 1280, 786 px at 1024, 546 px at 768, 366 px at 576 and 216 px at 390.
   - At 1280 and 1024 the estimate is conservative, and no labels overlap.
   - At 768 px wide, on the prebuilt ENG 1TC run (5 markers), `horticulture 6:49` and `iron-undermesh 9:41` overlap on all three charts:
     the same row, x 357-447 and 435-547. In the screenshot the text is unreadable ("horticulture 6:49n-undermesh 9:41").
   - At 576 px, `Feudal 4:23` and `double-broadax 6:49` also overlap.
   - At 390 px, `iron-undermesh 9:41` runs past the right edge of the plot.

   This contradicts two sentences the diff adds:
   - the doc: "markers that fall close in time stack their labels in rows so each stays readable";
   - the code comment: "Labels near the right edge extend leftward to stay inside the plot".

   The 900 px assumption is a hidden constraint, and no comment states it. A reader would take the comment as true at any width.
   The ticket's literal criterion (markers at the same `at`, or within a few seconds) still holds at every width: such markers always
   land on different rows, because the row choice is made in seconds. So this is not an acceptance-criterion failure. It is a doc and
   comment the code contradicts on an ordinary tablet width of a responsive Bootstrap page, and the gate treats that as blocking.

   Direction (preferred): use the measured plot width. recharts 3.10.1 `ResponsiveContainer` has `onResize(width, height)`. Keep it in
   state, subtract the YAxis width (110) and the margins, and pass it to `placeMarkers` in place of `PLOT_WIDTH_PX`. The 7 px per
   character can stay as a conservative bound: measured glyphs are about 5.8 px at fontSize 12.

   Optionally, add a Playwright check at 768 px reusing the existing bounding-box loop.

   If the owner would rather accept the fixed assumption, the doc and comment must instead say that labels are stacked for a plot
   about 900 px wide and may overlap on narrower screens. That is the owner's call, not the implementer's.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `MARKER_COLORS`, `MARKER_KIND_LABELS`, `markerLabel` exact; `formatMinSec` imported from `format-time` | pass | `chart-rows.ts:1,59-75`; `git grep formatMinSec chart-rows.ts` finds only the import; `chart-rows.test.ts` pins both tables and both label examples |
| 2 | WCAG 3:1 on `#ffffff` and `#212529`, not in `PALETTE` | pass | test present; my own calculation gives a minimum of 3.23 (`#008080` on `#212529`) |
| 3 | N `chart-marker` per chart, in order, with attrs, stroke and dash not `3 3`; no dashed series path | pass | acceptance test passes; browser probe shows `stroke-dasharray="8 2"`. With a pin, the `pinned:*` series paths are dashed `6 4` by design (pin-and-compare feature). The criterion's "no series path has a dasharray" holds only without a pin, and the test runs without one. |
| 4 | Visible label is `markerLabel`; labels of same or near `at` do not intersect | pass (at any width for same or near `at`) | probe at 1280/1024/768/576/390: the same-`at` pair `double-broadax`/`horticulture` never intersects. Overlaps of markers further apart are in blocking finding 1. |
| 5 | Marker legend present iff markers, `CHART_MARKER_KINDS` order, swatch, text | pass | server-render test and acceptance test; probe legend `age-up, economy, blacksmith` |
| 6 | `markers: []` draws no marker and no legend; charts drawn | pass | acceptance test `a run with no markers ...` |
| 7 | Series legend click leaves markers and legend | pass | acceptance test clicks Food and re-counts |
| 8 | Marker whose `at` equals `durationSeconds` is still drawn | pass (as near as integer durations allow) | `durationSeconds` must be an integer (400 `is not an integer` for 262.566...), so the test uses `ceil(feudalAt)` = 263 with Feudal at 262.57. Probe: the line is drawn at x=1079 inside plot 212-1178, and the label flips right (1109-1171) inside the plot. |
| 9 | `markers={result.markers}` 3 times in `results.tsx` | pass | `results.tsx:25,34,43` |
| 10 | Mutations fail the named tests | pass by inspection | count test per chart; `toHaveAttribute('stroke', MARKER_COLORS[...])`; server test expects `age-up` before `blacksmith` with input given blacksmith-first. Not run as mutations. |
| 11 | Doc describes marker lines and legend | pass on content | `docs/aoe4-build-order.md:667-672`; but see blocking finding 1 for the "stays readable" sentence |
| 12 | YAxis, margin, `toChartRows`, pinned handling untouched; Y-axis test passes | pass | the diff touches none of those lines; `the Y-axis label does not overlap 4-digit tick labels` and the pin-compare 1280 axis test pass |
| 13 | tsc, npm test, acceptance pass; no invariant regressions | pass | see Commands |

Criteria are not ticked: the verdict is not APPROVE.

## Invariants touched

- S1: holds. Components import `CHART_MARKER_KINDS` and `ChartMarker` from `lib/aoe4-build-order/model` and `formatMinSec` from `lib/aoe4-build-order/format-time`, both in the same app. Nothing comes from `data.ts` or another app.
- A1, A2, A3: not touched. Display only; no `lib/**` edit.
- S2, S3: not touched.

## Spec checklist

Names match the design's `chart-rows.ts`/`line-chart.tsx` contracts and test ids (`chart-marker`, `chart-marker-legend`, `chart-marker-legend-item`). Nothing out of scope is implemented: no toggles, no pinned-run markers, no new kinds. No invented constants answer an open question. `golang/` is untouched.

## Commands (Node 24.22.2)

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npm test`: 36 files, 864 passed.
- `npx next build`: success.
- `npm run acceptance`: 432 passed, including the 3 new `chart markers` tests.
- `next dev` on port 3877, with Playwright probes at viewport widths 1280, 1024, 768, 576 and 390, pinned and unpinned, and at horizon 263 s. The server was stopped afterwards and the port is free.

## REPO.md review checklist

- **Every diff**: build and dev-server load done; walked through choosing the prebuilt build, run, pin, run at a short horizon, unpin, pin a short run, then run a long one.
- **AoE4 build order**:
  - No helper or constant is copied: `formatMinSec` is imported, and no `AGE_NAMES` copy is added by this diff.
  - Doc sentence check: blocking finding 1.
  - At 1280 px no axis tick, axis label, marker label, series legend or marker legend boxes overlap on any chart. Axis-label boxes (`Units`, `Per minute`, `Resources`) sit left of the grid as before.
- Shared code, Combat simulator, Starcraft helper and golang/: not touched.
- Pinned lines still work with markers. A pinned 263 s run under a 1200 s current run, and a pinned 1200 s run under a 263 s current run, both draw every marker and every `pinned:*` series, and the label rows stay correct. `end` includes the pinned times, which matches the x domain from `toChartRows`.
- Zero-time edge: no marker can have `at` 0, because the start age has none and research takes time. `end = Math.max(1, ...)` guards division.

## Bot reconciliation

`reviewBot.cli` is empty: no bot run. No `rulesFile`.

## Non-blocking notes

- `acceptance/aoe4-build-order.spec.ts:362` hard-codes `KINDS = ['age-up', ...]`. The spec already imports from `lib/aoe4-build-order/model`, so import `CHART_MARKER_KINDS` instead. The legend-order assertion would then follow the real order.
- `acceptance/aoe4-build-order.spec.ts:436` (`a marker at the end of the horizon is still drawn`) does not assert `markers.length > 0` for the second run. If the Feudal marker disappeared, `toHaveCount(0)` would pass without testing anything. Add `expect(markers.length).toBeGreaterThan(0)`.
- At 1280 px, marker lines cross the text of neighbouring labels; for example the `steeled-arrow` line runs through the `6:49` of `double-broadax 6:49`. The text is still legible. A white text halo (`paintOrder: 'stroke'` with a white stroke) would help if it is wanted later.
- The marker legend `ul` has `mb-0`, so it sits right on the next chart's `h3` ("Blacksmith" directly above "Gather rates"). Consider `mb-3` for spacing.
- `key={i}` on `ReferenceLine`: markers are unique per tech and age, so `${marker.kind}:${marker.label}` would be a stable key. This is cosmetic, because the list is replaced per result.

## Out-of-scope findings

- `components/apps/aoe4-build-order/compare.ts:37` defines its own `AGE_NAMES` (`{ 2: 'Feudal', 3: 'Castle', 4: 'Imperial' }`), duplicating `AGE_NAMES` in `lib/aoe4-build-order/model.ts`. It is already on `main` (pin-and-compare work), not in this diff. The REPO.md AoE4 checklist treats a copied constant as blocking, so it needs a follow-up ticket.

## Coverage

All 7 changed files were reviewed in full diff context:
- `chart-rows.ts`, `chart-rows.test.ts`, `line-chart.tsx`, `line-chart.test.ts`, `results.tsx`;
- `acceptance/aoe4-build-order.spec.ts`, `docs/aoe4-build-order.md`.

Siblings compared: `chart-rows.ts` existing exports (mixed `export const` arrow and `export function`, so `markerLabel` as an arrow matches `pinnedKey` at line 15), `compare-panel.tsx` and `results.tsx` for Bootstrap class usage.

The mutation criteria were checked by inspection, not by running the mutations.
