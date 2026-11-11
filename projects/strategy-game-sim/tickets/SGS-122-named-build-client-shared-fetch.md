# SGS-122: Add the named-build client and one shared fetch helper for the builds routes

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M8 / M8.1 (client)
- **Priority**: medium
- **Risk**: standard
  <!-- Not low: a new client contract (C4, C4a) and a refactor of two existing client functions; about 120
       lines. Not high: the design gives every name and signature exactly, so it is not a
       strongModelTriggers item, and no criticalPaths symbol changes. -->
- **Invariants**: none
- **LOC estimate**: ~120 (new `build-fetch.ts` ~45 and `named-build-client.ts` ~75; `saved-build-loader.ts` and `save-build-client.ts` shrink; business logic only)
- **Depends on**: SGS-119
- **On merge**: none
- **Source**: `design/M8.md` C4 and C4a; `plans/M8-20261110.md` outline K, design question 4

## Context

M8 adds editable named builds. The page and Save panel need fetch wrappers for the named routes, and those
wrappers have the same GET-validate and send-JSON steps as `loadSavedBuild` and `postSavedBuild`. jscpd
runs at threshold 0, so each step must exist once, in a shared module. This ticket writes that module and
the named client, and moves the two existing functions onto it with unchanged behavior. Nothing in the page
calls the named client yet.

## Scope

All paths under `components/apps/aoe4-build-order/` unless noted.

- New `build-fetch.ts` exporting exactly `LoadJsonResult<T>`, `loadJson`, `JsonReply` and `sendJson`, with the
  signatures and behavior of the `design/M8.md` C4a tables:
  - `loadJson(path, schema, signal)`: GET with `Accept: application/json` and `signal`. 200 whose body
    passes `schema.safeParse` is `{ status: 'ok', value }`; 404 is `not-found`; any other status, a body
    that is not JSON or fails the schema, a network error or an abort is `failed`. Never throws.
  - `sendJson(path, { method, headers, body }, signal?)`: sends `Content-Type` and `Accept` of
    `application/json`, then `headers` (which may add `Authorization` and `If-Match`), and
    `JSON.stringify(body)`. Returns `{ status, retryAfter, body }` with `retryAfter` the `Retry-After`
    header or `null` and `body` `undefined` when the response is not JSON. A network error or abort returns
    `{ status: null, retryAfter: null, body: undefined }`. Never throws.
- `saved-build-loader.ts`: `loadSavedBuild` keeps its signature and result type; after the `isSavedBuildId`
  check it maps `loadJson('/api/aoe4-build-order/builds/' + id, savedBuildSchema, signal)` (`value` becomes
  `saved`). Its own `fetch` and `try` block go.
- `save-build-client.ts`: `readJson` is deleted and `postSavedBuild` is rewritten on `sendJson`
  (POST `/api/aoe4-build-order/builds`). Its result type, the 200-or-201 success rule, `isSaveBuildResponse`
  and the messages from `saveFailureMessage` do not change. `saveFailureMessage` is untouched.
