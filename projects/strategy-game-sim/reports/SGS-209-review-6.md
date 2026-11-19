# SGS-209 review 6

- Branch `sgs-209-rename-api-patch-named-builds`, tip `bce5d14d18bf937c4e75502dac331bb24f18b3f7`, base `origin/main` (d80751b). Full review (not delta mode).
- Scratch: `worktrees/review-sgs-209-rename-api-patch-named-builds` (the leftover one from the interrupted pass was removed first; a fresh one was created).

## Verdict: REQUEST CHANGES

## Blocking findings

1. `lib/aoe4-build-order/named-builds-routes.ts:152-153` - checklist(AoE4 build order: copied helper) - the over-cap name check and its message (`name: ${n} characters, more than ${SAVED_NAME_MAX_CHARS}`) are copied from `nameIssue` in `lib/aoe4-build-order/saved-builds.ts:96-99` (the implementer's report says the wording "follows the existing `nameIssue` message"). REPO.md's AoE4 review checklist makes a helper copied between `lib/aoe4-build-order/` modules blocking, because copies drift; here PUT and PATCH would answer different 400 texts for the same name rule the moment one is edited. jscpd does not catch it (too short). Direction: in `saved-builds.ts`, export one `nameLengthIssue(name: string): BuildOrderIssue | undefined` (returns the out-of-range issue when `name.length > SAVED_NAME_MAX_CHARS`), have `nameIssue` call it with `order.name`, and have `checkRenameRequest` call it with the trimmed name instead of building the issue itself. The existing PUT and PATCH unit tests on the over-cap message keep passing unchanged.

2. `lib/aoe4-build-order/named-builds-routes.test.ts:250-264` - test - acceptance criterion 2 requires that "an earlier check wins when two fail" for each step of the order, starting with method before id form. No test sends a disallowed method to a malformed id: every 405 test (`:250`, `:266`, `:279`) uses a well-formed id. Verified: swapping `named-builds-routes.ts:177-179` so `if (!isNamedBuildId(req.id)) return notFound();` runs before `disallowedMethod(...)` leaves all 1906 tests in `lib/aoe4-build-order/` passing. Direction: add a test (a row in the methods describe) that sends `POST` (and `DELETE` with env `production`) to the saved-build id `'AbCdEfGhIjK'` and expects `toStrictEqual` the 405 reply with `Allow: GET, PUT, PATCH, DELETE` / `GET, PUT, PATCH` and the matching message, plus `getter` not called. Production break it fails on: the swap above at `named-builds-routes.ts:177-179`. Precondition: the id is malformed, so the id-first order answers 404; value under the break 404 `no named build with that id`, expected 405.

3. `lib/aoe4-build-order/save-rate-limit.ts:7` - checklist(AoE4 build order: doc sentence left contradicted) (text) - the `SAVE_RATE_LIMIT` doc comment lists the budget's spenders as "saves, named-build creates and updates"; renames now spend it too (`writeNextRevision` takes the slot for PATCH). The ticket's docs criterion names exactly this claim ("only creates, updates and builds saves spend the write budget"), and this is the one place left saying it. Replace with:
   `/** The per-client write budget, maxSaves per windowSeconds, shared by saves, named-build creates, updates and renames (Named builds routes). */`
   Facts kept: per-client, maxSaves per windowSeconds, shared by saves, creates and updates, the `(Named builds routes)` pointer.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

1. PATCH 200, next revision, GET shows trimmed name, other fields unchanged, `updatedAt` advanced: pass. Unit "answers 200 with ETag "2" and changes only the name, revision and updatedAt" compares the whole stored record (precondition `updatedAt` differs asserted); "shows the new name to a following GET".
2. Check order with a test per status and earlier-wins: **fail** (finding 2: method vs id form untested). The rest holds: id vs secret form (invalid-id table now has `PATCH`, no Authorization), secret form vs If-Match/body (401 test sends `ifMatch: 'junk'`, `body: []`), If-Match vs body (428 test `body: []`), body vs slot (400 table asserts `bumpCounter` not called), slot vs read (429 test asserts `getNamed` not called, wrong secret), slot vs exists (404 counter 1), secret vs revision and slot-before-secret (403 with stale If-Match, counter 2).
3. Body cases: pass. 400 table rows for not-an-object, array, missing, number, blank, over cap; exact cap padded with whitespace succeeds and stores trimmed; extra keys (`extra`, `revision: 9`) not stored (whole-record compare).
4. Catalog-rejected build still renames: pass (precondition `checkSaveBuildRequest(...).ok === false` asserted).
5. Same name writes next revision: pass (`firstBuild.name` is stored untrimmed and unchanged by `checkBuildOrder`'s `text()`, so the input is the stored name).
6. Stale If-Match 412 nothing written with mismatch log; CAS conflict 412 keeps other write with conflict log: pass.
7. 500 on bad stored JSON, 404 after slot, 503 (getter rejects, replaceNamed throws), 429 with Retry-After and nothing read: pass. "Nothing is written" for 500 holds by code (`readStored` returns before `replaceNamed`); the implementer deleted that assertion as unreachable by any break.
8. Same write budget: pass ("takes its slot from the budget that create and update spend", counter 3).
9. 405 for POST and DELETE in production / `VERCEL` without `VERCEL_ENV` (env `null`) with the new Allow, store never asked: pass.
10. Client tests: pass. `describe.each` over update and rename checks method, Bearer, quoted If-Match, body, signal; failure table runs `renameNamedBuild`; "a 200 without revision" row covers the malformed 200.
11. Acceptance spec `aoe4-named-builds-rename.spec.ts`: pass by reading and by the implementer's run (62 passed) and mutation record (revision check, secret check, trim, revision bump each failed it).
12. OpenAPI: pass. PATCH `renameNamedBuild`, `RenameNamedBuildRequest`, status set equals `updateNamedBuild`'s, 413 without content, 405 Allow enums/descriptions on all four id-path ops, `postOnId` POST probe in the contract spec over all four ops, 429 and budget descriptions name `renameNamedBuild`, version 2.7.0 in the doc and the four specs (grep finds no other 2.6.0 pin outside `golang/` lockfiles).
13. Docs: pass for `docs/` and `lib/aoe4-build-order/README.md` (format doc intro, update bullet, budget bullet, production Allow, rename check order and write). The same stale budget claim survives in a code comment (finding 3).
14. Existing tests edited: pass. Each edit listed by the implementer is covered by the ticket rule (Allow list/405 message/PATCH disallowed) or is setup only (`racedStore` extraction keeps the PUT race test's assertions; the `updateNamedBuild` client tests keep the same assertions under `describe.each`).
15. No INVARIANTS.md regressions: pass.

## Invariants touched

- S3: holds. The only new input, `name`, is a string capped at `SAVED_NAME_MAX_CHARS` after trimming; the 400 body has one issue.
- S1: holds (client imports only `lib/aoe4-build-order` and its own app files).
- A1-A3: paths match; no simulation code changed. Hold.

## Bot reconciliation

No `reviewBot.cli` and no `rulesFile` in REPO.md; section skipped.

## Lint

`npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones. Unit: the two changed test files pass (138 tests).

## UI inspection

Not run: the diff changes no browser UI (client fetch function and API route only).

## Non-blocking notes

- `acceptance/helpers.ts:85`: `patchNamedBuild` sits after `simulateOk`, not beside `putNamedBuild` (`:436`) as the ticket and design C8 place it. Moving it next to `putNamedBuild` keeps the named-build helpers together.
- `named-builds-routes.ts:148`: `body as Partial<RenameNamedBuildRequest>` is unneeded after `isPlainObject` narrows `body` to `Record<string, unknown>`; harmless.
- `acceptance/aoe4-named-builds-api.spec.ts:120` describe "one write budget for saves, creates and updates" does not exercise rename (implementer's out-of-scope note); the unit test covers the shared budget.

## Coverage

Reviewed: every file in `git diff origin/main...HEAD` (16 files), `pages/api/aoe4-build-order/named-builds/[id].ts` (unchanged, pass-through confirmed, 128kb `sizeLimit` backs the PATCH 413 text), `api-route.ts`, `builds-routes.ts` `disallowedMethod`, `saved-builds.ts` name check, `save-rate-limit.ts`, `named-builds.ts` header parsers. Compared the client against `updateNamedBuild` (`named-build-client.ts:64-74`) and the route against the pre-diff `updateNamedBuild`. Mutation run by review: method/id-form order swap (no test failed; reverted). Not run: `npx next build` (implementer recorded success; no page or component rendering changed), acceptance specs (by rule). REPO.md Review checklist: "Every diff" and "AoE4 build order" sections applied; no other section's paths touched.
