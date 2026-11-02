# SGS-037 implementer pass 2 (re-spec 2)

- Ticket: SGS-037-aoe4-node-refs-warnings-depletion-module
- Branch: sgs-037-aoe4-node-refs-warnings-depletion-module
- Tip SHA: 279bcf9c8d849229d8f4be03e0fe018a539a7da6. This is a new commit on 7db2324; nothing was amended. Base is origin/main 2049e95.
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-037-aoe4-node-refs-warnings-depletion-module
- Status: **needs_review**

## Work this pass

Pass 1's production code, new tests, openapi and docs are unchanged. This pass made only the two test edits that re-spec 2 adds.

## Files touched (this commit)

- `lib/aoe4-build-order/data.acceptance.test.ts`: the export-list test is renamed to "model.ts exports exactly the 27 documented types and the shared lists".
  - The 8 new type names are added to the sorted list (27 names; I checked the list is sorted).
  - The runtime-export list is set to `['GATHER_NODES', 'RESOURCE_KINDS', 'FINITE_GATHER_NODES', 'MAX_DEPOSITS', 'NODE_REFS', 'FINITE_NODE_REFS', 'nodeKindOf', 'SEVERITIES']`.
  - The `effects-unmodeled` and `walkSeconds` assertions are kept.
- `acceptance/aoe4-simulate-api-edges.spec.ts`: in "result shape" > "a villager-only order returns every result field, aligned to the times axis", the pinned key list gains `depletions` and `warnings`. No other assertion changed.

All 12 files in the branch diff against 2049e95 are named by the ticket. The build and test runs left no stray changes.

## Pre-existing tests edited (this pass)

- `lib/aoe4-build-order/data.acceptance.test.ts`: "model.ts exports exactly the 27 documented types and the shared lists". The rename, the type list and the runtime list are as described above. Allowed by the ticket's "Tests that must change" (re-spec 2).
- `acceptance/aoe4-simulate-api-edges.spec.ts`: "a villager-only order returns every result field...". The key list gained `depletions` and `warnings`. Allowed by "Tests that must change" (re-spec 2).
- The pass 1 edits stand: the `result-series.test.ts` literal and the contract spec. See SGS-037-implementer-1.md.

## Tests run (Node v24.22.2)

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones, exit 0.
- `npm test` (full Vitest suite): 31 files, **734 passed, 0 failed**.
- `npm run acceptance` (full Playwright suite): **362 passed, 0 failed**.
- `npx next build`: exit 0.
- `git grep -nE "1e-|EPSILON" lib/aoe4-build-order/depletion.ts` finds nothing.

## Mutation checks (each one restored, then verified with cmp)

- **Sort** (re-spec 2 mutation): replaced `FINITE_NODE_REFS.indexOf(warning.node)` with `FINITE_GATHER_NODES.indexOf` in `sortWarnings`. This fails "sortWarnings > orders by at, then node warnings by ref and code, then step-stuck by step" (1 failed, 19 passed). Restored.
- **Clamp**: replaced `Math.min(wanted, entry.remaining)` with `wanted` in `drawDown`. This fails "never takes a ref below 0 and returns only what was there". Restored.
- **Severity**: changed `idle > 0 ? 'warning'` to `idle >= 0`. This fails "words run-outs by id and sets warning severity only when villagers are left idle". Restored.
- **Export-list test**: un-exporting `SEVERITIES` fails it, and so does un-exporting the type `StepWait`. Restored.
- **Edges spec**: deleting `warnings: sortWarnings([])` from the `simulate.ts` result fails "a villager-only order returns every result field" in Playwright. Restored.

## Invariant check

- A1: no node amounts appear in code.
- A2: the clamp holds, and the mutation proves it.
- A3: the stock functions are pure.
- S3: `MAX_DEPOSITS` bounds the deposit refs.

All four are unchanged from pass 1 and upheld.

## Processes

Playwright's webServer started and stopped its own `next dev`. No port in 3100-3999 is left listening.

## Out-of-scope findings

None new.
