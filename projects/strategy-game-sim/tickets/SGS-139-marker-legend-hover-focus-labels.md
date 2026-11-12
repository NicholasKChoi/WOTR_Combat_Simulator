# SGS-139: Marker legend items label that kind's markers on hover or focus

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.7
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none (UI only; no engine, data or simulation path is touched)
- **Unverified assumptions**: recharts at the pinned version renders a `ReferenceLine` `label` and a child `<title>` the same way whichever of the two a marker uses, and re-renders them when the same keyed marker moves from one to the other; `getComputedTextLength` on the hidden measuring `<text>` returns usable widths for labels of every kind; Chromium in Playwright fires no `mouseleave` or `blur` that React delivers for a legend item removed from the DOM by a collapse (the collapse Playwright case relies on this to fail without the reset, so it asserts the item was active before and the legend is gone after). Unit tests render with `renderToStaticMarkup`, which fires no events and runs no effects, so only the Playwright spec exercises hover, focus and measured widths for real
- **LOC estimate**: 100 (`labelledMarkers`, `activeMarkerKind`, `liveMarkerKind`, the `hoverKind` and `focusKind` state and the drawing split in `SeriesChart`, `MarkerLegend` buttons in `chart-legend.tsx`, hover and focus styling; business logic only, tests, spec and docs excluded)
- **Depends on**: SGS-138
- **On merge**: CONTEXT.md Key surfaces: add `liveMarkerKind(markers, kind, collapsed)` in `components/apps/aoe4-build-order/line-chart.tsx` (resets a stale or collapsed marker-legend hover or focus kind to null; beside design/M9.md C8)
- **Source**: `design/M9.md` C8 and the "Marker labels (M9.7)" behavior rules, M9.7 row of the Criteria map; plan outline L, design questions 7 and 11 of the plan

## Context

Today only age-up markers carry a text label on the chart; every other kind is an unlabelled line with a hover title, and the marker legend items are plain `li` elements that do nothing. M9.7 makes each legend item a focusable button: hovering or focusing it labels that kind's markers, and the age-up labels return when no item is hovered or focused.

## Scope

State at `origin/main`, plus the end state of SGS-138 (`PinnedLegend` is rendered after `SeriesLegend` and `MarkerLegend`; `MarkerLegend` has no `pinnedAgeUps` prop and no `pinned-age-up` item and returns nothing when no kind is present) and of SGS-135 (`ChartHeader` lives in `chart-header.tsx`; the chart's collapse control is the `CollapseCaret` with `data-testid="chart-collapse"`). Everything is in `components/apps/aoe4-build-order/` unless named otherwise. Contract names are those of `design/M9.md` C8.

Ordering against SGS-137: none. Both depend on SGS-138 and neither on the other; either may merge first. SGS-137's scope excludes `line-chart.tsx` and `chart-legend.tsx`, and the two tickets edit different paragraphs of `docs/aoe4-build-order.md` (SGS-137 the Gather rates checkbox and chart controls, this ticket the chart-marker paragraph). Whichever merges second rebases over the other; neither changes the other's behavior. If SGS-137 does end up touching `line-chart.tsx` (its `headerControls` pass-through), keep both changes on rebase.

- `line-chart.tsx`:
  - Add and export `labelledMarkers(markers, active)` beside `ageUpMarkers`: age-up markers when `active` is null, otherwise the markers of that kind. It is never called with a kind that has no markers.
  - Add and export `activeMarkerKind(markers, hoverKind, focusKind)` (design C8): the first of `hoverKind`, `focusKind` that is non-null and has at least one marker in `markers`; else null.
  - Add and export one pure reset function, `liveMarkerKind(markers, kind, collapsed)`: returns `kind` when `kind` is non-null, `collapsed` is false and `markers` has at least one marker of `kind`; otherwise null. It is the only reset logic: `SeriesChart` applies it to both `hoverKind` and `focusKind` with the current-run markers and the chart's collapsed flag, and sets a slot to null when the function returns null for a non-null slot (set-state-during-render or an effect keyed on the kinds present and `collapsed`; implementer's choice). This covers both design rules: a kind whose markers are gone (its item unmounts with no `mouseleave` or `blur`) and a collapsed chart (the legend unmounts). A kind that still has markers in an expanded chart stays active and its labels re-place for the new markers.
  - `SeriesChart` state: `hoverKind` and `focusKind` (each a marker kind or null); `active = activeMarkerKind(markers, hoverKind, focusKind)` over the current-run markers, so the render never uses a stale kind even before the reset lands. Pass `active`, and callbacks that set `hoverKind` and `focusKind`, to `MarkerLegend`.
  - Replace the age-up-only label path (`labelled = ageUpMarkers(markers)` feeding `labelKey`, the width-measuring effect and `placeMarkers`) with `labelledMarkers(markers, active)`. Stacking, `data-label-rows` and the top chart margin follow the labelled set; label widths are measured through the existing `measureRef` mechanism for whichever markers are labelled (design leaves the keying to the implementer).
  - Drawing: every current-run marker is drawn exactly once as a `chart-marker` `ReferenceLine`. Labelled markers get the placed label; every other marker, of any kind including age-up, is a plain line with a `<title>` of its `markerLabel`. This replaces the `kind !== 'age-up'` filter in the plain-line block, so a marker never disappears when `active` changes.
  - Pinned markers are unchanged: only pinned age-ups are drawn (dashed, `chart-pinned-marker`), never labelled; other pinned kinds stay undrawn. The pinned legend, tooltip and header code from SGS-138 and SGS-135 is not touched.
