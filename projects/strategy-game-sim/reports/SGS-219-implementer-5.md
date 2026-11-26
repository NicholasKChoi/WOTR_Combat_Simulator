# SGS-219 implementer report (n=5)

Status: needs_review
Ticket: SGS-219, branch sgs-219-units-chart-population-cap-mark, base origin/main (0d70911)
Tip: 49e116a42b563f65d692f27e5ca0abf1d288833a
Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-219-units-chart-population-cap-mark

Resumed from an interrupted attempt: the checkout held correct uncommitted work (results.tsx, docs, help, spec). I kept it, fixed a jscpd duplicate in the spec, verified and committed. No origin/<branch> ref existed, so no own-commit check applied.

## Files touched
- components/apps/aoe4-build-order/results.tsx: `chart-units-produced` entry gains `timeMark: populationCapMark`.
- components/apps/aoe4-build-order/page-help.tsx: Units paragraph says it also draws the red vertical line; Population paragraph says it is the same line the Units chart draws.
- components/apps/aoe4-build-order/page-help.test.ts: one added regex assertion (Units chart also draws the red line); seven sections unchanged.
- docs/aoe4-build-order-ui.md: Population chart paragraph, Markers sentence, Zoom label and window sentences now cover both charts.
- docs/aoe4-build-order-format.md: Outputs sentence puts the mark on units-produced and population graphs.
- acceptance/aoe4-population-cap-mark.spec.ts: see below.
- docs/aoe4-build-order.md, ARCHITECTURE.md: checked, no edit needed (neither ties the mark to one chart). No data-flow diagram of graphs exists in the format doc.

## Tests
- Unit `npm test`: 96 files passed, 1 skipped; 3168 passed, 15 skipped, 0 failed.
- Acceptance spec edited: acceptance/aoe4-population-cap-mark.spec.ts; command `npx playwright test acceptance/aoe4-population-cap-mark.spec.ts` (after `commands.acceptanceSetup`); result 14 passed.
  Invariants encoded: Units and Population each show one mark with data-at equal to API populationCapReachedAt and label `Population cap 18:15`; no other chart shows one (Gather rates, Gathered resources, Floating resources); 600 s run shows none; Units shows the mark in both views; hiding all marker kinds, hover, pin leave it in place on both charts; zooming Units past the mark hides it there while Population (no zoom) keeps its own, reset restores it; with the mark, Units `data-label-rows`, marker lines, series paths, upgrade dots and non-mark labels equal the same run with the response's `populationCapReachedAt` forced null, and the mark label is the only extra `text.recharts-label` (upgrade build, 1800 s, which has marker lines, a dot and label rows).
- Spec files run one at a time under timeout (all passed, counts): aoe4-marker-labels 9, aoe4-chart-readability 2, aoe4-build-order-pin-compare 42, aoe4-chart-layout 31, aoe4-marker-control-sticky 5, aoe4-units-chart-upgrade-dots 17, aoe4-chart-zoom 30, aoe4-chart-views 13, aoe4-auto-run 14, aoe4-build-order-inline-issues 14, aoe4-build-order-m4-flow 1, aoe4-build-order-run-errors 9, aoe4-build-order-step-band 13, aoe4-chart-row-feedback 29, aoe4-compact-view 12, aoe4-gathered-resources 5, aoe4-help-modal 15, aoe4-key-results-collapse 3, aoe4-legend-pressed-state 5, aoe4-min-width 5, aoe4-repeat-step 6, aoe4-results-split 4, aoe4-split-scroll 15, aoe4-split-tab-order 2, aoe4-step-table 27, smoke-preview 24, aoe4-population-cap-mark 14. Only the cap-mark spec needed edits.

