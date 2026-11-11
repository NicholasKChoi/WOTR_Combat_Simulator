# SGS-120 review 1

- Branch: `sgs-120-named-routes` at a12f940, diffed against merge-base 45d0c72 (`git diff 45d0c72...HEAD`; 5 files, +334/-47)
- Mode: full review (first review)
- Verdict: **REQUEST CHANGES** (one blocking convention finding in the Blob store tests; production code passes review)

## Blocking findings

1. `lib/aoe4-build-order/blob-build-store.test.ts:96-136` - convention - The new `createNamed` and `getNamed` blocks copy existing blocks and change only the method and key. `createNamed` "reports exists when put fails and the blob is there" (102) and "rethrows the put error when head fails" (109) repeat `putBuild` 47 and 54 line for line, with the same `put`/`head` mocks and assertions. `getNamed`'s absent-as-null `it.each` (124) and "propagates any other get error" (132) repeat `getBuild` 63 and 77. That is four added blocks that are copies, not table rows. common.md Tests treats this as blocking ("Cases that differ only in input and expected value are rows in one table"). `putBuild`/`createNamed` share one `create` implementation and `getBuild`/`getNamed` share `read`, so the tests should be shared the same way. jscpd does not flag the copies because each block is under its `minLines`. - why: two copies of one contract will drift, the same way the duplicated resource tolerances did in this repo. - direction:
   - Turn the existing `describe('putBuild')` into `describe.each([['putBuild', ID, BUILD_KEY], ['createNamed', NAMED_ID, NAMED_KEY]] as const)('%s', (method, id, key) => ...)` holding the three cases: created with `{ ...PUT_OPTIONS, allowOverwrite: false }` exactly once on `key`, `'exists'` with `head` called once on `key`, and rethrow of the `put` error. Delete the copied `createNamed` blocks.
   - Do the same for the read failures: a `describe.each([['getBuild', ID], ['getNamed', NAMED_ID]] as const)` holding the null/`BlobNotFoundError`-as-null rows and the "propagates any other get error" case. Keep the method-specific cases where they are: `parses a present build` (no `useCache`) and `reads the value and the blob etag without the cache` (`useCache: false`, etag returned).
   - Check: changing `create`'s `allowOverwrite: false` to `true` (`blob-build-store.ts:36`) must fail both table rows of the first case, and removing the `BlobNotFoundError` branch in `read` (`blob-build-store.ts:29`) must fail both rows of the second.

## Spec gaps (NEEDS_SPEC)

None blocking.

