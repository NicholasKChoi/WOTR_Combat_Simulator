# SGS-100 spec gate 2

**Verdict: READY**

Checked: the re-specced ticket against `design/M6.md` (auto-run table rows 522-549, C6, module table), the gate-1 report, the re-spec report, and `pages/apps/aoe4-build-order.tsx` on main. Main still has the module-private `postSimulation` (line 59) and `errorMessages` (line 68), and `components/apps/aoe4-build-order/` has no `auto-run.ts` or `simulate-client.ts`, so "new" is right.

## Earlier gaps

1. Rule 4 and an in-flight request: closed. Scope and the design now say rule 4 aborts any in-flight request, as a guard.
2. `rejectedKey` lifetime: closed. Scope picks one rule: `rejectedKey`, `serverIssues` and `omittedIssues` are set together by a readable 400 and cleared together by every transition that is not `rejected`. Both samples are in Scope and in the criteria as cases (a) and (b).
3. Staleness after the body read: closed. Scope checks again after each body read, and a criterion covers edit and dispose for both a 200 and a 400 body.
4. Smaller points: closed. Create never calls `onChange` (design row 526 matches, with a criterion). "Exactly" is dropped from the export line. An `AbortError` from the latest request that the controller did not cause is `failed`, with a criterion.

## Rule 4 in-flight case: the drop is correct (confirmed)

Rule 4 matches only when the settled key equals `rejectedKey`. `rejectedKey` is set only by a readable 400, which also clears `inflightKey`. It is cleared by every transition whose status is not `rejected`: rules 1, 3 and 5, a 200, a failure, and retry. A request goes in flight only through rule 5, and rule 5 clears `rejectedKey`. Rule 2 never changes state. A 400 for a stale request is dropped before it can set `rejectedKey`. So whenever `rejectedKey` is set, status is `rejected` and nothing is in flight; the gate-1 case (K1 rejected, K2 in flight, back to K1) cannot happen. If K2 is in flight, K1 is no longer `rejectedKey`, and rule 5 re-POSTs K1 and aborts K2. My gate-1 gap 1 was right on the then-current design. The pass-4 `rejectedKey` lifetime rule makes it unreachable, so a guard with no test is acceptable. Scope and the design say it is a guard.

## Other checks

- Grounded scope: pass. `SIM_INPUT_BOUNDS`, `outOfRange` and `SimulateRequest` were verified at gate 1; `postSimulation` and `errorMessages` and their call sites are as the ticket describes. The page's 400 with an unreadable body gives `(HTTP 400)`, which `simulationFailureMessage(400)` keeps.
- Testable criteria: pass. Each has an observable outcome and a break-caught line. The numbers 60, 3600 and 500 are design constants. The criteria read the bounds from `SIM_INPUT_BOUNDS`. No closed lists, line numbers or match counts. Existing tests: none changes, since page behavior is preserved, and the criterion says so.
- Open questions: none.
- Invariants: S3 and A3 named. No contradiction.
- Contracts: names and shapes match C6, the auto-run table and the module table. No dependency.
- Size: about 220 lines of business logic, under 400.
- Diagram: present. Rule 4 has no "abort" edge, which fits the guard.
- Lessons: nothing in either LESSONS.md predicts a failure here.
- Decisions: pass.
- On merge: `none` is right.
- Risk: `high` is right, since the rule order and seq handling decide which result shows.
- Docs: Scope greps and conditionally updates ARCHITECTURE. Gate 1 confirmed it has no per-file entries for this directory.
- Input validation: `readRejection` is the existing hand check on our own route's 400 body (two fields), moved as is. It is not a new boundary.

## Notes (non-blocking)

- The `rejectedKey` lifetime criterion names rules 1/3/5 in "Breaks caught" but its two cases cover a failure (a) and rule 4 (b). Rules 1 and 3 after a 400 are not exercised. The rule 5 ordering table (rows include a rejected key) could add one row for key equal to `resultRequestKey` and `rejectedKey`; the criterion already lists it, so the implementer may cover clearing there.
- The failure-rows criterion pairs "null" with the rejection and the unreadable 200, and `simulationFailureMessage(status)` with "the statuses". A 400 with a non-JSON body or `issues: []` should give `(HTTP 400)`; the implementer will infer this from the page's current behavior, so this is not a gap.
- The create-held criterion says `getState()` "already holds the fired state" for held and not held; for held that is the `loading` state. Harmless.
