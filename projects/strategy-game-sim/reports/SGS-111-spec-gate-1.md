# SGS-111 spec gate 1

Verdict: READY

Checked against origin/main (68dd089), design/M7.md (M7.8 rows), CONTEXT.md, INVARIANTS.md, REPO.md, LESSONS (no entries apply).

## Checks

1. Grounded scope: pass. Every name exists on main: `lastHouseStep`, `houseGateOpen`, `accrueHeld`, `houseWarnings`, `heldAt`/`heldSeconds` (Engine type + initializer), `startAutoHouses` gate check, `SimWarning` variants (`model.ts` 164-165), `tieRank` branch (`depletion.ts` 186-187), `depletion.test.ts` `neverStart`/`held`, the renamed test and acceptance specs, README lines 115-116, docs lines 331-343, 430, 443-444, 792-808, openapi lines 3631, 4088, 4125 (two component schemas). `supplyBlocked` really has one reader (`accrueHeld`) and three writers (offerSteps ~526, payOrder ~592, runInstant ~724), as the ticket says. `isReaction` (offerSteps) and `formatMinSec` (depletion, parse-text, other simulate.ts uses) keep other users.
2. Testable criteria: pass. Each has an observable outcome; the fixture proves itself first (autoHouses:false run blocked before 600 s) and a mutation check is named. Existing-test rule is stated in Scope (new value from engine checked against the rule; unrelated tests pin `autoHouses: false`). No pinned counts or lists; prebuilt timings are "update to what the engine returns" and spear-longbow is a regression property.
3. Open questions: none; owner answer DQ1 = A is folded in design and ticket.
4. Invariants: A1, A2, A3 named; none contradicted.
5. Contracts: matches design "Removed contracts (M7.8)". No dependencies. No new names.
6. Size: about -70 LOC, no dependencies.
7. Diagram: present.
8. Lessons: none relevant.
9. Decisions: consistent with design Behavior rules rows (rule, ordering, conflict, autoHouses:false, no valid target, warnings, prebuilt, docs).
10. On merge: `none`, correct (no new command, harness or doc; CONTEXT.md Decisions empty).
11. Risk: high matches strongModelTriggers (changes what a run computes; removes two codes from a public response schema).
12. Docs: pass. Docs grep confirms all mentions are in Scope (docs lines 331-343, 430, 443-444, 792-808; openapi 3631/4088/4125 and the oneOf; README 115-116). The `autoHouses` field description in openapi (3234) and docs line 309 stay true.
13. Input validation: no new input.

## Notes (non-blocking)

- Acceptance "production continues past the old hold": the spec has no absolute time for the old hold. Suggest it derive the hold from the same spec's `autoHouses: false` response (population flat before 600 s) rather than hard-coding the 220 s from the unit fixture.
- The reduced fixture's "production first hits the limit at 220 s" comes from the current `lateHouse` with `twoTowns`/`woodStart`; the implementer should keep those inputs, since the "blocked before 600 s" precondition assertion depends on them.
- Criterion 5 (same-instant explicit house) needs a hand-built trigger so the explicit house starts at the instant the planner would add one; `houseDemand` counts `engine.constructing`, so the rule is grounded. The implementer may need to search inputs for such an instant, then assert on the house count.
- Other M7 tickets (SGS-107, SGS-110) also edit `docs/aoe4-build-order.md`; expect rebase conflicts but no spec gap.
