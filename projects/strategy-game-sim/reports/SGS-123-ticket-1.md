# SGS-123 ticket author, re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-123-my-builds-library-query-discard-guard.md

## Summary

"Add the my-builds storage, build library, build query and discard guard modules" (aoe4-build-order, M8.1 client
and M8.6 `nextBuildQuery`), ~240 business-logic lines across four new pure/client modules, Depends on SGS-119
(`NAMED_BUILD_ID_PATTERN`, `EDIT_SECRET_PATTERN`). Risk standard, On merge none. Criteria cover `readMyBuilds`,
`upsertMyBuild`, `myBuildsAvailable`, the C6 library functions, `initialBuildQuery` / `nextBuildQuery`, `blockUnload`,
module-scope global use, and tsc / lint:dup / npm test with no existing test edited.

## Changes from spec-gate round 1

Blocking gaps:
1. Offset ordering row: Scope now states `updatedAt` is `z.string().datetime()` with no options, so only the `Z` form
   is valid and an offset element (`+00:00`) is dropped (matches revised design C5). The ordering row now uses
   `2026-11-10T18:00:00Z` stored before `2026-11-10T18:00:00.500Z`, which a string compare orders wrong; the
   drop list gains an offset `updatedAt` row.
2. Builder `key`: Scope gives the full field table for `templateEntries` (`key: entryKey.template(build.name)`) and
   `mineEntries` (`key: entryKey.named(entry.id)`), per design C6; the criterion asserts whole entries with `toEqual`.

Non-blocking notes folded in:
- Scope and Out of scope name `linkEntry`, `namedEntry` (page ticket) and `savedMineEntry` (Save panel ticket) as not added here.
- `isEdited` signature from C6 stated, formula written against `live`.
- New rows: duplicate id with equal `updatedAt` keeps the earlier stored element; equal instants keep stored order.
- The grep criterion is now `git grep -n beforeunload -- components` (matches outside tests only in
  `use-discard-guard.ts`); at `origin/main` it has no matches, consistent with Scope.

Changed criteria tagged `(respec 1)`; `## Re-spec 1 - 2026-11-10` appended. Ticket lint: clean.

## Diagrams

None (single component, outside the core control loop).

## Open questions

None.

## Overlap

None new. Boundaries with SGS-124 (page: `linkEntry`, `namedEntry`, `pinName` removal) and SGS-125 (Save panel:
`savedMineEntry`, `pin-name.ts` deletion) are stated in Scope. No SGS-123 branch exists yet.
