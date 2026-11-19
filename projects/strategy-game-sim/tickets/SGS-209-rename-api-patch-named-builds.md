# SGS-209: Add PATCH named-builds/{id} to rename a named build, with the rename client

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M12
- **Priority**: medium
- **Risk**: standard
- **Invariants**: S3 (the rename takes a write-budget slot and bounds the name length); A-series paths match but none of A1 to A3 guards behavior this ticket changes
- **Unverified assumptions**: the Blob store's conditional replace (`replaceNamed`, an `If-Match` put on the stored etag) rejects a write whose etag is stale, so two racing renames or a rename racing a PUT cannot both land; the unit tests exercise this only through `blob-fake-test-helpers.ts`
- **LOC estimate**: 110 (`named-builds-routes.ts` PATCH branch ~70, `named-builds.ts` request type and name check ~15, `named-build-client.ts` `renameNamedBuild` ~15, `build-fetch.ts` method union, `[id].ts` type)
- **Depends on**: none
- **On merge**: CONTEXT.md Key surfaces: add the `PATCH` operation `renameNamedBuild` to the named-builds line (`GET`, `PUT`, `DELETE`, now also `PATCH` with `getNamedBuild`, `updateNamedBuild`, `deleteNamedBuild`, `renameNamedBuild`)
- **Source**: design/M12.md C8, C9 and Behavior rules "Rename: server"; MILESTONES.md M12.2, M12.3; reports/M12-planner-5.md outline D

## Context

A named build can be edited only by replacing the whole record with `PUT`, which needs the build content and
re-validates it against the catalog. M12.2 wants a rename that changes only `buildOrder.name`, keeps the id so
`?n=<id>` links keep working, and reports a stale or racing rename as a 412. This ticket adds the server route and
the browser client for it; the Rename button and library updates are a later ticket. `namedBuildReply` in
`lib/aoe4-build-order/named-builds-routes.ts` today handles `GET` and `PUT` (plus `DELETE` outside production); the
store record is `StoredNamedBuild` (saved build + `revision`, `createdAt`, `updatedAt`, `secretHash`).

## Scope

Follow design/M12.md C8 and C9 for every rule; this lists where the work lands.

- `lib/aoe4-build-order/named-builds.ts`: export `RenameNamedBuildRequest` (`{ name: string }`, flat, checked by hand).
- `lib/aoe4-build-order/named-builds-routes.ts`: a `PATCH` branch in `namedBuildReply`, written beside
  `updateNamedBuild` and reusing `readStored`, `refusedSaveSlot`, `replaceNamed`, `changed`, `storageUnavailable` and the same
  log lines. Check order, first failing answers: method (405), id form (404), secret form (401, `WWW-Authenticate: Bearer`),
  `If-Match` (428), body (400), rate-limit slot (429), exists (404), secret (403), revision (412), then the compare-and-swap
  (`conflict` is 412). Body: not an object gives the shared `notAnObjectError` (`api-route.ts`); `name` missing or not a
  string gives one `syntax` issue `name: must be a string`; trimmed name empty or over `SAVED_NAME_MAX_CHARS` (`saved-builds.ts`)
  gives one `out-of-range` issue starting `name:`. Other body keys are ignored. Write: the stored record with only
  `buildOrder.name` (trimmed), `revision` + 1 and `updatedAt` changed; the order is not re-validated against the catalog.
  200 body `UpdateNamedBuildResponse` with `ETag` the new revision; a rename to the same name still writes the next revision.
  The `disallowedMethod` list gains `PATCH`, so 405 `Allow` is `GET, PUT, PATCH` (plus `DELETE` outside production).
- `pages/api/aoe4-build-order/named-builds/[id].ts`: pass-through already hands `req` fields to `namedBuildReply`; check it
  needs no change beyond types.
- `components/apps/aoe4-build-order/named-build-client.ts`: `renameNamedBuild(id, editSecret, revision, name, signal?)` returning
  `{ ok: true; response: UpdateNamedBuildResponse } | NamedSaveFailure`, built like `updateNamedBuild` (same headers, `isUpdateResponse`,
  `failureOf`). `build-fetch.ts` `sendJson`'s method type gains `PATCH`.
- `acceptance/helpers.ts`: `patchNamedBuild(request, id, data, client, headers)` beside `putNamedBuild`.
- `docs/api/openapi.json`: the `PATCH` operation on the id path (`operationId: renameNamedBuild`) with request schema
  `RenameNamedBuildRequest`, every reply it can give with examples that the live API returns (the contract specs check examples),
  and every 405 `Allow` header and example message on the id path (they list `GET, PUT, DELETE` and `GET or PUT or DELETE`
  today) updated to include `PATCH`. Set `info.version` to 2.7.0 and move the specs that pin 2.6.0 (examples:
  `aoe4-gathered-resources`, `aoe4-simulate-api-issue-shape`, `aoe4-named-builds-api-contract`, `aoe4-builds-api-contract`) to match; the
  repeat-step ticket makes the identical bump, so whichever lands second rebases cleanly and this ticket does not depend on it.
