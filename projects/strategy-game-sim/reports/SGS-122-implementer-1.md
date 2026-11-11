# SGS-122 implementer report 1

- Ticket: SGS-122. Branch: `sgs-122-named-build-client`. Tip: `e137e688b7e701d3696c22a5cc7442f4d49bc9cd` (one commit on origin/main 086951e). Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-122-named-build-client`.
- Status: **needs_spec** (one acceptance criterion contradicts the Scope schema; everything else done and committed).

## Spec gap
Acceptance (named-build-client.test.ts, loadNamedBuild) says "a body that still carries `secretHash` ... gives `failed`". Scope gives `namedBuildBodySchema = storedNamedBuildSchema.omit({ secretHash: true }).extend({ id })`, a non-strict zod object, which strips unknown keys. So a body with `secretHash` parses `ok` with the key removed. I implemented the schema verbatim and pinned the actual behavior ("drops a secretHash the body still carries": result is `{ status: 'ok', build }` with no `secretHash`). If `failed` is wanted, the schema needs `.strict()` (a spec change; it would also fail on any extra field the server adds later). Decision needed.

## Files
- `components/apps/aoe4-build-order/build-fetch.ts` (new): `LoadJsonResult`, `loadJson`, `JsonReply`, `sendJson`.
- `components/apps/aoe4-build-order/named-build-client.ts` (new): `NamedSaveFailure`, `createNamedBuild`, `updateNamedBuild`, `loadNamedBuild`, local `namedBuildBodySchema`, hand-checked response guards (flat, 5 fields or fewer).
- `components/apps/aoe4-build-order/saved-build-loader.ts`: `loadSavedBuild` maps `loadJson`.
- `components/apps/aoe4-build-order/save-build-client.ts`: `readJson` deleted; `postSavedBuild` on `sendJson`. `saveFailureMessage` untouched.
- `components/apps/aoe4-build-order/fetch-test-helpers.ts` (new): shared `stubFetch` (rejects when `signal.aborted`), `lastCall`, `reply`; needed because jscpd (threshold 0) flagged the stub duplicated across two test files.
- `components/apps/aoe4-build-order/build-fetch.test.ts`, `named-build-client.test.ts` (new); `saved-build-loader.test.ts` (trimmed).

## Tests
`npm test`: 66 files, 2066 passed, 13 skipped, 0 failed. `save-build-client.test.ts` unchanged and passing. Invariants encoded: loadJson status table (ok/not-found/failed rows, abort), request shape and exact signal; sendJson method/body/default and extra headers/signal, Retry-After, non-JSON body, null status; named load id gate with no request, create 201-only success, update PUT headers (`Bearer`, `"<revision>"`), failure table for create and update (412, 401, 403, 404, 400, 413, 429, 503, 500, network).

## Pre-existing tests edited
`saved-build-loader.test.ts`: removed cases (not-JSON body, 500, 503, network error, aborted signal) that only re-test the shared status table, now in `build-fetch.test.ts`. Kept: invalid ids, request with signal, parsed record, other version, 404. Allowed by the ticket's Scope. No expected value changed.

## Doc claims
None added; no comments or docs written.

## Pinned outputs
- `named-build-client.test.ts` "drops a secretHash the body still carries": input `{ ...build, secretHash: 'h' x43 }` returns `{ status: 'ok', build }` (see spec gap).

## Mutation checks
- `build-fetch.ts` 404 branch returned `failed`: failed `loadJson > 404`, `loadNamedBuild > 404`, `loadSavedBuild > 404 gives not-found`. Undone.
- `build-fetch.ts` `safeParse` replaced by a cast: failed `loadJson > 200 with a body failing the schema`, named body rows, saved "another version". Undone.
- `build-fetch.ts` dropped `...init.headers`: failed `sendJson > sends the method, JSON body...` and `updateNamedBuild > puts with the bearer secret...`. Undone.
- `named-build-client.ts` 412 mapped to `forbidden`: failed failure-table row `412`. Undone.
Final run after undoing: all green; build-fetch.ts diff against the intended content verified by the green suite.

## Gates
- codegen: none set. `npx next build`: passed. `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones. (REPO.md has no eslint.)
- Greps: no `fetch(` in the three client files, no `readJson` in `components`, no `node:` in the new modules.
- Diff stat limited to the files above; no lockfile or unrelated changes.

## Invariants
None listed for the ticket; A1-A3 untouched (no lib or engine change).

## Out-of-scope findings
None.
