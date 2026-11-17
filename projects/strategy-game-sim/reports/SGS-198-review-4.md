# SGS-198 review 4

Verdict: **REQUEST CHANGES**

Branch `sgs-198-units-chart-unit-lines` at 55c83d7a28a9d81e2f7f1c62db3a75da91f76db3, diff `origin/main...HEAD` (8 files). Full review, not delta mode.

## Blocking findings

1. `components/apps/aoe4-build-order/result-series.test.ts:36-50` - test - the `unitLineSeries` order test cannot fail when the series are ordered by key or by tier. The fixture lists `longbowman-2` (tier 2), `spearman-2` (tier 2), `longbowman-3` (tier 3). First-appearance order (`longbowman`, `spearman`) is the same as alphabetical key order and the same as a stable sort by tier. I confirmed this: changing `result-series.ts:13` from `return [...lines.values()]` to `return [...lines.values()].sort((a, b) => a.key.localeCompare(b.key))` keeps all 22 tests in the file passing. The acceptance criterion (B-U1) says this test "fails if the series are keyed by `unitId`, ordered by tier or by key". Why it matters: the order rule decides legend order and series colours, and no test pins it.
   Direction: make first-appearance order differ from both key order and tier order. Change the `lines()` fixture's `unitsProduced` to:
   ```ts
   { unitId: 'spearman-3', baseId: 'spearman', name: 'Veteran Spearman', lineName: 'Spearman', tier: 3, counts: [0, 1, 2] },
   { unitId: 'longbowman-2', baseId: 'longbowman', name: 'Longbowman', lineName: 'Longbowman', tier: 2, counts: [0, 3, 3] },
   { unitId: 'longbowman-3', baseId: 'longbowman', name: 'Veteran Longbowman', lineName: 'Longbowman', tier: 3, counts: [0, 0, 5] },
   ```
   and the expected value to `[{ key: 'spearman', name: 'Spearman', values: [0, 1, 2] }, { key: 'longbowman', name: 'Longbowman', values: [0, 3, 8] }]`. Each wrong implementation this should catch, and the result it gives:
   - Sorting by key (the mutation above) gives `longbowman` first instead of `spearman`.
   - Sorting entries by tier before grouping puts `longbowman-2` first, so it also gives `longbowman` first.
   - Keying by `unitId` gives three keys instead of two.
   - Taking one tier's counts gives `[0, 3, 3]` instead of `[0, 3, 8]`.

   With this fixture, `name` still comes from `lineName`: `Spearman`, not the entry name `Veteran Spearman`. That also checks that the series is named by `lineName` and not by the entry's `name`.

## Spec gaps

