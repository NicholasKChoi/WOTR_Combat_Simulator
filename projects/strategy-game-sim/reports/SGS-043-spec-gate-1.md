# SGS-043 spec gate 1

Verdict: NEEDS_SPEC

Checked against main f078c11, design/M3.md, SGS-035, SGS-037, SGS-054, SGS-048, INVARIANTS, LESSONS (both empty).

## Gaps

1. Risk - understated. Ticket says `standard`. REPO.md `criticalPaths` has `lib/**` (test-only changes excepted), and this ticket changes non-test `lib/aoe4-build-order/simulate.ts` and `model.ts`. The template says any criticalPaths glob means `high`. The "no strongModelTrigger applies" argument in the ticket's comment is irrelevant to the glob. SGS-035 handled the same case as `high`. Fix: set `Risk: high` and replace the comment with the criticalPaths reason. (Not owner-only.)

2. Scope / criteria - OpenAPI example must equal the live response. `acceptance/aoe4-simulate-api-contract.spec.ts` (lines ~205-206) asserts that the real 200 response for each request example `toEqual(okExample)`, and SGS-037 relies on the same test. Scope 3 says only "plausible series of the right length", so an implementer could hand-write numbers that validate but fail the equality test. Fix: say the example's `spent`, `spawnedPopulation` and `populationCapReachedAt` are the exact values the engine returns for that request, copied from a run, and that the contract spec's example-equals-response test passes.

3. Criteria - the required-count check depends on merge order. "`required` length is 10 today, 13 after" holds only if SGS-037 has not landed. SGS-037 adds `depletions` and `warnings` to the same list, and SGS-054 expects 16 in total. The ticket depends only on SGS-035. Fix: either add SGS-037 to Depends-on and state the counts (12 before, 15 after), or reword to "`required` gains exactly `spent`, `spawnedPopulation`, `populationCapReachedAt` (jq set difference against the base branch)". The second form is order-independent.

4. Scope - files that will not compile or pass are not listed.
   - `components/apps/aoe4-build-order/result-series.test.ts` builds a `SimulationResult` literal (line ~17). Three new required fields make `npx tsc --noEmit` fail there, as SGS-037 notes for its own fields. Add it to Scope: the literal gains `spent`, `spawnedPopulation` and `populationCapReachedAt`.
   - The `spent` extra-key and missing-category criterion says "checked in the contract spec", but `acceptance/aoe4-simulate-api-contract.spec.ts` is not in Scope. Add it, along with the unit tests (`simulate.test.ts` or a new file) the criteria imply.

5. Criteria - two are loosely checkable.
   - "Existing ... outputs are unchanged ... existing unit tests pass without edits" conflicts with the test-helpers migration in SGS-035 and with edit 4 above. Rewrite: "no expected value in existing tests changes".
   - "spent ... starts at 0 when nothing is paid at t=0" is fine. Add the observable for the seed: say what happens when a start unit baseId is missing from `data.byBaseId`. Scope uses `byBaseId.get(baseId)[0]` with no fallback. State "skip it, contributes 0" or "throws". The shipped English start has a scout, so this is edge only, but an implementer would guess.

## Checks that passed
- Grounded scope: `spawnUnit` (line 218), `payUnit`, `createEngine` (line 595; population seed at 638), sampling loop (lines 670-690), `docs/aoe4-build-order.md` Outputs (line 499), `propertyNames` form (openapi line 987), `data.base.maxPopCap`, and `SimulationResult.required` (10 entries) all exist as described. `SpendCategory` and `EngineState.spent` come from SGS-035 (Scope item 1 and 2), and names match design/M3.md Contracts and Rules rows "spend" and "population". SGS-035 explicitly leaves the result field to this ticket.
- `SpendCategory` OpenAPI schema is added by no earlier ticket (SGS-035 and SGS-037 do not add it), so adding it here is right. SGS-054 expects it from this ticket.
- Open questions: none, and none in CONTEXT.md bear on this. Decisions agree with the design.
- Invariants A2/A3 named and not contradicted. Size ~45 LOC is fine. Diagram waiver is fine (no trigger fires). On merge: none is right. Docs: Outputs list is in Scope, plus the "only the fields listed before" sentence.
- Dependency SGS-048 reads `spent` and `populationCapReachedAt` with matching names.

## Notes
- Say that `spawnedPopulation` bumps in `spawnUnit` before the `baseId !== VILLAGER` early return (the line numbers imply it, but a villager-only placement is an easy slip).
- Consider a one-line criterion that the cap-time check also runs on the seed in `createEngine` (criterion 8 already covers the result).
