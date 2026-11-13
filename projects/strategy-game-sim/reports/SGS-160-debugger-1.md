# SGS-160 debugger pass 1

## Step taken

- I read the failing spec, `acceptance/helpers.ts` (`CHART_IDS = RESULT_CHART_IDS`) and `components/apps/aoe4-build-order/results.tsx` at origin/main e50e074.
- I ran `git log -S` on the extra test ids.
- I ran the spec. `git worktree add` is blocked in the sandbox, so I exported origin/main with `git archive` into a plain directory, `worktrees/debug-SGS-160`, and hardlinked node_modules with `link-node-modules.sh`. Then I ran `npx playwright test acceptance/aoe4-results-split.spec.ts:41`. Playwright's webServer started and stopped its own `next dev`, and no process was left running.

## Result

The test fails at line 45:

```
- Expected  - 0
+ Received  + 2
  Array [
+   "chart-reorder-help",
+   "chart-order-status",
    "chart-units-produced",
    "chart-gather-rates",
    "chart-gathered-resources",
    "chart-floating-resources",
  ]
```

- The spec picks out the charts with `children.filter((id) => id?.startsWith('chart-'))`.
- 94a439d (#148, SGS-135, chart drag handle and caret) added two visually-hidden paragraphs as direct children of `results-last-good`: `chart-reorder-help` (aria-describedby text) and `chart-order-status` (live region). Both match the prefix.
- The product is correct: the four charts are still the last four children. The selector in the spec is stale.

## RCA diff

- Status: investigating -> confirmed. Passes: 0 -> 1.
- Evidence: added the run output, the results.tsx children, the `git log -S` history, and the scope of SGS-135's acceptance run.
- Ruled out: renamed or reordered chart ids (the four ids match in order), and flake (the DOM is deterministic).
- Cause: `acceptance/aoe4-results-split.spec.ts` line 45 prefix filter, matched by the `chart-` test ids that 94a439d added to `results.tsx:ResultsPanel`.
- Why it escaped: SGS-135 ran only the specs it touched. No gate ran the full acceptance suite before merge.
- Fix direction: in the spec only, filter children by membership in `CHART_IDS` instead of by prefix, and keep line 46. No other spec uses this prefix filter.

## Verdict

**CONFIRMED.** The cause is in the spec's `chart-` prefix filter (`acceptance/aoe4-results-split.spec.ts`, line 45), which now also matches `chart-reorder-help` and `chart-order-status`, two ids added to `components/apps/aoe4-build-order/results.tsx:ResultsPanel` in 94a439d. The failing test is the existing spec itself, at origin/main e50e074. There is no debug branch.

## Cleanup

`worktrees/debug-SGS-160` is a plain `git archive` export, not a git worktree. I removed it after writing this report.
