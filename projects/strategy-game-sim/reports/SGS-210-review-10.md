# SGS-210 review 10

Verdict: **APPROVE**
Branch: sgs-210-annotations-group-repeated-step-copies, tip d6545499c02fa84014ddbe328d709871d6a2095f, base origin/main. Full review as requested, plus a check of the Rework 1 Required fixes from review 8 (bounced tip 0f45468).

## Blocking findings

None.

## Rework 1 Required fixes (review 8)

- Test fix landed: **yes**. `step-annotations.test.ts` "gives a repeated source copies equal to its copy count and a run equal to the combined run" now uses its own timings: copy 1 1..6, copy 2 11..15, source 1 21..25. It goes through the identity path and asserts `copies` has length 2 and `run` matches `{ runStep: 0, startedAt: 1, completedAt: 15 }`. I mutation-checked it myself at `step-annotations.ts:231`, then reverted:
  - `combineRuns(copies)` -> `copies[0]` fails the test (`completedAt` 6, expected 15).
  - `combineRuns(copies)` -> `copies[copies.length - 1]` fails the test (`runStep` 1 and `startedAt` 11, expected 0 and 1).
- `docs/aoe4-build-order-ui.md:106` landed verbatim. I checked it against the code:
  - all copies completed gives the max `completedAt`;
  - a combined `in-progress` (no copy waiting or not reached) reads `ongoing` through `finishedText`;
  - any waiting or not-reached copy makes the status waiting or not-reached, so `completedAt` is null and the cell shows an en dash.
- `docs/aoe4-build-order-ui.md:211` landed verbatim. It matches `sourceSpan` (step-annotations.ts:152-158): every started copy's `stepSpan` is unioned whatever the combined status, and the result is null when no copy started.
- The delta (`git diff 0f45468..HEAD`) touches only those two files.

## Spec gaps

None.

## Acceptance criteria

- combineRuns table: **pass**.
  - One copy returns the same object (`toBe`).
  - The all-completed row checks first start, latest finish, summed waits, null cause and `blockedBy`.
  - The in-progress row checks a null finish.
  - The status table has not-reached both first and last, so taking the first or the last copy fails a row.
  - Merged waits are checked in first-seen order.
  - The summed `longWait` uses 30+30 = 60, so `>` instead of `>=` fails it.
- Planner row 7: **pass**. "selects the not-reached copy cause over an earlier waiting copy":
  - `not-reached`, `earlier-step`, `null`;
  - waits `[{50 wood, 23}]`;
  - `blockedBy` ends `not reached (earlier-step)` with no `still waiting`;
  - copy 2 keeps `waiting` and its still-waiting-for-wood text.
- Planner row 6: **pass**. The waiting, not-reached and completed table, plus "leaves a single copy blockedBy as it was".
- sourceSpan: **pass**.
  - An unrepeated step equals `stepSpan`.
  - The span covers every started copy for runStep 0 and for runStep 1, so a span of only the copy at `runStep` fails.
  - An in-progress copy ends the span at the run end.
  - An unstarted trailing copy and other sources are ignored.
  - No started copy, and out-of-range 5 and -1, give null.
- groupBySource: **pass**. The input is out of copy order and interleaved across sources; an unrepeated order gives `[1, 1, 1]`.
- Alignment with a repeated source: **pass**.
  - The `alignSteps` path gives `[0, 2]`.
  - A changed line gets `run: null, copies: []`.
  - The source count is compared, not `steps.length`; the precondition that the two differ is asserted, and the mutation would align the first two steps.
- Identity path: **pass**. Live step 1 has `runStep` 2.
- buildAnnotations: **pass**. The test fixed in Rework 1 is verified by mutation (above). The existing unrepeated assertions are unchanged; the only edits to existing tests add `copies`.
- copiesDetailText: **pass**. Covers 0 and 1 copies, numbered lines, and still waiting for waiting and not-reached copies.
- StepRunCell markup: **pass**.
  - The copy count reads `1 of 2 done` and `2 of 2 done`.
  - One closed `details` with summary `Each copy`.
  - Items are `[1, completed]` and `[2, in-progress]`.
  - Each combined test id appears exactly once.
  - One copy shows no line and no list.
