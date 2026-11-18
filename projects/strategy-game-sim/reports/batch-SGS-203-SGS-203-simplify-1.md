# Simplify pass, batch SGS-203-SGS-203

Verdict: unchanged. Tip stays 85508a7fb229b315ab9cc6e9a45b2a7f4a73b424. Nothing committed or pushed.

Reviewed the diff against 636193d (the branch's parent): chart-legend.tsx, use-marker-control-height.ts, workbench-columns.tsx, the two CSS modules, the unit test, docs, and the acceptance spec.

Findings:
- Shared hook with use-run-bar-height.ts: not taken. The two hooks differ in real ways (the run-bar one adds the form's bottom margin and has no `present` gate; the marker one gates on `present` and uses a different property). A shared hook would need a margin option, a gate, and a property-name parameter, so it is a parameterised abstraction over about 15 lines each, not a clear win. Left as a possible follow-up.
- Comments, naming, and the CSS are minimal and match their siblings. No dead code, no redundant state, no unneeded effects found.

Unit tests: `npx vitest run components/apps/aoe4-build-order` via run.sh, 34 files and 916 tests passed. No browser or end-to-end tests were run.
