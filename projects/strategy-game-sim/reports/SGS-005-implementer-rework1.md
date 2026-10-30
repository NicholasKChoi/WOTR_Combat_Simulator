# SGS-005 implementer, rework 1

- Ticket: SGS-005 (rework pass 1)
- Branch: sgs-005-n-battle-outcome-frequencies
- Tip: 1414c28bcc768af025a4a7783bea100b5db50a66 (previous 6525ab0), author choinickolas@gmail.com
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-005-n-battle-outcome-frequencies

## Required fixes
- [x] Deleted the false comment above `nearestRank` in `lib/combat-simulator/simulate.ts`. No code change.
- [x] Renamed the N = 30 test in `lib/combat-simulator/simulate.test.ts` to "gives p10 3, median 15 and p90 27 for N = 30". Assertions unchanged.
- [x] Nothing else changed (diff: 1 line deleted, 1 line renamed).

## Files touched
- lib/combat-simulator/simulate.ts: removed one comment line.
- lib/combat-simulator/simulate.test.ts: renamed one test.

## Checks
- codegen: not set in REPO.md.
- lint (`npx tsc --noEmit`): pass, exit 0.
- build (`npx next build`): pass (node_modules already installed; `npm ci` not rerun).
- unit (`npm test`): 4 files, 57 tests passed, 0 failed (simulate.test.ts 24).
- Acceptance not run (owned by the acceptance gate).

## Invariant check
No behavior change; W1, W2, S3 as at 6525ab0.

## Out-of-scope findings
None.

## Status
needs_review
