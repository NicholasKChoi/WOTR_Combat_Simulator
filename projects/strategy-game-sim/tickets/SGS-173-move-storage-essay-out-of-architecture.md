# SGS-173: Move the saved-build storage essay out of ARCHITECTURE.md into the AoE4 format doc

- **Type**: Docs
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 60 (doc lines moved and trimmed in ARCHITECTURE.md and docs/aoe4-build-order-format.md; no code)
- **Depends on**: SGS-171
- **On merge**: none
- **Source**: BACKLOG.md bullet "(docs) Move the saved-build storage essay out of `ARCHITECTURE.md` (owner, 2026-11-15)", owner docs review in chat

## Context

`ARCHITECTURE.md` says where files go, but its "AoE4 saved-build storage" row in "Where files go" is one table cell of about 30 lines of store behavior (etag compare-and-swap, Blob read-back after a failed `put`, counter retries, SDK retry count, env selection). That is design-doc material. The "AoE4 route logic" row is also long. CONTEXT.md does not make either doc authoritative for a contract, so Risk stays low.

SGS-171 (a dependency) splits `docs/aoe4-build-order.md`: the Route section (with "Builds routes" and "Named builds routes"), Build order input, and the Outputs text move to the new `docs/aoe4-build-order-format.md`. Once SGS-171 is integrated, the format doc is where the Route text lives and where a reader looks for the builds and named-builds routes. Storage goes there because the Route sections already state the store-facing rules (the `VERCEL`/`VERCEL_ENV` 503, the `buildStoreFromEnv` pointer, the named-build `ETag`/`If-Match` behavior) and the store is the behavior behind those routes; the model doc stays about simulation rules. A grep of the Route text at the pre-split base for `etag`, read-back, `VERCEL_BLOB_RETRIES` and `accept-encoding` finds only the named-build `ETag`/`If-Match` route behavior, so the store behavior is not stated there yet.

SGS-171 also edits `ARCHITECTURE.md` (the "App design doc" row and Rules), so the implementer re-reads the base for the row text instead of relying on this ticket.

## Scope

Base is the tip of SGS-171's branch or `origin/<base>` once SGS-171 is integrated. Re-read the base for the `ARCHITECTURE.md` rows and the format doc's headings; do not rely on the wording here.

- `docs/aoe4-build-order-format.md`: add a `## Storage` section after the "Named builds routes" subsection (the end of Route) and before the Outputs text. Move into it, as bullets or a short table, every behavior the storage row states today, without changing any rule: the `BuildStore` seam and its memory, file and Blob stores; `buildStoreFromEnv` choosing the store (Blob only when `BUILDS_STORE_ID` is set and non-empty, otherwise the file store, which writes to `.builds-local/` or `BUILDS_LOCAL_DIR`); the stored key's first segment from `VERCEL_ENV` and the 503 when `VERCEL` is set without it; named builds (`createNamed`, `getNamed` with an opaque etag, `replaceNamed` as compare-and-swap with its `conflict` and `replaced` outcomes, `deleteNamed`); the Blob store's uncompressed fresh reads, strong-etag requirement and 503 on a weak etag; the read-back after a throwing build-write `put` and what `create` and `replaceNamed` then report; `bumpCounter`'s retry rule and `contended` outcome; `nextCounter` and the per-client save limit in `save-rate-limit.ts`, including that a refused save writes nothing; the `VERCEL_BLOB_RETRIES` default; and the live test (`BLOB_LIVE=1`, `npm run test:blob-live`). The "Builds routes" and "Named builds routes" bullets that already say part of this (the `VERCEL`/`VERCEL_ENV` 503 and the `buildStoreFromEnv` pointer) link to the new section instead of restating it, where that removes a duplicated rule.
- The format doc's intro (SGS-171 requires it to state the doc's job) gains a mention that it also holds the storage behavior behind the routes, so the intro stays true. Update the model doc's intro link text only if it describes the format doc's contents and would now be untrue.
- Check each moved claim against `lib/aoe4-build-order/build-store.ts`, `blob-build-store.ts` and `save-rate-limit.ts` at the base while moving it; fix a claim the code contradicts and say so in the report. Do not name code by line number.
- `ARCHITECTURE.md`, "Where files go": cut the "AoE4 saved-build storage" row to one line naming `build-store.ts`, `blob-build-store.ts` and `save-rate-limit.ts` and each file's role (the store seam and the memory and file stores; the Vercel Blob store and the only non-test importer of `@vercel/blob`; the per-client save limit), pointing at the format doc's Storage section for behavior. Keep the `@vercel/blob`-import-boundary fact in the row, since it is a placement rule.
- `ARCHITECTURE.md`, same table: the "Local saved builds" row also states the file store's environment selection (`.builds-local/` when `BUILDS_STORE_ID` is unset or empty, `BUILDS_LOCAL_DIR` to override), which the Storage section now holds. Trim the row to the placement fact (the directory is git-ignored and the file store writes there) and link the Storage section for when and how to override it.
- `ARCHITECTURE.md`, same table: the "AoE4 route logic" row is also over a few lines. Cut it to the files and a one-clause role for each, keeping the placement rules a file layout needs (the route files under `pages/api/aoe4-build-order/` only adapt `req` and `res`; `api-route.ts` and `named-builds.ts` import no server-only module because browser-safe code imports them). Move behavior the format doc's Route sections do not already state (for example the one cap on reported issues) there only if it is missing; do not duplicate what they say.
- Fix every reference this makes untrue: re-run the grep over `ARCHITECTURE.md`, `README.md`, `docs/` and code comments for citations of the storage row's contents or the "AoE4 saved-build storage" row by name, since SGS-171 may have added references. At the pre-split base, only `lib/aoe4-build-order/blob-build-store.ts` carries a comment on the retry count (`VERCEL_BLOB_RETRIES`); leave code comments alone unless one points at the ARCHITECTURE.md row, which none is known to.

