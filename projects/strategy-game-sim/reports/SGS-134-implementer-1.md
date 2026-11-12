# SGS-134 implementer report 1

Status: needs_review
Branch: sgs-134-chart-layout-model-key-results-collapse
Tip: 1ea93cb5a77a22fb6484eb3750fe8c2cafe84b3e (one commit on origin/main 5564bd0)
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-134-chart-layout-model-key-results-collapse

## Files touched
- components/apps/aoe4-build-order/chart-layout.ts: KEY_RESULTS_PANEL_ID, LayoutPanelId, widened collapsed, normalize keeps key-results in collapsed only, moveChartTo, widened toggleChartCollapsed.
- components/apps/aoe4-build-order/use-chart-layout.ts: ChartLayoutControls, functional setState, loaded flag, single write effect skipping the object the mount effect read.
- components/apps/aoe4-build-order/collapse-caret.tsx (new): CollapseCaret.
- components/apps/aoe4-build-order/compare-panel.tsx: section, header row, collapsible compare-body.
- components/apps/aoe4-build-order/results.tsx: takes chartLayout prop; no useChartLayout import or call.
- components/apps/aoe4-build-order/workbench.module.css: compareHeader, compareBody.
- pages/apps/aoe4-build-order.tsx: single useChartLayout() call, passes controls to Results and ComparePanel.
- docs/aoe4-build-order.md: chart-layout storage paragraph, key results panel paragraph, pin-button location sentence.
- components/apps/aoe4-build-order/chart-layout.test.ts (extended), compare-panel.test.ts (new), acceptance/aoe4-key-results-collapse.spec.ts (new).

## Tests
- `npm test`: 75 files, 2377 passed, 13 skipped, 0 failed.
- chart-layout.test.ts moveChartTo table (first, last, middle, current, below 0 via -1, above last), id not in order, collapsed kept and no mutation of input or default; normalize key-results kept once / unknown dropped in collapsed / dropped in order / M8 unchanged; toggle key-results; round-trip with key-results.
- compare-panel.test.ts: expanded and collapsed markup, CollapseCaret labels and aria-controls.
- The Playwright spec was written but NOT run (acceptance belongs to the acceptance gate). It uses SPLIT_VIEWPORT.
- aoe4-chart-layout.spec.ts not edited and not run; its no-write-on-load case depends on the hook's read-object guard (review check by reading use-chart-layout.ts).
- Pre-existing tests edited: none.
- Chart-layout.test.ts already used the shared fakeStorage/throwingStorage; no local copies existed.

## Doc claims (docs/aoe4-build-order.md)
- "`collapsed` holds chart ids and, when the key results panel is collapsed, `key-results`; `order` holds chart ids only." Made true by normalizeChartLayout (isPanelId / isChartId).
- "Loading the page writes nothing: with nothing stored the key stays unset until a chart or the key results panel is moved or collapsed." use-chart-layout.ts write effect skips when state.layout === readLayout.current.
- Key results panel paragraph (title row `compare-heading`, caret `compare-collapse`, pin buttons; collapsing hides pinned label and table, row and pin buttons stay; state persists in the layout): compare-panel.tsx.
- "In the key results title row, "Pin this run" ..." replaced "Under the "Results" heading".
- ARCHITECTURE.md had no matching statements.

## Mutation checks (all undone; tree clean at commit)
- chart-layout.ts moveChartTo: splice without removing first -> "moves to the first index" failed.
- chart-layout.ts normalize collapsed filter isPanelId -> isChartId -> "keeps key-results in collapsed once..." failed.
- chart-layout.ts drop Math.max clamp: first survived with -5 (splice clamps itself); changed the case to -1, re-ran, "moves to an index below 0" failed.
- compare-panel.tsx always render body children -> "collapsed, keeps the pin buttons..." failed on pinned-label.
- compare-panel.tsx data-collapsed always 'false' -> same test failed on data-collapsed="true".
- collapse-caret.tsx swapped Collapse/Expand -> both CollapseCaret rows failed.
- Not mutation-checked: the Playwright spec (not run).

## Results
- codegen: none set. build (`next build`): succeeds. lint (`tsc --noEmit` + `lint:dup`): clean, 0 clones.
- Playwright: not run (see above).

## Invariants
No engine, data, or simulation path touched; A1-A3 unaffected.

## Notes
- compare-body also gets the `hidden` attribute when collapsed (as chart-body does). Pinned label moved from beside the buttons into the body, so it now sits on its own line under the header row.
- `git worktree add -b` first attempt created the branch before failing on a bad relative path; reused the branch (it was at origin/main).
- Unverified assumptions added: none.
- Out-of-scope findings: none.
