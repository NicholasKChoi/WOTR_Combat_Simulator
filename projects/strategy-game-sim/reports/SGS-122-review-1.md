# SGS-122 review 1

- Branch `sgs-122-named-build-client`, tip `e137e688b7e701d3696c22a5cc7442f4d49bc9cd`, base `origin/main` 086951e (merge-base). Full review (not delta mode).
- Ticket re-specced once (strip, not reject, a leaked `secretHash`); reviewed against the re-specced text.

## Verdict: APPROVE

No blocking findings.

## Blocking findings

None.

## Spec gaps

None. Re-spec 1 resolved the implementer's `secretHash` gap; the code (`namedBuildBodySchema` in default strip mode, named-build-client.ts:19) and the test ("drops a secretHash the body still carries", named-build-client.test.ts:42-46, `toStrictEqual` against `{ status: 'ok', build }`) match the new criterion.

## Acceptance criteria

1. PASS - `loadJson` table (build-fetch.test.ts:17-30): 200 valid -> ok+value; 404 -> not-found; 500, 503, schema-failing 200, non-JSON 200, rejecting fetch, aborted signal -> failed. A 404-as-failed or a skipped `safeParse` fails the `404` or the `{ name: 3 }` row (implementer mutation-checked both).
2. PASS - request shape test (build-fetch.test.ts:32-41) checks `Accept: application/json` and `init.signal toBe signal`. `stubFetch` (fetch-test-helpers.ts:3-7) rejects only when `signal.aborted`, defined once and imported by both new test files only; `git grep fetch-test-helpers` shows no production importer.
3. PASS - `sendJson` (build-fetch.test.ts:44-83): method, `JSON.stringify(body)`, Content-Type and Accept, `Authorization` and `If-Match` unchanged, signal; Retry-After as `retryAfter` and `null` when absent; non-JSON gives `body: undefined` with status 502 kept; rejecting fetch and aborted signal give the all-null reply. I mutated the catch to return `status: 0`: both null rows failed.
4. PASS - `loadNamedBuild` (named-build-client.test.ts:27-56): 21-char, 23-char and 11-char ids give not-found with `fetch` not called; valid id requests `/api/aoe4-build-order/named-builds/<id>` with the signal; 200 `NamedBuild` returned as `build`; body plus 43-char `secretHash` gives ok with no `secretHash` key (`toStrictEqual`). I applied `.passthrough()` to the schema and that test failed. Missing `revision` and non-named `id` give failed; 404 gives not-found.
5. PASS - `createNamedBuild` (named-build-client.test.ts:58-77): 201 valid -> ok; 200 valid and 201 without `editSecret` (plus 201 with revision 2) -> `{ ok: false, kind: 'other', message: GENERIC }`; POST to `/api/aoe4-build-order/named-builds` with `JSON.stringify(request)` and the signal.
6. PASS - `updateNamedBuild` (named-build-client.test.ts:79-101): PUT to `/named-builds/<id>`, `Authorization: Bearer <secret>`, `If-Match: "2"` with quotes; 200 valid -> ok; 201 -> other.
7. PASS - failure table (named-build-client.test.ts:103-127) runs each row through both create and update: 412 conflict, 401 and 403 forbidden, 404 not-found with the Scope texts verbatim; 400 issue, 413, 429 + `Retry-After: 90` ("Too many saves. Try again in 2 minutes."), 503, 500, rejecting fetch with `saveFailureMessage` texts (checked against save-build-client.ts:23-38). I removed `case 401` from `failureOf`: the `401` row failed.
8. PASS - `save-build-client.test.ts` untouched in the diff and passing; `saveFailureMessage` unchanged (diff touches only the import, `readJson`, and `postSavedBuild`). `postSavedBuild` keeps the 200-or-201 rule, `isSaveBuildResponse`, null-status generic message and the Retry-After path through `sendJson`.
9. PASS - `saved-build-loader.test.ts` keeps invalid ids with no request, the request-with-signal case, the parsed record, another version and 404, with unchanged expected values. Removed only: non-JSON, 500, 503, network error, aborted signal, all present as `loadJson` rows in build-fetch.test.ts.
10. PASS - `git grep -n "fetch(" -- <three client files>` and `git grep -n readJson -- components` both empty.
11. PASS - no `node:` import in build-fetch.ts or named-build-client.ts; `npx tsc --noEmit` clean and `npm run lint:dup` 0 clones (run by me).
12. PASS - no INVARIANTS.md regressions (below).

## Invariants touched

- A1, A2, A3 (path `components/apps/aoe4-build-order/**`): hold. The diff has no simulation code, no game numbers, and no randomness or clock reads.
- S1: holds. Imports stay within `lib/aoe4-build-order` and `components/apps/aoe4-build-order`.
- S2, S3: not affected (no page, no numeric input, no route).

## Contract checks

