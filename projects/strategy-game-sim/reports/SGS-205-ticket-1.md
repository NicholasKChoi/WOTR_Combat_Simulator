# SGS-205 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-205-help-modal-headings-larger-than-body.md

Summary: Bug, aoe4-build-order, standalone, low priority, low risk, about 5 LOC, no dependencies. Cause: `HelpSection` in `page-help.tsx` renders each section heading as `<h3 className="h6">`. Bootstrap's `.h6` is 1rem, the same as the body text, while the page's other h3 titles (chart titles) use `h5`. No test measured a font size. The fix uses the shared Bootstrap classes (h5-level for section headings, dialog title stays h4). The regression criterion is a computed-style check in `acceptance/aoe4-help-modal.spec.ts`: every section heading is larger than the paragraph text, and the title is larger than every section heading. It fails at the base.

Diagrams: none (one-line statement). Open questions: none. Overlap: none with SGS-203 or SGS-204 (different files). Lint passed.

Caveat: I did not measure the dialog in a browser. The ticket makes the implementer measure, since the owner saw "smaller" while the class math gives "equal".
