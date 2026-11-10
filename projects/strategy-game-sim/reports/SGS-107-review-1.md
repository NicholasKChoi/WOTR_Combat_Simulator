# SGS-107 review 1

- Branch `sgs-107-step-annotation-model`, tip `adde412` (local branch, not on origin). Diff reviewed: `68dd089...adde412` (merge base with origin/main; origin/main has since moved to `a933173`, which touches only `lib/aoe4-build-order/simulate.ts` and its tests; `git merge-tree` against origin/main is clean).
- Review worktree: `worktrees/review-sgs-107-step-annotation-model` (removed after review).

## Verdict: APPROVE

No blocking findings.

## Blocking findings

None.

## Spec gaps

None that block. The ticket's M7.4 acceptance line says the `[V,V,B]/[V,B]` and `[V,V,V]/[V,V]` rows "fail if the suffix cap is removed". That is wrong: prefix runs first, so neither row reaches a suffix overlap. I confirmed this by mutation (removed the cap, i.e. `shortest - prefix` -> `shortest`). Only the added row `shown [A,B] / live [A,A,B] -> [0,null,1]` fails, and the other 58 tests pass. The added row meets the criterion's intent: a test fails when the cap is removed because a run step would map twice (`[0,0,1]`). The ticket and design sample text should be corrected the next time someone edits them (ticket owner; not a code change).

## Acceptance criteria

1. `git grep step-timeline-rows` empty and old files gone: **pass**. `git grep -n step-timeline-rows -- . ':!.claude'` returns nothing. Both renames are recorded. The test file is detected as a rename at 51% similarity, but `step-annotations.ts` only at 40%, because the ticket adds about 80 lines to the moved file. As a result, `git log --follow` at the default 50% threshold stops at adde412, while `git log --follow -M40%` reaches #96 and #84. This follows from the scope, not from a missing `git mv` (see notes).
2. Exports plus tsc and lint:dup: **pass**. Every named export is present (`step-annotations.ts`), as is `resultsStale` in `auto-run.ts:59`. `npx tsc --noEmit` is clean, and `npm run lint:dup` finds 0 clones (run here).
3. `alignSteps` table: **pass**. `step-annotations.test.ts` has one `it.each` table built with `parseBuildOrderText` (`stepsOf`) and all nine design samples, plus the `[A,B]/[A,A,B]` row. That row is the one that catches cap removal (see Spec gaps).
4. `buildAnnotations` cases: **pass**. Covered: null result, null shown, identical text, different selected with different text (runs null, kinds kept), top delete moving old row 1 timing (`startedAt` 11, 21) onto new row 0, edited step `run: null` with kind `economy`, unparseable shown text, step-count mismatch (mutation-sensitive: without the count check the result would be `[0,1,null]`), `stale` copied both ways, kind from the live step when run is null. See the non-blocking note on the identity branch.
5. `StepRun` table: **pass**. Covers all four statuses, including `waiting` with an empty breakdown (`still waiting on resources`), `flagged` per status, and `longWait` at 59.9 (false) and 60 (true).
6. `finishedText`: **pass**. Rows check in-progress with null and with set `completedAt` (`ongoing`), completed 65 (`1:05`), and completed null (en dash).
7. `resultsStale` table: **pass**. All 7 statuses are crossed with no result, live equal, and differing text. Duration `1201`, `''` and `abc` are stale. An empty duration with shown 0 is stale. `selected` alone is not stale. The equal/current=false and differing/current=true rows fail a status-only check.
8. `stepSpan` table on `StepTiming`: **pass**. The same 8 rows as before move to `timing(0, overrides)`, with the expected spans unchanged.
9. No app behavior change: **pass**. `results.tsx:28` now indexes `result.steps[activeStep]`, which matches the old `rows.find(row.step === activeStep)` because the simulator builds `steps` with `step = index` (`lib/aoe4-build-order/simulate.ts:888`). `timelineRows` output is identical: the field set is unchanged (`TimelineRow = Omit<StepRun,'runStep'> & {step,label,kind,reaction}`), and the existing timelineRows tests pass unedited apart from the import. `npm test`: 62 files, 1910 passed, 10 skipped. Playwright `aoe4-build-order-step-band`, `aoe4-build-order-timeline-compare` and `aoe4-results-split`: 21/21 passed (these cover hover highlight, null band for waiting and not-reached, and the timeline render). `npx next build` succeeds.
10. No INVARIANTS.md regressions: **pass**. The diff touches no simulation code, data, API route, or `golang/`. Under S1, imports stay inside the aoe4 app plus its `lib/aoe4-build-order`. A1–A3, W1–W2, H1–H3 and S2–S3 are not touched.