None. One note for the ticket owner: the implementer correctly reported that the ticket's Unverified assumption is wrong. Same-layer `ReferenceDot`s do not follow render order, because each dot portals into its z-layer in mount order. The branch fixes this with explicit layers: 600, which is recharts' default `scatter` layer, for the pinned dots and 601 for the current dots. I checked the result in a browser (below).

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| `unitLineSeries` (B-U1) unit test | **fail** | The implementation is right. The test cannot fail on key or tier ordering (finding 1). The empty case and `unitsProducedSeries('units') === unitLineSeries` are covered (`result-series.test.ts:62,227`). |
| `unitUpgradeDots` unit test | pass | `result-series.test.ts:76-108` covers: marker order (at 40 then 20, so a sort by `at` would fail), two upgrades of one line, a line the run never produced, age-up and economy markers without `unit`, and a second run whose line the first run lacks. |
| `valueAt` rows | pass | `chart-rows.test.ts:251-265` covers a value on a sample (10 gives 5), between samples with a non-integer result (12.5 gives 5.75), and past the end (25 gives 8). Returning the previous sample's value fails the rows at 4 and 12.5. |
| `visibleUpgradeDots` (respec 1) | pass | `result-series.test.ts:110-160` covers input order, same-instant duplicates, a stale key, a pinned-only line, a hidden key, window edges at 2 and 6 (kept) and at 1.9 and 6.1 (dropped), and the interpolated value 4 (the previous sample would give 2). The implementer's mutation record matches. |
| Units view lines (B-U1) (respec 1) | pass (inspection); acceptance spec not yet written | On the Knight/Longbow template, `unitsProduced` has `longbowman-2` and `longbowman-3`. The chart draws one `path[data-series=longbowman]` and no `unitId` keys. The legend is `Villager, Longbowman, Knight`, which is `lineName` de-duplicated in order of first appearance. The y label is `Count` in the screenshot. |
| Current dots (B-U2) (respec 1) | pass (inspection) | There is one `chart-upgrade-dot` for the one `longbowman` marker. It has `data-at=838.018581311992`, `data-series=longbowman`, r 4, fill `#ff7f0e` (the line's stroke) and stroke `#fff`. Its centre is on the path (dy about 3e-6 px). Its `<g>` title is `veteran-longbowmen 13:58`. |
| Pinned dots (B-U5) (respec 1) | pass for the same build (inspection); the shorter-duration case is not inspected | It has `data-series=pinned:longbowman`, r 5, fill `#fff`, stroke `#ff7f0e` (the pinned path's stroke), dasharray `3 2`, and `strokeWidth={2}` in the code (`line-chart.tsx:276`). It lies on the pinned path. Its title is `veteran-longbowmen (pinned) 13:58`. The colour comes from `pinnedColor` with the pinned index, the same as the pinned `Line` (`line-chart.tsx:197`). |
| Hidden line (B-U4) | pass (inspection) | Hiding `longbowman` leaves 0 dots and drops both `longbowman` paths. Showing it again brings back 2 dots. |
| Marker control (B-U7) | pass (inspection) | Hiding `unit-tier` in the marker control still leaves 2 dots. |
| Buildings view (B-U6) | pass (inspection and code) | The Buildings view has 0 dots. In the Units view, every dot is inside `chart-units-produced`. `results.tsx:125` passes dots only for that chart in the Units view. |
| Window (B-U8) | pass (code and unit test); not inspected | `visibleUpgradeDots` filters on `shown` (`result-series.ts:39`). Unzoomed, `shown` is `{0, end}` (`use-chart-zoom.ts:27`). |
| Overlap (B-U9) (respec 1) | pass (inspection) | With the same build pinned, the pinned dot comes before the current dot in document order at 1200, 1280 and 1800 px. The pinned radius is 5 and the current radius is 4. |
| Docs (respec 1) | pass | `docs/aoe4-build-order-ui.md:114` names key `baseId`, first-appearance order, tiers summed, and name `lineName`. No row of that table still names a per-tier `unitId` series. |
| Existing tests | pass | The `pin-compare` loop now keys by de-duplicated `baseId`, with assertions unchanged (`:75-79`). The pinned-only case (`:193`) does not depend on keys. The only other test edits are the `unitSeries` tests rewritten for `unitLineSeries`, which the ticket allows. |
| No INVARIANTS.md regressions | pass | A1 to A3 are untouched: UI only, no engine, data or cost literals. S1 to S3 paths are not touched. |

The acceptance specs for B-U1 to B-U9 are not on the branch yet; acceptance-test authors them. The "pass (inspection)" verdicts come from my browser inspection, not from tests.

## Invariants touched

- A1 to A3 (AoE4 paths) hold: no simulation code changed.
- No site-wide paths are touched.

## Contract

- The names `unitLineSeries`, `UpgradeDot`, `unitUpgradeDots`, `valueAt`, `upgradeDots` and `pinnedUpgradeDots` match design/M11.md C13, C16 and C16a. `unitSeries` is removed. `visibleUpgradeDots` and `PlacedUpgradeDot` are the ticket's additions; CONTEXT.md Key surfaces is an On-merge action.
- Scope: no engine, schema, OpenAPI or `StoredPin` change, and no vertical line per upgrade.
- The radii (4 and 5) and white fill come from the design. The dash pattern `3 2` was left open by the design (implementer's choice). No invented constants answer an open question.

## Linter and build

- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones.
- `npx next build`: passes.
- `vitest run components/apps/aoe4-build-order`: 33 files and 901 tests pass.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty. No bot ran and there are no findings to reconcile.

## UI inspection

I served the task checkout with `npx next dev -p 3871` and ran a scratch Playwright script, then stopped the server; port 3871 is free. I loaded `/apps/aoe4-build-order` at 1200, 1280 and 1800 px wide (height 900), selected `ENG Knight/Longbow (King's Palace)`, and went through these states:
- unpinned;
- pinned with the same build;
- `longbowman` hidden, then shown;
- `unit-tier` markers hidden;
- Buildings view, then back to Units.

What the checks found:
- No clipped overflow inside `chart-units-produced` and no horizontal page overflow at any width.
- The dots add no text, so there is no mid-word wrapping to check.
- The current and pinned dots differ in computed attributes: fill `#ff7f0e` vs `#fff`, r 4 vs 5, and a dasharray only on the pinned dot.
- There were no page errors.

I read `units-1280-pinned.png` (the ring with the filled dot inside it, on the orange line at 13:58) and `units-1800-unpinned.png` (the filled dot on the line). There is no visible defect. 1200 and 1280 render identically (same `cx`), as expected under the 1200 px layout floor.

I did not inspect a zoomed window or a pinned run of a different duration.

## Non-blocking notes

- `line-chart.tsx:299` and `:282` repeat `markerLabel`'s template (`` `${label} ${formatMinSec(at)}` ``) inline because `markerLabel` takes a `ChartMarker`. If `markerLabel` took `Pick<ChartMarker, 'label' | 'at'>`, the current-dot title could not drift from the marker label. The pinned form copies the existing pinned-marker title at `line-chart.tsx:264`, so it is consistent.
- `result-series.ts:39` writes the window test inline. The same check exists as the private `inWindow` in `line-chart.tsx:50`. Moving `inWindow` to `chart-zoom.ts` (beside `rowsInWindow`) and using it in both places would keep the edge rule in one place.
- `line-chart.tsx:275`: `pinned?.series.findIndex(...) ?? 0`. The `?.` and `?? 0` cannot apply, because `pinnedDots` is non-empty only when `pinned` is set. `pinned!.series` or reading the index inside `visibleUpgradeDots` would be clearer.
- `PINNED_DOT_Z_INDEX = 600` equals recharts' `DefaultZIndexes.scatter`, which is exported. Deriving both constants from it (`scatter` and `scatter + 1`) would state the intent.
- `result-series.test.ts:2-3` imports `SimulationResult` and `ChartMarker` from the same module in two statements, and `type UpgradeDot` comes last in the import list, where sibling imports put `type` names first (`chart-rows.test.ts:3`).
- I could not reproduce the comment's first clause at `line-chart.tsx:43` ("Recharts orders same-layer reference dots by registration, which put the current dots first") without removing the z-indexes. It fits how `ZIndexLayer` works: each dot portals into a shared layer `<g>` in mount order. The second clause (pinned before current with explicit layers) is confirmed in the browser.

## Coverage

- Reviewed all 8 changed files: `result-series.ts`, `chart-rows.ts`, `line-chart.tsx`, `results.tsx`, `result-series.test.ts`, `chart-rows.test.ts`, `acceptance/aoe4-build-order-pin-compare.spec.ts` and `docs/aoe4-build-order-ui.md`.
- Compared against `chart-rows.ts` (`pinnedColor`, `isLineHidden`, `toChartRows`), `chart-markers.ts:22`, `chart-zoom.ts`, `use-chart-zoom.ts:27`, and recharts 3.10.1 `ReferenceDot`, `ZIndexLayer` and `DefaultZIndexes`.
- REPO.md Review checklist: I followed "Every diff" (build, page loaded) and "AoE4 build order" (1200/1280/1800 widths, no overflow, highlight states differ visibly, no Bootstrap mix in the diff). There is no `reviewBot` and no REVIEW.md.
- Not covered: the zoomed-window and shorter-pinned-run states in the browser. Both are judged from code and unit tests.
