# SGS-138 review 1

Verdict: APPROVE (tip 7556a2c, base 94a439d)

## Blocking findings
None.

## Acceptance criteria
- PinnedLegend markup (one entry, dashed swatch, text, after series and marker legends, not a button or focusable): pass. chart-legend.tsx renders a `<p>`; the Vitest order case and the Playwright computed-style case (`border-top-style` dashed, `P-1` tag and tabIndex) check it.
- SeriesChart static markup cases (pinned series only, pinned age-up only, neither, collapsed): pass. The hidden-series variants are covered by the `pinnedLegendShown` table and the Playwright hide/show case, since static markup cannot set `hidden`. This is acceptable because the table fails if `hidden` or the age-up count is ignored.
- `pinnedLegendShown` table: pass. All 5 required cases are present, plus 2 extra. Playwright hide/show runs 2 rounds with no pinned age-up marker.
- Removed ids and search criterion: pass. The git grep on non-test files is empty and `pinnedAgeUps` is gone from chart-legend.tsx. Remaining test and spec matches sit inside absence assertions.
- Marker legend lists only current-run kinds: pass. `MarkerLegend` returns null on 0 kinds, and the Vitest case covers it.
- Tooltip excludes `(pinned)` via `tooltipType="none"` (line-chart.tsx:147): pass. The Playwright hover case asserts the pinned path first, then the names. Hover is inside the plot via `plotPoint`.
- One `chart-pinned-legend` per chart, none after unpin: pass (Playwright). Series legend lists shared and pinned-only series once.
- Tooltip time label and current values unchanged: pass by reading. The first gather-rates case is untouched.
- Per-villager Vitest case in result-series.test.ts: pass. It asserts the runs differ first, expects pinned `[2,0,2]` against current `[1,2,3]`, and covers the zero-gatherers case.
- Gather-rates spec pinned case: pass. It reads no tooltip value and uses path counts before and after the toggle: wood at 0 for both lines, food at 1 for both, with the legend item at opacity 0.5.
- Docs: pass. The three doc claims (tooltip rule, marker legend, one pinned entry) match the code. No remaining `chart-pinned-key` or `pinned key` in docs or ARCHITECTURE.md.
- tsc and lint:dup: pass (I ran them; 0 clones). I did not run unit tests, the build or Playwright, per the rules. I take the implementer's reported results as unverified by me.
- INVARIANTS: UI only, none touched.

## Mutation reasoning
- `pinnedLegendShown` ignoring `hidden` or the age-up count fails table rows.
- Rendering the legend whenever `pinned` is defined fails the "no series and no age-up" case.
- Removing `tooltipType` fails the Playwright hover case.

## Bot
No reviewBot configured.

## Conventions
The sibling `it.each` and `describe` style matches the existing tests in line-chart.test.ts. The new chart-legend.test.ts uses a table.

## Non-blocking notes
- The Playwright hover case checks tooltip names only. The pinned markers' absence from the tooltip rests on `ReferenceLine` not being a tooltip entry. That is true in recharts.
- UI inspection did not run. The change is a small `<p>` and no layout work, and the implementer ran the browser cases.

## Coverage
Reviewed: all 8 changed files in full diff, plus a lint run.
