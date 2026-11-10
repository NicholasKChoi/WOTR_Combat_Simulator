# SGS-109 implementer report 1

- Ticket: SGS-109. Branch: `sgs-109-row-hover-drop-timeline`, based on `sgs-108-step-run-cell` at 5bda0f7.
- Tip: 1469a85 (single commit). Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-109-row-hover-drop-timeline`. Not pushed.
- Status: needs_review

## Files touched
- `pages/apps/aoe4-build-order.tsx`: `active` state, derived `activeStep` (needs `active.result === result` and a live annotation with that `runStep`), wiring to `StepTable` and `Results`; `ResizeObserver` effect, `pageSection` and `runBar` refs and `formRef` prop removed; `text` and `landmarks` no longer passed to `Results`.
- `components/apps/aoe4-build-order/step-table.tsx`: `activeStep` and `onActiveStepChange` props, row pointer and focus handlers, blur `relatedTarget` check, start-row handlers, `data-active` and `table-active`.
- `components/apps/aoe4-build-order/results.tsx`: `activeStep` prop, `text` and `landmarks` dropped, `results-split` wrapper and column divs removed, charts are direct children of `results-last-good`.
- `components/apps/aoe4-build-order/build-input.tsx`: `formRef` prop and `ref` removed.
- `components/apps/aoe4-build-order/step-annotation.tsx`: `StepKindLegend` `testId` prop dropped (nothing else passed it).
- `components/apps/aoe4-build-order/step-annotations.ts`: `timelineRows` and `TimelineRow` deleted.
- `components/apps/aoe4-build-order/step-timeline.tsx`: deleted.
- `workbench.module.css`: 1800 px block (`resultsSplit`, `timelineColumn`, `chartsColumn`) removed. `results.module.css`: `timeCell` removed. `step-annotation.module.css`: no change (`kindBorder` still used by the run cell, no unreferenced class left).
- `components/apps/aoe4-build-order/step-annotations.test.ts`: `timelineRows` cases removed; kind classification kept as a `stepKind` table; the wait-breakdown order and empty-breakdown cases moved into the `StepRun` table.
- `components/apps/aoe4-build-order/step-annotation.test.ts`: new render test for `activeStep`.
- Specs edited (acceptance): `aoe4-build-order-step-band.spec.ts`, `aoe4-results-split.spec.ts`, `aoe4-narrow-layout.spec.ts`, `aoe4-build-order-m3-flow.spec.ts`, `aoe4-build-order-knight-longbow-page.spec.ts`. No other spec read a removed test id (grep).
- `docs/aoe4-build-order.md`: old timeline paragraph replaced by the annotated-build-order and hover-shading paragraph; kind-colour rules (landmark of a later age still reads Age up, colours, independent of the warning background) moved into the step table run-cell paragraph; the 1800 px column sentences replaced by "The charts are the only column at every width and take the full Results width."; "the step timeline and" dropped from the Narrow layout paragraph. `ARCHITECTURE.md` and `docs/api/openapi.json` unchanged (grep found nothing).

## Tests run
- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones. `npm test`: 63 files, 1963 passed, 10 skipped (pre-existing skips). `npx next build`: succeeded.
- `npm run acceptance`: 870 passed.
- Unit: `step-annotation.test.ts` "marks active only the row whose run step is ..." (4 rows: second run step, first run step, null, a run step no row has) asserts `data-active` and `table-active` on exactly the matching row, with the `run: null` row never marked. Invariant: matching is by `run.runStep`, not row index.
- Acceptance step-band spec: nine kept cases on `step-row` in Table view, plus the start-row, no-flash, stale-unaligned and edit cases. Results-split spec: table over `WIDE_VIEWPORT`, `SPLIT_VIEWPORT`, `TABS_VIEWPORT` (timeline ids and `results-split` count 0, `chart-units-produced` at least 95% of `results-last-good`, no sideways scroll at wide) and the no-steps build.

## Pre-existing tests edited
- `step-annotations.test.ts`: the `timelineRows` describes (labels, flags, breakdown order, blockedBy, longWait, fallback label, kind) were deleted with `timelineRows` (ticket Deletions). The blockedBy and longWait cases already exist in the `StepRun` table; the breakdown order and kind cases were rewritten against `StepRun` and `stepKind`. Assertions that still apply are unchanged.
- The acceptance specs above, as the ticket Specs section directs (timeline test ids moved to `step-row`; sticky, wrapped-run-bar, stacked and 1799/1800 cases deleted; `SCROLL_BOXES` removed, compare-box test retitled "the compare table scrolls in its own box"; 1024 px stacked-timeline test and describe deleted).

## Doc claims
- docs "The step table doubles as the annotated build order for the charts. Pointing at a row, or focusing a control in it, highlights the row and shades that step's span ..." : `step-table.tsx` row `onPointerEnter`/`onFocus`, `results.tsx` `highlight`/`stepSpan`; behaviors covered by the step-band spec.
- "Pointing at or focusing the start row shades nothing." : `step-table.tsx` `StartRow` handlers; spec "the start row clears the band".
- "Moving focus between controls of one row keeps it." : `onBlur` `contains(relatedTarget)` check; spec "never removes the band".
- "While the result is stale, a row that still has its times still shades its span." : page `activeStep` does not read `stale`; stale-unaligned spec.
- "The charts are the only column at every width and take the full Results width." : `results-split` gone; results-split spec (95% ratio at three viewports).
- Kind-colour sentence: `KIND_CLASS` in `step-annotation.tsx` and `step-annotation.module.css` (`--bs-primary` blue, `--bs-info` cyan, `--bs-danger` red, `--bs-success` green, `--bs-secondary` grey, `--bs-gray-400` light grey).

## Pinned outputs
None.

## Mutation checks (each undone with `git checkout --`)
- `step-table.tsx` `isActive` using `index === activeStep` instead of `run?.runStep`: unit test "marks active only the row whose run step is the second run step" failed.
- `step-table.tsx` `onBlur` clearing unconditionally: spec "moving focus between controls of one row never removes the band" failed at `bandRemovals` Expected 0, Received 4.
- Page `activeStep` without the live-annotation `some` check: "an edit that unaligns the active row removes the band at once" failed (band count Expected 0, Received 4).
- Page `activeStep` without `active.result === result`: "a new run clears the band ..." failed (Expected 0, Received 4).
- Removing the start row's `onPointerEnter`/`onFocus`: "the start row clears the band, for hover and for focus" still passes. Pointer leave and blur on the previous row already clear the band, so the start-row handlers are redundant in behavior; the test cannot catch their removal. Kept because the ticket asks for them and the case; flagging it.
- The active-look, zero-length and age-up cases were not mutation-checked (carried from the existing specs, which passed unchanged in logic).

## Invariants
- S1: imports stay inside the allowed paths. A3: `active` is read only by `StepTable` styling and `Results` highlight, never a result path.

## Notes and out-of-scope findings
- The new stale and edit specs use `build house with 1 from sheep` steps (produce steps complete instantly, so they have no nonzero span) and the `step-field-builders` field.
- A row whose step has no `run` ends up with `data-active` unset even while hovered (waiting and not-reached rows have a `run` and read active). Matches the ticket.
- Narrow screens (<768 px) not touched, per instruction.
