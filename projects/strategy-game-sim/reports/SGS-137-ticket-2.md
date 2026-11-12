# SGS-137 ticket author, run 2 (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-137-chart-view-toggles.md
Lint: `ticket-lint.py` clean.

## Summary

"Replace the Per villager checkbox with view toggles on Gather rates and Units produced", component aoe4-build-order, M9.6, Risk standard, about 140 LOC (up from 120 for the exported per-view series selection). Depends on SGS-134, SGS-135, SGS-136, SGS-138, which matches the graph row. Criteria cover the toggle markup, both views and their y labels, the toggle working while collapsed, reset on reload, keyboard use, `buildingSeries`, the per-view series selection (Vitest), pinned lines following the view (read from drawn lines), removal searches, and docs.

## Findings folded in

1. **SGS-138 conflict (blocking).** I added SGS-138 to Depends on, and Scope now starts from SGS-138's end state, where the tooltip has no `(pinned)` rows. Pinned values are never read from the tooltip. Two checks replace the old tooltip read:
   - Vitest: a new criterion covers the per-view series selection. It is an exported pure function or table in `result-series.ts`, and the implementer names it in the report for CONTEXT.md Key surfaces. The test fails if Villagers plots rates, Buildings plots units, or the selection reads the wrong run.
   - Playwright: with two runs whose food gatherer counts differ, the drawn `food` and `pinned:food` paths must differ in Villagers view. In Buildings view, a building only the pinned run has gets a `pinned:<baseId>` line and no solid line.

   The old spec is deleted "in whatever form SGS-138 left it". Any Vitest per-villager pinned case that SGS-138 adds is deleted or moved to the Villagers view.
2. **Docs table (blocking).** Scope now names the chart-series table under "A 200 draws four line charts". Its rows describe the default views, and each toggle's alternate series is described next to the table. The docs criterion is tagged.
3. **Notes.**
   - The hover helpers move out of the deleted old spec into the new spec, or into `helpers.ts` if another spec needs them. A criterion requires that they exist in one file only.
   - The hidden-legend case is set on Gather rates.
   - The search criterion adds `git grep -n "Per villager" -- docs ARCHITECTURE.md acceptance components`. It is limited to those paths because `lib/aoe4-build-order/gather.ts` has an unrelated `// Per villager` comment.

I ran both search criteria at origin/main. Today they match only `results.tsx`, `result-series.ts`, `result-series.test.ts`, the two acceptance specs and `docs/aoe4-build-order.md`, all of which Scope covers.

## Diagrams

None. This is a single-component change outside the core loop.

## Open questions

none

## Overlap

- SGS-138's current Scope still has a bullet that rewrites `acceptance/aoe4-gather-rates-per-villager.spec.ts`. That file is being re-specced in parallel and I did not edit it. That work is thrown away when SGS-137 deletes the spec. SGS-138 should keep the minimal change, either removing that pinned case or moving it to Vitest, and SGS-137 handles the rest.
- No SGS-137 branch exists yet.
