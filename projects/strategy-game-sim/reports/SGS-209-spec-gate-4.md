# SGS-209 spec gate 4

Verdict: READY

Read at origin/main (fetched). Depends on: none. ticket-lint printed no errors or warnings.

Both gaps from spec-gate-2 are closed:

- The existing-tests rule now keys on the id route's `Allow` list, the 405 message, and `PATCH` being disallowed. At base, `named-builds-routes.test.ts` lines 242-263 (the PATCH 405 table and the DELETE-in-production test), `aoe4-named-builds-api.spec.ts` line 90, and the contract spec lines 150-154 (`request.patch`, `patchOnId`) all depend on that, and each is named. A search for `GET, PUT`, `GET or PUT`, `patchOnId` and `PATCH` across acceptance, docs, lib, components and ARCHITECTURE.md found no other pinning test or doc. `fight-api-validation.spec.ts` and `aoe4-simulate-api-edges.spec.ts` are other routes.
- The format-doc write-budget bullet, the 429 budget descriptions, the rename's check order, and the 413 handling are all in Scope. The `[id].ts` `bodyParser` `sizeLimit` is `128kb`, so the framework-only 413 claim holds. The contract spec's example loop skips responses without JSON content, so a 413 with no content is safe.

Grounding checks that hold at base:

- `updateNamedBuild`'s check order and helpers.
- `disallowedMethod(..., ['GET','PUT'], env)`.
- `SAVED_NAME_MAX_CHARS` = 100.
- Client `isUpdateResponse`, `failureOf` and `saveFailureMessage`.
- Four specs pin 2.6.0.
- Format doc line 288 `Allow: GET, PUT`.
- README line 88.
- ARCHITECTURE.md's route-logic row does not name methods, so it needs no edit.

Design C8 and C9 and the "Rename: server" table agree with the ticket, including the `name: must be a string` message. Risk standard is right: no `criticalPaths` symbol is touched, and the input is one field. Open questions: none.

## Notes (non-blocking)

- The `updateNamedBuild` OpenAPI description (line 2831) says "The budget is the one saveBuild and createNamedBuild use", and the createNamedBuild description (line 2445) names only `saveBuild and updateNamedBuild`. Both are stale once the rename spends the budget. The docs criterion's "only creates, updates and builds saves spend the write budget" wording covers them, but the implementer should grep `openapi.json` for "budget" and not stop at the 429 descriptions.
- The exact order of `Allow` outside production (`GET, PUT, PATCH, DELETE`) falls out of `disallowedMethod` appending `DELETE`. The contract spec compares the OpenAPI examples to the live reply, so a mismatch fails loudly.
