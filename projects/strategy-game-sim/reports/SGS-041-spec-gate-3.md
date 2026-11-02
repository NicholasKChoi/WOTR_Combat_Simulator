# SGS-041 spec gate 3

Verdict: READY

Checked the whole ticket again, plus the new "Tests that must change" block against origin/main 2049e95 and branch sgs-037-aoe4-node-refs-warnings-depletion-module.

## Verification of the added claim
- `acceptance/aoe4-simulate-api-contract.spec.ts` line 351 on main is `const buildOrderNote: Record<keyof BuildOrderNote, true> = { code, message, step, tech, properties }`. Once `BuildOrderNote.severity` exists, tsc fails until `severity: true` is added. Confirmed.
- The "keys match the schema properties" test compares `keys(literal)` with `keys(schemas[name].properties)` (the `keys` helper is at line 50). It passes once the literal and the OpenAPI `BuildOrderNote.properties` both gain `severity`. Confirmed.
- SGS-037's branch edits this spec at other hunks only (imports, RESPONSE_SCHEMAS and SHARED_SCHEMAS, new describe blocks, the SimulationResult literal). It does not touch the `buildOrderNote` line, so there is no overlap or conflict with the SGS-041 edit. It adds `Severity` to SHARED_SCHEMAS and to `openapi.json` (enum error, warning, info), which is what Scope item 6 `$ref`s.
- SGS-037 adds `export type Severity` and `export const SEVERITIES` to `model.ts`. SGS-041 adds no model.ts export, so the 27-type / runtime-export list in `data.acceptance.test.ts` stays as SGS-037 leaves it. SGS-037's ticket itself lists that test under its own changes (line 57 and criterion at line 87). Note: the SGS-037 branch as pushed has not yet changed `data.acceptance.test.ts`. That is SGS-037's open work, not an SGS-041 gap.
- Other tests that touch notes need no change. `aoe4-simulate-api-edges.spec.ts:65` uses `objectContaining`. `research.test.ts:375` and `research.acceptance.test.ts:284` map to `{code, step, tech, properties}`, so the added `severity` does not break them. The only message assertions are `research.test.ts` 383-385, which Scope item 8 already covers. No other `BuildOrderNote` literal exists in `.ts` or `.tsx` outside `research.ts`.

## Checklist
1. Grounded scope: yes. `research.ts`, `effects.ts`, `model.ts`, `simulate.ts` and the tests exist, or are new, as stated.
2. Testable criteria: yes. Grep criteria hold in the end state, since `researchNotes` keeps the one `[0]` match. The existing-test rule is stated in "Tests that must change".
3. Open questions: none.
4. Invariants: A1, A2 and A3 are named and not contradicted.
5. Contracts: `Severity` matches SGS-037 and `researchEntry` matches the design.
6. Dependencies and size: SGS-037 is stated, about 60 LOC.
7. Diagrams: not triggered, and the ticket says so.
8. Lessons: no conflict found.
9. Decisions: the lowest-age note pick is consistent with the design.
10. On merge: none, correct.
11. Risk: high, justified by the public schema change.
12. Docs: openapi.json and docs/aoe4-build-order.md are in Scope.

## Gaps
None.

## Notes
- SGS-037's branch tip does not yet include its `data.acceptance.test.ts` update. Make sure SGS-037 lands it before SGS-041 starts, or SGS-041's run will fail that test through no fault of its own.