**Out of scope:** any code, test or comment change; the README rewrite; BACKLOG.md; redoing SGS-171's split.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `docs/aoe4-build-order-format.md` has a Storage section after Route and before the Outputs text that states every storage behavior the old `ARCHITECTURE.md` row stated, with no rule changed; each of the behaviors listed in Scope is present. (respec 1)
- [ ] The format doc's intro states that the doc also holds the storage behavior behind the routes, and its links and anchors still resolve. (respec 1)
- [ ] The "AoE4 saved-build storage" row in `ARCHITECTURE.md` is a single line naming the three files and their roles, and links to the format doc's Storage section; it no longer describes etags, read-back, retry counts or environment selection. (respec 1)
- [ ] The "AoE4 route logic" row in `ARCHITECTURE.md` is cut to files and short roles (at most four sentences in total, placement rules included) (respec 2), and no fact it held is lost: each is kept in the row or present in the design docs. (respec 1)
- [ ] The "Local saved builds" row in `ARCHITECTURE.md` states only the placement fact and links the Storage section; it no longer states when the file store is chosen or how `BUILDS_LOCAL_DIR` overrides it. (respec 2)
- [ ] The Storage section states that a refused save (per-client limit) writes nothing. (respec 2)
- [ ] No claim in the Storage section contradicts `build-store.ts`, `blob-build-store.ts` or `save-rate-limit.ts` at the base; a corrected claim is listed in the report.
- [ ] No doc under `ARCHITECTURE.md`, `README.md` or `docs/` still describes the storage behavior in two places that can drift (the format doc holds it; other docs link).
- [ ] Only `ARCHITECTURE.md` and files under `docs/` change, plus a README line if Scope's grep finds a stale reference. (respec 1)
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-15

- Underspecified: the ticket said `Depends on: none` and anchored Storage to `docs/aoe4-build-order.md` after Route, but SGS-171 moves Route to `docs/aoe4-build-order-format.md`; the conditional split bullet left the file for the implementer to guess.
- Changed: dependency set to SGS-171; Storage now lands in the format doc after Named builds routes with the placement reason stated; the intro mention, base re-read, re-run grep and widened file-set criterion added; the conditional bullet dropped; a size bound added to the route-logic row criterion.
- Stands: the moved behavior list, the two ARCHITECTURE.md row cuts, and the code-claim check are unchanged.

## Re-spec 2 - 2026-11-15

- Underspecified: the Local saved builds row duplicated the file-store environment rule that Storage must hold, contradicting the no-duplication criterion; the route-logic size bound was ambiguous; the `refused` counter outcome was not named.
- Changed: Local saved builds row trimmed to the placement fact with a link (Out of scope line dropped); route-logic row bounded at four sentences in total; Storage keeps "a refused save writes nothing".
- Stands: the dependency on SGS-171, Storage placement, the moved behavior list, and the storage-row cut.

## Rework 1 - 2026-11-15 (review, text)

Review tip b76e8dd7604d6145ac32d37c72f968541d82e8c3 bounced; no earlier gate beyond spec-gate.

Findings (both `(text)`):
1. `ARCHITECTURE.md` "AoE4 route logic" row dropped two facts found nowhere else: the route handler response type must include `RouteReply<Body>`'s body type, and `builds-routes.ts` holds `errorReply`, `storageUnavailable`, `idFailure`.
2. `docs/aoe4-build-order-format.md` Storage, Blob store first bullet: the read-back swallows any error as "not landed", so a weak etag there is not a 503.

Required fixes:
- [x] Replace the first two sentences of the route-logic row's description with: "`api-route.ts` holds what every AoE4 route shares (`RouteReply<Body>` and `sendReply`, whose body type each route handler's response type must include; `issuesError`; the 405 and not-an-object answers) and imports no server-only module, because browser-safe `saved-builds.ts` imports it. `builds-routes.ts` and `named-builds-routes.ts` are the builds and named-builds route logic as plain functions that return a reply, and `builds-routes.ts` also holds the shared reply helpers `errorReply`, `storageUnavailable` and `idFailure`." Keep the row at four sentences and keep the rest of the row (browser-safe `named-builds.ts` contents; route files only adapt `req`/`res` under `pages/api/aoe4-build-order/`).
- [x] Replace the Blob store first bullet with: "Its fresh reads (`getNamed` and the counter read) request the blob uncompressed (`accept-encoding: identity`), so the etag is the strong form that `ifMatch` compares against. A fresh read that still gets a weak `W/` etag throws, which the routes answer as 503. The read-back (below) makes the same kind of read, but any error in it counts as not landed."
