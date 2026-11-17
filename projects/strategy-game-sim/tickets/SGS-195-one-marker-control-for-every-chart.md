# SGS-195: Add one shared marker control for every chart

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M11
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none adjacent (A1 to A3 guard engine results and data; this changes chart UI state and markup only)
- **Unverified assumptions**: none (the acceptance spec this ticket rewrites loads the page in Chromium and reads the real chart DOM)
- **LOC estimate**: 150 (`chart-markers.ts` is mostly moved code; `chart-legend.tsx`, `chart-rows.ts`, `line-chart.tsx`, `results.tsx`; tests excluded)
- **Depends on**: SGS-194
- **On merge**: none
- **Source**: design/M11.md M11.3 (B-M1 to B-M10, C8, C9, C13 `markerView` prop, C16b); plans/M11-20261116.md outline G

## Context

Each chart draws its own `MarkerLegend` with its own hover and focus state, so the marker kinds cannot be hidden and
every chart repeats the control (M11.3). One `MarkerControl` above the chart table drives every chart: click hides or
shows a kind everywhere, and hover or focus labels a kind on every chart. All marker rules (colours, labels, kinds
shown, label placement) move into one module, `chart-markers.ts` (C8), so no other module defines them.

## Scope

All paths under `components/apps/aoe4-build-order/` unless noted. Read at `origin/main`, with the chart table of
SGS-194 as its end state: `SeriesChart` renders a `tbody` (`chart-header-row`, then `chart-body-row` with one
`td colSpan=4`), and `results.tsx` renders `table[data-testid=chart-table]` after `chart-order-status`. Use the
design's names exactly.

- New `chart-markers.ts` (C8). Moved unchanged: `MARKER_COLORS`, `MARKER_KIND_LABELS`, `markerLabel` (from
  `chart-rows.ts`); `placeMarkers`, `PlacedMarker`, `ageUpMarkers`, `labelledMarkers`, `activeMarkerKind` (from
  `line-chart.tsx`, with their private helpers such as `estimateLabelWidth`, `hasKind` and the label-width constant
  `placeMarkers` uses, which move with them). Changed: `liveMarkerKind(markers, kind)` drops the `collapsed` argument.
  New: `interface MarkerView { hidden: ReadonlySet<ChartMarkerKind>; labelKind: ChartMarkerKind | null }`;
  `visibleMarkers(markers, hidden): ChartMarker[]` (input order kept); `labelKindOf(markers, hidden, hoverKind,
  focusKind): ChartMarkerKind | null`, which is `activeMarkerKind(visibleMarkers(markers, hidden), hoverKind,
  focusKind)`. `CHART_MARKER_KINDS` stays in `lib/aoe4-build-order/model.ts`. Update every importer of the moved names
  (examples: `chart-legend.tsx`, `line-chart.tsx`, `results.tsx`, `acceptance/aoe4-chart-readability.spec.ts`,
  `acceptance/aoe4-marker-labels.spec.ts`, the unit tests).
- `chart-rows.ts`: the marker constants and `markerLabel` leave; `toggleHidden` becomes generic,
  `toggleHidden<T>(hidden: ReadonlySet<T>, key: T): Set<T>` (C16b), used by the series legend (`string` keys) and the
  marker control (`ChartMarkerKind` keys).
- `chart-legend.tsx` (C9): delete `MarkerLegend`; add `MarkerControl({ markers, hidden, active, onToggle(kind),
  onHover(kind | null), onFocusKind(kind | null) })`. It renders `div[data-testid=chart-marker-legend]` with a heading
  `Markers` (`h3` styled `h6`) and one `button[data-testid=chart-marker-legend-item]` per kind present in `markers`,
  in `CHART_MARKER_KINDS` order, with `data-kind`, `data-active="true"` on the labelled kind, `aria-pressed` `"true"`
  while the kind is shown and `"false"` while hidden, accessible name `<MARKER_KIND_LABELS[kind]> markers`, the colour
  swatch, then the label text. A hidden kind's item is drawn at 50% opacity, as a hidden series legend item is. It
  returns `null` with no markers. Mouse enter and leave, focus and blur call `onHover` and `onFocusKind`; click calls
  `onToggle`. The `.markerButton` styles in `results.module.css` stay or move with it as needed.
