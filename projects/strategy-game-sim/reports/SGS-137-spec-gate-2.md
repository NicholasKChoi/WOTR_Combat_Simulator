# SGS-137 spec-readiness gate, run 2

Verdict: READY

Read at origin/main, plus the SGS-138 re-specced ticket, design/M9.md C7 and C9, and TASK-GRAPH.

## Earlier gaps

1. Conflict with SGS-138 (pinned tooltip values): closed.
   - Depends-on now includes SGS-138, and the TASK-GRAPH row matches (SGS-134,135,136,138).
   - Pinned values are no longer read from the tooltip. Playwright checks drawn `path[data-series="pinned:<key>"]` lines. Vitest checks an exported per-view series selection.
   - SGS-138's pinned-case rewrite of the old spec is a minimal path-count case, plus a Vitest `perVillagerSeries` case. SGS-137 says it deletes or rewrites those: "in whatever form SGS-138 left it", and the Vitest case is "deleted with `perVillagerSeries` or rewritten to the Villagers view". The two tickets are consistent and the order is fixed.
2. Docs chart-series table: closed. Scope now names the table, says its rows are the default views, and says the alternate series are described next to it.

Also folded in from the round-1 notes:
- The hover helpers move into the new spec or `helpers.ts`.
- The search now includes `Per villager` over docs, ARCHITECTURE.md, acceptance and components.
- The legend-stays-hidden case is stated on Gather rates.

## Fresh checks

- Grounded: at origin/main, `perVillagerSeries`, `gather-rates-per-villager`, the old spec, the checkbox in `results.tsx` and the doc lines 976-977 and 996-997 exist as described. `aoe4-chart-layout.spec.ts` uses the checkbox at lines 61 and 82, so the rewrite by SGS-135 followed by the move here is grounded.
- Contracts: type names, DOM, view tables, defaults and y labels match design C7. `BuildingSeries` matches C9.
- Criteria: the Playwright criteria guard against vacuous passes (they assert the preconditions first). The Vitest selection criterion can fail if Villagers plots rates, Buildings plots units, or the wrong run is read. No stale numbers are pinned.
- Open questions: none. Decisions are not contradicted.
- Risk: standard is right. No engine, data or criticalPaths symbol is touched.
- Unverified assumptions: none is right. Recharts tooltip behavior belongs to SGS-138.
- Overlap (check 14): no throwaway work remains. SGS-141 is the later docs pass and depends on this ticket.
- On merge: none, well-formed.

## Notes (non-blocking)

- SGS-138's re-spec 2 says reading the pinned value from the drawn path "is not workable", while SGS-137 compares drawn `d` attributes of `food` and `pinned:food`. Comparing that the two paths differ (not reading values) is workable: both lines share one y scale. SGS-137's wording should stay as is. It is only the reasoning in SGS-138 that differs.
- The `git grep` criteria could add `':!.claude/'`, as SGS-138's search does, so the factory worktree's ticket text is never matched.
- The per-view series selection name is left to the implementer and reported for CONTEXT.md Key surfaces. The tech lead or the closeout step should record it.
