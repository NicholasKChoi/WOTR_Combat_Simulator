# SGS-123 implementer report 1

Status: needs_review

- Ticket: SGS-123. Branch: sgs-123-my-builds-library. Tip: 7d8485366b69c20f7a6c1eb06fb057bf7120c217 (base origin/main 086951e, includes SGS-119).
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-123-my-builds-library

## Files (all under components/apps/aoe4-build-order/, all new)
- my-builds-storage.ts: C5 contract (zod element schema, storedMyBuildsSchema, MyBuildEntry, readMyBuilds, upsertMyBuild, myBuildsAvailable).
- build-library.ts: C6 types, LIBRARY_GROUPS, entryKey, templateEntries, mineEntries, entryLabel, isEdited, copyName, runName.
- build-query.ts: C7 keys, initialBuildQuery, nextBuildQuery.
- use-discard-guard.ts: blockUnload and useDiscardGuard.
- Tests: my-builds-storage.test.ts, build-library.test.ts, build-query.test.ts, use-discard-guard.test.ts.

## Tests
- Full `npm test`: 68 files, 2098 passed, 13 skipped, 0 failed (pre-existing skips). The four new files add 65 tests.
- Invariants encoded: instant-order sort (`.500Z` vs `Z`), duplicate-id and equal-timestamp rules, stable ties, per-element drop (including offset datetime), reset on bad shape, cap evicts oldest, persisted flag, probe key leaves no trace, template duration not an edit, runName prefers the selected match, copyName 100-char bound, `n`/`b` handling that keeps other keys, no mutation, blockUnload effect.
- No existing test edited; pin-name.test.ts unchanged and passing.

## Doc claims
None added; no docs touched. No comments added in code.

## Pinned outputs
None.

## Mutation checks (each undone, tree clean after)
- my-builds-storage.ts newestFirst compare replaced by string compare: "sorts by parsed instant" failed.
- dedupe `>` to `>=`: "keeps the earlier stored element ... equal updatedAt" failed.
- drop `.slice(0, MY_BUILDS_MAX)`: "caps the list" failed (length 51).
- probe uses MY_BUILDS_STORAGE_KEY: "is true for working storage ..." failed.
- build-library.ts drop `loaded.duration !== null` guard: two isEdited rows failed.
- copyName slice 100 instead of 93: two copyName tests failed.
- remove selected-first line in runName: "selected entry when it matches" failed.
- copyName without strip: "ENG 1TC (edited)" row failed.
- mineEntries key `entry.id`: builders test failed.
- build-query.ts drop `b` removal: mine, template and shared rows failed.
- initialBuildQuery named branch disabled: four rows failed.
- use-discard-guard.ts drop returnValue assignment: blockUnload test failed.
- Not mutated: the storage `removeItem`-on-bad-shape line and `persisted:false` branch were not individually broken.

## Gates
- codegen: none set. build (`next build`): passed. lint (`tsc --noEmit` + `lint:dup`): passed, 0 clones.
- Greps: `git grep beforeunload -- components` matches only use-discard-guard.ts (add and remove in the effect); the three other new .ts files have no `window`, `localStorage` or `document`; nothing imports build-input.tsx.
- Diff vs origin/main is only the 8 new files; no tool-made changes.

## Invariants
None adjacent; engine and data untouched.

## Out-of-scope findings
None.
