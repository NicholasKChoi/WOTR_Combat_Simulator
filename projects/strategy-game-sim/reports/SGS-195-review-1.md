# SGS-195 review 1

- Branch `sgs-195-marker-control`, tip `b0c4d35`, base `origin/main` (SGS-194 merged). Full review (not delta).
- Verdict: **REQUEST CHANGES** (one blocking `test` finding)

## Blocking findings

1. `acceptance/aoe4-marker-labels.spec.ts:235` - test - The "new run" step of `the hidden kinds survive collapsing a chart, pinning, and a new run, and hiding leaves the series lines` calls `waitForRun(page, () => setDurationInPlace(page, '1200'))`, but the Knight/Longbow template already sets the duration to 1200. Setting an input to the value it already holds fires no React `onChange`, so no run starts. I checked this in the browser against the task checkout: duration reads `1200` after selecting the template, and `setDurationInPlace(page, '1200')` sent 0 simulate POSTs in 5 s. `waitForRun` then waits for a simulate response that never comes, and the test times out on a correct implementation. The "survives a new run" half of B-M8 is never exercised. - Why it matters: the spec fails deterministically on correct code, and the lifetime-across-runs criterion has no working check. - Direction: change the duration to a different value that keeps the hidden kind in the run. A longer horizon keeps every earlier marker because the simulation is deterministic, and the bound is 60 to 3600 s (`lib/aoe4-build-order/schema.ts:37`). Capture the response and assert the kind is in it before you assert the hidden state:
   ```ts
   const next = (await (await waitForRun(page, () => setDurationInPlace(page, '1500'))).json()) as SimulationResult
   const nextOfKind = next.markers.filter((m) => m.kind === kind).length
   expect(nextOfKind, 'the new run still has the hidden kind').toBeGreaterThan(0)
   await expect(item(control, kind)).toHaveAttribute('aria-pressed', 'false')
   await expectLines(page, next.markers.length - nextOfKind)
   ```
   Production change this fails on: in `components/apps/aoe4-build-order/results.tsx:50`, reset `hiddenKinds` when `result` changes, for example by adding `useEffect(() => setHiddenKinds(new Set()), [result])`. Before the new run, `aria-pressed` is `"false"` and each chart draws `total - ofKind` lines. After the new run, a broken implementation shows `"true"` and draws `next.markers.length` lines, while a correct one keeps `"false"` and draws `next.markers.length - nextOfKind`.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | One control between `chart-order-status` and `chart-table`; kinds in order; null without markers; unit test | pass | `results.tsx:107-114`. `MarkerControl` filters `CHART_MARKER_KINDS` and returns `null` when it finds no kinds (`chart-legend.tsx:71-72`). Unit cases in `chart-legend.test.ts` ("lists one item per kind present", "renders nothing without markers") use an unsorted fixture. The acceptance test checks one control, the document order and none inside the charts. The inspection found the control above `chart-table` at all three widths. |
