# SGS-123 review 1

Verdict: **APPROVE**

- Branch: sgs-123-my-builds-library, tip 7d8485366b69c20f7a6c1eb06fb057bf7120c217. Base: origin/main 086951e (local `main` is stale; the diff against `origin/main...HEAD` is the 8 new files only, 522 lines added, nothing else touched).
- Review worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/review-sgs-123-my-builds-library

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `readMyBuilds` table | pass | my-builds-storage.test.ts:30-90. Sort row stores `Z`, `.500Z`, next-day in that order and expects `[3,2,1]`: a string compare gives `[3,1,2]` (`Z` > `.`), and no sort gives `[1,2,3]`, so both fail. Duplicate-later (both stored orders), duplicate-equal keeps first (revision tells them apart), stable equal-instant `[2,1,3]` (a reversed sort gives `[3,1,2]`). The drop row covers the 42-char secret, 21-char id, empty name, 101-char name, `revision: 0`, `yesterday`, `+00:00` offset and `null`, and keeps a 100-char-name edge. The reset table covers non-JSON, version 2, `{"version":1}` and `null`, and checks the key is removed. Absent key and throwing storage are covered. |
| 2 | `upsertMyBuild` tests | pass | :94-136. Insert and write, replace (one entry per id, new revision), cap: 50 stored plus a newest gives length 50, `builds[0]` is the new entry, and `id(1)` (the oldest) is gone. That fails both with no cap and when the newest is evicted. Throwing `setItem` gives `persisted: false` with the new list. Keys are exactly `builds`, `version`. |
| 3 | `myBuildsAvailable` tests | pass | :139-155. `null` gives false. A working fake gives true, keeps the stored value byte for byte and `keys()` is exactly `[MY_BUILDS_STORAGE_KEY]`, which fails for a leftover probe and for a probe on the real key. Throwing `setItem` gives false, and so does throwing `removeItem`. |
| 4 | `build-library.test.ts` | pass | `entryKey` samples, `LIBRARY_GROUPS` `toEqual`, builders asserted as whole objects with `toEqual` (key, id, loaded), `entryLabel` 4 kinds x edited in a table, and `isEdited` with all seven rows in a table. |
| 5 | `copyName` rows | pass | The 100-char row expects `x`*93 + ` (copy)`, so a 100-char slice or a dropped suffix fails. The strip row and the no-dedupe row are present. |
| 6 | `runName` rows | pass | All seven rows are present. In the "selected wins" row the earlier `First` has the same text and the expected value is `Second` (key `b`), so first-match-wins fails. In the null-loaded row an empty text gives `Unloaded (edited)`, so treating `loaded?.text ?? ''` as a match fails. |
| 7 | `build-query.test.ts` | pass | All `initialBuildQuery` rows, including the invalid `!` row. The `nextBuildQuery` rows use `toStrictEqual` for exact key sets, there is a no-mutation test, and an extra row checks that an undefined value is not written. |
| 8 | `use-discard-guard.test.ts` | pass | The stub starts with `returnValue: 'unset'` and the test checks one `preventDefault` call and `''`. `git grep -n beforeunload -- components` matches only use-discard-guard.ts:11-12. The effect cleanup removes the same `blockUnload` reference it added. The project-wide Vitest config sets no environment, so it is node. |
| 9 | No module-scope `window`/`localStorage`/`document`, no `build-input` import | pass | A grep of the four files finds `window` only inside the effect in use-discard-guard.ts and nothing else. No file imports `build-input`. |
| 10 | tsc, lint:dup, npm test, no existing test edited | pass | I ran `tsc --noEmit` (clean) and `lint:dup` (0 clones). I ran the 4 new test files plus pin-name.test.ts: 81 passed. The implementer reports full `npm test` at 2098 passed and 0 failed; I did not rerun the whole suite. `git diff origin/main HEAD` on pin-name.ts and pin-name.test.ts is empty. |
| 11 | No INVARIANTS regressions | pass | See below. |

## Invariants touched

- S1 (apps independent): holds. The new imports are `lib/aoe4-build-order/*`, sibling files in the same app, `zod`, `react` and `querystring`.
- A1 to A3: not touched. No engine, data or simulation path is changed.
- S3: `MY_BUILDS_MAX` caps the stored list at 50 in `upsertMyBuild` (my-builds-storage.ts:64). `readMyBuilds` does not cap a list that is already oversized, but the ticket does not require that and it is only per-browser storage.

## Contract check (design/M8.md C5, C6, C7, useDiscardGuard)

