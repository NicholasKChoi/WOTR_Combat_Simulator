# SGS-147 implementer 1

Status: needs_review
Branch: sgs-147-browser-storage-edge-cases, tip ba02b5537e4da178c43665a2a889c8322e50e531
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-147-browser-storage-edge-cases
(`git worktree add -b` created only the branch; added the worktree with a second `git worktree add`.)

## Files
- components/apps/aoe4-build-order/pin-storage.ts: `readStoredPin` no longer calls `removeItem`.
- components/apps/aoe4-build-order/build-library.ts: new `withCreatedEntry(list, entry, selectedKey)`; imports `MY_BUILDS_MAX`.
- pages/apps/aoe4-build-order.tsx: `reread` also fires for a null key; `recordCreated` uses only `withCreatedEntry`, passing `selectedRef.current` read before `setSelected`.
- components/apps/aoe4-build-order/pin-storage.test.ts: unreadable rows keep the raw value; overwrite-on-next-write test.
- components/apps/aoe4-build-order/build-library.test.ts: `withCreatedEntry` tests.
- acceptance/aoe4-build-order-pin-compare.spec.ts: unreadable rows left in storage; Pin then overwrites.
- acceptance/aoe4-my-builds.spec.ts: two-tab case (unrelated key, then `localStorage.clear()`).
- docs/aoe4-build-order.md: pinned-run and Named builds sentences.

## Tests
- `npm test`: 81 files passed, 1 skipped; 2511 passed, 15 skipped.
- Acceptance run once for the touched specs (`-g 'stored pin|unrelated key|localStorage method'`): 13 passed. Not the full acceptance suite.
- Invariants encoded: unreadable pin is never removed by a read and is replaced by the next write; created entry goes first among `mine` and never ahead of earlier non-`mine` entries; same key replaced; exactly 50 `mine` after create at cap; oldest (last in list order) dropped; selected entry kept even when oldest; null-key storage event clears this tab's My builds, an unrelated key does not.

## Pre-existing tests edited
- `pin-storage.test.ts`: `drops %s and removes the key` renamed `reads %s as no pin and leaves the stored value`, asserts raw value remains (ticket Tests scope).
- `aoe4-build-order-pin-compare.spec.ts`: loop `a stored pin with ${name} is dropped` now asserts the raw value stays, no request, and a later Pin overwrites it. Loop at ~793 split: `a numeric name` and `a null duration` rows moved to a new loop asserting the raw value stays; `text over the length cap` and `duration the route rejects` rows keep the null-storage assertion (the `requests` column is kept for those).

## Doc claims
- docs/aoe4-build-order.md pinned run: "A stored value that is not valid is ignored and left in `localStorage` (the next Pin overwrites it); a text that no longer converts, or a response that is not ok (400 or 5xx) from the re-run, drops it" - `readStoredPin`; `clearStoredPin` calls unchanged in the page.
- Named builds: "A save in another tab, or another tab clearing the storage, updates this tab's My builds. After a save here, this tab's list also holds at most 50 My builds: the new build goes first among them and the oldest in list order is dropped, never the selected one." - `reread` null-key branch; `withCreatedEntry`.
- No other README/doc/comment statement about pin removal found (grep of README, docs, code).

## Pinned outputs
None.

## Mutation checks (all undone; final tree is the committed one)
- build-library.ts `const at = 0` (prepend to whole list): 4 tests failed, e.g. placement test `toEqual(['T1', link, 'Created', ...])`.
- No dedupe (`others = [...list]`): `replaces an entry with the same key` failed.
- Selected not protected (dropped `|| key === selectedKey`): `keeps the selected entry when it is the oldest` failed (`to include 'Mine 49'`).
- No trimming (`excess > 1000`): both cap tests failed on length 50 vs 51.
- Entry-droppable guard (`key === entry.key`): the mutation passed, because the new entry is always the first `mine` and the cap loop starts from the end, so it is unreachable. Removed the guard from the code.
- pin-storage.ts re-added `removeItem`: all 10 `leaves the stored value` rows failed.
- pages listener reverted to the base condition: two-tab acceptance case failed at `toHaveCount(0)`, received 2. This also shows it fails at the base.
- The `replaces an unreadable value on the next write` unit test is a criterion check; it would also pass with `removeItem` re-added, so it is not mutation-sensitive to that line.

## Codegen / build / lint
- codegen: not set. build (`next build`) passed. lint (`tsc --noEmit` and `lint:dup`): zero issues, 0 clones.

## Invariants
None listed on the ticket; no storage/pin invariant touched. Reads still never throw (existing throwing-storage test passes).

## Unverified assumptions added
None. The null-key `storage` event is exercised in real Chromium by the two-tab case.

## Out-of-scope findings
- `reread` does not check `myBuildsAvailable(storage)` (unchanged from base).
- `recordCreated` still passes `selectedRef.current` read before `setSelected`, as the spec-gate note asked.
