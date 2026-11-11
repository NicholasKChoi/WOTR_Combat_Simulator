# SGS-114: Collapse and move each result chart, persisted per browser

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M8 / M8.2, M8.9 (chart controls doc; collapse and reorder spec)
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none adjacent (A1 to A3 cover the engine and data; this ticket touches rendering and browser storage only)
- **LOC estimate**: 220 (`chart-layout.ts` about 70, `use-chart-layout.ts` about 30, `results.tsx` and `line-chart.tsx` about 90, `browser-storage.ts` 8; tests, CSS and docs excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M8.md C9, "Charts (M8.2)" behavior rules and Criteria map M8.2, M8.9; plan outline C and design question 1 (answered by the design: `browser-storage.ts` is created by this ticket)

## Context

The Results column draws four `SeriesChart`s in a fixed order, so a user who cares about one chart scrolls past
the other three. Each chart gets a collapse button and move up / down buttons, and the layout is remembered per
browser in `localStorage`.

## Scope

All paths are under `components/apps/aoe4-build-order/` unless noted. Read at `origin/main`.

- **`browser-storage.ts` (new).** Export `browserStorage(): Storage | null`, the guarded `window.localStorage`
  getter, moved unchanged from `pages/apps/aoe4-build-order.tsx`. The page deletes its local copy and imports it;
  its three call sites (pin restore, `pinShownRun`, `unpin`) keep their behavior.
- **`chart-layout.ts` (new), the C9 contract exactly:** `RESULT_CHART_IDS` (`chart-units-produced`,
  `chart-gather-rates`, `chart-gathered-resources`, `chart-floating-resources`, in that order), `ChartId`,
  `CHART_LAYOUT_STORAGE_KEY` (`aoe4-build-order.chart-layout`), `ChartLayout` (`{ version: 1; order; collapsed }`),
  `DEFAULT_CHART_LAYOUT`, `storedChartLayoutSchema` (zod, `REPO.md` `schemaLibrary`; the stored value crosses a
  trust boundary), `normalizeChartLayout(value: unknown)`, `readChartLayout(storage: Storage | null)`,
  `writeChartLayout(storage: Storage | null, layout)`, `moveChart(layout, id, 'up' | 'down')` and
  `toggleChartCollapsed(layout, id)`. Rules: `normalizeChartLayout` drops unknown ids and duplicates (first kept) from
  both lists, appends missing ids to `order` in `RESULT_CHART_IDS` order, and returns the default for any invalid
  value or a version other than 1. `readChartLayout` and `writeChartLayout` never throw (storage `null`,
  `getItem` / `setItem` throwing, non-JSON). `moveChart` swaps with the neighbour and returns an equal layout at the
  ends. Follow `pin-storage.ts` and `pin-storage.test.ts` for the storage and fake-storage style. Both functions
  return values, never mutate their arguments.
- **`use-chart-layout.ts` (new).** `useChartLayout(): { layout; move(id, direction); toggle(id) }`. State starts as
  `DEFAULT_CHART_LAYOUT` so server and first client render match; an effect then applies
  `readChartLayout(browserStorage())`. `move` and `toggle` update state and call `writeChartLayout` on that change
  only; the hydration effect does not write.
- **`results.tsx`.** `Results` calls `useChartLayout()` and renders its four charts in `layout.order`, keyed by chart
  id and still direct children of `results-last-good`, after the warnings and info lists. Each chart gets the `layout`
  prop below. The `perVillager` state and the series and pinned data stay in `Results`, so they survive collapse and
  reorder. The Per villager `headerControls` render inside the chart body (see `line-chart.tsx`).
- **`line-chart.tsx`.** `SeriesChart` gains the optional prop
  `layout?: { collapsed: boolean; first: boolean; last: boolean; onToggle(): void; onMove(direction: 'up' | 'down'): void }`.
  With it, the header row (the `h3` title) also holds three native buttons: `chart-collapse` (`aria-expanded`,
  `aria-controls` the body id), `chart-move-up` (disabled when `first`) and `chart-move-down` (disabled when
  `last`), in that Tab order. Each button's accessible name contains the chart title (for example "Collapse Gather
  rates chart"); wording, icons and styling are left to the implementer. The header row is a module-CSS element
  from `results.module.css`; the existing Bootstrap-utility wrapper around the `h3` and `headerControls`
  (`d-flex flex-wrap align-items-baseline column-gap-3`) is removed, and no `d-*` / `flex-*` utility class sits on
  the new header row. The series legend, plot, marker legend and `headerControls` render inside a wrapper
  `data-testid="chart-body"` with `id` `` `${testId}-body` `` (the `aria-controls` target). That wrapper is always
  rendered: when collapsed it keeps its `id`, carries the `hidden` attribute, and renders no children, so
  `aria-controls` always names an element in the DOM. The hidden measuring `<svg>` (`measureRef`) stays a direct
  child of the container, outside the body, so the label-width effect keeps its ref while collapsed. The container
  `data-testid=<chart id>` gets `data-collapsed="true" | "false"`. A collapsed chart does not render the plot, so it
  draws no step band, markers or pinned lines. The hide set (`hidden`), the measured width and hover state stay in
  `SeriesChart` state and survive collapse. Without `layout` (the existing `line-chart.test.ts` renders) the chart
  renders as today with no buttons, apart from the header-row markup change above. After a move, focus stays on
  the pressed button of the moved chart; when that button is now disabled (the chart reached an end), focus goes
  to the chart's other move button. A keyed reorder can blur the focused node in Chromium, so focus is restored
  explicitly (for example in an effect that runs after the order changes), not left to the DOM move.
- **`results.module.css`.** Styles for the header row and the buttons, only what the controls need. Do not mix
  Bootstrap `d-*` / `flex-*` utilities with module CSS on the same element (`REPO.md` review checklist).
- **`acceptance/helpers.ts`.** Keep the exported name `CHART_IDS` and redefine it as
  `export const CHART_IDS = RESULT_CHART_IDS`, importing `RESULT_CHART_IDS` from `chart-layout.ts` (as `helpers.ts`
  already imports from `components/`). `RESOURCE_CHARTS` stays a standalone `as const` literal with its current
  members and is no longer used to build `CHART_IDS`. No spec that imports `CHART_IDS` or `RESOURCE_CHARTS` changes.
  `aoe4-results-split.spec.ts` keeps its own local `CHART_IDS` literal (a sibling ticket replaces it with the
  import). Do not touch the other helpers: sibling tickets edit this file.
- **`acceptance/aoe4-chart-layout.spec.ts` (new)** per the criteria. Locate charts by `data-testid` from `CHART_IDS`
  (imported from `./helpers`), never by position. Read geometry in one `page.evaluate` (LESSONS). The hover-band
  and pinned-line case runs at `SPLIT_VIEWPORT`, where the build view and the charts show together; every other
  case runs at `TABS_VIEWPORT` and calls `showTab(page, 'results')` before reading charts.
- **`docs/aoe4-build-order.md`, Page section.** After the paragraph that describes the four charts and their
  legends (the one beginning "A 200 draws four line charts"), add a "Chart controls" paragraph or short list: each
  chart has collapse, move up and move down buttons; what collapsing hides and keeps (title row and buttons stay;
  series legend, plot, marker legend and the Per villager checkbox hide; the hide set and Per villager survive);
  that a collapsed chart draws no step band or pins; the default order; that the layout is kept in `localStorage`
  under `aoe4-build-order.chart-layout` as `{ version, order, collapsed }`, restored after load, normalised when
  stored ids are unknown, duplicated or missing, and that an unavailable or blocked store means the layout lasts for
  the page session with no error. Describe behavior and rules only, no measured values. The existing sentence
  "The charts are the only column at every width and take the full Results width." stays true.

**Out of scope:** the legend and pinned-key change (separate ticket; it also edits `line-chart.tsx` in other hunks),
the split-scroll layout and headings, `h2` "Results" styling, the step table, the page's `?n=` / `?b=` handling,
keyboard shortcuts beyond native button behavior, a reset-layout control, per-build layouts.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `chart-layout.test.ts` is a table-driven unit test (nearest style: `pin-storage.test.ts`). `normalizeChartLayout` rows: a valid layout round-trips unchanged; a non-object, wrong `version`, and non-array `order` each give `DEFAULT_CHART_LAYOUT`; an `order` containing an unknown id, a duplicate id and omitting two ids gives a permutation of `RESULT_CHART_IDS` in which the listed valid ids keep their first-seen relative order and the missing ids follow in `RESULT_CHART_IDS` order; `collapsed` with an unknown id and a duplicate keeps each valid id once. It fails if normalisation keeps duplicates or unknown ids, or loses a missing id.
- [ ] `chart-layout.test.ts`: `moveChart` swaps a chart with its neighbour in both directions, and `up` on the first chart and `down` on the last return a layout equal to the input (breaks: wrapping, an out-of-range swap, duplicating an id). `toggleChartCollapsed` adds an id that is absent and removes one that is present, and `collapsed` never gains duplicates. Inputs are not mutated.
- [ ] `chart-layout.test.ts`: `readChartLayout` returns `DEFAULT_CHART_LAYOUT` and does not throw for a `null` storage, a storage whose `getItem` throws, and a stored non-JSON string; `writeChartLayout` does not throw for `null` and for a storage whose `setItem` throws; a write then a read round-trips a non-default layout through a fake `Storage`. The stored JSON has exactly the keys `version`, `order` and `collapsed`.
- [ ] `line-chart.test.ts` (server render): with `layout` set, the markup holds `chart-collapse`, `chart-move-up` and `chart-move-down` with a title-bearing accessible name, `chart-move-up` is `disabled` when `first` and `chart-move-down` when `last`, `data-collapsed="true"` and no `chart-body` content (series legend) when `collapsed`, and `aria-expanded` matches; without `layout` none of the three buttons render. It fails if `collapsed` still renders the legend or if `first` leaves the up button enabled.
- [ ] (respec 1) `line-chart.test.ts` (server render): with `layout` set and `collapsed` true, the markup still holds the `chart-body` element, carrying `hidden` and an `id` equal to the `chart-collapse` button's `aria-controls` value, with no children; with `collapsed` false the same `id` is present without `hidden`. With `collapsed` true (the body is empty, so only the container, header row and measure svg remain) the markup contains no `d-flex` or `flex-wrap` class. It fails if the collapsed body is unmounted (dangling `aria-controls`) or the Bootstrap header wrapper remains.
- [ ] `git grep -n "function browserStorage"` over `pages` and `components` matches only `components/apps/aoe4-build-order/browser-storage.ts`, and the page imports it from there.
- [ ] `npx tsc --noEmit` and `npm run lint:dup` pass, and `npm test` passes with existing tests that were not edited to fit the change. The report lists every existing test it edits.
- [ ] (respec 1) `acceptance/aoe4-chart-layout.spec.ts` (at `TABS_VIEWPORT` after `showTab(page, 'results')`, except the hover-band case at `SPLIT_VIEWPORT`): with no stored layout the charts appear in `CHART_IDS` order, every `data-collapsed` is `false`, and the page load alone does not write `aoe4-build-order.chart-layout`.
- [ ] Spec: clicking `chart-collapse` of one chart makes its `chart-body` hidden, flips `aria-expanded` to `false` and `data-collapsed` to `true`, leaves the title and its three buttons visible, and leaves the other three charts expanded; clicking it again restores the body. For the Gather rates chart, the `gather-rates-per-villager` checkbox is hidden when collapsed, and a checked value is still checked, with the y-axis label `Per villager per minute`, after expanding again. A legend item hidden before collapse is still hidden after expanding.
- [ ] Spec: `chart-move-up` on the second chart and `chart-move-down` on the first each swap it with its neighbour (order read from the DOM by `data-testid`); the first chart's up button and the last chart's down button are disabled. By keyboard, Tab reaches `chart-collapse`, then `chart-move-up`, then `chart-move-down` in a header, and Enter on a focused button activates it. After `chart-move-down` on the first chart, focus is on that chart's `chart-move-down`; after `chart-move-down` brings a chart to the last place, `document.activeElement` is that chart's `chart-move-up`. It fails if focus drops to `body` after a move.
- [ ] Spec: after collapsing one chart and moving another, a reload shows the same order and collapsed set with no interaction; a second reload shows it again (the restore does not overwrite storage with the default). A stored value that is unknown-ids-only or not JSON (set with `addInitScript`) shows the default layout and no page error; a stored layout missing one id shows that chart appended at the end.
- [ ] Spec: with `localStorage` access blocked by an `addInitScript` that makes `window.localStorage` throw, the page loads, collapse and move still work for the page session, and no alert or page error appears.
- [ ] Spec: after a reorder, hovering a step row in the build view still shades the step band on every expanded chart, a pinned run still draws its dashed lines on expanded charts, and a collapsed chart has no visible `chart-step-band`. The spec holds the pin and expanded charts in place before asserting (the conditions it relies on are asserted first so it cannot pass vacuously).
- [ ] (respec 1) `acceptance/helpers.ts` defines `CHART_IDS` as `RESULT_CHART_IDS` imported from `chart-layout.ts`, and `git diff --name-only origin/main...HEAD -- acceptance` lists only `acceptance/helpers.ts` and the new `acceptance/aoe4-chart-layout.spec.ts`. Every existing spec that uses `CHART_IDS` or `RESOURCE_CHARTS` (for example `aoe4-build-order-pin-compare`, `aoe4-chart-readability`, `aoe4-gather-rates-per-villager`, `aoe4-gathered-resources`, `aoe4-split-layout`), and `aoe4-results-split`, still passes unedited.
- [ ] Doc: `docs/aoe4-build-order.md` has the "Chart controls" text described in Scope, names the storage key and shape, and states no measured value. `git grep -n "chart-layout" docs/aoe4-build-order.md` finds it.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-10

- Underspecified: whether `CHART_IDS` was renamed or re-exported, what `RESOURCE_CHARTS` and `aoe4-results-split.spec.ts` become, whether a collapsed `chart-body` is unmounted (and where the measure svg lives), whether the Bootstrap header wrapper goes, and which viewport the new spec uses.
- Changed: `helpers.ts` re-exports `CHART_IDS = RESULT_CHART_IDS` with `RESOURCE_CHARTS` a standalone literal and no existing spec edited; the collapsed body stays in the DOM with `id` and `hidden` and no children, the measure svg stays outside it, and the header row is module CSS; viewports named per case; explicit focus restore after a move.
- No branch work existed; nothing to carry over.

## Rework 1 - 2026-11-10 (review, text)

Review bounced at tip 72ac4acb410237a084cecf551c139e8f36672b72 (report: reports/SGS-114-review-1.md). Only gate so far.

Findings:
- `components/apps/aoe4-build-order/line-chart.tsx:161-277` (text): the JSX inside the new `<>` fragment is mis-indented. `{headerControls}` is at 24 columns but lines 163-276 (`<ResponsiveContainer>` through `<MarkerLegend>`) sit at 20, the fragment's own level.

Required fixes:
- [ ] Indent lines 163-276 of `line-chart.tsx` by 4 more spaces and leave `</>` at 20 columns. Whitespace only; no other change.
