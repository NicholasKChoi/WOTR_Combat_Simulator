# SGS-130 review 1

- Branch: `sgs-130-blob-landed-write-retry-cap`, tip `0144aca6114acce33910c3eb32497c1d4bbf50a0`, base `origin/main`
- Mode: full review (first review)
- Verdict: **REQUEST CHANGES** (two text-only fixes; the code and tests are correct)

## Blocking findings

1. `ARCHITECTURE.md:24` - contract (text) - The new sentence "When a Blob `put` throws (in `create`, `bumpCounter` or `replaceNamed`), the store makes a fresh read ...; otherwise the put error decides the outcome." is wrong for `create`. At `lib/aoe4-build-order/blob-build-store.ts:65-67`, when `landed` is false, `create` returns `'exists'` whenever `head` finds the key, whatever the put error was. The put error only matters when the key is absent. A maintainer would read the sentence as saying `create` rethrows a network error, which it does not. The implementer's Doc claims list also says "In `create`, the `exists` check also takes part". The same row's clause "(`@vercel/blob` reads it as its per-call retry count, default 10)" is also wrong for `get`. In `@vercel/blob` 2.9.0, `get` (`node_modules/@vercel/blob/dist/index.cjs:102-155`) makes a single `undici.fetch` with no retry loop. Only `put`, `head` and `del` go through `requestApi`, which calls `getRetries()` (`chunk-RUHXEFX2.cjs:645-651, 831`).
   Direction: replace these two sentences in the row:
   "When a Blob `put` throws (in `create`, `bumpCounter` or `replaceNamed`), the store makes a fresh read of the key and counts the write as done when the stored value, serialized with `JSON.stringify`, is the exact text it sent, since a write whose response was lost may have landed before the SDK's retry failed; otherwise the put error decides the outcome. Creating the store sets `VERCEL_BLOB_RETRIES` to `BLOB_SDK_RETRIES` (1) when that variable is unset or empty (`@vercel/blob` reads it as its per-call retry count, default 10); a value already set is kept."
   with this text:
   "When a Blob `put` throws (in `create`, `bumpCounter` or `replaceNamed`), the store makes a fresh read of the key and counts the write as done when the stored value, serialized with `JSON.stringify`, is the exact text it sent, since a write whose response was lost may have landed before the SDK's retry failed. Otherwise `create` gives `exists` when `head` finds the key and rethrows the put error when it does not; `replaceNamed` gives `conflict` for a precondition or not-found error and rethrows any other; `bumpCounter` tries again after a 412 or when the counter it was creating now exists, rethrows any other error, and gives `contended` after its third attempt. Creating the store sets `VERCEL_BLOB_RETRIES` to `BLOB_SDK_RETRIES` (1) when that variable is unset or empty (`@vercel/blob` reads it as the retry count of each `put`, `head` and `del` call, default 10; `get` makes a single request); a value already set is kept."
   Facts the replacement keeps: the three methods that trigger the check; it is a fresh read; text equality after `JSON.stringify`; the lost-response rationale; the value 1; set only when unset or empty; default 10; an existing value is kept. Facts it corrects: "the put error decides the outcome" and "per-call retry count".

2. `lib/aoe4-build-order/blob-build-store.ts:9-10` - contract (text) - "@vercel/blob reads VERCEL_BLOB_RETRIES from process.env on every request (default 10)" is wrong for `get`, which in 2.9.0 makes one fetch and reads no retry count (same evidence as finding 1). A reader would think the cap also bounds `read`/`landed` retries, but `get` never retries.
   Direction: replace the two comment lines with:
   "// @vercel/blob reads VERCEL_BLOB_RETRIES from process.env on every put, head and del call (default 10; get is
   // not retried), and bumpCounter's attempts multiply those retries during an outage."
   Facts the replacement keeps: the variable is read from `process.env` on each call, default 10, and `bumpCounter`'s attempts multiply the retries. Fact it corrects: "every request".

## Spec gaps