## Pre-existing tests edited
- acceptance/aoe4-population-cap-mark.spec.ts, "the Population chart is the last chart and carries exactly one mark..." renamed and looped over Units and Population (ticket's Population-only rule). Its `CHART_IDS.filter((chart) => chart !== POPULATION)` loop now excludes both marked charts.
- same spec, "a run that never reaches the cap ...": final check now expects one mark on each of Units and Population after the longer run (ticket rule).
- same spec, "hiding every marker kind, pinning a run and hovering a marker entry leave the mark drawn where it was": now one test per marked chart (`for (const id of MARKED_CHARTS)`) to avoid a jscpd clone with the new Units case. The Population-chart pinned assertion changed from `path[data-series="pinned:population"]` count 1 to the first `path[data-series^="pinned:"]` visible on that chart, and a mark `left` unchanged check after pinning was added. Judgement call; the Population behaviour asserted is the same.
- Helpers `markLabel` and `zoomTo` gained an optional chart id defaulting to Population; other cases unchanged.
- No unit test assertion changed.

## Doc claims
- ui.md: "The Units produced chart (`chart-units-produced`) draws the same mark, at the same time and in the same style, in both its Units and Buildings views, because the view toggle changes only its series and y axis label; no other chart draws a mark, and a run whose cap is not reached draws none on any chart." (results.tsx `charts` record; line-chart.tsx `timeMarkDrawn`; spec tests 1-3).
- ui.md: "On both charts the mark is for the current run only ... not focusable." (line-chart.tsx ReferenceLine; pin test per chart).
- ui.md Zoom: "the population cap mark's bottom label, on either chart" and "drawn on a chart only while its time is inside that chart's window" (line-chart.tsx `timeMarkDrawn`, per-chart zoom state).
- format.md: "...units produced (one line per unit line, or per production building, with a vertical mark at `populationCapReachedAt` when it is not `null`)".
- page-help.tsx: "It also draws the red vertical line described below for the population cap." and "...the same line the Units chart draws" (page-help.test.ts regex).

## Overlap check (Scope)
Throwaway spec (deleted, not committed) measured the mark label box at 1200, 1280 and 1800 px, both views, default build (cap reached at 1200 s) and the upgrade build at 1800 s (cap reached, tier text present, 12 marker lines). In every case the label is inside the grid and above the x axis line (label bottom 703 vs x axis top 705 in Units view, 681 vs 683 in Buildings view), no clipping, and zero overlap with any text, marker line or upgrade dot (the 1200 s default build has no tier text; the 1800 s upgrade build has one tier text in the Units view and no overlap). Buildings view: no offset-line overlap detected. No blocker, no overlap to report.

## Mutation checks
Ran in `mutate-sgs-219` scratch (branch committed first, so no copy step). Provisioning there: `link-node-modules.sh .` and `npm run acceptance:setup` via run.sh. tree-record of the task checkout before and after: status empty, `hash 6d9b3f285ef4cb73bf050b5c44bc358bfe4a646f` both times (match). Every break was reset with `git checkout -- .` and `git diff --exit-code`; scratch removed.
- results.tsx:73 delete Units `timeMark`: fails tests 1, 2, 3, units hide/pin, zoom (final reset count), adds-only (mark count); Population cases still pass.
- results.tsx:73 `timeMark` only in `units` view (rejected alternative: view-dependent): "both its Units and Buildings views" fails on count 1 vs 0.
- results.tsx:145 pass the mark to every chart (`?? populationCapMark(result)`, rejected alternative): "exactly one mark" fails on `toHaveCount(0)` for a non-marked chart.
- results.tsx:73 mark drawn when the cap is not reached (`?? 300`): "never reaches" fails `toHaveCount(0)`.
- line-chart.tsx:73 `mark !== null` plus `ifOverflow="visible"` (draw ignoring the window): zoom test fails at Units `toHaveCount(0)` (line 132). `mark !== null` alone did not fail it, since recharts discards an out-of-domain line; the pair is the working alternative.
- line-chart.tsx:154 rows +1 with mark: adds-only `rows` (toBe 1 vs 2) fails.
- line-chart.tsx:127 drop first visible marker: `markerLines` fails. :159 drop first chart row: `paths` fails. :131 drop first upgrade dot: `dots` fails (1 vs 0). :150 drop first placed label: `labels` fails.
- line-chart.tsx:278 hide mark when `visible.length > 0` fails / `markerView.hidden.size === 0` / `markerView.labelKind === null` / `!pinned`: the per-chart hide-every-kind, hover and pin cases fail on `toHaveCount(1)` at the matching step (lines 120, 116, 123).
- line-chart.tsx:280 mark x shifted by hover (`labelKind`) or pin: `left` equality at lines 117 and 125 fails.
- line-chart.tsx:287 label `value: drawnTimeMark.label` (no time): `toHaveText('Population cap 18:15')` fails (received `Population cap`).
- page-help.tsx Units sentence changed to "It does not draw the line described": the new `page-help.test.ts` regex assertion fails.
Not separately broken: the stroke and stroke-width assertions in the looped first test (same code path for both charts, pre-existing assertions).

## Build, lint, codegen
- codegen: none set. `npx next build`: succeeded. `npx tsc --noEmit`: 0 errors. `npm run lint:dup`: passes after the spec fix (first run flagged a 9-line clone in the spec, since removed).
- No lockfile or unrelated file changes; `git status` clean at tip.

## Invariant check
A1, A2, A3 untouched (no lib or data change). INVARIANTS S1 unaffected.

## Unverified assumptions added
None.

## Out-of-scope findings
None. Note: `mark !== null` alone in `timeMarkDrawn` is masked at the browser level by recharts discarding out-of-domain reference lines; only `line-chart.test.ts` `timeMarkDrawn` pins the window rule (pre-existing).

## Status
needs_review
