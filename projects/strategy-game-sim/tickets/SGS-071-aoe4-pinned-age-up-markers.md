# SGS-071: Draw the pinned run's age-up markers dashed, with a legend item

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.12 (pinned age-up markers dashed)
- **Priority**: medium
- **Risk**: low
  <!-- One component, display only, no API/schema/config change, no critical path; adds a prop to a component the design already names (C12). About 40 lines of business logic. -->
- **Invariants**: S1 (imports only `lib/aoe4-build-order/model` and `format-time`); A1 and A3 untouched (display only, the pinned result is read as is)
- **LOC estimate**: 40 (`line-chart.tsx` ~25: prop, filter, `ReferenceLine`; `chart-legend.tsx` ~10: one item; `results.tsx` 3 lines; business logic only)
- **Depends on**: SGS-070 (owns `line-chart.tsx` and `chart-legend.tsx` first; this ticket builds on its `SeriesChart`, `MarkerLegend`, `placeMarkers`, solid current markers)
- **On merge**: none
- **Source**: M4.12; design/M4.md C12 (Charts, table rows "marker item" and "pinned age-up marker"), Behavior rules "pinned markers" and "Charts (M4.11)" row "marker legend"; plan M4-20261102 outline O

## Context

`results.tsx` already passes the pinned run's series to `SeriesChart` (`pinned={...}`) but not its markers, so a pinned run shows no
age-ups and the user cannot see when the pinned build aged up against the current one. This ticket draws only the pinned run's
`age-up` markers, dashed and unlabelled, and adds a legend item for them. Display only.

## Scope

Names are design C12's. Files are under `components/apps/aoe4-build-order/`. Written against `main` d5c2549 plus SGS-070; line numbers
refer to SGS-070's end state, so re-find them.

1. `line-chart.tsx`: `SeriesChart` gains an optional prop `pinnedMarkers?: readonly ChartMarker[]` (default `[]`).
   - Keep only entries with `kind === 'age-up'` (the design draws no other pinned kind), in the order given.
   - For each, render a recharts `ReferenceLine` at `x={marker.at}` with `data-testid="chart-pinned-marker"`, `data-label={marker.label}`,
     `data-at={marker.at}`, `stroke={MARKER_COLORS['age-up']}`, `strokeDasharray="6 4"` (same dash as pinned series lines), and no
     `label` prop (no text label, so `placeMarkers` never receives pinned markers (C12) and add no label rows or top margin).
   - Each line carries a `<title>` child reading `<label> (pinned) <m:ss>` (`formatMinSec(marker.at)`, e.g. `Castle (pinned) 13:24`);
     recharts 3.10.1's `ReferenceLine` renders `props.children`, so pass it as a child; the implementer confirms the title lands in the DOM.
   - They are not gated by the series `hidden` state (markers never hide) and are drawn independent of `chartWidth` (no placement needed).
   - `end` already includes `pinned.times`, so a pinned marker later than the current run's last sample still falls on the x-axis.
2. `chart-legend.tsx` (from SGS-070): `MarkerLegend` gains `pinnedAgeUps?: boolean` (C12: props become `{ markers: readonly ChartMarker[]; pinnedAgeUps?: boolean }`, returns `JSX.Element | null`) (respec 1). When true it appends, after
   the per-kind items, one `data-testid="chart-marker-legend-item"` with `data-kind="pinned-age-up"`, text `Age-up (pinned)`, whose
   swatch `span` is a short vertical dashed line (`border-left: 2px dashed` in `MARKER_COLORS['age-up']`, same dash feel as the line).
   `SeriesChart` passes `pinnedAgeUps` true when at least one `age-up` pinned marker is drawn. `MarkerLegend` renders nothing only when
   there are no markers and `pinnedAgeUps` is false; so a current run with no markers but a pinned run with age-ups shows a legend
   with just the pinned item.
3. `results.tsx`: pass `pinnedMarkers={pinned?.markers}` to all three `SeriesChart`s (it already builds `pinned` for them from
   `pinned: SimulationResult | null`; do not filter here, `SeriesChart` filters).
