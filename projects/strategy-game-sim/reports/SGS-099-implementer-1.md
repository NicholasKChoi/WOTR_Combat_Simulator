# SGS-099 implementer report 1

Status: needs_review
Branch: sgs-099-saved-build-record, tip eb3212ea03f44ca8191859c016680692ec628e41 (base origin/main 1e6d6c2)
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-099-saved-build-record

## Files
- lib/aoe4-build-order/saved-builds.ts (new, ~113 lines): every C1 name, `checkSaveBuildRequest` steps 1 to 8, private `isPlainObject` / `notAnObjectError` copies (SGS-103 deletes them).
- lib/aoe4-build-order/saved-builds.test.ts (new, 51 tests).
- lib/aoe4-build-order/api.ts: `BuildsError`, `export type` re-exports of `SavedBuild`, `SaveBuildRequest`, `SaveBuildResponse`, header comment now covers the saved-builds API.

## Tests
Full suite: 49 files, 1562 passed, 10 skipped (pre-existing skips). saved-builds.test.ts: 51 passed.
Invariants encoded: id is 11 url-safe chars and hashes the parsed record (key-order case); pattern anchored; env set; keys; every C3 400/413 row; issue order and cap; name checked only for valid order; byte (not char) cap using `source`; round trip loop over `listBuilds()`; text-length guard, fractional walk, and part-2 guard via `vi.mock` of `formatBuildOrderText`.
No pre-existing test edited.

## Doc claims
- api.ts header: "Request and response types for POST /api/aoe4-build-order/simulate and the saved-builds API. ..." true: file now holds the saved-builds types and BuildsError.
- saved-builds.ts header: "Browser-safe: Web Crypto only, no node: modules." true: grep for node:/react/next imports is empty; uses crypto.subtle, TextEncoder, btoa.
- grep of docs/, ARCHITECTURE.md, README.md for `saved-builds`, `saved build`, `BuildsError`: no matches, nothing to fix.

## Pinned outputs
None pinned from the engine beyond messages given in the ticket. `61.5` gives `durationSeconds: 61.5 is not an integer` (from `outOfRange`).

## Mutation checks (each applied, test run, reverted)
Failed as required: hash unparsed/other serialization (1 failed), drop `.slice` (4), unanchored pattern (2), env mapping (1), name `<` vs `<=` (1), bytes to `.length` (1), round trip removed (3), compare dropped (1), compare always-fires (8), name before duration (1), name checked for invalid order (1), no issue cap (1), drop `+` to `-` replace (initially survived; added a 100-record url-safe test, now fails, 1).
Survivor: replacing the key-sorted compare (`sortedKeys`) with plain `JSON.stringify` still passes. Both sides are zod output, so key order always agrees and no input (even with the mock) can reach a difference. The sort is kept because the ticket says "ignoring key order"; no test claims to cover it. Reviewer may prefer deleting it.

## Gates
- tsc --noEmit: pass. lint:dup: 0 clones. `npx next build`: pass. npm test: pass. codegen: none configured.
- Import grep for node:/react/next in saved-builds.ts: empty.
- No runtime import cycle: api.ts only has `export type` from saved-builds; saved-builds imports the `MAX_REPORTED_ISSUES` value from api.
- No tool-made stray changes (diff stat shows only the three files; node_modules is ignored).

## Notes
- Shipped builds all pass the save checks and the round trip in the loop test; nothing weakened.
- The saved-build id test hashes `savedBuildSchema.parse(record)`: a raw JSON-file build has different step key order than zod output, so ids are defined on the parsed record (as the ticket says). `checkSaveBuildRequest` returns the zod output, so its `record` is already in that order.
- Out-of-scope findings: none.
