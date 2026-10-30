# SGS-010 re-spec

Input: reports/SGS-010-spec-gate.md (NEEDS_SPEC, mutation criterion unfalsifiable). Adopted the gate's option b.

## What changed (tickets/SGS-010-malformed-json-test-wrong-path.md)

- Context: explains that status 400 + `expectNoBattle` is also satisfied by the handler's `{"error":"request body must be a JSON object"}` 400 (`pages/api/fight.ts` line 67/111 at 96d2602), so a Buffer body alone does not make the test discriminate.
- Scope (respec 1): add `expect(await response.text()).not.toContain('request body must be a JSON object')`; states this negative assertion is allowed and is distinct from the forbidden exact `Invalid JSON` assertion, which stays owned by `acceptance/fight-api-contract.spec.ts`. Suggested comment wording from the gate folded in.
- Criteria (respec 1): new criterion for the negative assertion; mutation check now names `export const config = { api: { bodyParser: false } }` in `pages/api/fight.ts`, expects failure on the negative assertion, plus a second check that the old string body fails the new assertion. Implementer reports both.
- LOC estimate: about 5 test lines. Risk, On merge, Depends on unchanged.
- Appended `## Re-spec 2026-10-29`.

## Open questions

None.
