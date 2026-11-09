# SGS-103: Add the builds API routes, document them in OpenAPI 2.4.0 and check the contract

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M6 / M6.4 (POST validates and stores under a short id, GET, size cap, rate limit, OpenAPI and contract check)
- **Priority**: medium
- **Risk**: standard
- **Invariants**: S3 (every save is bounded: the 128 kb body limit, the record byte cap and the rate limit all run before any stored write; `simulate.ts` keeps every cap it has), A3 (the simulate route's responses stay byte-identical; the reply functions read no clock, `nowMs` is an argument)
- **LOC estimate**: ~180 (new `api-route.ts` ~45, `builds-routes.ts` ~110, two thin route files ~30, a net deletion in `simulate.ts`, 3 lines in `saved-builds.ts`; business logic only, OpenAPI JSON, docs and tests excluded)
- **Depends on**: SGS-099, SGS-101
- **On merge**: none
- **Source**: `design/M6.md` C3, C4 and C7, OD-2 (a), OD-8 (a); `plans/M6-20261105.md` outline C including owner Q17 A; `reports/M6-designer-2.md` Q9, Q10, Q11

## Context

M6 saves a build order by `POST` and reads it back by `GET`. SGS-099 (record, id, save checks) and SGS-101
(store seam, rate limit) are the pure parts. This ticket adds the two routes on top, as Next-free reply
functions plus thin `pages/api/` adapters, documents them in `docs/api/openapi.json` (2.3.0 to 2.4.0) and
checks the documented examples against the live routes. It also fixes a stale documented simulate response
(owner Q17 A): the 200 `buildOrder` example in the OpenAPI file no longer equals what the engine returns, and
no check catches it.

## Scope

Read first: `design/M6.md` C3, C4, C7 (authoritative for names, rows and order). Read in
`node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/07-api-routes.md` the sections
on `config` (`api.bodyParser.sizeLimit`) and "Dynamic API Routes" (`req.query`); this repo is Next 16, which
has breaking changes. Checked while writing: `sizeLimit` takes a `bytes` string such as `'128kb'`, and a
dynamic segment file `[id].ts` gives `req.query.id`.

Names from the two dependencies (their end state, not on main yet): SGS-099 `lib/aoe4-build-order/saved-builds.ts`
exports `savedBuildSchema`, `SavedBuild`, `SaveBuildResponse`, `isSavedBuildId`, `savedBuildId`,
`savedBuildPath`, `storageEnv` and `checkSaveBuildRequest(body, catalog)`, which returns
`{ ok: true; record; json } | { ok: false; status: 400; error: SimulateError } | { ok: false; status: 413;
error: BuildsError }`; `api.ts` exports `BuildsError { error: string }`. SGS-101 exports `BuildStore`
(`putBuild`, `getBuild`, `deleteBuild`), `createMemoryBuildStore` and `buildStoreFromEnv` from `build-store.ts`,
and `clientKey` and `takeSaveSlot` from `save-rate-limit.ts`.

1. New `lib/aoe4-build-order/api-route.ts` (no `next`, `react` or `node:` import; `NextApiResponse` satisfies
   `ReplyTarget` structurally). It exports exactly the C7 names: `RouteReply`, `ReplyTarget`, `isPlainObject`,
   `methodNotAllowed`, `notAnObjectError`, `sendReply`, `englishCatalog`, with the behavior in C7:
   - `methodNotAllowed(method, allowed)` returns status 405, header `Allow: <allowed joined by ', '>` and body
     `{ error: 'method <method> is not allowed; use <allowed joined by " or ">' }`. For `['POST']` it equals
     today's simulate 405 exactly.
   - `notAnObjectError()` returns `{ error: 'request body: must be a JSON object', issues: [{ code: 'syntax',
     message: 'request body: must be a JSON object' }] }`, today's simulate body.
   - `sendReply(res, reply)`: `res.status(reply.status)`, each header with `setHeader`, then `json(body)` when
     `reply.body !== undefined`, otherwise `end()`.
   - `englishCatalog()` memoizes `buildOrderCatalog(loadGameData('english'))` in module scope (the same
     instance on every call).
2. `pages/api/aoe4-build-order/simulate.ts` adopts it: its local `isPlainObject`, its module-scope
   `englishCatalog` variable, the inline 405 and the inline not-an-object 400 are replaced by
   `isPlainObject`, `methodNotAllowed(req.method, ['POST'])`, `notAnObjectError()`, `sendReply` and
   `englishCatalog()`. Every response (status, headers, body) stays byte-identical. The handler stays
   synchronous with no new `await`: `lib/aoe4-build-order/simulate-api.acceptance.test.ts` calls it without
   awaiting and its recording `res` has `status`, `setHeader` and `json` only. `pages/api/fight.ts` keeps its
   own `isPlainObject` (outside jscpd's paths and outside M6).
3. `lib/aoe4-build-order/saved-builds.ts` (SGS-099): replace its private copy of the not-an-object 400 body
   with `notAnObjectError()` imported from `./api-route`, so one source exists. Its behavior and tests do not
   change. `api-route.ts` imports `./api` for types only and no value from `saved-builds.ts`, so no runtime import
   cycle exists.
4. New `lib/aoe4-build-order/builds-routes.ts` (no `next`, `react` or `node:` import) exporting exactly
   `saveBuildReply` and `savedBuildReply` with the C7 signatures. A store getter is called only after every
   store-free check and a rejection maps to 503.
   `saveBuildReply(req: { method; body; clientKey }, deps: { store; catalog; nowMs })` returns the first
   matching row of this table:

   | # | status | headers | body | when |
   |---|--------|---------|------|------|
   | 1 | 405 | `Allow: POST` | `methodNotAllowed` | `method !== 'POST'` |
   | 2 | 400 | | `checkSaveBuildRequest`'s `error` | `ok: false, status: 400` (a non-object body included) |
   | 3 | 413 | | `checkSaveBuildRequest`'s `error` | `ok: false, status: 413` |
   | 4 | 503 | | `{ error: 'storage is unavailable; try again later' }` | `deps.store()` rejects |
   | 5 | 429 | `Retry-After: <retryAfterSeconds>` | `{ error: 'too many saves from this client; try again later' }` | `takeSaveSlot(store, clientKey, nowMs)` is `{ ok: false }` (`'contended'` included, its `retryAfterSeconds` is 1) |
   | 6 | 503 | | the row 4 body | `takeSaveSlot` or `putBuild` throws |
   | 7 | 201 | | `{ id, path }` | `putBuild(id, json)` is `'created'` |
   | 8 | 200 | | `{ id, path }` | `putBuild` is `'exists'` |

   `id = await savedBuildId(record)` and `path = savedBuildPath(id)`. The rate check (row 5) runs before the put,
   so a repeat save of the same build counts against the limit; rows 1 to 3 run before any store call, so an
   invalid body never spends a slot or a store operation. Each row 4 and row 6 failure is logged once with
   `console.error` (the error value only, never the request body or the client key).
   `savedBuildReply(req: { method; id }, deps: { store; env })` returns the first matching row of:

   | # | method | status | headers | body | when |
   |---|--------|--------|---------|------|------|
   | 1 | any not allowed | 405 | `Allow: GET` when `env === 'production'`, else `Allow: GET, DELETE` | `methodNotAllowed` | the method is not `GET`, or is `DELETE` in production |
   | 2 | GET, DELETE | 404 | | `{ error: 'no saved build with that id' }` | `!isSavedBuildId(id)` (an array `id` is invalid); no store call |
   | 3 | GET, DELETE | 503 | | the row 4 body above | `deps.store()` rejects, or the store call throws (logged as above) |
   | 4 | GET | 404 | | the row 2 body | `getBuild(id)` is `null` |
   | 5 | GET | 500 | | `{ error: 'the stored build could not be read' }` | the stored value fails `savedBuildSchema.safeParse` (logged as above) |
   | 6 | GET | 200 | `Cache-Control: public, max-age=31536000, immutable` | `{ ...parsed, id }` | the stored value passes `savedBuildSchema` |
   | 7 | DELETE | 204 | | none | `deleteBuild(id)` resolved; an absent build also gives 204 |

   `env` is a storage env as `storageEnv` returns it.
5. New `pages/api/aoe4-build-order/builds/index.ts`: `export default async function handler(req, res)` is
   `sendReply(res, await saveBuildReply({ method: req.method, body: req.body, clientKey: await clientKey(req) },
   { store: buildStoreFromEnv, catalog: englishCatalog(), nowMs: Date.now() }))`, and
   `export const config = { api: { bodyParser: { sizeLimit: '128kb' } } }` written as a literal in this file
   (Next reads `config` statically, so it is not re-exported). New `pages/api/aoe4-build-order/builds/[id].ts`:
   `sendReply(res, await savedBuildReply({ method: req.method, id: req.query.id }, { store: buildStoreFromEnv,
   env: storageEnv(process.env.VERCEL_ENV) }))`, with the env read per request. Neither file has a branch of its
   own. `Date.now()` is read only in `index.ts`.
6. `playwright.config.ts`: `webServer.env` is `{ ...process.env, BUILDS_LOCAL_DIR: <a directory under
   test-results/> }` (the spread is needed because `env` replaces the inherited environment), so acceptance
   runs write builds under the git-ignored `test-results/` and never into `.builds-local/`. `BUILDS_STORE_ID`
   is removed from that environment so acceptance never reaches Vercel Blob even when the developer's shell
   has it set. The file store creates parent directories on write, so a Playwright cleanup of
   `test-results/` does not break it.
7. `docs/api/openapi.json`, `info.version` `2.3.0` to `2.4.0`:
   - Paths `/api/aoe4-build-order/builds` (`post`, `operationId: saveBuild`) and
     `/api/aoe4-build-order/builds/{id}` (`get` `getSavedBuild`, `delete` `deleteSavedBuild`; path parameter
     `id` is a string with the `SAVED_BUILD_ID_PATTERN` pattern). Every response row of the two tables above
     is documented with its status, headers (`Allow`, `Retry-After`, `Cache-Control`) and schema, using `$ref`
     only (the surface spec forbids an inline `type: object` under `paths`). The framework responses that never
     reach the handler are described in prose, like the simulate route: a body that is not valid JSON is a
     plain-text 400 `Invalid JSON`, and a body over 128 kb is a plain-text 413. The operation text says the
     `DELETE` method is answered with 405 in production, and that a repeat save of the same build returns 200,
     not 201, and still counts against the rate limit.
   - Schemas `SaveBuildRequest` (open, as the request-side AoE4 schemas are; `buildOrder` is `$ref BuildOrder`,
     `durationSeconds` an integer with the `SIM_INPUT_BOUNDS.durationSeconds` min and max), `SaveBuildResponse`,
     `SavedBuild` and `BuildsError`, named after the TypeScript types in `saved-builds.ts` and `api.ts`.
     Response-side schemas are closed and require every property, and every property has a description. The
     `SavedBuild` schema has no duration bounds (a read must succeed whatever the bounds become). The GET 200
     body is a `SavedBuild` plus `id`; the implementer picks the composition (see Open questions for the name)
     so that the live body validates and one with an extra property or without `id` does not.
   - Examples (named, in `examples`): the save request; the 201 and 200 `SaveBuildResponse`; the GET 200 body for
     that save; the 400 rows (a non-object body, an unknown unit id, a `durationSeconds` out of range, a name
     of 101 characters); the 413 record cap; the 404; the 405 (`GET` on the save route, and `PUT` on the id
     route); the 429; the 503 and 500. Every value that comes from the code (the `id`, the byte count in the
     413 `error`) is copied from the live response, not computed by hand.
   - Regenerate the stale `buildOrder` 200 example under `/api/aoe4-build-order/simulate` from the real engine
     output for its request example, replacing the whole value. The engine result for that request differs from
     the documented value today in `unitsProduced`, `gatherRates`, `gatherers`, `floating`, `gathered`, `spent`
     and `spawnedPopulation` (checked on main with the response and the engine called in a Vitest scratch test).
     The implementer records how the value was produced (live response from `next dev`, or the same engine call).
8. Tests (Vitest, table style of the nearest existing tests; shapes are checked by value, not by key order):
   - `lib/aoe4-build-order/api-route.test.ts`: `methodNotAllowed` and `notAnObjectError` tables including the
     byte-for-byte simulate 405 and 400 bodies; `sendReply` against a recording `ReplyTarget` (headers set, then
     `json` for a body, `end` for none and `json` not called); `englishCatalog` returns one memoized catalog
     that knows an English unit id.
   - `lib/aoe4-build-order/builds-routes.test.ts`: one case per row of each table above, with
     `store: () => Promise.resolve(createMemoryBuildStore())` (a fresh store per case, or one store where a case
     needs state), a rejecting getter for the 503 rows, a wrapper store whose `bumpCounter` or `putBuild` throws,
     and a fixed `nowMs`. A valid order comes from `listBuilds()`.
   - `lib/aoe4-build-order/simulate-api.acceptance.test.ts`: add cases that pin the simulate handler's GET 405
     (status, `Allow: POST` header, body) and its `[]` body 400 (status and body) through a recording `res`.
9. Acceptance specs (Playwright; follow OD-8 (a)). New helpers in `acceptance/helpers.ts`: `BUILDS_PATH`,
   `buildPath(id)`, `postBuild(request, body, client, timeout?)`, `postBuildRaw(request, raw, client, timeout?)`
   and `uniqueClient(spec)` (`${spec}-${randomUUID()}`); the two post helpers always set `x-forwarded-for` to
   `client`. New `acceptance/aoe4-builds-api.spec.ts` (live rows) and
   `acceptance/aoe4-builds-api-contract.spec.ts` (documented schemas and examples). Every `describe` that posts
   takes its own `uniqueClient`, so no spec depends on the shared 127.0.0.1 budget. Edits to existing specs:
   `acceptance/aoe4-simulate-api-contract.spec.ts` checks every request example's documented 200 body (the
   loop over `['goldRunOut']` becomes a loop over every key of `requestExamples`). Every existing test that
   pins the document version, the list of paths or the list of schema names takes the new value (examples:
   `aoe4-gathered-resources.spec.ts` and `aoe4-simulate-api-issue-shape.spec.ts` pin `2.3.0`;
   `fight-api-spec-surface.spec.ts` pins the paths and `AOE4_SCHEMA_NAMES`); the same file's bounds table
   (`aoe4-simulate-api-contract.spec.ts`, `durationSeconds` locations) gains `SaveBuildRequest.durationSeconds`.
   The implementer lists every test it edits.
10. Input validation (common.md): the save request has a nested object (past the hand-check threshold). It is
    validated by SGS-099's `checkSaveBuildRequest` (zod through `checkBuildOrder`, with the envelope checks), the
    stored record by `savedBuildSchema`. This ticket adds no hand-rolled validator: `id` is checked with
    `isSavedBuildId`.
11. Docs: `docs/aoe4-build-order.md` "Route" section gains a "Builds routes" part stating the behavior and rules
    (a save is validated before it costs a rate-limit slot or a store call; the id is content-addressed so a
    repeat save returns the same id with 200; GET sends `Cache-Control: public, max-age=31536000, immutable`;
    DELETE exists outside production only; the storage and the limit come from `build-store.ts` and
    `SAVE_RATE_LIMIT`, with no number copied). It does not copy field lists (the OpenAPI file is authoritative,
    as that section already says) and quotes no measured result. `ARCHITECTURE.md` "Where files go" gains
    `api-route.ts` (what every AoE4 route shares) and `builds-routes.ts` (the builds route logic) next to the
    files SGS-101 adds, and states that route files under `pages/api/` only adapt `req` and `res`. Grep
    `docs/`, `README.md` and `ARCHITECTURE.md` for `simulate.ts`, `isPlainObject` and `/api/aoe4-build-order`;
    fix any statement this makes untrue (none found on main today).

**Out of scope:** the page, `SaveBuild` and the `?b=` load, the smoke script, `@vercel/blob` and the zod
`overrides`, the stores and the rate-limit rule (SGS-101), the record and the checks (SGS-099 apart from item
3), `pages/api/fight.ts`, any env-tunable limit (OD-8 (a)), `useAutoRun`, and the wording of the page's 429
message.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `api-route.ts` exports exactly the names in Scope item 1 and `builds-routes.ts` exactly `saveBuildReply`
      and `savedBuildReply`. `git grep -nE "from '(next|react|node:)" -- lib/aoe4-build-order/api-route.ts
      lib/aoe4-build-order/builds-routes.ts` has no match.
- [ ] One source for the shared handling: every match of `git grep -nE "function isPlainObject" -- pages lib` is
      in `lib/aoe4-build-order/api-route.ts` or `pages/api/fight.ts`; every match of
      `git grep -n "must be a JSON object" -- lib pages ':!*.test.ts'` is in `api-route.ts`; every match of
      `git grep -n "is not allowed; use" -- lib pages ':!*.test.ts'` is in `api-route.ts` or `pages/api/fight.ts`.
- [ ] Simulate route unchanged: the simulate contract spec (`aoe4-simulate-api-contract.spec.ts`) and
      `simulate-api.acceptance.test.ts` pass with no edit to an existing expected value. New unit cases pin the
      handler's GET 405 (status 405, header `Allow: POST`, body `{ error: 'method GET is not allowed; use POST' }`)
      and the `[]` body 400 (the `notAnObjectError()` body). A handler that changes the 405 header or text, or
      the 400 body, fails them.
- [ ] `saveBuildReply`, one test case per row, each asserting status, headers and body:
      - Row 1: `GET` gives 405, `Allow: POST`, `{ error: 'method GET is not allowed; use POST' }`, and the store
        getter is not called.
      - Rows 2 and 3: `[]`, a body with an unknown unit id, `durationSeconds` 59 and a 101-character `name` give
        400 with the `checkSaveBuildRequest` body; a record over `SAVED_BUILD_MAX_BYTES` gives 413 with a
        `BuildsError` body (built from valid steps with a long `source`). For each, the store getter and
        `bumpCounter` are not called, and 31 invalid bodies from one client followed by a valid one give 201 (an
        invalid body spends no slot: this fails if the check runs after `takeSaveSlot`).
      - Row 4: a getter that rejects gives 503 with the row's body and no 429 or 201.
      - Row 5: the 31st save from one client key in one window gives 429 with `Retry-After` equal to the string of
        `takeSaveSlot`'s `retryAfterSeconds` (3600 at the window start with a fixed `nowMs`, a different value at a
        later `nowMs`) and `putBuild` is not called for it (a spy store). A store whose `bumpCounter` returns
        `'contended'` gives 429 with `Retry-After: 1`. Two client keys have separate budgets. Saves 1 to 30 from one
        client are not refused and save 31 is (the boundary, repeated at the route).
      - Row 6: a store whose `bumpCounter` throws, and a store whose `putBuild` throws, each give 503 (not 500 and
        not a rejected promise), and `console.error` was called with the error.
      - Rows 7 and 8: the first save of a valid order gives 201 `{ id, path }` where `id` equals
        `await savedBuildId(record)`, `path` equals `savedBuildPath(id)`, and `store.getBuild(id)` then returns
        the record; the same body again gives 200 with the same body and does not change the stored value, and it
        consumed a rate-limit slot (30 repeats then a 31st gives 429).
