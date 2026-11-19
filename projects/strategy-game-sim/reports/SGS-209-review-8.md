# SGS-209 review 8

- Branch `sgs-209-rename-api-patch-named-builds`, tip `eba21efd41be85ed042e117ffb8b77a7c849a523`, base `origin/main`. Full review against the corrected ticket (Rework 1), as the manager asked; the Rework 1 delta (`bce5d14..eba21ef`) was checked on its own as well.
- Scratch: `worktrees/review-sgs-209-rename-api-patch-named-builds`.

## Verdict: APPROVE

## Blocking findings

None.

## Rework 1 required fixes

1. One shared `nameLengthIssue(name)`: landed. `saved-builds.ts:96-99` exports it, `checkSaveBuildRequest` calls it with `checked.order.name` (`:122`), and `checkRenameRequest` calls it with the trimmed name (`named-builds-routes.ts:152-153`). Nothing in the route copies the check or its message any more, and `SAVED_NAME_MAX_CHARS` is no longer imported there. Mutation (`<=` to `<= MAX + 1`) failed the save, create, PUT and PATCH over-cap tests, so both callers go through the one check.
2. 405 on a malformed id: landed. `named-builds-routes.test.ts:279-290` is a table of `POST`/development and `DELETE`/production on `'AbCdEfGhIjK'`. It checks status, the `Allow` header and the message with `toStrictEqual`, and that the getter is never called. Mutation (id-form check moved above `disallowedMethod`) failed both rows.
3. `SAVE_RATE_LIMIT` comment: replaced word for word (`save-rate-limit.ts:7`).

The delta changes nothing else (4 files: the two source files, the test file, the comment).

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

1. PATCH 200, next revision, GET shows the trimmed name, other fields unchanged, `updatedAt` advanced: **pass**. The unit test "answers 200 with ETag "2" and changes only the name, revision and updatedAt" compares the whole stored record and first asserts that `updatedAt` differs. "shows the new name to a following GET" also passes.
2. Check order, one test per status, earlier check wins: **pass**. Method before id form is now covered (fix 2). Id form before secret form: the invalid-id table includes `PATCH`. Secret form before If-Match and body: the 401 test sends `ifMatch: 'junk'` and `body: []`. If-Match before body: the 428 test sends `body: []`. Body before slot: the 400 table asserts that `bumpCounter` is not called. Slot before read: the 429 test asserts that `getNamed` is not called, with a wrong secret. Slot before exists: 404 with counter 1. Slot before secret, and secret before revision: 403 with a stale If-Match and counter 2.
3. Body cases: **pass**. The 400 table has rows for not an object, array, missing name, number, blank name and over the cap, with exact issue codes and messages. A name of exactly the cap length, padded with whitespace, succeeds and is stored trimmed. Extra keys (`extra`, `revision: 9`) are not stored (the whole record is compared).
4. A build the catalog rejects still renames: **pass**. The precondition `checkSaveBuildRequest(...).ok === false` is asserted.
5. Same name writes the next revision: **pass**.
6. Stale If-Match is 412 with nothing written and the mismatch log; a CAS conflict is 412, keeps the other write and logs the conflict: **pass**.
7. 500 on bad stored JSON, 404 after the slot, 503 (getter rejects, `replaceNamed` throws), 429 with `Retry-After` and nothing read: **pass**. `TOO_MANY` carries `Retry-After: 3600`.
8. Same write budget: **pass**. Counter 3 across create, update and rename, and the 429 test exhausts the budget with creates before the PATCH.
9. 405 for `POST`, and for `DELETE` in production or with a `null` env, with the new `Allow` and the store never asked: **pass**.
10. Client tests: **pass**. `describe.each` over update and rename checks the method, `Bearer`, the quoted If-Match, the body and the signal. The failure table runs `renameNamedBuild`. "a 200 without revision" covers the malformed 200.
11. Acceptance spec `aoe4-named-builds-rename.spec.ts`: **pass** by reading. Create, then 403 with a wrong secret, then rename to 200 with ETag "2" and a GET at revision 2 with the trimmed name, then 412 on a stale If-Match. The implementer's run and mutation record are in the earlier implementer report (cited in review 6), and the spec is unchanged since.
12. OpenAPI: **pass**. `renameNamedBuild`, `RenameNamedBuildRequest`, the same status set as `updateNamedBuild`, a 413 with no content, the 405 `Allow` enum and descriptions on all four id-path operations, the `postOnId` POST probe, the 429 and budget descriptions naming `renameNamedBuild`, and 2.7.0 in the document and in all four pinned specs. A search finds no remaining `2.6.0`, `patchOnId`, `GET, PUT, DELETE` or `GET, PUT` pin.
13. Docs: **pass**. The format doc's intro, update bullet, budget bullet and production `Allow` are updated, and it now states the rename's check order and write. The README module map is updated. `ARCHITECTURE.md` does not name the methods. The code comment from review 6 finding 3 is fixed.
14. Existing tests edited: **pass**. Each edit is covered by the ticket's rule (Allow list, 405 message, PATCH disallowed) or changes setup only (the `racedStore` extraction keeps the assertions, and the `updateNamedBuild` client assertions are unchanged under `describe.each`). Rework 1 edited no existing test.
15. No INVARIANTS.md regressions: **pass**.

## Invariants touched

- S3: holds. The only new input is a string capped at `SAVED_NAME_MAX_CHARS` (100) after trimming, and a 400 carries one issue.
- S1: holds. The client imports only `lib/aoe4-build-order` and its own app files.
- A1-A3: the paths match, but no simulation code changed. They hold.

## Bot reconciliation

REPO.md has no `reviewBot.cli` and no `rulesFile`, so this section was skipped.

## Lint and build

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones (177 files).
- Unit `lib/aoe4-build-order` plus `named-build-client.test.ts`: 1936 passed, 15 skipped.
- `npx next build`: succeeds, and the `/api/aoe4-build-order/named-builds/[id]` route is built.

## UI inspection

Not run. The diff changes no browser UI, only an API route and a client fetch function.

## Non-blocking notes

- `acceptance/helpers.ts:85`: `patchNamedBuild` sits after `simulateOk`, not beside `putNamedBuild` as design C8 places it (carried over from review 6).
- `named-builds-routes.ts:148`: the `body as Partial<RenameNamedBuildRequest>` cast is not needed after `isPlainObject` narrows the type.
- `acceptance/aoe4-named-builds-api.spec.ts:120`: the describe "one write budget for saves, creates and updates" does not exercise rename. The unit tests cover the shared budget.
- The name cap counts UTF-16 code units (`.length`), as saves already do, while the docs say "characters". This is the same as before the diff.

## Coverage

- Reviewed every file in `git diff origin/main...HEAD` (18 files), the unchanged pass-through `pages/api/aoe4-build-order/named-builds/[id].ts` (its 128kb `sizeLimit` backs the 413 text), and design/M12.md C8/C9 names.
- Mutations run by review, both caught and both reverted: the method/id-form swap, and moving the name cap by one.
- Not run: acceptance specs (by rule).
- REPO.md Review checklist: the "Every diff" and "AoE4 build order" sections were applied. The every-diff step "load each touched page" does not apply because no page changed. No other section's paths are touched.
