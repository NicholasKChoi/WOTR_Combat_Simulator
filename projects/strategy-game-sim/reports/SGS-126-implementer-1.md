# SGS-126 implementer report 1

- Ticket: SGS-126. Branch: sgs-126-pin-compare-fixture. Tip: b7b1e78149a76b88b6aae13af472a9249ce0d7d7 (base 086951e).
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-126-pin-compare-fixture
- Status: needs_review

## Files touched
- acceptance/aoe4-build-order-pin-compare.spec.ts: test "a series only the pinned run has gets one dashed legend item that hides its dashed line" only. Replaced `runOk(page,{duration:300})` with `expect(build-order-text).toHaveValue(DEFAULT_PASTE)`, then `pin(page)`, then `runOk(page,{text: NO_MILITARY_PASTE})` (no duration change; default is 1200). Everything after the precondition is unchanged.

## Tests
- Full spec `acceptance/aoe4-build-order-pin-compare.spec.ts`: 39 passed, 0 failed (includes the target test).
- Invariants: pinned-only series is listed once, dashed swatch, colour equals pinned line stroke, hides with its item.
- Pre-existing tests edited: only the target test (named above).

## Mutation checks (chart-rows.ts, each reverted with git checkout; not committed)
1. line 77 `lines: 'pinned'` -> `'both'`: fails at spec line 164 `toHaveCSS('border-top-style','dashed')`, received "solid".
2. `isLineHidden` returns false for `pinned:` keys: fails at the final `toHaveCount(0)` on `path[data-series="pinned:spearman-2"]`, received 1.
3. `legendItems` returns `pinnedOnly.slice(0, 0)`: fails at the precondition `expect(only.length).toBeGreaterThan(0)` (received 0).

## Doc claims
None added (no comments or docs).

## Pinned outputs
None. (Observed: the pinned-only key was `spearman-2`.)

## Codegen/build/lint
- codegen: not set. `npx tsc --noEmit` clean; `npm run lint:dup` 0 clones. `next build` and full unit suite not run (test-only change to one acceptance spec, no source change).

## Invariant check
No INVARIANTS touched; only the spec changed (`git diff --stat 086951e HEAD`: 1 file, 2+/2-).

## Notes
- The first `git worktree add -b` created the branch but failed to create the worktree; I re-added the worktree on the existing branch (at origin/main 086951e then).
- origin/main has since moved to 14639c0 (chart collapse/reorder, #126); the branch is based on 086951e and was not rebased. The chart reorder may affect the `chart-units-produced` test ids; re-verify after rebase.

## Out-of-scope findings
None.
