# SGS-104: Split the workbench into two columns at 1200 px; move the timeline split to 1800 px; spec resize-while-hidden

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M6 / M6.2, M6.9 (split layout spec, docs for layout)
- **Priority**: medium
- **Risk**: standard
- **Invariants**: S1 (imports stay inside `components/apps/aoe4-build-order/`, `lib/aoe4-build-order/` and `pages/apps/aoe4-build-order.tsx`), A3 (layout state is read by no result path; the same settled input shows the same result at every width). Not adjacent to S3, A1 or A2.
- **LOC estimate**: ~90 (`use-split-layout.ts` ~20, `workbench-tabs.tsx` ~30, page ~10, `workbench.module.css` ~30; business logic only; the acceptance and docs diff is large and excluded)
- **Depends on**: SGS-102
- **On merge**: none
- **Source**: `design/M6.md` C6 (`use-split-layout.ts`, `WorkbenchTabs` `split`), "Layout"; `reports/M6-designer-2.md` Q7, Q8; `plans/M6-20261105.md` outline F and backlog item 4 (second half, owner Q13 A); M6.2, M6.9

## Context

Below 1200 px the page shows Build and Results as tabs and the results timeline sits beside the charts only
at 1200 px and wider. M6 puts the editor and the results side by side from 1200 px, keeps the tabs below it,
and moves the timeline-beside-charts split to 1800 px so it does not squeeze into a half-width column. It
also adds the spec the SGS-096 follow-up asked for: resize while the Results panel is hidden, then show it,
and every chart has a width.

## Scope

Read `node_modules/next/dist/docs/` (`02-pages/03-building-your-application/02-rendering/04-automatic-static-optimization.md`
and the hydration notes it links) before editing the page: it is statically optimized (`getStaticProps`), the
server render and the first client render must match, so `useSplitLayout` is false until mounted (AGENTS.md:
this Next has breaking changes). Run `npx next build`.

Names below from SGS-102 (acceptance helpers `waitForRun` and `expectNoRun`; `openPage` waiting for
`auto-run-status` to reach `current`; the page's `BuildInput` and `Results` props; `viewDisabled` as
`shownTab === 'results'`; tabs at every width) are described as SGS-102 ends, not as `main` reads today.

**New `components/apps/aoe4-build-order/use-split-layout.ts`:**

- `WORKBENCH_SPLIT_QUERY = '(min-width: 1200px)'` (exported) and `useSplitLayout(): boolean`.
- Returns false on the server and on the first client render (hydration must match the static HTML), then
  reads `window.matchMedia(WORKBENCH_SPLIT_QUERY).matches` after mount and subscribes to its `change` event,
  unsubscribing on unmount. No `resize` listener, no other logic. A `useSyncExternalStore` with a false
  `getServerSnapshot`, or a mounted flag plus effect, both satisfy this; the implementer picks one.

**Edit `components/apps/aoe4-build-order/workbench-tabs.tsx`:** new prop `split: boolean`.

- `split` false: unchanged (tablist `workbench-tabs`, `tab-build`, `tab-results`, both panels mounted, the inactive
  `hidden`, `role="tabpanel"`, arrow/Home/End handling, `nextTab`).
- `split` true: no tablist and no `tab-*` buttons. One wrapper `data-testid="workbench-split"` (class
  `workbenchSplit`) holds `panel-build` then `panel-results` side by side (build left, results right). Neither
  panel has `hidden` or `role="tabpanel"` or `aria-labelledby`; both keep their `id` and `data-testid`. `active` and
  `onSelect` are not used and nothing calls `focus()`. Column proportions are equal (`minmax(0, 1fr)` each) so a
  wide child never widens its column; the results column scrolls with the page (no own scroll, no sticky).
- The panels' content is the same React elements in both modes; the switch must not unmount the editor, step
  table or charts' state beyond what remounting under a changed parent costs (the page keeps `text`, open rows,
  pin and view in its own state).