## Invariants touched

None. The diff is a pure client-side model plus a highlight lookup in `results.tsx`.

## Contract checks

- Names match `design/M7.md` Contracts: `StepRun` fields, `StepAnnotation`, `BuildAnnotations`, `AnnotationInput`, `alignSteps`, `buildAnnotations`, `stepSpan(timing, end)`, and `resultsStale(state: Pick<...>, live)`.
- `finishedText` takes `Pick<StepRun,'status'|'completedAt'>` rather than `StepRun`. This is a strictly wider parameter, so it stays compatible with the contract (note only).
- `alignSteps` (`step-annotations.ts:152-162`) matches the design rule exactly: the prefix is capped at `min`, the suffix at `min - p`, `i < p -> i`, `i >= live - s -> i - live + shown`, and everything else is null.
- `buildAnnotations` rule order matches the design: identity on equal text, then null on a differing `selected`, then a parse/count guard, then `alignSteps`. `kind` always comes from the live step.
- `resultsStale` (`auto-run.ts:59-64`) matches the design rules. The extra `shown === null -> true` branch is unreachable, because `result` and `shown` are set together (`auto-run.ts:155,203`); it exists for type narrowing. The `duration.trim() === ''` check mirrors `durationError` (`auto-run.ts:52`).
- Scope: there is no UI, CSS or page wiring, and `step-timeline.tsx`, `timelineRows` and `TimelineRow` are kept as required. No invented constants. No open questions.

## Linter

`npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.

## Review bot

`reviewBot.cli` and `reviewBot.rulesFile` are empty, so there was nothing to run.

## Bot reconciliation

None.

## Non-blocking notes

- `step-annotations.ts:166` (identity branch): no test pins it. Deleting `if (input.live.text === shown.text) return ...` leaves all 59 tests in the file passing (checked by mutation), because with same text and same `selected` `alignSteps` also returns the identity. The case that tells them apart is same text with a different `selected` (for example, a `?b=` load of a build identical to the current text); the design expects identity runs there. Suggested row: `runInput({ live: { text: RUN_TEXT, duration: '600', selected: 'Other' } })` -> `[0,1,2]`.
- `step-timeline.tsx:7` keeps its own local `finishedText`, which duplicates the exported one; the widened `Pick` parameter would accept a `TimelineRow`. The file is deleted in a later M7 ticket, so this is harmless; importing the exported one now would remove the duplicate early.
- Rename history: because of the scope, `step-annotations.ts` lands at 40% similarity to its predecessor, so `git log --follow` needs `-M40%` (or less) to cross the rename. A squash merge cannot do better. Consider softening this line in later tickets that combine a move with large additions.

## Coverage

Files reviewed (all in the diff): `components/apps/aoe4-build-order/step-annotations.ts`, `step-annotations.test.ts`, `auto-run.ts`, `auto-run.test.ts`, `results.tsx`, `line-chart.tsx`, `step-timeline.tsx`. Compared against the old `step-timeline-rows.ts` on origin/main, `auto-run.ts` siblings (`durationError`), and `simulate.ts:888` for the `steps[i].step === i` guarantee.

REPO.md Review checklist:
- Every diff: ran `npx next build` (passes). Instead of a manual `npm run dev` load, the touched Results page was exercised through Playwright (its own dev server), with 21 specs on the timeline and highlight passing.
- AoE4 build order: no helper or constant is copied between `lib/aoe4-build-order/` modules (the shared `stepRun` helper replaces the inline builder); no doc mentions the moved internals (grep of `docs/`, README and ARCHITECTURE.md is empty). UI screenshots are not applicable because no visible UI changed.
- Mutations run by the reviewer (all reverted, worktree clean): removing the suffix cap fails only the added `[A,B]/[A,A,B]` row; removing the identity branch fails nothing (note above).
- No processes left running.