- [ ] `savedBuildReply`, one test case per row: the 405 for `PUT` in `'development'` and `'preview'` has
      `Allow: GET, DELETE` and the text `method PUT is not allowed; use GET or DELETE`; `DELETE` with `env`
      `'production'` gives 405, `Allow: GET`, the text `method DELETE is not allowed; use GET`, and deletes
      nothing (a stored build is still returned by GET afterwards). `abc`, a 12-character id, `undefined` and an
      array `id` give 404 for GET and DELETE with no store getter call. A rejecting getter and a store that throws
      each give 503 for GET and DELETE. An absent id gives 404 for GET. A stored value that fails
      `savedBuildSchema` (for example `{ version: 2 }` put with `putBuild`) gives 500 with the row's body. A
      stored valid record gives 200, `Cache-Control: public, max-age=31536000, immutable`, and a body equal to
      the record plus `id`. `DELETE` of a stored id gives 204 with no body (`json` not called, `end` called
      through `sendReply`) and a following GET gives 404; `DELETE` of an absent valid id gives 204.
- [ ] `sendReply` unit test: with a recording target, headers are set before the body is sent, a defined body
      uses `json` once and never `end`, and an undefined body uses `end` once and never `json`.
- [ ] Route files: `git grep -nE "\bif\b|\bswitch\b| \? " -- pages/api/aoe4-build-order/builds` has no match
      (no branch in either file); each file's default export is one `sendReply` call.
      `pages/api/aoe4-build-order/builds/index.ts` exports a literal `config` with `bodyParser.sizeLimit` `'128kb'`.
      `git grep -n "Date.now" -- pages lib ':!*.test.ts'` has no match outside `builds/index.ts`.
