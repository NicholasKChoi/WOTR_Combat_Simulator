# SGS-054 implementer 2 (rework 1)

Branch sgs-054-aoe4-m3-docs-openapi-audit, tip 9a2937c58c544f841b53f1c2a5fc8be02f30ece0 (one commit on 0093867). Base already equals origin/main d90d91a, so no rebase was needed.

## Changes (docs/aoe4-build-order.md only)
- `spawnedPopulation`: "the population (summed `popcap`) of the villagers and units that have spawned".
- Node references: `<reason> in <path>` is limited to step fields, `start` and the `depleted` trigger; `nodeAmounts` keys read `inputs.nodeAmounts.<ref>: <reason>` (example given). Checked against validate.ts:196-197, 344-345, 471-473.
- Non-blocking notes: intro says "series over time" and "spending and population" no longer implies a population graph; Outputs sentence now "with the chart markers (see Page; the warnings are lists beside them)"; "has a severity level"; "never applied" (Technologies); "resource depletion" lowercased.
- Other `in <path>` and population claims grepped; the rest agree with the code (trip/houseBuilderSource messages, supply-check population, `Trigger.count` 1..200).

## Checks
- `npx tsc --noEmit && npm run lint:dup`: clean.
- `npm test`: 40 files, 1076 passed, 8 skipped.
- Contract + spec-surface specs on ACCEPTANCE_PORT=3947: 99 passed.
- Live spot check on next dev port 3948 (move `to`): gold#1 invalid, gold#9 out-of-range, wood#2 invalid, iron and iron#2 unknown-id (`unknown node "iron" in to`), gold#02 syntax; `nodeAmounts.iron` gives `inputs.nodeAmounts.iron: unknown node "iron"`. Requests also carried unrelated name/start issues because my payload was minimal; the node issues are the ones checked.
- Server stopped; ports 3947 and 3948 not listening.

## Out-of-scope findings
None. Status: needs_review.
