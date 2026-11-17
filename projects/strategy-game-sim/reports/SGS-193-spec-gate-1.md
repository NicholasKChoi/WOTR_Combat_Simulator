# SGS-193 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main plus SGS-192's ticket (not integrated) and design/M11.md. `step-annotations.ts`, its two test files, `acceptance/aoe4-step-annotations.spec.ts` and `docs/aoe4-build-order-ui.md` were read at origin/main. No scratch checkout was made.

## Gaps

1. **Acceptance criteria and Scope acceptance cases (Castle Age and Barracks) - the expected text contradicts the table - the implementer cannot satisfy both.**
   - The Castle Age case (`start 6 sheep -> sheep`, `produce knight from stable x1`) leaves the knight step `waiting` for the whole run. SGS-192 accrues an `age` entry for it; the design's own sample is `waitDetails: [{age 3, seconds: 1200}]`.
   - By the ticket's own table, a `waiting` step prints its entries and then the tail. The Castle Age case therefore reads `Castle Age 20:00, still waiting for Castle Age`, not `still waiting for Castle Age`.
   - The Barracks case (`produce man-at-arms from barracks x1`, no barracks) behaves the same way: `a Barracks 20:00, still waiting for a Barracks`.
   - The ticket says each reads exactly the tail. An implementer must either break the table or fail the spec.
   - Proposed fix, `owner` (the design's B-W10 rows and the design's own acceptance sentence disagree):
     - (a) Keep the table. The cases then assert the text from the API facts: the entries' `waitDetailText` and seconds, then `still waiting for <waitingForText>`. A spec that assumes the text should assert only that it ends with `still waiting for Castle Age`.
     - (b) Change the rule so that a `waiting` step omits the entry whose `waitTargetKey` equals `waitingFor`'s, because the tail already names it. State that in the table, the criteria and the design.
   - Option (b) removes the `Castle Age 20:00, still waiting for Castle Age` duplication. It also needs a decision for an entry that matches by key but carries a different landmark.

2. **Scope / docs - `docs/aoe4-build-order-ui.md` lines 102-104 become untrue and are deferred to another ticket.**
   - The text says causes are listed as `<cause> <m:ss>` "in that order" (resources, villagers, population, prerequisite).
   - It also says a `waiting` step adds `still waiting on <cause>`.
   - After this ticket both statements are false. The ticket says only that "the docs ticket documents the wait text".
   - Checklist item 11 requires a doc made untrue to be fixed in the same ticket.
   - Proposed fix: add the UI doc's Blocked by sentences (the order, the `for` and `on` tails, the detail wording) to Scope and a criterion. The docs ticket keeps everything else.

3. **Acceptance case 3 - the expected text is built from a partial read of the API.**
   - The spec asserts that step 2 has a `building-busy` entry. It does not assert that this is the only entry with `seconds > 0`.
   - If step 2 also waited on resources or villagers, `blockedBy` has more parts and `a free <name> <m:ss>` fails.
   - Proposed fix: first assert that `waitDetails` has exactly that one entry with `seconds > 0`. Then assert the text equals `a free <name without a leading "The "> <m:ss of seconds>` as `waitDetailText` forms it. Scope's "a free <capital town center name>" leaves the `The ` drop and the article implicit.

## Checked and fine

- Grounding:
  - `stepRun`, `blockedByText`, `BREAKDOWN_ORDER`, `formatWaitBreakdown` and `StepRun.waitBreakdown` exist at origin/main as described.
  - `waitDetailText`, `waitingFor` and `waitDetails` come from SGS-192, which is in Depends-on. The signatures match the design's C5, C6 and C17.
  - SGS-192 keeps `waitBreakdown` on `StepTiming`, so the A2 test (a detail disagreeing with `waitBreakdown`) can fail.
- Consumers: no other component code reads `StepRun.waitBreakdown` or `formatWaitBreakdown`; only `step-annotations.ts` and its tests do.
- Existing tests: the changed-text tests are `step-annotations.test.ts` and the `run()` fixture in `step-annotation.test.ts`, both covered by the rule in Scope.
- Acceptance spec: `acceptance/aoe4-step-annotations.spec.ts` asserts `step-blocked-by` only for `not reached (...)` and an empty value, as the ticket claims.
- Risk is standard: no `criticalPaths` symbol is touched, since the page file only reads the result.
- Invariants, dependencies, diagrams, On merge, validation and unverified assumptions are consistent.
- Open questions: none.

## Notes

- A `waiting` step with a non-null `waitingFor` and entries prints the same target twice (`... , still waiting for ...`). Today's text does the same, so it is not a regression, but the owner may want gap 1 option (b).
