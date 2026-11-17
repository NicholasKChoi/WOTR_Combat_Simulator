# SGS-197 spec gate 2

Verdict: READY

Read at origin/main after `git fetch origin`. SGS-194/195/196 are not integrated, so their end state was read from their tickets. No scratch checkout was made; all checks were file reads.

## Gate 1 gaps, all closed

1. Plot box source. Scope now says `useChartZoom(end, readPlot)` takes a getter called once at pointer down, and `SeriesChart` reads the `.recharts-cartesian-grid` rect. The circularity with the label rows is explained, and the grid-rect read is the design's own "left to the implementer" option. A criterion covers it at both viewports, including a press in the label rows.
2. Collapse or unmount mid-drag. Scope now ends the session as a cancel when the plot leaves the document, and the criteria include a collapse-mid-drag case. The "unmount" case is not claimed as an acceptance test.
3. Capped re-clamp. The clamped window replaces the stored one. A spec case runs with no pinned run, since `end` counts `pinned.times`.

The non-blocking notes from gate 1 are also folded in: the existing-test rule is reworded, the threshold criterion is no longer a code search, `pinnedLegendShown` and the one-point step band are stated, and "inside" is defined as `from <= t <= to`.

## Checks

- Grounded scope: `useChartDrag` with a private `DRAG_THRESHOLD_PX = 4`, the session/finish/Escape pattern, `chart-drag.ts` (only `dropIndexAt` today), `SeriesChart`, `placeMarkers`, `wholeNumberAxis`, `chart-collapse` (only with `layout`), and `plotPoint` using `.recharts-cartesian-grid` all exist as described. `useChartZoom`, `chart-zoom.ts` and `chart-zoom-bar.tsx` are new, from SGS-196.
- Existing tests: `line-chart.test.ts` lines 73 and 83 assert `chart-body` only as an empty `div` with `hidden` when collapsed, and `div` attributes when expanded. They do not assert its children, so the added `chart-plot` wrapper does not break them. `aoe4-chart-layout.spec.ts` and `aoe4-chart-views.spec.ts` use `chart-body` only for visibility or hover. The two layout 4px cases the ticket names exist (lines 297 and 321). `CHART_LAYOUT_STORAGE_KEY` exists for the B-Z13 storage check.
- Testable criteria: all have observable outcomes. The y-axis criterion pins its fixture by asserting the API result first. No criterion pins a stale count. The threshold criterion uses the typecheck plus existing specs.
- Open questions: none. Q129 is folded into the body.
- Invariants: no `Paths:` match; the ticket's note that A1 to A3 are not touched holds.
- Contracts: names match design C10 to C13 and the SGS-196 ticket. The getter deviation from C11 is known, and the caller said not to count it as a gap.
- Dependencies and size: dependencies are stated and the estimate is about 260 lines.
- Diagrams: the state diagram is present.
- On merge: `none` is valid.
- Risk: `standard` is fine. REPO.md has no `strongModelTriggers`, and no `criticalPaths` entry is touched.
- Docs: the search found no doc describing zoom. The M11 docs ticket SGS-200 owns the write-up.
- Input validation: no trust boundary is touched.
- Overlap: SGS-198 adds upgrade dots to `line-chart.tsx`. This ticket explicitly leaves them out, and the ordering is covered by the design's note that the two do not run in parallel. No throwaway work.
- Unverified assumptions: recharts domain re-layout, the grid rect, and pointer capture are listed, and the Chromium spec exercises them.

## Notes (non-blocking)

- "Nothing is drawn outside the plot box" (B-Z6) needs a concrete assertion. Suggest checking that every `path[data-series]` and step-band bounding box lies within the grid rect, read in one `evaluate`.
- The design doc C11 should be aligned to the getter signature (the designer pass is already planned).
