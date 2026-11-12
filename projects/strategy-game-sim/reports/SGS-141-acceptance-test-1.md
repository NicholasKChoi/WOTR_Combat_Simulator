# SGS-141 acceptance-test 1

Verdict: PASS. No new tests written and no commit made. The two specs the branch already adds cover the ticket's criteria. Tip checked: 373c4d6. Worktree is clean.

## Harness
`acceptance:setup` ran (Chromium installed). `npm run acceptance -- acceptance/aoe4-split-tab-order.spec.ts acceptance/aoe4-my-builds.spec.ts`: 75 passed. This covers both Tab-order tests and the my-builds spec that now imports `saveCopy` and `editedCopy` from `acceptance/helpers.ts`. `npx tsc --noEmit && npm run lint:dup`: 0 clones.

## Tests (existing, pass)
- `edited saved build: ...`: asserts `save-build` is visible and enabled and the link is hidden, then walks the Tab order. Order and document position are `duration-seconds`, `editor-view-text`, `save-build`, `save-build-copy`, Build column, Results column. No positive tabindex.
- `saved link shown: ...`: asserts the link is visible and `save-build` is disabled, then walks. Order is `duration-seconds`, `editor-view-text`, `save-build-copy`, `saved-build-link`, `copy-saved-link`, Build column, Results column. `save-build` is not a stop and precedes `save-build-copy` in the DOM. `compare-collapse` comes before every handle, and each chart section's handle comes before its caret. No positive tabindex.

## Mutation checks
Each break was made in production code, the spec was rerun, then `git checkout -- components` was run and `git diff --exit-code` came back clean.
- `save-build.tsx` `tabIndex={-1}` on `save-build`: the edited test failed on "save-build is reached after the previous stop". The link test passed, as it should.
- `save-build.tsx` `tabIndex={1}` on the `save-status` `<p>`: both tests failed on `expect(positive).toBe(0)` (spec line 87). The no-positive-tabindex check is now probed.
- `save-build.tsx`: moved `save-build` after `save-build-copy` (the review's unprobed edited-state ordering item): the edited test failed on "save-build-copy is reached after the previous stop". Probed.
- `save-build.tsx`: `copy-saved-link` rendered before `saved-build-link`: the link test failed on "copy-saved-link is reached after the previous stop".
- `chart-header.tsx`: caret moved before the drag handle: the link test failed on "every chart section has a handle stop", not on the per-section "handle comes before its caret" assertion. The walk ends at the last chart's caret, so that chart's handle is never recorded and the earlier assertion fires first. The per-section ordering assertion is only reachable when all handles are present, so it was not isolated (see below).
- `workbench-tabs.tsx`: Build and Results columns swapped: both tests failed, but in the "every chart section is rendered" setup assertion (`lastChart`), not an order assertion. It is not clear why the charts were absent. The column-order assertions (`inBuildColumn` then `inResultsColumn`) were therefore not shown to fail on their own assertion.

## Findings (none blocking)
- spec-gap, weak probe: no break was found that fails the column-order or per-section handle-before-caret assertions on their own. A column swap trips a setup assertion first. A handle-after-caret break trips the handle-presence assertion first. The assertions are plausible, but not proven by mutation. A possible hardening, if wanted, is to compute the last chart's handle position from the DOM rather than from the stops.
- Criteria not expressible: none. The doc and grep criteria are not part of the acceptance harness.
