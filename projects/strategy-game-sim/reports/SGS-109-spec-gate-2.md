# SGS-109 spec gate 2

Verdict: READY

Read: re-specced SGS-109 and SGS-108, SGS-110 (for testId and data-active use), spec-gate-1 and ticket-2 reports. I did not re-run the code checks from gate 1; grep on origin/main only for the opacity/results-last-good specs.

## Earlier notes folded in (gate 1)

1. `formRef` and `runBar`/`pageSection` refs: in Scope (page) and the removal criterion. Done.
2. m3-flow `x5` becomes `step-field-count` `toHaveValue('5')`; the two "timeline" titles retitled. Done.
3. Reaction migration: count of `step-field-reaction:checked` equals `REACTION_COUNT`; last row checked in the ENG 1TC test. Done.
4. Unit test file named `step-annotation.test.ts`. Done.
5. CSS example: `timeCell` only; `scrollBox` and `scrolledTable` stay (compare-panel). Done.
6. Start-row case: Scope, diagram and its own criterion (hover and focus). Done.
7. `showTab(page, 'results')` for `TABS_VIEWPORT`. Done.
Gate 1's last two notes (SGS-110 `data-active` collision, `row()` keyed on `data-run-step`) are covered too: SGS-110 now uses `data-gutter-active`, and the stale and edit criteria key rows by `data-run-step`.

## Match with re-specced SGS-108

- `StepKindLegend` optional `testId`, default `step-kind-legend`: SGS-108 Scope 1 and SGS-109 deletion bullet agree. SGS-110 passes no `testId` (Scope, legend bullet), so SGS-109 dropping the prop when `step-timeline.tsx` goes is safe, and its "unless something still passes it" wording is consistent.
- `step-timeline.tsx` renders `<StepKindLegend testId="step-timeline-legend" />` and imports `step-annotation.module.css` for `kindBorder`: SGS-108 states both; SGS-109 deletes the file and its removal grep leads with `step-timeline-legend`.
- Class moves: SGS-108 moves kind*, `badge`, `legendRow` out of `results.module.css` and keeps `scrollBox`, `scrolledTable`, `timeCell` there; SGS-109 removes `timeCell` (grep-each-class) and keeps `scrollBox`/`scrolledTable`. No copies left behind.
- Other names (`StepTable.annotations`, `step-row` data attributes, `step-run`, `KIND_CLASS`, `StepKindBadge`, page `annotations`/`stale`, `Results.dimmed = stale`, the `statusDescribesResults`-style prop that SGS-108 says the next ticket keeps): unchanged and consistent. SGS-108 adds no `activeStep`/`onActiveStepChange`, so no collision.
- Edit ownership: no edit is owned by both. Shared files are sequential and on different text: `results.tsx`, the page, `docs/aoe4-build-order.md` (SGS-108 leaves the timeline paragraph and the 1800 px sentence for SGS-109), `step-timeline.tsx` (108 imports, 109 deletes), `results.module.css`, `aoe4-narrow-layout.spec.ts` (108 only if locators shift; 109 edits `SCROLL_BOXES`). The renamed `aoe4-step-annotations.spec.ts` is SGS-108's alone; 109 does not touch it.

## Checks 1-13

All pass as in gate 1; the re-spec changes add no new open question, contract, risk trigger, trust-boundary input or stale pinned number. Risk `standard` still holds. On merge `none` is correct.

## Notes (non-blocking)

- The removal grep allows matches only in `acceptance/aoe4-results-split.spec.ts`. If SGS-108's implementer adds any `step-timeline-legend` or `step-timeline` string to `aoe4-step-annotations.spec.ts` (SGS-108's criteria do not require one), SGS-109 would have to remove it. Nothing needs changing now; the implementer should treat any such leftover as in scope.
- SGS-108's dimming-spec rule (search `opacity` and `results-last-good` under `acceptance/`) touches specs such as `aoe4-auto-run.spec.ts` and `aoe4-build-order-m4-flow.spec.ts`, which SGS-109 does not edit. No overlap.
