# SGS-043 spec gate 3

Verdict: READY

Checked against origin/main 2049e95, branch sgs-037-aoe4-node-refs-warnings-depletion-module (279bcf9), design/M3.md (as in gate 2), both LESSONS.md (empty), CONTEXT/INVARIANTS.

Re-spec 3 delta
- `acceptance/aoe4-simulate-api-edges.spec.ts` "result shape" > "a villager-only order returns every result field..." exists; on main the `Object.keys(body).sort()` list is at lines 47-49 (10 keys). On the SGS-037 branch it already gains `depletions` and `warnings` (reformatted multi-line), so the "edit relative to the base, add three keys, keep others' entries" wording is correct and unambiguous.
- The "only edits to existing test files" criterion now admits that edit and runs `npm run acceptance -- aoe4-simulate-api-edges`. It is consistent with Scope 5.
- No other test pins the full response key set: contract spec `Record<keyof SimulationResult, true>` (Scope 4) and `result-series.test.ts` literal (Scope 5) are the only other full-shape sites; the other acceptance specs use field-level assertions.

Whole-ticket re-check
- Grounded: spawnUnit, createEngine, EngineState.spent (from SGS-035, present on the branch) exist. Gate-2 items still hold.
- Criteria testable; no criterion forbids what Scope adds. Open questions: none. Invariants A2/A3 named. Contracts match design. Size ~50 LOC. Diagram waiver fine. Risk: ticket header says `standard` with a symbol-scoped re-rate note; the changed symbols (spawnUnit, createEngine, the sampling loop inside simulateBuildOrder) change no behavior. Note below.
- Docs in Scope (Scope 7).

Notes (non-blocking)
- Risk is `standard`, while respec 2's change log says "Risk high". The later commit c2243a7 re-rated to standard under symbol-scoped criticalPaths. The sampling loop lives in `simulateBuildOrder`, a listed symbol; the change adds read-only samples and a return field and does not alter step order or wake times, so standard is defensible. The manager should confirm that is the intended reading.
- The Re-spec 2 log text ("Risk high") is stale history only.
- Line numbers in Scope are base numbers and will drift; the ticket already says to use names.
