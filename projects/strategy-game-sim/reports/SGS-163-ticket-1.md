# SGS-163 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-163-pin-first-arrival-in-idle-arrival-acceptance-test.md

Summary: Chore, aoe4-build-order, standalone (Milestone none), Priority low, Risk low, about 15 LOC, test-only, no dependencies. The test "produced villagers rallied to it add to a single idle-arrival warning" in `acceptance/aoe4-simulate-api-depletion-engine.spec.ts` (the BACKLOG item calls it the depletion-engine acceptance spec) only asserts `at > 0`. The ticket pins `at` to the first arrival. It requires a precondition that arrivals occur at more than one distinct time, so the test cannot pass vacuously. It also requires a mutation check on `depletion.ts:addIdleArrival` (keep the latest `at`) that must fail, and a diff limited to the spec file. No docs are made untrue; `docs/aoe4-build-order.md` already states the first-arrival rule.

Diagrams: none (no diagram required).
Open questions: none.
Overlap with open tickets: none found. I did not run the mutation criterion here; the SGS-154 acceptance report showed it passes today, and the implementer re-confirms it.
Lint: ticket-lint.py clean. No scratch checkout was created.
