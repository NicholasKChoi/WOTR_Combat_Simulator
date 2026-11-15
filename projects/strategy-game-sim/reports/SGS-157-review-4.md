# SGS-157 review 4 (delta mode, rework 3)

- Branch: sgs-157-buildings-chart-overlap, tip 2ab6c10925a781909380971573dc573e485423a4
- Delta: 134c9a9..2ab6c10. I bounced 134c9a9 in review 3, so this review checks only that the Required fix landed and that the change touches nothing else.
- Scratch: worktrees/review-sgs-157-buildings-chart-overlap (removed after this report)

## Verdict: APPROVE

## Required fix (Rework 3): landed

The fix asked for one file-level `lineEndYs(page, id, keys)` helper with a single `chart.evaluate`, used in all three Buildings tests, with the pinned test's three equalities in `toPass()`, no assertion changes, and no other copy of the end-y parse.

- **Helper:** `acceptance/aoe4-chart-views.spec.ts:36-44` sits next to `line`. Its body is the old body of :186-191, and it reads every key in one evaluate.
- **Test at :180:** now uses `lineEndYs(page, UNITS, ['capital-town-center', 'barracks'])` (:197). Its assertions are unchanged.
- **Hide test:** `gap()` (:212-215) reads both paths in one call. `before` and the `expect.poll(gap)` after the click are unchanged.
- **Pinned test:** reads all four keys in one call inside `expect(async () => {...}).toPass()` (:236-246). The same three assertions are kept: pinned barracks equals barracks, pinned town center equals town center, and pinned barracks differs from pinned town center. The two `toHaveCount(1)` waits are kept before it.
- **No other copy of the parse:** `grep 'match(/-?[\d.]+'` finds exactly one, at :40.
- **Scope:** only `acceptance/aoe4-chart-views.spec.ts` changed. No production code and no other test changed.

## Can the tests still fail?

- **Missing path:** the helper returns `NaN` for a missing path, where the old `line().evaluate` threw. The tests still cannot pass because of this:
  - Both pinned-test paths are first awaited with `toHaveCount(1)`.
  - The third pinned assertion fails on NaN vs NaN, because `toBe` uses `Object.is`.
  - In the hide test, `before > 0` fails on NaN.
- **The mutations named in review 3 still apply:**
  - `chart-rows.ts:67` using `offsets[key]` breaks the pinned test.
  - Dropping the hidden filter at `chart-rows.ts:55` breaks the hide test's poll.
- **`toPass()` with no timeout:** this matches the five other uses in this spec (:86, :120, :133, :183) and in the sibling specs. A failing mutation still fails, at the test timeout of 60 s (`playwright.config` :25).

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

- No criterion is tagged for rework 3. The fix is test-only and changes no assertion.
- All criteria stand as recorded in review 2 (5d97056) and review 3 (134c9a9). The delta changes no production code.
- Invariants A1-A3: the delta does not touch them, and they still hold.

## Lint

- `npx tsc --noEmit`: exit 0.
- `npm run lint:dup`: 0 clones, for both the source and test configs.

## Bot reconciliation

REPO.md has `reviewBot.cli: ""`, so the bot did not run and there are no bot findings.

## Non-blocking notes

- `keys: string[]` could be `readonly string[]`. Every caller passes a literal array, so nothing changes.

## Coverage

- **Reviewed:** the full delta, and the test files across the branch. Since review 3, the only test change is this delta, and it deletes or weakens no test.
- **UI inspection:** not run, because the delta changes no rendered UI.
- **Acceptance and browser tests:** none run (role rule).
