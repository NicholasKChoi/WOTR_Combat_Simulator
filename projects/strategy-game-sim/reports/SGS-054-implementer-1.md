# SGS-054 implementer report 1

Branch sgs-054-aoe4-m3-docs-openapi-audit, worktree .claude/code-factory/worktrees/sgs-054-aoe4-m3-docs-openapi-audit, base origin/main d90d91a. Tip SHA in the handback message. Status: needs_review.

## Files
- docs/aoe4-build-order.md: audit fixes and the cross-cutting sections (below).
- acceptance/fight-api-spec-surface.spec.ts: AOE4_SCHEMA_NAMES (27), name-equality test (36 names), every-schema-referenced test.
- docs/api/openapi.json: no change. Audit found it already complete (36 schemas, names equal; SimulationResult.required has 16; ResourceKind referenced; NodeRef/FiniteNodeRef/spent/nodeAmounts references landed; reaction on all six BuildStep variants; move.count integer or all; no stale "neither time nor villagers"). The single 200 example is tied to the request examples (spec asserts they return it), so it keeps empty warnings/markers; deposit ref, reaction, warning and marker are covered by descriptions.

## Doc changes
Purpose and model (result description, combat statement), finite-node bullet; per-key merge now lists nodeAmounts (bounds paragraph and Route); Ordering and triggers points at the wait reasons table; walk "idle" reworded to "walking"; Modeled list and Out line (depletion moved in, combat stats out); new "Node references" (full design table, accepted positions, paste passthrough, message form, trips/houseBuilderSource stay GatherNodeId-keyed); new "Severity" section; "Technologies" combat statement; Issues table (resource in unknown-id, atLeast and deposit range in out-of-range, node-ref invalid), count words "six"/"ten" removed; Outputs (single depletions bullet, marker bullet states age-up from landmark, first match wins; severity pointer; "three graphs" sentence; wait paragraph now agrees with the villagers row for gather-or-idle); prebuilt builds named; Extension points rows. No ticket or milestone ids.

## Tests
- npm test: 1076 passed, 8 skipped (40 files). tsc --noEmit and lint:dup: clean (0 clones).
- npm run acceptance (own port 3871): 548 passed. Contract + spec-surface specs: 99 passed.
- Node-ref spot check via POST on a throwaway next dev (port 3872, stopped): gold#1 invalid, gold#9 and gold#0 out-of-range, wood#2 invalid, iron and iron#2 unknown-id, gold#02 syntax, gold#2 accepted; houseBuilderSource gold#2 unknown-id.
- Severity rows match depletion.ts (idle > 0 ? warning : info; idle-arrival warning), simulate.ts (step-stuck warning), research.ts (info). Marker order matches researchMarkerKind.

## Mutation checks (edited docs/api/openapi.json in the worktree, reverted with git checkout)
- Added a stray schema: name-equality test failed and reference test failed.
- Deleted Severity: name-equality test failed.
- Replaced Trigger bank `resource` $ref (the only ResourceKind ref): reference test failed.
All reverted; none committed.

## Pre-existing tests edited
None.

## Invariants
A1 (doc names base.json amounts as owner-supplied, unverified), A2, A3 statements unchanged and true. No engine change.

## BACKLOG items handled
nodeAmounts merge sentence, "idle" ambiguity, Ordering and triggers paragraph: done in this commit.

## Out-of-scope findings
- openapi.json Severity description says "No result item is error today" (fine, left as is).
- Single 200 example shows no warnings/markers/deposit; adding richer examples would need a second 200 example the contract spec could verify.
