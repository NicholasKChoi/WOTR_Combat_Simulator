# SGS-216 acceptance-test 9

Branch `sgs-216-population-chart-cap-mark`, reviewed tip `514c5f1`, new commit `29973d953fadc13837bbe89f906160c75852d017` (one file added). Verdict: PASS, no failures.

## Origin of the spec
`acceptance/aoe4-population-cap-mark.spec.ts` was already present, untracked, in the task checkout when I started (no acceptance report existed; its author is unknown). I treated it as mine: judged it, mutation-checked it, fixed it and committed it. It overlaps the Playwright spec the ticket assigns to SGS-217; the caller may want SGS-217 to start from it.

## Tests (5, all in `acceptance/aoe4-population-cap-mark.spec.ts`)
1. Population is the last chart and has exactly one `chart-time-mark`: `data-at` equals the API `populationCapReachedAt`, `data-label` `Population cap`, label text `Population cap 18:15`, stroke `#a52a2a`, width 2, a `population` line, and no mark on the other four charts. Pass.
2. A 600 s run draws no mark on any chart, and the mark returns on a 1200 s run. Pass.
3. Hover over a Markers entry, hiding every marker kind and pinning a run each leave the mark drawn at the same pixel left, with the label text unchanged and a dashed `pinned:population` line. Pass.
4. Zoomed around the cap time the mark is drawn, after reset it is drawn, zoomed before it it is not. Pass.
5. At 1200, 1280 and 1800 px the label's right edge is inside the grid and its bottom is above the x axis line. Pass.

Changes I made to the pre-existing file:
- Test 5 selected the first `text.recharts-label` without a transform, which is the Feudal marker label, not the cap label. With `dy: 0` it still passed. It now selects the label by its `Population cap` text.
- I deleted the `label.left >= grid.left` and horizontal-overflow assertions: no break reaching them failed them. The title now matches.

Harness ran: `acceptanceSetup` then the spec, 5 passed. Also run, all passing (95 tests): `aoe4-chart-layout`, `aoe4-chart-row-feedback`, `aoe4-chart-views`, `aoe4-results-split`, `aoe4-build-order-step-band`, `aoe4-legend-pressed-state`. `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.

## Mutation checks
All breaks ran in the `mutate-sgs-216` scratch (provisioned with `link-node-modules.sh .` and `npm run acceptance:setup`), each reset with `git checkout -- <path>` and `git diff --exit-code`. Scratch removed.

| # | Break | Item | Failed on |
|---|---|---|---|
| 1 | `chart-markers.ts` `timeMarkLabel` uses `Math.round(mark.at)` instead of `formatMinSec` | test 1 and test 3 label text | `toHaveText` expected `Population cap 18:15`, got `Population cap 1095` |
| 2 | `line-chart.tsx` `data-at={Math.round(at)}` | test 1 `data-at` | expected `1094.9413171060362`, got `1095` |
| 3 | `line-chart.tsx` `strokeWidth={1}` | test 1 stroke-width | expected `2`, got `1` |
| 4 | `chart-markers.ts` `TIME_MARK_COLOR = '#a52a2b'` | test 1 stroke | expected `#a52a2a` |
| 5 | `data-label={label.toLowerCase()}` | test 1 `data-label` | expected `Population cap` |
| 6 | `results.tsx` `timeMark={populationCapMark(result)}` for every chart | test 1 other-charts loop | expected 0 marks, got 1 |
| 7 | `result-series.ts` `populationSeries` key `pop` | test 1 and test 3 `population` / `pinned:population` paths | count 1 expected, got 0 |
| 8 | `populationCapMark` always returns a mark (`?? 0`) | test 2 no mark at 600 s | expected 0, got 1 |
| 9 | latch: after a null mark on the Population chart, never draw (global flag) | test 2 mark returns | expected 1, got 0 |
| 10 | `drawnTimeMark` also needs `visible.length > 0` (hidden kinds hide it) | test 3 after hide-all (line 69) | expected 1, got 0 |
| 11 | `drawnTimeMark` also needs `markerView.labelKind === null` (hover hides it) | test 3 hover count (line 65) | expected 1, got 0 |
| 12 | `x={at - (labelKind ? 60 : 0)}` (hover moves it) | test 3 pixel-left equality (line 66) | expected 1483.88, got 1458.68 |
| 13 | `drawnTimeMark` also needs `!pinned` | test 3 after pin (line 72) | expected 1, got 0 |
| 14 | `results.tsx` no pinned series for `chart-population` | test 3 `pinned:population` path (line 71) | expected 1, got 0 |
| 15 | label changed to `Cap` when pinned | test 3 label text after pin (line 73) | expected `Population cap 18:15` |
| 16 | `timeMarkDrawn` window check inverted (`!inWindow`) | test 4 first zoom (line 79) | expected 1, got 0 |
| 17 | `timeMarkDrawn` requires `zoomed` | test 4 after reset (line 82) | expected 1, got 0 |
| 18 | `timeMarkDrawn` window check dropped alone | test 4 last assertion | PASSED (not a valid break alone: recharts `ifOverflow` default discards a line outside the axis domain) |
| 18b | window check dropped plus `ifOverflow="visible"` on the ReferenceLine | test 4 last assertion (line 84) | expected 0, got 1 |
| 19 | `dy: 0` (rejected alternative to the lifted label) | test 5 axis check (line 102, after the selector fix) | expected `< 2991.78`, got `2992.78` |
| 20 | `position: 'insideBottomLeft'` always | test 5 right-edge check | expected `<= 1138`, got `1214.79` |
| 21 | `chart-layout.ts` Population id first in `RESULT_CHART_IDS` | test 1 last-chart check (line 36) | expected `chart-population`, got `chart-floating-resources` |

Note on 18: the `timeMarkDrawn` window rule is not observable in the page by itself, because recharts also drops the line once the window ends before it. Only the unit test of `timeMarkDrawn` pins the rule alone; test 4's last assertion pins the combined result.

Items deleted for lack of a failing break: the test 5 left-edge and overflow assertions. Pre-fix test 5 (wrong label selector) passed under break 19; that is why it was rewritten.

Tree record of the task checkout: before (untracked spec only) `?? acceptance/aoe4-population-cap-mark.spec.ts`, hash `6255a7d95f85d7e931f4c745d9056bacd6ee862f`; after (spec edited and committed, clean tree) hash `6d9b3f285ef4cb73bf050b5c44bc358bfe4a646f`. The two differ only by my edit and commit of that spec; the task checkout's production files were never touched (breaks ran only in the scratch).

## Failures
None.

## Not expressible
- 1200 / 1280 / 1800 px "no overlapping labels, no horizontal overflow" is only partly pinned: the label bounds are asserted, overlap and overflow are not (no break could fail them).
- The in-window rule alone (see note under break 18).
