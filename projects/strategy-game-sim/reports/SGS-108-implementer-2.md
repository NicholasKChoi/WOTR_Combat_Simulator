# SGS-108 implementer 2 (rework 1)

- Branch sgs-108-step-run-cell, tip d964ace (previous d526ce3), worktree $FACTORY_DIR/worktrees/sgs-108-step-run-cell. Not pushed.

## Files
- docs/aoe4-build-order.md: replaced the clause after the comma with the exact required text.
- components/apps/aoe4-build-order/step-annotation.test.ts: third fixture step (`runStep:1, waitSeconds:59.9, longWait:false`, extra `build house` line in the parsed text); the long-wait test asserts that row has `data-run-step="1"` and no `data-long-wait`; added `expect(styles.stale).not.toBe('')`.

## Doc claim
"`results-last-good` carries `aria-describedby="auto-run-status"` only while it is dimmed and the status text is not empty, so it is absent while an edit to a current result waits the 500 ms to settle." (wording given verbatim by review).

## Tests
- step-annotation.test.ts 27 passed; `npm test` 1970 passed, 10 skipped; `tsc --noEmit` clean; `lint:dup` 0 clones. The repo has no lint or build script beyond these. Acceptance not re-run (no production code changed).

## Mutation checks (all undone, tree clean apart from the commit)
- step-table.tsx:328 `run?.longWait ?` to `run ?`: the long-wait test fails with "expected ' data-step="2" data-kind="building" d…' not to contain 'data-long-wait'".
- step-annotation.tsx:42 `stale && styles.stale` to `false && styles.stale`: 6 stale rows fail (for example "expected '' to be '_stale_a8c3d8'"). The new `styles.stale` non-empty assertion has no separate break: a missing `.stale` class makes the stale rows compare `''` to `''`, which only that assertion catches. I did not remove the CSS rule to verify it.

## Out-of-scope
Review notes N1 to N8 untouched.

Status: needs_review
