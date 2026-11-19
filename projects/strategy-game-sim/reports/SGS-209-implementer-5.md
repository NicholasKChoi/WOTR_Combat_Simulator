# SGS-209 implementer report 5

- Ticket: SGS-209 (Feature, standard). Branch `sgs-209-rename-api-patch-named-builds`, base `origin/main` (d80751b).
- Tip: `bce5d14d18bf937c4e75502dac331bb24f18b3f7` (one commit, not pushed).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-209-rename-api-patch-named-builds`
- Status: `needs_review`

## Files touched

- `lib/aoe4-build-order/named-builds.ts`: `RenameNamedBuildRequest`.
- `lib/aoe4-build-order/named-builds-routes.ts`: PATCH branch, `checkRenameRequest`, `renameNamedBuild`; the update's slot/read/secret/revision/CAS tail extracted to `writeNextRevision` (shared by PUT and PATCH, needed to pass `lint:dup`); `PATCH` added to the allowed methods.
- `components/apps/aoe4-build-order/named-build-client.ts`: `renameNamedBuild`. `build-fetch.ts`: method union gains `PATCH`.
- `pages/api/.../named-builds/[id].ts`: checked, needs no change (pass-through; response type already includes `UpdateNamedBuildResponse`).
- `acceptance/helpers.ts`: `patchNamedBuild`. New `acceptance/aoe4-named-builds-rename.spec.ts`.
- `docs/api/openapi.json`: `PATCH` operation (`renameNamedBuild`), `RenameNamedBuildRequest`, 405 Allow/description/examples on every id-path op (key `postOnId`, `POST` probe), 429 and budget descriptions name `renameNamedBuild`, version 2.7.0. Edited by a Python script that round-trips the file byte-identically (indent 2).
- `docs/aoe4-build-order-format.md` (Named builds routes), `lib/aoe4-build-order/README.md`: updated. `ARCHITECTURE.md`: route-logic row names no methods, no change.
- Tests: `lib/aoe4-build-order/named-builds-routes.test.ts`, `components/apps/aoe4-build-order/named-build-client.test.ts`, and the spec files below.

## Tests run

- `npm test` (full unit): 91 files passed, 1 skipped; 2930 passed, 15 skipped, 0 failed.
- Route unit tests: 110 passed. They encode: check order (401 and 428 before the body and the slot, 400 before the slot, 429 before any read, 404/403/412 after the slot, 403 only after the slot is taken), name rules (not object, array, missing, non-string, blank, over cap, exactly cap with surrounding whitespace, trim stored, extra keys not stored), write changes only name/revision/updatedAt, same-name rename writes the next revision, a catalog-invalid build still renames, stale 412 writes nothing and logs a mismatch, CAS race 412 keeps the other write and logs a conflict, 500 on bad stored JSON, 503 on store failures, shared write budget, 405 `Allow` lists.
- Client tests: `describe.each` over update and rename (method, bearer, quoted `If-Match`, body, signal, 201 and bad-body are `other`); the failure table (412 conflict, 401/403 forbidden, 404 not-found, others `other`) runs for rename too.
- Acceptance specs run (single files, `npx playwright test <files>` after `npm run acceptance:setup`), 62 passed:
  `aoe4-named-builds-rename.spec.ts` (new), `aoe4-named-builds-api.spec.ts`, `aoe4-named-builds-api-contract.spec.ts`, `aoe4-builds-api-contract.spec.ts`, `aoe4-gathered-resources.spec.ts`, `aoe4-simulate-api-issue-shape.spec.ts`.

## Existing tests edited

- `named-builds-routes.test.ts` "answers 405 for PATCH in %s": now probes `POST`; `Allow` and message gain `PATCH` (allowed by the ticket rule: depends on `Allow`/PATCH being disallowed).
- `named-builds-routes.test.ts` "answers 405 for DELETE in %s": `Allow: GET, PUT, PATCH`, message `GET or PUT or PATCH`.
- `named-builds-routes.test.ts` invalid-id `describe.each`: `PATCH` added to the method list (new row, no assertion changed).
- `named-builds-routes.test.ts` PUT "another write lands between the read and the swap": same assertions, setup moved into the new `racedStore` helper (shared with the PATCH test, needed for `lint:dup`).
- `named-build-client.test.ts`: the `updateNamedBuild` describe became `describe.each` over update and rename, same assertions for update; the failure-table describe also calls `renameNamedBuild` (renamed "failures of create, update and rename").
- `acceptance/aoe4-named-builds-api.spec.ts` "PATCH gives 405 ...": now "POST gives 405 with Allow: GET, PUT, PATCH, DELETE", probe `request.post`.
- `acceptance/aoe4-named-builds-api-contract.spec.ts`: 405 probe `request.post` with `postOnId`; operation-id, status-set and example-validation assertions gain the rename operation (existing assertions unchanged); version 2.7.0 here and in `aoe4-builds-api-contract`, `aoe4-gathered-resources`, `aoe4-simulate-api-issue-shape`.

## Doc claims

- format doc: "A rename (`PATCH`) takes the same headers and the same `If-Match` rule as an update, with body `{ name }`; other keys are ignored." `named-builds-routes.ts:renameNamedBuild`, `checkRenameRequest`.
- format doc: check order id 404, secret form 401, `If-Match` 428, name 400, slot 429, exists 404, secret 403, revision 412, CAS 412: `renameNamedBuild` then `writeNextRevision`; id form is checked in `namedBuildReply` first.
- format doc: "the build is neither checked against the catalog nor measured against the saved-build size limit"; "changes only `buildOrder.name`, `revision` and `updatedAt`": `change` callback in `renameNamedBuild` plus `writeNextRevision`; unit tests "changes only the name..." and "renames a build whose steps the catalog no longer accepts".
- format doc: "Creates, updates, renames and `POST /builds` saves share one per-client write budget": unit test "takes its slot from the budget that create and update spend".
- format doc: `Allow: GET, PUT, PATCH` in production: unit 405 table.
- OpenAPI rename description repeats the same order and rules; its 413 says the framework answers before the route and the route never answers 413 for a rename; the shared 429 description names `renameNamedBuild`; the live examples (400 notAnObject/nameNotString/nameEmpty, 401, 404, 405, 428) are checked against the live API in the contract spec.

## Pinned outputs

400 messages: `name: must be a string` (syntax), `name: must not be empty` (out-of-range), `name: <n> characters, more than 100` (out-of-range, n is the trimmed length). The ticket gave only "starting `name:`" for the out-of-range message; the wording follows the existing `nameIssue` message.

## Mutation checks (all undone; final tree is clean and committed)

Route unit file (break, then the failing test):
- slot after secret compare, and slot removed: the 403-after-slot, 404-after-slot, 429-before-read and shared-budget tests fail (PUT slot-accounting rows also fail for the removed slot).
- no trim: "answers 200 ... changes only the name" fails. `>=` cap: the exact-cap test fails. Cap/empty measured untrimmed: the whitespace-padded exact-cap test fails and the blank-name row fails (the over-cap-untrimmed break first survived; the exact-cap test was changed to pad with whitespace, then it failed).
- `typeof name !== 'string'` broken: "number name" row fails. `isPlainObject` broken: "an array" row fails.
- revision check removed: "answers 412 for the right secret with a stale If-Match" fails. Mismatch log removed: same test (its log assertion) fails. CAS conflict ignored or its log removed: the PATCH race test fails.
- revision not bumped / updatedAt not set / same-name write skipped / extra body key written: the matching "renamed" tests fail.
- body check before the headers, `If-Match` check after the body: the 401 and 428 tests fail (the second break fails only the 428 test).
- PATCH not allowed, PATCH not dispatched: the PATCH rows, all four 405 table rows and both DELETE-in-production rows fail.
- catalog re-validation added: "renames a build whose steps the catalog no longer accepts" fails. Unreadable stored JSON mapped to 404: the 500 test fails. `catch` removed: the 503 test fails. Secret check removed: the 403 test fails. The 403 path writing before answering: the 403 "writing nothing" assertion fails. The 412 path writing before answering: the "stored unchanged" assertion fails.
- Deleted: the `replaceNamed not called` assertion in the 500-bad-stored-JSON test (no break can reach it).
- After the `writeNextRevision` refactor the slot, revision, CAS, change-ignored and untrimmed breaks were re-run: PATCH and PUT tests fail as listed above.

Client unit file: method PUT, body altered, `If-Match` revision+1, no `Bearer`, signal dropped each fail the request test; status check dropped fails the "201 with valid body" row; shape check dropped fails the "200 without revision" row; rename failures forced to `other` fails the 412, 401, 403 and 404 rows (and the other rows of the table).

Acceptance spec `aoe4-named-builds-rename.spec.ts`: revision check removed fails "a stale If-Match gives 412"; secret check removed fails "a wrong secret gives 403"; no trim and revision not bumped fail the rename test. Dropping `PATCH` from the allowed list fails the 405 test in `aoe4-named-builds-api.spec.ts` and the contract 400/401/404/405/428 example tests. `WWW-Authenticate` removed from the rename 401 reply: no spec fails (the contract spec compares example bodies only; the header is asserted by the unit test, and the OpenAPI declaration is checked statically). The static OpenAPI structure assertions I added (rename statuses, 413 without content, security, `If-Match`, request schema ref) were not individually mutated.

## Clean

- codegen: none set. `npx next build`: success. `npx tsc --noEmit` and `npm run lint:dup`: clean (0 clones) after extracting `writeNextRevision`, `racedStore` and merging the update and rename client tests.
- Diff reviewed: no unrelated files; no lockfile or tool changes.

## Invariants

S3: rename takes a write-budget slot and caps the name at `SAVED_NAME_MAX_CHARS`. A1 to A3 untouched. No `INVARIANTS.md` regressions.

## Unverified assumptions

None added; the ticket's existing one (`replaceNamed` etag conflict) is exercised through `blob-fake-test-helpers.ts`/the memory store only.

## Out-of-scope findings

- `acceptance/aoe4-named-builds-api.spec.ts` "after 30 writes across the three routes" does not include rename; the unit test covers the shared budget.
- Contract spec does not compare the live `WWW-Authenticate` header against the OpenAPI 401 header for any operation.
