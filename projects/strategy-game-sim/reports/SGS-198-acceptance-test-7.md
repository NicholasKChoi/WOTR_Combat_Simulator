# SGS-198 acceptance-test 7

Verdict: PASS. 12 new tests written and passing; 67 passed in the new spec + pin-compare + chart-views, and 39 passed in chart-zoom + marker-labels. `npm test` 2844 passed; `tsc --noEmit` and `lint:dup` clean.
Branch sgs-198-units-chart-unit-lines. Base tip 45e14d2; new tip (commit of the test file only): **3bd813828f32e1058b44ec6a642bad941ea36e5e**.
Harness ran for real: Playwright/Chromium, `next dev` webServer, acceptanceSetup done.

File: `acceptance/aoe4-units-chart-upgrade-dots.spec.ts` (template `ENG Knight/Longbow (King's Palace)`; only longbowman upgrade is `veteran-longbowmen` at 838.02 s; longbowman has tiers 2 and 3).

## Tests

1. one path per unit line, none keyed by a per-tier unitId, legend names = lineNames per baseId in first-appearance order, y label `Count` (B-U1).
2. prefixed-tier build (`ENG Spear/Longbow into MAA/Crossbow`): legend uses `lineName`, asserted from API that a tier `name` differs (B-U1 name).
3. hover tooltip for Longbowman at two samples (tier 2 only, tier 3 only) equals the summed counts (B-U1 sum).
4. current dot: count, `data-at`, `data-label`, `data-series`, centre on the line path (one evaluate, `expect.poll`), fill = line stroke, white stroke, r 4, `<title>` = `markerLabel` (B-U2).
5. dot between two samples where the line rises (variant text with 6 extra longbowmen, upgrade at 904.47 s, API-asserted rise), current and pinned dots lie on their paths; pinned run ends before the upgrade (B-U2/B-U5 value).
6. pinned dots: `pinned:longbowman`, on the pinned path, white fill, dashed stroke in the path colour, r 5, `(pinned)` title; current dots only for the shorter run; unpin removes; rerun recomputes (B-U5).
7. pinned dot kept while a current run ending before the upgrade draws none (B-U3 per-run).
8. hide `Longbowman` in the series legend removes both lines and both dot kinds; show restores (B-U4).
9. hiding `unit-tier` markers removes the vertical lines, leaves both dot kinds (B-U7).
10. Buildings view and the other charts have no dots; Units restores (B-U6).
11. zoom window excluding the upgrade drops current and pinned dots; window including it brings them back (B-U8).
12. same build pinned and shown again: dots coincide, pinned precedes current in document order, pinned r > current r (B-U9).

All 12 pass. Existing pin-compare (keyed by baseId, dashed/non-dashed, pinned-only series) and chart-views specs pass unchanged.

## Mutation checks (each undone with `git checkout`, `git diff --exit-code` on non-test files clean)

| Break | Failed test and assertion |
|---|---|
| `chart-rows.ts` `valueAt` returns previous sample | test 5, `expectOnLine` (dot off the line); the template-only test 4 did NOT fail (counts flat at 835/840), so test 5 was added |
| `result-series.ts:11` key by unitId (no merge) | tests 1 (`lineOf(longbowman)` count), 3, 4, 5, 6, 7 |
| `result-series.ts` last tier / first tier only | test 3, `value` toBe summed count (3 vs 0; 59 vs 0) |
| `result-series.ts` `name: u.name` | test 2, legend `toHaveText` (test 1 survived: names equal on the template) |
| `result-series.ts` drop `isLineHidden` check | test 8, `[data-series=longbowman]` dot count 0 |
| `line-chart.tsx` `PINNED_DOT_Z_INDEX` 602 | test 12, "pinned dot precedes current dot" |
| pinned fill `#000` | test 6, fill toBe white |
| pinned `strokeDasharray` removed | test 6, dash not `none` |
| current stroke `#000` | test 4, stroke toBe white |
| current fill `seriesColor(0)` | test 4, fill toBe line stroke |
| `DOT_RADIUS` 6 | tests 4 (r 4) and 12 (`pinned.r > current.r`) |
| dots hidden when `unit-tier` hidden | test 9, dot count |
| pinned dots judged by the current run's series | test 5, `expectOnLine` for pinned dot (last block) |
| window filter removed + `ifOverflow="visible"` on both dots | test 11, `expectNoDots` |

## Mutations that survived (cannot be expressed through this boundary)

- **Window filter alone** (`dot.at < shown.from || dot.at > shown.to` removed in `visibleUpgradeDots`): test 11 still passes because recharts' default `ifOverflow: 'discard'` drops out-of-domain dots in the DOM. The test fails only when both are removed (shown above). The filter itself is pinned by the `result-series.test.ts` unit test, not by the page.
- **Stale-key rule** (`!line` check) and **Buildings/other charts get dots** (`results.tsx` passes dots in every view): unreachable from the page, because the dot keys (`longbowman`) are never keys of the building or resource series, and `unitUpgradeDots` already drops markers with no line. Test 10 pins the observable outcome (no dots) but no break of production code makes it fail. Kept because it is the only test of B-U6; flag for the caller: rewrite or delete is your call. The stale-key rule rests on the unit test.
- B-U8 "a dot inside the window is in the DOM" and B-U1 order/sum on ordering are covered; the previous-sample `valueAt` rule for the *current* dots needs the rising-line variant (test 5), since the shipped template is flat at 838 s.

## Failures

None. No impl-defect or spec-gap found.

## Criteria not expressible in this harness

- Stale pinned/current key, same-instant duplicates, and exact boundary `shown.from`/`shown.to` handling (unit-test territory per the ticket).
- B-U1 "ordered by tier or by key" fails (the rework 1 fixture): unit-test only; the template's first-appearance order equals the tested legend order but sorting alternatives are not distinguishable there.

## Notes

- The pinned/current explicit zIndex (600/601) holds: DOM order verified through `ZIndexLayer` rendering (test 12 failed when swapped).
- No processes left running (Playwright webServer stops with the run).
