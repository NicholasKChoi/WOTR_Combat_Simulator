# Tech-lead: batch SGS-157-SGS-157 (run 2)

## Decision

PASS - opened one draft PR.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/169 - base `main` - head `sgs-157-buildings-chart-overlap` at 2ab6c10925a781909380971573dc573e485423a4 (pushed with a plain push as a new branch; no new commits, no force).

### Merge risk (verbatim from #169)

**low** - display-only change to one chart view; no public surface (API, schema, CLI, config), no critical-path symbol, a revert fully undoes it, and unit and page tests pin the offsets, axis and tooltip counts.

### Review focus (verbatim from #169)

- [`components/apps/aoe4-build-order/chart-rows.ts:61-76`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/169/files#diff-7c4a32e04022da532daa5f9233b505f3bad251f805198115326d375507bdacc1R61-R76) - the tooltip recovers the true count by rounding the drawn value, so an offset of half a building or more (a larger `MAX_LINE_OFFSET`, or a slot formula change) would show a count one too high for the upper buildings - check every offset stays below 0.5 and that `lift` leaves non-number values unchanged - pinned by [`chart-rows.test.ts`: lineOffsets / toOffsetChartRows / trueCount](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/169/files#diff-faab6897fb3a3e012eff3fbdd8c861ff3b379966d0fc22a32906686ccd36a058R184-R283)
- [`components/apps/aoe4-build-order/chart-rows.ts:87-95`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/169/files#diff-7c4a32e04022da532daa5f9233b505f3bad251f805198115326d375507bdacc1R87-R95) - a top below the highest drawn value would clip the highest building's line off the chart, and non-whole ticks would read as fractional buildings - check the top is the ceiling of the highest visible drawn value and hidden keys are ignored - pinned by [`chart-rows.test.ts`: wholeNumberAxis](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/169/files#diff-faab6897fb3a3e012eff3fbdd8c861ff3b379966d0fc22a32906686ccd36a058R255-R274)

Preview checks: three, one for each of the ticket's Unverified assumptions (the tooltip shows true whole counts, the legend still hides and restores the offset line by key, and the y ticks are whole numbers only).

## Blocker from run 1, re-checked

- `lift` (`chart-rows.ts:63-71`) now passes a non-number value through unchanged (`offset === undefined || typeof value !== 'number' ? value : value + offset`). Rework 2's correction holds against the code: `toChartRows` leaves current keys out of pinned-only rows, so the trigger I reported in run 1 (a longer pinned run) did not produce `NaN`. Only a series with fewer values than `times` did. `chart-rows.test.ts:243-253` pins both cases (`rows[3].b` is undefined). The guard is defensive, and the blocker is closed.
- Rework 3: `lineEndYs` (`acceptance/aoe4-chart-views.spec.ts:36-44`) reads every requested path in one `evaluate`. All three Buildings tests use it, and the pinned comparison is wrapped in `toPass()`. This satisfies the LESSONS.md rule for `acceptance/**`.

## Other checks (no flag)

- Invariants A1-A3 and S1-S3: display only. No change under `lib/`, `data/` or `pages/api/`. `MAX_LINE_OFFSET` is a drawing constant, not a game number.
- Irreversibility, security, concurrency: none.
- Contract: `SeriesChart` gains an optional `offsetLines` prop that defaults to false. With it off, `YAxis` gets `domain`/`ticks` undefined and the Tooltip formatter is unchanged.
- criticalPaths: none touched.
- Open questions: PROJECT.md has none.
- Base drift: origin/main moved e50e074 -> 8f01a8c (#166, #167, #168). `git merge-tree --write-tree origin/main HEAD` merges cleanly. Both sides edit `docs/aoe4-build-order.md`, but in separate hunks. #168 changes house planning in `lib/aoe4-build-order` and does not touch `productionBuildingSeries` or the chart components. The Buildings acceptance tests assert their data preconditions (counts per building), so a data shift fails loudly instead of passing vacuously. Acceptance-test 2 ran on 2ab6c10 (fork e50e074). Suite 2 reports PASS at tip 2ab6c10 against base 8f01a8c.
- Stack check: one branch, and its diff against origin/main contains only this task.

## What I reviewed

- Range: `e50e074..2ab6c10` (6 commits: c8cb3b3, 5d97056, a38608c, 57d342a, 134c9a9, 2ab6c10).
- Files (added/removed): `chart-rows.ts` +54/-1, `line-chart.tsx` +15/-4, `results.tsx` +1, `docs/aoe4-build-order.md` +1, `chart-rows.test.ts` +102/-1, `acceptance/aoe4-chart-views.spec.ts` +103/-4. Hand-written production logic: +70/-5.

## Non-blocking notes

- The PR stack footer uses marker `cf-stack` from PROJECT.md `stackMarker`. Earlier PRs (for example #165) used `code-factory-stack`.
- The `lineEndYs` regex takes the last number of the path `d`. That is correct for recharts' linear path, but it would mislead silently if the curve type changed. Acceptable.

## Cleanup

Scratch checkout `tech-lead-SGS-157-SGS-157` is removed after this report is written. The result is in the handback.
