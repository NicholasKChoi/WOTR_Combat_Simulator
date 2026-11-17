# Suite report: batch SGS-202-SGS-202 (suite-1)

## Verdict: PASS

- Command run: `npm test` (`commands.unit`, Vitest `vitest run`), full suite, through `run.sh`.
- Summary line: `Test Files  91 passed | 1 skipped (92)`, `Tests  2863 passed | 15 skipped (2878)`. Exit 0.
- Branch: `sgs-202-house-demand-held-order`, tip `c25d26efa3738f44bbc01fe80539a6945bfddebf` (base `main`).
- Scratch checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-202-SGS-202`.
- Unit log: `$TMPDIR/suite-batch-SGS-202-SGS-202.unit.log` (`/tmp/claude-1000/suite-batch-SGS-202-SGS-202.unit.log`).
- Setup log: `/tmp/claude-1000/suite-batch-SGS-202-SGS-202.setup.log`.
- Post-run `git status --porcelain`: empty (clean tree).

## Steps

1. Scratch checkout created at `c25d26e` with top branch `sgs-202-house-demand-held-order` listed. Exit 0.
2. Runtime: `node -v` = v24.22.2, `npm -v` = 11.19.1 (through `run.sh`, after `commands.shellSetup`). Declared `engines.node` = `24.x` in `package.json`; `.nvmrc` and `.node-version` are not present. Match.
3. `commands.acceptanceSetup` run: `link-node-modules.sh` (linked node_modules from nm-cache) then `npm run acceptance:setup` (`playwright install chromium`). Exit 0. `commands.codegen` is empty, so skipped.
4. `commands.unit` run in full. Exit 0. Log written under `$TMPDIR`, not under worktreeRoot or the checkout.
5. `git status --porcelain` in the scratch checkout: clean.

## Failures

None.

## Environment

- Node v24.22.2 vs declared `24.x`: match. No mismatch.
- Skipped tests: 1 file skipped and 15 tests skipped in the run (vitest reports them as skipped, not failed). Not investigated; the verdict is from the exit code and the summary line.
- No scratchpad directory was provided in the environment, so `$TMPDIR` was used for logs.

## Cleanup

Scratch removal: see the result line in the run output below (`checkout.sh remove`).
