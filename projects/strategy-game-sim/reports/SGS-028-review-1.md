# SGS-028 review 1

- Branch `sgs-028-aoe4-parse-build-order-text` @ 9a73c66, base 16f757f, full review (first review).
- Reviewed in a detached worktree at `$FACTORY_DIR/worktrees/review-sgs-028`, which has since been removed.
- Diff: two new files, `lib/aoe4-build-order/parse-text.ts` (356 lines) and `lib/aoe4-build-order/parse-text.test.ts` (462 lines).

## Verdict: APPROVE

## Blocking findings

None.

## Spec gaps

None blocking. One doc wording point is listed under the non-blocking notes (note 1).

## Acceptance criteria

All 14 pass. Each is ticked in the ticket.

1. Exports and tsc: pass. The module exports exactly `ParseTextResult`, `parseBuildOrderText` and `formatBuildOrderText` (parse-text.ts:4, :217, :346). It imports only types from `./model`. `npx tsc --noEmit` exits 0.
2. Round trip: pass. The test at test.ts:31-59 covers every action and every produce suffix, research with and without `at`, both trigger kinds, `#k` including `#0`, and a `start` with villagers and a rally. It asserts with `toStrictEqual`.
3. Order metadata: pass. parse-text.ts:269 builds the literal order, and `source` is never set. Tested for empty, comment-only, start-only and step texts (test.ts:72).
4. Formatter drops `civ`, `name` and `source`, and prints `walk 4.5s`, which re-parses as `syntax` on its line: pass (test.ts:401, :407).
5. Line map: pass. The two design examples give exactly `{ start: 1, steps: [3] }` and `{ steps: [1..5] }`. CRLF, blank and comment lines are counted. There is no `start` key when there is no start line (test.ts:89-113).
6. Each grammar error case is `syntax` with `line` and no `step`, and is tested; `@60:00` and `@75:00` parse: pass. Every listed case is in test.ts:141-288. Issues are strict-equal to `{code, message, line}`.
7. `start` rules: pass (test.ts:302-337). I confirmed that `parseStart` rejects a repeated node with `Object.hasOwn` and accepts `start 3 constructor` as an own key, so there is no prototype confusion.
8. Several bad lines give one issue each, in line order: pass. Each line gets one try/catch (parse-text.ts:232-261).
9. No cross-checks: pass (test.ts:226).
10. `git grep` for `./data` or `./validate` imports finds nothing: pass. I ran it (exit 1, no output).
11. The formatter emits `start` first in GatherNodeId order and omits it for `{}`, for `{ villagers: {} }` and when absent: pass (parse-text.ts:288-295, test.ts:363-378).
12. A 20,000-character input parses in well under 100 ms: pass. I measured it in the worktree: 1.4 ms for a valid paste, and 0.03-0.2 ms for each hostile long line (a long id followed by `!`, an `a-` run, a long `@` trigger, a single long word, `a0...#!`, `a-...#1#`). The worst case was 4 ms, for 20,000 newlines. The test bound is 1000 ms, a loose bound as gate 1 asked.
13. `npm test` passes: 11 files, 226 tests.
14. No invariant regressions: pass (see below).

## Invariants touched

- S1 (apps independent): holds. The only import is `./model` types.
- S3 (bounded time): holds. The parser makes one linear pass. Every regex is anchored, and `-` separates the repeated group, so no pattern backtracks badly. Quoted tokens are cut to 40 characters. The 20,000-character cap is the route's job (SGS-033).
- A1 (no literals): holds. There are no game numbers. `GATHER_NODE_ORDER` is the type's id list, not a game number.
- A2: not touched.
- A3 (determinism): holds. No `Math.random`, no `Date.now`, no timers. Both functions are pure. `performance.now` appears only in the test file.
- W1, W2, H1-H3: paths not touched.

## spec-checklist

- Contracts: the names match design/M2.md "Line map" and the Modules row exactly.
- Scope: the diff does not touch `golang/`, `model.ts`, the doc, validate or the route. No new issue code. A trailing `# comment` after a step stays `syntax`.
- Invented constants: none. `'Pasted build order'` and the node order are both fixed by the spec.
- Naming: fine. No dead enum values.
- S1-S3 and A1-A3: see above.

