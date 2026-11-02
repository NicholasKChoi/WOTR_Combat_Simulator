# SGS-063 implementer report 1

- Ticket: SGS-063 (warn when the house gate keeps auto-houses off or holds production at the supply limit)
- Branch: sgs-063-aoe4-auto-house-warnings, stacked on sgs-062-aoe4-veterancy-convert-units at c566e070927735963097ab837783ef3de18e016a
- Tip SHA: b924ee12f0cfc7db647ee7f480a2c95cce6e2dcf (one commit; not pushed, no PR)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-063-aoe4-auto-house-warnings
- Status: needs_review

## Files touched

- lib/aoe4-build-order/model.ts: SimWarning gains `auto-houses-never-start` {step, at} and `auto-houses-held` {step, at, seconds}.
- lib/aoe4-build-order/simulate.ts: engine fields supplyBlocked/heldAt/heldSeconds; offerStep sets supplyBlocked on a `population` wait; payOrder sets it on a supply refusal (early return split); runInstant clears it; `lastHouseStep` (shared with houseGateOpen); `accrueHeld` after accrueWait; `houseWarnings` merged into sortWarnings.
- lib/aoe4-build-order/depletion.ts: tieRank ranks the two auto-house codes after step-stuck, by step, never-start before held.
- lib/aoe4-build-order/simulate-house-warnings.test.ts (new): unit tests below.
- lib/aoe4-build-order/depletion.test.ts: sortWarnings table gains four auto-house rows at one instant.
- lib/aoe4-build-order/builds.test.ts: type-narrowing only (see Pre-existing tests edited).
- docs/api/openapi.json: two closed SimWarning variants; SimulationResult.warnings description lists five codes and the tie order.
- acceptance/aoe4-simulate-api-contract.spec.ts: code-order assertion and `simWarningVariants` list five variants.
- docs/aoe4-build-order.md: house-gate paragraph describes both warnings; sort sentence, Severity table, and `warnings` field bullet updated.
- data/aoe4-build-order/README.md: Knight/Longbow paragraph states its one `auto-houses-held` warning (step 24, 0:21 from 7:42) at 1800 s and 3600 s.

## Tests

- `npx vitest run`: 41 files, 1109 passed, 8 skipped, 0 failed.
- `npm run acceptance` (ACCEPTANCE_PORT=3791, Node 24): 554 passed, 0 failed. No existing exact-list acceptance assertion needed an edit. The Knight/Longbow spec does not pin the full warning list.

New unit tests (simulate-house-warnings.test.ts) and the invariants they encode:
- never-start: exact warning (step 0, at 0, message with 6:40) for a never-firing reaction house; reads the last build-house step (step 2); not emitted when autoHouses is off, when there is no house step, or when the last house is not a reaction; not emitted for a reaction that fired but waits on resources (step-stuck covers that case).
- held: exact {step 1, at 220, seconds 80, message "1:20 from 3:40 ... step 2"} summed over every interval; a produce step waiting on population counts (step 2, at 30, seconds 170); boundary rows not emitted (autoHouses off, gate already open, gate opens at the blocked instant, supply at maxPopCap 30, only block at the final instant) paired with emitted rows one step past each boundary (gate at 225, maxPopCap 31, duration 225).
- both together: never-firing reaction emits never-start (at 0), then held (at 120).
- timing unchanged (A3): sha256 digests of every non-warning field, computed on base c566e07 and identical on the branch: late-house run, ENG 1TC, Spear/Longbow, Knight/Longbow at 1800 s. Plus the Knight held warning pinned {step 23, at 461.819..., seconds 21.236...}; the other two builds have no auto-house warning.
- depletion.test.ts sortWarnings: the auto-house rows sort after step-stuck by step, never-start before held, in a shuffled input.

## Pre-existing tests edited

- lib/aoe4-build-order/builds.test.ts: "moves every gatherer off a gold deposit..." filter changed from `w.code !== 'step-stuck' && gold(w.node)` to `'node' in w && gold(w.node)`. This is a type-narrowing change only: the new union broke the old narrowing (tsc TS2339). No assertion changed.
- lib/aoe4-build-order/depletion.test.ts sortWarnings: rows added and the test renamed. The ticket asks to extend the tie order. The existing rows are unchanged.
- acceptance/aoe4-simulate-api-contract.spec.ts: lists of codes and variants extended to five, as the ticket's contract scope requires.

## Mutation checks (each was undone and verified with cmp against the saved copy)

- houseGateOpen always true: 8 failed (held tests, both-together, digests). The standalone never-start test does not depend on the gate. This is by design, because never-start reads only isReaction and armedAt. The ticket says the gate mutation should fail it; flagged here.
- accrue only the first blocked instant: pinned-seconds, produce, and Knight tests failed.
- ignore isReaction: the "not a reaction" row failed.
- ignore armedAt: the "fired and waits on resources" test failed.
- houseWarnings ignores autoHouses: the autoHouses-off rows failed.
- ignore the maxPopCap check: the maxPopCap 30 row failed.
- payOrder does not set the flag: 6 failed.
- produce wait does not set the flag: the produce test failed.
- flag never cleared in runInstant: the Knight pin failed.
- heldAt overwritten instead of `??=`: 5 failed.
- tieRank swapped, or ranked before step-stuck: the sortWarnings test failed.
- Survivors: (a) accrueHeld checking `inputs.autoHouses`. This is redundant because houseWarnings already returns [] when autoHouses is off, so I removed the check (deviation below). (b) Moving accrual before the final-sample break is equivalent: it adds 0 seconds, and heldSeconds > 0 gates emission.

## Gates

- codegen: not set.
- build `npx next build`: passed.
- lint `npx tsc --noEmit && npm run lint:dup`: tsc clean; jscpd found 0 clones.
- unit and acceptance: as above.
- `git diff --stat c566e07` names only the files above. No lockfile changes, AGENTS.md block, or stray formatting.
- Grep review: every line in docs/aoe4-build-order.md and docs/api/openapi.json that lists warning codes names both new codes. docs line 417 is the step-stuck row of the Severity table, and the new rows follow it.

## Invariants

- A1 (game numbers from data): the cap is read from `data.base.maxPopCap.value`. Nothing is hard-coded.
- A2 (warnings never change state): the new code only reads engine state and sets its own bookkeeping fields. No resource, population, or timing state is touched.
- A3 (determinism and timing): the non-warning digests match the base for the late-house run and the three shipped builds at 1800 s. Shipped builds also compared field by field at 1200 and 3600 s during development.

## Deviations

- accrueHeld does not check `inputs.autoHouses` (redundant, and no test could catch it). houseWarnings gates on it.
- The never-start test does not fail under the gate-always-open mutation (see above).
- runInstant clears supplyBlocked at the start, as the ticket literally says. Clearing it before the second offerSteps gave identical results on the shipped builds.
- No new Playwright acceptance tests through POST /api/aoe4-build-order/simulate (late-house held 220/80, never-start). The implementer role leaves acceptance-harness tests to the acceptance gate. Only the existing contract spec's code and variant lists were extended.

## Out-of-scope findings

None.
