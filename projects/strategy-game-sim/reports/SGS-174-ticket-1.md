# SGS-174 ticket report 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-174-aoe4-simulator-internals-overview.md (lint clean)

Summary: Docs ticket, component aoe4-build-order, Milestone none, Risk low, no dependencies, no code changes. It adds `lib/aoe4-build-order/README.md` with a grouped module map covering every non-test file in the directory, the data flow (text -> parse-text -> check -> `simulateBuildOrder` -> result series), the event loop (`runInstant`, `offerSteps`, `applyDueEvents`, `nextWake`), and links to design-doc headings. It also adds one linking line to `docs/aoe4-build-order.md`. Criteria cover module coverage, existence and accuracy of named symbols, loop order, link resolution, no restated rules, and docs-only diff.

Decision made: the backlog allowed a README or a design-doc Internals section. I chose the README because the design doc is the review reference and another backlog item splits it. Precedent: `data/aoe4-build-order/README.md`. Risk is low because the README is not authoritative for any contract (CONTEXT.md names `docs/aoe4-build-order.md` as authoritative; the README only links to it, and the one-line addition to that doc does not change a rule).

Diagrams: none required (docs-only).
Open questions: none. No decision lacking a code answer.
Overlap: touches `docs/aoe4-build-order.md` (backlog item "Split docs/aoe4-build-order.md") with one line near the top; trivial merge conflict at worst. ARCHITECTURE.md is deliberately not edited (another backlog item owns it), so the new README location is not listed in its "Where files go" table.
Scratch checkout: none created. BACKLOG.md and the graph untouched.
