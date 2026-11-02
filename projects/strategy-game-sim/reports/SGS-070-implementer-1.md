# SGS-070 implementer 1
Branch sgs-070-aoe4-chart-legends-markers, tip 935bb17, worktree .claude/code-factory/worktrees/sgs-070-aoe4-chart-legends-markers. Status: needs_review.
Files: chart-legend.tsx (new: legendItems, SeriesLegend, MarkerLegend); line-chart.tsx (no Legend, exported placeMarkers/PlacedMarker with labelWidth, measured widths via hidden svg text + effect, top margin, data-label-rows, solid markers, label offset 0); line-chart.test.ts; acceptance specs (2) + helpers.ts (hexToRgb moved here); docs/aoe4-build-order.md.
Tests: npm test 1086 passed/8 skipped; tsc ok; next build ok; lint:dup 0 clones; acceptance 550 passed, 1 flaky (pin-compare "a 400 run removes charts..." failed once in the full run, passes 2/2 alone).
Edited existing tests: legend click test, marker test, pinned-dash test, pinned legend test (acceptance specs) per ticket scope 3.
Mutations: row-always-0, ignore labelWidth, pinned-only-first, heading text each failed tests, undone. Swatch style mutation not caught by unit tests (covered by acceptance only).
Note: label offset set to 0 so row r sits at 5 + r*14 as spec'd (default offset 5 pushed bottom row 1.5px into the plot).
