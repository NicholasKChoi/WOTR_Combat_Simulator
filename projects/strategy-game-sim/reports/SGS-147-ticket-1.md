# SGS-147 ticket 1 (re-spec)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-147-browser-storage-edge-cases.md

- Gap 1: Tests scope is now a rule. Any unit or acceptance test asserting an unreadable stored pin is removed gets the new expectation (raw value stays, no pin shown, no restore request). The `pin-storage.test.ts` test and the two loops in `aoe4-build-order-pin-compare.spec.ts` are named as examples. Rows with a valid-parsing pin keep their null assertion. A new acceptance criterion covers the value left in place and a later Pin overwriting it.
- Gap 2: the create criterion is now the helper's unit tests plus a property confirmed in the diff (`recordCreated` uses only the helper). The `readMyBuilds` match is scoped to when storage works. The cap now says it drops the oldest `mine` entries, which are the last ones in list order.
- Added a `## Re-spec 1` section. Lint passes. No diagrams, no open questions, no overlap checked beyond the spec-gate report.
