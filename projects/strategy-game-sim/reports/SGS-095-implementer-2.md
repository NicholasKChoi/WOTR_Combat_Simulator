# SGS-095 implementer report 2

Status: needs_review

- Branch `sgs-095-test-hygiene`, tip `a857539`, rebased onto sgs-098 `4ac6a6a` (only the one own commit replayed; old tip bff8a52).
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-095-test-hygiene`

## Rebase
- Conflicts: `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts` (took SGS-098's version; this branch's `findIndex` edit discarded) and `acceptance/helpers.ts` (SGS-098 removed `finalCount`; kept only `openCombatSimulator`).
- Item 1 and criteria 1-2 dropped: `git grep MAN_AT_ARMS_STEP` finds nothing after SGS-098 deleted every test using it and the constant. No men-at-arms mutation run was needed.

## Files touched (vs 4ac6a6a)
- `acceptance/helpers.ts`: new `openCombatSimulator(page)`.
- `acceptance/combat-simulator.spec.ts`, `combat-simulator-battles.spec.ts`, `combat-simulator-validation.spec.ts`, `fight-api-caps.spec.ts`: call the helper instead of goto + networkidle.
- `lib/aoe4-build-order/schema.test.ts`: quoted-ids rows run `run(value)`/`expected` inside the `it`; title has no `%#`.
- `lib/aoe4-build-order/simulate-house-warnings.test.ts`: deleted the stale "Re-pinned for ..." comment; no digest/held change.

## Doc claims
- `acceptance/helpers.ts:openCombatSimulator` comment: "A click on Fight! before React hydrates submits the form natively and reloads the page. React DOM sets a `__reactProps$` property on the form element once it attaches onSubmit; the server HTML has none." The helper waits on exactly that property.

## Results
- `npm test`: 48 files passed, 1511 passed, 10 skipped. `npx tsc --noEmit` clean. `npm run lint:dup` no failures. `next build` not run (test-only change).
- `git grep networkidle -- acceptance/`: only `openPage` in helpers.ts. `git grep "goto('/apps/combat-simulator')" -- acceptance/`: only the helper.
- `npm run acceptance`: run 1 had 733 passed, 1 failed: `aoe4-small-screen.spec.ts:42` "run bar at 360x760 > scrolls away with the page and a run scrolls the results heading into view" (untouched AoE4 spec, not in a file this ticket edits). It passed 5/5 alone (`--repeat-each=5`, 40 tests passed), and a second full `npm run acceptance` on the same tip was fully green: 734 passed. So the test looks flaky under full-suite load. Worth a backlog note; not fixed (out of scope).

## Mutation check (schema)
- Added to the top of `checkSimInputs` a throw for a `houseBuilderSource` string over 1000 chars: `npx vitest run lib/aoe4-build-order/schema.test.ts` gave 1 failed (`houseBuilderSource: a 5000 character value is quoted whole up to 40 characters and cut with "..." beyond`), 378 passed. Reverted with `git checkout`; tree clean.

## Flake reproduction
- Command: `npx playwright test combat-simulator-battles --repeat-each=10 --workers=4` (70 tests).
- Before (acceptance files from 4ac6a6a): 70 passed in 22.4s; the flake did not reproduce.
- After: 70 passed in 13.9s.
- The helper is the race fix, kept even without a repro. No additional cause seen.

## Out-of-scope findings
- `acceptance/aoe4-small-screen.spec.ts:42` failed once in a full run (see above), passes alone and on rerun.
