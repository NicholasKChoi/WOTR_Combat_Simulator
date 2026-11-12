# SGS-131: Never wipe my-builds on a parse failure; back up the unreadable value before overwriting it

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.10 (my-builds half)
- **Priority**: high
- **Risk**: standard
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: ~50 (`my-builds-storage.ts`: `readMyBuilds` and `upsertMyBuild`, one new constant; business logic only)
- **Depends on**: SGS-128
- **On merge**: none
- **Source**: `design/M9.md` C11, "My builds (M9.10)" behavior rules and criterion M9.10; `plans/M9-20261111.md` outline D

## Context

The my-builds list in localStorage holds the edit secret of every build this browser saved; without a secret a build can no longer be updated. `readMyBuilds` in `components/apps/aoe4-build-order/my-builds-storage.ts` calls `storage.removeItem(MY_BUILDS_STORAGE_KEY)` when the whole value fails to parse or has the wrong shape, so one unreadable value (a bad write, a future-version value, a manual edit) deletes every secret on the next page read. Separately, `upsertMyBuild` rebuilds the list from only the valid elements, so an element that failed validation is lost on the next save. The existing tests in `my-builds-storage.test.ts` pin the read and upsert happy paths and the throwing-storage case but nothing asserts that an unreadable value survives, which is why the removal was not caught. Same-pattern check: `removeItem` in this module is called only from `readMyBuilds` and from the availability probe on its own probe key; `readMyBuilds` callers (`pages/apps/aoe4-build-order.tsx`, `build-library.ts` consumers) only read, so none depends on the removal.

## Scope

- `my-builds-storage.ts`:
  - Export `MY_BUILDS_BACKUP_KEY` (design C11: `aoe4-build-order.my-builds.backup`).
  - `readMyBuilds` never removes or writes any key. A missing key gives `[]`; a whole value that is unparseable or has the wrong shape gives `[]`; a value with some invalid elements gives the valid ones, deduped and newest first, as today.
  - A stored value is "intact" when it parses, matches the stored shape, and every element passes the entry schema (design C11). Express intactness once, for example a helper shared by `readMyBuilds` and `upsertMyBuild`, rather than parsing twice with different rules.
  - `upsertMyBuild` (signature unchanged): when the stored value is present and not intact, first write the raw string verbatim to `MY_BUILDS_BACKUP_KEY` only if that key is absent (the first unreadable value wins), then write the list. When the backup write throws, do not write the list: return `{ builds, persisted: false }` and leave the original value in place. A missing or intact stored value writes the list as before, and touches no backup key.
  - A throwing `getItem` while reading the stored value keeps today's behavior for the read (`[]`, no throw). In `upsertMyBuild`, a throwing `getItem` is not "not intact": no backup is attempted (no read or write of `MY_BUILDS_BACKUP_KEY`), the list is written as before, and `persisted` follows the list write (`true` when it succeeds, `false` when it throws).
- `my-builds-storage.test.ts`: the cases in Acceptance criteria, using `fakeStorage` and `throwingStorage` from `storage-test-helpers.ts` (SGS-128; the shared `fakeStorage` takes seed entries keyed by storage key, so seed `MY_BUILDS_STORAGE_KEY` that way). A storage that records write order, or throws only on the backup key or only on `getItem`, wraps the shared `fakeStorage` rather than defining a new `Storage` fake (the jscpd test gate flags a second copy). Rule for existing tests: a test that asserts `readMyBuilds` removes the stored value is changed so the same rows assert the stored string is unchanged after the read; every other existing test keeps its assertions. The implementer lists every test it edits.
- Docs: `docs/aoe4-build-order.md`, the My builds paragraph in the save section (the one that says the page keeps the secret only in this browser's list and names `my-builds-unavailable`), has no statement about an unreadable stored list and gains one covering that it is kept, not deleted, and that a copy is kept under the backup key before the next save replaces it. `design/M8.md` is a factory file and is not edited here. Check the code comments at the seam for any line saying the value is discarded.

**Out of scope:** a UI to restore from the backup (design lists it as a later possibility); the Blob seam (separate ticket); changing `myBuildsAvailable`, the entry schema, `MY_BUILDS_MAX` or the page and save-panel call sites; backing up when only the 50-entry cap drops entries.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `readMyBuilds` never calls `removeItem` or `setItem`: a test over a whole-value-unparseable string, a wrong-shape value (such as a different `version`) and a value with one invalid element asserts the storage contents are byte-identical after the read, and a test fails if `removeItem` is called on the key; no existing test still asserts the key is removed after a read (respec 1)
- [ ] A whole-value-unreadable string reads as `[]`, a missing key reads as `[]`, and a value with some invalid elements still returns only the valid ones deduped and newest first
- [ ] `upsertMyBuild` over an unreadable value with no backup key writes the raw original string under `MY_BUILDS_BACKUP_KEY` before writing the list, and the stored list then contains the new entry (the test checks the backup equals the original string exactly and that the backup write precedes the list write)
- [ ] `upsertMyBuild` over a value with some invalid elements (parses, right shape, one element fails) also writes the backup, so the dropped element is recoverable
- [ ] When the backup key already holds a value, a later upsert over a different unreadable value leaves the existing backup unchanged and still writes the list (a test fails if the backup is overwritten)
- [ ] When writing the backup throws, `upsertMyBuild` returns `persisted: false`, writes no list, and the original value is still stored; the returned `builds` still includes the new entry (a test fails if the list is written after a failed backup)
- [ ] `upsertMyBuild` over a missing or intact value writes no backup key (a test fails if `MY_BUILDS_BACKUP_KEY` is set), and behaves as before for insert, replace by id, cap and eviction, and `persisted: false` when the list write throws
- [ ] With a storage whose `getItem` throws and whose `setItem` works, `upsertMyBuild` writes no `MY_BUILDS_BACKUP_KEY`, writes the list, and returns `persisted: true` with the new entry in `builds`; a test fails if a backup is written or the list write is skipped (respec 1)
- [ ] `myBuildsAvailable` behavior is unchanged and leaves neither the probe key nor the backup key behind
- [ ] `docs/aoe4-build-order.md` states that an unreadable my-builds value is kept and backed up, and no code comment in `my-builds-storage.ts` claims otherwise
- [ ] `npm test` and `npx tsc --noEmit` pass, and `npm run lint:dup` passes at both configs SGS-128 adds (no local `Storage` fake in `my-builds-storage.test.ts`)
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-11

- Underspecified: Scope said every existing test keeps its assertions although the `readMyBuilds` removal test asserts the behavior this ticket removes; the throwing-`getItem` upsert outcome was left to the implementer.
- Changed: Scope states a rule for existing tests (removal assertions become unchanged-value assertions) and commits to no backup, list written, `persisted` following the list write when `getItem` throws; test fakes wrap the shared `fakeStorage`; two criteria tagged `(respec 1)`, one of them new.
- No branch work exists yet; nothing to keep or discard.
