# SGS-190 ticket 2 (re-spec 1)

**Ticket**: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-190-steps-wait-for-free-building.md
**Verified against**: origin/main 87f0cd7. ticket-lint: clean.

## Summary

SGS-190 "Steps wait for a free building (produce and research)", component aoe4-build-order, M11, risk high, about 150 business-logic lines, depends on SGS-189. The engine scope is unchanged: `instanceFree`, the `produce` busy check and hold, `offerSteps`/`startProduction` with `EngineState.held`, the research target, and the Spear/Longbow removal of four Castle blacksmith researches. Criteria cover the free test, single and multiple busy targets, `instance: k`, check order and reserve, reactions, research waits and candidate choice, a research pausing production, the missing-target and horizon cases, A2/A3, the re-baseline rule, the Knight/Longbow tier test, the build edit, builds.test bars, acceptance, and docs/README.

## Gate findings folded in (spec-gate 1)

1. README "Nothing is omitted." In Scope, the Spear/Longbow entry now lists two untrue statements: the "Feudal and Castle attack and armor upgrades" sentence and "Nothing is omitted.". The entry must name the four techs as omitted. Any other sentence of that entry the rule makes untrue gets fixed too (example: the men-at-arms/crossbowman transcription note). The criterion now requires the entry to name the four techs as omitted and never say nothing is omitted.
2. Doc reserve statements. Scope now lists Priority "While it waits on resources only, it reserves its cost" and the research paragraph "it reserves resources only when it is short of resources alone". A new criterion says no doc sentence says a step reserves only while waiting on resources alone. Its searches for `While it waits on resources` and `short of resources alone` over `docs/aoe4-build-order.md` both match at the base (lines 177 and 223). The existing `Queue length is not consulted` and `replaces its order (a switch)` searches also still match at the base.
3. Consistency with SGS-189 (manager note). Scope and a new criterion no longer assume SGS-189 leaves the test in (840, 845]: on today's engine it completes at about 838 s. The test keeps its rule:
   - completion within the horizon
   - the whole tier-2 stock is tier 2 at the last sample before completion and tier 3 at the first sample at or after it
   - no tier-2 remains afterwards

   Sample times derive from `completedAt`, and counts are re-pinned to what the engine returns. The design's 841.2 s prototype figure is cited only as a measurement, not as a bound. The report records the completion time and counts.

## Diagrams

The existing flowchart of the `offerSteps`/`startProduction` read/act/record loop is kept, unchanged.

## Open questions

none

## Overlap / notes for the manager

- The SGS-189 ticket file still says completion "stays in (840, 845]" (Scope Tests line and its criterion), because its re-spec is running in parallel. SGS-190 now works whether SGS-189 leaves derived sample times or not.
- The Context line in SGS-190 says the wait-details follow-up is a later ticket. TASK-GRAPH has it as SGS-192, while the spec-gate report called it SGS-191. No change was needed in the ticket.
- No checkout was made.
