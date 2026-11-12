# SGS-131 review 1

- Branch: sgs-131-my-builds-no-wipe-and-backup, tip 3de2380fd5f0b0d55a83de7b9fa759aaec9cb1c3
- Base: origin/main 5564bd0. Local `main` (cdc51b1) is stale, so `git diff main...HEAD` shows 52 files. The real diff against origin/main is 3 files: `my-builds-storage.ts`, `my-builds-storage.test.ts`, `docs/aoe4-build-order.md`.
- Mode: full review.

## Verdict: APPROVE

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `readMyBuilds` never calls `removeItem` or `setItem` (respec 1) | pass | `my-builds-storage.ts:66-73` reads only, through `readStored`. Test `my-builds-storage.test.ts:88-94` covers non-JSON, version 2, missing builds and `null`, and asserts the stored string is unchanged, `keys()` is unchanged, and no set or remove calls were made (`writesOf` counts `remove:`). It fails against the old code (`getItem` returns null). `:96-101` covers the case with one invalid element. No remaining test asserts that the key is removed. |
| 2 | Unreadable gives `[]`, missing gives `[]`, partial gives valid entries deduped and newest first | pass | `:88-94`, `:103-106`, `:96-101`. The existing tests at `:46-86` still cover dedupe and ordering. |
| 3 | Upsert over an unreadable value writes the raw backup first, then the list | pass | `my-builds-storage.ts:91` runs before `:93`. Test `:150-158` asserts the backup equals `raw` with `toBe`, asserts the write order `[set:backup, set:list]`, and reads the list back equal to `result.builds`, which contains the new entry. |
| 4 | Invalid element also backs up | pass | `readStored` sets `intact` to `valid.length === elements.length` (`:63`). The row "an invalid element" is in the table at `:150`. |
| 5 | Existing backup kept, list still written | pass | Guard at `:77`. Test `:160-166`: the backup stays `'first'`, and `readMyBuilds` equal to `[entry5]` proves the list was written. Reading `'{nope'` would give `[]`. |
| 6 | Backup throws: `persisted: false`, no list write, original kept, `builds` includes the new entry | pass | `:91` returns before the list write. Test `:168-176` checks `toEqual({ builds: [added], persisted: false })`, that the original is still `'{nope'`, and that no `set:list` was recorded. The list write would be recorded through the wrapped setter. |
| 7 | Missing or intact value: no backup key; insert, replace, cap and setItem-throws behave as before | pass | Test `:178-186` checks that no call ends with the backup key and that `keys()` is only the list key. The existing tests `:110-148` are unchanged. |
| 8 | `getItem` throws: no backup, list written, `persisted: true` (respec 1) | pass | `:85-88` catches, so `stored` is null and `:91` is skipped. Test `:188-193` asserts that the only call was `set:list` and checks the result. A mutation that attempts the backup when `stored` is null would make `getItem(backup)` throw, giving `persisted: false`, so the test fails. |
| 9 | `myBuildsAvailable` unchanged; leaves neither the probe key nor the backup key | pass | The function is unchanged (`:100-109`). The existing test `:207-213` asserts `keys()` equals `[MY_BUILDS_STORAGE_KEY]`, which also excludes the backup key. |
| 10 | Docs state that the value is kept and backed up; no comment says otherwise | pass | `docs/aoe4-build-order.md:1085-1088`. The module has no comments. See note 1 on wording. |
| 11 | `npm test`, `tsc`, `lint:dup` at both configs; no local Storage fake | pass | I ran `tsc --noEmit` (clean), `lint:dup` (0 clones at both configs) and the file's Vitest run (32 passed). The implementer reports the full `npm test` passing (2372 passed). The test uses `recorded`, which wraps the shared `fakeStorage` and defines no `Storage` object of its own. |
| 12 | No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- The diff matches the A1-A3 paths (`components/apps/aoe4-build-order/**`) but changes no simulation code. A1-A3 hold.
- S1: the module imports only from `lib/aoe4-build-order` (the same app). Holds.
- S3: no new numeric input. Not affected.

## Contract checks

- Design C11: `MY_BUILDS_BACKUP_KEY = 'aoe4-build-order.my-builds.backup'` matches exactly. Both signatures are unchanged. Intactness is defined once, in `readStored`, and both callers use it, as the ticket requires.
- Design "My builds (M9.10)" table: I traced each row against the code and each matches. The design does not cover a `getItem` on the backup key that throws. The code treats it as a failed backup (no list write, `persisted: false`), which is the conservative choice that keeps the original value.
- Out of scope: no restore UI, no Blob change, schema and `MY_BUILDS_MAX` unchanged, call sites unchanged, no backup when only the cap drops entries. Duplicate ids in an otherwise valid value count as intact, matching the C11 definition.
- spec-checklist: Contracts, Scope, Naming and A1-A3 are clean.

## Lint

`npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones (`.jscpd.json` and `.jscpd.tests.json`). `npx next build`: passes.

## Bot reconciliation

`reviewBot.cli` is empty and there is no rulesFile, so this section was skipped.

## UI inspection

Did not run. The diff changes no UI: one storage module, its test and a doc paragraph. The call sites in `save-build.tsx:51` and `pages/apps/aoe4-build-order.tsx:103,203,217` are unchanged and only read `persisted` and the returned list.

## Non-blocking notes

1. `docs/aoe4-build-order.md:1085`: "A stored list the page cannot read" could be read as covering a storage whose `getItem` throws. In that case the next save replaces the list without a copy, as the ticket requires. Real browsers do not throw on `getItem` while allowing `setItem`, so I do not count this as a contradiction. Optional, tighter wording: "A stored list that is not in the expected format, or one with an invalid entry, is never deleted by reading it."
2. `my-builds-storage.ts:51-58`: `let elements` is assigned inside the `try`, and the not-intact result is returned from two places. A `try` that returns the parsed shape or `null` would read more simply. This is style only.
3. `my-builds-storage.ts:89` repeats `newestFirst(dedupeById(...))` from `:69`. It is small and fine.
4. Out-of-scope follow-up: `pin-storage.ts:24` (`readStoredPin`) still calls `removeItem` on an unparseable pinned run, the same pattern this ticket removes. The stakes are lower because a pinned run holds no secret. It is a candidate for BACKLOG.md if the owner wants the two consistent.

## Coverage

- Reviewed in full: `components/apps/aoe4-build-order/my-builds-storage.ts`, `my-builds-storage.test.ts`, `storage-test-helpers.ts`, `docs/aoe4-build-order.md` (save section).
- Compared against the sibling `pin-storage.ts:16-38` for read and catch style. The empty-`catch {}` style matches.
- Callers checked by grep: `save-build.tsx:51`, `pages/apps/aoe4-build-order.tsx:103,203,217`, and `acceptance/aoe4-my-builds.spec.ts`. No acceptance test asserts the removal.
- REPO.md has no `exemplars` entry. The REPO.md "AoE4 build order" checklist was applied; its UI items do not apply because the diff has no UI. "Every diff": `next build` ran. I loaded no page because no UI changed.
- Not run: acceptance tests (by rule), and the full `npm test` (I ran only the changed test file; the implementer reports the full run).
