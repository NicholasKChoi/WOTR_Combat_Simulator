# SGS-219 acceptance-test 11

Verdict: PASS. Tip c68ccbd37440697c46d3dfa722e919c77d9aa659 (was 65026066; two test-only commits: 1d75c43, c68ccbd). Not pushed.

## Tests written
- `acceptance/aoe4-population-cap-mark.spec.ts` "a pinned run that reached the cap adds no mark to the Units produced chart when the current run did not": criterion 4 (pinned run draws no mark of its own on Units; the Units chart carries the pinned line `pinned:villager` throughout). The implementer's spec only covered this on Population.

Already covered by the implementer spec, not duplicated: criteria 1, 2, 3, 4 (hide, hover, pin, zoom), 5.
Not expressed: Units chart with a pinned run that has no markers (no build in the harness with a pinned run lacking markers); doc and page-help criteria (unit layer, not acceptance).

## Results
Harness ran (Playwright, Chromium). Spec alone: 15 passed. Spec plus aoe4-marker-labels, aoe4-chart-readability, aoe4-chart-views, aoe4-chart-zoom, aoe4-units-chart-upgrade-dots: 86 passed, 0 failed. Lint (`tsc --noEmit` and `lint:dup`): clean, 0 clones. No failures to classify.

## Mutation checks
Run in the `mutate-sgs-219` scratch (committed tip 1d75c43). Provisioned with `link-node-modules.sh .` and `npm run acceptance:setup` through `run.sh`. Each break reset with `git checkout -- components` and `git diff --exit-code` (RESET OK each time). Scratch removed.

tree-record.sh on the task checkout, taken before the scratch was created (after committing my first test; the clean tree): hash 6d9b3f285ef4cb73bf050b5c44bc358bfe4a646f, empty listing. After removing the scratch and after the second commit: identical hash and empty listing. Match. (A pre-commit record with my spec uncommitted read hash 5a626aff..., listing ` M acceptance/aoe4-population-cap-mark.spec.ts`; the file was then committed and carried into the scratch.)

Breaks, all against the new test (spec lines at the new test as run in the scratch):
- `results.tsx:145` Units uses the pinned run's mark when the current run has none (the realistic wrong implementation: fall back to the pinned cap): fails `:248` `toHaveCount(0)` on the Units mark (Expected 0, Received 1).
- `results.tsx:73` delete the Units `timeMark` entry: fails `:244` mark count (Expected 1, Received 0).
- `results.tsx:141` Units chart gets no `pinned` series: fails `:243` pinned line count (Expected 1, Received 0).
- `results.tsx:141` Units pinned series dropped only when the current run has no cap: fails `:247` pinned line count after the run (Expected 1, Received 0).
- A fifth assertion, `markLabel(UNITS)` `toHaveCount(0)`, had no break that fails it alone (the label is a child of the mark line); it was deleted (c68ccbd). Spec lines before deletion; the test now has 4 assertions each matched above.

## Out of scope / notes
Implementer-9 and review-10 mutation records for the existing tests stand; I did not rerun them (no change to those tests).