- `chart-legend.tsx`, `MarkerLegend`: new props `active`, `onHover(kind | null)`, `onFocusKind(kind | null)` besides `markers`. Each item stays an `li.list-inline-item` and now holds a `<button type="button" data-testid="chart-marker-legend-item" data-kind={kind} data-active="true" only when kind === active, aria-label naming the kind's `MARKER_KIND_LABELS` text and saying it shows that kind's marker labels>` containing the swatch and the `MARKER_KIND_LABELS` text. `mouseenter` and `mouseleave` call `onHover(kind)` and `onHover(null)`; `focus` and `blur` call `onFocusKind(kind)` and `onFocusKind(null)`. Click, Enter and Escape do nothing beyond focus (no sticky selection). Kinds listed are unchanged: only kinds with a current-run marker in this chart, in `CHART_MARKER_KINDS` order.
- Styling: a hover and focus-visible state on the buttons that a user can see (the active item must look different from an inactive one), in `results.module.css` or with the Bootstrap utilities already used there; do not mix `d-*`, `flex-*` or spacing utilities with module CSS on the same element (REPO.md). Keep the marker legend inside the width at 390px (the narrow-layout spec checks it).
- Docs made untrue, in `docs/aoe4-build-order.md` (the chart-marker paragraph around "Only `age-up` markers carry a text label"): that only age-up markers ever carry a text label and the other kinds only a hover title; that the marker legend entries are passive. Add that a legend entry is a button, that hovering or focusing it labels that kind's markers (age-up labels return when none is hovered or focused, hover wins over focus), and that unlabelled markers, age-ups included, remain as lines with a hover title. Grep `docs/` and `ARCHITECTURE.md` for `marker legend`, `text label` and `chart-marker-legend-item` and fix every statement the change contradicts. Do not quote measured results.
- Tests:
  - `line-chart.test.ts`: add `labelledMarkers`, `activeMarkerKind` and `liveMarkerKind` table cases (see criteria). The marker-legend cases that read `chart-marker-legend-item` markup move to the button markup. Static-markup cases cover `data-active`. The implementer lists every test it edits.
  - New `acceptance/aoe4-marker-labels.spec.ts` (see criteria); reads every rect it compares in one `page.evaluate` (LESSONS).
  - `acceptance/aoe4-chart-readability.spec.ts` ("only age-up markers carry a text label ..."): keeps its default-state expectations; update only what the new drawing rule changes (its title checks skip age-ups, which are labelled by default, so it may need no edit). Any other test or spec that reads the legend items as `li` or assumes non-age-up markers can never be labelled moves to the new behavior.

