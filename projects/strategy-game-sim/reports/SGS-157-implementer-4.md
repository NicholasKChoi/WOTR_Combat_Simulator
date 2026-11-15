# SGS-157 implementer 4 (Rework 2)

- Ticket: SGS-157, Rework 2 (tech-lead), both Required-fixes boxes ticked.
- Branch: sgs-157-buildings-chart-overlap
- Tip: 134c9a9b84a1ba71591f95b16a6223a69529c0ea (parent 57d342a; no rebase)
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-157-buildings-chart-overlap (reused with checkout.sh task)

## Files touched
- `components/apps/aoe4-build-order/chart-rows.ts`: in `toOffsetChartRows`'s `lift`, a non-number value (undefined, null) is copied through unchanged instead of becoming `value + offset`.
- `components/apps/aoe4-build-order/chart-rows.test.ts`: one `it.each` in `describe('toOffsetChartRows')` with two rows asserting a missing current value stays `undefined` at t=15.

## Important: the tech-lead's trigger does not reproduce at 57d342a
The second fix says the test "fails on tip 57d342a with NaN" when the pinned run's times go past the current run's. It does not fail.
`toChartRows` (pinned branch, `fill`) never writes current keys into rows at pinned-only times. The key is absent, not set to `undefined`, as the existing test 'uses the union of times and leaves absent keys out...' already asserts with `'a' in rows[3]` false. Because `lift` loops over `Object.entries(row)`, it never sees an absent key, so it cannot make it NaN.
I ran the ticket's exact case (current times [0,5,10], pinned times [0,5,10,15]) against the 57d342a code, before and after the fix. In both, `rows[3].b` is `undefined`.
NaN only appears when a current key is present with an `undefined` value, which happens when a series has fewer values than `times`. `buildingSeries` cannot produce that: `production-buildings.ts:24` builds `counts = samples.map(...)`, one per sample. So the user-visible "<building>: NaN" tooltip described in the tech-lead report should not happen with real data at 57d342a.
The guard is still correct and costs nothing, so I applied it as the ticket says. The test table holds:
1. the ticket's case (longer pinned run). It passes both with and without the guard and is kept because the ticket's acceptance criterion names it.
2. current series with fewer values than `times` (times [0,5,10,15], values of length 3). This is the case that fails without the guard.

## Tests
- `npx vitest run components/apps/aoe4-build-order/chart-rows.test.ts`: 46 passed.
- `npm test` (full unit suite): 83 files passed, 1 skipped; 2568 tests passed, 15 skipped, 0 failed.
- Invariant encoded: after the offset is applied, a missing current value stays missing (`undefined`), never NaN, so recharts' null filter still drops it from the tooltip.

## Mutation checks
- I reverted `chart-rows.ts:68` to `offset === undefined ? value : value + offset` (the 57d342a line).
  - The 'current series have fewer values than times' row failed with `AssertionError: expected NaN to be undefined` at `chart-rows.test.ts:251` (`expect(rows[3].b).toBeUndefined()`).
  - The 'current run ends before a longer pinned run' row still passed (see above: it cannot fail at 57d342a).
- I restored the guard and checked it with `git diff`. The committed code has the guard.

## Pre-existing tests edited
None.

## Doc claims
No docs changed. Comments: none added.

## Pinned outputs
None.

## Bug-ticket regression
Not re-run in this pass. The rework adds no new regression test against the base. Implementer-2/3 reports hold the base e50e074 evidence for the overlap.

## Codegen / build / lint
- codegen: not set in REPO.md.
- build (`link-node-modules.sh . && npx next build`): succeeded.
- lint (`npx tsc --noEmit && npm run lint:dup`): tsc clean, jscpd found 0 clones.
- `git status` was clean apart from the two intended files. Nothing was reverted.

## Invariant check
A1, A2, A3: touched but not affected. The change is display-only row building; no simulation or data change.

## Unverified assumptions added
None.

## Out-of-scope findings
- Tech-lead report `batch-SGS-157-SGS-157-tech-lead-1.md`, finding 1: the reproduction does not hold (see above). The manager may want to tell the owner (board Q99) that the "NaN" tooltip was not reachable with real Buildings data at 57d342a. The guard is now in place in any case.

## Processes
None started apart from foreground vitest, tsc and next build runs, which have all exited.

## Status
needs_review
