# SGS-134: Widen the chart layout model, make the key-results panel collapsible, and give the page the one layout owner

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.4
- **Priority**: high
- **Risk**: standard
- **Invariants**: none (no engine, data, or simulation path is touched)
- **Unverified assumptions**: none
- **LOC estimate**: 180 (`chart-layout.ts`, `use-chart-layout.ts`, `collapse-caret.tsx`, `compare-panel.tsx`, `results.tsx` and the page; business logic only, CSS and tests excluded)
- **Depends on**: SGS-128
- **On merge**: none
- **Source**: `design/M9.md` C2, C4, C5 and the caret part of C3 (`CollapseCaret`), M9.4 row of the Criteria map, "Chart layout, drag and caret (M9.4)" behavior rules; plan outline G

## Context

M9.4 needs one chart-layout state that drives the chart controls and the new key-results panel collapse, and that survives a reload. Today `Results` calls `useChartLayout` itself, so `ComparePanel` (rendered by the page beside `Results`, and rendered even when no run is shown) cannot share it. The hook also computes `move` and `toggle` from the layout captured at render time and writes storage inside the update function, so two calls in one render lose one of them.

## Scope

State at `origin/main`. Everything is in `components/apps/aoe4-build-order/` unless named otherwise. Contract names and shapes are those of `design/M9.md` C2, C4, C5 and the `CollapseCaret` signature in C3; use them exactly.

- `chart-layout.ts`:
  - Add `KEY_RESULTS_PANEL_ID` and `LayoutPanelId` (a chart id or the key-results id). `ChartLayout.collapsed` becomes a list of `LayoutPanelId`; `order` stays chart ids only.
  - `normalizeChartLayout` keeps `key-results` in `collapsed` (still deduplicated, still dropping other unknown ids). Its `order` handling does not change, so a stored `key-results` in `order` is dropped. A stored M8 value (charts only) reads unchanged.
  - Add `moveChartTo(layout, id, toIndex)`: `toIndex` is the final 0-based index of `id` in `order`, clamped to the valid range; `collapsed` is copied unchanged; an `id` not in `order` returns an equal copy; neither input nor the default layout arrays are mutated or handed out. Keep `moveChart` as is.
  - Widen `toggleChartCollapsed` to take a `LayoutPanelId`.
- `use-chart-layout.ts`: the hook returns `{ layout, move, moveTo, toggle }` (`ChartLayoutControls`).
  - `move`, `moveTo` and `toggle` use functional `setState`, so two calls in one render both apply in call order, and they no longer touch storage.
  - State holds the layout plus a `loaded` flag, false until the mount effect has read storage. The mount effect sets the read layout and `loaded: true` together. One effect on the layout and `loaded` writes storage, and only when `loaded` is true, so the default layout never overwrites a stored one.
  - The first render is `DEFAULT_CHART_LAYOUT`. Storage that is unavailable or throwing leaves the layout working in memory with nothing persisted (as `readChartLayout` and `writeChartLayout` already do).
- `collapse-caret.tsx` (new): `CollapseCaret` with the C3 props and DOM: a `button type="button"` with the given `data-testid`, `aria-expanded`, `aria-controls`, and an `aria-label` that is `Collapse <name>` when expanded and `Expand <name>` when collapsed. Its glyph points down when expanded and right when collapsed. The glyph source (inline SVG or a Unicode character), size and styling are left to the implementer.
- `compare-panel.tsx`: `ComparePanel` gains `collapsed` and `onToggleCollapsed` and follows C4: a `compare-panel` section; a header row of the `compare-heading` h3 "Key results", a `CollapseCaret` (`testId="compare-collapse"`, `name="key results"`, `controlsId="compare-body"`), then the existing `pin-run` and `unpin-run` buttons; and a `compare-body` element (`id="compare-body"`, `data-collapsed`) that holds the pinned label and the compare table. Collapsed, the body's children are not rendered but the header row, including both pin buttons, stays (owner decision 6A). Move the layout CSS the header row needs into a CSS module already used by the component (`workbench.module.css` or `results.module.css`).
- `results.tsx`: `Results` takes `chartLayout: ChartLayoutControls` and stops calling `useChartLayout` (remove the import). It still passes `toggle` and the collapsed state to each chart through the existing `layout` prop, and still uses `move` for the existing Up and Down buttons. The text buttons and the `pendingFocus` effect stay; the drag-handle ticket removes them.
- `pages/apps/aoe4-build-order.tsx`: call `useChartLayout()` once, pass `chartLayout` to `Results`, and pass `collapsed` (from `layout.collapsed` including the key-results id) and `onToggleCollapsed` (`toggle` of the key-results id) to `ComparePanel`.
- Docs made untrue by this change, in `docs/aoe4-build-order.md`: the statement that the "Results" heading is followed directly by the pin and unpin buttons; the chart-layout storage statement that `collapsed` holds chart ids and that unknown ids are dropped (it now also holds the key-results panel id); and any statement that only charts collapse. Grep the doc and `ARCHITECTURE.md` for `chart-layout`, `ComparePanel`, `pin-run` and `Key results` and fix every statement the change contradicts. Add the key-results collapse behavior and its persistence. Do not quote measured results.
- Tests:
  - `chart-layout.test.ts` (extend): cases listed in the criteria. Use `fakeStorage` and `throwingStorage` from `storage-test-helpers.ts` (the end state of the dependency) and delete this file's local copies if the dependency has not already.
  - `compare-panel.test.ts` (new, Vitest `renderToStaticMarkup` with `createElement`, as in `save-build.test.ts`): expanded and collapsed markup.
  - `acceptance/aoe4-key-results-collapse.spec.ts` (new; a separate file so the rewrite of `aoe4-chart-layout.spec.ts` in the drag ticket does not conflict).
