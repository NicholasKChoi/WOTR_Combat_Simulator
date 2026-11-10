# SGS-108 review 1

- Task: SGS-108 step run cell; charts dim on stale
- Branch: sgs-108-step-run-cell, tip d526ce3 (local only)
- Diff reviewed: adde412..d526ce3 (stacked on sgs-107-step-annotation-model)
- Verdict: **REQUEST CHANGES**

## Blocking findings

1. `docs/aoe4-build-order.md:1006-1007` - contract (text) - The sentence "`results-last-good` carries `aria-describedby="auto-run-status"` only while it is dimmed and the status text is not empty, so not during the 500 ms before the input settles." is contradicted by the code. `useAutoRun().input()` only restarts the debounce timer and leaves `status` unchanged, so during the 500 ms debounce the status is whatever it was. After an `invalid`, `rejected` or `failed` result, or for an edit made while `updating`, the status text is non-empty during the debounce, and `statusDescribesResults(stale, status, true)` is true, so the attribute is present. It is absent during the debounce only when the status was `current`, which has empty text. Why it matters: this is a doc claim the diff adds, and the code contradicts it. Direction: replace the clause after the comma with the following exact text: "so it is absent while an edit to a current result waits the 500 ms to settle." The full sentence then reads: "`results-last-good` carries `aria-describedby="auto-run-status"` only while it is dimmed and the status text is not empty, so it is absent while an edit to a current result waits the 500 ms to settle."

2. `components/apps/aoe4-build-order/step-annotation.test.ts:113-117,132` - test - The unit AC asks for two runs: one with `waitSeconds` 60 and `longWait: true`, and one with 59.9 and `longWait: false`. Only the first should set `data-long-wait`. The fixture has a 60 s long-wait run and a `run: null` row, but no 59.9 s run row. So the test named "puts a run cell first in each row and marks only the long wait" cannot tell `data-long-wait` keyed on `run.longWait` apart from `data-long-wait` keyed on the run merely being present. The second case would pass. Why it matters: the test name claims a check its assertions do not make, and an AC case is missing. Direction: add a third step line to the fixture text, for example `build house with 1 from sheep` again. Give it `{ kind: 'building', run: run({ runStep: 1, waitSeconds: 59.9, longWait: false }) }` and keep the `run: null` row. Assert that row has `data-run-step` and has no `data-long-wait`.

3. `components/apps/aoe4-build-order/step-annotation.test.ts:33-38` - test - The `annotationToneClass` AC says "the test first asserts the two keys are non-empty strings and differ". The test asserts `styles.warn` is non-empty but never asserts `styles.stale` is non-empty. If `.stale` were dropped from the module and resolved to `''`, the "stale only" rows would still pass, because both sides would be `''`. Why it matters: one of the breaks this AC is meant to catch, stale opacity going missing, is not pinned. Direction: add `expect(styles.stale).not.toBe('')` after line 36.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | data-kind on every row, started/finished vs API, one legend | pass | `aoe4-step-annotations.spec.ts` run-cell test cross-checks with `simulateOk`; the full acceptance suite passed (870/870). `StepKindLegend` default test id `step-kind-legend`; the timeline uses `step-timeline-legend`. |
| 2 | Kind colour on screen, badge absent for `other` | pass | Spec compares the `step-run` `border-left-color` with the legend item and asserts at least 2 distinct kinds. Measured at 1280: `4px rgb(25,135,84)` on a villager row. |
| 3 | not-reached en dash / blocked-by, waitSeconds 0 empty, long-wait ≥ 60 exactly, flagged background differs | pass | Spec asserts preconditions from the API. `tbody > tr > td.warn` (0,1,3) out-specifies Bootstrap's `.table > :not(caption) > * > *`. Spec passes. |
| 4 | Unit table (StepRunCell and StepTable) | **fail** | Blocking finding 2: the 59.9 s / `longWait:false` row is missing. The other cases are present: completed, in-progress `ongoing`, waiting suffix (with and without breakdown), not-reached, null, annotations null, and the start row's empty first cell. |
| 5 | Stale case 1 (delete row 0 while held) | pass | Spec present and passing; it asserts the different started texts and `data-run-step` first. |
| 6 | Stale case 2 (choose another build while held) | pass | Spec present and passing. |
| 7 | Stale case 3 (invalid unit) | pass | Spec present and passing. |
| 8 | Stale case 4 (release) | pass | Spec present and passing. |
| 9 | `annotationToneClass` unit table | **fail** | Blocking finding 3: `styles.stale` is never asserted non-empty. The 13 rows and the flagged-stale `StepRunCell` class check are present. |
| 10 | `StepTimes` exported and shared | pass | `StepRunCell` renders `<StepTimes run={run} />`. The unit parity case covers completed and in-progress. |
| 11 | `statusDescribesResults` unit table | pass | `auto-run-status.test.ts` uses a generated table over 7 statuses × hasResult × stale, plus the pinned rows. |
| 12 | `resultsStale` wiring | pass (weak) | Page passes `dimmed={stale}`. The spec polls opacity 0.5 then 1, and the same-build select does not dim. See note N3 on the aria assertion that cannot fail. |
| 13 | Layout at 1280 | pass | Spec passes. Independently measured on the dev server at 1280×800 with ENG 1TC: table 532 ≤ box 534, panel 534 ≤ 534, document not wider than the viewport. |
| 14 | No `workbenchSplit > :first-child` overflow rule | pass | `git grep` finds no rule. |
| 15 | Kind colours exist once, timeline ids kept, lint:dup clean | pass | `kindAgeUp` appears only in `step-annotation.*`. `results.module.css` has no kind, badge or legendRow rule. `npm run lint:dup` finds 0 clones. |
| 16 | Docs wording | **fail** | The old wordings are gone and times use `m:ss`, `ongoing` and an en dash. But the new aria-describedby sentence is false (blocking finding 1). |
| 17 | Existing specs, test suites | pass | `npm test`: 1970 passed, 10 skipped. `tsc --noEmit` clean. `npm run acceptance`: 870 passed, including the 390 px narrow checks. The timeline-compare to step-annotations rename was checked against `adde412:acceptance/aoe4-build-order-timeline-compare.spec.ts`. All 5 old cases survive (3 here, 2 in `aoe4-build-order-pin-compare.spec.ts`). The only assertion lost is the timeline-specific `not.toHaveClass(/table-warning/)`, which the computed background-colour check replaces. |
| 18 | No INVARIANTS.md regressions | pass | See below. |

