# SGS-110 spec gate 1

Verdict: NEEDS_SPEC (4 gaps, all fixable by the ticket agent; none needs the owner).

Read: SGS-110, SGS-107, SGS-108, SGS-109, design/M7.md, INVARIANTS.md, REPO.md, both LESSONS.md, and the code on
origin/main (`build-text-editor.tsx`, `workbench.module.css`, `text-lines.ts`, `parse-text.ts`, page, `acceptance/`).

## Cross-ticket check: what matches

- Names SGS-110 takes from SGS-107 (`StepAnnotation`, `BuildAnnotations`, `StepKind`, `finishedText`, `formatStepTime`,
  `formatWaitBreakdown`) exist exactly in SGS-107. `annotationsByLine` is correctly absent from SGS-107 (its Out of scope).
- From SGS-108: `KIND_CLASS`, `StepKindBadge`, `StepKindLegend` (`step-kind-legend`), the page's memoized `annotations` and
  `stale`, test ids `step-started`/`step-finished`, `data-kind/status/flagged/long-wait` all match. `StepKindLegend()` takes no props, so SGS-110's use is fine.
- From SGS-109: the page `active` state, derived `activeStep` (a `runStep`), `onActiveStepChange(runStep | null)`, and the
  `data-active` meaning match. `data-active` on the li (`run.runStep === activeStep`) is consistent with the row rule.
- `parsed.partial.lines` / `parsed.partial.order.steps` exist on origin/main (parse-text.ts), so the page wiring is grounded.
  `BuildOrderLines` (`lib/aoe4-build-order/model.ts`) has `steps: number[]`, so `annotationsByLine(annotations, lines.steps, n)` type-checks.
- No edit is owned by two tickets. `workbench.module.css`: SGS-108 removes the `overflow-x` rule, SGS-109 deletes the 1800 px block, SGS-110
  extends `.gutter, .textarea` (disjoint regions). Docs: SGS-108 (step table, dimming, side-by-side, backlog wording), SGS-109 (timeline, 1800 px,
  Narrow layout), SGS-110 (Text view sentence at docs line ~820). Spec files: SGS-108 renames to `aoe4-step-annotations.spec.ts`, SGS-110 adds `aoe4-compact-view.spec.ts`. No overlap.
- Risk `standard` is right (about 180 LOC, no `strongModelTriggers` item, no critical path). Open questions: none. On merge `none` is valid.
  Invariants A3 and S1 are listed and not contradicted. Dependencies are stated.

## Gaps

1. **Scope item 2 (warning background and stale opacity "reused from `step-annotation.module.css`") - the reuse mechanism does not exist in SGS-108.**
   SGS-108 puts the warning background and the 0.5 opacity on the `step-run` cell with no stated class name or export; the cell's only stated attribute is
   `data-stale` (the row, not the cell, carries `data-flagged`/`data-long-wait`). An implementer of SGS-110 would either guess class names from code that is not on
   `main`, or copy the rules (a second source of truth for the 0.5 value). Fix, in SGS-110 Scope: "Add to `step-annotation.tsx` (SGS-108's file, this ticket
   edits it) an exported `annotationToneClass(run: StepRun | null, stale: boolean): string` that returns the warning class when `run?.flagged || run?.longWait` and the stale
   class when `stale`, both from `step-annotation.module.css`; change `StepRunCell` to call it (a refactor with no behavior change, the SGS-108 unit table must still pass) and use it on the gutter `li`."
   Also state that the column rules (width, left border via `KIND_CLASS`, overflow) go in `workbench.module.css` next to `.gutter, .textarea`, not in either of the two files "whichever holds the shared line metrics" (it is `workbench.module.css`, which holds them today). Alternative fix: add that export to SGS-108's Scope instead; pick one owner. Note the "Out of scope: any change to `StepRunCell`" line then needs an exception for this refactor.