- Gutter text: **pass**. Covers the empty case, unrepeated equal to the detail alone (a `>= 1` threshold would add `\n` and fail), and repeated equal to the detail plus `\n` plus the copy lines.
- Popover lines: **pass**. Asserts the exact markup `<div>first</div><div>second</div><div>third</div>` and the single-line `<div>only line</div>`.
- Existing acceptance specs pass unchanged: **unverified** (review runs no acceptance specs). The diff touches no `acceptance/` file, so their assertions are unchanged.
- UI doc: **pass**.
  - The gutter/popover paragraph, the run-cell paragraph and the hover paragraph describe the combined run, the copy list and the one span.
  - Line 107 says steps line up "by submitted step, not by result entry".
  - No sentence says an annotation is one `result.steps` entry.
- `npx tsc --noEmit`, `npm test`, `npm run lint:dup`: **pass**. I ran all three in the scratch: tsc clean, 0 clones, and 94 files / 3025 tests passed (1 file and 15 tests skipped).
- No INVARIANTS.md regressions: **pass** (below).

## Invariants touched

- A3 (same order and data give the same timings): holds.
  - `groupBySource`, `combineRuns`, `sourceSpan`, `copiesDetailText` and `gutterDetailText` are pure.
  - `groupBySource` sorts only the arrays it creates, so `result.steps` is not mutated.
  - `mergeWaits` relies on `Map` insertion order, which is guaranteed.
  - No randomness, no clock.
- A1 and A2: not touched; no simulation code changes.
- S1: no cross-app import.

## Spec checklist

- Contracts: the names match design/M12.md C5 and C6 (`groupBySource`, `combineRuns`, `sourceSpan`, `copiesDetailText`, `StepAnnotation.copies`, and the test ids `step-copies`, `step-copy-list`, `step-copy`). `gutterDetailText` and `PopoverLines` are the local helpers the ticket allows. No API surface changes.
- Scope: no change to `parse-text.ts`, the Repeat table field, the simulator, the schema, OpenAPI or `golang/`.
- No invented constant: `LONG_WAIT_SECONDS` is reused.
- Naming: fine.
- A1–A3: holds.

## Linter

`npx tsc --noEmit` is clean and `npm run lint:dup` finds 0 clones. No findings.

## Review bot

No `reviewBot.cli` and no `rulesFile`, so this section was skipped. Bot reconciliation: none.

## UI inspection

- I served the task checkout with `npx next dev` on port 3877. `inspect.cjs` routed `/api/aoe4-build-order/simulate` and rewrote each real response so the page renders repeated rows:
  - source 0: copy 2 duplicates copy 1, shifted 20 s;
  - source 1: copy 2 `waiting`;
  - steps are renumbered.
- The page cannot type `xN` until SGS-211, so this was the only way to put the repeated states on screen. The live text equals the shown text, so the identity path runs.
- Widths: 1200, 1280 and 1800 (repo checklist), and 375 as a screenshot only, since it is below the page minimum.
- Results at each of 1200, 1280 and 1800:
  - No page errors and no horizontal overflow.
  - The `step-copies` texts read `0 of 2 done` and `1 of 2 done`.
  - Both `step-copy-list` start closed. Focusing the summary and pressing Enter opens one, which confirms the ticket's unverified `<details>` assumption.
  - The `step-copy` items are display block, with the right `data-copy` and `data-status`.
  - The gutter popover for the repeated completed/in-progress line renders 3 block `DIV`s: the combined detail, `Copy 1: ...` and `Copy 2: ...`. The repeated waiting line renders `Still waiting. Blocked by: 1 more villager at gold 0:10, still waiting on resources`, then `Copy 1: started 0:25, finished 0:45, waited 0:05` and `Copy 2: started –, finished –, still waiting`.
  - The popover box stays inside the viewport.
  - Clipped-overflow, copy-item overlap and mid-word-break checks found nothing, with the lists closed, with them open, and with the popover open.
