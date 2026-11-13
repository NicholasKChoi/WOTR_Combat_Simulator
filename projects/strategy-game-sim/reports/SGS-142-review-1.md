# SGS-142 review 1

Verdict: **APPROVE**

- Branch `sgs-142-replace-named-missing-key-conflict`, tip 7b0aaded, base origin/main 41b3ed3. Full review (not delta mode).
- Review worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/review-sgs-142`.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

1. Plain `BlobError`, head absent, fresh read not ours, gives `conflict`; the test fails at the base: **pass**. Row `maps an unrecognized put error when head reports the key absent ...` (`blob-build-store.test.ts:261`, put `missingKey`, `nothingStored`, head rejects `BlobNotFoundError`). I put the base `blob-build-store.ts` under the new tests myself. Both absent rows failed because the put error was rethrown (`Error: Vercel Blob: The specified key does not exist.` and `Error: service down`), which is the bug. Then I restored the file.
2. Head finds the key present, so the original put error is rethrown: **pass**. Row `:263` expects `rejects.toBe(missingKey)`. With `headNotFound` mutated to return true on a resolved head, this row failed (my mutation run).
3. Head fails for another reason, so the original put error is rethrown (not the head error, not `conflict`): **pass**. Rows `:264` (plain `Error('head down')`) and `:265` (`BlobError('boom')`) use `rejects.toBe(missingKey)`, so returning the head error or `conflict` fails both. With the mutation where the catch returns true for any error, both rows failed.
4. Landed read-back still gives `replaced`, and the precondition and not-found rows still give `conflict`: **pass**. Row `:240` (plain BlobError plus our JSON gives `replaced`, head never called). Rows `:234-239` are unchanged.
5. Live test 1 asserts the exact class, and live test 2 passes against a real store: **test 1 pass (by reading); test 2 unverified**. `expect((error as Error).constructor).toBe(BlobError)` fails for any subclass, such as `BlobOidcEnvironmentNotAllowedError`, and for a null result (TypeError). The `console.log` is kept. Test 2 needs owner credentials. The implementer states it was not run, which the ticket allows. Running it is the owner's job.
6. Docs and comments corrected: **pass**. The comment above `replaceNamed` (`blob-build-store.ts:119-121`) and the storage row on `ARCHITECTURE.md:24` both match the code. No other doc or comment calls the error unverified (grep over lib, docs, pages).
7. No INVARIANTS.md regressions: **pass** (see below).

Existing tests: the five "any other error" rows asserted `head` was never called. The ticket's scope rule covers them: change them to the new behavior. One was kept as the landed row, and the cases of the others moved to the new head table. No other assertion changed. The removed `if (expected instanceof Error)` branch in the first table's body is dead now that no error rows remain.

Bug-type check: the implementer recorded an equivalent break, not a base run. I ran the real base production file against the new tests, as described in criterion 1. The regression rows fail on the assertion that names the bug. The fix is in `replaceNamed`, the cause the ticket's Context names, not in the route.

## Invariants touched

- A1 (game numbers from data): not affected. Storage code only, no game numbers.
- A2 (resources never negative): not affected.
- A3 (determinism): not affected. No randomness or clock reads in the simulation path.
- Ticket rule "no retry, no etag from a read fed into a write": holds. `headNotFound` only decides whether to return `conflict`, and no new `put` was added.

## Doc claims checked

- ARCHITECTURE.md sentence on `replaceNamed` ("conflict for a precondition or not-found error, and for any other put error when head reports the key absent ..., and rethrows the put error otherwise"): matches `blob-build-store.ts:128-131`. The read-back still comes first, as the preceding sentence says.
- Comment "on @vercel/blob 2.9.0": the lockfile resolves `@vercel/blob` 2.9.0 (`package-lock.json:1703`). The class claim is the owner's observation, and live test 1 pins it.
- Comment "exists() reads any head failure as absent": true (`blob-build-store.ts:17-24`, `catch { return false }`).

## Lint and build

- `npx tsc --noEmit && npm run lint:dup`: clean (0 clones).
- `npx vitest run lib/aoe4-build-order/`: 1668 passed, 15 skipped. `blob-build-store.test.ts` alone: 59 pass. This reruns the tests affected by the late type-only cleanup.
- `npx next build`: passed.

## Bot reconciliation

`reviewBot.cli` is empty and there is no rulesFile, so this was skipped.

## Conventions

- `headNotFound` sits beside `exists` and follows its shape (`blob-build-store.ts:17-24`). It is deliberately a separate helper because `exists` cannot tell an outage from absence. The comment states this rejected alternative, which the comment bar allows.
- The new test table matches the sibling `it.each` style in the same describe (`:233-248`). The head mock cast `{} as Awaited<ReturnType<typeof head>>` matches `:109` and `:358`.

## UI inspection

Not run, because the diff changes no UI (lib, tests and ARCHITECTURE.md only). No page is touched, so there was nothing to load under REPO.md "Every diff".

## Non-blocking notes

- `blob-build-store.test.ts:261-262`: two rows share the label `head reports the key absent`, so vitest prints the same title twice (visible in the base-run output). A label that names the put error ("a plain BlobError" / "a plain Error with a read that throws") would tell the two apart in failure output.
- In the absent rows, `arrangeHead` repeats the `beforeEach` default (`:68`, head rejects `BlobNotFoundError`). This is harmless, and being explicit helps the reader.

## Coverage

Reviewed: `lib/aoe4-build-order/blob-build-store.ts`, `blob-build-store.test.ts`, `blob-build-store.live.test.ts`, `ARCHITECTURE.md` (storage row), and the caller in `named-builds-routes.ts:118-129`, which maps `conflict` to 409 and other errors to 503 and is unchanged. Sections applied: REPO.md review checklist "Every diff" and "AoE4 build order" (no copied helper, no doc contradicted, no UI). Spec-checklist: A1-A3, Contracts, Scope, Naming. Not reviewable here: live test 2 against a real Blob store, and whether `head` on an absent key really rejects with `BlobNotFoundError` (a ticket assumption that only the owner's live run checks).
