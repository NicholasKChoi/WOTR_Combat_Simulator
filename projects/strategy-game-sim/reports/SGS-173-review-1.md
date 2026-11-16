# SGS-173 review 1

Branch `sgs-173-architecture-store-rows`, tip b76e8dd7604d6145ac32d37c72f968541d82e8c3, base main. Type Docs. Verdict: **REQUEST CHANGES**.

## Blocking findings

1. `ARCHITECTURE.md` "AoE4 route logic" row - contract (text) - the cut dropped facts that exist nowhere else. The ticket criterion says "no fact it held is lost: each is kept in the row or present in the design docs". Dropped: (a) each route handler's response type must include `RouteReply`'s body type (`RouteReply<Body>`/`sendReply`); (b) `builds-routes.ts` holds the shared reply helpers `errorReply`, `storageUnavailable`, `idFailure` (named-builds-routes.ts imports them). I grepped README, docs/ (apart from openapi.json response names), CONTEXT.md: neither fact is stated. The implementer's report admits dropping them as "code detail", but (a) is a typing rule a contributor adding a route needs, and the ticket allows dropping only facts present elsewhere. Direction: restore both within the existing four sentences, keeping the row at four sentences. Replace the first two sentences of the row's description with:
   "`api-route.ts` holds what every AoE4 route shares (`RouteReply<Body>` and `sendReply`, whose body type each route handler's response type must include; `issuesError`; the 405 and not-an-object answers) and imports no server-only module, because browser-safe `saved-builds.ts` imports it. `builds-routes.ts` and `named-builds-routes.ts` are the builds and named-builds route logic as plain functions that return a reply, and `builds-routes.ts` also holds the shared reply helpers `errorReply`, `storageUnavailable` and `idFailure`."
   Facts to keep (delta check): `api-route.ts` shared contents and no-server-only-import reason; route-logic files return a reply; `named-builds.ts` browser-safe contents; route files only adapt `req`/`res` under `pages/api/aoe4-build-order/`.
   Dropping the issue-cap clause (`issuesError`, "the one cap on reported issues") is fine: the format doc states `MAX_REPORTED_ISSUES` = 100.

2. `docs/aoe4-build-order-format.md` Storage, Blob store first bullet - contract (text) - the diff added "and the read-back" to the list of fresh reads and then says a weak `W/` etag throws "which the routes answer as 503". In `blob-build-store.ts` the read-back (`landed`) wraps its fresh read in try/catch and returns false on any throw, so a weak etag there is swallowed (the write then falls to `exists`/`conflict`/rethrow of the put error), not a 503. The old row listed only `getNamed` and the counter read. Direction: replace the bullet with:
   "Its fresh reads (`getNamed` and the counter read) request the blob uncompressed (`accept-encoding: identity`), so the etag is the strong form that `ifMatch` compares against. A fresh read that still gets a weak `W/` etag throws, which the routes answer as 503. The read-back (below) makes the same kind of read, but any error in it counts as not landed."
   Facts to keep: uncompressed header, strong etag for `ifMatch`, weak etag throws, 503.

## Acceptance criteria

- Storage section after Named builds routes, before Outputs, with every listed behavior: pass (all listed behaviors present: seam and three stores, `buildStoreFromEnv`, `VERCEL_ENV` and 503, named-build ops and outcomes, uncompressed reads/weak etag, read-back and outcomes, `bumpCounter`/`contended`, `nextCounter`, refused, `VERCEL_BLOB_RETRIES`, live test). No rule changed, subject to finding 2.
- Intro mentions storage; links/anchors resolve (`#storage`, `docs/aoe4-build-order-format.md#storage`; one `## Storage` heading): pass. Cosmetic: the intro rewrap leaves a short ragged line ("returns. The simulation rules are").
- Storage row single line, three files and roles, link, no etag/read-back/retry/env selection: pass (keeps the `@vercel/blob` import boundary).
- Route-logic row at most four sentences, no fact lost: sentence count pass (4); fact preservation **fail** (finding 1).
- Local saved builds row placement only, links Storage: pass.
- Storage states a refused save writes nothing: pass ("A save past the limit is `refused` and writes nothing").
- No claim contradicts code: fail on one claim (finding 2). Verified against code: key forms (`savedBuildKey`, `namedBuildKey`, `rateCounterKey`), `storageEnv`/`deploymentEnv`, `BUILDS_STORE_ID` truthiness plus dynamic import, `BUILDS_LOCAL_DIR || .builds-local`, `COUNTER_ATTEMPTS` = 3, `BLOB_SDK_RETRIES` = 1 only when unset or empty, read-back text comparison, `create`/`replaceNamed` outcomes, no read-back in `bumpCounter`, `nextCounter` shared. The report lists no corrected claim; none found beyond finding 2.
- No duplicated storage description across docs: pass. Builds routes bullets now link to Storage. Grep of README, docs/, lib, pages for the row name or ARCHITECTURE.md citations found none.
- Only ARCHITECTURE.md and docs/ change: pass (2 files).
- INVARIANTS: none touched (Invariants: none; docs only). Holds.

## Non-blocking notes

- CONTEXT.md "AoE4 build order" Design docs row still says "build format and routes" for the format doc; the implementer suggested adding "storage". Out of the ticket's file set; leave to the owner.
- No lint, bot or UI inspection: docs only, `reviewBot` empty; `commands.lint` not run.

## Coverage

Full diff (ARCHITECTURE.md, docs/aoe4-build-order-format.md) read against `build-store.ts`, `blob-build-store.ts`, `save-rate-limit.ts`, `saved-builds.ts`, `named-builds.ts`. Scratch `review-sgs-173-architecture-store-rows` created; removal pending after this report.
