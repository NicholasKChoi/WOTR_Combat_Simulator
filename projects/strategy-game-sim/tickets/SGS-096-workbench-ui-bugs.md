# SGS-096: Hide a pinned series with its current series, and cover charts resized while Results is hidden

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog cleanup 2026-11-06; independent of M6)
- **Priority**: low
- **Risk**: standard
  <!-- Not low only because item 2 may need a chart fix of unknown size; item 4 changes a documented chart rule. No criticalPaths symbol, no API/schema change, no engine or data file. -->
- **Invariants**: none adjacent (A1-A3 are not touched; chart and docs code only). S1 holds: imports stay inside `components/apps/aoe4-build-order/`.
- **LOC estimate**: about 30 (`components/apps/aoe4-build-order/chart-rows.ts` about 10: one pure helper; `line-chart.tsx` and `chart-legend.tsx` about 10: use it in the three places that read `hidden`; a possible chart resize fix for item 2 is not counted until the spec shows one is needed). Business logic only.
- **Depends on**: none
- **On merge**: none (manager follow-up: delete the four BACKLOG.md bullets this ticket names as Source)
- **Source**: BACKLOG bullets "SGS-084 review-1: after hiding the current `Gold` legend item, `Gold (pinned)` still shows", "SGS-066 tech-lead: no spec covers resizing the window while the Results panel is hidden". Checked against `origin/main` at `9274372`. Two other bullets were dropped (see Scope).

## Context

Two workbench chart gaps. Hiding a series in a chart legend leaves its pinned counterpart drawn, although `docs/aoe4-build-order.md` says "a pinned series' item follows its current series' item". Separately, the Results panel is a `hidden` tab panel on the Build tab, so the charts inside it measure width 0 and no spec checks they size correctly when the window changes while they are hidden.

## Scope

Checked on `origin/main` at `9274372`. Two of the four rough-task items no longer apply:

- **Dropped: `NumberControl` draft lost on the Text/Table toggle** (`components/apps/aoe4-build-order/step-table.tsx`). The draft is cleared by the input's own `onBlur` (`setDraft(null)`), and clicking or keyboard-activating the Text/Table button blurs the input first, so the toggle never has a live draft to lose. An invalid entry also never makes the text unparseable (`setTriggerNumber`, `setNumberField`, `setStartCount` in `step-table-model.ts` return the step unchanged for text that is not a number), so the table does not unmount mid-typing. This was read from code, not reproduced in a browser.
- **Dropped: restore POSTs twice in dev Strict Mode** (`pages/apps/aoe4-build-order.tsx`, the restore `useEffect`). The repo has no `next.config.*` and no `StrictMode` wrapper, and Next 16 enables Strict Mode by default only for the App Router, not the Pages Router (`node_modules/next/dist/build/define-env.js`: `__NEXT_STRICT_MODE` is false when `reactStrictMode` is unset). Effects run once in dev.

