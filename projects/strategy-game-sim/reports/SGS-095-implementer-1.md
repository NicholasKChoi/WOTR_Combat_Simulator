# SGS-095 implementer report 1

Status: needs_spec (code done and committed; pre-existing acceptance failures on origin/main block the "npm run acceptance passes" criterion)

- Branch `sgs-095-test-hygiene`, tip `bff8a52`, base origin/main 9274372.
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-095-test-hygiene`

## Files touched
- `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts`: `MAN_AT_ARMS_STEP` is a `findIndex` over `spearLongbow.steps` (produce + man-at-arms), throws when -1.
- `lib/aoe4-build-order/schema.test.ts`: quoted-ids rows hold the site row; `run(value)` and `expected(...)` run inside the `it`; title is `'%s: a %i character value is quoted whole up to 40 characters and cut with "..." beyond'` (no `%#`).
- `lib/aoe4-build-order/simulate-house-warnings.test.ts`: deleted the "Re-pinned for villagerTarget" comment. No digest or `held` change.
- `acceptance/helpers.ts`: new `openCombatSimulator(page)`: `goto('/apps/combat-simulator')` then `waitForFunction` for an own property starting `__reactProps$` on `#fight-form`.
- `acceptance/combat-simulator.spec.ts`, `combat-simulator-battles.spec.ts`, `combat-simulator-validation.spec.ts`, `fight-api-caps.spec.ts`: call the helper in place of goto + networkidle. Note: in `combat-simulator.spec.ts` the two lines were inline in the single test, not in a `beforeEach`; replaced there.

## Doc claims
- helpers.ts comment: "A click on Fight! before React hydrates submits the form natively and reloads the page. React DOM sets a `__reactProps$` property on the form element once it attaches onSubmit; the server HTML has none." Behavior from the ticket, helper code is the check.

## Tests
- `npx tsc --noEmit`: clean. `npm run lint:dup`: no failures. `npm test`: 1495 passed, 10 skipped (48 files), no test removed.
- `git grep networkidle -- acceptance/` leaves only `openPage` in helpers.ts. `git grep "goto('/apps/combat-simulator')"` leaves only the helper. I did not run `npx next build` (test-only change, no product code).

## Mutation checks
- Schema (criterion 4), in place then reverted with `git checkout`: added to top of `checkSimInputs` a throw when `houseBuilderSource` is a string over 1000 chars. `npx vitest run lib/aoe4-build-order/schema.test.ts`: 1 failed (the `houseBuilderSource: a 5000 character value ...` row), 362 passed. Reverted.
- Spear/longbow step index, throwaway edit of the build JSON (reverted with `git checkout`). Inserted step JSON: `{ "action": "rally", "producer": "capital-town-center", "to": "sheep" }` as first entry of `steps`.
  - The pinned values on origin/main are already stale: the unmutated build on origin/main (original spec) fails 3 of 4 spec tests (see below), with startedAt 708.1502209383872 instead of 696.4094792663907. So the ticket's "passes on mutated build" could not be shown with the pins as written.
  - Substitute run: temporarily set `MAN_AT_ARMS_START_SECONDS` to 708.1502209383872 (the engine's current value), reverted afterwards.
    - New spec, unmutated build: both men-at-arms timing tests pass.
    - New spec, mutated build: both men-at-arms timing tests pass (timing unchanged, index 34 to 35 found).
    - origin/main spec (hard-coded 34), same pin, mutated build: both men-at-arms timing tests fail.
  - So the named rally step does leave timings unchanged (same 708.15 mutated and unmutated). A kings-palace rally variant gave the same value.
  - The gold-depletion test fails in all three runs, since its pin is also stale.
- Combat hydration helper: no mutation test (helper is a wait, not logic).

## Combat-simulator flake reproduction
- Command: `npx playwright test combat-simulator-battles --repeat-each=10 --workers=4` (70 tests).
- Before (origin/main acceptance files): 70 passed in 22.4s. The flake did not reproduce.
- After: 70 passed in 13.7s.
- Helper is the race fix, required even without a repro. No additional cause seen.

## Pre-existing failures (needs_spec)
- Full `npx playwright test` on this branch: 28 failed, all in AoE4 specs (contract, depletion-engine, edges, house-lead-time, house-warnings, markers, spear-longbow-build, spend-population, ...). No combat-simulator or fight-api-caps failure. The spear/longbow spec's 3 failures reproduce on origin/main's unmodified spec, so they predate this change; the pins appear stale after 9274372 (villager producers keep making villagers until 100). Fixing them means changing expected values, which the ticket puts out of scope. I changed no assertion.
- Acceptance criterion "npm run acceptance passes" cannot be met without re-pinning. Needs a spec decision: re-pin ticket or accept the 28 as baseline.

## Out-of-scope findings
- The 28 stale AoE4 acceptance failures on origin/main above (unit tests pass, so the unit pins are current).
- I found no hunk in my worktree changed by tools; `git status` clean after commit.
