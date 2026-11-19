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
  today) updated to include `PATCH`. (respec 1) The `PATCH` operation documents the same status set as `updateNamedBuild`,
  413 included: the id route's `bodyParser` `sizeLimit` rejects an oversized body before `namedBuildReply` runs, whatever the
  method. The route itself never answers 413 for a rename (the name is capped), so the `PATCH` 413 response describes only
  the framework's plain-text reply and has no JSON content or example. It documents 405 like the other id-path operations.
  The 429 descriptions that name the operations sharing the write budget (`saveBuild, createNamedBuild and updateNamedBuild`
  today) name `renameNamedBuild` too, the new operation's included. The 405 examples on the id path (today keyed `patchOnId`, a `PATCH` probe)
  become a probe with a method that stays disallowed (`POST`), renamed to match (for example `postOnId`), on every id-path
  operation including the new one. Set `info.version` to 2.7.0 and move the specs that pin 2.6.0 (examples:
  `aoe4-gathered-resources`, `aoe4-simulate-api-issue-shape`, `aoe4-named-builds-api-contract`, `aoe4-builds-api-contract`) to match; the
  repeat-step ticket makes the identical bump, so whichever lands second rebases cleanly and this ticket does not depend on it.
- (respec 1) Docs: `docs/aoe4-build-order-format.md` "Named builds routes", each statement that becomes untrue: the intro names `GET`,
  `PUT` and `DELETE` only and their three operation ids; the update bullet says an update "may rename the build" as if that
  were the only way; the write-budget bullet names creates, updates and `POST /builds` saves as the budget's only spenders;
  the production-405 bullet says `Allow: GET, PUT`. (respec 1) The section also gains the rename's own check order and
  write, which differ from the update's: the body check is the name rule only (no catalog validation and no
  saved-record size check), and the write changes only the name, revision and `updatedAt`. `lib/aoe4-build-order/README.md` module map line for
  `named-builds-routes.ts` (lists create, read, update and delete). `ARCHITECTURE.md` only if its route-logic row names the
  methods (it does not today, check).
- (respec 1) Existing tests: a test keeps its assertions unless its expected value depends on the id route's `Allow` list or
  405 message, or on `PATCH` being a disallowed method there. Those change to the new values, and a probe for a disallowed
  method uses one that stays disallowed (`POST`). Examples the search found: the `PATCH` 405 table and the "answers 405 for
  DELETE in %s" test (its `Allow` and message) in `lib/aoe4-build-order/named-builds-routes.test.ts`; "PATCH gives 405" in
  `acceptance/aoe4-named-builds-api.spec.ts`; "the 405 examples" in `acceptance/aoe4-named-builds-api-contract.spec.ts`
  (its `request.patch` probe and the `patchOnId` example key it reads, which follow the OpenAPI rename above). Search for any
  other test or doc that pins the id route's `Allow` list or treats `PATCH` on it as disallowed
  (`aoe4-simulate-api-edges.spec.ts` is the simulate route and is unaffected). Contract-spec assertions over the id-path
  operations (operation ids, status sets, examples validate) may gain the rename operation; their assertions on the existing
  operations stay.
- New tests: `named-builds-routes.test.ts` table over the check order (below); new `acceptance/aoe4-named-builds-rename.spec.ts`
  (API) following `aoe4-named-builds-api.spec.ts`; (respec 1) `renameNamedBuild` cases in
  `components/apps/aoe4-build-order/named-build-client.test.ts`, following its `updateNamedBuild` tests.

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
- [ ] (respec 1) Tests in `named-build-client.test.ts` show that `renameNamedBuild` sends `PATCH` with `Authorization: Bearer <secret>`, `If-Match` the quoted revision and body `{ name }`; a 200 with an update-shaped body is `ok`; 412 is kind `conflict`, 401 and 403 `forbidden`, 404 `not-found`, anything else `other` with the `saveFailureMessage` text; a 200 with a malformed body is a failure, not `ok`.
- [ ] Acceptance spec `aoe4-named-builds-rename.spec.ts`: create, rename gives 200 and `GET` shows the new name at revision 2; a stale `If-Match` gives 412; a wrong secret gives 403.
- [ ] (respec 1) `docs/api/openapi.json` documents the `PATCH` operation, `RenameNamedBuildRequest`, `operationId: renameNamedBuild` and the updated 405 replies; the `PATCH` operation declares the same statuses as `updateNamedBuild`, its 413 without JSON content; the contract spec's 405 probe uses a method that stays disallowed and every id-path operation's 405 example equals the live reply to that probe; the existing contract specs that validate examples against the live API pass; `info.version` and every spec that pins it agree.
- [ ] (respec 1) No doc under `docs/` or `lib/aoe4-build-order/README.md` still says the named-builds id route allows only `GET`, `PUT` and `DELETE`, that production answers `Allow: GET, PUT`, or that only creates, updates and builds saves spend the write budget; the format doc's "Named builds routes" states the rename's check order and that it writes only the name, revision and `updatedAt`.
- [ ] (respec 1) An existing test keeps its assertions unless its expected value depends on the id route's `Allow` list or 405 message, or on `PATCH` being disallowed there; those expect the new values and probe with a method that stays disallowed. The implementer lists every test edited.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-18

- Underspecified: the existing-tests rule covered only tests using `PATCH` as the disallowed method, missing tests that pin the id route's `Allow` list or message (the DELETE-in-production unit test, the contract spec's `patchOnId` 405 probe); the format doc's write-budget bullet, the OpenAPI 429 budget descriptions and the PATCH 413 reply were not addressed.
- Changed: the existing-tests rule now keys on the `Allow` list, 405 message and `PATCH` being disallowed; the 405 examples move to a `POST` probe with a matching key; Scope lists the stale format-doc statements and asks for the rename's check order; the `PATCH` operation documents 413 as a framework-only reply; the `renameNamedBuild` unit test in `named-build-client.test.ts` is unconditional.
- No branch exists yet, so no prior work is affected.

## Rework 1 - 2026-11-18 (review)

Gate: review (REQUEST CHANGES) at tip bce5d14; no other gate has passed it yet.

Findings:
- `lib/aoe4-build-order/named-builds-routes.ts:152-153` copies the over-cap name check and its message from `nameIssue` in `lib/aoe4-build-order/saved-builds.ts:96-99`.
- `lib/aoe4-build-order/named-builds-routes.test.ts:250-264`: no test sends a disallowed method to a malformed id, so swapping the method check and the id-form check at `named-builds-routes.ts:177-179` passes all tests (criterion 2: each earlier check wins when two fail).
- `lib/aoe4-build-order/save-rate-limit.ts:7`: the `SAVE_RATE_LIMIT` comment still lists only saves, creates and updates as spending the write budget.

Required fixes:
- [x] Export one `nameLengthIssue(name)` from `saved-builds.ts`; call it from both `nameIssue` and `checkRenameRequest`, leaving no copy of the check or its message.
- [x] Add a unit test that sends `POST`, and `DELETE` in production, to `'AbCdEfGhIjK'`: expects 405 with the `Allow` header (`toStrictEqual`) and no store getter call.
- [x] (text) Replace the `SAVE_RATE_LIMIT` comment in `save-rate-limit.ts:7` verbatim with: `/** The per-client write budget, maxSaves per windowSeconds, shared by saves, named-build creates, updates and renames (Named builds routes). */`
