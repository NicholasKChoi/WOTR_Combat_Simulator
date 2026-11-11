# SGS-116: Label the run cell, stop waiting steps reading 0:00, and fix badge, select, border and editor-scroll readability

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M8 / M8.5
- **Priority**: medium
- **Risk**: low
- **Invariants**: none
- **LOC estimate**: 90 (`step-annotation.tsx` labels and `waitedText` use, `step-annotations.ts` `waitedText`, `build-text-editor.tsx` tooltip, `labelled: false` and `scrollLeft` reset, three small CSS rules; business logic only)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M8.md C12 and "Layout, legend and step table" rows (run cell, text gutter, editor), Criteria map M8.5; plan M8-20261110 outline E and its answered design question 2 (the gutter tooltip follows the still-waiting rule)

## Context

The step table's run cell shows three bare times, so a reader cannot tell started from finished from waited, and a step that has not started reads `0:00` waited, which looks like "did not wait". Badges wrap, the selects are capped narrower than their labels, the kind border disappears in the card layout under 768px, and choosing a build leaves the text editor scrolled sideways. Display only: the simulation's waits and the engine are unchanged.

## Scope

All under `components/apps/aoe4-build-order/` unless noted.

- **`step-annotations.ts`**: add `waitedText(run: Pick<StepRun, 'status' | 'waitSeconds'>): string` beside `finishedText`. It returns `'still waiting'` for status `waiting` and `not-reached`, else `formatMinSec(run.waitSeconds)`. It is the only place the rule lives.
- **`step-annotation.tsx`**:
  - `StepTimes` gains the required prop `labelled: boolean`. With `true` (the step-table run cell, via `StepRunCell`) the cell reads `Started <time>` and `Finished <time | ongoing>`; the label text sits outside the `step-started` / `step-finished` spans, so each span's text stays the bare value (existing specs read them). With `false` it renders only the values, as today.
  - In `StepRunCell` the `step-waited` element becomes a value span holding `waitedText(run)`, and the label `Waited` sits outside it. For `waiting` and `not-reached` the label is omitted and the value reads `still waiting`. `step-blocked-by` is unchanged.
- **`step-annotation.module.css`**: `.badge` gets `white-space: nowrap` (the table may scroll sideways inside `step-table-scroll` instead of wrapping a badge). Add a `tbody > tr > td.kindBorder` rule giving the kind border its `4px solid var(--kind-color, transparent)` again, because the `.table td { border: 0 }` card rule in `step-table.module.css` (under 768px) out-specifies `.kindBorder` and hides the border today.
- **`step-table.module.css`**: delete the `.table select { max-width: 7.5rem }` rule; no narrower cap replaces it. The card-layout `max-width: 100%` rule for selects stays. The selects are `w-auto`, so each is as wide as its longest option; at 1280 px the longest prebuilt table is then wider than the Build panel and scrolls sideways inside `step-table-scroll` (`.scroll { overflow-x: auto }`), as design/M8.md C12 allows. The row actions (move up, move down, delete) stay in the last column and are reached by scrolling that box; the panel itself does not scroll sideways. A narrower cap is rejected because any cap below the longest option truncates some selected name, which M8.5 forbids.
- **Layout acceptance case** "the longest prebuilt step table fits the Build panel and the editor is not clipped" (`acceptance/aoe4-step-annotations.spec.ts`): its delete check is measured against `step-table-scroll`, not against `panel-build` (see Acceptance criteria). `panelFits` and the text-view check stay as they are.
- **`build-text-editor.tsx`**:
  - The text gutter's `StepTimes` passes `labelled={false}`.
  - The gutter line's `title` follows the same rule: for `waiting` and `not-reached` it reads `Still waiting. Blocked by: <blockedBy, or "nothing" when empty>`; for every other status it stays `Waited <m:ss>. Blocked by: <blockedBy, or "nothing">`. No title reads `Waited 0:00` for a step that has not started. A step with no run still has no title.
  - The textarea's `scrollLeft` is set to 0 whenever `text` changes from anything other than the editor's own `onChange` (a build chosen in the select, a load, an edit made in the table view). Typing keeps the browser's caret scroll. How the editor tells its own `onChange` from other text changes (for example a ref flag set in `onChange` and cleared by the effect that resets `scrollLeft`) is the implementer's choice; the two acceptance cases below pin the behavior.