**Edit `pages/apps/aoe4-build-order.tsx`:**

- `const split = useSplitLayout()`; pass `split={split}` to `WorkbenchTabs`.
- `viewDisabled = !split && shownTab === 'results'` (the SGS-102 rule gains the `!split` term; the design's
  "live conversion" term adds nothing today because a failed conversion shows the `step-table-unavailable`
  notice and does not disable the toggle). In split mode the toggle is never disabled by the remembered tab.
- `tab`, `shownTab`, `resultsEnabled` unchanged. The selected tab is kept while split, so a resize back to tabs
  shows the tab that was selected before.

**Edit `components/apps/aoe4-build-order/workbench.module.css`:**

- Add `.workbenchSplit` (two-column grid, `gap: 1rem`, `align-items: start`; no media query, because the class is
  applied only while `split` is true).
- The whole `@media (min-width: 1200px)` block (`.resultsSplit`, `.timelineColumn` with `position: sticky`,
  `top`, `align-self`, `max-height`, `overflow-y`, and `.chartsColumn`) becomes `@media (min-width: 1800px)`
  with the same declarations. Below 1800 px the timeline stacks above the charts with no sticky position and no
  height cap. The `.runBar` rules are unchanged (sticky from 768 px, static below).
- No other `min-width: 1200px` remains under `components/`.

**Acceptance helpers (`acceptance/helpers.ts`)** (edited by this ticket; SGS-102 changed `openPage` and removed
`runSimulation`/`runRejected` in the same file):

- Export `SPLIT_MIN_WIDTH = 1200`, `TABS_VIEWPORT = { width: 1024, height: 768 }` and
  `SPLIT_VIEWPORT = { width: 1280, height: 800 }` (inputs, not computed values).
- `showTab(page, tab)` becomes split-aware: when `page.viewportSize()` is at least `SPLIT_MIN_WIDTH` wide it clicks
  nothing and expects `panel-${tab}` to be visible; otherwise it clicks `tab-${tab}` as today. It decides from the
  viewport, not from the DOM, so it cannot race the first client render.

**Existing specs.** The default Playwright viewport (Desktop Chrome, 1280 px) is now split, and split renders no
tablist. Recount against `main` plus SGS-102 with
`git grep -nE "tab-(build|results)|showTab|panel-(build|results)|workbench-tabs" -- acceptance`
(on `main` today: 12 specs, about 70 lines; examples: pin-compare, m4-flow, small-screen, inline-issues,
step-table, step-band, results-split, gather-rates-per-villager, m3-flow, narrow-layout, gathered-resources,
timeline-compare; SGS-098 and SGS-102 change the count, so apply these rules rather than a list):

1. A test that only needs a panel shown (a `showTab` call) is left alone; the split-aware helper covers it at any
   width.
2. A test that asserts on tabs themselves (a `tab-*` testid's attribute, enabled or disabled state, focus or
   tabindex; `workbench-tabs`; a panel being `hidden` or not visible while the other is shown; the keyboard model)
   gets `test.use({ viewport: TABS_VIEWPORT })` on its describe or file, or on the test, whichever is narrower. Its
   expectations do not change.
3. `aoe4-results-split.spec.ts`: the 1280 describe moves to a 1800 px wide viewport (`WIDE`), because the timeline
   sits beside the charts from 1800 px; its assertions (timeline left of the charts, stays below the run bar,
   wrapped run bar, no sideways scroll) are unchanged. The 1024 describe (timeline stacked) is unchanged.
4. A test that already pins a viewport below 1200 px is unchanged. A test at 1280 whose assertion is about a box
   inside the results column (for example the compare table fitting its box in `aoe4-narrow-layout.spec.ts`) keeps
   its expected value; if it fails because the column is now half the page, the implementer reports it as a
   finding and does not loosen it.
