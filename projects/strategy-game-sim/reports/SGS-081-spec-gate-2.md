# SGS-081 spec gate 2

Verdict: READY

Both gaps from gate 1 are closed.
- Scope 3 is now a rule with a grep seed. The diff-stat and acceptance criteria widen to every pinning test and the full AoE4 set.
- Step indexes are stated as 0-based `steps[]`.

## Checks (spot-checked against origin/main 1bdf1d6 and SGS-080)

- Grounded scope: all three build files exist and the step indexes match 0-based `steps[]`.
  - 1TC farm steps are at 9-11, 16, 17 and 21. The 315 s trigger is at 16.
  - Spear: farm steps at 5-7 and 10-12. The Town Center rallies to farm are at 9, 19 and 25 (200 s, 380 s, 760 s). The King's Palace rally is at 21. The `gold#3` reaction is at 28. The `man-at-arms` 681 s trigger is at 23.
  - Knight: farm steps at 9-11, 14-15, 34-37 and 45-56. The `capital-town-center` rally to farm is at 28. The sheep reaction is the last step, 62.
  - Farm references per build (12, 46, 22) match the ticket.
- Starts: no build starts with villagers at farm (`start` is only a rally), so SGS-080's start-state cap adds no farm-idle at 0.
- The README Prebuilt-builds section has 0 matches of `[0-9]+\.[0-9]+ s` on origin/main, and the "measured results ... are not listed" sentence is present. The ticket's baseline is correct.
  - The local `main` ref is stale and still shows 6 matches. Branch from `origin/main`.
- The grep seed finds 30 files on origin/main, consistent with "29 tests plus `builds.ts`". `docs/aoe4-build-order.md` has the "Prebuilt builds live in" paragraph at line 948.
- `builds.test.ts` has the `describe.each` block and the `simulateTo` helper, so the new `it.each([1200, 1800, 3600])` case fits.
- Contracts: the `farm-idle` code, the `idleVillagers` field, the message text and the severity match the SGS-080 ticket. The ticket declares no new contract.
- Open questions: none, and CONTEXT.md Decisions is empty. The owner answers are folded in and no longer appear as open.
- Invariants: A1, A2 and A3 are named and consistent with the criteria.
- Dependencies: stated. SGS-080 and SGS-081 ship as one stack. SGS-079 is integrated.
- Size: 0 lines of business logic.
- Risk: `standard` is fine for data-only edits. No `strongModelTriggers` item or `criticalPaths` symbol applies.
- Diagrams: none required for a single-component data change.
- On merge: none is correct.
- Docs: Scope 4 and Scope 5 cover the README, `docs/aoe4-build-order.md` and the grep.
- Input validation: not applicable.
- Lessons: no entry applies.
- Criteria hold in the end state. The "no step waiting" bar covers the cost of added farms (A2).

## Notes (non-blocking)

- The scope depends on SGS-080's implementation report listing failing shipped-build tests. That report does not exist yet. The `needs_spec` fallback is stated, and Scope 3's rule also covers any such test.
- SGS-080 Scope 5 says it re-pins the house-warnings digests and the house-lead-time digests, and SGS-081 re-pins them again. The ticket handles this correctly ("A pin that does not move is left alone", plus the Scope 3 rule).
- Criterion 1's "re-time the first farm step 60 s later" check is a manual mutation test. For the spear build the first farm steps (5-7) have no `time` trigger, so the implementer would have to add one for the check. This is fine as a manual sanity check and is not blocking.
