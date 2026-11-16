# SGS-186 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-186-remove-unused-acceptance-spec-locals.md

Summary: Chore, component aoe4-build-order, Milestone none, Risk low, about 3 lines, no dependencies. Verified at origin/main that all three locals are unused: `MIXED_NODES_PASTE` (acceptance/aoe4-chart-views.spec.ts), `bands` (acceptance/aoe4-compact-view.spec.ts), and the `isNamedPath` import (acceptance/aoe4-my-builds.spec.ts). The `isNamedPath` export in acceptance/helpers.ts stays, because `stubNamed` uses it. Criteria cover the `--noUnusedLocals` typecheck, unchanged test assertions, and lint.

Diagrams: none. Open questions: none. Overlap with other tickets: none checked beyond the backlog item. Lint: ticket-lint passed. No scratch checkout was made.

Note: I did not run `tsc --noUnusedLocals` myself. The three locals were confirmed by search at origin/main, and the ticket tells the implementer to run tsc and list any other unused locals it finds in the touched files.
