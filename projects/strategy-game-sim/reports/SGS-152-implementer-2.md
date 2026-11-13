# SGS-152 implementer 2 (rebase rework)

- Ticket SGS-152, branch sgs-152-docs-pinned-color-blob-importers, new tip 985fd77d90936d145496a28e8f295b061c7ef04c (was 5f8a404), onto origin/main. Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-152-docs-pinned-color-blob-importers
- Pushed with `git push --force-with-lease`. PR base, draft state and body untouched.

## Conflict resolution
- ARCHITECTURE.md, "AoE4 saved-build storage" row: took SGS-142's merged row (its `replaceNamed` sentence now says `conflict` for a precondition or not-found error, and for any other put error when `head` reports the key absent, otherwise rethrow). Re-applied only this ticket's edit: "the only file that imports `@vercel/blob`" became "the only non-test source file that imports `@vercel/blob` (its tests and the live and acceptance harnesses import it too)".
- docs/aoe4-build-order.md merged without conflict; final diff vs origin/main is the pinned-color paragraph only.

## Row verified against code at origin/main
- Importers of `@vercel/blob`: blob-build-store.ts (the only non-test source), plus blob-build-store.test.ts, blob-build-store.live.test.ts, blob-lost-writes.acceptance.test.ts and named-build-store.acceptance.test.ts. The sentence holds.
- `replaceNamed` in blob-build-store.ts: landed check gives `replaced`; `BlobPreconditionFailedError`/`BlobNotFoundError` give `conflict`; `headNotFound` gives `conflict`; else rethrow. Matches SGS-142's wording.

## Checks
- `npx tsc --noEmit`: clean. `npm run lint:dup`: ran, no clones reported. No tests or build run (docs only, per the rework instruction to run lint/typecheck).
- Diff vs origin/main: ARCHITECTURE.md (1 line), docs/aoe4-build-order.md. Nothing else.

## Other
- Unverified assumptions added: none. Out-of-scope findings: none.
- Status: needs_review