- New `named-build-client.ts` exporting `NamedSaveFailure`, `createNamedBuild`, `updateNamedBuild` and
  `loadNamedBuild` with the C4 signatures, using the C1 names from SGS-119 (`NamedBuild`,
  `CreateNamedBuildResponse`, `UpdateNamedBuildResponse`, `isNamedBuildId`, `NAMED_BUILD_ID_PATTERN`,
  `storedNamedBuildSchema`, `revisionEtag`):
  - `loadNamedBuild` returns `not-found` without a request when `isNamedBuildId` fails; otherwise it maps
    `loadJson('/api/aoe4-build-order/named-builds/' + id, namedBuildBodySchema, signal)` (`value` becomes
    `build`). `namedBuildBodySchema` is a module-local constant:
    `storedNamedBuildSchema.omit({ secretHash: true }).extend({ id: z.string().regex(NAMED_BUILD_ID_PATTERN) })`,
    left in zod's default strip mode (no `.strict()`, no `.passthrough()`). A body that still carries
    `secretHash`, or any key the schema does not name, parses `ok` with that key removed, so the returned
    `build` holds exactly the `NamedBuild` fields and a leaked `secretHash` never reaches page state or
    `my-builds-storage.ts`. Why strip, not strict: keeping `secretHash` out of a GET body is the server's
    contract (C1 GET row 6, the closed `NamedBuild` OpenAPI schema, and the M8.1 server acceptance check
    for no `secretHash`), and those tests catch a leak; failing the client load would not un-send the hash,
    only stop the user opening their build. Tradeoff accepted: the client does not detect a leaking server,
    and it silently drops any field a later server adds until this schema names it. Every other schema
    the client parses with (`savedBuildSchema` in `loadSavedBuild`) also strips.
  - `createNamedBuild` POSTs the request to `/api/aoe4-build-order/named-builds`. Success is status 201 with a
    body that passes a module-local check of the `CreateNamedBuildResponse` fields.
  - `updateNamedBuild` PUTs to `/api/aoe4-build-order/named-builds/<id>` with headers
    `Authorization: Bearer <editSecret>` and `If-Match: revisionEtag(revision)`. Success is status 200 with a
    body that passes a module-local check of the `UpdateNamedBuildResponse` fields.
  - Any other reply maps to a `NamedSaveFailure`: status 412 gives `kind: 'conflict'`; 401 or 403 gives
    `forbidden`; 404 gives `not-found`; everything else (including a success status with a bad body, and a
    `null` status) gives `other`. `message` is `saveFailureMessage(status, retryAfter, body)` for 400, 413,
    429, 503 and a `null` status. For the rest it is: `conflict`, "This build changed somewhere else.
    Choose it again to get the latest version, or save a copy."; `forbidden`, "You cannot edit this build
    here. Save a copy instead."; `not-found`, "This build no longer exists. Save a copy instead."; any
    other status, `saveFailureMessage(status, retryAfter, body)` (its generic text).
- New tests: `build-fetch.test.ts` holds the status table for `loadJson` and `sendJson`;
  `named-build-client.test.ts` holds one case per outcome of the named mapping (not the whole table).
  `saved-build-loader.test.ts` keeps one case per outcome of its own mapping; cases that only re-test the
  shared status table move to `build-fetch.test.ts` and are not duplicated. Fetch stubs reject only when
  `signal.aborted`, so a missing `signal` argument fails the test. The stub and the reply builders live
  once, in a new test-only module `fetch-test-helpers.ts` (`stubFetch`, `lastCall`, `reply`), imported by
  `build-fetch.test.ts` and `named-build-client.test.ts`, because jscpd at threshold 0 flags a stub
  copied into both files.
- Do not touch `save-build.tsx`, the page or `build-input.tsx`: nothing calls the named client yet, and
  `postSavedBuild` stays until the Save panel rewrite deletes it. No doc describes these client modules, so
  no doc changes.

