# SGS-146 review 1

Verdict: APPROVE. Tip reviewed: 16cbce6c (base origin/main). Read in the task worktree; I did not create a review worktree.

## Blocking findings
None.

## Wiring confirmation (the implementer's request)
- `use-chart-layout.ts`: `latest` is a ref that `apply` sets synchronously before `setState`, and the load effect sets it too. `move` calls `moveChartByKey(latest.current, ...)`. It returns null without applying when the move is at an edge, and otherwise applies the result and returns `toIndex`. `moveTo` and `toggle` also read `latest.current`. Two same-render calls therefore compose and the second reports its post-both position.
- `results.tsx` `moveByKey`: returns early when `drag.sessionActive()`, otherwise calls `move(id, direction)`. It announces and sets focus only when the result is not null, using that returned index. The old render-time `layout.order.indexOf` and bounds check are gone.
- `use-chart-drag.ts` `sessionActive()` reads `session.current !== null`, the same ref set by `start` and cleared by `finish`.
- The drag drop callback calls `moveTo` then `announceMove`. `layout.order.length` in the status text is constant across moves, so it cannot be stale.

## Acceptance criteria
1. Two same-render moves compose, and the second's status names the post-both position: pass. The helper test `applies a second move to the layout the first one produced...` asserts toIndex 2 and the order. The wiring is confirmed above.
2. Edge no-op, including as the second of a pair: pass. `returns null when the second of two moves would pass the end` plus the `it.each` edge cases. `move` returns null, so `moveByKey` announces nothing. Default order is [units, rates, gathered, floating], so the test's setup is valid.
3. Arrow key mid-drag does nothing before or after 4px, and the drop lands by pointer height: pass. The acceptance test presses the key at both stages, asserts order and empty status, then drops and asserts the order and the "position 3" status. Removing the guard reproduces the base behavior (the implementer's mutation record). I did not run it, per the rules.
4. Arrow keys reorder again after the drag ends: pass. The test ends with ArrowUp after the drop and checks the new order.
5. A single arrow press still reorders, focuses and announces: pass by reading. `announceMove` sets `focusAfterMove` and the status. Existing acceptance tests cover it, but I did not run them.
6. Doc updated: pass. No doc claim says arrow keys reorder during a drag.
7. INVARIANTS: A1-A3 are engine and data only, not touched. Holds.

Bug gate: the regression test names the bug at the helper level and the mutations were recorded. The base was not run in a separate worktree, but the helper does not exist at the base, so that is acceptable. The acceptance test targets the guard, and the recorded mutation failed on the first order assertion.

## Checks
- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones. `git status` stayed clean.
- No `reviewBot` configured. Skipped.
- UI inspection: not run. The diff changes no markup or styles, only handler logic.
- Pre-existing tests edited: none. Shipped-artifact hygiene is clean: no ticket ids in code or docs, no comments added.
- Style: `moveChartByKey` sits beside `moveChart`, and its test uses the same `it.each` table style as the file's other tests.

## Non-blocking notes
- `docs/aoe4-build-order.md:1018` now has a very long line. The neighbouring lines wrap at about 130 characters, so wrap it for consistency.
- `moveChartByKey` computes `toIndex` before the `includes` check. This is harmless because a missing id returns null.

## Coverage
Reviewed all 7 changed files. Not reviewed: no acceptance, browser or full unit run (the gate does not run them).
