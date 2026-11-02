# SGS-037 ticket report (ticket author, run 1)

File: projects/strategy-game-sim/tickets/SGS-037-aoe4-node-refs-warnings-depletion-module.md (new, outline C)

Summary: Adds the M3 node-ref types and consts (FiniteGatherNodeId, FINITE_GATHER_NODES, MAX_DEPOSITS, DepositRef, NodeRef, FiniteNodeRef, NODE_REFS, FINITE_NODE_REFS, nodeKindOf, Severity, SEVERITIES, StepWait, NodeDepletion, SimWarning), a new pure depletion.ts (NodeStock, runRefs, createNodeStock, drawDown, nextRunOut, isDepleted, depletionResults, the one warnings sort), and empty `depletions`/`warnings` result fields with OpenAPI schemas, contract-spec and doc updates. Component aoe4-build-order, ~185 business-logic lines, depends on SGS-035. 14 acceptance criteria cover ordering/length of every list, stock math rows (start at 0, clamp, tolerance, null, independent deposits), run-out time, severity rule, sort ties, empty fields, OpenAPI enums vs TS consts, docs, mutation checks.

Risk: high (outline said low). REPO.md criticalPaths `lib/**` applies and the template makes any critical-path glob high. Otherwise small; names are all design names.

Diagrams: none (single component, loop untouched; one-line sentence used).

Owner-approved answers applied: (1) spend totals stay in A (only referenced); (6) empty fields; (8) C updates its own Outputs doc section; others not relevant to C.

Open questions (both designer, both affect SGS-038 and SGS-039):
1. depletion.ts has no listed function to record a mid-run run-out (depletedAt + end-of-instant idle count) or an idle arrival, but depletionResults must report both and SGS-038 only calls depletionResults. Proposed: recordRunOut(stock, ref, at, idleVillagers), recordIdleArrival(stock, ref, at, count).
2. Design names no function for the warnings sort. Proposed: sortWarnings in depletion.ts.

Other notes:
- createNodeStock(refs, inputs) types `inputs` structurally as { nodeAmounts } so SimInputs.nodeAmounts (D) satisfies it; C does not touch SimInputs.
- runRefs filters node strings against FINITE_NODE_REFS, so D's widening needs no change; E adds the depleted-trigger read. A test uses one `as unknown as BuildOrder` cast to inject deposits.
- acceptance/aoe4-simulate-api-contract.spec.ts: the "response-side closed" loop cannot take a oneOf (SimWarning); ticket says assert its variants separately. result-series.test.ts literal needs the two new fields.
- docs/aoe4-build-order.md lines 25, 323, 617 mention no-depletion and stay true; confirmed by grep on main.
- Criteria with commands: the tolerance grep targets a file that does not exist yet (cannot run now); mutation checks target new code, so none could be run at authoring time. The doc grep was run on main.
- Overlap: SGS-038 (D) already written; its scope matches (uses SGS-037 names and "SGS-037's sort stays the only sort"). SGS-035 and SGS-036 not read.
