# SGS-149 ticket report 2 (re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-149-test-hardening-masked-assertions.md (lint clean)

Chore, component aoe4-build-order, ~50 LOC, no dependencies. All three gaps folded in; Re-spec 1 section appended.

1. Auto-run: wait after `running` via a named constant in the spec (must exceed the mutation delay, value recorded by implementer), then assert still `running` and `answered` empty. Mutation is a delayed gate release in `holdRequests`, not an immediate release.
2. Tab order: hard `expect` throughout; chart-rendered check kept as its own assertion after the order assertions; handle-before-caret checked per chart with both stops, stop presence kept as a separate later assertion. Criteria require the first thrown message to be the order or handle-before-caret one, and that missing chart/stop still fails.
3. Memory env isolation: shared-backing-store route required (optional parameter or seam on `createMemoryBuildStore`; single-argument calls unchanged, with a criterion); key-function-only route excluded. Six mutations (`savedBuildKey`, `namedBuildKey`, `rateCounterKey`, each at the function and at the store call site) recorded in the implementer's report.

Diagrams: none (single component, not a control loop). Open questions: none. Overlap with other tickets: none found. Note: a ticket-1 report already existed, so this is ticket-2.
