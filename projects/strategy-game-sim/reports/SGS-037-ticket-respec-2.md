# SGS-037 re-spec 2

Ticket: tickets/SGS-037-aoe4-node-refs-warnings-depletion-module.md. Trigger: implementer pass 1 returned needs_spec.

- Tests that must change now covers:
  - `data.acceptance.test.ts`, the model.ts export-list test. It is renamed to "27 documented types and the shared lists". The 8 new type names are added. The runtime list is `GATHER_NODES, RESOURCE_KINDS, FINITE_GATHER_NODES, MAX_DEPOSITS, NODE_REFS, FINITE_NODE_REFS, nodeKindOf, SEVERITIES`. Both lists were checked against the model.ts at branch tip 7db2324.
  - `acceptance/aoe4-simulate-api-edges.spec.ts:47-49`, the pinned response key list. It gains `depletions` and `warnings`. Grep found this one; the implementer did not catch it because only the contract spec was run, and it will fail on the branch as built.
- Acceptance criteria:
  - two new criteria, one for each of those tests;
  - the simulate criterion's "unchanged apart from" list now names every changed pre-existing test, and requires the Playwright suite to pass.
- Doc lines are corrected to 25/325/631, verified by git grep on origin/main.
- The sort mutation is replaced. Using `NODE_REFS` gives an equivalent mutant. The new mutation is `FINITE_GATHER_NODES.indexOf`, which the implementer showed fails the sort test.
- Branch work stands. Rework is two test edits plus a full Playwright run.
- Note: the earlier report `SGS-037-ticket-respec-1.md` is from the designer-pass re-spec. This report is therefore filed as respec-2, so that one is not overwritten.
