# SGS-110: Annotate the Text-tab gutter with each step's kind and run times (compact view)

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M7 / M7.6, M7.7 (part: Text view doc paragraph and compact-view spec)
- **Priority**: medium
- **Risk**: standard
- **Invariants**: A3 (annotations are derived from the shown result and the live text; no clock or randomness; hover and caret state feed no result path). S1 (imports stay inside `components/apps/aoe4-build-order/`, `lib/aoe4-build-order/` and the page). Not adjacent to S3, A1 or A2.
- **LOC estimate**: ~180 (`annotationsByLine` ~20 in `step-annotations.ts`, `build-text-editor.tsx` ~90, page wiring ~20, CSS ~50; business logic only; the unit and acceptance tests and the docs diff are excluded)
- **Depends on**: SGS-108, SGS-109
- **On merge**: none
- **Source**: `design/M7.md` (pass 3), Contracts, DOM contract, Behavior rules "M7.6 gutter" and "Legend", Criteria map M7.6; `plans/M7-20261110.md` outline D, DQ3, DQ4, DQ5 and Owner answers (Q25); M7.6, M7.7

## Context

M7 puts the build order's run result on the build itself. SGS-107 to SGS-109 added the annotation model, the step table's run cell and row hover shading, and the page's active-step state. The default Text view still shows none of it. M7.6 (owner decision: the Text-tab gutter is the compact view) draws one annotation per step line in a second gutter beside the textarea, from the same `BuildAnnotations` the table reads, so both views show the same colours and times.

## Scope

Names below come from `design/M7.md` and from the tickets this one depends on. Their code is not on `main` yet; it is described as its end state.

End state this ticket relies on:

- SGS-107 (`step-annotations.ts`): `StepAnnotation`, `BuildAnnotations`, `StepKind`, `finishedText`, `formatStepTime`, `formatWaitBreakdown`.
- SGS-108 (`step-annotation.tsx`, `step-annotation.module.css`): `KIND_CLASS`, `StepKindBadge`, `StepKindLegend` (test id `step-kind-legend`), the kind colours, the flagged and long-wait warning background and the stale opacity of `step-run`, and the page's memoized `annotations` and `stale`.
- SGS-109 (page): the `active` state with the derived `activeStep` (a `runStep`), and the handler that sets it, passed to `StepTable` as `onActiveStepChange`.

Changes:

