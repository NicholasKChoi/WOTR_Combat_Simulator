# SGS-216 implementer report 5

- Ticket: SGS-216 Add a Population chart with a population cap mark (Feature, standard)
- Branch: `sgs-216-population-chart-cap-mark`, base `origin/main` (7d74800)
- Tip SHA: `91c8dca60e406e38b3775027aa0409c0f6196a5b` (one commit)
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-216-population-chart-cap-mark`
- Own-commit check: skipped (the checkout did not exist before `checkout.sh task`).
- Status: needs_review

## Files touched

Code
- `components/apps/aoe4-build-order/chart-markers.ts`: `ChartTimeMark`, `TIME_MARK_COLOR`, `timeMarkLabel`, `timeMarkLabelPosition`.
- `components/apps/aoe4-build-order/result-series.ts`: `populationSeries`, `populationCapMark`.
- `components/apps/aoe4-build-order/line-chart.tsx`: `timeMark` prop, exported pure `timeMarkDrawn(mark, shown, zoomed)` (the in-window decision, beside `bandIn`), one `ReferenceLine` after the visible marker lines. Label width is `estimateLabelWidth` only (not measured).
- `components/apps/aoe4-build-order/chart-layout.ts`: `chart-population` last in `RESULT_CHART_IDS`.
- `components/apps/aoe4-build-order/results.tsx`: record type gains `timeMark`; `chart-population` entry; `timeMark={chart.timeMark?.(result) ?? null}` (current run only).
- `components/apps/aoe4-build-order/page-help.tsx`: one paragraph in `help-charts` (still seven sections).

Docs
- `docs/aoe4-build-order-ui.md`, `docs/aoe4-build-order-format.md` (Outputs sentence, data-flow graph node), `ARCHITECTURE.md` (chart markers row).
- `docs/aoe4-build-order.md`: checked, overview already names population; unchanged.

Unit tests: `chart-markers.test.ts`, `result-series.test.ts`, `line-chart.test.ts`, `chart-layout.test.ts`, `page-help.test.ts`.

Acceptance specs edited (only chart count, order or id list changed): `aoe4-chart-layout.spec.ts`, `aoe4-chart-row-feedback.spec.ts`, `aoe4-chart-views.spec.ts` (`DEFAULT_Y_LABELS` gains `chart-population`), `aoe4-results-split.spec.ts` (title four to five), `aoe4-build-order-step-band.spec.ts` (title four to five), `aoe4-legend-pressed-state.spec.ts` (see below).

## Tests run

- Unit, `npm test` (full): 95 files passed, 1 skipped; 3148 passed, 15 skipped. Area run `components/apps/aoe4-build-order`: 36 files, 1087 passed.
- Invariants encoded: time-mark label equals `markerLabel` m:ss; label side by the `placeMarkers` rule with non-strict boundary and `origin`; mark drawn unzoomed always, zoomed exactly when `from <= at <= to`; colour pinned, 3:1 on white, distinct from `MARKER_COLORS` and `PALETTE`; `at` 0 is a reached cap; `RESULT_CHART_IDS` ends with `chart-population`, default last and expanded, four-id stored layout gets it appended with `collapsed` kept, stored position and collapsed state of the id kept; help text names the chart, the cap line, the Markers list, the pinned run.

### Acceptance spec runs (acceptance setup first, then each file alone, `npx playwright test <file>`, under `timeout`)
All passed after the fixes below:
- aoe4-chart-layout (31), aoe4-chart-row-feedback (29), aoe4-chart-views (13), aoe4-auto-run (14), aoe4-build-order-pin-compare (42), aoe4-build-order-step-band (13), aoe4-chart-readability (2), aoe4-gathered-resources (5), aoe4-chart-zoom (30), aoe4-compact-view (12), aoe4-key-results-collapse (3), aoe4-legend-pressed-state (5), aoe4-marker-control-sticky (5), aoe4-marker-labels (9), aoe4-min-width (5), aoe4-repeat-step (6), aoe4-results-split (4), aoe4-split-scroll (15), aoe4-split-tab-order (2), aoe4-units-chart-upgrade-dots (17), aoe4-help-modal (15), aoe4-build-order-m4-flow (1), aoe4-build-order-inline-issues (14), aoe4-build-order-run-errors (9), aoe4-step-table (27).
- Not run: `smoke-preview.spec.ts` (names `chart-units-produced` only in an inline fixture, needs a deployed preview; no four-chart assumption).
- Failures found and fixed (all because of the fifth chart): chart-layout alignment test (`count: 4`, four cells); chart-row-feedback drop cases (status text `of 4`, last slot is now below Population, slot list); legend-pressed-state (Population has one series, so the multi-series loop skips it: `CHART_IDS.filter((chart) => chart !== 'chart-population')`; the assertion about several series is unchanged for the other four).

## Pre-existing unit tests edited (`chart-layout.test.ts`, per the ticket's respec-1 rule)
Four-id expectations moved to five-chart order with the same intent: "round-trips a valid layout unchanged" (custom is five ids); "drops unknown and duplicate ids ..."; "drops key-results and unknown ids from order"; "reads an M8-shaped value unchanged" renamed to "reads an M8-shaped four-chart value with the Population chart appended and its collapsed kept" (setup pins the four-id stored layout; expectation is the same layout plus `chart-population`, collapsed kept); `moveChart` rows (the `down gathered` and `up floating` rows moved, plus two new rows for floating down and population up) and the end case uses `population`; `moveChartByKey` second move and end case; `moveChartTo` rows (last index is 4, below-0 row uses population, above-last row) ; "normalises a stored layout that misses an id". No assertion semantics weakened.

## Doc claims (sentence, source that makes it true)
- UI doc "A 200 draws five line charts" and the Population table row: `results.tsx` `charts` has five entries, `populationSeries` key `population`, name `Population`.
- "the other three charts, Population included, have none": `chart-population` has no `headerControls`; only units and gather-rates have a toggle.
- Population chart paragraph (solid 2 px `#a52a2a` line, bottom label `Population cap <m:ss>`, right of the line unless it would pass the right edge, current run only, not a marker kind or control entry, not focusable, `pop-cap` row keeps pinned time, an `at` of 0 counts): `line-chart.tsx` `ReferenceLine` (strokeWidth 2, `TIME_MARK_COLOR`, `insideBottomLeft`/`insideBottomRight`, no `tabIndex`), `results.tsx` passes the current run's mark only, `populationCapMark` uses `=== null`; `compare.ts` untouched.
- "hiding every kind ..., hovering or focusing an entry, a pinned run or a run with no markers leaves it drawn where it was": observed in the page (below) for hide-all and hover; the mark ignores `markerView` and the pinned run in code.
- "out of five", "Population, all expanded", "a stored layout that lacks the Population chart gets it appended last": `RESULT_CHART_IDS`, `normalizeChartLayout`.
- Zoom: "the population cap mark's bottom label is inside the grid, so a press on it starts a selection": `use-chart-zoom.ts`/`chart-zoom.ts` unchanged; the label is part of the plot grid area, not the excluded rows or axes. Not observed in the browser for this label; source is the unchanged zoom code plus design D18.
- "drawn only while its time is inside the window (both edges included) and its label side is judged against the window": `timeMarkDrawn`, `timeMarkLabelPosition(..., shown.from)`.
- Format doc "five graphs ... population (`spawnedPopulation`, with a vertical mark at `populationCapReachedAt` when it is not `null`)" and the graph node: same source.
- ARCHITECTURE row "It also owns the page-side time mark: its colour, label and label position.": `chart-markers.ts` exports `TIME_MARK_COLOR`, `timeMarkLabel`, `timeMarkLabelPosition`.
- Help: "The Population chart draws the population over time. Its red vertical line shows when the population cap was reached, and the line is not a marker, so the Markers list cannot switch it off. A pinned build gets no such line.": `page-help.tsx`, `TIME_MARK_COLOR` is brown-red `#a52a2a`.
- Code comment in `chart-markers.ts` above `timeMarkLabelPosition`: matches the function.

