# M7 designer report 1

Verdict: design written. Path: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/design/M7.md`.

## Contracts fixed (names)

- `step-annotations.ts` (renamed with git mv from `step-timeline-rows.ts`): `STEP_KINDS`, `StepKind`, `LONG_WAIT_SECONDS`, `formatStepTime`, `formatWaitBreakdown`, `stepKind`, `StepSpan`, `stepSpan(timing, end)`, `finishedText`, `StepRun`, `StepAnnotation`, `BuildAnnotations`, `AnnotationInput`, `alignSteps`, `buildAnnotations`. `TimelineRow` and `timelineRows` are removed.
- `auto-run.ts`: `resultsStale(state, live)`.
- `step-annotation.tsx`: `KIND_CLASS`, `StepKindBadge`, `StepKindLegend`, `StepRunCell`. The kind CSS moves into `step-annotation.module.css`.
- `StepTable` new props: `annotations`, `activeStep`, `onActiveStepChange`. `Results` drops `text` and `landmarks` and adds `activeStep`.
- DOM: `step-kind-legend`, `step-run` (`data-stale`), `step-kind-badge`, `step-started`, `step-finished`, `step-waited`, `step-blocked-by`. `step-row` gains `data-kind`, `data-run-step`, `data-status`, `data-flagged`, `data-long-wait` and `data-active`.
- M7.6 under A: `annotationsByLine`, `build-order-annotations`, `build-order-line-annotation`. Under B: `step-table-compact`, `step-summary`, `compactRows`.

## Key behavior rules

- Alignment works on the canonical step text: the common prefix first, then the common suffix, capped. Unaligned steps keep their kind but show no times.
- When `selected` differs from the shown run's, no step shows times, so another build's times never appear.
- `resultsStale` is true when the status is invalid, rejected or failed, or when the live text or duration differs from the shown input. It dims both the charts and the run cells.
- The active step is lifted to the page and keyed by the run step index. A new result, or an edit that leaves the step unaligned, clears it.

## Extension points

- One annotation model with two consumers, so the other M7.6 option is additive.
- `compactRows` is a page-level boolean that can grow into per-row flags.
- `buildAnnotations` takes `result` and `shown` explicitly, so the pinned run can be annotated later.
- `alignSteps` can be replaced by an LCS alignment without changing its signature.
- The run cell is a plain `td`, so narrow layouts stay possible.

## Owner decisions

1. M7.6, A (Text tab gutter) or B (compact table rows). Recommended: A. The Text view is the default, and without A it shows no timings. The cost of each option per component is in the doc. Under B there is a follow-up question: should the default view become Table? Recommended: no.

## Manager must act on

- Visible change to M6.3: the charts now also dim during the debounce and `updating` window, because the charts and annotations dim together under M7.4. The doc records this as a rule.
- M7.1 to M7.5 and M7.7 can be planned now. Only M7.6 waits on the board answer.
