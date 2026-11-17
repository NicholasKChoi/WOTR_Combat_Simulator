# SGS-195 review 2

- Branch `sgs-195-marker-control`, tip `d570df7`, base `origin/main` (`3bc29b2`, the same merge-base as review 1). Full review, as the caller asked, plus a check that review 1's finding is fixed.
- Verdict: **APPROVE**

## Review 1 finding: fixed

`acceptance/aoe4-marker-labels.spec.ts:235-239` now matches Rework 1's Required fix verbatim:
- duration `'1500'`
- the response is read
- `nextOfKind > 0` is asserted
- then `aria-pressed="false"`
- then `expectLines(page, next.markers.length - nextOfKind)`

`git diff b0c4d35..HEAD` touches only those lines, with no production change.

I loaded the page to check the new step. After the template loads, duration reads `1200`. Setting `1500` in place sent a simulate POST. The new run returned 12 markers (Economy 1), and the hidden Economy item stayed `aria-pressed="false"` at opacity 0.5 with 44 lines across the 4 charts, so the hidden kind survived the run.

The implementer's mutation check is consistent with this. When `hiddenKinds` was reset whenever `result` changed, the test failed at line 238 (`aria-pressed` expected "false", got "true").

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | One control between `chart-order-status` and `chart-table`; kinds in order; null with no markers; unit test | pass | `results.tsx` renders `MarkerControl` between the status and the table. `chart-legend.tsx` `MarkerControl` filters `CHART_MARKER_KINDS` and returns null when it finds no kinds. `chart-legend.test.ts` has "lists one item per kind present..." (unsorted fixture) and "renders nothing without markers". Acceptance test 1 checks the document order and that no chart holds a control. |
| 2 | Click, Enter and Space toggle the kind on every chart; focus stays; kinds asserted from the API | pass | `onToggle` calls `toggleHidden`, and `SeriesChart` draws `visibleMarkers`. Acceptance "clicking, Enter and Space..." checks this, and `setup` asserts age-up plus one other kind. Inspection: 48 lines, then 44 with Economy hidden. |
| 3 | `aria-pressed` and opacity in both states; unit test | pass | Unit test "is pressed and full opacity while shown...". Acceptance reads the computed opacity, `1` and `0.5`. Inspection: Economy hidden shows `false`/`0.5`, the rest `true`/`1`. |
| 4 | Hover and focus label the kind on every chart; hover wins; `data-active` only on the labelled item; hover title on unlabelled markers | pass | `labelKindOf` is computed once in `Results` and passed to every chart. Acceptance hover, keyboard and title tests. Inspection: hovering Economy labels `horticulture 6:12` on each chart, and only Economy has `data-active`. |
| 5 | A hovered hidden kind falls back; with age-up hidden there are no labels and `data-label-rows` is `0`; `labelKindOf` rows | pass | `chart-markers.test.ts` `labelKindOf` rows (hidden hovered kind, age-up hidden). Acceptance test "hiding the labelled kind..." covers this. |
| 6 | Pinned age-ups follow the age-up toggle; always drawn with no current age-up; the pinned legend counts only drawn ones | pass | `line-chart.tsx` sets `ageUpHidden = hidden.has('age-up') && ageUpMarkers(markers).length > 0`, and `pinnedLegendShown` receives the drawn count. `line-chart.test.ts` "pinned legend with hidden marker kinds" has 4 rows. Acceptance pinned test. |
| 7 | Lifetime: `hidden` survives a new run, collapse and pinning; hover and focus reset | pass | `hiddenKinds` is plain `useState` in `Results` and nothing prunes it. `liveMarkerKind` row "kind with no markers left". The acceptance new-run step now starts a real run and can fail (see above). |
| 8 | Scope: nothing else changes; a collapsed chart draws nothing | pass | Only marker rendering reads `markerView`. Acceptance checks that the series path count is unchanged after hiding. |
| 9 | Keyboard: buttons after the info toggle, before the first handle; Tab reaches the first item; no arrow keys | pass | DOM order in `results.tsx`. No key handlers are added. Acceptance keyboard test. |
| 10 | Marker rules only in `chart-markers.ts`; moved tests; new rows | pass | `chart-rows.ts` and `line-chart.tsx` no longer define the names, and `tsc --noEmit` is clean. `chart-markers.test.ts` holds the moved cases plus new `liveMarkerKind`, `visibleMarkers` and `labelKindOf` rows. |
| 11 | `toggleHidden` is generic and does not mutate its input; non-string key row | pass | `chart-rows.ts` `toggleHidden<T>`, and the `ChartMarkerKind` table in `chart-rows.test.ts` (see note 1). |
| 12 | The other four specs keep their assertions; docs fixed | pass (by reading) | Only import lines change in readability and layout. Step-band and pin-compare are untouched. The three untrue statements are gone from `docs/aoe4-build-order-ui.md`. |
| 13 | No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- **A1, A2, A3**: hold. No engine, data or simulation path changes, there is no numeric game literal, and there is no randomness or timer.
- **S1**: holds. No import crosses apps.