- Docs: `docs/aoe4-build-order-format.md` "Named builds routes" (names `GET`, `PUT` and `DELETE` only; the update check-order
  bullet; the production-405 bullet saying `Allow: GET, PUT`); `lib/aoe4-build-order/README.md` module map line for
  `named-builds-routes.ts` (lists create, read, update and delete); `ARCHITECTURE.md` only if its route-logic row names the
  methods (it does not today, check).
- Existing tests that use `PATCH` as the disallowed method change to another method that stays disallowed (`POST`) and expect
  the new `Allow`: examples `acceptance/aoe4-named-builds-api.spec.ts` ("PATCH gives 405") and the `PATCH` 405 table in
  `lib/aoe4-build-order/named-builds-routes.test.ts`. Search for any other test or doc that treats `PATCH` on the named-builds id
  route as disallowed (`aoe4-simulate-api-edges.spec.ts` is the simulate route and is unaffected).
- New tests: `named-builds-routes.test.ts` table over the check order (below); new `acceptance/aoe4-named-builds-rename.spec.ts`
  (API) following `aoe4-named-builds-api.spec.ts`; a unit test of `renameNamedBuild` if the client has a test file for
  `updateNamedBuild` (follow it).

**Out of scope:** the Rename button, `NameForm`, library and My builds updates, storage (a later ticket); the repeat-step `StepTiming`
and `BuildStep` OpenAPI changes; `smoke:preview`; renaming a saved (`?b=`) build, which is immutable.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `PATCH` on a named build with a valid secret, the current `If-Match` and `{ name }` answers 200 with the next revision, and a following `GET` shows the trimmed new name with every other field (steps, start, `createdAt`, `durationSeconds`) unchanged and `updatedAt` advanced.
- [ ] Each check answers its own status with the input that alone produces it, and an earlier check wins when two fail: a test per status in the order method, id form, secret form, `If-Match`, body, slot, exists, secret, revision. In particular a malformed `Authorization` or `If-Match` is answered before the body is read and before a rate-limit slot is taken, and a wrong secret is 403 only after a slot is taken (a test fails if the secret is compared before the slot).
- [ ] Body cases: not an object, `name` missing, `name` not a string, trimmed-empty name, and a name over the cap each give 400 with the issue code Scope names; a name of exactly the cap length succeeds; surrounding whitespace is trimmed in what is stored; an extra body key is ignored and does not reach the stored record.
- [ ] A rename of a build whose steps the current catalog would reject still succeeds (a test fails if the route re-validates the order).
- [ ] A rename to the same name writes the next revision.
- [ ] A stale `If-Match` is 412 and nothing is written; a write landing between the read and the replace (`replaceNamed` answers `conflict`) is 412 and the other write is kept; both log as the existing update does.
- [ ] Stored JSON failing `storedNamedBuildSchema` is 500 and nothing is written; an unknown id is 404 after the slot; storage failure is 503 as for `PUT`; over `SAVE_RATE_LIMIT` is 429 with `Retry-After` and nothing read.
- [ ] A rename takes a slot from the same write budget as create and update.
- [ ] `POST` on the id route, and `DELETE` in production or with `VERCEL` set and `VERCEL_ENV` unset, are 405 with `Allow` listing `GET, PUT, PATCH` (and `DELETE` outside production); the store is never asked.
- [ ] `renameNamedBuild` sends `PATCH` with `Authorization: Bearer <secret>`, `If-Match` the quoted revision and body `{ name }`; a 200 with an update-shaped body is `ok`; 412 is kind `conflict`, 401 and 403 `forbidden`, 404 `not-found`, anything else `other` with the `saveFailureMessage` text; a 200 with a malformed body is a failure, not `ok`.
- [ ] Acceptance spec `aoe4-named-builds-rename.spec.ts`: create, rename gives 200 and `GET` shows the new name at revision 2; a stale `If-Match` gives 412; a wrong secret gives 403.
- [ ] `docs/api/openapi.json` documents the `PATCH` operation, `RenameNamedBuildRequest`, `operationId: renameNamedBuild` and the updated 405 replies, and the existing contract specs that validate examples against the live API pass; `info.version` and every spec that pins it agree.
- [ ] No doc under `docs/` or `lib/aoe4-build-order/README.md` still says the named-builds id route allows only `GET`, `PUT` and `DELETE`, or that production answers `Allow: GET, PUT`.
- [ ] Existing tests keep their assertions except those that used `PATCH` as the disallowed method; the implementer lists every test edited.
- [ ] No INVARIANTS.md regressions

## Open questions

none
