# SGS-148 implementer 1

Status: needs_review
Branch: sgs-148-islinehidden-pinned-prefix, tip f56d93923687e94254f7a34a64f305ef6bc8e888 (base origin/main 41b3ed3)
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-148-islinehidden-pinned-prefix

## Files
- components/apps/aoe4-build-order/chart-rows.ts: `isLineHidden(hidden, seriesKey)` is now `hidden.has(seriesKey)`; no prefix inspection. `pinnedKey`, `PINNED_PREFIX`, `toChartRows` untouched.
- components/apps/aoe4-build-order/line-chart.tsx: the pinned Line passes `s.key` instead of `pinnedKey(s.key)`.
- components/apps/aoe4-build-order/chart-legend.tsx: `pinnedLegendShown` passes `s.key`; unused `pinnedKey` import removed.
- components/apps/aoe4-build-order/chart-rows.test.ts: `isLineHidden` calls moved to the plain-key signature; one new test.

Signature choice: both line kinds map to the same hidden entry (the plain series key), so no line-kind flag is needed; an unused flag would be dead.

## Tests
- Full `npm test`: 2505 passed, 15 skipped, 0 failed. aoe4-build-order folder: 781 passed.
- Invariants encoded: a series whose key starts with `pinned:` is hidden only when that exact key is in the set (new test); plain key `a` hides series a, not b; a `pinned:a` entry hides nothing for series `a`; pinned-only series `z` hides by `z`.

## Pre-existing tests edited
chart-rows.test.ts `isLineHidden` describe: the two-element array assertions in "hides a series line and its pinned line together" became single-call assertions (test renamed "hides a series by its plain key, which covers both its current and pinned lines"), and the other calls drop `pinnedKey(...)` around the argument. Assertion values unchanged. Allowed by the ticket's scope bullet 3 (calls change shape only). chart-legend.test.ts unchanged and passing.

## Doc claims
None added; no comments added.

## Bug regression
The new test "hides a series whose own key starts with the pinned prefix only when that exact key is hidden" calls `isLineHidden(new Set(['pinned:x']), 'pinned:x')`; the signature is source-compatible with base, so the same call was run against the prefix-stripping implementation (restored in the worktree, not a separate detached worktree). Failed with `AssertionError: expected false to be true` on the `toBe(true)` line. At base, the old stripping code yields `has('x')`, false.

## Mutation checks
Re-introduced `seriesKey.startsWith(PINNED_PREFIX) ? slice : seriesKey` in chart-rows.ts `isLineHidden`: the new test failed with the assertion above (1 failed, 29 passed). Reverted; the fix was re-applied and the final tree committed clean. The other edited tests are signature rewrites of existing tests and were not re-mutated.

## Gates
- codegen: not set. `npx tsc --noEmit` + `npm run lint:dup`: pass. `npx next build`: pass.
- Not run: acceptance (owned by a separate gate).

## Invariants
No ticket invariants; none touched. Out of scope row key collision left untouched.

## Unverified assumptions added
None.

## Out-of-scope findings
None. Note: `git worktree prune` reported busy deletes on stale worktree metadata for older tickets (deferred cleanup, not mine).
