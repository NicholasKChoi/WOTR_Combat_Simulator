# SGS-115 spec gate, round 2

Verdict: READY

Read at origin/main (fetched). Spot-checked: workbench-tabs.tsx, workbench.module.css, use-split-layout.ts, build-input.tsx
(form `py-2 mb-3`, `data-testid="run-bar"`), build-text-editor.tsx (visible label at the top, no `labelledBy`),
pages/apps/aoe4-build-order.tsx (`build` is a fragment, `results` is a `div` whose first child is the bare
`<h2 className="border-bottom">`; `saved-build-error` sits between the bar and `WorkbenchTabs`), components/layout.js
(no footer; `main` only), acceptance/helpers.ts (SPLIT_VIEWPORT 1280x800, WIDE_VIEWPORT 1800x900), docs "Page" section,
design/M8.md C11.

## Round-1 gap closed

The run-bar margin: the hook now writes border box plus `margin-bottom`, so `.workbenchSplit` top = bar bottom + margin and
bottom = bar top + 100dvh = `innerHeight` when the bar is stuck. I checked nothing renders below the workbench (no footer,
no section bottom padding), so "bottom equals innerHeight at page end" holds. The `saved-build-error` alert is stated as
unmeasured and the criterion asserts it absent. Scope, criteria 1, 4 and 5 agree with design C11 (signature, property
owner, value formula, `labelledBy`, `runBarRef`). The `overflow-x` note is folded in with its own criterion.

## Checks

1 grounded: all files exist; `use-run-bar-height.ts` declared new. 2 testable: each criterion has an observable outcome and
names the failing mutation; no stale counts. Existing-test rule is in Scope (edit old layout tests, list them).
3 no open questions. 4 Invariants none; not adjacent. 5 matches C11. 6 about 80 LOC, no dependencies. 7 no diagram trigger.
8 no LESSONS conflict (rects read in one evaluate). 9 consistent with Decisions/design. 10 `On merge: none` valid.
11 Risk standard: no critical path or strong-model trigger. 12 docs in Scope with the grep phrases. 13 no input boundary.

## Notes (non-blocking)

- Criterion 8 says `results-heading` is "the first element of `panel-results`". In the code the results node is a `div`
  that wraps the `h2`, so the heading is the first child of that div, which is the only child of `panel-results`; the
  build `h2` is a direct first child (fragment). A test written as `panel-results > :first-child` would fail. Suggested
  rewrite: "is the first element in document order inside `panel-results`" (same for `panel-build`).
- Criterion 3 (hover) does not say where the page is scrolled. After the page is scrolled to its end the whole
  workbench is in view, so use that state (or `scrollIntoViewIfNeeded` on the chart) before asserting the band is in view.
- Criterion 10 (hook null-ref and no `ResizeObserver`) is reading-only; a small unit test with a stubbed ref and
  `ResizeObserver` removed would be cheap (carried from round 1).
- Existing specs that call `chart.scrollIntoViewIfNeeded()` in the split layout (`aoe4-chart-readability`,
  `aoe4-gather-rates-per-villager`) may behave differently with column scrolling; covered by the Scope rule on edited tests.
