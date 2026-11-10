# SGS-101 review, pass 1

- Branch: `sgs-101-build-store-and-rate-limit`, tip 513283a3b682f970313646528a3f87f1fabe8610
- Base: `sgs-099-saved-build-record` @ 5efa6ee. Reviewed diff: `5efa6ee..513283a` (10 files, +919/-13)
- Mode: full review, pass 1. Risk: high.

## Verdict: APPROVE

No blocking findings.

## Blocking findings

None.

## Spec gaps

None that block. The counter-rule duplication (ruling 1 below) has no allowed shared home under the current
export list. I recommend a BACKLOG item rather than NEEDS_SPEC.

## Rulings on the implementer's flagged items

1. **Counter rule in two places** (`build-store.ts:24-27` `nextCounter`, `blob-build-store.ts:53` inline):
   **non-blocking; BACKLOG follow-up.** The REPO.md AoE4 checklist treats a copied helper as blocking. But
   the ticket's exact-export list for `build-store.ts`, plus `saved-builds.ts` having no diff, leaves no
   in-spec home for the rule. The ticket already set the precedent for this situation: the SHA-256/base64url
   helper stays as a private duplicate in `saved-builds.ts` and `save-rate-limit.ts` unless `lint:dup` flags
   it. `lint:dup` reports 0 clones. Drift risk is covered by tests: the blob table pins same window gives
   count+1 and an older window gives 1 (`blob-build-store.test.ts:99-112`), and the shared table pins the
   memory and file stores. BACKLOG item to file: "Let `build-store.ts` export the fixed-window counter step
   (`nextCounter`) and have `blob-build-store.ts` import it; amend design C2's export list." This fits
   naturally into the routes ticket if it already touches `build-store.ts`.
2. **Stricter file-store path check** (`build-store.ts:61-67`): **accepted.** It is strictly stronger than
   "inside `<dir>`", and the AC's own `../x` row needs it: `development/rate-limit/../x.json` resolves inside
   `<dir>`. Every legitimate key (`<env>/builds/<11 url-safe>.json`, `<env>/rate-limit/<16 url-safe>.json`)
   maps to itself, so nothing valid is rejected.
3. **`buildStoreFromEnv(env?)`** (`build-store.ts:123`): **accepted.** It matches the design C2 signature
   exactly. A default parameter could not tell the no-argument call apart for memoization, and the
   behavior matches the ticket text.
4. **`get` needs `access: 'private'`**: **no finding.** The ticket Scope already passes `access` on every
   `get`. Only the design table's shorthand omitted it. I confirmed `useCache: false` maps to `?cache=0`
   for private blobs in the installed SDK (`node_modules/@vercel/blob/dist/index.js`, `get`).
5. **Absent-blob behavior**: I read the installed SDK 2.9.0 source offline.
   - `get` returns `null` on a 404 (`dist/index.js:179-180`) and throws a plain `BlobError` on other non-OK
     statuses. It never throws `BlobNotFoundError`, so the `null` branch is the live path and the
     `BlobNotFoundError` branch is a harmless guard.
   - `head` on an absent blob raises `not_found` and becomes `BlobNotFoundError`, bailed with no retry
     (`chunk-VIBDXTF6.js:708`, 765-835), so `exists()` returns false quickly.
   - `del` POSTs to `/delete`. Whether the server returns an error for a missing pathname can't be seen
     client-side, so this stays unverified until the smoke script's delete step (a later ticket).
     Non-blocking.

## Acceptance criteria

