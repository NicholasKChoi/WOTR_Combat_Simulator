# SGS-103 implementer report 1

Status: needs_review

- Ticket: SGS-103 (builds API routes, OpenAPI 2.4.0, contract check). Pass 1, risk standard.
- Branch: `sgs-103-build-routes`, from local `sgs-101-build-store-and-rate-limit` @ 380e778.
- Tip SHA: `6e2cd5d85c1f44a8db8253a38d8b0bb38d704c31` (one commit, no ticket id in the message).
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-103-build-routes`

## Files touched

New:
- `lib/aoe4-build-order/api-route.ts`: the six exports (`RouteReply`, `ReplyTarget`, `isPlainObject`, `methodNotAllowed`, `notAnObjectError`, `sendReply`); imports `./api` for a type only.
- `lib/aoe4-build-order/english-catalog.ts`: memoized `englishCatalog()`.
- `lib/aoe4-build-order/builds-routes.ts`: `saveBuildReply`, `savedBuildReply` (every row of both tables).
- `pages/api/aoe4-build-order/builds/index.ts`: one `sendReply` call, literal `config` with `sizeLimit: '128kb'`, the only `Date.now()`.
- `pages/api/aoe4-build-order/builds/[id].ts`: one `sendReply` call, env read per request.
- `lib/aoe4-build-order/api-route.test.ts`, `english-catalog.test.ts`, `builds-routes.test.ts`: unit tests.
- `acceptance/aoe4-builds-api.spec.ts` (live rows), `acceptance/aoe4-builds-api-contract.spec.ts` (schemas and examples), `acceptance/openapi-schemas.ts` (shared Ajv loader and `expectValid` or `expectInvalid` for the two new specs).

Edited:
- `pages/api/aoe4-build-order/simulate.ts`: uses `isPlainObject`, `methodNotAllowed`, `notAnObjectError`, `sendReply`, `englishCatalog()`. Still synchronous. `tsc` accepted `NextApiResponse` for `sendReply`, so it is not generic.
- `lib/aoe4-build-order/saved-builds.ts`: private `isPlainObject` and `notAnObjectError` deleted, both imported from `./api-route`.
- `playwright.config.ts`: `webServer.env` is the string-valued `process.env` entries minus `BUILDS_STORE_ID` and `VERCEL_ENV`, plus `BUILDS_LOCAL_DIR` = `<repo>/test-results/builds-local`.
- `docs/api/openapi.json`: 2.3.0 to 2.4.0; the two builds paths; schemas `SaveBuildRequest`, `SaveBuildResponse`, `SavedBuild`, `SavedBuildWithId`, `BuildsError`; named examples; the simulate `buildOrder` 200 example regenerated.
- `docs/aoe4-build-order.md` ("Builds routes" under Route) and `ARCHITECTURE.md` (a "Where files go" row).
- `acceptance/helpers.ts`: `BUILDS_PATH`, `buildPath`, `uniqueClient`, `postBuild`, `postBuildRaw` (both set `x-forwarded-for`; raw also sets `Content-Type: application/json`).

## Pre-existing tests edited

- `acceptance/aoe4-gathered-resources.spec.ts`: title and `expect(spec.info.version)` 2.3.0 to 2.4.0 (ticket item 9, version pin).
- `acceptance/aoe4-simulate-api-issue-shape.spec.ts`: title and version expectation 2.3.0 to 2.4.0 (same).
- `acceptance/fight-api-spec-surface.spec.ts`: path list gains the two builds paths; `AOE4_SCHEMA_NAMES` gains `BuildsError`, `SaveBuildRequest`, `SaveBuildResponse`, `SavedBuild`, `SavedBuildWithId`; test title now "is OpenAPI 3.1 and lists /api/fight, the simulate route and the two builds routes" (item 9).
- `acceptance/aoe4-simulate-api-contract.spec.ts`: the `['goldRunOut']` loop is now `Object.keys(requestExamples)`; the `durationSeconds` bounds locations gain `schemas.SaveBuildRequest.properties.durationSeconds` (item 9). No expected value changed.
- `lib/aoe4-build-order/simulate-api.acceptance.test.ts`: the recording `post` helper became `send(method, body)` and records headers, with `post = (body) => send('POST', body)`. No existing assertion changed; two cases added (GET 405 with `Allow: POST` and the text; `[]` body 400 with the `notAnObjectError()` body). Item 8.

## Tests run

- `npm test`: 56 files, 1698 passed, 10 skipped, 0 failed. New: `api-route.test.ts` 15, `english-catalog.test.ts` 2, `builds-routes.test.ts` 39, plus 2 added to the simulate acceptance test.
- Invariants encoded: the 405 and not-an-object bodies are byte-identical to the old simulate ones; `sendReply` sets status, then headers, then exactly one of `json` or `end`; invalid bodies (400 and 413) call neither the store getter nor `bumpCounter`, and 31 invalid bodies then a valid one give 201; the rate check runs before the put (429 means no put); 30 saves pass and the 31st gets 429 with `Retry-After` from `takeSaveSlot` (3600 at window start, 1800 half an hour in, 1 when contended); a repeat save returns 200, keeps the stored value and takes a slot; production `DELETE` gives 405 with `Allow: GET` and deletes nothing; malformed, array and missing ids give 404 with no getter call; getter rejection or store throw gives 503 (not 500, not a rejected promise) and is logged once; a stored `{ version: 2 }` gives 500; GET 200 is the record plus `id` with the immutable `Cache-Control`; DELETE gives 204 with `end` and no `json`.
- `npm run acceptance` (full): 750 passed, 3 failed under parallel load: `aoe4-build-order-client-check.spec.ts:37`, `:62` and `aoe4-build-order-pin-compare.spec.ts:508`. These are page-UI tests (a 5 s `toHaveCount` timeout on `chart-step-band` in one) unrelated to the routes. I reran both files alone and all 49 passed, so I treat them as load flakes. I did not run them on the base branch to confirm they were flaky there.
- The new specs alone: `aoe4-builds-api.spec.ts` (14) and `aoe4-builds-api-contract.spec.ts` (22) all pass.
- After the acceptance run, `git status` was clean and no `.builds-local/` existed; builds went to `test-results/builds-local`.

## Stale simulate example (owner Q17 A)

- Before regeneration: `npx playwright test acceptance/aoe4-simulate-api-contract.spec.ts -g 'request example returns'` gave 1 failed (`the buildOrder request example returns the documented 200 body`, diffs in `gathered`, `unitsProduced` and others) and 1 passed (`goldRunOut`).
- After: the full acceptance run passes that test.
- How the value was produced: a temporary Vitest scratch test (deleted, not committed) called the real simulate `handler` with the `buildOrder` request example and wrote its JSON body; the whole documented value was replaced with it (via a Python script that rewrites the file at 2-space indent, round-trip checked identical on the untouched file). This is the same engine call, not a live `next dev` response; the live test then compares the documented value to the live response.

## Pinned outputs and OpenAPI example values

- Ids and byte counts in the examples came from the real reply functions (scratch test, as above) and are verified by the contract spec against the live routes: save example id `Mp3W3nzWigC`; the 413 text `saved build: 90345 bytes, more than 65536` for the order with a `source` of 30000 euro signs; the unknown-unit 400 carries `suggestion: knight`.

## Doc claims

- `docs/aoe4-build-order.md`: "`DELETE` exists outside production only; in production the route answers it with 405." True per `savedBuildReply` (`canDelete = deps.env !== 'production'`, tested).
- Same file: "A repeat save still takes a rate-limit slot." True: `takeSaveSlot` runs before `putBuild` (tested: 30 repeats then 31st 429).
- Same file: "The 400 and 413 checks need no storage and run first." True: `checkSaveBuildRequest` runs before `deps.store()` (tested with a getter spy).
- Same file: "`GET` sends `Cache-Control: public, max-age=31536000, immutable`", "An id that is malformed and an id with no build give the same 404" (`readSavedBuild`, `notFound`; tested).
- Same file: "The storage comes from `buildStoreFromEnv` in `build-store.ts`, and the per-client limit is `SAVE_RATE_LIMIT` in `save-rate-limit.ts`. A 429 carries `Retry-After`." True per those files and `saveBuildReply`.
- `ARCHITECTURE.md`: "`api-route.ts` ... imports no server-only module, because browser-safe `saved-builds.ts` imports it." `api-route.ts` imports only a type from `./api`; `saved-builds.ts` imports it. "Route files under `pages/api/` only adapt `req` and `res`" is true of the two new files; it is not true of `simulate.ts` or `fight.ts`, which keep their own validation code. The row's wording is about the builds route, so a reviewer may want it narrowed.
- OpenAPI operation text (repeat save 200 and counts against the limit; DELETE 405 in production; plain-text `Invalid JSON` 400 and 128 kb 413) is checked by the contract spec's prose test and live responses.
- `api-route.ts` header comment ("Browser-safe: saved-builds.ts imports it, so it must not import data.ts or any server-only module") restates the constraint that the ticket requires; kept as a hidden-constraint comment.
- No doc line quotes a measured result or copies a field list.

## Mutation checks

Each break was applied, `npx vitest run` on the covering test file, confirmed failing, then restored (`git status` clean afterwards; script `mutate.py` in the scratchpad):
- `sendReply` `=== undefined` to `!== undefined`: 3 failed.
- `methodNotAllowed` join `', '` to `','`: 1 failed.
- `englishCatalog` `??=` to `=`: 1 failed.
- `201 : 200` made always 201: 2 failed.
- 429 `Retry-After` header dropped: 3 failed.
- `canDelete` forced true: 1 failed.
- `isSavedBuildId` replaced with a string check: 4 failed.
- A store call placed before the body check: 6 failed.
- GET `Cache-Control` header dropped: 1 failed.
- `console.error` removed from the 503 path: 6 failed.
- simulate 405 allowed list changed to `['POST','PUT']`: 1 failed.
- simulate not-an-object body changed: 1 failed.
The Playwright specs were not mutation-tested; they check live responses against schemas and examples, and the stale-example test was shown failing before the regeneration.

## Codegen, build, lint

- Codegen: none configured.
- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones.
- `npx next build`: passes; routes `/api/aoe4-build-order/builds` and `/builds/[id]` listed. `unit_workshop_ram_3_eng` appears under `.next/server` and in no file under `.next/static`.
- `npm ci` was run in the worktree first (no node_modules existed).

## Invariant check

- S3: the save routes run no simulation; `simulate.ts` untouched; the simulate route's caps and responses are unchanged (its contract and acceptance tests pass).
- A3: reply functions read no clock; `nowMs` is an argument; `Date.now()` appears only in `builds/index.ts` (grep).
- Greps from the ticket (checked after the commit): `function isPlainObject` only in `api-route.ts` and `pages/api/fight.ts`; `request body: must be a JSON object` only in `api-route.ts`; `is not allowed; use` only in `api-route.ts` and `fight.ts`; no `next`, `react` or `node:` import in the two lib files; no `data` import in `api-route.ts`; no `if`, `switch` or ternary in the builds route files.

## Notes and deviations

- The SDK retry note: no `@vercel/blob` retry setting was changed and no timeout was added to the route; a slow Blob outage would reach the 503 mapping only after the SDK's retries finish.
- The 413 for a body over 128 kb carries no content-type header under `next dev`, so the live spec asserts the body is not JSON rather than checking a content type.
- 405 on the delete operation has no named example (the production-only 405 cannot be produced live in dev).
- `acceptance/openapi-schemas.ts` is an extra file beyond the ticket's helper list, so the two new specs share one Ajv loader.

## Out-of-scope findings

- None found in code. The three flaky page tests above fail only under full-suite load.
