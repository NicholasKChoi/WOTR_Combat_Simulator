# SGS-054 ticket author report

File: tickets/SGS-054-aoe4-m3-docs-openapi-audit.md (new). Component aoe4-build-order, Risk standard (plan said low; it may edit openapi.json and edits the fight spec-surface spec), ~0 business logic (about 120 lines of doc prose, about 30 lines of spec).
Depends on: SGS-038..051 (as given). On merge: MILESTONES.md M3.9 satisfied once this and SGS-055 merge.

Criteria covered: M3.9 docs and openapi coverage, "combat stats not modeled" statement, marker classification order (single statement, matches markers.ts), contract check, spec-surface name pin (9 fight + 26 AoE4 = 35 schemas), ResourceKind referenced (general every-schema-referenced test).
T owns the prose no ticket owns: node-reference table, severity section, combat statement; audit of everything else (checklist table, stale-phrase list, openapi jq checks).

Values measured on origin/main f078c11: schemas 25, SimulationResult.required 10, ResourceKind refs 0, stale-phrase doc lines 5, stale openapi lines 2, SGS/M-id in doc 0, name-equality (9+16) true via Node script. Not run: Playwright (Node 24 server), mutation checks (test does not exist yet; criterion says to run them in a throwaway worktree).

Diagrams: none required.

Open questions:
1. owner: SGS-036 (omittedIssues) and SGS-053 (M2 wording) are not in Depends on per the plan, yet the audit expects them merged.
2. designer: FiniteGatherNodeId and SpendCategory may end up unreferenced (037 and 043 do not say which schema refers to them); ticket makes them referenced unless told to exempt.

Overlap: edits docs/aoe4-build-order.md and openapi.json that 036-051 also edit (rebase only, last in order). The m:ss formatter and other recorded designer questions left as written.
