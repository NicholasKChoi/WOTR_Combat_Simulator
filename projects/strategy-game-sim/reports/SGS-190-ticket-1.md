# SGS-190 ticket author report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-190-steps-wait-for-free-building.md

Summary: "Steps wait for a free building (produce and research)", Feature, M11, component aoe4-build-order, risk high (strong model: changes what a run computes and the order of operations). About 150 lines of business logic across `engine-common.ts` (`instanceFree`), `simulate.ts` (`produce` check 5, `offerSteps` hold, `startProduction` skip, `EngineState.held`, `StepStart.hold`), `research.ts` (`researchTarget`, busy check), plus the Spear/Longbow JSON edit (four Castle blacksmith researches removed) and its README entry, `test-helpers.ts` (`startingWith`, `tierCountAt` move), new `simulate-busy-buildings.test.ts`, the design's 22 test re-baselines (as a rule with examples), acceptance specs that move, and `docs/aoe4-build-order.md` (Priority, Queues, research and Tiers statements). Depends on SGS-189. On merge is exactly `BACKLOG.md: delete the item "AoE4 build order: research occupies its building"`. Criteria cover: `instanceFree`, single and several targets and the hold, `instance: k`, check order and reserve, reactions, research waits and candidate choice, research pausing production, missing target and horizon failure, A2/A3, the unchanged exports test, the re-baselines, the Spear/Longbow edit, builds.test.ts bars, acceptance specs, docs.

Diagram: one Mermaid flowchart (read/act/record of the `offerSteps`/`startProduction` loop).

Open questions: none. Unverified assumptions: none.

Checks run: `ticket-lint.py` printed no errors. The two doc-search strings in the last criterion (`Queue length is not consulted`, `replaces its order (a switch)`) match `docs/aoe4-build-order.md` at origin/main today (lines 187, 210). No mutation or runnable test criterion was run; no scratch checkout made.

Base: origin/main 87f0cd7; SGS-189 not integrated and has no branch; read its ticket. SGS-190 does not touch the Knight/Longbow or Council Hall files; the README Council Hall and Knight/Longbow entries are left to SGS-189, SGS-190 edits only the Spear/Longbow entry.

Overlap: SGS-189 re-pins "holds 20 tier-2 longbowmen ..." and this ticket re-pins it again (as the plan says). SGS-191 (C) edits `research.ts` `researchItem` (marker line), a different function from `researchTarget`/`researchHandler`: textual rebase only. SGS-190 is the first to touch `simulate.ts` `produce`/`offerSteps`; SGS-192 (D) builds on it. Design says the two "free" docs sentences listed in K's grep go with this ticket's doc rewrite; the ticket does so.

Notes: the design's sample values (startedAt 20, 15, 60 ...) are quoted as design samples in criteria; the Spear/Longbow gold run-out pin and its digest are left to the implementer to measure.
