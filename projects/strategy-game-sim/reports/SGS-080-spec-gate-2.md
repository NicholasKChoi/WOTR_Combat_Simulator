# SGS-080 spec gate 2

Verdict: READY

All four gate-1 gaps are closed. Verified against origin/main 1bdf1d6: simulate.ts (assignGatherers, sendWalking, completeConstruction, createEngine order of start.villagers vs addBuildingInstance, houseBuilderSource, startConstruction via sendWalking, no 'farm' literal), depletion.ts tieRank (fallthrough indexOf(warning.node) confirmed; proposed rank [0, FINITE_NODE_REFS.length, 0] sorts between node warnings and step-stuck), model.ts, openapi 2.1.0 -> 2.2.0, rules/base.json farm createdBy plus capacity field, test files and helpers (withStart exists in simulate.test.ts), docs line "Builders are taken from gatherers only, never from idle villagers" exists. Order input cannot set start.buildings, so the start cap reads only civ data or the rules.startingState result. Walked the auto-house criterion by hand (3 farms, 4 farmers): numbers are consistent. Risk high is right. No open questions, no LESSONS conflict.

Notes (non-blocking)
- The criteria say "the unit-test run helper of simulate.test.ts"; the start-state case may use withStart from there or from simulate-construction.test.ts (both exist).
- Digest tests are re-pinned while other shipped-build assertions stay failing; the ticket names both classes, but the implementer should list which digest tests were re-pinned in the same report.
