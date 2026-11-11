# SGS-120 ticket 1 (re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-120-named-build-store-methods.md

## Summary

SGS-120 "Add the named-build store methods (memory, file and Blob compare-and-swap)", component aoe4-build-order, Risk high, ~150 business LOC, depends on SGS-112 and SGS-119. It adds `createNamed`, `getNamed`, `replaceNamed` and `deleteNamed` to `BuildStore` as design M8 C2 states them (the revised C2 does not change these signatures). The criteria cover memory and file behavior, compare-and-swap correctness (stale etag, absent key, concurrent replace), key isolation, Blob SDK call shapes and error mapping, unchanged Blob `deleteBuild`, the pinned export list, search criteria, tsc and jscpd, and docs. Lint is clean.

## Blocking gap resolved: deleteNamed / deleteBuild

I kept `deleteBuild` unchanged. Sharing is not clearly safe. Today Blob `deleteBuild` is a bare `del` that propagates every error, and `savedBuildReply` maps a throw to 503. A shared delete that swallows `BlobNotFoundError` would turn that 503 into a 204, which changes the route's behavior.

- **Blob store:** `deleteNamed` is its own short try/catch around `del`. It is below jscpd's minLines 8 / minTokens 70, so jscpd does not flag it as a clone.
- **Memory and file stores:** the deletes still share one implementation per store. Both are already absent-tolerant (`Map.delete`, `rm` with `force: true`), so sharing changes nothing.
- **New criterion:** a new row in the existing Blob `describe('deleteBuild')` block asserts that `deleteBuild` still rejects with `BlobNotFoundError`.

## Non-blocking notes folded in

- **Export list:** the etag helper and the per-key helpers stay unexported. A criterion now requires that the export-list test in `build-store.acceptance.test.ts` passes with no name added by this ticket.
- **Etag input:** the etag-change criterion now uses a replace JSON that differs from the stored JSON. Scope states that byte-identical JSON gives the same etag.
- **Blob `ifMatch` on an absent key:** Out of scope now says a live check of this case goes to BACKLOG.
- **Re-spec 1 section:** appended. Changed criteria are tagged `(respec 1)`.
- **SGS-112 reference:** no SGS-112 branch exists yet, so the Scope line now says to read its local branch tip once it exists, else its ticket.

## Checks run

- `git grep ifMatch` on origin/main: the only non-test match under `lib` is `blob-build-store.ts`.
- `@vercel/blob` imports on origin/main: the only non-test importer is `blob-build-store.ts`.
- The search criteria hold before the change and after it.
- `ticket-lint.py`: no errors.

## Diagrams

The existing read/act/record compare-and-swap flowchart is unchanged.

## Open questions

None.

## Overlap

SGS-112 also edits `build-store.ts`, `blob-build-store.ts` and the export-list test (it adds `nextCounter`). The Depends-on is already correct.

## Manager action

Add a BACKLOG.md item: check once against a live Blob store what `put` with `allowOverwrite: true` and `ifMatch` does on an absent key. If it creates the blob, "absent gives conflict" breaks silently in production.
