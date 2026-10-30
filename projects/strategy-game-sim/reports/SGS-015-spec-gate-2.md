# SGS-015 spec gate 2

Verdict: READY

All four gaps from reports/SGS-015-spec-gate.md are closed.

1. Vitest config name: header, item 4 and the Risk comment now say `vitest.config.mts`. Worktree sgs-012 at 623a5ff has
   `vitest.config.mts` with include `['utils/**/*.test.ts','lib/**/*.test.ts']`, as the ticket states.
2. Palette: `PALETTE` and `seriesColor` are pure in `chart-rows.ts`, with unit criteria (length, distinctness, wrap-around) that can fail.
3. Design gating: it is in `Depends on` (SGS-012 On merge applies the M2.md 3.x update before integration). `On merge` is none.
   design/M2.md still says 2.15.4 today (lines 11-18, 218), which the dependency covers; the ticket says M2.md's 3.x
   section wins on a selector or SSR-note conflict.
4. Legend toggle: pure `toggleHidden` with unit criteria. The `Line` props and click wiring are declared not unit-tested and
   go to a recorded manual check plus SGS-022.

## Checks
- Grounded scope: `components/apps/aoe4-build-order/` is new. `recharts` is absent from package.json. The tsconfig has
  `jsx: react-jsx` and includes `**/*.ts(x)`, so the new .tsx imports in a node Vitest test, and tsc type-checks the new files.
- Testable criteria: all have observable outcomes. The manual check names its selectors and a stop-and-report rule.
- Open questions: none. CONTEXT.md Decisions agree (dependency-upgrade decision).
- Invariants: S1 only. No contradiction.
- Contracts: `ChartSeries`, `toChartRows`, `SeriesChart` props and `data-series` match design/M2.md Charts. The new helpers
  (`formatMinSec`, `PALETTE`, `seriesColor`, `toggleHidden`) are internal to the component directory and not in the design Contracts.
- Dependencies and size: SGS-012 stated; ~120-145 business LOC.
- Diagrams: none triggered. Lessons: none recorded.
- Risk: no criticalPaths. The <150-line criterion plus re-tier rule handles the "over 150 lines" trigger.

## Notes (non-blocking)
- The 120-145 LOC estimate is tight: 15 palette colors, legend wiring and tick/tooltip formatters take lines. Put the
  palette on a few lines. The ticket already says to report back for a `high` re-tier if the limit is exceeded.
- `SeriesChart` props are consumed by the page ticket, so the cross-ticket contract trigger is arguable. It is a new
  contract copied verbatim from design/M2.md, so `standard` is defensible.
- SGS-012 is still `needs_review`. Do not start SGS-015 until it is integrated and design/M2.md "Charts" reads 3.10.1.
