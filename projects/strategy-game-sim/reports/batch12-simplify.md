# Batch 10 simplify report

All three branches are rebased into one linear stack on origin/main 156bf30. Nothing pushed.

## New tips
- sgs-120-named-routes: c09b34db8175d3605bd3221c86931bd9ea5181db (on 156bf30; 3 replayed commits plus 1 trim)
- sgs-121-named-build-routes: 6ca957bda99a4d776e46b6a2c4876de1c3c2c720 (replayed 0ff9f81 and 172b7ce on the 120 tip)
- sgs-124-page-library: bbf6c561f71c2c55e310e85f404cd69f4f6aa512 (replayed d27707d, df9912a, 9733cdc on the 121 tip, plus 1 trim)

## Conflicts
None in any of the three rebases. No stale .git/config.lock was hit.

## Trims
- SGS-120 (build-store.ts): the file store's async `read` and sync `readNow` duplicated the same ENOENT-tolerant read. Now one `readNow` helper and `read: async (key) => readNow(key)`, as the memory store does; dropped the unused `readFile` import.
- SGS-121: no trims (diff reviewed; reuse of refusedSaveSlot/disallowedMethod already in place).
- SGS-124 (build-library.ts, pin-name.ts): `runName` and `savedBuildName` both re-derived the same "selected entry, else any entry with the same text" lookup. Extracted `entryWithText` in build-library.ts and used it in both.

The review was done inline by the single agent rather than by four parallel subagents.

## Verification
- Unit tests (vitest only, no browser/acceptance): 120 branch `lib/aoe4-build-order` 42 files, 1517 passed; 121 branch full suite 2340 passed; 124 branch full suite 2345 passed (13 skipped each, pre-existing).
- At the top (124): `npx tsc --noEmit` clean. The repo has no `npm run lint` script; its lint is tsc plus `npm run lint:dup` (jscpd), which found 0 clones.

Note: batch10-simplify.md already existed and was overwritten by mistake before this report; this report is also saved as batch10-simplify-2.md.
