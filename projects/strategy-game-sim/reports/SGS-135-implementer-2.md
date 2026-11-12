# SGS-135 implementer 2 (rework pass 1)

Ticket SGS-135, branch `sgs-135-chart-header-drag-handle-and-caret`, tip `4b0b5a8`, worktree `$FACTORY_DIR/worktrees/sgs-135-chart-header-drag-handle-and-caret`.

## Files touched
- `acceptance/aoe4-chart-layout.spec.ts`: the no-scroll test is now a two-row table, `[UNITS, ArrowUp]` and `[FLOATING, ArrowDown]`. Each row instant-scrolls the handle to mid-viewport, focuses it, asserts `0 < scrollY < max`, presses the key, waits 500 ms, then asserts scrollY unchanged, default order, empty status, focus on that handle, nothing stored.
- `components/apps/aoe4-build-order/chart-header.tsx`: className is `cn(styles.dragHandle, 'btn btn-sm btn-outline-secondary')`, with `import cn from 'classnames'`.

## Tests
- Both new rows pass (2 passed) with the fix in place.
- `npm test` passed in the chain (the output tail did not show counts).
- Invariant encoded: a handled arrow key on a handle must not scroll the page.

## Pre-existing tests edited
- `aoe4-chart-layout.spec.ts`, the previous single no-scroll test, replaced as the review required. No assertion of other tests changed.

## Doc claims
None added or changed.

## Pinned outputs
None.

## Mutation check
- Break: replaced `event.preventDefault()` at `chart-header.tsx:42` with a comment.
- Both rows failed at `aoe4-chart-layout.spec.ts:174` (`expect(scrollY).toBe(before.y)`): Units row expected 412, received 372; Floating row expected 2052, received 2092.
- Break undone; `git diff` shows only the cn change in that file.

## Codegen, build, lint
- `npx tsc --noEmit` and `npm run lint:dup`: pass.
- `npm test`: pass.
- `npx next build`: success.
- No codegen configured.
- The acceptance spec was run only for the no-scroll tests (`-g 'does not scroll the page'`), because the harness-test rule allows one run.

## Invariants
Unchanged; the diff touches only a className expression and an acceptance test.

## Unverified assumptions added
None.

## Out-of-scope findings
Non-blocking notes 1 to 5 from the review are untouched, as instructed.

## Status
`needs_review`