5. The implementer lists every spec and test it edits, with the rule number, in the report.

**New `acceptance/aoe4-split-layout.spec.ts`** with the cases in the acceptance criteria (the split cases, the
live switch, the 1199/1200 boundary, the 1800 px timeline boundary, and resize-while-hidden). Resizes use
`page.setViewportSize`; layout reads happen in one `page.evaluate` or under `expect.poll` (LESSONS.md).

**Docs.** In `docs/aoe4-build-order.md`, rewrite the layout sentences (find by phrase; examples, not a closed list):
"Below it are two tabs, Build and Results", "Switching tabs changes nothing else, and both panels stay mounted",
"While the Results tab is shown the Text and Table buttons are disabled", the tabs keyboard-model sentence, "The
selected tab follows each run" if SGS-102 left any, "At 1200 px and wider the step timeline sits in a column to
the left of the charts and stays on screen just below the run bar", and "A step timeline sits above the charts
(beside them at 1200 px and wider)". They must state: at 1200 px and wider Build and Results sit side by side and
there are no tabs, and both are always shown; below 1200 px the tabs stay and nothing scrolls sideways at 390 px;
the layout follows the viewport live and the tab selected before a resize is kept for the tabs layout; the view
toggle is never disabled by the tab in the side-by-side layout and is disabled while Results is the shown tab in the
tabs layout; the timeline sits beside the charts and stays under the run bar from 1800 px, and is stacked above the
charts below 1800 px; the first paint is the tabs layout and the page switches after it loads. Behavior and rules
only, no measured sizes. `ARCHITECTURE.md` is not changed (it does not list the files of
`components/apps/aoe4-build-order/`; grep first). `docs/api/openapi.json` is not changed.

**Out of scope:** the controller, the client and the auto-run behavior (SGS-100, SGS-102); Save, `?b=` and the
tab set by a `?b=` load (SGS-105; setting `tab` there is harmless in split mode); any route, store or API; chart
internals (`line-chart.tsx`); column proportions other than equal; a `resize` listener or a JS width read other
than `matchMedia`; changing `nextTab`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

Specs below are Playwright in `acceptance/aoe4-split-layout.spec.ts` unless a case names another file. Each states
the break it catches. Viewports are inputs; layout is read in one `page.evaluate` or under `expect.poll`.

- [ ] Wiring holds in the end state: `git grep -n "min-width: 1200px" -- components` finds no match (the split query
  lives in `use-split-layout.ts` only as `WORKBENCH_SPLIT_QUERY`); every `min-width: 1800px` match in `components` is in
  `workbench.module.css`; `git grep -n "useSplitLayout" -- components pages` matches only in `use-split-layout.ts` and
  `pages/apps/aoe4-build-order.tsx`; `git grep -nE "matchMedia" -- components pages` matches only in
  `use-split-layout.ts`.
- [ ] "split at 1280": at `SPLIT_VIEWPORT`, after the first run, `workbench-tabs` and both `tab-*` have count 0,
  `panel-build` and `panel-results` are both visible, neither has the `hidden` attribute or `role="tabpanel"`,
  `panel-build` is left of `panel-results` (right edge of the first at or before the left edge of the second, read in
  one evaluate), the editor textarea and the `results-last-good` heading area are inside the viewport together, and
  `document.documentElement.scrollWidth` is at most 1280. Break caught: a tablist left in split, a panel `hidden`,
  columns stacked.
- [ ] "tabs at 390": at 390 px wide the tablist is present, `tab-build` is selected, `panel-results` is not visible,
  `document.documentElement.scrollWidth` is at most 390 with Build shown and again with Results shown. Break caught:
  split rules leaking below 1200 px.
- [ ] "the breakpoint is 1200 px": at width 1199 `workbench-tabs` has count 1; at 1200 it has count 0 (after the
  load settles, `auto-run-status` `current`). Break caught: a query that drifted from the 1200 px in the design, a
  helper constant out of step with the query.
