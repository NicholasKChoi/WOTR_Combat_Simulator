# SGS-211 implementer report 5

Status: needs_review

- Ticket: SGS-211. Branch `sgs-211-repeat-paste-text-and-table-field`, tip `6fdb74d10abb29a8b51f447e46edc33d30daa501`, base `origin/main` (29bb8f0).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-211-repeat-paste-text-and-table-field` (new checkout, so no own-commit check applied).

## Files touched
- `lib/aoe4-build-order/parse-text.ts`: `parseAction` reads an optional trailing `COUNT` token as `repeat` for every action but `produce`, then the existing `t.end()`; `repeatWord` and `formatAction` print `x<repeat>` last on build, move, research, pause, rally.
- `components/apps/aoe4-build-order/step-table.tsx`: `num('repeat')` last in `actionFields` for build and move.
- `components/apps/aoe4-build-order/step-table-model.ts`: `changeAction` keeps `repeat` when the new action is in `REPEATABLE_ACTIONS`. `setNumberField` needed no change (confirmed by the page spec: empty removes, letters leave the step, `0` sets it).
- `lib/aoe4-build-order/parse-text.test.ts`, `components/apps/aoe4-build-order/step-table-model.test.ts`, `lib/aoe4-build-order/saved-builds.test.ts`: new rows.
- `acceptance/aoe4-repeat-step.spec.ts`: new, 6 tests.
- `docs/aoe4-build-order-format.md`, `docs/aoe4-build-order-ui.md`: docs made untrue.

## Tests
- `npm test`: 94 files passed, 1 skipped; 3067 passed, 15 skipped, 0 failed.
- The three touched unit files together: 355 passed before the later removal of three rows.
- Invariants encoded (A3): same text gives same steps (round trip with repeat for build, move, research, triggered, reaction); `xN` is a repeat only in the last slot of a non-produce line; produce is unchanged; `changeAction` keeps `repeat` only for build and move.
- Acceptance spec `acceptance/aoe4-repeat-step.spec.ts`: run with `acceptanceSetup` first, then `npx playwright test acceptance/aoe4-repeat-step.spec.ts --reporter=line` through run.sh: 6 passed (final run on the committed tree).
- Pre-existing tests edited: none. New rows were added to `parse-text.test.ts` (the rejects-as-syntax table, `representable` round-trip order, `formatBuildStep` table) and `step-table-model.test.ts` (`changeAction`, `everyForm` round trip). The existing `x3`-after-`walk`/`->` produce rows stay as they were.

## Doc claims
- format doc, table: `pause <producer>[#k] [xN]`, `build ... [walk Ns] [xN]`, `research ... [xN]`, `move ... [xN]`, `rally ... [xN]`; true per `parseAction` (reads trailing COUNT for non-produce) and `formatAction`.
- format doc, example block gains `build farm from wood walk 3s x4`; parsed by the `x9`-style parse rows (`parseBuild` plus trailing repeat).
- "`walk Ns` is the keyword `walk`, a space, an integer, and `s` with no space (`walk 6s`). On a `produce` line it is always last. On a `build`, `move` or `rally` line it is last except for a trailing `xN`." True per `parseProduce` (walk, then `t.end()`) and `parseAction`.
- Trailing-`xN` bullet (last token, after `walk Ns`; `x9 walk 3s` and `x9 x2` are `syntax`; `research`/`pause`/`rally` parse then `invalid`; `x0`/`x201` `out-of-range`; `x09` prints `x9`; node/id reading; produce keeps count only): each clause is a row in `parse-text.test.ts` ("rejects ... as syntax", "parses ... with the trailing xN...", "parses x0/x201", "reports a node x9 as unknown-id and a repeat on research as invalid").
- ui doc: "`repeat` on build and move" in the optional-fields list, and "Changing a row's action to build or move keeps its Repeat value; changing it to another action drops it." True per `changeAction` and its tests. The open-flag bullets are unchanged.
- `page-help.tsx` lists no text forms or fields (grep for `xN` and `repeat` found nothing); unchanged.

## Pinned outputs
None.

## Mutation checks (each break undone by the script, which restores the original file; tree verified clean before commit)
Unit (`parse-text.ts` breaks, failing rows named):
- Read repeat on produce too (drop the produce exclusion): the five `produce ... x2/x3` reject rows failed.
- Never read repeat: all `parses ... trailing xN` rows, the round trip, `saved-builds` accepts-a-repeat, and the `x0`/`x201` rows failed.
- Store as `count` instead: same rows failed.
- Skip repeat per action (`research`, `pause`, `rally`, `build`, `move` one at a time): that action's parse row (and the round trips for research, build, move) failed.
- Reject `COUNT` in `node()`: `move 3 sheep to x9`, `build farm from x9`, `build farm from wood then x9` and the unknown-id test failed.
- Drop `repeatWord` per action: pause, build (3 rows), research, move, rally each failed that action's `formatBuildStep` row; `x1` printed as nothing failed the `x1` row.
- Position rules: swallow a second `xN` failed `x9 x2`; accept `xN` after the building id failed `x9 from wood`; accept it before `then` failed `x9 then farm`; accept it before `walk` failed `x9 walk 3s`.
- `COUNT` variants: `[xX]` failed `X9`; `x(\d*)` failed `x 9`; `x(-?\d+)` failed `x-1`; decimals failed `x1.5`; `[1-9]\d*` failed `x09` and `x0`.
- Produce count stored as `repeat`: the produce-count row and many existing rows failed.
- `step-table-model.ts` `changeAction`: keep for all actions failed the four drop rows; keep for none failed `build to move`; drop the `!== undefined` guard failed `adds no repeat key`; `action === 'build'` only failed `build to move`.
- Three round-trip edit rows I first added to `everyForm` edits (changeAction to move, clear, set 12) could not be failed by any break, so they were deleted. The three added `everyForm` steps are failed by the parse and print breaks above.

Acceptance spec (production breaks, spec run each time):
- Field not offered on build: 3 tests failed; not on move: the offers test failed; offered on produce, research, rally, pause (one run each): the offers test failed on its `toHaveCount(0)`.
- `<details open>`: closed-list assertions in tests 1 and 2 failed. `data-copy={i}`: test 1 failed. Copy item reusing `step-finished`: test 1's `toHaveCount(1)` failed. `done` counts `waiting`: `n of 3 done` and `n of 2 done` assertions failed. `steps.concat(steps)` in the table: the row-count assertion failed.
- Summary `onClick` preventDefault: the Enter/Space and click assertions failed. Summary `tabIndex={-1}`: the Shift+Tab/Tab focus assertion failed.
- Letters treated as 0: the letters assertion failed. Empty draft ignored: the clear assertion failed. `changeAction` keeping repeat for all: the research-line regex failed. `hasOptionalField` ignoring repeat: the starts-open tests failed (a first attempt on `openFlags` did not fail because pasted text reaches the table through `mergeExternalEdit`, so I broke `hasOptionalField` instead).
- `repeat: bound(0, 200)` in `schema.ts`: the `0` out-of-range assertion failed. Drop `repeatWord` for build: the set-to-2 line assertion failed.
- Span covers one copy (`sourceSpan([result.steps[activeStep]], 0, ...)` in `results.tsx`): the hover test's span equality failed. Row `onPointerEnter` set to null: hover test failed. Gutter annotation `onPointerEnter` set to null: hover test failed (text-view part).
- Hover test run-state setup: the build text uses `start 4 sheep 2 wood` because with no wood gatherers the first house waits through the whole run, which left no started copy.

## Build, lint
- `codegen`: none set. `npx tsc --noEmit` clean; `npm run lint:dup`: 0 clones; `next build` succeeded.

## Deviation from the ticket
- The ticket says the copy-list summary is "reachable by Tab from the row's controls". In the table the run cell is the first cell of the row, so the summary comes before the row's controls. The spec asserts Shift+Tab from the trigger select lands on the summary and Tab from the summary lands on the select. Say if review wants the other order.

## Invariant check
- A3 upheld: no randomness or clock use; the same text gives the same order. Other invariants: none touched.

## Unverified assumptions added
None.

## Out-of-scope findings
None.

## Status
needs_review