- C5: `MY_BUILDS_STORAGE_KEY`, `MY_BUILDS_MAX`, and `storedMyBuildsSchema` match the design table. Its element schema is a separate constant, and `name.max` uses `SAVED_NAME_MAX_CHARS` (100). `MyBuildEntry` is inferred from the schema. `readMyBuilds` validates the outer shape (`builds: z.array(z.unknown())`) and then each element. Dedupe replaces an entry only on a strictly greater `Date.parse`, so on a tie the earlier one stays. The sort is a stable `Array.prototype.sort` on `Date.parse`. Every path is wrapped, so nothing throws. `upsertMyBuild` filters by id, then sorts, slices and writes `{ version: 1, builds }`, and returns `persisted: false` from the catch. The probe key is separate (`aoe4-build-order.my-builds-probe`) and is removed after the check.
- C6: the types, `LIBRARY_GROUPS`, `entryKey`, both builders, `entryLabel`, `isEdited`, `copyName` (93 = `SAVED_NAME_MAX_CHARS - ' (copy)'.length`) and `runName` (selected first, then the first match, then `<name> (edited)` or `Custom build`) all match C6. The branch adds no `linkEntry`, `namedEntry` or `savedMineEntry`, and it leaves `PrebuiltBuild` and `pin-name.ts` alone.
- C7: the keys and union type match. `firstValue` returns `undefined` for `''` and for `[]`. `nextBuildQuery` skips `n`, `b` and undefined values, writes nothing for a null id, and returns a fresh object.
- Key surfaces / Out of scope: no route or OpenAPI change, and nothing from the ticket's Out of scope list (page wiring, the other builders, `storage` events, `browserStorage`, docs) is implemented. No invented constants: the probe key name is an internal detail the ticket leaves open ("its own key").

## Lint

- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones (138 files).
- `npx next build`: passed (REPO.md review checklist, Every diff).
- LSP not used. The diff adds only new symbols and has no callers yet (wiring is out of scope).

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there was no bot run.

## UI inspection

Not run. The diff changes no rendered UI: four logic modules and one hook, none imported by a page or component yet.

## Conventions

- my-builds-storage.ts follows pin-storage.ts:17-27: the same nested try with an empty `catch {}`, then `removeItem` on a bad shape and the default return.
- The tests follow pin-storage.test.ts:4-17 (`fakeStorage`, `throwing`, `throwingStorage`) and use `it.each` tables in the house style.
- No logging and no comments, which matches the siblings.

## Non-blocking notes

1. my-builds-storage.test.ts:4-17 copies `fakeStorage`, `throwing` and `throwingStorage` from pin-storage.test.ts:4-17. ARCHITECTURE.md:47-48 says shared test helpers live in `lib/aoe4-build-order/test-helpers.ts`. The ticket asked for the fake "as in pin-storage.test.ts" and for existing tests to stay unedited, and jscpd finds no clone, so this does not block. BACKLOG candidate: move one `fakeStorage(key, initial)` and `throwingStorage` into test-helpers.ts and use it in both files.
2. use-discard-guard.ts:10 uses `if (!edited) return undefined`, while the nearest effect, use-auto-run.ts:39, uses a bare `return`. This is cosmetic.
3. build-library.ts:62 names the `copyName` parameter `name`, while design C6 names it `base`. The type and behaviour are the same.
4. my-builds-storage.test.ts:35-58: four separate `it` blocks (sort, duplicate-later, duplicate-equal, stable ties) could be one table of stored list and expected ids. Their assertion shapes differ (ids versus whole entries), so they are not the "differ only in input and expected" pattern.
5. build-query.ts:27 copies an array value by reference into the new query, which the ticket allows ("value unchanged"). A caller that mutated the result's array would also mutate the input. No caller exists yet.

## Coverage

- Reviewed in full: build-library.ts, build-query.ts, my-builds-storage.ts, use-discard-guard.ts and their four test files.
- Read for comparison: pin-storage.ts, pin-storage.test.ts, use-auto-run.ts, named-builds.ts (patterns), ARCHITECTURE.md, vitest.config.mts, design/M8.md C5 to C7, CONTEXT.md, INVARIANTS.md, spec-checklist.md, REPO.md review checklist (Every diff, AoE4 build order).
- Not run: the full `npm test` (I ran the affected files only; the implementer records the full run), and loading the page with `npm run dev` (no page or component imports the new modules).
- Project LESSONS.md is empty. The repo LESSONS (Playwright rects, CSS-module proxies) do not apply: this diff has no Playwright and no CSS-module assertions.
- Review checklist sections: Every diff and AoE4 build order were applied. There is no layout or chart change, and no helper, constant or tolerance is copied from `lib/aoe4-build-order/`: the patterns and `SAVED_NAME_MAX_CHARS` are imported.
