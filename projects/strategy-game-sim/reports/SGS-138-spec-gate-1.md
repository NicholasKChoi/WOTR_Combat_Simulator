# SGS-138 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main. SGS-135 is not integrated yet, so the header code was not checked. Nothing in the ticket touches it.

## Gaps

1. Acceptance criteria (search criterion) - The criterion requires `git grep "chart-pinned-key\|PinnedLineKey\|pinned-age-up"` to have no match in source, tests, acceptance specs or docs. The design Criteria map for M9.5 says the Vitest case asserts `chart-pinned-key` and `pinned-age-up` are "absent". That assertion writes those strings into a test, and the ticket's "A test fails if..." wording implies absence tests. The criterion forbids what the tests need, so an implementer must pick between them. Fix: scope the search to non-test source and docs, or say test files may name the removed ids only inside negative assertions. Alternatively drop the negative assertions: the markup checks for `chart-pinned-legend` already cover the behavior.

2. Scope, gather-rates spec rewrite - "Read the pinned values from the pinned line's drawn path" is not specified. Converting SVG path pixels to Food values needs the axis scale, which the spec helper does not have. Per-villager division of the pinned run would then be asserted loosely or not at all. Fix: choose one route. Preferred: move the check to Vitest, on `toChartRows` or the series the chart is given for the pinned run with the per-villager flag on. Keep only the hidden-legend-entry-stays-hidden part in Playwright, as an assertion on the `path[data-series]` count rather than on values. Say that the Playwright case no longer reads pinned tooltip values. Today's spec, lines 113-140, reads `Food (pinned)` in both the raw and per-villager halves.

3. Scope, M9.6 overlap (item 14, throwaway work) - The per-villager checkbox that this spec and the docs paragraph at lines ~975-979 describe is replaced by the Rate/Villagers view toggle in SGS-137, which depends on SGS-138's chain. Rewriting the gather-rates spec's per-villager pinned case here is partly throwaway. Fix: keep the rewrite minimal, which is the Vitest move in gap 2. SGS-137 then retargets the Playwright case once.

## Checked and fine

- Files exist at the base: `line-chart.tsx`, `chart-legend.tsx`, `chart-rows.ts`, `docs/aoe4-build-order.md`, `acceptance/aoe4-build-order-pin-compare.spec.ts` and `acceptance/aoe4-gather-rates-per-villager.spec.ts`. `PinnedLineKey`, `MarkerLegend`'s `pinnedAgeUps` prop and `legendItems` all match the ticket's descriptions.
- The doc statements named in Scope exist, at `docs/aoe4-build-order.md` lines 981 and 988-989. `ARCHITECTURE.md` has no matches.
- C6 and `pinnedLegendShown` match the design. The respec 1 criteria are testable.
- The Unverified assumption holds. recharts 3.10.1 has `Line.tooltipType`, and `DefaultTooltipContent` skips entries with `type === 'none'`. The Tooltip uses the default content.
- Risk low, LOC about 60, and Depends-on SGS-135 are consistent. On merge `none` is valid.

## Notes

- Criterion "tooltip items include no name ending in `(pinned)` and do include the current-run series" is fine. Add that the hover point must be inside the plot, because the tooltip only renders on hover.
- Several other specs may read the pinned tooltip (`acceptance/aoe4-chart-readability.spec.ts` reads tooltip text but not pinned names). The generic Scope sentence covers this.
- Gap 1 is not owner-only. Gap 2 needs no owner decision either.
