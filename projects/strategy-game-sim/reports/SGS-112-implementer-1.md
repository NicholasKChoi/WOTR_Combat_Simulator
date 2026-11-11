# SGS-112 implementer report 1

- Ticket: SGS-112-server-debt-typed-replies-fail-closed
- Branch: sgs-112-server-debt (base b3da879, origin/main at branch time)
- Tip SHA: 36be3d2
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-112-server-debt
- origin/main has since moved to 55bb1ed. `git merge-tree --write-tree origin/main HEAD` reports no conflicts. Both sides touch docs/aoe4-build-order.md and they merge cleanly.

## Files touched

- lib/aoe4-build-order/api-route.ts: generic RouteReply<Body>/ReplyTarget<Body>; methodNotAllowed returns RouteReply<BuildsError>; new issuesError; sendReply<Body>(res: ReplyTarget<Body>, reply: RouteReply<NoInfer<Body>>).
- lib/aoe4-build-order/saved-builds.ts: badRequest uses issuesError; new deploymentEnv(env) returns null when VERCEL is set and VERCEL_ENV is not.
- lib/aoe4-build-order/build-store.ts:
  - New CounterResult type and nextCounter (the one counter step).
  - The memory and file stores write nothing on 'refused'.
  - storeFor uses deploymentEnv and throws 'VERCEL is set but VERCEL_ENV is not'.
  - bumpCounter takes `limit`.
- lib/aoe4-build-order/blob-build-store.ts: uses nextCounter and returns 'refused' before any put; the read comment states the @vercel/blob 2.9 404 behaviour.
- lib/aoe4-build-order/save-rate-limit.ts: passes SAVE_RATE_LIMIT.maxSaves and handles 'refused' vs 'contended'.
- lib/aoe4-build-order/builds-routes.ts:
  - errorReply, storageUnavailable and idFailure are exported.
  - makeId runs before the store try; a failure gives 500 and nothing reaches the store.
  - canDelete is false for a null env.
  - Replies are typed.
- pages/api/aoe4-build-order/builds/[id].ts: typed NextApiResponse; env comes from deploymentEnv.
- pages/api/aoe4-build-order/builds/index.ts: typed NextApiResponse.
- pages/api/aoe4-build-order/simulate.ts: uses issuesError and sendReply with its typed response.
- lib/aoe4-build-order/route-test-support.ts (new): recordingTarget<Body>() moved out of the two tests.
- Tests:
  - lib/aoe4-build-order/api-route.test.ts: issuesError tests; imports recordingTarget.
  - saved-builds.test.ts: deploymentEnv table.
  - build-store.test.ts: nextCounter table, refused-writes-nothing tests per store, fail-closed rows, BUILDS_LOCAL_DIR doMock cases.
  - blob-build-store.test.ts: LIMIT argument; refused-without-put test.
  - save-rate-limit.test.ts: limit argument asserted; stored count stays at the limit.
  - builds-routes.test.ts: fail-closed 503s, id-failure 500s, env-null DELETE 405, refused saves write nothing, console.error asserted.
  - build-store.acceptance.test.ts: 'nextCounter' added to the export list.
- playwright.config.ts: DROPPED_ENV removed. BUILDS_STORE_ID, VERCEL_ENV and VERCEL are set to '' and BUILDS_LOCAL_DIR is set.
- docs/api/openapi.json: saveBuild "500" response (BuildsError, example idFailure); version stays 2.4.0.
- acceptance/aoe4-builds-api-contract.spec.ts: '500' in the save key list; the idFailure example joins the BuildsError-only test.
- acceptance/aoe4-builds-api.spec.ts: the GET read-back asserts the whole body with toEqual.
- docs/aoe4-build-order.md: the 500 row; the DELETE 405 / 503 fail-closed notes; refused saves write nothing; the id failure answers 500 before any store call.
- ARCHITECTURE.md: storage, route and local saved builds rows updated.

## Tests

- `npm test` (full suite): 63 files, 2001 passed, 13 skipped, 0 failed.
- `npx playwright test acceptance/aoe4-builds-api-contract.spec.ts`: 22 passed.
- `npx playwright test acceptance/aoe4-builds-api.spec.ts`: 14 passed. The run used a throwaway `.env.local` with `BUILDS_STORE_ID=blob_must_not_be_used` and `VERCEL_ENV=production`, deleted afterwards.
  - The save and read-back pass, so Blob was not used.
  - "DELETE answers 204 and a following GET answers 404" passes, so the production env from .env.local did not reach the server.
  - The full-body toEqual read-back passed without normalisation.
