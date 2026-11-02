# SGS-038 ticket report 1

File: tickets/SGS-038-aoe4-depletion-engine.md (outline D). Risk: high. Depends on SGS-037 (C), SGS-035 (A). On merge: none.

Summary: engine + validate ticket. Stock per run ref, exact run-out wakes, run-outs first in runInstant, idle villagers and arrivals via assignGatherers, availableAt, move all, build `then` = created node (farm createdBy), nodeAmounts input and bound, nodeRefIssue in every node position, BuildStep/move.count/nodeAmounts widened in model, api, OpenAPI; docs sections updated. No amount values in base.json (defaults infinite until SGS-039). ~380 business-logic lines; split candidate named (validation/inputs first, engine second) if the diff passes ~450.

Diagram: read/act/record flowchart (changes core loop).

Checked criteria against main f078c11: direct gatherers[...] +=/-= writes in simulate.ts = 5 (criterion expects <=2 after); "never runs out" in docs = 1 line (expects 0 after). No mutation criterion (code does not exist yet).

Notable: ENG 1TC has three-plus `build farm ... then farm` steps, so createdBy removes a walk leg and shifts ENG 1TC farm timings; criterion requires the PR to list changed numbers.

Open questions (both designer):
1. houseBuilderSource 'gold#2' / trips.gold#2 result not specified; ticket keeps today's unknown-id.
2. Order of taking villagers for build/numbered move (gatherers first, then idle) is assumed; design specifies it only for move all.

Overlap: simulate.ts with SGS-042 (H, sibling) and SGS-039 (E, child); validate.ts with SGS-036 (B) and SGS-039; rebase only.
