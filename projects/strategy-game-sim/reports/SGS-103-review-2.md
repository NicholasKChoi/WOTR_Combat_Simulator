# SGS-103 review, pass 2 (delta)

Branch `sgs-103-build-routes` @ b04a27c. Delta reviewed: 6e2cd5d..b04a27c (one commit, "Narrow the builds route doc claims and describe the read-back check on save").

**Verdict: APPROVE.**

## Blocking findings

None.

## Required fixes check

| Fix | Result |
|---|---|
| ARCHITECTURE.md:25, last sentence of the "AoE4 route logic" row | Applied verbatim: "The builds route files under `pages/api/aoe4-build-order/builds/` only adapt `req` and `res`: they call these functions and `sendReply`." |
| openapi.json `SaveBuildRequest.properties.buildOrder.description` (line 4254) | Applied verbatim |
| openapi.json saveBuild operation description (line 1862), the validation clause | Applied verbatim; the rest of the description is unchanged |

Nothing else changed: the diff is 2 files, 3 lines replaced, with no code or test changes. `docs/api/openapi.json` still parses as JSON (`info.version` 2.4.0). No test or doc outside openapi.json quotes the old sentences (git grep). The commit message has no ticket id.

The new text matches the code, as review 1 checked: `checkSaveBuildRequest` runs `roundTripIssues`, and `walkSeconds: 2.5` is rejected (saved-builds.test.ts:211).

## Spec gaps

None.

## Acceptance criteria

All 15 criteria are ticked in the ticket:
- the 14 that review 1 found passing (code, tests and suites are unchanged since then, so that evidence still holds);
- the docs criterion (ARCHITECTURE.md and docs/aoe4-build-order.md carry the Scope item 11 text, and the OpenAPI descriptions now match the code).

## Invariants

The delta is doc text only. S1, S2, S3 and A3 are unaffected and hold as in review 1.

## Bot reconciliation

No `reviewBot.cli` or `rulesFile` is configured.

## Non-blocking notes

The non-blocking notes from review 1 still stand. This text-only rework did not address them, and none of them blocks.

## Coverage

Reviewed the full 6e2cd5d..b04a27c diff: ARCHITECTURE.md and docs/api/openapi.json. Lint, tests and builds were not re-run, because no code, test or config file changed.
