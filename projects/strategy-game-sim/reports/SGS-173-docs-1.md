# SGS-173 docs report 1

- Ticket: SGS-173. Branch: `sgs-173-architecture-store-rows`. Tip: `b76e8dd7604d6145ac32d37c72f968541d82e8c3` (one commit on origin/main c6109a4).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-173-architecture-store-rows`

## Docs touched

- `docs/aoe4-build-order-format.md`: new `## Storage` section between Named builds routes and Outputs; intro mentions storage; the Builds routes storage bullet and the DELETE bullet link to it.
- `ARCHITECTURE.md`: the "AoE4 saved-build storage", "AoE4 route logic" and "Local saved builds" rows cut to placement facts and a link.

## Doc claims (all in the Storage section, checked against the code at the base)

- Three stores, key forms: `build-store.ts` (`BuildStore`, `createMemoryBuildStore`, `createFileBuildStore`, `savedBuildKey`, `rateCounterKey` in `saved-builds.ts`), `blob-build-store.ts`.
- Env prefix and 503: `storageEnv`, `deploymentEnv` in `saved-builds.ts`; `storeFor` throws when `deploymentEnv` is null.
- Blob only when `BUILDS_STORE_ID` truthy, dynamic `import()`, else file store at `BUILDS_LOCAL_DIR || '.builds-local'`: `storeFor`.
- `createNamed`/`getNamed`/`replaceNamed`/`deleteNamed` outcomes: `buildMethods` and the interface comments in `build-store.ts`; Blob variants in `createBlobBuildStore`.
- Uncompressed fresh reads, weak `W/` etag throws, routes answer 503: `read` in `blob-build-store.ts`; `storageUnavailable` in `builds-routes.ts`.
- Read-back after a throwing build-write put, `create`/`replaceNamed` outcomes: `landed`, `create`, `replaceNamed`.
- `bumpCounter` rules, 3 attempts, `contended`, no read-back: `COUNTER_ATTEMPTS` and `bumpCounter`.
- `VERCEL_BLOB_RETRIES` set to 1 (`BLOB_SDK_RETRIES`) when unset or empty, kept when set: `createBlobBuildStore`.
- `nextCounter` shared by memory, file and Blob stores; refused writes nothing: `nextCounter` and each `bumpCounter`.
- Live test skipped unless `BLOB_LIVE=1`: `blob-build-store.live.test.ts`; `test:blob-live` in `package.json`.
- Intro: "the storage behind the builds routes".

## Removed or changed claims

- Nothing contradicted by the code; no claim corrected.
- Dropped from the route-logic row (code detail, not a placement fact): that each route handler's response type must include `RouteReply`'s body type, and the names `errorReply`, `storageUnavailable`, `idFailure`. The issue cap (`MAX_REPORTED_ISSUES`), 405 and not-an-object answers stay in the format doc's Route section.
- The builds-routes bullet restating `buildStoreFromEnv`/`SAVE_RATE_LIMIT`/"refused writes nothing" now links to Storage.

## CONTEXT.md Design docs

No row change needed: the AoE4 format doc row ("input, routes, result") could add "storage" to its Authoritative-for cell: "Simulation model; build format, routes and storage; page behavior".

## Checks

- Lint/codegen: not run (docs-only; `commands.lint` is tsc and jscpd, `codegen` empty).
- Links: `#storage` and `docs/aoe4-build-order-format.md#storage` resolve to the one `## Storage` heading; no moved or renamed doc. Grep of README, docs and code for the storage row name found no citations.

## Out of scope findings

None.

## Status

needs_review
