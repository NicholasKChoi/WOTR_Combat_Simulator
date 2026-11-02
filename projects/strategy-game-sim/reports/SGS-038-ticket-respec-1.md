# SGS-038 ticket re-spec 1

Folded designer pass 4 rows into tickets/SGS-038-aoe4-depletion-engine.md. Risk stays high.

- Row 2: engine calls `recordRunOut` (end of run-out instant, FINITE_NODE_REFS order) and `recordIdleArrival` (from `assignGatherers`); no warning built in simulate.ts. New criterion added.
- Row 3a: `houseBuilderSource`/`trips` `gold#2` stays `unknown-id` with the M2 message; criterion reworded, question deleted.
- Row 3b: gatherers first, then idle, stated as the design's fixed order; question deleted.
- Row 3c: `nodeRefIssue(value: unknown, finiteOnly): NodeRefProblem | null`, message `${reason} in ${path}`; scope and node-ref criterion updated.
- Row 9: OpenAPI `nodeAmounts` uses `propertyNames` `$ref` FiniteNodeRef.
- Row 1c: messages use `formatMinSec` from `format-time.ts` (SGS-037's text); this ticket adds no time formatting.
- Open questions: none remain. No notes sections appended; the ticket has no changed code-side scope beyond the above.
