# SGS-108 spec gate 1

Ticket: `tickets/SGS-108-step-run-cell.md`. Read against the SGS-107 ticket, the SGS-107 worktree (`worktrees/sgs-107-step-annotation-model`, uncommitted state), SGS-109, `design/M7.md`, CONTEXT.md, INVARIANTS.md, LESSONS.md (repo and project).

**Verdict: NEEDS_SPEC** (three small gaps, none needs the owner)

## Cross-ticket checks the manager asked for

**Names from SGS-107: match.** Every name SGS-108 lists exists in the SGS-107 ticket's exports list and in the SGS-107 worktree as written: `STEP_KINDS`, `StepKind`, `LONG_WAIT_SECONDS`, `formatStepTime`, `formatWaitBreakdown`, `finishedText`, `stepKind`, `StepSpan`, `stepSpan(timing, end)`, `StepRun`, `StepAnnotation`, `BuildAnnotations`, `AnnotationInput`, `alignSteps`, `buildAnnotations`, `timelineRows`, `TimelineRow` (kept), and `resultsStale(state, live)` in `auto-run.ts`. Field names SGS-108 uses (`run.runStep`, `status`, `startedAt`, `waitSeconds`, `blockedBy`, `flagged`, `longWait`, `BuildAnnotations.steps`, `.stale`) match. In the worktree `finishedText` takes `Pick<StepRun, 'status' | 'completedAt'>`, which accepts a `StepRun`, so SGS-108's use of `finishedText(run: StepRun)` is fine. `autoRun` (the `useAutoRun` result) already carries `status`, `result` and `shown`, so `resultsStale(autoRun, ...)` type-checks.

**Overlap with SGS-109: none that blocks.**
- SGS-109 does not literally "expect SGS-108 to move" the three timeline cases. Its only dependency is the grep criterion that `step-timeline` appears under `acceptance/` only in `aoe4-results-split.spec.ts`. SGS-108 satisfies it for the compare spec: it renames the file to `aoe4-step-annotations.spec.ts`, rewrites the three timeline cases onto `step-row` and `step-run`, and moves the two compare cases to `aoe4-build-order-pin-compare.spec.ts`.
- SGS-109 edits the specs `step-band`, `results-split`, `narrow-layout`, `knight-longbow-page` and `m3-flow`. SGS-108 edits none of them, except `narrow-layout` and `step-table` if cell positions shift. Neither spec reads `td` by position today (grep), so SGS-108 probably edits neither, and there is no conflict.
- SGS-108 leaves the step timeline, `results-split`, the 1800 px rules and the timeline docs paragraph for SGS-109, and SGS-109 deletes exactly those. SGS-109 adds `activeStep`, `onActiveStepChange` and `Results.activeStep`, and SGS-108 explicitly does not.
- SGS-109's "extend the file SGS-108 added" for the step-table render unit test matches SGS-108's `step-annotation.test.ts` (the `renderToStaticMarkup` of `StepRunCell` and the table). Both are `.ts` files using `createElement`, which fits the vitest `include`.
- SGS-109 says to remove timeline classes "if SGS-108 left copies". SGS-108 moves them, so see gap 1.

## Gaps

1. **Scope 1 / Acceptance (kind colours exist once) - the retained timeline cannot get `badge`, `legendRow` or `kindBorder`; the legend also duplicates `StepKindLegend`.**
   Scope moves `badge`, `legendRow` and every `kind*` class out of `results.module.css`, and the criterion says `results.module.css` has no `kind*`, `badge` or `legendRow` rule. Scope also keeps `step-timeline.tsx` (legend `step-timeline-legend`, rows and test ids unchanged) until the next ticket. Today `step-timeline.tsx` uses `styles.legendRow`, `styles.badge` and `styles.kindBorder` from `results.module.css`, and renders its own legend from `LEGEND_KINDS`. The ticket says only that it imports `KIND_CLASS` and `StepKindBadge`. An implementer would have to guess how the legend row and the left-border class reach the timeline (import `step-annotation.module.css` in the timeline, re-export class names, or leave copies, which contradicts the criterion). The legend map and badge markup would also be a second copy next to `StepKindLegend`, with `lint:dup` at threshold 0.
   Fix: add to Scope 1: "`step-timeline.tsx` renders its legend with `StepKindLegend`, which takes an optional `testId` prop (default `step-kind-legend`; the timeline passes `step-timeline-legend`), and imports `step-annotation.module.css` for `kindBorder`" (or export a `KIND_BORDER_CLASS` from `step-annotation.tsx`). Say that the timeline's `LEGEND_KINDS` and `finishedText` copies go. State that the shared legend is still unique per test id so the "exactly one `step-kind-legend` on the page" criterion holds. If the owner prefers the contract `StepKindLegend()` without props, name another mechanism, but the ticket must name one.

2. **Acceptance, Stale case 1 - a data-dependent test does not first assert its condition.**
   The case catches "aligning by index" only if the old row 0 and old row 1 have different `step-started` text. The ticket does not say to assert that before the delete (common.md: a test whose meaning depends on the data asserts the condition first). It also says "the new row 0 has `step-started` equal to the old row 1's", which passes vacuously if the two are equal.
   Fix: add "assert first that the old row 0 and row 1 `step-started` texts differ and that both rows have `data-run-step`".

