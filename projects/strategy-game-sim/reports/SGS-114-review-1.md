# SGS-114 review 1

- Branch: sgs-114-chart-layout, tip 72ac4acb410237a084cecf551c139e8f36672b72, base main (b3da879, merge-base equals origin/main)
- Mode: full review
- Verdict: **REQUEST CHANGES** (one convention finding; everything else passes)

## Blocking findings

1. `components/apps/aoe4-build-order/line-chart.tsx:161-277` - convention - The children of the new `<>` fragment are mis-indented. `<>` (line 161) is at 20 columns and `{headerControls}` (162) at 24, but `<ResponsiveContainer>` (163) through `<MarkerLegend>` (276) and `</>` (277) are at 20, the same as the fragment. So 115 lines of JSX sit at the fragment's own level, and its children don't line up with each other. The diff already re-indents this whole block, so the PR reviewer reads it as new code. Every other JSX block in the file and its siblings (`chart-legend.tsx`, `results.tsx`) indents children one level (4 spaces) inside their parent. Direction: indent lines 163-276 by 4 more spaces so they line up with `{headerControls}` at 24 columns, and leave `</>` at 20. This is a whitespace-only change.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `chart-layout.test.ts` normalise table | pass | `chart-layout.test.ts`: round-trip; non-object, null, wrong version, non-array order and collapsed each give the default (it.each); `[floating,'bogus',floating,rates]` omits two ids and gives `[floating,rates,units,gathered]`; collapsed with an unknown id and a duplicate gives `[rates,units]`. The implementer's mutation record (dropping the dedupe, forcing `missing` empty) matches. |
| 2 | moveChart and toggle | pass | Swaps both ways (4 rows); ends equal the input; collapsed never duplicates after repeated toggles; non-mutation checked with `structuredClone` and a real swap (`units` up in `custom`). |
| 3 | read/write never throw, round-trip, exact keys | pass | it.each over null, a throwing getItem and `{nope`; write to null and to a throwing setItem; the round-trip test checks the sorted keys `['collapsed','order','version']`. |
| 4 | line-chart server render: buttons, disabled, collapsed, aria-expanded, none without layout | pass | `line-chart.test.ts` `describe('chart controls')`. |
| 5 | (respec 1) collapsed body kept, `hidden`, id equals `aria-controls`, empty; expanded has no `hidden`; no `d-flex`/`flex-wrap` | pass | The lookahead regexes on the `chart-body` div check `></div>` (no children) when collapsed and `(?![^>]*hidden)` when expanded. `not.toMatch(/d-flex\|flex-wrap/)` is checked on the collapsed render. |
| 6 | `function browserStorage` only in `browser-storage.ts`; page imports it | pass | grep: only `components/apps/aoe4-build-order/browser-storage.ts`. The page imports it at line 17, and its three call sites (113, 199, 206) are unchanged. |
| 7 | tsc, lint:dup, npm test; no existing test edited | pass | I ran `tsc --noEmit` (clean) and `lint:dup` (0 clones). I ran the two changed test files: 46 passed. The full suite (2004 passed) is taken from the implementer report. `line-chart.test.ts` only gains an appended describe block. |
| 8 | (respec 1) default order, all expanded, load writes nothing | pass (by reading) | The spec's first test checks the order with `expectLayout`, then `stored(page)` is null. |
| 9 | collapse behaviour, Per villager, hidden legend item | pass (by reading) | The second test covers every clause, including the y-axis label `Per villager per minute` and `aria-pressed` on the hidden item after expanding. |
| 10 | move, disabled ends, keyboard, focus after move | pass (by reading) | The third and fourth tests. Tab order collapse, up, down is checked starting from a programmatically focused `chart-collapse` (see notes). Focus after a move is checked for both cases with `expect.poll`. |
| 11 | reload persistence, bad stored values | pass (by reading) | Two reloads compare storage to the written value. The stored-value table: unknown-only, non-JSON, missing one id (appended). |
| 12 | blocked localStorage | pass (by reading) | `addInitScript` makes the `localStorage` getter throw a `SecurityError`; the test collapses and moves, then expects no alert and no page error. |
| 13 | hover band and pins after a reorder; collapsed chart has no band | pass (by reading) | At `SPLIT_VIEWPORT`, pinned paths are asserted before the collapse and moves, the band is checked on each expanded chart, then `toHaveCount(0)` on the collapsed chart. |
| 14 | (respec 1) helpers `CHART_IDS = RESULT_CHART_IDS`; acceptance diff lists only two files | pass | `git diff --name-only` lists `acceptance/helpers.ts` and `acceptance/aoe4-chart-layout.spec.ts`. `RESOURCE_CHARTS` is unchanged. The implementer's single run of the existing specs passed (81). |
| 15 | Doc "Chart controls" text, key and shape, no measured values | pass | `docs/aoe4-build-order.md:955-963`; `git grep chart-layout` finds it. The paragraph sits after the messages paragraph, which ends the "A 200 draws four line charts" block, so it is still in that charts description. |
| 16 | No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- A1 to A3: the diff touches `components/apps/aoe4-build-order/**` and `pages/apps/aoe4-build-order.tsx`, so they apply, but nothing changes the engine, data or simulation path. No literal game numbers, no randomness or clock. All three hold.
- S1: `chart-layout.ts`, `use-chart-layout.ts` and `browser-storage.ts` stay inside the app and import nothing from another app. Holds.
- S2 and S3: no new page and no new numeric input. Hold.

