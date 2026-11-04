# SGS-087 review 1: APPROVE (tip 4c065b2)

## Blocking findings
None.

## Acceptance criteria
- Label set per chart equals age-up texts, 1 <= data-label-rows <= age-up count: pass by code read (placeMarkers and labelKey fed ageUpMarkers(markers), line-chart.tsx); spec asserts it. Not run by me (see Coverage).
- Every marker once per chart with kind/label/at, MARKER_COLORS stroke, no dasharray; non-age-up group has no text and has a <title> "<label> <m:ss>": pass by code read.
- Tooltip no 2+ decimals at plot centre: pass by code read (formatter={formatChartValue}); implementer's mutation run recorded.
- formatChartValue table: all 7 specified rows plus a string row; vitest passes (11 files, 238 tests). Math.round(-0.04*10)/10 is -0 and String(-0) is '0'.
- ageUpMarkers unit test: renamed, expected values unchanged; passes.
- Legend / pinned lines unchanged: tests pass; diff does not touch them.
- Docs: paragraph rewritten and matches code; no remaining "every marker is labelled" statement in the doc or data README.
- Only acceptance/aoe4-chart-readability.spec.ts added under acceptance/.
- tsc --noEmit and lint:dup clean (run by me).
- Invariants: none touched.

## Bot reconciliation
reviewBot.cli empty; none run.

## Non-blocking notes
- Spec filters the Y-axis label via "rotate" in transform; fails loudly if recharts changes it.
- Near-duplicate ReferenceLine props for non-age-up and age-up lines; acceptable.

## Coverage
Reviewed all 6 changed files. Ran tsc, lint:dup, vitest for components/apps/aoe4-build-order. Playwright acceptance could NOT be run in my review worktree (next dev failed with ENOENT on .next build-manifest, node_modules symlinked from the task worktree; 120s webServer timeout). Relied on the implementer's reported 697 passes and mutation checks. No 390/700/360 screenshots taken by me. Review worktree removed.
