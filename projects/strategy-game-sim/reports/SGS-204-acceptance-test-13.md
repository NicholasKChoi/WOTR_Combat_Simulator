# SGS-204 acceptance-test 13

Verdict: PASS. Tip d09af46ef1a068b0978c5afd4b0c7420591edea2. No new commit (no tests written).

## Tests written
None. The implementer's spec additions in `acceptance/aoe4-units-chart-upgrade-dots.spec.ts` (describe "AoE4 Units chart upgrade dot tier texts", 5 tests) already cover every browser-observable criterion: per-dot tier text and data attributes inside the plot, two-tier non-overlap (one evaluate), pinned fainter opacity and ring/dot non-overlap (one evaluate), follow-the-dot (legend hide, zoom, Buildings view, other charts), right-edge zoom. Docs criteria are not expressible as tests. Unit-level criteria belong to the implementer.

## Run
Harness ran: `acceptance:setup` done, then Playwright on `aoe4-units-chart-upgrade-dots`, `aoe4-help-modal`, `aoe4-chart-readability`, `aoe4-marker-labels` specs: 43 passed, 0 failed. `tsc --noEmit` clean.

## Mutation checks (my own, on the spec's assertions)
- `result-series.ts` `placeTierText`: `fitsRight = true`. The right-edge test failed in `expectTiers` (spec :585, inside-plot check). Undone.
- `line-chart.tsx`: `PINNED_TIER_TEXT_OPACITY = 1`. The pin test failed at spec :529 (`toBeLessThan`). Undone.
- Implementer-11's recorded breaks for exact-point grouping and no merging (two-tier test :519, pin test :543) were not re-run; I accepted that record.
- `git checkout -- components`; `git status` and `git diff --exit-code` clean.

## Failures
None.

## Criteria not expressible
Docs wording (`docs/aoe4-build-order-ui.md`, `page-help.tsx`) is not testable; the help-modal spec's `upgrade dot` / `unit line` phrases still pass.
