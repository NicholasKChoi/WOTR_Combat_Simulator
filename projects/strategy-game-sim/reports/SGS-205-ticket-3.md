# SGS-205 ticket (report 3, re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-205-help-modal-headings-larger-than-body.md

## Summary

SGS-205 "Make the help dialog's headings larger than its body text" (Bug, aoe4-build-order, Milestone none, Risk low, about 5 LOC, no dependencies). Re-spec 1 folds in the gap from spec-gate report 2:
- Criterion 2 was a code-reading check with no test. It is now `(respec 1)`: with the dialog open over a page that has run, each help section heading's computed font size equals a chart title's computed size (the `h3` in `ChartHeaderRow`, `chart-header.tsx`) on the same page. The regression spec in `acceptance/aoe4-help-modal.spec.ts` measures both and asserts they are equal. It fails at the base, and it fails for any section size other than the chart title's.
- The rule to use the shared Bootstrap heading classes, with no new font-size rule in `page-help.module.css`, now appears in Scope only.
- The Scope measurement bullet now also names the chart title. It requires that a chart be rendered behind the dialog when the spec measures.
- Non-blocking note fixed: Context and Unverified assumptions now say that `styles/global.css` sets the root and body font size to 18px, so 1rem is 18px.
- Criteria 1, 3 and 4 are unchanged.
- I appended the `## Re-spec 1 - 2026-11-17` section.

I checked at origin/main that `chart-header.tsx` renders `<h3 className="h5">` inside `ChartHeaderRow`, which `line-chart.tsx` uses.

ticket-lint: exit 0, no errors.

Diagrams: none (no diagram required: one component, outside the core control loop).

Open questions: none.

Overlap: none (SGS-203/204 touch other files, per spec-gate 2).
