# SGS-014 implementer 2 (Rework 1)

- Ticket: SGS-014 (Rework 1 required fixes only)
- Branch: `sgs-014-aoe4-data-model-loader`, previous tip `d0845e5`, new tip `cac82e8e260bcd8931b98cd1f569426f51b967b1`
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-014-aoe4-data-model-loader`
- Commit author: choinickolas@gmail.com. Not pushed.

## Required fixes

- [x] `buildGameData` returns `Object.freeze({ ... })` (shallow; the four Maps stay unfrozen, typed `ReadonlyMap`).
- [x] `freezes the shared data so a write throws` test: a top-level write (`base = ...` through a writable cast) throws
      `TypeError`, and a later `loadGameData('english').base.walkSeconds.value` is still 5.
- [x] New `buildGameData` test `orders each baseId by ascending age whatever the input order`: supplies the `man-at-arms`
      entries in reverse age order (asserts the input really is out of order), then asserts `byBaseId` ages ascend.
- [x] Comment above `buildGameData` now says the snapshot, base and civData passed in are frozen in place; pass copies to
      keep them writable.

## Files touched

- `lib/aoe4-build-order/data.ts`: shallow freeze of the returned GameData; one comment sentence.
- `lib/aoe4-build-order/data.test.ts`: top-level write assertion; reversed-age seam test.

## Checks

- `npx tsc --noEmit`: clean.
- `npm test`: 6 files, 91 tests passed (was 90; +1 new test).
- Mutation 1, `return Object.freeze({` -> `return ({`: `freezes the shared data so a write throws` fails (1 failed, 33 passed in
  lib/aoe4-build-order). Restored.
- Mutation 2, `tiers.sort(...)` removed: `orders each baseId by ascending age whatever the input order` fails (1 failed, 33
  passed). Restored.
- `npx next build` not rerun (not requested; change is two lines in a module nothing imports yet). No codegen or lint stage
  (no ESLint config). `npm install` not run.

## Invariants

- A3: the cached GameData is now frozen at every plain-object level; Maps guarded by `ReadonlyMap` type, as specified.
- A1, S1: untouched; no numeric literals added to `lib/` code.

## Out-of-scope findings

None.

## Status

needs_review
