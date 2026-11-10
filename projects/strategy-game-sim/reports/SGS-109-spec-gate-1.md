# SGS-109 spec gate 1

Verdict: READY

Checked against origin/main (code as it reads today; the working tree on `code-factory-state` is older and lacks the step-band and results-split specs), the SGS-107 and SGS-108 tickets as written, design/M7.md, CONTEXT.md (Decisions: none, Open questions: none), INVARIANTS.md, LESSONS (repo lesson on one-evaluate layout reads is followed by the ticket), the ticket template.

## Cross-ticket check (the focus of this run)

Names SGS-109 takes from SGS-107 match exactly: `StepRun` (`runStep`), `StepAnnotation` (`kind`, `run`), `BuildAnnotations` (`steps`, `stale`), `stepSpan(timing: StepTiming, end)`, `timelineRows`/`TimelineRow` still exported from `step-annotations.ts` until SGS-109 deletes them, the `results.tsx` highlight already built from `stepSpan(result.steps[activeStep], ...)` (SGS-107 adds the missing-step guard; SGS-109's formula omits it but starts from SGS-107's code). Names from SGS-108 match exactly: `StepTable.annotations`, `step-row` with `data-kind`/`data-run-step`/`data-status`/`data-flagged`/`data-long-wait`, `step-run` with `data-stale`, `step-kind-legend`, `StepKindBadge`, `KIND_CLASS`, the page's `stale` and `annotations`, `Results.dimmed = stale`. SGS-108 explicitly does not add `activeStep`/`onActiveStepChange`, `data-active`, or `Results.activeStep`, and says "keep it when it changes Results props" for its aria-describedby prop, so SGS-109 adding them collides with nothing. Design Contracts for `activeStep`, `onActiveStepChange`, `Results.activeStep` match the ticket.

Spec movement the removal grep depends on: SGS-108 `git mv`s `aoe4-build-order-timeline-compare.spec.ts` to `aoe4-step-annotations.spec.ts`, rewrites its three timeline cases onto `step-row`/`step-run` (so `step-timeline-row` leaves it), and moves the two compare cases (they read only `compare-row`, no timeline id) to `aoe4-build-order-pin-compare.spec.ts`. On origin/main the file's only matching line is the `step-timeline-row` helper, so after SGS-108 that file contributes no match. SGS-109 never edits it, so no double ownership. Remaining origin/main matches are exactly the files SGS-109 lists (step-band, results-split, narrow-layout, knight-longbow, m3-flow) plus `results.tsx`, `step-timeline.tsx`, `workbench.module.css` and docs lines 900, 902, 963 (all in Scope). `line-chart.tsx`'s only match is the import path SGS-107 fixes.

Edits both tickets touch, all sequential and on different text, no shared edit: `results.tsx` (107 highlight line, 108 `dimmed` and aria prop, 109 props and layout), the page's `<Results>` element and state (108 `stale`/`annotations`, 109 `active` and wiring), `docs/aoe4-build-order.md` (108 step table paragraph, dimming sentences, side-by-side sentence, two wording fixes, leaves the timeline paragraph and 1800 px sentence; 109 replaces exactly those two plus one phrase in the Narrow layout paragraph), `step-timeline.tsx` (108 changes imports, 109 deletes), `results.module.css` (108 moves kind/badge/legendRow classes out and leaves `scrollBox`, `scrolledTable`, `timeCell`; 109 removes unreferenced leftovers), `aoe4-narrow-layout.spec.ts` (108 only if locators shift; it indexes no step-table cells, so 109 alone edits it).

## Checks