## Pinned outputs
None pinned from engine output beyond: `timeMarkLabel({ at: 1095, label: 'Population cap' })` is `Population cap 18:15` (chart-markers.test.ts, 1095 s from the default build's observed cap 1094.94).

## Observed in the running page (Playwright probe, since deleted)
Default build, 1200 s, `populationCapReachedAt` 1094.9413171060362:
- 1200 px: one `chart-time-mark` in `chart-population`, `data-at` 1094.9413171060362, `data-label` `Population cap`, text `Population cap 18:15`, anchor end (left of the line), stroke `#a52a2a`, width 2; label box 989..1102 within grid 724..1138; no horizontal overflow (0).
- 1280 px: same; label 1029..1142 within grid 764..1178; overflow 0. With every Markers kind clicked off, the mark and its label stayed unchanged; hovering the Age-up entry left it unchanged. At 600 s (cap null) no mark in any chart.
- 1800 px: same; label 1371..1484 within grid 1024..1528; overflow 0.
- The other four charts had no `chart-time-mark` at all three widths. No overlapping labels (the mark label is one text at the plot bottom; the marker labels are on top rows).
- Not observed: zoomed past the mark's time and pinned-run states in the browser (covered by `timeMarkDrawn` unit rows; the pin path in code passes no pinned mark).
- Note: the label text box bottom sits about 2 px below the grid bottom (2993 vs 2991 at 1200 px), above the x tick labels, (lowered by the existing x tick margin); no overlap seen.

## Mutation checks
Ran in the `mutate-sgs-216` scratch (branch `sgs-216-population-chart-cap-mark`, committed state), provisioned with `link-node-modules.sh .` (the repo's node_modules link); no codegen set, no acceptance spec under check. `tree-record.sh` on the task checkout before the scratch and after removal: identical, `hash 6d9b3f285ef4cb73bf050b5c44bc358bfe4a646f`, empty status listing. Each file reset with `git checkout -- <file>` and `git diff --exit-code` (rc 0) after every break; scratch removed.

Each break and the test it failed on its own check:
- `chart-markers.ts timeMarkLabelPosition` `<= end` to `< end`: rows "a label that ends exactly at the end" and "... end of a window" (rejected alternative: strict boundary).
- `at - origin` to `at` (origin ignored): rows "a window origin of 200 (at 900)" and "... end of a window".
- sides swapped: every position row (at 0, well before the end, exactly at the end, passes the end, at the end, both origin rows, window-end row).
- `timeMarkLabel` raw seconds instead of m:ss (rejected alternative): the four `markerLabel` comparison rows (0, 59, 1095, 3725) and the `18:15` test.
- `TIME_MARK_COLOR` set to a marker colour `#b8860b`, to a palette colour `#d62728`, to low contrast `#f0c0c0`, to `#a52a2b`: "keeps its color readable ..." failed at the marker-colour, palette, 3:1 and pinned-value assertions respectively.
- `populationSeries` values `run.times` (wrong source) and key `pop`: "gives one Population series ...".
- `populationCapMark` falsy check `!at` (rejected alternative, `at` 0 unreached): row "0 s"; always null: both rows.
- `line-chart.tsx timeMarkDrawn`: window check dropped (rows before and after), strict edges (rows start edge, end edge), `zoomed` ignored (row "outside the window while not zoomed"), inside never (rows start edge, inside, end edge), null returns true ("draws no mark when there is none").
- `chart-layout.ts`: id dropped from `RESULT_CHART_IDS` (many rows, including the appended M8 row and "ends the default layout ..."); id prepended in `RESULT_CHART_IDS` ("ends the default layout ..."); population always moved last in normalize (rows "listed first", "listed in the middle"); population removed from `collapsed` (row "listed collapsed"); `collapsed` always empty (M8 row and others); default order reversed and default with population collapsed ("ends the default layout ..." at the last-id and not-collapsed assertions); missing ids prepended ("drops unknown and duplicate ...", "appends" M8 row).
- `page-help.tsx`: cap-line sentence, pinned sentence, Markers sentence, and "The Population chart" heading words each removed in turn: "names the Population chart and its cap line ..." failed at its own regex each time.
- Not unit-observable (no recharts SVG in the unit layer): the `ReferenceLine` props and `results.tsx` wiring; these were exercised by the page observation above and by the acceptance runs, not mutation-checked.

## Codegen, build, lint
- codegen: none set. `npx next build`: passed (whole module). `npx tsc --noEmit && npm run lint:dup`: zero issues, 0 clones.
- `npm test` passes; no pre-existing unit or acceptance test failed except those fixed above for the fifth chart.
- Diff review: `git diff --stat origin/main` shows 20 files, all named or intended; no lockfile or tool-generated changes.

## Invariant check
A1 (data from files): no numbers added to simulation code; the 2 px stroke, colour and label size are page styling. A2, A3: no simulation change. Source ownership of the colour and label stays in `chart-markers.ts` (ARCHITECTURE rule kept).

## Unverified assumptions added
None beyond the ticket's list (`insideBottomLeft/Right` label positions, `data-*` forwarding, paint order): confirmed in the real page (label anchor and `data-*` read from the DOM; the mark drew after marker lines).

## Out-of-scope findings
- The label width is `estimateLabelWidth` (8 px per character), wider than the real text (about 113 px against the 160 px estimate), so the label flips left slightly earlier than strictly needed. Within the ticket (measure or estimate only).
- `smoke-preview.spec.ts` not run (needs a preview deployment).
