# Suite report: batch SGS-171-SGS-171 (suite-1)

## Verdict: PASS

- Command: `npm test` (commands.unit, `vitest run`), run through run.sh.
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2609 passed | 15 skipped (2624)`. Exit 0.
- Branch: `sgs-171-split-aoe4-build-order-doc`
- Tip SHA: `124dc82cec45123fcd2ad9ab58d98fdea5aad4d9`
- Log: `/tmp/claude-1000/suite-SGS-171-SGS-171/suite-SGS-171-SGS-171.unit.log`
- Codegen: not set (`commands.codegen` is empty), not run.
- Acceptance: not run (not needed for the unit suite).
- Tree after run: `git status --porcelain` empty. No dirty tree.

## Failures

None.

## Environment

- Runtime: Node v24.22.2, npm 11.19.1 (installed, through `commands.shellSetup`).
- Declared: `package.json` `engines.node` = `24.x`. No `.nvmrc`, `.node-version`, `.python-version`, or `.tool-versions`. Match, no mismatch.
- Setup: the scratch checkout had no `node_modules`. Linked it with `bash /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/bin/link-node-modules.sh .` through run.sh. This is the first step of `commands.acceptanceSetup`. I skipped the rest of that command (`npm run acceptance:setup`, the Chromium install), because the unit suite does not need it.
- Informational: the run skipped 1 test file and 15 tests. Not a failure; the verdict is from the full command.
- Scratch checkout `suite-SGS-171-SGS-171` removed after this report was written (see handback for the remove result).
