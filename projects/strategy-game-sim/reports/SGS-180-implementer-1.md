# SGS-180 implementer report 1

Status: needs_review
Branch: sgs-180-split-layout-specs-to-desktop-viewports, tip f4d0c1b1db92b14d0d4d3453600217aaefad7e25 (base main f731e4a)
Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-180-split-layout-specs-to-desktop-viewports

## Files touched
- acceptance/aoe4-split-layout.spec.ts: only "split at 1280" kept; tablist helper and unused imports removed.
- acceptance/aoe4-split-scroll.spec.ts: two cases deleted, headings case made plain, focus-ring case moved to MIN_SUPPORTED_VIEWPORT, showTab calls and imports removed.
- acceptance/aoe4-results-split.spec.ts: tabs row removed, showTab calls and imports removed.

## Cases edited, renamed, deleted
- split-layout: renamed "split at 1280: no tabs, both panels..." to "split at 1280: both panels shown side by side inside the viewport"; dropped the tablist, tab-build and tab-results count assertions. Deleted: tabs at 390; the breakpoint is 1200 px; layout switches live; both layout round trips; view toggle disabled by Results; first paint matches the server render; the describe "resize while the Results panel is hidden" (both rows).
- split-scroll: deleted "below 1200 px there are no columns..." and "below 768 px the bar is static..."; removed NARROW_VIEWPORT. Headings describe: tabs row removed, now plain case "the headings share a size and lead their panels" at SPLIT_VIEWPORT with all assertions kept. Renamed the focus-ring case to "...at the minimum supported width", now at MIN_SUPPORTED_VIEWPORT. showTab dropped in openLongBuild and the headings case.
- results-split: "charts fill the Results width" lost its tabs row (wide and split rows kept); showTab dropped in openResults and the "no steps" case (next assertions are toBeVisible/toHaveCount on Results content).
- Re-grep at base found no hits beyond those listed. aria-selected, workbench-tabs, tab-build, tab-results, showTab, TABS_VIEWPORT, SPLIT_MIN_WIDTH, NARROW_VIEWPORT now have no matches in the three files; no setViewportSize under 1200 wide remains.

## Which assertions carry the criterion 4 / 5 checks
- split-layout: `sideBySide` (build.right <= results.left), `editorTopInside`, `lastGoodTopInside` in the single `evaluate` poll; `scrollWidth <= SPLIT_VIEWPORT.width` for sideways scroll.
- headings case: `panel-build` firstElementChild is `build-order-heading`; `panel-results` firstElementChild.firstElementChild is `results-heading`; `sizes.build === sizes.results` and `sizes.charts` length 1.
- results-split: `units / results >= 0.95` poll at both rows; `page <= viewport.width` poll at the wide row.

## Tests
Per file `npm run acceptance -- <file>`: split-layout 1/1 passed; split-scroll 15/15 passed; results-split 4/4 passed. `npm test` not run (no non-acceptance code changed). No pre-existing test assertion changed except the removals and renames above.
Mutation checks: not run. The ticket's changes only delete or relax existing specs and drop tab steps; no new assertion was written.

## Lint, build
- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones. `noUnusedLocals` check shows errors only in other, untouched spec files (aoe4-chart-views, aoe4-compact-view, aoe4-my-builds); none in the three changed files.
- Build/codegen: not run (no non-acceptance code changed; codegen unset).

## Doc claims
None added.

## Invariant check
No lib/aoe4-build-order files changed; nothing adjacent affected.

## Unverified assumptions added
None.

## Out-of-scope findings
Pre-existing unused locals in acceptance/aoe4-chart-views.spec.ts (MIXED_NODES_PASTE), aoe4-compact-view.spec.ts (bands), aoe4-my-builds.spec.ts (isNamedPath).
