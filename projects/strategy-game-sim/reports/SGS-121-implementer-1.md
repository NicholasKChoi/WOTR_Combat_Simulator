# SGS-121 implementer report 1

- Ticket: SGS-121 named build routes and OpenAPI (M8, risk high)
- Branch: `sgs-121-named-build-routes`, based on `sgs-120-named-routes` at 3311fa4
- Tip: 0ff9f818d4f083d7a298be801e2800047cc80bed (one commit, author choinickolas@gmail.com)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-121-named-build-routes

## Files touched

- `lib/aoe4-build-order/named-builds-routes.ts` (new): `createNamedBuildReply` and `namedBuildReply` (GET, PUT, DELETE), following the three C1 order tables.
- `lib/aoe4-build-order/builds-routes.ts`: exports `StoreGetter`. Adds `refusedSaveSlot` (the 429 with Retry-After) and `disallowedMethod` (the 405 Allow list, with DELETE only when env is neither null nor production), which `saveBuildReply`, `savedBuildReply` and the named replies all call. The saved-build replies do not change.
- `lib/aoe4-build-order/api-route.ts`: `sendReply` writes a body whose reply sets `ETag` with `res.end(JSON)` and a JSON Content-Type. `ReplyTarget.end` takes an optional chunk. See Deviation.
- `lib/aoe4-build-order/route-test-support.ts`: `recordingTarget().end` records the chunk when there is one.
- `lib/aoe4-build-order/api-route.test.ts`: one new `sendReply` case.
- `lib/aoe4-build-order/named-builds-routes.test.ts` (new): 82 tests.
- `pages/api/aoe4-build-order/named-builds/index.ts` and `[id].ts` (new): thin adapters with a `128kb` body limit.
- `docs/api/openapi.json`: version 2.5.0, the two paths and four operations, three schemas, and `securitySchemes.editSecret`. The diff removes only the old version line.
- `acceptance/helpers.ts`: `NAMED_BUILDS_PATH`, `namedBuildUrl`, `postNamedBuild`, `putNamedBuild`.
- `acceptance/openapi-schemas.ts`: `routeFilePaths()`.
- `acceptance/aoe4-named-builds-api.spec.ts` (new, live) and `acceptance/aoe4-named-builds-api-contract.spec.ts` (new, contract).
- `acceptance/aoe4-builds-api-contract.spec.ts`, `fight-api-spec-surface.spec.ts`, `aoe4-gathered-resources.spec.ts`, `aoe4-simulate-api-issue-shape.spec.ts`: the version pin is now 2.5.0, and each path list is now `routeFilePaths()`.
- `ARCHITECTURE.md`: the AoE4 route logic row.
- `docs/aoe4-build-order.md`: a new "Named builds routes" subsection.

## Deviation: sendReply and ETag (found by the live spec)

The first acceptance run failed: create returned `ETag: "12w7ey2gqit5j"`, not `"1"`.

The cause is Next's API `res.send` (`node_modules/next/dist/server/api-utils/node/api-resolver.js:69-70`, `send-payload.js:33-40`). It always calls `setHeader('ETag', generateETag(body))`, which overwrites a route's own ETag, and `generateEtags` in next.config does not change this path. So with `res.json`, the revision ETag the ticket requires can never reach a client.

The fix is in the shared `sendReply` and touches only replies that set `ETag`. Today those are the named create, GET and update replies. Every other reply still goes through `res.json`, so its framework ETag and 304 behaviour are unchanged. The fix is small, but it edits `api-route.ts`, a file this ticket does not list; the reviewer should confirm that is acceptable.

## Tests

