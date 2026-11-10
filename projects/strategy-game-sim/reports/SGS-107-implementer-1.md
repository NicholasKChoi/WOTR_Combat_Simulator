# SGS-107 implementer report 1

- Branch `sgs-107-step-annotation-model`, tip `adde412665be1fb345e9d3e2fc8efa9fffcf7299`, base origin/main 68dd089.
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-107-step-annotation-model`
- Status: needs_review

## Files (components/apps/aoe4-build-order/)
- `step-annotations.ts` (git mv from `step-timeline-rows.ts`): `StepRun`, `StepAnnotation`, `BuildAnnotations`, `AnnotationInput`, `alignSteps`, `buildAnnotations`, `finishedText`; `stepSpan(timing, end)`; one shared `stepRun(timing)` helper used by `timelineRows` and `buildAnnotations` (lint:dup clean). `TimelineRow` is now `Omit<StepRun,'runStep'>` plus step/label/kind/reaction, same fields as before.
- `step-annotations.test.ts` (git mv from the old test): new tables for alignSteps, buildAnnotations, StepRun, finishedText.
- `auto-run.ts`: `resultsStale`. `auto-run.test.ts`: resultsStale table.
- `results.tsx`: highlight from `result.steps[activeStep]` (guarded). `line-chart.tsx`, `step-timeline.tsx`: import path only.

## Tests
`npm test`: 62 files, 1910 passed, 10 skipped (pre-existing skips). Invariants encoded: alignment samples (prefix/suffix, cap so a run step maps once), no run on another build's step, stale never reads status only, longWait boundary at 60.

## Pre-existing tests edited
- `step-annotations.test.ts` (was step-timeline-rows.test.ts): import path; `stepSpan` table now passes `timing(0, overrides)` instead of a row (per ticket Scope). No assertion changed.

## Doc claims
No docs or comments added. `docs/` and README had no hits for `step-timeline-rows` or `stepSpan`.

## Pinned outputs
None.

## Mutation checks (all restored; `git status` clean afterwards)
- `step-annotations.ts` suffix cap `shortest - prefix` -> `shortest`: fails `alignSteps > suffix cap stops a run step mapping twice`.
- `>= LONG_WAIT_SECONDS` -> `>`: fails `StepRun > longWait at 60 seconds is true` (and the old timelineRows long-wait test).
- resultsStale status check removed: fails `resultsStale > invalid/rejected/failed with live equal to shown`.
- resultsStale empty-duration check removed: fails `treats an empty duration as different even when the shown duration is zero`.
- buildAnnotations `live.selected !== shown.selected` -> false: fails `drops every run but keeps kinds when another build is selected`.
- finishedText in-progress branch removed: fails both `finishedText > in-progress` rows.

## Results
tsc and `lint:dup` clean (0 clones); `npx next build` succeeded; `git grep step-timeline-rows -- . ':!.claude'` empty. No codegen configured.

## Findings
- The ticket's duplicate samples `[V,V,B]/[V,B]` and `[V,V,V]/[V,V]` do not fail when the suffix cap is removed, because prefix is applied first to the live index (verified by mutation). I kept them as rows and added `shown [A,B]`, live `[A,A,B]` giving `[0,null,1]`, which does fail without the cap.
- An empty duration string only differs from `Number('')` (0) when `shown.durationSeconds` is 0, which the bounds probably forbid; the explicit empty check is kept per the spec and tested with a zero shown duration.
- Identity alignment looks up `result.steps[i]` by index (spec-gate note); a live index past `result.steps` gets `run: null`.
- `step-timeline.tsx` keeps its own local `finishedText`; left as the ticket says the timeline stays until a later ticket.