## Contract checks

- C8, C9, C13 (`markerView` only) and C16b match `design/M11.md`.
- CONTEXT.md Key surfaces list `chart-markers.ts` and `MarkerControl`, and the code matches.
- There is no zoom, upgrade-dot or `ChartZoomBar` work, and `ARCHITECTURE.md` is untouched.
- Pre-existing test edits fall under the ticket's existing-test rule. These are the marker-legend order assertions dropped from the `line-chart.test.ts` pinned and series legend cases, and the per-chart legend acceptance cases that were deleted. The rework adds no further edits.
- Doc claims in `docs/aoe4-build-order-ui.md:132-150` all hold against the code:
  - one control above the charts
  - click, Enter or Space hides lines and labels on every chart
  - the hidden item is dimmed with `aria-pressed="false"`
  - a hovered hidden kind labels nothing
  - hidden kinds are not stored and survive a new run, collapse and reorder
  - pinned age-ups are hidden unless the current run has no age-up
  - the pinned legend comes after the series legend
  - collapse hides the series legend and the plot
- The rework adds no doc sentence.

## Linter, build, unit

- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
- `npm test`: 2696 passed, 15 skipped.
- `npx next build`: ok.

## Bot reconciliation

There is no `reviewBot.cli` or `rulesFile`, so I skipped this section.

## UI inspection

I served the task checkout at `d570df7` (`npx next dev -p 3877`) and loaded `/apps/aoe4-build-order` with the Knight/Longbow template. I checked it at 1200, 1280 and 1800 px wide, in three states: default, hovering Economy, and Economy hidden. At 1280 I also checked the 1500-second run.

- **Clipped overflow in the control:** none.
- **Overlapping items:** none.
- **Mid-word text wraps:** none.
- **Page horizontal overflow:** none.
- **Control size:** 56 px tall at every width (heading plus one row).
- **States:**
  - default: transparent background, opacity 1
  - hovered/active: `rgba(13,110,253,0.12)` background with a primary-colour border
  - hidden: opacity 0.5
  - All three are visibly different.
- **Labels:** age-up labels by default, `horticulture 6:12` on hover, and age-up labels again once Economy is hidden.
- **Screenshot read:** `w1280-hidden.png`. It shows the control above the first chart with Economy dimmed and everything on one row.
- **Cleanup:** I stopped the server (port 3877 free).

## Non-blocking notes

1. `chart-rows.test.ts:78-86`, carried over from review 1: the `ChartMarkerKind` rows are a second `it.each` with a body copied from the string table, not a row added to that table. Folding them in would be tidier.
2. `acceptance/aoe4-marker-labels.spec.ts:239`: at 1500 s the template returns the same 12 markers as at 1200 s, so the expected line count after the new run is the same as before it. The test can still fail: the `aria-pressed` assertion on line 238 catches a reset, as the mutation check confirmed, and `waitForRun` waits for the `current` status before the assertions. The line-count assertion adds little on its own, though.
3. Acceptance coverage gap (acceptance-test's area), carried over: no test hides a kind, runs a build without it, then runs one with it again. The code handles this case because nothing prunes `hiddenKinds`.
4. `SeriesLegend` uses `aria-pressed="true"` to mean hidden, while `MarkerControl` uses it to mean shown. This follows the spec (C9), but the two legends use the attribute in opposite ways.

## Coverage

I reviewed every changed file:
- `chart-markers.ts` and its tests
- `chart-legend.tsx` and its tests
- `chart-rows.ts` and its tests
- `line-chart.tsx` and its tests
- `results.tsx`
- `docs/aoe4-build-order-ui.md`
- the three acceptance specs, reading `aoe4-marker-labels.spec.ts` in full

I also read `acceptance/helpers.ts` (`waitForRun`, `setDurationInPlace`).

REPO checklist:
- Every diff: build run, page loaded.
- AoE4 build order section:
  - no copied helper
  - docs checked
  - UI checked at 1200, 1280 and 1800 px
  - no new mix of Bootstrap utilities and module CSS
  - classNames built with `cn`

There is no `REVIEW.md`. I ran no acceptance tests.