- `npm test`: 73 files, 2340 passed, 13 skipped (pre-existing skips).
- `named-builds-routes.test.ts`: 82 passed. Invariants it encodes:
  - Every create, update and GET/DELETE table row, with exact status, body text and headers.
  - Rows before the store call neither the getter nor `bumpCounter`, and a refused slot writes neither the counter nor a build.
  - The id and secret come from the injected random. The stored record has revision 1, `createdAt` equal to `updatedAt` equal to nowMs, and `secretHash` equal to the hash, and does not contain the secret. Two creates give different ids and secrets.
  - idFailure fires before the getter, both when random throws on every call and when it throws only for 32 bytes. A collision gives a 500 with a log and no retry.
  - PUT order: a bad id gives 404 with no getter call; 401 comes with WWW-Authenticate; 428 comes before 400; 400 and 413 make no store call; an exhausted slot gives 429 before `getNamed`, even with a wrong secret; a wrong secret with a stale If-Match gives 403.
  - Slot accounting: 404, 403, 412 and 200 each cost one slot; 401, 428 and 400 cost none.
  - A successful update keeps `createdAt` and `secretHash` and can rename. Repeating it gives 412. The same content again gives revision 3.
  - Compare-and-swap: when a competitor writes first, the update gets 412 and the competitor's write is kept. A throwing `replaceNamed` gives 503.
  - A stored value that fails the schema gives 500, and its marker is not logged, including inside an Error's message or stack.
  - GET returns no-store, the ETag, and no `secretHash`. GET after an update returns the new revision.
  - DELETE works in development; in production and with env null it is 405 and deletes nothing. GET and DELETE spend no slot.
  - No console call ever receives the secret or its hash.
- `api-route.test.ts`: the new case checks that an ETag reply is written as status, its headers, Content-Type, then `end(JSON)`, and that `json` is never called.
- Acceptance, one run: `npm run acceptance --` the two new specs plus `aoe4-builds-api`, `aoe4-builds-api-contract`, `aoe4-builds-api-refusals`, `fight-api-spec-surface`, `aoe4-gathered-resources` and `aoe4-simulate-api-issue-shape`. Result: 109 passed, 0 failed. The two new specs have 28 tests between them.

## Pre-existing tests edited

- `acceptance/aoe4-builds-api-contract.spec.ts`, test 'is version 2.4.0 with exactly the four paths': renamed to 'is version 2.5.0 and documents exactly the route files'. The pin is now 2.5.0 and the literal path list is now `routeFilePaths()`. Allowed by Scope: "A version pin becomes 2.5.0. A path list becomes a property".
- `acceptance/fight-api-spec-surface.spec.ts`, 'is OpenAPI 3.1 and lists /api/fight, ...': the literal list is now `routeFilePaths()`, under the same Scope rule. In the same file, `AOE4_SCHEMA_NAMES` gains `CreateNamedBuildResponse`, `NamedBuild` and `UpdateNamedBuildResponse`. That list sorts schemas into fight and AoE4, and the three new schemas would otherwise fail it. Scope's rule is "Update every existing acceptance spec that pins ... by rule"; this is the closest match. Flagging it for review.
- `acceptance/aoe4-gathered-resources.spec.ts` and `aoe4-simulate-api-issue-shape.spec.ts`: 2.4.0 is now 2.5.0 in titles and assertions, per the version-pin rule.
- `lib/aoe4-build-order/route-test-support.ts` (test helper, not a test): `end` records `end <chunk>` when given a chunk. Existing calls of `end()` without an argument still record `end`.

## Doc claims

