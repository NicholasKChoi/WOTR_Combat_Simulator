# SGS-210 review 8

Verdict: **REQUEST CHANGES**
Branch: sgs-210-annotations-group-repeated-step-copies, tip 0f454682185f4b4baaab5430e29344eef3ad5e67, base origin/main (full review, not delta).

## Blocking findings

1. `components/apps/aoe4-build-order/step-annotations.test.ts:550` - test - The test "gives a repeated source copies equal to its copy count and a run equal to the combined run" asserts neither of the two things its name claims. It never checks `copies.length`. Its run assertion cannot tell the combined run from copy 1: the `alignment with a repeated source` fixture (line 517) gives both copies of source 0 the defaults `completedAt: 5`, `waitSeconds: 0` and no waits, so `combineRuns(copies)` deep-equals `copies[0]`. `completedAt` is 5 on every copy, so `expect(first?.run?.completedAt).toBe(5)` cannot fail either. I checked this: with `step-annotations.ts:231` changed from `combineRuns(copies)` to `copies[0]`, the test still passes (the row-7 and blockedBy tests are the ones that fail). Why it matters: the test claims to cover the `buildAnnotations` criterion and covers nothing. Direction: give this test its own timings in which the combined run differs from every single copy. For example `[copyTiming(0, 0, 1, { startedAt: 1, completedAt: 6 }), copyTiming(1, 0, 2, { startedAt: 11, completedAt: 15 }), copyTiming(2, 1, 1, { startedAt: 21, completedAt: 25 })]`, passed as the second argument of `runInput` with the identity-path `live`. Then assert `first.copies` has length 2 and `first.run` matches `{ runStep: 0, startedAt: 1, completedAt: 15 }`. Break to check: `step-annotations.ts:231` `combineRuns(copies)` -> `copies[0]` gives `completedAt` 6 instead of 15, and `copies[copies.length - 1]` gives `runStep` 1 and `startedAt` 11 instead of 0 and 1. Precondition: the copies' `completedAt` differ (6 vs 15), so taking one copy moves the value.

2. `docs/aoe4-build-order-ui.md:106` - contract (text) - The new run-cell sentence says Finished is "`ongoing` while any copy is in progress, an en dash while a copy has not finished". The code (`combineRuns` sets `completedAt` only when the combined status is `completed`; `finishedText` reads `ongoing` only for status `in-progress`) shows an en dash whenever any copy is `waiting` or `not-reached`, even while another copy is in progress. For example, copies `[in-progress, not-reached]` combine to `not-reached` and read `–`, not `ongoing`. Why it matters: a doc sentence the diff adds that the code contradicts. Replace
   "Finished the last copy's finish (`ongoing` while any copy is in progress, an en dash while a copy has not finished)"
   with
   "Finished the last copy's finish once every copy has finished (`ongoing` while a copy is in progress and no copy is waiting or not reached, an en dash while any copy is waiting or not reached)".
   Facts kept: Finished is the last copy's finish, it reads `ongoing` in the in-progress case, and it reads an en dash in the unfinished case.

3. `docs/aoe4-build-order-ui.md:211` - contract (text) - In the hover paragraph the diff edited, the sentence still ends "and a waiting or not-reached step, or a row with no run times, shows no band". For a repeated row whose combined status is `waiting` or `not-reached`, `sourceSpan` (step-annotations.ts:152-158) still shades the span of every copy that started. For example, copy 1 completed 0:10-0:20 and copy 2 waiting give a combined `waiting` row that shades 0:10-0:20. The `sourceSpan` test "ignores an unstarted trailing copy and other sources" pins this behavior. Why it matters: the edited sentence says that row shows no band, and it does show one. Replace
   "(a repeated step shades one span from the first copy's Started to the last started copy's Finished, covering the gaps between copies; a copy that has not started adds nothing); an in-progress step's span runs to the end of the run, a step that starts and finishes in the same second shows as one vertical line, and a waiting or not-reached step, or a row with no run times, shows no band."
   with
   "(a repeated step shades one span from the first copy's Started to the last started copy's Finished, covering the gaps between copies; a copy that has not started adds nothing, and the span shows once any copy has started, even while the row reads waiting or not reached); an in-progress step's span runs to the end of the run, a step that starts and finishes in the same second shows as one vertical line, and a waiting or not-reached step none of whose copies has started, or a row with no run times, shows no band."
   Facts kept: the repeated span runs from the first copy's Started to the last started copy's Finished, covers the gaps, and ignores unstarted copies; an in-progress span runs to the end of the run; a same-second step is one vertical line; an unstarted waiting or not-reached step, and a row with no times, shows no band.

