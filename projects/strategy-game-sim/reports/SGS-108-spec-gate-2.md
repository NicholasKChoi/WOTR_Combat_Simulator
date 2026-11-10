# SGS-108 spec gate 2

Ticket: `tickets/SGS-108-step-run-cell.md` (re-spec 1). Read against SGS-109, SGS-110, `design/M7.md`, the gate-1 report and the SGS-107 worktree.

**Verdict: NEEDS_SPEC** (two small gaps, neither needs the owner)

## Gate-1 gaps

1. Timeline legend, `badge`, `kindBorder` after the move: **closed.** Scope 1 now gives `StepKindLegend` an optional `testId`. The timeline renders `<StepKindLegend testId="step-timeline-legend" />`, its own `LEGEND_KINDS` goes, and it imports `step-annotation.module.css` for `kindBorder`. The page's `step-kind-legend` stays unique, and the criteria cover both the grep and `lint:dup`.
2. Stale case 1 data condition: **closed.** The ticket asserts first that old rows 0 and 1 have different `step-started` text and both carry `data-run-step`.
3. Layout measured element: **closed.** The `step-table-scroll` box wraps only the `<table>` inside the `step-table` fieldset. The criterion compares the table's `scrollWidth` with the box's `clientWidth`, and `panel-build`'s `scrollWidth` with its `clientWidth`. It also asserts that a `step-run` cell exists first, and uses one `page.evaluate` with `expect.poll`.

## Remaining gaps

1. **Contracts (check 5) - `testId` prop and `annotationToneClass` are not in `design/M7.md` Contracts.**
   The design (line 89) says `StepKindLegend(): JSX.Element` and does not list `annotationToneClass`.
   SGS-109 and SGS-110 both build on the new signatures. SGS-110 line 25 names `annotationToneClass`, and SGS-109 relies on the `testId` prop.
   The ticket says "per the design contract" and then departs from it. The ticket does not add either name to CONTEXT.md, and the design does not carry them.
   Fix (manager, no owner needed): add `StepKindLegend({ testId?: string })` and `annotationToneClass(run: StepRun | undefined, stale: boolean): string` to the design Contracts table, or add both to CONTEXT.md. Also reword "per the design contract" in Scope 1.

2. **Acceptance, `annotationToneClass` unit table - the test cannot tell which class is "the warning class" and which is "the opacity class".**
   Scope names neither CSS class. The vitest config sets no `css` option, so CSS modules resolve through vitest's proxy, not real hashed names. An implementer must guess how the test identifies the classes.
   Fix: name the two exports or class keys in `step-annotation.module.css` (for example `warn` and `stale`). State that the test compares against `styles.warn` and `styles.stale` imported from that module. Add that the two keys differ, so "not the opacity class" can fail.

## Consistency with SGS-109 and SGS-110 (the manager asked)

- **`StepKindLegend` testId**: consistent. SGS-109 says to drop the prop "if nothing else passes it". SGS-110 renders the default legend above the Text editor and passes no `testId`, so SGS-109 drops it. Both say `step-timeline.tsx` imports `step-annotation.module.css` for `kindBorder`. SGS-109's removal grep (`step-timeline-legend` only in `aoe4-results-split.spec.ts`) holds after SGS-108, since SGS-108 keeps that id only in the timeline.
- **Step-timeline changes**: consistent. SGS-108 keeps the timeline, `timelineRows`, `TimelineRow`, `scrollBox`, `scrolledTable` and `timeCell`. SGS-109 deletes the timeline and `timeCell`, and keeps `scrollBox` and `scrolledTable` for `compare-panel`. The kind classes move once, in SGS-108.
- **Compare spec move**: SGS-108's rename and rewrite onto `step-row` and `step-run` satisfies SGS-109's `step-timeline` grep criterion for that spec.
- **`annotationToneClass`**: the warning condition (`not-reached`, `waiting`, `flagged`, `longWait`) matches the design (lines 178-179) and SGS-110. `flagged` already means `waiting` or `not-reached`, so the listing is redundant but harmless.
- **Warning tint as `background-color`**: matches SGS-109's `table-active` `box-shadow` check on the first `td`.
- **`StepRunCell`**: SGS-110's only allowed change (a `StepTimes` extraction) leaves SGS-108's unit table valid.

## Other checks

Grounded scope (against the SGS-107 worktree), open questions (none), invariants (none adjacent, accurate), dependencies (SGS-107), size (~200 lines), diagrams (no trigger), On merge (`none`), Risk (`standard`) and docs (Scope 5 covers every untrue sentence) all pass as in gate 1. No new trust-boundary input. No stale-prone number criteria.

## Notes

- The warning rule must out-specify Bootstrap's `.table > :not(caption) > * > *`, as Scope says. The computed `background-color` criterion pins this.
- `annotationToneClass` returns `''` or space-joined classes. Say that the stale opacity applies only to the `step-run` cell, not the row. The ticket already says so, so this is only a reminder for the implementer.
