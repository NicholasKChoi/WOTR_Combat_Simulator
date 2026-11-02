# SGS-070 review 1

Verdict: **REQUEST CHANGES**

Branch `sgs-070-aoe4-chart-legends-markers`, tip `935bb17849a6913d61b07b18243340a1014cc36d` (the branch is not on origin; reviewed from the local ref), base `origin/main` `54d7e90eeb2828fd5a09824107c1c80b35625871`. Node 24.22.2.

## Blocking findings

1. `acceptance/aoe4-build-order-pin-compare.spec.ts:194-196` - test - The diff makes "a 400 run removes charts and table but keeps the pin; the next valid run restores both" flaky. Measured with interleaved runs: on the branch it failed 11 of 46 runs (`TypeError: Cannot read properties of null (reading 'width')`, meaning `boundingBox()` returned null). On `main` it failed 1 of 56. So the test was already slightly flaky, but this diff makes it about ten times worse. It is not caused by load, because it also fails when run alone (1 of 15).
   - Cause, from a MutationObserver probe on the same steps: on the branch the `path[data-series]` lines first mount about 100 ms after the run and are then replaced about 55 ms later. On `main` they first mount about 160 ms after the run, after recharts' own `Legend` measuring pass, which no longer exists. The test's `toHaveCount(1)` passes on the first mount, and the following `boundingBox()` hits the node being replaced.
   - Why it matters: the ticket requires `npm run acceptance` to pass, and a roughly 1-in-4 failure will show up in CI runs and in the next agent's runs.
   - Direction: make the box comparison wait until it holds. For example, `await expect.poll(async () => { const [p, c] = [await pinned.boundingBox(), await current.boundingBox()]; return p && c ? p.width < c.width : false }).toBe(true)`. Alternatively, stop the second mount in `SeriesChart`. Then rerun with `--repeat-each=20`.
2. `components/apps/aoe4-build-order/line-chart.test.ts:44-49` - test - The test title claims "each in its own element", but the only assertion that checks it cannot fail. `seriesLegend` is sliced from the first `chart-series-legend` up to the first `chart-marker-legend`, so by construction it never contains `chart-marker-legend`. If `MarkerLegend` were rendered inside the series legend's `div`, the test would still pass.
   - Direction: assert on structure. Either check that the series legend's closing tags come before `data-testid="chart-marker-legend"`, for example `/data-testid="chart-series-legend".*?<\/button><\/div><\/div><div[^>]*data-testid="chart-marker-legend"/`, or render with `react-dom/server` and parse the HTML. Otherwise drop the claim from the title; the acceptance test already checks it is not a descendant.
3. `components/apps/aoe4-build-order/line-chart.test.ts:56-58` - contract - The acceptance criterion says to server-render `SeriesChart` **with markers** without error and with `data-label-rows` present. The test only renders `render([])`, with no markers. No test checks `data-label-rows` on a render that has markers.
   - Direction: render with at least one marker and assert `data-label-rows="0"`. Rows are 0 on the server because `chartWidth` is null.
4. `components/apps/aoe4-build-order/chart-legend.tsx:13-16` vs `line-chart.tsx:115-122` - convention - The pinned-series colour rule `seriesColor(current >= 0 ? current : series.length + i)` is written twice: once for the legend swatch and once for the line stroke. The acceptance criterion requires the swatch colour to equal the line's `stroke`. The AoE4 review checklist in REPO.md treats copied helpers as blocking because past copies drifted.
   - Direction: put one helper in `chart-rows.ts`, next to `seriesColor` and `pinnedKey`, and use it in both places. A natural fit is to move `legendItems` itself there, which also follows the pattern of keeping pure helpers in `.ts` files with their own tests: `chart-rows.ts` / `chart-rows.test.ts`, `compare.ts` / `compare.test.ts`. Then let `SeriesChart` read pinned colours from it.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Separate "Series" and "Markers" legends, marker legend below and not inside | pass | `chart-legend.tsx`; acceptance `aoe4-build-order.spec.ts` checks descendant count 0 and that the marker box is below the series box; screenshot at 1280 confirms |
