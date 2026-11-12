# SGS-135 spec gate 2

Verdict: READY

Read at `origin/main` after `git fetch`. SGS-134 is still `needs_spec` with no branch, so its end state was taken from its ticket file, as in round 1.

## Round 1 gaps

1. Grep vs absence test: closed. Scope and criteria now say no test asserts the old ids' absence; the "no buttons without layout" case is rewritten to assert no `chart-drag-handle` and no `chart-collapse`. Today's matches for `chart-move-` at main are in `acceptance/aoe4-chart-layout.spec.ts`, `line-chart.test.ts` and `docs/aoe4-build-order.md` line 995 (prose "move up"). Scope rewrites or fixes all three, so the grep holds in the end state.
2. Drag geometry: closed. The test makes the path reachable (tall viewport or collapsing first) and drops between the third and fourth midpoints, giving target index 2.
3. `dropIndexAt` on a midpoint: closed. An equal midpoint is not counted, and `dropIndexAt([10, 20], 10)` is 0. This follows the design's "above the pointer" wording.
4. First-chart ArrowUp: closed. The test checks status text only, after a move that names a different chart. The `focusAfterMove` null check is a review check.

Round 1 notes are also resolved. Bootstrap 5.3.8 CSS is loaded in `pages/_app.js`, so `visually-hidden` is available. The Escape listener mechanism is stated. The Per villager spec is run as part of the check.

## New gaps

None blocking.

## Notes (non-blocking)

- Unverified assumptions covers the Playwright mouse and pointer-capture happy path and the focus-after-keyed-reorder behavior. Touch is listed as untested.
- Risk `standard` and LOC 160 are consistent. Open questions: none. On merge `none` is valid.
- Dependency on SGS-134 (`CollapseCaret`, `moveTo`, `chartLayout`) is named. Re-check the names against its integrated code when that lands.
