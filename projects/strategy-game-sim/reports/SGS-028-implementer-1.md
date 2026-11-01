# SGS-028 implementer report 1

- Ticket: SGS-028 (parse and format AoE4 build order paste text)
- Branch: `sgs-028-aoe4-parse-build-order-text`, base origin/main 16f757f
- Tip SHA: 9a73c66649fc21e73cb83bf7dfba12cd81dc9db5 (one commit)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-028-aoe4-parse-build-order-text
- Note: origin/main has since moved to 72d74a0 (SGS-027 merged). `git merge-tree` against it is clean. The two branches touch different files.

## Files touched

- `lib/aoe4-build-order/parse-text.ts` (new, 356 lines): token cursor, trigger, action and `start` parsers, line driver, formatter.
- `lib/aoe4-build-order/parse-text.test.ts` (new, 462 lines, 95 tests).

`git diff --stat 16f757f` shows only these two files. No lockfile, doc or model changes.

## Implementation notes

- Exports are exactly `ParseTextResult`, `parseBuildOrderText` and `formatBuildOrderText` (checked with `grep -nE "^export "`). The file imports only `type`s from `./model`. The ticket's `git grep` for `./data` or `./validate` finds nothing.
- Lines are split on `\n`. Tokens are split on `/[ \t\r]+/` with empty tokens dropped. `\r` counts as whitespace, so CRLF and stray `\r` are handled, and the line split needs no `\r?`. The first mutation run showed that `\r?` was redundant, so I removed it.
- Every regex is anchored and has no ambiguous nested quantifier: ID `^[a-z0-9]+(?:-[a-z0-9]+)*$`, `^\d+$`, `^@(\d+):(\d\d)$`, `^x(\d+)$`, `^(\d+)s$`. Parsing is one linear pass per line, using a cursor and a per-line exception (`LineError`). The catch block re-throws any other error.
- Action words are looked up in a `Map`, so `constructor` and `toString` are not treated as actions (this is tested).
- Messages read `line N: expected <what>, got '<token>'`, `got end of line`, or `unexpected token '<token>'`. A quoted token is cut to 40 characters plus `...`, so a 20,000-character token does not end up whole in the message.
- Numbers: leading zeros are accepted as decimal (`x03` gives 3). A 400-digit number becomes `Infinity` through `Number()`, and validation rejects it as non-finite. Signs and decimals are `syntax`.
- `start` ordering: any non-ignored line that is not a `start` line counts as a step line, even if it failed to parse. Any line whose action word is `start` counts as a start, even if it failed. So `bogus` / `start -> sheep` reports both lines, and a bad first `start` followed by a second one reports both.
- Parsed objects never carry an `undefined`-valued key. Absent optional parts are omitted. The round trip is asserted with `toStrictEqual`.
- The formatter checks every optional with `!== undefined`, so `x0`, `#0`, `with 0` and `walk 0s` all print. Time prints as `@${floor(s/60)}:${pad2(s - m*60)}` with no minute cap. An unknown trigger kind prints no prefix. An unknown action prints `String(action)`. It never throws on non-representable input (this is tested).
- Size: about 300 lines of logic, against the ~200-260 estimate. That is still under 400.

## Tests (`npx vitest run lib/aoe4-build-order/parse-text.test.ts`: 95 passed, 0 failed; `npm test`: 11 files, 226 passed)

