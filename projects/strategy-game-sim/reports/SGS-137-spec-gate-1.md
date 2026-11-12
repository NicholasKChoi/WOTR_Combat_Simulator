# SGS-137 spec-readiness gate, run 1

Verdict: NEEDS_SPEC

Read at origin/main plus the SGS-134..136 tickets and design/M9.md C5, C6, C7, C9 and the Chart views rules.

## Gaps

1. **Scope / Acceptance criteria (pinned) / Depends on - conflict with SGS-138 (check 14, check 13)** - SGS-137 requires a pinned-run tooltip value that "follows the view and differs from the current run's" (the old spec's `hoverRead(page, 'Food (pinned)')` case, kept "in view terms"). SGS-138 (design C6, depends only on SGS-135, unordered against SGS-137) excludes every pinned `Line` from the tooltip, so after SGS-138 lands no `(pinned)` tooltip row exists and this case cannot pass. SGS-138 also has its own Scope item rewriting `aoe4-gather-rates-per-villager.spec.ts`, which SGS-137 deletes: overlapping, throwaway work on the same file. An implementer would build the spec on tooltip reads, or on whichever ticket merges first.
   Proposed fix: add SGS-138 to SGS-137's Depends-on (the TASK-GRAPH row too), and say in Scope that pinned values are read from the pinned line's drawn path (`data-series="pinned:<key>"`) or asserted in Vitest, not from the tooltip, with a criterion stating the property: "the pinned line in Villagers view is drawn from the pinned run's `gatherers`". Remove the old-spec rewrite from SGS-138 (it becomes "none, the spec is replaced by SGS-137"), or decide the opposite order explicitly. Criterion wording in AC "Pinned run" and the "tooltip value of the pinned run" case in Scope must change accordingly. Needs the manager/graph owner, not the product owner.

2. **Docs (check 11)** - `docs/aoe4-build-order.md` has a chart-series table just above the Per villager paragraph (rows "Units produced: each unitsProduced unitId ... `<name> (tier <tier>)`" and "Gather rates (per minute)"). It becomes untrue: Gather rates can plot `gatherers`, Units produced can plot `productionBuildings` (key `baseId`, name `name`). Scope names only the Per villager paragraph and the Chart controls paragraph. An implementer would leave the table stating one series per chart. Proposed fix: add the table to Scope's docs list, saying the rows describe the default views and the toggle's alternate series are described next to them.

## Checks that passed

- Grounded scope: `results.tsx`, `result-series.ts`, `result-series.test.ts`, `perVillagerSeries`, `gather-rates-per-villager`, the old acceptance spec, `helpers.ts` exports (`openPage`, `showTab`, `waitForRun`, `CHART_IDS`) exist at origin/main; `chart-view-toggle.tsx` is declared new. Doc statements at lines 976-977 and 996-997 are the ones quoted.
- Contracts match design C7 (type names, DOM, tables, defaults) and C9 / SGS-136 (`BuildingSeries { baseId, name, counts }`).
- Open questions none; PROJECT decisions not contradicted. Invariants none touched. Risk standard is right (no criticalPaths symbol). On merge `none` is well-formed. No unverified external behavior beyond what SGS-138 lists. No validation boundary. Size about 120 LOC.

## Notes (non-blocking)

- The helpers `hoverPlot`, `readTooltip`, `hoverRead`, `samplesAt`, `expectOneOf` live inside the old spec, not `helpers.ts`. Scope says to "reuse the old spec's helpers" while deleting that file; say they are moved into the new spec (or `helpers.ts`), since lint:dup scans `acceptance/`.
- The legend-stays-hidden-across-view-switch case is meaningful only on Gather rates (the keys `food`... are shared by both views). On Units produced, unit ids and `baseId`s differ, so hidden state is a no-op there; the AC already says "within the same chart", fine, but a test should use Gather rates.
- The criterion "No source, test, spec or doc references ... `git grep` has no match in the tree" excludes `Per villager` prose; SGS-141 greps `Per villager` too. Consider adding `Per villager` to this ticket's search so the doc work is checked here.
