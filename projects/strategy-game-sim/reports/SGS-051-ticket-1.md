# SGS-051 ticket report 1

File: projects/strategy-game-sim/tickets/SGS-051-aoe4-build-knight-longbow.md
Title: Add the prebuilt build ENG Knight/Longbow (King's Palace). Component aoe4-build-order. Size ~3 business-logic lines (builds.ts entry) plus a new JSON build and one test case. Risk: high (REPO.md criticalPaths lib/** matches builds.ts; plan said medium; template rule wins). On merge: none (outline gives none).
Depends on SGS-039 (E), SGS-040 (F), SGS-041 (G); transitively 038, 037, 035. SGS-050 (P) did not exist: shares only the BUILDS array in builds.ts, rebase only.

Covers: file/name/source/start.rally; Feudal landmark chosen by implementer; Castle via kings-palace; blacksmith techs after the kings-palace step; knight/stable and longbowman/archery-range; gold deposit reactions for every deposit that runs out by 3600 s (rally reactions if producers are rallied to gold; no build-then or rally to a depleted ref, bar part 5); full bar at 1200 s and 3600 s (parts 1-3 from SGS-039 both horizons, 4-5 at 1200 s from 039 and 3600 s from 040); non-vacuous part 4 at 3600 s; order test; Castle time and unit counts at 1200 s reported against the reference in the PR body (not asserted).
Diagrams: none (single component, no control loop change).
Open questions: none.
Findings used: kings-palace-2 is age2_landmark1 (1200 food, 600 gold, 220 s); knight exists only as knight-3/-4, so produce knight waits for Castle and blocks later steps (stated as an ordering constraint); veteran-horsemen targets horseman, not knight; builds.test.ts already requires start.rally.
Criteria checks run on main: english-knight-longbow.json absent; grep count of "english-knight-longbow" in builds.ts is 0 (2 after); the two jq order queries run on english-1tc.json (research min index 22, kings-palace index null there, so they are well-formed). Mutation criteria cannot run until the build and bar test exist on the base.
Overlap: SGS-050 (builds.ts only); SGS-054 audits docs.
