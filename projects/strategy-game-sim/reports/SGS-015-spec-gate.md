# SGS-015 spec gate

Verdict: NEEDS_SPEC

## Gaps

1. Scope item 4 - names `vitest.config.ts`, which SGS-012 renames to `vitest.config.mts` (SGS-012 item 5c; the file
   exists as `vitest.config.mts` in the worktree at 623a5ff, with include `['utils/**/*.test.ts','lib/**/*.test.ts']`).
   Also the Scope header lists `vitest.config.ts` as an edited file. An implementer on the post-SGS-012 stack will not
   find the file and may recreate it, giving two configs. Fix: say `vitest.config.mts` in the header, item 4 and the
   Risk comment.
2. Criterion "palette has >= 15 distinct colors, a 16-series chart gets a defined stroke for every series" - not testable
   as written. SSR of `ResponsiveContainer` renders an empty div (the ticket's own criterion says so), so no `Line` or
   stroke reaches `renderToString` output, and `PALETTE` is not exported. An implementer would write a test that cannot
   fail, or skip it. Fix: export `PALETTE` (or a pure `seriesColor(index)` in `chart-rows.ts`) and test distinctness,
   length >= 15, and `seriesColor(15)` / `seriesColor(16)` wrap-around in `chart-rows.test.ts`.
3. Gating on design/M2.md (check 5 and 9) - design/M2.md "Charts" still pins Recharts 2.15.4 (lines 11-18, 210) and says
   to install `recharts@2.15.4`; the ticket installs 3.10.1. Its selector contract is "verified on 2.15.4". The ticket
   resolves the conflict only in prose under `On merge`, which is not a machine-visible dependency: nothing in
   TASK-GRAPH stops this ticket from being picked up as soon as SGS-012 merges, before the designer updates the doc.
   `owner`/manager: either make the designer's M2.md update an explicit dependency (a ticket or a TASK-GRAPH hold) or land
   the doc change first, so the ticket is not started against a contradicting design. Also move the gating sentence out
   of `On merge` (it is not a merge update; `On merge` should read `none`) into `Depends on` or Context.
4. Criterion on component-source behavior (`dot={false}`, `isAnimationActive={false}`, `data-series`, legend click toggles
   exactly the clicked series) - "hold in the component source" has no automated check, only a manual dev-server run
   whose result goes in the PR description. A reviewer can only read the code. Acceptable if intended, but then say that
   explicitly; better, extract the toggle as a pure `toggleHidden(hidden: Set<string>, key: string): Set<string>` in
   `chart-rows.ts` and unit-test it (adds ~5 lines), which makes "toggles exactly the clicked series, others unchanged"
   observable.

## Checks passed

- Grounded scope: all new files except `package.json`, lock, vitest config; `components/apps/aoe4-build-order/` does not
  exist yet (new); `recharts` is absent from package.json on main and the worktree. Recharts 3.10.1 exists on npm
  (peers react, react-dom, react-is; React 19 allowed).
- Contracts match design/M2.md Charts for `ChartSeries`, `toChartRows`, `SeriesChart` props, `data-series`, test ids
  (apart from the version, gap 3).
- Invariants: S1 only, correctly named; no contradiction.
- Open questions: none, none in CONTEXT.md affect this. Decisions agree (dependency-upgrade decision supports 3.x).
- Diagrams: no trigger fires. Lessons: none recorded.
- Size: ~120-180 LOC including tests, under 400.

## Notes

- Risk `standard` is defensible, but "estimated over 150 lines of business logic" is a strongModelTrigger and the upper
  estimate (180) includes tests; business logic is likely ~140-170. Borderline; keep `standard` only if the implementer
  stays under 150 non-test lines, otherwise `high`. The `SeriesChart` props are consumed by the page ticket (a
  cross-ticket contract), but they are the same component, so not a trigger.
- Recharts 3 declares `react-is` as a peer; npm 7+ installs it and the lock will gain it and Recharts' transitive deps
  (e.g. redux toolkit). The "no other dependency changes" criterion should say new transitive entries in the lock are
  expected, only `package.json` versions of existing deps must be unchanged.
- Criterion "`git grep -n recharts -- package.json` prints the one dependency line" is correct (nothing today).
- `tsc` includes `**/*.ts(x)`, so the new test files and TSX are type-checked; no tsconfig change needed.
