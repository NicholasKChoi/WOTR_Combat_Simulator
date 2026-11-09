# SGS-099 ticket report 1

Ticket: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-099-saved-build-record.md`

Summary: "Add the saved-build record, its id and the save checks". Component aoe4-build-order, risk standard, ~150 lines of business logic plus Vitest tables, no dependencies, On merge none. Criteria M6.4 (validation, size cap) and M6.6 (env key prefix). It adds a pure, browser-safe `lib/aoe4-build-order/saved-builds.ts` and `saved-builds.test.ts`, and `BuildsError` plus type re-exports in `lib/aoe4-build-order/api.ts`. Nothing calls it yet.

## Shared symbols defined (exact names)

`lib/aoe4-build-order/saved-builds.ts`: `SAVED_BUILD_VERSION`, `savedBuildSchema`, `SavedBuild`, `SaveBuildRequest`, `SaveBuildResponse`, `SAVED_BUILD_ID_PATTERN`, `isSavedBuildId`, `savedBuildId`, `storageEnv`, `savedBuildKey`, `rateCounterKey`, `savedBuildPath`, `SAVED_BUILD_MAX_BYTES`, `SAVED_NAME_MAX_CHARS`, `checkSaveBuildRequest`.

`lib/aoe4-build-order/api.ts`: `BuildsError` (`{ error: string }`), plus `export type` re-exports of `SavedBuild`, `SaveBuildRequest`, `SaveBuildResponse`.

The plan row A omitted `rateCounterKey`. C1 includes it, so the ticket defines it. Signatures are exactly C1's.

## Decisions the ticket fixes (not in the design)

- Exact messages: `durationSeconds: missing`, `durationSeconds: must be a number`, `durationSeconds: <outOfRange text>`, `name: <n> characters, more than 100`, `saved build: <bytes> bytes, more than 65536`, and the round-trip `invalid` message `build order: reopening it as text would change the build; use whole numbers for times and counts`. The non-object 400 uses `request body: must be a JSON object` (same as simulate).
- The name check runs only when the order is valid (it needs a valid `name`). Issue order is order, duration, name.
- The size is measured in UTF-8 bytes with `TextEncoder`. The test must use a multi-byte string so a character count would fail it.

## Open questions (both `designer`, non-blocking)

1. C3 row 8 says fractional `walkSeconds: 2.5` gives one `invalid` issue. In the code, `formatBuildOrderText` writes `walk 2.5s` and the parser accepts only `/^(\d+)s$/`, so it fails at parse and returns the parse issues. The ticket follows the code. The `invalid` issue is only for a case where parse succeeds but `steps` or `start` differ, and the ticket tells the implementer to find such a case (or test the comparison directly and report that none exists).
2. `notAnObjectError()` lives in `api-route.ts`, which A cannot depend on. `checkSaveBuildRequest` inlines the same 400 body privately. The ticket that adds `api-route.ts` may point at it if one source is wanted.

## Overlap and notes for later tickets

- No overlap with existing tickets. Later tickets (the store/rate-limit ticket B, the routes ticket C, the page ticket G) use only the names above.
- The B ticket may want a SHA-256/base64url helper for `clientKey`. A does not export one (C1 has no such name), so B will duplicate a few lines unless it is added to the design.
- Input validation: `buildOrder` goes through the existing zod `checkBuildOrder`; only the three envelope checks (non-object, duration, name) are hand-written, reusing `outOfRange`.
- Diagrams: none (single-component, outside the core loop).
- Criteria commands: the one grep criterion (no `node:`, React or Next import) targets a file that does not exist yet, so it cannot be run now; it holds in the end state. No mutation check against existing code applies. I read the parser to confirm the 2.5 behavior above and did not run it.
- The scratch worktree `ticket-SGS-099` was removed.
