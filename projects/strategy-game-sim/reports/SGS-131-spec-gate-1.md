# SGS-131 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main (fetched). SGS-128 is not integrated, so its contract was read from its ticket file.

## Gaps

1. Scope (my-builds-storage.test.ts) and Acceptance criteria - contradiction with an existing test.
   - Scope says "Existing tests keep their assertions". The existing `it.each` 'returns [] and removes the key for %s' (non-JSON, version 2, missing builds, null) asserts `storage.getItem(MY_BUILDS_STORAGE_KEY)` is `null` after the read. The required change makes that assertion false.
   - An implementer must either break the instruction or guess what to do with the test.
   - Fix: Scope states the rule: "tests that assert `readMyBuilds` removes the stored value are changed to assert the value is untouched (the same rows now check the stored string is unchanged); every other existing test keeps its assertions". Do not name the test.
   - Related: `upsertMyBuild` tests that read back after a garbage seed need the same rule. None exist today.

2. Scope, throwing-getItem bullet - unspecified and untested.
   - "Decide the upsert outcome from the design table" leaves the decision to the implementer. The design table is silent, so this is not derivable.
   - The ticket's own conclusion (an unread value is not backed up) means that when `getItem` throws but `setItem` works, upsert overwrites a value it never read. That is the same data-loss class this ticket fixes.
   - Fix: state the rule outright, for example "`getItem` throws: no backup is attempted and the list is written as before; `persisted` follows the list write". Add a criterion with a storage whose `getItem` throws and `setItem` works, asserting no backup key and the list written.
   - If the owner prefers refusing the write (`persisted: false`) when the read throws, that is a behavior choice only the owner can make. Mark as `owner` only if the ticket author does not want to commit to the stated rule.

## Checks that passed

- Grounding: `readMyBuilds`, `upsertMyBuild` and `removeItem` in `readMyBuilds` exist as described. `removeItem` is used only there and in the probe. `pin-storage.ts` also calls `removeItem`, but it is out of scope. `pages/apps/aoe4-build-order.tsx` only calls `readMyBuilds` and the storage-event handler (line 216), so no caller depends on the removal.
- Contracts: `MY_BUILDS_BACKUP_KEY` and the intact definition match design C11 and the behavior table. The `fakeStorage` and `throwingStorage` names match SGS-128 and C12.
- Docs: the My builds paragraph (docs/aoe4-build-order.md, around line 1080) has no statement about an unreadable list, as the ticket says. No other doc or comment mentions discarding. SGS-141 lists SGS-131's doc row, so there is no conflict.
- Risk standard is acceptable. No `criticalPaths` entry applies, and `strongModelTriggers` is not defined in REPO.md.
- Invariants none, On merge none, Unverified assumptions none (localStorage fakes only; reasonable), Open questions none, size about 50 LOC.
- No overlap with another open ticket: SGS-132 and SGS-141 only mention my-builds in passing, and SGS-130 touches the Blob seam.

## Notes

- Criteria 40 to 43 need a storage that records write order and throws only on the backup key. Say it wraps the shared `fakeStorage` rather than defining a new fake, because the new jscpd test gate (5 lines) would flag a second Storage copy. The existing inline `{ getItem, setItem: throwing, ... }` objects in the `upsertMyBuild` and `myBuildsAvailable` tests are small, but SGS-128 may fold them.
- Criterion 45 is already true today for the probe key. It is a regression guard only; fine.