- **Tests** (every test the change makes untrue is edited; the implementer lists them): a test that renders `StepTimes` passes `labelled`; a test of the run cell's waited value reads the new markup.
- **Docs** (`docs/aoe4-build-order.md`, fixed in this ticket): the step-table run-cell paragraph (it lists the times and "the time it waited") now says the cell labels Started, Finished and Waited, and that a `waiting` or `not-reached` step reads `still waiting` instead of a time; the text-view gutter paragraph says the gutter shows unlabelled started and finished times and that hovering a `waiting` or `not-reached` annotation reads `Still waiting. Blocked by: ...`; the text-view paragraph that says a long line scrolls sideways adds that filling the text from the select, a load or the table starts it scrolled to the left; the narrow-layout paragraph says each step card keeps its kind border. No measured widths or timings go in the docs. The side-by-side layout sentence that a table that still cannot fit scrolls inside `step-table-scroll` and the Build panel never scrolls sideways stays true and is kept. The doc sentence that a step with kind Other has a border with no colour stays.

**Out of scope:** the Waited value for `completed` and `in-progress` steps (unchanged); `StepKindLegend` and kind colours; vitest `css` setting and class-name assertions in unit tests (those belong to the unit-test-debt ticket, so this ticket asserts visual state in Playwright with computed styles, not in unit tests); the Build order heading and `labelledBy` on the editor; the shared `holdNextSimulate` helper in `acceptance/helpers.ts`; any change to the simulator's `waitSeconds`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `waitedText` is exported from `step-annotations.ts`. `step-annotations.test.ts` has a table with one row for each of the four statuses (`completed`, `in-progress`, `waiting`, `not-reached`) with a non-zero `waitSeconds` (for example 75): `completed` and `in-progress` give `1:15`, `waiting` and `not-reached` give `still waiting`. It fails if the function formats the time for a waiting step, or returns `still waiting` for `in-progress`.
- [ ] `step-annotation.test.ts` pins the run cell markup: a `completed` run shows `Started`, `Finished` and `Waited` outside the value spans while `step-started`, `step-finished` and `step-waited` text stays the bare value (`1:05`, `2:05`, and the formatted wait); a `waiting` and a `not-reached` run give `step-waited` text `still waiting` and the cell markup contains no `Waited`. `StepTimes` with `labelled: false` renders neither `Started` nor `Finished`; with `labelled: true` both. The cases fail if `labelled` is ignored or the label is left on a waiting step.
- [ ] (respec 1) Acceptance, `acceptance/aoe4-step-annotations.spec.ts`, table view: for a `completed` step the run cell's text contains `Started`, `Finished` and `Waited`; for a `not-reached` step (extend the existing case "a not-reached step reads an en dash for its times and its cause, and its cell is tinted") `step-waited` reads `still waiting` and the cell's text does not contain `Waited`. The existing case that a completed no-wait step shows `formatMinSec(0)` in `step-waited` keeps passing.
- [ ] Acceptance, same spec, text view after a run: the `title` of the gutter annotation (`build-order-line-annotation`) of a `not-reached` step starts with `Still waiting. Blocked by: not reached (`; the title of a `completed` step that waited 0 s reads `Waited 0:00. Blocked by: nothing`; no gutter title starts with `Waited` for a `waiting` or `not-reached` step. The gutter annotations contain no `Started` or `Finished` text.
- [ ] (respec 1) Acceptance, same spec, at the split viewport (1280 wide) with the longest prebuilt build in the table view, one `page.evaluate` shows: no `step-kind-badge` wraps (every badge's height is under twice its own line height, and its computed `white-space` is `nowrap`), and each select in the step table is wide enough for its selected option's text (measured in the browser: the selected option's text width, taken from an off-screen span with the select's computed font, plus the select's computed horizontal padding and border and its arrow space, is at most the select's own width; include a select showing `Capital Town Center`). The check fails with the `nowrap` rule and the select cap restored.
- [ ] Acceptance, same spec, at 390 wide in the table view: every `step-run` cell of a kind other than `other` has a computed `border-left-width` of `4px` and the same `border-left-color` as that kind's legend item, as the existing 1280-wide colour case asserts.
- [ ] (respec 2) The existing layout case "the longest prebuilt step table fits the Build panel and the editor is not clipped" keeps `panelFits` (`panel-build` `scrollWidth <= clientWidth`) and its text-view check. Its `tableFits` assertion is dropped. `deletesInside` is measured against the scroll box: in one `page.evaluate`, `step-table-scroll` is scrolled fully right (`scrollLeft = scrollWidth - clientWidth`) and every `step-delete` rect then lies within the `step-table-scroll` rect (left and right edges), and `step-table-scroll` has computed `overflow-x: auto`. The case fails if `.scroll` loses `overflow-x: auto` (the table then overflows the panel, so `panelFits` fails) or if the actions column sits outside the scroll box.
- [ ] (respec 2) Acceptance, same spec, text view: with a text whose first line is longer than the box (so `scrollWidth > clientWidth`), the textarea scrolled right (`scrollLeft > 0`) and a different build chosen in the select, `scrollLeft` is 0 after the new text shows. A second case in the same spec: with the long line scrolled right, the caret placed by `setSelectionRange` at a character in the visible part of that line (from `scrollLeft + clientWidth / 2`), typing `y` inserts it into the line and leaves `scrollLeft` equal to its value before typing. Each case first asserts its precondition (`scrollWidth > clientWidth`, `scrollLeft > 0`). The second case fails if the reset runs on every text change; the first fails if it never runs for a programmatic change. Pressing `End` before typing is not used: Chromium re-scrolls to the caret after the input, so that variant passes even when the reset always runs.
- [ ] (respec 1) `git grep -n "Waited" -- components/apps/aoe4-build-order ':!*.test.ts' ':!*.test.tsx'` finds every match in `step-annotation.tsx` or `build-text-editor.tsx` (the run cell label and the gutter title); no other non-test source in the app formats the wait on its own. Test files are excluded because the unit tests above assert the `Waited` label.
- [ ] The docs paragraphs listed in Scope describe the labelled cell, `still waiting`, the gutter title text, the scroll reset and the narrow-layout border, and state no measured widths or timings.
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npm test` pass; the implementer lists every test it edited.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-10

- Underspecified: the `Waited` grep criterion covered the unit tests the ticket requires, so it could not hold in the end state; the select-width measurement and the not-reached acceptance case were loosely named.
- Changed: the grep excludes `*.test.ts` / `*.test.tsx` by pathspec; the select check includes padding, border and arrow space; the run-cell case extends the named existing not-reached test; Scope leaves the scroll-reset mechanism to the implementer.
- No branch work exists yet; nothing to keep or discard.

## Re-spec 2 - 2026-11-10

- Underspecified: with the select cap gone the table scrolls sideways inside `step-table-scroll` (design C12 allows it), so a delete check against the panel edge could not hold; the `End`-then-type case could not fail in Chromium.
- Changed: no replacement cap; `deletesInside` is measured against the scroll box scrolled fully right, `panelFits` stays; the typing case places the caret in the visible part of the line, types `y`, and asserts `scrollLeft` unchanged.
- Branch `sgs-116-step-table-readability` (22ba507) stands: all code, unit tests, docs and the typing case already match; only the layout case's `deletesInside` measurement needs changing.
