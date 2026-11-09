# SGS-103 ticket report (builds API routes, OpenAPI 2.4.0, contract check)

Ticket: `$PROJECT_DIR/tickets/SGS-103-builds-api-routes.md`. Type Task, component aoe4-build-order, risk standard, depends on SGS-099 and SGS-101, criteria M6.4, about 180 lines of business logic.

## What the ticket covers

- New `lib/aoe4-build-order/api-route.ts` (C7 names exactly) and `builds-routes.ts` (`saveBuildReply`, `savedBuildReply`). SGS-099 and SGS-101 do not create these, so this ticket does. `simulate.ts` adopts api-route with byte-identical responses and stays synchronous (the existing Vitest handler test calls it without await, with a `res` that has no `end`). `saved-builds.ts` now uses `notAnObjectError()` (the one-source edit asked for).
- Thin routes: `pages/api/aoe4-build-order/builds/index.ts` (POST, literal `config` sizeLimit `128kb`) and `builds/[id].ts` (GET, DELETE). The store is injected as `store: () => Promise<BuildStore>` (`buildStoreFromEnv` in production, `() => Promise.resolve(createMemoryBuildStore())` or a rejecting function in tests, fixed `nowMs`).
- OpenAPI 2.3.0 to 2.4.0: new paths, schemas `SaveBuildRequest`, `SaveBuildResponse`, `SavedBuild`, `BuildsError`, examples.
- Q17 A: the stale 200 `buildOrder` example. I confirmed on main (Vitest scratch test, since removed) that the documented value differs from the engine in `unitsProduced`, `gatherRates`, `gatherers`, `floating`, `gathered`, `spent`, `spawnedPopulation`; `goldRunOut` matches. The existing contract spec checks only `goldRunOut` (`for (const name of ['goldRunOut'])`); the ticket makes it one test per request example, and the `buildOrder` case must fail before the regeneration and pass after.
- Playwright `webServer.env` gets `BUILDS_LOCAL_DIR` under `test-results/` (spread `process.env`, drop `BUILDS_STORE_ID`).
- Specs follow OD-8 (a): every post sends its own `x-forwarded-for`; one test makes 31 posts for the 429.
- Existing specs that this change breaks and the ticket lists by rule: `info.version` pins of `2.3.0` (`aoe4-gathered-resources.spec.ts`, `aoe4-simulate-api-issue-shape.spec.ts`), the path list and `AOE4_SCHEMA_NAMES` in `fight-api-spec-surface.spec.ts`, and the `durationSeconds` bounds locations in `aoe4-simulate-api-contract.spec.ts`. The surface spec also forbids an inline `type: object` under `paths` and requires every schema to be referenced; the ticket says so.
- SGS-098 left `aoe4-simulate-api-contract.spec.ts` in place on main (it is the contract spec); the new contract spec is a sibling file.

## Exact routes and status codes

- `POST /api/aoe4-build-order/builds`: 405 (`Allow: POST`), 400 (`SimulateError`, includes non-object), 413 (JSON `BuildsError`, record over cap), 413 plain text from Next (raw body over 128 kb), 503, 429 (`Retry-After`), 201 `{ id, path }`, 200 `{ id, path }` (repeat). Order as C3; the 400 and 413 rows run before any store call.
- `GET /api/aoe4-build-order/builds/{id}`: 405, 404 (invalid id, no store call; absent), 503, 500 (stored value fails `savedBuildSchema`), 200 `{ ...record, id }` with `Cache-Control: public, max-age=31536000, immutable`.
- `DELETE /api/aoe4-build-order/builds/{id}`: 405 `Allow: GET` in production, 404 invalid id, 503, 204 (also when absent).
- Error texts fixed in the ticket (design gives none): 429 `too many saves from this client; try again later`, 503 `storage is unavailable; try again later`, 404 `no saved build with that id`, 500 `the stored build could not be read`. The 405 text is from `methodNotAllowed`, for example `method DELETE is not allowed; use GET`.

## Test ids and helpers defined

- Vitest: `lib/aoe4-build-order/api-route.test.ts`, `builds-routes.test.ts`; new cases in `simulate-api.acceptance.test.ts` (GET 405 and `[]` 400 pinned).
- Playwright: `acceptance/aoe4-builds-api.spec.ts`, `acceptance/aoe4-builds-api-contract.spec.ts`; helpers in `acceptance/helpers.ts`: `BUILDS_PATH`, `buildPath(id)`, `postBuild(request, body, client, timeout?)`, `postBuildRaw(request, raw, client, timeout?)`, `uniqueClient(spec)`.
- Symbols: `RouteReply`, `ReplyTarget`, `isPlainObject`, `methodNotAllowed`, `notAnObjectError`, `sendReply`, `englishCatalog`, `saveBuildReply`, `savedBuildReply`. OpenAPI operation ids `saveBuild`, `getSavedBuild`, `deleteSavedBuild`.

## Open questions (all `designer`, non-blocking)

1. Name of the GET 200 schema (`SavedBuild & { id }`); proposed `SavedBuildWithId`.
2. Wording of the 429, 503, 404 and 500 texts and the three operation ids (design names none).
3. `saved-builds.ts` (browser-safe) importing `api-route.ts` pulls `loadGameData` along with `notAnObjectError`; expected harmless (page already loads the data, tree-shaking), fallback is a data-free module.

No new owner questions. OD-1..OD-8 not reopened.

## Overlap and notes

- SGS-099 open question about `notAnObjectError` is resolved here (item 3). SGS-099's other open question (fractional `walkSeconds` gives parse issues, not one `invalid`) does not affect this ticket.
- SGS-101 explicitly left the Playwright `webServer.env` change and the routes to this ticket.
- Criteria with commands were run against main: `isPlainObject` is defined in `simulate.ts` and `fight.ts` today (end state: `api-route.ts` and `fight.ts`); `must be a JSON object` is in `simulate.ts` today; `Date.now` has no match in `pages` or `lib` non-test code; no existing spec posts to the builds route. The mutation-style criteria (a late rate check, a dropped 405 header) are new tests, so no existing check could be mutated.
- The worktree and the scratch test were removed.
