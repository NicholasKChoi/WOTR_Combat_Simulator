# SGS-147 implementer 2 (rework)

Ticket SGS-147, branch sgs-147-browser-storage-edge-cases, tip 6bb1297929e6cb1f735d8be7143b0655af9e5856, worktree $FACTORY_DIR/worktrees/sgs-147-browser-storage-edge-cases.

## Files touched
- acceptance/aoe4-my-builds.spec.ts: the two-tab test "another tab changing an unrelated key..." now removes the My builds key in the first tab (no storage event fires there) and asserts the list still shows both builds. It registers a storage-event recorder in the first tab, and waits with `expect.poll(...).toContain('unrelated-key')` instead of the 300 ms timeout. It then asserts the list is still `[NEWER.name, OLDER.name]`. The clear() half is unchanged.

Recorder uses toContain because the page's own probe key also emits events when the other tab opens.

## Tests
- `npx playwright test acceptance/aoe4-my-builds.spec.ts -g 'unrelated key'`: 1 passed (harness change, run once per this ticket's rework).

## Mutation check
- pages/apps/aoe4-build-order.tsx reread listener: guard loosened to `if (storage === null) return`. The test failed at the `toHaveText([NEWER.name, OLDER.name])` after the unrelated-key poll (list emptied). Restored with `git checkout`; tree clean.

## Lint
`npx tsc --noEmit && npm run lint:dup`: clean. Codegen and build not set or unchanged (test-only change).

## Doc claims
None added. No pre-existing tests edited beyond this one.

## Invariants
No production code touched.

## Out-of-scope findings
None. Unverified assumptions added: none.

Status: needs_review