1. Grounded scope: pass. Verified on origin/main: `results.tsx` (`active` state, `rows`, `results-split`, two column divs), `step-timeline.tsx`, page `ResizeObserver` effect with `pageSection` and `runBar` refs, `.resultsSplit/.timelineColumn/.chartsColumn` in the 1800 px media block, the five specs and their test ids, helpers `showView`, `SIMULATE_PATH`, `WIDE_VIEWPORT`, `SPLIT_VIEWPORT`, `TABS_VIEWPORT`, and the controls `step-delete`, `step-trigger-kind`, `step-field-count`, `step-field-reaction` (rendered for depleted-trigger rows).
2. Testable criteria: pass. Each has an observable outcome and a named break. No stale pinned counts (95% is a design constant, 0.5 opacity is the design value). Existing-test rule is stated (specs move to `step-row`, deleted cases listed).
3. Open questions: none.
4. Invariants: S1 and A3 named; nothing contradicts them (UI-only state; the result path does not read it).
5. Contracts: pass (see cross-ticket check). Design writes `SimulateResponse` where the code type is `SimulationResult`; the ticket uses the code name, which is right.
6. Dependencies and size: `Depends on: SGS-108` (which depends on SGS-107, transitive). About 120 logic lines.
7. Diagrams: present and consistent with the Scope.
8. Lessons: the one repo lesson (layout reads in one `page.evaluate`/`expect.poll`) is followed. Project LESSONS empty.
9. Decisions: consistent with design Behavior rules (Active step, `Results`, DQ6, DQ7 owned by SGS-108).
10. On merge: `none`, correct (no new command, harness or design doc; CONTEXT.md Decisions empty).
11. Risk: standard matches. UI-only, no `strongModelTriggers` item, no `criticalPaths` symbol; `Results`/`StepTable` props are internal, not a public contract.
12. Docs: pass. Grep of the whole repo outside `.claude` finds the stale names only in the files Scope lists; ARCHITECTURE.md, README and `docs/api/openapi.json` have none. The old paragraph also says a reaction row "is marked" and that a step missing from the text has no kind; neither survives (reaction is the `step-field-reaction` checkbox, and the kind now comes from the live step), which is consistent with the "move anything not yet there" rule.
13. Input validation: no new input at a trust boundary.

## Notes (non-blocking; the implementer can resolve each without the owner)

- `runBar` ref: it is passed to `BuildInput` as `formRef` (`build-input.tsx`, `ref={formRef}`), and the effect was its only purpose. Scope says to remove refs "only that effect used" but names no file for the component. Suggest Scope say: remove the `formRef` prop from `build-input.tsx` and the `runBar`/`pageSection` refs (and `ref={pageSection}` on the `<section>`), so no dead prop is left. Without it a reviewer may flag a dead prop.
- `m3-flow` line 51: `await expect(first).toContainText('x5')` read the timeline's step text. A `step-row` has no such text (count is an input value). Say to replace it with `step-field-count` `toHaveValue('5')`. Also the test titles "see the depletion warning and timeline" and "shows in the timeline and table" go stale; retitle (they do not match the removal grep, so nothing fails).
- `step-field-reaction` migration: "count or checked state" is loose. Say: the count of `step-field-reaction:checked` in Table view equals `REACTION_COUNT`; for the ENG 1TC test the last row's checkbox is checked (the second half is already asserted there).
- Unit test file: "extend the file SGS-108 added" is `step-annotation.test.ts` (SGS-108 criterion "Unit table"). Name it.
- CSS cleanup example is inaccurate: SGS-108 moves `legendRow`, `badge` and the kind classes out, and `compare-panel.tsx` still uses `scrollBox` and `scrolledTable`. The only orphan left in `results.module.css` is `timeCell`; the grep-each-class rule handles it, but replace the example so nobody deletes `scrollBox`.
- Start-row behavior (pointer or focus into `step-start-row` clears the band) is in Scope and the diagram but has no acceptance case. Suggest one line in the hover criterion: hover a completed row, then the start row, band count 0 and no `data-active`.
- Results-split table over `TABS_VIEWPORT`: at 1024 px Build and Results are tabs, so the case must `showTab(page, 'results')` before measuring `chart-units-produced`; say so.
- `data-active` on the old `step-timeline-row` is what the step-band spec's `[data-active="true"]` count-1 check read; on `step-row` the same check works, but only if no other element (for example SGS-110's gutter `li`) later sets `data-active`. SGS-110 is out of scope here; flag for its gate.
- Origin/main step-band `row()` indexes `nth(step)` by run step; the ticket's `step-row` version should key off `data-run-step` where an edit has shifted rows (the stale and edit cases do), as the ticket's criteria already imply.