## Invariants

The diff touches no `lib/`, API, `docs/api/openapi.json` or data file, so A1-A3 and S1-S3 hold. The page change only reads the result and parse state. Pinned runs never feed `buildAnnotations` (it reads `result`/`shown` only), which matches the ticket.

## Bot reconciliation

No review bot is configured (`reviewBot.cli` is empty).

## Lint

`npx tsc --noEmit` is clean. `npm run lint:dup` finds 0 clones.

## Non-blocking notes

- N1 `components/apps/aoe4-build-order/step-table.module.css:36` - Under 768 px, `.table td { border: 0 }` (0,1,1) removes the run cell's `.kindBorder`. The measured `border-left-width` is `0px` at 360, 390 and 700. So the docs sentence at `docs/aoe4-build-order.md:936`, "The cell has a left border in the step's kind colour", is false on narrow screens. The badge still carries the colour, and narrow screens are out of scope for M7 per the owner. Optional fix: select the border as `tbody > tr > td.kindBorder` so it survives the narrow reset.
- N2 Kind badges wrap mid-word in the split layout at 1280 ("Villag/er", "Buildi/ng") because the run cell is narrow (`min-width: 4rem`). Visible in the screenshot. `white-space: nowrap` on `.badge` would fix it, but the table has only 2 px to spare (532/534). Re-measure if changed.
- N3 `acceptance/aoe4-step-annotations.spec.ts` wiring test: the `not.toHaveAttribute('aria-describedby')` check runs after the opacity returns to 1, so it cannot fail. The same-build check is a one-shot read; consider `expect.poll` over a short window, or an assertion that the status stays `current`.
- N4 `acceptance/aoe4-step-annotations.spec.ts` layout test: after choosing the longest build it waits for status `current`, which may already hold before the new run starts. It then asserts that a `step-run` exists, but not that times are shown. Wait for `step-started` to be visible so the test always measures the widest table.
- N5 The local `holdSimulate` in `aoe4-step-annotations.spec.ts` is byte-identical to `holdNextSimulate` in `acceptance/aoe4-auto-run-contract.spec.ts:12-21`, and similar to `aoe4-build-order-pin-compare.spec.ts:34-42`. Move it to `acceptance/helpers.ts`.
- N6 `.table select { max-width: 7.5rem }` applies at all widths of 768 px and up, so long values truncate, for example "Capital Tow…" at 1280. This is acceptable given the fit requirement. Note that it also applies in the 768-1279 px tabs layout, where there is room.
- N7 The docs sentence that choosing another build "leaves no step any times" could add "until its result lands".
- N8 `Results describedByStatus={statusDescribesResults(stale, status, true)}` passes `hasResult` as a literal. This is fine, because `Results` renders only when `result !== null`.

## Coverage

- Files reviewed (the whole diff):
  - `components/apps/aoe4-build-order/step-annotation.tsx`, `.module.css` and `.test.ts`
  - `step-table.tsx` and `step-table.module.css`
  - `step-timeline.tsx`, `results.tsx` and `results.module.css`
  - `auto-run-status.ts` and its test
  - `workbench.module.css`
  - `pages/apps/aoe4-build-order.tsx`
  - `acceptance/aoe4-step-annotations.spec.ts`, `aoe4-build-order-pin-compare.spec.ts`, and the other edited specs
  - `docs/aoe4-build-order.md`
- Commands run in the review worktree:
  - `tsc --noEmit`
  - `npm run lint:dup`
  - `npm test`
  - `npm run acceptance` (870 passed)
- REPO.md review checklist:
  - Every diff: the page loads under `next dev` and renders the run cells.
  - AoE4 build order section: screenshots and layout metrics at 360×760, 390, 700, 768, 1024 and 1280. No document overflow at any width. Table fits its box at 768 and up; at 1280 it is 532 of 534 px.
- `npx next build` was not run separately. The acceptance suite's web server and `tsc` cover compilation.
- The repo has no REVIEW.md.
