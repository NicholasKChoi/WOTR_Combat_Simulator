# SGS-149 ticket report

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-149-test-hardening-masked-assertions.md
Title: SGS-149: Harden three tests that cannot fail for the reason they name
Type Chore, Risk low, Component aoe4-build-order, Milestone none, Depends on none, LOC ~50, On merge none.

Checked at origin/main: all three backlog items still apply; none dropped.
- Item 1 (auto-run status spec): the SGS-118 assertion lives in acceptance/aoe4-auto-run-contract.spec.ts; `expect(answered).toEqual([])` follows the `running` assertion with no wait.
- Item 2 (memory-store env tests): build-store.test.ts "shares neither builds nor counters between envs" and "shares no named build between envs" run against the memory factory, whose stores each own their Maps. The file factory does exercise it. The route (shared backing store versus testing the key functions) is left to the implementer.
- Item 3 (tab-order spec): lastChart's count assertion and the handle-stop presence assertion in expectChartControlsOrder still come first.

Diagrams: none (single-component test change). Open questions: none. Overlap with other tickets: none found. Ticket-lint passes. Mutation checks were not run at authoring time; the criteria ask the implementer to run and record them.
