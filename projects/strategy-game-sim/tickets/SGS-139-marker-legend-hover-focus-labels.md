# SGS-139: Marker legend items label that kind's markers on hover or focus

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.7
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none (UI only; no engine, data or simulation path is touched)
- **Unverified assumptions**: recharts at the pinned version renders a `ReferenceLine` `label` and a child `<title>` the same way whichever of the two a marker uses, and re-renders them when the same keyed marker moves from one to the other; `getComputedTextLength` on the hidden measuring `<text>` returns usable widths for labels of every kind. Unit tests render with `renderToStaticMarkup`, which fires no events and runs no effects, so only the Playwright spec exercises hover, focus and measured widths for real
- **LOC estimate**: 90 (`labelledMarkers`, the `hoverKind` and `focusKind` state and the drawing split in `SeriesChart`, `MarkerLegend` buttons in `chart-legend.tsx`, hover and focus styling; business logic only, tests, spec and docs excluded)
- **Depends on**: SGS-138
- **On merge**: none
- **Source**: `design/M9.md` C8 and the "Marker labels (M9.7)" behavior rules, M9.7 row of the Criteria map; plan outline L, design questions 7 and 11 of the plan

## Context

Today only age-up markers carry a text label on the chart; every other kind is an unlabelled line with a hover title, and the marker legend items are plain `li` elements that do nothing. M9.7 makes each legend item a focusable button: hovering or focusing it labels that kind's markers, and the age-up labels return when no item is hovered or focused.

## Scope

State at `origin/main`, plus the end state of SGS-138 (`PinnedLegend` is rendered after `SeriesLegend` and `MarkerLegend`; `MarkerLegend` has no `pinnedAgeUps` prop and no `pinned-age-up` item and returns nothing when no kind is present) and of SGS-135 (`ChartHeader` lives in `chart-header.tsx`). Everything is in `components/apps/aoe4-build-order/` unless named otherwise. Contract names are those of `design/M9.md` C8.

