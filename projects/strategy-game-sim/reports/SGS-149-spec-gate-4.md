# SGS-149 spec gate 4

Verdict: READY. Gate-3's gap is closed and re-spec 3 introduced no new gap.

Read at origin/main after `git fetch origin`: `acceptance/aoe4-split-tab-order.spec.ts`, `acceptance/helpers.ts` (`holdRequests`, `holdNextSimulate`), `acceptance/aoe4-auto-run-contract.spec.ts` (uses `waitForTimeout`), `lib/aoe4-build-order/build-store.ts` (`createMemoryBuildStore(env = 'development')`, per-call `builds` and `counters` Maps). None of these files changed since the prior gate (last touching commits are the same).

## Gate-3 gap: closed

- Walk end behavior: Scope item 3 now lists three end conditions (last chart's handle and caret both seen; focus left the last chart's section after being inside; `MAX_PRESSES`), always returns the stops, never throws. This replaces today's `throw new Error('the caret of ... was not reached')`. A removed last-chart handle or caret now reaches a presence assertion, so criteria 6 and 7 can hold.
- Last chart with a handle moved after its caret: walk continues past the collapse stop until both are seen, so the handle index is >= 0 and handle-before-caret is not vacuous.
- Assertion order inside `expectChartControlsOrder` is fixed: key-results caret, compare-collapse before every present handle, handle-before-caret (only when both indexes >= 0), chart-rendered, handle presence, caret presence. This resolves the conflict with today's per-chart `has a caret stop` assertion.
- Which tests carry chart-rendered: both. Test 1 after `expectInOrder`; test 2 after `expectInOrder` and the order assertions.
- Column swap: `lastChart` no longer asserts count, and chart-rendered runs after the order assertions, so `expectInOrder` is the first thrown assertion (criterion 5).

## Other checks

Items 1 and 2 and the remaining checks are unchanged from gate 3 and still hold: files and functions named exist at base; the memory-store change is an optional parameter with unchanged single-argument calls; risk low is right (test-only plus an optional test seam); Invariants none, Unverified assumptions none, On merge none, no doc impact, no overlap with open tickets, size well under 400 lines.

## Notes (non-blocking)

- When the last chart has neither stop, the walk runs the full 150 presses before returning. Slow but it works, and it only occurs under mutation.
- The "chart-rendered" check compares against `CHART_IDS` from `acceptance/helpers.ts`, which the spec already imports.
