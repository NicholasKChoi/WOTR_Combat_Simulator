# SGS-211 acceptance-test 7

Verdict: PASS. Branch `sgs-211-repeat-paste-text-and-table-field`, reviewed tip `6fdb74d`, new commit `77af50e26d906e9ff9888a4f40350370dc312d2c` (one test file added).

Note on the checkout: it held a leftover uncommitted break (`repeat.ts` REPEATABLE_ACTIONS with `'research'` added) and an untracked draft `acceptance/aoe4-repeat-step-paste-save.spec.ts`. I restored `repeat.ts` to the committed line, finished and committed the draft. `git diff --exit-code` is clean after every break.

## Tests written (`acceptance/aoe4-repeat-step-paste-save.spec.ts`, 17 tests; the implementer's `aoe4-repeat-step.spec.ts` was left alone)

- 12 table rows, one issue each on line 2 (`data-code`, `data-line`): second xN on produce (syntax); xN after `-> node` on produce (syntax); xN before walk; xN before then; two trailing xN; `X9`; `x 9`; `x-1`; `x1.5` (all syntax); `move 1 sheep to x9` (unknown-id, x9 is a node); `x201` (out-of-range); `research ... x2` (invalid).
- `x09` reads as 9 copies, shows `9` in the table field, and printing back gives `x8` after editing to 8.
- A move row takes Repeat, line prints `move 1 sheep to wood walk 2s x2` (after walk); the field is empty before; changing to build keeps `x2`, closes the row (existing rule), and reopening shows `2`.
- The page saves a pasted build with repeat on a build and a move step; the POST body carries `repeat` 3 and 2, status 201, the link shows.
- A shared build with repeat is stored as sent (GET equals the posted order) and reopens with both xN lines and `of 3 done` / `of 2 done`.
- A shared build with repeat on research is refused (400, message names repeat; a control without repeat gets 201).

## Run

Harness ran (`acceptance:setup`, Playwright Chromium). Final run: 99 passed, 0 failed across my spec, `aoe4-repeat-step`, `aoe4-step-table`, `aoe4-step-annotations`, `aoe4-build-order-step-band`, `aoe4-editor-width`. `npx tsc --noEmit` clean, `lint:dup` 0 clones.

## Mutation checks (each undone; git diff clean after)

All against my spec; failing assertion named.
- `parse-text.ts:21` COUNT `[xX]`: only the `X9` row failed (count 0).
- COUNT `-?\d+`: `x-1` row failed (data-code out-of-range). COUNT with decimals: `x1.5` row failed.
- `parse-text.ts:235` drop the produce exclusion: the two produce rows failed (code invalid).
- `parse-text.ts:237` `+1` on the value: x09 (nine copies), save POST, shared build reopen failed.
- `parse-text.ts:301` drop `t.end()`: all syntax rows with a trailing token failed on count (`x 9` too).
- `parse-text.ts:310` issue `line + 1`: every row failed on `data-line`.
- `Tokens.node()` rejecting `x\d+`: the `x9` node row failed (unknown-id vs syntax).
- `schema.ts:43` repeat max 300: `x201` row failed on `data-line` (the cross-step issue has no line). `schema.ts:304` code to invalid: `x201` failed on data-code.
- `repeat.ts` +`research` (with `schema.ts:76` research accepts repeat): the research row and the refusal test failed (400 expected, 201 seen). `schema.ts:386` message without "repeat": the refusal test failed on the message.
- `parse-text.ts` move printing: drop repeat, then swap order before walk: move test failed (waitForResponse timeout, no rerun); trailing space on the move print: `toBe('... x2')` failed on its own and the reopen `arrayContaining` failed.
- `repeatWord` returns undefined: x09 `x8` assertion (toContain), move test, save and reopen failed.
- `parse-text.ts` repeat skipped for move: save POST (`['move',2]`) and reopen failed.
- `step-table-model.ts` drop the repeat carry in `changeAction`: move test failed at the build-line `toMatch`.
- `step-table.tsx:321` always keep open: `aria-expanded` false assertion failed. Value hidden for build rows: x09 field `9` and the move-test final `2` failed. Value defaults to 1: the move test's initial `''` failed.
- `step-table-model.ts` `hasOptionalField` false: x09 field and the move test's initial `aria-expanded` true failed.
- `repeat.ts` `repeatCount` returns 1: reopen `of 3 done` failed; move-only 1: the `of 2 done` assertion failed.
- `schema.ts:411` strip repeat: the GET `toEqual` (stored as sent) and the save POST failed.
- `save-build.tsx:273` link hidden: `saved-build-link` visible assertion failed.

Defects found in my own draft, fixed: the research-refusal test used a start of 4 villagers (the civ starts with 6), so it returned 400 for the wrong reason and passed under the break. Fixed the start and added the control and the message assertion; I removed the `step-row` count 2 assertion because no cheap break fails it (the implementer's spec covers the row count).

## Failures

None.

## Criteria not expressible

None. The ticket's page-spec cases are covered by the implementer's `aoe4-repeat-step.spec.ts` (6 tests passed); I did not re-run its per-case mutation record.
