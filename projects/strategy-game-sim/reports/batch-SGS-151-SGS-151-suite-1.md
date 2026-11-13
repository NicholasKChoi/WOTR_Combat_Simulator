# Suite report: batch SGS-151 (shared Blob test fake)

## Verdict: PASS

- Branch: `sgs-151-shared-blob-test-fake`
- Ticket tip: `b2aaf34` (base `f55e0aa`)
- Suite run on: `07bf2a6` (`b2aaf34` rebased onto `origin/main` 5371c25; rebase was clean, no conflicts)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-151` (detached, removed after this report)

### Command: `commands.unit` (`npm test`, run via run.sh)

- Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/batch-SGS-151-SGS-151-suite-1.unit.log`
- Exit 0.
- Summary: `Test Files  83 passed | 1 skipped (84)`, `Tests  2552 passed | 15 skipped (2567)`.
- The skipped file is `lib/aoe4-build-order/blob-build-store.live.test.ts`, gated off as usual. `npm run test:blob-live` was not run, per instructions.

### Extra gate from the ticket: `npx tsc --noEmit && npm run lint:dup`

- Exit 0. jscpd reports 0 clones for both the main config (158 files) and the tests config.

### Tree and scope

- `git status --porcelain` is empty after the run. No codegen is configured, so no codegen step ran.
- Diff against `origin/main` touches only test and test-support files: `blob-build-store.test.ts`, `blob-fake-test-helpers.ts` (new), `blob-fake-test-helpers.test.ts` (new), `blob-lost-writes.acceptance.test.ts`, `named-build-store.acceptance.test.ts`. No production file changed.

## Environment

- Declared runtime: `engines.node` `24.x` in `package.json`. No `.nvmrc` or `.node-version`.
- Installed through run.sh: Node `v24.22.2`, npm `11.19.1`. Matches the declaration; no mismatch.
- Dependencies: `bash /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/bin/link-node-modules.sh .` (the link step of `commands.acceptanceSetup`, run through run.sh). Linked from the nm-cache, 205 entries.
- The Playwright Chromium install half of `commands.acceptanceSetup` was not run. The unit suite does not need it.

## Failures

None.
