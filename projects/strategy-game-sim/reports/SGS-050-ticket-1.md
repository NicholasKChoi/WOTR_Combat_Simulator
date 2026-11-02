# SGS-050 ticket author report 1

File: projects/strategy-game-sim/tickets/SGS-050-aoe4-build-spear-longbow-maa-crossbow.md

Summary: prebuilt build "ENG Spear/Longbow into MAA/Crossbow" (aoe4-build-order, data). New file
builds/english-spear-longbow-maa-crossbow.json, one import and array entry in builds.ts (after ENG 1TC), one shape
test in builds.test.ts, README entry. About 3 lines business logic. Depends on SGS-039 and SGS-040 (final names to
be re-read; SGS-039 was being re-specced). Covers M3.7 and M3.11: the full bar at 1200 s and 3600 s, including its
own gold deposit reactions (one per deposit that runs out by 3600 s, measured by the implementer on the SGS-039/040
base), a shape test (Feudal via council-hall, Castle via kings-palace, transition steps after Castle, Castle reached
and all four units produced at 1200 s), no change to defaults or ENG 1TC, and implementer-run mutations.

Risk: high (builds.ts is a non-test file under criticalPaths lib/**; the plan said medium). Real risk is tuning.
On merge: none. Diagrams: none required (single component, data).

Basis: a throwaway 23-step draft run on main (all nodes infinite, worktree since removed) started every step by
1200 s and gathered about 2,600 gold by 1200 s and 9,000 by 3600 s, so expect 2-3 deposit run-outs by 3600 s.
Not committed, not tuned. Criteria with commands were run on main: no match for the new file name (0 lines), 1 build
file present. Mutation criteria could not be run (bar and paste checks do not exist on main); the implementer runs them.

Open question (designer): the task said the old prebuilt file is renamed by this ticket. Final design/M3.md lists the
new file as new and keeps english-1tc.json (Playwright spec imports it, README and tests name it); only
reports/M3-designer-2.md says "renamed". The ticket renames nothing.

Overlap: SGS-051 edits the same builds.ts array line (rebase only). SGS-039/040 rewrite the docs Prebuilt builds
paragraph and the bar test; this ticket re-reads them and adds no second copy of the bar.
