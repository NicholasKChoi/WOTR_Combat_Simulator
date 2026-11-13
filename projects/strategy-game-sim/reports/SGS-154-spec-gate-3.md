# SGS-154 spec gate 3

Verdict: NEEDS_SPEC. Risk `low` stays correct (test-only, no critical path, no strongModelTrigger).

Read at origin/main after `git fetch origin`; deleted tests read at `27e8840^`; response schema read from `docs/api/openapi.json`.

## Gate 2 gaps: status

- Item 5 severity and horizon: closed (english-1tc, 3600 input, severity follows `idleVillagers`; the deleted run's last step is a gold-depletion reaction that never starts in the infinite run, and the "starts before the earliest depletion" wording excludes it correctly).
- Item 2 horizons: closed (largest integer below `completedAt`, asserted at or after `startedAt`; `ceil` after; label is the tech, matching `ChartMarker.label`).
- Item 3: closed (series by `baseId` and `tier`, exactly two, independent `finalCount`).
- Item 4 horizons 1200 and 3600: closed; the first `man-at-arms` with a `time` trigger (681) exists in `english-spear-longbow-maa-crossbow.json`.
- Item 6 setups: closed; each case matches the deleted test's setup, and none of the three behaviors exist in the current depletion-engine spec (no duplicates). The `order`, `PAUSE`, `depletionOf`, `warningsOf`, `last` helpers already exist there.

## Gaps

1. Item 1 (edges, result shape) - "the villager series ends at the order's start villagers plus its produce count" is wrong (check 13). `UnitSeries`/`unitsProduced` documents "starting units never appear", and the deleted test, which used `start 6 sheep` plus `produce villager x3`, asserted the last villager count is 3, the produce count alone. This note came from gate 2 and was adopted without checking the deleted test. An implementer following it writes 6 + 3 = 9, and the test fails against the API; they would then guess. Fix: "the villager series ends at the order's produce count (starting villagers do not appear in `unitsProduced`)".

## Notes (non-blocking)

- Item 7 states no horizon. The deleted test used the default 1200 s and passed. `spent.villagers == 40 * cost` holds only if all 40 villagers are paid by the horizon. Say "default horizon (an input), and assert every produce unit has been paid, for example the villager series ends at 40", so a slower engine fails loudly rather than as a bare mismatch.
- Item 3 and the acceptance bullet both name `finalCount`, a helper that does not exist at base. This is acceptable because the ticket says to re-add or write it locally; the criterion text could say "an independent per-`baseId` sum helper" instead of the name.
- Item 5's `idleVillagers` and `at` checks assume the deleted run's depletions (sheep, gold) still occur at 3600 s; the stated precondition (a depletion exists) covers this.
- No overlap with open tickets in TASK-GRAPH (SGS-149, 150, 153 do not touch these specs). Invariant A3 listed, no contradiction. Unverified assumptions `none` and On merge `none` are right. No docs affected.