- Acceptance criterion "every non-test `ifMatch` match under `lib` is in `blob-build-store.ts`" also matches `lib/aoe4-build-order/named-builds.ts:79-80`. That match is the parameter of `parseIfMatchRevision(ifMatch: string | undefined)`, which design M8 C1 names with exactly that signature and which predates this diff. It parses the HTTP header and is not a Blob SDK `ifMatch` use. I read this as a **wording gap, not a violation**: the criterion's intent (only the Blob store passes `ifMatch` to the SDK) holds. Future tickets should word it as "every non-test `ifMatch:` option passed to `@vercel/blob` is in `blob-build-store.ts`". Owner of the wording: ticket/spec-gate. No code change.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Memory/file `describe.each(factories)` cases (create once / exists, absent null, value + non-empty etag, replace with new etag, delete + absent delete) | pass | `build-store.test.ts` `'%s named builds'`; 65/65 pass |
| 2 | Stale etag refused, first replacement kept (memory, file) | pass | "refuses a stale etag and keeps the first replacement"; dropping the compare fails it (implementer mutation 3) |
| 3 | Absent id gives `'conflict'` and is not created (memory, file) | pass | "answers conflict for an absent id and does not create it" |
| 4 | Two concurrent replaces: one `replaced`, one `conflict`, the winner's value stored | pass | I changed `build-store.ts:82` `text.readNow(key)` to `await text.read(key)`; the memory and file variants both failed, then I reverted |
| 5 | Named and saved keys disjoint; envs share no named build; file at `<env>/named-builds/<id>.json` | pass | three tests; the memory env variant cannot fail for an env-key bug because each memory store has its own Map (non-blocking note 1) |
| 6 | Blob `getNamed` options `{access, storeId, useCache: false}`, `{value, etag}`, null/not-found null, other propagates; `replaceNamed` exact put options once, `'replaced'` | pass | `blob-build-store.test.ts:117-143` |
| 7 | Blob `replaceNamed` failure table (precondition and not-found give conflict with one put; generic rejects; no `head`/`get`) | pass | `blob-build-store.test.ts:145-157` |
| 8 | Blob `createNamed` created/exists/rethrow; `deleteNamed` del once, swallows not-found, propagates others | pass (see blocking 1 on form) | `blob-build-store.test.ts:96-174` |
| 9 | Blob `deleteBuild` propagates `BlobNotFoundError` (new row in existing block) | pass | `blob-build-store.test.ts:89-93`; `deleteBuild` unchanged at `blob-build-store.ts:51-53` |
| 10 | Export list unchanged | pass | `build-store.acceptance.test.ts` passes; the new runtime symbols (`TextByKey`, `textEtag`, `buildMethods`) are unexported; `ReplaceResult`/`StoredWithEtag` are types |
| 11 | Search criteria (`ifMatch`, `@vercel/blob`) | pass (intent) | `@vercel/blob` is imported outside tests only by `blob-build-store.ts`. The only other `ifMatch` match is `named-builds.ts:79-80`, which is the wording gap above |
| 12 | `tsc --noEmit`, `lint:dup`, stubs compile | pass | I ran both: tsc clean, jscpd 0 clones. `withBroken` and `storeWith` spread `createMemoryBuildStore()` |
| 13 | ARCHITECTURE.md row names the four methods; the grep leaves nothing contradicted | pass | ARCHITECTURE.md:24. `docs/aoe4-build-order.md:716` ("a saved build never changes") is about `?b=` saved builds and still holds |
| 14 | No INVARIANTS regressions | pass | see below |

## Invariants touched

- The diff is under `lib/aoe4-build-order/**`, so A1-A3 are in scope. A1: no game numbers added. A2: no spend logic touched. A3: the store is not on the simulation path. `createHash` is deterministic, and nothing reads time or randomness. All hold.
- S3: no new numeric input or list response. Holds.

## Contract check (design M8 C2)

- The `BuildStore` additions match C2 exactly: names, signatures, `ReplaceResult`, `StoredWithEtag`.
- Memory/file etag: SHA-256 hex of the stored text, from one helper (`build-store.ts` `textEtag`), as the ticket requires. Byte-identical rewrites keep the etag, which the ticket accepts because routes always bump `revision`.
- Blob `replaceNamed` makes one `put` with `allowOverwrite: true, ifMatch`. It has no retry and no `head` fallback, and maps 412 and not-found to `conflict`. That matches the ticket.
- Behavior of `putBuild`/`getBuild`/`deleteBuild` is unchanged. I traced each one:
  - File store: `fileFor` and `JSON.parse` errors still propagate (the parse moved out of the try, but a `SyntaxError` was rethrown before too). ENOENT still gives null. `rm(..., {force: true})` is unchanged.
  - Memory store: `builds.get(key) ?? null` keeps the old `undefined -> null` mapping.
  - Blob store: `create` keeps the same options object (key order aside), the same `head` fallback and the same rethrow.
- The file store keeps `fileFor`'s plain-path check for the named key: every `TextByKey` primitive goes through `fileFor`.
- Scope: no routes, OpenAPI, client, `revision` or `bumpCounter` changes. `bumpCounter` only switches to the shared `putOptions` spread, with the same option values (the `blob-build-store.test.ts` `bumpCounter` block passes).

## Bot reconciliation

`reviewBot.cli` is empty and `rulesFile` is empty, so no bot ran and there is nothing to reconcile.

## Non-blocking notes

