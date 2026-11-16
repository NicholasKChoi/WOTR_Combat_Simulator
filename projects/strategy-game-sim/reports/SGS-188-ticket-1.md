# SGS-188 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-188-aoe4-auto-run-listen-pageerror.md

Summary: Chore, component aoe4-build-order, Risk low, about 5 lines of test code, no dependencies. The `first load runs once` test in acceptance/aoe4-auto-run.spec.ts also collects `pageerror` events, registered before `openPage`, and fails on any. The existing hydration console check and other assertions stay. Criteria: pageerror on load fails the test; existing assertions unchanged. Lint passed with no output.

Diagrams: none (single-component line). Open questions: none. Overlap with existing tickets: none checked beyond the spec files read. No scratch checkout was made.