- Invariants the tests encode:
  - The stored counter never passes the limit; a refused bump writes nothing (memory, file, Blob).
  - nextCounter is the one counter step: same window below the limit steps; at the limit refuses; a new window, a missing count or a non-number count restarts at 1.
  - VERCEL set without VERCEL_ENV fails closed. deploymentEnv returns null, buildStoreFromEnv rejects, save and GET answer 503 with one console.error, and DELETE answers 405 without calling deleteBuild.
  - An empty VERCEL ('') is not "set", so the file store is used.
  - An id failure answers 500 `the build id could not be created`, logs the cause once, and calls neither the store getter nor bumpCounter.
  - The Blob module is imported only when BUILDS_STORE_ID is non-empty.
  - Logs carry no client key.
  - issuesError caps at MAX_REPORTED_ISSUES, sets omittedIssues only when > 0, and uses the first issue's message.

## Pre-existing tests edited

- api-route.test.ts: the local recordingTarget was removed and is now imported from route-test-support. Rule: the ticket's "Tests to update" (recordingTarget move).
- builds-routes.test.ts:
  - Same recordingTarget move; the DELETE describe uses `recordingTarget<NonNullable<typeof reply.body>>()`.
  - The getter-reject and GET 500 tests now also assert console.error called once.
  - The no-client check uses a loggedStrings helper.
  - Rules: "Tests to update" and the M8.7 test-debt items.
- build-store.test.ts:
  - Existing bumpCounter calls take the LIMIT argument.
  - The BUILDS_LOCAL_DIR cases add vi.doMock of ./blob-build-store before the fresh import (see Deviations).
  - Rule: "Tests to update" (signature change), plus the acceptance item that the Blob import stays lazy.
- blob-build-store.test.ts: LIMIT = 30 passed in every bumpCounter call. Rule: signature change, "Tests to update".
- save-rate-limit.test.ts: the stub takes 3 args and asserts `toHaveBeenCalledExactlyOnceWith('c', W, SAVE_RATE_LIMIT.maxSaves)`. Rule: "Tests to update".
- build-store.acceptance.test.ts: 'nextCounter' added to the export list. Rule: the ticket's export-list rule for new exports.
- acceptance/aoe4-builds-api-contract.spec.ts and acceptance/aoe4-builds-api.spec.ts: edited per the ticket's Acceptance items (500 key; full read-back).

## Deviations from the ticket's literal text

1. sendReply's reply parameter is `RouteReply<NoInfer<Body>>`, not `RouteReply<Body>` as in design C3.
   - tsconfig has `"strict": false`, so strictFunctionTypes is off and `json(body: Body)` is bivariant.
   - With the design's literal signature, removing `BuildsError` from `builds/[id].ts`'s response type still compiled. That breaks the Acceptance item "a wrong body fails tsc".
   - A property-syntax `json: (body: Body) => void` did not help either, because function parameters are bivariant without strict.
   - With NoInfer, Body comes only from the NextApiResponse. The reply check is then a covariant property check, and the mismatch fails.
   - No handler needs an explicit `sendReply<Union>` and none casts.
2. `[id].ts` calls `deploymentEnv({ VERCEL: process.env.VERCEL, VERCEL_ENV: process.env.VERCEL_ENV })`, not `deploymentEnv(process.env)`. NodeJS.ProcessEnv fails TS's weak-type check against `{ VERCEL?: string; VERCEL_ENV?: string }`.
3. The failed-Blob-import case asserts `rejects.toHaveProperty('cause.message', 'blob import failed')`, not `rejects.toThrow('blob import failed')`. Vitest 5.0.5 wraps a throwing mock factory in "[vitest] There was an error when mocking a module" and keeps the original as `cause` (@vitest/mocker chunk-registry.js:203-205). The literal assertion cannot pass.
4. The BUILDS_LOCAL_DIR cases use `vi.doMock('./blob-build-store', ...)` before `await import('./build-store')`. Vitest keeps a vi.mock factory's result across vi.resetModules, so without doMock a static import of the Blob module was not detected (mutation 7 passed). With doMock it fails.
5. Test-only cast in builds-routes.test.ts: `{ VERCEL: '1' } as Record<string, string> as NodeJS.ProcessEnv`, to avoid TS2352. It is not in a handler.
6. Process slip in the first session: some edits were made with python and `sed -i` instead of Edit/Write. The resulting content was reviewed and is covered by the tests above.

## Doc claims

