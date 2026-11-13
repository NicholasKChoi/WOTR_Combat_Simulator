# SGS-160 root cause: acceptance/aoe4-results-split.spec.ts:41 (chart ids) fails on main

- **Status**: confirmed
- **Passes**: 1 of 6; board round trips 0 of 3
- **Debug branch**: none
- **Ticket**: tickets/SGS-160-fix-results-split-spec-chart-id-filter.md

## Symptom

`acceptance/aoe4-results-split.spec.ts:41` (chart ids) fails at origin/main 5371c25 and at f55e0aa, reproducibly: a red acceptance spec on main (reported by the SGS-154 implementer, 2026-11-13).

## Evidence

- BACKLOG.md entry (debug), source SGS-154 implementer report.
- Pass 1, run at origin/main e50e074 (`git archive` export in `worktrees/debug-SGS-160`, `npx playwright test acceptance/aoe4-results-split.spec.ts:41`): fails at line 45, `expect(children.filter((id) => id?.startsWith('chart-'))).toEqual(CHART_IDS)`. Received has two extra leading entries, `"chart-reorder-help"` and `"chart-order-status"`, followed by the four chart ids in the expected order.
- `components/apps/aoe4-build-order/results.tsx:ResultsPanel` render (origin/main): the `results-last-good` div holds `<p data-testid="chart-reorder-help">` and `<p data-testid="chart-order-status">` as direct children before the `layout.order.map(...)` charts.
- `git log -S` at origin/main: both test ids were added in 94a439d "Reorder charts with a drag handle and collapse them with a caret (#148)" (SGS-135). The spec's `startsWith('chart-')` filter dates from e8a5039 (#120), and the spec was last changed in 784229a (#128), both before #148.
- SGS-135-implementer-1.md: the acceptance run covered only `aoe4-chart-layout`, `aoe4-gather-rates-per-villager` and `aoe4-key-results-collapse` specs; the full acceptance suite was not run.

## Hypotheses

1. (confirmed) The spec's `startsWith('chart-')` prefix filter now matches the two visually-hidden a11y paragraphs SGS-135 added with `chart-` test ids.

## Ruled out

- Chart ids renamed or reordered (pre-pass hypothesis 1) - the four ids in Received match `RESULT_CHART_IDS` exactly and in order; only two non-chart ids are extra.
- Flake - deterministic DOM; fails on every reported run and on e50e074.

## Cause

`acceptance/aoe4-results-split.spec.ts` test "the four charts are direct children of the results container and wrap no column" (line 45) identifies charts by the test-id prefix `chart-`. `components/apps/aoe4-build-order/results.tsx:ResultsPanel` gained two direct children of `results-last-good` with that prefix in 94a439d, `chart-reorder-help` (reorder instructions, referenced by the drag handle's aria-describedby) and `chart-order-status` (live region). So the filtered list is six ids, not four. The product behavior is correct: the four charts are still the last four children, so line 46 holds. The defect is in the spec's selector.

## Why it escaped

The SGS-135 implementer ran only the specs it changed. Nothing ran the full `npm run acceptance` before merge (review and acceptance-test also ran no full suite), so an unrelated spec whose prefix selector matched new test ids went red on main unnoticed.

## Fix direction

Fix the spec, not the product. On line 45, filter by membership instead of by prefix: `children.filter((id) => (CHART_IDS as readonly string[]).includes(id ?? ''))`. Or assert that every child's test id outside the chart set is not a chart section. Keep line 46. Renaming the product test ids to drop the `chart-` prefix would also work. It is not preferred, because other specs and unit tests may reference `chart-reorder-help` and `chart-order-status`. The test that must fail before the fix and pass after is this same spec at line 41. Before the fix it fails as recorded in Evidence. To show the fix still catches a real fault, wrapping a chart in an extra div, or moving a chart before the help paragraph, must make it fail. No other acceptance spec filters by the `chart-` prefix (grep of `acceptance/` and `components/`).

## Owner repro steps

## Pass log

1 2026-11-13 ran aoe4-results-split.spec.ts:41 at origin/main e50e074 (git archive export, no worktree) and read results.tsx plus git log -S -> fails with extra `chart-reorder-help`, `chart-order-status` from 94a439d; cause confirmed
