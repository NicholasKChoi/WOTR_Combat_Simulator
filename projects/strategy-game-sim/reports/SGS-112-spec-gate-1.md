# SGS-112 spec-readiness gate, round 1

Read at `origin/main` after `git fetch origin`. Ticket has no Depends-on. Files checked: api-route.ts, api.ts, saved-builds.ts, build-store.ts, blob-build-store.ts, save-rate-limit.ts, builds-routes.ts, the three page routes, playwright.config.ts, build-store.test.ts, builds-routes.test.ts, build-store.acceptance.test.ts, acceptance/aoe4-builds-api-contract.spec.ts, ARCHITECTURE.md, docs/aoe4-build-order.md, design/M8.md C2/C3/Debt.

## Verdict: NEEDS_SPEC

The scope is well grounded and matches design C2/C3. Two tests the ticket does not scope will break, and one criterion contradicts Scope. All three are cheap fixes and none needs the owner.

## Gaps

1. **Criteria / OpenAPI - criterion contradicts Scope; an unlisted spec fails.**
   `acceptance/aoe4-builds-api-contract.spec.ts:42` pins the response keys: `expect(keys(save.responses)).toEqual(['200','201','400','405','413','429','503'])`. Line 182-183 checks the 503 and GET-500 examples against `BuildsError`. Scope adds a `500` to `saveBuild`, so line 42 fails. The OpenAPI criterion says "every existing contract spec ... still passes", and Scope says the contract specs pin the version and path set. Both are true only if that spec is edited, and the ticket does not name it. An implementer would either guess or leave it red.
   Fix: add to Scope "`acceptance/aoe4-builds-api-contract.spec.ts`: the `saveBuild` response-key list gains `'500'`, and the example-validation test also validates the new 500 example as `BuildsError`." Reword the criterion to "passes after that edit". Also reword "Update the 500 description only": `saveBuild` has no 500 today, so say "add".

2. **Tests to update - a closed export list is not covered by the rule.**
   `lib/aoe4-build-order/build-store.acceptance.test.ts:27` asserts `Object.keys(buildStoreModule).sort()` equals exactly `BUILDS_LOCAL_DIR_DEFAULT, buildStoreFromEnv, createFileBuildStore, createMemoryBuildStore`. Exporting `nextCounter` (required) breaks it. The ticket's "Tests to update" rule only covers tests that call `bumpCounter` or `takeSaveSlot` or stub a `BuildStore`. Its `takeSaveSlot` test (lines 36-47) also needs no change, but the rule should say so.
   Fix: add the rule "a test that pins a module's export list gets the new export (`nextCounter` in `build-store.ts`), and `build-store.acceptance.test.ts` is one". Name the file.

3. **Docs - the reply table in `docs/aoe4-build-order.md` is missing the new status.**
   The Scope grep list is `VERCEL_ENV`, `bumpCounter`, `rate`, `503`. The saveBuild reply table (about line 1043-1050) lists 201, 200, 400, 413, 429 and 503 but no 500, so it becomes untrue the moment `saveBuild` can answer 500. Lines 712-720 ("`DELETE` exists outside production only", the rate-limit bullets) also need the fail-closed and refused-writes-nothing statements checked.
   Fix: Scope names that table and adds a 500 row ("the build id could not be created", try again later), and adds `500` to the grep terms.

## Notes (non-blocking)

- The `deploymentEnv` test rows in the criteria name no file. design/M8.md maps them to `build-store.test.ts`, but the function lives in `saved-builds.ts` and `saved-builds.test.ts` exists. Pick one in the ticket.
- Scope says `saveBuildReply`/`savedBuildReply` return the "saved-build-with-id body" union, but no named type exists. Say `SavedBuild & { id: string }` (or an inline type) so the implementer does not invent an exported name.
- `sendReply<Body>` inference with a `NextApiResponse<Union>` and a narrower `RouteReply<BuildsError>` from `methodNotAllowed` is the likely place `tsc` needs an explicit type argument. Allow explicit `sendReply<...>` in the handlers if inference fails.
- Risk `high` is right (BuildStore.bumpCounter signature, the RouteReply/sendReply contracts, and a new 500 on the public API). Invariants S3 is named correctly. Diagram present. On merge `none` is valid. LOC about 200 is OK.
- The grep criteria hold in the end state. `MAX_REPORTED_ISSUES` appears at origin/main only in `api.ts`, `saved-builds.ts` and `simulate.ts`, and `count + 1` only in `build-store.ts` and `blob-build-store.ts`, so the single-implementation searches are achievable. `api-route.ts` gaining a value import from `api.ts` creates no runtime cycle, because `api.ts` re-exports from `saved-builds` with `export type`.
- The M8.7 test-debt claims are real: `build-store.test.ts:141-145` assert `blobFactory.imported` not called, and `builds-routes.test.ts:102` uses `JSON.stringify(error.mock.calls)`. `acceptance/aoe4-builds-api.spec.ts:46-47` uses `toMatchObject`. Lesson check: no LESSONS.md entry (repo or project) predicts a failure here.
