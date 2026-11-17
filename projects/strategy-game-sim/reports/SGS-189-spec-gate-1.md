# SGS-189 spec gate 1

**Verdict: NEEDS_SPEC**

I applied the two reorders to a scratch checkout of origin/main (87f0cd7) and ran `npm test` (2628 tests). Both orders are valid permutations (74 and 61 steps). Exactly one test fails, and it is the re-pinned one. Its failure contradicts what the ticket says.

## Gaps

1. **Acceptance criteria and Scope (Tests)**: the ticket says the "holds 20 tier-2 longbowmen ..." test keeps its completion in (840, 845] and "only its counts move". This is false on the current engine.
   - Evidence: with the reorders applied, `research.acceptance.test.ts:152` fails with `expected 838.018581311992 to be greater than 840`.
   - The 841.2 s figure in design/M11.md is the completion under the busy-building rule (SGS-190), not on the current engine. The design's "only the counts move" claim is wrong for this ticket.
   - An implementer following the ticket literally cannot make the test pass. They would either fudge the reorder or break "no assertion other than counts changes".
   - Proposed fix: rewrite the criterion and the Scope line. The test asserts that `veteran-longbowmen` completes within the horizon, and that the tier-2 stock is wholly tier 2 at the last sample before completion and wholly tier 3 at the first sample at or after it. Sample times derive from `completedAt` instead of literals 840 and 845. The report records the new completion time and counts. Also say that SGS-190 re-pins the test again when the rule moves completion to about 841 s, so that ticket does not assume this one left (840, 845] in place.

2. **Acceptance specs list (Scope)**: the ticket names six specs that "must pass". More specs load these two builds: `aoe4-simulate-api-house-rule`, `aoe4-simulate-api-deer-pack`, `aoe4-build-order-inline-issues`, `aoe4-build-order-m4-flow`, `aoe4-chart-readability`.
   - The design's own rule is "every spec that loads a prebuilt build".
   - A closed list of specs goes stale and lets an implementer skip some.
   - Proposed fix: replace the list with the rule "every acceptance spec that loads `english-knight-longbow` or `english-1tc-council-hall` (by import or by build name) passes". The named six can stay as examples.
   - I did not run the acceptance suite.

3. **Scope (README)**: the Council Hall "Added after the guide" paragraph also says "at 660 s a blacksmith with `steeled-arrow` and `iron-undermesh`". This becomes untrue, because `iron-undermesh` now follows the 690 s mining camp and move.
   - The ticket quotes only two other phrases from that entry.
   - Proposed fix: add the 660 s clause to the statements to correct.
   - Criterion 6 ("places a tech where it no longer sits") is also loose. Rewrite it as "the Council Hall paragraph lists steps in the order of the new file, and no Knight/Longbow sentence contradicts the new order".

## Checks that passed

- **Grounded scope**: both files exist, with 74 and 61 steps. The indices in Scope match the base files, including the trigger values the Effect clauses mention.
- **Existing tests**: `builds.test.ts` and every other unit test pass with the reorders. This includes `simulate-construction.test.ts:476` (population at 660 s is 47) and `text-to-build.test.ts`.
- **Acceptance specs with step indices**: `aoe4-simulate-api-veterancy-conversion` and `aoe4-simulate-api-knight-longbow-build` derive their indices and times from the result, so they are unaffected by the reorder.
- **Other criteria**:
  - Invariants: A3 is named and nothing contradicts it.
  - Risk is low: no `criticalPaths` symbol is touched.
  - Dependencies: none, and SGS-190 depends on this ticket.
  - On merge: `none`.
  - Unverified assumptions: none is correct, since there is no external service.
  - Open questions: none, and OD3b is owner-answered.
  - No throwaway-work overlap: SGS-190 leaves the Knight/Longbow and Council Hall orders alone.
  - No input-validation or diagram trigger fires.

## Notes

- The diff of the two reorders is 44 changed lines per file, if the formatting is preserved.
- design/M11.md M11.5a also lists this test as "completes at 841.2 s, still in (840, 845]; counts re-measured". When the ticket is fixed, make sure SGS-190's wording is consistent with it (SGS-190 is in `needs_spec`).
- The scratch checkout `spec-SGS-189` is removed.