## Spec gaps

None.

## Acceptance criteria

- combineRuns table (one copy returns the same run; all completed; one in-progress; last not-reached; waits merged; summed longWait; least advanced, not first or last): **pass**. Tests at step-annotations.test.ts `combineRuns` describe. The status table has rows with not-reached first and with not-reached last, so taking either the first or the last copy fails a row.
- Planner row 7 (respec 2): **pass**. "selects the not-reached copy cause over an earlier waiting copy" asserts `not-reached`/`earlier-step`/`null`, waits `[{50 wood, 23}]`, `blockedBy` ending `not reached (earlier-step)` with no `still waiting`, and copy 2 keeping `waiting` and `50 wood 0:20, still waiting for 50 wood`.
- Planner row 6 (blockedBy for waiting / not-reached / completed; single copy unchanged): **pass**. The `words blockedBy ...` table and "leaves a single copy blockedBy as it was".
- sourceSpan: **pass**. Covered: equals `stepSpan` unrepeated, spans every started copy whichever runStep is named, ends at the run end for an in-progress copy, ignores an unstarted copy and other sources, null when none started, null when out of range (5 and -1).
- groupBySource: **pass**. The input is out of copy order and the steps interleave across sources.
- Alignment with a repeated source: **pass**. Covered: two live steps align through `alignSteps`, a changed line gets `run: null, copies: []` while the others keep theirs, and the shown step count is compared with the source count (asserted against `steps.length` first).
- Identity path (row 5): **pass**. Live step 1 has `runStep` 2, not 1.
- buildAnnotations (copies.length = copy count, run = combined run, unrepeated unchanged): **pass**, on other tests (the identity test asserts `copies.length` `[2, 1]`; the row-7 and blockedBy tests fail when `run` is `copies[0]`; the existing assertions are unchanged). The test named for this criterion cannot fail (finding 1).
- copiesDetailText: **pass**.
- StepRunCell markup: **pass**. Covered: `1 of 2 done` / `2 of 2 done`, a closed `details` with summary `Each copy`, `step-copy` items `[1, completed]` and `[2, in-progress]`, each combined test id appearing once, and no copy line or list for one copy.
- Gutter text (respec 1): **pass**. Three tests; the unrepeated case passes `copies: [one]`, so a `>= 1` threshold fails it.
- Popover lines (respec 1): **pass**. Asserts the exact markup `<div>first</div><div>second</div><div>third</div>`; a single text node fails it.
- Existing acceptance specs pass unchanged: **unverified**. Review runs no acceptance specs; the diff edits no spec file (`git diff --stat` shows no `acceptance/` path), so those assertions are unchanged.
- UI doc describes the combined run, copy list and one span, and no statement says an annotation is one `result.steps` entry: **fail**, until findings 2 and 3 land. The topics are covered, and line 107 now says steps line up "by submitted step, not by result entry". Two of the new sentences are inaccurate.
- `npx tsc --noEmit`, `npm test`, `npm run lint:dup`: **pass**. I ran tsc (clean), lint:dup (0 clones) and vitest on `components/apps/aoe4-build-order` (35 files, 998 tests passed). The implementer reports the full `npm test` passing.
- No INVARIANTS.md regressions: **pass** (below).

## Invariants touched

- A3 (same build order and data, same timings): holds. `groupBySource`, `combineRuns` and `sourceSpan` are pure. `groupBySource` sorts fresh arrays it creates, so `result.steps` is not mutated. `mergeWaits` uses a `Map`, whose insertion order is guaranteed, for first-seen order. Nothing uses randomness or time.
- A1, A2: not touched (no simulation code changes).
- S1: no import from another app.

## Spec checklist

- Contracts: the names `groupBySource`, `combineRuns`, `sourceSpan`, `copiesDetailText` and `StepAnnotation.copies` match design/M12.md C5. The test ids match C6. `gutterDetailText` and `copyLineText` are local helpers the ticket allows. No API surface changes.
- Scope: no `parse-text.ts`, table field, simulator, schema or OpenAPI change; no `golang/`.
- No invented constant: `LONG_WAIT_SECONDS` is reused.
- A3: holds (above).

## Linter

