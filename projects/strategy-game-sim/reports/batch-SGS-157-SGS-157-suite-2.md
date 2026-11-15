# Suite report: batch SGS-157-SGS-157 (run 2)

**Verdict: PASS**

- Branch: `sgs-157-buildings-chart-overlap`
- Tip SHA: `2ab6c10925a781909380971573dc573e485423a4`
- Base: main (origin/main 8f01a8c; fork point e50e074)
- Scratch checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-157-SGS-157` (removed after this report)

## Command run

`commands.unit` = `npm test` (Vitest, `vitest run`), run through run.sh with `commands.shellSetup`.

Log: `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/c1f9d419-d832-43d1-8046-6069bc319b23/scratchpad/unit-suite.log`

Summary line:

```
Test Files  83 passed | 1 skipped (84)
Tests       2568 passed | 15 skipped (2583)
```

Exit code 0. No failures.

`commands.acceptanceSetup` was not run: the unit suite is Vitest and needs only node_modules. node_modules was linked with `bin/link-node-modules.sh` (the same step `build` and `acceptanceSetup` use). `commands.codegen` is empty, so it was not run. `commands.acceptance` (Playwright) was not run; it is outside the suite gate's command list.

## Git status after the run

`git status --porcelain` is empty. The tree is clean at the tip SHA.

## Environment

- Declared: `engines.node` = `24.x` in `package.json` (`.nvmrc` and `.node-version` absent).
- Installed (via run.sh with `commands.shellSetup`): Node v24.22.2. Matches the declared major.
- No runtime version mismatch.

## Failures

None.

## Scratch cleanup

`checkout.sh remove` run after this report is written (see the handback for its result).
