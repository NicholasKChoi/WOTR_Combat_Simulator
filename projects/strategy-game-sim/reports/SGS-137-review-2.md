# SGS-137 review 2

Verdict: **APPROVE**

Branch `sgs-137-chart-view-toggles`, tip `6de222d`, base origin/main `4f369f3`. Delta review of `4c86b5b..6de222d` (rework 1), checked against review 1's single blocking finding.

## Blocking findings

None.

## Required fix from review 1

- `acceptance/aoe4-chart-views.spec.ts:30` now reads `chart(page, id).locator('text.recharts-label[transform^="rotate(-90"]')`. That is the direction from review 1 word for word, and the same selector the sibling `acceptance/aoe4-gathered-resources.spec.ts:102` uses. It matches only the rotated y-axis label, so the age-up `ReferenceLine` label (`Feudal 4:23`) no longer causes a strict-mode violation.
- No assertion that uses `yLabel` changed. Across the whole branch, the only test-file change in the delta is this one line, so the tests review 1 judged correct are unchanged.
- The implementer reports that `aoe4-chart-views` and `aoe4-chart-layout` ran with 32 passed. Per the process rules I ran no acceptance specs to confirm this.

## Rework delta (non-required changes)

`components/apps/aoe4-build-order/chart-view-toggle.tsx` acts on review 1's two non-blocking notes:
- The class is now built with `cn('btn', view.value === value ? 'btn-secondary' : 'btn-outline-secondary')`. It renders the same class strings as before (`btn btn-secondary` or `btn btn-outline-secondary`). The `import cn from 'classnames'` matches the siblings (`build-input.tsx:1`, `chart-legend.tsx:1`, `chart-header.tsx:2`).
- `onClick` now uses an `if` statement. The logic is the same: clicking the option that is already selected is still a no-op.

No other file changed.

## Spec gaps

None.

## Acceptance criteria

Review 1's evidence carries over for every criterion; the delta touches only the lines above.

| # | Criterion | Verdict |
|---|-----------|---------|
| 1 | Toggle static markup | pass (unit test re-run: passes) |
| 2 | Gather rates Playwright | pass (by reading) |
| 3 | Units produced Playwright | pass (by reading) |
| 4 | Collapsed toggle works | pass (by reading): the strict-mode failure at `:164` is fixed by the narrowed `yLabel` |
| 5 | Reload resets defaults | pass (by reading): `:180-181` fixed by the narrowed `yLabel` |
| 6 | Per-view series selection, Vitest | pass (re-run: passes) |
| 7 | Pinned run from drawn lines | pass (by reading) |
| 8 | `buildingSeries` mapping and order; `perVillagerSeries` gone | pass |
| 9 | No Per villager references; old spec deleted; helpers in one file | pass |
| 10 | Keyboard Enter/Space | pass (by reading) |
| 11 | Docs | pass (the delta changes no docs) |
| 12 | tsc, lint:dup, npm test, next build, specs pass | pass for tsc and lint:dup (re-run on `6de222d`: tsc clean, 0 clones in both jscpd configs). The specs pass on the implementer's report only (32 passed); I did not run them. |
| 13 | No invariant regressions | pass |

## Invariants touched

- A1, A2, A3: hold. The delta touches no simulation, lib or API path.
- S1: holds. The only new import is `classnames`, which is already used throughout the directory.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are both empty, so no bot ran.

## UI inspection

Skipped in delta mode. The delta's only UI change is how the class string is built, and it renders the same classes as the tip that review 1 inspected at 375, 390, 700, 768 and 1280 px.

## Non-blocking notes

None.

## Coverage

- I reviewed the delta `4c86b5b..6de222d` (2 files) and checked the whole-branch test-file diff for changes outside the delta: there are none.
- I ran `commands.lint` (`tsc --noEmit && npm run lint:dup`) and Vitest on `chart-view-toggle.test.ts` and `result-series.test.ts` (2 files, 16 tests passed). Both ran in the task worktree, which was still clean afterwards.
- I ran no acceptance or browser tests.
- The review worktree was removed.
