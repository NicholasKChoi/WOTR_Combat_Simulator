# SGS-070 tech-lead 1

Decision: no blockers. One draft PR opened.

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/66, base `main`, head `sgs-070-aoe4-chart-legends-markers` at 3bdfe45e8585b541ee01aa06d8459fffa19c96e1. The branch was pushed by SHA and had no remote copy before. Draft, with the body set through `gh api` PATCH.

## Reviewed
- Commit range: 78679b6 (origin/main, the merge base) to 3bdfe45. Four commits, all authored by choinickolas@gmail.com. No ticket ids or PR numbers in the messages.
- Files (+305/-78 in total): line-chart.tsx, chart-legend.tsx (new), chart-rows.ts, line-chart.test.ts, chart-rows.test.ts, both acceptance specs, acceptance/helpers.ts, docs/aoe4-build-order.md.
- Reviewable business logic: +155/-46.
- Checked against these invariants:
  - S1: the new legend imports only `lib/aoe4-build-order/model` and its own `chart-rows`.
  - A1/A3: untouched; no `lib/**` change.
- No critical paths, no API or schema change, no concurrency, no secrets. No open questions in CONTEXT.md.
- `placeMarkers`/`PlacedMarker` exports: the only consumers are `line-chart.tsx` and its test.
- `placeMarkers` row logic: a row's end only grows, because a label's `to` > its `from` > the row end. So first-fit leaves no overlaps when markers come in time order. This logic was already there.
- Measuring effect: keyed on `labelKey` and `chartWidth`; the `labelWidths` state it sets is not a dependency, so it cannot loop.

## Merge risk
**low** - display-only change in AoE4 chart components: no API, schema, CLI, config or critical-path code; a revert undoes it, and unit and acceptance tests pin the new legends, solid markers and label rows.

## Review focus
No hotspots: the change is confined to how the charts render. Label row placement is covered by unit tests (including the first-fit row search and the measured-width parameter) and by the 1280/768/390 px acceptance overlap checks, which include the knight + longbow build. Legend ordering, swatch colour and toggling are covered by unit and acceptance tests.

## Non-blocking notes
- `placeMarkers` assumes markers arrive sorted by `at`; this assumption predates the PR. The row-end check (`rowEnd < from`) misplaces labels if markers ever arrive unsorted.
- The measuring `<svg>` sits at `position: absolute` inside a wrapper with no positioning context. It is 0x0, so there is no visual effect.
