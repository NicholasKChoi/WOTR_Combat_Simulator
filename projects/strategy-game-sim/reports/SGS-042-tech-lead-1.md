# SGS-042 tech-lead 1

Decision: no blockers. Opened draft PR https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/53 (base main, head sgs-042-aoe4-step-wait-step-stuck at 8f9c71728920abc93d1b06bf03372f8c7947c282). The branch was pushed with no new commits. The PR body was set with `gh api PATCH`.

## Reviewed
- Range: origin/main 1d5f5c9..8f9c717 (3 commits: e25e383, 9f31065, 8f9c717, all authored by choinickolas@gmail.com, no ticket ids in the messages).
- 13 files, +575/-58. Business logic is +66/-18 (simulate.ts +61/-15, research.ts +3/-3, model.ts +2/-0). Docs: openapi.json +44/-4, aoe4-build-order.md +29/-8. The rest is tests.
- Stack check: one task on main; the diff holds only this task.
- Invariants checked:
  - A2: payment predicates are unchanged. The combined guards were split per reason with the same conditions. The `offerSteps` reserve handling is equivalent: reserve is reset at the top of each pass and set from `outcome.reserve`, which is present only for `resources`.
  - A3: accrual is arithmetic on event times only.
  - A1: no game numbers added.
  - S3: no new inputs.
- No irreversibility, concurrency, or security surface. The `StepTiming` response change only adds fields, so existing readers keep working. CONTEXT.md has no open questions.

## Non-blocking notes
- `depletionResults` (depletion.ts:146) still sorts its own warnings, and simulate.ts:850 sorts the merged list again. The result is correct and deterministic, and simulate.ts has exactly one `sortWarnings(` call as the ticket's grep requires. Still, the warnings are sorted twice per run, which is not what scope item 7 intended. A follow-up could drop the inner sort.
- In simulate.test.ts, `withHandler('research', undefined as never, ...)` relies on the `handler ? ... :` fallback treating a stored `undefined` like a missing key. That is correct today.

## Merge risk
**medium** - changes critical-path `simulateBuildOrder` and `offerSteps`, plus the public simulate response (two new required `StepTiming` fields), but only adds to it, and a revert undoes it.

## Review focus
- [`lib/aoe4-build-order/simulate.ts:410-433`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/53/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R410-R433) - `offerSteps` now sets `engine.reserve = outcome.reserve` instead of the old `'reserve' in outcome` branch. If a non-`resources` wait ever carried a stale reserve, villager payments would be held back for no reason. Check that `reserve` is reset at the top of each pass and set only by `resources` waits.
- [`lib/aoe4-build-order/simulate.ts:837-840`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/53/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R837-R840) - the only accrual call site. If `engine.time` is ever advanced somewhere else, `waitBreakdown` stops summing to `waitSeconds` without any error. Check that this is the loop's only time advance and that it charges just the armed cursor step.

