# SGS-131 acceptance-test report 1

Verdict: PASS. Commit bbda9ed464df646fb1228ba854e3d14fbb4b11c4 on sgs-131-my-builds-no-wipe-and-backup (on top of tip 3de2380). Harness ran: Playwright/Chromium, `acceptanceSetup` run.

New file: `acceptance/aoe4-my-builds-unreadable.spec.ts` (12 tests, all pass). It seeds localStorage before load and records every `setItem`/`removeItem`/`getItem` call with an init script, then drives the real page (open, Save as copy against the real named-builds API).

## Tests
1. Read of non-JSON / other-version / one-invalid-element values (3 rows): value byte-identical after load, no write or remove of either key, no backup key, My builds lists only valid builds (criteria 1, 2).
2. Missing value + availability probe: no key left behind (probe/backup) (criterion 9).
3. Save over each of the 3 unreadable values: backup equals original verbatim, list holds the new entry plus the valid old ones, backup set precedes list set, no unstored warning (criteria 3, 4).
4. Existing backup is kept when a later unreadable value is replaced; list still written (criterion 5).
5. Backup write throws: original value stays, no list write, page shows the unstored warning (criterion 6; the `builds` return value is not observable through the page).
6. Missing or intact value (2 rows): list written, no backup key written (criterion 7, insert/replace happy path only).
7. `getItem` throws on the list and backup keys: no read or write of the backup key, list written, no unstored warning (criterion 8).

## Results
- New spec: 12/12 pass. Existing `aoe4-my-builds.spec.ts`: 73/73 pass (85 total run together). `npx tsc --noEmit` and `npm run lint:dup` clean (0 clones).

## Mutation checks (all in `components/apps/aoe4-build-order/my-builds-storage.ts`, each undone with `git checkout -- components`, `git diff --exit-code` clean)
- readMyBuilds removes the key when not intact (in `readMyBuilds`): read tests fail at "stored value toBe(raw)", got null.
- Remove the backup call/condition in `upsertMyBuild`: save tests fail at backup `toBe(row.raw)`; backup-failure test fails at original-value assertion.
- Backup written unconditionally (drop the absent check in `backUpUnreadable`): "existing backup kept" fails at `toBe(firstBackup)`.
- `backUpUnreadable` catch returns true: backup-failure test fails at original-value `toBe(ONE_INVALID_ELEMENT)`.
- Backup for any stored value (drop `!stored.intact`): intact-value test fails at backup `toBeNull`.
- `getItem` throw in `upsertMyBuild` treated as unreadable: throwing-read test fails (after a hardening edit, at `not.toBe(NOT_JSON)`; before it, at the later list parse).
- List written before backup: ordering assertion (`[set backup, set list]`) fails in the 3 save rows plus the backup-failure test.
- `myBuildsAvailable` skips `removeItem(PROBE_KEY)`: probe test fails at `storedKeys` `toEqual([])`.

## Not expressible in this harness
- `upsertMyBuild`'s returned `builds`/`persisted` values, cap and eviction at 50, replace by id, and `persisted:false` on list-write throw: not observable through the page except the unstored warning; the implementer's unit tests cover them. The "no removeItem call on the key" check is covered by the recorded call log.
- Docs criterion (`docs/aoe4-build-order.md`, code comments) is a review check, not a test.
- `npm test` not run (out of scope).

## Failures
None. No impl-defects or spec-gaps found.