- Screenshots read: w1200-table-closed, w1280-table-open and w1280-popover-repeated-waiting. The combined cell, copy count, closed list and warning tint on the waiting row render correctly; the open list reads one line per copy plus `Blocked by:`; the popover shows three separate lines.
- The server was stopped (`serve.sh status 3877`: port free).

## Conventions

- `StepCopies` follows `StepRunCell` and `StepTimes` in the same file (step-annotation.tsx:44-66): bare `data-testid` divs and module classes via `cn`. No Bootstrap utilities are mixed with module CSS.
- `PopoverLines` sits beside `AnnotationPopover` (annotation-popover.tsx:27).
- The tests follow the file's `timing(...)` builder and `it.each` tables (step-annotations.test.ts:29 and :81, step-annotation.test.ts:12 and :42). The new `annotation-popover.test.ts` uses the `renderToStaticMarkup` style of step-annotation.test.ts:29.
- No `lib/aoe4-build-order/` helper or constant is copied. `formatMinSec`, `waitDetailText` and `LONG_WAIT_SECONDS` are imported or reused, and `causeText` and `waitListText` are shared between `blockedByText` and `combineRuns`.

## Correctness

- `combineRuns` checks:
  - status is the minimum by `ADVANCE`;
  - `completedAt` is set only when the status is completed;
  - the cause is the first copy, in copy order, with the combined status;
  - `longWait` uses `>=`;
  - `flagged` is right;
  - no inversions.
- `groupBySource` is safe: the schema bounds `repeat` to at least 1 (schema.ts:43), and `expandRepeats` gives every source at least one copy, so `groups` has no holes and `groups.length` is the source count.
- `sourceSpan` returns null for an out-of-range `activeStep`, where `stepSpan(result.steps[activeStep])` would have thrown on `undefined`. No regression.
- `build-text-editor.tsx:51`: `annotation !== null` is redundant at runtime but narrows the type. Hover and caret use `run.runStep`, which is copy 1's index, and `results.tsx` maps it back to the source through `steps[runStep].source`.
- `AnnotationPopover` still re-places itself on a `text` change (effect deps `[anchor, text]`).
- No swallowed errors, leaks or races; the components are pure render.

## Review checklist (REPO.md)

- Every diff: `npx next build` succeeds in the scratch. The page loaded through `next dev` (UI inspection above).
- AoE4 build order:
  - no copied helpers;
  - no engine rule changes, so `docs/aoe4-build-order.md` is unaffected;
  - the UI doc sentences match the code;
  - screenshots at 1200, 1280 and 1800 were taken and read;
  - no Bootstrap utilities are mixed with module CSS;
  - no template-literal classNames.

## Non-blocking notes

- The run cell column is narrow, so an open `Each copy` list wraps each copy line over 4–5 lines (w1280-table-open). No word breaks mid-word and nothing clips; the column width predates this change.
- From review 8, still open:
  - The test "shows each copy times and blocked-by without reusing the combined ids" asserts only copy 2's text line.
  - `expect(half.longWait).toBe(false)` restates a fixture default.
- The Rework 1 test spells out the identity-path `shown` and `live` inline instead of reusing the describe's `input` helper, because that helper closes over the shared `steps`. This is fine for one test.
- `page-help.tsx` is unchanged and still true. Its "Blocked by lists each wait..." wording holds for a combined row.

## Coverage

- Reviewed every file in the diff:
  - step-annotations.ts and its test;
  - step-annotation.tsx and its test;
  - annotation-popover.tsx and the new annotation-popover.test.ts;
  - build-text-editor.tsx and results.tsx;
  - step-annotation.module.css;
  - docs/aoe4-build-order-ui.md.
- Also read:
  - page-help.tsx;
  - workbench.module.css (`.annotationPopover`);
  - lib/aoe4-build-order/repeat.ts;
  - the schema `repeat` bound;
  - design/M12.md C5, C6 and "Repeat: page";
  - INVARIANTS.md, spec-checklist.md, LESSONS.md and REPO.md.
- Not run: the acceptance specs (by role). No REVIEW.md exists in the repo.
