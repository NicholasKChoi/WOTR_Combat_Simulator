# SGS-210 implementer report 7

Status: needs_review
Branch: sgs-210-annotations-group-repeated-step-copies (based on origin/main)
Tip: 0f454682185f4b4baaab5430e29344eef3ad5e67 (one commit)
Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-210-annotations-group-repeated-step-copies

## Files touched (all under components/apps/aoe4-build-order/ unless noted)
- step-annotations.ts: `groupBySource`, `combineRuns`, `sourceSpan`, `copyLineText`, `copiesDetailText`, `gutterDetailText`; `StepAnnotation.copies`; `blockedByText` factored through `causeText`/`waitListText`; `alignedRuns`/`buildAnnotations` index source groups.
- step-annotation.tsx: `StepCopies` (`step-copies`, closed `<details data-testid="step-copy-list">`, `step-copy` items) shown when `copies.length >= 2`.
- annotation-popover.tsx: exported `PopoverLines` (one `<div>` per `\n` line); `AnnotationPopover` renders through it.
- build-text-editor.tsx: popover text is `gutterDetailText(annotation)`.
- results.tsx: highlight uses `sourceSpan(result.steps, activeStep, result.durationSeconds)`.
- step-annotation.module.css: `.copyList`, `.copy`.
- docs/aoe4-build-order-ui.md: gutter/popover, run-cell (combined run, `Blocked by`, `n of m done`, copy list, align by submitted step) and hover-shading statements updated.
- step-annotations.test.ts, step-annotation.test.ts: new tables (below) and `copies` added to existing literals.
- annotation-popover.test.ts: new.
- step-table.tsx, pages/apps/aoe4-build-order.tsx, page-help.tsx: unchanged (tsc clean; help text stays true).

## Tests
`npm test`: 94 files passed, 1 skipped; 3025 passed, 15 skipped. `tsc --noEmit` clean; `lint:dup` 0 clones; `next build` succeeds. No acceptance spec added or edited; acceptance suite not run (acceptance-test's).
Invariants encoded: combined run rules (least advanced status, earliest start, latest finish only when completed, summed wait, merged waits, selected cause by combined status, summed longWait, flagged), planner rows 5/6/7, span over all started copies of a source, grouping by `source` and `copy` not position, alignment by source count, identity path by source, gutter text, popover lines, copy-list markup.

Existing tests edited: `step-annotation.test.ts` (StepRunCell, StepTable literals) and `step-annotations.test.ts` (`annotationsByLine` helper `a`): only added `copies: []` (ticket rule: required `copies`). No expected value changed.

## Doc claims
- ui.md gutter: "for a repeated step the gutter shows the combined started and finished times ... and the popover adds one line per copy (`Copy <n>: started ..., finished ..., waited ...` or `... still waiting`), each line its own block" -> `gutterDetailText`, `copyLineText`, `PopoverLines`.
- ui.md run cell: Started earliest start, Finished last copy's finish (`ongoing` while any copy in progress), Waited sum, status least advanced, 60 s warning on summed wait, `Blocked by` merged waits plus first same-status copy cause, `<done> of <n> done`, closed `Each copy` list -> `combineRuns`, `StepCopies`. The claim "an en dash while a copy has not finished" holds for a waiting/not-reached combined status (`completedAt` null, `finishedText`); an in-progress status reads `ongoing`.
- ui.md alignment: "by submitted step, not by result entry" -> `alignedRuns` uses `groupBySource(...).length`.
- ui.md hover: one span from first copy Started to last started copy Finished -> `sourceSpan`. The "Enter or Space from its summary" statement relies on native `<details>` (unverified assumption already listed in the ticket).

## Pinned outputs
None.

## Mutation checks (production code broken, one at a time, test run, break undone with `git checkout`; script in scratch)
Each caught by the named test(s):
- groupBySource: group by position -> groupBySource tests, alignment tests; drop sort -> "groups by source and orders each group by copy".
- combineRuns: copy it instead of returning same -> "returns the same run for one copy"; status most advanced -> status table (all rows), in-progress test; runStep last copy -> "reports completed ..."; start not Math.min -> "takes the earliest start"; completedAt first instead of max -> "reports completed"; completedAt without completed guard -> in-progress test; waitSeconds max instead of sum -> "reports completed", longWait test; waits not summed -> merge test and blockedBy table; cause by waitingOn !== null -> row 7 test; waitingForText from copy 1 -> blockedBy table waiting row (waitingForText column added after first survived); waitingOn null -> flags test and row 7; longWait from any copy -> longWait test; flagged from any copy / false -> status table flagged column (added after first survived); blockedBy cause only -> blockedBy table and row 7; cause guard removed -> in-progress test (waitingOn on the in-progress copy added after it survived).
- blockedByText single not-reached including waits -> "not-reached ignores waitingFor and entries", "leaves a single copy blockedBy as it was".
- sourceSpan: only the target copy -> two sourceSpan tests; from last copy / to first copy -> same; remove same-source filter -> "equals stepSpan", "ignores an unstarted trailing copy and other sources"; out-of-range returns a span / no started copy returns a span -> "is null when ...".
- copiesDetailText: `<= 1` to `=== 0`, join with space, drop still-waiting wording -> the matching copiesDetailText rows.
- gutterDetailText: no-run returns text, drop copy lines, `>= 1` -> the three gutterDetailText tests.
- alignment: count against `flat().length`, index into flat steps, `run = copies[0]` -> alignment, row 5/6/7 and buildAnnotations tests.
- StepCopies: `>= 1`, done counted wrong, `data-copy` 0-based, `data-status` of copy 1, summary text, `open`, blocked-by removed -> the StepRunCell copies tests.
- PopoverLines single text node -> "renders one block element per line".
Not mutation-checked: `results.tsx` and `build-text-editor.tsx` wiring (no unit test by the ticket). One mutation of the identity path (returning null past result.steps) was equivalent and is not claimed.

## Invariants
A3: annotations stay pure functions of result and text. No other invariant touched.

## Unverified assumptions added
None beyond the ticket's list.

## Out-of-scope findings
None.
