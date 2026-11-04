# SGS-091 simplify pass 1
- Rebase onto origin/main: clean, 3 commits replayed, no conflicts.
- Cleanups: no change (diff already reuses RESOURCE_KINDS, VILLAGER_ID, shortText).
- tsc --noEmit: pass. lint:dup: see exit below. npm test: 46 files, 1424 passed, 10 skipped.
- Branch tip: aa22ab1f312b4d2cc30dc420475237e8ea4ab370 (not pushed)
