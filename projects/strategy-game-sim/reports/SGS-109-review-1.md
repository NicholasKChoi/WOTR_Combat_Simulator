# SGS-109 review 1

- Branch `sgs-109-row-hover-drop-timeline` at 1469a85, reviewed as `5bda0f7..1469a85` (stacked on `sgs-108-step-run-cell`).
- Verdict: **REQUEST CHANGES** (three small blocking findings: one test gap, one doc gap, one stale test title).

## Blocking findings

1. `acceptance/aoe4-build-order-step-band.spec.ts:144` - test - "the start row clears the band, for hover and for focus" cannot fail for the break its criterion names ("the start row's enter and focus handlers missing"). It hovers row then start row (pointer leave on the row already clears) and focuses a row control then a start-row control (row blur with an outside `relatedTarget` already clears). So the start row's `onPointerEnter`/`onFocus` (`step-table.tsx:451`) are untested. They do matter: when the band comes from one input type and the start row is entered with the other, nothing else clears it. I checked this. A scratch spec with (a) focus `step-delete` of a completed row, pointer at (0,0), then `step-start-row.hover()` and (b) hover a completed row, then focus the first start-row control, passes on 1469a85. Both cases fail (`Expected: 0, Received: 4` bands) once the two start-row handlers are removed. Direction: make the test use mixed input. For hover, set the band by focusing `step-delete` in the completed row and keep the pointer away, then hover `step-start-row`. For focus, set the band by hovering the completed row and leave the pointer there, then focus a start-row control. Assert zero `chart-step-band` and zero `[data-active="true"]` after each. The implementer's flag is a real gap. The handlers are not redundant and should stay.

2. `docs/aoe4-build-order.md:943` - contract (text) - The ticket says to move anything the deleted timeline paragraph stated that the step-table paragraph did not already state. Two rules were dropped instead. (a) How a step's kind is chosen: landmark build is Age up, other build is Building, produce of a villager is Villager, produce of any other unit is Military, move/rally/pause is Economy. The step-table paragraph names the kinds but not the rule. (b) The Blocked-by format and order. The code has both: `stepKind` in `components/apps/aoe4-build-order/step-annotations.ts:73-86`, and `BREAKDOWN_ORDER` and `formatWaitBreakdown` in the same file at lines 8 and 16-17. Direction (text), replace verbatim:
   - Replace "A step that waited on\nresources, villagers, population or a prerequisite lists each cause with its time;" with "A step that waited on\nresources, villagers, population or a prerequisite lists each cause with a non-zero time as `<cause> <m:ss>`, in that order, joined with `, `;"
   - Replace "The kind comes from the step alone, so a landmark of a later age than the current one still reads Age up;" with "The kind comes from the step alone: a `build` of a landmark is Age up (so a landmark of a later age than the current one still reads Age up), any other `build` is Building, a `research` is Research, a `produce` of a villager is Villager and of any other unit is Military, and a `move`, `rally` or `pause` is Economy;"

3. `acceptance/aoe4-build-order-step-band.spec.ts:212` - test (text) - The title "the hovered row looks active, on an unflagged row and on a flagged row that table-warning tints" now names a class that step rows no longer use. The flagged tint is `.warn` on the run cell (`step-annotation.module.css`), and the test asserts only `data-flagged="true"`. The diff moved this test onto `step-row`, which made the title false. Direction (text): retitle to "the hovered row looks active, on an unflagged row and on a flagged row".

## Spec gaps

