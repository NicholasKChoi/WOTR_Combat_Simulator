# SGS-156 ticket report 4 (re-spec 3)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-156-aoe4-auto-houses-plan-ahead-for-wood.md

Summary: Folded owner answer Q92 (A) and the spec-gate-2 note. Scope 2 and 6 now release the house hold when total villagers (gathering, walking, building; not idle) are fewer than `houseBuilders`; every other case keeps holding. New criterion: with fewer villagers than `houseBuilders` and a due house, a wood step and a non-villager order pay at their own cost (and the hold stays when enough villagers exist but are busy). Scope 7 now also fixes the builder paragraph ("A house waits only when...") and the headroom sentence ("finishes within the lead") in docs/aoe4-build-order.md. The final criterion covers every statement of the lead window. Re-spec 3 section appended. Open questions: none. Lint: clean. Diagram unchanged (still valid). No overlap with other tickets.
