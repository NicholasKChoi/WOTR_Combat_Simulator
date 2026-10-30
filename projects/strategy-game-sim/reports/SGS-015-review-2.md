# SGS-015 review 2 (re-review after Rework 1)

Verdict: **APPROVE**

Reviewed: branch sgs-015-aoe4-series-chart at 0b6419f (local only; `origin/sgs-015-aoe4-series-chart` still does not
exist), base main 43a0331. Full review: the Rework 1 fix was checked directly, and findings for unchanged code come from
reports/SGS-015-review.md, which reviewed 7f57bdc. Work was done in a fresh detached worktree
`worktrees/review-sgs-015-r2` at 0b6419f, removed afterwards.

## Rework 1 fix

- `git log 43a0331..0b6419f` lists 7f57bdc (the commit reviewed before, same hash) and 0b6419f "Restore package-lock root name".
- `git diff 7f57bdc 0b6419f` is a one-line change to `package-lock.json`: `"name": "sgs-015-aoe4-series-chart"` ->
  `"name": "WOTR_Combat_Simulator"`. No other file or line changed.
- `git diff 43a0331 -- package-lock.json | grep '"name": "sgs-'` prints nothing (exit 1). Rework acceptance passes.
- `npm ci` in a fresh worktree did not rewrite the lock (`git status` clean afterwards), so the name is stable.
- The commit message has no ticket id or PR number.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

All pass. The evidence from review 1 still holds, because no source, test, config or package.json line changed after 7f57bdc:

| Criterion | Result | Evidence |
|---|---|---|
| recharts 3.10.1 exact, lock resolves it, `npm ci` ok, existing versions unchanged | pass | re-run: `npm ci` added 117 packages, clean; lock name restored |
| `tsc --noEmit` 0, `next build` ok | pass | tsc re-run at 0b6419f: exit 0. next build passed at 7f57bdc (review 1); the only change since is the lock's root `name`, which does not affect the build |
| `toChartRows` | pass | review 1; tests re-run green |
| `formatMinSec` | pass | review 1; tests re-run green |
| Palette | pass | review 1; tests re-run green |
| `toggleHidden` | pass | review 1; tests re-run green |
| `npm test` includes `components/**`, no `vitest.config.ts` | pass | re-run: 6 files / 71 tests pass |
| SSR render | pass | review 1; test re-run green |
| Manual selector check | pass | review 1 (reviewer re-ran it in Chromium); component unchanged |
| Business logic < 150 lines | pass | 36 + 45 lines |
| No diff under lib/aoe4-build-order, pages, acceptance, design docs | pass | `git diff 43a0331 --stat`: 7 files, same set as before |
| No invariant regressions | pass | review 1 |
| (rework 1) lock name restored, no other lock change | pass | see above |

All of these are ticked in the ticket, including the two Rework 1 fix items.

## Invariants touched

S1 holds: no cross-app imports. A1-A3, S2 and S3 are not touched. This is unchanged from review 1.

## Linter

`npx tsc --noEmit`: 0 issues at 0b6419f.

## Bot reconciliation

`reviewBot.cli` is empty and there is no rulesFile, so no bot ran.

## Non-blocking notes

These are carried over from review 1 and are still open. None blocks the merge:
1. Axis tick text renders as `g.recharts-cartesian-axis-tick-label text`, not under `.recharts-xAxis`. This matters for the selectors in SGS-022's Playwright specs.
2. `line-chart.tsx:17` could use the lazy form `useState(() => new Set<string>())`.
3. `formatMinSec` gives odd output for negative input. Times are non-negative by contract.
4. `line-chart.test.ts:6` could type its parameter as `ChartSeries[]`.
5. The SSR "with series" test cannot tell a chart with series from one without. The ticket accepts this, and SGS-022 covers it.

## Coverage

Checked: the 0b6419f diff, the lock header, the rework acceptance grep, `npm ci`, `tsc` and `npm test` at 0b6419f.
All other files are byte-identical to 7f57bdc and were covered in review 1. `next build` was not re-run, for the reason
given in the table. Node 24.x was not available; local Node 22 was used.
