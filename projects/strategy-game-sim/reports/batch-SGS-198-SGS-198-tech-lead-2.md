# Tech-lead gate: batch SGS-198-SGS-198

## Decision

PASS: one draft PR opened. No blockers, no untested hotspots.

## PRs (bottom to top)

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/207 (draft). Base `main`. **new**. Head pushed: `3bd813828f32e1058b44ec6a642bad941ea36e5e` (branch `sgs-198-units-chart-unit-lines`).

  ## Merge risk
  **low** - a revert fully undoes it, it touches no API, schema, CLI, config or critical-path engine symbol (chart series selection and drawing only), and unit and acceptance tests pin the series, dot rules and dot placement.

  ## Review focus
  No hotspots: the dot rules (stale key, hidden line, window edges, same-instant dots, interpolated value) live in one pure function with a unit test per rule, `valueAt` has table rows that fail on the previous-sample value, and the acceptance spec checks dot placement on the drawn path, colours, titles and pinned-under-current order in a real browser.

Stack footer: only #207. SGS-191 (#201) and SGS-197 (#204) are integrated. No issue line, because the ticket's Source names no `GitHub issue #<n>`. Three Preview checks cover the ticket's Unverified assumptions about recharts `ReferenceDot`: data attributes and title, placement, z-order, and overflow.

## What I reviewed

- Range: `683991c` (origin/main = merge-base) .. `3bd8138`, 3 commits (55c83d7, 45e14d2, 3bd8138).
- Files: `components/apps/aoe4-build-order/{result-series.ts, line-chart.tsx, chart-rows.ts, results.tsx}`, `docs/aoe4-build-order-ui.md`, and the tests `result-series.test.ts`, `chart-rows.test.ts`, `acceptance/aoe4-units-chart-upgrade-dots.spec.ts` (new) and `acceptance/aoe4-build-order-pin-compare.spec.ts`.
- LoC: +629/-37 total. Reviewable production change is +104/-15.
- Invariants A1 to A3 are not touched: there is no engine or data change. S1/S2: no cross-app imports and no new page. No criticalPaths symbol changed. No API, schema, OpenAPI or pin-storage change. Open questions: none in PROJECT.md or in the ticket.
- Checked: dot fill and pinned ring colours use the same index rules as the line strokes (`seriesColor(i)` and `pinnedColor`). The pinned hidden check uses the base key, the same check the pinned Line uses. `valueAt` reads each run's own `times`. Dots are passed only for the Units chart in the Units view.

## Non-blocking notes

- `valueAt` returns `undefined` when given empty `times`/`values`. This cannot happen today because a dot needs a series with samples.
- The comment on `PINNED_DOT_Z_INDEX` in `line-chart.tsx` corrects the ticket's original z-layer assumption. It is fine to keep: it records a rejected alternative.

## Cleanup

Scratch `tech-lead-SGS-198-SGS-198` removed after writing this report (see the hand-back for the result).
