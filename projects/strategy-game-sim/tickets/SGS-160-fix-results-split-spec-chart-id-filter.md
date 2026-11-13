# SGS-160: Fix the results-split spec's chart id filter so it ignores the reorder help and status paragraphs

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 2 (one filter expression in `acceptance/aoe4-results-split.spec.ts`; test-only, no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: `reports/SGS-160-rca.md` (confirmed), `reports/SGS-160-debugger-1.md`

## Context

`acceptance/aoe4-results-split.spec.ts`, test "the four charts are direct children of the results container and wrap no column", fails on main. The product is correct. The spec is wrong.

### Cause (from the RCA)

The spec picks the charts out of the `results-last-good` children by the test-id prefix `chart-`. `components/apps/aoe4-build-order/results.tsx:ResultsPanel` now renders two visually-hidden paragraphs before the charts, with test ids `chart-reorder-help` and `chart-order-status`. The prefix filter returns six ids instead of four. The four charts are still the last four children, so the spec's second assertion (`children.slice(-CHART_IDS.length)`) holds.

### Evidence

- At origin/main the spec fails at the `startsWith('chart-')` assertion. Received has `chart-reorder-help` and `chart-order-status` ahead of the four chart ids, which are in the expected order.
- Both test ids were added in 94a439d (#148, chart reorder and collapse). The prefix filter dates from e8a5039 (#120). The spec was last changed in 784229a (#128), before #148.
- The ticket that added them ran only the specs it changed, and no gate ran the full acceptance suite, so the unrelated spec went red unnoticed.

### Ruled out

- Chart ids renamed or reordered: the four ids received match `CHART_IDS` in `acceptance/helpers.ts` in order.
- Flake: the DOM is deterministic and the failure reproduces every run.

Other places with the same defect: none. No other spec in `acceptance/`, and nothing in `components/` or `lib/`, selects by the `chart-` prefix. `chart-reorder-help` and `chart-order-status` are referenced by `acceptance/aoe4-chart-layout.spec.ts` and `results.tsx`, which is why the product ids stay.

## Scope

- In `acceptance/aoe4-results-split.spec.ts`, change the filter in that test to select the charts by membership in `CHART_IDS` (from `acceptance/helpers.ts`) instead of by the `chart-` prefix. Keep the assertion that the last `CHART_IDS.length` children are exactly `CHART_IDS`.
- Do not change `results.tsx` or any product test id.

**Out of scope:** renaming the product test ids; adding a full-acceptance-suite gate to the factory; other specs.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The test "the four charts are direct children of the results container and wrap no column" passes against the unchanged product code, and it fails at the base commit.
- [ ] The test still fails when a chart is not a direct child of `results-last-good` (for example wrapped in an extra element), and when a chart is rendered before the help or status paragraph. The implementer confirms each by a temporary change to `results.tsx`, reverted before commit, and records the result in the report.
- [ ] The test does not depend on the names of the non-chart children of `results-last-good`: adding another hidden paragraph with any test id leaves it passing.
- [ ] No product file changes; `git diff --name-only` for the PR lists only the spec file.
- [ ] The rest of `acceptance/aoe4-results-split.spec.ts` keeps its assertions.
- [ ] No INVARIANTS.md regressions

## Open questions

none
