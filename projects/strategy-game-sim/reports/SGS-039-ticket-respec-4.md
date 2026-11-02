# SGS-039 ticket re-spec 4 (response to spec-gate 4)

Ticket: tickets/SGS-039-aoe4-triggers-reactions-default-amounts.md, criteria tagged (respec 5), section "Re-spec 2026-11-01 (5)".

- Added to the docs Scope by sentence: Results `depletions` bullet ("every `amount` is `null` and `warnings` is empty"; leave the `step-stuck` clause to SGS-042 and do not reintroduce it), bounds-table `nodeAmounts` row ("else infinite" -> "`null` is infinite"), extension-points row (drop "Shipped node amounts").
- Own sweep at the SGS-038 branch (12f0c53; local 4749c13 has identical docs/data) found three more: doc hand-entered values paragraph (~:90-94) should list the six node amounts as unverified; OpenAPI `SimInputOverrides.nodeAmounts` description "infinite when absent"; OpenAPI `StepTiming.armedAt` "every earlier step had started" (false for reactions). All added to Scope. README needs nothing beyond the existing :70-71 item.
- Sweep rule added: greps are a floor; implementer reads every infinite/amount/depletion/nodeAmounts sentence in the doc, OpenAPI descriptions/examples and README, fixes each made false, lists extras in the PR body.
- Criteria verified on 12f0c53: docs grep with "every .amount. is .null." = 6; `else infinite|Shipped node amounts` = 2; `grep -c "infinite when absent"` openapi = 1. All 0 after.
- Risk, dependsOn, status unchanged. Open questions: none.
