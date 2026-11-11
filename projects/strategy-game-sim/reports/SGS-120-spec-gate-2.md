# SGS-120 spec gate 2

**Verdict: READY**

Read at origin/main (fetch ran). SGS-112 and SGS-119 have no local branch, so I read their tickets and design/M8.md C1/C2.

## Gap from gate 1: closed

Blob `deleteBuild` stays a bare `del` and does not share with `deleteNamed`. Memory and file deletes share (both are already absent-tolerant). Criteria now pin it: a `deleteBuild` row asserting `BlobNotFoundError` still rejects, and `deleteNamed` swallow and propagate rows. The three notes from gate 1 are also folded in: the export list stays unchanged (helpers unexported, with a criterion), a differing-JSON replace input, and the live `ifMatch`-on-absent check is out of scope and already in BACKLOG.md line 29.

## Checks

1. Grounded: `fileFor`, `bumpCounter` (sync in the file store), Blob `read(key, fresh)` and `put` options, `factories` and `describe.each` in build-store.test.ts, `describe('deleteBuild')` in blob-build-store.test.ts, the ARCHITECTURE row (line 24), and the export-list test all exist. `namedBuildKey` is new in SGS-119 and the ticket says so.
2. Criteria are observable, each with a mutation it catches. No pinned counts or lists. The existing-tests rule is stated as a rule.
3. Open questions: none.
4. Invariants: `none` is fine.
5. Contracts: `ReplaceResult`, `StoredWithEtag` and the four signatures match design C2. The Blob `get` call shape matches what `read(key, true)` already produces.
6. Size about 150 LOC; depends on SGS-112 and SGS-119.
7. The CAS diagram is present.
8. No LESSONS entry hit.
9. Decisions agree with design.
10. On merge `none` is well formed.
11. Risk `high` is correct.
12. Docs: only ARCHITECTURE line 24 needs the update, and it is in Scope. `docs/aoe4-build-order.md` has no BuildStore statement made untrue.
13. Input validation: not applicable (stored JSON is written by routes that validate).

## Notes (non-blocking)

- The ticket and SGS-112 both edit `build-store.ts` and `blob-build-store.ts`, and both touch the export-list test. SGS-112 adds `nextCounter` to the list; SGS-120 adds no name. Rebase onto SGS-112 first.
- Memory/file `getNamed` must hash the raw stored text (not re-stringified parsed JSON), so the etag matches what `replaceNamed` compares.
