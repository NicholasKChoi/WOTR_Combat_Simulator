# SGS-210: Annotations group a repeated step's copies: combined run, copy list, one shaded span

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M12
- **Priority**: high
- **Risk**: standard
- **Invariants**: A3 (the page only reads timings; the combined run is a pure function of the result, same result and text give the same annotations)
- **Unverified assumptions**: a native `<details>` with a `<summary>` is closed on first render and toggles on Enter or Space from the summary's Tab stop; block elements stacked in the popover show as separate lines (no test in this ticket drives either in a browser, because the page cannot enter a repeat until SGS-211 lands; static markup tests check the elements, and SGS-211's page spec drives the copy list and the shading)
- **LOC estimate**: 195 (`step-annotations.ts` ~120: `groupBySource`, `combineRuns`, `sourceSpan`, `copiesDetailText`, `gutterDetailText`, the two alignment paths and `buildAnnotations`; `step-annotation.tsx`, `annotation-popover.tsx`, `build-text-editor.tsx`, `results.tsx` and CSS ~75; business logic only)
- **Depends on**: SGS-208
- **On merge**: none
- **Source**: design/M12.md (C5, C6, Behavior rules "Repeat: page"), criteria M12.1 and M12.3; reports/M12-planner-5.md outline B and Design questions rows 5, 6 and 7

## Context

After SGS-208 a result has one `StepTiming` per copy of a repeated step, each with `source` (the submitted step
index) and `copy` (1-based), and `result.steps[i].step === i`. The page still pairs live step `i` with
`result.steps[i]`: `step-annotations.ts` `alignedRuns` compares `parsed.order.steps.length` with
`result.steps.length`, its `live.text === shown.text` path returns `result.steps` indexes, and `buildAnnotations`
reads `result.steps[runs[i]]`. Once one source has two copies all three are wrong. This ticket makes the annotation
layer work on sources: a repeated step's row and text line show one combined run, a copy list, and hovering shades one
span from the first copy's start to the last started copy's end (design OD1 option A, D7, D8). On main nothing visible
changes until the paste-and-table ticket lets the page enter `repeat`, because every source has one copy until then
(design/M12.md Starting state: no `xN` in the paste text, no table field). Tests in this ticket therefore build
`SimulateResponse` values with repeated sources directly.

## Scope

All paths under `components/apps/aoe4-build-order/` unless noted. Names follow design/M12.md C5 and C6.