- `line-chart.tsx` `SeriesChart` (C13, marker part only): add the prop `markerView?: MarkerView` (default nothing
  hidden, `labelKind` null). Remove the per-chart `hoverKind`/`focusKind` state, the `liveMarkerKind`,
  `activeMarkerKind` and `MarkerLegend` use, and the marker legend from the render. It draws the `chart-marker` line of
  every marker in `visibleMarkers(markers, markerView.hidden)` and labels `labelledMarkers(visible, labelKind)`, which
  fixes `data-label-rows` and the label placement as today. A marker without a label keeps its hover `<title>`. Pinned
  age-up lines (`chart-pinned-marker`) follow the age-up toggle (B-M7): drawn unless `age-up` is hidden and the
  current run has an age-up marker; with no current age-up marker they are always drawn. `pinnedLegendShown` counts
  only the pinned age-ups drawn. The series legend, pinned legend, and everything else in the chart are unchanged. Do
  not add the zoom, upgrade-dot or `ChartZoomBar` parts of C13; other tickets own them.
- `results.tsx`: hold the `hidden` kinds (`useState<ReadonlySet<ChartMarkerKind>>`, empty at first, not stored), and the
  hover and focus kinds. Reset a hover or focus kind that left the run through `liveMarkerKind(result.markers, kind)`
  (an unmounted item fires no mouseleave or blur, as the comment on today's `liveMarkerKind` says). Compute
  `labelKind = labelKindOf(result.markers, hidden, liveHover, liveFocus)` once and pass every `SeriesChart` the same
  `markerView`. Render `MarkerControl` inside `results-last-good` between `chart-order-status` and `chart-table`
  (`active` is `labelKind`, so a hovered hidden kind shows no `data-active`).
- Tests that this change breaks, updated in this ticket (examples found; search for others that read the marker
  legend or the moved names: `chart-marker-legend`, `MarkerLegend`, `activeMarkerKind`, `markerLabel`):
  - Unit: the `placeMarkers`, `labelledMarkers`, `activeMarkerKind`, `liveMarkerKind` and `ageUpMarkers` tests in
    `line-chart.test.ts`, and the marker colour, label and `markerLabel` tests in `chart-rows.test.ts`, move to a new
    `chart-markers.test.ts` with their cases; the `liveMarkerKind` rows lose the `collapsed` input. `line-chart.test.ts`
    cases that render the per-chart marker legend (kind list, "no marker legend", order of legends, the `Markers`
    heading) become `MarkerControl` markup cases in `chart-legend.test.ts` or are deleted where the chart no longer
    owns the behavior; the chart cases that stay (pinned legend, `data-label-rows`) drop the marker-legend order
    assertions. `chart-rows.test.ts` `toggleHidden` rows keep their values and add one non-string key row.
  - Acceptance: rewrite `acceptance/aoe4-marker-labels.spec.ts` for the one control (see criteria), keeping its
    non-overlap, hover-title and pinned-age-up cases where the new design still has them. Update imports in
    `acceptance/aoe4-chart-readability.spec.ts` (`MARKER_COLORS`, `markerLabel` now from `chart-markers`); every
    assertion there keeps its value. `acceptance/aoe4-build-order-step-band.spec.ts` and
    `acceptance/aoe4-build-order-pin-compare.spec.ts` read `chart-marker` and `chart-pinned-marker` and must pass
    unchanged.
- Docs: `docs/aoe4-build-order-ui.md` (Results paragraphs on markers and "Chart controls") states that each chart has
  its own marker legend below the series legend, that clicking or pressing a key on an entry only focuses it, that
  collapsing a chart clears it, that a collapse hides "the marker legend", and that the pinned legend comes "after the
  marker legend"; all of those become untrue. Fix each of them against the code you build (the control is one, above
  the charts; click hides a kind everywhere; pinned age-ups follow the age-up toggle). The M11 docs ticket adds the
  rest of the page description, so keep this edit to the statements this change makes untrue.

