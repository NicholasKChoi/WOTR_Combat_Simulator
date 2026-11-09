# SGS-104 ticket author report 1

Ticket: `$PROJECT_DIR/tickets/SGS-104-split-layout.md` (M6 outline F; criteria M6.2, M6.9). Risk standard, ~90 LOC logic, depends on SGS-102. Open questions: none.

## Defined symbols, props, test ids, helpers
- `components/apps/aoe4-build-order/use-split-layout.ts`: `WORKBENCH_SPLIT_QUERY = '(min-width: 1200px)'`, `useSplitLayout(): boolean` (false on server and first client render, then `matchMedia` + `change` subscription).
- `WorkbenchTabs` prop `split: boolean`. Split renders no tablist and no `tab-*`; wrapper `data-testid="workbench-split"` (class `workbenchSplit`) holding `panel-build` then `panel-results`, no `hidden`, no `role="tabpanel"`/`aria-labelledby`, ids and test ids kept. Equal columns.
- Page: `const split = useSplitLayout()`, `viewDisabled = !split && shownTab === 'results'`.
- CSS: `.workbenchSplit` (new, no media query); the whole `@media (min-width: 1200px)` block (`.resultsSplit`, `.timelineColumn`, `.chartsColumn`) becomes 1800 px.
- Helpers in `acceptance/helpers.ts`: `SPLIT_MIN_WIDTH = 1200`, `TABS_VIEWPORT = {1024x768}`, `SPLIT_VIEWPORT = {1280x800}`; `showTab` becomes split-aware (decides from `page.viewportSize()` width, clicks nothing in split and expects `panel-<tab>` visible).
- New spec `acceptance/aoe4-split-layout.spec.ts`; `aoe4-results-split.spec.ts` 1280 describe moves to a 1800 px viewport plus a 1799/1800 boundary case.

## Decisions I made (not in the design, flagged)
- `showTab` split-aware by viewport, specs asserting on tabs pin `TABS_VIEWPORT`, rules instead of a spec list (counts on `main`: 12 specs, ~70 `tab-*`/`showTab` lines; SGS-098 and SGS-102 change them).
- Equal column proportions (design leaves proportions to tickets).
- The design's "viewDisabled combined with the live-conversion rule" is vacuous on `main` (page only has `shownTab === 'results'`), so the ticket writes only the `!split` term.
- `aoe4-narrow-layout` 1280 "compare table fits its box" keeps its expectation; a failure in the narrower column is reported by the implementer, not loosened.
- The resize-while-hidden spec is a regression guard (recharts `ResponsiveContainer` remeasures on show); two cases: 700 to 390, and split to tabs to 700.

## Risks for the manager
- At 1800 px the split timeline sits inside a half-width results column (design Q8 answer, accepted).
- Flash: first paint is the tabs layout at 1280 until mount (design).

## Overlap with SGS-105 (both edit)
- `pages/apps/aoe4-build-order.tsx`: `WorkbenchTabs` JSX props (`split`), `viewDisabled`, the `tab` state (105 sets `tab = 'results'` after a `?b=` load; harmless in split), hooks block near `useAutoRun`.
- `acceptance/helpers.ts`: `showTab`, `openPage`.
- `docs/aoe4-build-order.md`: page/layout paragraphs (105 adds a save/open section; 104 edits the tabs/layout sentences).
- Not shared: `build-input.tsx`, `results.tsx`, `workbench.module.css` (105 touches none), `workbench-tabs.tsx` (105 does not).

## Checks run
Grep criteria run against `origin/main` (1e6d6c2): `min-width: 1200px` matches only `workbench.module.css` (moves, consistent with Scope); `1200 px and wider` / `beside them at 1200` match docs lines (to be rewritten); tab grep recount done. No mutation criterion. Worktree `worktrees/ticket-104` removed.
