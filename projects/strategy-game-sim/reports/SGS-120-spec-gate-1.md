# SGS-120 spec gate 1

**Verdict: NEEDS_SPEC** (one gap, small fix; no owner question)

Read at origin/main. SGS-112 and SGS-119 have no local branch yet (both draft), so I read their tickets and design/M8.md C1 and C2.

## Gaps

1. **Scope / Blob `deleteNamed` vs the shared implementation - the ticket contradicts itself.**
   - Scope says each pair (`deleteBuild` / `deleteNamed`) shares one implementation per store "to stay under jscpd threshold 0".
   - Scope also says `deleteNamed` swallows `BlobNotFoundError`, and that "any change to `deleteBuild` behaviour" is out of scope. Today `deleteBuild` is a bare `del(key, { storeId })` that propagates every error (main `blob-build-store.ts`).
   - An implementer has to guess one of three things: (a) the shared code swallows `BlobNotFoundError`, which silently changes `deleteBuild`; (b) `deleteNamed` is a copy, which jscpd may flag; (c) `deleteBuild` is wrapped differently.
   - Fix: pick one and say it. Suggested: the shared `delete(key)` swallows `BlobNotFoundError` for both, and Scope drops `deleteBuild` from "behave as before" for that one error. Add a `deleteBuild` row to the existing `describe('deleteBuild')` block that asserts the swallow, and a propagate row for other errors. Alternative: keep `deleteBuild` unchanged and share only the `del` call.

## Notes (non-blocking)

- Replace-on-absent in Blob: the ticket maps both `BlobPreconditionFailedError` and `BlobNotFoundError` to `'conflict'`. It admits this is unverified against a live store, and a mocked-SDK test cannot verify it. If the real SDK instead creates the blob when `ifMatch` meets an absent key (with `allowOverwrite: true`), design C2 "absent gives conflict" would break silently. Consider an acceptance note or a BACKLOG item to check it once against a real store.
- `build-store.acceptance.test.ts` pins the exact runtime export list of `build-store.ts` (`BUILDS_LOCAL_DIR_DEFAULT`, `buildStoreFromEnv`, `createFileBuildStore`, `createMemoryBuildStore`). The etag helper must stay unexported, or that test must be updated. Say so in Scope. `ReplaceResult` and `StoredWithEtag` are types, so they are safe. SGS-112 adds a `nextCounter` export and will meet the same test.
- The etag is a SHA-256 of the stored text. A replace with byte-identical JSON keeps the same etag. This is harmless because routes bump `revision`, but the criterion "a following `getNamed` returns an etag different from the old one" needs a test input whose JSON differs. Worth one clause.
- SGS-112 and SGS-120 both edit `build-store.ts` and `blob-build-store.ts`. The Depends-on is right, and tech-lead should rebase onto SGS-112.

## Checks passed

- **Grounded scope:** `fileFor`, `bumpCounter` (synchronous in the file store), the Blob `read` helper, `put` options, the `factories` table, the `found` helper, `withBroken` in `builds-routes.test.ts`, and the ARCHITECTURE storage row all exist. `namedBuildKey` is specified by SGS-119 and design C1.
- **Testable criteria:** every criterion has an observable outcome. The existing-tests rule is stated as a rule, and none of the criteria pin a stale number or list.
- **Open questions:** none.
- **Invariants:** `none` is acceptable. A1 to A3 concern simulation, not storage.
- **Contracts:** `ReplaceResult`, `StoredWithEtag` and the four method signatures match design C2 exactly. The key matches C1.
- **Size and diagrams:** about 150 LOC, and the CAS diagram is present.
- **On merge:** `none` is well formed.
- **Risk:** `high` is correct (shared mutable state).
- **Docs:** the ARCHITECTURE row is in Scope. `docs/aoe4-build-order.md` line 716 ("a saved build never changes") concerns `/builds`, which stays true.
- **Input validation:** not applicable.
