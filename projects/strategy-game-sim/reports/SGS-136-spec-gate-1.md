# SGS-136 spec gate 1

Verdict: READY

Read at origin/main (SGS-128 is a draft test-and-lint ticket with no code the scope depends on; nothing integrated or branched).

## Checked and found sound
- Grounded scope: `simulateBuildOrder` sampling loop, `addBuildingInstance` (increments `state.buildings` only on completion, line ~446 in `simulate.ts`; starting buildings added in `createEngine`), `model.ts` `SimulationResult`, `data.byBaseId` (age-sorted), `test-helpers.ts` (`ENGLISH`, `buildOrder`, `inputsFor`), `acceptance/openapi-schemas.ts` (reads openapi.json via Ajv, so it follows automatically), and `docs/aoe4-build-order.md` Outputs list (line ~760) all exist as described.
- Version pins at 2.5.0 exist in `aoe4-builds-api-contract`, `aoe4-gathered-resources`, `aoe4-named-builds-api-contract` and `aoe4-simulate-api-issue-shape` specs, as the ticket says; two response examples in openapi.json carry `unitsProduced`.
- Contracts match design/M9.md C9; sort and tie-break rules, name rule and no-series rule match the design Behavior rules. Criteria state rules, not counts. Risk high is right (critical path `simulateBuildOrder` gains a result field). Invariants A1/A3 apply. No open questions, no throwaway overlap with other open tickets (SGS-137 only reads the field).
- Unverified assumptions none is acceptable: pure in-repo computation, no external service.

## Notes (non-blocking)
- `acceptance/aoe4-simulate-api-contract.spec.ts` also has a `typeKeys` table (`UnitSeries: unitSeries`, etc.) that asserts each type's keys equal the schema properties. A `BuildingSeries` key literal and a `typeKeys` row should be added there, parallel to `unitSeries`; the Scope names only the `SimulationResult` key list. Ajv validation with `additionalProperties: false` covers the response anyway, so an implementer who follows the `UnitSeries` precedent will get it right.
- The nearest simulate series test file is `lib/aoe4-build-order/simulate-series.test.ts`; the ticket's "or the nearest" wording allows it.
- `docs/aoe4-build-order.md` line ~971 table (chart legend names per series) lists only the existing views; leave it, since the view ticket (SGS-137) owns it.