- C4 and C4a signatures match `design/M8.md` lines 206-226 exactly (`LoadJsonResult<T>`, `loadJson`, `JsonReply`, `sendJson`, `NamedSaveFailure`, `createNamedBuild`, `updateNamedBuild`, `loadNamedBuild`). `namedBuildBodySchema` is the design's expression verbatim and module-local; C1 unchanged.
- C1 names used: `isNamedBuildId`, `NAMED_BUILD_ID_PATTERN`, `revisionEtag`, `storedNamedBuildSchema`, `NamedBuild`, `CreateNamedBuildResponse`, `UpdateNamedBuildResponse`, from `lib/aoe4-build-order/named-builds.ts`.
- Response checks are hand-written over flat shapes of 4 or 5 fields, within the common.md Input validation threshold.
- Scope: `save-build.tsx`, the page, `build-input.tsx`, `my-builds-storage.ts`, routes, `docs/` untouched. Nothing outside `components/apps/aoe4-build-order/`.
- spec-checklist: Key surfaces unaffected (no route change, so no openapi.json change needed); no Out of scope item; no invented constant (all texts and statuses from the ticket); names state intent; no dead enum values.

## Linter

`npx tsc --noEmit`: clean. `npm run lint:dup` (`.jscpd.json`: minTokens 70, minLines 8, threshold 0 over lib, components and API for aoe4): 0 clones. No ESLint config in the repo.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md; no bot run.

## Correctness

- `loadJson` (build-fetch.ts:11-21): 404 checked before the 200 gate; every throw (fetch, `response.json()`, abort) falls into the catch and gives `failed`. `safeParse` is used, so it never throws on a bad body.
- `sendJson` (build-fetch.ts:23-46): defaults first, then `init.headers`, matching the C4a order; network error or abort gives the all-null reply; a non-JSON body gives `undefined` with the status kept.
- `isCreateResponse` requires `revision === 1`, matching the `revision: 1` literal type; `isUpdateResponse` requires a number.
- `loadNamedBuild` returns not-found before any request on an invalid id; non-ok results pass through unchanged.
- No timers, subscriptions or locks.

## Conventions

- Formatting (4 spaces, no semicolons, single quotes) matches the sibling `components/apps/aoe4-build-order/` modules, e.g. save-build-client.ts:1-45 and saved-build-loader.ts.
- The response guards follow the shape of `isSaveBuildResponse` (save-build-client.ts:40-42), with a small shared `hasStrings` helper instead of five copies of the `in`/`typeof` chain.
- Test layout follows saved-build-loader.test.ts: `it.each` tuples with a `%s` label, `afterEach(vi.unstubAllGlobals)`, `toStrictEqual` on whole results.

## Checklist (REPO.md Review checklist)

- Every diff: `npx next build` run by me and it passed. No page is touched and no page imports the new modules, so there was no page to load. No UI inspection: the diff changes no UI.
- AoE4 build order: no helper, constant or tolerance copied from another module. `readJson` was removed instead of copied, and `loadSavedBuild` and `postSavedBuild` now use `build-fetch.ts`. No engine rule change, so `docs/aoe4-build-order.md` needs no update. No UI states to screenshot.
- Shared code, Combat simulator, Starcraft helper, golang: paths not touched.

## Non-blocking notes

1. saved-build-loader.test.ts:13-17 and :40 still define a local `stubFetch` and `json` builder that duplicate `stubFetch` and `reply` in fetch-test-helpers.ts. The local stub does not reject on `signal.aborted`, unlike the stub the ticket describes. The ticket names only the two new test files as importers, and the remaining signal test (`init.signal toBe signal`) still catches a dropped signal, so this is not a defect. A later edit could switch the file to `fetch-test-helpers.ts`. save-build-client.test.ts:39 has the same local stub, but the ticket requires that file to stay unedited.
2. ARCHITECTURE.md:47-48 says "shared test helpers live in `lib/aoe4-build-order/test-helpers.ts`". The ticket chose a second test-only module, `components/apps/aoe4-build-order/fetch-test-helpers.ts`, which imports `vitest`. The diff did not touch that sentence, so it is not a blocking doc finding, but it now reads as incomplete. Candidate BACKLOG line: extend the sentence to name `fetch-test-helpers.ts` for the client fetch stub.
3. `sendJson` keeps the status and returns `body: undefined` when an abort lands after the headers arrive, while `response.json()` is still reading. The old `postSavedBuild`/`readJson` behaved the same way, and the C4a row names only a fetch-level abort as the null case.

## Coverage

- Reviewed: every file in the diff: build-fetch.ts, build-fetch.test.ts, fetch-test-helpers.ts, named-build-client.ts, named-build-client.test.ts, save-build-client.ts, saved-build-loader.ts, saved-build-loader.test.ts. Also read: lib/aoe4-build-order/named-builds.ts (C1 names and types), save-build-client.test.ts, ARCHITECTURE.md, design/M8.md C1 GET rows, C4 and C4a.
- Ran: tsc, lint:dup, `next build`, vitest on the four touched test files (74 passed), and three of my own mutations (passthrough schema, 401 dropped from `forbidden`, null status replaced by 0). Each was caught and then reverted with `git checkout`.
- Not run: acceptance and browser tests (not in scope for review); UI inspection (no UI change).
- REVIEW.md: none at the repo root. Project LESSONS.md has no entries.
