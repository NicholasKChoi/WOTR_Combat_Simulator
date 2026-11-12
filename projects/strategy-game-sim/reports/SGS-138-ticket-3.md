# SGS-138 ticket 3 (re-spec 2)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-138-pinned-runs-no-tooltip-one-legend-entry.md

## Summary

SGS-138, "Keep pinned runs out of the chart tooltip and show one dashed legend entry", component aoe4-build-order, M9 / M9.5, risk low, about 60 LOC, depends on SGS-135. This re-spec folds in the three gaps from spec-gate 1:

1. **Search criterion.** It no longer forbids the removed ids in tests. The grep excludes `*.test.ts`, `acceptance/` and `.claude/`, and test files and specs may name `chart-pinned-key`, `pinned-age-up` or `Age-up (pinned)` only inside absence assertions. A Scope bullet says the same. I ran the scoped grep at origin/main: it matches only `chart-legend.tsx` and `docs/aoe4-build-order.md`, both of which Scope changes.
2. **Gather-rates spec.** The pinned per-villager division moves to a new Vitest case in `result-series.test.ts`. It runs `toChartRows` over two runs' `perVillagerSeries` and checks `pinned:food` against the pinned run's rate divided by its gatherers, with the 0 case and a guard that the two runs differ. The Playwright pinned case in `acceptance/aoe4-gather-rates-per-villager.spec.ts` reads no `(pinned)` tooltip value. It keeps only the hidden-entry-stays-hidden check, as `path[data-series]` and `path[data-series="pinned:<key>"]` counts, plus a still-drawn series asserted before and after the toggle.
3. **Throwaway work (gap 3).** The rewrite is now minimal, because SGS-137 deletes the spec. Scope says this.

The gate's note is also folded in: the tooltip hover must land inside the plot area. The new and changed criteria are tagged `(respec 2)`, and a `## Re-spec 2 - 2026-11-11` section is appended. ticket-lint passes with no output.

Diagrams: none (single component, no control loop).

## Open questions

none

## Overlap / for the manager

- **SGS-137 contradicts SGS-138's end state.** SGS-137 depends on SGS-138, but two parts of it still assume pinned values can be read from the tooltip:
  - Its Acceptance Scope bullet keeps "a pinned run's tooltip value follows the view and differs from the current run's".
  - Its "Pinned run, Playwright" criterion has the pinned dashed lines take their values from the pinned run's `gatherers`, and gives no way to read them.

  After SGS-138 the tooltip has no pinned rows. SGS-137 needs a re-spec to check pinned values the same way this ticket does now: a Vitest case on the series function applied to the pinned run, plus Playwright path counts or `data-series` presence only.
- **Coverage gap until SGS-137 lands.** The Vitest case checks the per-villager series and row building for the pinned run. It does not check that `results.tsx` applies the same `series` function to the pinned run; that wiring is then checked only by eye. SGS-137 rewrites that wiring.
