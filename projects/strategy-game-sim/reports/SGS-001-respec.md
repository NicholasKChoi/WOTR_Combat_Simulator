# SGS-001 re-spec (respec 1)

Ticket: tickets/SGS-001-wotr-combat-design-doc.md. Checked against origin/main d54af2e (`fight.ts`, `army.ts`,
`army.js`, `results.js`, ARCHITECTURE.md), CONTEXT.md Decisions, INVARIANTS.md, spec-checklist, SGS-001 spec
gate, SGS-003/SGS-004 gate notes.

## Gap resolution
1. Casualty vs takeHit: doc states the owner rule (more than 5 units and 0 regulars downgrades an elite);
   criterion no longer requires matching `takeHit`; "Current code" note records the negative-regulars defect.
2. Stale open-question pointers: replaced with settled values (dice min(r+e,5); rerolls min(misses,leaders,5);
   at most 5 hits per side per round). Leader cap of 5 now has its own criterion (input bounds).
3. Character/Nazgul leadership: moved to "Not modeled (settled)", no confirm tag.
4. Outcome stats: "proposal" tag removed. Tie named and mapped to `n/a`. Rounds mean/median/p10/p90 with
   nearest-rank method stated. Survivors = each winning side's counts per (regulars, elites) combination, kept
   separate. Hits per round = each side's 0-5 distribution as shares of all rounds. No field names.
5. Time budget: N default 1000, max 100,000, N=100,000 within 10 s, all in section 7 and one criterion.
6. Diagram: flowchart kept in the doc with a criterion; ticket Diagrams line explains the doc-only change
   needs no ticket diagram.

Also folded in: input bounds per SGS-003 gate (regulars+elites <= 10, leaders 0-5 not counted, 0 invalid, UI
0-10/0-10/0-5); optional link to `docs/api/openapi.json`; W2 and S3 named as adjacent.

## Choices made by the author (flag if wrong)
- Percentile method: nearest-rank, rank ceil(p/100 x N), median = p50 by the same method. SGS-005 should use the same.
- Survivor distribution expressed as counts (denominator for shares left as open question 2).

## Open questions
1. Fight to elimination, no cards, no sieges/sorties, Shadow/Free hard-coded: still "owner to confirm". Non-blocking.
2. Survivor shares denominator (that side's wins vs N), if shares are wanted. Non-blocking.

## Overlap
- SGS-003: input bounds now match its ticket; SGS-003 dispatch can follow this ticket.
- SGS-004: the doc now carries the 0-regulars downgrade rule its gate asked for.
- SGS-005: must adopt the nearest-rank percentile method and the counts-based survivor distribution.
- SGS-006: describes the same statistics in OpenAPI; the doc links to it but does not name fields.
