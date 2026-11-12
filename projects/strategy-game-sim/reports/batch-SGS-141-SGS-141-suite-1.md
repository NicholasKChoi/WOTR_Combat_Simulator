# CI-parity suite: batch SGS-141

**Verdict: PASS**

- Ticket: SGS-141 (split tab order spec and final docs pass)
- Stack: origin/main (90b909e) <- sgs-141-split-tab-order-spec-and-final-docs-pass
- Top-of-stack SHA tested: 373c4d6 ("Pin the split layout's Tab order and document it")
- Command: `npm test` (REPO.md `commands.unit`, Vitest `vitest run`), run through run.sh in a detached worktree at 373c4d6
- Full log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/batch-SGS-141-SGS-141-suite-1.unit.log`

Summary line: `Test Files  81 passed | 1 skipped (82)`, `Tests  2504 passed | 15 skipped (2519)`, exit clean.

Skipped file: `lib/aoe4-build-order/blob-build-store.live.test.ts` is gated by `describe.skipIf(process.env.BLOB_LIVE !== '1')`. It skips by design without the live Blob store, so it is not a failure.

Acceptance (Playwright) was not run, because the unit command does not need it and REPO.md assigns acceptance runs to the acceptance-test role.

## Failures

None.

## Environment

- Runtime: Node v24.22.2 installed. `engines.node` is `24.x` in `package.json` and REPO.md `shellSetup` is `nvm use 24`. Match, no mismatch.
- Setup: `bin/link-node-modules.sh` linked node_modules from the lockfile-hash cache (`nm-cache/d57d0fdd0e531d4b`). `acceptanceSetup` was not run because the Vitest include list excludes `acceptance/**` and needs no Chromium.
- `commands.codegen` is empty, so no codegen step ran.
- `git status --porcelain` in the suite worktree after the run: clean, no output.

## Cleanup

Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-141`. Removal and prune are performed after this report is written.
