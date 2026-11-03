# SGS-080 spec gate 1

Verdict: NEEDS_SPEC

Checked: simulate.ts (assignGatherers, sendWalking, completeConstruction, createEngine, houseBuilderSource), depletion.ts (tieRank, idleArrivalWarning), model.ts SimWarning, rules/base.json farm createdBy, INVARIANTS, CONTEXT (no open questions/decisions), LESSONS (nothing relevant). All named symbols exist; no 'farm' literal in simulate.ts today. Risk high is right. Open questions: none. Docs scope is complete.

## Gaps
1. Acceptance criteria - "npm test ... pass" contradicts "shipped-build assertions that fail only because builds are not re-tuned are listed, not loosened". Both cannot hold in the end state; the implementer must either leave the suite red or loosen/skip a test. Fix: state the end state. Either (a) 080 and 081 are one branch/PR so npm test is green at the end, or (b) 080's PR may be red only on the named shipped-build assertions and is not merged alone (and say how the manager treats that). Pick one.
2. Scope 2 - house builders from farm. Scope makes sendWalking take idle farmers first, and auto-house builders use sendWalking (startConstruction), but houseBuilderSource's comment says "Reads gatherers only: idle villagers never build houses" and checks gatherers >= houseBuilders. With the new rule idle farmers would build houses (the stale comment is at the seam, check 12), or the source check refuses while idle ones exist. Guess: implementer picks. Fix: state that for farm, houseBuilderSource counts gatherers + idle (or keeps gatherers-only and takes gatherers first), update the comment, and add one criterion/case (farm=3 gatherers, 1 idle, houseBuilders 2).
3. Scope 1 (start state) - createEngine writes gatherers before start.buildings are added (addBuildingInstance runs at the end, which is what fills state.buildings). Ticket says cap by farms in start.buildings but not how to get the count at that point. Fix: say to count start.buildings.value entries equal to createdBy (or move the cap after the buildings loop and shift the overflow to idle), and that the civ-rule startingState override (rules.startingState) result is what is capped.
4. Scope 3 - tieRank. farm-idle has no `node`, so the existing fallthrough branch (FINITE_NODE_REFS.indexOf(warning.node)) would break. State the rank shape (for example [0.5, 0, 0] or a new rank between node warnings and step-stuck's 1) so the sort-order sentence and the sortWarnings case are unambiguous.

## Notes
- base.json gatherNodes.farm already has a `capacity` field (carry capacity, 10); name the new helper something else (for example `slotsAt`) to avoid confusion.
- OpenAPI version bump "whichever lands second takes next minor" is workable; confirm at implementation time which minor SGS-077 took.
- Criterion 1 (no new input) is weak as a grep; a request-schema/openapi diff check on the `components.schemas` request body is enough.
