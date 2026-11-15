# SGS-165 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-165-doc-pinned-series-color-wraps.md

Docs ticket, component aoe4-build-order, Milestone none, Risk low, about 3 lines, no dependencies, On merge none.

- Doc: `docs/aoe4-build-order.md`, the chart paragraph "With a pinned run, each chart also draws the pinned run's series dashed". It gives the palette index for a pinned-only series as (current series count) + (pinned index) and does not say the index wraps.
- Code: `pinnedColor` in `components/apps/aoe4-build-order/chart-rows.ts` passes that index to `seriesColor`, which returns `PALETTE[index % PALETTE.length]`.
- Missing claim: the index wraps by modulo the palette size, so colors repeat past the last one.
- Criteria: the doc states the wrap, quotes no palette length, and only that doc changes.
- Diagrams: none. Open questions: none. Overlap with other tickets: none found. Lint passed.
- `git fetch origin` printed a ref lock error on `origin/code-factory-state` only. Reads used `origin/main`, whose docs and code matched the working files.
