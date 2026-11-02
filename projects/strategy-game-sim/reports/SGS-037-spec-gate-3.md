# SGS-037 spec gate 3

Verdict: READY

Evidence (branch tip 7db2324, run in its worktree, no edits):
- `npx vitest run lib components`: 729 passed, 1 failed. The one failure is data.acceptance.test.ts "model.ts exports exactly the 19 documented types...".
- `npx playwright test acceptance/aoe4` (5 AoE4 specs): 150 passed, 1 failed. The failure is aoe4-simulate-api-edges.spec.ts:42 key list (extra `depletions`, `warnings`). The contract spec passes on the branch.
- model.ts at tip: 27 `export type|interface` names; runtime exports in source order GATHER_NODES, RESOURCE_KINDS, FINITE_GATHER_NODES, MAX_DEPOSITS, NODE_REFS, FINITE_NODE_REFS, nodeKindOf, SEVERITIES. Matches the ticket's lists exactly.
- Greps for other pins: the only reader of model.ts source is data.acceptance.test.ts:311. The only whole-response key list is edges.spec.ts:47-48 (others use per-field access). The `SimulationResult` literals live in result-series.test.ts (listed) and the contract spec (listed). No snapshots. simulate.test.ts "source shape" pins simulate.ts exports and numeric literals; the change adds an import and no export or literal, and it passes. build-move.acceptance `toEqual(lone)` compares two results that both gain the fields. No schema-count pins in the specs.

Gaps: none. Re-spec 2 closes the two missing test edits, and the sort mutation (FINITE_GATHER_NODES.indexOf) is non-equivalent per the implementer's run.

Notes:
- Leftover: the Playwright run left no listeners (webServer self-managed).
- Out of scope, non-blocking: the full Playwright suite (fight specs) was not run here; they do not touch these schemas.
