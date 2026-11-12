# SGS-141 ticket author, re-spec 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-141-split-tab-order-spec-and-final-docs-pass.md

## Summary

SGS-141 "Add the split-layout Tab-order spec and close the M9 docs gaps" (aoe4-build-order, 0 business-logic lines, about 100 lines of acceptance spec, a possible helper move and doc edits; depends on SGS-130 to SGS-133 and SGS-137 to SGS-140; risk low). Re-specced against spec-gate 1. All five blocking gaps are folded in:

1. The walk now runs until focus reaches the `chart-collapse` inside the last chart section in rendered order, with a press cap set by the implementer. It fails if that caret is not reached. Legend and view-toggle stops pass by without assertions.
2. The Results selectors are now named: `compare-collapse` (SGS-134), `chart-drag-handle` and `chart-collapse` (SGS-135). Each handle and caret pair is matched by its containing chart section (the `RESULT_CHART_IDS` test ids).
3. The helper source is now a rule. If the Depends-on tips export a Save as copy helper from `acceptance/helpers.ts`, the spec imports it. Otherwise `saveCopy` and `editedCopy`, plus the locals they need, move there from `acceptance/aoe4-my-builds.spec.ts`, and both specs import them.
4. `save-build` is now checked explicitly. At the base, `SaveBuild` (`save-build.tsx`) enables `save-build` only while the loaded build is edited (`canSaveVersion` needs `edited`). It shows the link only while the settled input equals the saved input (`linkVisible`). So whenever the link is shown, `save-build` is disabled and is not a Tab stop. The existing my-builds spec confirms this: after a version save it asserts `saveButton` is disabled while `savedLink` has a value. The spec now has two states:
   - Edited state (Save as copy, then an edit): it asserts `save-build` is visible and enabled, then requires it as an ordered stop.
   - Link state: it asserts `save-build` is present, disabled and earlier in the document than `save-build-copy`. The link controls are then ordered stops.
5. The end-state grep no longer includes `Per villager` or `strictNullChecks`. A new audit criterion requires that each remaining match of those two names describes the integrated state. Today they match `ARCHITECTURE.md:11` and `docs/aoe4-build-order.md` lines 976 to 997.

Criteria cover: both walk states; the Results-column order; no positive tabindex; one `page.evaluate` per step with shared helpers and no jscpd clone; the docs coverage list; the stale-name grep (it matches `chart-pinned-key` and `Age-up (pinned)` at the base today); the audit of the two allowed names; the ARCHITECTURE.md state; comments; the M9.9 topic coverage; the gates; and invariants. ticket-lint passes.

## Diagrams

None (single component, not a control loop).

## Open questions

None. One item for the manager (designer): the `design/M9.md` M9.9 criteria-map row says a single walk after Save as copy, with the link shown, reaches `save-build` and then the link controls. No page state allows that, because `save-build` is disabled while the link is shown. The ticket now splits this into two states. The design row should be updated to match. The "Tab order (M9.9)" rule itself is unaffected.

## Overlap

None new. The helper move overlaps SGS-132's conditional move of the same helpers. The rule takes whichever end state SGS-132 leaves, so neither ticket throws away the other's work.
