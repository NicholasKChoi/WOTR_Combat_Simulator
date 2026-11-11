# SGS-119 implementer report 1

- Ticket SGS-119, branch `sgs-119-named-build-shapes`, tip `f2b60d55d28e753a078bbb6741531ad305c8bfbb`, worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-119-named-build-shapes`.
- Status: needs_review.

## Files
- `lib/aoe4-build-order/named-builds.ts` (new, 84 lines): C1 library, no `node:`/`Buffer`.
- `lib/aoe4-build-order/named-builds.test.ts` (new): unit tests for every acceptance row.
- `lib/aoe4-build-order/saved-builds.ts`: extracted `export function base64UrlEncode(bytes)`; `base64UrlSha256` calls it (output unchanged).

## Tests
- named-builds.test.ts: 51 pass. Full suite: 64 files, 2023 passed, 13 skipped, 0 failed. saved-builds and save-rate-limit tests untouched and passing.
- Invariants encoded: id/secret encodings (zero, 0xff padding), id classes disjoint, random throw propagates, constant-time compare semantics, header grammars, schema bounds, secretHash absent from `NamedBuild` (`@ts-expect-error`, tsc passes only because the assignment errors).
- Pre-existing tests edited: none.

## Doc claims
Two header comments in named-builds.ts: "Named (editable) builds: ids, edit secrets, stored and public shapes, storage keys and request-header parsers." and "Browser-safe: Web Crypto only, no node: modules." True: file imports only zod and ./saved-builds; grep for `node:|Buffer` in the file finds nothing.

## Pinned outputs
- `newNamedBuildId(filled(0))` = 22 `A`; `filled(0xff)` = 21 `_` then `w`; `newEditSecret(filled(0))` = 43 `A`.

## Mutation checks (all undone)
- `named-builds.ts` sameSecretHash loop bound `a.length` -> `1`: "last character differs" and "one character differs in the middle" failed.
- parseIfMatchRevision dropped the `MAX_SAFE_INTEGER` check: "above the largest safe integer" failed.
- parseEditSecret dropped `startsWith(BEARER_PREFIX)`: "a lowercase scheme" failed.
- `saved-builds.ts` base64UrlEncode dropped `.replaceAll('=', '')`: the id, secret and editSecretHash pin tests failed.
- Not mutation-checked: the "distinct ids from default source" test, the length mismatch row of sameSecretHash, the keys/paths test (plain literals).

## Results
- codegen: none set. `npx next build`: passes. `npx tsc --noEmit && npm run lint:dup`: pass, 0 clones. `git grep "replaceAll('+'"` matches only `saved-builds.ts:38`.
- Diff stat vs origin/main: 3 files, no stray changes.

## Invariants
A3: random is injected; the only default is `cryptoRandomBytes` in the two makers. Upheld.

## Notes
- `NAMED_BUILD_VERSION` is exported per ticket but unused in the schema (version stays `savedBuildSchema`'s literal 1).
- No out-of-scope findings. No node/runtime mismatch noticed.
