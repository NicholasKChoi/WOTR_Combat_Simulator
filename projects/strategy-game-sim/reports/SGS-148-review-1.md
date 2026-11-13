# SGS-148 review 1

Verdict: APPROVE (tip f56d939, base origin/main)

## Blocking findings
None.

## Acceptance criteria
1. Current series keyed `pinned:x` hidden only by exact key: pass. `isLineHidden` is `hidden.has(seriesKey)`; new test asserts `Set(['pinned:x'])` hides `pinned:x` and `Set(['x'])` does not. Implementer's record shows it failing on the stripping implementation at the `toBe(true)` assertion.
2. Plain key `a` hides both lines of a, not b: pass. Both Line elements in line-chart.tsx (lines 162, 177) pass `s.key`. The test asserts `a` true and `b` false.
3. `pinned:`-prefixed hidden entry does not hide the pinned line: pass. Test `Set([pinnedKey('a')])` with `'a'` gives false.
4. `pinnedLegendShown`: pass. It passes `s.key`; chart-legend.test.ts is unchanged.
5. Pre-existing assertions kept: pass. Only call shapes changed, plus one rename, allowed by scope bullet 3.
6. tsc: pass. I ran `npx tsc --noEmit && npm run lint:dup` in the worktree; no errors, 0 clones.
7. Invariants: none apply (ticket says none).

## Contract, scope, conventions
- `pinnedKey`, `PINNED_PREFIX`, and `toChartRows` are untouched. The row-key collision is left alone as out of scope.
- The unused `pinnedKey` import was removed from chart-legend.tsx; line-chart.tsx still uses it for the row key, so its import stays.
- No comments or docs added. No dead flag parameter.
- The one remaining edge is that the callers' choice of `s.key` is not asserted directly, since the Line elements are not unit-tested. This is non-blocking, and acceptance owns it.

## Bot
No reviewBot configured.

## Coverage
Reviewed the full diff (4 files) and the callers in the worktree. Ran lint only; ran no tests and no UI inspection (the change has no visual effect).