1. `build-store.test.ts` "shares no named build between envs": the memory variant cannot fail for an env-prefix bug, because `makeStore('preview')` and `makeStore('production')` each have their own `Map`. Only the file variant, with its shared `dir`, checks env isolation. This copies the existing "shares neither builds nor counters between envs" test, which has the same gap, and the ticket asked for it "as the existing env-isolation test does". To fix both, the memory factory could share one backing map, or the test could stay file-only. BACKLOG candidate.
2. `build-store.ts:149-164`: the file store's async `read` and sync `readNow` have the same try/ENOENT body. The memory store defines `read` as `async (key) => readNow(key)` (`build-store.ts:104`). The file store could do the same, at the cost of a blocking read on `getBuild`/`getNamed` in a dev/test-only store. This is a style choice either way.
3. File store `replaceNamed` is atomic only within one process. The `bumpCounter` comment says this for counters, but nothing says it for named builds. The impact is the same (next dev / Vitest / Playwright only) and lower, because a lost CAS there only lets a stale write through in local dev. Optional one-line comment.
4. Blob SDK (`@vercel/blob` 2.9 `requestApi`) retries internally. If a `put` with `ifMatch` succeeds server-side but the response is lost, the SDK's retry gets 412, and `replaceNamed` reports `conflict` for a write that landed. The route would answer 412 to a save that succeeded. This is covered by the existing BACKLOG item on SDK retry behavior and is out of scope here.
5. Implementer note (2): whether a live store returns `BlobNotFoundError` for `del` on a missing key, or just succeeds, cannot be checked with a mock. `deleteNamed` is correct either way: it swallows not-found and success is a no-op. BACKLOG line 29 covers only the `put` + `ifMatch`-on-absent check. The `del` question needs no action, because both outcomes give the same result.
6. Implementer report: the stale `.git/config.lock` in the main checkout (from worktree setup) is for the manager to clear.

## Linter

`npx tsc --noEmit`: clean. `npm run lint:dup` (jscpd): 0 clones across 148 files. There is no ESLint config in the repo.

## Conventions compared

- `blob-build-store.test.ts:35-81` (`putBuild`/`getBuild` blocks): the source of blocking finding 1.
- `build-store.test.ts:58-115` (`'%s build store'`): the new `'%s named builds'` block follows its `describe.each(factories)` layout and naming.
- `blob-build-store.ts:12-32` (`exists`, `read` helpers): the new `create` helper follows the same closure style. The `replaceNamed`/`deleteNamed` error handling matches `read`'s `instanceof` checks.
- `build-store.ts` `bumpCounter` (file store): its comment on sync read-write is matched by the `TextByKey` comment. That comment holds: `build-store.ts:80-86` has no `await` between `readNow` and `writeNow`.

Doc and comment claims I checked against the code: the build-store.ts header, the `BuildStore` method comments, the `TextByKey` comment, the blob `replaceNamed` comment, and the ARCHITECTURE.md row. All hold.

## Coverage

- Reviewed: `lib/aoe4-build-order/build-store.ts`, `blob-build-store.ts`, `build-store.test.ts`, `blob-build-store.test.ts`, `ARCHITECTURE.md`. Also read: `named-builds.ts:79-80`, `docs/aoe4-build-order.md` (store/immutable grep), the `@vercel/blob` 2.9 dist (`del`, put `ifMatch` handling, error-code mapping), and the `BuildStore` stubs in `builds-routes.test.ts`.
- Ran: tsc, lint:dup, `npx next build` (passes), and Vitest on `build-store`, `blob-build-store`, `build-store.acceptance`, `builds-routes` and `save-rate-limit` (5 files, 174 passed). I ran one mutation (criterion 4), which failed as expected and was reverted.
- UI inspection: not run, because the diff changes no UI.
- REPO.md Review checklist: "Every diff": `next build` passes. No page is touched, so there is no page to load. "AoE4 build order": no helper or constant was copied from another module (`namedBuildKey` is imported, and the etag helper is new and single). The engine docs are not affected, and there is no UI.
- Not reviewable here: live Vercel Blob behavior for `put` with `ifMatch` on an absent key (BACKLOG line 29) and `del` on a missing key.