- [ ] Live specs (`aoe4-builds-api.spec.ts`), each asserting status and body shape against the schema:
      - A valid build posted with a fresh client gives 201 `SaveBuildResponse` and the same body again gives
        200 with the same id (the order carries a per-run unique `name`, so the first post is a new build).
      - GET of that id gives 200 with the same `buildOrder` and `durationSeconds` that were sent, `version`
        equal to `SAVED_BUILD_VERSION`, and `id`.
      - DELETE of that id gives 204, then GET gives 404 with a `BuildsError`.
      - 400 rows: `[]`, an unknown unit id, `durationSeconds` 59, and a 101-character name each give 400 and
        a `SimulateError` body that validates.
      - 413 rows: a record over the byte cap but under the body limit gives 413 with a JSON `BuildsError`;
        a raw body over the 128 kb limit gives 413 and a non-JSON body (not a `BuildsError`).
      - 404 for GET `abc`; 405 for GET and PUT on the save route (`Allow: POST`), and for PUT on the id route
        (`Allow: GET, DELETE` under `next dev`).
      - One test posts the same valid build until a 429 and asserts: exactly 30 responses are 201 or 200 and the
        31st is 429 with a `BuildsError` body and an integer `Retry-After` header in 1..3600; another client
        key then saves with 201 or 200 (the budget is per client). No other test posts as that client.
      - No spec posts to the builds route without `x-forwarded-for`:
        `git grep -n "BUILDS_PATH" -- acceptance` shows posts only through `postBuild` or `postBuildRaw`, and
        `git grep -nE "(request|page)\.post\(" -- acceptance/aoe4-builds-api.spec.ts
        acceptance/aoe4-builds-api-contract.spec.ts` has no match.
