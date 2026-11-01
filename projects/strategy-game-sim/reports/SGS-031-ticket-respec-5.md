# SGS-031 ticket re-spec 5

Ticket: tickets/SGS-031-aoe4-build-move-ages.md. Findings: reports/SGS-031-spec-gate-5.md. Wording fixes only; the allowed-edit set is the same (Seam test and helper, the eight SGS-030 pins, the two-line research.test.ts pin, the general auto-house rule).

## Changes
1. Final criterion diff check (now tagged respec 4, respec 5): "no `expect(` line ... changed" became "no expected number, step list, start, game data or helper changed". The one allowed changed `expect(` line is named: `countAt(def, 'villager', 80)` -> `countAt(run([], { inputs: inputsFor(data, { autoHouses: false }) }), 'villager', 80)`, with the expected 3 unchanged. The supplyProvider bullet in Scope section 5 now states the same allowed form and why: `const def = run([])` (simulate.test.ts l.610) is compared with `toEqual` in `defaults to the english rules, which are the empty frozen set` and is also read by `productionModifier changes the production time`.
2. Scope section 5 intro and the Seam no-handler bullet: removed the stale wording about a `research` step reporting `waiting`. They now say the test `leaves build and move waiting and blocking` is removed, and `leaves an action with no registered handler waiting and blocking` (it deletes and restores `stepHandlers.research` through its local `handlers` alias) stays as it is on origin/main. This matches clause (a).
3. Added `## Re-spec 2026-11-01 (5)`. The section 5 heading also gets the respec 5 tag.

## Verified in worktree @ 13ec441 (origin/main ce342db)
- simulate.test.ts l.522: `leaves an action with no registered handler waiting and blocking`. It does `delete handlers.research` and restores it at l.534-541, the same as on main (l.533).
- On main, `leaves build and move waiting and blocking` exists. The branch diff removes it.
- l.610 `const def = run([])`. l.629 `supplyProvider changes the supply a building gives`. l.632 is the substituted `expect(` line, exactly as quoted.
- In the simulate.test.ts diff, the only changed `expect(` lines are inside the Seam test plus the l.632 substitution.

## Owner gaps
None.
