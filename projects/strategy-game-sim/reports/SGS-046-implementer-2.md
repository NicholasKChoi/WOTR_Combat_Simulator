# SGS-046 implementer 2 (rework 1)

- Ticket: SGS-046, rework 1 (review report `reports/SGS-046-review-1.md`)
- Branch: `sgs-046-aoe4-step-table-editor`
- Tip: `923cbb6f12f2ccc93d8e7f02090edf1e57139c09` (one new commit on top of 4652ca9; base main 835aceb, not rebased)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-046-aoe4-step-table-editor`

## Required fixes (all ticked in the ticket)

1. The `rally` action's `to` select has no empty option now. The list of select fields that offer an empty choice moved into the model as `offersEmptyChoice(action, field)` in `step-table-model.ts`. The only entries are `produce.rally`, `build.then` and `research.at`. `step-table.tsx` dropped the `optional` flag from `pick`, and `allowEmpty` now comes from `offersEmptyChoice`.
2. The test "only swaps the producer on pause and rally" now also asserts the `rally` case (`capital-town-center` -> `town-center`, with `to` kept).
3. Number drafts that are not safe integers are rejected. The new `parseUnsigned` helper is used by both `setNumberField` and `setTriggerNumber`; it applies `/^\d+$/` and then `Number.isSafeInteger`.

## Files touched

- `components/apps/aoe4-build-order/step-table-model.ts`: adds `offersEmptyChoice` and `parseUnsigned`. Both number setters now use `parseUnsigned`.
- `components/apps/aoe4-build-order/step-table.tsx`: the empty choice now comes from `offersEmptyChoice`, and `rally.to` no longer gets one.
- `components/apps/aoe4-build-order/step-table-model.test.ts`: adds the rally assertion, the safe-integer tests and the empty-choice tests.

## Tests

- `step-table-model.test.ts`: 57 passed (16 of them new).
  - "empty select choice" is a property test over every string select field of one filled step per action (12 pairs). For each pair, `offersEmptyChoice` must equal whether `parseBuildOrderText(formatBuildOrderText(...))` still parses after the field is cleared. Invariant: an empty choice is offered only where clearing the field keeps the text parseable. There is also a direct check that `rally.to` is false and `produce.rally` is true.
  - The safe-integer tests reject `9007199254740992` and a 22-digit draft on an optional field, on `move.count` and on trigger `seconds`. `9007199254740991` is still accepted.
- `npm test`: 39 files, 1053 tests, all passed (Node 24.22.2; also passed on Node 22).
- No pre-existing test assertion was edited. The pause/rally test only gained an assertion, as the rework allowed.

## Mutation checks (each run against the committed code, then reverted with `git checkout`, tree clean afterwards)

- `OPTIONAL_SELECTS` gains `rally: ['to']`: 2 tests fail (the property test on rally.to and "is not offered on the rally action target").
- `changeProducer` returns a `rally` step unchanged: "only swaps the producer on pause and rally" fails.
- `parseUnsigned` accepts any non-NaN value (safe-integer check dropped): both "not a safe integer" cases fail.
- The `allowEmpty` wiring in `step-table.tsx` is not covered by a unit test (vitest only includes `*.test.ts`, with no component harness). Playwright acceptance owns the component.

## Codegen, build, lint

- codegen: not set.
- `npx tsc --noEmit`: clean (Node 24). `npm run lint:dup`: 0 clones.
- `npx next build`: succeeded. `grep -rl byBaseId .next/static` is empty.
- `npm run acceptance`: not run (the acceptance-test gate owns it).
- Diff vs 4652ca9 touches only the 3 files above. No lockfile or unrelated changes.

## Invariant check

- A1 holds. The new `OPTIONAL_SELECTS` holds only field names from the `BuildStep` shape, not game ids or rates.
- A3 holds. All new functions are pure.
- S1 holds. No new imports.

## Out-of-scope findings

- Ticket wording (from the review): respec 2's "Selecting the empty option in the `then` (build), `to` (rally) and `at` (research)" should say `rally` (produce). The code now follows the model and the validator.
- Environment: the default shell Node is v22.17.0, but the repo needs 24. Use `nvm use 24` (installed: 24.22.2).

## Status

`needs_review`