4. Tests. Rule: a test of the changed behaviour gets the new expected value; any other test keeps its value. The implementer lists
   every test edited.
   - `line-chart.test.ts` (server render): `pinnedMarkers` with two `age-up` and one `economy` marker renders exactly two
     `chart-pinned-marker` elements. If recharts' server render emits no `ReferenceLine` (it needs a measured chart, as `chart-marker`
     does today behind `chartWidth`), cover the filter with an exported pure helper instead, and put the DOM assertions in acceptance.
   - `acceptance/aoe4-build-order-pin-compare.spec.ts` or `aoe4-build-order.spec.ts`: extend the pinned-run marker test (the one near
     line 454 titled "with a pinned run the pinned lines are dashed 6 4, the current run markers ... still draw", which SGS-070 edits
     for solid current markers) to assert the pinned markers below.
5. Docs: `docs/aoe4-build-order.md` section "A 200 draws three line charts" (sentence ending "and the pinned run draws none", line ~800
   on `main`): replace with the pinned run's `age-up` markers drawn as dashed `6 4` vertical lines without text labels (hover title
   `<age> (pinned) <m:ss>`), and the marker legend's `Age-up (pinned)` item. Grep `docs/` and `components/` for "draws none" /
   "pinned run draws" before finishing.

**Out of scope:** labels on pinned markers, pinned markers of kinds other than `age-up`, `placeMarkers` changes, hiding pinned markers
with the pinned series items, pin persistence and the pin label (SGS ticket for P), mobile layout, any `lib/**` change.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `git grep -n "chart-pinned-marker\|pinnedMarkers\|pinned-age-up" -- components acceptance pages docs lib` finds 0 lines on `main` today and, after the change, finds the new code, tests and docs (checked: 0 on d5c2549).
- [ ] With a pin of the English 1TC run and a current run of the same or another build, each of the three charts has `N` `chart-pinned-marker` elements where `N` is the pinned result's count of `age-up` markers; each has `data-label` equal to the age name and `data-at` equal to the marker's `at`, and `stroke-dasharray="6 4"` (Playwright).
- [ ] No pinned marker has a text label: no `<text>` inside a `chart-pinned-marker` element; hovering/`<title>` text equals `<label> (pinned) <m:ss>` (for example `Feudal (pinned) 4:05`).
- [ ] Only `age-up` pinned markers draw: pinning a run that has `economy`, `unit-tier`, `blacksmith` and `other` markers still gives `N` pinned lines (unit test of the filter or render; fails if the filter is removed).
- [ ] Without a pin there is no `chart-pinned-marker` and no `chart-marker-legend-item[data-kind="pinned-age-up"]`; unpinning removes both.
- [ ] With a pin and a current run that has markers, `chart-marker-legend` lists the per-kind items in `CHART_MARKER_KINDS` order and then the `pinned-age-up` item last, with text `Age-up (pinned)`; the existing `chart-marker-legend-item` count assertions are updated only by that extra item when a pin exists.
- [ ] The count of `chart-marker` elements and their `data-*` attributes with a pin equal those without a pin (pinned lines use a different test id); current markers stay solid (SGS-070) and the pinned series lines stay dashed `6 4` as before.
- [ ] Clicking a series legend item (current or `pinned:<key>`) leaves every `chart-pinned-marker` in the DOM.
- [ ] No two `chart-marker` label text boxes intersect and the chart's top margin is the same with and without a pin (pinned markers add no label row).
- [ ] `docs/aoe4-build-order.md` no longer says the pinned run draws no markers and describes the dashed pinned age-up markers and the legend item; `git grep -n "pinned run draws none" -- docs components` finds 0 lines (finds 1 on `main` today, in docs).
- [ ] `npm test`, `npx tsc --noEmit` and `npm run acceptance` pass; the implementer lists every test edited.
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-02

- Underspecified: `MarkerLegend` props, legend item text and `placeMarkers` interaction were open `designer` questions.
- Changed: confirmed by C12 (`pinnedAgeUps?: boolean`, text `Age-up (pinned)` last, pinned markers never placed by `placeMarkers`); open questions removed.
- Stands: all earlier scope and criteria are unchanged.