- `line-chart.tsx`:
  - Add and export `labelledMarkers(markers, active)` beside `ageUpMarkers`: age-up markers when `active` is null, otherwise the markers of that kind. It is never called with a kind that has no markers.
  - Add and export `activeMarkerKind(markers, hoverKind, focusKind)` (design C8): the first of `hoverKind`, `focusKind` that is non-null and has at least one marker in `markers`; else null.
  - `SeriesChart` state: `hoverKind` and `focusKind` (each a marker kind or null); `active = activeMarkerKind(markers, hoverKind, focusKind)` over the current-run markers. Pass `active`, and callbacks that set `hoverKind` and `focusKind`, to `MarkerLegend`.
  - Stale state: when the markers change so that `hoverKind` or `focusKind` has no current-run marker left (its item unmounts with no `mouseleave` or `blur`), `SeriesChart` sets that state to null, by set-state-during-render or an effect keyed on the kinds present (implementer's choice), so the kind's labels do not show again until its item is hovered or focused again. A kind that still has markers stays active and its labels re-place for the new markers.
  - Replace the age-up-only label path (`labelled = ageUpMarkers(markers)` feeding `labelKey`, the width-measuring effect and `placeMarkers`) with `labelledMarkers(markers, active)`. Stacking, `data-label-rows` and the top chart margin follow the labelled set; label widths are measured through the existing `measureRef` mechanism for whichever markers are labelled (design leaves the keying to the implementer).
  - Drawing: every current-run marker is drawn exactly once as a `chart-marker` `ReferenceLine`. Labelled markers get the placed label; every other marker, of any kind including age-up, is a plain line with a `<title>` of its `markerLabel`. This replaces the `kind !== 'age-up'` filter in the plain-line block, so a marker never disappears when `active` changes.
  - Pinned markers are unchanged: only pinned age-ups are drawn (dashed, `chart-pinned-marker`), never labelled; other pinned kinds stay undrawn. The pinned legend, tooltip and header code from SGS-138 and SGS-135 is not touched.
  - Collapsing a chart unmounts the legend; `hoverKind` and `focusKind` are reset to null at that point so reopening the chart shows the age-up labels.
- `chart-legend.tsx`, `MarkerLegend`: new props `active`, `onHover(kind | null)`, `onFocusKind(kind | null)` besides `markers`. Each item stays an `li.list-inline-item` and now holds a `<button type="button" data-testid="chart-marker-legend-item" data-kind={kind} data-active="true" only when kind === active, aria-label="Show <Kind label> marker labels">` containing the swatch and the `MARKER_KIND_LABELS` text. `mouseenter` and `mouseleave` call `onHover(kind)` and `onHover(null)`; `focus` and `blur` call `onFocusKind(kind)` and `onFocusKind(null)`. Click, Enter and Escape do nothing beyond focus (no sticky selection). Kinds listed are unchanged: only kinds with a current-run marker in this chart, in `CHART_MARKER_KINDS` order.
- Styling: a hover and focus-visible state on the buttons that a user can see (the active item must look different from an inactive one), in `results.module.css` or with the Bootstrap utilities already used there; do not mix `d-*`, `flex-*` or spacing utilities with module CSS on the same element (REPO.md). Keep the marker legend inside the width at 390px (the narrow-layout spec checks it).
- Docs made untrue, in `docs/aoe4-build-order.md` (the chart-marker paragraph around "Only `age-up` markers carry a text label"): that only age-up markers ever carry a text label and the other kinds only a hover title; that the marker legend entries are passive. Add that a legend entry is a button, that hovering or focusing it labels that kind's markers (age-up labels return when none is hovered or focused, hover wins over focus), and that unlabelled markers, age-ups included, remain as lines with a hover title. Grep `docs/` and `ARCHITECTURE.md` for `marker legend`, `text label` and `chart-marker-legend-item` and fix every statement the change contradicts. Do not quote measured results.
- Tests:
  - `line-chart.test.ts`: add `labelledMarkers` cases (see criteria). The marker-legend cases that read `chart-marker-legend-item` markup move to the button markup. Static-markup cases cover `data-active` and the drawing rule for a given `active`. The implementer lists every test it edits.
  - New `acceptance/aoe4-marker-labels.spec.ts` (see criteria); reads every rect it compares in one `page.evaluate` (LESSONS).
  - `acceptance/aoe4-chart-readability.spec.ts` ("only age-up markers carry a text label ..."): keeps its default-state expectations; update only what the new drawing rule changes (an unlabelled age-up marker now also has a `<title>`). Any other test or spec that reads the legend items as `li` or assumes non-age-up markers can never be labelled moves to the new behavior.

**Out of scope:** pinned run display, tooltip, view toggles, the chart header, drag and caret, sticky or click-selected marker labels, labelling pinned markers, changing marker colours or kind order, and a DOM test environment for Vitest (the hover and focus cases are Playwright).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `labelledMarkers(markers, null)` returns the age-up markers in input order; with a kind that has markers it returns exactly that kind's markers in input order; with a kind that has none it returns an empty list. A test fails if `null` returns every marker, or if a non-null kind also returns age-ups.
- [ ] (respec 1) `activeMarkerKind` table test, each row failing on the named break: (null, null) gives null; hover with markers of that kind gives the hover kind; hover with no markers of that kind and focus null gives null; hover with no markers and focus on a kind that has markers gives the focus kind; hover and focus both with markers gives the hover kind; focus only, with markers, gives the focus kind. A test fails if a kind without markers is returned.
- [ ] (respec 1) When the markers change so the hovered or focused kind has none left, no render shows an empty label set while age-ups exist (labels fall back to the other state's kind if it has markers, else to age-ups), and `hoverKind` or `focusKind` for that kind is reset, so if the kind returns in a later run its labels do not show until its item is hovered or focused again. Covered by the `activeMarkerKind` rows above for the render, and by Playwright (or an extracted pure reset function under Vitest) for the reset. A check fails if the stale state persists and the labels return on their own.
- [ ] `MarkerLegend` static markup: one `li` per kind present in `markers`, each holding a `button` (not a bare `li`) with `data-testid="chart-marker-legend-item"`, `data-kind` and an `aria-label` naming that kind; items are in kind order; no markers renders nothing. `data-active="true"` is on the item whose kind equals `active` and on no other, and is absent when `active` is null. A test fails if `data-active` is set on every item or on none.
- [ ] Every current-run marker is drawn exactly once as a `chart-marker` line whatever kind is active, so no marker disappears when `active` changes. Recharts content may not render under `renderToStaticMarkup` (no measured width), so the implementer extracts the labelled-or-plain split as a pure function if a Vitest case is to cover it; otherwise the Playwright case below covers it. A check fails if the old `kind !== 'age-up'` filter is kept (age-ups then vanish whenever another kind is active).
- [ ] Playwright (`acceptance/aoe4-marker-labels.spec.ts`), on a build whose result has markers of at least two kinds: hovering a kind's legend item shows one reference-line label per marker of that kind in the chart and no age-up label (unless the kind is age-up); the label rects do not overlap each other. The test first asserts that the chart has markers of that kind and of age-up, so it cannot pass vacuously. Every marker still has a `chart-marker` line, age-ups included, and an age-up line shown unlabelled has a hover title.
- [ ] Playwright: moving the mouse off the item restores the age-up labels; pressing Tab onto an item (keyboard focus, no hover) does what hovering does, and blurring restores the age-up labels; with one item hovered and another focused, the hovered kind's labels show, and after the hover ends the focused kind's labels show. Pressing Escape or clicking an item changes nothing beyond focus.
- [ ] Playwright: collapsing a chart while an item is hovered or focused, then expanding it, shows the age-up labels (state was reset).
- [ ] The active item looks different from an inactive one and a keyboard-focused item shows a focus indicator (computed style, not only an attribute); at 390px wide the marker legend does not overflow horizontally and the page has no horizontal overflow.
- [ ] Pinned runs are unaffected: with a pinned run, pinned age-up markers are still drawn dashed and unlabelled whatever kind is active, and no other pinned kind is drawn.
- [ ] The docs listed in Scope no longer contradict the code and describe the legend buttons and the labelling rule.
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npm test` pass; `next build` succeeds.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-11

- Underspecified: the active kind could have no marker left when markers change, leaving an empty label set.
- Changed: Scope adds `activeMarkerKind` and the stale-state reset (design C8); criteria add the `activeMarkerKind` table and the reset case; open question deleted.
- Branch work standing: none; no branch work exists yet.
