# SGS-216 spec gate (report 2)

Verdict: NEEDS_SPEC (two mechanical gaps; nothing needs the owner)

ticket-lint (graph + spec at origin/main): no errors, no warnings.
Read at origin/main (SGS-215 is disjoint and the ticket says Depends on none; TASK-GRAPH has no dependency for SGS-216 either). No scratch checkout made.

Checked and fine: grounded scope (all named files and functions exist; `ChartTimeMark`, `timeMarkLabel`, `timeMarkLabelPosition`, `populationSeries`, `populationCapMark` are new and the ticket says so; `SimulationResult.spawnedPopulation` and `populationCapReachedAt: number | null` exist in `lib/aoe4-build-order/model.ts`), contracts match design C2/C4 and D15-D18, `18:15` is a design constant (design line 182), `inWindow`/`drawn`/`visible`/`markerView` match origin/main `line-chart.tsx`, Risk standard is right (no criticalPaths symbol touched), no input-validation, no rule exceptions, unverified assumptions listed, `On merge: none` is valid, no overlap with SGS-215/217.

## Gaps

1. **Docs (mechanical)** - `docs/aoe4-build-order-ui.md` line 121 reads "Gather rates and Units produced each have a two-option view toggle ... the other two charts have none." With Population the other charts are three, so the sentence becomes untrue, and Scope's doc list does not name it (it lists the "four line charts" sentence, the table, "out of four", default order, stored layout, Population mark, Markers and Zoom sections). Why an implementer would miss it: it is not a "four" search hit. Fix: add this sentence to the `docs/aoe4-build-order-ui.md` list in Scope, to read correctly for five charts (the Population chart has no view toggle); the criterion on that doc ("no longer says ... four charts") is unchanged.

2. **Testable criteria / existing tests (mechanical)** - Scope's rule for `chart-layout.test.ts` says "any other test keeps its expectation" and names only the "reads an M8-shaped value unchanged" case. That is false: with a fifth id appended by `normalizeChartLayout` and `floating` no longer last, these cases in `components/apps/aoe4-build-order/chart-layout.test.ts` cannot keep their expectations:
   - "round-trips a valid layout unchanged" (`custom` is a four-id order, so it normalizes to five ids);
   - "drops unknown and duplicate ids ..." and "drops key-results and unknown ids from order" (expect four-id orders);
   - `moveChart` rows `down gathered` and `up floating`, and "returns an equal layout for down at the end" with `floating` (now movable);
   - `moveChartByKey` "applies a second move ..." (expects a four-id order) and "returns null for down at the end" with `floating`;
   - `moveChartTo` rows (the "last index 3" and "above the last" rows and every four-id expectation), and the "returns an equal copy for an id not in order" case if its setup changes.
   Why an implementer would guess: the rule says unchanged while several cannot be. Fix: replace "any other test keeps its expectation" with the rule "every case in `chart-layout.test.ts` whose expectation is built from the four-id list, or that treats `chart-floating-resources` as the last chart, is updated to the five-chart order (its pre-change intent kept; the last-position cases move to the new last id, `chart-population`)", and list the cases above as examples.

## Notes (non-blocking)

- Acceptance specs matching `CHART_IDS` or `chart-floating-resources` on origin/main beyond Scope's example list: `aoe4-auto-run.spec.ts`, `aoe4-compact-view.spec.ts`, `aoe4-repeat-step.spec.ts`, `aoe4-units-chart-upgrade-dots.spec.ts`. Scope says "run each spec file that names `CHART_IDS` or a chart id", so the rule covers them; the list is only examples. `acceptance/helpers.ts` takes `CHART_IDS = RESULT_CHART_IDS`, so it follows automatically; `RESOURCE_CHARTS` (three ids) needs no change.
- `docs/aoe4-build-order-ui.md` line 162 "the four columns" correctly stays (ticket says so).
- Criterion on the page at 1200 s hard-codes `Population cap 18:15`; sourced from design, but SGS-215 is the only ticket that could shift it and the design says it does not (production past the cap is after the cap time). The `data-at` equals-API check is the durable part.