`npx tsc --noEmit` clean; `npm run lint:dup` 0 clones. No findings.

## Review bot

No `reviewBot.cli` and no `rulesFile`; skipped.

## UI inspection

- Served the task checkout with `npx next dev`. A script in the scratch loaded `/apps/aoe4-build-order` at 1200, 1280 and 1800 px wide (the widths from the repo checklist), switched to the Text view, and hovered the first run line (in-progress) and the first not-reached line (line 43) to open the popover.
- Results at every width:
  - The popover renders one `DIV` (display block) holding the unchanged text (`Waited 0:00. Blocked by: nothing`, `Still waiting. Blocked by: not reached (trigger)`).
  - The popover stays inside the viewport. Nothing overflows the popover box, no word breaks mid-word, and the page has no horizontal overflow.
  - I read the 1280 not-reached screenshot; it matches the previous rendering.
- Not shown on screen: the repeated-step states (copy line, copy list, multi-line popover, combined span). On main the page cannot produce a repeat until SGS-211, so these were judged from code and static-markup tests. The `.copyList` and `.copy` CSS only adds margins and a pointer cursor, with no Bootstrap utilities mixed in.
- The server was stopped (port 3871 free).

## Conventions

- `StepCopies` follows `StepRunCell`/`StepTimes` in the same file (step-annotation.tsx:47-66): bare `data-testid` divs and `cn`/module classes.
- The new tests follow the file's `timing(...)` builder and `it.each` tables (step-annotations.test.ts:29, step-annotation.test.ts:12, 41).
- `stepRunOf` in step-annotations.test.ts:302 duplicates `run()` in step-annotation.test.ts:12, but they are separate test files and lint:dup reports no clone. Non-blocking.
- `blockedByText` now builds on `causeText`/`waitListText`, which `combineRuns` shares, so one copy and a combination word the cause the same way (as the ticket asks).

## Correctness

- `combineRuns` checks:
  - Status takes the minimum by `ADVANCE`.
  - `completedAt` is set only when the status is `completed`.
  - The cause is the first copy (in copy order) whose status equals the combined status.
  - `longWait` uses `>=`, matching `LONG_WAIT_SECONDS` semantics elsewhere.
  - `flagged` is right.
  - No inversions found.
- `alignedRuns` identity path: `liveSteps.map((_, i) => i)` indexes groups. An index past the group count reads `undefined` and gives `run: null, copies: []`.
- `build-text-editor.tsx:51`: `annotation !== null && run !== null` is redundant at runtime but narrows the type for `gutterDetailText`. Fine.
- `results.tsx:42`: `sourceSpan` returns null for an out-of-range `activeStep`, as `stepSpan(undefined...)` did not need to. No regression.

## Review checklist (REPO.md)

- Every diff: `npx next build` succeeds in the scratch. The page was loaded through `next dev` (UI inspection above).
- AoE4 build order:
  - No helper or constant is copied from another `lib/aoe4-build-order/` module (`formatMinSec` and `LONG_WAIT_SECONDS` are imported or reused).
  - No engine rule changes, so `docs/aoe4-build-order.md` is unaffected.
  - The UI doc has the two text findings above.
  - Screenshots at 1200/1280/1800 are covered above.
  - No Bootstrap utilities are mixed with module CSS.
  - No conditional classNames by template literal.

## Bot reconciliation

No bot configured.

## Non-blocking notes

- step-annotation.test.ts "shows each copy times and blocked-by without reusing the combined ids" asserts only copy 2's line. Copy 1's line is not checked, so a break that drops the first copy's text line but keeps its `step-copy` element would pass this test. The items test still counts both elements.
- `expect(half.longWait).toBe(false)` (step-annotations.test.ts, longWait test) restates the `stepRunOf` default. It is a harmless precondition, and the two `combineRuns` assertions after it do the work.

## Coverage

- Reviewed every file in the diff: step-annotations.ts, step-annotation.tsx, annotation-popover.tsx, build-text-editor.tsx, results.tsx, step-annotation.module.css, docs/aoe4-build-order-ui.md, and the three test files.
- Also read page-help.tsx (still true; unchanged) and design/M12.md C5/C6.
- Mutation-checked one break myself (`run = copies[0]`, then reverted).
- Not run: the acceptance specs (by role).
- No REVIEW.md in the repo.
- The scratch's inspection script and screenshots were removed after the run with a glob `rm` inside the scratch. The screenshots are not retained.