Invariants and rules the tests encode:
- Round trip: an order using every action, both trigger kinds, `#k` (including `#0`), zero counts, and a `start` with `villagers` and `rally` re-parses to strict-equal `start` and `steps`.
- Order metadata: `civ: 'english'`, `name: 'Pasted build order'`, and no `source`, for empty, comment-only, start-only and step texts. A text with no `start` line has no `start` key in the order or in `lines`.
- Line map: both design examples give exactly `{ start: 1, steps: [3] }` and `{ steps: [1..5] }`. CRLF, blank, tab-only, indented and `#k` comment lines count as physical lines.
- Triggers: `@1:30`, `@0:59`, `@60:00`, `@75:00` and `at N vils` parse. `@1:61`, `@1:5`, `@1:005`, `@:30`, `at 9 villagers`, `at nine vils`, the unknown prefix `when` and a trigger with no action are each `syntax`.
- Grammar errors (33 cases): out-of-order produce suffixes, `walk 4 s`, `walk 4.5s`, a missing walk value, uppercase ids, negative, decimal and `+` numbers, `x 3`, a spaced or negative `#k`, a missing `from` or `to`, a missing `->` target, trailing tokens, malformed kebab ids, an uppercase keyword, an unknown action. Each issue is strict-equal to `{ code: 'syntax', message, line }` (no `step`), and its message contains `line N` and the offending token.
- `start`: the ticket's three ok forms; unchecked node names; `start` alone, a repeated node, a second `start`, `start` after a step, `@0:00 start`, `at 6 vils start`, a villager part after `->`, a dangling count and an uppercase node each give `syntax` on the right line.
- Multiple bad lines give one issue each, in line order, and no `ok: true`.
- No cross-checks: `-> nowhere walk 4s`, `@75:00 ... from nowhere x999`, `x0` on a non-villager with a rally, and a huge count all parse to their literal values.
- Formatter: `start` comes first in GatherNodeId order whatever the object's key order; `start` is omitted for `{}`, `{ villagers: {} }` and an absent `start`; seconds print as two digits and minutes are uncapped; zero optionals print; `civ`, `name` and `source` are dropped; `walk 4.5s` prints and re-parses as `syntax` on its line; odd input does not throw.
- S3: a 20,000-character valid paste and four 20,000-character hostile lines (a long id with `!`, an `a-` run, a long `@` trigger, one long word) each parse in under 1000 ms. The bound is loose on purpose, so the test catches catastrophic backtracking without being flaky. The whole file runs in about 170 ms.
- A3: format is identical for a deep clone of the order, and parsing the same text twice gives strict-equal results.

## Mutation checks

A scripted run in the scratchpad applied each break to `parse-text.ts`, ran the test file, and restored the original. `cmp` confirmed the restore, and nothing was committed broken. Every break below made at least one test fail:

seconds > 59 check removed; minutes not multiplied by 60; whitespace without `\t`/`\r` (and, as a separate break, without `\r` only, which the CRLF test catches); comment skip removed; 0-based line numbers; ID accepting uppercase or `.`; NUMBER accepting a sign or decimals; SECONDS accepting decimals; `end()` disabled; produce `rally`, `count`, `walkSeconds` and `instance` dropped; build `builders` and `then` dropped; research `at` dropped; trigger not attached; villagers trigger count off by one; repeated-node, second-start, start-after-step, start-trigger and empty-start checks each disabled; `lines.start` not set; `order.start` always set; name literal changed; only the first issue collected; `line N` missing from the message; action lookup through a plain object (so `constructor` is found); quote truncation disabled; formatter using object key order for start nodes; formatter emitting an empty `start`; formatter count and instance using truthiness; seconds not padded; formatter rally, walk and villagers prefix dropped; formatter default case throwing.

The only break that survived was making the line split `\n` instead of `\r?\n`. It survived because `\r` is already whitespace, so the code it changed was redundant. I simplified the line split to `'\n'` with a one-line comment, then confirmed that removing `\r` from the whitespace set fails the CRLF test.

## Gates (from the worktree, Node v24.22.2, after `npm ci`)

- codegen: not set in REPO.md.
- build: `npx next build` exits 0.
- lint: `npx tsc --noEmit` exits 0.
- unit: `npm test` passes 226 of 226.
- No process left running (checked with `ps`).

## Invariant check

- S3 (bounded time): upheld. One linear pass, anchored non-ambiguous regexes, and quoted tokens capped at 40 characters. The 20,000-character tests pass with a loose bound.
- S1 (apps independent): upheld. The module imports only `./model` types.
- A1 (numbers from data): upheld. No game numbers in the parser, and no data import.
- A2: not touched; the parser does no simulation.
- A3 (determinism): upheld. No randomness or clock, and pure functions (tested).

## Out-of-scope findings

- `tsconfig.json` has `strict: false`, so `strictNullChecks` is off, and `if (!result.ok)` does not narrow `ParseTextResult` (tsc error TS2339 on `.issues`). `result.ok === false` and `result.ok === true` do narrow. The route (SGS-033) and the page will hit this when they consume `ParseTextResult` and the validate result unions. This is worth a line in those tickets or in LESSONS.

## Status

needs_review
