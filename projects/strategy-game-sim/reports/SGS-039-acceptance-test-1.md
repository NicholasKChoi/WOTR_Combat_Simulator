# SGS-039 acceptance-test report 1

Verdict: PASS. Branch sgs-039-aoe4-triggers-reactions-default-amounts, new commit 72ed721 on top of c1d71a5. No impl-defects, no spec-gaps found.

## Harness
Playwright via `npm run acceptance` (Node 24). The full suite ran on 72ed721: 514 passed. `npm test`: 934 passed. `npx tsc --noEmit` and `npm run lint:dup` clean (0 clones). Test-only commit, authored choinickolas@gmail.com, with the requested trailers, no ticket ids.

## Tests written
`acceptance/aoe4-simulate-api-triggers.spec.ts` (61 tests, all pass, POST /api/aoe4-build-order/simulate):
- depleted trigger: arms and starts at the exact run-out instant (not a sample multiple); stays not-reached/`trigger` with no issue and no warning for a null amount, an ungathered node and an unexhausted stock; `gold#3` trigger creates its `gold#3` depletions entry at 4000; fires behind an earlier waiting step.
- bank trigger: arms between samples where the floating bank crosses 400 (interpolated crossing within 2); `atLeast: 0` holds at 0 s; zero-income resource is not-reached/`trigger`; behind an unstarted step it is `earlier-step`, then arms when that step starts.
- reactions: run before a waiting non-reaction step and the later step keeps `earlier-step`; `node-depleted` is info with 0 idle with a reaction and a warning with 3 idle without one; a never-holding reaction listed first does not delay the next step; two reactions on one ref start in step order (`move all` then `move 2` waits on `villagers`); a reaction goes before the cursor step for the same villagers and for the last wood (the cursor then starts at the control run's affordability instant); a reaction that cannot afford starts at the exact affordability instant (equal to the control run, not a sample multiple), its `waitBreakdown` sums to `waitSeconds` and the next non-reaction step is not delayed; an armed reaction at the horizon is `waiting`/`villagers` with a breakdown summing to `duration - armedAt` and exactly one `step-stuck`; an unarmed reaction (even behind an unstarted earlier step) is `not-reached`/`trigger` with the following step `earlier-step`; a reaction does not refire (later villagers produce `idle-arrival` warnings after the run-out); two identical runs agree on warnings and steps.
- validation (400 with code and step 0): the full table of trigger shapes and bounds (depleted `node` missing or numeric `syntax`; `wood`, `farm`, `gold#1` `invalid`; `gold#9` `out-of-range`; `iron` `unknown-id`; bank missing or string `atLeast` and missing `resource` `syntax`; `sheep` `unknown-id`; 400.5, -1, 100001 `out-of-range`; 0 and 100000 accepted); message paths (`in trigger.node`, `trigger.atLeast` with the bound 100000); unknown kind lists time, villagers, depleted, bank; a reaction on a depleted trigger accepted on pause, produce, rally, move and build; a reaction with no trigger, time, villagers or bank is `invalid` with the documented message; `reaction: false` and `"yes"` are `syntax`; a reaction on an unknown kind yields only `unknown-trigger-kind`.
- default amounts: a run listing every node reports sheep 3000, berry 1500, deer 1750, boar 2000, gold 4000, stone 1200; a null override keeps a node infinite and a number wins; `gold#2` starts at 4000 while `gold: null` keeps deposit 1 infinite; wood and farm never appear in `depletions`; a wood-only order equals the all-null run apart from `depletions`.
- default ENG 1TC: all 24 `startedAt` equal the infinite-node run and the hard-coded values measured on a2e3ade; sheep runs out at 782.85 s with 6 idle (1200 s horizon); gold deposit 1 at 3305.17 s with 2 idle (3600 s), no `gold#2` row, berry/deer/boar/stone `depletedAt` null; warnings sorted by time.

## Comparison against origin/main a2e3ade
I ran a build of a2e3ade (temporary detached worktree, since removed) next to the task branch and posted the same requests to both.
- ENG 1TC at 1200 s and 3600 s: all 24 `startedAt` identical. Main has every amount null and no warnings. The task branch shows sheep 782.847894 s with 6 idle, and at 3600 s gold 3305.1667 s with 2 idle, matching the ticket.
- Four wood-and-farm-only orders (villager production, house, mill+farm, text form, pause with time trigger) at 300 s: whole response bodies are NOT byte-identical. The only difference is the `depletions` rows, which now carry the default amounts instead of null (none depleted). Every other field is identical (`JSON.stringify` of the body minus `depletions`). Anyone expecting literal byte equality should read the ticket as "unchanged apart from the amounts reported".

## Mutation checks (each applied, spec rerun, failed, undone with `git checkout --`; `git status` clean afterwards)
- `triggerHolds` depleted returns false: 9 tests failed.
- `triggerHolds` bank returns false: 3 failed.
- `triggerWakeAt` bank returns null: bank exact-instant test failed.
- Reactions offered after the cursor loop: both "reaction first" competition tests failed.
- Started reactions re-offered (latch removed): 6 failed.
- `reactionNeeds` dropped from `nextWake`: exact affordability wake test failed.
- Horizon `waitingOn` for reactions loses the reaction clause: 2 failed.
- Accrual only for the cursor step: 2 failed.
- Accrual jitter (`Math.random`): determinism test and 2 others failed.
- `checkReaction` always returns: 4 failed.
- `triggerAtLeast` bound 200000: 2 failed.
- depleted validated with `finiteOnly` false: wood and farm tests failed.
- Unknown-kind message drops the kinds: 1 failed.
- `reaction` shape check removed: 2 failed.
- `runRefs` ignores depleted triggers: `gold#3` tests failed.
- sheep 2999, gold 3999, stone 1201 and sheep 300 in `base.json`: default-amount and ENG 1TC tests failed (the 300 case also failed the start-time test).
- `FINITE_GATHER_NODES` includes wood: 3 failed (wood/farm test, wood-only test, ENG start times).
- A data-only `amount` on `wood` in `base.json` does not fail any test, because `runRefs` and the model ignore it for non-finite nodes. That is the model's behavior, not a missing test; the wood/farm test is pinned through the model mutation above.

## Not expressed
- "A reaction waiting on resources never holds back a producer's order (`engine.reserve` unset)": I could not build an order through the API where a waiting reaction and a continuous villager order contend for the same resource, since the reaction costs wood and the default production costs food. This stays covered by the implementer's unit tests (`simulate-triggers.test.ts`). The reaction's wake-instant and "next non-reaction step not delayed" are proven here.
- The page itself: no page change in this ticket (ENG 1TC has no reaction until the follow-up ticket); the existing page specs pass in the 514-run.

## Ticket
All criteria were already ticked except line 139 (existing tests, with the PR-body item), left for the PR stage. Both halves of its test claim I saw pass: unit 934 and acceptance 514 (with the new spec).

## Processes
Both dev servers I started (ports 3555, 3556) were stopped; no listener remains; the temporary a2e3ade worktree was removed.