- [ ] Contract spec (`aoe4-builds-api-contract.spec.ts`), validated with Ajv against the document:
      - `info.version` is `2.4.0` and the document has exactly the paths `/api/fight`,
        `/api/aoe4-build-order/simulate`, `/api/aoe4-build-order/builds` and `/api/aoe4-build-order/builds/{id}`
        (and the surface spec's list is updated to match).
      - `SaveBuildRequest`, `SaveBuildResponse`, `SavedBuild` and `BuildsError` exist; response-side schemas are
        closed and require every property; every property has a description; `SaveBuildRequest.durationSeconds`
        has the `SIM_INPUT_BOUNDS.durationSeconds` min and max; `SavedBuild` has no duration bounds; every
        schema is referenced from a path or another schema.
      - Every example validates against its schema. Every example that can be produced live is reproduced by a
        request and equals the real response (`toEqual` on the body): the save request gives the 201 or 200
        example body, GET gives the GET example, and each 400, 413, 404, 405 and 429 example equals the response
        to the request the spec builds for it. The 503 and 500 examples are validated against `BuildsError`
        only; the spec names them as the two without a live reproduction.
      - A real 201 body, a real GET body and a real 400 validate, and a copy with an added property (or, for the
        GET body, a missing `id`) does not.
- [ ] Stale example fixed and guarded (owner Q17 A): `aoe4-simulate-api-contract.spec.ts` has one test per key of
      `requestExamples` (so the `buildOrder` example too) asserting the live 200 body `toEqual` the documented
      200 example. The test for `buildOrder` fails on the current `docs/api/openapi.json` (its example differs
      from the engine in the keys listed in Scope item 7) and passes after the example is regenerated; the
      implementer records both runs in the report.
- [ ] `playwright.config.ts` `webServer.env` sets `BUILDS_LOCAL_DIR` to a directory under `test-results/`, spreads
      `process.env` and removes `BUILDS_STORE_ID`. After `npm run acceptance`, `git status` is clean and no
      `.builds-local/` directory was created.
- [ ] Every existing test that pins the document version, the path list or the schema-name list holds the new
      value, and every other existing test keeps its expected value. The report lists each test edited.
- [ ] `docs/aoe4-build-order.md` and `ARCHITECTURE.md` carry the Scope item 11 text; the docs quote no measured
      result and copy no field list from the OpenAPI file.
- [ ] `npx tsc --noEmit`, `npm run lint:dup`, `npm test`, `npm run acceptance` and `npx next build` pass, and
      `lint:dup` flags no duplication between `simulate.ts`, the two new route files and `builds-routes.ts`.
- [ ] No INVARIANTS.md regressions

## Open questions

- `designer` (non-blocking): the GET 200 body is `SavedBuild & { id }` (C1, C4), which has no schema name in
  the design or in `saved-builds.ts`. The ticket leaves the OpenAPI composition to the implementer and the
  name unset. Proposed: a component schema `SavedBuildWithId` (closed; `SavedBuild`'s properties plus `id`,
  composed so `SavedBuild` stays referenced). Confirm the name, or add a TypeScript type for it.
- `designer` (non-blocking): the design gives no wording for the 429, 503, 404 and 500 `error` texts. The
  ticket fixes `too many saves from this client; try again later`, `storage is unavailable; try again later`,
  `no saved build with that id` and `the stored build could not be read` (no number in the 429 text, since
  `Retry-After` carries it). Confirm, or give other text. Also confirm the operation ids `saveBuild`,
  `getSavedBuild` and `deleteSavedBuild`, which the design does not name.
- `designer` (non-blocking): `saved-builds.ts` (browser-safe) imports `notAnObjectError` from `api-route.ts`,
  which also exports `englishCatalog` and so pulls `loadGameData` into any bundle that imports `saved-builds.ts`.
  The page already loads the game data for its catalog, so no new bytes are expected, and the module has no
  side effects so unused exports are dropped. If the page bundle grows, move `notAnObjectError` and
  `isPlainObject` to a module that has no data import.
