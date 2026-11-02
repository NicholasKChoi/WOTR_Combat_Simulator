# SGS-035 spec gate 1

Verdict: READY

Checked against origin/main f078c11, design/M3.md, the dependent tickets (SGS-037/038/039/041/042/043/047/048/049/050) and INVARIANTS/LESSONS (no lessons entries).

## Checks
1. Grounded scope: every named file/function exists on main (simulate.ts costOf :121, affordable :129, markCompleted :201, spend :294, villagerWalk :300, currentUnitEntry :463; research.ts and houses.ts copies; chart-rows.ts:15 formatMinSec; parse-text.ts:301). New files are marked new. `EffectState` has `data`, so `villagerWalkSeconds(state: EffectState, ...)` is feasible.
2. Criteria: grep counts verified on main (9 const lines; 6 lines for new RegExp/currentUnitEntry/function spend|affordable|villagerWalk; 3 Math.max(0, ...resources) lines). All criteria are observable and carry a mutation check.
3. Open questions: none; CONTEXT.md has none.
4. Invariants A1-A3 named, no contradiction.
5. Contracts match design/M3.md exactly (engine-common exports, test-helpers table, format-time, jscpd settings, SpendCategory, GATHER_NODES, RESOURCE_KINDS). Downstream tickets (037, 038, 041, 043, 047-049) cite the same names and ownership.
6. Dependencies (none, first M3 engine ticket) and size (~120 LOC) fine.
7. Diagram present (trigger: core event loop payment path).
8. Decisions: body agrees with design (1e-9 tolerance, no re-export of formatMinSec).
10. On merge names the lint command change.
11. Risk high is right (`lib/**`).
12. Docs: grepped docs/ARCHITECTURE/README for tolerance/EPSILON/1e-9, nothing stale; ARCHITECTURE.md Rules line is in scope.

## Notes (non-blocking)
- `villagerWalk` on main takes `walkSeconds: number | undefined` and falls back to `state.inputs.walkSeconds`; the new `villagerWalkSeconds(state: EffectState, walkSeconds: number)` cannot read `inputs`. Item 2 says "bodies moved with one change", but the three simulate.ts call sites (:321, :339, :365) must now pass `x ?? state.inputs.walkSeconds`. Suggest one sentence in Scope 3 saying so.
- Scope 3 `spawnUnit` is conditional ("only if tests stay green unchanged"). It is villager-only (early return for non-villagers), and differs only in classes source (entry vs the first villager entry). Suggest stating "leave it" to remove the guess; if swapped, a changed test counts as a behavior change.
- The `git grep -l "test-helpers"` criterion would list `test-helpers.ts` itself if it names itself in a comment; the file should avoid that.
- The spend-totals criterion says "50 x villagers"; the test should read the villager cost from game data (A1 applies to tests only by convention).
