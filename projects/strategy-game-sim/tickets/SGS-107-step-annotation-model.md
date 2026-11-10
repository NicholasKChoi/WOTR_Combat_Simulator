# SGS-107: Add the step annotation model and resultsStale

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M7 / M7.1, M7.2, M7.4 (model)
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none adjacent (pure client-side model; no change to `lib/aoe4-build-order/simulate.ts` or any data file)
- **LOC estimate**: 180 (`step-annotations.ts` new types and functions, `resultsStale` in `auto-run.ts`; tests excluded, about 200 more)
- **Depends on**: none
- **On merge**: none
- **Source**: `design/M7.md` (Modules, Contracts, Behavior rules for `resultsStale`, `alignSteps`, `buildAnnotations`); `plans/M7-20261110.md` outline A

## Context

M7 puts run timing on each live step of the build order instead of in a separate timeline. This ticket lands the pure model every later M7 ticket reads: which shown-run step each live step aligns to (`alignSteps`), the per-step annotation (`buildAnnotations`), and whether the shown result is stale (`resultsStale`). There is no UI change. The model must never put a time on a step that did not produce it.

## Scope

Rename with `git mv` so history follows:

- `components/apps/aoe4-build-order/step-timeline-rows.ts` to `step-annotations.ts`
- `components/apps/aoe4-build-order/step-timeline-rows.test.ts` to `step-annotations.test.ts`

Update every importer of the old module path (today: `step-timeline.tsx`, `results.tsx`, `line-chart.tsx`, and the test file); `git grep step-timeline-rows` outside `.claude/` must find nothing afterwards.

In `step-annotations.ts`:

- Keep unchanged: `STEP_KINDS`, `StepKind`, `LONG_WAIT_SECONDS`, `formatStepTime`, `stepKind`, `StepSpan`. `formatWaitBreakdown` keeps its output but takes `StepRun['waitBreakdown']` (the same element shape as today's `TimelineRow['waitBreakdown']`).
- Add per the design contracts, with these exact names: `StepRun`, `StepAnnotation`, `BuildAnnotations`, `AnnotationInput`, `alignSteps(shownSteps, liveSteps)`, `buildAnnotations(input)`, `finishedText(run)`.
- `StepRun` is built from a `StepTiming`: `runStep` = `timing.step`; `waitBreakdown` keeps today's fixed reason order and drops zero entries; `blockedBy` uses today's `blockedByText` rule (not-reached reads `not reached (<waitingOn>)`; waiting appends `still waiting on <waitingOn>`, alone when the breakdown is empty); `longWait` is `waitSeconds >= LONG_WAIT_SECONDS`; `flagged` is status `waiting` or `not-reached`.
- `finishedText(run)` returns `ongoing` for status `in-progress`, else `formatStepTime(run.completedAt)`.
- `stepSpan(timing: StepTiming, end: number)` replaces `stepSpan(row: TimelineRow, end)`; the clamp and in-progress rules are unchanged.
- `alignSteps` follows the design rule: key = `formatBuildStep(step)`; `p` = longest common prefix of keys; `s` = longest common suffix capped at `min(shown, live) - p`; live `i < p` maps to `i`, live `i >= live - s` maps to `i - live + shown`, the rest to `null`.
- `buildAnnotations` follows the design rules: `null` when `result` or `shown` is null; identity alignment when `live.text === shown.text`; every `run` null when text differs and `live.selected !== shown.selected`; otherwise `alignSteps(parse(shown.text).steps, liveSteps)`, with every `run` null when `parseBuildOrderText(shown.text)` fails or its step count differs from `result.steps.length`; `kind` is always `stepKind(liveStep, landmarks)`; `stale` copied from the input. Pure: no state, no memoization inside.
- Keep `timelineRows` and `TimelineRow` exported from the moved file, unchanged except for what the moved helpers require (`formatWaitBreakdown`'s parameter type, a reused blocked-by helper). The step timeline still renders from them until a later ticket deletes it. Do not add behavior to them.

In `auto-run.ts`: add `resultsStale(state: Pick<AutoRunState, 'status' | 'result' | 'shown'>, live: LiveInput): boolean` per the design: `false` when `result === null`; `true` for status `invalid`, `rejected`, `failed`; `true` when `live.text !== shown.text` or `Number(live.duration) !== shown.durationSeconds` (an empty or non-numeric duration counts as different); otherwise `false`. A change to `selected` alone does not make it stale. Do not wire it into the page.

In `results.tsx`: the highlight becomes `stepSpan(result.steps[activeStep], result.durationSeconds)` (guard the missing step), no longer built from a `TimelineRow`. `results.tsx` keeps its own active state and the timeline until a later ticket.

Docs: no doc describes these internals; grep `docs/aoe4-build-order.md` and `README` for `step-timeline-rows` and `stepSpan` and fix any hit.

Existing tests: tests that import from `./step-timeline-rows` move to `./step-annotations`; the `stepSpan` table passes a `StepTiming` (from the existing `timing` helper) instead of a row. The implementer lists every test it edits.

**Out of scope:** any UI, CSS or page change (the page does not call `buildAnnotations` or `resultsStale` yet); deleting `step-timeline.tsx`, `timelineRows` or `TimelineRow`; `annotationsByLine`; `step-annotation.tsx`; the simulator.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `git grep step-timeline-rows -- . ':!.claude'` matches nothing, and `step-timeline-rows.ts` and its test no longer exist (history follows through `git mv`).
- [ ] `step-annotations.ts` exports the names `StepRun`, `StepAnnotation`, `BuildAnnotations`, `AnnotationInput`, `alignSteps`, `buildAnnotations`, `finishedText`, `stepSpan`, `STEP_KINDS`, `StepKind`, `LONG_WAIT_SECONDS`, `formatStepTime`, `formatWaitBreakdown`, `stepKind`, `StepSpan`; `auto-run.ts` exports `resultsStale`. `npx tsc --noEmit` and `npm run lint:dup` pass.
- [ ] A table test in `step-annotations.test.ts` over `alignSteps`, one row per case, built from paste lines parsed with `parseBuildOrderText`, pins every design sample: equal `[A,B,C]` gives `[0,1,2]`; live `[]` gives `[]`; shown `[]` with live `[A]` gives `[null]`; insert at top `[N,A,B,C]` gives `[null,0,1,2]`; delete middle `[A,C]` gives `[0,2]`; edit one step `[A,X,C]` gives `[0,null,2]`; swap first two `[B,A,C]` gives `[null,null,2]`; shown `[V,V,B]` with live `[V,B]` gives `[0,2]`; shown `[V,V,V]` with live `[V,V]` gives `[0,1]`. The duplicates rows fail if the suffix cap is removed (a run step would map twice).
- [ ] `buildAnnotations` table cases: `result` null gives `null`; `shown` null gives `null`; identical text gives every step its `run` with `runStep` equal to its own index; a different `selected` with different text gives every `run` null while `kind` stays set; same `selected` with an aligned edit (a step deleted at the top) gives the old row 1's timing on the new row 0 and `run: null` on an edited step; unparseable `shown.text` gives every `run` null; a `shown.text` whose parsed step count differs from `result.steps.length` gives every `run` null; `stale` equals the input's `stale`; `kind` comes from the live step even when `run` is null.
- [ ] `StepRun` table cases cover every status (`completed`, `in-progress`, `waiting`, `not-reached`): `blockedBy` text per status (including `waiting` with an empty breakdown reading only `still waiting on <waitingOn>`), `flagged` true only for `waiting` and `not-reached`, and `longWait` false at `waitSeconds` 59.9 and true at 60 (the break it catches: `>` instead of `>=`).
- [ ] `finishedText` returns `ongoing` for `in-progress` and the `formatStepTime` of `completedAt` otherwise (an en dash for a null `completedAt`).
- [ ] A table test over `resultsStale` crosses status (`loading`, `running`, `current`, `updating`, `invalid`, `rejected`, `failed`) with live equal or different to `shown`: `result` null is `false` in every status; `invalid`, `rejected`, `failed` are `true` even when live equals shown; equal text and duration is `false` in `current` and `updating`; different text is `true`; different duration is `true`; an empty duration string is `true`; a differing `selected` alone is `false`. These cases fail if the check reads only `status`.
- [ ] The `stepSpan` table (completed, in-progress to the end of the run, waiting and not-reached give `null`, zero length, both clamps) passes against a `StepTiming` argument and returns the same spans as before the move.
- [ ] No behavior change in the app: `Results` shows the same highlight for the same active step, and the step timeline still renders from `timelineRows`. Every existing `npm test` suite passes with only the import-path and `stepSpan` argument edits described in Scope.
- [ ] No INVARIANTS.md regressions

## Open questions

none
