## Summary
Hovering or keyboard-focusing a row in the AoE4 step timeline shades that step's span (Started to Finished) on all four charts. An in-progress step runs to the end of the run, a zero-length step draws a single vertical line, and a waiting or not-reached step (no start) draws nothing. Moving off the row, blurring it, or running again clears the highlight. Rows become focusable (`tabIndex=0`). Client-only; no simulation, API, or data change. Non-goal: pinned-run comparison bands.

## Merge risk
**low** - client-side rendering only, no public surface or critical path touched, a revert fully undoes it, and unit and acceptance tests pin the span and band behavior.

## Review focus
No hotspots: the span logic is a pure function covered by a table test, and the band, clearing and active-row styling are asserted by browser tests against computed geometry and style.

## Reviewer guide
Reviewable change: +72/-13 LoC (excludes the unit test and the acceptance spec)
- [`components/apps/aoe4-build-order/step-timeline-rows.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/96/files#diff-6a6a0fea697faeb1fcd8c43b5f34c063173ceabb7ece644c4d984dd86209d848) - `stepSpan` turns a row into a clamped from/to; in-progress runs to the run end.
- [`components/apps/aoe4-build-order/results.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/96/files#diff-52bb6320b9e8071b4d8a22dfe3afab52c78cd000cb29ebf1f3b422243765b64f) - owns the active step, keyed to the result so a new Run clears it; passes the span to each chart.
- [`components/apps/aoe4-build-order/line-chart.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/96/files#diff-17b99f04400281566be4134563c956ce7effa88f0fa5028946f698b678c2c167) - draws a shaded area, or a line when from equals to.
- [`components/apps/aoe4-build-order/step-timeline.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/96/files#diff-9edaa2d1ab0109f8955663b0c6d72f253ee6a664e5433e29e2acd7e36fdd3d97) - the timeline now takes rows as props and report pointer and focus events.
- [`docs/aoe4-build-order.md`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/96/files#diff-ff5dabd4f1008f6025aeb60f7672b2f40c87a7356acc0eb803b534a98603e6bb) - documents the behavior.

## Invariants and scope
Invariants touched: none. The simulation engine, data files and API are unchanged.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