## Doc check (doc wins)

I compared the code with docs/aoe4-build-order.md:304-350 at 16f757f. The grammar, the example block, the `@m:ss` rule, the suffix order, `walk Ns` coming last, and the `start` rules all match the code. (See note 1 for one doc sentence.)

## Linter

`npx tsc --noEmit` reports nothing. There is no ESLint config in the repo.

## Review bot

`reviewBot.cli` and `rulesFile` are empty, so no bot ran and there are no findings to reconcile.

## Conventions

- Source style is 2-space indentation with semicolons, matching `lib/aoe4-build-order/effects.ts:1-60`. Tests use 4 spaces, no semicolons, and `describe`/`it`/`it.each`, matching `effects.test.ts:1-60`.
- Naming follows the siblings: `UPPER_SNAKE` module constants (effects.ts:35-37) and small module-private helpers.
- `class Tokens` uses a TypeScript parameter property (parse-text.ts:37). No other `lib/` file does. Next/SWC and Vitest compile it, but Node's built-in strip-types mode rejects it (I hit `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` while probing). No repo tool runs that mode, so this is not blocking.
- Hygiene: no ticket ids or factory pointers in the code, tests or commit message. The author is `choinickolas@gmail.com`.

## Correctness probes (scratch test, deleted afterwards)

These all behave as the spec says:

- `at 6 vils` alone, `start\t-> sheep`, `START`, `start -> sheep -> wood`, a repeated `walk`, `x3 x4`, `a#1#2`, `tc#`, and full-width or Arabic digits.
- `research ... walk 3s` is `syntax`, because research takes no walk.
- A lone `\r` is not a line break; the spec splits only on `\r\n` and `\n`.

## REPO.md review checklist

- Every diff: `npx next build` exits 0 in the worktree. No page is touched, so no page needed loading. The diff is lib-only.
- REPO.md has no AoE4 section, and its Combat, StarCraft and Shared sections do not match these paths.

## Non-blocking notes

1. docs/aoe4-build-order.md:352-353 says "A paste step issue carries both `step` and the 1-based `line`". The ticket and design/M2.md:94 say parse `syntax` issues carry `line` only, and the code follows them. The doc sentence reads as describing validate-stage issues, but it could be tightened when the doc is next edited (doc owner: SGS-025 or a follow-up).
2. Leading or trailing NBSP (common when pasting from web pages) is not treated as whitespace. The spec covers only space, tab and `\r`, so this is by spec. The message then reads `got ' pause'`, and the quoted token looks like it has an ordinary space, which is confusing. A possible follow-up for the page or the route: normalize NBSP or name it in the message.
3. A cascade issue: a line that fails before reaching `start` (for example `@1:61 start -> sheep`) counts as a step. A following valid `start` then gets a second issue, "must come before every step". It is still one issue per line and still correct; it is just noisy.
4. `formatBuildOrderText` silently drops `start.villagers` keys outside GatherNodeId (for example a parsed `start 3 nowhere` formats as an empty start). That is allowed: such an order is not paste-representable and validate rejects it. Noted for whoever seeds the textarea from unvalidated input.
5. Under `strict: false`, `if (!result.ok)` does not narrow `ParseTextResult`; `=== false` and `=== true` do. This is the implementer's out-of-scope finding. I confirmed the tests use `=== false` and `=== true`. Worth a line in SGS-033 or in LESSONS.

## Out-of-scope findings

- The `strict: false` narrowing problem (note 5) affects the route and page consumers in SGS-033 and the page ticket.

## Coverage

- Reviewed in full: `lib/aoe4-build-order/parse-text.ts` and `lib/aoe4-build-order/parse-text.test.ts`.
- Read for comparison: `model.ts`, `effects.ts`, `effects.test.ts`, `data.ts`, `data.test.ts:10`, `docs/aoe4-build-order.md:300-366`, design/M2.md "Line map" and "Paste format", `ARCHITECTURE.md`, `tsconfig.json` and `vitest.config.mts`.
- `git merge-tree` against origin/main 72d74a0 is clean.
- Nothing left unreviewed. No processes left running.