None that block. For the manager and designer (out of scope here): `design/M9.md` Behavior rules "SDK retries" ("At most `1 + BLOB_SDK_RETRIES` HTTP attempts per SDK call", with "read 2" and "landed read 2" in the `bumpCounter` worst case) and the reason given for owner decision 4A ("keeps one retry for transient 5xx on reads") both assume `get` retries. In `@vercel/blob` 2.9.0 it does not (see finding 1). The chosen value 1 still meets the ticket, because `put`, `head` and `del` honour it. The design text needs a correction, but the code does not change.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Env cap set when unset, explicit value kept | pass | `blob-build-store.ts:14` (`!process.env...` covers unset and empty). The test table at `blob-build-store.test.ts:47-56` asserts the value before and after store creation for unset, empty and `'5'`. My mutation (always overwrite) failed the `'5'` row. |
| 2 | `replaceNamed` 412/other-error x landed/not-landed outcomes | pass | Table `blob-build-store.test.ts:202-223`, covering 11 rows. `rejects.toBe(original)` checks that the error is not swallowed. Mutations (landed always true or false, deep compare, rethrow from landed) each failed at least one row. |
| 3 | `BlobNotFoundError` + nothing stored gives `'conflict'`; one put with the caller's etag | pass | Row at `:208`. `put` is asserted `toHaveBeenCalledExactlyOnceWith(..., ifMatch: 'etag-1')` on every row, including the rows where the read-back carries `"landed-etag"`. |
| 4 | `create` landed/exists/rethrow, for both methods | pass | `describe.each` over `putBuild` and `createNamed` at `:59-90`: landed gives `created` (fresh-get options, no `head`); other content plus `head` found gives `exists`; nothing stored plus `head` failing gives `rejects.toBe(putError)`. |
| 5 | `bumpCounter` landed / 412 to contended / non-412 rethrow | pass | `:322-332` (one put, two gets, three rows), `:306-312` (6 gets, `contended`), `:334-342` (rethrow after one put). My mutation (landed only on 412) failed the network and create rows. |
| 6 | A throwing `landed` read keeps the put error's outcome | pass | Rows "a read that throws" and "a weak etag read of our JSON" at `:206-207, :212-213`. My mutation (rethrow from landed) failed all four. |
| 7 | Text equality, not deep equality | pass | `:225-232` key order and whitespace. My mutation `isDeepStrictEqual(stored.value, JSON.parse(json))` failed both. |
| 8 | No signature, result type or route change; build-store and routes tests unedited | pass | The diff touches only `blob-build-store.ts`, its test, the new live test, `package.json` and `ARCHITECTURE.md`. `npm test`: 74 files passed, 1 skipped; 2378 tests passed, 15 skipped. |
| 9 | `npm test` skips the live file; `BLOB_LIVE=1` without credentials fails in `beforeAll` | pass | Ran `vitest run lib/aoe4-build-order/blob-build-store`: live file 2 skipped. Ran `env -u BUILDS_STORE_ID npm run test:blob-live` with no `.env.local`: the suite failed with `Error: BUILDS_STORE_ID is not set; run vercel env pull .env.local`. |
| 10 | Live test writes only `live-check-` keys and deletes them in `afterAll` | pass | Read the code. `env = live-check-<uuid>`, so the probe key and `namedBuildKey(env, id)` both start with it. `afterAll` deletes both, ignores only `BlobNotFoundError`, and rethrows anything else. |
| 11 | `ARCHITECTURE.md` and seam comments match the new behavior | **fail** | Findings 1 and 2. `build-store.ts:35` ("never retries") is still true, because the landed read is not a write retry. `docs/aoe4-build-order.md:739` is unchanged and still true. |
| 12 | Human-gated live run, recorded class pasted, comment updated | unverified | It needs owner credentials. The `replaceNamed` comment still says "unverified" and points at the live test, as the ticket allows until the run happens. |
| 13 | No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- A1, A2, A3 (paths `lib/aoe4-build-order/**`): they hold. The change is storage code and touches no simulation path, no game numbers and no randomness in a simulation result. `randomUUID` appears only in the opt-in live test.
- S1 to S3: not touched. There is no shared code, page or new numeric input.

## Existing tests edited (ticket rule "Existing tests")

All six edits are in `blob-build-store.test.ts`. I judge all six acceptable:
- create "reports exists ... other content": the expected `'exists'` is kept. The stored `{a:2}` makes the criterion-4 case explicit.
- `replaceNamed` mapping table: changed behavior (a landed read now happens). The original three outcomes are kept as rows.
- "retries a changed etag": the old fixture's second read (`{W,2}`) is now byte-identical to our write, which is the landed case. The fixture was re-pinned to `{W,3}`, so the count went from 3 to 4. The test still checks what its name says: the second put uses `etag-2`.
- "reports contended ...": `contended` and the `ifMatch` list are kept. The number of `get` calls went from 3 to 6 because of the landed reads.
- "retries a create that lost": same reason as "retries a changed etag" (`{W,1}` equalled our create). The put count of 2 is kept.
- "propagates any other put error on an update": `mockImplementation`, so the read-back really differs instead of failing on a consumed stream. The expected value is kept.

Every edited test can still fail. The implementer's mutation list matches the results I reproduced.

## Bot reconciliation

`REPO.md` has no `reviewBot.cli` and no `rulesFile`, so this section was skipped.

## Lint and build

- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones in both configs.
- `npx next build`: passed.

## Non-blocking notes

- `ARCHITECTURE.md:24` still lists the fresh reads as "`getNamed` and the counter read" and says a weak etag on them becomes a 503. The `landed` read is a third fresh read whose weak-etag throw is swallowed. This is not a contradiction, but you could add it if the row is edited anyway.
- In the live test, the probe `put` (first `it`) runs before `createBlobBuildStore` sets the retry cap, so the probe uses the SDK default of 10 retries. A 412 or 404 is not retried, so the result does not change.
- The implementer flagged that two concurrent counter bumps from the same value write byte-identical JSON, so the loser counts as landed and the per-client count rises by one, not two. The design accepts this ("deterministic double"). It is a slight undercount under concurrency, which the owner may want to know about.

## Conventions

- The test file follows its own helpers (`found`, `compressed`, `store`, `counterPuts`) and `it.each` tables. There are no copied blocks.
- The live test uses the same style (4-space indent, no semicolons) as `blob-build-store.test.ts`.
- The source edits follow the existing closure-helper style (`exists`, `read`) at `blob-build-store.ts:17-47`.
- No ticket ids or factory pointers appear in shipped text.

## UI inspection

Not run: the diff changes no UI (library, tests, `package.json` and docs only).

## Coverage

- Reviewed in full: `lib/aoe4-build-order/blob-build-store.ts`, `blob-build-store.test.ts`, `blob-build-store.live.test.ts`, `package.json`, `ARCHITECTURE.md` (the changed row).
- Grep-checked: `build-store.ts` (`BuildStore.replaceNamed` comment) and `docs/aoe4-build-order.md` (conflict and retry statements).
- Checked against the SDK: `@vercel/blob` 2.9.0 `getRetries`, `requestApi`, `get`, `head`, `del`.
- Not reviewable here: the live Blob run (human-gated). `REPO.md` review checklist: I did "Every diff" (build) and the AoE4 section (no copied helpers, no doc contradicted beyond findings 1 and 2). There is no page to load, because no UI changed.
