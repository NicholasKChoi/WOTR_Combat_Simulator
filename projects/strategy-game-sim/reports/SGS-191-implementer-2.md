# SGS-191 implementer 2 (Rework 1)

- Ticket: SGS-191; branch sgs-191-unit-line-data; tip f58419cbaf6612ed8194152f93012f9deca9ad0d (was 601b81d); checkout /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-191-unit-line-data
- Checkout call: reused, tip unchanged (601b81d), so no own-commit check needed.

## Files touched
- acceptance/aoe4-simulate-api-contract.spec.ts: `optional` map in the response-schemas test gains `ChartMarker: ['unit']`. Nothing else changed.
- Ticket Rework 1 checklist ticked.

## Tests
- Playwright: contract, markers, veterancy-conversion, research and unit-lines specs, 92 passed, 0 failed (includes the previously failing "response-side schemas are closed..." test).
- No unit test or production code changed; no mutation checks apply (the edit is a spec fixture map entry; dropping it reproduces the reported failure).
- Doc claims: none added. Pre-existing tests edited: only the one `optional` map above, allowed by the Rework 1 checklist.
- Codegen: not set. Build and lint not rerun: one-line change in a spec file, no signature change.
- Invariants: no change.
- Unverified assumptions added: none. Out-of-scope findings: none.

Status: needs_review
