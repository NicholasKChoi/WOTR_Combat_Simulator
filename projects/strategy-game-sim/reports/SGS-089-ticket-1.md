# SGS-089 ticket report 1

Ticket: tickets/SGS-089-aoe4-engine-guard-crashes-hangs.md. Risk high (owner instruction; criticalPaths file, no listed symbol changes). dependsOn none. Base main (origin/main cc9bb04; local main is behind).

Backlog bullets covered: line 25 (zero-time loop), line 42 (`spawnUnit` rally), and the TypeError half of line 24.
Dropped from line 24: the redundant condition (`'reserve' in outcome || ...` is gone from simulate.ts; only a test mentions `'reserve' in`), and the "hook returns false" TypeError (a false hook means no villager order, nothing spawns; the live case is hook true with no rally). The weak supply-wait assertion stays in (confirmed weak: mutating the `produce` handler to return a `reserve` on the population wait leaves simulate.test.ts at 69/69 passing).

Verified by running in a throwaway worktree (removed): free zero-time villager entry hangs `simulateBuildOrder` (killed by timeout); `productionModifier` 0 and -5 return, NaN yields no units; `start: {}` throws "Cannot read properties of undefined (reading 'walkSeconds')". Shipped data has no unit with time, cost or popcap 0.

Shipped-build check: the ticket requires comparing `JSON.stringify` of `simulateBuildOrder` for the three `listBuilds()` builds on main vs the branch (throwaway script, `cmp`), plus the unchanged unit suite.

Diagrams: none (no new transition). Overlap: SGS-080/081 touch the same file area (farms); no scope overlap found. Open question (designer): API handling of a thrown Error left unchanged.