1. `components/apps/aoe4-build-order/step-annotations.ts`: add `annotationsByLine(annotations: BuildAnnotations, stepLines: readonly number[], lineCount: number): (StepAnnotation | null)[]`. The result has length `lineCount`; index `stepLines[i] - 1` holds `annotations.steps[i]`; every other index is `null` (blank, comment, `start` and unparseable lines). A step line number outside `1..lineCount` is ignored.
2. `components/apps/aoe4-build-order/build-text-editor.tsx` (`BuildTextEditor`): new props `annotations: BuildAnnotations | null`, `lines: BuildOrderLines` (the live parse's lines), `activeStep: number | null`, `onActiveStepChange: (runStep: number | null) => void`.
   - While `annotations !== null`, render a second `ol` (`data-testid="build-order-annotations"`, `aria-hidden="true"`) between the line-number gutter and the textarea. One `li` per text line (`data-testid="build-order-line-annotation"`, `data-line`), in the same font and line height as the line numbers and the textarea so rows align (extend the shared `.gutter, .textarea` rule in `workbench.module.css`; new rules for the annotation column go in `step-annotation.module.css` or `workbench.module.css`, whichever holds the shared line metrics). While `annotations === null` the `ol` is not rendered.
   - A `li` for a step line shows: the kind as a left border in the kind colour (`KIND_CLASS`, every kind including `other`), a `step-started` and a `step-finished` element (same test ids as the run cell, read scoped inside the `li`; text `formatStepTime` and `finishedText`, an en dash for both when `run` has no times, none when `run === null`), and a `title` holding Waited and Blocked by (wording is the implementer's; it carries `formatWaitBreakdown` text). It carries `data-kind`; when `run` is set, `data-status`, `data-flagged="true"`, `data-long-wait="true"`, as the table's row does; `data-active="true"` while `run.runStep === activeStep`; `data-stale="true"` while `annotations.stale`. The warning background (flagged or long wait) and the stale opacity (0.5) are the same rules as the run cell, reused from `step-annotation.module.css`. Blank, comment, `start` and unparseable lines get an empty `li`.
   - Hover: pointer enter on a `li` whose annotation has a `run` calls `onActiveStepChange(run.runStep)`; pointer enter on a `li` with no `run` or no annotation calls `onActiveStepChange(null)`; pointer leave calls `onActiveStepChange(null)`.
   - Caret: on the textarea's `select`, `keyup` and `click` events, read the caret line from `selectionStart` (the 1-based line number of that offset in the text), and call `onActiveStepChange` with that line's `run.runStep`, or `null` for a non-step line, a line with no `run`, or when `annotations === null`. Textarea `blur` calls `onActiveStepChange(null)`.
   - Last event wins: no state in the editor remembers the caret line. With the caret on step line X, the pointer entering gutter line Y sets Y's step and leaving Y sets `null`; it does not return to X until the next caret event.
   - Legend: render `StepKindLegend` above the editor (above the textarea row, below the label) while `annotations !== null` and the live order has at least one step, the same rule as the table's. Only one editor view renders at a time, so `step-kind-legend` stays unique.
3. `pages/apps/aoe4-build-order.tsx`: pass the new props to `BuildTextEditor`: `annotations` (the page's memoized `BuildAnnotations`), `lines` from the live parse (`parsed.lines` when `parsed.ok`, else `parsed.partial.lines`, so parsed lines keep their annotations, dimmed, while the text has a syntax error), `activeStep` (the derived value from SGS-109) and `onActiveStepChange` (the same handler the table gets).
4. Docs, `docs/aoe4-build-order.md`: fix the page paragraph about the Text view (the sentence starting "the text view is a textarea with a line number beside each line"): after a result, each step line also shows an annotation (kind colour, started and finished times) beside its line number, in the same dimmed state as the step table; hovering a gutter line or putting the caret on a step line shades that step on the charts; the last of the two inputs wins. Also fix every sentence the change makes untrue (grep the doc for "gutter" and the text view). Describe behavior and rules only, no measured times.
5. Unit tests: `step-annotations.test.ts`, a table for `annotationsByLine`. Acceptance: new `acceptance/aoe4-compact-view.spec.ts`. Reuse `acceptance/helpers.ts` (`openPage`, `showView`, `SIMULATE_PATH`).

Existing tests: `aoe4-build-order.spec.ts` and `aoe4-build-order-inline-issues.spec.ts` read `build-order-line-number`; the new gutter must not change their numbers or alignment (the annotation column goes after the line numbers). Any other test that the new column breaks keeps its expected value; the implementer lists every test it edits.

**Out of scope:** collapsed table rows (dropped); any change to the step table, `StepRunCell` or the active-step derivation (SGS-108, SGS-109); the annotation model (SGS-107); a new 390 px check (owner direction); annotations against the pinned run; line-level edit handling beyond what `annotationsByLine` does.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `annotationsByLine` returns an array of length `lineCount` where index `stepLines[i] - 1` is `annotations.steps[i]` and every other index is `null`. A unit table pins: blank, comment, `start` and unparseable lines between steps map to `null`; a text with a trailing blank line has length `lineCount`; step lines `[2, 4]` of 5 lines give `[null, a0, null, a1, null]` (this fails an off-by-one that puts `a0` at index 2).
- [ ] After a run in the Text view, every step line's `build-order-line-annotation` shows `step-started` and `step-finished` text equal to the same step's `step-started` and `step-finished` in the table view for the same build, and its `data-kind` equals that table row's `data-kind` (acceptance, reading both views for one build).
- [ ] The `li`s for blank, comment and `start` lines contain no `step-started` and no `data-kind`.
- [ ] A step whose run is `not-reached` or `waiting` reads an en dash for both times, has `data-flagged="true"`, and its computed background differs from an unflagged step's, as in the table.
- [ ] The annotation `li`s align with the textarea's lines: for every line, the annotation `li`'s top equals the line-number `li`'s top, read in one `page.evaluate`.
- [ ] Before any result (`annotations === null`), `build-order-annotations` and `step-kind-legend` are absent (count 0). After a result, `step-kind-legend` is visible above the editor and there is exactly one in the page; switching to Table view still leaves exactly one.
- [ ] Stale dims them: with `page.route(SIMULATE_PATH)` holding the response after the first run, changing a step's text in the Text view gives the aligned steps' `li` `data-stale="true"` and computed opacity `0.5`, and the changed step's `li` has no `step-started`; releasing the route returns opacity to `1` and removes `data-stale`. Each test first asserts the API status it relies on.
- [ ] With a syntax error on one line, the other step lines keep their annotations (dimmed); the erroring line's `li` is empty.
- [ ] Pointer enter on an annotated step's `li` draws the shaded span on the charts (the same span the table row gives for that step) and sets `data-active="true"` on that `li`; pointer leave removes both. Enter on a not-reached step's `li` draws no band.
- [ ] Caret: with the textarea focused, clicking or moving the caret (`keyup`) onto a step line shades that step; moving it to a blank or comment line clears the shading; blurring the textarea clears it.
- [ ] Last event wins: with the caret on step line X, entering gutter line Y shades Y's step, and leaving Y clears the shading (no band for X), until the next caret event shades the caret's line again. The test must fail on an implementation that restores the caret's step on leave.
- [ ] The text view paragraph in `docs/aoe4-build-order.md` describes the gutter annotations, the hover and caret shading and the last-event-wins rule, and no sentence says the gutter holds only line numbers.
- [ ] No INVARIANTS.md regressions

## Open questions

none
