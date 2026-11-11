# SGS-112 review 1

Branch `sgs-112-server-debt` at 36be3d2921ad29c6a52072f8c0d996c61859cf80, diff against merge-base b3da879.

## Verdict: REQUEST CHANGES

There is one blocking finding, and it is text only. Every acceptance criterion passes.

## Blocking findings

1. `lib/aoe4-build-order/api-route.ts:42-43` - contract (text)
   - **What:** the comment above `sendReply` says the NoInfer is needed because "With strict off, json's parameter is bivariant". That cause is wrong. `ReplyTarget.json` is declared with method syntax (`json(body: Body): void;`, line 14), and method parameters are bivariant even under `strictFunctionTypes`.
   - **Evidence:** I checked this under `--strictFunctionTypes`. With the design's signature `sendReply<Body>(res: ReplyTarget<Body>, reply: RouteReply<Body>)`, and `BuildsError` removed from the `[id].ts` response type, tsc still reports 0 errors. With the shipped NoInfer signature, the same mutation fails with TS2345.
   - **Why it matters:** a maintainer who turns `strict` on would read the comment as saying NoInfer can then be dropped. Dropping it silently re-opens the hole this ticket closed.
   - **Direction:** replace the two comment lines verbatim with:

     "// Body comes from the response alone. json is declared as a method, so its parameter is bivariant even under
     // strictFunctionTypes; inferring Body from the reply too would let a response type that lacks one of the reply's
     // bodies compile."

## Spec gaps

None.

## Implementer deviations

1. **`sendReply` NoInfer signature: justified.**
   - With the design's `RouteReply<Body>`, a response type missing `BuildsError` compiles.
   - With NoInfer it fails (TS2345). This is a real type-safety improvement.
   - Only the comment explaining it is wrong (blocking finding 1).
2. **Explicit `deploymentEnv({ VERCEL, VERCEL_ENV })` object: justified.** Passing `process.env` directly gives TS2559 ("Type 'ProcessEnv' has no properties in common..."), because of the weak-type check on the all-optional parameter.
3. **`cause.message` assertion: justified.**
   - Vitest wraps an error thrown by a mock factory and keeps the original error as `cause`, so the assertion reads the value the production path moves.
   - The test passes. If the dynamic-import failure path is broken, the failed-import case fails.
4. **`vi.doMock` in the BUILDS_LOCAL_DIR cases: justified.**
   - With build-store importing blob-build-store statically, 3 tests fail: both "uses BUILDS_LOCAL_DIR when BUILDS_STORE_ID is unset|empty" cases and the failed-import case.
   - With the doMock lines also removed, only the failed-import case catches the regression.
   - So the doMock makes the file-store cases guard the lazy import (AC 103), as its comment says.

## Acceptance criteria

All pass.

1. **Typed replies: pass.**
   - `RouteReply<Body>` and `ReplyTarget<Body>` are generic.
   - `builds/[id].ts` declares `NextApiResponse<(SavedBuild & { id: string }) | BuildsError>`.
   - `builds/index.ts` declares `NextApiResponse<SaveBuildResponse | BuildsError | SimulateError>`.
   - Removing `BuildsError` from `[id].ts` fails tsc. See note 1 for the `SimulateError` limit.
2. **Single counter rule (`nextCounter`): pass.**
   - `count + 1` appears only at build-store.ts:31.
   - The memory, file and Blob stores all call `nextCounter`. On `'refused'`, each returns before it writes. The memory store skips its set, the file store returns before `writeFile`, and the Blob store returns before `put`.
   - Tests:
     - A 7-row `nextCounter` table.
     - A per-store refused test (`describe.each`).
     - A file counter-file unchanged test.
     - A Blob test where refused makes no `put` call and limit 31 then gives 31.
     - save-rate-limit tests the 3-argument call and that the stored count stays at the limit.
3. **Fail closed when VERCEL is set without VERCEL_ENV: pass.**
   - `deploymentEnv` returns null in that case. `storeFor` then throws `VERCEL is set but VERCEL_ENV is not` before the BUILDS_STORE_ID check.
   - `canDelete` requires a non-null, non-production env.
   - Unit tests cover the reject rows, the 4-row deploymentEnv table, empty-VERCEL falling back to the file store, the env-null DELETE 405, and console.error logging exactly once.
   - Live probe: dev server with `VERCEL=1 VERCEL_ENV=`.
     - GET answers 503 `storage is unavailable`.
     - DELETE answers 405 with `Allow: GET`.
     - The log shows the cause.
     - The POST 503 path is covered by unit tests only; my probe body failed validation (400).
