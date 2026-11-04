# SGS-088 spec gate 1

Verdict: NEEDS_SPEC (one owner gap, one small spec gap). Risk `standard` confirmed.

## Gaps
1. Open questions (owner) - Both Open questions decide main-path behavior: Scope 3 reverses the M4 design row "pin restore | on load"
   (keep the key on 5xx) and Scope 2 picks switch-to-Build over disabling the toggle on Results. The ticket does not say what to build
   until the owner answers, so it is not ready (check 3, check 9). Fix: owner confirms both, then delete the questions and, if
   confirmed, record the choices in the body (or CONTEXT.md Decisions). If the owner wants a notice/discard control or a disabled toggle, Scope changes.
2. Scope 1 - external-edit merge when the row count shrinks or the text is unparseable - the rule `flag = flag || hasOptionalField(step)`
   is given only for equal lengths. If the text loses rows, does the flags array keep its tail? A kept tail would re-apply stale flags
   to rows later added by text. An implementer must guess. Fix: state that the merged array has exactly one entry per parsed step
   (extra entries dropped, missing entries read as false before the OR), and that an unparseable text leaves the flags unchanged. Add a
   case to criterion (c): flags [true,true,true] with two steps gives length 2.

## Checks that passed
- Grounding: StepTable `expansion` state (step-table.tsx ~292-298), `moveStep`/`deleteStep`/`insertStep`/`hasOptionalField` in step-table-model.ts, restore effect (page ~110-133), `onViewChange`, `BuildInput.onTextChange`, `showView` helper, testids `tab-build`/`panel-build`/`editor-view-*`, pin-compare `[400,false],[500,true]` table all exist. Existing step-table spec "optional fields sit behind step-more" (add step stays closed, row 1 stays open) agrees with the new rules.
- Testable criteria are observable; no stale counts. The existing-test rule is stated (Scope 5).
- Docs: the three doc statements (docs/aoe4-build-order.md lines ~837, 867-870, 934) are in Scope 4; README and ARCHITECTURE have none.
- Contracts: no schema/API change. Invariants: none adjacent is right. Depends-on none is right (SGS-082 deletes acceptance/aoe4-build-order.spec.ts in parallel; the ticket avoids that file).
- Input validation: not applicable. Diagrams: none required. LOC ~70. LESSONS: the Playwright lesson (single-evaluate layout reads) does not apply; no layout rects are asserted.
- On merge: names the BACKLOG bullets and the M4 design row; fine.

## Risk
Template: high needs a strongModelTriggers item or applying criticalPaths entry; none applies (UI state and a client-side restore rule; no engine, no public schema/API, under 250 LOC). Low is excluded because the pin restore rule changes a documented design row and two components change. `standard` is correct.

## Notes
- The ticket says "verified at cc9bb04"; base is now b9481e3. The cited code is unchanged on current main as read.
- Criterion 2 asserts the row index of the open state; confirm via `aria-expanded` on `step-more`, as the existing spec does.
- The mechanism to tell table writes from external edits is not named; wrapping the two text setters passed to BuildTextEditor and BuildInput is the obvious one and is fine.