| 2 | Click/Enter/Space toggles on every chart; focus stays; kinds asserted from the API | pass | `onToggle` calls `toggleHidden` on the Results state, and `SeriesChart` draws `visibleMarkers`. Acceptance test "clicking, Enter and Space ..." checks `expectLines` over `CHART_IDS` and focus. `setup` asserts age-up plus another kind. The inspection counted 48 marker lines before and 44 after hiding Economy (1 per chart x 4). |
| 3 | `aria-pressed` and opacity in both states; unit test | pass | `chart-legend.tsx:85-87`. Unit test "is pressed and full opacity while shown ...". Acceptance reads the computed opacity `1` and `0.5`. The inspection read opacity `0.5` and `aria-pressed="false"` on hidden Economy. |
| 4 | Hover/focus labels on every chart; hover wins; `data-active` only on the labelled item; title on unlabelled markers | pass | `labelKindOf` in `results.tsx:57`, passed to every chart. Acceptance hover, keyboard and title tests. The inspection showed `horticulture 6:12` replacing the age-up labels on hover, with `data-active` only on Economy. |
| 5 | Hidden kind hovered falls back; age-up hidden gives no labels and `data-label-rows=0`; `labelKindOf` rows | pass | `labelKindOf` rows "hover on a hidden kind falls back to nothing", "age-up hidden and nothing hovered" and "age-up hidden and age-up hovered". Acceptance test "hiding the labelled kind ..." checks `data-label-rows` `0` on every chart. |
| 6 | Pinned age-ups follow the age-up toggle; always drawn without a current age-up; pinned legend counts drawn ones | pass | `line-chart.tsx:69-70` computes the check from the current run's `markers`. `line-chart.test.ts` "pinned legend with hidden marker kinds" has 4 rows, including age-up hidden with no current age-up. Acceptance pinned test. |
| 7 | Lifetime: not stored; survives new run, view toggles, collapse, reorder, pin; absent-then-returning kind stays hidden; hover/focus reset; `liveMarkerKind` row | pass in code; acceptance check broken | `hiddenKinds` is plain `useState` in `Results`, which stays mounted across runs (`pages/apps/aoe4-build-order.tsx:425`). Nothing prunes it, so a kind that was absent from a run and returns is still hidden. `liveMarkerKind` row "kind with no markers left". The acceptance new-run step cannot start a run (finding 1). |
| 8 | Scope: nothing else changes; collapsed chart draws nothing | pass | Only marker rendering reads `markerView`. The series, step band and pinned series paths are unchanged in the diff. The acceptance test checks that the series path count is unchanged. |
| 9 | Keyboard: buttons after the info toggle, before the first handle; Tab reaches the first item; no arrow keys | pass | DOM order in `results.tsx`. Acceptance keyboard test. No key handlers added. In the inspection, Tab from `simulation-notes-toggle` focused Age-up at every width. |
| 10 | Marker rules only in `chart-markers.ts`; typecheck; tests moved; new rows | pass | `chart-rows.ts` and `line-chart.tsx` no longer export any of the names. `tsc --noEmit` is clean. `chart-markers.test.ts` holds the moved styling, `placeMarkers`, `labelledMarkers` and `activeMarkerKind` cases, plus new `liveMarkerKind`, `visibleMarkers` and `labelKindOf` rows. |
| 11 | `toggleHidden` generic; non-mutating; non-string key row | pass | `chart-rows.ts:136`. New `ChartMarkerKind` table in `chart-rows.test.ts` (see note 1). |
| 12 | Readability, step-band, pin-compare and chart-layout specs unchanged except imports; docs fixed | pass (by reading; I did not run acceptance) | Only import lines change in readability and layout. Step-band and pin-compare are untouched. In `docs/aoe4-build-order-ui.md`, the per-chart, click-only-focuses and collapse-clears statements are gone. |
| 13 | No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- A1, A2, A3 (paths include `components/apps/aoe4-build-order/**`): hold. The diff touches no engine, data or simulation path, adds no numeric game literal, and adds no randomness or timer.
- S1: holds. No import crosses apps.

## Contract checks

- C8, C9, C13 (`markerView` only) and C16b names and signatures match the design. `estimateLabelWidth` is now exported because `line-chart.tsx` still uses it as the width fallback. It lives in `chart-markers.ts` as the ticket requires.
- No zoom, upgrade-dot or `ChartZoomBar` work. `ARCHITECTURE.md` is untouched, as the ticket's out-of-scope list requires.
- Pre-existing test edits: marker-legend order assertions dropped from `line-chart.test.ts` "pinned legend" and "series legend" cases, and the old per-chart legend acceptance cases (click only focuses, collapse clears hover) deleted. The ticket's existing-test rule covers both. No other assertion changed.
- Doc claims in `docs/aoe4-build-order-ui.md:132-150`, each checked against the code:
  - one control above the charts: `results.tsx`
  - click, Enter or Space hides lines and labels on every chart: native button plus `visibleMarkers`
  - the item is dimmed with `aria-pressed="false"`
  - a hidden hovered kind labels nothing: `labelKindOf`
  - hidden kinds are not stored and survive a run, collapse and reorder
  - pinned age-ups are hidden unless the current run has no age-up: `line-chart.tsx:69`
  - the pinned legend comes after the series legend
  - collapse hides the series legend and the plot

  All true.