## Contract check (design M8 C9, Charts (M8.2))

- The C9 names match exactly: `RESULT_CHART_IDS` (order), `ChartId`, `CHART_LAYOUT_STORAGE_KEY`, `ChartLayout`, `DEFAULT_CHART_LAYOUT`, `storedChartLayoutSchema` (zod, matching shape), `normalizeChartLayout`, `readChartLayout`, `writeChartLayout`, `moveChart`, `toggleChartCollapsed` and `useChartLayout`. The `layout` prop shape matches. The test ids `chart-collapse`, `chart-move-up`, `chart-move-down`, `chart-body` and `data-collapsed` are all present.
- Data path: `move` and `toggle` call `writeChartLayout` with the new layout. The hydration effect only calls `setLayout(readChartLayout(...))` and never writes. The first render uses `DEFAULT_CHART_LAYOUT`.
- `normalizeChartLayout`: zod `safeParse` failure gives a fresh copy of the default. Unknown ids are filtered, duplicates dropped with `Set` (first kept), and missing ids appended in `RESULT_CHART_IDS` order. Correct.
- `moveChart`: `from < 0 || to < 0 || to >= length` returns an equal copy. There is no wrap and no off-by-one.
- Focus restore (`results.tsx:471-479`): the effect on `layout.order` focuses the pressed button, or the other move button when the pressed one is now disabled. A toggle also creates a new `order` array, but `pendingFocus` is null then, so the effect does nothing.
- Lasting for the page session with blocked storage: `Results` mounts once a result exists, and nothing in the page sets the result back to null (`auto-run.ts`). Panels are hidden rather than unmounted (`workbench-tabs.tsx`), so the in-memory layout survives tab and view switches.
- Out of scope respected: no legend or pinned-key change, no split-scroll work, no reset control. Nothing under `golang/`.
- No invented constants.

## Doc claims checked

Each sentence in the new paragraph was checked against the code:
- Title row and three buttons stay: `ChartHeader` sits outside `chart-body`.
- Collapse hides the legend, plot, marker legend and Per villager: these render inside the body only when expanded.
- Hide set, Per villager and pin survive: the hide set is `SeriesChart` state, and the chart is keyed by id, so a move keeps the instance. `perVillager` lives in `Results`; the pin lives in the page.
- A collapsed chart draws no band, markers or pins: the plot is not rendered.
- Up is disabled on the first chart, down on the last: `first`/`last` come from the index in `results.tsx:582-583`.
- The default order is correct.
- First paint is the default: `useState(DEFAULT_CHART_LAYOUT)`.
- Normalisation sentence: matches `normalizeChartLayout`.
- Blocked store: `browserStorage()` returns null, and read/write catch errors.

All hold. No code comments were added.

## Linter

`npx tsc --noEmit`: clean. `npm run lint:dup` (jscpd): 0 clones. There is no ESLint config in the repo (REPO.md).

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty. No bot ran.