- ARCHITECTURE.md: "`named-builds.ts` is browser-safe and holds the named-build ids, edit secrets, shapes and header parsers". True by `named-builds.ts:2` (Web Crypto only), `newNamedBuildId`, `newEditSecret`, the schema and types, `parseEditSecret` and `parseIfMatchRevision`.
- ARCHITECTURE.md: "`named-builds-routes.ts` is the named-builds route logic, in the same style". True by `createNamedBuildReply` and `namedBuildReply`, which return `RouteReply`.
- ARCHITECTURE.md: "the named route files under `pages/api/aoe4-build-order/named-builds/` only adapt `req` and `res`: they call these functions and `sendReply`". True by `index.ts` and `[id].ts`, which have no branches.
- aoe4-build-order.md: "Every create makes a new random id and a new edit secret, even for a body posted before." True by `newCredentials`; tested.
- "The secret is in the create response only. The store keeps only its hash, and no route logs it." True by the json at `named-builds-routes.ts:55`, the two fixed console messages, and the never-logged test.
- "`GET` returns the latest revision with `Cache-Control: no-store`, and its `ETag` is the revision. The body never has the secret hash. A malformed id and an id with no build give the same 404." True by `readNamedBuild` and `notFound`.
- "An update needs the edit secret as `Authorization: Bearer <secret>` and the current revision as `If-Match`. A revision that is not the stored one is 412, and so is a write that lands between the read and the replace; the other write is kept. A successful update stores the next revision even when the content is unchanged, and may rename the build." True by `updateNamedBuild` lines 97-119; tested by the compare-and-swap and revision-3 tests.
- The order sentence (id, 401, 428, body, slot, 404, 403, 412, and the 404/403/412 after the slot costing it). True by `namedBuildReply:132` and `updateNamedBuild:97-111`; tested by slot accounting.
- "Creates, updates and `POST /builds` saves share one per-client write budget, `SAVE_RATE_LIMIT`. Reads and deletes cost nothing." True because all three call `refusedSaveSlot`, which calls `takeSaveSlot` with the same key, and the GET/DELETE branch makes no slot call. Tested by the live budget spec.
- "`DELETE` exists outside production only, as for saved builds: in production, and when `VERCEL` is set without `VERCEL_ENV`, it is 405 with `Allow: GET, PUT`." True by `disallowedMethod` (env null or production) and `deploymentEnv`, which returns null in that case.
- Code comment in `api-route.ts`: "Next replaces the ETag of a res.json body with a hash of that body, so a body with its own ETag is written directly." True by `api-resolver.js:69-70` and `send-payload.js:39`, and by the failed live run quoted above.
- Code comment in `named-builds-routes.ts:1-2`: "The order of the checks is the contract: the first failing check answers, and an update takes its rate-limit slot before the edit secret is compared." True by `updateNamedBuild:106-110`.
- Code comment in `builds-routes.ts:28`: "DELETE is allowed only outside production; the 405 names the methods the deployment allows, or null when allowed." True by `disallowedMethod:30-31`.
- Code comment in `acceptance/openapi-schemas.ts`: "The URL of every route file under pages/api: the extension and a trailing /index dropped, [x] written {x}." True by the `routeFilePaths` regexes.
- OpenAPI prose: it states the table rules, and every example equals or validates against a real response (contract spec). The 4xx examples (400, 401, 404, 405, 428) equal real responses.

## Pinned outputs

None beyond the ticket's literal texts. The create test pins `id = newNamedBuildId(fixedRandom)` and `editSecret = newEditSecret(fixedRandom)` by calling those functions, not by literal strings.

## Mutation checks

Each break was applied by a script, which then ran the three route test files and restored the file from its saved text. `git status` after the script showed only the intended changes. Breaks:

