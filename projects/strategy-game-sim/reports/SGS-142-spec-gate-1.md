# SGS-142 spec gate 1

Verdict: READY. Risk tier standard confirmed.

Read at origin/main after `git fetch origin`.

## Checks

- Grounded scope: `replaceNamed`, `exists`, `landed`, `read` in `lib/aoe4-build-order/blob-build-store.ts` exist as described. The comment above `replaceNamed` ("unverified ... so not-found also conflicts") exists. `describe('replaceNamed')` in `blob-build-store.test.ts` and both live tests exist. `exists` swallows every `head` failure, so the ticket is right not to reuse it. `BlobError` is exported by @vercel/blob 2.9.0 (installed), so the live test can assert the class.
- Tests that depend on the change: the `it.each` in `describe('replaceNamed')` asserts `head` not called for every row. The default `head` mock rejects with `BlobNotFoundError`, so the five "any other error" rows that expect a rethrow, with nothing, other JSON, or a read failure stored, would flip to `conflict`. Scope names these rows as changing. The `BlobPreconditionFailedError` and `BlobNotFoundError` rows keep `head` uncalled, which matches "not already a known conflict error". The stateful fake near line 40 throws `Error('already exists')` and `BlobNotFoundError`, which is unaffected for `replaceNamed`.
- Route tests (`named-builds-routes.test.ts`) mock `replaceNamed` and are unaffected.
- Invariants: A1-A3 cover the `lib/aoe4-build-order/**` path but the change is not adjacent to them. `none` is acceptable.
- Contracts: no new names or types. `conflict` and `replaced` are existing `PutResult` or `replaceNamed` values.
- Risk: no `strongModelTriggers` item applies (no public schema or contract change, no capped bound, about 15 lines). No `criticalPaths` entry applies. One component, so not `low` given the 503/409 route behavior. `standard` is correct.
- Unverified assumptions: the missing-key `BlobError` from `put` and `head` rejecting with `BlobNotFoundError` are listed, and the live test is the check.
- On merge `none`, Open questions `none`, Diagrams (not needed), size (about 15 LOC) are all fine.
- Criteria avoid stale counts and quoted function names. Search criteria over code: none.

## Gaps

None.

## Notes (non-blocking)

- ARCHITECTURE.md line 24 says "`replaceNamed` gives `conflict` for a precondition or not-found error and rethrows any other". This becomes untrue, since a plain error with an absent key now gives `conflict`. Scope's "fix only a statement the change makes untrue" covers it, but the implementer should edit that sentence specifically. The sentence about `landed` read-back stays.
- Live test 1 should compare `error.constructor` to `BlobError` (or `error.constructor.name`), because `toBeInstanceOf(BlobError)` would also pass for subclasses.
