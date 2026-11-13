# SGS-160 ticket report

- File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-160-fix-results-split-spec-chart-id-filter.md
- Lint: ticket-lint.py printed no errors.
- Summary: Bug, component aoe4-build-order, Milestone none, Priority medium, Risk low, about 2 lines (test only), no dependencies, On merge none. Fix `acceptance/aoe4-results-split.spec.ts`: the `startsWith('chart-')` filter now also matches `chart-reorder-help` and `chart-order-status`. These are hidden paragraphs that `results.tsx:ResultsPanel` gained in 94a439d. Select by membership in `CHART_IDS` instead and keep the last-four-children assertion. The product is unchanged. Cause, Evidence and Ruled out are copied from the RCA. I re-checked at origin/main that the spec still has the prefix filter, that `results.tsx` has both paragraphs, and that no other `chart-` prefix selector exists.
- Criteria: passes now and fails at base; still fails for a wrapped chart or a chart before the paragraphs, confirmed by the implementer with a temporary reverted change; independent of other non-chart child ids; only the spec file changes; other assertions kept.
- Diagrams: none (the one-line "no diagram required" sentence).
- Open questions: none.
- Overlap with other tickets: none checked beyond the RCA. This is a one-expression change, and I found no other ticket editing that spec.
- Not done: `git fetch origin` failed with "task 'gc' failed", so I read the last fetched origin/main. I did not run the spec or the mutation checks. The sandbox restricts worktree creation, so the mutation criterion is assigned to the implementer.
