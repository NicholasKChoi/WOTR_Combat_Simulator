# SGS-123 spec gate, round 2

**Verdict: READY**

Checked the re-specced ticket against design/M8.md (C5, C6, C7, `useDiscardGuard`, Library/select/edits rules), CONTEXT.md, INVARIANTS.md, LESSONS.md, REPO.md and `origin/main`. The `lint:dup` and `test` scripts and `zod ^4.6.7` are in `package.json`. `SAVED_NAME_MAX_CHARS = 100` is in `saved-builds.ts`. `pin-storage.ts`, `pin-storage.test.ts`, `pin-name.ts` and `pin-name.test.ts` exist. `lib/aoe4-build-order/named-builds.ts` is not on main and no SGS-119 branch exists yet. The ticket says so and names only the two patterns it needs from it.

## Round 1 gaps, now closed

1. The offset ordering row is replaced by `...00Z` against `...00.500Z`, which a string compare orders wrongly. Scope pins `+00:00` as invalid and dropped, and the mixed-list criterion lists it.
2. Builder `key` values are stated in Scope and match the C6 builder table. The criterion asserts whole `LibraryEntry` objects with `toEqual`.

The round 1 notes are also taken up: the `isEdited` signature, rows for an equal-`updatedAt` duplicate and a stable sort, the builders left to SGS-124 and SGS-125, and a `beforeunload` grep without quote style.

## Checks

- **Grounded scope**: new files are marked new, and the siblings they are modelled on exist.
- **Criteria**: every criterion has an observable outcome and a stated breaking mutation. No stale counts. The only fixed numbers are design constants (50, 93, 100, 42, 21).
- **Open questions**: none, and CONTEXT.md has none that affect this ticket.
- **Invariants**: `none adjacent` is right, with no contradiction.
- **Contracts**: C5, C6, C7 and `useDiscardGuard` match the design. The `runName` rule (selected entry preferred, `Custom build` when `selectedKey` is not an entry) matches C6.
- **Dependencies and size**: SGS-119 is stated, and about 240 LOC is under the limit.
- **Diagrams**: not triggered.
- **Lessons**: nothing relevant.
- **On merge**: `none` is correct.
- **Risk**: `standard` is right.
- **Docs**: none made untrue. The page and Save panel tickets own the docs.
- **Input validation**: the stored value uses zod, as common.md requires.

## Notes (non-blocking)

- The hook's add/remove behavior is covered only by review and the page ticket's reload spec. The ticket says so, and that is acceptable.
- The implementer must read `named-builds.ts` from the SGS-119 branch tip once it exists. If SGS-119 is not on a local branch when this task starts, the ticket cannot build.
