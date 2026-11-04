# SGS-089 spec gate 2

Verdict: READY. Risk `high` confirmed (edits in `lib/aoe4-build-order/simulate.ts`, a criticalPaths file; the owner also instructed high).

Checked against origin/main b9481e3.

## Gate 1 gaps, now closed
1. Callers of `productionSeconds`: Scope now names `startHead` and `houseDemand` (simulate.ts 593, 626, confirmed), puts the guard in `productionSeconds`, and says it also fires from `houseDemand` when auto houses are planned. A new test pair (autoHouses true throws, false returns) fails if the guard moves to `startHead` only.
2. Hang row runs with autoHouses true and false.
3. Base facts re-verified on b9481e3. `at.rally!` is at simulate.ts line 343, the doc sentence is at docs/aoe4-build-order.md line 276, and the supply-wait test is at simulate.test.ts line 491.
4. Notes from gate 1 taken: `mill` is named and the base is "origin/main at the commit the branch is cut from".

## Checks
1. Grounded: `productionSeconds`, `startHead`, `houseDemand`, `spawnUnit`, `withHandler` (test-helpers.ts 80), the "follows the villager production time" and "follows a productionSpeed effect" tests, and the research.test.ts zero-time test (line 233) all exist. The CivRules table is in the docs (line 984) and `productionModifier` is in civ-rules.ts line 14.
2. Testable: each criterion has an observable result (exact message, `unitsProduced` empty, `cmp` of shipped-build output, a mutation that must fail the new test). Pinned values are inputs, not stale counts. No existing test asserts the absent behavior, because the guard only throws on input that hangs or errors today, and `research.test.ts` stays unedited.
3. Open question: the single `designer` item is about how the API answers a thrown Error. It does not block (see below).
4. Invariants A1, A2, A3 are named and not contradicted. A3 is checked by comparing shipped-build output on both commits.
5. Contracts: no new schema, API field, or exported name. The two error messages are defined in the ticket. No dependency.
6. About 25 LOC and no dependencies. 
7. Diagrams: no new transition, so none needed.
8. Lessons: only the Playwright lesson exists, and it does not apply.
9. Decisions: nothing in CONTEXT.md contradicts the ticket.
10. On merge: none is correct, since no command, harness or design doc is added.
11. Risk: high, matching the criticalPaths file. Not understated.
12. Docs: the rally sentence and the CivRules `productionModifier` row are in Scope, with a grep of docs, openapi.json and civ-rules.ts for other sentences.
13. Input validation: no trust-boundary input is added.

## Does the designer open question block?
No. It is about edge behavior only. The API (`pages/api/aoe4-build-order/simulate.ts`) has no try/catch around `simulateBuildOrder`, so an uncaught Error becomes Next's default 500. Validated requests cannot reach either guard, since an English order needs `start.rally` and the shipped data has no zero-time unit. The ticket says to leave the API as is meanwhile. Whether a bad hook should give a 400 or a warning is a separate later decision and is not on the main path.

## Notes (non-blocking)
- `productionSpeed` multiply 0 on a villager with `costs.time` > 0 gives `Infinity`. If an implementer sets time to 0 in the same edit, the result is `NaN`, not `Infinity`. The ticket row only edits the effect, so it is fine.
- The `waitingOn: 'population'` mutation check and the `houseDemand` mutation check both need a throwaway worktree. The ticket already requires the implementer to record both.