| 2 | grep for `recharts-legend-item\|<Legend` has no matches | pass | `git grep` exit 1 |
| 3 | `data-series` matches; clicking `food` presses only that item and removes and restores the path; markers stay | pass | acceptance legend click test and marker test, 551/551 in the full run |
| 4 | Pinned order, swatch dashed/solid, colour equals stroke, opacity 0.5, `pinned:food` hides only the pinned line | pass | `legendItems` unit tests; pin-compare legend test checks order, `border-top-style`, `border-top-color` against `stroke`, opacity. The colour duplication is finding 4 |
| 5 | `placeMarkers` exported; no-intersection, row-0, more-rows tests | pass | `line-chart.test.ts` `placeMarkers` block; the row-always-0 mutation fails "uses more rows" |
| 6 | A measured width wider than the estimate changes rows | pass | `rows(() => 250)` gives 2, while the default estimate gives 0 for the same markers, so the test fails if the parameter is ignored |
| 7 | Knight + longbow at 1280: no label overlap, `data-label-rows` = max row + 1, grid y = 5 + rows × 14, labels at or above it | pass (verified by the reviewer, not by a committed test) | Own probe: 12 markers, rows=4, labels at rows 0-3 (glyph tops 2.5/16.5/30.5/44.5 px), grid top 61 = 5 + 4×14, lowest label bottom 57.5 ≤ 61, no pairwise intersections in all three charts. The committed acceptance tests use `english-1tc`, not knight + longbow (see notes) |
| 8 | Server render with markers, `data-label-rows` present | **fail** | finding 3 |
| 9 | Marker lines have no `stroke-dasharray`; ids kept; no markers means no marker legend | pass | acceptance marker tests; existing unit test for an empty marker list |
| 10 | Docs describe two legends, solid markers, row placement; no stale sentence | pass | `docs/aoe4-build-order.md:786-800, 820`; grep finds no "dashed" for markers and no "toggleable" |
| 11 | `npm test`, `tsc`, `npm run acceptance` pass; edited tests listed | pass on one run / unreliable | `npm test` 1086 passed / 8 skipped; tsc clean; `lint:dup` 0 clones; `next build` ok; full acceptance 551 passed. The pin-compare flake (finding 1) makes acceptance fail about 24% of the time for that test |
| 12 | No invariant regressions | pass | see below |

Tickets not ticked (verdict is not APPROVE).

### Invariants

- S1: holds. `chart-legend.tsx` imports only `lib/aoe4-build-order/model` and `./chart-rows`.
- S2, S3: not touched.
- A1, A3: hold. Display only, and `lib/**` is unchanged. Measuring with `getComputedTextLength` is in the view layer, not the simulation path.
- A2: not touched.

## Marker label `offset: 0` (manager question)

recharts 3.10.1 `getCartesianPosition.js:161-175` places `insideTopLeft` at `(x + offset, y + offset)` and `insideTopRight` at `(x + width - offset, y + offset)`.
- With the default offset of 5, row r's anchor would be at 10 + 14r, and the lowest row would cross the plot's top edge. Setting `offset: 0` puts the anchor at exactly 5 + 14r, which is the ticket's rule.
- It also removes the 5 px horizontal gap, so a label now starts or ends exactly at its line's x. That matches the `[from, to]` boxes `placeMarkers` computes, which never included the offset, so the change is an improvement.
- Visibility: `ReferenceLine` clips only with `ifOverflow: 'hidden'`, which is not set, so labels are not clipped. The top row's glyph box starts 2.5 px below the svg top, so it is fully visible. Confirmed in a 1280 px screenshot of the gather-rates chart: all 12 labels are legible above the plot, and axis and tick labels do not overlap.

## Pin-compare flake (manager question)

It is caused by this diff, not a pre-existing flake at the same rate. Counts and mechanism are in finding 1.

## Bot reconciliation

`reviewBot.cli` is empty and there is no `rulesFile`. No bot ran.

## Non-blocking notes

- The acceptance tests use `english-1tc` for the 1280 overlap check. Criterion 7 names the knight + longbow build, which has the dense 10:00-17:00 cluster (7 markers). Suggested for acceptance-test: add or switch to `english-knight-longbow.json` at 1280. Also assert `data-label-rows` against the label rows, for example topmost label y ≈ svg top + 5. Today it is only checked as > 0 and matched against the grid top, which would also pass if both were overstated together.
- `acceptance/aoe4-build-order.spec.ts:21-22`: removing `hexToRgb` left two blank lines in a row.
- `line-chart.tsx:74,80`: labels are joined and split on `\n`. A marker label containing a newline would be measured wrongly and fall back to the estimate. Engine labels never contain one, so this is harmless.
- `line-chart.tsx:96`: `margin` is a new object on every render. recharts handles this, and it costs no extra mount (probe), but a `useMemo` would match the style if the remount in finding 1 is fixed component-side.

## Coverage

Reviewed:
- `components/apps/aoe4-build-order/chart-legend.tsx`, `line-chart.tsx`, `line-chart.test.ts`
- `acceptance/aoe4-build-order.spec.ts`, `aoe4-build-order-pin-compare.spec.ts`, `helpers.ts`
- `docs/aoe4-build-order.md`
- Siblings compared: `compare-panel.tsx:5,27-33`, `message-lists.tsx`, `step-table.tsx:253-271`, `chart-rows.ts`

Ran:
- `npx tsc --noEmit`, `npm run lint:dup`, `npm test`, `npx next build`, full `npm run acceptance`
- Repeated pin-compare runs on the branch and on `main`
- Reviewer probes: knight + longbow at 1280, and a MutationObserver remount timing probe. Both were temporary spec files in the review worktree and were deleted with it.

REPO.md checklist:
- "Every diff": build done; page loaded via Playwright at 1280.
- "AoE4 build order": the chart rule at 1280 checks out. The copied-helper rule is applied in spirit to the components copy (finding 4).

Not reviewed: mobile layout (out of scope).
