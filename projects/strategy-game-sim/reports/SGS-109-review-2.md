# SGS-109 review 2 (after rework 1)

- Branch `sgs-109-row-hover-drop-timeline` at 1c1cf1b, reviewed as a full pass over `5bda0f7..1c1cf1b` (stacked on `sgs-108-step-run-cell`). Rework delta `1469a85..1c1cf1b`: one acceptance spec and one doc paragraph. No production code changed.
- Verdict: **APPROVE**

## Blocking findings

None.

## Rework 1 fixes

1. Start-row test (`acceptance/aoe4-build-order-step-band.spec.ts:144-162`): fixed. The test now uses mixed input. In the first half, focus on `step-delete` sets the band, the pointer stays at (0,0), and then the pointer hovers `step-start-row`. In the second half, hovering the row sets the band and then focus moves to the first start-row control. Each half asserts zero `chart-step-band` and zero `[data-active="true"]`. I ran the mutation checks here and reverted each one:
   - With the start row's `onPointerEnter` removed, the test fails at `:156` (Expected 0, Received 4).
   - With the start row's `onFocus` removed, the test fails at `:161` (Expected 0, Received 4).
   - The unmodified test passes. The title matches what the test does.
2. Doc text (`docs/aoe4-build-order.md:938, 943`): both replacements were applied verbatim. I checked them against the code again:
   - The Blocked-by format is right. `stepRun` keeps only causes with `seconds > 0`, in `BREAKDOWN_ORDER` order (`resources, villagers, population, prerequisite`, which matches the order the sentence lists). `formatWaitBreakdown` writes `${reason} ${formatMinSec(seconds)}` joined with `, ` (`step-annotations.ts:8, 16-17, 56-59`).
   - The kind rule is right. `stepKind` (`step-annotations.ts:73-86`) maps a `build` of a landmark to age-up and any other `build` to building, `research` to research, a villager `produce` to villager and any other `produce` to military. The default branch makes the remaining actions economy, and the schema has only `move`, `rally` and `pause` left (`lib/aoe4-build-order/schema.ts:400-426`).
3. Test title (`aoe4-build-order-step-band.spec.ts:215`): retitled to "the hovered row looks active, on an unflagged row and on a flagged row". It no longer names `table-warning`.

## Spec gaps

None.

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Wiring and removal grep (respec 1) | pass | The ticket's grep matches only `acceptance/aoe4-results-split.spec.ts:4` (`REMOVED_TIMELINE_IDS`). There is no `--run-bar-height`, `ResizeObserver`, `formRef` or `runBar` ref under pages/components (the `.runBar` CSS class is unrelated). `StepKindLegend()` takes no props. |
| `ResultsProps` has no `text`/`landmarks`; charts are direct children; no `results-split` | pass | `results.tsx:12-20`. The four `SeriesChart`s come directly after the message lists. |
| hover shades every chart | pass | Spec passed. `highlight = stepSpan(result.steps[activeStep], ...)` and `activeStep` is a run step. |
| start row clears the band (respec 1) | pass | Spec passed. Both mutations fail it (see above). |
| focus shades like hover and Tab moves it | pass | Spec passed. `onFocus` is on the `<tr>` (`step-table.tsx:340`). |
| no flash inside a row | pass | Spec passed. `onBlur` checks `contains(relatedTarget)` (`step-table.tsx:341-343`). |
| unaligned row while stale | pass | Spec passed. |
| edit unaligns the active row | pass | Spec passed. The page guard `annotations?.steps.some(...)` is at `pages/apps/aoe4-build-order.tsx:112-113`. |
| a new run clears the band | pass | Spec passed. `active.result === result` is checked. |
| no band for rows with no start | pass | Spec passed. |
| the hovered row looks active | pass | Spec passed. The title is now accurate. |
| zero-length and age-up cases on `step-row` | pass | Specs passed. |
| step-table render unit test (respec 1) | pass | `step-annotation.test.ts:154-163` (`it.each` table). |
| charts take the width (respec 1) | pass | `aoe4-results-split.spec.ts` passed (WIDE, SPLIT, TABS). |
| narrow-layout spec | pass | 11/11 passed, together with the knight-longbow and m3-flow specs. |
| docs | pass | Every item in Scope "Docs" is present. Both rules that review 1 found dropped are back. `git grep -i timeline -- docs/aoe4-build-order.md` finds nothing. No measured sizes or timings. |
| commands pass | pass | Re-run here at 1c1cf1b: `npx tsc --noEmit` clean, `npm run lint:dup` 0 clones, `npm test` 63 files / 1963 passed / 10 skipped, `npx next build` ok. Playwright: step-band and results-split 17/17, narrow-layout, knight-longbow and m3-flow 11/11. I did not re-run the full acceptance suite. Review 1 ran it at 1469a85 (870 passed), and production code has not changed since. |
| No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- S1 holds. All imports stay inside `components/apps/aoe4-build-order/` and `pages/apps/aoe4-build-order.tsx`.
- A3 holds. `active` and `activeStep` feed only `StepTable` styling and the `Results` chart highlight. No simulation or request path reads them.
- S2, S3, A1 and A2 are not touched. The diff makes no route, engine or data change.

## Lint

`npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones. The repo has no ESLint config.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## Non-blocking notes

Review 1's notes 1-3 still apply. None of them blocks:
- `aoe4-build-order-step-band.spec.ts:272` checks a stale-row no-band state that already held before the action.
- `aoe4-results-split.spec.ts` uses a raw `editor-view-table` click instead of `showView`.
- Every focus bubble calls `setActive` with a new object.

## Out-of-scope findings

- This is unchanged from review 1. The SGS-108 run cell breaks kind badges mid-word at 1280 and 1800 px. The cause is `overflow-wrap: anywhere` with `min-width: 4rem` on `.runCell` in `step-annotation.module.css`.

## Coverage

- Full diff `5bda0f7..1c1cf1b` read: the page, `results.tsx`, `step-table.tsx`, `step-annotation.tsx`, `build-input.tsx`, `step-annotations.ts`, the unit tests, the five specs and the docs. The rework delta `1469a85..1c1cf1b` was checked line by line, and both doc sentences were checked against the code.
- REPO.md "Every diff": `npx next build` passed. Review 1 loaded the page and took screenshots at 1280 and 1800 px. I did not repeat that because no UI code changed. 360/390/768 px checks were skipped: narrow screens (<768 px) are out of scope for M7.
- REVIEW.md does not exist. Project LESSONS.md is empty. The repo lesson on single-read layout checks is followed.
- No servers were left running. Playwright's `webServer` started and stopped its own `next dev`.