- No hook test in Vitest: the repo has no DOM test environment (`design/M9.md`, Test levels). The two-calls-in-one-render rule and the `loaded` guard are a review check on the hook; Playwright covers persistence.

**Out of scope:** the drag handle, `chart-header.tsx`, `use-chart-drag.ts`, `chart-drag.ts`, and removing `chart-move-up`, `chart-move-down` or the `pendingFocus` effect (all in the chart-header ticket); using `CollapseCaret` on charts; view toggles; pinned-legend and marker-legend changes; any change to `line-chart.tsx`; a DOM test environment; rewriting `acceptance/aoe4-chart-layout.spec.ts`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `moveChartTo` puts the chart at the clamped final index with the other charts in their previous relative order. A test covers moving to the first index, the last index, the chart's current index (equal copy), an index below 0 and an index above the last (both clamped), and an `id` not in `order` (equal copy). It also checks `collapsed` is unchanged and that the input layout and the default layout arrays are not mutated. A test fails if the index is applied before the chart is removed from the order.
- [ ] `normalizeChartLayout` keeps `key-results` in `collapsed`, drops other unknown ids from `collapsed`, drops `key-results` and other unknown ids from `order`, and reads an M8-shaped value unchanged. A test covers each; it fails if `key-results` is filtered out of `collapsed`.
- [ ] `toggleChartCollapsed` accepts `key-results`: toggling it adds it when absent and removes it when present, two toggles restore the original state, and it never holds an id twice.
- [ ] A layout with `key-results` collapsed round-trips through `writeChartLayout` and `readChartLayout` using a shared fake storage, and storage that throws on read or write leaves `readChartLayout` returning the default and `writeChartLayout` not throwing (these tests use the shared helpers, not local copies).
- [ ] `useChartLayout` is called in the page and in no other non-test file; `Results` has no call and no import of it. Search criterion: every match of `useChartLayout(` outside test files, other than its definition in `use-chart-layout.ts`, is in `pages/apps/aoe4-build-order.tsx`.
- [ ] `useChartLayout` updates through functional `setState` and writes storage only from an effect gated on `loaded`; `move`, `moveTo` and `toggle` do not touch storage. This is a review check on the hook source (no Vitest hook test); a reviewer confirms by reading it, and the Playwright reload case below fails if the default layout overwrites a stored one.
- [ ] `ComparePanel` static markup, with a pinned run and `collapsed` false, contains `compare-heading` with text "Key results", `compare-collapse` with `aria-expanded="true"` and `aria-controls="compare-body"`, `pin-run`, `unpin-run`, and a `compare-body` holding the pinned label. With `collapsed` true, `compare-collapse` has `aria-expanded="false"`, `pin-run` and `unpin-run` are still present, and `compare-body` holds neither the pinned label nor the compare table. A test fails if collapsing hides the pin buttons or leaves the body's children rendered.
- [ ] The `CollapseCaret` `aria-label` is `Collapse <name>` when expanded and `Expand <name>` when collapsed, and `aria-controls` equals the `controlsId` prop. A test covers both states.
- [ ] Playwright `acceptance/aoe4-key-results-collapse.spec.ts` (viewport that shows the results column): with a pinned run, clicking `compare-collapse` flips `aria-expanded` and hides the `compare-body` content while `pin-run` and `unpin-run` stay visible and the caret keeps focus; clicking again restores it. After collapsing the key-results panel and one chart (through the existing `chart-collapse`), a page reload keeps both collapsed. The test asserts the opposite state before each action so it cannot pass on the initial render.
- [ ] A stored M8 layout (charts only, with a chart collapsed) still loads, and the existing `acceptance/aoe4-chart-layout.spec.ts` passes unchanged in what it asserts (the Up, Down and collapse buttons still work through the page-level hook).
- [ ] The docs listed in Scope no longer contradict the code: the Results heading and pin buttons description, and the chart-layout storage description, name the key-results collapse and that its state persists in the same key.
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npm test` pass; `next build` succeeds.
- [ ] No INVARIANTS.md regressions

## Open questions

none