**Out of scope:** pinned run display, tooltip, view toggles, the chart header, drag and caret, sticky or click-selected marker labels, labelling pinned markers, changing marker colours or kind order, and a DOM test environment for Vitest (the hover and focus cases are Playwright).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `labelledMarkers(markers, null)` returns the age-up markers in input order; with a kind that has markers it returns exactly that kind's markers in input order; with a kind that has none it returns an empty list. A test fails if `null` returns every marker, or if a non-null kind also returns age-ups.
- [ ] (respec 1) `activeMarkerKind` table test, each row failing on the named break: (null, null) gives null; hover with markers of that kind gives the hover kind; hover with no markers of that kind and focus null gives null; hover with no markers and focus on a kind that has markers gives the focus kind; hover and focus both with markers gives the hover kind; focus only, with markers, gives the focus kind. A test fails if a kind without markers is returned. These rows cover the render rule: no render shows an empty label set while age-ups exist.
- [ ] (respec 2) `liveMarkerKind` Vitest table in `line-chart.test.ts`: a null kind gives null; a kind with markers in an expanded chart is kept; a kind with no markers left gives null; a kind with markers in a collapsed chart gives null. A test fails if a kind without markers is kept, or if `collapsed` is ignored. `SeriesChart` resets both `hoverKind` and `focusKind` through this function and has no other reset logic.
- [ ] `MarkerLegend` static markup: one `li` per kind present in `markers`, each holding a `button` (not a bare `li`) with `data-testid="chart-marker-legend-item"`, `data-kind` and an `aria-label` naming that kind; items are in kind order; no markers renders nothing. `data-active="true"` is on the item whose kind equals `active` and on no other, and is absent when `active` is null. A test fails if `data-active` is set on every item or on none.
- [ ] (respec 2) Playwright owns the drawing rule: in `acceptance/aoe4-marker-labels.spec.ts`, while a non-age-up kind is active, every current-run marker still has exactly one `chart-marker` line (the count equals the run's marker count, asserted non-zero first), age-ups included, and an age-up line shown unlabelled has a hover title. A check fails if the old `kind !== 'age-up'` filter is kept (age-ups then vanish whenever another kind is active).
- [ ] Playwright (`acceptance/aoe4-marker-labels.spec.ts`), on a build whose result has markers of at least two kinds: hovering a kind's legend item shows one reference-line label per marker of that kind in the chart and no age-up label (unless the kind is age-up); the label rects do not overlap each other. The test first asserts that the chart has markers of that kind and of age-up, so it cannot pass vacuously.
- [ ] Playwright: moving the mouse off the item restores the age-up labels; pressing Tab onto an item (keyboard focus, no hover) does what hovering does, and blurring restores the age-up labels; with one item hovered and another focused, the hovered kind's labels show, and after the hover ends the focused kind's labels show. Pressing Escape or clicking an item changes nothing beyond focus.
- [ ] (respec 2) Playwright collapse reset, done so the hover does not end through normal events: hover a non-age-up item and assert it has `data-active="true"`; collapse the chart with `dispatchEvent('click')` on `chart-collapse` (no pointer movement, no focus change) and assert the marker legend is gone; move the pointer away from where the legend was; expand the chart; the age-up labels show and no item has `data-active`. The case fails if the collapse reset is removed (the hovered kind's labels then return on expand).
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

## Re-spec 2 - 2026-11-11

- Underspecified: the reset had an either-or verification path, and the collapse case could pass through the normal `mouseleave` and `blur` a real click causes.
- Changed: Scope names one pure reset `liveMarkerKind(markers, kind, collapsed)` used for both slots and both rules, with a Vitest table; the collapse Playwright case collapses by `dispatchEvent` after asserting the item is active; Playwright owns the drawing rule; ordering against SGS-137 stated (none); aria-label text no longer dictated.
- Branch work standing: none; no branch work exists yet.
