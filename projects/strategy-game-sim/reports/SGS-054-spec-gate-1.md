# SGS-054 spec gate 1

Verdict: READY

## Checks
1. Grounded scope: `docs/aoe4-build-order.md` sections named (Purpose and model, bounds table, Outputs, Extension points, Out: line, "A step waits while", "Prebuilt builds") exist on main (line numbers drift by 1-2, ticket already says re-read). `depletion.ts` and `markers.ts` do not exist on main; they are new in dependency tickets (SGS-037, SGS-044) and design/M3.md. `research.ts` and `simulate.ts` exist.
2. Criteria: all observable (jq counts, grep counts, mutation checks, Playwright specs). Main-side values re-measured: 25 schemas (9 fight + 16 AoE4), `SimulationResult.required` 10, stale-phrase grep 5 in doc and 2 in openapi, all 15 coverage tokens 0, `SGS-`/`M#.#` 0. All match the ticket.
3. Open questions: none in ticket or CONTEXT.md.
4. Invariants: A1, A2, A3 named as adjacent in prose; no code changes, no contradiction.
5. Contracts: 11 M3 schema adds match design/M3.md OpenAPI list (FiniteGatherNodeId, DepositRef, NodeRef, FiniteNodeRef, Severity, SimWarning, StepWait, SpendCategory, NodeDepletion, ChartMarkerKind, ChartMarker); 27 AoE4 and 36 total are consistent. Reference rules (NodeRef/FiniteNodeRef oneOf, spent and nodeAmounts propertyNames, ResourceKind via bank trigger) match the design. Severity table, marker order and nodeRefIssue shape match the design.
6. Dependencies and size: stated; no business logic.
7. Diagrams: none triggered.
8. Lessons: both LESSONS.md files are empty.
9. Decisions: consistent with design/M3.md and re-spec 1.
10. On merge: names MILESTONES.md M3.9 update.
11. Risk: standard. No lib/** or criticalPaths change, no strongModelTrigger (docs, OpenAPI JSON and test only; additions the design already specifies). Rationale in the ticket is sound.
12. Docs: the ticket is the doc pass; Out of scope hands ARCHITECTURE.md/README to SGS-035.

## Gaps
None blocking.

## Notes (non-blocking)
- Scope 2.1 lists the node-ref table rows but omits `iron#2` (`unknown-id`) and the `wood` valid row; the acceptance criterion says "every row of the design table", so the implementer should copy the design table (design/M3.md "Node references") in full, including `iron#2`.
- Scope 2.1 says `trips` and `houseBuilderSource` "stay per node kind". The design is more specific: they keep the M2 check keyed by `GatherNodeId`, so `houseBuilderSource: 'gold#2'` and a `trips['gold#2']` key stay `unknown-id` (`unknown node "gold#2"`), and `houseBuilderSource: 'gold'` means deposit 1. Worth stating that in the doc.
- The combat statement must appear in both "Purpose and model" and "Technologies" (Scope 2.3), but the criterion's grep only requires one hit; a reviewer should count two.
- The reference-coverage test should count `$ref` targets anywhere in the spec (paths and schemas); the ticket implies this, and a self-reference only would be a degenerate pass.
