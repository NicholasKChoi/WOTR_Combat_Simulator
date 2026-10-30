# SGS-015 review

Verdict: **REQUEST CHANGES** (one blocking finding, trivial to fix)

Reviewed: branch sgs-015-aoe4-series-chart at 7f57bdc (local only; `origin/sgs-015-aoe4-series-chart` does not exist yet),
base main 43a0331. Full review, detached worktree `worktrees/review-sgs-015-aoe4-series-chart` (removed afterwards).

## Blocking findings

1. `package-lock.json:2` - convention (shipped-artifact hygiene) - the lock's root `"name"` changed from
   `"WOTR_Combat_Simulator"` to `"sgs-015-aoe4-series-chart"`. `package.json` has no `name`, so npm took the
   implementer's worktree directory name. That puts the branch name (with the ticket id) in a shipped file, and the
   next `npm install` from an ordinary checkout flips it back, so every later lock diff churns. Every earlier lock
   commit (96d2602, 0b985f3) kept `WOTR_Combat_Simulator`. Fix: set line 2 back to `"name": "WOTR_Combat_Simulator",`.
   Nothing else in the lock needs to change; the other edits are additive recharts entries plus the expected
   `dev` -> `devOptional` flips on `@types/react` and `csstype`.

## Spec gaps

None.

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| recharts 3.10.1 exact, lock resolves it, `npm ci` ok, existing versions unchanged | pass (lock `name` aside, see finding 1) | `git grep -n recharts -- package.json` -> `package.json:17: "recharts": "3.10.1"`; `npm ci` clean, 0 vulnerabilities; lock diff has no `-` version lines; new entries are recharts plus its transitive deps (redux toolkit, d3-*, react-is, victory-vendor, ...) |
| `tsc --noEmit` 0 and `next build` ok | pass | both run in the review worktree: tsc exit 0, next build succeeded (local Node 22, not 24.x) |
| `toChartRows` cases | pass | chart-rows.test.ts:5-19 match the criterion literally; code chart-rows.ts:7-13 |
| `formatMinSec` 0/5/65/3600 | pass | chart-rows.test.ts:22-26 |
| Palette (>=15, distinct, wrap) | pass | 17 colors, chart-rows.ts:21-26; tests chart-rows.test.ts:28-40 |
| `toggleHidden` cases, no mutation | pass | chart-rows.ts:32-36 (copy, then delete-or-add); tests chart-rows.test.ts:42-52 |
| `npm test` runs `components/**`, no `vitest.config.ts` | pass | 6 files / 71 tests pass; `git ls-files 'vitest.config.*'` -> only `vitest.config.mts` |
| SSR render has testid and title, with and without series | pass | line-chart.test.ts:11-22 |
| Manual selector check | pass (re-run by the reviewer) | throwaway page under `next dev`, Chromium, 3 series: curves `a:#1f77b4 b:#ff7f0e c:#2ca02c` as `path.recharts-line-curve[data-series]`; 0 `.recharts-line-dot`; legend text Alpha/Beta/Gamma; click Beta -> curves a,c, `li.recharts-legend-item.inactive` = Beta; click again -> all 3 back, 0 inactive; no console warnings or errors. Matches design/M2.md. Recording it in the PR description is the PR step's job. |
| Business logic < 150 lines | pass | 36 + 45 lines including blanks |
| No diff under `lib/aoe4-build-order/`, `pages/`, `acceptance/`, design docs | pass | diff stat: 4 new files under `components/apps/aoe4-build-order/`, package.json, package-lock.json, vitest.config.mts |
| No invariant regressions (S1) | pass | line-chart.tsx imports react, recharts, ./chart-rows; chart-rows.ts imports nothing |

Not ticked in the ticket because the verdict is not APPROVE.

The implementer could not see the m:ss tick text. I confirmed it: x ticks render `0:00 1:15 2:30 3:45 5:00`, the tooltip
label renders `2:30`, and the y-axis label renders `Units`.

## Invariants touched

- S1 (apps independent): holds. No cross-app imports.
- A1-A3: not touched. No simulation code; the palette is a UI color list, not game data.
- S2/S3: no page and no numeric input added.

## Linter

`npx tsc --noEmit` (the configured lint): 0 issues.

## Bot reconciliation

`reviewBot.cli` is empty and there is no `rulesFile`, so no bot ran.

## Conventions

- New `.ts`/`.tsx` files use 4-space indentation, single quotes and no semicolons, like `lib/combat-simulator/army.ts`.
  The tests use `describe`/`it`/`it.each` like `lib/combat-simulator/army.test.ts:1-20`. The legacy `.js` components use
  a different style, and ARCHITECTURE.md says new files are TS.
- Placement follows ARCHITECTURE.md and design/M2.md Modules (`components/apps/aoe4-build-order/`).
- The heading is `<h3 className="h5">`, a Bootstrap utility, as the repo conventions allow; `results.js:57` uses `<h4>` for
  section titles. This is styling, which the ticket leaves to the implementer.

## Correctness

No blocking issues. Checked: `toggleHidden` never mutates its input; the legend click is a functional update
(`setHidden(h => ...)`), so it does not read a stale closure; `hide={hidden.has(s.key)}` has the right polarity
(confirmed in the browser); `seriesColor` uses `%` on non-negative indexes; `formatMinSec` rounds before splitting,
so 59.6 becomes `1:00` and never `0:60`.

## Non-blocking notes

1. Tick selector for later Playwright work (SGS-022 / designer): on 3.10.1 the axis tick `<text>` elements are not
   descendants of `.recharts-xAxis` / `.recharts-yAxis` (those groups have no text). They render in a z-index layer as
   `g.recharts-cartesian-axis-tick-label text`. That is why the implementer's probe found no ticks. design/M2.md does
   not name a tick selector, so nothing changes in this ticket. Any spec that asserts m:ss ticks should use the
   tick-label class.
2. `line-chart.tsx:17` `useState<Set<string>>(new Set())` builds a throwaway Set on every render. `useState(() => new Set<string>())`
   avoids that. Trivial.
3. `formatMinSec` gives odd output for negative input (`-65` -> `-2:0-5`). Times are non-negative by contract, so this
   is only a note.
4. `line-chart.test.ts:6` could type the parameter as `ChartSeries[]` instead of `Parameters<typeof SeriesChart>[0]['series']`.
5. The "with series" SSR test cannot tell a chart with series from one without, because `ResponsiveContainer` SSR is
   empty. The ticket (Scope 5) and design accept this, and SGS-022 covers it.

## REPO.md review checklist

- Every diff: `next build` run and passed. No page is touched; the component was loaded under `npm run dev` through a
  throwaway page (not committed, deleted) and its user flow exercised (render, hover tooltip, legend hide/show).
- No path-specific section covers `components/apps/aoe4-build-order/**`; Shared code / Combat / Starcraft do not apply.

## Coverage

Files reviewed: `components/apps/aoe4-build-order/{chart-rows.ts,chart-rows.test.ts,line-chart.tsx,line-chart.test.ts}`,
`package.json`, `package-lock.json` (header, root package, every removed line, list of added packages),
`vitest.config.mts`. Not reviewed: each transitive lock entry's integrity hash (npm ci verified them). Node 24.x
was not available, so builds ran on local Node 22.
