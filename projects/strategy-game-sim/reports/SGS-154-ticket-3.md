# SGS-154 ticket re-spec 3

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-154-re-add-unpinned-aoe4-acceptance-coverage.md

Changes (ticket-lint passes):
- Item 1: villager series ends at the produce count; starting villagers never appear in `unitsProduced` (schema text, and the deleted test asserted 3 for start 6 sheep + `produce villager x3`). New criterion tagged (respec 3).
- Item 7: states the default horizon as an input and a precondition that every produced villager is paid and spawned (series ends at 40) so a slower engine fails clearly. New criterion (respec 3).
- Item 3 and its criterion: `finalCount` replaced by "an independent per-`baseId` sum helper"; criterion retagged (respec 3).
- Helper note in Scope corrected: `helpers.ts` exports `postSimulate`, `simulateOk`, `buildOrderFrom`, `INFINITE_NODES`, `WARM_UP_TIMEOUT_MS`; specs import what they lack (spend-population dropped `INFINITE_NODES`); spear-longbow `Result` lost `steps`, so extend it.
- Re-spec 3 history appended.

Verified against 27e8840^ and origin/main, all other claims hold: deleted edges, markers, veterancy-conversion, spear-longbow, spend-population, triggers and depletion-engine tests match the ticket's descriptions; `SimulationResult` has `productionBuildings` (not in the deleted key list, so schema derivation is right); `ChartMarker.label` is the tech baseId (matches for horticulture); `veteran-longbowmen` research exists in english-knight-longbow.json; man-at-arms produce steps exist in the spear-longbow build; depletion-engine helpers (`order`, `PAUSE`, `NO_HOUSES`, `depletionOf`, `warningsOf`, `last`) exist; the veterancy-conversion spec is absent at origin/main. I did not run the specs (no dev server); the 681 time trigger was confirmed by gate 3, not re-read by me.

Open questions: none. Overlap: none new.
