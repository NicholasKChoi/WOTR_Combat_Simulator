# SGS-201 spec gate (report 2)

**Verdict: READY**

Checked at origin/main (fetched). No dependencies.

## Checks
- Grounded: `SeriesLegend` line `aria-pressed={hidden.has(item.key)}` exists and is inverted; `MarkerControl` uses `!hidden.has(kind)`. Docs line 141 states the marker meaning; line 131 holds the series legend click behavior, where the new sentence belongs.
- Existing tests: every pinned-inverted read the ticket names exists at base (line-chart.test.ts:172; pin-compare 179/180/187; chart-layout 65/83; chart-views 297/301; upgrade-dots 306). help-modal only compares snapshots, so no edit. chart-views:206, chart-zoom:445 and the other legend-item uses do not read aria-pressed. The grep found no other dependents. The scope states a rule, not a closed list.
- Legend keys: `legendItems` includes pinned-only items keyed by the plain series key, and `isLineHidden` is `hidden.has(key)`, so the pinned-only unit case is meaningful.
- Risk low, invariants none, On merge none, no open questions, no new contracts, no input validation: all consistent.

## Gaps
None.

## Notes
- Criterion 1 says "after hiding then restoring" for the unit test. Static markup renders only fixed `hidden` sets, so restoring is covered by the acceptance check (criterion 2), not the unit test. The unit test needs two renders (hidden and not hidden) at most. This is harmless.
- Criterion 3 needs `SeriesLegend` and `MarkerControl` rendered in the same test, since they are separate components. The implementer can do that in chart-legend.test.ts with `renderToStaticMarkup`.