**Out of scope:** the engine and API; the chart table, zoom, unit lines, upgrade dots and help modal (their own
tickets); the series legend's behavior; storing `hidden` (it resets on reload); arrow-key handling in the control;
`ARCHITECTURE.md` (the docs ticket adds `chart-markers.ts`).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] One `chart-marker-legend` renders inside `results-last-good`, after `chart-order-status` and before
  `chart-table` (B-M1). No chart contains a marker legend. It lists the kinds present in the current run's markers in
  `CHART_MARKER_KINDS` order, and renders nothing for a run with no markers. A unit test over the `MarkerControl`
  markup fails if a kind is missing, out of order, or the control renders with no markers.
- [ ] Clicking an item (and Enter or Space on it) toggles the kind in `hidden`: on every chart at once, that kind's
  `chart-marker` lines and labels stop being drawn, and clicking again draws them back (B-M2). Focus stays on the item.
  The Knight/Longbow template's marker kinds are asserted from the API result first (age-up and at least one other
  kind present), so the spec cannot pass with nothing to hide.
- [ ] Item state (B-M3): `aria-pressed` is `"true"` and the item is fully opaque while the kind is shown, `"false"` and
  at 50% opacity while hidden, checked as the computed opacity. A unit test over the markup covers both states.
- [ ] Hover and focus labels (B-M4): hovering or focusing an item labels that kind's markers on every chart in place
  of the age-up labels, with no two labels overlapping on a chart; hover wins over focus; leaving or blurring returns
  to the age-up labels. `data-active="true"` is on the labelled item only. Non-age-up kinds keep a hover `<title>` and
  no text when unlabelled.
- [ ] Hovering or focusing a hidden kind labels nothing for it and the labels fall back to the age-up labels (B-M5);
  with `age-up` also hidden there are no labels on any chart and `data-label-rows` is `0` (B-M6). `labelKindOf` has
  table rows for both: a test fails if the hidden kind is returned or if an age-up-hidden call returns a label kind
  for it.
- [ ] Pinned age-ups (B-M7): with a run pinned, hiding `age-up` removes the dashed `chart-pinned-marker` lines on
  every chart, showing it restores them, and when the current run has no age-up marker (so no age-up item) the pinned
  age-up lines are drawn whatever `hidden` holds. The pinned legend (`dashed = pinned build`) counts only the drawn
  pinned age-ups: it is gone when all pinned lines and pinned age-ups are hidden, and returns when either returns; a
  test over `pinnedLegendShown` and the chart render covers the hidden-age-up case.
- [ ] Lifetime (B-M8): `hidden` is not stored. It survives a new run, the view toggles, collapsing, reordering and
  pinning. A kind hidden and then absent from a later run is still hidden when a later run has it again. A hovered or
  focused kind that is absent from the new run is reset: a `liveMarkerKind` row fails if the kind is returned for a
  marker list without it.
- [ ] Scope (B-M9): the control changes nothing else: series lines, the series legend, the step band, and the pinned
  lines other than pinned age-ups are the same with any kinds hidden. A collapsed chart draws nothing, as today.
- [ ] Keyboard (B-M10): the items are buttons in DOM order after the info toggle and before the first chart's drag
  handle; Tab from the info toggle reaches the first item, and no arrow-key handling is added.
- [ ] No module other than `chart-markers.ts` defines a marker colour, label or kind list: deleting the moved exports
  from `chart-rows.ts` and `line-chart.tsx` leaves no reference (the typecheck passes), and `chart-markers.ts` exports
  the C8 names above. A `chart-markers.test.ts` run holds every moved test case; the `liveMarkerKind` and
  `labelKindOf` cases are new rows.
- [ ] `toggleHidden` works on a `ChartMarkerKind` set and a `string` set without mutating its input; a table test with
  a non-string key row covers it.
- [ ] `aoe4-chart-readability`, `aoe4-build-order-step-band`, `aoe4-build-order-pin-compare` and
  `aoe4-chart-layout` pass with no changed assertion; `docs/aoe4-build-order-ui.md` has no statement that a marker
  legend sits in each chart, that clicking an entry only focuses it, or that collapsing clears it.
- [ ] No INVARIANTS.md regressions

## Open questions

none
