# SGS-189 ticket 2 (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-189-reorder-knight-longbow-council-hall-builds.md (ticket-lint clean)

## Summary

The ticket is "Reorder the Knight/Longbow and Council Hall prebuilt builds" (aoe4-build-order, Feature, M11, Risk low, 0 business-logic LOC, no dependencies). It changes two JSON step reorders, the Council Hall README entry, and one unit-test re-pin. All three spec-gate-1 gaps are folded in:

1. **Longbow conversion test.** The test now takes its sample window from the `veteran-longbowmen` completion instead of the fixed (840, 845] window and literal times.
   - At the last sample before completion: a non-zero tier-2 stock (asserted first) and no tier 3.
   - At the first sample at or after completion: the whole stock is tier 3.
   - At every later sample: no tier 2.
   - The report records the measured completion time and counts.
   - Context now says the design's 841.2 s is the value under the busy-building rule, not on this ticket's engine.
2. **Acceptance specs.** The closed list is now a rule: every spec that loads either build, by import or by name, must pass. The 11 specs found at the base are listed as examples.
3. **Council Hall README.** Scope names all three untrue clauses, including the 660 s `iron-undermesh` one. The criterion now requires the entry to follow the new file order.
   - For the Knight/Longbow entry, I checked its location sentences against the reordered file and they all still hold. Scope says to change a sentence only if it contradicts the file.
   - Criteria for the conversion test, other unit tests, acceptance specs and README are tagged (respec 1).

## Verification (scratch checkout at origin/main 87f0cd7, removed)

- I applied both reorders with a json re-dump. The formatting differed from the real files, which does not matter for running the tests.
- Both orders are valid permutations: 74 and 61 steps.
- `npx vitest run`: the only failure is "holds 20 tier-2 longbowmen ..." with `expected 838.018581311992 to be greater than 840`. This confirms the gate's finding.
- A probe gave:
  - samples every 5 s;
  - completion at 838.02 s;
  - at 835 s: 20 tier 2, 0 tier 3;
  - at 840 s: 0 tier 2, 20 tier 3;
  - at 1800 s: 71 tier 3 (was 72).

  So the derived-window assertions hold on the reordered build, and the title's "20" still matches. These values are only in this report, not in the ticket.
- I listed the reordered step sequences. They match the Effect clauses in Scope and the new README order described there.
- I did not run the acceptance suite.

## Diagrams

None: single component, not the control loop.

## Open questions

None in the ticket.

## Notes for the manager / consistency with SGS-190

- **design/M11.md line 363 is inaccurate.** It says "only the Knight 'holds 20 tier-2 longbowmen' counts move" on the current engine, but the completion also leaves (840, 845]. The M11.5a row's "841.2 s, still in (840, 845]" is the value under the busy-building rule. This is a designer-level correction and not blocking.
- **For the SGS-190 re-spec.** After SGS-189 the test no longer asserts (840, 845]. Its window is derived from the completion.
  - SGS-190 should only re-measure the counts the test pins under its rule (and the title count if it changes). It should not reinstate the literal window. Citing the design's ~841.2 s completion as the expected value is fine.
  - SGS-190's current line 46 ("SGS-189 already re-pinned its counts, this ticket re-pins them again") stays consistent with this.
  - SGS-190's acceptance-spec list is also a closed list. The same rule (every spec that loads a prebuilt build) would fit it.

## Overlap

None new. SGS-190 depends on this ticket and does not touch the Knight/Longbow or Council Hall order.