2. **Scope item 2 (Legend) and item 4 (Docs) - legend condition and doc coverage are underspecified.**
   (a) "the live order has at least one step": the editor gets `lines`, not the order. State the test: `lines.steps.length > 0`. Also say what happens with a syntax error: the legend stays while the partial parse has steps (the table's `step-table-unavailable` exception does not apply to the Text view).
   (b) The doc item names only the Text view sentence. The legend now also renders above the Text editor, and SGS-108/SGS-109 write that the legend is above the step table (kind colours "via the legend", a start-only paste shows no legend). Add to item 4: "state that the legend is also above the Text editor; reword any SGS-108/SGS-109 sentence that places the legend only above the step table (grep `legend`)", and add the legend to the docs acceptance criterion.

3. **Scope item 2, alignment criterion - the `li` box model is not stated, so the aligned-rows criterion can fail for reasons an implementer must guess.**
   An empty `li` (blank, comment, `start`, unparseable lines) has zero height unless given content or a `min-height`; a step `li` that wraps or whose times stack to two lines makes every later row drift (the textarea is `wrap="off"`, rows are exactly `1.5` line-height). Fix: add "each `li` is one line: `height`/`min-height` of `1.5em` (the same line-height), `white-space: nowrap`, `overflow: hidden`; the times sit on one line (`step-started` – `step-finished`); the column has a fixed width that leaves the textarea `min-width: 0`/flex 1 so the Build panel does not scroll sideways at 1280 px and the page does not at 390 px". SGS-108's 1280 px Text-view layout check (textarea right edge inside `panel-build`, after a run) now runs with this column and must keep passing; say so. The existing 390 px text-view test runs before any result (no annotations), so it will not catch a 390 px overflow; the owner said no new 390 check, so state the CSS rule instead.

4. **Scope item 5 / criteria 4 and 7 - no source for the not-reached/waiting build or the held-route helper after SGS-108 moves the spec.**
   SGS-108 renames `aoe4-build-order-timeline-compare.spec.ts` (the file that holds the `runWith` pastes yielding `not-reached` and long-wait steps) and moves shared helpers to `acceptance/helpers.ts` without naming them. SGS-110 says only "reuse `openPage`, `showView`, `SIMULATE_PATH`". The implementer would not know which paste gives `waiting`/`not-reached`. Fix: "`aoe4-compact-view.spec.ts` defines its own paste constants (a not-reached and a waiting step) at the 1200 s duration the other specs use and asserts the API status of each before relying on it; it edits no helper in `helpers.ts`." (If the owner prefers sharing, name the exact helper SGS-108 must export instead.)

## Notes (non-blocking)

- `BuildTextEditor` already has a local `const lines = lineCount(text)` (a number); the new prop `lines: BuildOrderLines` collides. Say to rename the local (for example `rowCount`).
- Name the chart ids SGS-109 defines in the criteria that mention "the shaded span": `chart-step-band` with `data-from`/`data-to`. Criterion 9 currently says only "the same span the table row gives".
- Duplicated markup: the gutter `li` renders `step-started`/`step-finished` text the run cell also renders; the repo runs `lint:dup` (jscpd threshold 0). Consider one shared `StepTimes` piece in `step-annotation.tsx` (fits the fix for gap 1) so the duplicate does not trip the check.
- Contracts: `annotationsByLine` and the new `BuildTextEditor` props appear only in the design's Criteria map and Behavior rules, not in the Contracts block or the Modules export list. The signature in the ticket matches the Behavior rule; add them to the design Contracts (or CONTEXT.md) when the design is next touched.
- The gutter `ol` is `aria-hidden`, so the `title` (Waited, Blocked by) is mouse-only; the table view carries the same text for keyboard and screen-reader users. Acceptable; no change needed.
- Criterion 10's caret events: "moving the caret (`keyup`)" is testable with `press('ArrowDown')`; state that the focused textarea is where the test starts, since `select` fires on `click` focus too.
