# SGS-131 implementer report 1

- Ticket: SGS-131. Branch: sgs-131-my-builds-no-wipe-and-backup. Tip: 3de2380fd5f0b0d55a83de7b9fa759aaec9cb1c3
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-131-my-builds-no-wipe-and-backup (base origin/main 5564bd0, which contains SGS-128)

## Files
- components/apps/aoe4-build-order/my-builds-storage.ts: `MY_BUILDS_BACKUP_KEY`; shared `readStored` (intactness once); `readMyBuilds` no longer removes/writes; `upsertMyBuild` backs up raw value first (only if backup key absent), skips list write if backup throws; getItem throw gives no backup, list written.
- components/apps/aoe4-build-order/my-builds-storage.test.ts: new cases; wraps shared `fakeStorage` (`recorded` helper), no local Storage fake.
- docs/aoe4-build-order.md: My builds paragraph gains the kept/backed-up statement.

## Tests
my-builds-storage.test.ts 32 pass. Full `npm test`: 74 files, 2372 passed, 13 skipped. Invariants: read never writes/removes any key; whole-value-unreadable gives [] and value byte-identical; backup equals original and precedes the list write; existing backup kept; failed backup leaves the original and writes no list; missing/intact touch no backup key; getItem throw gives list written, persisted true, no backup access.

## Pre-existing tests edited
- my-builds-storage.test.ts: `it.each` "returns [] and removes the key for %s" became "returns [] and leaves the value untouched for %s" (asserts the stored string unchanged, no set/remove calls), per the ticket's rule for removal tests. No other existing assertion changed.

## Doc claims
- docs/aoe4-build-order.md: "A stored list the page cannot read, or one with an unreadable entry, is never deleted by reading it." (`readMyBuilds` makes no writes; test 'leaves the value untouched'). "Before the next save replaces it, the page copies the stored text to `aoe4-build-order.my-builds.backup` unless that key already holds a copy; if the copy cannot be written, the save does not replace the list." (`upsertMyBuild`, `backUpUnreadable`). Exception: a throwing `getItem` skips the backup and the save proceeds; doc sentence says "before the next save replaces it" and does not cover that case (getItem failing means the value was not read at all).
- No code comments added; no existing comment claimed the value was discarded.

## Pinned outputs
None.

## Mutation checks (my-builds-storage.ts, each undone; file restored from copy, diff confirmed)
- readMyBuilds calls removeItem: failed "leaves the value untouched" rows (expected null to be raw).
- backup guard `=== null` made always true: failed "keeps an existing backup" (expected '{nope' to be 'first').
- backup failure ignored: failed "writes no list ... backup write throws".
- `intact` forced true: failed "backs up an invalid element verbatim".
- backup attempted over intact value: failed "touches no backup key over a intact value".
- getItem-throw path returning persisted false early: failed "writes the list without touching the backup key when getItem throws".

## Stages
- codegen: none set. Build (`next build`): passes. Lint (`tsc --noEmit` + `lint:dup`, both configs): 0 errors, 0 clones. Unit: pass.
- Not covered by a mutation check: the "reports persisted false when getItem and the list write both throw" row is a regression guard of unchanged list-write behavior.

## Invariants
No INVARIANTS.md rule touched (A1-A3 are engine rules; S1 not affected).

## Unverified assumptions added
None.

## Out-of-scope findings
None.

## Status
needs_review