**Out of scope:** page or Save panel wiring, `my-builds-storage.ts`, deleting `postSavedBuild` and
`isSaveBuildResponse` (the Save panel rewrite does), any change to `saveFailureMessage`, the routes.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `build-fetch.test.ts` (new) pins `loadJson` with a table: 200 with a valid body gives `ok` and the parsed value; 404 gives `not-found`; each of 500, 503, 200 with a body failing the schema, 200 with a non-JSON body, a rejecting fetch, and an already-aborted signal gives `failed`. A `loadJson` that treated 404 as `failed`, or that skipped `safeParse`, must fail a row.
- [ ] `build-fetch.test.ts` asserts the request `loadJson` makes: `Accept: application/json` and the exact `signal` passed in. The fetch stub rejects only when `signal.aborted`, and it is defined once, in `fetch-test-helpers.ts`, which both new test files import; no production module imports `fetch-test-helpers.ts`. (respec 1)
- [ ] `build-fetch.test.ts` pins `sendJson`: it sends the method, the body as `JSON.stringify(body)`, `Content-Type` and `Accept` of `application/json`, the extra `headers` (an `Authorization` and an `If-Match` value arrive unchanged) and the `signal`. It returns the status, a `Retry-After` header as `retryAfter` (and `null` when absent) and the parsed body; a non-JSON response gives `body: undefined` with the status kept; a rejecting fetch and an aborted signal give `{ status: null, retryAfter: null, body: undefined }`.
- [ ] `named-build-client.test.ts` pins `loadNamedBuild`: an id that fails `isNamedBuildId` (21 chars, 23 chars, an 11-char saved-build id) gives `not-found` and makes no request; a valid id requests `/api/aoe4-build-order/named-builds/<id>` with the given signal; a 200 body of a `NamedBuild` returns it as `build`; a 200 body of that `NamedBuild` plus a 43-char `secretHash` gives `ok` with a `build` that has no `secretHash` key, asserted with `toStrictEqual` against the `NamedBuild` (a `namedBuildBodySchema` with `.passthrough()` must fail this case); a body that lacks `revision`, or whose `id` is not a named-build id, gives `failed`; 404 gives `not-found`. (respec 1)
- [ ] `named-build-client.test.ts` pins `createNamedBuild`: 201 with a valid response returns `{ ok: true, response }`; a 200 with a valid body, and a 201 with a body missing `editSecret`, give `{ ok: false, kind: 'other' }`; the request goes to `/api/aoe4-build-order/named-builds` as a POST with the `SaveBuildRequest` as its body and the passed signal.
- [ ] `named-build-client.test.ts` pins `updateNamedBuild`: the request is a PUT to `/api/aoe4-build-order/named-builds/<id>` with `Authorization: Bearer <editSecret>` and `If-Match: "<revision>"` (quotes included); 200 with a valid body returns `{ ok: true, response }`; a 201 gives `other`.
- [ ] A failure table in `named-build-client.test.ts` (shared by create and update) pins `kind` and `message`: 412 gives `conflict` with the text in Scope; 401 and 403 give `forbidden` with the text in Scope; 404 gives `not-found` with the text in Scope; 400 with an issue gives `other` with `saveFailureMessage`'s text for that issue; 413, 429 with `Retry-After: 90` and 503 give `other` with the `saveFailureMessage` texts; 500 gives `other` with the generic save-failure text; a rejecting fetch gives `other` with the generic text. A mapping that sent 412 to `forbidden`, or 401 to `conflict`, must fail a row.
- [ ] `postSavedBuild` behavior is unchanged: `save-build-client.test.ts` passes with no edits to its expected values, and `saveFailureMessage` is not modified.
- [ ] `loadSavedBuild` behavior is unchanged: every case of `saved-build-loader.test.ts` that pins an outcome of the saved-build mapping (invalid id with no request, the parsed record, a record of another version) still holds with the same expected values; only cases moved to `build-fetch.test.ts` are removed.
- [ ] The builds routes are fetched only from `build-fetch.ts`: `git grep -n "fetch(" -- components/apps/aoe4-build-order/saved-build-loader.ts components/apps/aoe4-build-order/save-build-client.ts components/apps/aoe4-build-order/named-build-client.ts` finds nothing, and `git grep -n "readJson" -- components` finds nothing.
- [ ] `named-build-client.ts` and `build-fetch.ts` import no `node:` module, and `npm run lint:dup` and `npx tsc --noEmit` pass with all three client files present.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-10

- Underspecified: the `loadNamedBuild` criterion wanted `failed` for a body carrying `secretHash`, but Scope's `namedBuildBodySchema` is non-strict and strips unknown keys, so the load returns `ok`.
- Changed: Scope now states strip mode and why (the server contract and its tests guard the leak; the client drops the key so it never reaches page state), with the tradeoff; the criterion now pins `ok` with no `secretHash` key. `fetch-test-helpers.ts` is accepted scope.
- Still stands: all branch work at `e137e68` matches the new end state, including the "drops a secretHash the body still carries" test (a `.passthrough()` mutation fails it); no code change needed.