- **`step-annotations.ts`**:
  - `groupBySource(steps)`: `[source] -> copies in copy order`; grouping reads `source` and `copy`, never position.
  - `combineRuns(copies)`: `copies.length >= 1`, returns `copies[0]` itself when there is one. For two or more, the
    rules of design C5 "combined run": `runStep` is copy 1's `step`; `status` is the least advanced copy
    (`not-reached` < `waiting` < `in-progress` < `completed`); `startedAt` the earliest `startedAt` of a started copy, else
    `null`; `completedAt` the latest `completedAt` when the combined status is `completed`, else `null`; `waitSeconds`
    the sum; `waits` merged by `text` in first-seen copy order with seconds summed; `waitingOn` and `waitingForText`
    from the first copy (copy order) whose status equals the combined status when that status is `waiting` or
    `not-reached`, else `null`; `longWait` is the summed `waitSeconds >= LONG_WAIT_SECONDS`; `flagged` is a combined
    status of `waiting` or `not-reached`. `blockedBy` is the merged waits as `<text> <m:ss>` joined with `, `, followed
    by that selected copy's trailing text (`still waiting for ...` or `still waiting on ...`, or `not reached (...)`)
    exactly as `blockedByText` words it for one copy (planner row 6: a combined `not-reached` row ends with the copy's
    `not reached (...)` text after the merged waits; a single copy's `blockedBy` is unchanged). This deliberately
    departs from a literal reading of design C5 ("as `blockedByText` does today", which for one `not-reached` copy gives
    only `not reached (...)` and drops its waits): a combined row keeps the waits earlier copies spent, per planner
    report M12-planner-5 Design questions row 6, which settled it; a reviewer reading C5 alone should not bounce this.
    Factor the per-copy text so one copy and a combination word it the same way.
  - `sourceSpan(steps, runStep, end)`: the copies with the same `source` as `steps[runStep]`; `from` is the minimum
    clamped start of the started ones, `to` the maximum of their `stepSpan` `to`; `null` when none started or `runStep`
    names no step. Equal to `stepSpan` for an unrepeated step.
  - `copiesDetailText(copies)`: `''` when `copies.length <= 1`; otherwise one line per copy giving the copy number,
    started, finished, and waited or still waiting (wording is the implementer's; reuse `formatStepTime`,
    `finishedText`, `waitedText`). Lines are separated by `\n`.
  - `gutterDetailText(annotation)` (respec 1; a helper local to this ticket, not a design contract): the gutter popover's
    text, `''` when `annotation.run` is `null`; otherwise `annotationDetailText(run)`, followed, when
    `annotation.copies.length >= 2`, by a `\n` and `copiesDetailText(copies)`. For an unrepeated step it equals
    `annotationDetailText(run)`.
  - `StepAnnotation` gains `copies: StepRun[]` (empty when the row has no run).
  - `buildAnnotations`: live step `i` aligned to source `j` gets `copies = groupBySource(result.steps)[j].map(<per-copy run>)`
    and `run = combineRuns(copies)`; an unaligned step, or a `j` with no group, gets `run: null`, `copies: []`.
  - Both alignment paths index sources, not `result.steps` (planner row 5). `alignedRuns` compares
    `parsed.order.steps.length` with the number of source groups, then `alignSteps` as today; the `live.text === shown.text`
    path returns source indexes into `groupBySource(result.steps)`. A step whose line changed (for example its `xN`)
    formats differently and so has no run until the next result.
- **`step-annotation.tsx`**: `StepRunCell` shows the combined run exactly as it shows an unrepeated run. When
  `annotation.copies.length >= 2` it adds `data-testid="step-copies"` (`<done> of <n> done`, `done` = copies with status
  `completed`) and a closed-by-default native `<details data-testid="step-copy-list">` whose `<summary>` reads
  `Each copy`; inside, one `data-testid="step-copy"` per copy with `data-copy` (1-based) and `data-status`, showing that
  copy's started, finished, waited and blocked-by. The copy items must not reuse the combined cell's test ids
  (`step-started`, `step-finished`, `step-waited`, `step-blocked-by`, `step-run`), so a locator for the row's own values
  still matches one element. `annotationToneClass` is applied to the combined run, stale dimming unchanged. An
  unrepeated step's cell is unchanged.
- **`build-text-editor.tsx`** (`AnnotationLine`): the gutter shows the combined started and finished times; the popover
  text is `gutterDetailText(annotation)`. `data-status`, `data-flagged`, `data-long-wait`, hover and caret activation use
  the combined run (`runStep` is copy 1's index).
- **`annotation-popover.tsx`** (respec 1): `AnnotationPopover` today renders its `text` as one text node inside a portal,
  so a `\n` would not break the line. It renders the text through a new exported component (name is the implementer's)
  that takes the text and renders one block element per `\n`-separated line, so the line breaks are structural, not a
  CSS `white-space` rule. `AnnotationPopover` itself stays portaled and re-places itself when the text changes, as today.
  A text without `\n` renders as one line, so an unrepeated step's popover reads as before.
- **`results.tsx`**: the highlight is `sourceSpan(result.steps, activeStep, result.durationSeconds)` in place of
  `stepSpan(result.steps[activeStep], ...)` (still `null` when `activeStep` is `null`); `stepSpan` stays exported for
  `sourceSpan`. This wiring has no unit test here (`highlight` is a local passed several levels down to `SeriesChart`,
  and `Results` has no test file); the `sourceSpan` table covers the rule, and SGS-211's page spec checks that hovering
  a repeated row or its gutter line shades one span covering every started copy.
- **`step-annotation.module.css`**: styles for the copy line and list (reusing existing classes is expected).
- **`step-table.tsx`, `pages/apps/aoe4-build-order.tsx`**: expected unchanged (rows and `activeStep` already use `run.runStep`);
  confirm, and change only what the new `StepAnnotation` shape forces.
- **Docs made untrue** (name the statement, the implementer writes the replacement): `docs/aoe4-build-order-ui.md`
  the paragraph on the text view's gutter annotation and popover (a repeated step's line shows the combined times and
  the popover lists each copy), the run-cell paragraph (what the cell shows for a repeated step, the copy count and
  list, what `Blocked by` reads on a combined row, that steps line up by source), and the hover-shading paragraph (a
  repeated row shades one span from the first copy's Started to the last started copy's Finished). Check
  `components/apps/aoe4-build-order/page-help.tsx` (run cell and gutter text) and change it only if a sentence becomes
  untrue. The `xN` paste grammar and the Repeat table field belong to the next ticket.
- **Existing tests, by rule**: `StepAnnotation` gains required `copies`, so every test that builds or deep-equals one
  gets it (examples the search found: `step-annotations.test.ts`, `step-annotation.test.ts`); a test of the changed
  behavior (alignment length check, identity alignment, span) gets the new expected value; any other assertion keeps
  its expected value. The implementer lists every test it edits.
- **New tests**: tables in `step-annotations.test.ts` for `combineRuns`, `sourceSpan`, `groupBySource`,
  `copiesDetailText`, `gutterDetailText` and alignment with a repeated source; static-markup rows in
  `step-annotation.test.ts` for the copy line and list (`renderToStaticMarkup`, as that file does); a static-markup test
  of the popover's line component (respec 1; a new `annotation-popover.test.ts` or rows in an existing file, the
  implementer's choice).

**Out of scope:** `parse-text.ts` (`xN`), the step table Repeat field and `changeAction`, any simulator, schema or
OpenAPI change (SGS-208), a new acceptance spec (the repeated-row spec lands with the paste-and-table ticket, which can
type `xN`), sub-rows per copy (OD1 option B), rename.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `combineRuns` of one copy returns that same run; of two or more it follows the combined-run rules (a table of
      cases): all copies completed gives `completed`, `startedAt` of the first started copy, `completedAt` of the latest,
      `waitSeconds` summed, and `waitingOn` and `waitingForText` `null`; one copy `in-progress` and the rest completed
      gives `in-progress` with `completedAt` `null`; the last copy `not-reached` gives `not-reached`, flagged, with that
      copy's `waitingOn`; waits with the same `text` in two copies merge into one entry with summed seconds in
      first-seen order; the summed wait reaching `LONG_WAIT_SECONDS` sets `longWait` although no single copy reached it.
      A test fails if the status takes the first or last copy instead of the least advanced.
- [ ] Planner row 7 (respec 2): copy 2 `waiting` on wood, with a non-empty `waitDetails` holding the wood seconds it has
      accrued (as the simulator records for a waiting step), and copy 3 `not-reached` with `earlier-step` combine to
      `not-reached` with `waitingOn` `earlier-step` and `waitingForText` `null`; the combined `blockedBy` ends with
      `not reached (earlier-step)` and contains no `still waiting`. Copy 2's recorded wood seconds do appear in the merged
      `waits` (and so in `blockedBy`'s wait list), as the merge rule says, and copy 2's own run in `copies` keeps its
      `waiting` status and its still-waiting-for-wood text. A test fails if the combined row's selected cause is copy 2's
      wood wait instead of copy 3's `earlier-step`.
- [ ] Planner row 6: for a combined row whose status is `waiting`, `blockedBy` is the merged waits followed by the
      selected copy's `still waiting ...` text; for `not-reached`, the merged waits followed by `not reached (<cause>)`;
      for a combined row with all copies completed, only the merged waits. A single copy's `blockedBy` equals what it was.
- [ ] `sourceSpan`: an unrepeated step equals `stepSpan`; a repeated step spans the first started copy's clamped start to the
      last started copy's end; a later `in-progress` copy ends the span at the run end; an unstarted trailing copy is ignored; no
      started copy gives `null`; an out-of-range `runStep` gives `null`. A test fails if the span covers only the copy at
      `runStep`.
- [ ] `groupBySource` groups by `source` and orders by `copy`, so a result whose entries are not in copy order within a
      source still gives copies in copy order; an order with no repeat gives one single-copy group per step.
- [ ] Alignment with a repeated source: a result with 2 copies of source 0 and one of source 1 (three `result.steps`) and a
      shown text of two steps aligns both live steps through the `alignSteps` path; a live step that does not align
      (a changed line) has `run: null` and `copies: []` while the others keep theirs. The shown step count is compared with the
      source count, so a shown text whose step count equals `result.steps.length` but not the source count aligns nothing.
- [ ] Identity path (planner row 5): with `live.text === shown.text` and the same result, live step 1 gets the run of source 1
      (its own copies), not `result.steps[1]` (copy 2 of source 0). A test fails if the path returns `result.steps` indexes.
- [ ] `buildAnnotations`: a repeated source gives `copies.length` equal to its copy count and `run` equal to the combined run;
      an unrepeated source gives one copy and a `run` with the values it had before this ticket (existing assertions keep
      their expected values).
- [ ] `copiesDetailText` is `''` for zero or one copy; for `n >= 2` copies it has one line per copy and each line carries the copy's
      number; a waiting or not-reached copy's line says it is still waiting instead of giving a wait time.
- [ ] `StepRunCell` markup (static render): a two-copy annotation has `step-copies` reading `<done> of 2 done` with the
      completed count (a test with one of two completed reads `1 of 2 done`), one closed `<details>` with
      `data-testid="step-copy-list"` and a summary reading `Each copy`, and two `step-copy` items with `data-copy` 1 and 2 and the
      matching `data-status`; `step-started`, `step-finished`, `step-waited` and `step-blocked-by` each appear exactly once in the cell.
      A one-copy annotation has no `step-copies` and no `step-copy-list`.
- [ ] Gutter text (respec 1): for a repeated annotation the gutter popover text is the combined run's detail text
      followed by one line per copy (the copy lines `copiesDetailText` gives); for an unrepeated annotation it equals the
      combined detail text alone, with no line break; for an annotation with no run it is empty. A test fails if the copy
      lines are missing or if an unrepeated annotation gains a line.
- [ ] Popover lines (respec 1): a static render of the popover's line component gets one block element per line of a
      multi-line text, each holding that line's text in order, and exactly one element for a text with no line break. A
      test fails if the text is rendered as a single text node.
- [ ] The existing `aoe4-step-annotations`, `aoe4-build-order-step-band` and `aoe4-editor-width` acceptance specs pass with
      their assertions unchanged (no visible change while every source has one copy).
- [ ] The UI doc's annotation, run-cell and hover paragraphs describe the combined run, the copy list and the one shaded span, and
      no statement in `docs/aoe4-build-order-ui.md` says a step's annotation is one `result.steps` entry.
- [ ] `npx tsc --noEmit`, `npm test`, `npm run lint:dup` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-18

- Underspecified (spec-gate 2): the gutter line-break criterion asked for a computed-style check on a portaled,
  hover-mounted popover inside an unexported component with no acceptance spec allowed, and the `Results` highlight
  criterion named a prop no test can reach; the draft did not check what a unit test can render or reach.
- Changed: added `gutterDetailText` and a popover line component that renders one block element per line, with
  criteria on each; dropped the `Results` wiring criterion (the `sourceSpan` table covers the rule, SGS-211's page spec
  covers the shading); stated that `blockedBy` for a combined `not-reached` row follows planner row 6 over a literal
  reading of design C5.
- No branch exists; nothing to keep.

## Re-spec 2 - 2026-11-18

- Underspecified (spec-gate 4): the planner row 7 criterion said the combined run must not take copy 2's wood wait,
  contradicting the Scope rule that merges waits by text across copies; a waiting copy's `waitDetails` already holds
  its accrued seconds in the simulator, which the draft did not check.
- Changed: the criterion now pins the selected cause (`waitingOn` `earlier-step`, `waitingForText` `null`, `blockedBy`
  ending `not reached (earlier-step)` with no `still waiting`) and states that copy 2's recorded wood seconds appear in
  the merged waits, with a fixture whose copy 2 has non-empty `waitDetails`. Scope is unchanged.
- No branch exists; nothing to keep.