- `named-builds-routes.ts:43`, 405 check disabled: fails "answers 405 with Allow: POST for GET" (201 instead of 405).
- `:45`, body-check status 400 changed to 418: 6 rows fail "answers ... with the check error, calling no store" (418 instead of 400).
- `:51`, idFailure replaced by storageUnavailable: both random-throws rows fail (503 instead of 500).
- `:55`, editSecret added to the stored json: "created answers 201 ... stored record" fails on `not.toContain(secret)`.
- `:59`, create slot dropped: "answers 429 with Retry-After once the client spent its slots" fails (201), along with the slot-count tests.
- `:61`, 'exists' ignored: "answers 500 for an id collision" fails (201).
- `:65`, ETag "2": "answers 201 ... ETag \"1\"" fails, and so does the sendReply ETag case.
- `:73`, absent turned into 500: the absent-id 404 rows fail for PUT and GET.
- `:76`, logging `JSON.stringify(found.value)` instead of the zod error: "answers 500 for a stored value that fails the schema, and logs no part of it" fails (marker found).
- `:89`, secretHash kept in the GET body: "answers 200 ... every stored field but secretHash" fails.
- `:88`, Cache-Control dropped: the GET 200 tests fail on headers.
- `:98`, WWW-Authenticate dropped: the 401 test fails on headers.
- `:100`, 428 changed to 400: "answers 428, not 400" fails, along with the malformed If-Match rows.
- `:106`, slot moved after the secret check: "answers 429 for an exhausted slot before reading the build, even with a wrong secret" fails (403), along with the 404 and 403 slot-count tests.
- `:110`, secret check disabled: "answers 403 for a wrong secret with a stale If-Match" fails (412).
- `:110`, 412 checked before 403: the same test fails (412 instead of 403).
- `:111`, revision check removed: the 412 stale and repeat tests fail (200).
- `:111`, `console.warn('stale', secret)` added: "never logs the secret or its hash" fails.
- `:60`, `console.info({ secretHash })` added on create: "never logs the secret or its hash" fails.
- `:114`, createdAt reset: "answers 200 with ETag \"2\" ... keeping createdAt" fails.
- `:115`, 'conflict' ignored: "answers 412 when another write lands between the read and the swap" fails (200).
- `:132`, id check weakened to a string test: the invalid-id rows fail (the getter is called).
- `:137`, a slot taken on GET/DELETE: the three "spends no slot" tests fail (bumpCounter called twice).
- `:138`, deleteNamed dropped: "answers 204 for a DELETE in development, and a following GET answers 404" fails.
- `builds-routes.ts:30`, env null allowing DELETE: "answers 405 for DELETE in null and deletes nothing" fails, along with the savedBuildReply null-env test.
- `builds-routes.ts:25`, Retry-After dropped: the saveBuild and create 429 tests fail on headers.
- `api-route.ts:49`, ETag branch removed: the new sendReply ETag case and the named sendReply case fail (`json` was called).
- Live: named create's slot key changed to `named:${clientKey}` at `named-builds-routes.ts:59`. The acceptance budget test then failed on `/builds` (Expected 429, Received 201). The file was restored from a copy and a `diff` confirmed it identical.
- The live ETag assertion also failed against the unpatched `sendReply`, as described in Deviation.

Every break was undone. The commit contains none, and tsc and the full unit suite passed after the last restore.

## Codegen, build, lint

- codegen: not set for this repo.
- build: `npx next build` passed; both named-builds routes are listed as dynamic.
- lint: `npx tsc --noEmit` is clean. `npm run lint:dup` found 0 clones.
- Adapter type mismatch: changing `index.ts` to `NextApiResponse<BuildsError | SimulateError>` gives `index.ts(13,18): error TS2345: Argument of type 'RouteReply<BuildsError | CreateNamedBuildResponse | SimulateError>' is not assignable to parameter of type 'RouteReply<NoInfer<BuildsError | SimulateError>>'`. The change was reverted and tsc is clean again.
- Searches:
  - `git grep -n "2\.4\.0" -- acceptance` finds nothing.
  - `console.` in `named-builds-routes.ts` appears only on lines 62 and 76, with the two fixed messages; the second also passes the zod error.
  - `@vercel/blob` appears only in `blob-build-store.ts`.
  - `node:` in `named-builds.ts` appears only in its comment "no node: modules", with no import.
  - No spec compares `spec.paths` keys to a literal list.
- Diff review: `git diff --stat 3311fa4` lists only the files above, and there is no lockfile, cache or formatting noise. AGENTS.md is unchanged.

## Invariant check

- No secret is logged or stored, and `secretHash` is never in a response. Upheld; tested.
- `@vercel/blob` is imported only by `blob-build-store.ts`. Upheld.
- `named-builds.ts` stays browser-safe. Upheld; it is untouched.
- Thin adapters, with the response type tied to the reply union. Upheld, as the tsc failure shows.
- jscpd threshold 0. Upheld.
- The OpenAPI spec is updated with the route, and no existing operation changed. Upheld.
- The saved-build replies are unchanged after the extraction. Upheld; `builds-routes.test.ts` passes untouched.
- Deviation: shared `sendReply` behaviour changed for ETag replies only. Covered above.

## Out-of-scope findings

- origin/main has a newer commit, 156bf30 (#133), that is not in this base, which is the SGS-120 branch.
- Because `sendReply` now bypasses Next for ETag replies, a client's `If-None-Match` gets no 304 on a named GET. A 304 is not required (the route is `no-store`); noted only.

## Status

needs_review. Review should confirm the `sendReply` change in `api-route.ts`, which the ticket did not name but which a live revision ETag requires.
