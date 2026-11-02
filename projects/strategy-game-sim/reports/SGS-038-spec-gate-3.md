# SGS-038 spec gate 3

Verdict: READY

Checked against origin/main 2049e95 and branch sgs-037-aoe4-node-refs-warnings-depletion-module (7db2324).

## Verified: the added "Tests that must change" block
- acceptance/aoe4-simulate-api-contract.spec.ts:325 has `simInputOverrides: Record<keyof SimInputOverrides, true>` with 7 keys (durationSeconds ... influenceCoverage). SGS-037's branch leaves it at 7 keys (line 378) and adds no nodeAmounts. Adding `nodeAmounts: true` is therefore needed once SGS-038 adds the property. tsc fails otherwise, and the "keys match the schema properties" test (line 367) then compares against the openapi property, which Scope already adds.
- The model.ts exports test (data.acceptance.test.ts:310) matches `export type|interface` names plus `export const|function|class|enum`. SGS-037 adds 8 types and 6 runtime exports. The SGS-037 ticket (lines 56-57, 87) owns updating that test (19 to 27 types and the new runtime list). On the SGS-037 branch the test file is not yet changed, because the implementer is still working there. SGS-038's claim holds if SGS-037 lands that update.
- SGS-038 adds no model.ts export. It only widens existing field types: BuildStep node fields, move.count, SimInputs.nodeAmounts and BuildStart. Nothing in the ticket body implies a new exported type or const, so the test stays unchanged.
- SimInputOverrides.nodeAmounts is in api.ts, not model.ts, so it does not touch that test.

## Whole-ticket re-check
No new gaps on any of the 12 checks.
- Open questions: none.
- Invariants: A1, A2, A3 and S3 are named.
- The `simulate.ts` mutation-grep criterion (5 lines on main, at most 2 after) verifies: 5 lines at 211, 283, 306, 328 and 332.
- Docs: "never runs out" appears once at docs line 25, as the criterion says.
- Risk is high, which fits the triggers.
- On merge: none. The ticket adds no command or harness, so this is fine.

## Notes (non-blocking, stale references)
- The fallback-tie reference `simulate.ts:499` over "GATHER_NODE_ORDER" is wrong on 2049e95. The first-wins `reduce` with `>` is at simulate.ts:460 and iterates `GATHER_NODES`. `GATHER_NODE_ORDER` does not exist, and line 499 is `nodeRate`. The behavior rule (first wins on ties, in `NODE_REFS` order) is explicit, so an implementer will not guess wrong. Fix the pointer anyway.
- validate.ts line cites are off by 1 to 2 on 2049e95. The unknown-id message is at 272 (cited 271), `start.rally` at 204 (cited 202) and `start.villagers` at 228 (cited 226). The message strings quoted are correct.
- Scope says "Line numbers refer to main f078c11". The current base is 2049e95. The docs "Out: resource depletion" line is 325 (cited 323).
