# SGS-135 review 2

- Branch `sgs-135-chart-header-drag-handle-and-caret`, tip `4b0b5a8`, base `5e5bd8e`.
- Delta re-review of `d906392..4b0b5a8` after rework pass 1, which answered review 1's two required fixes.
- Verdict: **APPROVE**

## Blocking findings

None.

## Required fixes from review 1

1. No-scroll test (`acceptance/aoe4-chart-layout.spec.ts:163-180`): **landed as directed.**
   - It is now a two-row loop, `[UNITS, 'ArrowUp']` and `[FLOATING, 'ArrowDown']`. Each row:
     - instant-scrolls the handle to the centre of the viewport, then focuses it;
     - reads `scrollY` and the maximum scroll in one evaluate and asserts `0 < y < max`;
     - presses the key, waits 500 ms, then asserts `scrollY` is unchanged, the order is the default, the status is `''`, focus is on that handle and nothing is stored.
   - Other acceptance specs here write their tables as `for (const [...] of [...])` loops (`aoe4-simulate-api-edges.spec.ts:204`, `aoe4-named-builds-api.spec.ts:109`), so the loop matches the house style.
   - I checked that the test can fail. I did not run the spec. In my own review worktree, on port 3787 at 1024x768, a scratch script repeated the test's exact steps (`scratchpad/r2-noscroll.cjs`):

     | Code | Row | `scrollY` before | 500 ms after the key | 1.5 s after the key |
     |---|---|---|---|---|
     | Unmodified | Units, ArrowUp | 412 (max 2198) | 412 | 412 |
     | Unmodified | Floating, ArrowDown | 2052 (max 2198) | 2052 | 2052 |
     | `event.preventDefault()` removed (`chart-header.tsx:43`) | Units, ArrowUp | 412 | 372 | 372 |
     | `event.preventDefault()` removed (`chart-header.tsx:43`) | Floating, ArrowDown | 2052 | 2092 | 2092 |

   - So the test fails on that mutation. The scroll has already settled at 500 ms, so the wait is long enough. These numbers match the implementer's mutation report (412→372, 2052→2092). I reverted the mutation afterwards.
2. `components/apps/aoe4-build-order/chart-header.tsx:34`: **landed verbatim.**
   - The line is now `cn(styles.dragHandle, 'btn btn-sm btn-outline-secondary')`, with `import cn from 'classnames'`.
   - The import matches `chart-legend.tsx:1` and `message-lists.tsx:1`.
   - Nothing else in the file changed.

## Regression check on the delta

- The delta changes two files: the spec, where only this test changed, and `chart-header.tsx`, where only the className and its import changed.
- No other test was deleted or weakened. Review 1 already checked every other test on the branch against the Bar.
- Test names: `ArrowUp on the first chart ...` and `ArrowDown on the last chart ...`. Each name states the checks its assertions make.
- `npx tsc --noEmit` and `npm run lint:dup` (0 clones) pass on `4b0b5a8` in my worktree.

## Spec gaps

None.

## Acceptance criteria

All criteria are unchanged from review 1 except the one below.

| Criterion | Verdict | Evidence |
|---|---|---|
| Keyboard reorder Playwright, including "the page does not scroll" | pass | See required fix 1 above: the precondition is asserted and the test fails when `preventDefault` is removed. |
| All other criteria | pass (per review 1) | The delta does not touch them. |

## Invariants touched

- The delta changes only a className and one acceptance test, and no invariant is affected.
- S1 holds: the only new import is `classnames`, a dependency the repo already uses.

## Bot reconciliation

REPO.md has no `reviewBot.cli` and no rulesFile, so there is nothing to reconcile.

## Non-blocking notes

1. `acceptance/helpers.ts:236` has `settledScrollY`, which reads after two frames. The test uses a fixed `waitForTimeout(500)` instead, as review 1 told it to, and the measurement shows 500 ms is enough. Note only.

Review 1's notes 1-5 still stand and are not repeated here.

## UI inspection

- No UI changes in the delta: the className resolves to the same class list. I did not run the full inspection.
- I did serve the review worktree, on port 3787, for the mutation check above. The server is stopped and `serve.sh status 3787` reports `stopped`.

## Coverage

- Reviewed `git diff d906392..4b0b5a8` (2 files) and checked that no other test file changed in the delta.
- Not run:
  - acceptance specs (review runs none);
  - `npm test` and `next build`. The delta has no unit or build impact beyond the className expression, which tsc covers.
