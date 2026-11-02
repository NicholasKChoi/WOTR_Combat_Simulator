# SGS-042 spec gate 2

Verdict: READY

Both gate-1 gaps are closed.
1. Stale "empty today" claim: items 8 and 10 reword SGS-037's sentence in docs and OpenAPI. Criterion "No stale empty claim" greps for it. SGS-037 does introduce the phrase (its Outputs bullet and a criterion), so the grep is meaningful.
2. Dependencies: SGS-038 and SGS-041 are now in Depends-on. Item 2 gives the merged-tree meaning: research `prerequisite` is no producing instance or `researchEntry` undefined (SGS-041 returns a bare `{ started: false }` for undefined and leaves the reason to this ticket); `move` returns `villagers` only for a numeric count; the villagers check uses `availableAt`. Line cites are anchored by function name. Item 7 merges `step-stuck` before SGS-038's single `sortWarnings` call.

Contracts checked against design/M3.md and the dependency tickets:
- `StepWait`, `StepTiming` fields, `StepStart` shape, `accrueWait(engine, stepIndexes, seconds)`, the `step-stuck` message and its sort rule all match.
- `sortWarnings` is in `depletion.ts` (SGS-037) and is called once from `simulate.ts`.
- `formatMinSec` lives in `format-time.ts` (SGS-035).
- The no-handler fallback is `waitingOn: 'prerequisite'`.
Other checks: criteria are observable; open questions: none; invariants A2/A3 fit; risk high is correct (`lib/**` is a criticalPath); diagram present; size ~130 LOC; both LESSONS files are empty; On merge: none is right; docs and the OpenAPI examples, the contract spec and the existing `toEqual` fixtures are in scope.

Notes (non-blocking)
- Item 5 says "the cursor step when it is armed", while design/M3.md says the main loop also charges armed reactions. Item 5 and the criterion deliberately leave the reaction call to SGS-039. Make sure SGS-039's ticket states that it adds the call site.
- The docs lines near "waits until it is affordable and supply allows it" (docs/aoe4-build-order.md ~38 and ~143) could link to the new reasons table.
