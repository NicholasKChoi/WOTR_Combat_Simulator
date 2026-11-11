# SGS-120 review 2 (delta, Rework 1)

- Branch: `sgs-120-named-routes`, diff `a12f940..2e22c75` (one file, `lib/aoe4-build-order/blob-build-store.test.ts`, +23/-55). Test-only.
- Verdict: **APPROVE**

## Required fixes from review 1

1. `putBuild`/`createNamed` shared table: met. `describe.each([['putBuild', ID, BUILD_KEY], ['createNamed', NAMED_ID, NAMED_KEY]] as const)('%s', ...)` holds the three cases (created with `{ ...PUT_OPTIONS, allowOverwrite: false }` exactly once on `key`; `'exists'` with `head` once on `key`; rethrow of the `put` error). The copied `createNamed` block is deleted.
2. `getBuild`/`getNamed` shared table: met. `describe.each([['getBuild', ID], ['getNamed', NAMED_ID]] as const)` holds the two absent-as-null rows and "propagates any other get error". The method-specific cases stay: `parses a present build` (`getBuild`, no `useCache`) and `reads the value and the blob etag without the cache` (`getNamed`, `useCache: false`, etag).
3. Mutation check: I changed `allowOverwrite: false` to `true` in `blob-build-store.ts` `create`. Both the `putBuild` and `createNamed` rows of the shared case failed (plus the existing `bumpCounter` test, as before). The change is reverted (`git checkout`). The `BlobNotFoundError` row runs for both methods through the one `read` helper, so removing that branch fails both rows by construction. I did not run that mutation.

## Coverage lost from the moved tests

None. The `putBuild` create test now asserts `{ ...PUT_OPTIONS, allowOverwrite: false }`. `PUT_OPTIONS` (`blob-build-store.test.ts:16`) is `{access:'private', addRandomSuffix:false, contentType:'application/json', storeId}`, which equals the old literal. The test name now also says "ifMatch". That claim holds, because `toHaveBeenCalledExactlyOnceWith` on the exact options object fails if `ifMatch` is present. The absent-as-null and propagate cases for `getBuild` are unchanged in substance, with the title reworded to "absent blob". The `createNamed`/`getNamed` cases are all still present as table rows. 32 tests pass in the file.

## Linter

- `npx tsc --noEmit`: clean (the `store()[method]` call typechecks).
- `npm run lint:dup`: clean, no clones reported.
- `npx vitest run lib/aoe4-build-order/blob-build-store.test.ts`: 32 passed.

## Blocking findings

None.

## Acceptance criteria and invariants

No production code changed since review 1, so that review's verdicts and invariant checks stand. Criteria 6-9 (Blob store coverage) still pass, with the evidence now in the shared tables.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## Non-blocking notes

Review 1's notes 1-6 still stand unchanged.

## Coverage

Reviewed `git diff a12f940..2e22c75` and the touched test file in full. UI inspection was not run (no UI change).
