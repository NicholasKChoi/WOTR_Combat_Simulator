# SGS-146 implementer 1

Status: needs_review
Branch: sgs-146-chart-reorder-same-render (from origin/main 41b3ed3, no upstream configured: .git/config is read-only in the sandbox)
Tip: 16cbce6cea557f25643334ba226291738027b02e
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-146-chart-reorder-same-render

## Files
- components/apps/aoe4-build-order/chart-layout.ts: new pure `moveChartByKey(layout, id, direction)` returning `{ layout, toIndex } | null` (null at either edge).
- components/apps/aoe4-build-order/use-chart-layout.ts: hook keeps `latest` ref updated synchronously in `apply`; `move` reads it, returns the resulting index or null; `moveTo` and `toggle` also apply against it. `move` type is now `number | null`.
- components/apps/aoe4-build-order/use-chart-drag.ts: returns `sessionActive()` (reads the session ref).
- components/apps/aoe4-build-order/results.tsx: `moveByKey` returns early while a drag session is active, otherwise uses `move`'s returned position for focus and status; `placeChart` replaced by `announceMove` (status is set outside any updater).
- components/apps/aoe4-build-order/chart-layout.test.ts: `moveChartByKey` tests.
- acceptance/aoe4-chart-layout.spec.ts: new mid-drag key test.
- docs/aoe4-build-order.md: chart controls paragraph.

## Tests
- `chart-layout.test.ts`: 44 pass. Full `npm test`: 2508 passed, 15 skipped, 81 files passed, 1 skipped.
- Invariants: a second move is applied to the first move's result and reports the post-both position; the edge check (including as the second of a pair) returns null; edge null at both ends.
- Acceptance (run once, spec file `acceptance/aoe4-chart-layout.spec.ts`): 26 passed, including the new test (ArrowDown before and after crossing 4px, order and status unchanged; drop gives [RATES, GATHERED, UNITS, FLOATING] with status naming position 3; ArrowUp afterwards reorders again).
- Pre-existing tests edited: none.

## Mutation checks
- chart-layout.ts `toIndex >= layout.order.length` -> `>`: failed `moveChartByKey > returns null for down at the end`. Undone.
- chart-layout.ts returned `toIndex` off by one: failed `applies a second move to the layout the first one produced and reports its position`. Undone.
- results.tsx `if (drag.sessionActive()) return` removed (equivalent to base behavior): acceptance `arrow keys pressed while the pointer is held...` failed at the first `expectLayout(DEFAULT_ORDER)` assertion (order changed by the key). Undone.
- Bug gate: the base behavior was reproduced by removing the guard in the fixed tree, not by a detached worktree at origin/main; the unit tests target a new helper that does not exist at the base.
- Wiring caveat: no jsdom, so the unit test cannot prove `Results`/the hook use `latest` and `moveChartByKey`; review should confirm by reading `use-chart-layout.ts` `move` and `results.tsx` `moveByKey`.

## Doc claims
- docs/aoe4-build-order.md: "other keys do nothing, and the arrow keys do nothing while a pointer drag is in progress (from pointer down until it ends)": `results.tsx` `moveByKey` returns when `useChartDrag().sessionActive()` is true; the session ref is set in `start` and cleared in `finish` (drop, Escape, cancel, lost capture). Verified by the acceptance test.
- No comments added.

## Pinned outputs
None.

## Results
- codegen: none set. `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones. `npx next build`: succeeded.
- toggle and moveTo callers: `aoe4-build-order.tsx:438` toggles the key results panel and reads `collapsed` for display only; no other render-time layout decisions. Both now apply against the ref anyway.

## Invariants
A1-A3 are engine/data only; not touched.

## Unverified assumptions added
None. Pointer capture and focus on pointer down are exercised in real Chromium by the acceptance test.

## Out-of-scope findings
- `git worktree add -b` with `origin/main` fails to write upstream config in the sandbox and leaves the branch created without the worktree; re-run `git worktree add <path> <branch>` works.