- api-route.ts: "The caller guarantees at least one issue: the first one's message is the error." Code: `issuesError` returns `error: issues[0].message`. Callers: saved-builds.ts `checkSaveBuildRequest` calls badRequest only when `found.length > 0` or `!checked.ok` (checkBuildOrder's failing branch carries issues), and with `reopening.length > 0`. simulate.ts calls it on a failed check.
- api-route.ts sendReply: "Body comes from the response alone. With strict off, json's parameter is bivariant, so inferring from the reply too would let a response type that lacks one of the reply's bodies compile."
  - tsconfig.json has `"strict": false`.
  - The `RouteReply<NoInfer<Body>>` signature.
  - The deliberate mismatch below compiled before the change and fails after it.
- saved-builds.ts: "On Vercel an unset VERCEL_ENV must not fall back to the development prefix, which also allows DELETE."
  - `deploymentEnv` returns null when `env.VERCEL && !env.VERCEL_ENV`.
  - storageEnv maps undefined to 'development'.
  - builds-routes.ts `canDelete = deps.env !== null && deps.env !== 'production'`.
- build-store.ts BuildStore.bumpCounter: "A 'refused' result writes nothing, so the stored count never passes the limit."
  - memory: `if (update !== 'refused') counters.set(...)`.
  - file: `if (update === 'refused') return update;` before the write.
  - blob-build-store.ts: returns 'refused' before put.
  - nextCounter refuses at `count >= limit`.
- blob-build-store.ts: "@vercel/blob 2.9 `get` resolves null when the blob answers 404. BlobNotFoundError is also treated as absent." Code: the read checks for null, and the catch maps BlobNotFoundError to null. Source: @vercel/blob 2.9 get returns null on 404.
- build-store.test.ts:
  - "Vitest keeps a vi.mock factory's result across vi.resetModules, so a new doMock factory is what runs during the fresh import, and only if build-store imports the Blob module statically." Checked by mutation 7: it fails with doMock and passed without it.
  - "Vitest wraps a throwing mock factory in its own error and keeps the thrown one as the cause." Source: @vitest/mocker chunk-registry.js:203-205; the test passes on cause.message.
- playwright.config.ts: "...never reach Vercel Blob or answer DELETE as production does, whatever the developer's shell or .env.local sets. The storage variables are blank rather than absent because Next only reads a variable from .env files when the process environment does not already have it, and an empty string counts as having it."
  - Next docs (node_modules/next/dist/docs, environment variables): "Environment variables are looked up in the following places, in order, stopping once the variable is found. 1. `process.env` 2. `.env.$(NODE_ENV).local` 3. `.env.local` (Not checked when `NODE_ENV` is `test`.) ..."
  - @next/env assigns a file value only when the process value is undefined.
  - The hostile `.env.local` Playwright run above passed: the save stayed off Blob and DELETE answered 204.
- docs/api/openapi.json saveBuild 500: "The build id could not be created; nothing was stored and no rate-limit slot was spent. Try again later." Code: builds-routes.ts makeId runs before `deps.store()` and takeSaveSlot. Test: id-failure rows assert the getter and bumpCounter are not called.
- docs/aoe4-build-order.md:
  - `| 500 | the build id could not be created | try again later |`. Code: idFailure.
  - "DELETE also answers 405 when VERCEL is set without VERCEL_ENV, where every route answers 503." Code: canDelete is false for null; storeFor throws. Note that DELETE is method-gated first, so it gets 405, not 503. The doc sentence says so.
  - "A refused save writes nothing, so the stored count never passes the limit." Code: as for bumpCounter above.
  - "When the build id cannot be created the save answers 500 before any store call." Code: saveBuildReply.
- ARCHITECTURE.md:
  - Storage row:
    - "set and non-empty" / "unset or empty". Code: `if (env.BUILDS_STORE_ID)` and `env.BUILDS_LOCAL_DIR || default`.
    - nextCounter is the one counter step and a refused save writes nothing. Code: all three stores call nextCounter, and grep finds "count + 1" only at build-store.ts:31.
    - VERCEL without VERCEL_ENV makes buildStoreFromEnv reject, so every route answers 503. Code: storeFor throws, and the routes catch and answer storageUnavailable. DELETE 405 is covered in the docs row.
  - Route row:
    - The generic RouteReply<Body>/sendReply, "whose body type each route handler's response type must include". Code: NoInfer signature plus the tsc mismatch.
    - issuesError is the one cap. Code: grep finds MAX_REPORTED_ISSUES outside tests only in api.ts:20 and api-route.ts.
    - The helpers live in builds-routes.ts. Code: the exports there.

## Pinned outputs

None. No test pins an engine-returned value.

## Mutation checks (each broken, run, then undone)

1. build-store.ts:30 `>= limit` changed to `> limit`: 17 failed. They include "nextCounter > steps same window at the limit", the memory, file and blob refused tests, the file-layout test, the save-rate-limit "leaves the stored count at the limit after refusals" test, the builds-routes rate-limit tests and the acceptance end-to-end test. Undone.
2. Memory and file stores write count+1 on refusal (build-store.ts:54, 110-112): 5 failed. Assertions:
   - "expected [ 'refused' ] to strictly equal [ 31 ]"
   - file layout "expected {…count: 31} to strictly equal {…count: 30}"
   - builds-routes and save-rate-limit "expected 'refused' to strictly equal {…count: 31}"

   Undone.
3. blob-build-store.ts:53 early 'refused' return removed: "expected vi.fn() to not be called at all, but actually been called 1 times" (put), blob-build-store.test.ts:127. Undone.
4. build-store.ts:29 typeof-count check dropped: "steps a count that is not a number" failed. Undone.
5. build-store.ts:29 window check dropped: "steps an older window at the limit" and 2 "counts within a window and restarts" tests failed. Undone.
6. saved-builds.ts deploymentEnv VERCEL check disabled: 6 failed. Undone. Assertions:
   - deploymentEnv null rows: "expected 'development' to be null"
   - build-store reject rows: "promise resolved undefined instead of rejecting"
   - the save and GET fail-closed 503 tests
7. build-store.ts Blob module imported statically: both "uses BUILDS_LOCAL_DIR when BUILDS_STORE_ID is unset|empty" ("expected vi.fn() to not be called at all, but actually been called 1 times") and the failed-import case failed. Undone.
8. builds-routes.ts makeId moved inside the store try: both id-failure rows failed with "expected { status: 503 } to strictly equal { status: 500 }". Undone.
9. builds-routes.ts both console.error calls removed (readSavedBuild, storageUnavailable): 11 failed, among them "called once, but got 0 times" for GET 500, the getter-reject 503s (save, GET, DELETE) and the fail-closed tests. Undone.
10. builds-routes.ts saveBuildReply catch logs `new Error(... for ${req.clientKey})`: the no-client checks failed ("expected [ 'counter down for client' ] to strictly equal []"), and so did the fail-closed save test. Undone.
11. builds-routes.ts:62 canDelete ignores null: the env-null DELETE test failed, "expected { status: 204 } to strictly equal { status: 405 }". Undone.
12. api-route.ts:39 `omittedIssues > 0` changed to `>= 0` and `issues[0]` changed to `issues[issues.length - 1]`: 3 failed. Undone.
    - "reports 1 issues as 1 with omittedIssues undefined" and "reports 100 issues as 100 ..." ("expected +0 to be undefined")
    - "uses the first issue message as the error" ("expected 'second' to be 'first'")
13. api-route.ts:47 `res.end()` dropped: "sendReply > ends once and never sends json when there is no body" failed ("expected [ 'status 204' ] to strictly equal [ 'status 204', 'end' ]"), and so did the builds-routes DELETE 204 test ("called once, but got 0 times"). Undone.
14. Deliberate type mismatch: `BuildsError` removed from `builds/[id].ts`'s NextApiResponse.
    - With design C3's literal `RouteReply<Body>`, tsc passed, which led to deviation 1.
    - With `RouteReply<NoInfer<Body>>`, `npx tsc --noEmit` fails: `pages/api/aoe4-build-order/builds/[id].ts(9,18): error TS2345: Argument of type 'RouteReply<BuildsError | (...)>' is not assignable to parameter of type 'RouteReply<NoInfer<...>>' ... Type 'BuildsError' is missing the following properties ...: version, buildOrder, durationSeconds`.
    - Undone; tsc passes.

## Codegen, build, lint

- codegen: none configured.
- build: `bash $FACTORY_DIR/bin/link-node-modules.sh . && npx next build` passed (all routes listed).
- lint: `npx tsc --noEmit && npm run lint:dup` passed; jscpd found 0 clones.
- unit: `npm test` passed (2001 passed, 13 skipped).
- acceptance: the two specs above were run (36 passed). The full `npm run acceptance` was not run; that gate is owned separately.

## Invariant check

- The rate limit holds: the stored count never passes maxSaves (nextCounter refuses at the limit; no store writes on refusal).
- Fail closed on Vercel: a missing VERCEL_ENV never maps to development. There is no DELETE, and storage answers 503.
- Content-addressed ids are unchanged: savedBuildId is untouched and makeId still defaults to it.
- Browser-safe modules stay browser-safe: api-route.ts and saved-builds.ts import no server-only module. deploymentEnv only reads a passed object.
- The Blob SDK loads only when BUILDS_STORE_ID is non-empty (dynamic import kept; mutation 7).
- Logs carry no client key (mutation 10).
- The API contract matches: openapi 500 example equals idFailure's body. The contract spec passes.

## Out-of-scope findings

- tsconfig has `"strict": false`. Every method or function parameter in the codebase is bivariant, so typed callbacks elsewhere get weaker checks than they appear to have. Turning strict on is a separate ticket.
- origin/main advanced to 55bb1ed after the branch was cut. The merge is clean, but the branch will need a rebase or merge before landing.

## Status

needs_review