None.

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Wiring and removal grep (respec 1) | pass | The ticket's grep over `components pages docs acceptance` matches only `acceptance/aoe4-results-split.spec.ts:4` (`REMOVED_TIMELINE_IDS`). No `--run-bar-height`, `ResizeObserver`, `formRef` or `runBar` ref under pages/components (`.runBar` CSS class remains, unrelated). `StepKindLegend` has no `testId` prop. |
| `ResultsProps` no `text`/`landmarks`; charts direct children; no `results-split` | pass | `results.tsx:12-20, 28-86`. |
| hover shades every chart | pass | Spec "hovering a step shades exactly its span..." passed. `highlight = stepSpan(result.steps[activeStep], ...)` with `activeStep` a run step (same indexing as the removed timeline). |
| start row clears the band (respec 1) | fail | Blocking finding 1: the test passes with the handlers removed, so the "Break caught" claim fails. The behavior itself is correct. |
| focus shades like hover and Tab moves it | pass | Spec passed. `onFocus` sits on the `<tr>`. |
| no flash inside a row | pass | Spec passed. The implementer's mutation (unconditional blur) gave 4 removals. |
| unaligned row while stale | pass | Spec passed (opacity 0.5, earlier row shades). Non-blocking note 1 covers how much it proves. |
| edit unaligns the active row | pass | Spec passed. The page guard `annotations?.steps.some(...)` is at `pages/apps/aoe4-build-order.tsx:112-113`. |
| a new run clears the band | pass | Spec passed. `active.result === result` is checked. |
| no band for rows with no start | pass | Spec passed. |
| the hovered row looks active | pass (title stale) | Box-shadow change asserted for both rows. See blocking finding 3. |
| zero-length and age-up cases on `step-row` | pass | Specs passed. |
| step-table render unit test (respec 1) | pass | `step-annotation.test.ts:154-163`. A 4-row table, including a run step no row has; the `run: null` row is never marked. |
| charts take the width (respec 1) | pass | Table over WIDE (1800), SPLIT, TABS. `WIDE_VIEWPORT` is 1800, so a leftover 1800 px grid would fail the 95% ratio. |
| narrow-layout spec | pass | `SCROLL_BOXES` removed, test retitled, 1024 describe deleted. Specs passed. |
| docs | fail | The required items are present and no timeline sentence remains (grep empty), but two old rules were dropped. See blocking finding 2. |
| commands pass | pass | Re-run here: `npx tsc --noEmit` clean, `npm run lint:dup` 0 clones, `npm test` 63 files / 1963 passed / 10 skipped, `npx next build` ok, `npm run acceptance` (full) 870 passed. |
| No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- S1 holds. New and changed imports stay inside `components/apps/aoe4-build-order/` and `pages/apps/aoe4-build-order.tsx`.
- A3 holds. `active` and `activeStep` feed only `StepTable` styling and the `Results` chart highlight. No simulation or request path reads them.
- S2, S3, A1, A2: not touched. No route, engine or data change.

## Lint

`npx tsc --noEmit`: no issues. `npm run lint:dup` (jscpd): 0 clones. No ESLint config exists in the repo.

## Bot reconciliation

`reviewBot.cli` is empty, so no review bot ran. `rulesFile` is empty.

## Non-blocking notes

1. `aoe4-build-order-step-band.spec.ts:269`: "hovering a row with no run while stale draws no band" starts with no band, so its first two assertions check a state that already held. If the row's handler set a non-null step, the page's live-annotation guard would mask it anyway. To make the check meaningful, hover row 0 first (band shown), then row 2. Low value, since the guard makes the break hard to observe.
2. `aoe4-results-split.spec.ts:49`: `page.getByTestId('editor-view-table').click()` reimplements `showView(page, 'table')` from `acceptance/helpers.ts:127`, which the sibling specs (`aoe4-build-order-step-band.spec.ts:57`) use.
3. `pages/apps/aoe4-build-order.tsx:673`: each `onFocus` bubble within a row calls `setActive` with a new object and re-renders the page, even when the step is unchanged. Harmless at this size.

## Out-of-scope findings

- The SGS-108 run cell breaks kind badges mid-word ("Econ / omy", "Buildi / ng") at 1280 and 1800 px. `overflow-wrap: anywhere` on `.runCell` in `step-annotation.module.css` combined with `min-width: 4rem` causes it. Seen in the hover screenshots at 1280 and 1800 px. This diff did not introduce it.

## Coverage

- Files reviewed: every file in `5bda0f7..1469a85`. `pages/apps/aoe4-build-order.tsx`, `results.tsx`, `step-table.tsx`, `step-annotation.tsx`, `step-annotations.ts`, `build-input.tsx`, the deleted `step-timeline.tsx`, `results.module.css`, `workbench.module.css`, both unit test files, the five acceptance specs, and `docs/aoe4-build-order.md`.
- CSS: checked that every remaining class in `results.module.css` and `workbench.module.css` is still referenced, and that nothing reads `--run-bar-height`.
- REPO.md checklist "Every diff": `npx next build` passed. Loaded the page through Playwright, hovered a step row in Table view, and screenshotted at 1280 and 1800 px: row tinted, band on the charts, charts fill the Results column. "AoE4 build order" section: no copied helper; docs checked against the code. 360 and 390 px checks were skipped: narrow screens (<768 px) are out of scope for M7 per the manager. I took no 768 px screenshot. The full acceptance suite covers TABS (1024) and SPLIT.
- Mutation check run here: removing the start-row handlers (reverted afterwards).
- REVIEW.md does not exist. Project LESSONS.md is empty. The repo lesson on single `page.evaluate` layout reads is followed (`aoe4-results-split.spec.ts` `widths`).
