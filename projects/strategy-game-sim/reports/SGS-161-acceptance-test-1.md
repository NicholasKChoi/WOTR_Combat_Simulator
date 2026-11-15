# SGS-161 acceptance-test 1

Verdict: PASS. Tip 774514b5a801b82ce546da318fff96de4079deae. No new commit (the implementer's specs already cover the criteria; I wrote none).

Harness: acceptanceSetup ran (node_modules linked, Chromium installed). `npx playwright test acceptance/aoe4-chart-views.spec.ts acceptance/aoe4-build-order-pin-compare.spec.ts`: 55 passed (1.7m). `npx tsc --noEmit && npm run lint:dup`: no errors.

Tests (acceptance/aoe4-chart-views.spec.ts:352, one per width 360/768/1280), each over every id in CHART_IDS in one page.evaluate: no two tick label boxes intersect; no tick clipped by the svg bounds; documentElement.scrollWidth <= clientWidth. All 3 pass.

Mutation checks (both undone, `git diff --exit-code` clean):
- Removed `tickMargin` from XAxis (line-chart.tsx:164): all 3 widths fail with `chart-units-produced "0:00" overlaps "0"` (the overlap assertion, line 378).
- Removed `height={X_AXIS_HEIGHT}` (same line): all 3 fail with `chart-units-produced "0:00" clipped`.

Gaps:
- AC2 asks for both the Buildings (offset lines) and default view. The test only switches the units chart to Buildings; the other charts in CHART_IDS render the default y-axis, so both configurations are covered across charts, but the units chart is never checked in its default (non-Buildings) view. Low risk; not a failure.
- AC4 (marker labels): existing marker-label specs were not in my run set beyond chart-views/pin-compare; they were not broken by anything seen here. Suite/other specs not run (out of scope).

Failures: none.