1. **A pinned series follows its current series when hidden.** In `components/apps/aoe4-build-order/chart-rows.ts` add a pure helper (name the implementer's, for example `seriesHidden(hidden, series, key)`) that says whether a series key is hidden: a pinned key (`pinnedKey(k)`, i.e. `pinned:<k>`) is hidden when `hidden` holds the pinned key itself, or when `series` holds a current series with key `k` and `hidden` holds `k`; any other key is hidden when `hidden` holds it. A pinned-only series (no current series with that key) depends on its own key alone. `SeriesChart` in `line-chart.tsx` (the `hide` prop on the current and pinned `Line`s) and `SeriesLegend` in `chart-legend.tsx` (`aria-pressed` and the dimmed `opacity`) use the helper instead of `hidden.has(...)`, so a pinned legend item is dimmed and `aria-pressed` while its current item is hidden. `toggleHidden` and the stored `hidden` set keep their shape: clicking a pinned item toggles only its own key (it stays dimmed while the current item is hidden), and clicking the current item again restores the pinned line unless the pinned item was hidden on its own. Hidden lines leave the tooltip, which is what `hide` already does in recharts.
2. **Chart sizing when the window changes while Results is hidden.** Add a Playwright spec (in the existing spec nearest in topic, such as `acceptance/aoe4-results-split.spec.ts`, or a new `acceptance/aoe4-*.spec.ts`) that runs a build, returns to the Build tab (`showTab` in `acceptance/helpers.ts`), resizes the window while Results is hidden, then opens Results. If the chart sizes wrongly (width 0, stale width, clipped plot), fix it in `components/apps/aoe4-build-order/line-chart.tsx` (or the panel in `workbench-tabs.tsx`); if the spec passes on the current code, the ticket adds the spec only. The implementer reports which.
3. **Docs made untrue.** `docs/aoe4-build-order.md`: the sentence "a pinned series' item follows its current series' item" next to the legend description. Rewrite it to the rule in Scope 1 (hiding the current series' item also hides its pinned counterpart; the pinned item can be hidden on its own). Grep the doc, `README.md` and `ARCHITECTURE.md` for `pinned series' item` and `follows its current` for other statements.
4. **Existing tests.** A test of changed behavior gets the new expected value; any other test keeps its expectation. The pin-compare case "the pinned legend item toggles only the pinned line" (`acceptance/aoe4-build-order-pin-compare.spec.ts`) hides only the pinned item, so it should keep passing unedited. The implementer lists every test it edits.

**Out of scope:** the two dropped items; any other legend or chart behavior; the M6 re-run on edit, split layout and Run button removal (see Open questions); the stored `hidden` set shape; engine, route and data files.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Unit tests in `components/apps/aoe4-build-order/chart-rows.test.ts` for the helper: (a) hidden `{food}`, current series `[food, wood]`, key `pinned:food` is hidden (a helper that checks only the key itself must fail); (b) hidden `{pinned:food}` leaves `food` visible and `pinned:wood` visible (a helper that hides both on any pinned toggle must fail); (c) hidden `{gold}`, current series `[food]` (no `gold`), key `pinned:gold` is visible (a pinned-only series must depend on its own key alone; a helper that ignores the series list must fail); (d) hidden `{}` hides nothing.
- [ ] In `acceptance/aoe4-build-order-pin-compare.spec.ts`: with a pin and a later run, clicking the current legend item `food` in `chart-gather-rates` leaves no `food` line and no `pinned:food` line, dims both legend items (`opacity` 0.5, `aria-pressed=true`), and leaves `wood` and `pinned:wood` drawn; hovering the plot shows neither `Food` nor `Food (pinned)` in the tooltip; clicking `food` again restores both lines. Fails on `origin/main`, where `pinned:food` stays drawn.
- [ ] In the same spec: hiding `pinned:food` alone, then hiding and restoring `food`, leaves `pinned:food` hidden (the pinned item's own state survives the current item's toggle).
- [ ] A Playwright spec runs a build at one width, shows the Build tab, resizes the window to a different width while the Results tab is not shown, then selects Results: each chart's plot width is greater than 0 and not wider than the Results panel, and the page has no horizontal overflow. Run it for a shrink (from a desktop width to 390 px) and a grow (from 390 px to a desktop width). The spec fails if the chart keeps the width it measured before the resize.
- [ ] The report states whether the resize spec passed on unmodified code and, if not, what fixed it.
- [ ] `git grep -n "pinned series' item follows its current series' item" -- docs README.md ARCHITECTURE.md` finds nothing after the change, and the doc states that hiding the current item also hides its pinned counterpart.
- [ ] `npx tsc --noEmit`, `npm test`, `npm run lint:dup` and the touched acceptance specs pass.
- [ ] No INVARIANTS.md regressions

## Open questions

- `owner`: item 1 reads the doc's "follows" as "hiding the current item also hides the pinned one, while the pinned item can still be hidden alone". The other reading is that the pinned item should be independent and the doc sentence is what is wrong (the existing test only checks hiding the pinned item alone). This ticket takes the first reading because the review bullet and the doc both expect it; say if you want the doc changed instead.
- `designer`: M6.2 and M6.3 (`MILESTONES.md`) put the editor and charts side by side at desktop widths and remove the Run button. That makes item 2 partly moot: at desktop widths the Results panel is no longer hidden, so the resize-while-hidden case stays only under the stacked-tab breakpoint. The spec in Scope 2 should then run at the narrow widths the tabs keep, and its desktop-width step will need rewriting when M6.2 lands. Nothing else here depends on M6.
