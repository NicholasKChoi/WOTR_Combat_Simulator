# SGS-130 acceptance-test 2 (delta from d2b7669, re-spec 1)

**Verdict: PASS.** 21/21 tests in `blob-lost-writes.acceptance.test.ts` pass at commit `559cf88`. That commit is on `sgs-130-blob-landed-write-retry-cap`, on top of 2d7f34e. Every counter test that is new or changed fails under a production break.

## Harness

This uses the same Vitest acceptance layer as run 1. `@vercel/blob` is replaced by an in-memory fake, the store is built through `buildStoreFromEnv` with a Blob env, and the real route handlers are driven. The Playwright harness cannot reach the Blob store, because `next dev` uses the file store. Production for build writes has not changed since d2b7669 (only comments changed), so those earlier tests were rerun but not mutated again. The live Blob test was not run, as the launch instruction says.

The implementer's rework (2d7f34e) had already changed the counter cases. 73693ef deleted the two env retry-cap tests because the unit test covers the same thing.

My changes in this delta:
- I pinned the first-save count to exactly 2 and the counter puts to 2, where the earlier test accepted 1 or 2.
- I added a parallel-saves test.
- I added a small `beforeRead` hook to the fake, plus `holdCounterReads(n)`. It holds the first n counter reads until all of them have arrived. Without it, the three saves ran one after another: the build id is a `crypto.subtle` hash, which resolves on its own schedule. In that state the test still passed with the read-back put back in, so it proved nothing.

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-130-blob-landed-write-retry-cap/lib/aoe4-build-order/blob-lost-writes.acceptance.test.ts`

## Counter tests (the delta)

| Test | Pins |
|------|------|
| answers 201 on a first save and charges one extra count, not a read-back, when the SDK retry runs into the counter write that landed | Route criterion: 201, one build put, 2 counter puts, stored `{windowStart, count: 2}`. Count is above accepted saves by exactly one, with no read-back |
| same, when the connection drops after the counter write lands | Same, for a dropped response |
| lets only one of three parallel saves from one client through when one save is left in the window | Counter seeded at `maxSaves - 1`. All three counter puts use the seeded etag. Statuses are [201, 429, 429], the stored count is `maxSaves`, and one build put is made (tech-lead finding, owner decision 7) |
| answers 503 and stores no build when the connection drops after a counter update lands (implementer's, verified) | Route criterion: dropped update gives 503 with the put error logged, 1 counter put and 0 build puts |
| answers 429 with Retry-After 1 after three counter puts when every attempt loses to a concurrent bump (unchanged) | Route criterion: `contended` |
| answers 503 and stores no build when the counter write fails and nothing landed (unchanged) | A non-412 error is rethrown |

## Runs

- New file: 21/21 passed at the clean tip.
- Component files: 7 files, 296/296 passed. They are `blob-lost-writes.acceptance`, `blob-build-store`, `named-build-store.acceptance`, `build-store.acceptance`, `build-store`, `named-builds-routes` and `builds-routes`.
- Playwright was not rerun. The delta touches only the Blob counter path, and Playwright cannot reach it.
- Lint: `npx tsc --noEmit && npm run lint:dup` is clean, with 0 clones.

## Mutation checks

All breaks were in `lib/aoe4-build-order/blob-build-store.ts` `bumpCounter`, with line numbers at 2d7f34e. After each break I ran `git checkout -- lib/aoe4-build-order/blob-build-store.ts`, then `git diff --exit-code` on that file, and it printed `clean`. Every failure below is an assertion failure; none is a setup error or a timeout.

| Break | Location | Failed tests and assertion |
|-------|----------|----------------------------|
| M1: add back `if (await landed(key, JSON.stringify(update))) return update;` in the catch | `:95` | Both first-save cases fail: `putsTo('rate-limit')` length 1, expected 2. Parallel fails: statuses [201,201,201], expected [201,429,429]. Dropped update fails: status 201, expected 503 |
| M2: remove the created-meanwhile `continue` | `:96` | Both first-save cases fail: 503, expected 201. The 429 test fails: 503, expected 429 |
| M3: a 412 throws instead of `continue` | `:95` | Parallel fails: [201,503,503], expected [201,429,429]. The 429 test fails: 503, expected 429 |
| M4: `throw error` becomes `continue` | `:97` | Dropped update fails: 201, expected 503. Nothing landed fails: 201, expected 503 |

Run 1's M11 check (COUNTER_ATTEMPTS 4 breaks the 429 test) still applies, because neither that test nor that code changed.

## Failures

None.

## Criteria not expressed here

- The unit-level counter criteria (`get` once per attempt, two parallel `bumpCounter` calls, failure paths) are pinned in `blob-build-store.test.ts` by the implementer. At route level they are covered indirectly by the tests above.
- The docs criterion, the live test and the human-gated criterion are not boundary behavior. The live test was not run. Run 1's notes on these still apply.