| AC | Result | Evidence |
|----|--------|----------|
| Exact exports | pass | `build-store.ts` exports `PutResult`, `CounterUpdate`, `BuildStore`, `BUILDS_LOCAL_DIR_DEFAULT`, `createMemoryBuildStore`, `createFileBuildStore`, `buildStoreFromEnv`. `blob-build-store.ts` exports only `createBlobBuildStore`. `save-rate-limit.ts` exports `SAVE_RATE_LIMIT`, `clientKey`, `takeSaveSlot`. |
| Import boundary | pass | `@vercel/blob` appears only in `blob-build-store.ts` and its test. The only non-test `blob-build-store` reference is `build-store.ts:115` (dynamic import). No react/next imports. `saved-builds.ts` has no diff. |
| Shared BuildStore table | pass | `build-store.test.ts:42-92` uses `describe.each` over memory and file stores. The concurrency row checks counts 1..10, none `'contended'`, and the next bump returns 11 (so 10 was stored). The layout test is at :95. Escape and alias rows are at :105-128. |
| `buildStoreFromEnv` table | pass | `build-store.test.ts:131-203`. A static import is caught, but only incidentally (see note N1). |
| Blob adapter table | pass | `blob-build-store.test.ts`. `storeId` is asserted on put, get, head and del. Retry counts of 2 and 3 are covered, with a fresh etag on each attempt. |
| `takeSaveSlot` table | pass | `save-rate-limit.test.ts:165-223`: the 30/31/32 boundary, retryAfter 3600/1800/1, the next window, contended, rejection, separate budgets, frozen limit, and env stubs. |
| `clientKey` table | pass | `save-rate-limit.test.ts:227-272`. |
| Dependencies | **left unchecked** | Verified: `@vercel/blob: ^2.8.2` (lock resolves 2.9.0); `overrides.zod: "$zod"`; `npm ci` succeeds; `npm audit` reports 0 vulnerabilities; the lockfile has one zod (`node_modules/zod`); `.gitignore:13` has `.builds-local/`; `git status` is clean after `npm test`. Not yet verifiable: "record the output in the PR body", because no PR exists. The PR step must include the `npm audit` output. |
| ARCHITECTURE.md | pass | Two new rows in "Where files go" cover the three lib files with their owner roles, the dynamic-import rule, and `.builds-local/` with `BUILDS_LOCAL_DIR`. |
| tsc, lint:dup, npm test | pass | I ran them: tsc is clean; jscpd finds 0 clones; 52 files, 1635 passed, 10 skipped. |
| No invariant regressions | pass | See below. |

## Invariants touched

- **S3 (bounded):** holds. The limit is fixed at 30 per hour (`save-rate-limit.ts:6`), the Blob CAS loop is
  capped at `COUNTER_ATTEMPTS = 3` (`blob-build-store.ts:6`, :50), and the file and memory stores have no
  loop.
- **A3 (no clock):** holds. `takeSaveSlot` takes `nowMs` and reads no clock or env. `clientKey` reads only
  the request.
- **S1:** holds. The only imports are `node:` modules, `./saved-builds` and `@vercel/blob`.
- **A1/A2:** not touched (30 and 3600 are app limits, not game numbers).

## spec-checklist

- Contracts: names match design C2 and C5 and the ticket. CONTEXT Key surfaces gains no route here.
- Scope: no routes, OpenAPI, page, Playwright env, smoke script or KV, no env-tunable limit, and no `golang/`.
- No invented constants: 30, 3600, 16, 3 attempts and `.builds-local` all come from the ticket and design.
- Naming: no dead enum values.

## Linter

`npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones. No findings.

## Review bot

`reviewBot.cli` and `rulesFile` are empty, so there was no bot to run and nothing to reconcile.

## Conventions

- Lib files use 2-space indentation, semicolons and a one-line header comment, matching
  `saved-builds.ts:1-8`. Test files use 4-space indentation without semicolons and `it.each` tables,
  matching `saved-builds.test.ts:1-12`.
- No logging is added, and none of the sibling lib modules log either.
- The hash helper is duplicated privately, which Scope item 3 explicitly allows (`save-rate-limit.ts:11-15`
  vs `saved-builds.ts:36-38`). `lint:dup` stays clean.
- Input validation: the stored counter (2 fields) and the env (3 keys) are under the 5-field threshold, so
  hand checks are fine.
- Commit message has no ticket ids, and the author is `choinickolas@gmail.com`.

## Non-blocking notes

- **N1 - test** `build-store.test.ts:145`: `expect(blobFactory.imported).not.toHaveBeenCalled()` cannot
  catch a static import. That import would run the mock factory when the file loads, and the `beforeEach`
  `mockReset` (:134) then clears it. I checked by adding a static
  `import { createBlobBuildStore } from './blob-build-store'` to `build-store.ts`: that assertion still
  passed, and only the failed-import memoization test (:191) failed. The AC is still met because the suite
  kills the mutant, but by a test about something else. Direction: in that row, take `buildStoreFromEnv`
  from `await import('./build-store')` after the `vi.resetModules()` so the import check runs on a fresh
  module instance.
- **N2 - comment (text)** `blob-build-store.ts:18-19`: the comment says which absence shape the SDK uses
  "could not be checked without a live store". The installed SDK source does show it (`get` returns null on
  404). Replace with: `// get returns null for a missing blob; BlobNotFoundError is also read as absent in
  case a later SDK version throws instead.`
- **N3 - doc (text)** `ARCHITECTURE.md:24-25`: the code treats an empty `BUILDS_STORE_ID` as unset
  (`build-store.ts:114`). Suggested edits: in row 24, change "only when `BUILDS_STORE_ID` is set" to "only
  when `BUILDS_STORE_ID` is non-empty". In row 25, change "when `BUILDS_STORE_ID` is unset" to "when
  `BUILDS_STORE_ID` is unset or empty". Neither sentence is false as written; both are incomplete.
- **N4 - lifecycle**: the SDK's `requestApi` retries `unknown_error`, `service_unavailable` and
  `internal_server_error` up to `VERCEL_BLOB_RETRIES` (default 10) times with backoff
  (`chunk-VIBDXTF6.js:647`, 768-835). During a Blob outage a save or read can therefore take a long time
  before the route returns 503, and up to 3 CAS attempts multiply that. It is bounded by the function
  timeout, and the spec is silent. Worth noting for the routes ticket.
- **N5 - test** `build-store.test.ts:191-202`: the first call is asserted with `rejects.toThrow()` and no
  message. `rejects.toThrow('blob import failed')` would pin the cause.
- **N6**: on Vercel, OIDC auth for a Pages Router API route depends on `@vercel/oidc` finding the request
  token. This can't be verified offline; the preview smoke covers it.

## Coverage

- Reviewed in full: `lib/aoe4-build-order/build-store.ts`, `blob-build-store.ts`, `save-rate-limit.ts`, the
  three test files, `package.json`, `.gitignore`, `ARCHITECTURE.md`, and the `package-lock.json` package
  list.
- Read for context: the installed `@vercel/blob` 2.9.0 `get`, `del`, `head`, `requestApi`, the error
  mapping and `resolveBlobAuth`; `saved-builds.ts` (hash, `storageEnv`, key helpers); `.jscpd.json`;
  `vitest.config.mts`.
- Ran: `npm ci`, `npx tsc --noEmit`, `npm run lint:dup`, `npm test` (with `git status` clean afterwards),
  `npx next build` (succeeded, routes unchanged), `npm audit` (0 vulnerabilities), and one temporary
  static-import mutant, which I reverted.
- REPO.md review checklist: "Every diff" ran `next build`. No page is touched, so no page needed loading
  under `npm run dev`. AoE4 section: copied-helper rule (ruling 1); no `docs/aoe4-build-order.md` sentence
  is affected; no UI. Other sections don't apply.
- Not reviewable offline: behavior against a live Blob store (`del` on an absent blob, real "already
  exists" and precondition error codes, OIDC auth). The later smoke script covers these.
- Ticket: 10 of 11 AC ticked. The Dependencies AC is left unchecked until the PR body records `npm audit`.
