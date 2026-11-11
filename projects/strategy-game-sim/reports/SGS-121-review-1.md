# SGS-121 review 1: named build routes and OpenAPI

- Branch: `sgs-121-named-build-routes` at 0ff9f81, stacked on `sgs-120-named-routes` at 3311fa4.
- Diff reviewed: `3311fa4..0ff9f81` only.
- Risk: high.

## Verdict: APPROVE

There are no blocking findings.

## Decisions requested by the manager

### (1) The shared `sendReply` change in `lib/aoe4-build-order/api-route.ts` is correct and in scope. No re-spec is needed.

The change is required by the ticket's own criterion. The live route must return `ETag: "1"`. Next.js 16.4.3 makes that impossible through `res.json`:

- `res.json` calls `res.send`.
- `res.send` calls `sendEtagResponse`, which always runs `res.setHeader('ETag', generateETag(body))` and the `fresh()` 304 check. See `node_modules/next/dist/server/api-utils/node/api-resolver.js:69-70` and `send-payload.js`.
- So the route's own revision ETag is always replaced by a hash of the body.

What the change does:

- It adds a branch for replies with a body and `headers.ETag` set. These are written with `Content-Type: application/json; charset=utf-8` (byte-identical to Next's `JSON_CONTENT_TYPE_HEADER`) and `res.end(JSON.stringify(body))`.
- Status and headers are set before the body. Node sets Content-Length itself on `end(data)`.

Effect on other routes: none. A grep of `lib/` and `pages/` finds no other reply that sets an ETag. The builds, simulate and fight routes still go through `res.json`, so their framework ETag and 304 behaviour are unchanged.

HEAD and 304 on the named routes:

- HEAD is answered 405 by method dispatch.
- Named GET no longer gets Next's If-None-Match 304. That is harmless, because the response is `Cache-Control: no-store`.

Tests: `api-route.test.ts` covers the new path. The `route-test-support.ts` `end` mock records the chunk.

The comment above `sendWithOwnEtag` is accurate.

The one departure from the design: C3 specifies `ReplyTarget.end(): void`, and the diff widens it to `end(chunk?: string)`. The change is additive and every caller still type-checks. The manager may want to record this in `design/M8.md` C3 so later tickets do not copy the old signature.

### (2) The `AOE4_SCHEMA_NAMES` edit in `acceptance/fight-api-spec-surface.spec.ts` is allowed.

- The test that uses the list is "has exactly the pinned fight and AoE4 schema names and no others". Its point is the schema surface.
- The ticket's rule says "A test whose point is the surface it already checks keeps that check". Adding the three new schema names (`CreateNamedBuildResponse`, `NamedBuild`, `UpdateNamedBuildResponse`) keeps that check: the test still pins an exact list and fails on any unlisted name.
- Precedent: M6 commit fc19b52 added `SavedBuild` and `SavedBuildWithId` to the same list in the same way.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

All criteria pass by reading the code and tests. Vitest (`named-builds-routes.test.ts`, `api-route.test.ts`, `builds-routes.test.ts`) gives 147 passed across 3 files. I did not run the acceptance specs (gate rule), so the "Live" items are verified by reading the specs plus the implementer's recorded run of 109 passed.

| Criterion | Verdict | Evidence |
|---|---|---|
| POST create: 405 for non-POST, body check 400/413, id failure 500, 201 with the id, secret and `ETag: "1"`, and only the hash stored | pass | `named-builds-routes.ts` `createNamedBuildReply`. The stored json carries `secretHash` only. Unit tests cover each row of the C1 table. |
| GET: 404 for a missing or malformed id, 500 when the stored build fails its schema (fixed log message), 200 without `secretHash`, with no-store and the revision ETag | pass | `readStored` and `readNamedBuild`, plus their unit tests. |
| PUT: 401 with `WWW-Authenticate: Bearer`, then 428, then 400/413, 404, 403, 412 (stale If-Match and compare-and-swap conflict), 200 with revision+1 and the ETag | pass | `updateNamedBuild`. The check order matches C1 and is tested row by row, including the `replaceNamed` conflict. |
| DELETE only outside production (405 with Allow `GET, PUT` in production), 204 | pass | `disallowedMethod` in `builds-routes.ts`, and `namedBuildReply`. Tests cover both environments. |
| 503 on a storage failure for every route | pass | try/catch returns `storageUnavailable` in create, update, get and delete. One test per route. |
| Shared write budget: named POST and PUT take the same save slot as `/builds`, and 429 comes with Retry-After | pass | `refusedSaveSlot` is shared. There is a unit "slot accounting" describe, and the live budget spec in `aoe4-named-builds-api.spec.ts` rotates 30 writes across all three routes. |
| `saveBuildReply` and `savedBuildReply` replies unchanged after the refactor | pass | `builds-routes.test.ts` still passes unchanged. The Allow order `GET, DELETE` is preserved. |
| Adapters are thin, with a `128kb` limit and `env` from `deploymentEnv` | pass | `pages/api/aoe4-build-order/named-builds/index.ts` and `[id].ts`. |
| OpenAPI 2.5.0: both paths, unique operationIds, exact status lists, id pattern, Cache-Control and WWW-Authenticate consts, `editSecret` bearer scheme, required If-Match, three closed and described schemas, examples validate, real responses validate | pass | `aoe4-named-builds-api-contract.spec.ts` (read). `docs/api/openapi.json` additions read in full. |
| Version pins move from 2.4.0 to 2.5.0 and route lists are derived from the files | pass | `git grep 2.4.0 -- acceptance` finds nothing. `routeFilePaths()` is used in both surface specs. |
| Searches: console calls only at the two fixed messages; `@vercel/blob` imported only in `blob-build-store.ts`; no `node:` import in `named-builds.ts` | pass | `git grep`: console calls only at `named-builds-routes.ts:62` and `:76`. `@vercel/blob` appears only in `blob-build-store.ts` and its tests. The only `node:` hit in `named-builds.ts` is the comment on line 2. |
| Docs: `ARCHITECTURE.md` and `docs/aoe4-build-order.md` "Named builds routes" | pass | Each claim checked against the code; see the 413-order note below. |
| `next build` passes | unverified | Not run by this gate. The implementer reports a passing build, and the Vercel preview check will confirm it on the PR. |

## Invariants touched

- **S1 holds.** No import crosses between apps.
- **S3 holds.**
  - Bodies are capped at `128kb` in both adapters.
  - The record is capped at 65536 bytes by `checkSaveBuildRequest`.
  - Every write takes a save slot.
  - Issue lists come from the existing capped checker.
- **A1, A2, A3: not touched.** The diff has no simulation code.
- **Secret never logged or stored.** Holds. Only `secretHash` is persisted. Neither console call includes request data or the secret. GET strips `secretHash`.

## Spec checklist

- **Key surfaces:** route paths, schema names and the `editSecret` scheme match CONTEXT.md and design C1/C2.
- **Scope:** no `golang/` changes, and nothing from Out of scope is implemented.
- **Open questions:** no invented constants. The 128kb limit, the 65536-byte cap and the budget all reuse existing values.
- **Naming:** names state intent, and there are no dead enum values.

## Lint

- `npx tsc --noEmit`: clean.
- `npm run lint:dup` (jscpd, threshold 0): 0 clones.

## Bot reconciliation

None. `reviewBot.cli` is empty in REPO.md.

## Non-blocking notes

- `lib/aoe4-build-order/api-route.ts` (the `sendReply` branch): the match on `reply.headers?.ETag` is case-sensitive, so a future reply that sets `etag` in lower case would silently fall back to `res.json` and lose its ETag. This is fine today, because every caller uses `ETag`.
- `docs/aoe4-build-order.md` "Named builds routes" lists "the body (400 or 413)" after the If-Match check. A body over 128kb is actually refused by Next with a plain-text 413 before the handler runs. The existing docs already describe framework 413s elsewhere, so this is only a slight imprecision.
- `docs/api/openapi.json`: the If-Match pattern `^"[1-9][0-9]*"$` accepts more digits than the parser's 16-digit limit. A longer value is answered 412 rather than being refused by the schema. This is harmless.
- The stored named record can exceed the 65536-byte record cap by about 130 bytes of metadata (revision, timestamps, `secretHash`). It is still bounded.
- `lib/aoe4-build-order/named-builds-routes.test.ts:456-476`: the slot-accounting describe uses a module-level `let current` with a `store()` getter, and a variable named `counted_`. A local store per test, as in `builds-routes.test.ts`, would read more cleanly.
- `acceptance/aoe4-named-builds-api.spec.ts`: the budget test can flake if the hour window rolls over mid-test. The existing `/builds` budget spec has the same risk.
- Out of scope: per the implementer report, `origin/main` has a newer commit (156bf30) that is not in this stack's base. Rebase it when PRs open.

## Coverage

Files reviewed (diff `3311fa4..0ff9f81`):

- `lib/aoe4-build-order/api-route.ts` and `api-route.test.ts`
- `lib/aoe4-build-order/route-test-support.ts`
- `lib/aoe4-build-order/builds-routes.ts`
- `lib/aoe4-build-order/named-builds-routes.ts` and `named-builds-routes.test.ts`
- `pages/api/aoe4-build-order/named-builds/index.ts` and `[id].ts`
- `acceptance/aoe4-named-builds-api.spec.ts`
- `acceptance/aoe4-named-builds-api-contract.spec.ts`
- `acceptance/openapi-schemas.ts`
- `acceptance/aoe4-builds-api-contract.spec.ts`
- `acceptance/fight-api-spec-surface.spec.ts`
- `acceptance/aoe4-gathered-resources.spec.ts`
- `acceptance/aoe4-simulate-api-issue-shape.spec.ts`
- `docs/api/openapi.json`
- `ARCHITECTURE.md`
- `docs/aoe4-build-order.md`

Not done, and why:

- **Acceptance and e2e specs:** not run (gate rule). Judged by reading them.
- **UI inspection:** skipped. The diff changes no UI.
- **REPO.md checklist items asking for `next build` and curling routes:** not run under the gate's process rules. The build is covered by the implementer's run and the Vercel preview check.
