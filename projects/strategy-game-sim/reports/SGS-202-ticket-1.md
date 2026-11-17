# SGS-202 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-202-house-demand-held-order.md (lint clean)

Summary: houseDemand (lib/aoe4-build-order/simulate.ts) sums population rate over every instance with an order, ignoring engine.held, which startProduction honors. Fix: skip instances in engine.held.instances. ~15 LOC, component aoe4-build-order, no dependencies, no open questions, no diagram. Docs to update: docs/aoe4-build-order.md (Houses and supply demand sentence), lib/aoe4-build-order/README.md if it describes demand.

NOT a pure chore: the fix changes auto-house timings for builds combining a held instance with autoHouses. Ticket written as Type Bug, Priority low, Risk high (changes what a run computes), instead of Chore. The manager should record Type Bug (standalone, Milestone none).

Subtlety noted in ticket: runHousePass pass 1 runs before offerSteps recomputes engine.held, so it sees the previous instant's hold; ticket says use held as is.

Criteria: regression test failing at base (held order excluded, later first house), non-held/busy producers still counted, exclusion ends with the hold (incl. pass 1), existing tests rule, docs, A2/A3.

Overlap with open tickets: none checked beyond BACKLOG; none found. On merge: none (the backlog line should be deleted by the manager on integration).
