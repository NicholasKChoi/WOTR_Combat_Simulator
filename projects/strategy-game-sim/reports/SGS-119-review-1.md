# SGS-119 review 1

- Branch `sgs-119-named-build-shapes`, tip `f2b60d55d28e753a078bbb6741531ad305c8bfbb`, base `main`. Full review (not delta).
- Verdict: **REQUEST CHANGES** (one blocking test finding; the production code matches the contract).

## Blocking findings

1. `lib/aoe4-build-order/named-builds.test.ts:104` - test - the `sameSecretHash` row `['different lengths', 'abcdef', 'abcde', false]` cannot catch a missing length guard. With the longer string first, the loop over `a.length` XORs `'f'` with `NaN` (coerced to 0) and still returns `false`. I checked this by deleting `if (a.length !== b.length) return false;` at `named-builds.ts:38`: all 51 tests still pass. A compare that accepts a prefix of the stored hash is exactly the bug this row exists to catch, and the implementer report lists it as not mutation-checked. Direction: add a row where the first argument is a strict prefix of the second, for example `['the first is a prefix of the second', 'abcde', 'abcdef', false]`. It fails when the line-38 guard is deleted, because the loop runs over the 5 shared characters, they match, and the function returns `true`. Keep the existing row.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | No `node:` import or `Buffer` in named-builds.ts; importable from a component under tsc | pass | Only imports are `zod` and `./saved-builds`, and `saved-builds` is already imported by `components/apps/aoe4-build-order/build-input.tsx` and others. `npx tsc --noEmit` passes. A bare `grep node:` matches the header comment "no node: modules" on line 2, which is the same comment as `saved-builds.ts:2`. There is no import and no `Buffer`. |
| 2 | (respec 1) id pins, `isNamedBuildId` rows, disjoint from `savedBuildId` | pass | test:35-71. The all-zero id is 22 `A`, all-0xff is 21 `_` then `w`. 21 chars, 23 chars, a number, `undefined` and a real 11-char `savedBuildId` are all rejected. |
| 3 | `newEditSecret` zero pin; throwing `random` propagates from both makers | pass | test:43-45 and 74-83 |
| 4 | `editSecretHash` against `node:crypto` (test only); different secrets differ; `sameSecretHash` rows | **fail** | The hash tests (test:86-96) and the first/last/middle rows are fine. The lengths-differ row cannot fail (blocking finding 1). |
| 5 | `parseEditSecret` table | pass | test:111-126. All 9 rows match the ticket. |
| 6 | `parseIfMatchRevision` table | pass | test:128-145. All 12 rows. The weak-ETag and above-MAX_SAFE rows fail under the matching mutations (the implementer reports the MAX_SAFE mutation; `W/"1"` cannot match `^"`). |
| 7 | `storedNamedBuildSchema` accept and reject rows; `NamedBuild` `@ts-expect-error` | pass | test:147-178. tsc covers test files (`tsconfig.json` includes `**/*.ts`), so an unused `@ts-expect-error` would fail lint if `secretHash` leaked into `NamedBuild`. |
| 8 | Exact key, path, ETag and cache-control strings | pass | test:181-189, compared with design C1 rows 87-92 |
| 9 | (respec 1) `base64UrlEncode` exported and used by both; conversion only there | pass | `saved-builds.ts:36-39` and `:43`. `named-builds.ts:26,30`. `git grep "replaceAll('+'" -- lib/aoe4-build-order` gives only `saved-builds.ts:38`. |
| 10 | `base64UrlSha256` output unchanged; existing tests unedited; lint:dup and tsc pass | pass | No diff in `saved-builds.test.ts` or `save-rate-limit.test.ts`. Those two plus named-builds pass: 3 files, 129 tests. tsc is clean and jscpd finds 0 clones. |
| 11 | No INVARIANTS regressions | pass | See below |

## Invariants touched

- A3 (deterministic simulation): holds. Randomness only comes in through the default `cryptoRandomBytes` argument of `newNamedBuildId` and `newEditSecret`. No simulation module imports `named-builds.ts`, and it is imported nowhere yet.
- S3 (caps): no loops over input besides `sameSecretHash`, which is bounded by the string length. The revision digits are capped at 16 by the regex. Holds.
- S1 (no cross-app imports): holds.

## Contract check (design/M8.md C1)

Each exported name and shape matches C1 rows 70-92: constants, `RandomBytes`, both makers, `editSecretHash`, `sameSecretHash` (constant-time XOR accumulation, `false` on length mismatch), the schema extension (exact field validators), `StoredNamedBuild`, `NamedBuild`, both response interfaces, key, path, `parseEditSecret` (`startsWith('Bearer ')` then the 43-char pattern rejects a double space, a trailing space and a lowercase scheme), `parseIfMatchRevision` (strong quoted ETag, `/^[1-9][0-9]{0,15}$/`, `<= MAX_SAFE_INTEGER`), `revisionEtag`, and `NAMED_BUILD_CACHE_CONTROL`. Scope is respected: there is no barrel entry, no route, store or client use, and no ARCHITECTURE or OpenAPI edit. No invented constants.

## Linter

`npx tsc --noEmit && npm run lint:dup` (run in the review worktree) both pass, with 0 clones. There is no ESLint config.

## Review bot

`reviewBot.cli` and `rulesFile` are empty, so there was nothing to reconcile.

## Conventions

- `named-builds.ts` follows `saved-builds.ts:1-2` (two-line header comment, `import { z } from 'zod'`, 2-space indent, semicolons, exported `UPPER_CASE` constants, `is…Id` type guard as at `saved-builds.ts:32-34`).
- The test file follows `saved-builds.test.ts:1-30` (4-space indent, no semicolons, named imports with `type` specifiers, `it.each` tables with a leading name column).

## Non-blocking notes

- `named-builds.ts:48` repeats `EDIT_SECRET_PATTERN`'s regex as a literal inside the schema. `z.string().regex(EDIT_SECRET_PATTERN)` would keep the two from drifting. The design wrote the literal, so this is optional.
- `NAMED_BUILD_VERSION` is exported but not used: the schema keeps `savedBuildSchema`'s `z.literal(SAVED_BUILD_VERSION)`. This matches the design note that "`version` stays `z.literal(1)`". A later ticket may use it when writing records.
- zod is v4 (`package.json:23`), where `z.string().datetime()` is the deprecated alias of `z.iso.datetime()`. The behaviour is the same (Z form only by default), and the design dictates this spelling.
- The design C1 property "every id ... decodes back to 16 bytes" is not tested. The ticket's criteria do not require it.

## Coverage

- Reviewed: all three changed files in full, design C1 and the route tables that consume it, the ticket, the implementer report, INVARIANTS (A3, S1, S3), spec-checklist, and both LESSONS files.
- Ran: tsc, jscpd, vitest on named-builds, saved-builds and save-rate-limit tests, and one mutation (removing the length guard, then reverted).
- Not run: `npx next build`. The implementer reports it passing. The only page-reachable change is the behaviour-preserving extraction in `saved-builds.ts`, and tsc is clean.
- No UI changed, so the UI inspection did not run. REPO.md Review checklist: the "Every diff" page-load step does not apply (no page or component changed). In "AoE4 build order", the copy-helper rule is satisfied (the encoder was extracted, not copied), and the doc-sentence rule is satisfied (no docs changed; both header comments match the code).
- Review worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/review-sgs-119-named-build-shapes`. Removal may fail with EBUSY under the sandbox; deferred cleanup.
