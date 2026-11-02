# SGS-042 implementer report 1

Branch sgs-042-aoe4-step-wait-step-stuck, tip 904e2d6a6857868e2171399a075d72acfab8687f, base origin/main d8d202d.
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-042-aoe4-step-wait-step-stuck
Status: needs_review

## Files
- lib/aoe4-build-order/model.ts: StepTiming gains waitingOn, waitBreakdown.
- lib/aoe4-build-order/simulate.ts: StepStart carries waitingOn; produce/build/move/fallback return first failing check; offerSteps stores/clears waitingOn; exported accrueWait called once in the main loop before engine.time = next; horizon pass sets trigger/earlier-step; stepStuckWarning merged with node warnings into the one sortWarnings call.
- lib/aoe4-build-order/research.ts: researchHandler returns prerequisite/resources.
- docs/aoe4-build-order.md, docs/api/openapi.json: fields, reason table and check order, warnings wording (no "empty today"), examples.
- acceptance/aoe4-simulate-api-contract.spec.ts: stepTiming key literal +2.
- acceptance/aoe4-simulate-api-depletion.spec.ts: research-textiles request expects one step-stuck (prerequisite, at 0); title no longer says "no warnings" for it.
- Tests: simulate.test.ts (new 'why steps wait' describe incl. accrueWait unit test), build-move.acceptance.test.ts, research.test.ts, plus type fixes in simulate-construction.test.ts, simulate.acceptance.test.ts.

## Results
Unit: 844/844 pass (34 files). tsc + lint:dup clean (0 clones). `npx next build` ok. `npm run acceptance`: 409/409 pass. No dev server left running.
Greps: `{ started: false }` 0 non-test matches; sortWarnings( once in simulate.ts; waitBreakdown[ written only in accrueWait; no "empty today|always empty".
Note: depletionResults in depletion.ts still sorts its own list internally (SGS-037); simulate.ts adds the single merged call. Idempotent, wake times unchanged, timelines pins untouched.

## Pre-existing tests edited (ticket item 11/12 and type fallout)
- simulate.test.ts: 'completes a rally step the instant it arms', 'pauses at once...' (two new fields); 'exports exactly the seam names' (+accrueWait, count 13 to 14).
- acceptance depletion spec research request: expected one step-stuck (item 12).
- research.test.ts 'waits with a reserve when the bank is short...' and the 'research step' multi-tier test (`toEqual({started:false})`) now include waitingOn (handler return shape changed); waitsWithoutReserve gained a waitingOn assertion.
- simulate-construction.test.ts, simulate.acceptance.test.ts: stub handler return values gain waitingOn (type requirement; behavior same).
- contract spec stepTiming key literal.

## Mutation checks (all failed as expected, all undone)
no accrueWait call; add trigger to breakdown reasons (accrueWait unit test); swap trigger/earlier-step; drop step-stuck from merge; population reported as resources; drop waitingOn reset on start; move all treated as villagers wait (existing depletion tests).

## Invariants
A2: payments untouched; wake times unchanged (accrual is read-only on timings). A3: accrual is arithmetic on event times; determinism test included.

## Out-of-scope findings
None. Expect a mechanical rebase with SGS-044 (markers) and SGS-048 on simulate.ts / docs.