## UI inspection

I served the task worktree at its tip with `npx next dev -p 3871`. A Playwright script (`/tmp/claude-1000/sgs114-review/inspect.cjs`) loaded `/apps/aoe4-build-order` at 360, 390, 700, 768 and 1280 px wide (760 tall). It used the Results tab below 1200 px and the split view at 1280. Three states: default, Gather rates collapsed, then Gather rates moved up.

- Overflow (clipped) inside `results-last-good`: none at any width or state. No horizontal page overflow at any width.
- Overlap among the h3 and buttons in each header: none.
- Mid-word wraps in titles and buttons: none.
- States: the collapsed body has computed `display: none` and height 0, against `block` (572/529 px) when expanded. The disabled up button has opacity 0.65 against 1, so it is visibly different. After the move the order is `gather-rates:true, units, gathered, floating`, and focus is on `chart-move-down` of `chart-gather-rates`, as the spec requires.
- Screenshots read: `w390-default-rates.png` (buttons wrap under the title, all readable), `w390-moved-results.png` (full results column, collapsed chart first, disabled Up and Down visible on the end charts), `w1280-collapsed-rates.png` (one row: title, Expand, Up, Down). No visible defect.
- The server was stopped (`serve.sh stop 3871`); the port is free.

## Conventions

- Storage style matches `pin-storage.ts` (try/catch with empty catch, `JSON.stringify`). Its test matches `pin-storage.test.ts` (fake `Storage` cast, `throwingStorage`, it.each with labels).
- Header row is module CSS (`results.module.css` `.chartHeader`, `.chartButtons`) with no Bootstrap `d-*`/`flex-*` on those elements. The buttons use Bootstrap `btn` classes only, which is not a utility mix.
- The acceptance spec uses 2-space indentation like its siblings (`aoe4-gather-rates-per-villager.spec.ts`) and reads layout in one `page.evaluate` (LESSONS).
- No ids, factory pointers or process history in shipped files.

## Non-blocking notes

- `acceptance/aoe4-chart-layout.spec.ts`, Tab test: `chart-collapse` is focused with `.focus()` before the first Tab, so the test never checks that Tab reaches the collapse button from the element before it. Only collapse, then up, then down is checked. A Tab from the previous chart's last control would close that gap.
- Stored-value cases "unknown ids only" and "not JSON": the expected order is the default, which is also what renders before hydration, so these rows prove only "no page error". The "missing one id" row is the one that proves storage is read. Acceptable for the criterion as written.
- At 360 and 390 px the button label changes between Collapse and Expand. The header row then goes from two lines (71 px) to one (37 px), so the buttons jump. A fixed-width label or an icon would keep them still. This is cosmetic and not a ticket rule.
- A collapsed chart sits directly against the next chart's title with no extra gap (`w390-moved-results.png`). It is readable, and the ticket leaves styling to the implementer.
- `chart-layout.test.ts` repeats the fake-storage shape from `pin-storage.test.ts`; the implementer already suggests a shared test helper for BACKLOG.

## Coverage

- Reviewed every file in the diff: `browser-storage.ts`, `chart-layout.ts`, `chart-layout.test.ts`, `use-chart-layout.ts`, `line-chart.tsx`, `line-chart.test.ts`, `results.tsx`, `results.module.css`, `pages/apps/aoe4-build-order.tsx`, `acceptance/helpers.ts`, `acceptance/aoe4-chart-layout.spec.ts` and `docs/aoe4-build-order.md`. I also checked consumers of `CHART_IDS` in the existing specs, plus `workbench-tabs.tsx` and `auto-run.ts` to confirm `Results` stays mounted.
- REPO.md checklist:
  - Every diff: I did not run `next build` (the implementer reports it passing) and loaded the page with `next dev`.
  - AoE4 section: widths 360, 390, 700, 768 and 1280 inspected; no copied helper or tolerance; doc consistent; no utility mix; `cn` not needed (no conditional classNames added).
  - Not run, per the gate rules: acceptance specs, and the full unit suite (I ran the two changed test files only).
- LSP not used; tsc covers the typed files, and the only consumers of the changed symbols are the files above (grep).