4. **Id failure answers 500 before any store call: pass.**
   - `makeId` runs in its own try block before the store getter. `idFailure` logs `builds: id generation failed` and answers 500 `the build id could not be created`.
   - A table covers a throwing and a rejecting `makeId`, and asserts the store getter was not called.
   - OpenAPI has the saveBuild 500 response (BuildsError schema, `idFailure` example).
   - The acceptance contract spec includes `'500'`.
5. **Single issue cap (`issuesError`): pass.**
   - `MAX_REPORTED_ISSUES` appears outside tests only in api.ts:20 and api-route.ts.
   - `simulate.ts` and `saved-builds.ts badRequest` both use `issuesError`.
   - There is a table test plus a first-message test.
6. **`recordingTarget` moved to `route-test-support.ts`: pass.** `function recordingTarget` is defined only there.
7. **Docs and ARCHITECTURE updated as specified: pass.**
   - docs/aoe4-build-order.md has the 500 row, the DELETE 405 case, "A save refused by the limit writes nothing", and the id-failure sentence.
   - The ARCHITECTURE.md rows match the ticket.
   - I checked every doc sentence the diff adds against the code; only the api-route comment is contradicted.
8. **Playwright env blanking: pass.**
   - `webServer.env` blanks BUILDS_STORE_ID, VERCEL_ENV and VERCEL.
   - The comment's claim about Next's env precedence holds: in @next/env, a file value is used only when the process value is undefined.
9. **Lazy Blob import kept (AC 103): pass.** The static-import mutation is caught (deviation 4).
10. **Blob `get` null-on-404 comment: pass.** It matches @vercel/blob 2.9 dist/index.js:179-181.

## Invariants touched

| Invariant | Holds | Notes |
| --- | --- | --- |
| S1 | yes | |
| S3 | yes | One issue cap. |
| A1-A3 | untouched | No simulation change. |

## Lint and build

- `npx tsc --noEmit`: pass.
- `npm run lint:dup`: pass, 0 clones.
- `npx next build`: pass.
- `npm test`: 63 files, 2001 passed, 13 skipped.

## Bot reconciliation

`reviewBot` is not configured, so there are no bot findings.

## Non-blocking notes

1. `pages/api/aoe4-build-order/builds/index.ts`: removing `SimulateError` from the response union still compiles. `SimulateError` is a structural subtype of `BuildsError` (`{ error }`), so this is a limit of structural typing, not a defect.
2. `lib/aoe4-build-order/builds-routes.test.ts:29`: `failClosedGetter` uses a double cast `as Record<string, string> as NodeJS.ProcessEnv`, where build-store.test.ts uses a `processEnv` helper with a single cast. This is a minor style difference, test-only.
3. `docs/aoe4-build-order.md:719`: "where every builds route answers 503 anyway" sits awkwardly next to DELETE answering 405 in the same case. The wording is ticket-prescribed, so I did not block on it.
4. The client `save-build-client.ts` maps the new 500 to the generic "The build could not be saved. Try again." That is acceptable and out of scope.
5. `lib/route-test-support.ts` is the first non-test module under lib/ to import vitest and uses test-file style (4-space indent, no semicolons). The ticket names this file; flagged for awareness only.
6. The acceptance spec checks `buildOrder` with a separate `toEqual` on top of the full-body `toEqual`. This is redundant, but the ticket asked for both.

## Coverage

- **Reviewed:** every file in the diff.
  - Sources: `api-route.ts`, `build-store.ts`, `blob-build-store.ts`, `save-rate-limit.ts`, `saved-builds.ts`, `builds-routes.ts`, `route-test-support.ts`, `pages/api/aoe4-build-order/builds/[id].ts`, `builds/index.ts`, `simulate.ts`.
  - Unit tests: all 7 touched files.
  - Acceptance specs: the contract spec and `aoe4-builds-api.spec.ts`.
  - Docs and config: `docs/api/openapi.json`, `docs/aoe4-build-order.md`, `ARCHITECTURE.md`, `playwright.config.ts`.
- **REPO.md checklist:** applied the "Every diff" and "AoE4" sections, including the build and a live route probe.
- **Not run:** acceptance and Playwright tests, by rule. The implementer's record shows them passing, including the hostile `.env.local` run.
- **UI inspection:** did not run, because the diff changes no UI.
- **LSP:** not used. Callers of the changed exports were found by grep instead.