- [ ] "the layout switches live": starting at `SPLIT_VIEWPORT`, resizing to `TABS_VIEWPORT` shows the tablist with
  `tab-build` selected and `panel-results` not visible; selecting Results, resizing to `SPLIT_VIEWPORT` shows both
  panels and no tablist; resizing back to `TABS_VIEWPORT` shows `tab-results` selected and `panel-results` visible
  (the selected tab was kept). The simulate POST count does not change across the resizes (`expectNoRun`). Break
  caught: a reset tab on resize, a re-run on layout change, a layout that needs a reload.
- [ ] "resize keeps focus and text": with the cursor in the duration field (or the editor) at `SPLIT_VIEWPORT`,
  resizing to `TABS_VIEWPORT` and back leaves `document.activeElement` the same field and its value and the editor
  text unchanged. Break caught: remounting the build panel's inputs or moving focus.
- [ ] "the view toggle is never disabled by the tab in split": at `TABS_VIEWPORT` with Results selected,
  `editor-view-text` and `editor-view-table` are disabled; after resizing to `SPLIT_VIEWPORT` both are enabled and
  switching to Table shows the step table beside the visible results; after resizing back they are disabled again.
  Break caught: `viewDisabled` ignoring `split`, or ignoring the tab in tabs mode.
- [ ] "first paint matches the server": loading at `SPLIT_VIEWPORT` logs no console error or warning containing
  `Hydration` or `hydrat` (collected with `page.on('console')` from before `goto`), and the page ends split. Break
  caught: a first client render that reads `matchMedia` and mismatches the static HTML.
- [ ] "the timeline split is at 1800 px" (in `aoe4-results-split.spec.ts`): after a run at a 1799 px wide viewport the
  timeline column is above the charts (`timeline.bottom <= units.top`), its computed `position` is not `sticky` and its
  computed `max-height` is `none`; at 1800 px the timeline is left of the charts (`timeline.right <= units.left`) and
  its computed `position` is `sticky`. Break caught: the 1200 to 1800 move applied to only some of the three rules
  (stacked timeline still capped or sticky, or a split in a half-width column).
- [ ] "resize while hidden" (`aoe4-split-layout.spec.ts`): a table over two cases. (a) At 700 px wide, after the first
  run with Build selected, resize to 390 px wide, then show Results with `showTab`; (b) at `SPLIT_VIEWPORT`, resize to
  `TABS_VIEWPORT` (Results goes hidden, Build is selected), then to 700 px wide, then show Results. In each case, under
  `expect.poll`, every `CHART_IDS` chart (`getByTestId(id)`) is visible and its `getBoundingClientRect().width` is
  greater than 0 and at most the viewport width, and `scrollWidth` of the page is at most the viewport width. Break
  caught: a chart measured while hidden that keeps width 0 or a stale width after the panel is shown (the SGS-096
  follow-up). This is a regression guard for behavior the page already has, so it is expected to pass before the
  layout change; the report records whether it did.
- [ ] Every edited existing spec follows the rules in Scope "Existing specs"; the report lists each spec edited and the
  rule applied. `git grep -nE "tab-(build|results)|workbench-tabs" -- acceptance` finds each match either in
  `aoe4-split-layout.spec.ts` or in a file with a viewport pinned to `TABS_VIEWPORT` or a narrower width.
- [ ] `docs/aoe4-build-order.md` states every item in Scope "Docs", quotes no measured size or timing, and
  `git grep -nE "1200 px and wider|beside them at 1200" -- docs/aoe4-build-order.md` finds no sentence that still ties
  the timeline split to 1200 px.
- [ ] `npx tsc --noEmit`, `npm run lint:dup`, `npm test` and `npm run acceptance` pass; `npx next build` succeeds (the
  page prerenders with `useSplitLayout` false). The implementer records the commands and the test counts in the
  report.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
