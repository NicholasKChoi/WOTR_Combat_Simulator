# SGS-196 spec gate (report 2)

Note: `SGS-196-spec-gate-1.md` was requested, but the path scan used the wrong prefix. This file is the deliverable and holds the full result.

**Verdict: NEEDS_SPEC**

## Gaps

1. Acceptance criteria, `panStepSeconds` line - the criterion says the step "is 1 for the smallest spans a window can have". The smallest valid window span is `MIN_ZOOM_SECONDS` = 30 (C10 invariant `0 <= from < to <= end`, `zoomTo` and `clampWindow` reject less), so the step there is 15, never 1. The `max(1, ...)` floor is reachable only with a span below 2 s, which no window produced by these functions has. An implementer would either write a test that cannot hold for a real window or guess at what "smallest" means. Proposed fix: rewrite as "`panStepSeconds` is half the span rounded (a 30 s window gives 15, a 61 s window gives the rounded half, an odd span rounds as `Math.round` does) and is never under 1 (a degenerate span of 0 or 1 s gives 1)". The 0 and 1 s rows are direct inputs to the pure function, so they can fail.

## Checks that passed

- Grounded scope: `chart-rows.ts` (`ChartRow = { t: number } & Record<string, number>`, `toChartRows` ascending `t`), `lib/aoe4-build-order/format-time.ts` `formatMinSec`, `chart-legend.tsx` Bootstrap button classes, `chart-legend.test.ts` and `chart-header.test.ts` (`createElement` plus `renderToStaticMarkup`) all exist at `origin/main`. The four new files do not exist.
- Contracts match `design/M11.md` C10 and C12 and rows B-Z3, B-Z4, B-Z8, B-Z12. The edge-row rule is C10 read literally, consistent with the owner answer.
- No existing test or doc depends on anything here (new files, nothing imported).
- Risk `low`, LOC ~110, Depends-on none, On merge `none`, Invariants `none`, Unverified assumptions `none` are all consistent with a pure-math plus markup change.
- No search criterion over code; no stale pinned counts.

## Notes

- `rowsInWindow` on an empty `rows` array is unspecified; returning `[]` is the obvious result, and the ticket could add a row for it.
- The separator in the range text (for example `0:30 - 1:00`) is left to the implementer; the criterion only requires both `formatMinSec` values to appear, which is fine.
- `panWindow` with a span larger than `end` would make the clamp range inverted; windows from `zoomTo`/`clampWindow` never have that, so no action needed.
