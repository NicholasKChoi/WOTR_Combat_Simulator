# Simplify batch SGS-193 / SGS-198

Loaded: common.md, REPO.md, LESSONS.md (acceptance-layout lesson only; no acceptance changes made), ARCHITECTURE.md (style source). Unit tests not re-run: no code changed.

## sgs-193-step-annotations-name-the-wait
Tip unchanged: a84332a347505df974d5c36e87a4e7921d388bb0. No change.
Reviewed the step-annotations.ts and test diff. The old `formatWaitBreakdown` and `BREAKDOWN_ORDER` are fully removed, and the tests are table-driven. Nothing to trim.

## sgs-198-units-chart-unit-lines
Tip unchanged: 3bd813828f32e1058b44ec6a642bad941ea36e5e. No change.
Reviewed result-series.ts, chart-rows.ts (`valueAt`), line-chart.tsx and results.tsx. The old `unitSeries` is gone from the components. The one long comment in line-chart.tsx states a hidden DOM-ordering constraint and meets the comment bar. The two ReferenceDot blocks differ in style and test ids, so merging them would not be a clear gain.

Nothing pushed.
