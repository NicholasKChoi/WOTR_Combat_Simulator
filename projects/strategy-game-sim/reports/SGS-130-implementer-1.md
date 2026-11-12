# SGS-130 implementer report 1

- Ticket: SGS-130 (Blob store: cap SDK retries, treat a landed write as success, live missing-key check)
- Branch: `sgs-130-blob-landed-write-retry-cap`
- Tip SHA: `0144aca`
- Base: `origin/main` at `5564bd0` (contains SGS-127 `2ad0daf` and SGS-128 `2ed1007`)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-130-blob-landed-write-retry-cap`
- Note: the branch already existed at `5564bd0` with no worktree, because the first `git worktree add -b` created the branch and then failed on the `.git/config` lock. I added a worktree for the existing branch.

## Files touched

- `lib/aoe4-build-order/blob-build-store.ts`: adds the exported `BLOB_SDK_RETRIES = 1` and sets the env value when `VERCEL_BLOB_RETRIES` is unset or empty. Adds the private `landed(key, json)` and calls it in `create`, `bumpCounter` and `replaceNamed` when `put` throws. Updates the `replaceNamed` comment. About 25 lines of logic.
- `lib/aoe4-build-order/blob-build-store.test.ts`: env-cap table, a created-on-landed case for both create methods, an expanded `replaceNamed` outcome table, a text-equality table, and a counter landed table. Mock setups are pinned for the extra read.
- `lib/aoe4-build-order/blob-build-store.live.test.ts` (new): the opt-in live check.
- `package.json`: adds the `test:blob-live` script.
- `ARCHITECTURE.md`: the AoE4 saved-build storage row.

## Tests

- `npx vitest run lib/aoe4-build-order/blob-build-store.test.ts`: 56 passed.
- `named-build-store.acceptance.test.ts` (unedited, uses an in-memory Blob fake through `buildStoreFromEnv`): passed. Its second create with different JSON still gives `exists`, and the stale-etag, absent-id and concurrent-replace cases still give `conflict`.
- `npm test`: 74 files passed and 1 skipped (the live file). 2378 tests passed and 15 skipped.
- `npx vitest run lib/aoe4-build-order/blob-build-store.live.test.ts` without `BLOB_LIVE`: 1 file skipped, 2 tests skipped.
- `env -u BUILDS_STORE_ID npm run test:blob-live` (no `.env.local` in the worktree): the suite fails in `beforeAll` with `Error: BUILDS_STORE_ID is not set; run vercel env pull .env.local`.

Invariants the tests encode:
- The env cap is set only when the variable is unset or empty. An explicit value is kept.
- `landed` uses text equality. A different key order or whitespace is not landed.
- `landed` uses the fresh read: a weak etag read of our JSON is not landed.
- A throw inside `landed` is never what the caller sees.
- `replaceNamed` makes exactly one put with the caller's etag as `ifMatch` and one fresh read. It never calls `head` and never writes again.
- `create` checks `landed` before `exists`.
- In `bumpCounter`, a landed write returns after one put. Otherwise the existing 412 and lost-create retry rules apply, ending in `contended`.

## Pre-existing tests edited

All edits are in `lib/aoe4-build-order/blob-build-store.test.ts`. The ticket rule is Scope "Existing tests": a test of a changed behavior gets the new expected value, and tests that relied on the first `get` being the only read pin that with their mock setup.

- `putBuild`/`createNamed` > `reports exists when put fails and the blob is there`: renamed `... and the blob holds other content`. It now stores `{a:2}` and sends `'{"a":1}'`, so `landed` is false before `head`. Expected value unchanged (`exists`). Rule: mock pin for the new read.
- `replaceNamed` > `maps a put rejecting with %s after one put and no read`: replaced by `maps a put rejecting with %s and %s after one put and one fresh read`. Its three original rows keep their outcomes (412 or not-found with nothing stored gives `conflict`; other error rethrows). The assertion `get not called` became `get called exactly once with the fresh options`, because a landed read is the changed behavior. `put called once` became `called exactly once with ifMatch 'etag-1'`. Rule: changed behavior.
- `bumpCounter` > `retries a changed etag with the etag of the new read`: with the old setup, the second `get` value `{W,2}` is consumed by the landed read. It equals the JSON we sent, so the run would now count as landed. The setup now shows other writers at `{W,3}` (etag-2), so the expected value changed from count 3 to count 4, and the puts from `[[2,etag-1],[3,etag-2]]` to `[[2,etag-1],[4,etag-2]]`. Rule: mock pin. The count changed only because the old fixture's concurrent write was byte-identical to ours, which is now the landed case.
- `bumpCounter` > `reports contended after three changed etags`: renamed `... whose read-backs differ`. Each attempt read now gets a matching read-back value. `get` called 3 times became 6 times (the changed behavior: one landed read per failed put). The `ifMatch` list and `contended` are unchanged.
- `bumpCounter` > `retries a create that lost to another writer`: the same identical-content problem as above (the other writer's `{W,1}` equals our create). The setup now shows the counter at `{W,2}`. The expected value changed from count 2 to count 3, and the put count is unchanged (2). Rule: mock pin.
- `bumpCounter` > `propagates any other put error on an update after one attempt`: the arrange changed from `mockResolvedValue(found(...))` to `mockImplementation(async () => found(...))`. The old setup reused one Response stream, so the landed read threw "body disturbed" and the test passed because of that error rather than a real differing read-back. Expected value unchanged.

## Doc claims

- `blob-build-store.ts` above `BLOB_SDK_RETRIES`: "@vercel/blob reads VERCEL_BLOB_RETRIES from process.env on every request (default 10), and bumpCounter's attempts multiply those retries during an outage." Source: `node_modules/@vercel/blob/dist/chunk-VIBDXTF6.js` `getRetries()` (`process.env.VERCEL_BLOB_RETRIES || "10"`), plus `COUNTER_ATTEMPTS = 3` in the store. The per-request read is the ticket's unverified assumption; I saw only that `getRetries` reads the env each time it is called.
- `blob-build-store.ts` above `landed`: "A put whose response was lost may still have landed, and the SDK's retry of it then fails with 412 or "already exists". Text equality, not a deep compare: a value serialized differently is not ours." Source: `landed` (`JSON.stringify(stored.value) === json`). The first sentence restates the ticket's unverified assumption.
- `blob-build-store.ts` on `replaceNamed`: "The landed check compares content only and never feeds its etag into a write." Source: `landed` returns a boolean, and `replaceNamed` makes one `put` with the caller's `etag`. "Which error the SDK raises for ifMatch on a deleted blob is unverified (blob-build-store.live.test.ts records it), so not-found also conflicts." Source: the live test's first case `console.log`s the class.
- `blob-build-store.live.test.ts` header: "Opt-in check against a real Vercel Blob store: `vercel env pull .env.local`, then `npm run test:blob-live`." Source: `describe.skipIf(process.env.BLOB_LIVE !== '1')` and the `package.json` script.
- `blob-build-store.test.ts` (test comment): "Each failed put is followed by a read-back; these show a counter other writers moved past ours." Source: `bumpCounter` calls `landed` in its catch.
- `ARCHITECTURE.md`: "`replaceNamed` (a compare-and-swap on that etag: a changed etag or an absent build gives `conflict`, except that the Blob store gives `replaced` when its read-back shows the JSON it sent)". Source: `replaceNamed` catch.
- `ARCHITECTURE.md`: "When a Blob `put` throws (in `create`, `bumpCounter` or `replaceNamed`), the store makes a fresh read of the key and counts the write as done when the stored value, serialized with `JSON.stringify`, is the exact text it sent, since a write whose response was lost may have landed before the SDK's retry failed; otherwise the put error decides the outcome." Source: `landed` and its three call sites. In `create`, the `exists` check also takes part.
- `ARCHITECTURE.md`: "Creating the store sets `VERCEL_BLOB_RETRIES` to `BLOB_SDK_RETRIES` (1) when that variable is unset or empty (`@vercel/blob` reads it as its per-call retry count, default 10); a value already set is kept." Source: the first line of `createBlobBuildStore` and the SDK's `getRetries`.
- `ARCHITECTURE.md`: "`blob-build-store.live.test.ts` checks a real store and is skipped unless `BLOB_LIVE=1` (`npm run test:blob-live`)." Source: the `skipIf` gate and the skipped run above.
- Grep checks with no change:
  - `build-store.ts` `BuildStore.replaceNamed` "never retries" is still true. The landed read is not a write retry.
  - The `blob-build-store.ts` header and `read` comments are still true.
  - `docs/aoe4-build-order.md` line 739 (412 for a write that lands between the read and the replace) is still true for a different concurrent write. Nothing changed.

## Pinned outputs

None. The ticket asks for no engine-returned values.

## Mutation checks

Each break was made in `lib/aoe4-build-order/blob-build-store.ts` with Edit, run against `blob-build-store.test.ts`, then undone. The final diff was reread, and the full suite was rerun green after all undos.

1. `landed` always false (`... && false`, line 54): 7 tests failed. Both `reports created when put fails but a fresh read shows the JSON it sent` failed on the outcome, not `created`. The two `replaceNamed` "our JSON stored" rows failed with `expected 'conflict' to be 'replaced'`, and the network row rejected instead of returning `replaced`. The three counter landed rows failed with `expected 'contended' to strictly equal {…count:2}` and the rethrow. Undone.
2. `landed` = `stored !== null` (no comparison): 10 tests failed.
   - The two `reports exists ... other content` tests: `expected 'created' to be 'exists'`.
   - The `replaceNamed` other-JSON rows (412 and network): `expected 'replaced' to be 'conflict'` and `promise resolved 'replaced' instead of rejecting`.
   - Both text-equality rows.
   - `retries a changed etag` (count 2 vs 4), `reports contended ... read-backs differ`, `retries a create that lost` (count 1 vs 3), and the re-pinned `propagates any other put error on an update`.
   Undone.
3. Deep compare (`isDeepStrictEqual(stored.value, JSON.parse(json))`): both `does not count the same data with a different key order/whitespace as landed` failed with `expected 'replaced' to be 'conflict'`. Undone.
4. `landed` rethrows from its catch: the four "a read that throws" and "a weak etag read" rows failed. The network rows failed with `expected Error: read failed to be Error: service down`, and the 412 rows rejected with the read error. Undone.
5. `landed` uses `read(key, false)`: 13 failures. All `replaceNamed` rows failed on `get toHaveBeenCalledExactlyOnceWith(..., FRESH_GET_OPTIONS)`. The weak etag rows also failed on the outcome. Both create-landed tests failed on the `get` options. Undone.
6. Env check `=== undefined`: `caps ... when it is empty` failed (`expected '' to be '1'`). Undone.
7. Env always set (`if (true)`): `caps ... when it is set to 5` failed (`expected '1' to be '5'`). Undone.
8. Env never set (`if (false)`): `unset` and `empty` failed (`expected undefined/'' to be '1'`). Undone.
9. `bumpCounter` landed call disabled: the three counter landed rows failed (`expected 'contended' to strictly equal …`), and `reports contended ...` failed (`expected to be called 6 times, but got 3 times`). Undone.

`retries a changed etag` does not depend on `landed`: it passes with break 9. It is a pre-existing test of the next-attempt etag, re-pinned only.

## Codegen, build, lint

- codegen: not set.
- build: `link-node-modules.sh . && npx next build` passed. It listed every route.
- lint: `npx tsc --noEmit` clean, and `npm run lint:dup` exited 0 with 0 clones in both configs.
- `git diff --stat origin/main` touches only the five files above. There are no tool-made changes to revert.
- Not reproduced here: the live run against a real store. It needs owner credentials (human-gated criterion).

## Invariant check

- INVARIANTS.md A1 to A3 (paths `lib/aoe4-build-order/**`): untouched. This is storage code and touches no simulation.
- S1 to S3: no shared code and no simulation input.
- Contract: `BuildStore`, `PutResult`, `ReplaceResult` and route statuses are unchanged. The `build-store` and routes tests are unedited and pass.

## Unverified assumptions added to the ticket

None. The fakes stand in only for behavior the ticket already lists: SDK retry semantics, a lost-response retry giving 412 or "already exists", the error class for `ifMatch` on a missing key, and stored text round-tripping. I checked locally that `process.loadEnvFile` keeps an already set variable (Node 24.22.2: `XX_LIVE=preset` survived a file setting it); nothing fakes that. The live `afterAll` handles both a `del` that rejects with `BlobNotFoundError` and one that resolves.

## Out-of-scope findings

- `blob-build-store.ts` `bumpCounter`: two concurrent bumps of the same client counter from the same value write byte-identical JSON, so the loser's `landed` check passes. Both requests count, but the stored count rises by one. This is the design's accepted "deterministic double" (M9.md Behavior rules, "another writer wrote byte-identical JSON"). For the counter, though, the result is a slight undercount of the per-client limit under concurrency rather than "the same content". The design calls this harmless; flagging it for the owner only if the rate limit must be exact.
- `ARCHITECTURE.md` row 24 says `blob-build-store.ts` is "the only file that imports `@vercel/blob`". Test files (`blob-build-store.test.ts`, `named-build-store.acceptance.test.ts`, now the live test) also import it. This was already true before this ticket, and I did not change it.

## Remaining human-gated work

The owner runs `vercel env pull .env.local` and then `npm run test:blob-live` on the PR branch, and pastes the logged class into the PR. The `replaceNamed` comment's "unverified" sentence then becomes the recorded class and the date. If the class is neither `BlobNotFoundError` nor `BlobPreconditionFailedError`, a follow-up commit on the same PR adds it to the conflict mapping.

## Status

`needs_review`
