# BATCH-030 tech-lead 1

## Decision
NO BLOCKERS. One draft PR opened.

## PRs (bottom to top)
- SGS-030: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/37, base `main`, head `sgs-030-aoe4-engine-core` @ 796bf6e (pushed by this gate). Single-PR batch, so no gh-stack link and no footer.

## Merge risk
**low** - new library module with no caller in the app, no API, schema or config change, and unit and acceptance tests pin its behavior; a revert removes it entirely.

## Review focus
No hotspots: the engine is not reachable from any route or page yet, so a defect cannot affect users until a later change wires it in, and the priority, queue, rally and completion rules are each pinned by tests.

Note: the ticket tier is `high`, but the merge-risk rating comes from the diff. The engine has no caller (no route, page or other module imports `simulate.ts`). It touches no public surface, `criticalPaths` is empty, a revert removes it cleanly, and tests pin it. No `high` or `medium` factor applies.

## Reviewed
- Range: origin/main dbe695f..796bf6e (2 commits, both authored by choinickolas@gmail.com).
- Files: lib/aoe4-build-order/simulate.ts (+557), lib/aoe4-build-order/civ-rules.ts (+33), docs/aoe4-build-order.md (+27/-2), simulate.test.ts (+716), simulate.acceptance.test.ts (+297). Reviewable business logic is +590/-0.
- Invariant checks:
  - A1: the only constants are SAMPLE_SECONDS (output resolution) and a 1e-9 float tolerance.
  - A2: every payUnit call follows an affordable() and supply check (produce at simulate.ts:249-254, payOrder at :331-338). The Math.max(0, ...) at :224 only absorbs the tolerance.
  - A3: no clock or randomness. Events are ordered by (time, insertion).
  - S3: durationSeconds is bounded 60-3600 in validate.ts:20. nextWake always advances, because the next sample is always later than now.
  - S1: no cross-app imports.
- Open questions: CONTEXT.md lists none.
- Gates: review APPROVE, acceptance PASS, simplify no changes, suite PASS (555 tests, tsc, next build).

## Non-blocking notes
- simulate.ts:212-217: `at.rally` is undefined if a villager producer has no rally. That would be a TypeError, but validate.ts:198-207 and :300-301 rule it out for valid orders. A future `villagerProducer` hook that returns true for a building validation does not know about would get past that check.
- simulate.ts:350-351: a unit with production time 0 (or a hook returning 0) would schedule its completion at the current instant. The loop still terminates for finite counts. A continuous order of a zero-time unit would spin without advancing time. I did not check the data for zero-time units. SGS-031/032 data and hooks should keep times positive.
- After a counted `produce` completes, the instance's order stays null and the default villager order does not resume (the review noted this). The docs do not say so explicitly.
