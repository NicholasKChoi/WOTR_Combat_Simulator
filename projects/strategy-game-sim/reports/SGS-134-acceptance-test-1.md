# SGS-134 acceptance-test 1

Verdict: PASS. Tip 1ea93cb5a77a22fb6484eb3750fe8c2cafe84b3e (no new commit; the implementer's spec needed no change).

## Tests (acceptance/aoe4-key-results-collapse.spec.ts, SPLIT_VIEWPORT, existing helpers)
1. Caret hides body content, keeps pin-run and unpin-run visible and the caret focused; second click restores. Asserts the expanded state first.
2. Reload keeps the key-results panel and a chart collapsed; asserts both expanded first and that storage holds both ids.
3. Stored M8 layout (chart collapsed) loads with the panel expanded; with nothing stored, loading leaves the storage key null.

## Run
Harness provisioned (acceptance:setup). Ran the new spec, unedited acceptance/aoe4-chart-layout.spec.ts and acceptance/aoe4-build-order-pin-compare.spec.ts: 52 passed, 0 failed.
`npx tsc --noEmit` and `npm run lint:dup` clean (0 clones).

## Mutation checks (each undone with git checkout; git diff --exit-code clean)
- compare-panel.tsx unpin-run `hidden={collapsed}`: test 1 failed at spec line 31, `unpin-run` toBeVisible (received hidden).
- use-chart-layout.ts write guard without `state.layout === readLayout.current`: test 3 failed at spec line 64, storedLayout toBeNull (received default layout).
- chart-layout.ts normalize `collapsed` filter `isPanelId` to `isChartId`: test 2 failed at spec line 56, caret aria-expanded after reload (expected false, received true).

## Failures
None.

## Not expressible
The `data-collapsed` string vs hidden-attribute distinction on compare-body: Playwright cannot tell a null-rendered body from a hidden one, so "children not rendered" is covered only by the Vitest compare-panel test.