## Linter

`npx tsc --noEmit && npm run lint:dup`: clean (0 clones). `npx next build`: ok. Unit tests (`vitest run components/apps/aoe4-build-order`): 874 passed.

## Bot reconciliation

No `reviewBot.cli` or `rulesFile` is configured, so this section was skipped.

## UI inspection

I served the task checkout at tip `b0c4d35` with `npx next dev`, loaded `/apps/aoe4-build-order` with the Knight/Longbow template, and checked widths 1200, 1280 and 1800 (the REPO checklist widths; the page is desktop-only). States: default, hovering Economy, Economy hidden, and the first item keyboard-focused.

- Overflow inside the control (clipped boxes): none at any width. Page horizontal overflow: none.
- Overlapping items: none.
- Mid-word wraps: the check flagged every item. This is a false positive: the inline-block swatch's rect sits on a different top than the text rect. The screenshots (`w1200-hidden.png`, `w1800-hover.png`) show every item on one line with no break, and the control is 56 px tall (heading plus one row).
- States: the default item has a transparent background at opacity 1. The hovered or active item has the `rgba(13,110,253,0.12)` background and the primary border. The hidden item has opacity 0.5. These three render visibly differently.
- Labels: age-up only by default, Economy's label on hover, back to age-up when hidden.
- Separately, I confirmed the finding 1 behavior: duration is already `1200` after selecting the template, and `setDurationInPlace('1200')` sent 0 simulate POSTs.
- I stopped the server (port 3871 free).

## Non-blocking notes

1. `components/apps/aoe4-build-order/chart-rows.test.ts:79-86`: the `ChartMarkerKind` rows are a second `it.each` with a body copied from the string table above, not a row added to that table as the ticket asked. `ChartMarkerKind` values are strings at runtime, so these rows test nothing the string rows do not. The typecheck of `results.tsx` is what guards the generic signature. Consider folding them into the existing table.
2. `chart-legend.tsx:71`: `MarkerControl` computes the kinds shown inline (`CHART_MARKER_KINDS.filter(... markers.some ...)`), and `line-chart.tsx:69` holds the pinned age-up visibility rule. The design gives "kinds shown" to `chart-markers.ts`. Both are derived rules, not new colour, label or kind lists, so criterion 10 holds, but they could move next to `hasKind` later.
3. `SeriesLegend` sets `aria-pressed` to true while hidden, and `MarkerControl` sets it to true while shown. The ticket and design (C9) prescribe the marker semantics, so this is correct to spec, but the two legends now use opposite meanings for the same attribute.
4. Acceptance coverage gaps (acceptance-test's area): no case where a kind is absent from one run and returns in a later one, and no view-toggle or reorder case for `hidden`. The code holds for all of these.

## Coverage

Reviewed every changed file:
- `chart-markers.ts` and its tests
- `chart-legend.tsx` and its tests
- `chart-rows.ts` and its tests
- `line-chart.tsx` and its tests
- `results.tsx`
- `docs/aoe4-build-order-ui.md`
- the three acceptance specs

I also read the importers of the moved names, `aoe4-split-tab-order.spec.ts` (its Tab walk still fits: fewer stops than before), and `pages/apps/aoe4-build-order.tsx` (Results mount lifetime).

REPO checklist: Every diff (`next build` run, page loaded); AoE4 build order section (no copied helper, docs checked, UI at 1200, 1280 and 1800, no Bootstrap and module CSS mix on new elements, no template-literal classNames). No `REVIEW.md` at the repo root. I ran no acceptance tests.