3. **Acceptance, Layout at 1280 px - the measured element is ambiguous.**
   "the `step-table` `<table>`'s `scrollWidth <= clientWidth` of its `step-table-scroll` box": `step-table` is the test id of the `<fieldset>`, not the `<table>`, and the sentence compares one element's `scrollWidth` with another's `clientWidth`. An implementer could measure the fieldset or the box.
   Fix: "the `<table>` inside `step-table-scroll` has `getBoundingClientRect().width <= clientWidth` of `step-table-scroll`, and `step-table-scroll` has `scrollWidth <= clientWidth`" (state where the box sits: inside the `fieldset`, around the `<table>` only, so the Add step button stays outside it).

## Checks that passed

- **Grounded scope**: spot-checked in the SGS-107 worktree. `step-table.tsx` (`StepTableProps`, `StartRow` with a two-cell layout and `colSpan={2}`, the three-cell step row, `Labeled`), `results.tsx` (`dimmed`, `aria-describedby`), `workbench.module.css` (`.workbenchSplit > :first-child { overflow-x: auto }` with its comment, `.dimmed` at 0.5), `step-timeline.tsx`, `auto-run-status.ts`, `.fieldset` in `step-table.module.css` (already `min-width: 0`), `panel-build`, `auto-run-status`, `SPLIT_VIEWPORT`, `simulateOk` and `parseBuildOrderText(...).partial` all exist. The docs phrases quoted in Scope 5 exist in `docs/aoe4-build-order.md` (lines ~867, 875, 887, 896, 991).
- **Existing specs**: only `aoe4-auto-run.spec.ts` (line 181, an edit reverted to equal text, still 1 under the stale rule), `aoe4-build-order-pin-compare.spec.ts` (invalid paste) and `aoe4-build-order-m4-flow.spec.ts` (invalid) assert opacity. All stay correct under the stale rule. Scope states the rule ("search `opacity` and `results-last-good`") rather than a list.
- **Open questions**: none, and `CONTEXT.md` Open questions and Decisions are empty. The body agrees with the M7 design (DQ2 A, DQ7, drop of `results-split` left to SGS-109).
- **Contracts**: DOM contract, `StepRunCell`, `StepKindBadge`, `StepKindLegend`, `KIND_CLASS` and `StepTable.annotations` match the design. The ticket correctly leaves `activeStep` and `onActiveStepChange` to SGS-109.
- **Invariants**: A1-A3 do not apply (no `lib/` or data change). The ticket's "none adjacent" is accurate. No criterion contradicts an invariant.
- **Dependencies and size**: depends on SGS-107, stated. About 200 lines of business logic, under 400.
- **Diagrams**: no trigger fires.
- **Lessons**: the repo lesson (read rects in one `page.evaluate` or under `expect.poll`) is followed in the layout criterion.
- **On merge**: exactly `none`. No new command, harness or design doc.
- **Risk**: `standard` is right. No `strongModelTriggers` item (no simulation, schema or API change) and no `criticalPaths` symbol is touched.
- **Docs**: every doc the change makes untrue is in Scope 5 (the sideways-scroll sentence, the three dimming sentences, the two wording fixes). Lines ~900-902 and 963 are left for SGS-109, as that ticket's Scope states.
- **Input validation**: no new trust-boundary input.
- **Stale-prone criteria**: none. The `git grep` criteria express the property (one definition of the kind classes, no timeline scroll rule), and the numbers in the ticket (60 s, 59.9, 534 px) are inputs or context.

## Notes (non-blocking)

- `aoe4-build-order-pin-compare.spec.ts` already has `run` and `runOk` helpers (lines 15-31) and a case near line 154 that covers a pinned 1200 s run against a 300 s run. The moved "pinned run that ends earlier" case should reuse `run` rather than copying `runWith`, and the implementer should check whether it duplicates the existing case. With the timeline cases rewritten, `runWith` and `mmss` are used only by the moved cases, so the "helpers used by both files go to `helpers.ts`" clause probably applies to nothing. `mmss` duplicates `formatMinSec`.
- Under 768 px the start row's new empty first `<td>` becomes an empty block (with padding) at the top of the start card. Consider hiding it in the narrow rule (a `:empty` or class rule) while keeping the "no new narrow-specific rule" stance for the run cell. Not worth a gap since no narrow check is required.
- `StepKindBadge` gains `data-testid="step-kind-badge"` and `data-kind`, and the retained timeline renders it too, so timeline rows will carry those until SGS-109 deletes them. The timeline's `[data-kind]` row locators in existing specs are scoped to `tr`, so no break is expected, but legend assertions that count `[data-kind]` page-wide would pick up row badges. The criterion scopes the count inside `step-kind-legend`, which is correct.
- Warning background on the cell: Bootstrap's `.table > :not(caption) > * > *` sets `background-color` and `box-shadow` on every `td`. The cell rule must out-specify it for the computed `background-color` criterion. SGS-109's `table-active` box-shadow check on the first `td` depends on the tint not replacing the shadow, so use `background-color`, not `box-shadow`, for the warning tint.
