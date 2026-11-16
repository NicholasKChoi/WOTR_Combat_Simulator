# SGS-183 implementer report 2 (re-spec 2 pass)

- Ticket: SGS-183, branch `sgs-183-tabs-layout-cases-to-default-viewport`, tip `271f0682233f9df2d4e4c3dda9e2886138447c73` (on top of bfe505d).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-183-tabs-layout-cases-to-default-viewport`
- Own-commit check: skipped (no `origin/<branch>` ref); tip unchanged by checkout.sh (bfe505d).

## Files touched
- `acceptance/aoe4-chart-layout.spec.ts`: the two first/last-chart arrow-key cases (ArrowUp on first, ArrowDown on last). The handle is aligned with `scrollIntoView({ block: 'start' })`. A `readScroll` reads `results-column` `scrollTop`, its scroll extent and `window.scrollY`. Before the key it asserts `0 < scrollTop < extent`. After it, it asserts `scrollTop` and `window.scrollY` equal the before values. The rest of the case (order, empty status, focus, nothing stored) is unchanged. Titles unchanged.

Nothing else changed from bfe505d.

## Tests
- Two target cases: 2/2 pass.
- All eleven listed spec files: 100 passed, 0 failed (full run after the edit).
- `npx tsc --noEmit` clean; `npm run lint:dup`: 0 clones. `npm test` not run (no non-acceptance code changed).
- Pre-existing tests edited: only the two named cases above, as allowed by Re-spec 2.

## Mutation check
- Break: removed `event.preventDefault()` (replaced by `void 0`) at `components/apps/aoe4-build-order/chart-header.tsx:43`.
- Result: both cases failed at `expect(after.top).toBe(before.top)` (`acceptance/aoe4-chart-layout.spec.ts:177`). ArrowUp on first: expected 224, received 184. ArrowDown on last: expected 1914, received 1932.
- Undone with `git checkout components`; the tree was clean apart from the spec before commit, and the commit holds only the spec.

## Doc claims
None added.

## Invariants
Upheld: spec-only change, no `lib/` or `components/` file in the diff.

## Unverified assumptions added
None.

## Out-of-scope findings
None.

## Status
needs_review
