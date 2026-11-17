# Tech-lead gate: batch SGS-197-SGS-197

## Decision: PASS - draft PR opened

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/204 - base `main` - new - head 5156184c78d41d43722b4e625e0baf728d552ad0 (SGS-197, branch `sgs-197-chart-zoom-pan`)

### Merge risk
**low** - client-side chart UI state only: no API, schema, config or critical simulation path is touched, a revert fully undoes it, and the new acceptance spec pins each behavior

### Review focus
- [`components/apps/aoe4-build-order/use-chart-zoom.ts:32-95`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/204/files#diff-6324b6edeafb8d539914c629db95bbfbe92ddeefb428e222e934b7bb072516d5R32-R95) - if any end path (release, Escape, cancel, lost capture, or the plot unmounting on collapse) skips `finish`, `session.current` stays set and every later drag on that chart is ignored until reload - check that each exit path removes all five listeners and clears the session - pinned by [`acceptance/aoe4-chart-zoom.spec.ts`: no listener outlives a finished selection, a finished pan or a cancelled selection; collapsing the chart while a selection is held ends it, and the next drag zooms after expanding](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/204/files#diff-6ebe5eb7a0c04fc24f152323eba7304504322f1479cf3648833563c06789bb04R272-R326)

## What I reviewed
- Range `22c47e0...5156184` (merge-base = origin/main), 3 commits (2af85c3, 8a7ce31, 5156184).
- Files: `use-chart-zoom.ts` (new), `line-chart.tsx`, `chart-markers.ts`, `chart-drag.ts`, `use-chart-drag.ts`, `results.module.css`, unit tests `line-chart.test.ts` and `chart-markers.test.ts`, and the new `acceptance/aoe4-chart-zoom.spec.ts` (736 lines).
- Reviewable LoC: +298/-108, without the tests. About 100 of the `line-chart.tsx` lines are re-indentation from the new plot wrapper.
- Checks against the gate list:
  - Invariants: A1 to A3 cover the engine and data, which this diff does not touch. S1 holds because every import stays inside the app.
  - The change is reversible: nothing is stored and there is no schema or API change.
  - No concurrency and no security surface.
  - No `criticalPaths` symbol is touched.
  - PROJECT.md has no open questions.
  - The unzoomed render path is unchanged: the domain is still `dataMin`/`dataMax`, `placeMarkers` gets the same end with origin 0, and the step band passes through.
- Stack check: single task with no base-only branch. The diff against `main` holds only this task's commits.
- No existing PR, so the PR was created as a draft. Body set via `gh api` PATCH. The PATCH response shows draft true, head 5156184 and base main.
- No issue line: the ticket's Source names no `GitHub issue #<n>`.
- Earlier gates: suite-2 PASS (2745 unit tests passed) and acceptance-test-7 PASS (zoom spec 30/30, neighbouring specs 130/130).

## Non-blocking notes
- `use-chart-zoom.ts:63`: if `end` changes in the middle of a Shift+drag pan (a new run lands during the drag) and the drag is then cancelled, `finish(true)` restores the window as it was before the new end clamped it. `shown` still clamps it at render, but the stored `to` would come back on a later longer run. This is unlikely and cosmetic.
- I wrote the scratch PR body to `/tmp/claude/pr-204-body.md` (outside the checkout).
